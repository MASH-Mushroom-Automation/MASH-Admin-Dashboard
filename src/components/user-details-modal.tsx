"use client"

// "use client" component - no default React import needed
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import UserAvatar from "@/components/ecommerce/user-avatar"
import StatusBadge from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface UserDetailsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user:
    | {
        id: string
        name: string
        username: string
        email: string
        phone: string
        role: string
        status: string
        avatar: string
        // customer-specific
        preferredPaymentMethod?: string
        addressBook?: string[]
        // seller-specific
        businessName?: string
        businessAddress?: string
        businessType?: string
        taxId?: string
        businessDocuments?: string[]
      }
    | null
}

export default function UserDetailsModal({ open, onOpenChange, user, showActions, onAccept, onReject }: UserDetailsProps & { showActions?: boolean; onAccept?: (id: string) => void; onReject?: (id: string) => void }) {
  const role = user?.role ?? ""

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent className="w-full max-w-7xl">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <div className="shrink-0">
              <UserAvatar initials={user?.avatar ?? "?"} />
            </div>
            <div>
              <DialogTitle className="text-lg">{user?.name ?? "—"}</DialogTitle>
              <DialogDescription className="mt-0">{role === "Seller" ? "Seller profile" : "Customer profile"}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Main content: render different sections depending on role */}
        <div className="mt-4 space-y-6">
          {role === "Customer" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground">Full Name</label>
                <Input value={user?.name ?? ""} readOnly aria-readonly className="mt-1" />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground">Username</label>
                <Input value={user?.username ?? ""} readOnly aria-readonly className="mt-1" />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground">Email</label>
                <Input value={user?.email ?? ""} readOnly aria-readonly className="mt-1" />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground">Phone</label>
                <Input value={user?.phone ?? ""} readOnly aria-readonly className="mt-1" />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground">Role</label>
                <Input value={user?.role ?? ""} readOnly aria-readonly className="mt-1" />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground">Preferred Payment Method</label>
                <Input value={user?.preferredPaymentMethod ?? "-"} readOnly aria-readonly className="mt-1" />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground">Address Book</label>
                <div className="mt-1 space-y-2">
                  {(user?.addressBook && user.addressBook.length > 0) ? (
                    <ul className="list-disc list-inside text-sm">
                      {user.addressBook.map((addr, i) => (
                        <li key={i} className="text-sm">{addr}</li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-sm text-muted-foreground">No addresses</div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground">Status</label>
                <div className="mt-1">
                  {/* StatusBadge used when possible; fallback to plain text */}
                  {user?.status ? <StatusBadge status={user.status} /> : <span className="text-sm">-</span>}
                </div>
              </div>
            </div>
          )}

          {role === "Seller" && (
  <div className="grid grid-cols-2 gap-4">
    {/* Left Column */}
    <div>
      <label className="block text-sm font-medium text-muted-foreground">Seller Name</label>
      <Input value={user?.name ?? ""} disabled readOnly aria-readonly className="mt-1" />
    </div>

    <div>
      <label className="block text-sm font-medium text-muted-foreground">Business Name</label>
      <Input value={user?.businessName ?? ""} disabled readOnly aria-readonly className="mt-1" />
    </div>

    <div>
      <label className="block text-sm font-medium text-muted-foreground">Username</label>
      <Input value={user?.username ?? ""} disabled readOnly aria-readonly className="mt-1" />
    </div>

    <div>
      <label className="block text-sm font-medium text-muted-foreground">Role</label>
      <Input value={user?.role ?? ""} disabled readOnly aria-readonly className="mt-1" />
    </div>

    <div>
      <label className="block text-sm font-medium text-muted-foreground">Email</label>
      <Input value={user?.email ?? ""} disabled readOnly aria-readonly className="mt-1" />
    </div>

    <div>
      <label className="block text-sm font-medium text-muted-foreground">Phone</label>
      <Input value={user?.phone ?? ""} disabled readOnly aria-readonly className="mt-1" />
    </div>

    <div>
      <label className="block text-sm font-medium text-muted-foreground">Business Type</label>
      <Input value={user?.businessType ?? ""} disabled readOnly aria-readonly className="mt-1" />
    </div>

    <div>
      <label className="block text-sm font-medium text-muted-foreground">Status</label>
      <div className="mt-2">
        {user?.status ? <StatusBadge status={user.status} /> : <span className="text-sm">-</span>}
      </div>
    </div>

    {/* Full-width Section */}
    <div className="col-span-2">
      <h4 className="text-sm font-medium mt-4 mb-2">Business Details</h4>

      <div className="grid grid-cols-2 gap-4">
        <div>
        <label className="block text-sm font-medium text-muted-foreground">Business Address</label>
        <Input value={user?.businessAddress ?? ""} disabled readOnly aria-readonly className="mt-1" />
        </div>
        <div>
        <label className="block text-sm font-medium text-muted-foreground">Tax ID / Registration Number</label>
        <Input value={user?.taxId ?? ""} disabled readOnly aria-readonly className="mt-1" />
        </div>
      </div>

      <div className="mt-2">
        <label className="block text-sm font-medium text-muted-foreground">Business Documents</label>
        <div className="mt-1">
          {user?.businessDocuments && user.businessDocuments.length > 0 ? (
            <ul className="list-disc list-inside text-sm">
              {user.businessDocuments.map((doc, i) => (
                <li key={i} className="text-sm">{doc}</li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-muted-foreground">No uploaded documents</div>
          )}
        </div>
      </div>
    </div>
  </div>
)}
        </div>  

        <DialogFooter>
          <div className="flex gap-2">
            {/* <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Close
            </Button> */}
            {/* Only render Accept/Reject when the caller explicitly requests actions (e.g. Seller pending page).
                This prevents showing action buttons when the modal is used on the general User page. */}
            {showActions && role === "Seller" ? (
              <>
                <Button variant="destructive" onClick={() => {
                  if (user?.id && onReject) onReject(user.id)
                  onOpenChange(false)
                }}>
                  Reject
                </Button>
                <Button onClick={() => {
                  if (user?.id && onAccept) onAccept(user.id)
                  onOpenChange(false)
                }}>Accept</Button>
              </>
            ) : (
              <Button onClick={() => onOpenChange(false)}>OK</Button>
            )}
          </div>
        </DialogFooter>

        <DialogClose />
      </DialogContent>
    </Dialog>
  )
}
