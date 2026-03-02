import { loadMenuData, type Product } from '@/lib/data/products';

/**
 * Hugging Face Inference API for embeddings.
 * Uses BAAI/bge-small-en-v1.5 (384-dim vectors).
 * Requires a free HF token: https://huggingface.co/settings/tokens
 */
const HF_EMBED_MODEL = process.env.HF_EMBED_MODEL || 'BAAI/bge-small-en-v1.5';
const HF_API_BASE = 'https://router.huggingface.co/hf-inference/models';

/**
 * Generate an embedding vector for a text string using Hugging Face Inference API.
 */
export async function embed(text: string): Promise<number[]> {
  const hfToken = process.env.HF_TOKEN;
  if (!hfToken || hfToken === 'your-hf-token-here') {
    throw new Error('HF_TOKEN is not set. Get a free token at https://huggingface.co/settings/tokens and add it to .env.local');
  }

  const url = `${HF_API_BASE}/${HF_EMBED_MODEL}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${hfToken}`,
    },
    body: JSON.stringify({
      inputs: text,
      options: { wait_for_model: true },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HF Embedding API error ${res.status}: ${body}`);
  }

  const data = await res.json();
  // The API returns a flat array of numbers for a single string input
  return data as number[];
}

/**
 * Build a rich text representation of a product for embedding.
 */
export function productToEmbeddingText(product: Product): string {
  const parts = [
    product.name,
    product.description,
    `Category: ${product.category_id}`,
    product.tags.length ? `Tags: ${product.tags.join(', ')}` : '',
    product.allergens.length ? `Allergens: ${product.allergens.join(', ')}` : '',
    product.dietary.length ? `Dietary: ${product.dietary.join(', ')}` : '',
    `Price: $${product.price.toFixed(2)}`,
    `Calories: ${product.calories}`,
  ];
  return parts.filter(Boolean).join('. ');
}

/**
 * Cosine similarity between two vectors.
 */
function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

interface ProductEmbedding {
  product: Product;
  embedding: number[];
}

/**
 * In-memory product embedding cache.
 * In production this would live in pgvector; for local dev we pre-compute
 * embeddings on first use and keep them in memory.
 */
let productEmbeddings: ProductEmbedding[] | null = null;
let embeddingPromise: Promise<ProductEmbedding[]> | null = null;

/**
 * Initialize product embeddings. Called once, results are cached.
 */
export async function ensureProductEmbeddings(): Promise<ProductEmbedding[]> {
  if (productEmbeddings) return productEmbeddings;

  // Prevent duplicate initialization from concurrent requests
  if (embeddingPromise) return embeddingPromise;

  embeddingPromise = (async () => {
    const { products } = await loadMenuData();
    console.log(`[embeddings] Generating embeddings for ${products.length} products via HF API...`);
    const start = Date.now();

    const embeddings: ProductEmbedding[] = [];
    for (const product of products) {
      const text = productToEmbeddingText(product);
      const embedding = await embed(text);
      embeddings.push({ product, embedding });
    }

    productEmbeddings = embeddings;
    console.log(`[embeddings] Done in ${Date.now() - start}ms`);
    return embeddings;
  })();

  return embeddingPromise;
}

export interface SearchResult {
  product: Product;
  similarity: number;
}

/**
 * Semantic search: find the top-K products most similar to a query.
 */
export async function searchProducts(
  query: string,
  options?: {
    topK?: number;
    minSimilarity?: number;
    maxPrice?: number;
    category?: string;
    dietary?: string[];
  }
): Promise<SearchResult[]> {
  const {
    topK = 5,
    minSimilarity = 0.3,
    maxPrice,
    category,
    dietary,
  } = options ?? {};

  const embeddings = await ensureProductEmbeddings();
  const queryEmbedding = await embed(query);

  let results: SearchResult[] = embeddings
    .map(({ product, embedding }) => ({
      product,
      similarity: cosineSimilarity(queryEmbedding, embedding),
    }))
    .filter(r => r.similarity >= minSimilarity && r.product.is_available);

  // Apply filters
  if (maxPrice !== undefined) {
    results = results.filter(r => r.product.price <= maxPrice);
  }
  if (category) {
    results = results.filter(r => r.product.category_id === category);
  }
  if (dietary && dietary.length > 0) {
    results = results.filter(r =>
      dietary.some(d => r.product.dietary.includes(d))
    );
  }

  // Sort by similarity descending and take top K
  results.sort((a, b) => b.similarity - a.similarity);
  return results.slice(0, topK);
}
