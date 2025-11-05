"use client";

import type { OrderLog } from "@/app/mash-market/order/page";
import { Badge } from "@/components/ui/badge";

interface OrderLogsTableProps {
  logs: OrderLog[];
  onRowClick: (order: OrderLog) => void;
}

const statusConfig = {
  "pending-payment": {
    label: "Pending Payment",
    color:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  },
  shipment: {
    label: "Shipment",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  },
  "failed-delivery": {
    label: "Failed Delivery",
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  },
  completed: {
    label: "Completed",
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  },
  "refund-return": {
    label: "Refund / Return",
    color:
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  },
  canceled: {
    label: "Canceled",
    color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  },
  dispute: {
    label: "Dispute",
    color:
      "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  },
  "payment-verification": {
    label: "Payment Verification",
    color: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  },
};

export function OrderLogsTable({ logs, onRowClick }: OrderLogsTableProps) {
  if (logs.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">
          No orders found matching your criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
              Seller Name
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
              Order ID
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
              Buyer Name
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
              Order Date
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
              Amount
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
              Status
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
              Last Updated
            </th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr
              key={log.id}
              onClick={() => onRowClick(log)}
              className="cursor-pointer border-b border-border transition-colors hover:bg-muted/50"
            >
              <td className="px-6 py-4 text-sm text-foreground">
                {log.sellerName}
              </td>
              <td className="px-6 py-4 text-sm font-medium text-foreground">
                {log.orderId}
              </td>
              <td className="px-6 py-4 text-sm text-foreground">
                {log.buyerName}
              </td>
              <td className="px-6 py-4 text-sm text-foreground">
                {log.orderDate}
              </td>
              <td className="px-6 py-4 text-sm font-medium text-foreground">
                ${log.amount.toFixed(2)}
              </td>
              <td className="px-6 py-4 text-sm">
                <Badge
                  className={
                    statusConfig[log.status as keyof typeof statusConfig].color
                  }
                >
                  {statusConfig[log.status as keyof typeof statusConfig].label}
                </Badge>
              </td>
              <td className="px-6 py-4 text-sm text-muted-foreground">
                {log.lastUpdated}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
