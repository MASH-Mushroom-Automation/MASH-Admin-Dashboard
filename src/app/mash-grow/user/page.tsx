"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import StatusBadge from "@/components/status-badge"
import { Search } from "lucide-react"
import { ActionsMenu } from "@/components/user-actions-menu"
import ArchiveConfirmation from "@/components/mash-grow/delete-confirmation"
import RegisterModal from "@/components/mash-grow/register-modal"
import { Card } from "@/components/ui/card"
import ViewUserModal from "@/components/mash-grow/view-user-modal"
import { growUserService, deviceService, type GrowUser, type Device as ApiDevice } from "@/services/mashGrowService"

interface User {
  id: string
  chamberNumber: string
  name: string
  address: string
  contactNumber: string
  deviceId?: string
  status: "Active" | "Inactive"
  registrationDate: string
}

interface Device {
  id: string
  deviceId: string
  status: "Online" | "Offline"
  assigned?: boolean
}

export default function RegisterChamber() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Inactive">("All")
  const [ArchiveUserId, setArchiveUserId] = useState<string | null>(null)
  const [registerModalOpen, setRegisterModalOpen] = useState(false)

  // Fetch data from backend
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [usersResponse, devicesResponse] = await Promise.all([
        growUserService.getAll({ archived: false }),
        deviceService.getAll({ limit: 100 })
      ])
      
      // Map API users to local User type
      const mappedUsers: User[] = usersResponse.data.map((u: GrowUser) => ({
        id: u.id,
        chamberNumber: u.chamberNumber,
        name: u.name,
        address: u.address || "",
        contactNumber: u.contactNumber || "",
        deviceId: u.deviceId,
        status: "Active" as const,
        registrationDate: u.createdAt ? new Date(u.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      }))
      
      // Map devices
      const mappedDevices: Device[] = devicesResponse.data.map((d: ApiDevice) => ({
        id: d.id,
        deviceId: d.serialNumber,
        status: d.status,
        assigned: d.assigned
      }))
      
      setUsers(mappedUsers)
      setDevices(mappedDevices)
    } catch (err) {
      const errorMessage = (err as Error).message || 'Failed to load data'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.chamberNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.contactNumber.includes(searchTerm)

    const matchesStatus = statusFilter === "All" || user.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const handleArchive = async (userId: string) => {
    try {
      await growUserService.delete(userId)
      setArchiveUserId(null)
      toast.success("User Archived successfully")
      fetchData() // Refresh data
    } catch (err) {
      const errorMessage = (err as Error).message || 'Failed to archive user'
      toast.error(errorMessage)
    }
  }

  const handlePingDevice = async (deviceId: string) => {
    // simulate ping
    toast(`Pinging ${deviceId}...`)
    await new Promise((r) => setTimeout(r, 800))
    const isOnline = Math.random() > 0.4
    toast.success(isOnline ? "Device is Online" : "Device is Offline")
  }

  // handle onSave from RegisterModal which may include selectedDeviceId
  type RegistrationPayload = {
    id?: string
    chamberName?: string
    name?: string
    address?: string
    contactNumber?: string
    deviceId?: string
    selectedDeviceId?: string
  }

  const handleRegisterSaveExtended = async (data: RegistrationPayload) => {
    try {
      const newUser: Omit<GrowUser, 'id' | 'createdAt' | 'updatedAt'> = {
        chamberNumber: `CH${String(users.length + 1).padStart(3, "0")}`,
        name: data.chamberName || data.name || "",
        address: data.address || "",
        contactNumber: data.contactNumber || "",
        deviceId: data.deviceId || (data.selectedDeviceId ? devices.find((d) => d.id === data.selectedDeviceId)?.deviceId : undefined)
      }
      await growUserService.create(newUser)
      toast.success("User registered successfully")
      fetchData() // Refresh data
    } catch (err) {
      const errorMessage = (err as Error).message || 'Failed to register user'
      toast.error(errorMessage)
    }
  }

  // view modal state
  const [viewOpen, setViewOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const openView = (u: User) => {
    setSelectedUser(u)
    setViewOpen(true)
  }

  return (
    <main className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Top controls: Create Device, Register User and device quick-info (header removed per request) */}
        <div className="flex items-center justify-end mb-4 gap-4">
          <div className="flex items-center gap-3">
            <Button onClick={() => router.push('/mash-grow/devices')} className="gap-2">Create Device</Button>
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => setRegisterModalOpen(true)}
            >
              Register User
            </Button>
          </div>

          {/* Device quick info: show first available device id and ping */}
          <div className="p-3 bg-card border border-border rounded-md">
            <div className="text-xs text-muted-foreground">Chamber Device ID</div>
            <div className="font-mono text-sm">{devices[0]?.deviceId ?? '—'}</div>
            <div className="mt-2 flex items-center gap-2">
              <div className={`text-sm ${devices[0]?.status === 'Online' ? 'text-green-600' : 'text-red-600'}`}>{devices[0]?.status ?? 'Unknown'}</div>
              <Button size="sm" variant="ghost" onClick={() => devices[0] && handlePingDevice(devices[0].deviceId)}>
                Check Ping
              </Button>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search by name, chamber number, or contact..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={(value: "Active" | "Inactive" | "All") => setStatusFilter(value)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Status</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card className="overflow-hidden">
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
                    <TableHead>Chamber Number</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Contact Number</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Registration Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.chamberNumber}</TableCell>
                        <TableCell className="truncate">{user.name}</TableCell>
                        <TableCell className="truncate">{user.address}</TableCell>
                        <TableCell className="whitespace-nowrap">{user.contactNumber}</TableCell>
                        <TableCell>
                          <StatusBadge status={user.status} />
                        </TableCell>
                        <TableCell>{user.registrationDate}</TableCell>
                        <TableCell className="text-center flex items-center justify-center gap-2">
                          <Button size="sm" variant="ghost" onClick={() => openView(user)}>View</Button>
                          <ActionsMenu id={user.id} onArchive={() => setArchiveUserId(user.id)} />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7}>
                        No users found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </Card>
      </div>

      <RegisterModal
        open={registerModalOpen}
        onOpenChange={setRegisterModalOpen}
        onSave={(data) => handleRegisterSaveExtended(data)}
        availableDevices={devices.filter((d) => !d.assigned)}
      />

      <ViewUserModal open={viewOpen} onOpenChange={setViewOpen} user={selectedUser ?? undefined} />

      {/* Archive Confirmation Dialog */}
      {ArchiveUserId && (
        <ArchiveConfirmation onConfirm={() => handleArchive(ArchiveUserId)} onCancel={() => setArchiveUserId(null)} />
      )}
    </main>
  )
}
