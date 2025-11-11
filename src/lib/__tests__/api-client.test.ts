/**
 * API Client Test Suite
 * Tests for usersApi, productsApi, and sellersApi methods
 */

import { apiClient } from '../api-client'
import { api } from '../api'
import { logger } from '../logger'

// Mock dependencies
jest.mock('../api')
jest.mock('../logger')

describe('apiClient', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('usersApi', () => {
    describe('getAll', () => {
      it('should fetch users with default params', async () => {
        const mockResponse = {
          data: [
            { id: '1', name: 'John Doe', email: 'john@example.com', role: 'Seller', status: 'Active' },
            { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'Buyer', status: 'Active' },
          ],
          total: 2,
          page: 1,
          limit: 20,
        }

        ;(api.get as jest.Mock).mockResolvedValue({ data: mockResponse })

        const result = await apiClient.users.getAll()

        expect(api.get).toHaveBeenCalledWith('v1/super-admin/users')
        expect(result).toEqual(mockResponse)
      })

      it('should fetch users with custom params', async () => {
        const mockResponse = {
          data: [],
          total: 0,
          page: 2,
          limit: 50,
        }

        ;(api.get as jest.Mock).mockResolvedValue({ data: mockResponse })

        await apiClient.users.getAll({ page: 2, limit: 50, search: 'john', role: 'Seller', status: 'Active' })

        expect(api.get).toHaveBeenCalledWith('v1/super-admin/users?page=2&limit=50&search=john&role=Seller&status=Active')
      })

      it('should log errors on fetch failure', async () => {
        const mockError = new Error('Network error')
        ;(api.get as jest.Mock).mockRejectedValue(mockError)

        await expect(apiClient.users.getAll()).rejects.toThrow('Network error')
        // logger.apiError is called, which internally calls logger.error
        expect(logger.apiError).toHaveBeenCalledWith('v1/super-admin/users', mockError, undefined)
      })
    })

    describe('getById', () => {
      it('should fetch single user by ID', async () => {
        const mockUser = { id: '123', name: 'John Doe', email: 'john@example.com', role: 'Seller', status: 'Active' }
        ;(api.get as jest.Mock).mockResolvedValue({ data: mockUser })

        const result = await apiClient.users.getById('123')

        expect(api.get).toHaveBeenCalledWith('v1/super-admin/users/123')
        expect(result).toEqual(mockUser)
      })

      it('should log errors on fetch failure', async () => {
        const mockError = new Error('User not found')
        ;(api.get as jest.Mock).mockRejectedValue(mockError)

        await expect(apiClient.users.getById('999')).rejects.toThrow('User not found')
        expect(logger.apiError).toHaveBeenCalledWith('v1/super-admin/users/999', mockError)
      })
    })

    describe('update', () => {
      it('should update user successfully', async () => {
        const mockUpdated = { id: '123', name: 'John Updated', email: 'john@example.com', role: 'Seller', status: 'Inactive' }
        ;(api.put as jest.Mock).mockResolvedValue({ data: mockUpdated })

        const result = await apiClient.users.update('123', { status: 'Inactive' })

        expect(api.put).toHaveBeenCalledWith('v1/super-admin/users/123', { status: 'Inactive' })
        expect(result).toEqual(mockUpdated)
      })

      it('should log errors on update failure', async () => {
        const mockError = new Error('Update failed')
        ;(api.put as jest.Mock).mockRejectedValue(mockError)

        await expect(apiClient.users.update('123', { status: 'Inactive' })).rejects.toThrow('Update failed')
        expect(logger.apiError).toHaveBeenCalledWith('v1/super-admin/users/123', mockError)
      })
    })

    describe('delete', () => {
      it('should delete user successfully', async () => {
        ;(api.delete as jest.Mock).mockResolvedValue({ data: { success: true } })

        await apiClient.users.delete('123')

        expect(api.delete).toHaveBeenCalledWith('v1/super-admin/users/123')
      })

      it('should log errors on delete failure', async () => {
        const mockError = new Error('Delete failed')
        ;(api.delete as jest.Mock).mockRejectedValue(mockError)

        await expect(apiClient.users.delete('123')).rejects.toThrow('Delete failed')
        expect(logger.apiError).toHaveBeenCalledWith('v1/super-admin/users/123', mockError)
      })
    })
  })

  describe('productsApi', () => {
    describe('getAll', () => {
      it('should fetch products with params', async () => {
        const mockResponse = {
          data: [
            { id: '1', name: 'Oyster Mushroom', price: 150, status: 'Approved', seller: 'John Store' },
          ],
          total: 1,
          page: 1,
          limit: 20,
        }

        ;(api.get as jest.Mock).mockResolvedValue({ data: mockResponse })

        const result = await apiClient.products.getAll({ status: 'Approved' })

        expect(api.get).toHaveBeenCalledWith('v1/super-admin/products?status=Approved')
        expect(result).toEqual(mockResponse)
      })

      it('should log errors on fetch failure', async () => {
        const mockError = new Error('Network error')
        ;(api.get as jest.Mock).mockRejectedValue(mockError)

        await expect(apiClient.products.getAll()).rejects.toThrow('Network error')
        expect(logger.apiError).toHaveBeenCalledWith('v1/super-admin/products', mockError, undefined)
      })
    })

    describe('getById', () => {
      it('should fetch single product by ID', async () => {
        const mockProduct = { id: '123', name: 'Oyster Mushroom', price: 150, status: 'Approved', seller: 'John Store' }
        ;(api.get as jest.Mock).mockResolvedValue({ data: mockProduct })

        const result = await apiClient.products.getById('123')

        expect(api.get).toHaveBeenCalledWith('v1/super-admin/products/123')
        expect(result).toEqual(mockProduct)
      })
    })

    describe('approve', () => {
      it('should approve product successfully', async () => {
        const mockApproved = { id: '123', name: 'Oyster Mushroom', price: 150, status: 'Approved', seller: 'John Store' }
        ;(api.post as jest.Mock).mockResolvedValue({ data: mockApproved })

        const result = await apiClient.products.approve('123')

        expect(api.post).toHaveBeenCalledWith('v1/super-admin/products/123/approve')
        expect(result).toEqual(mockApproved)
      })
    })

    describe('reject', () => {
      it('should reject product with reason', async () => {
        const mockRejected = { id: '123', name: 'Oyster Mushroom', price: 150, status: 'Rejected', seller: 'John Store' }
        ;(api.post as jest.Mock).mockResolvedValue({ data: mockRejected })

        const result = await apiClient.products.reject('123', 'Poor quality images')

        expect(api.post).toHaveBeenCalledWith('v1/super-admin/products/123/reject', { reason: 'Poor quality images' })
        expect(result).toEqual(mockRejected)
      })
    })
  })

  describe('sellersApi', () => {
    describe('getAll', () => {
      it('should fetch sellers with params', async () => {
        const mockResponse = {
          data: [
            { id: '1', ownerName: 'John Doe', businessName: 'John Store', status: 'Pending' },
          ],
          total: 1,
          page: 1,
          limit: 20,
        }

        ;(api.get as jest.Mock).mockResolvedValue({ data: mockResponse })

        const result = await apiClient.sellers.getAll({ status: 'Pending' })

        // API client builds query string internally, so URL includes params
        expect(api.get).toHaveBeenCalledWith('v1/super-admin/sellers?status=Pending')
        expect(result).toEqual(mockResponse)
      })

      it('should log errors on fetch failure', async () => {
        const mockError = new Error('Network error')
        ;(api.get as jest.Mock).mockRejectedValue(mockError)

        await expect(apiClient.sellers.getAll()).rejects.toThrow('Network error')
        expect(logger.apiError).toHaveBeenCalledWith('v1/super-admin/sellers', mockError, undefined)
      })
    })

    describe('getById', () => {
      it('should fetch single seller by ID', async () => {
        const mockSeller = { id: '123', ownerName: 'John Doe', businessName: 'John Store', status: 'Pending' }
        ;(api.get as jest.Mock).mockResolvedValue({ data: mockSeller })

        const result = await apiClient.sellers.getById('123')

        expect(api.get).toHaveBeenCalledWith('v1/super-admin/sellers/123')
        expect(result).toEqual(mockSeller)
      })
    })

    describe('approve', () => {
      it('should approve seller successfully', async () => {
        const mockApproved = { id: '123', ownerName: 'John Doe', businessName: 'John Store', status: 'Approved' }
        ;(api.post as jest.Mock).mockResolvedValue({ data: mockApproved })

        const result = await apiClient.sellers.approve('123')

        expect(api.post).toHaveBeenCalledWith('v1/super-admin/sellers/123/approve')
        expect(result).toEqual(mockApproved)
      })

      it('should log errors on approve failure', async () => {
        const mockError = new Error('Approve failed')
        ;(api.post as jest.Mock).mockRejectedValue(mockError)

        await expect(apiClient.sellers.approve('123')).rejects.toThrow('Approve failed')
        expect(logger.apiError).toHaveBeenCalledWith('v1/super-admin/sellers/123/approve', mockError)
      })
    })

    describe('reject', () => {
      it('should reject seller with reason', async () => {
        const mockRejected = { id: '123', ownerName: 'John Doe', businessName: 'John Store', status: 'Rejected' }
        ;(api.post as jest.Mock).mockResolvedValue({ data: mockRejected })

        const result = await apiClient.sellers.reject('123', 'Incomplete documents')

        expect(api.post).toHaveBeenCalledWith('v1/super-admin/sellers/123/reject', {
          reason: 'Incomplete documents',
        })
        expect(result).toEqual(mockRejected)
      })

      it('should log errors on reject failure', async () => {
        const mockError = new Error('Reject failed')
        ;(api.post as jest.Mock).mockRejectedValue(mockError)

        await expect(apiClient.sellers.reject('123', 'Reason')).rejects.toThrow('Reject failed')
        expect(logger.apiError).toHaveBeenCalledWith('v1/super-admin/sellers/123/reject', mockError)
      })
    })
  })

  describe('Error handling', () => {
    it('should handle network timeouts', async () => {
      const mockError = new Error('Request timeout')
      ;(api.get as jest.Mock).mockRejectedValue(mockError)

      await expect(apiClient.users.getAll()).rejects.toThrow('Request timeout')
      expect(logger.apiError).toHaveBeenCalledWith('v1/super-admin/users', mockError, undefined)
    })

    it('should handle 401 unauthorized errors', async () => {
      const mockError = { response: { status: 401, data: { message: 'Unauthorized' } } }
      ;(api.get as jest.Mock).mockRejectedValue(mockError)

      await expect(apiClient.users.getAll()).rejects.toEqual(mockError)
      expect(logger.apiError).toHaveBeenCalled()
    })

    it('should handle 404 not found errors', async () => {
      const mockError = { response: { status: 404, data: { message: 'Not found' } } }
      ;(api.get as jest.Mock).mockRejectedValue(mockError)

      await expect(apiClient.users.getById('999')).rejects.toEqual(mockError)
      expect(logger.apiError).toHaveBeenCalled()
    })
  })
})
