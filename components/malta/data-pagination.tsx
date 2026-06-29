"use client";

import { cn } from "@/lib/utils";
import type { UseTableResult } from "@/hooks/use-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PAGE_SIZES = [8, 16, 24, 50];

/**
 * Build a compact list of pages: always the first and last, a window around the
 * current page, and "…" gaps. With 7+ pages this shows e.g. 1 … 4 5 6 … 12 so
 * only the necessary pages render. `siblings` controls how many neighbours of
 * the current page are shown.
 */
function paginationRange(
  current: number,
  total: number,
  siblings = 1,
): (number | "dots")[] {
  // first + last + current + 2 dots + siblings on each side
  const slots = siblings * 2 + 5;
  if (total <= slots) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const left = Math.max(current - siblings, 1);
  const right = Math.min(current + siblings, total);
  const showLeftDots = left > 2;
  const showRightDots = right < total - 1;

  // Near the start: show a run of first pages, then … last.
  if (!showLeftDots && showRightDots) {
    const count = 3 + siblings * 2;
    return [
      ...Array.from({ length: count }, (_, i) => i + 1),
      "dots",
      total,
    ];
  }

  // Near the end: first … then a run of last pages.
  if (showLeftDots && !showRightDots) {
    const count = 3 + siblings * 2;
    return [
      1,
      "dots",
      ...Array.from({ length: count }, (_, i) => total - count + 1 + i),
    ];
  }

  // In the middle: first … window … last.
  return [
    1,
    "dots",
    ...Array.from({ length: right - left + 1 }, (_, i) => left + i),
    "dots",
    total,
  ];
}

const navBtn =
  "h-[30px] min-w-[30px] rounded-md border border-input bg-card px-2 text-[13px] text-[#6f6a61] hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40";

/** Footer row: rows-per-page + "showing X of Y" + (truncated) page buttons. */
export function DataPagination<T>({ table }: { table: UseTableResult<T> }) {
  const items = paginationRange(table.page, table.pageCount);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-table-border px-4 py-2.5">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Rows per page</span>
          <Select
            value={String(table.pageSize)}
            onValueChange={(v) => table.setPageSize(Number(v))}
          >
            <SelectTrigger
              size="sm"
              className="h-[28px] w-[64px] px-2 font-mono text-[12.5px]"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZES.map((s) => (
                <SelectItem key={s} value={String(s)}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="text-xs text-muted-foreground">
          Showing {table.showing}
        </div>
      </div>

      {table.multiPage ? (
        <div className="flex items-center gap-1.5">
          <button onClick={table.prev} disabled={table.page === 1} className={navBtn}>
            ‹
          </button>
          {items.map((it, i) =>
            it === "dots" ? (
              <span
                key={`dots-${i}`}
                className="min-w-[24px] select-none text-center font-mono text-[12.5px] text-[#9a948a]"
              >
                …
              </span>
            ) : (
              <button
                key={it}
                onClick={() => table.setPage(it)}
                className={cn(
                  "h-[30px] min-w-[30px] rounded-md border px-2 font-mono text-[12.5px] font-semibold",
                  it === table.page
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input bg-card text-[#6f6a61] hover:bg-secondary",
                )}
              >
                {it}
              </button>
            ),
          )}
          <button
            onClick={table.next}
            disabled={table.page === table.pageCount}
            className={navBtn}
          >
            ›
          </button>
        </div>
      ) : null}
    </div>
  );
}
