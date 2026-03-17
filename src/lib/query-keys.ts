export const queryKeys = {
  // Domain-specific keys
  dashboard: {
    overview: ["dashboard", "overview"] as const,
    stats: ["dashboard", "stats"] as const,
  },
  devices: {
    all: ["devices"] as const,
    lists: () => [...queryKeys.devices.all, "list"] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.devices.lists(), { filters }] as const,
    details: () => [...queryKeys.devices.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.devices.details(), id] as const,
  },
  products: {
    all: ["products"] as const,
    lists: () => [...queryKeys.products.all, "list"] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.products.lists(), { filters }] as const,
    details: () => [...queryKeys.products.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.products.details(), id] as const,
  },
  users: {
    all: ["users"] as const,
    lists: () => [...queryKeys.users.all, "list"] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.users.lists(), { filters }] as const,
    details: () => [...queryKeys.users.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
  },
  sellers: {
    all: ["sellers"] as const,
    lists: () => [...queryKeys.sellers.all, "list"] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.sellers.lists(), { filters }] as const,
    details: () => [...queryKeys.sellers.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.sellers.details(), id] as const,
  },
  orders: {
    all: ["orders"] as const,
    lists: () => [...queryKeys.orders.all, "list"] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.orders.lists(), { filters }] as const,
  },
};
