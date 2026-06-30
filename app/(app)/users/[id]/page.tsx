"use client";

import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useUsers, useToggleUser, useAudit } from "@/hooks/queries";
import { roleMeta } from "@/lib/rbac";
import { initials } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill } from "@/components/malta/status-pill";
import { Fact } from "@/components/malta/form";
import { ActivityTimeline } from "@/components/malta/activity-timeline";

export default function UserDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading } = useUsers();
  const user = data?.find((u) => u.id === params.id);
  const toggle = useToggleUser();
  const { data: activity } = useAudit(params.id);

  if (isLoading) return <Skeleton className="h-80 max-w-[1020px]" />;
  if (!user) {
    return (
      <div className="max-w-[1020px] animate-fade-up text-[13px] text-[#7a756c]">
        User <span className="font-mono">{params.id}</span> was not found.
      </div>
    );
  }

  const isActive = user.status === "Active";

  function onToggle() {
    toggle.mutate(user!.id, {
      onSuccess: (updated) =>
        toast(
          `${user!.name} ${updated?.status === "Active" ? "activated" : "deactivated"}`,
        ),
      onError: (e: Error) => toast(e.message || "Could not update status"),
    });
  }

  const facts = [
    { k: "User ID", val: user.id },
    { k: "Email", val: user.email },
    { k: "Role", val: roleMeta[user.role].label },
    { k: "Branch", val: user.branch },
    { k: "Last active", val: user.last || "—" },
    { k: "Status", val: user.status },
  ];

  return (
    <div className="max-w-[1020px] animate-fade-up">
      {/* Header */}
      <div className="mb-[18px] flex flex-wrap items-start gap-[18px]">
        <div className="flex size-[60px] flex-shrink-0 items-center justify-center rounded-[14px] bg-[#1f1d1a] text-xl font-semibold text-white">
          {initials(user.name)}
        </div>
        <div className="min-w-[200px] flex-1">
          <div className="flex flex-wrap items-center gap-[11px]">
            <div className="text-[21px] font-semibold">{user.name}</div>
            <StatusPill status={user.status} />
          </div>
          <div className="mt-1 font-mono text-[12.5px] text-[#7a756c]">
            {user.id} · {roleMeta[user.role].label} · {user.branch}
          </div>
        </div>
        <div className="flex gap-2.5">
          <Button variant="outline" onClick={() => router.push(`/users/${user.id}/edit`)}>
            ✎ Edit
          </Button>
          <Button
            variant="outline"
            className={isActive ? "border-[#e7c5c5] text-destructive" : ""}
            disabled={toggle.isPending}
            onClick={onToggle}
          >
            {toggle.isPending ? "…" : isActive ? "Deactivate" : "Activate"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card className="px-5 py-[18px]">
          <div className="mb-3.5 text-sm font-semibold">Account details</div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3.5">
            {facts.map((f) => (
              <Fact key={f.k} k={f.k}>
                {f.val}
              </Fact>
            ))}
          </div>
        </Card>

        <Card className="px-5 py-[18px]">
          <div className="mb-4 text-sm font-semibold">Activity timeline</div>
          <ActivityTimeline
            entries={activity ?? []}
            empty="No activity recorded for this user yet."
          />
        </Card>
      </div>
    </div>
  );
}
