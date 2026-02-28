"use client"

import { useEffect, useState, useMemo } from "react"
import { createPortal } from "react-dom"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Thermometer, Droplets, Wind, Calendar as CalendarIcon, Activity, Play, Pause, Filter, Download, TrendingUp, X } from "lucide-react"
import { database } from "@/lib/firebase"
import { ref, onValue, off, query, limitToLast, orderByKey, startAt, endAt } from "firebase/database"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from "recharts"
import { format, subWeeks, subMonths, subYears, startOfDay, endOfDay } from "date-fns"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import PaginationWrapper from "@/components/pagination"
import AppSidebar from "@/components/sidebar"
import Navbar from "@/components/navbar"

interface SensorReading {
  temperature: number
  humidity: number
  co2: number
  timestamp?: number
}

interface LatestReading {
  fruiting: SensorReading
  spawning: SensorReading
  timestamp: number
}

interface SensorLog {
  timestamp: string
  data: SensorReading
  room: 'fruiting' | 'spawning'
}

interface SensorLogsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  serialNumber: string
}

export default function SensorLogsModal({ open, onOpenChange, serialNumber }: SensorLogsModalProps) {
  const [latestReading, setLatestReading] = useState<LatestReading | null>(null)
  const [sensorLogs, setSensorLogs] = useState<SensorLog[]>([])
  const [loading, setLoading] = useState(true)

  // Feature toggles and filters
  const [liveUpdate, setLiveUpdate] = useState(true)
  const [sortBy, setSortBy] = useState<'timestamp' | 'temperature' | 'humidity' | 'co2'>('timestamp')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [filterRoom, setFilterRoom] = useState<'all' | 'fruiting' | 'spawning'>('all')
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined)
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [selectedTab, setSelectedTab] = useState('latest')

  // Chart-specific filters
  const [chartTimePeriod, setChartTimePeriod] = useState<'day' | 'week' | 'month' | 'year'>('week')
  const [chartDateFrom, setChartDateFrom] = useState<Date | undefined>(undefined)
  const [chartDateTo, setChartDateTo] = useState<Date | undefined>(undefined)
  const [chartFiltersOpen, setChartFiltersOpen] = useState(false)
  const [tableFiltersOpen, setTableFiltersOpen] = useState(false)

  // Initialize chart date range on mount
  useEffect(() => {
    if (open && !chartDateFrom && !chartDateTo) {
      console.log('[Charts] Initializing default date range (last week)')
      const now = new Date()
      const from = startOfDay(subWeeks(now, 1))
      const to = endOfDay(now)
      console.log('[Charts] Setting default range:', { from, to })
      setChartDateFrom(from)
      setChartDateTo(to)
    }
  }, [open, chartDateFrom, chartDateTo])

  useEffect(() => {
    if (!open || !serialNumber || !liveUpdate) return

    setLoading(true)

    // Subscribe to latest reading
    const latestReadingRef = ref(database, `devices/${serialNumber}/latest_reading`)
    onValue(latestReadingRef, (snapshot) => {
      if (snapshot.exists()) {
        setLatestReading(snapshot.val())
      }
      setLoading(false)
    }, (error) => {
      console.error('Error fetching latest reading:', error)
      setLoading(false)
    })

    // Dynamic query based on date range
    // Firebase timestamp format: 2026-02-11T17-46-13-883709
    // Consider both table filters and chart filters to load enough data
    let fruitingLogsRef
    let spawningLogsRef

    // Determine the broadest date range needed
    const effectiveDateFrom = (() => {
      const dates = [dateFrom, chartDateFrom].filter(Boolean) as Date[]
      return dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : null
    })()

    const effectiveDateTo = (() => {
      const dates = [dateTo, chartDateTo].filter(Boolean) as Date[]
      return dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : null
    })()

    console.log('[Firebase Query] Effective date range:', { effectiveDateFrom, effectiveDateTo })
    console.log('[Firebase Query] Source filters - Table:', { dateFrom, dateTo }, 'Chart:', { chartDateFrom, chartDateTo })

    if (effectiveDateFrom || effectiveDateTo) {
      // Convert dates to Firebase timestamp format for query
      const startKey = effectiveDateFrom
        ? format(effectiveDateFrom, "yyyy-MM-dd'T'00-00-00-000000")
        : '2020-01-01T00-00-00-000000' // Far past date

      const endKey = effectiveDateTo
        ? format(effectiveDateTo, "yyyy-MM-dd'T'23-59-59-999999")
        : format(new Date(), "yyyy-MM-dd'T'23-59-59-999999") // Current date

      console.log('[Firebase Query] Using date range query - Keys:', { startKey, endKey })

      fruitingLogsRef = query(
        ref(database, `sensor_data/${serialNumber}/fruiting`),
        orderByKey(),
        startAt(startKey),
        endAt(endKey)
      )

      spawningLogsRef = query(
        ref(database, `sensor_data/${serialNumber}/spawning`),
        orderByKey(),
        startAt(startKey),
        endAt(endKey)
      )
    } else {
      // No date filter - get more recent entries to cover default chart view
      console.log('[Firebase Query] Using limitToLast(5000) - no date filter')
      fruitingLogsRef = query(ref(database, `sensor_data/${serialNumber}/fruiting`), limitToLast(5000))
      spawningLogsRef = query(ref(database, `sensor_data/${serialNumber}/spawning`), limitToLast(5000))
    }

    // Keep separate arrays for each room to avoid race conditions
    let fruitingLogs: SensorLog[] = []
    let spawningLogs: SensorLog[] = []

    const updateCombinedLogs = () => {
      const combinedLogs = [...fruitingLogs, ...spawningLogs]
      console.log('[Firebase] Loaded data - Fruiting:', fruitingLogs.length, 'Spawning:', spawningLogs.length, 'Total:', combinedLogs.length)
      setSensorLogs(combinedLogs)
    }

    onValue(fruitingLogsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val()
        fruitingLogs = Object.keys(data).map(key => ({
          timestamp: key,
          data: data[key],
          room: 'fruiting' as const
        }))
        updateCombinedLogs()
      }
    }, (error) => {
      console.error('Error fetching fruiting logs:', error)
    })

    onValue(spawningLogsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val()
        spawningLogs = Object.keys(data).map(key => ({
          timestamp: key,
          data: data[key],
          room: 'spawning' as const
        }))
        updateCombinedLogs()
      }
    }, (error) => {
      console.error('Error fetching spawning logs:', error)
    })

    // Cleanup listeners
    return () => {
      off(latestReadingRef)
      off(fruitingLogsRef)
      off(spawningLogsRef)
    }
  }, [open, serialNumber, liveUpdate, dateFrom, dateTo, chartDateFrom, chartDateTo])

  // Helper functions for timestamp parsing
  const parseTimestamp = (timestamp: string): Date => {
    try {
      // Parse: 2026-02-11T17-46-13-883709
      const parts = timestamp.split('T')
      const datePart = parts[0]
      const timePart = parts[1].split('-').slice(0, 3).join(':')
      return new Date(`${datePart}T${timePart}`)
    } catch {
      return new Date()
    }
  }

  const formatTimestamp = (timestamp: string) => {
    try {
      // Parse the timestamp format: 2026-02-11T17-46-13-883709
      const parts = timestamp.split('T')
      const date = parts[0]
      const time = parts[1].replace(/-/g, ':').substring(0, 8)
      return `${date} ${time}`
    } catch {
      return timestamp
    }
  }

  // Filter and sort sensor logs
  const filteredAndSortedLogs = useMemo(() => {
    let filtered = [...sensorLogs]

    // Filter by room
    if (filterRoom !== 'all') {
      filtered = filtered.filter(log => log.room === filterRoom)
    }

    // Filter by date range
    if (dateFrom || dateTo) {
      filtered = filtered.filter(log => {
        const logDate = parseTimestamp(log.timestamp)

        // Compare start of day for dateFrom
        if (dateFrom) {
          const fromDate = new Date(dateFrom)
          fromDate.setHours(0, 0, 0, 0)
          if (logDate < fromDate) return false
        }

        // Compare end of day for dateTo
        if (dateTo) {
          const toDate = new Date(dateTo)
          toDate.setHours(23, 59, 59, 999)
          if (logDate > toDate) return false
        }

        return true
      })
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0

      if (sortBy === 'timestamp') {
        comparison = a.timestamp.localeCompare(b.timestamp)
      } else if (sortBy === 'temperature') {
        comparison = a.data.temperature - b.data.temperature
      } else if (sortBy === 'humidity') {
        comparison = a.data.humidity - b.data.humidity
      } else if (sortBy === 'co2') {
        comparison = a.data.co2 - b.data.co2
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })

    return filtered
  }, [sensorLogs, filterRoom, dateFrom, dateTo, sortBy, sortOrder])

  // Paginated logs
  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredAndSortedLogs.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredAndSortedLogs, currentPage, itemsPerPage])

  // Helper function to set time period
  const setTimePeriod = (period: 'day' | 'week' | 'month' | 'year') => {
    console.log('[Charts] Setting time period to:', period)
    setChartTimePeriod(period)
    const now = new Date()
    const to = endOfDay(now)
    let from: Date

    switch (period) {
      case 'day':
        from = startOfDay(now)
        break
      case 'week':
        from = startOfDay(subWeeks(now, 1))
        break
      case 'month':
        from = startOfDay(subMonths(now, 1))
        break
      case 'year':
        from = startOfDay(subYears(now, 1))
        break
    }

    console.log('[Charts] Date range:', { from, to })
    setChartDateFrom(from)
    setChartDateTo(to)
  }

  // Filter logs for charts based on chart-specific date range
  const chartFilteredLogs = useMemo(() => {
    console.log('[Charts] Filtering logs - Total sensorLogs:', sensorLogs.length)
    let filtered = sensorLogs

    // Filter by room
    if (filterRoom !== 'all') {
      filtered = filtered.filter(log => log.room === filterRoom)
      console.log('[Charts] After room filter:', filtered.length)
    }

    // Filter by chart date range
    if (chartDateFrom || chartDateTo) {
      console.log('[Charts] Date filter range:', { chartDateFrom, chartDateTo })
      filtered = filtered.filter(log => {
        const logDate = parseTimestamp(log.timestamp)
        const fromMatch = !chartDateFrom || logDate >= startOfDay(chartDateFrom)
        const toMatch = !chartDateTo || logDate <= endOfDay(chartDateTo)
        return fromMatch && toMatch
      })
      console.log('[Charts] After date filter:', filtered.length)
    }

    const sorted = filtered.sort((a, b) => {
      const dateA = parseTimestamp(a.timestamp).getTime()
      const dateB = parseTimestamp(b.timestamp).getTime()
      return dateA - dateB // Ascending for charts
    })

    console.log('[Charts] Final chartFilteredLogs:', sorted.length)
    return sorted
  }, [sensorLogs, filterRoom, chartDateFrom, chartDateTo])

  // Prepare chart data with aggregation based on time period
  const chartData = useMemo(() => {
    console.log('[Charts] Aggregating data - chartTimePeriod:', chartTimePeriod, 'chartFilteredLogs:', chartFilteredLogs.length)
    if (chartFilteredLogs.length === 0) {
      console.log('[Charts] No data to aggregate')
      return []
    }

    // Aggregate data based on time period
    const aggregated: { [key: string]: { temps: number[], humidities: number[], co2s: number[], count: number } } = {}

    chartFilteredLogs.forEach(log => {
      const logDate = parseTimestamp(log.timestamp)
      let key: string

      switch (chartTimePeriod) {
        case 'day':
          // Group by hour
          key = format(logDate, 'yyyy-MM-dd HH:00')
          break
        case 'week':
          // Group by day
          key = format(logDate, 'yyyy-MM-dd')
          break
        case 'month':
          // Group by day
          key = format(logDate, 'yyyy-MM-dd')
          break
        case 'year':
          // Group by month
          key = format(logDate, 'yyyy-MM')
          break
        default:
          key = format(logDate, 'yyyy-MM-dd HH:mm')
      }

      if (!aggregated[key]) {
        aggregated[key] = { temps: [], humidities: [], co2s: [], count: 0 }
      }

      if (log.data?.temperature != null) aggregated[key].temps.push(log.data.temperature)
      if (log.data?.humidity != null) aggregated[key].humidities.push(log.data.humidity)
      if (log.data?.co2 != null) aggregated[key].co2s.push(log.data.co2)
      aggregated[key].count++
    })

    console.log('[Charts] Aggregation keys:', Object.keys(aggregated).length)

    // Convert to array and calculate averages
    const result = Object.keys(aggregated)
      .sort()
      .map(key => {
        const data = aggregated[key]
        let displayTime: string

        switch (chartTimePeriod) {
          case 'day':
            displayTime = format(new Date(key), 'HH:mm')
            break
          case 'week':
          case 'month':
            displayTime = format(new Date(key), 'MMM dd')
            break
          case 'year':
            displayTime = format(new Date(key + '-01'), 'MMM yyyy')
            break
          default:
            displayTime = format(new Date(key), 'MMM dd HH:mm')
        }

        return {
          time: displayTime,
          temperature: data.temps.length > 0
            ? parseFloat((data.temps.reduce((a, b) => a + b, 0) / data.temps.length).toFixed(1))
            : null,
          humidity: data.humidities.length > 0
            ? parseFloat((data.humidities.reduce((a, b) => a + b, 0) / data.humidities.length).toFixed(1))
            : null,
          co2: data.co2s.length > 0
            ? Math.round(data.co2s.reduce((a, b) => a + b, 0) / data.co2s.length)
            : null
        }
      })

    console.log('[Charts] Final aggregated data points:', result.length)
    return result
  }, [chartFilteredLogs, chartTimePeriod])

  // Calculate summary statistics
  const chartSummary = useMemo(() => {
    if (chartFilteredLogs.length === 0) {
      return {
        avgTemp: 0,
        minTemp: 0,
        maxTemp: 0,
        avgHumidity: 0,
        minHumidity: 0,
        maxHumidity: 0,
        avgCo2: 0,
        minCo2: 0,
        maxCo2: 0,
        totalReadings: 0
      }
    }

    const temps = chartFilteredLogs.map(l => l.data?.temperature).filter((v): v is number => v != null)
    const humidities = chartFilteredLogs.map(l => l.data?.humidity).filter((v): v is number => v != null)
    const co2s = chartFilteredLogs.map(l => l.data?.co2).filter((v): v is number => v != null)

    return {
      avgTemp: temps.length > 0 ? (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1) : 0,
      minTemp: temps.length > 0 ? Math.min(...temps).toFixed(1) : 0,
      maxTemp: temps.length > 0 ? Math.max(...temps).toFixed(1) : 0,
      avgHumidity: humidities.length > 0 ? (humidities.reduce((a, b) => a + b, 0) / humidities.length).toFixed(1) : 0,
      minHumidity: humidities.length > 0 ? Math.min(...humidities).toFixed(1) : 0,
      maxHumidity: humidities.length > 0 ? Math.max(...humidities).toFixed(1) : 0,
      avgCo2: co2s.length > 0 ? Math.round(co2s.reduce((a, b) => a + b, 0) / co2s.length) : 0,
      minCo2: co2s.length > 0 ? Math.min(...co2s) : 0,
      maxCo2: co2s.length > 0 ? Math.max(...co2s) : 0,
      totalReadings: chartFilteredLogs.length
    }
  }, [chartFilteredLogs])

  const formatUnixTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString()
  }

  const handleExportData = () => {
    const csvContent = [
      ['Timestamp', 'Room', 'Temperature (°C)', 'Humidity (%)', 'CO2 (ppm)'],
      ...filteredAndSortedLogs.map(log => [
        formatTimestamp(log.timestamp),
        log.room,
        log.data?.temperature?.toString() || 'N/A',
        log.data?.humidity?.toString() || 'N/A',
        log.data?.co2?.toString() || 'N/A'
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sensor-logs-${serialNumber}-${new Date().toISOString()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const clearFilters = () => {
    setFilterRoom('all')
    setDateFrom(undefined)
    setDateTo(undefined)
    setSortBy('timestamp')
    setSortOrder('desc')
    setCurrentPage(1)
  }

  useEffect(() => {
    if (!open) return

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <SidebarProvider defaultOpen={true}>
      <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm">
        <div className="flex h-full w-full overflow-hidden">
          {/* Sidebar always visible */}
          <AppSidebar />

          <SidebarInset className="flex flex-1 flex-col overflow-hidden">
            <Navbar />

            <div className="flex-1 overflow-auto">
              <div className="relative w-full flex flex-col bg-background">
                {/* Header */}
                <div className="shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
                  <div className="px-3 sm:px-4 pt-3 sm:pt-4 pb-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onOpenChange(false)}
                      className="h-8 px-2"
                    >
                      &lt; Back
                    </Button>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 sm:p-4">
                    <div className="flex items-center gap-2">
                      <Activity className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                      <h2 className="text-lg sm:text-xl font-semibold">Sensor Logs & Analytics</h2>
                      <Badge variant="outline" className="text-xs">{serialNumber}</Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="live-update" className="text-xs sm:text-sm">Live Update</Label>
                        <Switch
                          id="live-update"
                          checked={liveUpdate}
                          onCheckedChange={setLiveUpdate}
                        />
                        {liveUpdate ? (
                          <Play className="h-4 w-4 text-green-500" />
                        ) : (
                          <Pause className="h-4 w-4 text-orange-500" />
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground px-3 sm:px-4 pb-3">
                    Real-time sensor data and historical analytics for <span className="font-mono text-primary font-medium">{serialNumber}</span>
                  </p>
                </div>

                {/* Main Content */}
                <Tabs value={selectedTab} onValueChange={setSelectedTab} className="flex flex-col">
                  <div className="px-3 sm:px-4 pt-3">
                    <TabsList className="w-full max-w-2xl mx-auto grid grid-cols-3 h-11 rounded-lg bg-muted/40 p-1">
                      <TabsTrigger
                        value="latest"
                        className="w-full h-9 justify-center text-center rounded-md text-xs sm:text-sm font-medium text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                      >
                        Latest Readings
                      </TabsTrigger>
                      <TabsTrigger
                        value="charts"
                        className="w-full h-9 justify-center text-center rounded-md text-xs sm:text-sm font-medium text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                      >
                        Charts & Trends
                      </TabsTrigger>
                      <TabsTrigger
                        value="logs"
                        className="w-full h-9 justify-center text-center rounded-md text-xs sm:text-sm font-medium text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                      >
                        Data Table
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  {/* Latest Readings Tab */}
                  <TabsContent value="latest" className="m-0 p-3 sm:p-4">
                    {loading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : latestReading ? (
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4">
                        {/* Fruiting Chamber */}
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                              <Badge variant="default" className="bg-green-500">Fruiting Chamber</Badge>
                            </CardTitle>
                            <CardDescription className="text-xs">
                              {formatUnixTimestamp(latestReading.fruiting.timestamp || latestReading.timestamp)}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-2 pt-0">
                            <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                              <div className="flex items-center gap-2">
                                <Thermometer className="h-4 w-4 text-red-500" />
                                <span className="text-xs sm:text-sm font-medium">Temperature</span>
                              </div>
                              <span className="text-xl sm:text-2xl font-bold text-red-600">{latestReading.fruiting?.temperature ?? 'N/A'}°C</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                              <div className="flex items-center gap-2">
                                <Droplets className="h-4 w-4 text-blue-500" />
                                <span className="text-xs sm:text-sm font-medium">Humidity</span>
                              </div>
                              <span className="text-xl sm:text-2xl font-bold text-blue-600">{latestReading.fruiting?.humidity ?? 'N/A'}%</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                              <div className="flex items-center gap-2">
                                <Wind className="h-4 w-4 text-gray-500" />
                                <span className="text-xs sm:text-sm font-medium">CO₂</span>
                              </div>
                              <span className="text-xl sm:text-2xl font-bold text-gray-700 dark:text-gray-300">{latestReading.fruiting?.co2 ?? 'N/A'} ppm</span>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Spawning Chamber */}
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                              <Badge variant="secondary">Spawning Chamber</Badge>
                            </CardTitle>
                            <CardDescription className="text-xs">
                              {formatUnixTimestamp(latestReading.spawning.timestamp || latestReading.timestamp)}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-2 pt-0">
                            <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                              <div className="flex items-center gap-2">
                                <Thermometer className="h-4 w-4 text-red-500" />
                                <span className="text-xs sm:text-sm font-medium">Temperature</span>
                              </div>
                              <span className="text-xl sm:text-2xl font-bold text-red-600">{latestReading.spawning?.temperature ?? 'N/A'}°C</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                              <div className="flex items-center gap-2">
                                <Droplets className="h-4 w-4 text-blue-500" />
                                <span className="text-xs sm:text-sm font-medium">Humidity</span>
                              </div>
                              <span className="text-xl sm:text-2xl font-bold text-blue-600">{latestReading.spawning?.humidity ?? 'N/A'}%</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                              <div className="flex items-center gap-2">
                                <Wind className="h-4 w-4 text-gray-500" />
                                <span className="text-xs sm:text-sm font-medium">CO₂</span>
                              </div>
                              <span className="text-xl sm:text-2xl font-bold text-gray-700 dark:text-gray-300">{latestReading.spawning?.co2 ?? 'N/A'} ppm</span>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground text-sm">
                        No sensor data available
                      </div>
                    )}
                  </TabsContent>

                  {/* Charts & Trends Tab */}
                  <TabsContent value="charts" className="m-0 p-4 sm:p-6">
                    <div className="space-y-6">
                      {/* Header Section */}
                      <div className="border-b pb-6">
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <TrendingUp className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <h3 className="text-2xl font-bold">Historical Trends</h3>
                              <p className="text-sm text-muted-foreground">Real-time analysis of sensor data over time</p>
                            </div>
                          </div>
                          <Sheet open={chartFiltersOpen} onOpenChange={setChartFiltersOpen}>
                            <SheetTrigger asChild>
                              <Button variant="outline" size="sm" className="shrink-0">
                                <Filter className="h-4 w-4 mr-2" />
                                Filters
                              </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
                              <SheetHeader>
                                <SheetTitle>Filters & Time Period</SheetTitle>
                                <SheetDescription>Adjust chamber, period, and custom range for historical charts.</SheetDescription>
                              </SheetHeader>

                              <div className="space-y-4 px-4 pb-4">
                                {/* Clear All Button */}
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setFilterRoom('all')
                                      setChartTimePeriod('week')
                                      setChartDateFrom(undefined)
                                      setChartDateTo(undefined)
                                    }}
                                    className="h-9"
                                  >
                                    <X className="h-4 w-4 mr-1" />
                                    Clear All
                                  </Button>
                                </div>

                                {/* Chamber Filter */}
                                <div className="space-y-3">
                                  <Label className="text-sm font-semibold">Chamber Selection</Label>
                                  <div className="flex flex-wrap gap-2">
                                    {(['all', 'fruiting', 'spawning'] as const).map((room) => (
                                      <Button
                                        key={room}
                                        variant={filterRoom === room ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setFilterRoom(room)}
                                        className={filterRoom === room ? 'ring-2 ring-offset-2 ring-primary' : ''}
                                      >
                                        {room === 'all' ? 'All Chambers' : room === 'fruiting' ? 'Fruiting' : 'Spawning'}
                                      </Button>
                                    ))}
                                  </div>
                                </div>

                                {/* Time Period Selection */}
                                <div className="space-y-3 pt-2 border-t">
                                  <Label className="text-sm font-semibold">Time Period</Label>
                                  <div className="grid grid-cols-2 gap-2">
                                    {(['day', 'week', 'month', 'year'] as const).map((period) => (
                                      <Button
                                        key={period}
                                        variant={chartTimePeriod === period ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setTimePeriod(period)}
                                        className={`transition-all ${chartTimePeriod === period ? 'ring-2 ring-offset-2 ring-primary' : ''}`}
                                      >
                                        {period === 'day' ? 'Today' : period === 'week' ? 'This Week' : period === 'month' ? 'This Month' : 'This Year'}
                                      </Button>
                                    ))}
                                  </div>
                                </div>

                                {/* Custom Date Range */}
                                <div className="space-y-2 pt-2 border-t">
                                  <Label className="text-sm font-semibold">Custom Date Range</Label>
                                  <div className="flex flex-wrap items-end gap-3">
                                    <div className="space-y-1">
                                      <Label className="text-xs text-muted-foreground mb-1 block">From</Label>
                                      <Popover>
                                        <PopoverTrigger asChild>
                                          <Button variant="outline" className="w-[160px] justify-start gap-2">
                                            <CalendarIcon className="h-4 w-4" />
                                            {chartDateFrom ? format(chartDateFrom, "MMM dd, yyyy") : "Select start date"}
                                          </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                          <Calendar
                                            mode="single"
                                            selected={chartDateFrom}
                                            onSelect={(date) => {
                                              setChartDateFrom(date)
                                              setChartTimePeriod('day')
                                            }}
                                            initialFocus
                                          />
                                        </PopoverContent>
                                      </Popover>
                                    </div>

                                    <div className="space-y-1">
                                      <Label className="text-xs text-muted-foreground mb-1 block">To</Label>
                                      <Popover>
                                        <PopoverTrigger asChild>
                                          <Button variant="outline" className="w-[160px] justify-start gap-2">
                                            <CalendarIcon className="h-4 w-4" />
                                            {chartDateTo ? format(chartDateTo, "MMM dd, yyyy") : "Select end date"}
                                          </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                          <Calendar
                                            mode="single"
                                            selected={chartDateTo}
                                            onSelect={(date) => {
                                              setChartDateTo(date)
                                              setChartTimePeriod('day')
                                            }}
                                            initialFocus
                                          />
                                        </PopoverContent>
                                      </Popover>
                                    </div>

                                    {(chartDateFrom || chartDateTo) && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setChartDateFrom(undefined)
                                          setChartDateTo(undefined)
                                        }}
                                        className="h-9"
                                      >
                                        <X className="h-4 w-4 mr-1" />
                                        Clear
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </SheetContent>
                          </Sheet>
                        </div>
                      </div>

                      {/* Data Summary Stats */}
                      <Card className="border-none shadow-sm bg-gradient-to-r from-primary/5 to-primary/10">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <Activity className="h-4 w-4 text-primary" />
                              Summary Statistics
                            </CardTitle>
                            <Badge variant="outline" className="bg-background">{chartSummary.totalReadings} readings</Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {/* Temperature Summary */}
                            <div className="space-y-3 p-3 bg-background/50 rounded-lg border border-red-200/50 dark:border-red-900/30">
                              <div className="flex items-center gap-2">
                                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded">
                                  <Thermometer className="h-4 w-4 text-red-600 dark:text-red-400" />
                                </div>
                                <span className="font-semibold text-sm">Temperature</span>
                              </div>
                              <div className="grid grid-cols-3 gap-2 text-xs">
                                <div className="text-center">
                                  <div className="text-muted-foreground text-xs mb-1">Avg</div>
                                  <div className="font-bold text-sm">{chartSummary.avgTemp}°</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-muted-foreground text-xs mb-1">Min</div>
                                  <div className="font-bold text-sm text-blue-600 dark:text-blue-400">{chartSummary.minTemp}°</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-muted-foreground text-xs mb-1">Max</div>
                                  <div className="font-bold text-sm text-red-600 dark:text-red-400">{chartSummary.maxTemp}°</div>
                                </div>
                              </div>
                            </div>

                            {/* Humidity Summary */}
                            <div className="space-y-3 p-3 bg-background/50 rounded-lg border border-blue-200/50 dark:border-blue-900/30">
                              <div className="flex items-center gap-2">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded">
                                  <Droplets className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <span className="font-semibold text-sm">Humidity</span>
                              </div>
                              <div className="grid grid-cols-3 gap-2 text-xs">
                                <div className="text-center">
                                  <div className="text-muted-foreground text-xs mb-1">Avg</div>
                                  <div className="font-bold text-sm">{chartSummary.avgHumidity}%</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-muted-foreground text-xs mb-1">Min</div>
                                  <div className="font-bold text-sm text-orange-600 dark:text-orange-400">{chartSummary.minHumidity}%</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-muted-foreground text-xs mb-1">Max</div>
                                  <div className="font-bold text-sm text-blue-600 dark:text-blue-400">{chartSummary.maxHumidity}%</div>
                                </div>
                              </div>
                            </div>

                            {/* CO2 Summary */}
                            <div className="space-y-3 p-3 bg-background/50 rounded-lg border border-gray-200/50 dark:border-gray-700/50">
                              <div className="flex items-center gap-2">
                                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
                                  <Wind className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                </div>
                                <span className="font-semibold text-sm">CO₂</span>
                              </div>
                              <div className="grid grid-cols-3 gap-2 text-xs">
                                <div className="text-center">
                                  <div className="text-muted-foreground text-xs mb-1">Avg</div>
                                  <div className="font-bold text-sm">{chartSummary.avgCo2} pm</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-muted-foreground text-xs mb-1">Min</div>
                                  <div className="font-bold text-sm text-green-600 dark:text-green-400">{chartSummary.minCo2} p</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-muted-foreground text-xs mb-1">Max</div>
                                  <div className="font-bold text-sm text-red-600 dark:text-red-400">{chartSummary.maxCo2} p</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Charts Grid */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="h-1 w-6 bg-primary rounded-full"></div>
                          <h4 className="font-semibold text-sm">Data Visualization</h4>
                        </div>
                        <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4">
                          {/* Temperature Chart */}
                          <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-base flex items-center gap-2">
                                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded">
                                  <Thermometer className="h-4 w-4 text-red-600" />
                                </div>
                                Temperature Trend
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-2">
                              {chartData.length === 0 ? (
                                <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
                                  No data available for selected period
                                </div>
                              ) : (
                                <ResponsiveContainer width="100%" height={250}>
                                  <AreaChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                    <XAxis
                                      dataKey="time"
                                      tick={{ fontSize: 12 }}
                                      angle={-45}
                                      textAnchor="end"
                                      height={80}
                                    />
                                    <YAxis tick={{ fontSize: 12 }} label={{ value: '°C', angle: -90, position: 'insideLeft' }} />
                                    <Tooltip cursor={{ fill: 'var(--muted)' }} />
                                    <Legend />
                                    <Area
                                      type="monotone"
                                      dataKey="temperature"
                                      stroke="#ef4444"
                                      fill="#fca5a5"
                                      name="Temperature (°C)"
                                    />
                                  </AreaChart>
                                </ResponsiveContainer>
                              )}
                            </CardContent>
                          </Card>

                          {/* Humidity Chart */}
                          <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-base flex items-center gap-2">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded">
                                  <Droplets className="h-4 w-4 text-blue-600" />
                                </div>
                                Humidity Trend
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-2">
                              {chartData.length === 0 ? (
                                <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
                                  No data available for selected period
                                </div>
                              ) : (
                                <ResponsiveContainer width="100%" height={250}>
                                  <AreaChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                    <XAxis
                                      dataKey="time"
                                      tick={{ fontSize: 12 }}
                                      angle={-45}
                                      textAnchor="end"
                                      height={80}
                                    />
                                    <YAxis tick={{ fontSize: 12 }} label={{ value: '%', angle: -90, position: 'insideLeft' }} />
                                    <Tooltip cursor={{ fill: 'var(--muted)' }} />
                                    <Legend />
                                    <Area
                                      type="monotone"
                                      dataKey="humidity"
                                      stroke="#3b82f6"
                                      fill="#93c5fd"
                                      name="Humidity (%)"
                                    />
                                  </AreaChart>
                                </ResponsiveContainer>
                              )}
                            </CardContent>
                          </Card>

                          {/* CO2 Chart */}
                          <Card className="border-none shadow-sm hover:shadow-md transition-shadow 2xl:col-span-2">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-base flex items-center gap-2">
                                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
                                  <Wind className="h-4 w-4 text-gray-600" />
                                </div>
                                CO₂ Level Trend
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-2">
                              {chartData.length === 0 ? (
                                <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
                                  No data available for selected period
                                </div>
                              ) : (
                                <ResponsiveContainer width="100%" height={250}>
                                  <AreaChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                    <XAxis
                                      dataKey="time"
                                      tick={{ fontSize: 12 }}
                                      angle={-45}
                                      textAnchor="end"
                                      height={80}
                                    />
                                    <YAxis tick={{ fontSize: 12 }} label={{ value: 'ppm', angle: -90, position: 'insideLeft' }} />
                                    <Tooltip cursor={{ fill: 'var(--muted)' }} />
                                    <Legend />
                                    <Area
                                      type="monotone"
                                      dataKey="co2"
                                      stroke="#6b7280"
                                      fill="#d1d5db"
                                      name="CO₂ (ppm)"
                                    />
                                  </AreaChart>
                                </ResponsiveContainer>
                              )}
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Data Table Tab */}
                  <TabsContent value="logs" className="m-0 p-4 sm:p-6">
                    <div className="space-y-6">
                      {/* Header Section */}
                      <div className="border-b pb-6">
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <Filter className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <h3 className="text-2xl font-bold">Sensor Data Records</h3>
                              <p className="text-sm text-muted-foreground">Browse and analyze individual sensor readings</p>
                            </div>
                          </div>

                          <Sheet open={tableFiltersOpen} onOpenChange={setTableFiltersOpen}>
                            <SheetTrigger asChild>
                              <Button variant="outline" size="sm" className="shrink-0">
                                <Filter className="h-4 w-4 mr-2" />
                                Filters
                              </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
                              <SheetHeader>
                                <SheetTitle>Filters & Sorting</SheetTitle>
                                <SheetDescription>Refine records by chamber, sorting, page size, and date range.</SheetDescription>
                              </SheetHeader>

                              <div className="space-y-6 px-4 pb-4">
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={clearFilters}
                                    className="h-9"
                                  >
                                    <X className="h-4 w-4 mr-1" />
                                    Clear All
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleExportData}
                                    className="h-9"
                                  >
                                    <Download className="h-4 w-4 mr-1" />
                                    Export
                                  </Button>
                                </div>

                                {/* Chamber Filter - Button Group */}
                                <div className="space-y-3">
                                  <Label className="text-sm font-semibold">Chamber Selection</Label>
                                  <div className="flex flex-wrap gap-2">
                                    {(['all', 'fruiting', 'spawning'] as const).map((room) => (
                                      <Button
                                        key={room}
                                        variant={filterRoom === room ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setFilterRoom(room)}
                                        className={filterRoom === room ? 'ring-2 ring-offset-2 ring-primary' : ''}
                                      >
                                        {room === 'all' ? 'All Chambers' : room === 'fruiting' ? 'Fruiting' : 'Spawning'}
                                      </Button>
                                    ))}
                                  </div>
                                </div>

                                {/* Sorting Controls Grid */}
                                <div className="space-y-2 pt-2 border-t">
                                  <Label className="text-sm font-semibold">Sorting Options</Label>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {/* Sort By */}
                                    <div className="space-y-2">
                                      <Label className="text-xs text-muted-foreground">Sort By</Label>
                                      <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'timestamp' | 'temperature' | 'humidity' | 'co2')}>
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="timestamp">Timestamp</SelectItem>
                                          <SelectItem value="temperature">Temperature</SelectItem>
                                          <SelectItem value="humidity">Humidity</SelectItem>
                                          <SelectItem value="co2">CO₂</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    {/* Sort Order */}
                                    <div className="space-y-2">
                                      <Label className="text-xs text-muted-foreground">Order</Label>
                                      <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as 'asc' | 'desc')}>
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="desc">Newest First</SelectItem>
                                          <SelectItem value="asc">Oldest First</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>

                                  </div>
                                </div>

                                {/* Date Range Filters */}
                                <div className="space-y-2 pt-2 border-t">
                                  <Label className="text-sm font-semibold">Date Range</Label>
                                  <div className="flex flex-wrap items-end gap-3">
                                    <div className="space-y-1">
                                      <Label className="text-xs text-muted-foreground mb-1 block">From Date</Label>
                                      <Popover>
                                        <PopoverTrigger asChild>
                                          <Button variant="outline" className="w-[160px] justify-start gap-2">
                                            <CalendarIcon className="h-4 w-4" />
                                            {dateFrom ? format(dateFrom, "MMM dd, yyyy") : "Start date"}
                                          </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                          <Calendar
                                            mode="single"
                                            selected={dateFrom}
                                            onSelect={setDateFrom}
                                            initialFocus
                                          />
                                        </PopoverContent>
                                      </Popover>
                                    </div>

                                    <div className="space-y-1">
                                      <Label className="text-xs text-muted-foreground mb-1 block">To Date</Label>
                                      <Popover>
                                        <PopoverTrigger asChild>
                                          <Button variant="outline" className="w-[160px] justify-start gap-2">
                                            <CalendarIcon className="h-4 w-4" />
                                            {dateTo ? format(dateTo, "MMM dd, yyyy") : "End date"}
                                          </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                          <Calendar
                                            mode="single"
                                            selected={dateTo}
                                            onSelect={setDateTo}
                                            initialFocus
                                          />
                                        </PopoverContent>
                                      </Popover>
                                    </div>

                                    {(dateFrom || dateTo) && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setDateFrom(undefined)
                                          setDateTo(undefined)
                                        }}
                                        className="h-9"
                                      >
                                        <X className="h-4 w-4 mr-1" />
                                        Clear
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </SheetContent>
                          </Sheet>
                        </div>
                      </div>

                      {/* Data Statistics */}
                      <Card className="border-none shadow-sm bg-linear-to-r from-primary/5 to-primary/10">
                        <CardContent className="pt-6">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {/* Current View */}
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <div className="p-2 bg-primary/10 rounded">
                                  <Activity className="h-4 w-4 text-primary" />
                                </div>
                                <span className="text-sm font-semibold text-muted-foreground">Showing</span>
                              </div>
                              <div className="text-lg font-bold">
                                {((currentPage - 1) * itemsPerPage) + 1}–{Math.min(currentPage * itemsPerPage, filteredAndSortedLogs.length)}
                              </div>
                              <div className="text-xs text-muted-foreground">of {filteredAndSortedLogs.length} filtered records</div>
                            </div>

                            {/* Filtered Results */}
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded">
                                  <Filter className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <span className="text-sm font-semibold text-muted-foreground">Filtered</span>
                              </div>
                              <div className="text-lg font-bold">
                                {filteredAndSortedLogs.length}
                              </div>
                              <div className="text-xs text-muted-foreground">active filters applied</div>
                            </div>

                            {/* Total Records */}
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
                                  <Badge className="h-4 w-4 text-gray-600 dark:text-gray-400 p-0" variant="outline">📊</Badge>
                                </div>
                                <span className="text-sm font-semibold text-muted-foreground">Total</span>
                              </div>
                              <div className="text-lg font-bold">
                                {sensorLogs.length}
                              </div>
                              <div className="text-xs text-muted-foreground">all sensor records</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Sensor Logs Table */}
                      <div className="w-full rounded-lg border bg-gradient-to-b from-background to-muted/30">
                        {loading ? (
                          <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                          </div>
                        ) : paginatedLogs.length > 0 ? (
                          <div className="p-2 sm:p-4 space-y-3">
                            {paginatedLogs.map((log, index) => (
                              <Card key={`${log.room}-${log.timestamp}-${index}`} className="p-3 sm:p-4 hover:bg-muted/50 transition-colors">
                                <div className="flex items-center justify-between">
                                  <div className="space-y-2 flex-1">
                                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                      <Badge
                                        variant={log.room === 'fruiting' ? 'default' : 'secondary'}
                                        className={log.room === 'fruiting' ? 'bg-green-500' : ''}
                                      >
                                        {log.room === 'fruiting' ? 'Fruiting' : 'Spawning'}
                                      </Badge>
                                      <span className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                                        <CalendarIcon className="h-3 w-3" />
                                        {formatTimestamp(log.timestamp)}
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                      <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-950/20 rounded-lg">
                                        <Thermometer className="h-4 w-4 text-red-500" />
                                        <div>
                                          <div className="text-xs text-muted-foreground">Temp</div>
                                          <div className="text-sm sm:text-base font-semibold">{log.data?.temperature ?? 'N/A'}°C</div>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                                        <Droplets className="h-4 w-4 text-blue-500" />
                                        <div>
                                          <div className="text-xs text-muted-foreground">Humidity</div>
                                          <div className="text-sm sm:text-base font-semibold">{log.data?.humidity ?? 'N/A'}%</div>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                                        <Wind className="h-4 w-4 text-gray-500" />
                                        <div>
                                          <div className="text-xs text-muted-foreground">CO₂</div>
                                          <div className="text-sm sm:text-base font-semibold">{log.data?.co2 ?? 'N/A'} ppm</div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12 text-muted-foreground">
                            {filteredAndSortedLogs.length === 0 ? "No sensor logs match your filters" : "No sensor logs available"}
                          </div>
                        )}
                      </div>

                      <PaginationWrapper
                        totalItems={filteredAndSortedLogs.length}
                        itemsPerPage={itemsPerPage}
                        currentPage={currentPage}
                        onPageChange={setCurrentPage}
                        label="records"
                        rowsPerPageOptions={[5, 10, 25, 50, 100]}
                        onItemsPerPageChange={(rows) => {
                          setItemsPerPage(rows)
                          setCurrentPage(1)
                        }}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>,
    document.body
  )
}
