"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCreateCustomer } from "@/hooks/queries";
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

const regionOpts = ["Dar es Salaam", "Arusha", "Mwanza", "Dodoma", "Kilimanjaro", "Mbeya", "Tanga"];

type FormState = Record<string, string>;

export default function CustomerNewPage() {
  const router = useRouter();
  const create = useCreateCustomer();
  const [form, setForm] = React.useState<FormState>({ ncGender: "Female", ncRegion: "Dar es Salaam" });

  const set = (k: string) => (v: string) => setForm((f) => ({ ...f, [k]: v }));
  const onInput =
    (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
      set(k)(e.target.value);

  function save() {
    if (!form.ncName || !form.ncPhone || !form.ncNida) {
      toast("Name, phone and NIDA are required");
      return;
    }
    create.mutate(
      {
        name: form.ncName,
        gender: form.ncGender,
        dob: form.ncDob,
        phone: form.ncPhone,
        email: form.ncEmail,
        nida: form.ncNida,
        region: form.ncRegion,
        ward: form.ncWard,
        address: form.ncAddress,
        occupation: form.ncOcc,
        business: form.ncBiz,
        monthlyIncome: Number(form.ncIncome || 0),
        nokName: form.ncNok,
        nokRelation: form.ncNokRel,
        nokPhone: form.ncNokPhone,
      },
      {
        onSuccess: (c) => {
          toast(`Customer ${c.id} registered — KYC pending`);
          router.push(`/customers/${c.id}`);
        },
      },
    );
  }

  const inputCls = "h-[38px]";

  return (
    <div className="max-w-[880px] animate-fade-up">
      <div className="mb-1 text-xl font-semibold">Register new customer</div>
      <div className="mb-[18px] text-[12.5px] text-[#7a756c]">
        Capture borrower KYC details. The profile starts with KYC status{" "}
        <strong>Pending</strong> until documents are verified.
      </div>

      <Card className="px-6 py-[22px]">
        <FormSection>Personal details</FormSection>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
          <Field label="Full name" required>
            <Input className={inputCls} value={form.ncName ?? ""} onChange={onInput("ncName")} />
          </Field>
          <Field label="Gender">
            <Select value={form.ncGender} onValueChange={set("ncGender")}>
              <SelectTrigger className={inputCls}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Male">Male</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Date of birth">
            <Input className={inputCls} type="date" value={form.ncDob ?? ""} onChange={onInput("ncDob")} />
          </Field>
          <Field label="National ID (NIDA)" required>
            <Input className={`${inputCls} font-mono`} placeholder="20-digit NIDA" value={form.ncNida ?? ""} onChange={onInput("ncNida")} />
          </Field>
          <Field label="Phone" required>
            <Input className={inputCls} placeholder="+255 7…" value={form.ncPhone ?? ""} onChange={onInput("ncPhone")} />
          </Field>
          <Field label="Email">
            <Input className={inputCls} value={form.ncEmail ?? ""} onChange={onInput("ncEmail")} />
          </Field>
        </div>

        <FormSection className="mt-[22px]">Location &amp; livelihood</FormSection>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
          <Field label="Region">
            <Select value={form.ncRegion} onValueChange={set("ncRegion")}>
              <SelectTrigger className={inputCls}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {regionOpts.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Ward">
            <Input className={inputCls} value={form.ncWard ?? ""} onChange={onInput("ncWard")} />
          </Field>
          <Field label="Monthly income (TZS)">
            <Input className={`${inputCls} font-mono`} value={form.ncIncome ?? ""} onChange={onInput("ncIncome")} />
          </Field>
          <Field label="Physical address" className="sm:col-span-2">
            <Input className={inputCls} value={form.ncAddress ?? ""} onChange={onInput("ncAddress")} />
          </Field>
          <Field label="Occupation">
            <Input className={inputCls} value={form.ncOcc ?? ""} onChange={onInput("ncOcc")} />
          </Field>
          <Field label="Business / employer" className="sm:col-span-3">
            <Input className={inputCls} value={form.ncBiz ?? ""} onChange={onInput("ncBiz")} />
          </Field>
        </div>

        <FormSection className="mt-[22px]">Next of kin</FormSection>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
          <Field label="Name">
            <Input className={inputCls} value={form.ncNok ?? ""} onChange={onInput("ncNok")} />
          </Field>
          <Field label="Relationship">
            <Input className={inputCls} value={form.ncNokRel ?? ""} onChange={onInput("ncNokRel")} />
          </Field>
          <Field label="Phone">
            <Input className={inputCls} value={form.ncNokPhone ?? ""} onChange={onInput("ncNokPhone")} />
          </Field>
        </div>

        <div className="mt-6 flex gap-2.5 border-t border-table-border pt-[18px]">
          <Button className="h-10 px-5" onClick={save} disabled={create.isPending}>
            {create.isPending ? "Registering…" : "Register customer"}
          </Button>
          <Button variant="outline" className="h-10 px-[18px]" onClick={() => router.push("/customers")}>
            Cancel
          </Button>
        </div>
      </Card>
    </div>
  );
}
