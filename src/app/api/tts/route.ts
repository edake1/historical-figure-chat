import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { z } from 'zod';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Map each figure to a distinct OpenAI TTS voice
const figureVoiceMap: Record<string, string> = {
  cleopatra: 'nova',
  plato: 'onyx',
  archimedes: 'echo',
  davinci: 'fable',
  shakespeare: 'fable',
  newton: 'echo',
  lincoln: 'onyx',
  tesla: 'alloy',
  edison: 'ash',
  einstein: 'echo',
  curie: 'shimmer',
  gandhi: 'sage',
  churchill: 'onyx',
  frida: 'nova',
  mlk: 'onyx',
  socrates: 'sage',
  genghis: 'ash',
};

const ttsRequestSchema = z.object({
  text: z.string().min(1).max(4096),
  figureId: z.string().min(1).max(50),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = ttsRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { text, figureId } = parsed.data;
    const voice = (figureVoiceMap[figureId] || 'alloy') as 'alloy' | 'ash' | 'echo' | 'fable' | 'nova' | 'onyx' | 'sage' | 'shimmer';

    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice,
      input: text,
      speed: 1.0,
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());

    return new Response(buffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('TTS API Error:', error);
    return NextResponse.json({ error: 'Failed to generate speech' }, { status: 500 });
  }
}
