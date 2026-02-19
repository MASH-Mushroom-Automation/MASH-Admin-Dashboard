"use client"

import { useEffect, useState, useMemo } from "react"
import { createPortal } from "react-dom"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Thermometer, Droplets, Wind, Calendar as CalendarIcon, Activity, Play, Pause, Filter, Download, TrendingUp, ChevronLeft, ChevronRight, X } from "lucide-react"
import { database } from "@/lib/firebase"
import { ref, onValue, off, query, limitToLast, orderByKey, startAt, endAt } from "firebase/database"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from "recharts"
import { format, subWeeks, subMonths, subYears, startOfDay, endOfDay } from "date-fns"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

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

  const totalPages = Math.ceil(filteredAndSortedLogs.length / itemsPerPage)

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

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm p-4 sm:p-6">
      <div className="relative w-full h-full flex flex-col bg-background border rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
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
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => onOpenChange(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground px-3 sm:px-4 pb-3">
            Real-time sensor data and historical analytics for <span className="font-mono text-primary font-medium">{serialNumber}</span>
          </p>
        </div>

        {/* Main Content */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-3 shrink-0 mx-3 sm:mx-4 mt-2">
            <TabsTrigger value="latest" className="text-xs sm:text-sm">Latest Readings</TabsTrigger>
            <TabsTrigger value="charts" className="text-xs sm:text-sm">Charts & Trends</TabsTrigger>
            <TabsTrigger value="logs" className="text-xs sm:text-sm">Data Table</TabsTrigger>
          </TabsList>

          {/* Latest Readings Tab */}
          <TabsContent value="latest" className="flex-1 overflow-auto m-0 p-3 sm:p-4">
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
          <TabsContent value="charts" className="flex-1 overflow-auto m-0 p-3 sm:p-4">
            <div className="space-y-3">
              {/* Header with filters */}
              <div className="flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    <h3 className="text-sm sm:text-base font-semibold">Historical Trends</h3>
                  </div>
                  <Select value={filterRoom} onValueChange={(value) => setFilterRoom(value as 'all' | 'fruiting' | 'spawning')}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Filter by room" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Chambers</SelectItem>
                      <SelectItem value="fruiting">Fruiting Only</SelectItem>
                      <SelectItem value="spawning">Spawning Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Time Period Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted-foreground mr-2">Quick Select:</span>
                  <Button
                    variant={chartTimePeriod === 'day' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTimePeriod('day')}
                    className="h-8"
                  >
                    Day
                  </Button>
                  <Button
                    variant={chartTimePeriod === 'week' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTimePeriod('week')}
                    className="h-8"
                  >
                    Week
                  </Button>
                  <Button
                    variant={chartTimePeriod === 'month' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTimePeriod('month')}
                    className="h-8"
                  >
                    Month
                  </Button>
                  <Button
                    variant={chartTimePeriod === 'year' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTimePeriod('year')}
                    className="h-8"
                  >
                    Year
                  </Button>
                </div>

                {/* Custom Date Range */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                  <span className="text-xs text-muted-foreground">Custom Range:</span>
                  <div className="flex flex-wrap items-center gap-2 flex-1">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 text-xs w-[140px] justify-start">
                          <CalendarIcon className="mr-2 h-3 w-3" />
                          {chartDateFrom ? format(chartDateFrom, "MMM dd, yyyy") : "From Date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={chartDateFrom}
                          onSelect={(date) => {
                            setChartDateFrom(date)
                            setChartTimePeriod('day') // Reset quick select
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    
                    <span className="text-xs text-muted-foreground">to</span>
                    
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 text-xs w-[140px] justify-start">
                          <CalendarIcon className="mr-2 h-3 w-3" />
                          {chartDateTo ? format(chartDateTo, "MMM dd, yyyy") : "To Date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={chartDateTo}
                          onSelect={(date) => {
                            setChartDateTo(date)
                            setChartTimePeriod('day') // Reset quick select
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>

                    {(chartDateFrom || chartDateTo) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setChartDateFrom(undefined)
                          setChartDateTo(undefined)
                        }}
                        className="h-8 text-xs"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Clear
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Data Info Display */}
              <div className="p-3 bg-muted/50 rounded-lg border border-border">
                <div className="flex flex-wrap gap-4 text-xs">
                  <div>
                    <span className="text-muted-foreground">Period: </span>
                    <span className="font-medium">{chartTimePeriod.charAt(0).toUpperCase() + chartTimePeriod.slice(1)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Range: </span>
                    <span className="font-medium">
                      {chartDateFrom ? format(chartDateFrom, "MMM dd, yyyy") : "Start"} → {chartDateTo ? format(chartDateTo, "MMM dd, yyyy") : "End"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Raw Data: </span>
                    <span className="font-medium">{chartFilteredLogs.length} points</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Aggregated: </span>
                    <span className="font-medium">{chartData.length} points</span>
                  </div>
                </div>
              </div>

              {/* Summary Statistics */}
              <Card className="bg-muted/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Summary Statistics
                    <Badge variant="outline" className="ml-auto">{chartSummary.totalReadings} readings</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Temperature Summary */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <Thermometer className="h-3 w-3 text-red-500" />
                        Temperature
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <div className="text-muted-foreground">Avg</div>
                          <div className="font-semibold">{chartSummary.avgTemp}°C</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Min</div>
                          <div className="font-semibold text-blue-600">{chartSummary.minTemp}°C</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Max</div>
                          <div className="font-semibold text-red-600">{chartSummary.maxTemp}°C</div>
                        </div>
                      </div>
                    </div>

                    {/* Humidity Summary */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <Droplets className="h-3 w-3 text-blue-500" />
                        Humidity
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <div className="text-muted-foreground">Avg</div>
                          <div className="font-semibold">{chartSummary.avgHumidity}%</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Min</div>
                          <div className="font-semibold text-orange-600">{chartSummary.minHumidity}%</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Max</div>
                          <div className="font-semibold text-blue-600">{chartSummary.maxHumidity}%</div>
                        </div>
                      </div>
                    </div>

                    {/* CO2 Summary */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <Wind className="h-3 w-3 text-gray-500" />
                        CO₂
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <div className="text-muted-foreground">Avg</div>
                          <div className="font-semibold">{chartSummary.avgCo2} ppm</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Min</div>
                          <div className="font-semibold text-green-600">{chartSummary.minCo2} ppm</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Max</div>
                          <div className="font-semibold text-red-600">{chartSummary.maxCo2} ppm</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Charts */}
              <div className="grid grid-cols-1 2xl:grid-cols-2 gap-3 sm:gap-4">
              {/* Temperature Chart */}
              <Card className="flex flex-col">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                    <Thermometer className="h-4 w-4 text-red-500" />
                    Temperature Over Time
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-2">
                  {chartData.length === 0 ? (
                    <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
                      No data available for selected period
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <AreaChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="time" 
                          tick={{ fontSize: 12 }}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis tick={{ fontSize: 12 }} label={{ value: '°C', angle: -90, position: 'insideLeft' }} />
                        <Tooltip />
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
              <Card className="flex flex-col">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                    <Droplets className="h-4 w-4 text-blue-500" />
                    Humidity Over Time
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-2">
                  {chartData.length === 0 ? (
                    <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
                      No data available for selected period
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <AreaChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="time" 
                          tick={{ fontSize: 12 }}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis tick={{ fontSize: 12 }} label={{ value: '%', angle: -90, position: 'insideLeft' }} />
                        <Tooltip />
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
              <Card className="flex flex-col 2xl:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                    <Wind className="h-4 w-4 text-gray-500" />
                    CO₂ Levels Over Time
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-2">
                  {chartData.length === 0 ? (
                    <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
                      No data available for selected period
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <AreaChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="time" 
                          tick={{ fontSize: 12 }}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis tick={{ fontSize: 12 }} label={{ value: 'ppm', angle: -90, position: 'insideLeft' }} />
                        <Tooltip />
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
          </TabsContent>

          {/* Data Table Tab */}
          <TabsContent value="logs" className="flex-1 overflow-auto m-0 p-3 sm:p-4">
            <div className="space-y-3">
              {/* Filters and Controls */}
              <div className="flex flex-col gap-3 p-3 sm:p-4 border rounded-lg bg-muted/30">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <h3 className="text-sm sm:text-base font-semibold">Filters & Controls</h3>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    <X className="h-3 w-3 mr-1" />
                    Clear Filters
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExportData}>
                    <Download className="h-3 w-3 mr-1" />
                    Export CSV
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* Room Filter */}
                <div className="space-y-2">
                  <Label className="text-xs">Room</Label>
                  <Select value={filterRoom} onValueChange={(value) => setFilterRoom(value as 'all' | 'fruiting' | 'spawning')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Chambers</SelectItem>
                      <SelectItem value="fruiting">Fruiting</SelectItem>
                      <SelectItem value="spawning">Spawning</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort By */}
                <div className="space-y-2">
                  <Label className="text-xs">Sort By</Label>
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
                  <Label className="text-xs">Order</Label>
                  <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as 'asc' | 'desc')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">Descending</SelectItem>
                      <SelectItem value="asc">Ascending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Items Per Page */}
                <div className="space-y-2">
                  <Label className="text-xs">Per Page</Label>
                  <Select value={itemsPerPage.toString()} onValueChange={(value) => {setItemsPerPage(Number(value)); setCurrentPage(1)}}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Date Range Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">From Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateFrom ? format(dateFrom, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dateFrom}
                        onSelect={setDateFrom}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">To Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateTo ? format(dateTo, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dateTo}
                        onSelect={setDateTo}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            {/* Data Stats */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs sm:text-sm text-muted-foreground px-2">
              <span>
                Showing <strong>{((currentPage - 1) * itemsPerPage) + 1}</strong> to{" "}
                <strong>{Math.min(currentPage * itemsPerPage, filteredAndSortedLogs.length)}</strong> of{" "}
                <strong>{filteredAndSortedLogs.length}</strong> records
              </span>
              <span>
                Total: <strong>{sensorLogs.length}</strong> entries
              </span>
            </div>

            {/* Sensor Logs Table */}
            <ScrollArea className="h-[450px] sm:h-[500px] lg:h-[600px] w-full rounded-md border">
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
            </ScrollArea>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="w-full sm:w-auto"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="w-full sm:w-auto">
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>,
    document.body
  )
}
