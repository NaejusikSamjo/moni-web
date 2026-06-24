import type { OAuthProvider } from "@/entities/user";

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface SignupResponse {
  id: string;
  email: string;
  nickname: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

export interface SocialLoginUrlRequest {
  provider: OAuthProvider;
  codeChallenge: string;
  state: string;
}

export interface SocialLoginUrlResponse {
  loginUrl: string;
}

export interface SocialLoginRequest {
  provider: OAuthProvider;
  code: string;
  codeVerifier: string;
}

export interface TendencyRequest {
  score: number;
}

export interface InterestRequest {
  categories: string[];
}

export interface PendingOAuthData {
  provider: string;
  codeVerifier: string;
  state: string;
}

export interface UserUpdateRequest {
  name?: string;
  nickname?: string;
  phone?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
