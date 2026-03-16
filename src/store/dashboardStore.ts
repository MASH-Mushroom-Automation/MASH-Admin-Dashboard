import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface DashboardState {
  // Global UI state can go here in the future
  // For now, it's empty as all server state has moved to TanStack Query
}

export const useDashboardStore = create<DashboardState>()(
  devtools((set, get) => ({})),
);
