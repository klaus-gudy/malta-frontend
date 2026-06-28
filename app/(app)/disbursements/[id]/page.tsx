"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  useApplication,
  useCustomer,
  useProduct,
  useDisburse,
} from "@/hooks/queries";
import { useSession } from "@/lib/session";
import { can } from "@/lib/rbac";
import { fmtDate, money, schedule } from "@/lib/format";
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

const channelOpts = ["M-Pesa", "Tigo Pesa", "Airtel Money", "Bank transfer — CRDB", "Bank transfer — NMB", "Cash"];

export default function DisbursementDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { role } = useSession();

  const { data: app, isLoading } = useApplication(params.id);
  const { data: customer } = useCustomer(app?.customer ?? "");
  const { data: product } = useProduct(app?.product ?? "");
  const disburse = useDisburse();

  const [channel, setChannel] = React.useState("");
  const [account, setAccount] = React.useState("");
  const [accepted, setAccepted] = React.useState(false);

  if (isLoading) return <Skeleton className="h-96 max-w-[1020px]" />;
  if (!app || !product) return <div className="text-muted-foreground">Disbursement not found.</div>;

  const fee = Math.round((app.amount * product.fee) / 100);
  const net = app.amount - fee;
  const sch = schedule(app.amount, product.rate, app.term, product.method);
  const installment = sch[0]?.total ?? 0;
  const total = sch.reduce((s, r) => s + r.total, 0);
  const canDisburse = can(role, "disburse");

  function execute() {
    if (!channel) {
      toast("Select a disbursement channel");
      return;
    }
    disburse.mutate(
      { id: app!.id, channel },
      {
        onSuccess: () => {
          toast(`Loan disbursed via ${channel}`);
          router.push("/accounts");
        },
      },
    );
  }

  return (
    <div className="max-w-[1020px] animate-fade-up">
      <div className="mb-4">
        <div className="text-xl font-semibold">Loan contract &amp; disbursement</div>
        <div className="mt-0.5 text-[12.5px] text-[#7a756c]">
          {app.id} · {customer?.name}
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-4">
          <Card className="px-5 py-[18px]">
            <div className="mb-3.5 text-sm font-semibold">Approved loan summary</div>
            <div className="grid grid-cols-2 gap-3.5">
              <div className="rounded-md bg-surface-subtle px-3.5 py-3">
                <div className="text-[10.5px] font-semibold uppercase tracking-[0.05em] text-[#9a948a]">Principal</div>
                <div className="mt-0.5 font-mono text-lg font-semibold">{money(app.amount)}</div>
              </div>
              <div className="rounded-md bg-surface-subtle px-3.5 py-3">
                <div className="text-[10.5px] font-semibold uppercase tracking-[0.05em] text-[#9a948a]">Net to disburse</div>
                <div className="mt-0.5 font-mono text-lg font-semibold text-[#047857]">{money(net)}</div>
              </div>
            </div>
            <Row k="Processing fee deducted" v={money(fee)} mono />
            <Row k="Tenure" v={`${app.term} months`} />
            <Row k="Monthly installment" v={money(installment)} mono />
            <Row k="First / last due" v={`${fmtDate(sch[0].due)} → ${fmtDate(sch[sch.length - 1].due)}`} />
            <Row k="Total repayable" v={money(total)} mono bold />
          </Card>

          <Card className="px-5 py-[18px]">
            <div className="mb-3 text-sm font-semibold">Loan agreement</div>
            <div className="max-h-[120px] overflow-y-auto rounded-md border border-table-border bg-surface-subtle px-3.5 py-3 text-xs leading-[1.6] text-[#6f6a61]">
              This Loan Agreement is made between Malta Microfinance Ltd
              (&quot;Lender&quot;) and the Borrower named above. The Borrower
              agrees to repay the principal together with interest at the stated
              rate, in accordance with the repayment schedule. Late payments
              attract penalty charges as per the product terms. The Lender
              reserves the right to recover outstanding amounts through
              collateral and guarantors…
            </div>
            <label className="mt-3 flex items-center gap-2.5">
              <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="size-4 accent-primary" />
              <span className="text-[12.5px] font-medium">Borrower has reviewed and accepted the agreement terms</span>
            </label>
            <div className="mt-3 flex items-center gap-2.5 rounded-md border border-dashed border-input px-3 py-2.5">
              <span className="text-[#92785a]">▣</span>
              <span className="flex-1 text-[12.5px]">signed_agreement.pdf</span>
              <span className="text-[11px] font-semibold text-[#047857]">Uploaded</span>
            </div>
          </Card>
        </div>

        <Card className="px-5 py-[18px]">
          <div className="mb-3.5 text-sm font-semibold">Execute disbursement</div>
          <Field label="Disbursement channel" className="mb-3.5">
            <Select value={channel} onValueChange={setChannel}>
              <SelectTrigger><SelectValue placeholder="— select channel —" /></SelectTrigger>
              <SelectContent>
                {channelOpts.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Recipient account / number" className="mb-3.5">
            <Input className="font-mono" placeholder="+255 7… or bank account" value={account} onChange={(e) => setAccount(e.target.value)} />
          </Field>
          {canDisburse ? (
            <Button className="h-[42px] w-full bg-[#047857]" onClick={execute} disabled={disburse.isPending}>
              {disburse.isPending ? "Disbursing…" : `Disburse ${money(net)}`}
            </Button>
          ) : (
            <div className="rounded-md border border-table-border bg-surface-subtle px-3.5 py-2.5 text-center text-xs text-[#9a948a]">
              Disbursement requires Operations or Manager role.
            </div>
          )}
          <div className="mt-3 text-[11.5px] leading-[1.5] text-[#9a948a]">
            On execution the status moves <strong>Pending Disbursement → Disbursed</strong>{" "}
            and a loan account is opened with its repayment schedule.
          </div>
        </Card>
      </div>
    </div>
  );
}

function Row({ k, v, mono, bold }: { k: string; v: string; mono?: boolean; bold?: boolean }) {
  return (
    <div className="mt-1.5 flex justify-between text-[12.5px] first:mt-3.5">
      <span className="text-[#6f6a61]">{k}</span>
      <span className={`${mono ? "font-mono" : ""} ${bold ? "font-semibold" : ""}`}>{v}</span>
    </div>
  );
}
