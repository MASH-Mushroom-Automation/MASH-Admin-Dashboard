// API Response Type Definitions

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface ApiError {
  statusCode: number
  message: string
  error: string
}

// Authentication Types
export interface LoginResponse {
  success: boolean
  message: string
  accessToken: string
  refreshToken: string
  expiresIn: number
  tokenType: 'Bearer'
  user: User
  session: {
    id: string
    expiresAt: string
    createdAt: string
  }
}

export interface RegisterResponse {
  success: boolean
  message: string
  user: User
  verification: {
    sent: boolean
    expiresIn: string
    email: string
  }
  nextStep: string
}

export interface VerifyEmailResponse {
  success: boolean
  message: string
  user: {
    id: string
    email: string
    emailVerified: boolean
    verifiedAt: string
  }
  nextStep: string
}

export interface ForgotPasswordResponse {
  success: boolean
  message: string
  expiresIn: string
  email: string
  nextStep: string
}

// User Types
export interface User {
  id: string
  email: string
  username: string
  firstName: string
  lastName: string
  imageUrl: string
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN'
  emailVerified: boolean
  isActive: boolean
  createdAt: string
  lastLoginAt: string | null
}

// Seller Types
export interface Seller {
  id: string
  userId: string
  businessName: string
  email: string
  phone: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED'
  rejectionReason?: string
  createdAt: string
  updatedAt: string
}

// Product Types
export interface Product {
  id: string
  sellerId: string
  name: string
  description: string
  price: number
  category: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  images: string[]
  createdAt: string
  updatedAt: string
}

// Order Types
export interface Order {
  id: string
  userId: string
  sellerId: string
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
  total: number
  items: OrderItem[]
  createdAt: string
  updatedAt: string
}

export interface OrderItem {
  id: string
  productId: string
  quantity: number
  price: number
}

// Device Types (MASH Grow)
export interface Device {
  id: string
  name: string
  serialNumber: string
  type: string
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE'
  assignedUserId?: string
  lastSeen: string
  createdAt: string
}

// CMS Types
export interface CMSContent {
  id: string
  title: string
  content: string
  type: 'ARTICLE' | 'PAGE' | 'BANNER'
  status: 'DRAFT' | 'PUBLISHED'
  section: 'MASH_MARKET' | 'MASH_GROW'
  createdAt: string
  updatedAt: string
  publishedAt?: string
}
