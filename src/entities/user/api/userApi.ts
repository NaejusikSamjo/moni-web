import { apiRequest } from "@/shared/api/instance";
import { ApiException } from "@/shared/api/types";
import type {
  TendencyRequest,
  InterestRequest,
  UserUpdateRequest,
  ChangePasswordRequest,
  UserResponse,
  TendencyResponse,
  InterestResponse,
  WatchlistResponse,
  PresignedUrlResponse,
} from "@/entities/user/model/types";

export const userApi = {
  getMe: (): Promise<UserResponse> =>
    apiRequest("/api/v1/users/me"),

  updateMe: (data: UserUpdateRequest): Promise<UserResponse> =>
    apiRequest("/api/v1/users/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  changePassword: (data: ChangePasswordRequest): Promise<void> =>
    apiRequest("/api/v1/users/me/password", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  integrate: (password: string): Promise<void> =>
    apiRequest("/api/v1/users/me/integrate", {
      method: "POST",
      body: JSON.stringify({ password }),
    }),

  deleteAccount: (password?: string): Promise<void> =>
    apiRequest("/api/v1/users/me", {
      method: "DELETE",
      ...(password !== undefined && {
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      }),
    }),

  saveTendency: async (data: TendencyRequest): Promise<TendencyResponse> => {
    try {
      return await apiRequest<TendencyResponse>("/api/v1/users/me/tendency", {
        method: "POST",
        body: JSON.stringify(data),
      });
    } catch (err) {
      if (err instanceof ApiException && err.status === 409) {
        return apiRequest<TendencyResponse>("/api/v1/users/me/tendency");
      }
      throw err;
    }
  },

  getTendency: (): Promise<TendencyResponse> =>
    apiRequest("/api/v1/users/me/tendency"),

  saveInterests: (data: InterestRequest): Promise<InterestResponse[]> =>
    apiRequest("/api/v1/users/me/interests", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getWatchlist: (): Promise<WatchlistResponse[]> =>
    apiRequest("/api/v1/users/me/watchlist"),

  addWatchlist: (stockCode: string): Promise<WatchlistResponse> =>
    apiRequest(`/api/v1/users/me/watchlist/${stockCode}`, {
      method: "PUT",
    }),

  removeWatchlist: (stockCode: string): Promise<void> =>
    apiRequest(`/api/v1/users/me/watchlist/${stockCode}`, {
      method: "DELETE",
    }),

  getPresignedUrl: (extension: string): Promise<PresignedUrlResponse> =>
    apiRequest(`/api/v1/users/me/profile/presigned-url?extension=${extension}`),

  uploadToS3: async (presignedUrl: string, file: File): Promise<void> => {
    const res = await fetch(presignedUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type },
    });
    if (!res.ok) throw new Error("이미지 업로드에 실패했습니다.");
  },

  updateProfile: (profile: string | null): Promise<UserResponse> =>
    apiRequest("/api/v1/users/me/profile", {
      method: "PATCH",
      body: JSON.stringify({ profile }),
    }),
};
