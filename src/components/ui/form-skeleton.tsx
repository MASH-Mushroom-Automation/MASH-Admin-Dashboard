import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function FormSkeleton() {
    return (
        <div className="space-y-4">
            <Skeleton className="h-6 w-40" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-1/2" />
        </div>
    );
}
