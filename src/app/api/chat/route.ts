import { NextRequest, NextResponse } from 'next/server';
import { chat } from '@/lib/ai/rag';
import { ensureProductEmbeddings } from '@/lib/ai/embeddings';

// Pre-warm embeddings on module load so the first request isn't slow
ensureProductEmbeddings().catch(err =>
  console.warn('[/api/chat] Failed to pre-warm embeddings:', err)
);

export const maxDuration = 60; // Allow up to 60s for OpenRouter responses

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, history } = body as {
      message: string;
      history?: { role: 'user' | 'assistant'; content: string }[];
    };

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Sanitize: strip control chars and truncate
    const sanitized = message
      .replace(/[\x00-\x1F\x7F]/g, '')
      .substring(0, 1000)
      .trim();

    const response = await chat(sanitized, history ?? []);

    return NextResponse.json(response);
  } catch (error) {
    console.error('[/api/chat] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}
