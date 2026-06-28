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
  const [errors, setErrors] = React.useState<string[]>([]);

  // Parse a numeric field: blank → NaN so "required" is enforced (not 0).
  const num = (s: string) => (s.trim() === "" ? NaN : Number(s));

  // Validate every parameter needed to configure a product. Mirrors the backend
  // rules so the user gets the same guidance before the request is sent.
  function validate(): { errors: string[]; input?: NewProductInput } {
    const errs: string[] = [];
    const min = num(form.pfMin);
    const max = num(form.pfMax);
    const minT = num(form.pfMinT);
    const maxT = num(form.pfMaxT);
    const rate = num(form.pfRate);
    const fee = num(form.pfFee);
    const pen = num(form.pfPen);
    const grace = num(form.pfGrace);

    if (!form.pfName.trim()) errs.push("Product name is required.");
    if (!form.pfCat) errs.push("Category is required.");

    if (!Number.isFinite(min) || min < 1)
      errs.push("Minimum amount is required and must be greater than 0.");
    if (!Number.isFinite(max) || max < 1)
      errs.push("Maximum amount is required and must be greater than 0.");
    if (Number.isFinite(min) && Number.isFinite(max) && max < min)
      errs.push("Maximum amount must be greater than or equal to the minimum amount.");

    if (!Number.isInteger(minT) || minT < 1)
      errs.push("Minimum term is required (a whole number of at least 1 period).");
    if (!Number.isInteger(maxT) || maxT < 1)
      errs.push("Maximum term is required (a whole number of at least 1 period).");
    if (Number.isInteger(minT) && Number.isInteger(maxT) && maxT < minT)
      errs.push("Maximum term must be greater than or equal to the minimum term.");

    if (!form.pfFreq) errs.push("Repayment frequency is required.");
    if (!Number.isFinite(rate) || rate < 0)
      errs.push("Interest rate is required (0 or more).");
    if (!form.pfMethod) errs.push("Interest method is required.");
    if (!Number.isFinite(fee) || fee < 0)
      errs.push("Processing fee is required (0 or more).");
    if (!Number.isFinite(pen) || pen < 0)
      errs.push("Penalty rate is required (0 or more).");
    if (!Number.isInteger(grace) || grace < 0)
      errs.push("Grace period is required (a whole number of days, 0 or more).");

    if (errs.length) return { errors: errs };
    return {
      errors: [],
      input: {
        name: form.pfName.trim(),
        category: form.pfCat,
        min,
        max,
        minTerm: minT,
        maxTerm: maxT,
        freq: form.pfFreq,
        rate,
        method: form.pfMethod,
        fee,
        penalty: pen,
        grace,
        status: active ? "Active" : "Inactive",
      },
    };
  }

  function save() {
    const { errors: errs, input } = validate();
    setErrors(errs);
    if (!input) {
      toast("Please complete all required fields");
      return;
    }
    const opts = {
      onSuccess: () => {
        toast("Product saved");
        router.push("/products");
      },
      // Backend validation messages (array) arrive joined — surface them too.
      onError: (e: Error) => {
        setErrors(e.message ? e.message.split(", ") : []);
        toast("Could not save product");
      },
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
          <Field label="Product name" required>
            <Input className={ic} placeholder="e.g. Biashara Boost" value={form.pfName} onChange={onInput("pfName")} />
          </Field>
          <Field label="Category" required>
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
          <Field label="Min amount" required><Input className={mono} value={form.pfMin} onChange={onInput("pfMin")} /></Field>
          <Field label="Max amount" required><Input className={mono} value={form.pfMax} onChange={onInput("pfMax")} /></Field>
          <Field label="Min term (mo)" required><Input className={mono} value={form.pfMinT} onChange={onInput("pfMinT")} /></Field>
          <Field label="Max term (mo)" required><Input className={mono} value={form.pfMaxT} onChange={onInput("pfMaxT")} /></Field>
        </div>

        <FormSection className="mt-[22px]">Pricing &amp; penalties</FormSection>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
          <Field label="Interest rate (% p.a.)" required><Input className={mono} value={form.pfRate} onChange={onInput("pfRate")} /></Field>
          <Field label="Interest method" required>
            <Select value={form.pfMethod} onValueChange={set("pfMethod")}>
              <SelectTrigger className={ic}><SelectValue /></SelectTrigger>
              <SelectContent>{methodOpts.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Repayment frequency" required>
            <Select value={form.pfFreq} onValueChange={set("pfFreq")}>
              <SelectTrigger className={ic}><SelectValue /></SelectTrigger>
              <SelectContent>{freqOpts.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Processing fee (%)" required><Input className={mono} value={form.pfFee} onChange={onInput("pfFee")} /></Field>
          <Field label="Penalty (% / period)" required><Input className={mono} value={form.pfPen} onChange={onInput("pfPen")} /></Field>
          <Field label="Grace period (days)" required><Input className={mono} value={form.pfGrace} onChange={onInput("pfGrace")} /></Field>
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

        {errors.length > 0 && (
          <div className="mt-4 rounded-md border border-[#e7c5c5] bg-[#fbeaea] px-3.5 py-3 text-[12.5px] text-destructive">
            <div className="mb-1 font-semibold">
              Please fix the following before saving:
            </div>
            <ul className="list-disc space-y-0.5 pl-4">
              {errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </div>
        )}

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
