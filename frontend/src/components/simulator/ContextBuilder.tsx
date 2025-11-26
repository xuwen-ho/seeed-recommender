"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { searchProducts, TypesenseProduct } from "@/lib/typesense";
import ProductChip from "./ProductChip";

interface ContextBuilderProps {
  selectedProducts: TypesenseProduct[];
  onChange: (products: TypesenseProduct[]) => void;
}

/**
 * ContextBuilder allows users to search and add multiple products to a context list.
 * Uses debounced search (300ms) to query Typesense as the user types.
 */
export default function ContextBuilder({
  selectedProducts,
  onChange,
}: ContextBuilderProps) {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<TypesenseProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search function
  const debouncedSearch = useCallback((searchQuery: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await searchProducts(searchQuery, 20);
        setSearchResults(results);
      } catch (error) {
        console.error("Search failed:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }, []);

  // Effect to trigger search when query changes
  useEffect(() => {
    debouncedSearch(query);
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, debouncedSearch]);

  // Click outside to close results
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Add product to selection
  const addProduct = (product: TypesenseProduct) => {
    const isAlreadySelected = selectedProducts.some(
      (p) => p.sku === product.sku
    );
    if (!isAlreadySelected) {
      onChange([...selectedProducts, product]);
    }
    setQuery("");
    setSearchResults([]);
    setShowResults(false);
  };

  // Remove product from selection
  const removeProduct = (sku: string) => {
    onChange(selectedProducts.filter((p) => p.sku !== sku));
  };

  // Check if product is already selected
  const isSelected = (sku: string) =>
    selectedProducts.some((p) => p.sku === sku);

  return (
    <div className="flex min-h-0 flex-1 flex-col space-y-4">
      {/* Search Input */}
      <div ref={containerRef} className="relative">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
            placeholder="Search products by name or SKU..."
            className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 pr-10 text-sm text-black shadow-sm transition-colors focus:border-[#8fc31f] focus:outline-none focus:ring-2 focus:ring-[#8fc31f]/20"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-300 border-t-[#8fc31f]"></div>
            </div>
          )}
          {!isSearching && query && (
            <button
              onClick={() => {
                setQuery("");
                setSearchResults([]);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showResults && (searchResults.length > 0 || (query && !isSearching)) && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-80 overflow-auto rounded-lg border border-neutral-200 bg-white shadow-lg">
            {searchResults.length === 0 && query && !isSearching ? (
              <div className="px-4 py-3 text-sm text-neutral-500">
                No products found for &ldquo;{query}&rdquo;
              </div>
            ) : (
              <ul className="divide-y divide-neutral-100">
                {searchResults.map((product) => (
                  <li key={product.id}>
                    <button
                      onClick={() => addProduct(product)}
                      disabled={isSelected(product.sku || "")}
                      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                        isSelected(product.sku || "")
                          ? "bg-[#8fc31f]/10 cursor-not-allowed"
                          : "hover:bg-neutral-50"
                      }`}
                    >
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="h-10 w-10 rounded object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded bg-neutral-100">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-neutral-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                            />
                          </svg>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-800 truncate">
                          {product.name || "Unknown Product"}
                        </p>
                        <p className="text-xs text-neutral-500">{product.sku}</p>
                      </div>
                      {isSelected(product.sku || "") && (
                        <span className="shrink-0 rounded-full bg-[#8fc31f] px-2 py-0.5 text-xs font-medium text-white">
                          Added
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Selected Products */}
      <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-4">
        <h3 className="mb-3 text-sm font-medium text-neutral-600">
          Context Products ({selectedProducts.length})
        </h3>
        {selectedProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10 text-neutral-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <p className="mt-2 text-sm text-neutral-500">
              No products selected yet.
            </p>
            <p className="text-xs text-neutral-400">
              Search and add products to simulate a user context.
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {selectedProducts.map((product) => (
              <ProductChip
                key={product.sku}
                product={product}
                onRemove={() => removeProduct(product.sku || "")}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
