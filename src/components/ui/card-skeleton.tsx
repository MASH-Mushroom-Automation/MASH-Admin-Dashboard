import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export default function CardSkeleton() {
    return (
        <Card className="overflow-hidden">
            <CardHeader className="p-4">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-6 w-12" />
                </div>
            </CardHeader>
            <CardContent className="p-4">
                <Skeleton className="h-40 w-full rounded-md" />
                <div className="mt-4 grid grid-cols-2 gap-4">
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                </div>
            </CardContent>
        </Card>
    );
}
