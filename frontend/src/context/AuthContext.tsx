import { useState, type ReactNode } from "react";
import { login as loginRequest, type LoginData } from "../services/auth.service";
import { AuthContext, type User } from "./auth-context";

interface AuthProviderProps { children: ReactNode }

const readStoredAuth = (): { token: string | null; user: User | null } => {
  const token = localStorage.getItem("token");
  const storedUser = localStorage.getItem("user");
  if (!token || !storedUser) {
    if (token || storedUser) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    return { token: null, user: null };
  }
  try {
    const stored = JSON.parse(storedUser) as Partial<User>;
    if (
      typeof stored.id !== "number" ||
      typeof stored.firstName !== "string" ||
      typeof stored.lastName !== "string" ||
      typeof stored.email !== "string" ||
      (stored.role !== "admin" && stored.role !== "member")
    ) throw new Error("Sesión inválida");
    const user: User = {
      id: stored.id,
      firstName: stored.firstName,
      lastName: stored.lastName,
      email: stored.email,
      role: stored.role,
      name: `${stored.firstName} ${stored.lastName}`.trim(),
    };
    return { token, user };
  } catch {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return { token: null, user: null };
  }
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [auth, setAuth] = useState(readStoredAuth);

  const login = async (data: LoginData): Promise<User> => {
    const result = await loginRequest(data);
    const user: User = { ...result.user, name: `${result.user.firstName} ${result.user.lastName}`.trim() };
    localStorage.setItem("token", result.token);
    localStorage.setItem("user", JSON.stringify(user));
    setAuth({ token: result.token, user });
    return user;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setAuth({ token: null, user: null });
  };

  const updateUser = (data: Pick<User, "firstName" | "lastName" | "email">) => {
    if (!auth.user) return;
    const updatedUser = { ...auth.user, ...data, name: `${data.firstName} ${data.lastName}`.trim() };
    localStorage.setItem("user", JSON.stringify(updatedUser));
    setAuth((current) => ({ ...current, user: updatedUser }));
  };

  return <AuthContext.Provider value={{ ...auth, isAuthenticated: Boolean(auth.token), login, updateUser, logout }}>{children}</AuthContext.Provider>;
};
