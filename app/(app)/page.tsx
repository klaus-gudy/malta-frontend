"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDashboard } from "@/hooks/queries";
import { useSession, useRoleMeta } from "@/lib/session";
import { can } from "@/lib/rbac";
import { fmtDate, money, moneyShort } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { StatusPill } from "@/components/malta/status-pill";
import { ActivityTimeline } from "@/components/malta/activity-timeline";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const today = () => new Date().toISOString().slice(0, 10);

export default function DashboardPage() {
  const router = useRouter();
  const { role } = useSession();
  const meta = useRoleMeta();

  // Date range drives the snapshot. Defaults to today.
  const [from, setFrom] = React.useState(today);
  const [to, setTo] = React.useState(today);
  const { data, isLoading } = useDashboard(from, to);

  const [greeting, setGreeting] = React.useState("Good morning");
  const [todayLabel, setTodayLabel] = React.useState("");
  React.useEffect(() => {
    const now = new Date();
    const h = now.getHours();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot browser-time sync
    setGreeting(h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTodayLabel(
      now.toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    );
  }, []);

  const isToday = from === today() && to === today();
  const m = data?.metrics;

  const kpis = [
    {
      label: "Portfolio outstanding",
      value: m ? moneyShort(m.outstanding) : "—",
      delta: m ? `${m.activeLoans} active loans` : "",
      color: "#6f6a61",
    },
    {
      label: "Active loans",
      value: m ? String(m.activeLoans) : "—",
      delta: m
        ? `${m.disbursedCount} disbursed ${isToday ? "today" : "in range"}`
        : "",
      color: "#047857",
    },
    {
      label: "Pending approvals",
      value: m ? String(m.pendingApprovals) : "—",
      delta: m ? `${m.newApplications} new ${isToday ? "today" : "in range"}` : "",
      color: "#b45309",
    },
    {
      label: isToday ? "Collected today" : "Collected in range",
      value: m ? moneyShort(m.collected) : "—",
      delta: m ? `${m.receipts} receipt${m.receipts === 1 ? "" : "s"} issued` : "",
      color: "#047857",
    },
  ];

  const perf = data?.productPerformance ?? [];
  const maxDisbursed = Math.max(1, ...perf.map((p) => p.disbursed));

  function resetToday() {
    setFrom(today());
    setTo(today());
  }

  return (
    <div className="max-w-[1340px] animate-fade-up">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[21px] font-semibold tracking-[-0.01em]">
            {greeting}, {meta.name.split(" ")[0]}
          </div>
          <div className="mt-[3px] text-[13px] text-[#7a756c]">
            {todayLabel} · {meta.branch} branch · Here&apos;s your operational
            snapshot.
          </div>
        </div>
        <div className="flex gap-2.5">
          {role === "cashier" ? (
            <Button onClick={() => router.push("/accounts")}>
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

      {/* Date range filter */}
      <Card className="mb-[18px] flex flex-wrap items-end gap-4 px-4 py-3.5">
        <div>
          <div className="mb-1 text-[10.5px] font-semibold uppercase tracking-[0.05em] text-[#9a948a]">
            From
          </div>
          <Input
            type="date"
            className="h-9 w-[160px]"
            value={from}
            max={to}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div>
          <div className="mb-1 text-[10.5px] font-semibold uppercase tracking-[0.05em] text-[#9a948a]">
            To
          </div>
          <Input
            type="date"
            className="h-9 w-[160px]"
            value={to}
            min={from}
            max={today()}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
        <Button variant="outline" className="h-9" onClick={resetToday} disabled={isToday}>
          Today
        </Button>
        <div className="ml-auto self-center text-[11.5px] text-[#9a948a]">
          Snapshot {isToday ? "for today" : `${fmtDate(from)} – ${fmtDate(to)}`}
        </div>
      </Card>

      {/* KPIs */}
      <div className="mb-[18px] grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
        {kpis.map((k) => (
          <Card key={k.label} className="px-4 py-[15px]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#9a948a]">
              {k.label}
            </div>
            {isLoading ? (
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
        {/* Recent applications */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-table-border px-4 py-3">
            <div className="text-sm font-semibold">Recent applications</div>
            <Link href="/applications" className="text-xs font-medium text-primary-dark">
              View all →
            </Link>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="bg-surface-subtle">
                <TableHead>Borrower</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={4}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : (data?.recentApplications ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                    No applications in this range.
                  </TableCell>
                </TableRow>
              ) : (
                (data?.recentApplications ?? []).map((a) => (
                  <TableRow
                    key={a.id}
                    onClick={() => router.push(`/applications/${a.id}`)}
                    className="cursor-pointer hover:bg-surface-subtle"
                  >
                    <TableCell>
                      <div className="text-[12.5px] font-semibold">{a.customer}</div>
                      <div className="font-mono text-[11px] text-[#9a948a]">{a.id}</div>
                    </TableCell>
                    <TableCell className="font-mono text-[12.5px]">{money(a.amount)}</TableCell>
                    <TableCell className="text-xs text-[#6f6a61]">{a.product}</TableCell>
                    <TableCell><StatusPill status={a.status} /></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        <div className="flex flex-col gap-4">
          {/* Product performance */}
          <Card className="px-4 py-[15px]">
            <div className="mb-1 text-sm font-semibold">Product performance</div>
            <div className="mb-3 text-[11px] text-[#9a948a]">
              Applications &amp; amount disbursed per product.
            </div>
            {isLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : perf.length === 0 ? (
              <div className="py-4 text-center text-xs text-muted-foreground">
                No product activity.
              </div>
            ) : (
              perf.map((p) => (
                <div key={p.id} className="mb-3 last:mb-0">
                  <div className="mb-1 flex items-baseline justify-between gap-2">
                    <span className="truncate text-[12.5px] font-medium">{p.name}</span>
                    <span className="flex-shrink-0 font-mono text-[12px] font-semibold">
                      {moneyShort(p.disbursed)}
                    </span>
                  </div>
                  <Progress
                    value={Math.round((p.disbursed / maxDisbursed) * 100)}
                    indicatorStyle={{ background: "#8a6d3f" }}
                  />
                  <div className="mt-1 text-[11px] text-[#9a948a]">
                    {p.applications} application{p.applications === 1 ? "" : "s"} ·{" "}
                    {p.activeLoans} active loan{p.activeLoans === 1 ? "" : "s"}
                  </div>
                </div>
              ))
            )}
          </Card>

          {/* Live activity */}
          <Card className="px-4 py-[15px]">
            <div className="mb-3 text-sm font-semibold">Recent activity</div>
            {isLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <ActivityTimeline
                entries={data?.recentActivity ?? []}
                empty="No recent activity."
              />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
