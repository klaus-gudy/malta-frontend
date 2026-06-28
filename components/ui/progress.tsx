"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "@/lib/utils";

function Progress({
  className,
  value,
  indicatorClassName,
  indicatorStyle,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & {
  indicatorClassName?: string;
  indicatorStyle?: React.CSSProperties;
}) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "relative h-[7px] w-full overflow-hidden rounded-full bg-[#f1ece2]",
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn("h-full rounded-full bg-primary transition-all", indicatorClassName)}
        style={{ width: `${value || 0}%`, ...indicatorStyle }}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
