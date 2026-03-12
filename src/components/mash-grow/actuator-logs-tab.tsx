"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import {
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  ToggleLeft,
  X,
  Zap,
} from "lucide-react";
import { format } from "date-fns";
import { ActuatorLog, ACTUATOR_LABELS, ROOM_LABELS } from "@/types/iot";

// ─── Props ───────────────────────────────────────────────────────────────────

interface ActuatorLogsTabProps {
  actuatorLogs: ActuatorLog[];
  loading: boolean;
  serialNumber: string;
}

// ─── Chart Config ─────────────────────────────────────────────────────────────

const actuatorChartConfig = {
  on_count: {
    label: "Activations (ON)",
    color: "var(--chart-1)",
  },
  off_count: {
    label: "Deactivations (OFF)",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatActuatorTimestamp(ts: string) {
  try {
    // "2026-02-21T04:08:07.787958" or "2026-02-21T04-08-07-787958"
    const normalized = ts.includes(":")
      ? ts
      : ts.replace(/T(\d+)-(\d+)-(\d+).*/, "T$1:$2:$3");
    return new Date(normalized).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return ts;
  }
}

function parseActuatorTimestamp(ts: string): Date {
  try {
    const normalized = ts.includes(":")
      ? ts
      : ts.replace(/T(\d+)-(\d+)-(\d+).*/, "T$1:$2:$3");
    return new Date(normalized);
  } catch {
    return new Date();
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ActuatorLogsTab({
  actuatorLogs,
  loading,
  serialNumber,
}: ActuatorLogsTabProps) {
  // ── Filters ────────────────────────────────────────────────────────────────
  const [filterRoom, setFilterRoom] = useState<string>("all");
  const [filterActuator, setFilterActuator] = useState<string>("all");
  const [filterMode, setFilterMode] = useState<string>("all");
  const [filterState, setFilterState] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // ── Derived filter options ─────────────────────────────────────────────────
  const availableActuators = useMemo(() => {
    const set = new Set(actuatorLogs.map((l) => l.actuator));
    return Array.from(set).sort();
  }, [actuatorLogs]);

  const availableModes = useMemo(() => {
    const set = new Set(actuatorLogs.map((l) => l.mode));
    return Array.from(set).sort();
  }, [actuatorLogs]);

  const availableRooms = useMemo(() => {
    const set = new Set(actuatorLogs.map((l) => l.room));
    return Array.from(set).sort();
  }, [actuatorLogs]);

  // ── Filtered + sorted logs ─────────────────────────────────────────────────
  const filteredLogs = useMemo(() => {
    let logs = [...actuatorLogs];

    if (filterRoom !== "all") logs = logs.filter((l) => l.room === filterRoom);
    if (filterActuator !== "all")
      logs = logs.filter((l) => l.actuator === filterActuator);
    if (filterMode !== "all") logs = logs.filter((l) => l.mode === filterMode);
    if (filterState !== "all")
      logs = logs.filter((l) => l.state === filterState);

    if (dateFrom || dateTo) {
      logs = logs.filter((l) => {
        const d = parseActuatorTimestamp(l.timestamp);
        if (dateFrom) {
          const f = new Date(dateFrom);
          f.setHours(0, 0, 0, 0);
          if (d < f) return false;
        }
        if (dateTo) {
          const t = new Date(dateTo);
          t.setHours(23, 59, 59, 999);
          if (d > t) return false;
        }
        return true;
      });
    }

    logs.sort((a, b) => {
      const diff = a.timestamp_unix - b.timestamp_unix;
      return sortOrder === "asc" ? diff : -diff;
    });

    return logs;
  }, [
    actuatorLogs,
    filterRoom,
    filterActuator,
    filterMode,
    filterState,
    dateFrom,
    dateTo,
    sortOrder,
  ]);

  // ── Pagination ─────────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / itemsPerPage));
  const pagedLogs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(start, start + itemsPerPage);
  }, [filteredLogs, currentPage, itemsPerPage]);

  // ── Chart Data: activations per day ───────────────────────────────────────
  const activityChartData = useMemo(() => {
    const buckets: Record<string, { on_count: number; off_count: number }> = {};
    for (const log of filteredLogs) {
      const dateKey = format(parseActuatorTimestamp(log.timestamp), "MMM dd");
      if (!buckets[dateKey]) buckets[dateKey] = { on_count: 0, off_count: 0 };
      if (log.state === "ON") buckets[dateKey].on_count++;
      else buckets[dateKey].off_count++;
    }
    return Object.entries(buckets).map(([date, v]) => ({ date, ...v }));
  }, [filteredLogs]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = filteredLogs.length;
    const onCount = filteredLogs.filter((l) => l.state === "ON").length;
    const autoCount = filteredLogs.filter((l) => l.mode === "auto").length;
    return {
      total,
      onCount,
      offCount: total - onCount,
      autoCount,
      manualCount: total - autoCount,
    };
  }, [filteredLogs]);

  // ── Export ─────────────────────────────────────────────────────────────────
  const handleExport = () => {
    const csv = [
      ["Timestamp", "Actuator", "Room", "Mode", "State", "Unix Timestamp"],
      ...filteredLogs.map((l) => [
        l.timestamp,
        l.actuator,
        l.room,
        l.mode,
        l.state,
        l.timestamp_unix.toString(),
      ]),
    ]
      .map((r) => r.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `actuator-logs-${serialNumber}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setFilterRoom("all");
    setFilterActuator("all");
    setFilterMode("all");
    setFilterState("all");
    setDateFrom(undefined);
    setDateTo(undefined);
    setSortOrder("desc");
    setCurrentPage(1);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="py-3">
          <CardContent className="px-4 py-0">
            <div className="text-xs text-muted-foreground">Total Events</div>
            <div className="text-2xl font-bold">
              {stats.total.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card className="py-3">
          <CardContent className="px-4 py-0">
            <div className="text-xs text-muted-foreground">
              Activations (ON)
            </div>
            <div className="text-2xl font-bold text-green-600">
              {stats.onCount.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card className="py-3">
          <CardContent className="px-4 py-0">
            <div className="text-xs text-muted-foreground">
              Deactivations (OFF)
            </div>
            <div className="text-2xl font-bold text-red-600">
              {stats.offCount.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card className="py-3">
          <CardContent className="px-4 py-0">
            <div className="text-xs text-muted-foreground">Auto / Manual</div>
            <div className="text-2xl font-bold">
              <span className="text-blue-600">{stats.autoCount}</span>
              <span className="text-muted-foreground text-base">/</span>
              <span className="text-orange-600">{stats.manualCount}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Chart */}
      {activityChartData.length > 0 && (
        <Card className="pt-0">
          <CardHeader className="flex items-center gap-2 space-y-0 border-b py-4 sm:flex-row">
            <div className="grid flex-1 gap-1">
              <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                Actuator Activity Over Time
              </CardTitle>
              <CardDescription className="text-xs">
                Activations and deactivations per day (filtered view)
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
            <ChartContainer
              config={actuatorChartConfig}
              className="aspect-auto h-[200px] w-full"
            >
              <AreaChart data={activityChartData}>
                <defs>
                  <linearGradient id="fillOnCount" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-on_count)"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-on_count)"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                  <linearGradient id="fillOffCount" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-off_count)"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-off_count)"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={24}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Area
                  dataKey="off_count"
                  type="natural"
                  fill="url(#fillOffCount)"
                  stroke="var(--color-off_count)"
                  stackId="a"
                />
                <Area
                  dataKey="on_count"
                  type="natural"
                  fill="url(#fillOnCount)"
                  stroke="var(--color-on_count)"
                  stackId="a"
                />
                <ChartLegend content={<ChartLegendContent />} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <CardTitle className="text-sm">Filters</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="h-8"
              >
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="h-8"
              >
                <Download className="h-3 w-3 mr-1" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Room */}
            <div className="space-y-1">
              <Label className="text-xs">Room</Label>
              <Select
                value={filterRoom}
                onValueChange={(v) => {
                  setFilterRoom(v);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Rooms</SelectItem>
                  {availableRooms.map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROOM_LABELS[r] ?? r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Actuator */}
            <div className="space-y-1">
              <Label className="text-xs">Actuator</Label>
              <Select
                value={filterActuator}
                onValueChange={(v) => {
                  setFilterActuator(v);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actuators</SelectItem>
                  {availableActuators.map((a) => (
                    <SelectItem key={a} value={a}>
                      {ACTUATOR_LABELS[a] ?? a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Mode */}
            <div className="space-y-1">
              <Label className="text-xs">Mode</Label>
              <Select
                value={filterMode}
                onValueChange={(v) => {
                  setFilterMode(v);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modes</SelectItem>
                  {availableModes.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m.charAt(0).toUpperCase() + m.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* State */}
            <div className="space-y-1">
              <Label className="text-xs">State</Label>
              <Select
                value={filterState}
                onValueChange={(v) => {
                  setFilterState(v);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  <SelectItem value="ON">ON</SelectItem>
                  <SelectItem value="OFF">OFF</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date From */}
            <div className="space-y-1">
              <Label className="text-xs">From Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs w-full justify-start"
                  >
                    <CalendarIcon className="mr-1 h-3 w-3" />
                    {dateFrom ? format(dateFrom, "MMM dd, yyyy") : "Start"}
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

            {/* Date To */}
            <div className="space-y-1">
              <Label className="text-xs">To Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs w-full justify-start"
                  >
                    <CalendarIcon className="mr-1 h-3 w-3" />
                    {dateTo ? format(dateTo, "MMM dd, yyyy") : "End"}
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
          </div>

          {/* Sort + Per Page row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <Label className="text-xs whitespace-nowrap">Sort:</Label>
              <Select
                value={sortOrder}
                onValueChange={(v) => setSortOrder(v as "asc" | "desc")}
              >
                <SelectTrigger className="h-8 w-[130px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Newest First</SelectItem>
                  <SelectItem value="asc">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs whitespace-nowrap">Per Page:</Label>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(v) => {
                  setItemsPerPage(Number(v));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-8 w-20 text-xs">
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
            <div className="text-xs text-muted-foreground ml-auto">
              {filteredLogs.length.toLocaleString()} records
              {actuatorLogs.length !== filteredLogs.length && (
                <span className="ml-1 text-muted-foreground/60">
                  (of {actuatorLogs.length.toLocaleString()} total)
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px] rounded-md">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="text-xs w-[180px]">Timestamp</TableHead>
                  <TableHead className="text-xs">Actuator</TableHead>
                  <TableHead className="text-xs">Room</TableHead>
                  <TableHead className="text-xs">Mode</TableHead>
                  <TableHead className="text-xs text-center">State</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedLogs.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-12 text-muted-foreground text-sm"
                    >
                      {actuatorLogs.length === 0
                        ? "No actuator logs available"
                        : "No records match your filters"}
                    </TableCell>
                  </TableRow>
                ) : (
                  pagedLogs.map((log, i) => (
                    <TableRow
                      key={`${log._key ?? log.timestamp_unix}-${i}`}
                      className="text-xs"
                    >
                      <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {formatActuatorTimestamp(log.timestamp)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <ToggleLeft className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium">
                            {ACTUATOR_LABELS[log.actuator] ?? log.actuator}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            log.room === "fruiting"
                              ? "default"
                              : log.room === "spawning"
                                ? "secondary"
                                : "outline"
                          }
                          className={`text-xs ${log.room === "fruiting" ? "bg-green-600" : ""}`}
                        >
                          {ROOM_LABELS[log.room] ?? log.room}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            log.mode === "auto" ? "outline" : "secondary"
                          }
                          className="text-xs capitalize"
                        >
                          {log.mode}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={log.state === "ON" ? "default" : "outline"}
                          className={`text-xs font-bold ${log.state === "ON" ? "bg-green-600 hover:bg-green-700" : "text-red-600 border-red-300"}`}
                        >
                          {log.state}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <div className="flex items-center gap-1 flex-wrap justify-center">
            {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
              let page: number;
              if (totalPages <= 7) {
                page = i + 1;
              } else if (currentPage <= 4) {
                page = i + 1;
              } else if (currentPage >= totalPages - 3) {
                page = totalPages - 6 + i;
              } else {
                page = currentPage - 3 + i;
              }
              return (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className="h-8 w-8 p-0 text-xs"
                >
                  {page}
                </Button>
              );
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
