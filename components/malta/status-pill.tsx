import { Badge } from "@/components/ui/badge";
import { pillStyle } from "@/lib/format";
import { cn } from "@/lib/utils";

/** A status badge using the design's arbitrary per-status colors. */
export function StatusPill({
  status,
  label,
  className,
}: {
  status: string;
  label?: string;
  className?: string;
}) {
  return (
    <Badge
      style={pillStyle(status)}
      className={cn("border-0", className)}
    >
      {label ?? status}
    </Badge>
  );
}
