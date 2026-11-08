import type { ImageChoice } from "./types";
export async function request<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(url, options);
  if (response.status === 204 && response.ok) return undefined as T;
  const data = await response
    .json()
    .catch(() => ({ error: "Não foi possível concluir. Tente novamente." }));
  if (!response.ok)
    throw new Error(
      data.error ?? "Não foi possível concluir. Tente novamente.",
    );
  return data as T;
}
export function json(method: string, data: unknown): RequestInit {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  };
}
export async function upload(file: File): Promise<ImageChoice> {
  if (file.size > 10 * 1024 * 1024)
    throw new Error("Cada foto deve ter até 10 MB.");
  if (
    !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)
  )
    throw new Error("Use fotos JPG, PNG, WebP ou GIF.");
  const form = new FormData();
  form.set("file", file);
  const result = await request<{ url: string }>("/api/uploads", {
    method: "POST",
    body: form,
  });
  return { url: result.url, credit: null };
}
export function message(e: unknown) {
  return e instanceof Error
    ? e.message
    : "Não foi possível concluir. Tente novamente.";
}
