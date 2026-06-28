"use client";

import { useRouter } from "next/navigation";
import { useSession, useRoleMeta } from "@/lib/session";
import { navDef } from "@/lib/rbac";
import { initials } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  const router = useRouter();
  const { role, logout } = useSession();
  const meta = useRoleMeta();
  const email = meta.name.toLowerCase().replace(" ", ".") + "@maltamfi.co.tz";
  const perms = navDef.filter((n) => n.roles.includes(role)).map((n) => n.label);

  function signOut() {
    logout();
    router.replace("/login");
  }

  return (
    <div className="max-w-[760px] animate-fade-up">
      <div className="mb-[18px] text-xl font-semibold">My profile</div>
      <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
        <Card className="px-[22px] py-5">
          <div className="flex items-center gap-3.5">
            <div className="flex size-[54px] items-center justify-center rounded-[13px] bg-[#1f1d1a] text-xl font-semibold text-white">
              {initials(meta.name)}
            </div>
            <div>
              <div className="text-base font-semibold">{meta.name}</div>
              <div className="text-[12.5px] text-[#7a756c]">
                {meta.label} · {meta.branch}
              </div>
            </div>
          </div>
          <div className="mt-[18px] flex flex-col gap-[11px]">
            <div>
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.05em] text-[#9a948a]">Email</div>
              <div className="mt-0.5 font-mono text-[13px]">{email}</div>
            </div>
            <div>
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.05em] text-[#9a948a]">Role</div>
              <div className="mt-0.5 text-[13px]">{meta.label}</div>
            </div>
          </div>
          <Button
            variant="outline"
            className="mt-5 h-[38px] w-full border-[#e7c5c5] text-destructive"
            onClick={signOut}
          >
            Sign out
          </Button>
        </Card>

        <Card className="px-[22px] py-5">
          <div className="mb-3 text-sm font-semibold">Module access</div>
          <div className="flex flex-col gap-[7px]">
            {perms.map((p) => (
              <div key={p} className="flex items-center gap-2.5 text-[12.5px]">
                <span className="text-[#047857]">✓</span>
                {p}
              </div>
            ))}
          </div>
          <div className="mb-2.5 mt-[18px] text-sm font-semibold">Security</div>
          <Button variant="outline" className="h-9 w-full bg-background">
            Change password
          </Button>
        </Card>
      </div>
    </div>
  );
}
