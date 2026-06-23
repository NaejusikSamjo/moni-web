const OAUTH_PENDING_KEY = "oauth_pending";

function toBase64Url(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

export function generateCodeVerifier(): string {
  const array = new Uint8Array(96);
  crypto.getRandomValues(array);
  return toBase64Url(array.buffer);
}

export async function generateCodeChallenge(codeVerifier: string): Promise<string> {
  const data = new TextEncoder().encode(codeVerifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return toBase64Url(digest);
}

export function generateState(): string {
  const array = new Uint8Array(24);
  crypto.getRandomValues(array);
  return toBase64Url(array.buffer);
}

export function savePendingOAuth(data: { codeVerifier: string; state: string }): void {
  sessionStorage.setItem(OAUTH_PENDING_KEY, JSON.stringify(data));
}

export function getPendingOAuth(): { codeVerifier: string; state: string } | null {
  const raw = sessionStorage.getItem(OAUTH_PENDING_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearPendingOAuth(): void {
  sessionStorage.removeItem(OAUTH_PENDING_KEY);
}
