// Domain types for the Malta Microfinance Loan Management System.

export type RoleId =
  | "admin"
  | "officer"
  | "manager"
  | "operations"
  | "cashier";

export type CustomerStatus = "Active" | "Inactive";
export type KycStatus = "Verified" | "Pending" | "Rejected";

export interface Customer {
  id: string;
  name: string;
  gender: string;
  dob: string;
  phone: string;
  email: string;
  nida: string;
  region: string;
  ward: string;
  address: string;
  occupation: string;
  business: string;
  monthlyIncome: number;
  nokName: string;
  nokRelation: string;
  nokPhone: string;
  status: CustomerStatus;
  kyc: KycStatus;
  joined: string;
  photo: string;
}

export interface Product {
  id: string;
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
  status: "Active" | "Inactive";
  desc: string;
}

export type ApplicationStatus =
  | "Draft"
  | "Submitted"
  | "Under Review"
  | "Approved"
  | "Rejected"
  | "Cancelled"
  | "Disbursed";

export interface Application {
  id: string;
  customer: string;
  product: string;
  amount: number;
  term: number;
  purpose: string;
  status: ApplicationStatus;
  officer: string;
  created: string;
  docs: number;
}

export type LoanStatus = "Active" | "Overdue" | "Closed" | "Written Off";

export interface Loan {
  id: string;
  customer: string;
  product: string;
  principal: number;
  rate: number;
  term: number;
  method: string;
  disbursed: string;
  channel: string;
  status: LoanStatus;
  paid: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: RoleId;
  branch: string;
  status: "Active" | "Inactive";
  last: string;
}

export interface AuditEntry {
  actor: string;
  role: string;
  action: string;
  detail: string;
  time: string;
}

export interface Database {
  customers: Customer[];
  products: Product[];
  applications: Application[];
  loans: Loan[];
  users: User[];
  audit: Record<string, AuditEntry[]>;
}

export interface ScheduleRow {
  n: number;
  due: string;
  principal: number;
  interest: number;
  fee: number;
  total: number;
  balance: number;
}

export interface CustomerDocument {
  id: string;
  type: string;
  file: string;
  size: string;
  up: string;
  status: KycStatus;
}

// ---- Repayment domain (served from the backend) ----
export type InstallmentStatus = "Due" | "Paid" | "Overdue" | "Partial";

export interface Installment {
  id: string;
  loanId: string;
  n: number;
  dueDate: string;
  principal: number;
  interest: number;
  fee: number;
  total: number;
  balance: number;
  status: InstallmentStatus;
  paidAmount: number;
  paidDate: string;
}

export interface LoanPayment {
  id: string;
  loanId: string;
  date: string;
  amount: number;
  method: string;
  reference: string;
}

export type ChargeStatus = "Outstanding" | "Paid" | "Waived";

export interface LoanCharge {
  id: string;
  loanId: string;
  installmentN: number;
  type: string;
  amount: number;
  date: string;
  status: ChargeStatus;
}
