"use client";

import { useSearchParams } from "next/navigation";
import { ApplicationForm } from "@/components/malta/application-form";

export default function ApplicationNewPage() {
  const searchParams = useSearchParams();
  const preselectedCustomer = searchParams.get("customer") ?? undefined;

  return <ApplicationForm preselectedCustomer={preselectedCustomer} />;
}
