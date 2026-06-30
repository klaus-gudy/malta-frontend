"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import {
  useApplications,
  useCustomers,
  useLoans,
  useProducts,
  useUsers,
} from "@/hooks/queries";
import { useSession } from "@/lib/session";
import { can } from "@/lib/rbac";
import { money } from "@/lib/format";

interface Result {
  kind: "Customer" | "Application" | "Loan" | "Product" | "User";
  id: string;
  title: string;
  subtitle: string;
  href: string;
}

const KIND_COLOR: Record<Result["kind"], string> = {
  Customer: "#0c6b48",
  Application: "#1d4ed8",
  Loan: "#8a6d3f",
  Product: "#92400e",
  User: "#6f6a61",
};

export function GlobalSearch() {
  const router = useRouter();
  const { role } = useSession();
  const [q, setQ] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(0);
  const boxRef = React.useRef<HTMLDivElement>(null);

  const { data: customers } = useCustomers();
  const { data: applications } = useApplications();
  const { data: loans } = useLoans();
  const { data: products } = useProducts();
  const { data: users } = useUsers();

  // Close on outside click.
  React.useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const custName = React.useCallback(
    (id: string) => customers?.find((c) => c.id === id)?.name ?? id,
    [customers],
  );
  const prodName = React.useCallback(
    (id: string) => products?.find((p) => p.id === id)?.name ?? id,
    [products],
  );

  const results = React.useMemo<Result[]>(() => {
    const term = q.trim().toLowerCase();
    if (term.length < 2) return [];
    const hit = (...vals: (string | undefined)[]) =>
      vals.some((v) => (v ?? "").toLowerCase().includes(term));

    const customerHits: Result[] = [];
    for (const c of customers ?? []) {
      if (hit(c.name, c.id, c.phone, c.nida))
        customerHits.push({
          kind: "Customer",
          id: c.id,
          title: c.name,
          subtitle: `${c.id} · ${c.phone}`,
          href: `/customers/${c.id}`,
        });
    }
    const applicationHits: Result[] = [];
    for (const a of applications ?? []) {
      if (hit(a.id, custName(a.customer), prodName(a.product), a.officer))
        applicationHits.push({
          kind: "Application",
          id: a.id,
          title: `${a.id} · ${custName(a.customer)}`,
          subtitle: `${prodName(a.product)} · ${money(a.amount)} · ${a.status}`,
          href: a.status === "Draft" ? `/applications/${a.id}/draft` : `/applications/${a.id}`,
        });
    }
    const loanHits: Result[] = [];
    for (const l of loans ?? []) {
      if (hit(l.id, custName(l.customer), prodName(l.product)))
        loanHits.push({
          kind: "Loan",
          id: l.id,
          title: `${l.id} · ${custName(l.customer)}`,
          subtitle: `${prodName(l.product)} · ${money(l.principal)} · ${l.status}`,
          href: `/accounts/${l.id}`,
        });
    }
    const productHits: Result[] = [];
    for (const p of products ?? []) {
      if (hit(p.name, p.id, p.category))
        productHits.push({
          kind: "Product",
          id: p.id,
          title: p.name,
          subtitle: `${p.id} · ${p.category}`,
          href: `/products/${p.id}/edit`,
        });
    }
    const userHits: Result[] = [];
    if (can(role, "manageUsers")) {
      for (const u of users ?? []) {
        if (hit(u.name, u.email, u.branch, u.id))
          userHits.push({
            kind: "User",
            id: u.id,
            title: u.name,
            subtitle: `${u.email} · ${u.branch}`,
            href: `/users/${u.id}`,
          });
      }
    }

    // Cap each category so every matched entity type stays visible (a product
    // search shouldn't be drowned out by the applications referencing it).
    return [
      ...customerHits.slice(0, 4),
      ...productHits.slice(0, 4),
      ...userHits.slice(0, 4),
      ...applicationHits.slice(0, 4),
      ...loanHits.slice(0, 4),
    ].slice(0, 12);
  }, [q, customers, applications, loans, products, users, role, custName, prodName]);

  function go(r: Result) {
    setOpen(false);
    setQ("");
    router.push(r.href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!results.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(results[active] ?? results[0]);
    }
  }

  return (
    <div ref={boxRef} className="relative w-full max-w-[440px]">
      <Search className="absolute left-3 top-1/2 size-[15px] -translate-y-1/2 text-[#b3ada3]" />
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder="Search customers, loans, applications, products…"
        className="h-9 w-full rounded-md border border-input-soft bg-background pl-8 pr-3 text-[13px] outline-none focus:border-primary"
      />

      {open && q.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-[42px] z-50 overflow-hidden rounded-md border border-border bg-popover shadow-lg">
          {results.length === 0 ? (
            <div className="px-3.5 py-4 text-center text-[12.5px] text-muted-foreground">
              No matches for “{q.trim()}”.
            </div>
          ) : (
            <div className="max-h-[360px] overflow-y-auto py-1">
              {results.map((r, i) => (
                <button
                  key={`${r.kind}-${r.id}`}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(r)}
                  className={`flex w-full items-center gap-3 px-3 py-2 text-left transition-colors ${
                    i === active ? "bg-surface-subtle" : ""
                  }`}
                >
                  <span
                    className="flex-shrink-0 rounded px-1.5 py-px text-[9.5px] font-semibold uppercase tracking-[0.04em] text-white"
                    style={{ background: KIND_COLOR[r.kind] }}
                  >
                    {r.kind}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12.5px] font-medium">
                      {r.title}
                    </span>
                    <span className="block truncate text-[11px] text-[#9a948a]">
                      {r.subtitle}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
