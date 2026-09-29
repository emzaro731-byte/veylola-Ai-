const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://api-gctb.onrender.com";
const CLIENT_API_KEY = process.env.EXPO_PUBLIC_VEYLOLA_API_KEY;

function headers(extra: Record<string,string> = {}) {
  return {
    "Content-Type": "application/json",
    ...(CLIENT_API_KEY ? { "x-veylola-api-key": CLIENT_API_KEY } : {}),
    ...extra,
  };
}

async function request(path: string, body: Record<string, unknown>) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
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
  status?: string;
};

export function askAI(message: string, previous_response_id?: string, options?: { webSearch?: boolean; vectorStoreIds?: string[] }) {
  return request("/v1/responses", {
    input: message,
    ...(previous_response_id ? { previous_response_id } : {}),
    ...(options?.webSearch ? { web_search: true } : {}),
    ...(options?.vectorStoreIds?.length ? { vector_store_ids: options.vectorStoreIds } : {}),
  }) as Promise<AIResponse>;
}

export const generateImage = (prompt: string) =>
  request("/image", { prompt, size: "1024x1024", quality: "high" });

export const generateVideo = (prompt: string) =>
  request("/video", { prompt, seconds: 8, size: "720x1280" });

export const generateMusic = (prompt: string) =>
  request("/music", { prompt, duration: 30 });

export async function uploadFile(uri: string, name = "upload", type = "application/octet-stream") {
  const form = new FormData();
  form.append("file", { uri, name, type } as unknown as Blob);
  const res = await fetch(`${API_BASE_URL}/v1/files`, {
    method: "POST",
    headers: CLIENT_API_KEY ? { "x-veylola-api-key": CLIENT_API_KEY } : undefined,
    body: form,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error ?? "File upload failed");
  return data;
}
