"use client";

import { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Thermometer,
  Droplets,
  Wind,
  Calendar as CalendarIcon,
  Activity,
  Play,
  Pause,
  Filter,
  Download,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import { database } from "@/lib/firebase";
import { ref, onValue, off, query, limitToLast, get } from "firebase/database";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import {
  format,
  subWeeks,
  subMonths,
  subYears,
  startOfDay,
  endOfDay,
} from "date-fns";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import PaginationWrapper from "@/components/pagination";
import AppSidebar from "@/components/sidebar";
import Navbar from "@/components/navbar";

interface SensorReading {
  temperature: number;
  humidity: number;
  co2: number;
  timestamp?: number;
}

interface LatestReading {
  fruiting: SensorReading;
  spawning: SensorReading;
  timestamp: number;
}

interface SensorLog {
  timestamp: string;
  data: SensorReading;
  room: "fruiting" | "spawning";
}

interface HourlyAggregate {
  time: string;
  room: "fruiting" | "spawning";
  avg_temp: number | null;
  max_temp: number | null;
  min_temp: number | null;
  avg_hum: number | null;
  max_hum: number | null;
  min_hum: number | null;
  avg_co2: number | null;
  max_co2: number | null;
  min_co2: number | null;
  sample_count: number;
}

interface ActuatorLog {
  key: string;
  actuator: string;
  mode: string;
  room: string;
  state: "ON" | "OFF";
  timestamp: string;
  timestamp_unix: number;
}

interface LatestActuators {
  device?: Record<string, boolean>;
  fruiting?: Record<string, boolean>;
  spawning?: Record<string, boolean>;
  timestamp?: string;
}

interface SensorLogsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serialNumber: string;
}

export default function SensorLogsModal({
  open,
  onOpenChange,
  serialNumber,
}: SensorLogsModalProps) {
  const [latestReading, setLatestReading] = useState<LatestReading | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  // Feature toggles and filters
  const [liveUpdate, setLiveUpdate] = useState(true);
  const [sortBy, setSortBy] = useState<
    "timestamp" | "temperature" | "humidity" | "co2"
  >("timestamp");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filterRoom, setFilterRoom] = useState<"all" | "fruiting" | "spawning">(
    "all",
  );
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedTab, setSelectedTab] = useState("latest");

  // Chart-specific filters
  const [chartTimePeriod, setChartTimePeriod] = useState<
    "day" | "week" | "month" | "year"
  >("week");
  const [chartDateFrom, setChartDateFrom] = useState<Date | undefined>(
    undefined,
  );
  const [chartDateTo, setChartDateTo] = useState<Date | undefined>(undefined);
  const [chartFiltersOpen, setChartFiltersOpen] = useState(false);
  const [tableFiltersOpen, setTableFiltersOpen] = useState(false);
  const [aggregatesData, setAggregatesData] = useState<
    HourlyAggregate[] | null
  >(null);
  // Actuator state
  const [actuatorLogs, setActuatorLogs] = useState<ActuatorLog[]>([]);
  const [latestActuators, setLatestActuators] =
    useState<LatestActuators | null>(null);
  const [actuatorLogsPage, setActuatorLogsPage] = useState(1);
  const [actuatorLogsPerPage, setActuatorLogsPerPage] = useState(20);
  const [actuatorLogsRoom, setActuatorLogsRoom] = useState<
    "all" | "fruiting" | "spawning"
  >("all");

  // Initialize chart date range on mount
  useEffect(() => {
    if (open && !chartDateFrom && !chartDateTo) {
      console.log("[Charts] Initializing default date range (last week)");
      const now = new Date();
      const from = startOfDay(subWeeks(now, 1));
      const to = endOfDay(now);
      console.log("[Charts] Setting default range:", { from, to });
      setChartDateFrom(from);
      setChartDateTo(to);
    }
  }, [open, chartDateFrom, chartDateTo]);

  useEffect(() => {
    if (!open || !serialNumber || !liveUpdate) return;

    setLoading(true);

    // Subscribe to latest reading
    const latestReadingRef = ref(
      database,
      `devices/${serialNumber}/latest_reading`,
    );
    onValue(
      latestReadingRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setLatestReading(snapshot.val());
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching latest reading:", error);
        setLoading(false);
      },
    );

    // Cleanup listener
    return () => {
      off(latestReadingRef);
    };
  }, [open, serialNumber, liveUpdate]);

  // Fetch pre-computed hourly aggregates from historical_aggregates RTDB path
  useEffect(() => {
    if (!open || !serialNumber || !chartDateFrom) {
      setAggregatesData(null);
      return;
    }

    setAggregatesData(null);

    const rooms: Array<"fruiting" | "spawning"> = ["fruiting", "spawning"];
    const from = chartDateFrom;
    const to = chartDateTo ?? new Date();

    // Build list of YYYY-MM months covered by the date range
    const months: string[] = [];
    const cursor = new Date(from.getFullYear(), from.getMonth(), 1);
    while (cursor <= to) {
      months.push(format(cursor, "yyyy-MM"));
      cursor.setMonth(cursor.getMonth() + 1);
    }

    const fetchPromises = rooms.flatMap((room) =>
      months.map(async (ym) => {
        try {
          const snap = await get(
            ref(
              database,
              `historical_aggregates/${serialNumber}/${room}/${ym}`,
            ),
          );
          if (!snap.exists()) return [] as HourlyAggregate[];
          const monthData = snap.val() as Record<
            string,
            Record<string, Record<string, unknown>>
          >;
          const results: HourlyAggregate[] = [];
          for (const day of Object.keys(monthData)) {
            const dayData = monthData[day];
            for (const hour of Object.keys(dayData)) {
              const entry = dayData[hour];
              const timeStr = `${ym}-${day} ${hour}`;
              const entryDate = new Date(timeStr);
              if (entryDate < startOfDay(from) || entryDate > endOfDay(to))
                continue;
              results.push({
                time: timeStr,
                room,
                avg_temp:
                  typeof entry.avg_temp === "number" ? entry.avg_temp : null,
                max_temp:
                  typeof entry.max_temp === "number" ? entry.max_temp : null,
                min_temp:
                  typeof entry.min_temp === "number" ? entry.min_temp : null,
                avg_hum:
                  typeof entry.avg_hum === "number" ? entry.avg_hum : null,
                max_hum:
                  typeof entry.max_hum === "number" ? entry.max_hum : null,
                min_hum:
                  typeof entry.min_hum === "number" ? entry.min_hum : null,
                avg_co2:
                  typeof entry.avg_co2 === "number" ? entry.avg_co2 : null,
                max_co2:
                  typeof entry.max_co2 === "number" ? entry.max_co2 : null,
                min_co2:
                  typeof entry.min_co2 === "number" ? entry.min_co2 : null,
                sample_count:
                  typeof entry.sample_count === "number"
                    ? entry.sample_count
                    : 0,
              });
            }
          }
          return results;
        } catch (err) {
          console.error(`[Aggregates] Failed to fetch ${room}/${ym}:`, err);
          return [] as HourlyAggregate[];
        }
      }),
    );

    Promise.all(fetchPromises).then((results) => {
      const combined = results
        .flat()
        .sort((a, b) => a.time.localeCompare(b.time));
      setAggregatesData(combined);
    });
  }, [open, serialNumber, chartDateFrom, chartDateTo]);

  // Fetch latest actuator states (live)
  useEffect(() => {
    if (!open || !serialNumber) return;

    const latestActuatorsRef = ref(
      database,
      `devices/${serialNumber}/latest_actuators`,
    );
    onValue(
      latestActuatorsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setLatestActuators(snapshot.val() as LatestActuators);
        }
      },
      (error) => {
        console.error("Error fetching latest actuators:", error);
      },
    );
    return () => {
      off(latestActuatorsRef);
    };
  }, [open, serialNumber]);

  // Fetch actuator log history (newest 500 events)
  useEffect(() => {
    if (!open || !serialNumber) return;

    const actuatorLogsRef = query(
      ref(database, `actuator_logs/${serialNumber}`),
      limitToLast(500),
    );
    get(actuatorLogsRef)
      .then((snapshot) => {
        if (!snapshot.exists()) {
          setActuatorLogs([]);
          return;
        }
        const data = snapshot.val() as Record<string, Omit<ActuatorLog, "key">>;
        const logs: ActuatorLog[] = Object.keys(data).map((key) => ({
          key,
          ...data[key],
        }));
        logs.sort((a, b) => b.key.localeCompare(a.key));
        setActuatorLogs(logs);
      })
      .catch((err) => {
        console.error("Error fetching actuator logs:", err);
      });
  }, [open, serialNumber]);

  // Helper function for timestamp parsing (used in chartData fallback)
  const parseTimestamp = (timestamp: string): Date => {
    try {
      // Parse: 2026-02-11T17-46-13-883709
      const parts = timestamp.split("T");
      const datePart = parts[0];
      const timePart = parts[1].split("-").slice(0, 3).join(":");
      return new Date(`${datePart}T${timePart}`);
    } catch {
      return new Date();
    }
  };

  // Filter and sort sensor logs (from historical_aggregates — sensor_data has been migrated)
  const filteredAndSortedLogs = useMemo(() => {
    const source = aggregatesData ?? [];
    let filtered = [...source];

    if (filterRoom !== "all") {
      filtered = filtered.filter((a) => a.room === filterRoom);
    }

    if (dateFrom || dateTo) {
      filtered = filtered.filter((a) => {
        const d = new Date(a.time);
        if (dateFrom && d < startOfDay(dateFrom)) return false;
        if (dateTo && d > endOfDay(dateTo)) return false;
        return true;
      });
    }

    filtered.sort((a, b) => {
      let cmp = 0;
      if (sortBy === "timestamp") cmp = a.time.localeCompare(b.time);
      else if (sortBy === "temperature")
        cmp = (a.avg_temp ?? 0) - (b.avg_temp ?? 0);
      else if (sortBy === "humidity") cmp = (a.avg_hum ?? 0) - (b.avg_hum ?? 0);
      else if (sortBy === "co2") cmp = (a.avg_co2 ?? 0) - (b.avg_co2 ?? 0);
      return sortOrder === "asc" ? cmp : -cmp;
    });

    return filtered;
  }, [aggregatesData, filterRoom, dateFrom, dateTo, sortBy, sortOrder]);

  // Paginated logs
  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedLogs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedLogs, currentPage, itemsPerPage]);

  // Filter and paginate actuator logs
  const filteredActuatorLogs = useMemo(() => {
    if (actuatorLogsRoom === "all") return actuatorLogs;
    return actuatorLogs.filter((l) => l.room === actuatorLogsRoom);
  }, [actuatorLogs, actuatorLogsRoom]);

  const paginatedActuatorLogs = useMemo(() => {
    const start = (actuatorLogsPage - 1) * actuatorLogsPerPage;
    return filteredActuatorLogs.slice(start, start + actuatorLogsPerPage);
  }, [filteredActuatorLogs, actuatorLogsPage, actuatorLogsPerPage]);

  // Helper function to set time period
  const setTimePeriod = (period: "day" | "week" | "month" | "year") => {
    console.log("[Charts] Setting time period to:", period);
    setChartTimePeriod(period);
    const now = new Date();
    const to = endOfDay(now);
    let from: Date;

    switch (period) {
      case "day":
        from = startOfDay(now);
        break;
      case "week":
        from = startOfDay(subWeeks(now, 1));
        break;
      case "month":
        from = startOfDay(subMonths(now, 1));
        break;
      case "year":
        from = startOfDay(subYears(now, 1));
        break;
    }

    console.log("[Charts] Date range:", { from, to });
    setChartDateFrom(from);
    setChartDateTo(to);
  };

  // Filter logs for charts based on chart-specific date range
  // (used as fallback in chartData when historical aggregates are unavailable)
  // sensor_data has been fully migrated to historical_aggregates, so this is always empty.
  const chartFilteredLogs = useMemo((): SensorLog[] => [], []);

  // Prepare chart data with aggregation based on time period
  const chartData = useMemo(() => {
    console.log(
      "[Charts] Aggregating data - chartTimePeriod:",
      chartTimePeriod,
      "chartFilteredLogs:",
      chartFilteredLogs.length,
    );
    if (chartFilteredLogs.length === 0) {
      console.log("[Charts] No data to aggregate");
      return [];
    }

    // Aggregate data based on time period
    const aggregated: {
      [key: string]: {
        temps: number[];
        humidities: number[];
        co2s: number[];
        count: number;
      };
    } = {};

    chartFilteredLogs.forEach((log) => {
      const logDate = parseTimestamp(log.timestamp);
      let key: string;

      switch (chartTimePeriod) {
        case "day":
          // Group by hour
          key = format(logDate, "yyyy-MM-dd HH:00");
          break;
        case "week":
          // Group by day
          key = format(logDate, "yyyy-MM-dd");
          break;
        case "month":
          // Group by day
          key = format(logDate, "yyyy-MM-dd");
          break;
        case "year":
          // Group by month
          key = format(logDate, "yyyy-MM");
          break;
        default:
          key = format(logDate, "yyyy-MM-dd HH:mm");
      }

      if (!aggregated[key]) {
        aggregated[key] = { temps: [], humidities: [], co2s: [], count: 0 };
      }

      if (log.data?.temperature != null)
        aggregated[key].temps.push(log.data.temperature);
      if (log.data?.humidity != null)
        aggregated[key].humidities.push(log.data.humidity);
      if (log.data?.co2 != null) aggregated[key].co2s.push(log.data.co2);
      aggregated[key].count++;
    });

    console.log("[Charts] Aggregation keys:", Object.keys(aggregated).length);

    // Convert to array and calculate averages
    const result = Object.keys(aggregated)
      .sort()
      .map((key) => {
        const data = aggregated[key];
        let displayTime: string;

        switch (chartTimePeriod) {
          case "day":
            displayTime = format(new Date(key), "HH:mm");
            break;
          case "week":
          case "month":
            displayTime = format(new Date(key), "MMM dd");
            break;
          case "year":
            displayTime = format(new Date(key + "-01"), "MMM yyyy");
            break;
          default:
            displayTime = format(new Date(key), "MMM dd HH:mm");
        }

        return {
          time: displayTime,
          temperature:
            data.temps.length > 0
              ? parseFloat(
                  (
                    data.temps.reduce((a, b) => a + b, 0) / data.temps.length
                  ).toFixed(1),
                )
              : null,
          humidity:
            data.humidities.length > 0
              ? parseFloat(
                  (
                    data.humidities.reduce((a, b) => a + b, 0) /
                    data.humidities.length
                  ).toFixed(1),
                )
              : null,
          co2:
            data.co2s.length > 0
              ? Math.round(
                  data.co2s.reduce((a, b) => a + b, 0) / data.co2s.length,
                )
              : null,
        };
      });

    console.log("[Charts] Final aggregated data points:", result.length);
    return result;
  }, [chartFilteredLogs, chartTimePeriod]);

  // Build chart data from pre-computed hourly aggregates (more accurate than raw log aggregation)
  const aggregatedChartData = useMemo(() => {
    if (!aggregatesData || aggregatesData.length === 0) return [];

    let filtered = aggregatesData;

    // Filter by room
    if (filterRoom !== "all") {
      filtered = filtered.filter((a) => a.room === filterRoom);
    }

    // Filter by chart date range
    if (chartDateFrom || chartDateTo) {
      filtered = filtered.filter((a) => {
        const t = new Date(a.time);
        const fromMatch = !chartDateFrom || t >= startOfDay(chartDateFrom);
        const toMatch = !chartDateTo || t <= endOfDay(chartDateTo);
        return fromMatch && toMatch;
      });
    }

    // Group by the same time-period keys used in chartData
    const grouped: {
      [key: string]: { temps: number[]; hums: number[]; co2s: number[] };
    } = {};

    filtered.forEach((a) => {
      const d = new Date(a.time);
      let key: string;
      switch (chartTimePeriod) {
        case "day":
          key = format(d, "yyyy-MM-dd HH:00");
          break;
        case "week":
        case "month":
          key = format(d, "yyyy-MM-dd");
          break;
        case "year":
          key = format(d, "yyyy-MM");
          break;
        default:
          key = format(d, "yyyy-MM-dd HH:00");
      }
      if (!grouped[key]) grouped[key] = { temps: [], hums: [], co2s: [] };
      if (a.avg_temp != null) grouped[key].temps.push(a.avg_temp);
      if (a.avg_hum != null) grouped[key].hums.push(a.avg_hum);
      if (a.avg_co2 != null) grouped[key].co2s.push(a.avg_co2);
    });

    return Object.keys(grouped)
      .sort()
      .map((key) => {
        const g = grouped[key];
        let displayTime: string;
        switch (chartTimePeriod) {
          case "day":
            displayTime = format(new Date(key), "HH:mm");
            break;
          case "week":
          case "month":
            displayTime = format(new Date(key), "MMM dd");
            break;
          case "year":
            displayTime = format(new Date(key + "-01"), "MMM yyyy");
            break;
          default:
            displayTime = format(new Date(key), "MMM dd HH:mm");
        }
        return {
          time: displayTime,
          temperature:
            g.temps.length > 0
              ? parseFloat(
                  (g.temps.reduce((a, b) => a + b, 0) / g.temps.length).toFixed(
                    1,
                  ),
                )
              : null,
          humidity:
            g.hums.length > 0
              ? parseFloat(
                  (g.hums.reduce((a, b) => a + b, 0) / g.hums.length).toFixed(
                    1,
                  ),
                )
              : null,
          co2:
            g.co2s.length > 0
              ? Math.round(g.co2s.reduce((a, b) => a + b, 0) / g.co2s.length)
              : null,
        };
      });
  }, [aggregatesData, filterRoom, chartDateFrom, chartDateTo, chartTimePeriod]);

  // Calculate summary statistics
  const chartSummary = useMemo(() => {
    const empty = {
      avgTemp: 0,
      minTemp: 0,
      maxTemp: 0,
      avgHumidity: 0,
      minHumidity: 0,
      maxHumidity: 0,
      avgCo2: 0,
      minCo2: 0,
      maxCo2: 0,
      totalReadings: 0,
    };

    // Prefer pre-computed aggregates — avoids iterating large raw-log arrays
    // which causes a call stack overflow via spread (Math.min/max) at scale.
    if (aggregatesData !== null && aggregatesData.length > 0) {
      let aggs = aggregatesData;
      if (filterRoom !== "all")
        aggs = aggs.filter((a) => a.room === filterRoom);
      if (chartDateFrom || chartDateTo) {
        aggs = aggs.filter((a) => {
          const t = new Date(a.time);
          return (
            (!chartDateFrom || t >= startOfDay(chartDateFrom)) &&
            (!chartDateTo || t <= endOfDay(chartDateTo))
          );
        });
      }
      if (aggs.length === 0) return empty;

      const validT = aggs.filter((a) => a.avg_temp != null);
      const validH = aggs.filter((a) => a.avg_hum != null);
      const validC = aggs.filter((a) => a.avg_co2 != null);

      return {
        avgTemp:
          validT.length > 0
            ? (
                validT.reduce((s, a) => s + a.avg_temp!, 0) / validT.length
              ).toFixed(1)
            : 0,
        minTemp:
          validT.length > 0
            ? validT
                .reduce(
                  (m, a) => Math.min(m, a.min_temp ?? a.avg_temp!),
                  Infinity,
                )
                .toFixed(1)
            : 0,
        maxTemp:
          validT.length > 0
            ? validT
                .reduce(
                  (m, a) => Math.max(m, a.max_temp ?? a.avg_temp!),
                  -Infinity,
                )
                .toFixed(1)
            : 0,
        avgHumidity:
          validH.length > 0
            ? (
                validH.reduce((s, a) => s + a.avg_hum!, 0) / validH.length
              ).toFixed(1)
            : 0,
        minHumidity:
          validH.length > 0
            ? validH
                .reduce(
                  (m, a) => Math.min(m, a.min_hum ?? a.avg_hum!),
                  Infinity,
                )
                .toFixed(1)
            : 0,
        maxHumidity:
          validH.length > 0
            ? validH
                .reduce(
                  (m, a) => Math.max(m, a.max_hum ?? a.avg_hum!),
                  -Infinity,
                )
                .toFixed(1)
            : 0,
        avgCo2:
          validC.length > 0
            ? Math.round(
                validC.reduce((s, a) => s + a.avg_co2!, 0) / validC.length,
              )
            : 0,
        minCo2:
          validC.length > 0
            ? validC.reduce(
                (m, a) => Math.min(m, a.min_co2 ?? a.avg_co2!),
                Infinity,
              )
            : 0,
        maxCo2:
          validC.length > 0
            ? validC.reduce(
                (m, a) => Math.max(m, a.max_co2 ?? a.avg_co2!),
                -Infinity,
              )
            : 0,
        totalReadings: aggs.reduce((s, a) => s + a.sample_count, 0),
      };
    }

    // Fallback: compute from raw logs (safe only with small / capped datasets)
    if (chartFilteredLogs.length === 0) return empty;

    const temps = chartFilteredLogs
      .map((l) => l.data?.temperature)
      .filter((v): v is number => v != null);
    const humidities = chartFilteredLogs
      .map((l) => l.data?.humidity)
      .filter((v): v is number => v != null);
    const co2s = chartFilteredLogs
      .map((l) => l.data?.co2)
      .filter((v): v is number => v != null);

    // Use reduce for min/max — spread operator overflows the call stack on large arrays
    const safeMin = (arr: number[]) =>
      arr.reduce((a, b) => (b < a ? b : a), arr[0]);
    const safeMax = (arr: number[]) =>
      arr.reduce((a, b) => (b > a ? b : a), arr[0]);

    return {
      avgTemp:
        temps.length > 0
          ? (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1)
          : 0,
      minTemp: temps.length > 0 ? safeMin(temps).toFixed(1) : 0,
      maxTemp: temps.length > 0 ? safeMax(temps).toFixed(1) : 0,
      avgHumidity:
        humidities.length > 0
          ? (humidities.reduce((a, b) => a + b, 0) / humidities.length).toFixed(
              1,
            )
          : 0,
      minHumidity: humidities.length > 0 ? safeMin(humidities).toFixed(1) : 0,
      maxHumidity: humidities.length > 0 ? safeMax(humidities).toFixed(1) : 0,
      avgCo2:
        co2s.length > 0
          ? Math.round(co2s.reduce((a, b) => a + b, 0) / co2s.length)
          : 0,
      minCo2: co2s.length > 0 ? safeMin(co2s) : 0,
      maxCo2: co2s.length > 0 ? safeMax(co2s) : 0,
      totalReadings: chartFilteredLogs.length,
    };
  }, [
    aggregatesData,
    chartFilteredLogs,
    filterRoom,
    chartDateFrom,
    chartDateTo,
  ]);

  // Use pre-computed aggregates when available, fall back to raw-log aggregation.
  // aggregatesData === null means still loading; [] means loaded but no historical data yet.
  const effectiveChartData =
    aggregatesData !== null && aggregatesData.length > 0
      ? aggregatedChartData
      : chartData;

  const formatUnixTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const handleExportData = () => {
    const csvContent = [
      [
        "Time",
        "Room",
        "Avg Temp (°C)",
        "Min Temp (°C)",
        "Max Temp (°C)",
        "Avg Humidity (%)",
        "Min Humidity (%)",
        "Max Humidity (%)",
        "Avg CO2 (ppm)",
        "Min CO2 (ppm)",
        "Max CO2 (ppm)",
        "Samples",
      ],
      ...filteredAndSortedLogs.map((a) => [
        a.time,
        a.room,
        a.avg_temp?.toFixed(1) ?? "N/A",
        a.min_temp?.toFixed(1) ?? "N/A",
        a.max_temp?.toFixed(1) ?? "N/A",
        a.avg_hum?.toFixed(1) ?? "N/A",
        a.min_hum?.toFixed(1) ?? "N/A",
        a.max_hum?.toFixed(1) ?? "N/A",
        a.avg_co2 != null ? Math.round(a.avg_co2).toString() : "N/A",
        a.min_co2 != null ? Math.round(a.min_co2).toString() : "N/A",
        a.max_co2 != null ? Math.round(a.max_co2).toString() : "N/A",
        a.sample_count.toString(),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sensor-logs-${serialNumber}-${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setFilterRoom("all");
    setDateFrom(undefined);
    setDateTo(undefined);
    setSortBy("timestamp");
    setSortOrder("desc");
    setCurrentPage(1);
  };

  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  if (!open) return null;

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
                      <h2 className="text-lg sm:text-xl font-semibold">
                        Sensor Logs & Analytics
                      </h2>
                      <Badge variant="outline" className="text-xs">
                        {serialNumber}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Label
                          htmlFor="live-update"
                          className="text-xs sm:text-sm"
                        >
                          Live Update
                        </Label>
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
                    Real-time sensor data and historical analytics for{" "}
                    <span className="font-mono text-primary font-medium">
                      {serialNumber}
                    </span>
                  </p>
                </div>

                {/* Main Content */}
                <Tabs
                  value={selectedTab}
                  onValueChange={setSelectedTab}
                  className="flex flex-col"
                >
                  <div className="px-3 sm:px-4 pt-3">
                    <TabsList className="w-full max-w-4xl mx-auto grid grid-cols-4 h-11 rounded-lg bg-muted/40 p-1">
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
                        Sensor Logs
                      </TabsTrigger>
                      <TabsTrigger
                        value="actuator-logs"
                        className="w-full h-9 justify-center text-center rounded-md text-xs sm:text-sm font-medium text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                      >
                        Actuator Logs
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
                              <Badge variant="default" className="bg-green-500">
                                Fruiting Chamber
                              </Badge>
                            </CardTitle>
                            <CardDescription className="text-xs">
                              {formatUnixTimestamp(
                                latestReading.fruiting.timestamp ||
                                  latestReading.timestamp,
                              )}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-2 pt-0">
                            <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                              <div className="flex items-center gap-2">
                                <Thermometer className="h-4 w-4 text-red-500" />
                                <span className="text-xs sm:text-sm font-medium">
                                  Temperature
                                </span>
                              </div>
                              <span className="text-xl sm:text-2xl font-bold text-red-600">
                                {latestReading.fruiting?.temperature ?? "N/A"}°C
                              </span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                              <div className="flex items-center gap-2">
                                <Droplets className="h-4 w-4 text-blue-500" />
                                <span className="text-xs sm:text-sm font-medium">
                                  Humidity
                                </span>
                              </div>
                              <span className="text-xl sm:text-2xl font-bold text-blue-600">
                                {latestReading.fruiting?.humidity ?? "N/A"}%
                              </span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                              <div className="flex items-center gap-2">
                                <Wind className="h-4 w-4 text-gray-500" />
                                <span className="text-xs sm:text-sm font-medium">
                                  CO₂
                                </span>
                              </div>
                              <span className="text-xl sm:text-2xl font-bold text-gray-700 dark:text-gray-300">
                                {latestReading.fruiting?.co2 ?? "N/A"} ppm
                              </span>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Spawning Chamber */}
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                              <Badge variant="secondary">
                                Spawning Chamber
                              </Badge>
                            </CardTitle>
                            <CardDescription className="text-xs">
                              {formatUnixTimestamp(
                                latestReading.spawning.timestamp ||
                                  latestReading.timestamp,
                              )}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-2 pt-0">
                            <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                              <div className="flex items-center gap-2">
                                <Thermometer className="h-4 w-4 text-red-500" />
                                <span className="text-xs sm:text-sm font-medium">
                                  Temperature
                                </span>
                              </div>
                              <span className="text-xl sm:text-2xl font-bold text-red-600">
                                {latestReading.spawning?.temperature ?? "N/A"}°C
                              </span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                              <div className="flex items-center gap-2">
                                <Droplets className="h-4 w-4 text-blue-500" />
                                <span className="text-xs sm:text-sm font-medium">
                                  Humidity
                                </span>
                              </div>
                              <span className="text-xl sm:text-2xl font-bold text-blue-600">
                                {latestReading.spawning?.humidity ?? "N/A"}%
                              </span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                              <div className="flex items-center gap-2">
                                <Wind className="h-4 w-4 text-gray-500" />
                                <span className="text-xs sm:text-sm font-medium">
                                  CO₂
                                </span>
                              </div>
                              <span className="text-xl sm:text-2xl font-bold text-gray-700 dark:text-gray-300">
                                {latestReading.spawning?.co2 ?? "N/A"} ppm
                              </span>
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
                              <h3 className="text-2xl font-bold">
                                Historical Trends
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                Real-time analysis of sensor data over time
                              </p>
                            </div>
                          </div>
                          <Sheet
                            open={chartFiltersOpen}
                            onOpenChange={setChartFiltersOpen}
                          >
                            <SheetTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="shrink-0"
                              >
                                <Filter className="h-4 w-4 mr-2" />
                                Filters
                              </Button>
                            </SheetTrigger>
                            <SheetContent
                              side="right"
                              className="sm:max-w-md overflow-y-auto"
                            >
                              <SheetHeader>
                                <SheetTitle>Filters & Time Period</SheetTitle>
                                <SheetDescription>
                                  Adjust chamber, period, and custom range for
                                  historical charts.
                                </SheetDescription>
                              </SheetHeader>

                              <div className="space-y-4 px-4 pb-4">
                                {/* Clear All Button */}
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setFilterRoom("all");
                                      setChartTimePeriod("week");
                                      setChartDateFrom(undefined);
                                      setChartDateTo(undefined);
                                    }}
                                    className="h-9"
                                  >
                                    <X className="h-4 w-4 mr-1" />
                                    Clear All
                                  </Button>
                                </div>

                                {/* Chamber Filter */}
                                <div className="space-y-3">
                                  <Label className="text-sm font-semibold">
                                    Chamber Selection
                                  </Label>
                                  <div className="flex flex-wrap gap-2">
                                    {(
                                      ["all", "fruiting", "spawning"] as const
                                    ).map((room) => (
                                      <Button
                                        key={room}
                                        variant={
                                          filterRoom === room
                                            ? "default"
                                            : "outline"
                                        }
                                        size="sm"
                                        onClick={() => setFilterRoom(room)}
                                        className={
                                          filterRoom === room
                                            ? "ring-2 ring-offset-2 ring-primary"
                                            : ""
                                        }
                                      >
                                        {room === "all"
                                          ? "All Chambers"
                                          : room === "fruiting"
                                            ? "Fruiting"
                                            : "Spawning"}
                                      </Button>
                                    ))}
                                  </div>
                                </div>

                                {/* Time Period Selection */}
                                <div className="space-y-3 pt-2 border-t">
                                  <Label className="text-sm font-semibold">
                                    Time Period
                                  </Label>
                                  <div className="grid grid-cols-2 gap-2">
                                    {(
                                      ["day", "week", "month", "year"] as const
                                    ).map((period) => (
                                      <Button
                                        key={period}
                                        variant={
                                          chartTimePeriod === period
                                            ? "default"
                                            : "outline"
                                        }
                                        size="sm"
                                        onClick={() => setTimePeriod(period)}
                                        className={`transition-all ${chartTimePeriod === period ? "ring-2 ring-offset-2 ring-primary" : ""}`}
                                      >
                                        {period === "day"
                                          ? "Today"
                                          : period === "week"
                                            ? "This Week"
                                            : period === "month"
                                              ? "This Month"
                                              : "This Year"}
                                      </Button>
                                    ))}
                                  </div>
                                </div>

                                {/* Custom Date Range */}
                                <div className="space-y-2 pt-2 border-t">
                                  <Label className="text-sm font-semibold">
                                    Custom Date Range
                                  </Label>
                                  <div className="flex flex-wrap items-end gap-3">
                                    <div className="space-y-1">
                                      <Label className="text-xs text-muted-foreground mb-1 block">
                                        From
                                      </Label>
                                      <Popover>
                                        <PopoverTrigger asChild>
                                          <Button
                                            variant="outline"
                                            className="w-[160px] justify-start gap-2"
                                          >
                                            <CalendarIcon className="h-4 w-4" />
                                            {chartDateFrom
                                              ? format(
                                                  chartDateFrom,
                                                  "MMM dd, yyyy",
                                                )
                                              : "Select start date"}
                                          </Button>
                                        </PopoverTrigger>
                                        <PopoverContent
                                          className="w-auto p-0"
                                          align="start"
                                        >
                                          <Calendar
                                            mode="single"
                                            selected={chartDateFrom}
                                            onSelect={(date) => {
                                              setChartDateFrom(date);
                                            }}
                                            initialFocus
                                          />
                                        </PopoverContent>
                                      </Popover>
                                    </div>

                                    <div className="space-y-1">
                                      <Label className="text-xs text-muted-foreground mb-1 block">
                                        To
                                      </Label>
                                      <Popover>
                                        <PopoverTrigger asChild>
                                          <Button
                                            variant="outline"
                                            className="w-[160px] justify-start gap-2"
                                          >
                                            <CalendarIcon className="h-4 w-4" />
                                            {chartDateTo
                                              ? format(
                                                  chartDateTo,
                                                  "MMM dd, yyyy",
                                                )
                                              : "Select end date"}
                                          </Button>
                                        </PopoverTrigger>
                                        <PopoverContent
                                          className="w-auto p-0"
                                          align="start"
                                        >
                                          <Calendar
                                            mode="single"
                                            selected={chartDateTo}
                                            onSelect={(date) => {
                                              setChartDateTo(date);
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
                                          setChartDateFrom(undefined);
                                          setChartDateTo(undefined);
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
                            <Badge variant="outline" className="bg-background">
                              {chartSummary.totalReadings} readings
                            </Badge>
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
                                <span className="font-semibold text-sm">
                                  Temperature
                                </span>
                              </div>
                              <div className="grid grid-cols-3 gap-2 text-xs">
                                <div className="text-center">
                                  <div className="text-muted-foreground text-xs mb-1">
                                    Avg
                                  </div>
                                  <div className="font-bold text-sm">
                                    {chartSummary.avgTemp}°
                                  </div>
                                </div>
                                <div className="text-center">
                                  <div className="text-muted-foreground text-xs mb-1">
                                    Min
                                  </div>
                                  <div className="font-bold text-sm text-blue-600 dark:text-blue-400">
                                    {chartSummary.minTemp}°
                                  </div>
                                </div>
                                <div className="text-center">
                                  <div className="text-muted-foreground text-xs mb-1">
                                    Max
                                  </div>
                                  <div className="font-bold text-sm text-red-600 dark:text-red-400">
                                    {chartSummary.maxTemp}°
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Humidity Summary */}
                            <div className="space-y-3 p-3 bg-background/50 rounded-lg border border-blue-200/50 dark:border-blue-900/30">
                              <div className="flex items-center gap-2">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded">
                                  <Droplets className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <span className="font-semibold text-sm">
                                  Humidity
                                </span>
                              </div>
                              <div className="grid grid-cols-3 gap-2 text-xs">
                                <div className="text-center">
                                  <div className="text-muted-foreground text-xs mb-1">
                                    Avg
                                  </div>
                                  <div className="font-bold text-sm">
                                    {chartSummary.avgHumidity}%
                                  </div>
                                </div>
                                <div className="text-center">
                                  <div className="text-muted-foreground text-xs mb-1">
                                    Min
                                  </div>
                                  <div className="font-bold text-sm text-orange-600 dark:text-orange-400">
                                    {chartSummary.minHumidity}%
                                  </div>
                                </div>
                                <div className="text-center">
                                  <div className="text-muted-foreground text-xs mb-1">
                                    Max
                                  </div>
                                  <div className="font-bold text-sm text-blue-600 dark:text-blue-400">
                                    {chartSummary.maxHumidity}%
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* CO2 Summary */}
                            <div className="space-y-3 p-3 bg-background/50 rounded-lg border border-gray-200/50 dark:border-gray-700/50">
                              <div className="flex items-center gap-2">
                                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
                                  <Wind className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                </div>
                                <span className="font-semibold text-sm">
                                  CO₂
                                </span>
                              </div>
                              <div className="grid grid-cols-3 gap-2 text-xs">
                                <div className="text-center">
                                  <div className="text-muted-foreground text-xs mb-1">
                                    Avg
                                  </div>
                                  <div className="font-bold text-sm">
                                    {chartSummary.avgCo2} pm
                                  </div>
                                </div>
                                <div className="text-center">
                                  <div className="text-muted-foreground text-xs mb-1">
                                    Min
                                  </div>
                                  <div className="font-bold text-sm text-green-600 dark:text-green-400">
                                    {chartSummary.minCo2} p
                                  </div>
                                </div>
                                <div className="text-center">
                                  <div className="text-muted-foreground text-xs mb-1">
                                    Max
                                  </div>
                                  <div className="font-bold text-sm text-red-600 dark:text-red-400">
                                    {chartSummary.maxCo2} p
                                  </div>
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
                          <h4 className="font-semibold text-sm">
                            Data Visualization
                          </h4>
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
                              {effectiveChartData.length === 0 ? (
                                <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
                                  No data available for selected period
                                </div>
                              ) : (
                                <ResponsiveContainer width="100%" height={250}>
                                  <AreaChart data={effectiveChartData}>
                                    <CartesianGrid
                                      strokeDasharray="3 3"
                                      stroke="var(--border)"
                                    />
                                    <XAxis
                                      dataKey="time"
                                      tick={{ fontSize: 12 }}
                                      angle={-45}
                                      textAnchor="end"
                                      height={80}
                                    />
                                    <YAxis
                                      tick={{ fontSize: 12 }}
                                      label={{
                                        value: "°C",
                                        angle: -90,
                                        position: "insideLeft",
                                      }}
                                    />
                                    <Tooltip
                                      cursor={{ fill: "var(--muted)" }}
                                    />
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
                              {effectiveChartData.length === 0 ? (
                                <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
                                  No data available for selected period
                                </div>
                              ) : (
                                <ResponsiveContainer width="100%" height={250}>
                                  <AreaChart data={effectiveChartData}>
                                    <CartesianGrid
                                      strokeDasharray="3 3"
                                      stroke="var(--border)"
                                    />
                                    <XAxis
                                      dataKey="time"
                                      tick={{ fontSize: 12 }}
                                      angle={-45}
                                      textAnchor="end"
                                      height={80}
                                    />
                                    <YAxis
                                      tick={{ fontSize: 12 }}
                                      label={{
                                        value: "%",
                                        angle: -90,
                                        position: "insideLeft",
                                      }}
                                    />
                                    <Tooltip
                                      cursor={{ fill: "var(--muted)" }}
                                    />
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
                              {effectiveChartData.length === 0 ? (
                                <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
                                  No data available for selected period
                                </div>
                              ) : (
                                <ResponsiveContainer width="100%" height={250}>
                                  <AreaChart data={effectiveChartData}>
                                    <CartesianGrid
                                      strokeDasharray="3 3"
                                      stroke="var(--border)"
                                    />
                                    <XAxis
                                      dataKey="time"
                                      tick={{ fontSize: 12 }}
                                      angle={-45}
                                      textAnchor="end"
                                      height={80}
                                    />
                                    <YAxis
                                      tick={{ fontSize: 12 }}
                                      label={{
                                        value: "ppm",
                                        angle: -90,
                                        position: "insideLeft",
                                      }}
                                    />
                                    <Tooltip
                                      cursor={{ fill: "var(--muted)" }}
                                    />
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
                              <h3 className="text-2xl font-bold">
                                Hourly Sensor Aggregates
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                Browse hourly averaged readings from historical
                                data
                              </p>
                            </div>
                          </div>

                          <Sheet
                            open={tableFiltersOpen}
                            onOpenChange={setTableFiltersOpen}
                          >
                            <SheetTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="shrink-0"
                              >
                                <Filter className="h-4 w-4 mr-2" />
                                Filters
                              </Button>
                            </SheetTrigger>
                            <SheetContent
                              side="right"
                              className="sm:max-w-md overflow-y-auto"
                            >
                              <SheetHeader>
                                <SheetTitle>Filters & Sorting</SheetTitle>
                                <SheetDescription>
                                  Refine records by chamber, sorting, page size,
                                  and date range.
                                </SheetDescription>
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
                                  <Label className="text-sm font-semibold">
                                    Chamber Selection
                                  </Label>
                                  <div className="flex flex-wrap gap-2">
                                    {(
                                      ["all", "fruiting", "spawning"] as const
                                    ).map((room) => (
                                      <Button
                                        key={room}
                                        variant={
                                          filterRoom === room
                                            ? "default"
                                            : "outline"
                                        }
                                        size="sm"
                                        onClick={() => setFilterRoom(room)}
                                        className={
                                          filterRoom === room
                                            ? "ring-2 ring-offset-2 ring-primary"
                                            : ""
                                        }
                                      >
                                        {room === "all"
                                          ? "All Chambers"
                                          : room === "fruiting"
                                            ? "Fruiting"
                                            : "Spawning"}
                                      </Button>
                                    ))}
                                  </div>
                                </div>

                                {/* Sorting Controls Grid */}
                                <div className="space-y-2 pt-2 border-t">
                                  <Label className="text-sm font-semibold">
                                    Sorting Options
                                  </Label>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {/* Sort By */}
                                    <div className="space-y-2">
                                      <Label className="text-xs text-muted-foreground">
                                        Sort By
                                      </Label>
                                      <Select
                                        value={sortBy}
                                        onValueChange={(value) =>
                                          setSortBy(
                                            value as
                                              | "timestamp"
                                              | "temperature"
                                              | "humidity"
                                              | "co2",
                                          )
                                        }
                                      >
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="timestamp">
                                            Timestamp
                                          </SelectItem>
                                          <SelectItem value="temperature">
                                            Temperature
                                          </SelectItem>
                                          <SelectItem value="humidity">
                                            Humidity
                                          </SelectItem>
                                          <SelectItem value="co2">
                                            CO₂
                                          </SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    {/* Sort Order */}
                                    <div className="space-y-2">
                                      <Label className="text-xs text-muted-foreground">
                                        Order
                                      </Label>
                                      <Select
                                        value={sortOrder}
                                        onValueChange={(value) =>
                                          setSortOrder(value as "asc" | "desc")
                                        }
                                      >
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="desc">
                                            Newest First
                                          </SelectItem>
                                          <SelectItem value="asc">
                                            Oldest First
                                          </SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                </div>

                                {/* Date Range Filters */}
                                <div className="space-y-2 pt-2 border-t">
                                  <Label className="text-sm font-semibold">
                                    Date Range
                                  </Label>
                                  <div className="flex flex-wrap items-end gap-3">
                                    <div className="space-y-1">
                                      <Label className="text-xs text-muted-foreground mb-1 block">
                                        From Date
                                      </Label>
                                      <Popover>
                                        <PopoverTrigger asChild>
                                          <Button
                                            variant="outline"
                                            className="w-[160px] justify-start gap-2"
                                          >
                                            <CalendarIcon className="h-4 w-4" />
                                            {dateFrom
                                              ? format(dateFrom, "MMM dd, yyyy")
                                              : "Start date"}
                                          </Button>
                                        </PopoverTrigger>
                                        <PopoverContent
                                          className="w-auto p-0"
                                          align="start"
                                        >
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
                                      <Label className="text-xs text-muted-foreground mb-1 block">
                                        To Date
                                      </Label>
                                      <Popover>
                                        <PopoverTrigger asChild>
                                          <Button
                                            variant="outline"
                                            className="w-[160px] justify-start gap-2"
                                          >
                                            <CalendarIcon className="h-4 w-4" />
                                            {dateTo
                                              ? format(dateTo, "MMM dd, yyyy")
                                              : "End date"}
                                          </Button>
                                        </PopoverTrigger>
                                        <PopoverContent
                                          className="w-auto p-0"
                                          align="start"
                                        >
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
                                          setDateFrom(undefined);
                                          setDateTo(undefined);
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
                                <span className="text-sm font-semibold text-muted-foreground">
                                  Showing
                                </span>
                              </div>
                              <div className="text-lg font-bold">
                                {(currentPage - 1) * itemsPerPage + 1}–
                                {Math.min(
                                  currentPage * itemsPerPage,
                                  filteredAndSortedLogs.length,
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                of {filteredAndSortedLogs.length} filtered
                                records
                              </div>
                            </div>

                            {/* Filtered Results */}
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded">
                                  <Filter className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <span className="text-sm font-semibold text-muted-foreground">
                                  Filtered
                                </span>
                              </div>
                              <div className="text-lg font-bold">
                                {filteredAndSortedLogs.length}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                active filters applied
                              </div>
                            </div>

                            {/* Total Records */}
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
                                  <Badge
                                    className="h-4 w-4 text-gray-600 dark:text-gray-400 p-0"
                                    variant="outline"
                                  >
                                    📊
                                  </Badge>
                                </div>
                                <span className="text-sm font-semibold text-muted-foreground">
                                  Total
                                </span>
                              </div>
                              <div className="text-lg font-bold">
                                {aggregatesData?.length ?? 0}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                hourly aggregate buckets
                              </div>
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
                            {paginatedLogs.map((agg) => (
                              <Card
                                key={`${agg.room}-${agg.time}`}
                                className="p-3 sm:p-4 hover:bg-muted/50 transition-colors"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="space-y-2 flex-1">
                                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                      <Badge
                                        variant={
                                          agg.room === "fruiting"
                                            ? "default"
                                            : "secondary"
                                        }
                                        className={
                                          agg.room === "fruiting"
                                            ? "bg-green-500"
                                            : ""
                                        }
                                      >
                                        {agg.room === "fruiting"
                                          ? "Fruiting"
                                          : "Spawning"}
                                      </Badge>
                                      <span className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                                        <CalendarIcon className="h-3 w-3" />
                                        {agg.time}
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        {agg.sample_count} samples
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                      <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-950/20 rounded-lg">
                                        <Thermometer className="h-4 w-4 text-red-500" />
                                        <div>
                                          <div className="text-xs text-muted-foreground">
                                            Temperature
                                          </div>
                                          <div className="text-sm sm:text-base font-semibold">
                                            {agg.avg_temp?.toFixed(1) ?? "N/A"}
                                            °C
                                          </div>
                                          <div className="text-xs text-muted-foreground">
                                            {agg.min_temp?.toFixed(1) ?? "—"} –{" "}
                                            {agg.max_temp?.toFixed(1) ?? "—"}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                                        <Droplets className="h-4 w-4 text-blue-500" />
                                        <div>
                                          <div className="text-xs text-muted-foreground">
                                            Humidity
                                          </div>
                                          <div className="text-sm sm:text-base font-semibold">
                                            {agg.avg_hum?.toFixed(1) ?? "N/A"}%
                                          </div>
                                          <div className="text-xs text-muted-foreground">
                                            {agg.min_hum?.toFixed(1) ?? "—"} –{" "}
                                            {agg.max_hum?.toFixed(1) ?? "—"}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                                        <Wind className="h-4 w-4 text-gray-500" />
                                        <div>
                                          <div className="text-xs text-muted-foreground">
                                            CO₂
                                          </div>
                                          <div className="text-sm sm:text-base font-semibold">
                                            {agg.avg_co2 != null
                                              ? Math.round(agg.avg_co2)
                                              : "N/A"}{" "}
                                            ppm
                                          </div>
                                          <div className="text-xs text-muted-foreground">
                                            {agg.min_co2 != null
                                              ? Math.round(agg.min_co2)
                                              : "—"}{" "}
                                            –{" "}
                                            {agg.max_co2 != null
                                              ? Math.round(agg.max_co2)
                                              : "—"}
                                          </div>
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
                            {aggregatesData === null
                              ? "Loading sensor logs…"
                              : "No sensor logs match your filters"}
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
                          setItemsPerPage(rows);
                          setCurrentPage(1);
                        }}
                      />
                    </div>
                  </TabsContent>

                  {/* Actuator Logs Tab */}
                  <TabsContent value="actuator-logs" className="m-0 p-4 sm:p-6">
                    <div className="space-y-6">
                      {/* Header */}
                      <div className="border-b pb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <Zap className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold">
                              Actuator Logs
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Current actuator states and recent control events
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Latest Actuator States */}
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                            <Zap className="h-4 w-4 text-primary" />
                            Latest Actuator States
                          </CardTitle>
                          <CardDescription className="text-xs">
                            {latestActuators?.timestamp
                              ? latestActuators.timestamp
                                  .replace("T", " ")
                                  .substring(0, 19)
                              : "Loading…"}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          {latestActuators ? (
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                              {latestActuators.fruiting && (
                                <div className="space-y-2">
                                  <Badge
                                    variant="default"
                                    className="bg-green-500 mb-1"
                                  >
                                    Fruiting Chamber
                                  </Badge>
                                  <div className="grid grid-cols-2 gap-2">
                                    {Object.entries(
                                      latestActuators.fruiting,
                                    ).map(([name, state]) => (
                                      <div
                                        key={name}
                                        className={`flex items-center justify-between p-2 rounded-lg ${state ? "bg-green-50 dark:bg-green-900/20" : "bg-gray-50 dark:bg-gray-900/20"}`}
                                      >
                                        <span className="text-xs font-medium capitalize">
                                          {name.replace(/_/g, " ")}
                                        </span>
                                        <Badge
                                          variant={
                                            state ? "default" : "secondary"
                                          }
                                          className={
                                            state
                                              ? "bg-green-500 text-xs"
                                              : "text-xs"
                                          }
                                        >
                                          {state ? "ON" : "OFF"}
                                        </Badge>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {latestActuators.spawning && (
                                <div className="space-y-2">
                                  <Badge variant="secondary" className="mb-1">
                                    Spawning Chamber
                                  </Badge>
                                  <div className="grid grid-cols-2 gap-2">
                                    {Object.entries(
                                      latestActuators.spawning,
                                    ).map(([name, state]) => (
                                      <div
                                        key={name}
                                        className={`flex items-center justify-between p-2 rounded-lg ${state ? "bg-blue-50 dark:bg-blue-900/20" : "bg-gray-50 dark:bg-gray-900/20"}`}
                                      >
                                        <span className="text-xs font-medium capitalize">
                                          {name.replace(/_/g, " ")}
                                        </span>
                                        <Badge
                                          variant={
                                            state ? "default" : "secondary"
                                          }
                                          className={
                                            state
                                              ? "bg-blue-500 text-xs"
                                              : "text-xs"
                                          }
                                        >
                                          {state ? "ON" : "OFF"}
                                        </Badge>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-center py-4 text-muted-foreground text-sm">
                              No actuator data available
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Actuator Event Log */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <h4 className="text-lg font-semibold">
                            Actuator Events
                          </h4>
                          <div className="flex gap-2">
                            {(["all", "fruiting", "spawning"] as const).map(
                              (room) => (
                                <Button
                                  key={room}
                                  size="sm"
                                  variant={
                                    actuatorLogsRoom === room
                                      ? "default"
                                      : "outline"
                                  }
                                  onClick={() => {
                                    setActuatorLogsRoom(room);
                                    setActuatorLogsPage(1);
                                  }}
                                >
                                  {room === "all"
                                    ? "All"
                                    : room === "fruiting"
                                      ? "Fruiting"
                                      : "Spawning"}
                                </Button>
                              ),
                            )}
                          </div>
                        </div>

                        <div className="w-full rounded-lg border bg-gradient-to-b from-background to-muted/30">
                          {paginatedActuatorLogs.length > 0 ? (
                            <div className="p-2 sm:p-4 space-y-2">
                              {paginatedActuatorLogs.map((log) => (
                                <Card
                                  key={log.key}
                                  className="p-3 hover:bg-muted/50 transition-colors"
                                >
                                  <div className="flex items-center justify-between flex-wrap gap-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <Badge
                                        variant={
                                          log.room === "fruiting"
                                            ? "default"
                                            : "secondary"
                                        }
                                        className={
                                          log.room === "fruiting"
                                            ? "bg-green-500"
                                            : ""
                                        }
                                      >
                                        {log.room === "fruiting"
                                          ? "Fruiting"
                                          : "Spawning"}
                                      </Badge>
                                      <span className="text-sm font-medium capitalize">
                                        {log.actuator.replace(/_/g, " ")}
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        {log.timestamp
                                          .replace("T", " ")
                                          .substring(0, 19)}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Badge
                                        variant="outline"
                                        className="text-xs capitalize"
                                      >
                                        {log.mode}
                                      </Badge>
                                      <Badge
                                        variant={
                                          log.state === "ON"
                                            ? "default"
                                            : "secondary"
                                        }
                                        className={
                                          log.state === "ON"
                                            ? "bg-green-500 text-xs"
                                            : "text-xs"
                                        }
                                      >
                                        {log.state}
                                      </Badge>
                                    </div>
                                  </div>
                                </Card>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-12 text-muted-foreground">
                              No actuator events found
                            </div>
                          )}
                        </div>

                        <PaginationWrapper
                          totalItems={filteredActuatorLogs.length}
                          itemsPerPage={actuatorLogsPerPage}
                          currentPage={actuatorLogsPage}
                          onPageChange={setActuatorLogsPage}
                          label="events"
                          rowsPerPageOptions={[10, 20, 50]}
                          onItemsPerPageChange={(rows) => {
                            setActuatorLogsPerPage(rows);
                            setActuatorLogsPage(1);
                          }}
                        />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>,
    document.body,
  );
}
