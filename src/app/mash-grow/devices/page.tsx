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

type DeviceLocal = {
  id: string;
  serialNumber: string;
  name?: string;
  model: string;
  version: number;
  location: string;
  status: "Online" | "Offline";
  type?: DeviceType;
  assigned?: boolean;
  archived?: boolean;
  description?: string;
  firmware?: string;
  isActive?: boolean;
  createdAt?: string;
};



type UserLocal = {
  id: string;
  name?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  contactNumber?: string;
  deviceId?: string;
  selectedDeviceId?: string;
  archived?: boolean;
};

const DEFAULT_DEVICES: DeviceLocal[] = [
  {
    id: "d1",
    serialNumber: "MASH-A1-CAL25-D5A91F",
    name: "Chamber A",
    model: "A",
    version: 1,
    location: "Caloocan",
    status: "Offline",
    type: "MUSHROOM_CHAMBER",
    assigned: true,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "d2",
    serialNumber: "MASH-B2-MAN25-8F3C21",
    name: "Beta Chamber Manila",
    model: "B",
    version: 2,
    location: "Manila",
    status: "Online",
    type: "MUSHROOM_CHAMBER",
    assigned: false,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  // archived mock device(s) for the archive view
  {
    id: "d6",
    serialNumber: "MASH-R1-MAK25-4B7E92",
    name: "Archived Device",
    model: "R",
    version: 1,
    location: "Makati",
    status: "Offline",
    type: "LAMINAR_FLOW",
    assigned: false,
    archived: true,
    isActive: false,
    createdAt: new Date().toISOString(),
  },
];

export default function DevicesPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [devices, setDevices] = useState<DeviceLocal[]>(() => DEFAULT_DEVICES);

  const [createOpen, setCreateOpen] = useState(false);
  const [editDevice, setEditDevice] = useState<DeviceLocal | null>(null);
  const [viewDevice, setViewDevice] = useState<DeviceLocal | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [showRegistered, setShowRegistered] = useState(false);
  const [users, setUsers] = useState<UserLocal[]>(() => [
    {
      id: "1",
      name: "Ana Santos",
      firstName: "Ana",
      lastName: "Santos",
      email: "ana.santos@example.com",
      phoneNumber: "+639171234567",
      deviceId: "MASH-A1-CAL25-D5A91F",
    },
  ]);

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

  useEffect(() => {
    setCurrentPage(1);
  }, [devices, showArchived, showRegistered]);

  const handleCreateSave = (device: DeviceLocal) => {
    setDevices((prev) => {
      const exists = prev.find((d) => d.id === device.id);
      if (exists) return prev.map((p) => (p.id === device.id ? device : p));
      return [device, ...prev];
    });
    toast.success(editDevice ? "Device updated successfully" : "Device created successfully");
    setEditDevice(null);
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
            <Table className="table-fixed w-full">
              <TableHeader>
                <tr>
                  <TableHead className="w-52">Serial Number</TableHead>
                  <TableHead className="w-48">Name</TableHead>
                  <TableHead className="w-32">Model</TableHead>
                  <TableHead className="w-40">Type</TableHead>
                  <TableHead className="w-32">Location</TableHead>
                  <TableHead className="w-24">Status</TableHead>
                  <TableHead className="w-28">Actions</TableHead>
                </tr>
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
                                setDevices((prev) =>
                                  prev.map((p) =>
                                    p.id === d.id ? { ...p, archived: false } : p
                                  )
                                );
                                toast.success("Device restored");
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
            setDevices((prev) =>
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
