"use client";

import { useParams } from "next/navigation";
import { useUsers } from "@/hooks/queries";
import { UserForm } from "@/components/malta/user-form";
import { Skeleton } from "@/components/ui/skeleton";

export default function UserEditPage() {
  const params = useParams<{ id: string }>();
  const { data, isLoading } = useUsers();
  const user = data?.find((u) => u.id === params.id);

  if (isLoading) return <Skeleton className="h-80 max-w-[720px]" />;
  return <UserForm user={user} />;
}
