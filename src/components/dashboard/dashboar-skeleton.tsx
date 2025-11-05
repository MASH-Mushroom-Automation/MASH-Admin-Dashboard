// components/dashboard/dashboard-skeleton.tsx
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function DashboardSkeleton() {
  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div>
        <Skeleton className="h-9 w-48 mb-2" />
        <Skeleton className="h-5 w-80" />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <Skeleton className="h-8 w-12 mx-auto mb-1" />
                  <Skeleton className="h-3 w-16 mx-auto" />
                </div>
                <div className="text-center">
                  <Skeleton className="h-8 w-12 mx-auto mb-1" />
                  <Skeleton className="h-3 w-16 mx-auto" />
                </div>
              </div>
              <Skeleton className="h-8 w-full mt-4" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Overview Sections */}
      <div className="space-y-6 pt-4">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-64" />

        {/* ECommerce + Chamber Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sales Summary */}
          <Card>
            <CardHeader className="pb-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-40" />
            </CardHeader>
            <CardContent className="space-y-5">
              <Skeleton className="h-12 w-40 mx-auto" />
              <div className="h-px bg-border/60" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-16 rounded-lg" />
                <Skeleton className="h-16 rounded-lg" />
              </div>
            </CardContent>
          </Card>

          {/* Daily Sales Chart */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-52 w-full rounded-lg" />
            </CardContent>
          </Card>
        </div>

        {/* Chamber Inventory */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Users Pie */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-52 w-full rounded-full mx-auto" />
              <div className="flex justify-center gap-6 mt-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-5 w-16" />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Registry Table */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-56" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex gap-4">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-5 w-32 flex-1" />
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
