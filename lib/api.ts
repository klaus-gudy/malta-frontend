// In-memory mock API for the Malta LMS. React Query treats these as the data
// source: queries read snapshots, mutations modify the in-memory DB and the
// caller invalidates the relevant query keys. Simulated latency makes the
// loading / fetching states real.

import { seed } from "./seed";
import type {
  Application,
  ApplicationStatus,
  Customer,
  CustomerDocument,
  Database,
  KycStatus,
  Loan,
  RoleId,
  User,
} from "./types";
import { roleMeta } from "./rbac";

// Singleton DB — survives client-side navigation, resets on full reload.
let db: Database = seed();
// KYC document status overrides keyed by document id.
const docOverrides: Record<string, KycStatus> = {};

function delay<T>(value: T, ms = 220): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

const clone = <T>(v: T): T =>
  typeof structuredClone === "function"
    ? structuredClone(v)
    : JSON.parse(JSON.stringify(v));

// ---------- QUERIES ----------
export const api = {
  customers: () => delay(clone(db.customers)),
  customer: (id: string) =>
    delay(clone(db.customers.find((c) => c.id === id)) ?? null),
  products: () => delay(clone(db.products)),
  product: (id: string) =>
    delay(clone(db.products.find((p) => p.id === id)) ?? null),
  applications: () => delay(clone(db.applications)),
  application: (id: string) =>
    delay(clone(db.applications.find((a) => a.id === id)) ?? null),
  loans: () => delay(clone(db.loans)),
  loan: (id: string) => delay(clone(db.loans.find((l) => l.id === id)) ?? null),
  users: () => delay(clone(db.users)),
  audit: (id: string) => delay(clone(db.audit[id] ?? null)),
  documents: (custId: string) => delay(documentsFor(custId)),
};

function documentsFor(custId: string): CustomerDocument[] {
  const c = db.customers.find((x) => x.id === custId);
  const base: CustomerDocument[] = [
    { id: custId + "-D1", type: "National ID (NIDA)", file: "nida_front.jpg", size: "1.2 MB", up: "2026-05-28", status: "Verified" },
    { id: custId + "-D2", type: "Passport photo", file: "passport_photo.jpg", size: "0.4 MB", up: "2026-05-28", status: "Verified" },
    { id: custId + "-D3", type: "Proof of residence", file: "residence_letter.pdf", size: "0.8 MB", up: "2026-05-29", status: "Pending" },
    { id: custId + "-D4", type: "Business licence", file: "business_licence.pdf", size: "1.1 MB", up: "2026-05-29", status: "Pending" },
  ];
  if (c?.kyc === "Rejected") base[2].status = "Rejected";
  return base.map((d) => ({ ...d, status: docOverrides[d.id] ?? d.status }));
}

// ---------- MUTATIONS ----------
export interface NewCustomerInput {
  name: string;
  gender?: string;
  dob?: string;
  phone: string;
  email?: string;
  nida: string;
  region?: string;
  ward?: string;
  address?: string;
  occupation?: string;
  business?: string;
  monthlyIncome?: number;
  nokName?: string;
  nokRelation?: string;
  nokPhone?: string;
}

export const mutations = {
  createCustomer: (input: NewCustomerInput): Promise<Customer> => {
    const id = "CUS-10" + (db.customers.length + 1).toString().padStart(2, "0");
    const c: Customer = {
      id,
      name: input.name,
      gender: input.gender || "Female",
      dob: input.dob || "1990-01-01",
      phone: input.phone,
      email: input.email || "",
      nida: input.nida,
      region: input.region || "Dar es Salaam",
      ward: input.ward || "",
      address: input.address || "",
      occupation: input.occupation || "",
      business: input.business || "",
      monthlyIncome: Number(input.monthlyIncome || 0),
      nokName: input.nokName || "",
      nokRelation: input.nokRelation || "",
      nokPhone: input.nokPhone || "",
      status: "Active",
      kyc: "Pending",
      joined: "2026-06-23",
      photo: "#9a8b6f",
    };
    db = { ...db, customers: [c, ...db.customers] };
    return delay(clone(c));
  },

  createApplication: (
    input: {
      customer: string;
      product: string;
      amount: number;
      term: number;
      purpose: string;
      docs?: number;
      status: Extract<ApplicationStatus, "Draft" | "Submitted">;
    },
    role: RoleId,
  ): Promise<Application> => {
    const n = db.applications.length + 43;
    const id = "LAP-2026-00" + n;
    const app: Application = {
      id,
      customer: input.customer,
      product: input.product,
      amount: Number(input.amount),
      term: Number(input.term || 9),
      purpose: input.purpose || "—",
      status: input.status,
      officer: roleMeta[role].name,
      created: "2026-06-23",
      docs: Number(input.docs || (input.status === "Draft" ? 1 : 2)),
    };
    db = { ...db, applications: [app, ...db.applications] };
    return delay(clone(app));
  },

  patchApplication: (
    id: string,
    patch: Partial<Application>,
  ): Promise<Application | null> => {
    const apps = db.applications.map((a) => (a.id === id ? { ...a, ...patch } : a));
    db = { ...db, applications: apps };
    return delay(clone(apps.find((a) => a.id === id)) ?? null);
  },

  setKyc: (custId: string, status: KycStatus): Promise<Customer | null> => {
    const cs = db.customers.map((c) =>
      c.id === custId ? { ...c, kyc: status } : c,
    );
    db = { ...db, customers: cs };
    return delay(clone(cs.find((c) => c.id === custId)) ?? null);
  },

  setDocStatus: (
    docId: string,
    status: Extract<KycStatus, "Verified" | "Rejected">,
  ): Promise<void> => {
    docOverrides[docId] = status;
    return delay(undefined);
  },

  toggleUser: (id: string): Promise<User | null> => {
    const us = db.users.map((u) =>
      u.id === id
        ? { ...u, status: u.status === "Active" ? "Inactive" : "Active" }
        : u,
    ) as User[];
    db = { ...db, users: us };
    return delay(clone(us.find((u) => u.id === id)) ?? null);
  },

  disburse: (applicationId: string, _channel: string): Promise<Loan> => {
    const app = db.applications.find((a) => a.id === applicationId);
    const apps = db.applications.map((a) =>
      a.id === applicationId ? { ...a, status: "Disbursed" as const } : a,
    );
    // Materialise a loan account from the approved application.
    const product = db.products.find((p) => p.id === app?.product);
    const loan: Loan = {
      id: "LN-2026-0" + (220 + db.loans.length),
      customer: app?.customer || "",
      product: app?.product || "",
      principal: app?.amount || 0,
      rate: product?.rate || 0,
      term: app?.term || 0,
      method: product?.method || "Flat",
      disbursed: "2026-06-23",
      channel: _channel,
      status: "Active",
      paid: 0,
    };
    db = { ...db, applications: apps, loans: [loan, ...db.loans] };
    return delay(clone(loan));
  },

  takePayment: (loanId: string, _amount: number): Promise<Loan | null> => {
    const loans = db.loans.map((l) =>
      l.id === loanId
        ? { ...l, paid: Math.min(l.term, l.paid + 1), status: l.status === "Overdue" ? ("Active" as const) : l.status }
        : l,
    );
    db = { ...db, loans };
    return delay(clone(loans.find((l) => l.id === loanId)) ?? null);
  },
};
