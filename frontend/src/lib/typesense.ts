import Typesense from "typesense";

/**
 * Singleton Typesense client configuration.
 * Used for searching products in the bazaar4_retailer-products collection.
 */

const typesenseClient = new Typesense.Client({
  nodes: [
    {
      host: "search.seeedstudio.com",
      port: 443,
      protocol: "https",
    },
  ],
  apiKey: "gH0SsQS6CsCgav3z",
  connectionTimeoutSeconds: 10,
});

export const TYPESENSE_COLLECTION = "bazaar4_retailer-products";

export interface TypesenseProduct {
  id: string;
  name?: string;
  sku?: string;
  image_url?: string;
}

/**
 * Search products by query string (searches name and sku fields).
 */
export async function searchProducts(
  query: string,
  limit: number = 20
): Promise<TypesenseProduct[]> {
  if (!query.trim()) return [];

  try {
    const searchResult = await typesenseClient
      .collections(TYPESENSE_COLLECTION)
      .documents()
      .search({
        q: query,
        query_by: "name,sku",
        per_page: limit,
      });

    return (searchResult.hits || []).map((hit) => {
      const doc = hit.document as Record<string, unknown>;
      return {
        id: String(doc.id || doc.product_id || doc._id || ""),
        name: String(doc.name || doc.title || doc.product_name || ""),
        sku: String(doc.sku || doc.product_sku || ""),
        image_url: doc.image_url ? String(doc.image_url) : undefined,
      };
    });
  } catch (error) {
    console.error("Typesense search error:", error);
    return [];
  }
}

/**
 * Fetch products by a list of SKUs.
 * Uses filter_by to match exact SKUs.
 */
export async function getProductsBySkus(
  skus: string[]
): Promise<TypesenseProduct[]> {
  if (!skus.length) return [];

  try {
    // Build filter string: sku:=[sku1, sku2, ...]
    const filterValue = skus.map((s) => `\`${s}\``).join(",");
    const filterBy = `sku:=[${filterValue}]`;

    const searchResult = await typesenseClient
      .collections(TYPESENSE_COLLECTION)
      .documents()
      .search({
        q: "*",
        query_by: "name,sku",
        filter_by: filterBy,
        per_page: skus.length,
      });

    return (searchResult.hits || []).map((hit) => {
      const doc = hit.document as Record<string, unknown>;
      return {
        id: String(doc.id || doc.product_id || doc._id || ""),
        name: String(doc.name || doc.title || doc.product_name || ""),
        sku: String(doc.sku || doc.product_sku || ""),
        image_url: doc.image_url ? String(doc.image_url) : undefined,
      };
    });
  } catch (error) {
    console.error("Typesense fetch by SKUs error:", error);
    return [];
  }
}

export default typesenseClient;
