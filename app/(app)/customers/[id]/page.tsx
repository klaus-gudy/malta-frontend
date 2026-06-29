"use client";

import * as React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  useApplications,
  useCustomer,
  useDocuments,
  useLoans,
  useProducts,
  useSetDocStatus,
  useUpdateCustomer,
  useUploadDocument,
} from "@/hooks/queries";
import { fmtDate, initials, money } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusPill } from "@/components/malta/status-pill";
import { Fact } from "@/components/malta/form";
import { DocumentPreview } from "@/components/malta/document-preview";

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") ?? "overview";

  const { data: customer, isLoading } = useCustomer(params.id);
  const { data: loans } = useLoans();
  const { data: applications } = useApplications();
  const { data: products } = useProducts();
  const { data: docs } = useDocuments(params.id);
  const setDoc = useSetDocStatus(params.id);
  const update = useUpdateCustomer();
  const upload = useUploadDocument(params.id);

  // Profile edit state.
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState<Record<string, string>>({});
  // Document upload state.
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [docName, setDocName] = React.useState("");
  const [docFile, setDocFile] = React.useState<File | null>(null);
  // Document currently being previewed in the modal.
  const [previewId, setPreviewId] = React.useState<string | null>(null);

  function setTab(t: string) {
    router.replace(`/customers/${params.id}?tab=${t}`, { scroll: false });
  }

  if (isLoading) {
    return <Skeleton className="h-64 max-w-[1180px]" />;
  }
  if (!customer) {
    return <div className="text-muted-foreground">Customer not found.</div>;
  }

  const prodName = (id: string) =>
    products?.find((p) => p.id === id)?.name ?? id;
  const cLoans = (loans ?? []).filter((l) => l.customer === customer.id);
  const cApps = (applications ?? []).filter((a) => a.customer === customer.id);

  const facts = [
    { k: "National ID (NIDA)", val: customer.nida },
    { k: "Date of birth", val: `${fmtDate(customer.dob)} · ${customer.gender}` },
    { k: "Phone", val: customer.phone },
    { k: "Email", val: customer.email },
    { k: "Region / Ward", val: `${customer.region} · ${customer.ward}` },
    { k: "Address", val: customer.address },
    { k: "Occupation", val: customer.occupation },
    { k: "Business", val: customer.business },
    { k: "Monthly income", val: money(customer.monthlyIncome) },
    { k: "Next of kin", val: `${customer.nokName} (${customer.nokRelation}) · ${customer.nokPhone}` },
  ];

  // Editable profile fields (key, label, input type).
  const editFields: [string, string, string?][] = [
    ["name", "Full name"],
    ["phone", "Phone"],
    ["email", "Email"],
    ["nida", "National ID (NIDA)"],
    ["dob", "Date of birth", "date"],
    ["gender", "Gender"],
    ["region", "Region"],
    ["ward", "Ward"],
    ["address", "Address"],
    ["occupation", "Occupation"],
    ["business", "Business / employer"],
    ["monthlyIncome", "Monthly income (TZS)"],
    ["nokName", "Next of kin — name"],
    ["nokRelation", "Next of kin — relationship"],
    ["nokPhone", "Next of kin — phone"],
  ];

  function startEdit() {
    setDraft({
      name: customer!.name,
      phone: customer!.phone,
      email: customer!.email,
      nida: customer!.nida,
      dob: customer!.dob,
      gender: customer!.gender,
      region: customer!.region,
      ward: customer!.ward,
      address: customer!.address,
      occupation: customer!.occupation,
      business: customer!.business,
      monthlyIncome: String(customer!.monthlyIncome),
      nokName: customer!.nokName,
      nokRelation: customer!.nokRelation,
      nokPhone: customer!.nokPhone,
    });
    setEditing(true);
  }

  function saveEdit() {
    if (!draft.name?.trim()) {
      toast("Name is required");
      return;
    }
    // Send only non-empty fields so blank values don't trip backend validation
    // (e.g. an empty email). monthlyIncome is always sent as a number.
    const input: Record<string, string | number> = {
      monthlyIncome: Number(draft.monthlyIncome || 0),
    };
    for (const [k, v] of Object.entries(draft)) {
      if (k !== "monthlyIncome" && v.trim() !== "") input[k] = v;
    }
    update.mutate(
      {
        id: customer!.id,
        input: input as Parameters<typeof update.mutate>[0]["input"],
      },
      {
        onSuccess: () => {
          toast("Profile updated");
          setEditing(false);
        },
        onError: (e: Error) => toast(e.message || "Could not update profile"),
      },
    );
  }

  function submitUpload() {
    if (!docName.trim()) {
      toast("Enter a document name");
      return;
    }
    if (!docFile) {
      toast("Choose a file to upload");
      return;
    }
    const reader = new FileReader();
    reader.onload = () =>
      upload.mutate(
        {
          name: docName.trim(),
          content: String(reader.result),
          fileName: docFile.name,
        },
        {
          onSuccess: () => {
            toast("Document uploaded — pending verification");
            setUploadOpen(false);
            setDocName("");
            setDocFile(null);
          },
          onError: (e: Error) => toast(e.message || "Upload failed"),
        },
      );
    reader.readAsDataURL(docFile);
  }

  return (
    <div className="max-w-[1180px] animate-fade-up">
      {/* Header */}
      <div className="mb-[18px] flex flex-wrap items-start gap-[18px]">
        <div
          className="flex size-[66px] flex-shrink-0 items-center justify-center rounded-[14px] text-2xl font-semibold text-white"
          style={{ background: customer.photo }}
        >
          {initials(customer.name)}
        </div>
        <div className="min-w-[200px] flex-1">
          <div className="flex flex-wrap items-center gap-[11px]">
            <div className="text-[21px] font-semibold">{customer.name}</div>
            <StatusPill status={customer.status} />
            <StatusPill status={customer.kyc} label={`KYC ${customer.kyc}`} />
          </div>
          <div className="mt-1 font-mono text-[12.5px] text-[#7a756c]">
            {customer.id} · {customer.phone} · joined {fmtDate(customer.joined)}
          </div>
        </div>
        <Button
          onClick={() =>
            router.push(`/applications/new?customer=${customer.id}`)
          }
        >
          + New loan
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-[18px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="loans">Loans</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1.4fr_1fr]">
            <Card className="px-5 py-[18px]">
              <div className="mb-3.5 flex items-center justify-between">
                <div className="text-sm font-semibold">Profile details</div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => (editing ? setEditing(false) : startEdit())}
                >
                  {editing ? "Close" : "✎ Edit profile"}
                </Button>
              </div>
              {editing ? (
                <>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {editFields.map(([key, label, type]) => (
                      <label key={key} className="block">
                        <span className="text-[11.5px] font-semibold text-[#6f6a61]">
                          {label}
                        </span>
                        <Input
                          className="mt-[5px] h-[36px]"
                          type={type ?? "text"}
                          value={draft[key] ?? ""}
                          onChange={(e) =>
                            setDraft((d) => ({ ...d, [key]: e.target.value }))
                          }
                        />
                      </label>
                    ))}
                  </div>
                  <div className="mt-4 flex gap-2.5 border-t border-table-border pt-3.5">
                    <Button onClick={saveEdit} disabled={update.isPending}>
                      {update.isPending ? "Saving…" : "Save changes"}
                    </Button>
                    <Button variant="outline" onClick={() => setEditing(false)}>
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-x-6 gap-y-3.5">
                  {facts.map((f) => (
                    <Fact key={f.k} k={f.k}>
                      {f.val}
                    </Fact>
                  ))}
                </div>
              )}
            </Card>
            <Card className="px-[18px] py-4">
              <div className="mb-3 text-sm font-semibold">
                Loans &amp; applications
              </div>
              {[
                ...cLoans.map((l) => ({
                  id: l.id,
                  product: prodName(l.product),
                  amount: money(l.principal),
                  status: l.status,
                  href: `/accounts/${l.id}`,
                })),
                ...cApps.map((a) => ({
                  id: a.id,
                  product: `${prodName(a.product)} · application`,
                  amount: money(a.amount),
                  status: a.status,
                  href: `/applications/${a.id}`,
                })),
              ].map((row) => (
                <button
                  key={row.id}
                  onClick={() => router.push(row.href)}
                  className="mb-[7px] flex w-full items-center justify-between rounded-md border border-table-border px-2.5 py-2.5 text-left hover:bg-secondary"
                >
                  <div>
                    <div className="font-mono text-[12.5px] font-semibold">
                      {row.id}
                    </div>
                    <div className="text-[11px] text-[#9a948a]">
                      {row.product}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-[12.5px]">{row.amount}</div>
                    <StatusPill status={row.status} className="mt-0.5" />
                  </div>
                </button>
              ))}
              {cLoans.length + cApps.length === 0 ? (
                <div className="py-4 text-center text-xs text-muted-foreground">
                  No loans or applications yet.
                </div>
              ) : null}
            </Card>
          </div>
        </TabsContent>

        {/* LOANS */}
        <TabsContent value="loans">
          <Card className="px-5 py-[18px]">
            <div className="mb-2 text-sm font-semibold">Credit history</div>
            {cLoans.length === 0 ? (
              <div className="py-4 text-center text-xs text-muted-foreground">
                No loans on file.
              </div>
            ) : (
              cLoans.map((l) => (
                <button
                  key={l.id}
                  onClick={() => router.push(`/accounts/${l.id}`)}
                  className="mb-2 flex w-full items-center justify-between rounded-md border border-table-border px-3 py-2.5 text-left hover:bg-secondary"
                >
                  <div>
                    <div className="font-mono text-[13px] font-semibold">{l.id}</div>
                    <div className="text-[11.5px] text-[#9a948a]">
                      {prodName(l.product)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-[13px]">{money(l.principal)}</div>
                    <StatusPill status={l.status} />
                  </div>
                </button>
              ))
            )}
          </Card>
        </TabsContent>

        {/* DOCUMENTS */}
        <TabsContent value="documents">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-table-border px-4 py-3">
              <div className="text-sm font-semibold">
                Identity &amp; supporting documents
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUploadOpen((o) => !o)}
              >
                {uploadOpen ? "Close" : "↑ Upload document"}
              </Button>
            </div>

            {uploadOpen ? (
              <div className="flex flex-wrap items-end gap-3 border-b border-table-border bg-surface-subtle px-4 py-3.5">
                <label className="block min-w-[200px] flex-1">
                  <span className="text-[11.5px] font-semibold text-[#6f6a61]">
                    Document name
                  </span>
                  <Input
                    className="mt-[5px] h-[36px]"
                    placeholder="e.g. Bank statement"
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                  />
                </label>
                <label className="block min-w-[200px] flex-1">
                  <span className="text-[11.5px] font-semibold text-[#6f6a61]">
                    File
                  </span>
                  <input
                    type="file"
                    className="mt-[7px] block w-full text-[12.5px] text-[#6f6a61] file:mr-3 file:rounded-md file:border file:border-input file:bg-card file:px-2.5 file:py-1.5 file:text-[12px] file:font-medium hover:file:bg-secondary"
                    onChange={(e) => {
                      const f = e.target.files?.[0] ?? null;
                      setDocFile(f);
                      if (f && !docName.trim())
                        setDocName(f.name.replace(/\.[^.]+$/, ""));
                    }}
                  />
                </label>
                <Button onClick={submitUpload} disabled={upload.isPending}>
                  {upload.isPending ? "Uploading…" : "Upload"}
                </Button>
              </div>
            ) : null}

            {docs?.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-muted-foreground">
                No documents yet. Use “Upload document” to add one.
              </div>
            ) : null}

            {docs?.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-3.5 border-b border-table-row-border px-4 py-3 last:border-0"
              >
                <div className="flex size-[38px] flex-shrink-0 items-center justify-center rounded-md bg-[#f1ece2] text-[15px] text-[#92785a]">
                  ▣
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold">{doc.type}</div>
                  <div className="font-mono text-[11.5px] text-[#9a948a]">
                    {doc.file} · {doc.size} · {doc.up}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewId(doc.id)}
                >
                  ⤢ Preview
                </Button>
                <StatusPill status={doc.status} />
                {doc.status === "Pending" ? (
                  <div className="flex gap-1.5">
                    <Button
                      size="sm"
                      className="bg-[#047857]"
                      onClick={() =>
                        setDoc.mutate(
                          { docId: doc.id, status: "Verified" },
                          { onSuccess: () => toast("Document verified") },
                        )
                      }
                    >
                      Verify
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-[#e7c5c5] text-destructive"
                      onClick={() =>
                        setDoc.mutate(
                          { docId: doc.id, status: "Rejected" },
                          { onSuccess: () => toast("Document rejected") },
                        )
                      }
                    >
                      Reject
                    </Button>
                  </div>
                ) : null}
              </div>
            ))}
          </Card>
        </TabsContent>

        {/* ACTIVITY */}
        <TabsContent value="activity">
          <Card className="px-5 py-[18px]">
            <div className="mb-3 text-sm font-semibold">Activity timeline</div>
            <div className="text-[13px] leading-[1.8] text-[#6f6a61]">
              <div>● Profile created — {fmtDate(customer.joined)}</div>
              <div>● KYC documents uploaded</div>
              <div>● Loan application submitted</div>
              <div>● Repayments recorded against active loan</div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {previewId ? (
        <DocumentPreview
          docId={previewId}
          onClose={() => setPreviewId(null)}
        />
      ) : null}
    </div>
  );
}
