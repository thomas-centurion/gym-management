import { apiRequest } from "./api.service";

export interface LoginData {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    role: "admin" | "member";
  };
  token: string;
}

export const login = async (
  data: LoginData,
): Promise<LoginResponse> => apiRequest<LoginResponse>("/auth/login", { method: "POST", body: data });

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export const register = async (data: RegisterData): Promise<void> => {
  await apiRequest<unknown>("/auth/register", { method: "POST", body: data });
};
