"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileText,
  ArrowLeftRight,
  Landmark,
  Settings,
  UserCog,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useSession } from "@/lib/session";
import { navDef } from "@/lib/rbac";
import { useApplications, useLoans } from "@/hooks/queries";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  LayoutDashboard,
  Users,
  FileText,
  ArrowLeftRight,
  Landmark,
  Settings,
  UserCog,
};

export function Sidebar() {
  const { role, navCollapsed, toggleNav } = useSession();
  const pathname = usePathname();
  const { data: applications } = useApplications();
  const { data: loans } = useLoans();

  const badges: Record<string, number> = {
    approvals:
      applications?.filter((a) =>
        ["Submitted", "Under Review"].includes(a.status),
      ).length ?? 0,
    disbursements:
      applications?.filter((a) => a.status === "Approved").length ?? 0,
    collections: loans?.filter((l) => l.status === "Overdue").length ?? 0,
  };

  const items = navDef.filter((n) => n.roles.includes(role));
  const expanded = !navCollapsed;

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <aside
      className="sticky top-0 flex h-screen flex-shrink-0 flex-col bg-sidebar text-sidebar-foreground transition-[width] duration-200"
      style={{ width: expanded ? 228 : 62 }}
    >
      <div className="flex h-14 flex-shrink-0 items-center gap-[11px] border-b border-sidebar-border px-4">
        <div className="flex size-[30px] flex-shrink-0 items-center justify-center rounded-md bg-primary text-base font-bold text-white">
          M
        </div>
        {expanded ? (
          <div className="min-w-0">
            <div className="whitespace-nowrap text-[13.5px] font-semibold text-[#f4f1ec]">
              Malta MFI
            </div>
            <div className="whitespace-nowrap text-[10px] text-sidebar-muted">
              Loan Management
            </div>
          </div>
        ) : null}
      </div>

      <nav className="flex-1 overflow-y-auto p-[10px_9px]">
        {items.map((item) => {
          const active = isActive(item.href);
          const badge = item.badgePage ? badges[item.badgePage] : 0;
          return (
            <Link
              key={item.page}
              href={item.href}
              title={item.label}
              className={cn(
                "mb-0.5 flex items-center gap-[11px] overflow-hidden whitespace-nowrap rounded-md p-[9px] transition-colors",
                active
                  ? "bg-primary text-white"
                  : "text-sidebar-foreground hover:bg-sidebar-accent",
              )}
            >
              {(() => {
                const Icon = iconMap[item.icon];
                return Icon ? (
                  <span className="flex w-[18px] flex-shrink-0 items-center justify-center">
                    <Icon size={18} />
                  </span>
                ) : (
                  <span className="w-[18px] flex-shrink-0 text-center text-sm">{item.icon}</span>
                );
              })()}
              {expanded ? (
                <span className="min-w-0 flex-1 text-[13px] font-medium">
                  {item.label}
                </span>
              ) : null}
              {badge > 0 && expanded ? (
                <span className="rounded-full bg-primary px-1.5 py-px font-mono text-[10px] font-semibold text-white">
                  {badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={toggleNav}
        className="flex h-[42px] flex-shrink-0 items-center gap-[11px] border-t border-sidebar-border px-[18px] text-[13px] text-sidebar-muted transition-colors hover:bg-sidebar-accent"
      >
        {expanded ? <ChevronsLeft size={16} /> : <ChevronsRight size={16} />}
        {expanded ? <span>Collapse</span> : null}
      </button>
    </aside>
  );
}
