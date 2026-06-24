import { apiRequest } from "@/shared/api/instance";
import { setTokens, clearTokens, getAccessToken, getRefreshToken } from "@/shared/lib/token";
import type {
  SignupRequest,
  SignupResponse,
  LoginRequest,
  LoginResponse,
  SocialLoginUrlRequest,
  SocialLoginUrlResponse,
  SocialLoginRequest,
} from "@/features/auth/model/types";

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
};
