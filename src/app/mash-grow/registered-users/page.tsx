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

// Types for users/devices used in this page
type User = {
  id: string
  chamberNumber: string
  name: string
  address?: string
  contactNumber?: string
  deviceId?: string
  archived?: boolean
}

type Device = {
  id: string
  deviceId: string
  model?: string
  location?: string
  status?: string
  assigned?: boolean
}

type RegisterInitialData = {
  id?: string
  chamberName?: string
  name?: string
  address?: string
  contactNumber?: string
  deviceId?: string
  selectedDeviceId?: string
}

type RegisterData = Partial<RegisterInitialData> & {
  selectedDeviceId?: string
}

// Default mock users/devices moved to module scope so hooks don't need to include them as deps
const DEFAULT_USERS: User[] = [
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

const MOCK_DEVICES: Device[] = [
  { id: "mock-1", deviceId: "MASH-AX1-CALOOCAN-AC2523", model: "AX1", location: "Caloocan", status: "Disconnected", assigned: false },
  { id: "mock-2", deviceId: "MASH-BX2-MANILA-AC2524", model: "BX2", location: "Manila", status: "Connected", assigned: false },
  { id: "mock-3", deviceId: "MASH-CX3-QUEZONCITY-AC2525", model: "CX3", location: "Quezon City", status: "Disconnected", assigned: false },
]

export default function RegisteredUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [editUser, setEditUser] = useState<RegisterInitialData | null>(null)
  const [showArchived, setShowArchived] = useState(() => {
    try {
      const raw = localStorage.getItem("mash_users_showArchived")
      return raw === "true"
    } catch {
      return false
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem("mash_users_showArchived", showArchived ? "true" : "false")
    } catch {}
  }, [showArchived])
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false)
  const [archivingUser, setArchivingUser] = useState<User | null>(null)
  const [viewOpen, setViewOpen] = useState(false)
  const [registerOpen, setRegisterOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [userToAssign, setUserToAssign] = useState<User | null>(null)


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
        } catch {
          setUsers(DEFAULT_USERS)
        }
      }
    } catch {
      setUsers(DEFAULT_USERS)
    }
  }, [])

  useEffect(() => {
    try {
      const rawDevices = localStorage.getItem("mash_devices")
      setDevices(rawDevices ? JSON.parse(rawDevices) : [])
    } catch {
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
        } catch {
          shouldSeed = true
        }
      }

      // only seed when there's nothing persisted yet and our in-memory list is empty
      if (shouldSeed && devices.length === 0) {
        setDevices(MOCK_DEVICES)
        try {
          localStorage.setItem("mash_devices", JSON.stringify(MOCK_DEVICES))
        } catch {
          // ignore
        }
      }
    } catch {
      // ignore
    }
  }, [devices])

  // persist users/devices
  useEffect(() => {
    try {
      localStorage.setItem("mash_users", JSON.stringify(users))
    } catch {}
  }, [users])

  useEffect(() => {
    try {
      localStorage.setItem("mash_devices", JSON.stringify(devices))
    } catch {}
  }, [devices])

  const handleView = (u: User) => {
    setSelectedUser(u)
    setViewOpen(true)
  }

  const openAssign = (u: User) => {
    setUserToAssign(u)
    setAssignOpen(true)
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
      const next = prev.map((d) => ({ ...d }))
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

  const handleRegisterSave = (data: RegisterData) => {
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
        deviceId: data.deviceId || (data.selectedDeviceId ? (devices.find((d) => d.id === data.selectedDeviceId)?.deviceId ?? MOCK_DEVICES.find((d: Device) => d.id === data.selectedDeviceId)?.deviceId) : undefined),
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
      <div className="w-full px-4 py-8 overflow-x-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
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
          availableDevices={(devices.filter((d) => !d.assigned).length > 0 ? devices.filter((d) => !d.assigned) : MOCK_DEVICES)}
          initialData={editUser ?? undefined}
        />
        <AssignDeviceModal
          open={assignOpen}
          onOpenChange={setAssignOpen}
          availableDevices={(devices.filter((d) => !d.assigned).length > 0 ? devices.filter((d) => !d.assigned) : MOCK_DEVICES)}
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
