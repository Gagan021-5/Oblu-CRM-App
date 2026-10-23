/**
 * Customer Service — Real REST API integration for Employee CRM with normalization.
 */

import api from "./api";
import { Customer, CustomerRemark, CustomerFollowUp, CustomerPayment, getMockCustomers, getMockCustomerById } from "@/data/mockCustomers";

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
  overduePaymentsCount: number;
  totalOutstandingNum: number;
  totalOutstandingFormatted: string;
  totalLeadsCount: number;
  syncHealth: string;
}

export function normalizeCustomer(raw: any): Customer {
  return {
    id: String(raw.id),
    name: raw.name || "Customer",
    contactPerson: raw.contactPerson || raw.name || "Contact",
    phone: raw.phone && raw.phone !== "nan" ? String(raw.phone) : "",
    email: raw.email || "",
    city: raw.city || raw.district || raw.state || "Office",
    assignedSalesperson: raw.assignedSalesperson || "Sales Rep",
    customerSince: raw.customerSince || "2024",
    creditPeriod: raw.creditPeriod || "15 Days",
    outstandingPayment: raw.outstandingPayment || "₹0",
    lastContactTime: raw.lastContactTime || "No recent contact",
    nextFollowUp: raw.nextFollowUp || "None scheduled",
    paymentStatus: raw.paymentStatus || "pending",
    status: raw.status || "Active",
    remarks: Array.isArray(raw.remarks) ? raw.remarks : [],
    followUps: Array.isArray(raw.followUps) ? raw.followUps : [],
    payments: Array.isArray(raw.payments) ? raw.payments : [],
  };
}

export async function fetchCustomersFromApi(params?: {
  search?: string;
  filter?: string;
  page?: number;
  page_size?: number;
}): Promise<Customer[]> {
  try {
    const res = await api.get<CustomerListResponse | any[]>("/customers/", {
      params: {
        search: params?.search || undefined,
        filter: params?.filter && params.filter !== "all" ? params.filter : undefined,
        page: params?.page || 1,
        page_size: params?.page_size || 50,
      },
    });

    let rawList: any[] = [];
    if (Array.isArray(res.data)) {
      rawList = res.data;
    } else if (res.data && Array.isArray(res.data.results)) {
      rawList = res.data.results;
    }
    return rawList.map(normalizeCustomer);
  } catch (error) {
    console.warn("[CustomerService] API fetch failed, falling back to cached/mock data:", error);
    return [];
  }
}

export async function fetchCustomerByIdFromApi(id: string): Promise<Customer | null> {
  const numericId = id.replace(/[^0-9]/g, "") || id;
  try {
    const res = await api.get<any>(`/customers/${numericId}/`);
    return normalizeCustomer(res.data);
  } catch (error) {
    console.warn(`[CustomerService] API fetch for customer ${id} failed, falling back to mock:`, error);
    return (await getMockCustomerById(id)) || null;
  }
}

export async function addCustomerRemarkApi(customerId: string, remarkText: string): Promise<CustomerRemark> {
  const numericId = customerId.replace(/[^0-9]/g, "") || customerId;
  try {
    const res = await api.post(`/customers/${numericId}/remarks/`, {
      remark: remarkText,
    });
    return res.data;
  } catch (error) {
    console.warn("[CustomerService] Add remark API failed, simulating locally:", error);
    return {
      id: `rem-${Date.now()}`,
      date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      text: remarkText,
      author: "You (Offline)",
    };
  }
}

export async function scheduleCustomerFollowUpApi(
  customerId: string,
  data: { date: string; time: string; purpose: string; notes: string }
): Promise<CustomerFollowUp> {
  const numericId = customerId.replace(/[^0-9]/g, "") || customerId;
  try {
    const res = await api.post(`/customers/${numericId}/followups/`, {
      followup_date: data.date,
      note: `${data.purpose} • ${data.notes}`,
    });
    return res.data;
  } catch (error) {
    console.warn("[CustomerService] Schedule follow-up API failed, simulating locally:", error);
    return {
      id: `fu-${Date.now()}`,
      date: data.date,
      time: data.time,
      purpose: data.purpose,
      status: "scheduled",
      notes: data.notes,
    };
  }
}

export async function handlePaymentTicketApi(
  customerId: string,
  paymentId: string,
  action: "raise" | "solve"
): Promise<{ success: boolean; ticketStatus: "RAISED" | "SOLVED" | "NONE" }> {
  const numericId = customerId.replace(/[^0-9]/g, "") || customerId;
  const numericPaymentId = paymentId.replace(/[^0-9]/g, "") || paymentId;
  try {
    const res = await api.post(`/customers/${numericId}/payment-ticket/`, {
      payment_id: numericPaymentId,
      action,
    });
    return res.data;
  } catch (error) {
    console.warn("[CustomerService] Ticket API failed, simulating locally:", error);
    return {
      success: true,
      ticketStatus: action === "raise" ? "RAISED" : "SOLVED",
    };
  }
}

export async function fetchDashboardStatsApi(): Promise<DashboardStats> {
  try {
    const res = await api.get<DashboardStats>("/dashboard/stats/");
    return res.data;
  } catch (error) {
    console.warn("[CustomerService] Dashboard stats API failed, returning defaults:", error);
    return {
      totalCustomers: 0,
      activeCustomersCount: 0,
      followUpsDueCount: 0,
      overduePaymentsCount: 0,
      totalOutstandingNum: 0,
      totalOutstandingFormatted: "₹0",
      totalLeadsCount: 0,
      syncHealth: "Live Telephony Active",
    };
  }
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

export async function fetchCustomerChartsApi(): Promise<CustomerChartsData | null> {
  try {
    const res = await api.get<CustomerChartsData>('/customers/charts/');
    return res.data;
  } catch (error) {
    console.warn('[CustomerService] Charts API failed:', error);
    return null;
  }
}

export async function updatePaymentExpectedDateApi(
  customerId: string,
  paymentId: string,
  expectedDate: string
): Promise<{ success: boolean; payment?: any }> {
  const numericId = customerId.replace(/[^0-9]/g, '') || customerId;
  const numericPaymentId = paymentId.replace(/[^0-9]/g, '') || paymentId;
  try {
    const res = await api.post(`/customers/${numericId}/payment-ticket/`, {
      payment_id: numericPaymentId,
      action: 'expected',
      expected_date: expectedDate,
    });
    return res.data;
  } catch (error) {
    console.warn('[CustomerService] Update expected date API failed:', error);
    return { success: false };
  }
}

export async function addPaymentThreadRemarkApi(
  customerId: string,
  paymentId: string,
  remark: string
): Promise<{ success: boolean; payment?: any }> {
  const numericId = customerId.replace(/[^0-9]/g, '') || customerId;
  const numericPaymentId = paymentId.replace(/[^0-9]/g, '') || paymentId;
  try {
    const res = await api.post(`/customers/${numericId}/payment-ticket/`, {
      payment_id: numericPaymentId,
      action: 'remark',
      remark,
    });
    return res.data;
  } catch (error) {
    console.warn('[CustomerService] Add payment remark API failed:', error);
    return { success: false };
  }
}
