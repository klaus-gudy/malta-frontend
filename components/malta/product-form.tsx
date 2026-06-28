"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Product } from "@/lib/types";
import { useCreateProduct, useUpdateProduct } from "@/hooks/queries";
import type { NewProductInput } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FormSection } from "@/components/malta/form";

const catOpts = ["Business / SME", "Agriculture", "Consumer", "Group lending", "Asset / Equipment"];
const methodOpts = ["Flat", "Reducing balance"];
const freqOpts = ["Weekly", "Bi-weekly", "Monthly"];

export function ProductForm({ product }: { product?: Product | null }) {
  const router = useRouter();
  const title = product ? `Edit · ${product.name}` : "New loan product";

  const [form, setForm] = React.useState<Record<string, string>>({
    pfName: product?.name ?? "",
    pfCat: product?.category ?? catOpts[0],
    pfMin: product ? String(product.min) : "",
    pfMax: product ? String(product.max) : "",
    pfMinT: product ? String(product.minTerm) : "",
    pfMaxT: product ? String(product.maxTerm) : "",
    pfRate: product ? String(product.rate) : "",
    pfMethod: product?.method ?? methodOpts[0],
    pfFreq: product?.freq ?? freqOpts[2],
    pfFee: product ? String(product.fee) : "",
    pfPen: product ? String(product.penalty) : "",
    pfGrace: product ? String(product.grace) : "",
  });
  const [active, setActive] = React.useState(product ? product.status === "Active" : true);

  const set = (k: string) => (v: string) => setForm((f) => ({ ...f, [k]: v }));
  const onInput = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => set(k)(e.target.value);

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const saving = createProduct.isPending || updateProduct.isPending;

  function save() {
    if (!form.pfName.trim()) {
      toast("Enter a product name");
      return;
    }
    const input: NewProductInput = {
      name: form.pfName.trim(),
      category: form.pfCat,
      min: Number(form.pfMin || 0),
      max: Number(form.pfMax || 0),
      minTerm: Number(form.pfMinT || 0),
      maxTerm: Number(form.pfMaxT || 0),
      freq: form.pfFreq,
      rate: Number(form.pfRate || 0),
      method: form.pfMethod,
      fee: Number(form.pfFee || 0),
      penalty: Number(form.pfPen || 0),
      grace: Number(form.pfGrace || 0),
      status: active ? "Active" : "Inactive",
    };
    const opts = {
      onSuccess: () => {
        toast("Product saved");
        router.push("/products");
      },
      onError: (e: Error) => toast(e.message || "Could not save product"),
    };
    if (product) updateProduct.mutate({ id: product.id, input }, opts);
    else createProduct.mutate(input, opts);
  }

  const ic = "h-[38px]";
  const mono = `${ic} font-mono`;

  return (
    <div className="max-w-[860px] animate-fade-up">
      <div className="mb-1 text-xl font-semibold">{title}</div>
      <div className="mb-[18px] text-[12.5px] text-[#7a756c]">
        Define product parameters, pricing, fees and penalties. Inactive
        products cannot be selected on new applications.
      </div>

      <Card className="px-6 py-[22px]">
        <FormSection>Identity</FormSection>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-[2fr_1fr]">
          <Field label="Product name">
            <Input className={ic} placeholder="e.g. Biashara Boost" value={form.pfName} onChange={onInput("pfName")} />
          </Field>
          <Field label="Category">
            <Select value={form.pfCat} onValueChange={set("pfCat")}>
              <SelectTrigger className={ic}><SelectValue /></SelectTrigger>
              <SelectContent>
                {catOpts.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <FormSection className="mt-[22px]">Amount &amp; term limits</FormSection>
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
          <Field label="Min amount"><Input className={mono} value={form.pfMin} onChange={onInput("pfMin")} /></Field>
          <Field label="Max amount"><Input className={mono} value={form.pfMax} onChange={onInput("pfMax")} /></Field>
          <Field label="Min term (mo)"><Input className={mono} value={form.pfMinT} onChange={onInput("pfMinT")} /></Field>
          <Field label="Max term (mo)"><Input className={mono} value={form.pfMaxT} onChange={onInput("pfMaxT")} /></Field>
        </div>

        <FormSection className="mt-[22px]">Pricing &amp; penalties</FormSection>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
          <Field label="Interest rate (% p.a.)"><Input className={mono} value={form.pfRate} onChange={onInput("pfRate")} /></Field>
          <Field label="Interest method">
            <Select value={form.pfMethod} onValueChange={set("pfMethod")}>
              <SelectTrigger className={ic}><SelectValue /></SelectTrigger>
              <SelectContent>{methodOpts.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Repayment frequency">
            <Select value={form.pfFreq} onValueChange={set("pfFreq")}>
              <SelectTrigger className={ic}><SelectValue /></SelectTrigger>
              <SelectContent>{freqOpts.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Processing fee (%)"><Input className={mono} value={form.pfFee} onChange={onInput("pfFee")} /></Field>
          <Field label="Penalty (% / period)"><Input className={mono} value={form.pfPen} onChange={onInput("pfPen")} /></Field>
          <Field label="Grace period (days)"><Input className={mono} value={form.pfGrace} onChange={onInput("pfGrace")} /></Field>
        </div>

        <label className="mt-5 flex items-center gap-2.5 rounded-md border border-table-border bg-surface-subtle px-3.5 py-2.5">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="size-4 accent-primary"
          />
          <span className="text-[12.5px] font-medium">
            Active — available for new loan applications
          </span>
        </label>

        <div className="mt-[22px] flex gap-2.5 border-t border-table-border pt-[18px]">
          <Button className="h-10 px-5" onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save product"}
          </Button>
          <Button variant="outline" className="h-10 px-[18px]" onClick={() => router.push("/products")}>
            Cancel
          </Button>
        </div>
      </Card>
    </div>
  );
}
