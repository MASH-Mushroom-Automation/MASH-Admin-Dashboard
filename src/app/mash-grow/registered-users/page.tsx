"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ConfirmationPopover } from "@/components/confirmation-popover";
import { Archive, ArrowLeft } from "lucide-react";
import { ActionsMenu } from "@/components/user-actions-menu";
import ViewUserModal from "@/components/mash-grow/view-user-modal";
import RegisterModal from "@/components/mash-grow/register-modal";
import AssignDeviceModal from "@/components/mash-grow/assign-device-modal";
import { toast } from "sonner";
import { growUserService, deviceService, type GrowUser as ApiGrowUser, type Device as ApiDevice } from "@/services/mashGrowService";

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

type RegisterData = Partial<RegisterInitialData> & {
  selectedDeviceId?: string;
};

export default function RegisteredUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
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
  useEffect(() => {
    try {
      localStorage.setItem(
        "mash_users_showArchived",
        showArchived ? "true" : "false"
      );
    } catch {}
  }, [showArchived]);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [archivingUser, setArchivingUser] = useState<User | null>(null);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [userToAssign, setUserToAssign] = useState<User | null>(null);

  // Fetch users and devices from backend
  useEffect(() => {
    fetchData();
  }, [showArchived]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch users and devices in parallel
      const [usersResponse, devicesResponse] = await Promise.all([
        growUserService.getAll({ 
          archived: showArchived ? true : undefined,
          // Only show users who have a device in the "Registered Users" view
          // If viewing archives (showArchived=true), we show matching archived users regardless of device status
          // But based on user request "Registered Users page shows all users instead of showing only the users that has a device", 
          // we should apply hasDevice filter when not searching/archived or as a general rule for this page context.
          hasDevice: !showArchived 
        }),
        deviceService.getAll({ limit: 100 })
      ]);
      
      // Map users to local format, populating device info from the nested devices array
      const mappedUsers = usersResponse.data.map((u: any) => ({
        id: u.id,
        // Frontend local type expects 'name', 'chamberNumber', etc.
        name: (u.firstName && u.lastName) ? `${u.firstName} ${u.lastName}` : (u.username || u.email),
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        // Map phone from backend 'phone' field
        contactNumber: u.phone || u.phoneNumber || '',
        phoneNumber: u.phone || u.phoneNumber || '',
        address: u.address || '',
        // Use first device as the primary one for data table display
        deviceId: u.devices?.[0]?.serialNumber,
        // If chamberNumber is not in DB, use device name or generate a fallback
        chamberNumber: u.devices?.[0]?.name || (u.devices?.length ? `Device ${u.devices.length}` : '—'),
        archived: !u.isActive,
        createdAt: u.createdAt
      }));

      setUsers(mappedUsers);
      
      // Map devices to expected format
      const mappedDevices: Device[] = devicesResponse.data.map((d: ApiDevice) => ({
        id: d.id,
        deviceId: d.serialNumber,
        name: d.name,
        model: d.type || 'Generic Device', // Fallback since model/version removed
        location: d.location,
        status: d.status,
        assigned: d.assigned
      }));
      setDevices(mappedDevices);
    } catch (err) {
      const errorMessage = (err as Error).message || 'Failed to load data';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (u: User) => {
    setSelectedUser(u);
    setViewOpen(true);
  };

  const handleAssignSave = async (selectedDeviceId: string | undefined) => {
    if (!userToAssign || !selectedDeviceId) return;

    try {
      // Assign device via API
      await deviceService.assign(selectedDeviceId, userToAssign.id);
      toast.success("Device assigned");
      setUserToAssign(null);
      fetchData(); // Refresh data
    } catch (err) {
      const errorMessage = (err as Error).message || 'Failed to assign device';
      toast.error(errorMessage);
    }
  };

  const handleRegisterSave = async (data: RegisterData) => {
    try {
      if (data?.id) {
        // Update existing user
        const updateData: Partial<User> = {
          name: data.chamberName || (data.firstName || data.lastName ? `${data.firstName ?? ''} ${data.lastName ?? ''}`.trim() : data.name),
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          phoneNumber: data.phoneNumber ?? data.contactNumber,
          address: data.address,
          contactNumber: data.contactNumber || data.phoneNumber,
          deviceId: data.deviceId
        };
        await growUserService.update(data.id, updateData);
        toast.success("User updated");
      } else {
        // Create new user
        const newUser: Omit<User, 'id' | 'createdAt' | 'updatedAt'> = {
          chamberNumber: `CH${String(users.length + 1).padStart(3, "0")}`,
          name: data.chamberName || (data.firstName || data.lastName ? `${data.firstName ?? ''} ${data.lastName ?? ''}`.trim() : data.name) || "",
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          phoneNumber: data.phoneNumber ?? data.contactNumber,
          address: data.address || "",
          contactNumber: data.contactNumber || data.phoneNumber || "",
          deviceId: data.deviceId || (data.selectedDeviceId ? devices.find((d) => d.id === data.selectedDeviceId)?.deviceId : undefined)
        };
        await growUserService.create(newUser);
        toast.success("User registered");
      }
      fetchData(); // Refresh data
    } catch (err) {
      const errorMessage = (err as Error).message || 'Failed to save user';
      toast.error(errorMessage);
    }
  };

  const handleArchive = async (user: User, archive: boolean = true) => {
    try {
      await growUserService.archive(user.id, archive);
      toast.success(archive ? "User archived" : "User restored");
      fetchData(); // Refresh data
    } catch (err) {
      const errorMessage = (err as Error).message || 'Failed to archive user';
      toast.error(errorMessage);
    }
  };

  return (
    <div className="w-full px-4 py-8 overflow-x-hidden">
      {showArchived ? (
        <div className="flex flex-col gap-4 mb-4">
          <div className="flex items-center justify-start">
            <div className="shrink-0">
              <Button variant="ghost" size="sm" onClick={() => setShowArchived(false)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-bold">Archive Users</h1>
            <p className="text-muted-foreground mt-1">Archived users</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold">Registered Users</h1>
            <p className="text-muted-foreground mt-1">Users registered with devices</p>
          </div>

          <div className="flex items-center gap-3">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => setRegisterOpen(true)}>Register User</Button>
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
            <div className="py-8 text-center text-muted-foreground">
              Loading users...
            </div>
          ) : error ? (
            <div className="py-8 text-center text-red-500">
              {error}
            </div>
          ) : (
            <Table className="w-full">
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Chamber</TableHead>
                  <TableHead>Device ID</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users
                  .filter((u) =>
                    showArchived ? Boolean(u.archived) : !u.archived
                  )
                  .map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>{u.name}</TableCell>
                      <TableCell>{u.chamberNumber}</TableCell>
                      <TableCell className="font-mono">{u.deviceId}</TableCell>
                      <TableCell>{u.contactNumber}</TableCell>
                      <TableCell className="flex">
                        <ActionsMenu
                          id={u.id}
                          onView={() => handleView(u)}
                          onEdit={() => {
                            const selectedDevice = devices.find(
                              (d) => d.deviceId === u.deviceId
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
                            if (!showArchived) {
                              setArchivingUser(u);
                              setShowArchiveConfirm(true);
                            } else {
                              handleArchive(u, false);
                            }
                          }}
                          ArchiveLabel={showArchived ? "Restore" : "Archive"}
                        ></ActionsMenu>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </div>
      </Card>
      <ViewUserModal
        open={viewOpen}
        onOpenChange={setViewOpen}
        user={selectedUser ?? undefined}
      />

      {/* pass a fallback mock devices list when none exist in localStorage */}
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
        availableDevices={devices.filter((d) => !d.assigned)}
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
            handleArchive(archivingUser, true);
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

