export type PaymentStatus = "paid" | "pending" | "overdue" | "no_payment";
export type CustomerStatus = "Active" | "Inactive" | "VIP";

export interface CustomerRemark {
  id: string;
  date: string;
  time: string;
  text: string;
  author: string;
}

export interface CustomerFollowUp {
  id: string;
  date: string;
  time: string;
  purpose: string;
  status: "scheduled" | "completed" | "cancelled";
  notes: string;
}

export interface CustomerPayment {
  id: string;
  invoiceNumber: string;
  amount: string;
  dueDate: string;
  expectedDate?: string;
  isDateCrossed?: boolean;
  status: "paid" | "pending" | "overdue";
  ticketStatus?: "NONE" | "RAISED" | "SOLVED";
  ticketRaisedAt?: string;
  emailSent?: boolean;
  recipient?: string;
  emailRecipient?: string;
  sentAt?: string;
  emailSentAt?: string;
}

export interface Customer {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  city: string;
  state?: string;
  district?: string;
  latitude?: number | null;
  longitude?: number | null;
  assignedSalesperson: string;
  customerSince: string;
  creditPeriod: string;
  outstandingPayment: string;
  lastContactTime: string;
  nextFollowUp: string;
  paymentStatus: PaymentStatus;
  status: CustomerStatus;
  remarks: CustomerRemark[];
  followUps: CustomerFollowUp[];
  payments: CustomerPayment[];
}

// Cleaned: No dummy mock data
const INITIAL_CUSTOMERS: Customer[] = [];

let mockCustomersStore: Customer[] = [...INITIAL_CUSTOMERS];

export async function getMockCustomers(delayMs: number = 0): Promise<Customer[]> {
  if (delayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  return [...mockCustomersStore];
}

export async function getMockCustomerById(id: string): Promise<Customer | undefined> {
  return mockCustomersStore.find((c) => c.id === id);
}

export async function addMockCustomerRemark(
  customerId: string,
  text: string,
  author: string = "You"
): Promise<CustomerRemark> {
  const remark: CustomerRemark = {
    id: `rem-${Date.now()}`,
    date: "Today",
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    text,
    author,
  };
  const customer = mockCustomersStore.find((c) => c.id === customerId);
  if (customer) {
    customer.remarks.unshift(remark);
  }
  return remark;
}

export async function scheduleMockCustomerFollowUp(
  customerId: string,
  data: { date: string; time: string; purpose: string; notes: string }
): Promise<CustomerFollowUp> {
  const followUp: CustomerFollowUp = {
    id: `fu-${Date.now()}`,
    date: data.date,
    time: data.time,
    purpose: data.purpose,
    status: "scheduled",
    notes: data.notes,
  };
  const customer = mockCustomersStore.find((c) => c.id === customerId);
  if (customer) {
    customer.followUps.unshift(followUp);
    customer.nextFollowUp = `${data.date}, ${data.time}`;
  }
  return followUp;
}

export async function raiseMockPaymentTicket(
  customerId: string,
  paymentId: string
): Promise<CustomerPayment | undefined> {
  const customer = mockCustomersStore.find((c) => c.id === customerId);
  if (!customer) return undefined;
  const payment = customer.payments.find((p) => p.id === paymentId);
  if (!payment) return undefined;
  payment.ticketStatus = "RAISED";
  payment.ticketRaisedAt = new Date().toISOString();
  return payment;
}

export async function solveMockPaymentTicket(
  customerId: string,
  paymentId: string
): Promise<CustomerPayment | undefined> {
  const customer = mockCustomersStore.find((c) => c.id === customerId);
  if (!customer) return undefined;
  const payment = customer.payments.find((p) => p.id === paymentId);
  if (!payment) return undefined;
  payment.ticketStatus = "SOLVED";
  return payment;
}

export async function sendMockPaymentReminderEmail(
  customerId: string,
  paymentId: string,
  recipientEmail?: string
): Promise<CustomerPayment | undefined> {
  const customer = mockCustomersStore.find((c) => c.id === customerId);
  if (!customer) return undefined;
  const payment = customer.payments.find((p) => p.id === paymentId);
  if (!payment) return undefined;
  payment.emailSent = true;
  payment.recipient = recipientEmail || customer.email;
  payment.emailRecipient = recipientEmail || customer.email;
  payment.sentAt = new Date().toISOString();
  payment.emailSentAt = new Date().toISOString();
  return payment;
}

export function resetMockCustomers(): void {
  mockCustomersStore = [...INITIAL_CUSTOMERS];
}
