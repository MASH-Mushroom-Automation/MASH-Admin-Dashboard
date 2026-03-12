"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import {
  Bot,
  CheckCircle2,
  CircleDot,
  Clock,
  Droplets,
  Fan,
  Info,
  Lamp,
  Power,
  Server,
  Smartphone,
  ToggleLeft,
  WifiOff,
  Zap,
} from "lucide-react";
import {
  CommandQueueItem,
  DeviceStatus,
  LatestActuators,
  ACTUATOR_LABELS,
  ROOM_LABELS,
} from "@/types/iot";

// ─── Props ───────────────────────────────────────────────────────────────────

interface DeviceStatusTabProps {
  deviceStatus: DeviceStatus | null;
  latestActuators: LatestActuators | null;
  commandQueue: CommandQueueItem[];
  loading: boolean;
  serialNumber: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatIsoString(iso?: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function formatUnixTimestamp(unix: number) {
  return new Date(unix * 1000).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

const ACTUATOR_ICONS: Record<string, React.ReactNode> = {
  exhaust_fan: <Fan className="h-4 w-4" />,
  humidifier_fan: <Fan className="h-4 w-4" />,
  intake_fan: <Fan className="h-4 w-4" />,
  led: <Lamp className="h-4 w-4" />,
  mist_maker: <Droplets className="h-4 w-4" />,
};

// ─── Actuator Room Section ────────────────────────────────────────────────────

function ActuatorRoomGrid({
  roomLabel,
  actuators,
  colorClass,
}: {
  roomLabel: string;
  actuators: Record<string, boolean>;
  colorClass: string;
}) {
  return (
    <div className="space-y-2">
      <div
        className={`text-xs font-semibold uppercase tracking-wide ${colorClass}`}
      >
        {roomLabel}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {Object.entries(actuators).map(([key, state]) => (
          <div
            key={key}
            className={`flex items-center gap-2 p-2.5 rounded-lg border ${
              state
                ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                : "bg-muted/40 border-border"
            }`}
          >
            <span
              className={state ? "text-green-600" : "text-muted-foreground"}
            >
              {ACTUATOR_ICONS[key] ?? <ToggleLeft className="h-4 w-4" />}
            </span>
            <div className="min-w-0">
              <div className="text-xs font-medium truncate">
                {ACTUATOR_LABELS[key] ?? key}
              </div>
              <Badge
                variant={state ? "default" : "outline"}
                className={`text-[10px] h-4 px-1 ${state ? "bg-green-600 hover:bg-green-700" : "text-red-500 border-red-300"}`}
              >
                {state ? "ON" : "OFF"}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Chart Config ─────────────────────────────────────────────────────────────

const queueChartConfig = {
  pending: {
    label: "Pending Commands",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

// ─── Component ────────────────────────────────────────────────────────────────

export default function DeviceStatusTab({
  deviceStatus,
  latestActuators,
  commandQueue,
  loading,
  serialNumber,
}: DeviceStatusTabProps) {
  const isOnline = deviceStatus?.status === "ONLINE";
  const mlEnabled = deviceStatus?.metadata?.ml_enabled ?? false;

  // Count actuators that are ON across all rooms
  const actuatorStats = useMemo(() => {
    let total = 0;
    let on = 0;
    const rooms = [
      { key: "fruiting", data: latestActuators?.fruiting },
      { key: "spawning", data: latestActuators?.spawning },
      { key: "device", data: latestActuators?.device },
    ];
    rooms.forEach(({ data }) => {
      if (!data) return;
      Object.values(data).forEach((v) => {
        total++;
        if (v) on++;
      });
    });
    return { total, on, off: total - on };
  }, [latestActuators]);

  // Command queue bar data by source
  const queueBySource = useMemo(() => {
    const buckets: Record<string, number> = {};
    commandQueue.forEach((cmd) => {
      buckets[cmd.source] = (buckets[cmd.source] ?? 0) + 1;
    });
    return Object.entries(buckets).map(([source, pending]) => ({
      source,
      pending,
    }));
  }, [commandQueue]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Status Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Online Status */}
        <Card className="py-3">
          <CardContent className="px-4 py-0 flex items-center gap-3">
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center ${isOnline ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"}`}
            >
              {isOnline ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <WifiOff className="h-5 w-5 text-red-500" />
              )}
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Device</div>
              <div
                className={`text-sm font-bold ${isOnline ? "text-green-600" : "text-red-500"}`}
              >
                {deviceStatus?.status ?? "UNKNOWN"}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ML Status */}
        <Card className="py-3">
          <CardContent className="px-4 py-0 flex items-center gap-3">
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center ${mlEnabled ? "bg-blue-100 dark:bg-blue-900/30" : "bg-muted"}`}
            >
              <Bot
                className={`h-5 w-5 ${mlEnabled ? "text-blue-600" : "text-muted-foreground"}`}
              />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">ML Automation</div>
              <div
                className={`text-sm font-bold ${mlEnabled ? "text-blue-600" : "text-muted-foreground"}`}
              >
                {mlEnabled ? "Enabled" : "Disabled"}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actuators ON */}
        <Card className="py-3">
          <CardContent className="px-4 py-0 flex items-center gap-3">
            <div className="h-8 w-8 rounded-full flex items-center justify-center bg-green-100 dark:bg-green-900/30">
              <Zap className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">
                Active Actuators
              </div>
              <div className="text-sm font-bold">
                <span className="text-green-600">{actuatorStats.on}</span>
                <span className="text-muted-foreground text-xs">
                  {" "}
                  / {actuatorStats.total}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Command Queue */}
        <Card className="py-3">
          <CardContent className="px-4 py-0 flex items-center gap-3">
            <div className="h-8 w-8 rounded-full flex items-center justify-center bg-orange-100 dark:bg-orange-900/30">
              <CircleDot className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Command Queue</div>
              <div className="text-sm font-bold text-orange-600">
                {commandQueue.length}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Device Metadata */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Server className="h-4 w-4 text-primary" />
              Device Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Info className="h-3.5 w-3.5" />
                Serial Number
              </div>
              <span className="font-mono text-xs font-medium">
                {serialNumber}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Power className="h-3.5 w-3.5" />
                Last Boot
              </div>
              <span className="text-xs font-medium">
                {deviceStatus?.metadata?.last_boot ?? "—"}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                Last Update
              </div>
              <span className="text-xs font-medium">
                {formatIsoString(deviceStatus?.last_update)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Bot className="h-3.5 w-3.5" />
                ML Automation
              </div>
              <Badge
                variant={mlEnabled ? "default" : "secondary"}
                className={`text-xs ${mlEnabled ? "bg-blue-600 hover:bg-blue-700" : ""}`}
              >
                {mlEnabled ? "Active" : "Inactive"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Command Queue Chart */}
        {queueBySource.length > 0 ? (
          <Card className="pt-0">
            <CardHeader className="border-b py-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-orange-500" />
                Command Queue by Source
              </CardTitle>
              <CardDescription className="text-xs">
                {commandQueue.length} pending commands
              </CardDescription>
            </CardHeader>
            <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
              <ChartContainer
                config={queueChartConfig}
                className="aspect-auto h-[120px] w-full"
              >
                <BarChart data={queueBySource}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="source"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <Bar
                    dataKey="pending"
                    fill="var(--color-pending)"
                    radius={4}
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-orange-500" />
                Command Queue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6 text-sm text-muted-foreground">
                No pending commands
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Latest Actuators */}
      {latestActuators ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <ToggleLeft className="h-4 w-4 text-primary" />
              Latest Actuator States
              {latestActuators.timestamp && (
                <span className="ml-auto text-xs text-muted-foreground font-normal">
                  Updated: {formatIsoString(latestActuators.timestamp)}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {latestActuators.fruiting && (
              <ActuatorRoomGrid
                roomLabel="Fruiting Chamber"
                actuators={
                  latestActuators.fruiting as unknown as Record<string, boolean>
                }
                colorClass="text-green-700 dark:text-green-400"
              />
            )}
            {latestActuators.spawning && (
              <ActuatorRoomGrid
                roomLabel="Spawning Chamber"
                actuators={
                  latestActuators.spawning as unknown as Record<string, boolean>
                }
                colorClass="text-blue-700 dark:text-blue-400"
              />
            )}
            {latestActuators.device && (
              <ActuatorRoomGrid
                roomLabel="Device / Global"
                actuators={
                  latestActuators.device as unknown as Record<string, boolean>
                }
                colorClass="text-purple-700 dark:text-purple-400"
              />
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No actuator state data available
          </CardContent>
        </Card>
      )}

      {/* Command Queue Table */}
      {commandQueue.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <CircleDot className="h-4 w-4 text-orange-500" />
              Pending Command Queue
            </CardTitle>
            <CardDescription className="text-xs">
              Commands awaiting execution by the Raspberry Pi
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[280px] rounded-b-md">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className="text-xs">Timestamp</TableHead>
                    <TableHead className="text-xs">Actuator</TableHead>
                    <TableHead className="text-xs">Room</TableHead>
                    <TableHead className="text-xs">Source</TableHead>
                    <TableHead className="text-xs text-center">State</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commandQueue.map((cmd, i) => (
                    <TableRow
                      key={`${cmd._key ?? cmd.timestamp}-${i}`}
                      className="text-xs"
                    >
                      <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {formatUnixTimestamp(cmd.timestamp)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {ACTUATOR_LABELS[cmd.actuator] ?? cmd.actuator}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            cmd.room === "fruiting" ? "default" : "secondary"
                          }
                          className={`text-xs ${cmd.room === "fruiting" ? "bg-green-600" : ""}`}
                        >
                          {ROOM_LABELS[cmd.room] ?? cmd.room}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs capitalize">
                          {cmd.source.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={cmd.state ? "default" : "outline"}
                          className={`text-xs font-bold ${cmd.state ? "bg-green-600 hover:bg-green-700" : "text-red-600 border-red-300"}`}
                        >
                          {cmd.state ? "ON" : "OFF"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
