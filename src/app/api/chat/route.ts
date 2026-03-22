import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { z } from 'zod';
import { getFigureById, HistoricalFigure, historicalFigures } from '@/lib/figures';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const validFigureIds = historicalFigures.map(f => f.id);

const conversationTurnSchema = z.object({
  figureId: z.string().max(50),
  content: z.string().max(5000),
});

type ConversationTurn = z.infer<typeof conversationTurnSchema>;

const chatRequestSchema = z.object({
  figureIds: z.array(z.string().max(50)).min(1).max(6)
    .refine(ids => ids.every(id => validFigureIds.includes(id) || id === 'moderator'), {
      message: 'Invalid figure ID',
    }),
  topic: z.string().min(1).max(500),
  conversationHistory: z.array(conversationTurnSchema).max(100).default([]),
  message: z.string().max(2000).optional(),
  respondAsFigureId: z.string().max(50).optional(),
});

// Keep recent history within token budget — retain last N turns
const MAX_HISTORY_TURNS = 30;

function trimHistory(history: ConversationTurn[]): ConversationTurn[] {
  if (history.length <= MAX_HISTORY_TURNS) return history;
  return history.slice(-MAX_HISTORY_TURNS);
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

  const trimmed = trimHistory(conversationHistory);
  const historyText = trimmed.length > 0
    ? '\n\nCONVERSATION SO FAR:\n' + trimmed.map(turn => {
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

  const userPrompt = trimmed.length > 0 
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
    const parsed = chatRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { figureIds, topic, conversationHistory, message, respondAsFigureId } = parsed.data;

    const figures = figureIds.map(id => getFigureById(id)).filter((f): f is HistoricalFigure => f !== undefined);

    if (figures.length === 0) {
      return NextResponse.json({ error: 'No valid figures found' }, { status: 400 });
    }

    // Determine which figure should respond
    let respondingFigure: HistoricalFigure;

    if (respondAsFigureId) {
      // Client explicitly requested a specific figure (used for initial round-robin)
      const requested = figures.find(f => f.id === respondAsFigureId);
      respondingFigure = requested || figures[0];
    } else if (message) {
      // User sent a message — weighted pick: prefer figures addressed by name or least recent
      const speakCounts = new Map<string, number>();
      for (const f of figures) speakCounts.set(f.id, 0);
      for (const turn of conversationHistory) {
        speakCounts.set(turn.figureId, (speakCounts.get(turn.figureId) || 0) + 1);
      }

      // Check if the moderator mentioned any figure by name
      const mentionedFigure = figures.find(f =>
        message.toLowerCase().includes(f.name.toLowerCase())
      );

      if (mentionedFigure) {
        respondingFigure = mentionedFigure;
      } else {
        // Weighted random: figures who spoke less get higher weight
        const minCount = Math.min(...figures.map(f => speakCounts.get(f.id) || 0));
        const candidates = figures.filter(f => (speakCounts.get(f.id) || 0) <= minCount + 1);
        respondingFigure = candidates[Math.floor(Math.random() * candidates.length)];
      }
    } else {
      // Continue conversation — weighted rotation avoiding recent speakers
      const recentIds = conversationHistory.slice(-2).map(t => t.figureId);
      const speakCounts = new Map<string, number>();
      for (const f of figures) speakCounts.set(f.id, 0);
      for (const turn of conversationHistory) {
        speakCounts.set(turn.figureId, (speakCounts.get(turn.figureId) || 0) + 1);
      }

      // Prefer figures not in last 2 turns, then pick least-spoken
      let candidates = figures.filter(f => !recentIds.includes(f.id));
      if (candidates.length === 0) candidates = figures;

      const minCount = Math.min(...candidates.map(f => speakCounts.get(f.id) || 0));
      const topCandidates = candidates.filter(f => (speakCounts.get(f.id) || 0) <= minCount + 1);
      respondingFigure = topCandidates[Math.floor(Math.random() * topCandidates.length)];
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
