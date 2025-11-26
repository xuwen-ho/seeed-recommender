"use client";

import { TypesenseProduct } from "@/lib/typesense";

interface ProductChipProps {
  product: TypesenseProduct;
  onRemove?: () => void;
  showRemove?: boolean;
}

/**
 * A chip/tag component displaying product info.
 * Shows product name and SKU with optional remove button.
 */
export default function ProductChip({
  product,
  onRemove,
  showRemove = true,
}: ProductChipProps) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[#8fc31f] bg-[#8fc31f]/10 px-3 py-1.5 text-sm">
      {product.image_url && (
        <img
          src={product.image_url}
          alt={product.name || product.sku}
          className="h-6 w-6 rounded-full object-cover"
        />
      )}
      <div className="flex flex-col leading-tight">
        <span className="font-medium text-neutral-800 truncate max-w-[180px]">
          {product.name || "Unknown Product"}
        </span>
        <span className="text-xs text-neutral-500">{product.sku}</span>
      </div>
      {showRemove && onRemove && (
        <button
          onClick={onRemove}
          className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-neutral-200 text-neutral-600 hover:bg-red-100 hover:text-red-600 transition-colors"
          aria-label="Remove product"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3 w-3"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
