"use client";

import { useParams } from "next/navigation";
import { useProduct, useAudit } from "@/hooks/queries";
import { ProductForm } from "@/components/malta/product-form";
import { ActivityTimeline } from "@/components/malta/activity-timeline";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProductEditPage() {
  const params = useParams<{ id: string }>();
  const { data, isLoading } = useProduct(params.id);
  const { data: activity } = useAudit(params.id);

  if (isLoading) return <Skeleton className="h-96 max-w-[860px]" />;

  return (
    <div className="flex flex-col gap-5">
      <ProductForm product={data} />
      <Card className="max-w-[860px] px-6 py-[22px]">
        <div className="mb-1 text-sm font-semibold">Change history</div>
        <div className="mb-4 text-[12px] text-[#9a948a]">
          Every change to this product — what changed, by whom and when.
        </div>
        <ActivityTimeline
          entries={activity ?? []}
          empty="No changes recorded for this product yet."
        />
      </Card>
    </div>
  );
}
