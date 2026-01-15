"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmationPopover } from "@/components/confirmation-popover";
import { Archive, RefreshCw } from "lucide-react";
import { ActionsMenu } from "@/components/user-actions-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CreateDeviceModal from "@/components/mash-grow/create-device-modal";
import ViewDeviceModal from "@/components/mash-grow/view-device-modal";
import { toast } from "sonner";
import PaginationWrapper from '@/components/pagination';
import { parseDeviceId } from "@/lib/luhn";
import { 
  DeviceType,
  DEVICE_TYPE_LABELS,
  DEVICE_STATUS_COLORS 
} from "@/types/device";
import { deviceService, type Device as ApiDevice } from "@/services/mashGrowService";

// Map API Device to local DeviceLocal type for compatibility with existing components
type DeviceLocal = ApiDevice;

export default function DevicesPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [devices, setDevices] = useState<DeviceLocal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [editDevice, setEditDevice] = useState<DeviceLocal | null>(null);
  const [viewDevice, setViewDevice] = useState<DeviceLocal | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [showRegistered, setShowRegistered] = useState(false);

  const [showArchived, setShowArchived] = useState(() => {
    try {
      const raw = localStorage.getItem("mash_devices_showArchived");
      return raw === "true";
    } catch {
      return false;
    }
  });
  
  useEffect(() => {
    try {
      localStorage.setItem(
        "mash_devices_showArchived",
        showArchived ? "true" : "false"
      );
    } catch {}
  }, [showArchived]);
  
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [archivingDevice, setArchivingDevice] = useState<DeviceLocal | null>(null);

  // Fetch devices from backend
  useEffect(() => {
    fetchDevices();
  }, [showArchived, showRegistered]);

  const fetchDevices = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await deviceService.getAll({
        page: 1,
        limit: 100, // Get all devices for client-side filtering
        archived: showArchived ? true : undefined,
        assigned: showRegistered ? true : undefined
      });
      setDevices(response.data);
    } catch (err) {
      const errorMessage = (err as Error).message || 'Failed to load devices';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [devices, showArchived, showRegistered]);

  const handleCreateSave = async (device: DeviceLocal) => {
    try {
      if (editDevice) {
        // Update existing device
        await deviceService.update(device.id, device);
        toast.success("Device updated successfully");
      } else {
        // Create new device
        await deviceService.create(device);
        toast.success("Device created successfully");
      }
      setEditDevice(null);
      fetchDevices(); // Refresh the list
    } catch (err) {
      const errorMessage = (err as Error).message || 'Failed to save device';
      toast.error(errorMessage);
    }
  };

  const handleArchive = async (device: DeviceLocal) => {
    try {
      await deviceService.archive(device.id, !showArchived);
      toast.success(showArchived ? "Device restored" : "Device archived");
      fetchDevices(); // Refresh the list
    } catch (err) {
      const errorMessage = (err as Error).message || 'Failed to archive device';
      toast.error(errorMessage);
    }
  };

  // Filter devices based on view mode
  const filteredDevices = devices.filter((d) => {
    if (showArchived) return Boolean(d.archived);
    if (showRegistered) return Boolean(d.assigned);
    return !d.archived; // Active devices
  });
  const totalItems = filteredDevices.length;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const pagedDevices = filteredDevices.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="w-full px-4 py-8 overflow-x-hidden">
      <div>
        {showArchived ? (
          <div className="mb-6">
            <div className="flex items-center justify-start mb-2">
              <div className="shrink-0">
                <Button variant="ghost" size="sm" onClick={() => setShowArchived(false)} aria-label="Back to active">Back</Button>
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold">Archived Devices</h1>
              <p className="text-muted-foreground mt-1">View archived devices</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">
                {showRegistered ? "Registered Devices" : "Active Devices"}
              </h1>
              <p className="text-muted-foreground mt-1">
                {showRegistered 
                  ? "Devices assigned to users" 
                  : "Manage and monitor your devices"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={showRegistered ? "default" : "outline"}
                size="sm"
                onClick={() => setShowRegistered(!showRegistered)}
              >
                {showRegistered ? "Show All Active" : "Show Registered"}
              </Button>
              <Button onClick={() => setCreateOpen(true)}>Create Device</Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowArchived(true)}
                aria-label="View archived"
              >
                <Archive className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <Card>
          <CardContent className="overflow-x-auto">
            {loading ? (
              <div className="py-8 text-center text-muted-foreground">
                Loading devices...
              </div>
            ) : error ? (
              <div className="py-8 text-center text-red-500">
                {error}
              </div>
            ) : (
              <Table className="w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-52">Serial Number</TableHead>
                    <TableHead className="w-48">Name</TableHead>
                    <TableHead className="w-32">Model</TableHead>
                    <TableHead className="w-40">Type</TableHead>
                    <TableHead className="w-32">Location</TableHead>
                    <TableHead className="w-24">Status</TableHead>
                    <TableHead className="w-28">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedDevices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No devices found
                      </TableCell>
                    </TableRow>
                  ) : (
                    pagedDevices.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-mono w-52 overflow-hidden truncate">
                          {d.serialNumber}
                        </TableCell>
                        <TableCell className="w-48">
                          <div className="truncate">{d.name || "—"}</div>
                        </TableCell>
                        <TableCell className="w-32">
                          <Badge variant="outline">
                            {d.model}{d.version}
                          </Badge>
                        </TableCell>
                        <TableCell className="w-40 max-w-40 overflow-hidden">
                          <div className="truncate">
                            {d.type ? DEVICE_TYPE_LABELS[d.type] : "—"}
                          </div>
                        </TableCell>
                        <TableCell className="w-32 overflow-hidden truncate">
                          {d.location}
                        </TableCell>
                        <TableCell className="w-24">
                          <Badge 
                            variant={d.status === "Online" ? "default" : "secondary"}
                            className={d.status === "Online" ? "bg-green-500" : ""}
                          >
                            {d.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex">
                            <ActionsMenu
                              id={d.id}
                              showView={true}
                              showEdit={true}
                              onView={() => {
                                setViewDevice(d);
                                setViewOpen(true);
                              }}
                              onEdit={() => {
                                setEditDevice(d);
                                setCreateOpen(true);
                              }}
                              onArchive={() => {
                                if (!showArchived) {
                                  setArchivingDevice(d);
                                  setShowArchiveConfirm(true);
                                } else {
                                  handleArchive(d);
                                }
                              }}
                              ArchiveLabel={showArchived ? "Restore" : "Archive"}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        <PaginationWrapper
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          onPageChange={(p) => setCurrentPage(p)}
        />
      </div>

      <CreateDeviceModal
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) setEditDevice(null);
        }}
        onSave={handleCreateSave}
        initialDevice={editDevice || undefined}
      />
      
      <ViewDeviceModal
        open={viewOpen}
        onOpenChange={setViewOpen}
        device={viewDevice ? {
          id: viewDevice.id,
          deviceId: viewDevice.serialNumber,
          name: viewDevice.name,
          model: `${viewDevice.model}${viewDevice.version}`,
          type: viewDevice.type ? DEVICE_TYPE_LABELS[viewDevice.type] : undefined,
          location: viewDevice.location,
          status: viewDevice.status,
          assigned: viewDevice.assigned,
          description: viewDevice.description,
        } : undefined}
      />
      
      {showArchiveConfirm && archivingDevice && (
        <ConfirmationPopover
          action="Archive"
          entity="Device"
          onConfirm={() => {
            handleArchive(archivingDevice);
            setShowArchiveConfirm(false);
            setArchivingDevice(null);
          }}
          onCancel={() => {
            setShowArchiveConfirm(false);
            setArchivingDevice(null);
          }}
        />
      )}
    </div>
  );
}
