import { Ollama } from 'ollama';

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';

export const ollama = new Ollama({ host: OLLAMA_HOST });

export const CHAT_MODEL = process.env.OLLAMA_CHAT_MODEL || 'llama3.2';
export const EMBED_MODEL = process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text';
