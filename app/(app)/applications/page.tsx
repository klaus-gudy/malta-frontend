"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useApplications, useCustomers, useProducts } from "@/hooks/queries";
import { useSession } from "@/lib/session";
import { can } from "@/lib/rbac";
import { useTable } from "@/hooks/use-table";
import { fmtDate, inRange, money } from "@/lib/format";
import type { Application } from "@/lib/types";
import { PageHeader } from "@/components/malta/page-header";
import { DataPagination } from "@/components/malta/data-pagination";
import { StatusPill } from "@/components/malta/status-pill";
import { TableToolbar } from "@/components/malta/table-toolbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function ApplicationsPage() {
  const router = useRouter();
  const { role } = useSession();
  const { data, isLoading } = useApplications();
  const { data: customers } = useCustomers();
  const { data: products } = useProducts();

  const custName = (id: string) =>
    customers?.find((c) => c.id === id)?.name ?? "—";
  const prodName = (id: string) =>
    products?.find((p) => p.id === id)?.name ?? id;

  const table = useTable<Application>(
    data,
    React.useCallback(
      (a, s) => {
        const q = s.q.toLowerCase();
        const name = (
          customers?.find((c) => c.id === a.customer)?.name ?? ""
        ).toLowerCase();
        return (
          (s.status === "All" || a.status === s.status) &&
          (!q ||
            a.id.toLowerCase().includes(q) ||
            name.includes(q) ||
            a.officer.toLowerCase().includes(q)) &&
          inRange(a.created, s.from, s.to)
        );
      },
      [customers],
    ),
  );

  return (
    <div className="max-w-[1340px] animate-fade-up">
      <PageHeader
        title="Loan applications"
        subtitle="Origination pipeline across all statuses"
      >
        {can(role, "createApplication") && (
          <Button onClick={() => router.push("/applications/new")}>
            + New application
          </Button>
        )}
      </PageHeader>

      <Card className="overflow-hidden">
        <TableToolbar
          table={table}
          searchPlaceholder="Search application, borrower or officer…"
          statusOptions={["All", "Draft", "Submitted", "Under Review", "Approved", "Rejected", "Cancelled"]}
          dateLabel="Created"
        />
        <Table>
          <TableHeader>
            <TableRow className="bg-surface-subtle">
              <TableHead>Application</TableHead>
              <TableHead>Borrower</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Amount</TableHead>
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
            ) : (
              table.rows.map((a) => (
                <TableRow
                  key={a.id}
                  onClick={() => router.push(`/applications/${a.id}`)}
                  className="cursor-pointer hover:bg-surface-subtle"
                >
                  <TableCell>
                    <div className="font-mono text-[12.5px] font-semibold">{a.id}</div>
                    <div className="text-[11px] text-[#9a948a]">
                      {fmtDate(a.created)} · {a.term} mo
                    </div>
                  </TableCell>
                  <TableCell className="text-[12.5px] font-medium">{custName(a.customer)}</TableCell>
                  <TableCell className="text-[12.5px] text-[#6f6a61]">{prodName(a.product)}</TableCell>
                  <TableCell className="font-mono text-[12.5px]">{money(a.amount)}</TableCell>
                  <TableCell className="text-[12.5px] text-[#6f6a61]">{a.officer}</TableCell>
                  <TableCell><StatusPill status={a.status} /></TableCell>
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
