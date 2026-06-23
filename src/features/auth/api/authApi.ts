import { apiRequest } from "@/shared/api/instance";
import { ApiException } from "@/shared/api/types";
import { setTokens, clearTokens, getAccessToken, getRefreshToken } from "@/shared/lib/token";
import type {
  SignupRequest,
  SignupResponse,
  LoginRequest,
  LoginResponse,
  SocialLoginUrlRequest,
  SocialLoginUrlResponse,
  SocialLoginRequest,
  TendencyRequest,
  InterestRequest,
  UserUpdateRequest,
} from "@/features/auth/model/types";
import type { UserResponse, TendencyResponse, InterestResponse, WatchlistResponse } from "@/entities/user";

export const authApi = {
  signup: (data: SignupRequest): Promise<SignupResponse> =>
    apiRequest("/api/v1/auth/signup", {
      method: "POST",
      body: JSON.stringify(data),
      skipAuth: true,
    }),

  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const res = await apiRequest<LoginResponse>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
      skipAuth: true,
    });
    setTokens(res.accessToken, res.refreshToken);
    return res;
  },

  logout: async (): Promise<void> => {
    const accessToken = getAccessToken();
    const refreshToken = getRefreshToken();
    if (accessToken && refreshToken) {
      await apiRequest("/api/v1/auth/logout", {
        method: "POST",
        headers: { "X-Refresh-Token": refreshToken },
      }).catch(() => {});
    }
    clearTokens();
  },

  getSocialLoginUrl: (data: SocialLoginUrlRequest): Promise<SocialLoginUrlResponse> =>
    apiRequest("/api/v1/auth/social/login-url", {
      method: "POST",
      body: JSON.stringify(data),
      skipAuth: true,
    }),

  socialLogin: async (data: SocialLoginRequest): Promise<LoginResponse> => {
    const res = await apiRequest<LoginResponse>("/api/v1/auth/social/login", {
      method: "POST",
      body: JSON.stringify(data),
      skipAuth: true,
    });
    setTokens(res.accessToken, res.refreshToken);
    return res;
  },

  getMe: (): Promise<UserResponse> =>
    apiRequest("/api/v1/users/me"),

  updateMe: (data: UserUpdateRequest): Promise<UserResponse> =>
    apiRequest("/api/v1/users/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  saveTendency: async (data: TendencyRequest): Promise<TendencyResponse> => {
    try {
      return await apiRequest<TendencyResponse>("/api/v1/users/me/tendency", {
        method: "POST",
        body: JSON.stringify(data),
      });
    } catch (err) {
      // 409: 이미 성향 존재 → 기존 데이터 반환하고 진행
      if (err instanceof ApiException && err.status === 409) {
        return apiRequest<TendencyResponse>("/api/v1/users/me/tendency");
      }
      throw err;
    }
  },

  saveInterests: (data: InterestRequest): Promise<InterestResponse[]> =>
    apiRequest("/api/v1/users/me/interests", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getTendency: (): Promise<TendencyResponse> =>
    apiRequest("/api/v1/users/me/tendency"),

  addWatchlist: (stockCode: string): Promise<WatchlistResponse> =>
    apiRequest(`/api/v1/users/me/watchlist/${stockCode}`, {
      method: "PUT",
    }),
};
