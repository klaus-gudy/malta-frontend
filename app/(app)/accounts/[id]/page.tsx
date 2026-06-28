"use client";

import * as React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useLoan, useCustomer, useProduct } from "@/hooks/queries";
import { useSession } from "@/lib/session";
import { can } from "@/lib/rbac";
import { fmtDate, money, schedule } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusPill } from "@/components/malta/status-pill";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AccountDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") ?? "schedule";
  const { role } = useSession();

  const { data: loan, isLoading } = useLoan(params.id);
  const { data: customer } = useCustomer(loan?.customer ?? "");
  const { data: product } = useProduct(loan?.product ?? "");

  function setTab(t: string) {
    router.replace(`/accounts/${params.id}?tab=${t}`, { scroll: false });
  }

  if (isLoading) return <Skeleton className="h-96 max-w-[1180px]" />;
  if (!loan || !product) return <div className="text-muted-foreground">Account not found.</div>;

  const sch = schedule(loan.principal, loan.rate, loan.term, loan.method, loan.disbursed);
  const paidRows = sch.slice(0, loan.paid);
  const outstanding = sch.slice(loan.paid).reduce((s, r) => s + r.total, 0);
  const paidAmt = paidRows.reduce((s, r) => s + r.total, 0);
  const progress = Math.round((loan.paid / loan.term) * 100);
  const nx = sch[loan.paid];

  const scheduleRows = sch.map((r, i) => {
    const status =
      i < loan.paid ? "Paid" : loan.status === "Overdue" && i === loan.paid ? "Overdue" : "Due";
    return { ...r, status };
  });

  const txns = paidRows
    .map((r, i) => ({
      date: fmtDate(r.due),
      ref: `RCP-${loan.id.slice(-4)}-${i + 1}`,
      method: loan.channel.includes("Bank") ? "Bank" : "Mobile money",
      amount: money(r.total),
    }))
    .reverse();

  const charges =
    loan.status === "Overdue"
      ? [{ date: fmtDate(nx ? nx.due : loan.disbursed), type: "Late payment penalty", amount: money(Math.round(nx ? nx.total * 0.05 : 0)) }]
      : [];

  const stats = [
    { label: "Principal", value: money(loan.principal), color: undefined },
    { label: "Repaid", value: money(paidAmt), color: "#047857" },
    { label: "Outstanding", value: money(outstanding), color: undefined },
    { label: "Progress", value: `${progress}%`, color: undefined },
  ];

  return (
    <div className="max-w-[1180px] animate-fade-up">
      <div className="mb-[18px] flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-[11px]">
            <div className="font-mono text-xl font-semibold">{loan.id}</div>
            <StatusPill status={loan.status} />
          </div>
          <div className="mt-1 text-[12.5px] text-[#7a756c]">
            {customer?.name} · {product.name}
          </div>
        </div>
        {can(role, "receivePayment") && loan.status !== "Closed" && (
          <Button onClick={() => router.push(`/collections/${loan.id}/pay`)}>
            Receive payment
          </Button>
        )}
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="px-4 py-3.5">
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.05em] text-[#9a948a]">{s.label}</div>
            <div className="mt-[5px] font-mono text-[17px] font-semibold" style={{ color: s.color }}>{s.value}</div>
          </Card>
        ))}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="charges">Charges</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule">
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-surface-subtle">
                  <TableHead>#</TableHead>
                  <TableHead>Due date</TableHead>
                  <TableHead className="text-right">Principal</TableHead>
                  <TableHead className="text-right">Interest</TableHead>
                  <TableHead className="text-right">Installment</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scheduleRows.map((r) => (
                  <TableRow key={r.n}>
                    <TableCell className="font-mono text-xs">{r.n}</TableCell>
                    <TableCell className="text-xs">{fmtDate(r.due)}</TableCell>
                    <TableCell className="text-right font-mono text-xs">{money(r.principal)}</TableCell>
                    <TableCell className="text-right font-mono text-xs">{money(r.interest)}</TableCell>
                    <TableCell className="text-right font-mono text-xs font-semibold">{money(r.total)}</TableCell>
                    <TableCell className="text-right font-mono text-xs text-[#9a948a]">{money(r.balance)}</TableCell>
                    <TableCell><StatusPill status={r.status} className="px-2 py-px text-[10.5px]" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-surface-subtle">
                  <TableHead>Date</TableHead>
                  <TableHead>Receipt</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {txns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                      No payments recorded yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  txns.map((t) => (
                    <TableRow key={t.ref}>
                      <TableCell className="text-[12.5px]">{t.date}</TableCell>
                      <TableCell className="font-mono text-xs">{t.ref}</TableCell>
                      <TableCell className="text-[12.5px] text-[#6f6a61]">{t.method}</TableCell>
                      <TableCell className="text-right font-mono text-[12.5px] font-semibold text-[#047857]">{t.amount}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="charges">
          <Card className="px-5 py-[18px]">
            <div className="mb-3 text-sm font-semibold">Accrued charges &amp; penalties</div>
            {charges.length === 0 ? (
              <div className="py-2 text-[12.5px] text-[#9a948a]">
                No penalties or additional charges accrued.
              </div>
            ) : (
              charges.map((ch, i) => (
                <div key={i} className="flex justify-between border-b border-table-row-border py-2.5 last:border-0">
                  <div>
                    <div className="text-[13px] font-medium">{ch.type}</div>
                    <div className="text-[11.5px] text-[#9a948a]">{ch.date}</div>
                  </div>
                  <div className="font-mono text-[13px] font-semibold text-destructive">{ch.amount}</div>
                </div>
              ))
            )}
          </Card>
        </TabsContent>

        <TabsContent value="notes">
          <Card className="px-5 py-[18px]">
            <div className="mb-3 text-sm font-semibold">Account notes</div>
            <Textarea rows={3} placeholder="Add a collection note, restructuring note, or follow-up…" />
            <Button className="mt-2.5 h-[34px] bg-[#1f1d1a]" size="sm">Add note</Button>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
