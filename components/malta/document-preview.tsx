"use client";

import * as React from "react";
import { useDocumentContent } from "@/hooks/queries";
import { Button } from "@/components/ui/button";

/**
 * Modal that previews a customer document. The bytes are fetched on demand from
 * the backend (`/customers/documents/:id/content`) as a base64 data URL and
 * rendered inline — images as <img>, everything else (PDF, text, html) in an
 * <iframe>. A download link is always offered.
 */
export function DocumentPreview({
  docId,
  onClose,
}: {
  docId: string;
  onClose: () => void;
}) {
  const { data, isLoading, isError } = useDocumentContent(docId);

  // Close on Escape.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const content = data?.content ?? "";
  const mime =
    content.startsWith("data:") && content.includes(";")
      ? content.slice(5, content.indexOf(";"))
      : "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="flex max-h-[88vh] w-full max-w-[820px] flex-col overflow-hidden rounded-lg bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-table-border px-4 py-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">
              {data?.type ?? "Document"}
            </div>
            <div className="truncate font-mono text-[11.5px] text-[#9a948a]">
              {data?.file}
            </div>
          </div>
          <div className="flex flex-shrink-0 gap-2">
            {content ? (
              <a
                href={content}
                download={data?.file || "document"}
                className="inline-flex h-8 items-center rounded-md border border-input bg-card px-3 text-[12.5px] font-medium text-[#6f6a61] hover:bg-secondary"
              >
                ↓ Download
              </a>
            ) : null}
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>

        <div className="min-h-[320px] flex-1 overflow-auto bg-surface-subtle p-3">
          {isLoading ? (
            <div className="flex h-[320px] items-center justify-center text-[13px] text-muted-foreground">
              Loading document…
            </div>
          ) : isError || !content ? (
            <div className="flex h-[320px] items-center justify-center text-[13px] text-destructive">
              Could not load the document.
            </div>
          ) : mime.startsWith("image/") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={content}
              alt={data?.file ?? "document"}
              className="mx-auto max-h-[70vh] max-w-full rounded-md"
            />
          ) : (
            <iframe
              src={content}
              title={data?.file ?? "document"}
              className="h-[70vh] w-full rounded-md bg-white"
            />
          )}
        </div>
      </div>
    </div>
  );
}
