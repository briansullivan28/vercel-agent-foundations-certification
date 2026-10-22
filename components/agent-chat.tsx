
"use client";

import { useChat } from "@ai-sdk/react";

import {
  WorkflowChatTransport,
} from "@ai-sdk/workflow/client";

import { useMemo, useState } from "react";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";

import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";

import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";

import type {
  ShoppingAgentUIMessage,
} from "@/lib/agent";

import {
  AgentProductList,
} from "@/components/agent-product-list";

import {
  AgentProductCard,
} from "@/components/agent-product-card";

export function AgentChat() {
  const [input, setInput] = useState("");

  // Retrieve an active workflow ID after a refresh.
  const activeRunId = useMemo(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    return (
      localStorage.getItem("active-workflow-run-id") ??
      undefined
    );
  }, []);

  // Configure the workflow-aware chat transport.
  const transport = useMemo(
    () =>
      new WorkflowChatTransport({
        api: "/api/chat",

        // Save the workflow ID when a new message starts.
        onChatSendMessage: (response) => {
          const runId = response.headers.get(
            "x-workflow-run-id"
          );

          if (runId) {
            localStorage.setItem(
              "active-workflow-run-id",
              runId
            );
          }
        },

        // Clear the stored ID when the stream ends.
        onChatEnd: () => {
          localStorage.removeItem(
            "active-workflow-run-id"
          );
        },

        // Reconnect to the existing workflow stream.
        prepareReconnectToStreamRequest: ({
          api,
          ...rest
        }) => {
          const runId = localStorage.getItem(
            "active-workflow-run-id"
          );

          if (!runId) {
            throw new Error(
              "No active workflow run ID found"
            );
          }

          return {
            ...rest,
            api: `/api/chat/${encodeURIComponent(
              runId
            )}/stream`,
          };
        },
      }),
    []
  );

  // Use the workflow-aware transport.
  const {
    messages,
    error,
    sendMessage,
    status,
  } = useChat<ShoppingAgentUIMessage>({
    resume: Boolean(activeRunId),
    transport,
  });

  // Send the user's message.
  const handleSubmit = () => {
    const text = input.trim();

    if (!text) return;

    sendMessage({ text });
    setInput("");
  };

  return (
    <div className="flex h-full min-h-0 flex-col">

      <Conversation className="flex-1">
        <ConversationContent>

          {messages.map((message) =>
            message.parts.map((part, index) => {
              switch (part.type) {

                // Regular text messages.
                case "text":
                  return (
                    <Message
                      key={`${message.id}-${index}`}
                      from={message.role}
                    >
                      <MessageContent>
                        <MessageResponse>
                          {part.text}
                        </MessageResponse>
                      </MessageContent>
                    </Message>
                  );

                // Product search results.
                case "tool-searchProducts":
                  return (
                    <AgentProductList
                      key={`${message.id}-${index}`}
                      invocation={part}
                    />
                  );

                // Detailed product cards.
                case "tool-getProductDetails":
                  return (
                    <AgentProductCard
                      key={`${message.id}-${index}`}
                      invocation={part}
                    />
                  );

                default:
                  return null;
              }
            })
          )}

        </ConversationContent>

        <ConversationScrollButton />
      </Conversation>

      {/* Display errors without hiding the conversation. */}
      {error && (
        <div className="px-4 py-2 text-sm text-red-500">
          Error: {error.message}
        </div>
      )}

      {/* Chat input */}
      <div className="border-t p-3">
        <PromptInput onSubmit={handleSubmit}>
          <PromptInputBody>

            <PromptInputTextarea
              value={input}
              onChange={(e) =>
                setInput(e.currentTarget.value)
              }
              placeholder="Ask the agent"
            />

          </PromptInputBody>

          <PromptInputFooter>
            <PromptInputTools />

            <PromptInputSubmit
              status={status}
              disabled={
                !input.trim() ||
                status === "submitted" ||
                status === "streaming"
              }
            />
          </PromptInputFooter>

        </PromptInput>
      </div>

    </div>
  );
}
