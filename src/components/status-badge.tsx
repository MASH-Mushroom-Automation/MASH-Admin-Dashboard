"use client"

interface StatusBadgeProps {
  // accept a wide range of status strings from different parts of the app
  status: string
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const key = String(status).toLowerCase()

  const statusConfig: Record<
    string,
    { label: string; bgColor: string; textColor: string; dotColor: string }
  > = {
    pending: {
      label: "Pending",
      bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
      textColor: "text-yellow-800 dark:text-yellow-200",
      dotColor: "bg-yellow-500",
    },
    approved: {
      label: "Approved",
      bgColor: "bg-green-100 dark:bg-green-900/30",
      textColor: "text-green-800 dark:text-green-200",
      dotColor: "bg-green-500",
    },
    rejected: {
      label: "Rejected",
      bgColor: "bg-red-100 dark:bg-red-900/30",
      textColor: "text-red-800 dark:text-red-200",
      dotColor: "bg-red-500",
    },
    active: {
      label: "Active",
      bgColor: "",
      textColor: "text-green-800 dark:text-green-200",
      dotColor: "bg-green-500",
    },
    inactive: {
      label: "Inactive",
      bgColor: "",
      textColor: "text-red-800 dark:text-red-200",
      dotColor: "bg-red-500",
    },
    archived: {
      label: "Archived",
      bgColor: "bg-gray-100 dark:bg-gray-900/20",
      textColor: "text-gray-800 dark:text-gray-200",
      dotColor: "bg-gray-500",
    },
  }

  const config = statusConfig[key] ?? {
    label: String(status),
    bgColor: "bg-muted",
    textColor: "text-foreground",
    dotColor: "bg-gray-400",
  }

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${config.bgColor}`}>
      <div className={`w-2 h-2 rounded-full ${config.dotColor}`} />
      <span className={`text-xs font-medium ${config.textColor}`}>{config.label}</span>
    </div>
  )
}

// Keep default export for files that import `StatusBadge` as the default
export default StatusBadge

