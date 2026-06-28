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
  if (!user) {
    return (
      <div className="max-w-[720px] animate-fade-up text-[13px] text-[#7a756c]">
        User <span className="font-mono">{params.id}</span> was not found.
      </div>
    );
  }
  return <UserForm user={user} />;
}
