"use client";

import { createContext, useContext } from "react";
import type { User } from "./types";

export interface AuthState {
  user: User | null;
  token: string | null;
  /** true khi store đang hydrate từ localStorage. */
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  setUser: (user: User) => void;
}

export const AuthContext = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth phải được dùng bên trong <Providers>");
  return ctx;
}
