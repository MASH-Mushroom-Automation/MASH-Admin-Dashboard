/**
 * IoT Firebase RTDB Types
 * Matches the schema exported from:
 *   /actuator_logs/<serialNumber>/<timestampKey>
 *   /devices/<serialNumber>/latest_actuators
 *   /devices/<serialNumber>/latest_reading
 *   /devices/<serialNumber>/command_queue/<pushKey>
 *   /devices/<serialNumber>/status
 *   /sensor_data/<serialNumber>/fruiting/<timestampKey>
 *   /sensor_data/<serialNumber>/spawning/<timestampKey>
 *   /historical_aggregates/<serialNumber>/<room>/<YYYY-MM>/<DD>/<HH:00>
 *   /live_readings/<serialNumber>/<room>
 */

// ─── Sensor Data ─────────────────────────────────────────────────────────────

export interface SensorReading {
  temperature: number;
  humidity: number;
  co2: number;
  timestamp?: number;
}

export interface LatestReading {
  fruiting: SensorReading;
  spawning: SensorReading;
  timestamp: number;
}

export interface SensorLog {
  timestamp: string; // Firebase key e.g. "2026-02-21T04-08-07-787958"
  data: SensorReading;
  room: "fruiting" | "spawning";
}

// Combined chart data point (after aggregation)
export interface SensorChartPoint {
  time: string;
  fruiting_temp: number | null;
  spawning_temp: number | null;
  fruiting_humidity: number | null;
  spawning_humidity: number | null;
  fruiting_co2: number | null;
  spawning_co2: number | null;
}

// ─── Historical Aggregates (new schema) ──────────────────────────────────────
// Matches: historical_aggregates/{serial}/{room}/{YYYY-MM}/{DD}/{HH:00}

export interface HourlyAggregate {
  time: string; // "YYYY-MM-DD HH:00" (client-assigned from path)
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

// Matches: live_readings/{serial}/{room}
export interface LiveReading {
  current_temp: number;
  current_hum: number;
  current_co2: number;
  last_updated: number; // UNIX float
}

// ─── Actuator Logs ───────────────────────────────────────────────────────────

export interface ActuatorLog {
  actuator: string; // e.g. "exhaust_fan"
  mode: string; // e.g. "auto" | "manual"
  room: string; // e.g. "fruiting" | "spawning" | "device"
  state: string; // e.g. "ON" | "OFF"
  timestamp: string; // ISO string e.g. "2026-02-21T04:08:07.787958"
  timestamp_unix: number; // UNIX timestamp
  _key?: string; // Firebase push key (populated by client)
}

// ─── Latest Actuators ────────────────────────────────────────────────────────

export interface FruitingActuators {
  exhaust_fan: boolean;
  humidifier_fan: boolean;
  intake_fan: boolean;
  led: boolean;
  mist_maker: boolean;
}

export interface SpawningActuators {
  exhaust_fan: boolean;
}

export interface DeviceActuators {
  exhaust_fan?: boolean;
  [key: string]: boolean | undefined;
}

export interface LatestActuators {
  device?: DeviceActuators;
  fruiting?: FruitingActuators;
  spawning?: SpawningActuators;
  timestamp?: string;
}

// ─── Command Queue ───────────────────────────────────────────────────────────

export interface CommandQueueItem {
  actuator: string; // e.g. "exhaust_fan"
  room: string; // e.g. "fruiting"
  source: string; // e.g. "mobile_app"
  state: boolean;
  timestamp: number; // UNIX float
  _key?: string; // Firebase push key
}

// ─── Device Status ───────────────────────────────────────────────────────────

export interface DeviceMetadata {
  last_boot?: string; // e.g. "2026-02-21 19:02:27"
  ml_enabled?: boolean;
}

export interface DeviceStatus {
  last_update?: string; // ISO string
  metadata?: DeviceMetadata;
  status?: "ONLINE" | "OFFLINE" | string;
}

// ─── Actuator display helpers ─────────────────────────────────────────────────

export const ACTUATOR_LABELS: Record<string, string> = {
  exhaust_fan: "Exhaust Fan",
  humidifier_fan: "Humidifier Fan",
  intake_fan: "Intake Fan",
  led: "LED Lights",
  mist_maker: "Mist Maker",
};

export const ROOM_LABELS: Record<string, string> = {
  fruiting: "Fruiting",
  spawning: "Spawning",
  device: "Device",
  all: "All Rooms",
};
