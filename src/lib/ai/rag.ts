import { chatCompletion, CHAT_MODEL } from './openrouter';
import { classifyIntent, ChatIntent, type ClassifiedIntent } from './intent';
import { searchProducts, type SearchResult } from './embeddings';
import {
  SYSTEM_PROMPT,
  RECOMMENDATION_PROMPT,
  FAQ_PROMPT,
  buildRecommendationContext,
  buildFullMenuSummary,
} from './prompts';
import { loadMenuData, type Product, type Category } from '@/lib/data/products';

export interface ChatResponse {
  message: string;
  intent: ChatIntent;
  products?: Product[];
  suggestions?: string[];
}

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Main RAG pipeline: classifies intent, retrieves relevant context,
 * and generates a grounded response using OpenRouter.
 */
export async function chat(
  userMessage: string,
  conversationHistory: ConversationMessage[] = []
): Promise<ChatResponse> {
  // Step 1: Classify intent
  const classified = await classifyIntent(userMessage);
  console.log(`[rag] Intent: ${classified.intent} (${classified.confidence})`);

  // Step 2: Route based on intent
  switch (classified.intent) {
    case ChatIntent.RECOMMENDATION:
    case ChatIntent.DIETARY_QUERY:
      return handleRecommendation(userMessage, classified, conversationHistory);

    case ChatIntent.MENU_BROWSE:
      return handleMenuBrowse(userMessage, conversationHistory);

    case ChatIntent.ADD_TO_CART:
      return handleAddToCart(userMessage, classified, conversationHistory);

    case ChatIntent.VIEW_CART:
      return {
        message: "You can check your cart by tapping the **Cart** icon in the sidebar! 🛒 If you need help with anything else, just ask.",
        intent: ChatIntent.VIEW_CART,
        suggestions: ['Browse Menu', 'Recommend something', 'Track my order'],
      };

    case ChatIntent.CHECKOUT:
      return {
        message: "Ready to order? Head to your **Cart** and hit **Place Order**! 🎉 Don't forget to try promo code **SAVE10** for 10% off!",
        intent: ChatIntent.CHECKOUT,
        suggestions: ['View Cart', 'Browse Menu'],
      };

    case ChatIntent.ORDER_STATUS:
      return {
        message: "You can track your order from the **My Orders** page — it shows a real-time timeline of your order's progress! 📦",
        intent: ChatIntent.ORDER_STATUS,
        suggestions: ['Go to My Orders', 'Place a new order'],
      };

    case ChatIntent.PROMO_CODE:
      return handleFAQ(userMessage, conversationHistory, ChatIntent.PROMO_CODE);

    case ChatIntent.FAQ:
      return handleFAQ(userMessage, conversationHistory, ChatIntent.FAQ);

    case ChatIntent.REMOVE_FROM_CART:
      return {
        message: "You can remove items directly from the **Cart** page using the remove button next to each item. Need help with anything else?",
        intent: ChatIntent.REMOVE_FROM_CART,
        suggestions: ['View Cart', 'Browse Menu'],
      };

    default:
      return handleGeneral(userMessage, conversationHistory);
  }
}

/**
 * Handle recommendation queries using RAG.
 */
async function handleRecommendation(
  userMessage: string,
  classified: ClassifiedIntent,
  history: ConversationMessage[]
): Promise<ChatResponse> {
  // Extract price filter from message
  const priceMatch = userMessage.match(/under\s*\$?(\d+)/i);
  const maxPrice = priceMatch ? parseFloat(priceMatch[1]) : undefined;

  // Search for relevant products via embeddings
  const results = await searchProducts(userMessage, {
    topK: 5,
    maxPrice,
    dietary: classified.entities.dietary,
  });

  if (results.length === 0) {
    return {
      message: "I couldn't find a perfect match for that. Would you like to browse our full menu? We have burgers, pizzas, appetizers, drinks, and desserts! 🍽️",
      intent: ChatIntent.RECOMMENDATION,
      suggestions: ['Browse Menu', 'Show me everything', 'Popular items'],
    };
  }

  // Build context from retrieved products
  const context = buildRecommendationContext(
    results.map(r => r.product)
  );
  const prompt = RECOMMENDATION_PROMPT.replace('{context}', context);

  // Generate response with LLM
  const message = await generateResponse(
    prompt,
    userMessage,
    history
  );

  return {
    message,
    intent: classified.intent,
    products: results.map(r => r.product),
    suggestions: buildSuggestions(results),
  };
}

/**
 * Detect if the user message targets a specific menu category.
 */
function detectCategory(
  message: string,
  allCategories: Category[],
  allProducts: Product[]
): { category: Category; products: Product[] } | null {
  const lower = message.toLowerCase();
  for (const cat of allCategories) {
    // Match category name or slug (e.g. "burgers", "pizza", "appetizers")
    if (lower.includes(cat.slug) || lower.includes(cat.name.toLowerCase())) {
      const filtered = allProducts.filter(p => p.category_id === cat.id && p.is_available);
      if (filtered.length > 0) return { category: cat, products: filtered };
    }
  }
  return null;
}

/**
 * Handle menu browse requests.
 */
async function handleMenuBrowse(
  userMessage: string,
  history: ConversationMessage[]
): Promise<ChatResponse> {
  const { products: allProducts, categories } = await loadMenuData();

  // Check if the user is asking about a specific category
  const detected = detectCategory(userMessage, categories, allProducts);

  if (detected) {
    const { category, products: categoryProducts } = detected;
    const context = buildRecommendationContext(categoryProducts);

    const message = await generateResponse(
      `The customer wants to see our ${category.name} menu. Here are ALL the ${category.name} items we offer:\n\n${context}\n\nList each item with its name and price. ONLY mention the items above — these are the ONLY ${category.name} we have. Keep it brief and appetizing.`,
      userMessage,
      history
    );

    // Build suggestions from other categories
    const otherCategories = categories
      .filter(c => c.id !== category.id)
      .map(c => c.name);

    return {
      message,
      intent: ChatIntent.MENU_BROWSE,
      products: categoryProducts,
      suggestions: otherCategories.slice(0, 4),
    };
  }

  // General menu browse — show overview
  const results = await searchProducts(userMessage, { topK: 5, minSimilarity: 0.1 });
  const menuSummary = buildFullMenuSummary(allProducts);

  const message = await generateResponse(
    `The customer wants to browse the menu.\n\n${menuSummary}\n\nGive a brief, appetizing overview of what we offer. ONLY mention items from the list above. Mention that they can see the full menu on the Menu page.`,
    userMessage,
    history
  );

  return {
    message,
    intent: ChatIntent.MENU_BROWSE,
    products: results.map(r => r.product),
    suggestions: ['Burgers', 'Pizza', 'Appetizers', 'Drinks', 'Desserts'],
  };
}

/**
 * Handle "add to cart" intent by finding matching products.
 */
async function handleAddToCart(
  userMessage: string,
  classified: ClassifiedIntent,
  history: ConversationMessage[]
): Promise<ChatResponse> {
  const results = await searchProducts(userMessage, { topK: 3 });

  if (results.length === 0) {
    return {
      message: "I'm not sure which item you'd like to add. Could you be more specific, or browse our **Menu** to pick something? 🤔",
      intent: ChatIntent.ADD_TO_CART,
      suggestions: ['Browse Menu', 'Show popular items'],
    };
  }

  const topMatch = results[0];
  const message = await generateResponse(
    `The customer wants to add something to their cart. The best match from our menu is:\n\n${topMatch.product.name} — $${topMatch.product.price.toFixed(2)}\n${topMatch.product.description}\n\nLet them know you found this item and suggest they can add it to their cart from the menu. Keep it brief.`,
    userMessage,
    history
  );

  return {
    message,
    intent: ChatIntent.ADD_TO_CART,
    products: [topMatch.product],
    suggestions: ['View Cart', 'Browse Menu', 'Something else'],
  };
}

/**
 * Handle FAQ and promo code queries.
 */
async function handleFAQ(
  userMessage: string,
  history: ConversationMessage[],
  intent: ChatIntent
): Promise<ChatResponse> {
  const message = await generateResponse(FAQ_PROMPT, userMessage, history);

  return {
    message,
    intent,
    suggestions: ['Browse Menu', 'Track my order', 'Recommend something'],
  };
}

/**
 * Handle general/greeting messages.
 */
async function handleGeneral(
  userMessage: string,
  history: ConversationMessage[]
): Promise<ChatResponse> {
  const { products: allProducts } = await loadMenuData();
  const menuSummary = buildFullMenuSummary(allProducts);
  const message = await generateResponse(
    `Respond to the customer warmly. You can help them browse the menu, get food recommendations, manage their cart, or track orders.\n\n${menuSummary}`,
    userMessage,
    history
  );

  return {
    message,
    intent: ChatIntent.GENERAL,
    suggestions: ['Browse Menu', "What's Popular?", 'Vegan Options', 'Track My Order'],
  };
}

/**
 * Generate a response using OpenRouter.
 */
async function generateResponse(
  contextPrompt: string,
  userMessage: string,
  history: ConversationMessage[]
): Promise<string> {
  const messages = [
    { role: 'system' as const, content: SYSTEM_PROMPT },
    { role: 'system' as const, content: contextPrompt },
    // Include recent conversation history (last 6 messages)
    ...history.slice(-6).map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user' as const, content: userMessage },
  ];

  try {
    return await chatCompletion({
      model: CHAT_MODEL,
      messages,
      temperature: 0.3,
      max_tokens: 250,
    });
  } catch (error) {
    console.error('[rag] LLM generation failed:', error);
    return "I'm having trouble thinking right now 🤔 Could you try again? In the meantime, feel free to browse the **Menu** directly!";
  }
}

/**
 * Build follow-up suggestion chips based on search results.
 */
function buildSuggestions(results: SearchResult[]): string[] {
  const suggestions: string[] = [];

  // Add dietary-based suggestions if items have dietary labels
  const hasDietary = results.some(r => r.product.dietary.length > 0);
  if (!hasDietary) suggestions.push('Vegan options');

  suggestions.push('View full menu');

  return suggestions.slice(0, 3);
}
