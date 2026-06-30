"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Power } from "lucide-react";
import { useSession, useRoleMeta } from "@/lib/session";
import { navDef, roleMeta, roleOptions } from "@/lib/rbac";
import { initials } from "@/lib/format";
import type { RoleId } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { GlobalSearch } from "@/components/malta/shell/global-search";
import { toast } from "sonner";

// Map a pathname back to its top-level module label for the breadcrumb.
const moduleByPath: { prefix: string; label: string }[] = [
  { prefix: "/customers", label: "Customers" },
  { prefix: "/products", label: "Loan Products" },
  { prefix: "/applications", label: "Loan Applications" },
  { prefix: "/approvals", label: "Assessment & Approval" },
  { prefix: "/disbursements", label: "Disbursements" },
  { prefix: "/accounts", label: "Loan Accounts" },
  { prefix: "/collections", label: "Collections" },
  { prefix: "/users", label: "User Management" },
  { prefix: "/profile", label: "My Profile" },
];

export function Topbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { role, setRole, logout, homeFor } = useSession();
  const meta = useRoleMeta();

  const moduleLabel =
    pathname === "/"
      ? "Dashboard"
      : (moduleByPath.find((m) => pathname.startsWith(m.prefix))?.label ?? "");

  function onRoleChange(next: string) {
    const nextRole = next as RoleId;
    setRole(nextRole);
    toast(`Now viewing as ${roleMeta[nextRole].label}`);
    // If the current route isn't permitted for the new role, go to its home.
    const current = navDef.find(
      (n) =>
        n.href === "/"
          ? pathname === "/"
          : pathname.startsWith(n.href),
    );
    if (current && !current.roles.includes(nextRole)) {
      router.push(homeFor(nextRole));
    }
  }

  function signOut() {
    logout();
    router.replace("/login");
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-[18px] border-b border-border bg-card px-[22px]">
      <div className="flex min-w-0 items-center gap-2 text-[13px] text-[#9a948a]">
        <span className="whitespace-nowrap font-semibold text-foreground">
          {moduleLabel}
        </span>
      </div>

      <div className="flex flex-1 justify-center">
        <GlobalSearch />
      </div>

      <div className="flex flex-shrink-0 items-center gap-3.5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.05em] text-[#9a948a] max-md:hidden">
            View as
          </span>
          <Select value={role} onValueChange={onRoleChange}>
            <SelectTrigger size="sm" className="w-[150px] font-semibold text-primary-dark">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {roleOptions.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <button className="text-[#6f6a61]" title="Notifications">
          <Bell className="size-[17px]" />
        </button>

        <button
          onClick={() => router.push("/profile")}
          className="flex items-center gap-2.5"
        >
          <Avatar className="size-8 bg-[#1f1d1a]">
            <AvatarFallback className="bg-[#1f1d1a]">
              {initials(meta.name)}
            </AvatarFallback>
          </Avatar>
          <div className="text-left leading-[1.2] max-md:hidden">
            <div className="text-[12.5px] font-semibold">{meta.name}</div>
            <div className="text-[10.5px] text-[#9a948a]">
              {meta.label} · {meta.branch}
            </div>
          </div>
        </button>

        <button
          onClick={signOut}
          title="Sign out"
          className="flex size-8 items-center justify-center rounded-md text-[#9a948a] transition-colors hover:bg-secondary"
        >
          <Power className="size-4" />
        </button>
      </div>
    </header>
  );
}
