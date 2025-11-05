"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ConfirmationPopover } from "@/components/confirmation-popover"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { MoreVertical, Archive, ArrowLeft } from "lucide-react"
import ViewUserModal from "@/components/mash-grow/view-user-modal"
import RegisterModal from "@/components/mash-grow/register-modal"
import AssignDeviceModal from "@/components/mash-grow/assign-device-modal"
import { toast } from "sonner"

export default function RegisteredUsersPage() {
  const DEFAULT_USERS = [
    {
      id: "1",
      chamberNumber: "CH001",
      name: "Ana Santos",
      address: "Blk 2 Lot 5, Caloocan",
      contactNumber: "+639171234567",
      deviceId: "MASH-A1-CAL25-AC2523",
    },
    {
      id: "2",
      chamberNumber: "CH002",
      name: "Rico Dela Cruz",
      address: "123 Rizal St, Manila",
      contactNumber: "+639172345678",
      deviceId: "MASH-B2-CAL25-AC2524",
    },
    {
      id: "3",
      chamberNumber: "CH003",
      name: "Liza Mercado",
      address: "Unit 4, Quezon City",
      contactNumber: "+639173456789",
      deviceId: undefined,
    },
    // archived mock user for archive view
    {
      id: "4",
      chamberNumber: "CH004",
      name: "Old Account",
      address: "Old St, Makati",
      contactNumber: "+639174567890",
      deviceId: "MASH-F6-ARCHIVED-AC2528",
      archived: true,
    },
  ]

  const [users, setUsers] = useState<any[]>([])
  const [devices, setDevices] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState<any | null>(null)
  const [editUser, setEditUser] = useState<any | null>(null)
  const [showArchived, setShowArchived] = useState(() => {
    try {
      const raw = localStorage.getItem("mash_users_showArchived")
      return raw === "true"
    } catch (e) {
      return false
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem("mash_users_showArchived", showArchived ? "true" : "false")
    } catch (e) {}
  }, [showArchived])
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false)
  const [archivingUser, setArchivingUser] = useState<any | null>(null)
  const [viewOpen, setViewOpen] = useState(false)
  const [registerOpen, setRegisterOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [userToAssign, setUserToAssign] = useState<any | null>(null)

  // lightweight mock devices to show when no real devices exist in localStorage
  const mockDevices = [
    { id: "mock-1", deviceId: "MASH-AX1-CALOOCAN-AC2523", model: "AX1", location: "Caloocan", status: "Disconnected", assigned: false },
    { id: "mock-2", deviceId: "MASH-BX2-MANILA-AC2524", model: "BX2", location: "Manila", status: "Connected", assigned: false },
    { id: "mock-3", deviceId: "MASH-CX3-QUEZONCITY-AC2525", model: "CX3", location: "Quezon City", status: "Disconnected", assigned: false },
  ]

  useEffect(() => {
    try {
      const raw = localStorage.getItem("mash_users")
      if (!raw || raw === "null") {
        setUsers(DEFAULT_USERS)
      } else {
        try {
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed) && parsed.length > 0) setUsers(parsed)
          else setUsers(DEFAULT_USERS)
        } catch (e) {
          setUsers(DEFAULT_USERS)
        }
      }
    } catch (e) {
      setUsers(DEFAULT_USERS)
    }
  }, [])

  useEffect(() => {
    try {
      const rawDevices = localStorage.getItem("mash_devices")
      setDevices(rawDevices ? JSON.parse(rawDevices) : [])
    } catch (e) {
      setDevices([])
    }
  }, [])

  // If there are no persisted devices, seed with mockDevices so register/save is functional
  useEffect(() => {
    try {
      const raw = localStorage.getItem("mash_devices")
      let shouldSeed = false
      if (!raw || raw === "null") shouldSeed = true
      else {
        try {
          const parsed = JSON.parse(raw)
          if (!Array.isArray(parsed) || parsed.length === 0) shouldSeed = true
        } catch (e) {
          shouldSeed = true
        }
      }

      // only seed when there's nothing persisted yet and our in-memory list is empty
      if (shouldSeed && devices.length === 0) {
        setDevices(mockDevices)
        try {
          localStorage.setItem("mash_devices", JSON.stringify(mockDevices))
        } catch (e) {
          // ignore
        }
      }
    } catch (e) {
      // ignore
    }
  }, [devices])

  // persist users/devices
  useEffect(() => {
    try {
      localStorage.setItem("mash_users", JSON.stringify(users))
    } catch (e) {}
  }, [users])

  useEffect(() => {
    try {
      localStorage.setItem("mash_devices", JSON.stringify(devices))
    } catch (e) {}
  }, [devices])

  const handleView = (u: any) => {
    setSelectedUser(u)
    setViewOpen(true)
  }

  const openAssign = (u: any) => {
    setUserToAssign(u)
    setAssignOpen(true)
  }

  const handleDeleteUser = (u: any) => {
    if (confirm(`Delete user ${u.name}? This will remove their registration.`)) {
      setUsers((prev) => prev.filter((x) => x.id !== u.id))
      toast.success("User deleted")
    }
  }

  const handleAssignSave = (selectedDeviceId: string | undefined) => {
    if (!userToAssign) return
    if (!selectedDeviceId) return

    // If the selected device is a mock (not present in devices state), we can't persist assignment.
    const isReal = devices.find((d) => d.id === selectedDeviceId)
    if (!isReal) {
      toast.error("Selected device is a mock device and cannot be assigned.")
      setUserToAssign(null)
      return
    }

    // unassign user's previous device if present
    setDevices((prev) => {
      let next = prev.map((d) => ({ ...d }))
      const prevDevice = next.find((d) => d.deviceId === userToAssign.deviceId)
      if (prevDevice) prevDevice.assigned = false
      const newDevice = next.find((d) => d.id === selectedDeviceId)
      if (newDevice) newDevice.assigned = true
      return next
    })

    setUsers((prev) => prev.map((u) => (u.id === userToAssign.id ? { ...u, deviceId: devices.find((d) => d.id === selectedDeviceId)?.deviceId } : u)))
    setUserToAssign(null)
    toast.success("Device assigned")
  }

  const handleRegisterSave = (data: any) => {
    // If editing (id present), update existing entry
    if (data?.id) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === String(data.id)
            ? {
                ...u,
                name: data.chamberName || data.name || u.name,
                address: data.address || u.address,
                contactNumber: data.contactNumber || u.contactNumber,
                deviceId: data.deviceId || u.deviceId,
              }
            : u
        )
      )
    } else {
      // build new user record
      const newUser = {
        id: String(users.length + 1),
        chamberNumber: `CH${String(users.length + 1).padStart(3, "0")}`,
        name: data.chamberName || data.name || "",
        address: data.address || "",
        contactNumber: data.contactNumber || "",
        // support selected device coming from either real devices or mockDevices
        deviceId: data.deviceId || (data.selectedDeviceId ? (devices.find((d) => d.id === data.selectedDeviceId)?.deviceId ?? mockDevices.find((d) => d.id === data.selectedDeviceId)?.deviceId) : undefined),
      }

      setUsers((prev) => [newUser, ...prev])

      // mark device assigned if selected
      if (data.selectedDeviceId) {
        // only mark real devices as assigned
        setDevices((prev) => prev.map((d) => (d.id === data.selectedDeviceId ? { ...d, assigned: true } : d)))
      }

      toast.success("User registered")
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold">{showArchived ? "Archive Users" : "Registered Users"}</h1>
            <p className="text-muted-foreground mt-1">{showArchived ? "Archived users" : "Users registered with devices"}</p>
          </div>

          <div className="flex items-center gap-3">
            {!showArchived ? (
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => setRegisterOpen(true)}>Register User</Button>
            ) : null}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowArchived((s) => !s)}
              aria-label={showArchived ? "Back to active" : "View archived"}
            >
              {showArchived ? <ArrowLeft className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <tr>
                  <TableHead>Name</TableHead>
                  <TableHead>Chamber</TableHead>
                  <TableHead>Device ID</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Actions</TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {users.filter((u) => (showArchived ? Boolean(u.archived) : !u.archived)).map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>{u.name}</TableCell>
                    <TableCell>{u.chamberNumber}</TableCell>
                    <TableCell className="font-mono">{u.deviceId}</TableCell>
                    <TableCell>{u.contactNumber}</TableCell>
                    <TableCell className="flex">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" aria-label="User actions">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          {!showArchived ? (
                            <>
                              <DropdownMenuItem onSelect={() => handleView(u)}>View</DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => openAssign(u)}>Assign Device</DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => {
                                // Map user shape to RegisterModal's expected initialData
                                const selectedDevice = devices.find((d) => d.deviceId === u.deviceId)
                                setEditUser({
                                  id: u.id,
                                  chamberName: u.name,
                                  contactNumber: u.contactNumber,
                                  address: u.address,
                                  selectedDeviceId: selectedDevice?.id,
                                })
                                setRegisterOpen(true)
                              }}>Edit</DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => {
                                setArchivingUser(u)
                                setShowArchiveConfirm(true)
                              }}>Archive</DropdownMenuItem>
                            </>
                          ) : (
                            <>
                              <DropdownMenuItem onSelect={() => handleView(u)}>View</DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => {
                                // restore user
                                setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, archived: false } : x)))
                                // if user had a deviceId, attempt to reassign the device if it exists and is not assigned
                                if (u.deviceId) {
                                  setDevices((prev) => prev.map((d) => (d.deviceId === u.deviceId ? { ...d, assigned: true } : d)))
                                }
                                toast.success("User restored")
                              }}>Restore</DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

        <ViewUserModal open={viewOpen} onOpenChange={setViewOpen} user={selectedUser ?? undefined} />

        {/* pass a fallback mock devices list when none exist in localStorage */}
        <RegisterModal
          open={registerOpen}
          onOpenChange={(open) => {
            setRegisterOpen(open)
            if (!open) setEditUser(null)
          }}
          onSave={(data) => {
            setRegisterOpen(false)
            handleRegisterSave(data)
          }}
          availableDevices={(devices.filter((d) => !d.assigned).length > 0 ? devices.filter((d) => !d.assigned) : mockDevices)}
          initialData={editUser ?? undefined}
        />
        <AssignDeviceModal
          open={assignOpen}
          onOpenChange={setAssignOpen}
          availableDevices={(devices.filter((d) => !d.assigned).length > 0 ? devices.filter((d) => !d.assigned) : mockDevices)}
          onAssign={(id) => handleAssignSave(id)}
        />
      {showArchiveConfirm && archivingUser && (
        <ConfirmationPopover
          action="Archive"
          entity="User"
          onConfirm={() => {
            // unassign device if applicable
            if (archivingUser.deviceId) {
              setDevices((prev) => prev.map((d) => (d.deviceId === archivingUser.deviceId ? { ...d, assigned: false } : d)))
            }
            setUsers((prev) => prev.map((x) => (x.id === archivingUser.id ? { ...x, archived: true } : x)))
            setShowArchiveConfirm(false)
            setArchivingUser(null)
            toast.success("User archived")
          }}
          onCancel={() => {
            setShowArchiveConfirm(false)
            setArchivingUser(null)
          }}
        />
      )}
    </div>
  )
}
