"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  useApplication,
  useAudit,
  useCustomer,
  useProduct,
  usePatchApplication,
} from "@/hooks/queries";
import { useSession } from "@/lib/session";
import { can } from "@/lib/rbac";
import { fmtDate, money, schedule } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { StatusPill } from "@/components/malta/status-pill";
import { Fact } from "@/components/malta/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function ApplicationDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { role } = useSession();

  const { data: app, isLoading } = useApplication(params.id);
  const { data: customer } = useCustomer(app?.customer ?? "");
  const { data: product } = useProduct(app?.product ?? "");
  const { data: audit } = useAudit(params.id);
  const patch = usePatchApplication();

  if (isLoading) return <Skeleton className="h-96 max-w-[1180px]" />;
  if (!app) return <div className="text-muted-foreground">Application not found.</div>;

  const sch = product ? schedule(app.amount, product.rate, app.term, product.method) : [];
  const installment = sch[0]?.total ?? 0;
  const totalRepay = sch.reduce((s, r) => s + r.total, 0);
  const dsr = customer ? Math.round((installment / customer.monthlyIncome) * 100) : 0;
  const dsrColor = dsr < 45 ? "#047857" : dsr < 60 ? "#b45309" : "#b91c1c";

  const isDraft = app.status === "Draft";
  const canDecide = can(role, "approve") && ["Submitted", "Under Review"].includes(app.status);
  const canReview = can(role, "approve") && app.status === "Submitted";
  const isApproved = app.status === "Approved";

  const facts = [
    { k: "Borrower", val: customer?.name ?? "—" },
    { k: "Product", val: product?.name ?? "—" },
    { k: "Requested amount", val: money(app.amount) },
    { k: "Tenure", val: `${app.term} months` },
    { k: "Repayment", val: product?.freq ?? "—" },
    { k: "Interest", val: product ? `${product.rate}% ${product.method}` : "—" },
    { k: "Purpose", val: app.purpose },
  ];

  const trail =
    audit ??
    [{ actor: app.officer, role: "Loan Officer", action: "Application created", detail: "Draft started", time: `${app.created} 09:00` }];

  return (
    <div className="max-w-[1180px] animate-fade-up">
      <div className="mb-[18px] flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-[11px]">
            <div className="font-mono text-xl font-semibold">{app.id}</div>
            <StatusPill status={app.status} />
          </div>
          <div className="mt-1 text-[12.5px] text-[#7a756c]">
            <button
              onClick={() => customer && router.push(`/customers/${customer.id}`)}
              className="cursor-pointer font-medium text-primary-dark"
            >
              {customer?.name}
            </button>{" "}
            · {product?.name} · created {fmtDate(app.created)}
          </div>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {isDraft && (
            <Button onClick={() => router.push(`/applications/${app.id}/draft`)}>
              Continue draft
            </Button>
          )}
          {canReview && (
            <Button
              variant="outline"
              onClick={() =>
                patch.mutate(
                  { id: app.id, patch: { status: "Under Review" } },
                  { onSuccess: () => toast("Moved to Under Review") },
                )
              }
            >
              Move to review
            </Button>
          )}
          {canDecide && (
            <>
              <Button variant="outline" onClick={() => toast("Clarification requested from loan officer")}>
                Request clarification
              </Button>
              <Button
                variant="outline"
                className="border-[#e7c5c5] text-destructive"
                onClick={() =>
                  patch.mutate(
                    { id: app.id, patch: { status: "Rejected" } },
                    { onSuccess: () => toast("Application rejected") },
                  )
                }
              >
                Reject
              </Button>
              <Button
                className="bg-[#047857]"
                onClick={() =>
                  patch.mutate(
                    { id: app.id, patch: { status: "Approved" } },
                    {
                      onSuccess: () => {
                        toast("Application approved");
                        router.push("/disbursements");
                      },
                    },
                  )
                }
              >
                Approve
              </Button>
            </>
          )}
          {isApproved && (
            <Button onClick={() => router.push(`/disbursements/${app.id}`)}>
              Proceed to disbursement →
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="flex flex-col gap-4">
          <Card className="px-5 py-[18px]">
            <div className="mb-3.5 text-sm font-semibold">Application details</div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              {facts.map((f) => (
                <Fact key={f.k} k={f.k}>{f.val}</Fact>
              ))}
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="border-b border-table-border px-4 py-3 text-sm font-semibold">
              Proposed repayment schedule{" "}
              <span className="text-xs font-normal text-[#9a948a]">(first 6 of schedule)</span>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="bg-surface-subtle">
                  <TableHead>#</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead className="text-right">Principal</TableHead>
                  <TableHead className="text-right">Interest</TableHead>
                  <TableHead className="text-right">Installment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sch.slice(0, 6).map((r) => (
                  <TableRow key={r.n}>
                    <TableCell className="font-mono text-xs">{r.n}</TableCell>
                    <TableCell className="text-xs">{fmtDate(r.due)}</TableCell>
                    <TableCell className="text-right font-mono text-xs">{money(r.principal)}</TableCell>
                    <TableCell className="text-right font-mono text-xs">{money(r.interest)}</TableCell>
                    <TableCell className="text-right font-mono text-xs font-semibold">{money(r.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          <Card className="px-5 py-[18px]">
            <div className="mb-3 text-sm font-semibold">Assessor findings</div>
            <Textarea rows={3} placeholder="Record affordability assessment, collateral notes, recommendation…" />
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card className="px-[18px] py-4">
            <div className="mb-[11px] text-[11px] font-semibold uppercase tracking-[0.05em] text-[#9a948a]">
              Affordability
            </div>
            <div className="flex items-baseline gap-[7px]">
              <div className="font-mono text-3xl font-semibold" style={{ color: dsrColor }}>
                {dsr}%
              </div>
              <div className="text-xs text-[#9a948a]">debt-service ratio</div>
            </div>
            <div className="mt-3 flex justify-between text-[12.5px]">
              <span className="text-[#6f6a61]">Est. installment</span>
              <span className="font-mono">{money(installment)}</span>
            </div>
            <div className="mt-1.5 flex justify-between text-[12.5px]">
              <span className="text-[#6f6a61]">Total repayable</span>
              <span className="font-mono">{money(totalRepay)}</span>
            </div>
          </Card>

          <Card className="px-[18px] py-4">
            <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#9a948a]">
              Audit trail
            </div>
            {trail.map((t, i) => (
              <div key={i} className="flex gap-[11px] pb-3.5 last:pb-0">
                <div className="flex flex-col items-center">
                  <div className="mt-1 size-2 rounded-full bg-primary" />
                  {i < trail.length - 1 && <div className="mt-[3px] w-px flex-1 bg-table-border" />}
                </div>
                <div className="min-w-0">
                  <div className="text-[12.5px] font-semibold">{t.action}</div>
                  <div className="mt-px text-[11.5px] text-[#6f6a61]">{t.detail}</div>
                  <div className="mt-0.5 text-[11px] text-[#a8a298]">
                    {t.actor} · {t.role} · {t.time}
                  </div>
                </div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
