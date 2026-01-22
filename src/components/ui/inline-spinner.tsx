import React from "react";
import { Spinner } from "@/components/ui/spinner";

export default function InlineSpinner({ size = 4 }: { size?: number }) {
    const sizeClass = `h-${size} w-${size}`;
    return (
        <span className="inline-flex items-center">
            <Spinner className={"h-4 w-4 text-muted-foreground"} />
        </span>
    );
}
