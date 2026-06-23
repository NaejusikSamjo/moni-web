import { API_BASE_URL } from "@/shared/config/env";
import { ApiException } from "@/shared/api/types";
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from "@/shared/lib/token";

interface GlobalResponse<T> {
  status: number;
  message: string;
  data?: T;
  errors?: { errorClassName: string; message: string };
}

async function tryRefresh(): Promise<boolean> {
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        "X-Refresh-Token": refreshToken,
      },
    });
    if (!res.ok) return false;
    const body: GlobalResponse<{ accessToken: string; refreshToken: string }> = await res.json();
    if (!body.data) return false;
    setTokens(body.data.accessToken, body.data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

type RequestOptions = Omit<RequestInit, "headers"> & {
  headers?: Record<string, string>;
  skipAuth?: boolean;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { skipAuth = false, headers: extra = {}, ...rest } = options;
  const url = `${API_BASE_URL}${path}`;
  const accessToken = getAccessToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...extra,
  };

  if (!skipAuth && accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  let res = await fetch(url, { ...rest, headers });

  if (res.status === 401 && !skipAuth) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      headers["Authorization"] = `Bearer ${getAccessToken()!}`;
      res = await fetch(url, { ...rest, headers });
    } else {
      clearTokens();
      if (typeof window !== "undefined") window.location.href = "/auth/login";
      throw new ApiException("AUTH-001", "인증이 필요합니다.", 401);
    }
  }

  if (res.status === 204) return undefined as T;

  const body: GlobalResponse<T> = await res.json();

  if (!res.ok) {
    throw new ApiException(
      body.errors?.errorClassName ?? "UNKNOWN",
      body.message ?? "알 수 없는 오류가 발생했습니다.",
      res.status,
    );
  }

  return body.data as T;
}
