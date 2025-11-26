"use client";

import { useState, useEffect } from "react";
import { getProductsBySkus, TypesenseProduct } from "@/lib/typesense";

interface RecResultsProps {
  inputSkus: string[];
}

interface RecommendationResponse {
  input: string[];
  recommendations: string[];
}

/**
 * RecResults fetches recommendations from the Python backend
 * and hydrates them with product data from Typesense.
 */
export default function RecResults({ inputSkus }: RecResultsProps) {
  const [recommendations, setRecommendations] = useState<TypesenseProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRecommendations() {
      if (inputSkus.length === 0) {
        setRecommendations([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Step 1: Call Python Backend to get recommended SKUs
        const response = await fetch("http://127.0.0.1:8000/recommend", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            skus: inputSkus,
            top_k: 5,
          }),
        });

        if (!response.ok) {
          throw new Error(`Backend error: ${response.status}`);
        }

        const data: RecommendationResponse = await response.json();

        if (!data.recommendations || data.recommendations.length === 0) {
          setRecommendations([]);
          return;
        }

        // Step 2: Query Typesense to get product details for the recommended SKUs
        const hydratedProducts = await getProductsBySkus(data.recommendations);

        // Step 3: Sort by original recommendation order
        const orderedProducts = data.recommendations
          .map((sku) => hydratedProducts.find((p) => p.sku === sku))
          .filter((p): p is TypesenseProduct => p !== undefined);

        setRecommendations(orderedProducts);
      } catch (err) {
        console.error("Failed to fetch recommendations:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch recommendations"
        );
        setRecommendations([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchRecommendations();
  }, [inputSkus]);

  // Empty state - no input SKUs
  if (inputSkus.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-neutral-50 py-16">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 w-12 text-neutral-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
        <p className="mt-4 text-sm font-medium text-neutral-500">
          Add products to context to see recommendations
        </p>
        <p className="mt-1 text-xs text-neutral-400">
          The AI will suggest related products based on your selection
        </p>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-neutral-200 bg-white py-16">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-neutral-200 border-t-[#8fc31f]"></div>
        <p className="mt-4 text-sm text-neutral-500">
          Fetching recommendations...
        </p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50 py-16">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 w-12 text-red-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <p className="mt-4 text-sm font-medium text-red-600">
          Failed to load recommendations
        </p>
        <p className="mt-1 text-xs text-red-500">{error}</p>
      </div>
    );
  }

  // No recommendations returned
  if (recommendations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-neutral-200 bg-white py-16">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 w-12 text-neutral-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
        <p className="mt-4 text-sm font-medium text-neutral-500">
          No recommendations found
        </p>
        <p className="mt-1 text-xs text-neutral-400">
          Try adding different products to get suggestions
        </p>
      </div>
    );
  }

  // Results grid
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-neutral-600">
          Recommended Products ({recommendations.length})
        </h3>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {recommendations.map((product, index) => (
          <div
            key={product.id}
            className="group relative overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm transition-all hover:border-[#8fc31f] hover:shadow-md"
          >
            {/* Rank Badge */}
            <div className="absolute left-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-[#8fc31f] text-xs font-bold text-white shadow">
              {index + 1}
            </div>

            {/* Product Image */}
            <div className="aspect-square overflow-hidden bg-neutral-100">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-16 w-16 text-neutral-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="p-3">
              <h4 className="line-clamp-2 text-sm font-medium text-neutral-800">
                {product.name || "Unknown Product"}
              </h4>
              <p className="mt-1 text-xs text-neutral-500">SKU: {product.sku}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
