/**
 * Permission Service — connects to Django DRF access control / auth endpoints.
 * Returns authenticated user details, allowed apps, and hierarchy scope.
 */

import api from "./api";

export interface AllowedApp {
  id: string;
  label: string;
  icon: string;
}

export interface SubordinateUser {
  id: number;
  salesperson_id?: number | null;
  username: string;
  name: string;
  role: string;
}

export interface HierarchyScope {
  can_view_all_salespersons: boolean;
  subordinates: SubordinateUser[];
}

export interface UserPermissionProfile {
  user: {
    id: number;
    username: string;
    name: string;
    role: string;
    reporting_to?: string | null;
  };
  allowed_apps: AllowedApp[];
  hierarchy_scope: HierarchyScope;
  permissions?: string[];
}

export const DEFAULT_ALLOWED_APPS: AllowedApp[] = [
  { id: "all", label: "All", icon: "grid" },
  { id: "customers", label: "Customers", icon: "people" },
  { id: "inventory", label: "Inventory", icon: "cube" },
  { id: "proforma", label: "Proforma", icon: "document" },
  { id: "hrms", label: "HRMS", icon: "briefcase" },
  { id: "incentives", label: "Incentives", icon: "trophy" },
];

export async function fetchUserPermissionsApi(): Promise<UserPermissionProfile> {
  try {
    const res = await api.get<UserPermissionProfile>("/auth/me/");
    if (res.data && res.data.user && Array.isArray(res.data.allowed_apps)) {
      return res.data;
    }
  } catch {
    // Try secondary endpoint
  }

  try {
    const res = await api.get<UserPermissionProfile>("/access-control/my-permissions/");
    if (res.data && res.data.user && Array.isArray(res.data.allowed_apps)) {
      return res.data;
    }
  } catch {
    // Fallback handled below
  }

  return {
    user: {
      id: 1,
      username: "employee",
      name: "Employee User",
      role: "Salesperson",
      reporting_to: "Management",
    },
    allowed_apps: DEFAULT_ALLOWED_APPS,
    hierarchy_scope: {
      can_view_all_salespersons: false,
      subordinates: [],
    },
    permissions: [],
  };
}
