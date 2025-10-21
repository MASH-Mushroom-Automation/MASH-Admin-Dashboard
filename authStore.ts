import { create } from "zustand";

interface AuthState {
  user: { id: string; name: string; email: string } | null;
  token: string | null;
  isLoggedIn: boolean;
  login: (
    user: { id: string; name: string; email: string },
    token: string
  ) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoggedIn: false,
  login: (user, token) =>
    set({
      user,
      token,
      isLoggedIn: true,
    }),
  logout: () =>
    set({
      user: null,
      token: null,
      isLoggedIn: false,
    }),
}));
