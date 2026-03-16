"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmationPopover } from "@/components/confirmation-popover";
import { Archive, ArrowLeft } from "lucide-react";
import { ActionsMenu } from "@/components/user-actions-menu";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CreateDeviceModal from "@/components/mash-grow/create-device-modal";
import ViewDeviceModal from "@/components/mash-grow/view-device-modal";
import { toast } from "sonner";
import PaginationWrapper from "@/components/pagination";
import TableSkeleton from "@/components/ui/table-skeleton";
import InlineSpinner from "@/components/ui/inline-spinner";
import { DeviceType, DEVICE_TYPE_LABELS } from "@/types/device";
import {
  deviceService,
  type Device as ApiDevice,
} from "@/services/mashGrowService";
import { useDevices } from "@/hooks/useDevices";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";

type DeviceLocal = ApiDevice & {
  model?: string; // Add optional model for UI display compatibility
};

export default function DevicesPage() {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const [createOpen, setCreateOpen] = useState(false);
  const [editDevice, setEditDevice] = useState<DeviceLocal | null>(null);
  const [viewDevice, setViewDevice] = useState<DeviceLocal | null>(null);
  const [viewOpen, setViewOpen] = useState(false);

  const [showArchived, setShowArchived] = useState(() => {
    try {
      const raw = localStorage.getItem("mash_devices_showArchived");
      return raw === "true";
    } catch {
      return false;
    }
  });

  const {
    data: devices = [],
    isLoading: loading,
    error: queryError,
  } = useDevices({
    archived: showArchived ? true : undefined,
  });
  const error = queryError ? (queryError as Error).message : null;

  useEffect(() => {
    try {
      localStorage.setItem(
        "mash_devices_showArchived",
        showArchived ? "true" : "false",
      );
    } catch {}
  }, [showArchived]);

  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [archivingDevice, setArchivingDevice] = useState<DeviceLocal | null>(
    null,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [devices, showArchived, itemsPerPage]);

  const handleCreateSave = async (device: Partial<DeviceLocal>) => {
    try {
      // Prepare payload with only allowed fields to avoid 400 Bad Request
      const payload: any = {
        name: device.name,
        type: device.type,
        description: device.description,
        location: device.location,
        serialNumber: device.serialNumber,
        firmware: device.firmware,
        configuration: device.configuration,
      };

      // Clean undefined values
      Object.keys(payload).forEach(
        (key) => payload[key] === undefined && delete payload[key],
      );

      if (editDevice) {
        // Update existing device - userId is not allowed in update (OmitType)
        await deviceService.update(editDevice.id, payload);
        toast.success("Device updated successfully");
      } else {
        // Create new device - userId is allowed if assigning initially
        if (device.userId) payload.userId = device.userId;
        await deviceService.create(payload as any);
        toast.success("Device created successfully");
      }
      setEditDevice(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.devices.all });
    } catch (err) {
      const errorMessage = (err as Error).message || "Failed to save device";
      toast.error(errorMessage);
    }
  };

  const handleArchive = async (device: DeviceLocal) => {
    try {
      await deviceService.archive(device.id, !showArchived);
      toast.success(showArchived ? "Device restored" : "Device archived");
      queryClient.invalidateQueries({ queryKey: queryKeys.devices.all });
    } catch (err) {
      const errorMessage = (err as Error).message || "Failed to archive device";
      toast.error(errorMessage);
    }
  };

  // Filter devices based on view mode
  const filteredDevices = devices.filter((d) =>
    showArchived ? Boolean(d.archived) : !d.archived,
  );
  const totalItems = filteredDevices.length;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const pagedDevices = filteredDevices.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  // Device table columns including selection/profile to match users table
  const deviceColumns = ((): ColumnDef<DeviceLocal, any>[] => {
    return [
      {
        id: "select",
        header: ({ table }) => {
          const allSelected = table.getIsAllPageRowsSelected();
          const someSelected = table.getIsSomePageRowsSelected();
          return (
            <input
              type="checkbox"
              className="h-4 w-4 rounded-md border-2 border-slate-300 bg-white accent-primary"
              checked={allSelected}
              ref={(el) => {
                if (el) el.indeterminate = someSelected && !allSelected;
              }}
              onChange={table.getToggleAllPageRowsSelectedHandler()}
              aria-label="Select all rows"
            />
          );
        },
        cell: ({ row }) => (
          <input
            type="checkbox"
            className="h-4 w-4 rounded-md border-2 border-slate-300 bg-white accent-primary"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            aria-label={`Select row ${row.id}`}
          />
        ),
        size: 24,
      },
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ getValue }) => getValue() || "—",
      },
      {
        accessorKey: "serialNumber",
        header: "Serial Number",
        cell: ({ getValue }) => getValue() || "—",
      },
      {
        id: "model",
        header: "Model",
        cell: ({ row }) => (
          <Badge variant="outline">
            {row.original.serialNumber
              ? row.original.serialNumber.split("-")[1] ||
                row.original.serialNumber
              : "—"}
          </Badge>
        ),
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ getValue }) =>
          getValue() ? DEVICE_TYPE_LABELS[getValue() as DeviceType] : "—",
      },
      {
        accessorKey: "location",
        header: "Municipality",
        cell: ({ getValue }) => getValue() || "—",
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => (
          <Badge
            variant={
              (getValue() as string) === "Online" ? "default" : "secondary"
            }
            className={
              (getValue() as string) === "Online" ? "bg-green-500" : ""
            }
          >
            {getValue() as string}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex">
            <ActionsMenu
              id={row.original.id}
              showView={true}
              showEdit={true}
              onView={() => {
                setViewDevice({
                  ...row.original,
                  serialNumber: row.original.serialNumber || "—",
                  location: row.original.location || "—",
                });
                setViewOpen(true);
              }}
              onEdit={() => {
                setEditDevice({
                  ...row.original,
                  serialNumber: row.original.serialNumber || "",
                  location: row.original.location || "",
                });
                setCreateOpen(true);
              }}
              onArchive={() => {
                const d = row.original as DeviceLocal;
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
        ),
      },
    ];
  })();

  return (
    <div className="w-full px-4 py-8 overflow-x-hidden">
      <div>
        {showArchived ? (
          <div className="mb-6">
            <div className="flex items-center justify-start mb-2">
              <div className="shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowArchived(false)}
                  aria-label="Back to active"
                >
                  <ArrowLeft />
                  Back
                </Button>
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                Archived Devices {loading && <InlineSpinner />}
              </h1>
              <p className="text-muted-foreground mt-1">
                View archived devices
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold">
                Active Devices {loading && <InlineSpinner />}
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage and monitor your devices
              </p>
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
            {loading ? (
              <div className="py-4">
                <TableSkeleton rows={itemsPerPage} />
              </div>
            ) : error ? (
              <div className="py-8 text-center text-red-500">{error}</div>
            ) : (
              <div>
                <DataTable
                  data={filteredDevices}
                  columns={deviceColumns}
                  initialPageSize={itemsPerPage}
                  entityName="device"
                  archiveOnly={true}
                  archivedView={showArchived}
                  onExport={(rows) => {
                    // Export selected devices to CSV
                    const headers = [
                      "id",
                      "serialNumber",
                      "name",
                      "model",
                      "type",
                      "location",
                      "status",
                    ];
                    const csvRows = rows.map((r: any) => [
                      r.id,
                      r.serialNumber || "",
                      r.name || "",
                      r.model ||
                        (r.serialNumber
                          ? String(r.serialNumber).split("-")[1] || ""
                          : ""),
                      r.type || "",
                      r.location || "",
                      r.status || "",
                    ]);
                    const csv = [
                      headers.join(","),
                      ...csvRows.map((r: any) =>
                        r
                          .map(
                            (c: any) =>
                              `"${String(c || "").replace(/"/g, '""')}"`,
                          )
                          .join(","),
                      ),
                    ].join("\n");
                    const blob = new Blob([csv], { type: "text/csv" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `devices-export-${Date.now()}.csv`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    URL.revokeObjectURL(url);
                  }}
                  onArchive={async (ids) => {
                    // Bulk archive selected device ids
                    const restoring = showArchived;
                    try {
                      await Promise.all(
                        ids.map((id) =>
                          deviceService.archive(id, restoring ? false : true),
                        ),
                      );
                      toast.success(
                        `${ids.length} device${ids.length > 1 ? "s" : ""} ${restoring ? "restored" : "archived"}`,
                      );
                      if (restoring) {
                        setShowArchived(false);
                      } else {
                        queryClient.invalidateQueries({
                          queryKey: queryKeys.devices.all,
                        });
                      }
                    } catch (err) {
                      const errorMessage =
                        (err as Error).message || "Failed to archive devices";
                      toast.error(errorMessage);
                    }
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>
        <div className="flex items-center justify-between">
          <PaginationWrapper
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            label="devices"
            rowsPerPageOptions={[5, 10, 25, 50, 100]}
            onItemsPerPageChange={(n) => {
              setItemsPerPage(n);
              setCurrentPage(1);
            }}
          />
        </div>
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
        device={
          viewDevice
            ? {
                id: viewDevice.id,
                serialNumber: viewDevice.serialNumber,
                name: viewDevice.name,
                model: viewDevice.serialNumber
                  ? // Parse model/version from serialNumber (MASH-B2-CAL26-######)
                    viewDevice.serialNumber.split("-")[1] ||
                    viewDevice.serialNumber
                  : undefined,
                type: viewDevice.type
                  ? DEVICE_TYPE_LABELS[viewDevice.type]
                  : undefined,
                location: viewDevice.location || undefined,
                status: viewDevice.status,
                assigned: viewDevice.assigned || !!viewDevice.userId,
                description: viewDevice.description || undefined,
                firmware: viewDevice.firmware || undefined,
              }
            : undefined
        }
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
