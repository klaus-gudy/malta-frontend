import type { ScheduleRow } from "./types";

export function money(n: number | undefined | null): string {
  return "TZS " + Number(n || 0).toLocaleString("en-US");
}

export function moneyShort(n: number): string {
  if (n >= 1e9) return "TZS " + (n / 1e9).toFixed(1) + "B";
  if (n >= 1e6) return "TZS " + (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return "TZS " + Math.round(n / 1e3) + "K";
  return "TZS " + n;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function fmtDate(s: string | undefined): string {
  if (!s) return "—";
  const [y, m, d] = s.split("-");
  return `${+d} ${MONTHS[+m - 1]} ${y}`;
}

export function initials(name: string): string {
  if (!name) return "";
  return name
    .split(" ")
    .map((x) => x[0])
    .slice(0, 2)
    .join("");
}

// Status pill colors — [foreground, background] — ported verbatim from the design.
const PILLS: Record<string, [string, string]> = {
  Draft: ["#6b7280", "#f1efe9"],
  Submitted: ["#1d4ed8", "#e8eefb"],
  "Under Review": ["#b45309", "#fbf0df"],
  Approved: ["#047857", "#e3f3eb"],
  Rejected: ["#b91c1c", "#fbeaea"],
  Cancelled: ["#6b7280", "#f1efe9"],
  "Pending Disbursement": ["#b45309", "#fbf0df"],
  Disbursed: ["#047857", "#e3f3eb"],
  Failed: ["#b91c1c", "#fbeaea"],
  Active: ["#047857", "#e3f3eb"],
  Overdue: ["#b91c1c", "#fbeaea"],
  Closed: ["#6b7280", "#f1efe9"],
  "Written Off": ["#6b7280", "#ece8e0"],
  Pending: ["#b45309", "#fbf0df"],
  Verified: ["#047857", "#e3f3eb"],
  Inactive: ["#6b7280", "#f1efe9"],
  Due: ["#b45309", "#fbf0df"],
  Current: ["#047857", "#e3f3eb"],
  Paid: ["#047857", "#e3f3eb"],
  Ready: ["#047857", "#e3f3eb"],
};

export function pill(status: string): { fg: string; bg: string } {
  const c = PILLS[status] || ["#6b7280", "#f1efe9"];
  return { fg: c[0], bg: c[1] };
}

// Pill rendered as inline style — the design uses arbitrary status colors.
export function pillStyle(status: string): React.CSSProperties {
  const p = pill(status);
  return { color: p.fg, backgroundColor: p.bg };
}

// Repayment schedule — flat or reducing balance — ported from the design.
export function schedule(
  principal: number,
  ratePct: number,
  term: number,
  method: string,
  startDate?: string,
): ScheduleRow[] {
  const rows: ScheduleRow[] = [];
  const start = startDate ? new Date(startDate) : new Date("2026-06-10");
  const monthlyFee = 0;

  if (method && method.indexOf("Reducing") >= 0) {
    const mr = ratePct / 100 / 12;
    let bal = principal;
    const pay = Math.round((principal * mr) / (1 - Math.pow(1 + mr, -term)));
    for (let i = 1; i <= term; i++) {
      const interest = Math.round(bal * mr);
      let prin = pay - interest;
      if (i === term) prin = bal;
      bal = Math.max(0, bal - prin);
      const due = new Date(start);
      due.setMonth(start.getMonth() + i);
      rows.push({ n: i, due: due.toISOString().slice(0, 10), principal: prin, interest, fee: monthlyFee, total: prin + interest + monthlyFee, balance: bal });
    }
  } else {
    const totalInt = Math.round(principal * (ratePct / 100) * (term / 12));
    const perInt = Math.round(totalInt / term);
    const perPrin = Math.round(principal / term);
    let bal = principal;
    for (let i = 1; i <= term; i++) {
      let prin = perPrin;
      if (i === term) prin = bal;
      bal = Math.max(0, bal - prin);
      const due = new Date(start);
      due.setMonth(start.getMonth() + i);
      rows.push({ n: i, due: due.toISOString().slice(0, 10), principal: prin, interest: perInt, fee: monthlyFee, total: prin + perInt + monthlyFee, balance: bal });
    }
  }
  return rows;
}

export function inRange(ds: string, from: string, to: string): boolean {
  if (from && (!ds || ds < from)) return false;
  if (to && (!ds || ds > to)) return false;
  return true;
}
