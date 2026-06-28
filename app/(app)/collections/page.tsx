"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useLoans, useCustomers } from "@/hooks/queries";
import { useSession } from "@/lib/session";
import { can } from "@/lib/rbac";
import { useTable } from "@/hooks/use-table";
import { fmtDate, inRange, money, moneyShort, schedule } from "@/lib/format";
import { PageHeader } from "@/components/malta/page-header";
import { DataPagination } from "@/components/malta/data-pagination";
import { StatusPill } from "@/components/malta/status-pill";
import { TableToolbar } from "@/components/malta/table-toolbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ColRow {
  id: string;
  name: string;
  phone: string;
  amount: string;
  due: string;
  dueIso: string;
  bucket: string;
  status: string;
}

export default function CollectionsPage() {
  const router = useRouter();
  const { role } = useSession();
  const { data: loans } = useLoans();
  const { data: customers } = useCustomers();

  const active = React.useMemo(
    () => (loans ?? []).filter((l) => l.status !== "Closed"),
    [loans],
  );
  const overdue = active.filter((l) => l.status === "Overdue");

  const buckets = [
    { label: "Current", count: active.filter((l) => l.status === "Active").length, amount: moneyShort(active.filter((l) => l.status === "Active").reduce((s, l) => s + l.principal * 0.4, 0)), color: "#047857" },
    { label: "1–30 days", count: overdue.length, amount: moneyShort(overdue.reduce((s, l) => s + l.principal * 0.2, 0)), color: "#b45309" },
    { label: "31–60 days", count: 0, amount: "TZS 0", color: "#d97706" },
    { label: "61–90 days", count: 0, amount: "TZS 0", color: "#dc2626" },
    { label: "90+ days", count: 0, amount: "TZS 0", color: "#991b1b" },
  ];

  const rows: ColRow[] = React.useMemo(
    () =>
      active.map((l) => {
        const c = customers?.find((cu) => cu.id === l.customer);
        const sch = schedule(l.principal, l.rate, l.term, l.method, l.disbursed);
        const nx = sch[l.paid] || sch[sch.length - 1];
        const od = l.status === "Overdue";
        return {
          id: l.id,
          name: c?.name ?? "—",
          phone: c?.phone ?? "",
          amount: money(nx.total),
          due: fmtDate(nx.due),
          dueIso: nx.due,
          bucket: od ? "1–30 days" : "Current",
          status: od ? "Overdue" : "Current",
        };
      }),
    [active, customers],
  );

  const table = useTable<ColRow>(
    rows,
    React.useCallback((r, s) => {
      const q = s.q.toLowerCase();
      return (
        (!q || r.id.toLowerCase().includes(q) || r.name.toLowerCase().includes(q) || r.phone.includes(q)) &&
        (s.status === "All" || r.bucket === s.status) &&
        inRange(r.dueIso, s.from, s.to)
      );
    }, []),
  );

  const canPay = can(role, "receivePayment");

  return (
    <div className="max-w-[1340px] animate-fade-up">
      <PageHeader title="Collections & delinquency" subtitle="Due & overdue installments by aging bucket" />

      <div className="mb-[18px] grid grid-cols-2 gap-3 sm:grid-cols-5">
        {buckets.map((b) => (
          <Card key={b.label} className="px-3.5 py-3.5" style={{ borderTopWidth: 3, borderTopColor: b.color }}>
            <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#9a948a]">{b.label}</div>
            <div className="mt-1.5 font-mono text-[17px] font-semibold">{b.amount}</div>
            <div className="mt-0.5 text-[11.5px] text-[#6f6a61]">{b.count} accounts</div>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-table-border px-4 py-3 text-sm font-semibold">Repayment worklist</div>
        <TableToolbar
          table={table}
          searchPlaceholder="Search account, borrower or phone…"
          statusOptions={["All", "Current", "1–30 days", "31–60 days", "61–90 days", "90+ days"]}
          dateLabel="Due"
        />
        <Table>
          <TableHeader>
            <TableRow className="bg-surface-subtle">
              <TableHead>Account</TableHead>
              <TableHead>Borrower</TableHead>
              <TableHead>Due</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Bucket</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {table.rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-mono text-[12.5px] font-semibold">{r.id}</TableCell>
                <TableCell>
                  <div className="text-[12.5px] font-medium">{r.name}</div>
                  <div className="font-mono text-[11px] text-[#9a948a]">{r.phone}</div>
                </TableCell>
                <TableCell className="text-[12.5px]">{r.due}</TableCell>
                <TableCell className="font-mono text-[12.5px]">{r.amount}</TableCell>
                <TableCell><StatusPill status={r.bucket === "Current" ? "Current" : "Overdue"} label={r.bucket} /></TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex gap-1.5">
                    <Button variant="outline" size="sm" onClick={() => toast(`Promise-to-pay logged for ${r.name}`)}>
                      Promise-to-pay
                    </Button>
                    {canPay && (
                      <Button size="sm" onClick={() => router.push(`/collections/${r.id}/pay`)}>
                        Receive
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <DataPagination table={table} />
      </Card>
    </div>
  );
}
