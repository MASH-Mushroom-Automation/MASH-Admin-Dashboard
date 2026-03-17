"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import PaginationWrapper from "@/components/pagination";
import { ConfirmationPopover } from "@/components/confirmation-popover";
import { Archive, ArrowLeft } from "lucide-react";
import { ActionsMenu } from "@/components/user-actions-menu";
import ViewUserModal from "@/components/mash-grow/view-user-modal";
import RegisterModal from "@/components/mash-grow/register-modal";
import AssignDeviceModal from "@/components/mash-grow/assign-device-modal";
import { toast } from "sonner";
import TableSkeleton from "@/components/ui/table-skeleton";
import InlineSpinner from "@/components/ui/inline-spinner";
import {
  growUserService,
  deviceService,
  type GrowUser as ApiGrowUser,
  type Device as ApiDevice,
} from "@/services/mashGrowService";
import { useGrowUsers } from "@/hooks/useGrowUsers";
import { useDevices } from "@/hooks/useDevices";
import { useQueryClient } from "@tanstack/react-query";

// Map API types to local types for compatibility with existing components
type User = ApiGrowUser;
type Device = {
  id: string;
  deviceId: string;
  name?: string;
  model?: string;
  location?: string;
  status?: string;
  assigned?: boolean;
};

type RegisterInitialData = {
  id?: string;
  chamberName?: string;
  name?: string;
  address?: string;
  contactNumber?: string;
  deviceId?: string;
  selectedDeviceId?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
};

type RegisterData = any;

export default function RegisteredUsersPage() {
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editUser, setEditUser] = useState<RegisterInitialData | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(() => {
    try {
      const raw = localStorage.getItem("mash_users_showArchived");
      return raw === "true";
    } catch {
      return false;
    }
  });

  const {
    data: users = [],
    isLoading: usersLoading,
    error: usersError,
  } = useGrowUsers({
    archived: showArchived ? true : undefined,
    hasDevice: !showArchived,
  });

  const { data: allUsersRaw = [], isLoading: allUsersLoading } = useGrowUsers();
  const allUsers = allUsersRaw.filter((u: any) => u.role === "GROWER");

  const { data: devicesRaw = [], isLoading: devicesLoading } = useDevices();
  const devices = devicesRaw
    .filter((d: any) => {
      const isActive = d.isActive;
      if (isActive === false || (isActive as any) === "false") return false;
      if (d.archived === true || (d.archived as any) === "true") return false;
      return true;
    })
    .map((d: any) => ({
      id: d.id,
      deviceId: d.serialNumber || d.deviceId,
      name: d.name,
      model: d.type || "Generic Device",
      location: d.location,
      status: d.status,
      assigned: d.assigned,
    }));

  const loading = usersLoading || devicesLoading || allUsersLoading;
  const error = usersError ? (usersError as Error).message : null;

  useEffect(() => {
    try {
      localStorage.setItem(
        "mash_users_showArchived",
        showArchived ? "true" : "false",
      );
    } catch {}
  }, [showArchived]);

  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [archivingUser, setArchivingUser] = useState<User | null>(null);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [userToAssign, setUserToAssign] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  useEffect(() => {
    setCurrentPage(1);
  }, [showArchived]);

  const handleView = (u: User) => {
    setSelectedUser(u);
    setViewOpen(true);
  };

  const handleAssignSave = async (selectedDeviceId: string | undefined) => {
    if (!userToAssign || !selectedDeviceId) return;
    try {
      await deviceService.assign(selectedDeviceId, userToAssign.id);
      toast.success("Device assigned");
      setUserToAssign(null);
      queryClient.invalidateQueries({ queryKey: ["grow-users"] });
    } catch (err) {
      const errorMessage = (err as Error).message || "Failed to assign device";
      toast.error(errorMessage);
    }
  };

  const handleRegisterSave = async (data: RegisterData) => {
    try {
      const uId = data.selectedUserId || data.id;
      const dId = data.selectedDeviceId;

      if (!uId) {
        toast.error("No user selected");
        return;
      }

      if (dId) {
        await deviceService.assign(dId, uId);
        toast.success("Device assigned successfully");
      } else {
        toast.error("No device selected for assignment");
        return;
      }

      queryClient.invalidateQueries({ queryKey: ["grow-users"] });
    } catch (err) {
      const errorMessage = (err as Error).message || "Failed to assign device";
      toast.error(errorMessage);
    }
  };

  const handleArchive = async (user: User, archive: boolean = true) => {
    try {
      await growUserService.archive(user.id, archive);
      toast.success(archive ? "User archived" : "User restored");
      queryClient.invalidateQueries({ queryKey: ["grow-users"] });
    } catch (err) {
      const errorMessage = (err as Error).message || "Failed to archive user";
      toast.error(errorMessage);
    }
  };

  // Columns for DataTable
  const columns = ((): ColumnDef<any, any>[] => {
    const computeInitials = (value?: string) => {
      const v = (value || "").trim();
      if (!v) return "U";
      const parts = v.split(/\s+/).filter(Boolean);
      if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
      return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
    };

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
            />
          );
        },
        cell: ({ row }) => (
          <input
            type="checkbox"
            className="h-4 w-4 rounded-md border-2 border-slate-300 bg-white accent-primary"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
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
        accessorKey: "chamberNumber",
        header: "Chamber",
        cell: ({ getValue }) => getValue() || "—",
      },
      {
        accessorKey: "deviceId",
        header: "Device ID",
        cell: ({ getValue }) => (
          <span className="font-mono">{getValue() || "—"}</span>
        ),
      },
      {
        accessorKey: "contactNumber",
        header: "Contact",
        cell: ({ getValue }) => getValue() || "—",
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <ActionsMenu
            id={row.original.id}
            onView={() => handleView(row.original)}
            onEdit={() => {
              const u = row.original as any;
              const selectedDevice = devices.find(
                (d) => d.deviceId === u.deviceId,
              );
              setEditUser({
                id: u.id,
                chamberName: u.name,
                contactNumber: u.contactNumber,
                address: u.address,
                selectedDeviceId: selectedDevice?.id,
                email: u.email,
                firstName: u.firstName,
                lastName: u.lastName,
                phoneNumber: u.phoneNumber,
              });
              setRegisterOpen(true);
            }}
            onArchive={() => {
              const u = row.original as any;
              if (!showArchived) {
                setArchivingUser(u);
                setShowArchiveConfirm(true);
              } else {
                handleArchive(u, false);
              }
            }}
            ArchiveLabel={showArchived ? "Restore" : "Archive"}
          />
        ),
      },
    ];
  })();

  return (
    <div className="w-full px-4 py-8 overflow-x-hidden">
      {showArchived ? (
        <div className="flex flex-col gap-4 mb-4">
          <div className="flex items-center justify-start">
            <div className="shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowArchived(false)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-bold">
              Archive Users{loading && <InlineSpinner />}
            </h1>
            <p className="text-muted-foreground mt-1">
              View all Archived users
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold">
              Registered Users{loading && <InlineSpinner />}
            </h1>
            <p className="text-muted-foreground mt-1">
              Users registered with devices
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => setRegisterOpen(true)}
            >
              Register User
            </Button>
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
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-4">
              <TableSkeleton rows={10} />
            </div>
          ) : error ? (
            <div className="py-8 text-center text-red-500">{error}</div>
          ) : (
            (() => {
              const filteredUsers = users.filter((u) =>
                showArchived ? Boolean(u.archived) : !u.archived,
              );
              const startIndex = (currentPage - 1) * itemsPerPage;
              const endIndex = startIndex + itemsPerPage;
              const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

              return (
                <>
                  <DataTable
                    data={paginatedUsers}
                    initialPageSize={itemsPerPage}
                    entityName="user"
                    simpleActions={true}
                    archiveOnly={false}
                    archivedView={showArchived}
                    columns={columns}
                    onExport={(rows) => {
                      const headers = [
                        "id",
                        "name",
                        "chamber",
                        "deviceId",
                        "contact",
                        "email",
                      ];
                      const csvRows = rows.map((r: any) => [
                        r.id,
                        r.name,
                        r.chamberNumber,
                        r.deviceId,
                        r.contactNumber,
                        r.email,
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
                      a.download = `registered-users-${Date.now()}.csv`;
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                      URL.revokeObjectURL(url);
                    }}
                    onArchive={async (ids) => {
                      try {
                        await Promise.all(
                          ids.map((id) =>
                            growUserService.archive(
                              id,
                              showArchived ? false : true,
                            ),
                          ),
                        );
                        toast.success(
                          `${ids.length} user${ids.length > 1 ? "s" : ""} ${showArchived ? "restored" : "archived"}`,
                        );
                        if (showArchived) setShowArchived(false);
                        queryClient.invalidateQueries({
                          queryKey: ["grow-users"],
                        });
                      } catch (err) {
                        toast.error(
                          "Failed to archive/unarchive selected users",
                        );
                      }
                    }}
                  />
                  <PaginationWrapper
                    totalItems={filteredUsers.length}
                    itemsPerPage={itemsPerPage}
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                    label={showArchived ? "archived users" : "users"}
                    rowsPerPageOptions={[5, 10, 25, 50, 100]}
                    onItemsPerPageChange={(n) => {
                      setItemsPerPage(n);
                      setCurrentPage(1);
                    }}
                  />
                </>
              );
            })()
          )}
        </div>
      </Card>

      <ViewUserModal
        open={viewOpen}
        onOpenChange={setViewOpen}
        user={selectedUser ?? undefined}
      />

      <RegisterModal
        open={registerOpen}
        onOpenChange={(open) => {
          setRegisterOpen(open);
          if (!open) setEditUser(null);
        }}
        onSave={(data) => {
          setRegisterOpen(false);
          handleRegisterSave(data);
        }}
        availableDevices={devices.filter(
          (d) =>
            !d.assigned || (editUser && d.id === editUser.selectedDeviceId),
        )}
        availableUsers={allUsers}
        initialData={editUser ?? undefined}
      />

      <AssignDeviceModal
        open={assignOpen}
        onOpenChange={setAssignOpen}
        availableDevices={devices.filter((d) => !d.assigned)}
        onAssign={(id) => handleAssignSave(id)}
      />

      {showArchiveConfirm && archivingUser && (
        <ConfirmationPopover
          action="Archive"
          entity="User"
          onConfirm={() => {
            handleArchive(archivingUser, showArchived ? false : true);
            setShowArchiveConfirm(false);
            setArchivingUser(null);
          }}
          onCancel={() => {
            setShowArchiveConfirm(false);
            setArchivingUser(null);
          }}
        />
      )}
    </div>
  );
}
