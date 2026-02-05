"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronsUpDown, ChevronUp, ChevronDown, UserX } from "lucide-react";
import UserAvatar from "@/components/ecommerce/user-avatar";
import { ActionsMenu } from "@/components/user-actions-menu";
import SelectionBar from "@/components/selection-bar";

export type AnyRow = Record<string, any>;

interface DataTableProps<TData extends AnyRow> {
  data: TData[];
  initialPageSize?: number;
  columns?: ColumnDef<any, any>[];
  onArchive?: (ids: string[]) => void;
  onBulkChangeRole?: (ids: string[], newRole: string) => void;
  onBulkChangeStatus?: (ids: string[], newStatus: string) => void;
  onBulkAccept?: (ids: string[]) => void;
  onBulkReject?: (ids: string[], reason?: string) => void;
  onExport?: (rows: AnyRow[]) => void;
  mode?: 'users' | 'sellers';
  hidePagination?: boolean;
  showAcceptReject?: boolean;
  activeTab?: string;
  /** When true, selection bar shows only archive action */
  archiveOnly?: boolean;
  /** Custom entity name for selection confirmations (e.g. 'device') */
  entityName?: string;
  /** When true, selection bar shows only Export and Archive actions */
  simpleActions?: boolean;
  /** When true, selection bar is in archived view and should show Unarchive actions */
  archivedView?: boolean;
}

export function DataTable(props: DataTableProps<any>) {
  const { data, initialPageSize = 10, columns, onArchive, onBulkChangeRole, onBulkChangeStatus, onBulkAccept, onBulkReject, onExport, mode = 'users', hidePagination, showAcceptReject = true, activeTab, archiveOnly = false, entityName, simpleActions = false, archivedView = false } = props;
  const [rowSelection, setRowSelection] = useState({});
  const [sorting, setSorting] = useState<any[]>([]);
  const [pageSize, setPageSize] = useState<number>(initialPageSize);

  const defaultColumns = useMemo<ColumnDef<any, any>[]>(() => {
    return [
      {
        id: "select",
        header: ({ table }) => {
          const allSelected = table.getIsAllPageRowsSelected();
          const someSelected = table.getIsSomePageRowsSelected();
          return (
            <input
              type="checkbox"
              className="h-4 w-4 rounded-md border-2 border-slate-300 bg-white accent-primary transition-transform duration-150 ease-in-out transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/30"
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
            className="h-4 w-4 rounded-md border-2 border-slate-300 bg-white accent-primary transition-transform duration-150 ease-in-out transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/30"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            aria-label={`Select row ${row.id}`}
          />
        ),
        size: 24,
      },
      {
        id: "profile",
        header: "Profile",
        cell: ({ row }) => {
          const computeInitials = (value?: string) => {
            const v = (value || "").trim();
            if (!v) return "U";
            const parts = v.split(/\s+/).filter(Boolean);
            if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
            return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
          };
          const initials = computeInitials(row.original.avatar || row.original.name || "U");
          return <UserAvatar initials={initials} />;
        },
      },
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ getValue }) => getValue() ?? "N/A",
      },
      {
        accessorKey: "username",
        header: "Username",
        cell: ({ getValue }) => getValue() ?? "N/A",
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ getValue }) => getValue() ?? "N/A",
      },
      {
        accessorKey: "phone",
        header: "Phone",
        cell: ({ getValue }) => getValue() ?? "N/A",
      },
      {
        accessorKey: "region",
        header: "Region",
        cell: ({ getValue }) => getValue() ?? "N/A",
      },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ getValue }) => {
          const v = (getValue() as string) || "N/A";
          if (v.toUpperCase?.() === "USER") return "Buyer";
          if (v.toUpperCase?.() === "ADMIN") return "Seller";
          return v;
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <ActionsMenu
            id={row.original.id}
            viewUrl={`/mash-market/user/${row.original.username || row.original.id}?id=${row.original.id}`}
            onArchive={() => onArchive && onArchive([row.original.id])}
          />
        ),
      },
    ];
  }, []);

  const table = useReactTable({
    data,
    columns: columns ?? defaultColumns,
    state: { rowSelection, sorting },
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageIndex: 0, pageSize } },
    enableRowSelection: true,
    enableSorting: true,
  });

  // sync pageSize with table state
  React.useEffect(() => {
    table.setPageSize(pageSize);
  }, [pageSize]);

  // Reset page index when the provided data changes so table doesn't show empty page
  React.useEffect(() => {
    table.setPageIndex(0);
  }, [data]);

  // Clear selection if the underlying data changes to avoid dangling selections
  React.useEffect(() => {
    table.resetRowSelection();
  }, [data]);

  const selectedCount = Object.keys(rowSelection).length;
  const selectedIds = table.getSelectedRowModel().flatRows.map((r) => r.original.id).filter(Boolean) as string[];
  const selectedRows = table.getSelectedRowModel().flatRows.map((r) => r.original);

  const totalRows = (data || []).length;
  const getRowsPerPageOptions = (total: number) => {
    const base = [5, 10, 20, 50];
    const set = new Set<number>();
    if (total <= 1) return [Math.max(1, total)];
    // include base values that are <= total
    base.forEach((n) => {
      if (n <= total) set.add(n);
    });
    // always include total itself as an option
    set.add(total);
    const arr = Array.from(set).sort((a, b) => a - b);
    return arr;
  };
  const rowsPerPageOptions = getRowsPerPageOptions(totalRows);

  // Ensure pageSize is not greater than totalRows (when data is small)
  React.useEffect(() => {
    if (totalRows > 0 && pageSize > totalRows) {
      setPageSize(totalRows);
    }
  }, [totalRows]);


  React.useEffect(() => {
    if (hidePagination) {
      // If there are no rows, keep pageSize at 1 to avoid zero-size
      const newSize = totalRows > 0 ? totalRows : 1;
      if (pageSize !== newSize) {
        setPageSize(newSize);
      }
      // ensure we're on page 0
      table.setPageIndex(0);
    }
  }, [hidePagination, totalRows]);

  return (
    <div className="w-full">
      <SelectionBar
        selectedCount={selectedCount}
        selectedIds={selectedIds}
        selectedRows={selectedRows}
        mode={mode}
        onClear={() => table.resetRowSelection()}
        onArchive={(ids) => onArchive && onArchive(ids)}
        onBulkChangeRole={(ids, newRole) => onBulkChangeRole && onBulkChangeRole(ids, newRole)}
        onBulkChangeStatus={(ids, newStatus) => onBulkChangeStatus && onBulkChangeStatus(ids, newStatus)}
        onBulkAccept={(ids) => onBulkAccept && onBulkAccept(ids)}
        onBulkReject={(ids, reason) => onBulkReject && onBulkReject(ids, reason)}
        onExport={onExport}
        showAcceptReject={showAcceptReject}
        activeTab={activeTab}
        archiveOnly={archiveOnly}
        entityName={entityName}
        simpleActions={simpleActions}
        archivedView={archivedView}
      />

      <div className="overflow-x-auto bg-card">
        <table className="min-w-full divide-y table-fixed">
          <thead className="bg-background">
            {table.getHeaderGroups().map((hg) => {
              return (
                <tr key={hg.id}>
                  {hg.headers.map((header) => {
                    const canSort = header.column.getCanSort();
                    const sortState = header.column.getIsSorted();
                    return (
                      <th
                        key={header.id}
                        className="text-left px-4 py-3 text-sm font-medium text-muted-foreground"
                        style={{ width: header.column.getSize() }}
                      >
                        {!header.isPlaceholder && (
                          <div>
                            {canSort ? (
                              <button
                                onClick={() => header.column.toggleSorting()}
                                className="inline-flex items-center gap-2 focus:outline-none"
                                aria-label={`Sort by ${String(header.column.id)}`}
                              >
                                <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
                                <span className="opacity-70">
                                  {sortState === "asc" ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : sortState === "desc" ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronsUpDown className="h-4 w-4 opacity-60" />
                                  )}
                                </span>
                              </button>
                            ) : (
                              <div>{flexRender(header.column.columnDef.header, header.getContext())}</div>
                            )}
                          </div>
                        )}
                      </th>
                    );
                  })}
                </tr>
              );
            })}
          </thead>

          <tbody className="bg-background divide-y text-sm">
            {table.getRowModel().rows.length === 0 && (
              <tr>
                <td colSpan={100} className="px-6 py-12 text-center text-muted-foreground">
                  <UserX className="mx-auto mb-4 h-12 w-12 opacity-50" />
                  There is no user yet
                </td>
              </tr>
            )}

            {table.getRowModel().rows.map((row) => {
              return (
                <tr
                  key={row.id}
                  className={`transition-colors duration-150 ${row.getIsSelected()
                    ? 'bg-primary/10 border-l-2 shadow-xs hover:bg-primary/15'
                    : 'odd:bg-card hover:bg-muted/50'
                    }`}
                >
                  {row.getVisibleCells().map((cell) => {
                    return (
                      <td
                        key={cell.id}
                        className={`px-4 py-2 align-middle ${['select', 'profile', 'actions'].includes(cell.column.id)
                          ? ''
                          : 'max-w-0 whitespace-nowrap overflow-hidden'
                          }`}
                      >
                        <div
                          className={
                            ['select', 'profile', 'actions'].includes(cell.column.id)
                              ? ''
                              : 'truncate'
                          }
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </div>
                      </td>

                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>


    </div>
  );
}
