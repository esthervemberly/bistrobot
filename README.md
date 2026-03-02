# BistroBot

AI-powered restaurant chatbot built with Next.js, Supabase, and OpenRouter. Chat with an AI assistant to browse the menu, get personalized food recommendations, manage your cart, and track orders — all in a sleek dark-themed UI.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20DB-green)
![OpenRouter](https://img.shields.io/badge/OpenRouter-LLM-purple)

---
<img width="1710" height="910" alt="image" src="https://github.com/user-attachments/assets/05b12cba-17d9-4ac2-a2da-9238459b26ec" />

## Features

### AI Chatbot (RAG Pipeline)
- **Intent Classification** — Two-layer system: fast keyword matching (zero latency) with LLM fallback for ambiguous messages
- **Semantic Search** — Product embeddings via Hugging Face Inference API (`BAAI/bge-small-en-v1.5`, 384-dim vectors) with cosine similarity ranking
- **Grounded Responses** — RAG pipeline retrieves relevant menu items and constrains the LLM to only mention real products with correct prices
- **11 Intent Categories** — Menu browse, recommendations, add/remove cart, checkout, order status, FAQ, dietary queries, promo codes, and general chat
- **Contextual Conversation** — Maintains sliding window of recent messages for multi-turn dialogue

### Menu & Ordering
<img width="1710" height="986" alt="image" src="https://github.com/user-attachments/assets/2781f6d2-3d73-48a3-9bea-bdf029b59e05" />

- **Dynamic Menu** — Products, categories, options, and promo codes stored in Supabase with local fallback data
<img width="1710" height="986" alt="image" src="https://github.com/user-attachments/assets/25b20ced-229a-44d8-be79-11461e5d83a5" />

- **Product Customization** — Size options, add-ons (Extra Cheese, Bacon, Avocado) with price modifiers
<img width="1710" height="986" alt="image" src="https://github.com/user-attachments/assets/50871cfe-5d4a-4d3e-9fbb-240c64982d12" />

- **Smart Cart** — Persistent cart (localStorage via Zustand), promo code support (SAVE10, WELCOME20, BISTRO15), tax calculation
<img width="1710" height="986" alt="image" src="https://github.com/user-attachments/assets/05d8b6cb-608c-432a-a13a-5b54457a4aba" />

- **Order Tracking** — Real-time order timeline with live countdown timer, status progression (Confirmed → Preparing → Ready → Delivered)
<img width="1710" height="986" alt="image" src="https://github.com/user-attachments/assets/ae8cdc1b-9fa4-4edf-9e8d-168cf9345f40" />

- **Category Filtering & Search** — Browse by category (Burgers, Pizza, Appetizers, Drinks, Desserts) or search by name/tags

### Authentication & Profiles
<img width="1710" height="986" alt="image" src="https://github.com/user-attachments/assets/42cb99dd-f487-47a0-8030-55cf3dcb5d9e" />

<img width="1710" height="986" alt="image" src="https://github.com/user-attachments/assets/d9d442f7-ef2c-4b2f-b018-c824fafeb817" />

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

