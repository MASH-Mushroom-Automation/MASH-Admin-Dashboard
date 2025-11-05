// import { cn } from "@/lib/utils"

// function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
//   return (
//     <div
//       data-slot="skeleton"
//       className={cn("bg-accent animate-pulse rounded-md", className)}
//       {...props}
//     />
//   )
// }

// export { Skeleton }

// components/ui/skeleton.tsx
import { cn } from "@/lib/utils";

import React from "react";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children?: React.ReactNode;
}

export function Skeleton({ className, children, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted/50", className)}
      {...props}
    >
      {children}
    </div>
  );
}
