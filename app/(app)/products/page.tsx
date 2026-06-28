"use client";

import { useRouter } from "next/navigation";
import { useProducts } from "@/hooks/queries";
import { useSession } from "@/lib/session";
import { can } from "@/lib/rbac";
import { useTable } from "@/hooks/use-table";
import { moneyShort } from "@/lib/format";
import type { Product } from "@/lib/types";
import { PageHeader } from "@/components/malta/page-header";
import { DataPagination } from "@/components/malta/data-pagination";
import { StatusPill } from "@/components/malta/status-pill";
import { TableToolbar } from "@/components/malta/table-toolbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function filterProduct(p: Product, s: { q: string; status: string }) {
  const q = s.q.toLowerCase();
  return (
    (!q ||
      p.name.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)) &&
    (s.status === "All" || p.status === s.status)
  );
}

export default function ProductsPage() {
  const router = useRouter();
  const { role } = useSession();
  const { data, isLoading } = useProducts();
  const table = useTable<Product>(data, filterProduct);

  return (
    <div className="max-w-[1340px] animate-fade-up">
      <PageHeader
        title="Loan products"
        subtitle="Configurable lending products & pricing"
      >
        {can(role, "configProducts") && (
          <Button onClick={() => router.push("/products/new")}>
            + New product
          </Button>
        )}
      </PageHeader>

      <Card className="overflow-hidden">
        <TableToolbar
          table={table}
          searchPlaceholder="Search product, code or category…"
          statusOptions={["All", "Active", "Inactive"]}
        />
        <Table>
          <TableHeader>
            <TableRow className="bg-surface-subtle">
              <TableHead>Product</TableHead>
              <TableHead>Amount range</TableHead>
              <TableHead>Term</TableHead>
              <TableHead>Frequency</TableHead>
              <TableHead>Pricing</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              table.rows.map((p) => (
                <TableRow
                  key={p.id}
                  onClick={() => router.push(`/products/${p.id}/edit`)}
                  className="cursor-pointer hover:bg-surface-subtle"
                >
                  <TableCell>
                    <div className="text-[13px] font-semibold">{p.name}</div>
                    <div className="text-[11px] text-[#9a948a]">
                      {p.category} · {p.id}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-[12.5px]">
                    {moneyShort(p.min)} – {moneyShort(p.max)}
                  </TableCell>
                  <TableCell className="text-[12.5px]">
                    {p.minTerm}–{p.maxTerm} mo
                  </TableCell>
                  <TableCell className="text-[12.5px] text-[#6f6a61]">
                    {p.freq}
                  </TableCell>
                  <TableCell className="text-[12.5px]">
                    {p.rate}% {p.method.split(" ")[0].toLowerCase()} · {p.fee}% fee
                  </TableCell>
                  <TableCell>
                    <StatusPill status={p.status} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <DataPagination table={table} />
      </Card>
    </div>
  );
}
