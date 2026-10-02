import { apiRequest } from "./api.service";

export interface MemberProfile {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: "member" | "admin";
}

export type AdminUser = MemberProfile;

export const getMyProfile = (token: string, userId: number) => apiRequest<MemberProfile>(`/users/${userId}`, { token });

export const updateMyProfile = (token: string, userId: number, data: Pick<MemberProfile, "first_name" | "last_name" | "email">) =>
  apiRequest<MemberProfile>(`/users/${userId}`, { token, method: "PUT", body: { firstName: data.first_name, lastName: data.last_name, email: data.email } });

export const getUsers = (token: string) => apiRequest<AdminUser[]>("/users", { token });
export const createUser = (token: string, data: { firstName: string; lastName: string; email: string; password: string }) => apiRequest<AdminUser>("/users", { token, method: "POST", body: data });
export const updateUser = (token: string, id: number, data: { firstName: string; lastName: string; email: string }) => apiRequest<AdminUser>(`/users/${id}`, { token, method: "PUT", body: data });
export const deleteUser = (token: string, id: number) => apiRequest<{ message: string }>(`/users/${id}`, { token, method: "DELETE" });
