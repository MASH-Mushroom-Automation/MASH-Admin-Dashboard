/**
 * Device Types - Based on backend Neon DB schema
 */

export type DeviceType = 
  | "MUSHROOM_CHAMBER"
  | "LAMINAR_FLOW"
  | "INCUBATOR"
  | "CLIMATE_CONTROLLER"
  | "SENSOR_NODE"
  | "OTHER";

export type DeviceStatus = 
  | "ONLINE"
  | "OFFLINE"
  | "MAINTENANCE"
  | "ERROR"
  | "INACTIVE";

export type DeviceModel = "A" | "B" | "R"; // Alpha, Beta, Release

export interface Device {
  id: string;
  name: string;
  type: DeviceType;
  serialNumber: string;
  status: DeviceStatus;
  userId?: string | null;
  location?: string | null;
  description?: string | null;
  firmware?: string | null;
  ipAddress?: string | null;
  macAddress?: string | null;
  lastSeen?: Date | string | null;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface DeviceFormData {
  name: string;
  type: DeviceType;
  model: DeviceModel;
  version: number;
  location: string;
  description?: string;
  firmware?: string;
}

export interface DeviceListResponse {
  devices: Device[];
  total: number;
  page: number;
  pageSize: number;
}

export interface DeviceCreatePayload {
  name: string;
  type: DeviceType;
  serialNumber: string;
  location?: string;
  description?: string;
  firmware?: string;
}

export interface DeviceUpdatePayload {
  name?: string;
  type?: DeviceType;
  location?: string;
  description?: string;
  firmware?: string;
  ipAddress?: string;
  macAddress?: string;
}

// Model descriptions
export const MODEL_DESCRIPTIONS: Record<DeviceModel, string> = {
  A: "Alpha Prototype Build",
  B: "Beta Prototype Build",
  R: "Release Build",
};

// Device type labels
export const DEVICE_TYPE_LABELS: Record<DeviceType, string> = {
  MUSHROOM_CHAMBER: "Mushroom Chamber",
  LAMINAR_FLOW: "Laminar Flow Hood",
  INCUBATOR: "Incubator",
  CLIMATE_CONTROLLER: "Climate Controller",
  SENSOR_NODE: "Sensor Node",
  OTHER: "Other",
};

// Device status labels
export const DEVICE_STATUS_LABELS: Record<DeviceStatus, string> = {
  ONLINE: "Online",
  OFFLINE: "Offline",
  MAINTENANCE: "Maintenance",
  ERROR: "Error",
  INACTIVE: "Inactive",
};

// Device status colors for badges
export const DEVICE_STATUS_COLORS: Record<DeviceStatus, string> = {
  ONLINE: "bg-green-500",
  OFFLINE: "bg-gray-500",
  MAINTENANCE: "bg-yellow-500",
  ERROR: "bg-red-500",
  INACTIVE: "bg-gray-400",
};
