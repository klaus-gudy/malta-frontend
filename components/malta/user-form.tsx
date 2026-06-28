"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { User } from "@/lib/types";
import { useCreateUser, useUpdateUser } from "@/hooks/queries";
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

  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const saving = createUser.isPending || updateUser.isPending;

  // After creating a user, surface the one-time temp credentials so the admin
  // can share them / test sign-in.
  const [created, setCreated] = React.useState<{
    username: string;
    tempPassword: string;
  } | null>(null);

  function save() {
    if (!name.trim()) {
      toast("Enter the user's full name");
      return;
    }
    if (!email.trim()) {
      toast("Enter a work email");
      return;
    }
    const input = { name: name.trim(), email: email.trim(), role: roleId, branch };
    if (user) {
      updateUser.mutate(
        { id: user.id, input },
        {
          onSuccess: () => {
            toast("User saved");
            router.push("/users");
          },
          onError: (e: Error) => toast(e.message || "Could not save user"),
        },
      );
    } else {
      createUser.mutate(input, {
        onSuccess: (data) => {
          toast("User created — share the temporary password below");
          setCreated({
            username: data.email.split("@")[0],
            tempPassword: data.tempPassword,
          });
        },
        onError: (e: Error) => toast(e.message || "Could not save user"),
      });
    }
  }

  const ic = "h-[38px]";

  if (created) {
    return (
      <div className="max-w-[720px] animate-fade-up">
        <div className="mb-1 text-xl font-semibold">User created</div>
        <div className="mb-[18px] text-[12.5px] text-[#7a756c]">
          {name} can sign in with these temporary credentials. They are shown
          only once.
        </div>
        <Card className="px-6 py-[22px]">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Username">
              <div className="rounded-md border border-table-border bg-surface-subtle px-3 py-2 font-mono text-[13px]">
                {created.username}
              </div>
            </Field>
            <Field label="Temporary password">
              <div className="rounded-md border border-table-border bg-surface-subtle px-3 py-2 font-mono text-[13px]">
                {created.tempPassword}
              </div>
            </Field>
          </div>
          <div className="mt-4 rounded-md border border-[#b8dcc9] bg-[#e6f4ee] px-3.5 py-3 text-xs leading-[1.5] text-[#0c6b48]">
            The account is <strong>Active</strong> and can sign in immediately at
            the login screen using the username and temporary password above.
          </div>
          <div className="mt-5 flex gap-2.5 border-t border-table-border pt-[18px]">
            <Button className="h-10 px-5" onClick={() => router.push("/users")}>
              Done
            </Button>
            <Button
              variant="outline"
              className="h-10 px-[18px]"
              onClick={() => {
                navigator.clipboard?.writeText(
                  `Username: ${created.username}\nTemporary password: ${created.tempPassword}`,
                );
                toast("Credentials copied");
              }}
            >
              Copy credentials
            </Button>
          </div>
        </Card>
      </div>
    );
  }

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
          <Button className="h-10 px-5" onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save user"}
          </Button>
          <Button variant="outline" className="h-10 px-[18px]" onClick={() => router.push("/users")}>
            Cancel
          </Button>
        </div>
      </Card>
    </div>
  );
}
