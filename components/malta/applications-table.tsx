"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useApplications, useCustomers, useProducts } from "@/hooks/queries";
import { useTable } from "@/hooks/use-table";
import { fmtDate, inRange, money, schedule } from "@/lib/format";
import type { Application } from "@/lib/types";
import { DataPagination } from "@/components/malta/data-pagination";
import { StatusPill } from "@/components/malta/status-pill";
import { TableToolbar } from "@/components/malta/table-toolbar";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Shared applications list. `variant="all"` is the full origination pipeline;
// `variant="queue"` is the assessment & approval queue (Submitted / Under
// Review only) with an affordability (DSR) column. Both render identically
// and open the same /applications/:id detail.
export function ApplicationsTable({
  variant,
}: {
  variant: "all" | "queue";
}) {
  const router = useRouter();
  const { data, isLoading } = useApplications();
  const { data: customers } = useCustomers();
  const { data: products } = useProducts();

  const isQueue = variant === "queue";

  const rows = React.useMemo(
    () =>
      isQueue
        ? (data ?? []).filter((a) =>
            ["Submitted", "Under Review"].includes(a.status),
          )
        : (data ?? []),
    [data, isQueue],
  );

  const cust = (id: string) => customers?.find((c) => c.id === id);
  const prod = (id: string) => products?.find((p) => p.id === id);

  const table = useTable<Application>(
    rows,
    React.useCallback(
      (a, s) => {
        const q = s.q.toLowerCase();
        const name = (cust(a.customer)?.name ?? "").toLowerCase();
        return (
          (s.status === "All" || a.status === s.status) &&
          (!q ||
            a.id.toLowerCase().includes(q) ||
            name.includes(q) ||
            a.officer.toLowerCase().includes(q)) &&
          inRange(a.created, s.from, s.to)
        );
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [customers],
    ),
  );

  function dsrFor(a: Application): { dsr: number; color: string } {
    const c = cust(a.customer);
    const p = prod(a.product);
    if (!c || !p) return { dsr: 0, color: "#6f6a61" };
    const sch = schedule(a.amount, p.rate, a.term, p.method);
    const dsr = Math.round((sch[0].total / c.monthlyIncome) * 100);
    const color = dsr < 45 ? "#047857" : dsr < 60 ? "#b45309" : "#b91c1c";
    return { dsr, color };
  }

  const open = (a: Application) =>
    router.push(
      a.status === "Draft"
        ? `/applications/${a.id}/draft`
        : `/applications/${a.id}${isQueue ? "?from=approvals" : ""}`,
    );

  return (
    <Card className="overflow-hidden">
      <TableToolbar
        table={table}
        searchPlaceholder="Search application, borrower or officer…"
        statusOptions={
          isQueue
            ? ["All", "Submitted", "Under Review"]
            : ["All", "Draft", "Submitted", "Under Review", "Approved", "Rejected", "Cancelled"]
        }
        dateLabel="Created"
      />
      <Table>
        <TableHeader>
          <TableRow className="bg-surface-subtle">
            <TableHead>Application</TableHead>
            <TableHead>Borrower</TableHead>
            {!isQueue && <TableHead>Product</TableHead>}
            <TableHead>Amount</TableHead>
            {isQueue && <TableHead>DSR</TableHead>}
            <TableHead>Officer</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell colSpan={6}>
                  <Skeleton className="h-8 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : table.rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                {isQueue ? "Nothing awaiting decision." : "No applications found."}
              </TableCell>
            </TableRow>
          ) : (
            table.rows.map((a) => {
              const { dsr, color } = dsrFor(a);
              return (
                <TableRow
                  key={a.id}
                  onClick={() => open(a)}
                  className="cursor-pointer hover:bg-surface-subtle"
                >
                  <TableCell>
                    <div className="font-mono text-[12.5px] font-semibold">{a.id}</div>
                    {!isQueue && (
                      <div className="text-[11px] text-[#9a948a]">
                        {fmtDate(a.created)} · {a.term} mo
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-[12.5px] font-medium">{cust(a.customer)?.name ?? "—"}</div>
                    {isQueue && (
                      <div className="text-[11px] text-[#9a948a]">{prod(a.product)?.name}</div>
                    )}
                  </TableCell>
                  {!isQueue && (
                    <TableCell className="text-[12.5px] text-[#6f6a61]">
                      {prod(a.product)?.name ?? a.product}
                    </TableCell>
                  )}
                  <TableCell className="font-mono text-[12.5px]">{money(a.amount)}</TableCell>
                  {isQueue && (
                    <TableCell className="font-mono text-[12.5px] font-semibold" style={{ color }}>
                      {dsr}%
                    </TableCell>
                  )}
                  <TableCell className="text-[12.5px] text-[#6f6a61]">{a.officer}</TableCell>
                  <TableCell><StatusPill status={a.status} /></TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
      <DataPagination table={table} />
    </Card>
  );
}
