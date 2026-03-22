import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getFigureById, HistoricalFigure } from '@/lib/figures';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ConversationTurn {
  figureId: string;
  content: string;
}

function buildGroupChatPrompt(
  figures: HistoricalFigure[],
  topic: string,
  conversationHistory: ConversationTurn[],
  respondingFigure: HistoricalFigure
): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
  const otherFiguresNames = figures
    .filter(f => f.id !== respondingFigure.id)
    .map(f => f.name)
    .join(', ');

  const historyText = conversationHistory.length > 0
    ? '\n\nCONVERSATION SO FAR:\n' + conversationHistory.map(turn => {
        const figure = getFigureById(turn.figureId);
        return `${figure?.name || 'Moderator'}: ${turn.content}`;
      }).join('\n\n')
    : '';

  const systemPrompt = `${respondingFigure.systemPrompt}

GROUP CHAT CONTEXT:
You are in a group chat with these other historical figures: ${otherFiguresNames}.
The topic of discussion is: "${topic}"
${historyText}

INSTRUCTIONS FOR THIS RESPONSE:
- Respond as ${respondingFigure.name} would, staying completely in character
- React naturally to what others have said (if there's history)
- Be conversational and engage with other figures, not just lecture
- Reference other participants by name when responding to them
- Keep your response to 2-4 sentences
- If you're the first to speak, open the conversation in a way that reflects your personality and the topic`;

  const userPrompt = conversationHistory.length > 0 
    ? `Please continue the conversation as ${respondingFigure.name}. Respond to what was just said.`
    : `Please start the group chat discussion about "${topic}" as ${respondingFigure.name}. Be the first to speak.`;

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { figureIds, topic, conversationHistory = [], message } = body as {
      figureIds: string[];
      topic: string;
      conversationHistory: ConversationTurn[];
      message?: string;
    };

    if (!figureIds || figureIds.length === 0) {
      return NextResponse.json({ error: 'No figures selected' }, { status: 400 });
    }

    if (!topic && conversationHistory.length === 0) {
      return NextResponse.json({ error: 'Topic is required to start conversation' }, { status: 400 });
    }

    const figures = figureIds.map(id => getFigureById(id)).filter((f): f is HistoricalFigure => f !== undefined);

    if (figures.length === 0) {
      return NextResponse.json({ error: 'No valid figures found' }, { status: 400 });
    }

    // Determine which figure should respond
    let respondingFigure: HistoricalFigure;
    
    if (message) {
      // User sent a message - pick a random figure to respond
      respondingFigure = figures[Math.floor(Math.random() * figures.length)];
    } else {
      // Continue the conversation - figure who hasn't spoken much or next in rotation
      const lastSpeakerId = conversationHistory.length > 0 
        ? conversationHistory[conversationHistory.length - 1].figureId 
        : null;
      
      const availableFigures = figures.filter(f => f.id !== lastSpeakerId);
      respondingFigure = availableFigures.length > 0 
        ? availableFigures[Math.floor(Math.random() * availableFigures.length)]
        : figures[Math.floor(Math.random() * figures.length)];
    }

    // Build the prompt
    let updatedHistory = [...conversationHistory];
    
    // If there's a user message, add it to history temporarily
    if (message) {
      updatedHistory.push({
        figureId: 'moderator',
        content: `[MODERATOR]: ${message}`
      });
    }

    const messages = buildGroupChatPrompt(figures, topic, updatedHistory, respondingFigure);

    // Create streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages,
            temperature: 0.8,
            max_tokens: 300,
            stream: true,
          });

          let fullContent = '';

          // Send the figure ID first
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'figure', figureId: respondingFigure.id })}\n\n`));

          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              fullContent += content;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'token', content })}\n\n`));
            }
          }

          // Send done signal
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done', fullContent })}\n\n`));
          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: 'Failed to generate response' })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Endpoint to generate initial responses from all figures
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { figureIds, topic, conversationHistory = [] } = body as {
      figureIds: string[];
      topic: string;
      conversationHistory: ConversationTurn[];
    };

    if (!figureIds || figureIds.length === 0) {
      return NextResponse.json({ error: 'No figures selected' }, { status: 400 });
    }

    const figures = figureIds.map(id => getFigureById(id)).filter((f): f is HistoricalFigure => f !== undefined);

    if (figures.length === 0) {
      return NextResponse.json({ error: 'No valid figures found' }, { status: 400 });
    }

    // Generate responses from all figures in sequence
    const responses: { figureId: string; content: string }[] = [];
    let currentHistory = [...conversationHistory];

    // Each figure responds in turn
    for (const figure of figures) {
      const messages = buildGroupChatPrompt(figures, topic, currentHistory, figure);
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages,
        temperature: 0.8,
        max_tokens: 300,
      });

      const content = completion.choices[0]?.message?.content || '';
      
      responses.push({ figureId: figure.id, content });
      currentHistory.push({ figureId: figure.id, content });
    }

    return NextResponse.json({ responses });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
