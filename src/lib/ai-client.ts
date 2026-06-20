/**
 * AI Gateway client — OpenAI-compatible API
 * Endpoint: ai.sumopod.com
 * Model: gemini/gemini-2.5-flash-lite (default, fast & capable)
 */

import type { CvUiLang } from "./cv-translations";
import { getSystemPrompt } from "./cv-prompts";

const AI_GATEWAY_URL = process.env.AI_GATEWAY_URL || "https://ai.sumopod.com/v1/chat/completions";
const AI_API_KEY = process.env.AI_API_KEY || "";

export interface AiMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AiCompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
  language?: CvUiLang;
}

export async function aiComplete(
  messages: AiMessage[],
  options: AiCompletionOptions = {},
): Promise<string> {
  const {
    model = "gemini/gemini-2.5-flash-lite",
    temperature = 0.7,
    maxTokens = 2048,
    jsonMode = false,
    language = "id",
  } = options;

  if (!AI_API_KEY) {
    throw new Error("AI_API_KEY tidak dikonfigurasi. Tambahkan di environment variables.");
  }

  const allMessages: AiMessage[] = [
    { role: "system", content: getSystemPrompt(language) },
    ...messages,
  ];

  const body: Record<string, unknown> = {
    model,
    messages: allMessages,
    temperature,
    max_tokens: maxTokens,
  };

  if (jsonMode) {
    body.response_format = { type: "json_object" };
  }

  const res = await fetch(AI_GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${AI_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`AI Gateway error (${res.status}): ${errText.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    choices: { message: { content: string } }[];
    usage?: { total_tokens?: number };
  };

  const content = data.choices?.[0]?.message?.content ?? "";
  return content;
}

export async function aiCompleteStream(
  messages: AiMessage[],
  options: AiCompletionOptions = {},
): Promise<ReadableStream<Uint8Array>> {
  const {
    model = "gemini/gemini-2.5-flash-lite",
    temperature = 0.7,
    maxTokens = 2048,
    language = "id",
  } = options;

  if (!AI_API_KEY) {
    throw new Error("AI_API_KEY tidak dikonfigurasi. Tambahkan di environment variables.");
  }

  const allMessages: AiMessage[] = [
    { role: "system", content: getSystemPrompt(language) },
    ...messages,
  ];

  const res = await fetch(AI_GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${AI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: allMessages,
      temperature,
      max_tokens: maxTokens,
      stream: true,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`AI Gateway stream error (${res.status}): ${errText.slice(0, 300)}`);
  }

  return res.body!;
}
