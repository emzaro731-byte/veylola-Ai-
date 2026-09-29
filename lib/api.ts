const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  "https://YOUR-SERVICE.onrender.com";

async function request(path: string, body: Record<string, unknown>) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? "API request failed");
  return data;
}

export const askAI = (message: string, previous_response_id?: string) =>
  request("/chat", {
    message,
    ...(previous_response_id ? { previous_response_id } : {}),
  });

export const generateImage = (prompt: string) =>
  request("/image", { prompt, size: "1024x1024", quality: "high" });

export const generateVideo = (prompt: string) =>
  request("/video", { prompt, seconds: 8, size: "720x1280" });

export const generateMusic = (prompt: string) =>
  request("/music", { prompt, duration: 30 });
