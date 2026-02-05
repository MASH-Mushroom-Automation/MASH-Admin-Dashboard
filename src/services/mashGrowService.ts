// src/services/mashGrowService.ts
/**
 * MASH Grow Service Layer
 * 
 * Handles all API calls for MASH Grow features:
 * - Device management (chambers, sensors, etc.)
 * - Grow user registration and management
 * - Device-to-user assignments
 */

import { api } from '@/lib/api'
import { DeviceType } from '@/types/device'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface Device {
  id: string
  serialNumber: string
  name?: string
  // model: string // Removing as backend doesn't support
  // version: number // Removing as backend doesn't support
  location: string
  status: 'Online' | 'Offline'
  type?: DeviceType
  assigned?: boolean
  userId?: string
  archived?: boolean
  description?: string
  firmware?: string
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
  configuration?: any
}

export interface GrowUser {
  id: string
  chamberNumber: string
  name: string
  email?: string
  firstName?: string
  lastName?: string
  phoneNumber?: string
  address?: string
  contactNumber?: string
  deviceId?: string
  archived?: boolean
  createdAt?: string
  updatedAt?: string
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

export interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
}

// ============================================================================
// DEVICE SERVICE
// ============================================================================

export const deviceService = {
  /**
   * Get all devices with optional filters and pagination
   */
  getAll: async (params?: {
    page?: number
    limit?: number
    status?: 'Online' | 'Offline'
    type?: string
    assigned?: boolean
    archived?: boolean
  }): Promise<PaginatedResponse<Device>> => {
    try {
      const response = await api.get<ApiResponse<PaginatedResponse<Device>>>(
        'v1/devices',
        { params }
      )
      return response.data.data
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.warn('[MASH Grow] Devices endpoint not implemented yet - returning empty list')
        // Return empty paginated response
        return {
          data: [],
          pagination: {
            page: params?.page || 1,
            limit: params?.limit || 10,
            total: 0,
            totalPages: 0
          }
        }
      }
      throw error
    }
  },

  /**
   * Get a single device by ID
   */
  getById: async (id: string): Promise<Device> => {
    const response = await api.get<ApiResponse<Device>>(
      `v1/devices/${id}`
    )
    return response.data.data
  },

  /**
   * Create a new device
   */
  create: async (device: Omit<Device, 'id' | 'createdAt' | 'updatedAt'>): Promise<Device> => {
    // Backend only accepts specific fields. Strip UI-only fields (model, version, etc.)
    const payload = {
      name: device.name,
      type: device.type,
      serialNumber: device.serialNumber,
      description: device.description,
      location: device.location,
      firmware: device.firmware
    };

    const response = await api.post<ApiResponse<Device>>(
      'v1/devices',
      payload
    )
    return response.data.data
  },

  /**
   * Update an existing device
   */
  update: async (id: string, data: Partial<Device>): Promise<Device> => {
    const response = await api.put<ApiResponse<Device>>(
      `v1/devices/${id}`,
      data
    )
    return response.data.data
  },

  /**
   * Archive/unarchive a device (soft delete)
   * Note: Uses activate endpoint from backend API
   */
  archive: async (id: string, archive: boolean = true): Promise<Device> => {
    const response = await api.post<ApiResponse<Device>>(
      `v1/devices/${id}/activate`,
      { isActive: !archive }
    )
    return response.data.data
  },

  /**
   * Assign device to a user
   * Uses dedicated backend endpoint
   */
  assign: async (deviceId: string, userId: string): Promise<Device> => {
    const response = await api.put<ApiResponse<Device>>(
      `v1/devices/${deviceId}/assign`,
      { userId }
    )
    return response.data.data
  },

  /**
   * Unassign device from user
   * Note: Uses device update endpoint since backend doesn't have dedicated unassign endpoint
   */
  unassign: async (deviceId: string): Promise<Device> => {
    const response = await api.put<ApiResponse<Device>>(
      `v1/devices/${deviceId}`,
      { userId: null, assigned: false }
    )
    return response.data.data
  },

  /**
   * Delete a device permanently
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`v1/devices/${id}`)
  },

  /**
   * Get device telemetry/stats
   */
  getTelemetry: async (id: string): Promise<unknown> => {
    const response = await api.get(
      `v1/super-admin/devices/${id}/telemetry`
    )
    return response.data.data
  }
}

// ============================================================================
// GROW USER SERVICE
// ============================================================================

export const growUserService = {
  /**
   * Get all grow users with optional filters and pagination
   */
  getAll: async (params?: {
    page?: number
    limit?: number
    search?: string
    archived?: boolean
    hasDevice?: boolean
  }): Promise<PaginatedResponse<GrowUser>> => {
    try {
      // Map archived to isActive (archived=true -> isActive=false)
      const queryParams: any = { ...params };
      if (params?.archived !== undefined) {
         queryParams.isActive = !params.archived;
         delete queryParams.archived;
      }

      const response = await api.get<ApiResponse<PaginatedResponse<GrowUser>>>(
        'v1/users',
        { params: queryParams }
      )
      return response.data.data
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.warn('[MASH Grow] Users endpoint not found - returning empty list')
        return {
          data: [],
          pagination: {
            page: params?.page || 1,
            limit: params?.limit || 10,
            total: 0,
            totalPages: 0
          }
        }
      }
      throw error
    }
  },

  /**
   * Get a single grow user by ID
   */
  getById: async (id: string): Promise<GrowUser> => {
    const response = await api.get<ApiResponse<GrowUser>>(
      `v1/users/${id}`
    )
    return response.data.data
  },

  /**
   * Register a new grow user
   */
  create: async (user: Omit<GrowUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<GrowUser> => {
    const response = await api.post<ApiResponse<GrowUser>>(
      'v1/users',
      user
    )
    return response.data.data
  },

  /**
   * Update an existing grow user
   */
  update: async (id: string, data: Partial<GrowUser>): Promise<GrowUser> => {
    const response = await api.patch<ApiResponse<GrowUser>>(
      `v1/users/${id}`,
      data
    )
    return response.data.data
  },

  /**
   * Archive/unarchive a grow user (soft delete)
   */
  archive: async (id: string, archive: boolean = true): Promise<GrowUser> => {
    const response = await api.patch<ApiResponse<GrowUser>>(
      `v1/users/${id}`,
      { isActive: !archive }
    )
    return response.data.data
  },

  /**
   * Delete a grow user permanently
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`v1/users/${id}`)
  }
}

// ============================================================================
// CMS SERVICE
// ============================================================================

export interface CMSArticle {
  id: string
  title: string
  category: string
  description: string
  content: string
  published: boolean
  createdAt: string
  updatedAt?: string
}

export const cmsService = {
  /**
   * Get all CMS articles for MASH Grow
   */
  getAll: async (params?: {
    page?: number
    limit?: number
    category?: string
    published?: boolean
  }): Promise<PaginatedResponse<CMSArticle>> => {
    const response = await api.get<ApiResponse<PaginatedResponse<CMSArticle>>>(
      'v1/super-admin/cms/grow',
      { params }
    )
    return response.data.data
  },

  /**
   * Get a single CMS article by ID
   */
  getById: async (id: string): Promise<CMSArticle> => {
    const response = await api.get<ApiResponse<CMSArticle>>(
      `v1/super-admin/cms/grow/${id}`
    )
    return response.data.data
  },

  /**
   * Create a new CMS article
   */
  create: async (article: Omit<CMSArticle, 'id' | 'createdAt' | 'updatedAt'>): Promise<CMSArticle> => {
    const response = await api.post<ApiResponse<CMSArticle>>(
      'v1/super-admin/cms/grow',
      article
    )
    return response.data.data
  },

  /**
   * Update an existing CMS article
   */
  update: async (id: string, data: Partial<CMSArticle>): Promise<CMSArticle> => {
    const response = await api.patch<ApiResponse<CMSArticle>>(
      `v1/super-admin/cms/grow/${id}`,
      data
    )
    return response.data.data
  },

  /**
   * Delete a CMS article
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`v1/super-admin/cms/grow/${id}`)
  },

  /**
   * Publish/unpublish a CMS article
   */
  publish: async (id: string, publish: boolean = true): Promise<CMSArticle> => {
    const response = await api.patch<ApiResponse<CMSArticle>>(
      `v1/super-admin/cms/grow/${id}`,
      { published: publish }
    )
    return response.data.data
  }
}
