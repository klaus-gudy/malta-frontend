"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useCustomers } from "@/hooks/queries";
import { useSession } from "@/lib/session";
import { can } from "@/lib/rbac";
import { useTable } from "@/hooks/use-table";
import { initials, inRange } from "@/lib/format";
import type { Customer } from "@/lib/types";
import { PageHeader } from "@/components/malta/page-header";
import { DataPagination } from "@/components/malta/data-pagination";
import { StatusPill } from "@/components/malta/status-pill";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TableToolbar } from "@/components/malta/table-toolbar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function filterCustomer(c: Customer, s: { q: string; status: string; from: string; to: string }) {
  const q = s.q.toLowerCase();
  return (
    (!q ||
      c.name.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q) ||
      c.phone.includes(q)) &&
    (s.status === "All" || c.status === s.status) &&
    inRange(c.joined, s.from, s.to)
  );
}

export default function CustomersPage() {
  const router = useRouter();
  const { role } = useSession();
  const { data, isLoading } = useCustomers();
  const table = useTable<Customer>(data, filterCustomer);

  return (
    <div className="max-w-[1340px] animate-fade-up">
      <PageHeader
        title="Customers"
        subtitle={`${table.total} borrower profiles`}
      >
        {can(role, "createCustomer") && (
          <Button onClick={() => router.push("/customers/new")}>
            + Register customer
          </Button>
        )}
      </PageHeader>

      <Card className="overflow-hidden">
        <TableToolbar
          table={table}
          searchPlaceholder="Search name, ID or phone…"
          statusOptions={["All", "Active", "Inactive"]}
          dateLabel="Joined"
        />
        <Table>
          <TableHeader>
            <TableRow className="bg-surface-subtle">
              <TableHead>Customer</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Region</TableHead>
              <TableHead>Occupation</TableHead>
              <TableHead>KYC</TableHead>
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
                  No customers match your filters.
                </TableCell>
              </TableRow>
            ) : (
              table.rows.map((c) => (
                <TableRow
                  key={c.id}
                  onClick={() => router.push(`/customers/${c.id}`)}
                  className="cursor-pointer hover:bg-surface-subtle"
                >
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div
                        className="flex size-[30px] flex-shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                        style={{ background: c.photo }}
                      >
                        {initials(c.name)}
                      </div>
                      <div>
                        <div className="text-[12.5px] font-semibold">{c.name}</div>
                        <div className="font-mono text-[11px] text-[#9a948a]">{c.id}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-[12.5px]">{c.phone}</TableCell>
                  <TableCell className="text-[12.5px] text-[#6f6a61]">{c.region}</TableCell>
                  <TableCell className="text-[12.5px] text-[#6f6a61]">{c.occupation}</TableCell>
                  <TableCell><StatusPill status={c.kyc} /></TableCell>
                  <TableCell><StatusPill status={c.status} /></TableCell>
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
