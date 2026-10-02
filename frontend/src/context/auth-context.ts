import { createContext } from "react";
import type { LoginData } from "../services/auth.service";

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  role: "admin" | "member";
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (data: LoginData) => Promise<User>;
  updateUser: (data: Pick<User, "firstName" | "lastName" | "email">) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
