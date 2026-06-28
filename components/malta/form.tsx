import * as React from "react";
import { cn } from "@/lib/utils";

/** Amber uppercase section heading used inside form cards. */
export function FormSection({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-3.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-primary-dark",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** A labelled form field — label sits above the control. */
export function Field({
  label,
  required,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="text-[11.5px] font-semibold text-[#6f6a61]">
        {label}
        {required ? " *" : ""}
      </span>
      <div className="mt-[5px]">{children}</div>
    </label>
  );
}

/** A read-only fact: small uppercase key over a value. */
export function Fact({
  k,
  children,
}: {
  k: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-[10.5px] font-semibold uppercase tracking-[0.05em] text-[#9a948a]">
        {k}
      </div>
      <div className="mt-[3px] text-[13px]">{children}</div>
    </div>
  );
}
