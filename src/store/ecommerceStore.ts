import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { api } from "@/lib/api";
import type { AxiosError } from "axios";

export interface Product {
  id: string;
  name: string;
  slug: string;
  price: string;
  stock: number;
  images: string[];

  category?: string;
  business?: string;
  seller?: string;
  status?: "pending" | "approved" | "rejected" | "archived";
  imageUrl?: string;
  subcategory?: string;
  unit?: string;
  stockQuantity?: number;
  image?: string;
  sellerInfo?: {
    sellerName: string;
    businessName: string;
    contactNumber: string;
    businessAddress: string;
  };
  description?: string;
  submittedAt?: string;
  rejectReason?: string;
}

// API Response structure from backend
interface ProductsApiResponse {
  success: boolean;
  statusCode: number;
  data: {
    data: Product[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
  timestamp: string;
  path: string;
  correlationId: string;
}

// Normalized pagination metadata
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Query parameters for product fetching
export interface ProductQueryParams {
  page?: number; // Default: 1
  limit?: number; // Default: 10
  search?: string;
  categoryId?: string;
  category?: string;
  status?: "ACTIVE" | "INACTIVE" | "PENDING";
  sortBy?: string; // e.g., "price", "name", "createdAt"
  sortOrder?: "asc" | "desc";
  isFeatured?: boolean;
  minPrice?: number;
  maxPrice?: number;
}

interface EcommerceState {
  // Product data
  products: Product[];
  productsMeta: PaginationMeta | null;
  selectedProduct: Product | null;

  // Loading states (keyed by operation)
  loading: {
    products?: boolean;
    product?: boolean;
  };

  // Error states (keyed by operation)
  error: {
    products?: string | null;
    product?: string | null;
  };

  // Actions
  fetchProducts: (params?: ProductQueryParams) => Promise<void>;
  clearProducts: () => void;
  setSelectedProduct: (product: Product | null) => void;
}

export const useEcommerceStore = create<EcommerceState>()(
  devtools(
    (set, get) => ({
      // Initial state
      products: [],
      productsMeta: null,
      selectedProduct: null,
      loading: {},
      error: {},

      fetchProducts: async (params?: ProductQueryParams) => {
        const operationKey = "products";

        // Set loading state
        set((state) => ({
          loading: { ...state.loading, [operationKey]: true },
          error: { ...state.error, [operationKey]: null },
        }));

        try {
          // Build query string from params
          const queryParams = new URLSearchParams();

          if (params?.page) queryParams.append("page", params.page.toString());
          if (params?.limit)
            queryParams.append("limit", params.limit.toString());
          if (params?.search) queryParams.append("search", params.search);
          if (params?.categoryId)
            queryParams.append("categoryId", params.categoryId);
          if (params?.category) queryParams.append("category", params.category);
          if (params?.status) queryParams.append("status", params.status);
          if (params?.sortBy) queryParams.append("sortBy", params.sortBy);
          if (params?.sortOrder)
            queryParams.append("sortOrder", params.sortOrder);
          if (params?.isFeatured !== undefined) {
            queryParams.append("isFeatured", params.isFeatured.toString());
          }
          if (params?.minPrice !== undefined) {
            queryParams.append("minPrice", params.minPrice.toString());
          }
          if (params?.maxPrice !== undefined) {
            queryParams.append("maxPrice", params.maxPrice.toString());
          }

          const queryString = queryParams.toString();
          const endpoint = queryString
            ? `v1/products?${queryString}`
            : "v1/products";

          // Make API call through proxy
          const response = await api.get<ProductsApiResponse>(endpoint);

          // Normalize response structure
          const { data: responseData } = response.data;

          // Update state with normalized data
          set({
            products: responseData.data,
            productsMeta: responseData.meta,
            loading: { ...get().loading, [operationKey]: false },
          });
        } catch (err) {
          const error = err as AxiosError<{ message?: string }>;
          const errorMessage =
            error.response?.data?.message ||
            error.message ||
            "Failed to fetch products";

          console.error("[EcommerceStore] fetchProducts error:", errorMessage);

          set((state) => ({
            loading: { ...state.loading, [operationKey]: false },
            error: { ...state.error, [operationKey]: errorMessage },
            products: [], // Clear products on error
            productsMeta: null,
          }));
        }
      },

      /**
       * Clear products state (useful for cleanup)
       */
      clearProducts: () => {
        set({
          products: [],
          productsMeta: null,
          error: { ...get().error, products: null },
        });
      },

      /**
       * Set selected product (for detail views)
       */
      setSelectedProduct: (product: Product | null) => {
        set({ selectedProduct: product });
      },
    }),
    { name: "EcommerceStore" }
  )
);
