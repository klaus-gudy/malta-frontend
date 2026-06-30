import { fmtDate } from "@/lib/format";
import type { AuditEntry } from "@/lib/types";

// Split a stored "YYYY-MM-DD HH:mm" timestamp into a readable date + time.
function splitTime(ts: string): { date: string; time: string } {
  const [d, t = ""] = ts.split(" ");
  return { date: fmtDate(d), time: t };
}

// Pick an accent colour for the dot based on the kind of event.
function dotColor(action: string): string {
  const a = action.toLowerCase();
  if (a.includes("reject") || a.includes("overdue") || a.includes("removed"))
    return "#b91c1c";
  if (a.includes("approve") || a.includes("verified") || a.includes("disbursed") || a.includes("payment"))
    return "#047857";
  if (a.includes("review") || a.includes("pending") || a.includes("submitted"))
    return "#b45309";
  return "#7a756c";
}

export function ActivityTimeline({
  entries,
  empty = "No activity recorded yet.",
}: {
  entries: AuditEntry[];
  empty?: string;
}) {
  if (entries.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-muted-foreground">{empty}</div>
    );
  }

  return (
    <div className="flex flex-col">
      {entries.map((e, i) => {
        const { date, time } = splitTime(e.time);
        const last = i === entries.length - 1;
        return (
          <div key={i} className="flex gap-3.5">
            {/* rail */}
            <div className="flex flex-col items-center">
              <div
                className="mt-1 size-2.5 flex-shrink-0 rounded-full ring-4 ring-[var(--surface-subtle,#f6f3ee)]"
                style={{ background: dotColor(e.action) }}
              />
              {!last && <div className="mt-1 w-px flex-1 bg-table-border" />}
            </div>
            {/* content */}
            <div className={`min-w-0 ${last ? "pb-0" : "pb-4"}`}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <div className="text-[13px] font-semibold text-[#1f1d1a]">
                  {e.action}
                </div>
                <div className="font-mono text-[11px] text-[#9a948a]">
                  {date}
                  {time ? ` · ${time}` : ""}
                </div>
              </div>
              {e.detail ? (
                <div className="mt-0.5 text-[12px] text-[#6f6a61]">{e.detail}</div>
              ) : null}
              <div className="mt-0.5 text-[11px] text-[#a8a298]">
                {e.actor} · {e.role}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
