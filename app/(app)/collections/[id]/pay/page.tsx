"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  useLoan,
  useCustomer,
  useTakePayment,
  useLoanSchedule,
  useLoanCharges,
} from "@/hooks/queries";
import { useSession } from "@/lib/session";
import { money } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field } from "@/components/malta/form";

const methodOpts = ["Cash", "M-Pesa", "Tigo Pesa", "Airtel Money", "Bank deposit"];

export default function ReceivePaymentPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { role } = useSession();
  const { data: loan, isLoading } = useLoan(params.id);
  const { data: customer } = useCustomer(loan?.customer ?? "");
  const { data: sched } = useLoanSchedule(params.id);
  const { data: charges } = useLoanCharges(params.id);
  const takePayment = useTakePayment();

  const [amount, setAmount] = React.useState("");
  const [method, setMethod] = React.useState("Cash");
  const [reference, setReference] = React.useState("");
  const [alloc, setAlloc] = React.useState("Oldest installment first");
  const [done, setDone] = React.useState(false);

  if (isLoading) return <Skeleton className="h-80 max-w-[880px]" />;
  if (!loan) return <div className="text-muted-foreground">Loan not found.</div>;

  const rows = sched ?? [];
  // Next installment due = the first one not fully paid.
  const nx = rows.find((r) => r.status !== "Paid") ?? rows[rows.length - 1];
  const outstandingInstal = rows.reduce((s, r) => s + (r.total - r.paidAmount), 0);
  const outstandingCharges = (charges ?? [])
    .filter((c) => c.status === "Outstanding")
    .reduce((s, c) => s + c.amount, 0);
  const out = outstandingInstal + outstandingCharges;
  const receiptNo = `RCP-${loan.id.slice(-4)}-${loan.paid + 1}`;

  function record() {
    if (!amount) {
      toast("Enter payment amount");
      return;
    }
    takePayment.mutate(
      { id: loan!.id, amount: Number(amount), method, reference, role },
      {
        onSuccess: () => {
          toast(`Payment of ${money(Number(amount))} received`);
          setDone(true);
        },
        onError: (e: Error) => toast(e.message || "Could not record payment"),
      },
    );
  }

  return (
    <div className="max-w-[880px] animate-fade-up">
      <div className="mb-4">
        <div className="text-xl font-semibold">Receive payment</div>
        <div className="mt-0.5 text-[12.5px] text-[#7a756c]">
          {loan.id} · {customer?.name}
        </div>
      </div>

      {done ? (
        <Card className="max-w-[420px] animate-fade-up px-8 py-8 text-center">
          <div className="mx-auto flex size-[52px] items-center justify-center rounded-full bg-[#e3f3eb] text-[26px] text-[#047857]">
            ✓
          </div>
          <div className="mt-3.5 text-[17px] font-semibold">Payment recorded</div>
          <div className="mt-1 text-[12.5px] text-[#7a756c]">
            Receipt <span className="font-mono">{receiptNo}</span> issued
          </div>
          <div className="mt-[18px] flex justify-center gap-2.5">
            <Button variant="outline">↓ Print receipt</Button>
            <Button onClick={() => router.push(`/accounts/${loan.id}`)}>View account</Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1.3fr_1fr]">
          <Card className="px-[22px] py-5">
            <div className="mb-3.5 text-sm font-semibold">Payment details</div>
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <Field label="Amount received (TZS)" required>
                <Input className="h-10 font-mono" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </Field>
              <Field label="Payment method">
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>{methodOpts.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Reference / txn ID">
                <Input className="h-10 font-mono" value={reference} onChange={(e) => setReference(e.target.value)} />
              </Field>
              <Field label="Allocation">
                <Select value={alloc} onValueChange={setAlloc}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Oldest installment first">Oldest installment first</SelectItem>
                    <SelectItem value="Specific installment">Specific installment</SelectItem>
                    <SelectItem value="Penalties first">Penalties first</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Button className="mt-[18px] h-[42px] w-full bg-[#047857]" onClick={record} disabled={takePayment.isPending}>
              {takePayment.isPending ? "Recording…" : "Record payment & issue receipt"}
            </Button>
          </Card>

          <Card className="px-5 py-[18px]">
            <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#9a948a]">
              {nx ? `Installment #${nx.n}` : "Installment"}
            </div>
            <div className="mb-1.5 flex justify-between text-[12.5px]">
              <span className="text-[#6f6a61]">Due date</span>
              <span>
                {nx
                  ? new Date(nx.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                  : "—"}
              </span>
            </div>
            <div className="mb-1.5 flex justify-between text-[12.5px]">
              <span className="text-[#6f6a61]">Installment due</span>
              <span className="font-mono font-semibold">{money(nx ? nx.total - nx.paidAmount : 0)}</span>
            </div>
            {outstandingCharges > 0 && (
              <div className="mb-1.5 flex justify-between text-[12.5px]">
                <span className="text-[#6f6a61]">Outstanding penalties</span>
                <span className="font-mono font-semibold text-destructive">{money(outstandingCharges)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-table-border pt-2.5 text-[12.5px]">
              <span className="text-[#6f6a61]">Total outstanding</span>
              <span className="font-mono font-semibold">{money(out)}</span>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
