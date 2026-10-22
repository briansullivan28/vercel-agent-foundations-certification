
"use client";

import Image from "next/image";
import Link from "next/link";

import { formatPrice } from "@/lib/format";

import type {
  ProductDetailsToolInvocation,
} from "@/lib/agent";

interface AgentProductCardProps {
  invocation: ProductDetailsToolInvocation;
}

export function AgentProductCard({
  invocation,
}: AgentProductCardProps) {

  // Display loading state.
  if (
    invocation.state === "input-streaming" ||
    invocation.state === "input-available"
  ) {
    const productId = invocation.input?.productId;

    return (
      <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
        Looking up product
        {productId ? ` "${productId}"` : ""}...
      </div>
    );
  }

  // Wait for the completed tool result.
  if (invocation.state !== "output-available") {
    return null;
  }

  const output = invocation.output;

  if (!output) {
    return null;
  }

  // Handle API errors.
  if ("error" in output) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        {output.error}
      </div>
    );
  }

  const image = output.images[0];

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">

      {image && (
        <div className="relative aspect-[4/3] bg-secondary">
          <Image
            src={image}
            alt={output.name}
            fill
            sizes="(min-width: 768px) 480px, 100vw"
            className="object-cover"
          />
        </div>
      )}

      <div className="space-y-3 p-4">

        <div>
          <h3 className="text-lg font-semibold">
            {output.name}
          </h3>

          <p className="text-base font-medium">
            {formatPrice(
              output.price,
              output.currency
            )}
          </p>
        </div>

        <p className="text-sm text-muted-foreground">
          {output.description}
        </p>

        {/* Inventory information */}
        <div className="flex items-center gap-2">

          {output.inStock ? (
            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
              In Stock ({output.stock})
            </span>
          ) : (
            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800">
              Out of Stock
            </span>
          )}

          {output.lowStock && output.inStock && (
            <span className="text-xs text-orange-600">
              Low stock
            </span>
          )}

        </div>

        {/* Product tags */}
        {output.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">

            {output.tags.slice(0, 5).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-secondary px-2 py-1 text-xs text-muted-foreground"
              >
                {tag}
              </span>
            ))}

          </div>
        )}

        {/* Product page link */}
        <Link
          href={`/products/${output.slug}`}
          className="inline-flex text-sm font-medium underline-offset-4 hover:underline"
        >
          View Product →
        </Link>

      </div>
    </div>
  );
}
