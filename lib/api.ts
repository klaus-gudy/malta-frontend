// HTTP client for the Malta LMS backend (NestJS + PostgreSQL).
//
// The exported `api` (queries) and `mutations` objects keep the exact shapes
// React Query consumes in hooks/queries.ts, so swapping the old in-memory mock
// for the real backend required no changes there. Set NEXT_PUBLIC_API_URL to
// point at a different backend; it defaults to the local dev server.

import type {
  Application,
  ApplicationStatus,
  Customer,
  CustomerDocument,
  Installment,
  KycStatus,
  Loan,
  LoanCharge,
  LoanPayment,
  LoanSummary,
  Product,
  RoleId,
  User,
} from "./types";

const BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3030/api"
).replace(/\/$/, "");

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  path: string,
  options: RequestInit & { allow404?: boolean } = {},
): Promise<T> {
  const { allow404, ...init } = options;
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  // Single-resource lookups treat "not found" as null, matching the old mock.
  if (res.status === 404 && allow404) {
    return null as T;
  }

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = Array.isArray(body?.message)
        ? body.message.join(", ")
        : (body?.message ?? detail);
    } catch {
      // non-JSON error body — keep statusText
    }
    throw new ApiError(res.status, detail);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

const get = <T>(path: string, allow404 = false) =>
  request<T>(path, { method: "GET", allow404 });

const post = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: "POST", body: JSON.stringify(body ?? {}) });

const patch = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: "PATCH", body: JSON.stringify(body ?? {}) });

// ---------- QUERIES ----------
export const api = {
  customers: () => get<Customer[]>("/customers"),
  customer: (id: string) => get<Customer | null>(`/customers/${id}`, true),
  products: () => get<Product[]>("/products"),
  product: (id: string) => get<Product | null>(`/products/${id}`, true),
  applications: () => get<Application[]>("/applications"),
  application: (id: string) =>
    get<Application | null>(`/applications/${id}`, true),
  loans: () => get<Loan[]>("/loans"),
  loan: (id: string) => get<Loan | null>(`/loans/${id}`, true),
  loanSchedule: (id: string) => get<Installment[]>(`/loans/${id}/schedule`),
  loanPayments: (id: string) => get<LoanPayment[]>(`/loans/${id}/payments`),
  loanCharges: (id: string) => get<LoanCharge[]>(`/loans/${id}/charges`),
  loanSummary: (id: string) => get<LoanSummary>(`/loans/${id}/summary`),
  users: () => get<User[]>("/users"),
  audit: (id: string) => get<import("./types").AuditEntry[] | null>(
    `/audit/${id}`,
    true,
  ),
  documents: (custId: string) =>
    get<CustomerDocument[]>(`/customers/${custId}/documents`),
  documentContent: (docId: string) =>
    get<{ id: string; type: string; file: string; content: string }>(
      `/customers/documents/${docId}/content`,
    ),
  kycRequirements: (custId: string) =>
    get<KycRequirements>(`/customers/${custId}/kyc-requirements`),
};

export interface KycRequirements {
  kyc: KycStatus;
  missingFields: string[];
  totalDocuments: number;
  pendingDocuments: number;
  rejectedDocuments: number;
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

export interface NewProductInput {
  name: string;
  category: string;
  min: number;
  max: number;
  minTerm: number;
  maxTerm: number;
  freq: string;
  rate: number;
  method: string;
  fee: number;
  penalty: number;
  grace: number;
  status?: "Active" | "Inactive";
  desc?: string;
}

export interface NewUserInput {
  name: string;
  email: string;
  role: RoleId;
  branch: string;
  status?: "Active" | "Inactive";
}

// A created user carries a one-time temporary password the admin can share.
export type CreatedUser = User & { tempPassword: string };

export interface AuthResult {
  id: string;
  name: string;
  email: string;
  role: RoleId;
  branch: string;
  status: "Active" | "Inactive";
  label: string;
  permissions: string[];
  token: string;
}

// Authentication. Username may be an email or its local-part (e.g. "joseph.admin").
export const auth = {
  login: (username: string, password: string): Promise<AuthResult> =>
    post<AuthResult>("/auth/login", { username, password }),
};

export interface UploadDocumentInput {
  name: string;
  content: string;
  fileName?: string;
}

export const mutations = {
  createCustomer: (input: NewCustomerInput): Promise<Customer> =>
    post<Customer>("/customers", input),

  updateCustomer: (
    id: string,
    input: Partial<NewCustomerInput> & { status?: "Active" | "Inactive" },
  ): Promise<Customer> => patch<Customer>(`/customers/${id}`, input),

  uploadDocument: (
    custId: string,
    input: UploadDocumentInput,
  ): Promise<CustomerDocument> =>
    post<CustomerDocument>(`/customers/${custId}/documents`, input),

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
  ): Promise<Application> =>
    post<Application>("/applications", { ...input, role }),

  patchApplication: (
    id: string,
    patch_: Partial<Application>,
  ): Promise<Application | null> =>
    patch<Application | null>(`/applications/${id}`, patch_),

  setKyc: (custId: string, status: KycStatus): Promise<Customer | null> =>
    patch<Customer | null>(`/customers/${custId}/kyc`, { status }),

  setDocStatus: (
    docId: string,
    status: Extract<KycStatus, "Verified" | "Rejected">,
  ): Promise<void> =>
    patch<void>(`/customers/documents/${docId}/status`, { status }),

  createProduct: (input: NewProductInput): Promise<Product> =>
    post<Product>("/products", input),

  updateProduct: (
    id: string,
    input: Partial<NewProductInput>,
  ): Promise<Product> => patch<Product>(`/products/${id}`, input),

  createUser: (input: NewUserInput): Promise<CreatedUser> =>
    post<CreatedUser>("/users", input),

  updateUser: (id: string, input: Partial<NewUserInput>): Promise<User> =>
    patch<User>(`/users/${id}`, input),

  toggleUser: (id: string): Promise<User | null> =>
    patch<User | null>(`/users/${id}/toggle`),

  disburse: (applicationId: string, channel: string): Promise<Loan> =>
    post<Loan>("/loans/disburse", { applicationId, channel }),

  takePayment: (
    loanId: string,
    amount: number,
    method?: string,
    reference?: string,
  ): Promise<Loan | null> =>
    post<Loan | null>(`/loans/${loanId}/payments`, { amount, method, reference }),
};
