/**
 * API Client for MASH Admin Dashboard
 * Standardized methods for fetching data from backend via proxy
 */

import { api } from './api'
import { logger } from './logger'

// Types
export interface User {
  id: string
  name: string
  username: string
  email: string
  phone: string
  role: 'Seller' | 'Customer'
  status: 'Active' | 'Inactive'
  avatar?: string
  region?: string
  preferredPaymentMethod?: string
  addressBook?: string[]
  businessName?: string
  businessAddress?: string
  businessType?: string
  taxId?: string
  businessDocuments?: string[]
}

export interface Product {
  id: string
  name: string
  seller: string
  category: string
  price: number
  stock: number
  status: 'pending' | 'approved' | 'rejected'
  images?: string[]
  description?: string
  createdAt?: string
}

export interface Seller {
  id: string
  businessName: string
  ownerName: string
  email: string
  phone: string
  status: 'pending' | 'approved' | 'rejected'
  region: string
  createdAt: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// Users API
export const usersApi = {
  async getAll(params?: {
    page?: number
    limit?: number
    search?: string
    role?: string
    status?: string
    region?: string
  }): Promise<PaginatedResponse<User>> {
    try {
      const queryParams = new URLSearchParams()
      if (params?.page) queryParams.set('page', String(params.page))
      if (params?.limit) queryParams.set('limit', String(params.limit))
      if (params?.search) queryParams.set('search', params.search)
      if (params?.role) queryParams.set('role', params.role)
      if (params?.status) queryParams.set('status', params.status)
      if (params?.region) queryParams.set('region', params.region)

      const query = queryParams.toString()
      const endpoint = `v1/super-admin/users${query ? `?${query}` : ''}`
      
      logger.info('Fetching users', { endpoint, params })
      const response = await api.get(endpoint)
      
      return response.data
    } catch (error) {
      logger.apiError('v1/super-admin/users', error, params)
      throw error
    }
  },

  async getById(id: string): Promise<User> {
    try {
      logger.info('Fetching user by ID', { id })
      const response = await api.get(`v1/super-admin/users/${id}`)
      return response.data
    } catch (error) {
      logger.apiError(`v1/super-admin/users/${id}`, error)
      throw error
    }
  },

  async update(id: string, data: Partial<User>): Promise<User> {
    try {
      logger.info('Updating user', { id, data })
      const response = await api.put(`v1/super-admin/users/${id}`, data)
      return response.data
    } catch (error) {
      logger.apiError(`v1/super-admin/users/${id}`, error)
      throw error
    }
  },

  async delete(id: string): Promise<void> {
    try {
      logger.info('Deleting user', { id })
      await api.delete(`v1/super-admin/users/${id}`)
    } catch (error) {
      logger.apiError(`v1/super-admin/users/${id}`, error)
      throw error
    }
  },
}

// Products API
export const productsApi = {
  async getAll(params?: {
    page?: number
    limit?: number
    search?: string
    category?: string
    status?: string
  }): Promise<PaginatedResponse<Product>> {
    try {
      const queryParams = new URLSearchParams()
      if (params?.page) queryParams.set('page', String(params.page))
      if (params?.limit) queryParams.set('limit', String(params.limit))
      if (params?.search) queryParams.set('search', params.search)
      if (params?.category) queryParams.set('category', params.category)
      if (params?.status) queryParams.set('status', params.status)

      const query = queryParams.toString()
      const endpoint = `v1/super-admin/products${query ? `?${query}` : ''}`
      
      logger.info('Fetching products', { endpoint, params })
      const response = await api.get(endpoint)
      
      return response.data
    } catch (error) {
      logger.apiError('v1/super-admin/products', error, params)
      throw error
    }
  },

  async getById(id: string): Promise<Product> {
    try {
      logger.info('Fetching product by ID', { id })
      const response = await api.get(`v1/super-admin/products/${id}`)
      return response.data
    } catch (error) {
      logger.apiError(`v1/super-admin/products/${id}`, error)
      throw error
    }
  },

  async approve(id: string): Promise<Product> {
    try {
      logger.info('Approving product', { id })
      const response = await api.post(`v1/super-admin/products/${id}/approve`)
      return response.data
    } catch (error) {
      logger.apiError(`v1/super-admin/products/${id}/approve`, error)
      throw error
    }
  },

  async reject(id: string, reason: string): Promise<Product> {
    try {
      logger.info('Rejecting product', { id, reason })
      const response = await api.post(`v1/super-admin/products/${id}/reject`, { reason })
      return response.data
    } catch (error) {
      logger.apiError(`v1/super-admin/products/${id}/reject`, error)
      throw error
    }
  },
}

// Sellers API
export const sellersApi = {
  async getAll(params?: {
    page?: number
    limit?: number
    search?: string
    status?: string
  }): Promise<PaginatedResponse<Seller>> {
    try {
      const queryParams = new URLSearchParams()
      if (params?.page) queryParams.set('page', String(params.page))
      if (params?.limit) queryParams.set('limit', String(params.limit))
      if (params?.search) queryParams.set('search', params.search)
      if (params?.status) queryParams.set('status', params.status)

      const query = queryParams.toString()
      const endpoint = `v1/super-admin/sellers${query ? `?${query}` : ''}`
      
      logger.info('Fetching sellers', { endpoint, params })
      const response = await api.get(endpoint)
      
      return response.data
    } catch (error) {
      logger.apiError('v1/super-admin/sellers', error, params)
      throw error
    }
  },

  async getById(id: string): Promise<Seller> {
    try {
      logger.info('Fetching seller by ID', { id })
      const response = await api.get(`v1/super-admin/sellers/${id}`)
      return response.data
    } catch (error) {
      logger.apiError(`v1/super-admin/sellers/${id}`, error)
      throw error
    }
  },

  async approve(id: string): Promise<Seller> {
    try {
      logger.info('Approving seller', { id })
      const response = await api.post(`v1/super-admin/sellers/${id}/approve`)
      return response.data
    } catch (error) {
      logger.apiError(`v1/super-admin/sellers/${id}/approve`, error)
      throw error
    }
  },

  async reject(id: string, reason: string): Promise<Seller> {
    try {
      logger.info('Rejecting seller', { id, reason })
      const response = await api.post(`v1/super-admin/sellers/${id}/reject`, { reason })
      return response.data
    } catch (error) {
      logger.apiError(`v1/super-admin/sellers/${id}/reject`, error)
      throw error
    }
  },
}

// Export all
export const apiClient = {
  users: usersApi,
  products: productsApi,
  sellers: sellersApi,
}
