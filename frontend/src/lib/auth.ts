"use client";
import { api, setToken, clearToken } from "./api";
import type { User } from "@/types";

export async function login(email: string, password: string): Promise<string> {
  const data = await api<{ access_token: string }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setToken(data.access_token);
  return data.access_token;
}

export async function getMe(): Promise<User> {
  return api<User>("/auth/me");
}

export function logout() {
  clearToken();
  window.location.href = "/login";
}

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem("token");
}
