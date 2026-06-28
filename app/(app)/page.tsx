"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApplications, useCustomers, useLoans, useProducts } from "@/hooks/queries";
import { useSession, useRoleMeta } from "@/lib/session";
import { can } from "@/lib/rbac";
import { fmtDate, money, moneyShort, pillStyle, schedule } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import type { Customer, Product } from "@/lib/types";

export default function DashboardPage() {
  const router = useRouter();
  const { role } = useSession();
  const meta = useRoleMeta();
  const { data: loans, isLoading: loadingLoans } = useLoans();
  const { data: applications } = useApplications();
  const { data: customers } = useCustomers();
  const { data: products } = useProducts();

  // Default matches SSR; the real time-of-day greeting is applied after mount
  // to avoid a hydration mismatch on the statically-prerendered page.
  const [greeting, setGreeting] = React.useState("Good morning");
  React.useEffect(() => {
    const h = new Date().getHours();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot browser-time sync
    setGreeting(h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening");
  }, []);

  const custMap = React.useMemo(
    () => new Map((customers ?? []).map((c) => [c.id, c])),
    [customers],
  );
  const prodMap = React.useMemo(
    () => new Map((products ?? []).map((p) => [p.id, p])),
    [products],
  );
  const cust = (id: string): Customer | undefined => custMap.get(id);
  const prod = (id: string): Product | undefined => prodMap.get(id);

  const portfolio = (loans ?? [])
    .filter((l) => l.status !== "Closed")
    .reduce((s, l) => s + l.principal, 0);

  const pendingApprovals = (applications ?? []).filter((a) =>
    ["Submitted", "Under Review"].includes(a.status),
  ).length;

  const kpis = [
    { label: "Portfolio outstanding", value: moneyShort(portfolio), delta: "▲ 4.2% vs last month", color: "#047857" },
    { label: "Active loans", value: String((loans ?? []).filter((l) => l.status === "Active").length * 121), delta: "62 disbursed this month", color: "#6f6a61" },
    { label: "PAR > 30 days", value: "6.8%", delta: "▲ 0.4 pts — watch", color: "#b45309" },
    { label: "Pending approvals", value: String(pendingApprovals), delta: "2 awaiting your review", color: "#b45309" },
    { label: "Collected today", value: moneyShort(2840000), delta: "14 receipts issued", color: "#047857" },
  ];

  // role-aware primary queue
  type QRow = { name: string; id: string; amount: string; meta: string; status: string; href: string };
  let queueTitle = "";
  let queueCols: string[] = [];
  let queueRows: QRow[] = [];
  let queueAll = "/applications";

  if (role === "cashier") {
    queueTitle = "Due & overdue today";
    queueCols = ["Borrower", "Installment", "Due", "Status"];
    queueRows = (loans ?? [])
      .filter((l) => l.status !== "Closed")
      .map((l) => {
        const c = cust(l.customer);
        const sch = schedule(l.principal, l.rate, l.term, l.method, l.disbursed);
        const nx = sch[l.paid] || sch[sch.length - 1];
        return { name: c?.name ?? "—", id: l.id, amount: money(nx.total), meta: fmtDate(nx.due), status: l.status === "Overdue" ? "Overdue" : "Due", href: `/collections/${l.id}/pay` };
      });
    queueAll = "/collections";
  } else if (role === "operations") {
    queueTitle = "Awaiting disbursement";
    queueCols = ["Borrower", "Amount", "Product", "Status"];
    queueRows = (applications ?? [])
      .filter((a) => a.status === "Approved")
      .map((a) => {
        const c = cust(a.customer);
        return { name: c?.name ?? "—", id: a.id, amount: money(a.amount), meta: prod(a.product)?.name ?? "—", status: "Ready", href: `/disbursements/${a.id}` };
      });
    queueAll = "/disbursements";
  } else if (role === "manager" || role === "admin") {
    queueTitle = "Applications awaiting decision";
    queueCols = ["Borrower", "Amount", "Officer", "Status"];
    queueRows = (applications ?? [])
      .filter((a) => ["Submitted", "Under Review"].includes(a.status))
      .map((a) => {
        const c = cust(a.customer);
        return { name: c?.name ?? "—", id: a.id, amount: money(a.amount), meta: a.officer, status: a.status, href: `/applications/${a.id}?from=approvals` };
      });
    queueAll = "/approvals";
  } else {
    queueTitle = "My recent applications";
    queueCols = ["Borrower", "Amount", "Created", "Status"];
    queueRows = (applications ?? []).map((a) => {
      const c = cust(a.customer);
      return { name: c?.name ?? "—", id: a.id, amount: money(a.amount), meta: fmtDate(a.created), status: a.status, href: `/applications/${a.id}` };
    });
    queueAll = "/applications";
  }
  queueRows = queueRows.slice(0, 5);

  const agingBars = [
    { label: "Current", amount: moneyShort(portfolio * 0.88), pct: 88, color: "#047857" },
    { label: "1–30 days", amount: moneyShort(portfolio * 0.06), pct: 30, color: "#b45309" },
    { label: "31–60 days", amount: moneyShort(portfolio * 0.03), pct: 16, color: "#d97706" },
    { label: "61–90 days", amount: moneyShort(portfolio * 0.02), pct: 10, color: "#dc2626" },
    { label: "90+ days", amount: moneyShort(portfolio * 0.01), pct: 6, color: "#991b1b" },
  ];

  const activity = [
    { color: "#047857", text: "Payment of TZS 145,000 received — LN-2026-0188", time: "08:42 · Halima N." },
    { color: "#1d4ed8", text: "Application LAP-2026-0041 submitted for review", time: "08:20 · Amina H." },
    { color: "#b45309", text: "KYC pending for Neema Kessy (CUS-1003)", time: "07:55 · System" },
    { color: "#dc2626", text: "LN-2026-0177 flagged overdue — 18 days", time: "07:30 · System" },
  ];

  return (
    <div className="max-w-[1340px] animate-fade-up">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[21px] font-semibold tracking-[-0.01em]">
            {greeting}, {meta.name.split(" ")[0]}
          </div>
          <div className="mt-[3px] text-[13px] text-[#7a756c]">
            Monday, 23 June 2026 · {meta.branch} branch · Here&apos;s your
            operational snapshot.
          </div>
        </div>
        <div className="flex gap-2.5">
          {role === "cashier" ? (
            <Button onClick={() => router.push("/collections")}>
              + Receive payment
            </Button>
          ) : (
            <>
              {can(role, "createApplication") && (
                <Button onClick={() => router.push("/applications/new")}>
                  + New application
                </Button>
              )}
              {can(role, "createCustomer") && (
                <Button variant="outline" onClick={() => router.push("/customers/new")}>
                  + Register customer
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="mb-[18px] grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-3">
        {kpis.map((k) => (
          <Card key={k.label} className="px-4 py-[15px]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#9a948a]">
              {k.label}
            </div>
            {loadingLoans ? (
              <Skeleton className="mt-2.5 h-6 w-24" />
            ) : (
              <div className="mt-2.5 font-mono text-[23px] font-semibold">
                {k.value}
              </div>
            )}
            <div className="mt-[5px] text-[11.5px]" style={{ color: k.color }}>
              {k.delta}
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1.6fr_1fr]">
        {/* Primary queue */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-table-border px-4 py-3">
            <div className="text-sm font-semibold">{queueTitle}</div>
            <Link href={queueAll} className="text-xs font-medium text-primary-dark">
              View all →
            </Link>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="bg-surface-subtle">
                {queueCols.map((c) => (
                  <TableHead key={c}>{c}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {queueRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                    Nothing in this queue.
                  </TableCell>
                </TableRow>
              ) : (
                queueRows.map((row) => (
                  <TableRow
                    key={row.id}
                    onClick={() => router.push(row.href)}
                    className="cursor-pointer hover:bg-surface-subtle"
                  >
                    <TableCell>
                      <div className="text-[12.5px] font-semibold">{row.name}</div>
                      <div className="font-mono text-[11px] text-[#9a948a]">{row.id}</div>
                    </TableCell>
                    <TableCell className="font-mono text-[12.5px]">{row.amount}</TableCell>
                    <TableCell className="text-xs text-[#6f6a61]">{row.meta}</TableCell>
                    <TableCell>
                      <span
                        className="inline-block rounded-full px-[9px] py-0.5 text-[11px] font-semibold"
                        style={pillStyle(row.status)}
                      >
                        {row.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        <div className="flex flex-col gap-4">
          {/* PAR */}
          <Card className="px-4 py-[15px]">
            <div className="mb-3 text-sm font-semibold">Portfolio at risk (PAR)</div>
            {agingBars.map((b) => (
              <div key={b.label} className="mb-[11px]">
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-[#6f6a61]">{b.label}</span>
                  <span className="font-mono font-semibold">{b.amount}</span>
                </div>
                <Progress
                  value={b.pct}
                  indicatorStyle={{ background: b.color }}
                />
              </div>
            ))}
          </Card>

          {/* Activity */}
          <Card className="px-4 py-[15px]">
            <div className="mb-[11px] text-sm font-semibold">Today&apos;s activity</div>
            {activity.map((f, i) => (
              <div key={i} className="flex gap-2.5 border-b border-table-row-border py-[7px] last:border-0">
                <div className="mt-[5px] size-[7px] flex-shrink-0 rounded-full" style={{ background: f.color }} />
                <div className="min-w-0">
                  <div className="text-[12.5px] leading-[1.4]">{f.text}</div>
                  <div className="mt-px text-[11px] text-[#a8a298]">{f.time}</div>
                </div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
