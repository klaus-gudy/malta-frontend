"use client";

import { Search } from "lucide-react";
import type { UseTableResult } from "@/hooks/use-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** Shared list filter bar: search + optional status select + optional date range + clear. */
export function TableToolbar<T>({
  table,
  searchPlaceholder = "Search…",
  statusOptions,
  dateLabel,
}: {
  table: UseTableResult<T>;
  searchPlaceholder?: string;
  statusOptions?: string[];
  dateLabel?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2.5 border-b border-table-border px-3.5 py-3">
      <div className="relative min-w-[190px] max-w-[300px] flex-1">
        <Search className="absolute left-3 top-1/2 size-[15px] -translate-y-1/2 text-[#b3ada3]" />
        <input
          value={table.state.q}
          onChange={(e) => table.setQ(e.target.value)}
          placeholder={searchPlaceholder}
          className="h-[34px] w-full rounded-md border border-input-soft bg-background pl-[30px] pr-3 text-[13px] outline-none focus:border-primary"
        />
      </div>

      {statusOptions ? (
        <Select value={table.state.status} onValueChange={table.setStatus}>
          <SelectTrigger size="sm" className="w-auto min-w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}

      {dateLabel ? (
        <div className="flex items-center gap-1.5">
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.04em] text-[#9a948a]">
            {dateLabel}
          </span>
          <input
            type="date"
            value={table.state.from}
            onChange={(e) => table.setFrom(e.target.value)}
            className="h-[34px] rounded-md border border-input-soft bg-card px-2 font-mono text-xs outline-none focus:border-primary"
          />
          <span className="text-[11px] text-[#b3ada3]">→</span>
          <input
            type="date"
            value={table.state.to}
            onChange={(e) => table.setTo(e.target.value)}
            className="h-[34px] rounded-md border border-input-soft bg-card px-2 font-mono text-xs outline-none focus:border-primary"
          />
        </div>
      ) : null}

      <button
        onClick={table.clear}
        className="h-[34px] rounded-md border border-input bg-card px-3 text-[12.5px] font-medium text-[#6f6a61] hover:bg-secondary"
      >
        Clear
      </button>
    </div>
  );
}
