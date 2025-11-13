"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmationPopover } from "@/components/confirmation-popover";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Archive, ArrowLeft } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import CreateDeviceModal from "@/components/mash-grow/create-device-modal";
import { toast } from "sonner";

type Device = {
  id: string;
  deviceId: string;
  model: string;
  location: string;
  status: "Connected" | "Disconnected";
  assigned?: boolean;
  archived?: boolean;
};

const DEFAULT_DEVICES: Device[] = [
  {
    id: "d1",
    deviceId: "MASH-A1-CALOOCAN-AC2523",
    model: "A1",
    location: "Caloocan",
    status: "Connected",
    assigned: true,
  },
  {
    id: "d2",
    deviceId: "MASH-B2-MANILA-AC2524",
    model: "B2",
    location: "Manila",
    status: "Disconnected",
    assigned: false,
  },
  {
    id: "d3",
    deviceId: "MASH-C3-QUEZONCITY-AC2525",
    model: "C3",
    location: "Quezon City",
    status: "Connected",
    assigned: false,
  },
  {
    id: "d4",
    deviceId: "MASH-D4-MAKATI-AC2526",
    model: "D4",
    location: "Makati",
    status: "Disconnected",
    assigned: false,
  },
  {
    id: "d5",
    deviceId: "MASH-E5-PASIG-AC2527",
    model: "E5",
    location: "Pasig",
    status: "Connected",
    assigned: false,
  },
  // archived mock device(s) for the archive view
  {
    id: "d6",
    deviceId: "MASH-F6-ARCHIVED-AC2528",
    model: "F6",
    location: "Makati",
    status: "Disconnected",
    assigned: false,
    archived: true,
  },
  {
    id: "d7",
    deviceId: "MASH-G7-ARCHIVED-AC2529",
    model: "G7",
    location: "Pasig",
    status: "Disconnected",
    assigned: false,
    archived: true,
  },
  {
    id: "d8",
    deviceId: "MASH-H8-ARCHIVED-AC2530",
    model: "H8",
    location: "Quezon City",
    status: "Disconnected",
    assigned: false,
    archived: true,
  },
];

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>(() => {
    try {
      const raw = localStorage.getItem("mash_devices");
      if (!raw || raw === "null") return DEFAULT_DEVICES;
      try {
        const parsed = JSON.parse(raw) as Device[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        return DEFAULT_DEVICES;
      } catch {
        return DEFAULT_DEVICES;
      }
    } catch {
      return DEFAULT_DEVICES;
    }
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [editDevice, setEditDevice] = useState<Device | null>(null);
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
  const [archivingDevice, setArchivingDevice] = useState<Device | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem("mash_devices", JSON.stringify(devices));
    } catch {}
  }, [devices]);

  const handleCreateSave = (device: Device) => {
    // if device exists update, otherwise prepend
    setDevices((prev: Device[]) => {
      const exists = prev.find((d) => d.id === device.id);
      if (exists) return prev.map((p) => (p.id === device.id ? device : p));
      return [device, ...prev];
    });
    toast.success("Device created");
  };

  return (
    <div className="w-full px-4 py-8 overflow-x-hidden">
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">
              {showArchived ? "Devices Archive" : "Devices"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {showArchived ? "Archived devices" : "List of registered devices"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!showArchived ? (
              <Button onClick={() => setCreateOpen(true)}>Create Device</Button>
            ) : null}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowArchived((s) => !s)}
              aria-label={showArchived ? "Back to active" : "View archived"}
            >
              {showArchived ? (
                <ArrowLeft className="h-4 w-4" />
              ) : (
                <Archive className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <tr>
                  <TableHead>Device ID</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {devices
                  .filter((d) =>
                    showArchived ? Boolean(d.archived) : !d.archived
                  )
                  .map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-mono">{d.deviceId}</TableCell>
                      <TableCell>{d.model}</TableCell>
                      <TableCell>{d.location}</TableCell>
                      <TableCell>{d.status}</TableCell>
                      <TableCell>
                        <div className="flex">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                aria-label="Actions"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              {!showArchived ? (
                                <>
                                  <DropdownMenuItem
                                    onSelect={() => {
                                      // open edit
                                      setEditDevice(d);
                                      setCreateOpen(true);
                                    }}
                                  >
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onSelect={() => {
                                      setArchivingDevice(d);
                                      setShowArchiveConfirm(true);
                                    }}
                                  >
                                    Archive
                                  </DropdownMenuItem>
                                </>
                              ) : (
                                <>
                                  <DropdownMenuItem
                                    onSelect={() => {
                                      // restore archived device
                                      setDevices((prev: Device[]) =>
                                        prev.map((p) =>
                                          p.id === d.id
                                            ? { ...p, archived: false }
                                            : p
                                        )
                                      );
                                      toast.success("Device restored");
                                    }}
                                  >
                                    Restore
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <CreateDeviceModal
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) setEditDevice(null);
        }}
        onSave={handleCreateSave}
        initialDevice={
          editDevice
            ? {
                id: editDevice.id,
                deviceId: editDevice.deviceId,
                model: editDevice.model ?? "",
                location: editDevice.location ?? "",
                status:
                  editDevice.status === "Connected"
                    ? "Connected"
                    : "Disconnected",
                assigned: editDevice.assigned ?? false,
                archived: editDevice.archived,
              }
            : undefined
        }
      />
      {showArchiveConfirm && archivingDevice && (
        <ConfirmationPopover
          action="Archive"
          entity="Device"
          onConfirm={() => {
            setDevices((prev: Device[]) =>
              prev.map((p) =>
                p.id === archivingDevice.id
                  ? { ...p, archived: true, assigned: false }
                  : p
              )
            );
            setShowArchiveConfirm(false);
            setArchivingDevice(null);
            toast.success("Device archived");
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
