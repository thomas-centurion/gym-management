export type Role = "admin" | "member";

export interface AuthPayload {
  id: number;
  role: Role;
}