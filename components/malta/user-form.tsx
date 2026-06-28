"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { User } from "@/lib/types";
import { roleOptions, branchOptions } from "@/lib/rbac";
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
import { Field } from "@/components/malta/form";

export function UserForm({ user }: { user?: User | null }) {
  const router = useRouter();
  const title = user ? `Edit · ${user.name}` : "Create new user";

  const [name, setName] = React.useState(user?.name ?? "");
  const [email, setEmail] = React.useState(user?.email ?? "");
  const [roleId, setRoleId] = React.useState(user?.role ?? "officer");
  const [branch, setBranch] = React.useState(user?.branch ?? branchOptions[0]);

  function save() {
    toast("User saved — invite email sent");
    router.push("/users");
  }

  const ic = "h-[38px]";

  return (
    <div className="max-w-[720px] animate-fade-up">
      <div className="mb-1 text-xl font-semibold">{title}</div>
      <div className="mb-[18px] text-[12.5px] text-[#7a756c]">
        Assign a role to control which modules and actions this user can access.
      </div>

      <Card className="px-6 py-[22px]">
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <Field label="Full name">
            <Input className={ic} value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Work email">
            <Input className={ic} placeholder="name@maltamfi.co.tz" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Role">
            <Select value={roleId} onValueChange={(v) => setRoleId(v as User["role"])}>
              <SelectTrigger className={ic}><SelectValue /></SelectTrigger>
              <SelectContent>
                {roleOptions.map((o) => <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Branch">
            <Select value={branch} onValueChange={setBranch}>
              <SelectTrigger className={ic}><SelectValue /></SelectTrigger>
              <SelectContent>
                {branchOptions.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <div className="mt-4 rounded-md border border-table-border bg-surface-subtle px-3.5 py-3 text-xs leading-[1.5] text-[#6f6a61]">
          A temporary password and activation link will be emailed. The account
          starts <strong>Active</strong> and can be deactivated at any time.
        </div>
        <div className="mt-5 flex gap-2.5 border-t border-table-border pt-[18px]">
          <Button className="h-10 px-5" onClick={save}>Save user</Button>
          <Button variant="outline" className="h-10 px-[18px]" onClick={() => router.push("/users")}>
            Cancel
          </Button>
        </div>
      </Card>
    </div>
  );
}
