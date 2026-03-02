'use client';

import { create } from 'zustand';
import { Product } from '@/lib/data/products';

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    products?: Product[];
    suggestions?: string[];
    timestamp: Date;
}

interface ChatStore {
    messages: ChatMessage[];
    isTyping: boolean;
    sendMessage: (text: string) => Promise<void>;
    clearHistory: () => void;
}

export const useChatStore = create<ChatStore>()((set, get) => ({
    messages: [
        {
            id: 'welcome',
            role: 'assistant',
            content: "Hey there! 👋 Welcome to **BistroBot**! I'm your AI-powered food assistant. I can help you discover dishes, get personalized recommendations, and manage your order. What sounds good today?",
            suggestions: ['Browse Menu', 'What\'s Popular?', 'Vegan Options', 'Track My Order'],
            timestamp: new Date(),
        },
    ],
    isTyping: false,

    sendMessage: async (text) => {
        const userMsg: ChatMessage = {
            id: `msg-${Date.now()}`,
            role: 'user',
            content: text,
            timestamp: new Date(),
        };

        const currentMessages = get().messages;
        set({ messages: [...currentMessages, userMsg], isTyping: true });

        try {
            // Build conversation history for context
            const history = currentMessages
                .filter(m => m.id !== 'welcome')
                .slice(-6)
                .map(m => ({ role: m.role, content: m.content }));

            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 120000);

            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text, history }),
                signal: controller.signal,
            });

            clearTimeout(timeout);

            if (!res.ok) {
                throw new Error(`Chat API returned ${res.status}`);
            }

            const data = await res.json();

            const assistantMsg: ChatMessage = {
                id: `msg-${Date.now()}-resp`,
                role: 'assistant',
                content: data.message,
                products: data.products,
                suggestions: data.suggestions,
                timestamp: new Date(),
            };

            set({ messages: [...get().messages, assistantMsg], isTyping: false });
        } catch (error) {
            console.error('Chat error:', error);
            const isTimeout = error instanceof DOMException && error.name === 'AbortError';
            const errorContent = isTimeout
                ? "That's taking a bit long — the AI model might be warming up. Please try again in a moment! ⏳"
                : "Sorry, I'm having trouble connecting to the AI service right now. Please try again shortly! 🔌";
            const errorMsg: ChatMessage = {
                id: `msg-${Date.now()}-err`,
                role: 'assistant',
                content: errorContent,
                suggestions: ['Try again', 'Browse Menu'],
                timestamp: new Date(),
            };
            set({ messages: [...get().messages, errorMsg], isTyping: false });
        }
    },

    clearHistory: () =>
        set({
            messages: [
                {
                    id: 'welcome',
                    role: 'assistant',
                    content: "Chat cleared! 🧹 How can I help you today?",
                    suggestions: ['Browse Menu', 'What\'s Popular?', 'Track My Order'],
                    timestamp: new Date(),
                },
            ],
        }),
}));
