import { create } from "zustand";

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface AuthState {
  user: AuthUser | null;
  login: (user: AuthUser) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,

  login: (user: AuthUser) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_user", JSON.stringify(user));
    }
    set({ user });
  },

  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_user");
    }
    set({ user: null });
  },

  isAuthenticated: () => {
    return get().user !== null;
  },

  hydrate: async () => {
    if (typeof window === "undefined") return;

    // First, try loading cached user from localStorage for instant UI
    const userJson = localStorage.getItem("auth_user");
    if (userJson) {
      try {
        const user = JSON.parse(userJson) as AuthUser;
        set({ user });
      } catch {
        localStorage.removeItem("auth_user");
      }
    }

    // Then verify the session is still valid via cookie-based /auth/me
    try {
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
      const res = await fetch(`${API_URL}/auth/me`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        const user = data.user as AuthUser;
        localStorage.setItem("auth_user", JSON.stringify(user));
        set({ user });
      } else {
        // Cookie expired or invalid — clear state
        localStorage.removeItem("auth_user");
        set({ user: null });
      }
    } catch {
      // Network error — keep cached user if available (offline support)
    }
  },
}));
