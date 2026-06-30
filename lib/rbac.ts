import type { RoleId } from "./types";

export interface RoleMeta {
  label: string;
  name: string;
  branch: string;
}

export const roleMeta: Record<RoleId, RoleMeta> = {
  admin: { label: "Administrator", name: "Joseph Kimaro", branch: "HQ" },
  officer: { label: "Loan Officer", name: "Amina Hassan", branch: "Kariakoo" },
  manager: { label: "Branch Manager", name: "Grace Lyimo", branch: "Kariakoo" },
  operations: { label: "Operations Officer", name: "Said Juma", branch: "HQ" },
  cashier: { label: "Cashier", name: "Halima Ngowi", branch: "Kariakoo" },
};

export const roleOptions: { id: RoleId; label: string }[] = [
  { id: "admin", label: "Administrator" },
  { id: "officer", label: "Loan Officer" },
  { id: "manager", label: "Branch Manager" },
  { id: "operations", label: "Operations Officer" },
  { id: "cashier", label: "Cashier" },
];

export type BadgePage = "customers" | "applications" | "disbursements" | "accounts";

export interface NavDef {
  page: string;
  href: string;
  label: string;
  icon: string;
  roles: RoleId[];
  badgePage?: BadgePage;
}

export const navDef: NavDef[] = [
  { page: "dashboard", href: "/", label: "Dashboard", icon: "LayoutDashboard", roles: ["admin", "officer", "manager", "operations", "cashier"] },
  { page: "customers", href: "/customers", label: "Customers", icon: "Users", roles: ["admin", "officer", "manager", "operations"], badgePage: "customers" },
  { page: "applications", href: "/applications", label: "Loan Applications", icon: "FileText", roles: ["admin", "officer", "manager"], badgePage: "applications" },
  { page: "disbursements", href: "/disbursements", label: "Disbursements", icon: "ArrowLeftRight", roles: ["admin", "operations", "manager"], badgePage: "disbursements" },
  { page: "accounts", href: "/accounts", label: "Loan Accounts", icon: "Landmark", roles: ["admin", "officer", "manager", "operations", "cashier"], badgePage: "accounts" },
  { page: "products", href: "/products", label: "Loan Products", icon: "Settings", roles: ["admin", "manager"] },
  { page: "users", href: "/users", label: "User Management", icon: "UserCog", roles: ["admin"] },
];

export type Permission =
  | "approve"
  | "configProducts"
  | "manageUsers"
  | "disburse"
  | "receivePayment"
  | "createApplication"
  | "createCustomer";

const PERMISSIONS: Record<Permission, RoleId[]> = {
  approve: ["admin", "manager"],
  configProducts: ["admin", "manager"],
  manageUsers: ["admin"],
  disburse: ["admin", "operations", "manager"],
  receivePayment: ["admin", "cashier", "manager"],
  createApplication: ["admin", "officer", "manager"],
  createCustomer: ["admin", "officer", "manager", "operations"],
};

export function can(role: RoleId, action: Permission): boolean {
  return (PERMISSIONS[action] || []).includes(role);
}

export const branchOptions = ["HQ", "Kariakoo", "Mwanza", "Arusha", "Dodoma", "Moshi"];
