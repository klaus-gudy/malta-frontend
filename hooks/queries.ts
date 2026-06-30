"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  api,
  mutations,
  type NewCustomerInput,
  type NewProductInput,
  type NewUserInput,
} from "@/lib/api";
import type {
  Application,
  KycStatus,
  RoleId,
} from "@/lib/types";

export const keys = {
  customers: ["customers"] as const,
  customer: (id: string) => ["customer", id] as const,
  products: ["products"] as const,
  product: (id: string) => ["product", id] as const,
  applications: ["applications"] as const,
  application: (id: string) => ["application", id] as const,
  loans: ["loans"] as const,
  loan: (id: string) => ["loan", id] as const,
  loanSchedule: (id: string) => ["loanSchedule", id] as const,
  loanPayments: (id: string) => ["loanPayments", id] as const,
  loanCharges: (id: string) => ["loanCharges", id] as const,
  loanSummary: (id: string) => ["loanSummary", id] as const,
  loanActivity: (id: string) => ["loanActivity", id] as const,
  users: ["users"] as const,
  audit: (id: string) => ["audit", id] as const,
  documents: (id: string) => ["documents", id] as const,
  kycRequirements: (id: string) => ["kycRequirements", id] as const,
  customerAccounts: (id: string) => ["customerAccounts", id] as const,
  dashboard: (from: string, to: string) => ["dashboard", from, to] as const,
};

// ---------- QUERIES ----------
export const useCustomers = () =>
  useQuery({ queryKey: keys.customers, queryFn: api.customers });

export const useCustomer = (id: string) =>
  useQuery({
    queryKey: keys.customer(id),
    queryFn: () => api.customer(id),
    enabled: !!id,
  });

export const useProducts = () =>
  useQuery({ queryKey: keys.products, queryFn: api.products });

export const useProduct = (id: string) =>
  useQuery({
    queryKey: keys.product(id),
    queryFn: () => api.product(id),
    enabled: !!id,
  });

export const useApplications = () =>
  useQuery({ queryKey: keys.applications, queryFn: api.applications });

export const useApplication = (id: string) =>
  useQuery({
    queryKey: keys.application(id),
    queryFn: () => api.application(id),
    enabled: !!id,
  });

export const useLoans = () =>
  useQuery({ queryKey: keys.loans, queryFn: api.loans });

export const useLoan = (id: string) =>
  useQuery({
    queryKey: keys.loan(id),
    queryFn: () => api.loan(id),
    enabled: !!id,
  });

export const useLoanSchedule = (id: string) =>
  useQuery({
    queryKey: keys.loanSchedule(id),
    queryFn: () => api.loanSchedule(id),
    enabled: !!id,
  });

export const useLoanPayments = (id: string) =>
  useQuery({
    queryKey: keys.loanPayments(id),
    queryFn: () => api.loanPayments(id),
    enabled: !!id,
  });

export const useLoanCharges = (id: string) =>
  useQuery({
    queryKey: keys.loanCharges(id),
    queryFn: () => api.loanCharges(id),
    enabled: !!id,
  });

export const useLoanSummary = (id: string) =>
  useQuery({
    queryKey: keys.loanSummary(id),
    queryFn: () => api.loanSummary(id),
    enabled: !!id,
  });

export const useUsers = () =>
  useQuery({ queryKey: keys.users, queryFn: api.users });

export const useAudit = (id: string) =>
  useQuery({
    queryKey: keys.audit(id),
    queryFn: () => api.audit(id),
    enabled: !!id,
  });

export const useDocuments = (custId: string) =>
  useQuery({
    queryKey: keys.documents(custId),
    queryFn: () => api.documents(custId),
    enabled: !!custId,
  });

export const useKycRequirements = (custId: string) =>
  useQuery({
    queryKey: keys.kycRequirements(custId),
    queryFn: () => api.kycRequirements(custId),
    enabled: !!custId,
  });

export const useDocumentContent = (docId: string | null) =>
  useQuery({
    queryKey: ["documentContent", docId] as const,
    queryFn: () => api.documentContent(docId as string),
    enabled: !!docId,
  });

// ---------- MUTATIONS ----------
export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewCustomerInput) => mutations.createCustomer(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.customers }),
  });
}

export function useUpdateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Parameters<typeof mutations.updateCustomer>[1];
    }) => mutations.updateCustomer(id, input),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: keys.customers });
      qc.invalidateQueries({ queryKey: keys.customer(vars.id) });
    },
  });
}

export function useUploadDocument(custId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof mutations.uploadDocument>[1]) =>
      mutations.uploadDocument(custId, input),
    // Uploading affects KYC (a new doc is unverified) — refresh the customer too.
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.documents(custId) });
      qc.invalidateQueries({ queryKey: keys.customer(custId) });
      qc.invalidateQueries({ queryKey: keys.customers });
      qc.invalidateQueries({ queryKey: keys.kycRequirements(custId) });
    },
  });
}

export function useCreateApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      input,
      role,
    }: {
      input: Parameters<typeof mutations.createApplication>[0];
      role: RoleId;
    }) => mutations.createApplication(input, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.applications }),
  });
}

export function usePatchApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      patch,
      role,
    }: {
      id: string;
      patch: Partial<Application>;
      role?: RoleId;
    }) => mutations.patchApplication(id, patch, role),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: keys.applications });
      qc.invalidateQueries({ queryKey: keys.application(vars.id) });
      qc.invalidateQueries({ queryKey: keys.audit(vars.id) });
    },
  });
}

export function useSetKyc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ custId, status }: { custId: string; status: KycStatus }) =>
      mutations.setKyc(custId, status),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: keys.customers });
      qc.invalidateQueries({ queryKey: keys.customer(vars.custId) });
    },
  });
}

export function useSetDocStatus(custId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      docId,
      status,
    }: {
      docId: string;
      status: "Verified" | "Rejected";
    }) => mutations.setDocStatus(docId, status),
    // Verifying/rejecting a doc may flip KYC — refresh the customer too.
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.documents(custId) });
      qc.invalidateQueries({ queryKey: keys.customer(custId) });
      qc.invalidateQueries({ queryKey: keys.customers });
      qc.invalidateQueries({ queryKey: keys.kycRequirements(custId) });
    },
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ input, role }: { input: NewProductInput; role?: RoleId }) =>
      mutations.createProduct(input, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.products }),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
      role,
    }: {
      id: string;
      input: Partial<NewProductInput>;
      role?: RoleId;
    }) => mutations.updateProduct(id, input, role),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: keys.products });
      qc.invalidateQueries({ queryKey: keys.product(vars.id) });
      qc.invalidateQueries({ queryKey: keys.audit(vars.id) });
    },
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewUserInput) => mutations.createUser(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.users }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<NewUserInput> }) =>
      mutations.updateUser(id, input),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: keys.users });
      qc.invalidateQueries({ queryKey: keys.audit(vars.id) });
    },
  });
}

export function useToggleUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => mutations.toggleUser(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: keys.users });
      qc.invalidateQueries({ queryKey: keys.audit(id) });
    },
  });
}

export function useDisburse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      channel,
      role,
    }: {
      id: string;
      channel: string;
      role?: RoleId;
    }) => mutations.disburse(id, channel, role),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.applications });
      qc.invalidateQueries({ queryKey: keys.loans });
    },
  });
}

export function useTakePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      amount,
      method,
      reference,
      role,
    }: {
      id: string;
      amount: number;
      method?: string;
      reference?: string;
      role?: RoleId;
    }) => mutations.takePayment(id, amount, method, reference, role),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: keys.loans });
      qc.invalidateQueries({ queryKey: keys.loan(vars.id) });
      qc.invalidateQueries({ queryKey: keys.loanSchedule(vars.id) });
      qc.invalidateQueries({ queryKey: keys.loanPayments(vars.id) });
      qc.invalidateQueries({ queryKey: keys.loanCharges(vars.id) });
      qc.invalidateQueries({ queryKey: keys.loanSummary(vars.id) });
      qc.invalidateQueries({ queryKey: keys.loanActivity(vars.id) });
    },
  });
}

export function useLoanActivity(id: string) {
  return useQuery({
    queryKey: keys.loanActivity(id),
    queryFn: () => api.loanActivity(id),
    enabled: !!id,
  });
}

// ---------- CUSTOMER ACCOUNTS ----------
export function useCustomerAccounts(custId: string) {
  return useQuery({
    queryKey: keys.customerAccounts(custId),
    queryFn: () => api.customerAccounts(custId),
    enabled: !!custId,
  });
}

export function useDashboard(from: string, to: string) {
  return useQuery({
    queryKey: keys.dashboard(from, to),
    queryFn: () => api.dashboard(from, to),
    enabled: !!from && !!to,
  });
}

export function useAddCustomerAccount(custId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      channel: string;
      accountNumber: string;
      accountName?: string;
      isPrimary?: boolean;
    }) => mutations.addCustomerAccount(custId, input),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: keys.customerAccounts(custId) }),
  });
}

export function useDeleteCustomerAccount(custId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (acctId: string) => mutations.deleteCustomerAccount(acctId),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: keys.customerAccounts(custId) }),
  });
}
