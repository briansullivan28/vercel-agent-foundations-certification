
import { chatFlow } from "@/lib/workflows/chat-flow";

import {
  createModelCallToUIChunkTransform,
} from "@ai-sdk/workflow";

import {
  createUIMessageStreamResponse,
  type UIMessage,
} from "ai";

import { start } from "workflow/api";

export async function POST(req: Request) {
  // Read the conversation.
  const {
    messages,
  }: {
    messages: UIMessage[];
  } = await req.json();

  // Start the durable chat workflow.
  const run = await start(chatFlow, [messages]);

  // Transform workflow output into chat UI messages.
  const stream = run.readable.pipeThrough(
    createModelCallToUIChunkTransform()
  );

  // Return streamed messages with the run ID.
  return createUIMessageStreamResponse({
    stream,

    headers: {
      "x-workflow-run-id": run.runId,
    },
  });
}
