"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useApplications, useCustomers, useProducts } from "@/hooks/queries";
import { useTable } from "@/hooks/use-table";
import { inRange, money, schedule } from "@/lib/format";
import type { Application } from "@/lib/types";
import { PageHeader } from "@/components/malta/page-header";
import { DataPagination } from "@/components/malta/data-pagination";
import { StatusPill } from "@/components/malta/status-pill";
import { TableToolbar } from "@/components/malta/table-toolbar";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function ApprovalsPage() {
  const router = useRouter();
  const { data } = useApplications();
  const { data: customers } = useCustomers();
  const { data: products } = useProducts();

  const queue = React.useMemo(
    () =>
      (data ?? []).filter((a) =>
        ["Submitted", "Under Review"].includes(a.status),
      ),
    [data],
  );

  const cust = (id: string) => customers?.find((c) => c.id === id);
  const prod = (id: string) => products?.find((p) => p.id === id);

  const table = useTable<Application>(
    queue,
    React.useCallback(
      (a, s) => {
        const q = s.q.toLowerCase();
        const c = customers?.find((x) => x.id === a.customer);
        return (
          (s.status === "All" || a.status === s.status) &&
          (!q ||
            a.id.toLowerCase().includes(q) ||
            (c?.name ?? "").toLowerCase().includes(q) ||
            a.officer.toLowerCase().includes(q)) &&
          inRange(a.created, s.from, s.to)
        );
      },
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

  return (
    <div className="max-w-[1340px] animate-fade-up">
      <PageHeader
        title="Assessment & approval"
        subtitle="Applications awaiting your decision"
      />

      <Card className="overflow-hidden">
        <TableToolbar
          table={table}
          searchPlaceholder="Search application, borrower or officer…"
          statusOptions={["All", "Submitted", "Under Review"]}
          dateLabel="Created"
        />
        <Table>
          <TableHeader>
            <TableRow className="bg-surface-subtle">
              <TableHead>Application</TableHead>
              <TableHead>Borrower</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>DSR</TableHead>
              <TableHead>Officer</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {table.rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  Nothing awaiting decision.
                </TableCell>
              </TableRow>
            ) : (
              table.rows.map((a) => {
                const { dsr, color } = dsrFor(a);
                return (
                  <TableRow
                    key={a.id}
                    onClick={() => router.push(`/applications/${a.id}?from=approvals`)}
                    className="cursor-pointer hover:bg-surface-subtle"
                  >
                    <TableCell className="font-mono text-[12.5px] font-semibold">{a.id}</TableCell>
                    <TableCell>
                      <div className="text-[12.5px] font-medium">{cust(a.customer)?.name}</div>
                      <div className="text-[11px] text-[#9a948a]">{prod(a.product)?.name}</div>
                    </TableCell>
                    <TableCell className="font-mono text-[12.5px]">{money(a.amount)}</TableCell>
                    <TableCell className="font-mono text-[12.5px] font-semibold" style={{ color }}>
                      {dsr}%
                    </TableCell>
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
    </div>
  );
}
