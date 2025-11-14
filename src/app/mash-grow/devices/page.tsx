"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmationPopover } from "@/components/confirmation-popover";
import { Archive } from "lucide-react";
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
import CreateDeviceModal from "@/components/mash-grow/create-device-modal";
import ViewDeviceModal from "@/components/mash-grow/view-device-modal";
import { toast } from "sonner";
import PaginationWrapper from '@/components/pagination'

type Device = {
  id: string;
  deviceId: string;
  name?: string;
  model: string;
  location: string;
  status: "Online" | "Offline";
  type?: string;
  assigned?: boolean;
  archived?: boolean;
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

const DEFAULT_DEVICES: Device[] = [
  {
    id: "d1",
    deviceId: "MASH-A1-CALOOCAN-AC2523",
    name: "Chamber A",
    model: "A1",
    location: "Caloocan",
    status: "Offline",
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
  const [devices, setDevices] = useState<Device[]>(() => DEFAULT_DEVICES);

  const [createOpen, setCreateOpen] = useState(false);
  const [editDevice, setEditDevice] = useState<Device | null>(null);
  const [viewDevice, setViewDevice] = useState<Device | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [users, setUsers] = useState<UserLocal[]>(() => [
    {
      id: "1",
      name: "Ana Santos",
      firstName: "Ana",
      lastName: "Santos",
      email: "ana.santos@example.com",
      phoneNumber: "+639171234567",
      deviceId: "MASH-A1-CALOOCAN-AC2523",
    },
    {
      id: "2",
      name: "Rico Dela Cruz",
      firstName: "Rico",
      lastName: "Dela Cruz",
      email: "rico.delacruz@example.com",
      phoneNumber: "+639172345678",
      deviceId: "MASH-B2-CAL25-AC2524",
    },
  ]);

  // robust matcher to find user for a device (tries multiple heuristics)
  const findUserForDevice = (parsedUsers: UserLocal[], device: Device): UserLocal | undefined => {
    if (!Array.isArray(parsedUsers) || parsedUsers.length === 0) return undefined;
    const norm = (s?: unknown) => String(s ?? "").toLowerCase().trim();
    const strip = (s?: unknown) => norm(String(s ?? "").replace(/[^a-z0-9]/gi, ""));

    const dId = norm(device.id);
    const dDeviceId = norm(device.deviceId);
    const dDeviceIdStrip = strip(device.deviceId);

    // try exact matches first
    for (const u of parsedUsers) {
      // check common fields
      const uRec = u as unknown as Record<string, unknown>;
      const fields: unknown[] = [u.deviceId, u.selectedDeviceId, uRec["device"], uRec["assignedDeviceId"], uRec["device_id"], uRec["selected_device_id"]];
      for (const f of fields) {
        if (f === undefined || f === null) continue;
        // if f is an object, try its id/deviceId
        if (typeof f === "object") {
          const fRec = f as Record<string, unknown>;
          const fid = norm(fRec["id"] ?? fRec["deviceId"] ?? "");
          if (fid && (fid === dId || fid === dDeviceId)) return u;
        } else {
          const fv = norm(f);
          if (!fv) continue;
          if (fv === dId || fv === dDeviceId) return u;
        }
      }
    }

    // try stripped comparisons
    for (const u of parsedUsers) {
      const ux = strip(u.deviceId) || strip(u.selectedDeviceId) || "";
      if (!ux) continue;
      if (ux === dDeviceIdStrip) return u;
    }

    // try substring matches (loose)
    for (const u of parsedUsers) {
      const udev = norm(u.deviceId || u.selectedDeviceId || "");
      if (!udev) continue;
      if (dDeviceId.includes(udev) || udev.includes(dDeviceId)) return u;
    }

    // try matching by last token (useful when IDs contain generated suffixes)
    for (const u of parsedUsers) {
      const uLast = lastToken(u.deviceId || u.selectedDeviceId || "");
      const dLast = lastToken(device.deviceId || device.id || "");
      if (!uLast || !dLast) continue;
      if (uLast === dLast) return u;
    }

    // try matching by short suffix (last 4-8 chars) for generated decimals
    const suffixMatch = (a?: string, b?: string) => {
      if (!a || !b) return false;
      const aa = a.replace(/[^a-z0-9]/gi, "").toLowerCase();
      const bb = b.replace(/[^a-z0-9]/gi, "").toLowerCase();
      const min = Math.min(8, Math.max(4, Math.floor(Math.min(aa.length, bb.length) / 2)));
      if (min <= 0) return false;
      return aa.endsWith(bb.slice(-min)) || bb.endsWith(aa.slice(-min));
    };

    
    

    for (const u of parsedUsers) {
      if (suffixMatch(u.deviceId, device.deviceId) || suffixMatch(u.selectedDeviceId, device.deviceId)) return u;
    }

    return undefined;
  };

  // helper: extract last token (after final dash) and last N chars for fuzzy match
  const lastToken = (s?: string) => {
    if (!s) return "";
    const parts = s.split("-");
    return parts.length ? parts[parts.length - 1].toLowerCase() : s.toLowerCase();
  };
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
    // reset to page 1 when devices change
    setCurrentPage(1);
  }, [devices]);

  // Use mock users instead of reading from localStorage
  useEffect(() => {
    setUsers([
      {
        id: "1",
        name: "CHAMBER A",
        firstName: "Ana",
        lastName: "Santos",
        email: "ana.santos@example.com",
        phoneNumber: "+639171234567",
        deviceId: "MASH-A1-CALOOCAN-AC2523",
      },
      {
        id: "2",
        name: "Rico Dela Cruz",
        firstName: "Rico",
        lastName: "Dela Cruz",
        email: "rico.delacruz@example.com",
        phoneNumber: "+639172345678",
        deviceId: "MASH-B2-CAL25-AC2524",
      },
    ]);
  }, []);

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
        {showArchived ? (
          <div className="mb-6">
            <div className="flex items-center justify-start mb-2">
              <div className="shrink-0">
                <Button variant="ghost" size="sm" onClick={() => setShowArchived(false)} aria-label="Back to active">Back</Button>
              </div>
            </div>

            <div>
              <h1 className="text-2xl font-bold">Devices Archive</h1>
              <p className="text-muted-foreground mt-1">Archived devices</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Devices</h1>
              <p className="text-muted-foreground mt-1">List of registered devices</p>
            </div>
            <div className="flex items-center gap-2">
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
                  <TableHead className="w-48">Device ID</TableHead>
                  <TableHead className="w-48">Name</TableHead>
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
                    <TableCell className="w-48">
                      {(() => {
                        try {
                          const parsed = users || [];
                          if (!Array.isArray(parsed) || parsed.length === 0) {
                            // fallback to device.name if available
                            return d.name ? <div className="truncate">{d.name}</div> : <span className="text-muted-foreground">—</span>;
                          }

                          // primary: find user owner
                          let u = findUserForDevice(parsed, d);
                          // secondary: last-resort - search serialized user objects for a direct inclusion of device id/deviceId
                          if (!u) {
                            try {
                              const needle1 = (d.deviceId || "").toString();
                              const needle2 = (d.id || "").toString();
                              for (const cand of parsed) {
                                const s = JSON.stringify(cand || "");
                                if (s.includes(needle1) || s.includes(needle2)) {
                                  u = cand;
                                  break;
                                }
                              }
                            } catch {}
                          }

                          // display user name if found
                          if (u) {
                            const nameFromParts = `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim();
                            const displayName = u.name ? u.name : nameFromParts || u.email || "—";
                            return <div className="truncate">{displayName}</div>;
                          }

                          // fallback to device.name if available
                          if (d.name) return <div className="truncate">{d.name}</div>;

                          return <span className="text-muted-foreground">—</span>;
                        } catch {
                          return <span className="text-muted-foreground">—</span>;
                        }
                      })()}
                    </TableCell>
                    <TableCell className="w-40 max-w-40 overflow-hidden">
                      <div className="truncate">{d.type ?? (d.model ? 'Mushroom Chamber' : '—')}</div>
                    </TableCell>
                    <TableCell className="w-32 overflow-hidden truncate">{d.location}</TableCell>
                    <TableCell className="w-24">{d.status}</TableCell>
                    <TableCell>
                      <div className="flex">
                        <ActionsMenu
                          id={d.id}
                          showView={true}
                          showEdit={true}
                          onView={() => {
                            setViewDevice(d)
                            setViewOpen(true)
                          }}
                          onEdit={() => {
                            // use in-memory devices (mock data) when opening edit modal
                            const stateMatch = devices.find((x) => x.id === d.id || x.deviceId === d.deviceId);
                            setEditDevice(stateMatch ?? d);
                            setCreateOpen(true);
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
      {/* pass matched user name into the modal so it can display owner */}
      <ViewDeviceModal
        open={viewOpen}
        onOpenChange={setViewOpen}
        device={
          viewDevice
            ? {
                ...viewDevice,
                name: (() => {
                  try {
                    const parsed = users || [];
                    if (!Array.isArray(parsed) || parsed.length === 0) {
                      return viewDevice.name ?? undefined;
                    }

                    let u = findUserForDevice(parsed, viewDevice);

                    if (!u) {
                      // last-resort: search serialized user objects for device id or id
                      try {
                        const needle1 = (viewDevice.deviceId || "").toString();
                        const needle2 = (viewDevice.id || "").toString();
                        for (const cand of parsed) {
                          const s = JSON.stringify(cand || "");
                          if (s.includes(needle1) || s.includes(needle2)) {
                            u = cand;
                            break;
                          }
                        }
                      } catch {}
                    }

                    if (u) {
                      const nameFromParts = `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim();
                      return u.name ? u.name : nameFromParts || u.email;
                    }

                    return viewDevice.name ?? undefined;
                  } catch {
                    return viewDevice.name ?? undefined;
                  }
                })(),
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
