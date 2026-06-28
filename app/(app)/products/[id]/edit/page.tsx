"use client";

import { useParams } from "next/navigation";
import { useProduct } from "@/hooks/queries";
import { ProductForm } from "@/components/malta/product-form";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProductEditPage() {
  const params = useParams<{ id: string }>();
  const { data, isLoading } = useProduct(params.id);

  if (isLoading) return <Skeleton className="h-96 max-w-[860px]" />;
  return <ProductForm product={data} />;
}
