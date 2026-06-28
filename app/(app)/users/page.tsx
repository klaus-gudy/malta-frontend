"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useUsers, useToggleUser } from "@/hooks/queries";
import { useTable } from "@/hooks/use-table";
import { roleMeta } from "@/lib/rbac";
import type { User } from "@/lib/types";
import { PageHeader } from "@/components/malta/page-header";
import { DataPagination } from "@/components/malta/data-pagination";
import { StatusPill } from "@/components/malta/status-pill";
import { TableToolbar } from "@/components/malta/table-toolbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function filterUser(u: User, s: { q: string; status: string }) {
  const q = s.q.toLowerCase();
  return (
    (!q ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.branch.toLowerCase().includes(q)) &&
    (s.status === "All" || u.status === s.status)
  );
}

export default function UsersPage() {
  const router = useRouter();
  const { data } = useUsers();
  const toggle = useToggleUser();
  const table = useTable<User>(data, filterUser);

  return (
    <div className="max-w-[1340px] animate-fade-up">
      <PageHeader title="User management" subtitle="Staff accounts, roles & access">
        <Button onClick={() => router.push("/users/new")}>+ New user</Button>
      </PageHeader>

      <Card className="overflow-hidden">
        <TableToolbar
          table={table}
          searchPlaceholder="Search name, email or branch…"
          statusOptions={["All", "Active", "Inactive"]}
        />
        <Table>
          <TableHeader>
            <TableRow className="bg-surface-subtle">
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Last active</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {table.rows.map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  <div className="text-[12.5px] font-semibold">{u.name}</div>
                  <div className="font-mono text-[11px] text-[#9a948a]">{u.email}</div>
                </TableCell>
                <TableCell className="text-[12.5px]">{roleMeta[u.role].label}</TableCell>
                <TableCell className="text-[12.5px] text-[#6f6a61]">{u.branch}</TableCell>
                <TableCell className="font-mono text-xs text-[#6f6a61]">{u.last}</TableCell>
                <TableCell><StatusPill status={u.status} /></TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex gap-1.5">
                    <Button variant="outline" size="sm" onClick={() => router.push(`/users/${u.id}/edit`)}>
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        toggle.mutate(u.id, { onSuccess: () => toast("User status updated") })
                      }
                    >
                      {u.status === "Active" ? "Deactivate" : "Activate"}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <DataPagination table={table} />
      </Card>
    </div>
  );
}
