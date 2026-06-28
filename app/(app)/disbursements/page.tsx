"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useApplications, useCustomers, useProducts } from "@/hooks/queries";
import { useTable } from "@/hooks/use-table";
import { inRange, money } from "@/lib/format";
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

export default function DisbursementsPage() {
  const router = useRouter();
  const { data } = useApplications();
  const { data: customers } = useCustomers();
  const { data: products } = useProducts();

  const approved = React.useMemo(
    () => (data ?? []).filter((a) => a.status === "Approved"),
    [data],
  );
  const cust = (id: string) => customers?.find((c) => c.id === id);
  const prod = (id: string) => products?.find((p) => p.id === id);

  const table = useTable<Application>(
    approved,
    React.useCallback(
      (a, s) => {
        const q = s.q.toLowerCase();
        const c = customers?.find((x) => x.id === a.customer);
        return (
          (!q || a.id.toLowerCase().includes(q) || (c?.name ?? "").toLowerCase().includes(q)) &&
          inRange(a.created, s.from, s.to)
        );
      },
      [customers],
    ),
  );

  return (
    <div className="max-w-[1340px] animate-fade-up">
      <PageHeader title="Disbursements" subtitle="Approved loans ready for disbursement" />
      <Card className="overflow-hidden">
        <TableToolbar table={table} searchPlaceholder="Search application or borrower…" dateLabel="Approved" />
        <Table>
          <TableHeader>
            <TableRow className="bg-surface-subtle">
              <TableHead>Application</TableHead>
              <TableHead>Borrower</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {table.rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  No loans awaiting disbursement.
                </TableCell>
              </TableRow>
            ) : (
              table.rows.map((a) => (
                <TableRow
                  key={a.id}
                  onClick={() => router.push(`/disbursements/${a.id}`)}
                  className="cursor-pointer hover:bg-surface-subtle"
                >
                  <TableCell className="font-mono text-[12.5px] font-semibold">{a.id}</TableCell>
                  <TableCell className="text-[12.5px] font-medium">{cust(a.customer)?.name}</TableCell>
                  <TableCell className="text-[12.5px] text-[#6f6a61]">{prod(a.product)?.name}</TableCell>
                  <TableCell className="font-mono text-[12.5px]">{money(a.amount)}</TableCell>
                  <TableCell><StatusPill status="Pending Disbursement" /></TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <DataPagination table={table} />
      </Card>
    </div>
  );
}
