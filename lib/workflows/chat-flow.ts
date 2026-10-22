
import {
  WorkflowAgent,
  type ModelCallStreamPart,
} from "@ai-sdk/workflow";

import { getWritable } from "workflow";

import {
  convertToModelMessages,
  type UIMessage,
} from "ai";

import {
  searchProducts,
  getAllCategories,
  getProductDetails,
  returnOrder,
} from "@/lib/tools";

export async function chatFlow(
  messages: UIMessage[]
) {
  "use workflow";

  // Convert UI messages into AI model messages.
  const modelMessages =
    await convertToModelMessages(messages);

  // Create the durable AI agent.
  const agent = new WorkflowAgent({
    model: "anthropic/claude-sonnet-5",

    instructions: `
      You are a friendly, professional shopping assistant
      for Ship It Shop, the Vercel swag store.

      PRODUCT SEARCH:
      - Help customers discover and compare products.
      - Use searchProducts to retrieve real catalog data.
      - Never invent products, descriptions, or prices.

      CATEGORIES:
      - Use getAllCategories when customers ask what
        product categories are available.
      - Use valid category slugs for category searches.

      PRODUCT DETAILS:
      - Use getProductDetails when customers want
        more information about a particular item.
      - Look up the product first if its ID is unknown.
      - Use actual inventory data to discuss stock.

      RETURNS:
      - Use returnOrder to start customer returns.
      - Ask for the order ID and return reason.
      - Confirm the customer's intention before
        submitting the return.
      - The return tool starts a background workflow.
      - A workflow starting does not mean the return
        is fully completed.
      - Never claim success until it is confirmed.

      PRICING:
      - Product prices are stored in integer cents.
      - Convert them into dollars when displaying USD.

      COMMUNICATION:
      - Be concise, helpful, and conversational.
      - Ask clarification questions when needed.
      - Focus on shopping and customer support.
    `,

    tools: {
      searchProducts,
      getAllCategories,
      getProductDetails,
      returnOrder,
    },
  });

  // Stream the agent response through the workflow.
  await agent.stream({
    messages: modelMessages,
    writable: getWritable<ModelCallStreamPart>(),
  });
}
