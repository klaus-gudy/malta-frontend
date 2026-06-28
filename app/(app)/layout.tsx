"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session";
import { Sidebar } from "@/components/malta/shell/sidebar";
import { Topbar } from "@/components/malta/shell/topbar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { authed } = useSession();

  // Client-side auth guard — the session lives in the browser.
  React.useEffect(() => {
    if (!authed) router.replace("/login");
  }, [authed, router]);

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="min-w-0 flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
