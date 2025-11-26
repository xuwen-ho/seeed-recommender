"use client";

import { useState, useMemo } from "react";
import ContextBuilder from "@/components/simulator/ContextBuilder";
import RecResults from "@/components/simulator/RecResults";
import { TypesenseProduct } from "@/lib/typesense";

/**
 * Recommendation Simulator Page
 * 
 * A dashboard for internal staff to build a "User Context" (simulated cart)
 * and see AI-powered product recommendations.
 */
export default function SimulatorPage() {
  const [selectedProducts, setSelectedProducts] = useState<TypesenseProduct[]>(
    []
  );

  // Extract SKUs from selected products for the recommendation engine
  const inputSkus = useMemo(
    () =>
      selectedProducts
        .map((p) => p.sku)
        .filter((sku): sku is string => sku !== undefined && sku !== ""),
    [selectedProducts]
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-neutral-50">
      {/* Header */}
      <header className="shrink-0 border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#8fc31f]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">
                Recommendation Simulator
              </h1>
              <p className="text-sm text-neutral-500">
                Build a user context and see AI-powered product suggestions
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="min-h-0 flex-1 overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto grid h-full max-w-7xl gap-8 lg:grid-cols-2">
          {/* Left Panel: Context Builder */}
          <section className="flex min-h-0 flex-col">
            <div className="mb-4 flex shrink-0 items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#8fc31f]/10 text-[#8fc31f]">
                <span className="text-sm font-bold">1</span>
              </div>
              <h2 className="text-lg font-semibold text-neutral-800">
                Build User Context
              </h2>
            </div>
            <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
              <p className="mb-4 text-sm text-neutral-600">
                Search and add products to simulate a user&apos;s cart or browsing
                history. The recommendation engine will use this context to
                suggest related products.
              </p>
              <ContextBuilder
                selectedProducts={selectedProducts}
                onChange={setSelectedProducts}
              />
              {selectedProducts.length > 0 && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => setSelectedProducts([])}
                    className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Right Panel: Recommendations */}
          <section className="flex min-h-0 flex-col">
            <div className="mb-4 flex shrink-0 items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#8fc31f]/10 text-[#8fc31f]">
                <span className="text-sm font-bold">2</span>
              </div>
              <h2 className="text-lg font-semibold text-neutral-800">
                AI Recommendations
              </h2>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
              <RecResults inputSkus={inputSkus} />
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="shrink-0 border-t border-neutral-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs text-neutral-400">
            Seeed Studio • Internal Tool • Recommendation Engine Simulator
          </p>
        </div>
      </footer>
    </div>
  );
}
