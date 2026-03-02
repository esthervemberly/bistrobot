# BistroBot

AI-powered restaurant chatbot built with Next.js, Supabase, and OpenRouter. Chat with an AI assistant to browse the menu, get personalized food recommendations, manage your cart, and track orders — all in a sleek dark-themed UI.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20DB-green)
![OpenRouter](https://img.shields.io/badge/OpenRouter-LLM-purple)

---

## Features

### AI Chatbot (RAG Pipeline)
- **Intent Classification** — Two-layer system: fast keyword matching (zero latency) with LLM fallback for ambiguous messages
- **Semantic Search** — Product embeddings via Hugging Face Inference API (`BAAI/bge-small-en-v1.5`, 384-dim vectors) with cosine similarity ranking
- **Grounded Responses** — RAG pipeline retrieves relevant menu items and constrains the LLM to only mention real products with correct prices
- **11 Intent Categories** — Menu browse, recommendations, add/remove cart, checkout, order status, FAQ, dietary queries, promo codes, and general chat
- **Contextual Conversation** — Maintains sliding window of recent messages for multi-turn dialogue

### Menu & Ordering
- **Dynamic Menu** — Products, categories, options, and promo codes stored in Supabase with local fallback data
- **Product Customization** — Size options, add-ons (Extra Cheese, Bacon, Avocado) with price modifiers
- **Smart Cart** — Persistent cart (localStorage via Zustand), promo code support (SAVE10, WELCOME20, BISTRO15), tax calculation
- **Order Tracking** — Real-time order timeline with live countdown timer, status progression (Confirmed → Preparing → Ready → Delivered)
- **Category Filtering & Search** — Browse by category (Burgers, Pizza, Appetizers, Drinks, Desserts) or search by name/tags

### Authentication & Profiles
- **Supabase Auth** — Email/password and Google OAuth sign-in
- **User Profiles** — Display name, phone, dietary preferences stored in Supabase
- **Protected Routes** — Orders and profile pages require authentication via `AuthGuard` component
- **Session Management** — Middleware-based session refresh with `@supabase/ssr`

### UI/UX
- **Dark Theme** — Full dark mode with CSS custom properties, Plus Jakarta Sans font
- **Responsive Sidebar** — Collapsible navigation with mobile overlay, SVG icon system
- **Product Cards in Chat** — AI responses include interactive product cards with images, prices, and add-to-cart buttons
- **Suggestion Chips** — Quick-action buttons after each AI response for common follow-ups
- **Typing Indicator** — Animated dots while waiting for AI response

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, React Compiler, Turbopack) |
| UI | React 19, CSS Modules, dark theme |
| State | Zustand 5 (cart with localStorage persist, chat, orders, auth, UI) |
| LLM | OpenRouter API (configurable model, default: `google/gemma-3-4b-it:free`) |
| Embeddings | Hugging Face Inference API (`BAAI/bge-small-en-v1.5`) |
| Database | Supabase (PostgreSQL with RLS) |
| Auth | Supabase Auth (email + Google OAuth) |
| Images | Unsplash (via `next/image`) |
| Language | TypeScript 5 |

---

## Project Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── page.tsx                  # Chat interface (home)
│   ├── layout.tsx                # Root layout with sidebar
│   ├── globals.css               # Global styles + dark theme
│   ├── cart/page.tsx             # Shopping cart + checkout
│   ├── login/page.tsx            # Auth (login/signup)
│   ├── menu/page.tsx             # Menu browsing + filtering
│   ├── orders/page.tsx           # Order history
│   ├── orders/[id]/track/page.tsx # Live order tracking
│   ├── profile/page.tsx          # User profile settings
│   └── api/chat/route.ts        # POST /api/chat endpoint
├── components/
│   ├── auth/AuthGuard.tsx        # Protected route wrapper
│   ├── icons/Icons.tsx           # SVG icon components (6 icons)
│   ├── layout/Sidebar.tsx        # Sidebar navigation
│   └── menu/ProductDetailModal.tsx # Product customization modal
├── lib/
│   ├── ai/
│   │   ├── openrouter.ts         # OpenRouter API client (chat + generate)
│   │   ├── embeddings.ts         # HF embedding + semantic search
│   │   ├── intent.ts             # Intent classifier (keywords + LLM)
│   │   ├── rag.ts                # RAG pipeline orchestrator
│   │   └── prompts.ts            # System prompts + context builders
│   ├── data/products.ts          # Product/category types + Supabase fetcher
│   └── supabase/
│       ├── client.ts             # Browser Supabase client
│       ├── server.ts             # Server Supabase client
│       ├── middleware.ts         # Session refresh middleware
│       └── types.ts              # Database type definitions
├── stores/
│   ├── authStore.ts              # Auth state (Supabase Auth)
│   ├── cartStore.ts              # Cart state (localStorage persist)
│   ├── chatStore.ts              # Chat messages + API calls
│   ├── orderStore.ts             # Orders (Supabase CRUD)
│   └── uiStore.ts                # UI state (sidebar, filters)
└── middleware.ts                  # Next.js middleware (session refresh)

supabase/
├── migrations/
│   ├── 001_auth_schema.sql       # User profiles + orders tables
│   └── 002_products_schema.sql   # Products, categories, options, promos
└── seed.sql                      # Menu data seed (13 items, 5 categories)
```

---

## Getting Started

### Prerequisites

- **Node.js** 18+
- A [Supabase](https://supabase.com) project (free tier works)
- An [OpenRouter](https://openrouter.ai) API key (free models available)
- A [Hugging Face](https://huggingface.co) token (free)

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

Create a `.env.local` file (or copy `.env.local.example`):

```env
# Supabase — https://supabase.com/dashboard → Project Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# OpenRouter — https://openrouter.ai/keys
OPENROUTER_API_KEY=sk-or-v1-your-key-here
OPENROUTER_CHAT_MODEL=google/gemma-3-4b-it:free

# Hugging Face — https://huggingface.co/settings/tokens
HF_TOKEN=hf_your-token-here
```

### 3. Set up Supabase

Run the migrations in order from the Supabase SQL Editor:

1. `supabase/migrations/001_auth_schema.sql` — Creates `profiles` and `orders` tables with RLS
2. `supabase/migrations/002_products_schema.sql` — Creates `categories`, `products`, `product_options`, and `promo_codes` tables
3. `supabase/seed.sql` — Populates the menu with 5 categories, 13 products, product options, and 3 promo codes

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll land on the AI chat interface.

---

## Available Models

The LLM is configurable via `OPENROUTER_CHAT_MODEL`. Some free options on OpenRouter:

| Model | Speed | Quality |
|-------|-------|---------|
| `google/gemma-3-4b-it:free` | Fast | Good (default) |
| `google/gemma-3-12b-it:free` | Medium | Better |
| `meta-llama/llama-3.2-3b-instruct:free` | Slow (queued) | Good |
| `qwen/qwen3-4b:free` | Fast | Good |
| `mistralai/mistral-small-3.1-24b-instruct:free` | Medium | Very good |

The system message compatibility layer automatically flattens `system` role messages for models that don't support them (e.g., Gemma).

---

## Architecture

### RAG Pipeline Flow

```
User Message
    │
    ├─► Intent Classification (keywords → LLM fallback)
    │       │
    │       ├─► menu_browse → fetch categories/products → LLM response
    │       ├─► recommendation → semantic search → LLM response with product context
    │       ├─► add_to_cart → semantic search → find best product match
    │       ├─► dietary_query → filtered semantic search → LLM response
    │       ├─► view_cart / checkout / order_status → static response
    │       └─► general / faq → LLM response with menu grounding
    │
    └─► Response with message + product cards + suggestion chips
```

### Embedding & Search

- Products are embedded on first request using Hugging Face's `BAAI/bge-small-en-v1.5` model (384-dim vectors)
- Embeddings are cached in-memory for the server lifetime
- User queries are embedded at runtime and compared via cosine similarity
- Results can be filtered by price, category, and dietary restrictions

