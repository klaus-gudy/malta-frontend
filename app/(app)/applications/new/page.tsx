"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useCustomers, useProducts, useCreateApplication } from "@/hooks/queries";
import { useSession } from "@/lib/session";
import { money, schedule } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field } from "@/components/malta/form";

const steps = [
  { n: 1, label: "Borrower & product" },
  { n: 2, label: "Loan terms" },
  { n: 3, label: "Documents" },
  { n: 4, label: "Review & submit" },
];

export default function ApplicationNewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { role } = useSession();
  const { data: customers } = useCustomers();
  const { data: products } = useProducts();
  const create = useCreateApplication();

  const [step, setStep] = React.useState(1);
  const [form, setForm] = React.useState<Record<string, string>>({
    naCustomer: searchParams.get("customer") ?? "",
    naProduct: "",
    naAmount: "",
    naTerm: "",
    naPurpose: "",
  });

  const set = (k: string) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const custOpts = (customers ?? []).filter((c) => c.status === "Active");
  const prodOpts = (products ?? []).filter((p) => p.status === "Active");
  const product = products?.find((p) => p.id === form.naProduct);
  const customer = customers?.find((c) => c.id === form.naCustomer);

  const amount = Number(form.naAmount || 0);
  const term = Number(form.naTerm || product?.minTerm || 9);

  const preview =
    amount && product
      ? (() => {
          const sch = schedule(amount, product.rate, term, product.method);
          return {
            totalReq: money(amount),
            installment: money(sch[0].total),
            total: money(sch.reduce((s, r) => s + r.total, 0)),
          };
        })()
      : { totalReq: "—", installment: "—", total: "—" };

  const dsr =
    amount && customer
      ? Math.round((amount / term / customer.monthlyIncome) * 100) + "%"
      : "—";

  function next() {
    if (step === 1 && (!form.naCustomer || !form.naProduct)) {
      toast("Select a borrower and product");
      return;
    }
    if (step === 2 && !form.naAmount) {
      toast("Enter requested amount");
      return;
    }
    setStep((s) => Math.min(4, s + 1));
  }

  function submit() {
    create.mutate(
      {
        input: {
          customer: form.naCustomer,
          product: form.naProduct,
          amount,
          term,
          purpose: form.naPurpose,
          status: "Submitted",
        },
        role,
      },
      {
        onSuccess: (app) => {
          toast(`Application ${app.id} submitted`);
          router.push(`/applications/${app.id}`);
        },
      },
    );
  }

  function saveDraft() {
    create.mutate(
      {
        input: {
          customer: form.naCustomer || custOpts[0]?.id || "",
          product: form.naProduct || prodOpts[0]?.id || "",
          amount,
          term,
          purpose: form.naPurpose,
          status: "Draft",
        },
        role,
      },
      {
        onSuccess: (app) => {
          toast(`Draft ${app.id} saved`);
          router.push("/applications");
        },
      },
    );
  }

  return (
    <div className="max-w-[980px] animate-fade-up">
      <div className="mb-4 text-xl font-semibold">New loan application</div>

      {/* Step indicator */}
      <Card className="mb-5 flex gap-0 p-1.5">
        {steps.map((s) => {
          const active = s.n === step;
          const done = s.n < step;
          return (
            <div
              key={s.n}
              className={cn(
                "flex flex-1 items-center gap-2.5 rounded-md px-3 py-2.5",
                active && "bg-[#fbf0df]",
              )}
            >
              <div
                className="flex size-[22px] flex-shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                style={{ background: active || done ? "#b45309" : "#cfc9bf" }}
              >
                {s.n}
              </div>
              <span
                className="text-xs font-semibold"
                style={{ color: active ? "#92400e" : done ? "#1a1a1a" : "#9a948a" }}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </Card>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Card className="px-6 py-[22px]">
          {step === 1 && (
            <>
              <div className="mb-3.5 text-sm font-semibold">Borrower &amp; product</div>
              <Field label="Select borrower" required className="mb-3.5">
                <Select value={form.naCustomer} onValueChange={set("naCustomer")}>
                  <SelectTrigger><SelectValue placeholder="— choose customer —" /></SelectTrigger>
                  <SelectContent>
                    {custOpts.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name} · {c.id}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Loan product" required>
                <Select value={form.naProduct} onValueChange={set("naProduct")}>
                  <SelectTrigger><SelectValue placeholder="— choose product —" /></SelectTrigger>
                  <SelectContent>
                    {prodOpts.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name} ({p.rate}%)</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </>
          )}

          {step === 2 && (
            <>
              <div className="mb-3.5 text-sm font-semibold">Loan terms</div>
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <Field label="Requested amount (TZS)" required>
                  <Input className="font-mono" value={form.naAmount} onChange={(e) => set("naAmount")(e.target.value)} />
                </Field>
                <Field label="Tenure (months)">
                  <Input className="font-mono" value={form.naTerm} onChange={(e) => set("naTerm")(e.target.value)} />
                </Field>
              </div>
              <Field label="Loan purpose" className="mt-3.5">
                <Textarea rows={3} value={form.naPurpose} onChange={(e) => set("naPurpose")(e.target.value)} />
              </Field>
            </>
          )}

          {step === 3 && (
            <>
              <div className="mb-3.5 text-sm font-semibold">Supporting documents</div>
              <div className="rounded-lg border-2 border-dashed border-input bg-surface-subtle p-7 text-center">
                <div className="text-2xl text-[#b3ada3]">↑</div>
                <div className="mt-1.5 text-[13px] font-semibold">
                  Drag files here or click to upload
                </div>
                <div className="mt-1 text-[11.5px] text-[#9a948a]">
                  NIDA, business records, collateral photos · PDF/JPG up to 10 MB
                </div>
              </div>
              <div className="mt-3 flex flex-col gap-[7px]">
                {["nida_copy.jpg", "business_records.pdf"].map((f) => (
                  <div key={f} className="flex items-center gap-2.5 rounded-md border border-table-border px-2.5 py-2.5">
                    <span className="text-[#92785a]">▣</span>
                    <span className="flex-1 text-[12.5px]">{f}</span>
                    <span className="text-[11px] font-semibold text-[#047857]">Attached</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <div className="mb-3.5 text-sm font-semibold">Review &amp; submit</div>
              <div className="grid grid-cols-2 gap-x-5 gap-y-3">
                {[
                  ["Borrower", customer?.name ?? "—", false],
                  ["Amount", preview.totalReq, true],
                  ["Est. installment", preview.installment, true],
                  ["Total repayable", preview.total, true],
                ].map(([k, v, mono]) => (
                  <div key={k as string}>
                    <div className="text-[10.5px] font-semibold uppercase tracking-[0.05em] text-[#9a948a]">{k}</div>
                    <div className={cn("mt-0.5 text-[13px]", mono && "font-mono")}>{v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-md border border-table-border bg-surface-subtle px-3 py-2.5 text-xs text-[#6f6a61]">
                On submit, this application enters the approval queue with status{" "}
                <strong className="text-[#1d4ed8]">Submitted</strong>.
              </div>
            </>
          )}

          <div className="mt-[22px] flex gap-2.5 border-t border-table-border pt-[18px]">
            {step > 1 && (
              <Button variant="outline" className="h-10" onClick={() => setStep((s) => Math.max(1, s - 1))}>
                ← Back
              </Button>
            )}
            {step < 4 && (
              <Button className="h-10" onClick={next}>Continue →</Button>
            )}
            {step === 4 && (
              <Button className="h-10 bg-[#047857]" onClick={submit} disabled={create.isPending}>
                {create.isPending ? "Submitting…" : "Submit application"}
              </Button>
            )}
            <Button variant="ghost" className="ml-auto h-10" onClick={saveDraft}>
              Save as draft
            </Button>
          </div>
        </Card>

        {/* Live preview sidebar */}
        <div className="flex flex-col gap-3.5">
          {customer && (
            <Card className="px-4 py-[15px]">
              <div className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#9a948a]">
                Borrower snapshot
              </div>
              <div className="text-sm font-semibold">{customer.name}</div>
              <Row k="Monthly income" v={money(customer.monthlyIncome)} mono />
              <Row k="Est. DSR" v={dsr} mono bold />
              <Row k="KYC" v={customer.kyc} bold />
            </Card>
          )}
          {product && (
            <Card className="px-4 py-[15px]">
              <div className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#9a948a]">
                Product limits
              </div>
              <Row k="Range" v={`${money(product.min)} – ${money(product.max)}`} mono />
              <Row k="Term" v={`${product.minTerm}–${product.maxTerm} months`} />
              <Row k="Interest" v={`${product.rate}% ${product.method}`} />
              <Row k="Fee" v={`${product.fee}% processing`} />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ k, v, mono, bold }: { k: string; v: string; mono?: boolean; bold?: boolean }) {
  return (
    <div className="mt-1.5 flex justify-between text-[12.5px]">
      <span className="text-[#6f6a61]">{k}</span>
      <span className={cn(mono && "font-mono", bold && "font-semibold")}>{v}</span>
    </div>
  );
}
