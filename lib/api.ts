const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://api-gctb.onrender.com";
const GROK_API_URL = process.env.EXPO_PUBLIC_GROK_API_URL ?? "";
const CLIENT_API_KEY = process.env.EXPO_PUBLIC_VEYLOLA_API_KEY;

function headers() {
  return {
    "Content-Type": "application/json",
    ...(CLIENT_API_KEY ? { "x-veylola-api-key": CLIENT_API_KEY } : {}),
  };
}

async function request(base: string, path: string, body: Record<string, unknown>) {
  const res = await fetch(base + path, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error ?? "API request failed");
  return data;
}

export type AIResponse = {
  id?: string;
  response?: string;
  output?: unknown[];
  model?: string;
  usage?: unknown;
  citations?: unknown[];
  status?: string;
};

export function askAI(message: string, previousId?: string, options?: {
  webSearch?: boolean;
  xSearch?: boolean;
  codeExecution?: boolean;
  reasoningEffort?: "low" | "medium" | "high" | "xhigh";
}) {
  return request(API_BASE_URL, "/v1/responses", {
    input: message,
    ...(previousId ? { previous_response_id: previousId } : {}),
    ...(options?.webSearch ? { web_search: true } : {}),
    ...(options?.xSearch ? { x_search: true } : {}),
    ...(options?.codeExecution ? { code_execution: true } : {}),
    ...(options?.reasoningEffort ? { reasoning_effort: options.reasoningEffort } : {}),
  }) as Promise<AIResponse>;
}

export function askGrok(message: string, previousId?: string, options?: {
  webSearch?: boolean;
  xSearch?: boolean;
  codeExecution?: boolean;
  reasoningEffort?: "low" | "medium" | "high" | "xhigh";
}) {
  if (!GROK_API_URL) throw new Error("Grok API URL is not configured.");
  return request(GROK_API_URL, "/v1/grok/responses", {
    input: message,
    ...(previousId ? { previous_response_id: previousId } : {}),
    web_search: options?.webSearch ?? true,
    ...(options?.xSearch ? { x_search: true } : {}),
    ...(options?.codeExecution ? { code_execution: true } : {}),
    ...(options?.reasoningEffort ? { reasoning_effort: options.reasoningEffort } : {}),
  }) as Promise<AIResponse>;
}

export const generateImage = (prompt: string) =>
  request(API_BASE_URL, "/image", { prompt, size: "1024x1024", quality: "high" });

export const generateVideo = (prompt: string) =>
  request(API_BASE_URL, "/video", { prompt, seconds: 8, size: "720x1280" });

export const generateMusic = (prompt: string) =>
  request(API_BASE_URL, "/music", { prompt, duration: 30 });

export const generateGrokImage = (prompt: string) =>
  request(GROK_API_URL, "/grok/image", { prompt });

export const generateGrokVideo = (prompt: string) =>
  request(GROK_API_URL, "/grok/video", { prompt, generate_audio: true });

export const speakWithGrok = (text: string) =>
  request(GROK_API_URL, "/grok/tts", { text });

export async function uploadFile(uri: string, name = "upload", type = "application/octet-stream") {
  const form = new FormData();
  form.append("file", { uri, name, type } as unknown as Blob);
  const res = await fetch(API_BASE_URL + "/v1/files", {
    method: "POST",
    headers: CLIENT_API_KEY ? { "x-veylola-api-key": CLIENT_API_KEY } : undefined,
    body: form,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error ?? "File upload failed");
  return data;
}
