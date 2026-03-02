import { generate, CHAT_MODEL } from './openrouter';

export enum ChatIntent {
  MENU_BROWSE = 'menu_browse',
  RECOMMENDATION = 'recommendation',
  ADD_TO_CART = 'add_to_cart',
  REMOVE_FROM_CART = 'remove_from_cart',
  VIEW_CART = 'view_cart',
  CHECKOUT = 'checkout',
  ORDER_STATUS = 'order_status',
  FAQ = 'faq',
  DIETARY_QUERY = 'dietary_query',
  PROMO_CODE = 'promo_code',
  GENERAL = 'general',
}

export interface ClassifiedIntent {
  intent: ChatIntent;
  confidence: number;
  entities: {
    productNames?: string[];
    quantity?: number;
    priceRange?: { min?: number; max?: number };
    dietary?: string[];
  };
}

/**
 * Fast keyword-based intent classification. Returns null if no match.
 */
function classifyByKeywords(message: string): ClassifiedIntent | null {
  const lower = message.toLowerCase().trim();

  // Order tracking
  if (/\b(track|where.?s my order|order status|delivery)\b/.test(lower)) {
    return { intent: ChatIntent.ORDER_STATUS, confidence: 0.95, entities: {} };
  }

  // Checkout
  if (/\b(checkout|place.?order|pay|confirm order)\b/.test(lower)) {
    return { intent: ChatIntent.CHECKOUT, confidence: 0.9, entities: {} };
  }

  // View cart
  if (/\b(view cart|show cart|my cart|what.?s in my cart|cart items)\b/.test(lower)) {
    return { intent: ChatIntent.VIEW_CART, confidence: 0.9, entities: {} };
  }

  // Promo code
  if (/\b(promo|coupon|discount|code)\b/.test(lower)) {
    return { intent: ChatIntent.PROMO_CODE, confidence: 0.85, entities: {} };
  }

  // Menu browse
  if (/\b(menu|browse|show.?me|see.?(the|all)|what do you (have|serve))\b/.test(lower)) {
    return { intent: ChatIntent.MENU_BROWSE, confidence: 0.85, entities: {} };
  }

  // Category-specific browse (bare category names like "Burgers", "Pizza")
  if (/\b(burgers?|pizzas?|appetizers?|drinks?|desserts?)\b/.test(lower)) {
    return { intent: ChatIntent.MENU_BROWSE, confidence: 0.85, entities: {} };
  }

  // Dietary queries
  if (/\b(vegan|vegetarian|gluten.?free|halal|kosher|dairy.?free|allerg)\b/.test(lower)) {
    const dietary: string[] = [];
    if (/vegan/i.test(lower)) dietary.push('vegan');
    if (/vegetarian/i.test(lower)) dietary.push('vegetarian');
    if (/gluten.?free/i.test(lower)) dietary.push('gluten-free');
    if (/halal/i.test(lower)) dietary.push('halal');
    return { intent: ChatIntent.DIETARY_QUERY, confidence: 0.85, entities: { dietary } };
  }

  // Add to cart — "add X", "I'll have the X", "get me X"
  if (/\b(add|i.?ll have|get me|order|want)\b/.test(lower)) {
    const qtyMatch = lower.match(/(\d+)/);
    return {
      intent: ChatIntent.ADD_TO_CART,
      confidence: 0.7,
      entities: { quantity: qtyMatch ? parseInt(qtyMatch[1]) : 1 },
    };
  }

  // Remove from cart
  if (/\b(remove|delete|take out|cancel)\b/.test(lower)) {
    return { intent: ChatIntent.REMOVE_FROM_CART, confidence: 0.7, entities: {} };
  }

  return null;
}

/**
 * LLM-based intent classification as fallback.
 */
async function classifyByLLM(message: string): Promise<ClassifiedIntent> {
  const prompt = `Classify the following customer message into exactly one intent category. 
Respond with ONLY the intent name from this list:
- menu_browse (wants to see the menu)
- recommendation (wants food suggestions/recommendations)
- add_to_cart (wants to add something to cart)
- remove_from_cart (wants to remove something from cart)
- view_cart (wants to see cart contents)
- checkout (wants to place order/checkout)
- order_status (wants to track order)
- faq (general restaurant question like hours, location)
- dietary_query (asking about dietary options/restrictions)
- promo_code (asking about discounts/promos)
- general (greeting, small talk, or anything else)

Customer message: "${message}"

Intent:`;

  try {
    const text = (await generate({
      model: CHAT_MODEL,
      prompt,
      temperature: 0,
      max_tokens: 20,
    })).trim().toLowerCase();

    // Find the best matching intent
    for (const intent of Object.values(ChatIntent)) {
      if (text.includes(intent)) {
        return { intent, confidence: 0.75, entities: {} };
      }
    }

    // If we can't parse an intent from the LLM, check for key words in its response
    if (text.includes('recommend') || text.includes('suggest')) {
      return { intent: ChatIntent.RECOMMENDATION, confidence: 0.6, entities: {} };
    }

    return { intent: ChatIntent.GENERAL, confidence: 0.5, entities: {} };
  } catch {
    return { intent: ChatIntent.GENERAL, confidence: 0.3, entities: {} };
  }
}

/**
 * Classify a user message's intent. Tries fast keyword matching first,
 * falls back to LLM classification.
 */
export async function classifyIntent(message: string): Promise<ClassifiedIntent> {
  // Layer 1: Fast keyword matching
  const keywordResult = classifyByKeywords(message);
  if (keywordResult && keywordResult.confidence >= 0.8) {
    return keywordResult;
  }

  // Layer 2: LLM classification
  const llmResult = await classifyByLLM(message);

  // If keyword match had a lower confidence, compare with LLM result
  if (keywordResult && keywordResult.confidence > llmResult.confidence) {
    return keywordResult;
  }

  return llmResult;
}
