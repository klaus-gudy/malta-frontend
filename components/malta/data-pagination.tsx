"use client";

import { cn } from "@/lib/utils";
import type { UseTableResult } from "@/hooks/use-table";

/** Footer row: "showing X of Y" + page buttons, matching the design. */
export function DataPagination<T>({ table }: { table: UseTableResult<T> }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-table-border px-4 py-2.5">
      <div className="text-xs text-muted-foreground">
        Showing {table.showing}
      </div>
      {table.multiPage ? (
        <div className="flex items-center gap-1.5">
          <button
            onClick={table.prev}
            className="h-[30px] min-w-[30px] rounded-md border border-input bg-card px-2 text-[13px] text-[#6f6a61] hover:bg-secondary"
          >
            ‹
          </button>
          {table.pages.map((n) => (
            <button
              key={n}
              onClick={() => table.setPage(n)}
              className={cn(
                "h-[30px] min-w-[30px] rounded-md border px-2 font-mono text-[12.5px] font-semibold",
                n === table.page
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input bg-card text-[#6f6a61] hover:bg-secondary",
              )}
            >
              {n}
            </button>
          ))}
          <button
            onClick={table.next}
            className="h-[30px] min-w-[30px] rounded-md border border-input bg-card px-2 text-[13px] text-[#6f6a61] hover:bg-secondary"
          >
            ›
          </button>
        </div>
      ) : null}
    </div>
  );
}
