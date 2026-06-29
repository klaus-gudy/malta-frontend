"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApplications } from "@/hooks/queries";
import { useSession } from "@/lib/session";
import { can } from "@/lib/rbac";
import { PageHeader } from "@/components/malta/page-header";
import { ApplicationsTable } from "@/components/malta/applications-table";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ApplicationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { role } = useSession();
  const { data } = useApplications();

  // Only assessors (admin/manager) get the decision queue tab.
  const canApprove = can(role, "approve");
  const queueCount = (data ?? []).filter((a) =>
    ["Submitted", "Under Review"].includes(a.status),
  ).length;

  // Tab is local state (responsive) but seeded from / synced to the URL so the
  // /approvals redirect can deep-link the queue and the view is shareable.
  const [tab, setTab] = React.useState(
    canApprove && searchParams.get("tab") === "queue" ? "queue" : "all",
  );
  const onTab = (t: string) => {
    setTab(t);
    router.replace(t === "queue" ? "/applications?tab=queue" : "/applications", {
      scroll: false,
    });
  };

  return (
    <div className="max-w-[1340px] animate-fade-up">
      <PageHeader
        title="Loan applications"
        subtitle="Origination pipeline & assessment queue"
      >
        {can(role, "createApplication") && (
          <Button onClick={() => router.push("/applications/new")}>
            + New application
          </Button>
        )}
      </PageHeader>

      {canApprove ? (
        <Tabs value={tab} onValueChange={onTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">All applications</TabsTrigger>
            <TabsTrigger value="queue">
              Assessment queue
              {queueCount > 0 && (
                <span className="ml-1.5 rounded-full bg-primary px-1.5 py-px text-[10px] font-semibold text-primary-foreground">
                  {queueCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="all">
            <ApplicationsTable variant="all" />
          </TabsContent>
          <TabsContent value="queue">
            <ApplicationsTable variant="queue" />
          </TabsContent>
        </Tabs>
      ) : (
        <ApplicationsTable variant="all" />
      )}
    </div>
  );
}
