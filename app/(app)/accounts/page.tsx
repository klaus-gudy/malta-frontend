"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useLoans, useCustomers, useProducts } from "@/hooks/queries";
import { useTable } from "@/hooks/use-table";
import { fmtDate, inRange, money, schedule } from "@/lib/format";
import type { Loan } from "@/lib/types";
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

export default function AccountsPage() {
  const router = useRouter();
  const { data } = useLoans();
  const { data: customers } = useCustomers();
  const { data: products } = useProducts();

  const cust = (id: string) => customers?.find((c) => c.id === id);
  const prod = (id: string) => products?.find((p) => p.id === id);

  const table = useTable<Loan>(
    data,
    React.useCallback(
      (l, s) => {
        const q = s.q.toLowerCase();
        const c = customers?.find((x) => x.id === l.customer);
        return (
          (s.status === "All" || l.status === s.status) &&
          (!q || l.id.toLowerCase().includes(q) || (c?.name ?? "").toLowerCase().includes(q)) &&
          inRange(l.disbursed, s.from, s.to)
        );
      },
      [customers],
    ),
  );

  function outstanding(l: Loan) {
    const sch = schedule(l.principal, l.rate, l.term, l.method, l.disbursed);
    return sch.slice(l.paid).reduce((s, r) => s + r.total, 0);
  }
  function nextDue(l: Loan) {
    const sch = schedule(l.principal, l.rate, l.term, l.method, l.disbursed);
    return sch[l.paid] ? fmtDate(sch[l.paid].due) : "—";
  }

  return (
    <div className="max-w-[1340px] animate-fade-up">
      <PageHeader title="Loan accounts" subtitle="All disbursed loans and their lifecycle status" />
      <Card className="overflow-hidden">
        <TableToolbar
          table={table}
          searchPlaceholder="Search account or borrower…"
          statusOptions={["All", "Active", "Overdue", "Closed", "Written Off"]}
          dateLabel="Disbursed"
        />
        <Table>
          <TableHeader>
            <TableRow className="bg-surface-subtle">
              <TableHead>Account</TableHead>
              <TableHead>Borrower</TableHead>
              <TableHead>Principal</TableHead>
              <TableHead>Outstanding</TableHead>
              <TableHead>Next due</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {table.rows.map((l) => (
              <TableRow
                key={l.id}
                onClick={() => router.push(`/accounts/${l.id}`)}
                className="cursor-pointer hover:bg-surface-subtle"
              >
                <TableCell className="font-mono text-[12.5px] font-semibold">{l.id}</TableCell>
                <TableCell>
                  <div className="text-[12.5px] font-medium">{cust(l.customer)?.name}</div>
                  <div className="text-[11px] text-[#9a948a]">{prod(l.product)?.name}</div>
                </TableCell>
                <TableCell className="font-mono text-[12.5px]">{money(l.principal)}</TableCell>
                <TableCell className="font-mono text-[12.5px] font-semibold">{money(outstanding(l))}</TableCell>
                <TableCell className="text-[12.5px]">{nextDue(l)}</TableCell>
                <TableCell><StatusPill status={l.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <DataPagination table={table} />
      </Card>
    </div>
  );
}
