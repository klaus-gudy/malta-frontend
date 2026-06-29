"use client";

import { useParams } from "next/navigation";
import { useApplication } from "@/hooks/queries";
import { Skeleton } from "@/components/ui/skeleton";
import { ApplicationForm } from "@/components/malta/application-form";

export default function ApplicationDraftPage() {
  const params = useParams<{ id: string }>();
  const { data: app, isLoading } = useApplication(params.id);

  if (isLoading) return <Skeleton className="h-96 max-w-[980px]" />;
  if (!app) return <div className="text-muted-foreground">Application not found.</div>;
  if (app.status !== "Draft")
    return <div className="text-muted-foreground">Only draft applications can be edited.</div>;

  return <ApplicationForm draft={app} />;
}
