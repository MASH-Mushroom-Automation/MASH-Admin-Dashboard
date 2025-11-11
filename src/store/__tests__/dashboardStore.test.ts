/**
 * Dashboard Store Test Suite
 * Tests for fetchOverview, fetchSales, fetchChambers, fetchUsersStats, fetchCards
 */

import { useDashboardStore } from '../dashboardStore'
import { api } from '@/lib/api'

// Mock the API module
jest.mock('@/lib/api')

describe('dashboardStore', () => {
  // Reset store state before each test
  beforeEach(() => {
    useDashboardStore.setState({
      overview: null,
      sales: null,
      chambers: null,
      usersStats: null,
      cards: null,
      loading: {},
      error: {},
    })
    jest.clearAllMocks()
  })

  describe('fetchOverview', () => {
    it('should fetch overview data successfully', async () => {
      const mockOverview = {
        chambers: { active: 10, inactive: 3 },
        orders: { completed: 50, pending: 12 },
        products: { pending: 8, approved: 45 },
        sellerApplications: { pending: 5, approved: 20 },
      }

      ;(api.get as jest.Mock).mockResolvedValue({ data: mockOverview })

      const store = useDashboardStore.getState()
      await store.fetchOverview()

      const state = useDashboardStore.getState()
      expect(state.overview).toEqual(mockOverview)
      expect(state.loading.overview).toBe(false)
      expect(state.error.overview).toBeNull()
    })

    it('should handle overview fetch errors', async () => {
      const mockError = new Error('Failed to fetch overview')
      ;(api.get as jest.Mock).mockRejectedValue(mockError)

      const store = useDashboardStore.getState()
      await store.fetchOverview()

      const state = useDashboardStore.getState()
      expect(state.overview).toBeNull()
      expect(state.loading.overview).toBe(false)
      expect(state.error.overview).toBe('Failed to fetch overview')
    })

    it('should set loading state during fetch', async () => {
      ;(api.get as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      )

      const store = useDashboardStore.getState()
      const promise = store.fetchOverview()

      // Check loading state is true while fetching
      const loadingState = useDashboardStore.getState()
      expect(loadingState.loading.overview).toBe(true)

      await promise
    })
  })

  describe('fetchSales', () => {
    it('should fetch sales data successfully', async () => {
      const mockSales = [
        { day: 'Mon', sales: 1200 },
        { day: 'Tue', sales: 1500 },
        { day: 'Wed', sales: 1800 },
      ]

      ;(api.get as jest.Mock).mockResolvedValue({ data: mockSales })

      const store = useDashboardStore.getState()
      await store.fetchSales(7)

      const state = useDashboardStore.getState()
      expect(state.sales).toEqual(mockSales)
      expect(state.loading.sales).toBe(false)
      expect(state.error.sales).toBeNull()
    })

    it('should handle sales fetch errors', async () => {
      const mockError = new Error('Failed to fetch sales')
      ;(api.get as jest.Mock).mockRejectedValue(mockError)

      const store = useDashboardStore.getState()
      await store.fetchSales(7)

      const state = useDashboardStore.getState()
      expect(state.sales).toBeNull()
      expect(state.loading.sales).toBe(false)
      expect(state.error.sales).toBe('Failed to fetch sales')
    })

    it('should pass days parameter to API', async () => {
      ;(api.get as jest.Mock).mockResolvedValue({ data: [] })

      const store = useDashboardStore.getState()
      await store.fetchSales(30)

      expect(api.get).toHaveBeenCalledWith('v1/super-admin/dashboard/sales', {
        params: { days: 30 },
      })
    })
  })

  describe('fetchChambers', () => {
    it('should fetch chamber inventory successfully', async () => {
      const mockChambers = {
        chambers: [
          { id: '1', grower: 'John Doe', location: 'Manila', status: 'Active' },
          { id: '2', grower: 'Jane Smith', location: 'Cebu', status: 'Inactive' },
        ],
        total: 2,
        page: 1,
        limit: 10,
      }

      ;(api.get as jest.Mock).mockResolvedValue({ data: mockChambers })

      const store = useDashboardStore.getState()
      await store.fetchChambers(1, 10)

      const state = useDashboardStore.getState()
      expect(state.chambers).toEqual(mockChambers)
      expect(state.loading.chambers).toBe(false)
      expect(state.error.chambers).toBeNull()
    })

    it('should handle chamber fetch errors', async () => {
      const mockError = new Error('Failed to fetch chambers')
      ;(api.get as jest.Mock).mockRejectedValue(mockError)

      const store = useDashboardStore.getState()
      await store.fetchChambers(1, 10)

      const state = useDashboardStore.getState()
      expect(state.chambers).toBeNull()
      expect(state.loading.chambers).toBe(false)
      expect(state.error.chambers).toBe('Failed to fetch chambers')
    })

    it('should pass pagination parameters to API', async () => {
      ;(api.get as jest.Mock).mockResolvedValue({ data: { items: [], total: 0, page: 2, limit: 20 } })

      const store = useDashboardStore.getState()
      await store.fetchChambers(2, 20)

      expect(api.get).toHaveBeenCalledWith('v1/super-admin/dashboard/chambers', {
        params: { page: 2, limit: 20 },
      })
    })
  })

  describe('fetchUsersStats', () => {
    it('should fetch user statistics successfully', async () => {
      const mockStats = {
        USER: 150,
        BUYER: 80,
        ADMIN: 5,
        GROWER: 30,
        SUPER_ADMIN: 2,
      }

      ;(api.get as jest.Mock).mockResolvedValue({ data: mockStats })

      const store = useDashboardStore.getState()
      await store.fetchUsersStats()

      const state = useDashboardStore.getState()
      expect(state.usersStats).toEqual(mockStats)
      expect(state.loading.usersStats).toBe(false)
      expect(state.error.usersStats).toBeNull()
    })

    it('should handle usersStats fetch errors', async () => {
      const mockError = new Error('Failed to fetch user stats')
      ;(api.get as jest.Mock).mockRejectedValue(mockError)

      const store = useDashboardStore.getState()
      await store.fetchUsersStats()

      const state = useDashboardStore.getState()
      expect(state.usersStats).toBeNull()
      expect(state.loading.usersStats).toBe(false)
      expect(state.error.usersStats).toBe('Failed to fetch user stats')
    })
  })

  describe('fetchCards', () => {
    it('should fetch card summary data successfully', async () => {
      const mockCards = {
        chambers: { active: 10, inactive: 3 },
        orders: { completed: 50, pending: 12 },
        products: { pending: 8, approved: 45 },
        sellerApplications: { pending: 5, approved: 20 },
      }

      ;(api.get as jest.Mock).mockResolvedValue({ data: mockCards })

      const store = useDashboardStore.getState()
      await store.fetchCards()

      const state = useDashboardStore.getState()
      expect(state.cards).toEqual(mockCards)
      expect(state.loading.cards).toBe(false)
      expect(state.error.cards).toBeNull()
    })

    it('should handle cards fetch errors', async () => {
      const mockError = new Error('Failed to fetch cards')
      ;(api.get as jest.Mock).mockRejectedValue(mockError)

      const store = useDashboardStore.getState()
      await store.fetchCards()

      const state = useDashboardStore.getState()
      expect(state.cards).toBeNull()
      expect(state.loading.cards).toBe(false)
      expect(state.error.cards).toBe('Failed to fetch cards')
    })
  })

  describe('Multiple parallel fetches', () => {
    it('should handle multiple fetches independently', async () => {
      const mockOverview = { chambers: { active: 5, inactive: 1 }, orders: { completed: 20, pending: 5 }, products: { pending: 3, approved: 15 }, sellerApplications: { pending: 2, approved: 10 } }
      const mockSales = [{ day: 'Mon', sales: 1000 }]

      ;(api.get as jest.Mock)
        .mockResolvedValueOnce({ data: mockOverview })
        .mockResolvedValueOnce({ data: mockSales })

      const store = useDashboardStore.getState()
      await Promise.all([store.fetchOverview(), store.fetchSales(7)])

      const state = useDashboardStore.getState()
      expect(state.overview).toEqual(mockOverview)
      expect(state.sales).toEqual(mockSales)
      expect(state.loading.overview).toBe(false)
      expect(state.loading.sales).toBe(false)
    })

    it('should isolate errors between different fetches', async () => {
      const mockOverview = { chambers: { active: 5, inactive: 1 }, orders: { completed: 20, pending: 5 }, products: { pending: 3, approved: 15 }, sellerApplications: { pending: 2, approved: 10 } }

      ;(api.get as jest.Mock)
        .mockResolvedValueOnce({ data: mockOverview })
        .mockRejectedValueOnce(new Error('Sales error'))

      const store = useDashboardStore.getState()
      await Promise.all([store.fetchOverview(), store.fetchSales(7)])

      const state = useDashboardStore.getState()
      expect(state.overview).toEqual(mockOverview)
      expect(state.error.overview).toBeNull()
      expect(state.sales).toBeNull()
      expect(state.error.sales).toBe('Sales error')
    })
  })
})
