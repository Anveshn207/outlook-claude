import { create } from "zustand";

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "success" | "error" | "warning";
}

interface ToastStore {
  toasts: Toast[];
  toast: (t: Omit<Toast, "id">) => void;
  dismiss: (id: string) => void;
}

export const useToast = create<ToastStore>((set) => ({
  toasts: [],
  toast: (t) => {
    const id = Math.random().toString(36).slice(2);
    set((s) => ({ toasts: [...s.toasts, { ...t, id }] }));
    // Auto-clear after 5s
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) }));
    }, 5000);
  },
  dismiss: (id) =>
    set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}));
