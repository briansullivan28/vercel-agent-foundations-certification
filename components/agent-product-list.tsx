
"use client";

import Image from "next/image";
import Link from "next/link";

import { formatPrice } from "@/lib/format";

import type {
  SearchProductsToolInvocation,
} from "@/lib/agent";

interface AgentProductListProps {
  invocation: SearchProductsToolInvocation;
}

export function AgentProductList({
  invocation,
}: AgentProductListProps) {

  // Show a loading state while the tool runs.
  if (
    invocation.state === "input-streaming" ||
    invocation.state === "input-available"
  ) {
    const query = invocation.input?.query;

    return (
      <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
        Searching products
        {query ? ` for "${query}"` : ""}...
      </div>
    );
  }

  // Only render completed tool results.
  if (invocation.state !== "output-available") {
    return null;
  }

  const output = invocation.output;

  if (!output) {
    return null;
  }

  // Display API errors.
  if ("error" in output && output.error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        {output.error}
      </div>
    );
  }

  // No results to display.
  if (output.count === 0) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">

      <div className="border-b p-3">
        <h3 className="text-sm font-semibold">
          Products Found ({output.count})
        </h3>
      </div>

      <ul className="divide-y divide-border">
        {output.products.map((product) => (
          <li key={product.id}>

            <Link
              href={`/products/${product.slug}`}
              className="flex items-center gap-3 p-3 transition-colors hover:bg-secondary/50"
            >

              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-secondary">

                {product.image && (
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                )}

              </div>

              <div className="min-w-0 flex-1">

                <h3 className="truncate text-sm font-semibold">
                  {product.name}
                </h3>

                <p className="text-sm font-medium text-muted-foreground">
                  {formatPrice(
                    product.price,
                    product.currency
                  )}
                </p>

                {product.category && (
                  <p className="text-xs text-muted-foreground">
                    {product.category}
                  </p>
                )}

              </div>

              <span className="text-sm text-muted-foreground">
                →
              </span>

            </Link>

          </li>
        ))}
      </ul>

    </div>
  );
}
