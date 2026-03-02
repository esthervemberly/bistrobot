/**
 * OpenRouter AI client — replaces Ollama with cloud LLM via OpenRouter.
 *
 * OpenRouter provides an OpenAI-compatible API with access to hundreds
 * of models. Set OPENROUTER_API_KEY in your .env.local file.
 *
 * @see https://openrouter.ai/docs
 */

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';

function getApiKey(): string {
    const key = process.env.OPENROUTER_API_KEY;
    if (!key) throw new Error('OPENROUTER_API_KEY is not set in .env.local');
    return key;
}

export const CHAT_MODEL =
    process.env.OPENROUTER_CHAT_MODEL || 'google/gemini-2.0-flash-001';

interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

interface ChatCompletionOptions {
    model?: string;
    messages: ChatMessage[];
    temperature?: number;
    max_tokens?: number;
}

interface GenerateOptions {
    model?: string;
    prompt: string;
    temperature?: number;
    max_tokens?: number;
}

/**
 * Call OpenRouter's chat completion endpoint.
 * Returns the assistant's message content.
 *
 * System messages are merged into the first user message as an
 * "[Instructions]" block so the prompt works with models that
 * don't support the system / developer role (e.g. Gemma).
 */
export async function chatCompletion(options: ChatCompletionOptions): Promise<string> {
    const {
        model = CHAT_MODEL,
        messages,
        temperature = 0.3,
        max_tokens = 250,
    } = options;

    // Merge system messages into the conversation so every model works
    const prepared = flattenSystemMessages(messages);

    const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${getApiKey()}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
            'X-Title': 'BistroBot',
        },
        body: JSON.stringify({
            model,
            messages: prepared,
            temperature,
            max_tokens,
            stream: false,
        }),
    });

    if (!res.ok) {
        const body = await res.text();
        throw new Error(`OpenRouter API error ${res.status}: ${body}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || '';
}

/**
 * Flatten system messages into the first user message.
 * Models like Gemma reject the "system" / "developer" role, so we
 * prepend system content as an [Instructions] block in the first
 * user turn. This is a widely-used compatibility workaround.
 */
function flattenSystemMessages(
    messages: ChatMessage[]
): { role: 'user' | 'assistant'; content: string }[] {
    const systemParts: string[] = [];
    const rest: ChatMessage[] = [];

    for (const msg of messages) {
        if (msg.role === 'system') {
            systemParts.push(msg.content);
        } else {
            rest.push(msg);
        }
    }

    if (systemParts.length === 0) {
        return rest.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));
    }

    const instructionBlock = `[Instructions]\n${systemParts.join('\n\n')}\n[/Instructions]\n\n`;

    // Find the first user message and prepend the instructions
    const result: { role: 'user' | 'assistant'; content: string }[] = [];
    let injected = false;
    for (const msg of rest) {
        if (!injected && msg.role === 'user') {
            result.push({ role: 'user', content: instructionBlock + msg.content });
            injected = true;
        } else {
            result.push({ role: msg.role as 'user' | 'assistant', content: msg.content });
        }
    }

    // If there were no user messages, create one from the instructions
    if (!injected) {
        result.unshift({ role: 'user', content: instructionBlock.trim() });
    }

    return result;
}

/**
 * Simple generate (single prompt → single response).
 * Wraps the prompt as a user message in a chat completion.
 */
export async function generate(options: GenerateOptions): Promise<string> {
    const { model, prompt, temperature = 0, max_tokens = 30 } = options;
    return chatCompletion({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature,
        max_tokens,
    });
}
