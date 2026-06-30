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

  deleteAccount: (): Promise<void> =>
    apiRequest("/api/v1/users/me", {
      method: "DELETE",
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
};
