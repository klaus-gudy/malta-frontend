"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "@/lib/session";
import type { RoleId } from "@/lib/types";

const demoAccounts: { role: string; user: string; roleId: RoleId }[] = [
  { role: "Loan Officer", user: "amina.officer", roleId: "officer" },
  { role: "Branch Manager", user: "grace.manager", roleId: "manager" },
  { role: "Operations", user: "said.ops", roleId: "operations" },
  { role: "Cashier", user: "halima.cashier", roleId: "cashier" },
  { role: "Administrator", user: "joseph.admin", roleId: "admin" },
];

export default function LoginPage() {
  const router = useRouter();
  const { login, authed, role, homeFor } = useSession();
  const [view, setView] = React.useState<"login" | "reset">("login");
  const [username, setUsername] = React.useState("amina.officer");
  const [password, setPassword] = React.useState("");
  const [resetEmail, setResetEmail] = React.useState("");
  const [resetSent, setResetSent] = React.useState(false);
  const [error, setError] = React.useState("");

  // Already signed in → skip the login screen.
  React.useEffect(() => {
    if (authed) router.replace(homeFor(role));
  }, [authed, role, homeFor, router]);

  function signIn(roleId: RoleId) {
    login(roleId);
    router.replace(homeFor(roleId));
  }

  function onSubmit() {
    if (!password) {
      setError("Enter your password to continue.");
      return;
    }
    setError("");
    signIn("officer");
  }

  return (
    <div className="flex min-h-screen animate-fade-in">
      {/* Brand panel */}
      <div className="flex min-w-0 flex-1 flex-col justify-between bg-[#1a1a1a] px-16 py-14 text-[#f6f3ee] max-md:hidden">
        <div className="flex items-center gap-3">
          <div className="flex size-[34px] items-center justify-center rounded-md bg-primary text-lg font-bold text-white">
            M
          </div>
          <div className="text-base font-semibold tracking-[0.01em]">
            Malta Microfinance
          </div>
        </div>
        <div className="max-w-[440px]">
          <div className="text-[34px] font-semibold leading-[1.18] tracking-[-0.01em]">
            Lending operations,
            <br />
            from onboarding to closure.
          </div>
          <div className="mt-[18px] text-sm leading-[1.6] text-[#a8a298]">
            Customer onboarding, KYC, loan origination, approvals, disbursement
            and collections — one operational console for the whole portfolio.
          </div>
          <div className="mt-10 flex gap-[30px]">
            {[
              ["TZS 4.2B", "Portfolio"],
              ["3,418", "Active loans"],
              ["11", "Branches"],
            ].map(([v, l]) => (
              <div key={l}>
                <div className="font-mono text-[22px] font-semibold text-[#e8a04f]">
                  {v}
                </div>
                <div className="mt-1 text-[11px] uppercase tracking-[0.05em] text-[#8a857c]">
                  {l}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="text-xs text-[#6f6a61]">
          Dar es Salaam · Tanzania · TZS
        </div>
      </div>

      {/* Form panel */}
      <div className="flex w-[480px] max-w-full items-center justify-center bg-background p-10 max-md:w-full">
        <div className="w-full max-w-[340px]">
          {view === "reset" ? (
            <div className="animate-fade-up">
              <div className="text-[22px] font-semibold">Reset password</div>
              <div className="mt-2 text-[13px] leading-[1.5] text-[#7a756c]">
                Enter your work email and we&apos;ll send a secure reset link to
                your inbox.
              </div>
              <div className="mt-6 space-y-[7px]">
                <Label>Work email</Label>
                <Input
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="you@maltamfi.co.tz"
                />
              </div>
              <Button
                className="mt-[18px] w-full"
                onClick={() => resetEmail && setResetSent(true)}
              >
                Send reset link
              </Button>
              <Button
                variant="ghost"
                className="mt-2.5 h-[38px] w-full"
                onClick={() => {
                  setView("login");
                  setResetSent(false);
                }}
              >
                Back to sign in
              </Button>
              {resetSent ? (
                <div className="mt-4 rounded-md border border-[#b8dcc9] bg-[#e6f4ee] px-3 py-2.5 text-[12.5px] text-[#0c6b48]">
                  Reset link sent. Check your inbox.
                </div>
              ) : null}
            </div>
          ) : (
            <div className="animate-fade-up">
              <div className="text-[22px] font-semibold">Sign in</div>
              <div className="mt-2 text-[13px] text-[#7a756c]">
                Welcome back. Sign in to continue.
              </div>
              <div className="mt-6 space-y-[7px]">
                <Label>Username</Label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="mt-3.5 space-y-[7px]">
                <Label>Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  onKeyDown={(e) => e.key === "Enter" && onSubmit()}
                />
              </div>
              {error ? (
                <div className="mt-3 text-[12.5px] text-destructive">
                  {error}
                </div>
              ) : null}
              <Button className="mt-5 h-11 w-full" onClick={onSubmit}>
                Sign in
              </Button>
              <div className="mt-3.5 text-center">
                <span
                  onClick={() => setView("reset")}
                  className="cursor-pointer text-[12.5px] font-medium text-primary-dark"
                >
                  Forgot password?
                </span>
              </div>
              <div className="mt-6 border-t border-[#e7e3da] pt-4">
                <div className="mb-2.5 text-[11px] uppercase tracking-[0.06em] text-[#9a948a]">
                  Demo accounts — one click
                </div>
                <div className="grid grid-cols-2 gap-[7px]">
                  {demoAccounts.map((acc) => (
                    <button
                      key={acc.user}
                      onClick={() => signIn(acc.roleId)}
                      className="rounded-md border border-[#e0dbd1] bg-card px-2.5 py-2 text-left transition-colors hover:bg-secondary"
                    >
                      <div className="text-xs font-semibold">{acc.role}</div>
                      <div className="font-mono text-[10.5px] text-[#9a948a]">
                        {acc.user}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
