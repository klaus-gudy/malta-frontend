"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  useCustomers,
  useProducts,
  useCreateApplication,
  useDocuments,
  useKycRequirements,
  useUploadDocument,
} from "@/hooks/queries";
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
import { SearchSelect } from "@/components/malta/search-select";
import { StatusPill } from "@/components/malta/status-pill";
import { DocumentPreview } from "@/components/malta/document-preview";

const steps = [
  { n: 1, label: "Borrower & product" },
  { n: 2, label: "Loan terms" },
  { n: 3, label: "Documents" },
  { n: 4, label: "Review & submit" },
];

// Amounts are stored as raw digits but displayed with thousands separators.
const formatAmount = (s: string) => {
  const digits = s.replace(/\D/g, "");
  return digits ? Number(digits).toLocaleString("en-US") : "";
};

export default function ApplicationNewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { role } = useSession();
  const { data: customers } = useCustomers();
  const { data: products } = useProducts();
  const create = useCreateApplication();

  const [step, setStep] = React.useState(1);
  const [triedTerms, setTriedTerms] = React.useState(false);
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

  // Borrower documents + KYC for the documents step.
  const { data: custDocs } = useDocuments(form.naCustomer);
  const { data: kycReq } = useKycRequirements(form.naCustomer);
  const upload = useUploadDocument(form.naCustomer);
  const custKyc = kycReq?.kyc ?? customer?.kyc;

  const amount = form.naAmount ? Number(form.naAmount) : 0;
  const term = form.naTerm ? Number(form.naTerm) : (product?.minTerm ?? 9);

  // Validate amount & tenure against the selected product's limits.
  const termErrors = (() => {
    const errs = { amount: "", term: "" };
    if (!product) return errs;
    if (!form.naAmount) errs.amount = "Enter the requested amount.";
    else if (amount < product.min)
      errs.amount = `Minimum for ${product.name} is ${money(product.min)}.`;
    else if (amount > product.max)
      errs.amount = `Maximum for ${product.name} is ${money(product.max)}.`;
    if (term < product.minTerm || term > product.maxTerm)
      errs.term = `Tenure must be between ${product.minTerm} and ${product.maxTerm} months for ${product.name}.`;
    return errs;
  })();

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

  // Document upload state (documents step).
  const [docName, setDocName] = React.useState("");
  const [docFile, setDocFile] = React.useState<File | null>(null);
  const [previewId, setPreviewId] = React.useState<string | null>(null);

  function submitUpload() {
    if (!docName.trim()) return toast("Enter a document name");
    if (!docFile) return toast("Choose a file to upload");
    const reader = new FileReader();
    reader.onload = () =>
      upload.mutate(
        { name: docName.trim(), content: String(reader.result), fileName: docFile.name },
        {
          onSuccess: () => {
            toast("Document uploaded — pending verification");
            setDocName("");
            setDocFile(null);
          },
          onError: (e: Error) => toast(e.message || "Upload failed"),
        },
      );
    reader.readAsDataURL(docFile);
  }

  function next() {
    if (step === 1 && (!form.naCustomer || !form.naProduct)) {
      toast("Select a borrower and product");
      return;
    }
    if (step === 2) {
      setTriedTerms(true);
      if (termErrors.amount || termErrors.term) {
        toast(termErrors.amount || termErrors.term);
        return;
      }
    }
    if (step === 3 && custKyc === "Rejected") {
      toast("Borrower KYC is rejected — re-evaluation required before continuing");
      return;
    }
    setStep((s) => Math.min(4, s + 1));
  }

  function submit() {
    if (custKyc === "Rejected") {
      toast("Borrower KYC is rejected — re-evaluation required before submitting");
      return;
    }
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
        onError: (e: Error) => toast(e.message || "Could not submit application"),
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
        onError: (e: Error) => toast(e.message || "Could not save draft"),
      },
    );
  }

  const documentsBlocked = step === 3 && custKyc === "Rejected";

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
                <SearchSelect
                  value={form.naCustomer}
                  onChange={set("naCustomer")}
                  placeholder="Type a name or ID to search…"
                  options={custOpts.map((c) => ({
                    value: c.id,
                    label: c.name,
                    sublabel: `${c.id} · KYC ${c.kyc}`,
                  }))}
                />
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
              {!product && (
                <div className="mb-3.5 rounded-md border border-table-border bg-surface-subtle px-3 py-2.5 text-xs text-[#6f6a61]">
                  Select a product first to see the allowed amount and tenure.
                </div>
              )}
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <Field label="Requested amount (TZS)" required>
                  <Input
                    className="font-mono"
                    inputMode="numeric"
                    value={formatAmount(form.naAmount)}
                    onChange={(e) => set("naAmount")(e.target.value.replace(/\D/g, ""))}
                  />
                  {product && (
                    <div className="mt-1 text-[11px] text-[#9a948a]">
                      Allowed: {money(product.min)} – {money(product.max)}
                    </div>
                  )}
                  {((form.naAmount && termErrors.amount) ||
                    (triedTerms && !form.naAmount)) && (
                    <div className="mt-1 text-[11.5px] text-destructive">
                      {termErrors.amount}
                    </div>
                  )}
                </Field>
                <Field label="Tenure (months)">
                  <Input
                    className="font-mono"
                    inputMode="numeric"
                    value={form.naTerm}
                    onChange={(e) => set("naTerm")(e.target.value.replace(/\D/g, ""))}
                  />
                  {product && (
                    <div className="mt-1 text-[11px] text-[#9a948a]">
                      Allowed: {product.minTerm}–{product.maxTerm} months
                    </div>
                  )}
                  {form.naTerm && termErrors.term && (
                    <div className="mt-1 text-[11.5px] text-destructive">
                      {termErrors.term}
                    </div>
                  )}
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
              {!form.naCustomer ? (
                <div className="rounded-md border border-table-border bg-surface-subtle px-3 py-2.5 text-xs text-[#6f6a61]">
                  Select a borrower to manage supporting documents.
                </div>
              ) : (
                <>
                  {/* KYC-driven guidance */}
                  {custKyc === "Rejected" && (
                    <div className="mb-3.5 rounded-md border border-[#e7c5c5] bg-[#fbeaea] px-3.5 py-3 text-[12.5px] text-destructive">
                      <div className="font-semibold">KYC rejected — re-evaluation needed</div>
                      You can add supporting documents below, but this application
                      cannot be submitted until the borrower&apos;s KYC is updated by
                      a reviewer.
                    </div>
                  )}
                  {custKyc === "Pending" && (
                    <div className="mb-3.5 rounded-md border border-[#e8cfa6] bg-[#fbf0df] px-3.5 py-3 text-[12.5px] text-[#92400e]">
                      <div className="font-semibold">KYC pending</div>
                      Add any missing documents needed for approval, then continue.
                      {kycReq && kycReq.pendingDocuments > 0 && (
                        <> {kycReq.pendingDocuments} document(s) awaiting verification.</>
                      )}
                    </div>
                  )}
                  {custKyc === "Verified" && (
                    <div className="mb-3.5 rounded-md border border-[#b8dcc9] bg-[#e6f4ee] px-3.5 py-2.5 text-[12.5px] text-[#0c6b48]">
                      <span className="font-semibold">KYC verified</span> — supporting
                      documents are in order.
                    </div>
                  )}

                  {/* Existing documents */}
                  <div className="flex flex-col gap-[7px]">
                    {(custDocs ?? []).map((d) => (
                      <div
                        key={d.id}
                        className="flex items-center gap-2.5 rounded-md border border-table-border px-2.5 py-2.5"
                      >
                        <span className="text-[#92785a]">▣</span>
                        <div className="flex-1 min-w-0">
                          <div className="truncate text-[12.5px] font-medium">{d.type}</div>
                          <div className="truncate font-mono text-[11px] text-[#9a948a]">{d.file}</div>
                        </div>
                        <StatusPill status={d.status} />
                        <Button variant="outline" size="sm" onClick={() => setPreviewId(d.id)}>
                          ⊙ Preview
                        </Button>
                      </div>
                    ))}
                    {custDocs?.length === 0 && (
                      <div className="rounded-md border border-table-border bg-surface-subtle px-3 py-2.5 text-xs text-[#6f6a61]">
                        No documents uploaded yet.
                      </div>
                    )}
                  </div>

                  {/* Add a supporting document */}
                  <div className="mt-3 rounded-lg border border-table-border bg-surface-subtle p-3.5">
                    <div className="mb-2 text-[12px] font-semibold">Add a supporting document</div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Input
                        className="h-9 flex-1"
                        placeholder="Document name (e.g. Business licence)"
                        value={docName}
                        onChange={(e) => setDocName(e.target.value)}
                      />
                      <input
                        type="file"
                        onChange={(e) => setDocFile(e.target.files?.[0] ?? null)}
                        className="flex-1 text-[12px] file:mr-2 file:rounded file:border file:border-input file:bg-card file:px-2 file:py-1.5 file:text-[12px]"
                      />
                      <Button
                        size="sm"
                        className="h-9"
                        onClick={submitUpload}
                        disabled={upload.isPending}
                      >
                        {upload.isPending ? "Uploading…" : "↑ Upload"}
                      </Button>
                    </div>
                  </div>
                </>
              )}
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
              <Button className="h-10" onClick={next} disabled={documentsBlocked}>
                Continue →
              </Button>
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
          {documentsBlocked && (
            <div className="mt-2 text-[11.5px] text-destructive">
              Continue is disabled until the borrower&apos;s KYC is no longer rejected.
            </div>
          )}
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
              <div className="mt-1.5 flex justify-between text-[12.5px]">
                <span className="text-[#6f6a61]">KYC</span>
                <StatusPill status={(custKyc ?? customer.kyc) as string} />
              </div>
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

      {previewId && (
        <DocumentPreview docId={previewId} onClose={() => setPreviewId(null)} />
      )}
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
