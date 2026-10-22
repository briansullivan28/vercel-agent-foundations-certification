
import { tool } from "ai";
import { z } from "zod";

import {
  ApiRequestError,
  getProducts,
  getCategories,
  getProductById,
  getProductStock,
} from "@/lib/api";

import { start } from "workflow/api";
import { returnFlow } from "@/lib/workflows/return-flow";

function errorMessage(error: unknown): string {
  return error instanceof ApiRequestError
    ? error.message
    : "An unexpected error occurred.";
}

// TOOL 1: Search products.
export const searchProducts = tool({
  description:
    "Search products in the Ship It Shop catalog. Use for broad searches, recommendations, and finding products by name. Use getAllCategories first when a category needs to be identified.",

  inputSchema: z.object({
    query: z
      .string()
      .optional()
      .describe("Search keywords, such as hoodie or hat."),

    category: z
      .string()
      .optional()
      .describe("Exact category slug from getAllCategories."),
  }),

  execute: async ({ query, category }) => {
    "use step";

    try {
      const products = await getProducts({
        search: query,
        category,
        limit: 10,
      });

      return {
        count: products.length,

        products: products.map((product) => ({
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description,
          price: product.price,
          currency: product.currency,
          category: product.category,
          image: product.images[0],
        })),
      };
    } catch (error) {
      return {
        count: 0,
        products: [],
        error: errorMessage(error),
      };
    }
  },
});

// TOOL 2: List product categories.
export const getAllCategories = tool({
  description:
    "Retrieve all available product categories and their product counts. Use when browsing or filtering products by category.",

  inputSchema: z.object({}),

  execute: async () => {
    "use step";

    try {
      const categories = await getCategories();

      return {
        count: categories.length,

        categories: categories.map((category) => ({
          slug: category.slug,
          name: category.name,
          productCount: category.productCount,
        })),
      };
    } catch (error) {
      return {
        count: 0,
        categories: [],
        error: errorMessage(error),
      };
    }
  },
});

// TOOL 3: Retrieve product details.
export const getProductDetails = tool({
  description:
    "Retrieve detailed information for a specific product, including images, price, tags, and live stock availability. Use a product ID or slug from searchProducts.",

  inputSchema: z.object({
    productId: z
      .string()
      .describe("The exact product ID or slug."),
  }),

  execute: async ({ productId }) => {
    "use step";

    try {
      const product = await getProductById(productId);
      const inventory = await getProductStock(product.id);

      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: product.price,
        currency: product.currency,
        category: product.category,
        images: product.images,
        tags: product.tags,
        featured: product.featured,
        stock: inventory.stock,
        inStock: inventory.inStock,
        lowStock: inventory.lowStock,
      };
    } catch (error) {
      return {
        error: errorMessage(error),
      };
    }
  },
});

// TOOL 4: Start a durable return workflow.
export const returnOrder = tool({
  description:
    "Start a return workflow for a customer order. Requires the order ID, reason, and explicit customer confirmation before execution. A queued return is not yet completed.",

  inputSchema: z.object({
    orderId: z
      .string()
      .describe("The order ID to return."),

    reason: z
      .string()
      .min(10)
      .max(500)
      .describe("The customer's reason for the return."),
  }),

  execute: async ({ orderId, reason }) => {
    "use step";

    // Start the workflow without waiting for completion.
    const run = await start(returnFlow, [
      orderId,
      reason,
    ]);

    return {
      runId: run.runId,
      message:
        `Return request received for order ${orderId}. ` +
        "Processing has started.",
    };
  },
});
