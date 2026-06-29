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

  const canApprove = can(role, "approve");
  const assessmentCount = (data ?? []).filter((a) => a.status === "Submitted").length;
  const approvalCount = (data ?? []).filter((a) => a.status === "Under Review").length;

  const urlTab = searchParams.get("tab");
  const [tab, setTab] = React.useState(
    canApprove && (urlTab === "assessment" || urlTab === "queue") ? "assessment"
      : canApprove && urlTab === "approval" ? "approval"
      : "all",
  );
  const onTab = (t: string) => {
    setTab(t);
    router.replace(t === "all" ? "/applications" : `/applications?tab=${t}`, {
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
            <TabsTrigger value="assessment">
              Assessment queue
              {assessmentCount > 0 && (
                <span className="ml-1.5 rounded-full bg-primary px-1.5 py-px text-[10px] font-semibold text-primary-foreground">
                  {assessmentCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="approval">
              Approval queue
              {approvalCount > 0 && (
                <span className="ml-1.5 rounded-full bg-primary px-1.5 py-px text-[10px] font-semibold text-primary-foreground">
                  {approvalCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="all">
            <ApplicationsTable variant="all" />
          </TabsContent>
          <TabsContent value="assessment">
            <ApplicationsTable variant="assessment" />
          </TabsContent>
          <TabsContent value="approval">
            <ApplicationsTable variant="approval" />
          </TabsContent>
        </Tabs>
      ) : (
        <ApplicationsTable variant="all" />
      )}
    </div>
  );
}
