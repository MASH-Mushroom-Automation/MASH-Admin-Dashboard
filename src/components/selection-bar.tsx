import React, { useState } from "react";
import { Archive, MoreHorizontal, UserCog, Activity, CheckCircle, XCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ConfirmationPopover } from "@/components/confirmation-popover";
import RejectReasonModal from "@/components/ecommerce/reject-reason-modal";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Props {
  selectedCount: number;
  selectedIds?: string[];
  selectedRows?: any[];
  onClear?: () => void;
  onArchive?: (ids: string[]) => void;
  onBulkChangeRole?: (ids: string[], newRole: string) => void;
  onBulkChangeStatus?: (ids: string[], newStatus: string) => void;
  onBulkAccept?: (ids: string[]) => void;
  onBulkReject?: (ids: string[], reason?: string) => void;
  mode?: 'users' | 'sellers';
}

export const SelectionBar: React.FC<Props> = ({
  selectedCount,
  selectedIds = [],
  selectedRows = [],
  onClear,
  onArchive,
  onBulkChangeRole,
  onBulkChangeStatus,
  onBulkAccept,
  onBulkReject,
  mode = 'users'
}) => {
  const [pendingBulkAction, setPendingBulkAction] = useState<{
    type: 'accept' | 'reject' | 'archive' | 'changeRole' | 'changeStatus';
    data?: any;
  } | null>(null);

  if (selectedCount === 0) return null;

  // Check for mixed roles
  const roles = selectedRows.map(row => row.role?.toUpperCase()).filter(Boolean);
  const uniqueRoles = Array.from(new Set(roles));
  const hasMixedRoles = uniqueRoles.length > 1;

  return (
    <TooltipProvider>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-green-50 p-3 border-b border-green-100 gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="text-sm font-semibold flex-shrink-0">{selectedCount} selected</div>

          {hasMixedRoles && (
            <div className="min-w-0">
              <div
                className="text-xs text-muted-foreground truncate max-w-[60vw] sm:max-w-[40ch]"
                title="Some actions are disabled because selected users have different roles."
              >
                Some actions are disabled because selected users have different roles.
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 mt-2 sm:mt-0 sm:ml-4">
          <button
            className="text-sm text-muted-foreground underline truncate min-w-0"
            onClick={onClear}
            title="Clear selection"
          >
            Clear
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center">
                <MoreHorizontal className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Bulk Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              {mode === 'sellers' ? (
                <>
                  <DropdownMenuItem onClick={() => setPendingBulkAction({ type: 'accept' })}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Accept Selected
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPendingBulkAction({ type: 'reject' })}>
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject Selected
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive" onClick={() => setPendingBulkAction({ type: 'archive' })}>
                    <Archive className="h-4 w-4 mr-2 text-destructive" />
                    Archive Selected
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem className="text-destructive" onClick={() => setPendingBulkAction({ type: 'archive' })}>
                    <Archive className="h-4 w-4 mr-2 text-destructive" />
                    Archive Selected
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Change Role</DropdownMenuLabel>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <DropdownMenuItem
                          onClick={() => setPendingBulkAction({ type: 'changeRole', data: 'USER' })}
                          disabled={hasMixedRoles}
                          className={hasMixedRoles ? 'opacity-50 cursor-not-allowed' : ''}
                        >
                          <UserCog className="h-4 w-4 mr-2" />
                          Set as Buyer
                        </DropdownMenuItem>
                      </div>
                    </TooltipTrigger>
                    {hasMixedRoles && (
                      <TooltipContent>
                        <p>Cannot set mixed roles. Select only Buyers or only Sellers to proceed.</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <DropdownMenuItem
                          onClick={() => setPendingBulkAction({ type: 'changeRole', data: 'ADMIN' })}
                          disabled={hasMixedRoles}
                          className={hasMixedRoles ? 'opacity-50 cursor-not-allowed' : ''}
                        >
                          <UserCog className="h-4 w-4 mr-2" />
                          Set as Seller
                        </DropdownMenuItem>
                      </div>
                    </TooltipTrigger>
                    {hasMixedRoles && (
                      <TooltipContent>
                        <p>Cannot set mixed roles. Select only Buyers or only Sellers to proceed.</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setPendingBulkAction({ type: 'changeStatus', data: 'Active' })}>
                    <Activity className="h-4 w-4 mr-2" />
                    Set Active
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPendingBulkAction({ type: 'changeStatus', data: 'Inactive' })}>
                    <Activity className="h-4 w-4 mr-2" />
                    Set Inactive
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Bulk Action Confirmation Modals */}
      {pendingBulkAction?.type === 'reject' && (
        <RejectReasonModal
          open={true}
          onOpenChange={(open) => {
            if (!open) setPendingBulkAction(null);
          }}
          onConfirm={(reason) => {
            onBulkReject?.(selectedIds, reason);
            setPendingBulkAction(null);
          }}
        />
      )}

      {pendingBulkAction?.type === 'accept' && (
        <ConfirmationPopover
          action="accept"
          entity={`${selectedCount} ${mode === 'sellers' ? 'seller' : 'user'}${selectedCount > 1 ? 's' : ''}`}
          onConfirm={() => {
            onBulkAccept?.(selectedIds);
            setPendingBulkAction(null);
          }}
          onCancel={() => setPendingBulkAction(null)}
        />
      )}

      {pendingBulkAction?.type === 'archive' && (
        <ConfirmationPopover
          action="Archive"
          entity={`${selectedCount} ${mode === 'sellers' ? 'seller' : 'user'}${selectedCount > 1 ? 's' : ''}`}
          onConfirm={() => {
            onArchive?.(selectedIds);
            setPendingBulkAction(null);
          }}
          onCancel={() => setPendingBulkAction(null)}
        />
      )}

      {pendingBulkAction?.type === 'changeRole' && (
        <ConfirmationPopover
          action="accept"
          entity={`${selectedCount} user${selectedCount > 1 ? 's' : ''} to ${pendingBulkAction.data === 'USER' ? 'Buyer' : 'Seller'}`}
          onConfirm={() => {
            onBulkChangeRole?.(selectedIds, pendingBulkAction.data);
            setPendingBulkAction(null);
          }}
          onCancel={() => setPendingBulkAction(null)}
        />
      )}

      {pendingBulkAction?.type === 'changeStatus' && (
        <ConfirmationPopover
          action="accept"
          entity={`${selectedCount} user${selectedCount > 1 ? 's' : ''} to ${pendingBulkAction.data}`}
          onConfirm={() => {
            onBulkChangeStatus?.(selectedIds, pendingBulkAction.data);
            setPendingBulkAction(null);
          }}
          onCancel={() => setPendingBulkAction(null)}
        />
      )}
    </TooltipProvider>
  );
};

export default SelectionBar;
