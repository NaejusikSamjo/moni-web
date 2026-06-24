export type UserRole = "USER";
export type UserStatus = "ACTIVE" | "SUSPENDED" | "DELETED";
export type TendencyType = "AGGRESSIVE" | "ACTIVE" | "NEUTRAL" | "STABLE" | "SAFE";
export type OAuthProvider = "GOOGLE" | "KAKAO";

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  nickname: string;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  provider?: OAuthProvider | null;
  createdAt: string;
}

export interface TendencyResponse {
  id: string;
  score: number;
  type: TendencyType;
}

export interface InterestResponse {
  id: string;
  category: string;
}

export interface WatchlistResponse {
  id: string;
  stockCode: string;
}
