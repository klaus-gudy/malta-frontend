import * as React from "react";

/** Standard screen heading: title + subtitle on the left, actions on the right. */
export function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-[18px] flex flex-wrap items-end justify-between gap-3">
      <div>
        <div className="text-xl font-semibold tracking-[-0.01em]">{title}</div>
        {subtitle ? (
          <div className="mt-0.5 text-[12.5px] text-[#7a756c]">{subtitle}</div>
        ) : null}
      </div>
      {children ? <div className="flex gap-2.5">{children}</div> : null}
    </div>
  );
}
