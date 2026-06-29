"use client";

import * as React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  useLoan,
  useCustomer,
  useProduct,
  useLoanSchedule,
  useLoanPayments,
  useLoanCharges,
  useLoanSummary,
} from "@/hooks/queries";
import { useSession } from "@/lib/session";
import { can } from "@/lib/rbac";
import { fmtDate, money } from "@/lib/format";
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
  // Repayment schedule, transactions, charges and metrics — from the backend.
  const { data: scheduleRows } = useLoanSchedule(params.id);
  const { data: payments } = useLoanPayments(params.id);
  const { data: charges } = useLoanCharges(params.id);
  const { data: summary } = useLoanSummary(params.id);

  function setTab(t: string) {
    router.replace(`/accounts/${params.id}?tab=${t}`, { scroll: false });
  }

  if (isLoading) return <Skeleton className="h-96 max-w-[1180px]" />;
  if (!loan || !product) return <div className="text-muted-foreground">Account not found.</div>;

  const sched = scheduleRows ?? [];

  const stats = [
    { label: "Principal", value: money(summary?.principal ?? loan.principal), color: undefined },
    { label: "Repaid", value: money(summary?.repaid ?? 0), color: "#047857" },
    { label: "Outstanding", value: money(summary?.outstanding ?? 0), color: undefined },
    {
      label: "Progress",
      value: `${summary?.progress ?? 0}%`,
      color: (summary?.progress ?? 0) > 100 ? "#1d4ed8" : undefined,
    },
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

      {summary && summary.overpaid > 0 && (
        <Card className="mb-4 flex flex-wrap items-center justify-between gap-3 border-[#bcd0f5] bg-[#eef3fd] px-5 py-4">
          <div>
            <div className="flex items-center gap-2 text-[13px] font-semibold text-[#1d4ed8]">
              <span className="flex size-5 items-center justify-center rounded-full bg-[#1d4ed8] text-[11px] text-white">✓</span>
              Loan overpaid — credit balance
            </div>
            <div className="mt-1 text-[12px] text-[#475569]">
              This account has been paid beyond the total billed
              ({money(summary.totalBilled)}). The surplus can be refunded or
              applied to a future loan.
            </div>
          </div>
          <div className="flex gap-6">
            <div className="text-right">
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.05em] text-[#9a948a]">Total paid</div>
              <div className="mt-0.5 font-mono text-[15px] font-semibold">{money(summary.totalPaid)}</div>
            </div>
            <div className="text-right">
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.05em] text-[#9a948a]">Credit balance</div>
              <div className="mt-0.5 font-mono text-[17px] font-semibold text-[#1d4ed8]">{money(summary.overpaid)}</div>
            </div>
          </div>
        </Card>
      )}

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
                {sched.map((r) => (
                  <TableRow key={r.n}>
                    <TableCell className="font-mono text-xs">{r.n}</TableCell>
                    <TableCell className="text-xs">{fmtDate(r.dueDate)}</TableCell>
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
                {(payments ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                      No payments recorded yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  (payments ?? []).map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="text-[12.5px]">{fmtDate(t.date)}</TableCell>
                      <TableCell className="font-mono text-xs">{t.id}</TableCell>
                      <TableCell className="text-[12.5px] text-[#6f6a61]">{t.method}</TableCell>
                      <TableCell className="text-right font-mono text-[12.5px] font-semibold text-[#047857]">{money(t.amount)}</TableCell>
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
            {(charges ?? []).length === 0 ? (
              <div className="py-2 text-[12.5px] text-[#9a948a]">
                No penalties or additional charges accrued.
              </div>
            ) : (
              (charges ?? []).map((ch) => (
                <div key={ch.id} className="flex items-center justify-between border-b border-table-row-border py-2.5 last:border-0">
                  <div>
                    <div className="text-[13px] font-medium">
                      {ch.type}
                      {ch.installmentN > 0 && (
                        <span className="text-[#9a948a]"> · installment #{ch.installmentN}</span>
                      )}
                    </div>
                    <div className="text-[11.5px] text-[#9a948a]">{fmtDate(ch.date)}</div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <StatusPill status={ch.status} className="px-2 py-px text-[10.5px]" />
                    <div className="font-mono text-[13px] font-semibold text-destructive">{money(ch.amount)}</div>
                  </div>
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
