"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmationPopover } from "@/components/confirmation-popover";
import { Archive, ArrowLeft } from "lucide-react";
import { ActionsMenu } from "@/components/user-actions-menu"
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
import PaginationWrapper from '@/components/pagination'

type Device = {
  id: string;
  deviceId: string;
  model: string;
  location: string;
  status: "Online" | "Offline";
  type?: string;
  assigned?: boolean;
  archived?: boolean;
};

const DEFAULT_DEVICES: Device[] = [
  {
    id: "d1",
    deviceId: "MASH-A1-CALOOCAN-AC2523",
    model: "A1",
    location: "Caloocan",
    status: "Online",
    type: "Mushroom Chamber",
    assigned: true,
  },
 
  // archived mock device(s) for the archive view
  {
    id: "d6",
    deviceId: "MASH-F6-ARCHIVED-AC2528",
    model: "F6",
    location: "Makati",
    status: "Offline",
    type: "Mushroom Chamber",
    assigned: false,
    archived: true,
  },
];

export default function DevicesPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
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
    // reset to page 1 when devices change
    setCurrentPage(1);
  }, [devices]);

  // ensure currentPage is within range when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [showArchived]);

  const handleCreateSave = (device: Device) => {
    // if device exists update, otherwise prepend
    setDevices((prev: Device[]) => {
      const exists = prev.find((d) => d.id === device.id);
      if (exists) return prev.map((p) => (p.id === device.id ? device : p));
      return [device, ...prev];
    });
    toast.success("Device created");
  };

  const filteredDevices = devices.filter((d) => (showArchived ? Boolean(d.archived) : !d.archived));
  const totalItems = filteredDevices.length;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const pagedDevices = filteredDevices.slice(startIndex, startIndex + itemsPerPage);

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
            <Table className="table-fixed w-full">
              <TableHeader>
                <tr>
                  <TableHead className="w-48">Device ID</TableHead>
                  <TableHead className="w-20">Model</TableHead>
                  <TableHead className="w-40">Type</TableHead>
                  <TableHead className="w-32">Location</TableHead>
                  <TableHead className="w-24">Status</TableHead>
                  <TableHead className="w-28">Actions</TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {pagedDevices.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-mono w-48 overflow-hidden truncate">{d.deviceId}</TableCell>
                    <TableCell className="w-20">{d.model}</TableCell>
                    <TableCell className="max-w-40 overflow-hidden truncate">
                      <div className="truncate">{d.type}</div>
                    </TableCell>
                    <TableCell className="w-32 overflow-hidden truncate">{d.location}</TableCell>
                    <TableCell className="w-24">{d.status}</TableCell>
                    <TableCell>
                      <div className="flex">
                        <ActionsMenu
                          id={d.id}
                          showView={false}
                          showEdit={true}
                          onEdit={() => {
                            setEditDevice(d)
                            setCreateOpen(true)
                          }}
                          onArchive={() => {
                            if (!showArchived) {
                              setArchivingDevice(d)
                              setShowArchiveConfirm(true)
                            } else {
                              setDevices((prev: Device[]) => prev.map((p) => (p.id === d.id ? { ...p, archived: false } : p)))
                              toast.success("Device restored")
                            }
                          }}
                          ArchiveLabel={showArchived ? "Restore" : "Archive"}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
        initialDevice={
          editDevice
            ? {
                id: editDevice.id,
                deviceId: editDevice.deviceId,
                model: editDevice.model ?? "",
                location: editDevice.location ?? "",
                status: editDevice.status === "Online" ? "Online" : "Offline",
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
