import React from "react";
import { cn } from "@/lib/utils";

function Spinner({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        "inline-block h-4 w-4 rounded-full border-2 border-muted border-t-primary animate-spin",
        className
      )}
      {...props}
    />
  );
}

export { Spinner };
