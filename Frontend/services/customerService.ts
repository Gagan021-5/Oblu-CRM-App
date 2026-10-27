/**
 * Customer Service — Real REST API integration for Employee CRM with normalization.
 */

import api from "./api";
import { Customer, CustomerRemark, CustomerFollowUp, CustomerPayment } from "@/data/customerTypes";

export interface CustomerListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: any[];
}

export interface DashboardStats {
  totalCustomers: number;
  activeCustomersCount: number;
  followUpsDueCount: number;
  pendingPaymentsCount: number;
  overduePaymentsCount: number;
  totalOutstandingNum: number;
  totalOutstandingFormatted: string;
  totalLeadsCount: number;
  syncHealth: string;
  weeklyCustomerActivity: Array<{
    date: string;
    day: string;
    interactions: number;
    followups: number;
  }>;
}

export function normalizeCustomer(raw: any): Customer {
  return {
    id: String(raw.id),
    name: raw.name || "",
    contactPerson: raw.contactPerson || "",
    phone: raw.phone && raw.phone !== "nan" ? String(raw.phone) : "",
    email: raw.email || "",
    city: raw.city || raw.district || raw.state || "",
    state: raw.state || "",
    district: raw.district || "",
    latitude: raw.latitude == null ? null : Number(raw.latitude),
    longitude: raw.longitude == null ? null : Number(raw.longitude),
    assignedSalesperson: raw.assignedSalesperson || "",
    customerSince: raw.customerSince || "",
    creditPeriod: raw.creditPeriod || "",
    outstandingPayment: raw.outstandingPayment || "₹0",
    lastContactTime: raw.lastContactTime || "No recent contact",
    nextFollowUp: raw.nextFollowUp || "None scheduled",
    paymentStatus: raw.paymentStatus || "",
    status: raw.status || "",
    remarks: Array.isArray(raw.remarks) ? raw.remarks : [],
    followUps: Array.isArray(raw.followUps) ? raw.followUps : [],
    followupsDue: Number(raw.followups_due) || 0,
    payments: Array.isArray(raw.payments) ? raw.payments : [],
    purchases: Array.isArray(raw.purchases) ? raw.purchases : [],
  };
}

export async function fetchCustomersFromApi(params?: {
  search?: string;
  filter?: string;
  page?: number;
  page_size?: number;
}): Promise<Customer[]> {
  const rawList: any[] = [];
  let page = params?.page || 1;
  const pageSize = params?.page_size || 200;
  while (true) {
    const res = await api.get<CustomerListResponse | any[]>("/customers/", {
      params: {
        search: params?.search || undefined,
        filter: params?.filter && params.filter !== "all" ? params.filter : undefined,
        page,
        page_size: pageSize,
      },
    });
    if (Array.isArray(res.data)) {
      rawList.push(...res.data);
      break;
    }
    rawList.push(...(Array.isArray(res.data?.results) ? res.data.results : []));
    if (!res.data?.next) break;
    page += 1;
  }
  return rawList.map(normalizeCustomer);
}

export async function fetchCustomerMapPointsFromApi(): Promise<Customer[]> {
  const response = await api.get<any[]>("/customers/map/");
  return response.data.map(normalizeCustomer);
}

export async function fetchCustomerPageFromApi(params?: {
  search?: string;
  filter?: string;
  payment_status?: string;
  has_outstanding?: boolean;
  ordering?: string;
  page?: number;
  page_size?: number;
}): Promise<{ customers: Customer[]; nextPage: number | null; count: number }> {
  const res = await api.get<CustomerListResponse | any[]>("/customers/", {
    params: {
      search: params?.search || undefined,
      filter: params?.filter && params.filter !== "all" ? params.filter : undefined,
      payment_status: params?.payment_status && params.payment_status !== "all" ? params.payment_status : undefined,
      has_outstanding: params?.has_outstanding ? "true" : undefined,
      ordering: params?.ordering && params.ordering !== "default" ? params.ordering : undefined,
      page: params?.page || 1,
      page_size: params?.page_size || 100,
    },
  });
  if (Array.isArray(res.data)) {
    return { customers: res.data.map(normalizeCustomer), nextPage: null, count: res.data.length };
  }
  const results = Array.isArray(res.data?.results) ? res.data.results : [];
  const nextPage = res.data?.next
    ? Number(new URL(res.data.next).searchParams.get("page") || (params?.page || 1) + 1)
    : null;
  return { customers: results.map(normalizeCustomer), nextPage, count: Number(res.data?.count) || 0 };
}

export async function fetchCustomerByIdFromApi(id: string): Promise<Customer> {
  const numericId = id.replace(/[^0-9]/g, "") || id;
  const res = await api.get<any>(`/customers/${numericId}/`);
  return normalizeCustomer(res.data);
}

export async function addCustomerRemarkApi(customerId: string, remarkText: string): Promise<CustomerRemark> {
  const numericId = customerId.replace(/[^0-9]/g, "") || customerId;
  const res = await api.post(`/customers/${numericId}/remarks/`, { remark: remarkText });
  return res.data;
}

export async function scheduleCustomerFollowUpApi(
  customerId: string,
  data: { date: string; time: string; purpose: string; notes: string }
): Promise<CustomerFollowUp> {
  const numericId = customerId.replace(/[^0-9]/g, "") || customerId;
  const res = await api.post(`/customers/${numericId}/followups/`, {
    followup_date: data.date,
    note: `${data.purpose}: ${data.notes}${data.time ? ` | Time: ${data.time}` : ""}`,
  });
  return res.data;
}
export async function handlePaymentTicketApi(
  customerId: string,
  paymentId: string,
  action: "raise" | "solve" | "email" | "expected" | "remark",
  extra: { expected_date?: string; remark?: string } = {}
): Promise<{ success: boolean; ticket_status: "RAISED" | "SOLVED" | "NONE"; email_sent?: boolean; payment?: any }> {
  const numericId = customerId.replace(/[^0-9]/g, "") || customerId;
  const numericPaymentId = paymentId.replace(/[^0-9]/g, "") || paymentId;
  const res = await api.post(`/customers/${numericId}/payment-ticket/`, {
    payment_id: numericPaymentId,
    action,
    ...extra,
  });
  return res.data;
}
export async function fetchDashboardStatsApi(): Promise<DashboardStats> {
  const res = await api.get<DashboardStats>("/dashboard/stats/");
  return res.data;
}


export interface CustomerChartsData {
  totalCustomers: number;
  salespersonDistribution: Array<{ name: string; customers: number }>;
  stateDistribution: Array<{ state: string; count: number }>;
  vouchers: {
    total: number;
    overdue: number;
    pending: number;
    paid: number;
  };
  totalOutstanding: number;
  totalOutstandingFormatted: string;
}

export async function fetchCustomerChartsApi(): Promise<CustomerChartsData> {
  const res = await api.get<CustomerChartsData>("/customers/charts/");
  return res.data;
}

export async function updatePaymentExpectedDateApi(
  customerId: string,
  paymentId: string,
  expectedDate: string
): Promise<{ success: boolean; payment?: any }> {
  return handlePaymentTicketApi(customerId, paymentId, "expected", { expected_date: expectedDate });
}
export async function addPaymentThreadRemarkApi(
  customerId: string,
  paymentId: string,
  remark: string
): Promise<{ success: boolean; payment?: any }> {
  return handlePaymentTicketApi(customerId, paymentId, "remark", { remark });
}
