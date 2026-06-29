"use client";

import * as React from "react";

export interface TableState {
  q: string;
  from: string;
  to: string;
  status: string;
  page: number;
}

const initial: TableState = { q: "", from: "", to: "", status: "All", page: 1 };

export interface UseTableResult<T> {
  state: TableState;
  setQ: (v: string) => void;
  setFrom: (v: string) => void;
  setTo: (v: string) => void;
  setStatus: (v: string) => void;
  setPage: (n: number) => void;
  clear: () => void;
  /** Page slice of the filtered rows. */
  rows: T[];
  total: number;
  showing: string;
  multiPage: boolean;
  pages: number[];
  page: number;
  pageCount: number;
  pageSize: number;
  setPageSize: (n: number) => void;
  prev: () => void;
  next: () => void;
}

/**
 * Client-side filter + pagination over an already-fetched array — mirrors the
 * source design's buildTbl(). `filter` receives the live filter state so each
 * screen can apply its own search / status / date-range predicate.
 */
export function useTable<T>(
  data: T[] | undefined,
  filter: (row: T, state: TableState) => boolean,
  pageSize = 8,
): UseTableResult<T> {
  const [state, setState] = React.useState<TableState>(initial);
  // Page size is user-selectable; the argument is just the initial value.
  const [size, setSize] = React.useState(pageSize);

  const patch = React.useCallback(
    (p: Partial<TableState>, resetPage = true) =>
      setState((s) => ({ ...s, ...p, ...(resetPage ? { page: 1 } : {}) })),
    [],
  );

  const filtered = React.useMemo(
    () => (data ?? []).filter((row) => filter(row, state)),
    [data, filter, state],
  );

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / size));
  const page = Math.min(state.page, pageCount);
  const start = (page - 1) * size;
  const rows = filtered.slice(start, start + size);

  return {
    state,
    setQ: (v) => patch({ q: v }),
    setFrom: (v) => patch({ from: v }),
    setTo: (v) => patch({ to: v }),
    setStatus: (v) => patch({ status: v }),
    setPage: (n) => patch({ page: n }, false),
    clear: () => {
      setState(initial);
      setSize(pageSize);
    },
    rows,
    total,
    showing: total
      ? `${start + 1}–${Math.min(start + size, total)} of ${total}`
      : "0 of 0",
    multiPage: pageCount > 1,
    pages: Array.from({ length: pageCount }, (_, i) => i + 1),
    page,
    pageCount,
    pageSize: size,
    // Changing page size returns to the first page so the view stays sensible.
    setPageSize: (n) => {
      setSize(n);
      patch({ page: 1 }, false);
    },
    prev: () => patch({ page: Math.max(1, page - 1) }, false),
    next: () => patch({ page: Math.min(pageCount, page + 1) }, false),
  };
}
