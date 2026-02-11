import { create } from "zustand";

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,

  login: (token: string, user: AuthUser) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_token", token);
      localStorage.setItem("auth_user", JSON.stringify(user));
    }
    set({ token, user });
  },

  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
    }
    set({ token: null, user: null });
  },

  isAuthenticated: () => {
    return get().token !== null;
  },

  hydrate: () => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("auth_token");
      const userJson = localStorage.getItem("auth_user");
      let user: AuthUser | null = null;
      if (userJson) {
        try {
          user = JSON.parse(userJson) as AuthUser;
        } catch {
          user = null;
        }
      }
      set({ token, user });
    }
  },
}));
