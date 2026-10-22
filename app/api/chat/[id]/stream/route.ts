
import {
  createModelCallToUIChunkTransform,
} from "@ai-sdk/workflow";

import {
  createUIMessageStreamResponse,
} from "ai";

import { getRun } from "workflow/api";

export async function GET(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {
  // Get the workflow run ID from the URL.
  const { id } = await params;

  // Get the resume position requested by the client.
  const { searchParams } = new URL(request.url);

  const startIndexParam =
    searchParams.get("startIndex");

  const uiStartIndex = startIndexParam
    ? parseInt(startIndexParam, 10)
    : 0;

  // Find the existing workflow.
  const run = await getRun(id);

  // Resume reading its output stream.
  const readable = run
    .getReadable({ startIndex: 0 })
    .pipeThrough(
      createModelCallToUIChunkTransform({
        uiStartIndex,
      })
    );

  // Stream the output back to the browser.
  return createUIMessageStreamResponse({
    stream: readable,
  });
}
