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
  status: "paid" | "pending" | "overdue";
}

export interface Customer {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  city: string;
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

const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: "cust-001",
    name: "Orion Systems Pvt Ltd",
    contactPerson: "Vikram Malhotra",
    phone: "+91 98201 44521",
    email: "vikram@orionsystems.in",
    city: "Gurugram",
    assignedSalesperson: "Gagan Sharma",
    customerSince: "Feb 2023",
    creditPeriod: "30 Days",
    outstandingPayment: "₹1,45,000",
    lastContactTime: "Today, 10:30 AM",
    nextFollowUp: "Today, 4:00 PM",
    paymentStatus: "pending",
    status: "Active",
    remarks: [
      {
        id: "rem-101",
        date: "Today",
        time: "10:30 AM",
        text: "Discussed annual AMC renewal and added 25 user licenses. Vikram requested a revised quote before 4 PM.",
        author: "Gagan Sharma",
      },
      {
        id: "rem-102",
        date: "04 Sep 2026",
        time: "03:15 PM",
        text: "In-person visit to Cyber City office. Met procurement director.",
        author: "Gagan Sharma",
      },
      {
        id: "rem-103",
        date: "28 Aug 2026",
        time: "11:00 AM",
        text: "Sent onboarding checklist and security compliance documents.",
        author: "Gagan Sharma",
      },
    ],
    followUps: [
      {
        id: "fol-201",
        date: "Today",
        time: "04:00 PM",
        purpose: "Contract Review & Revised Quote",
        status: "scheduled",
        notes: "Send revised PDF with 10% volume discount applied.",
      },
      {
        id: "fol-202",
        date: "12 Sep 2026",
        time: "11:30 AM",
        purpose: "Quarterly Review Meeting",
        status: "scheduled",
        notes: "Review support SLA and performance tickets.",
      },
    ],
    payments: [
      {
        id: "pay-301",
        invoiceNumber: "INV-2026-894",
        amount: "₹1,45,000",
        dueDate: "15 Sep 2026",
        status: "pending",
      },
      {
        id: "pay-302",
        invoiceNumber: "INV-2026-640",
        amount: "₹2,10,000",
        dueDate: "10 Aug 2026",
        status: "paid",
      },
    ],
  },
  {
    id: "cust-002",
    name: "Nova Labs Diagnostics",
    contactPerson: "Dr. Sameer Sen",
    phone: "+91 98112 39012",
    email: "dr.sameer@novalabs.org",
    city: "New Delhi",
    assignedSalesperson: "Gagan Sharma",
    customerSince: "Oct 2022",
    creditPeriod: "15 Days",
    outstandingPayment: "₹82,500",
    lastContactTime: "Yesterday, 04:15 PM",
    nextFollowUp: "Tomorrow, 11:00 AM",
    paymentStatus: "overdue",
    status: "VIP",
    remarks: [
      {
        id: "rem-104",
        date: "Yesterday",
        time: "04:15 PM",
        text: "Called accounts head Mr. Bansal regarding overdue payment. Promised clearance by Friday.",
        author: "Gagan Sharma",
      },
      {
        id: "rem-105",
        date: "01 Sep 2026",
        time: "02:00 PM",
        text: "Delivered new sensor equipment; calibration signoff completed.",
        author: "Gagan Sharma",
      },
    ],
    followUps: [
      {
        id: "fol-203",
        date: "Tomorrow",
        time: "11:00 AM",
        purpose: "Payment Clearance Confirmation",
        status: "scheduled",
        notes: "Verify RTGS receipt for ₹82,500.",
      },
    ],
    payments: [
      {
        id: "pay-303",
        invoiceNumber: "INV-2026-778",
        amount: "₹82,500",
        dueDate: "30 Aug 2026",
        status: "overdue",
      },
      {
        id: "pay-304",
        invoiceNumber: "INV-2026-512",
        amount: "₹1,15,000",
        dueDate: "15 Jul 2026",
        status: "paid",
      },
    ],
  },
  {
    id: "cust-003",
    name: "Acme Corporation India",
    contactPerson: "Rohan Mehta",
    phone: "+91 99008 81234",
    email: "rohan.mehta@acmeindia.com",
    city: "Bengaluru",
    assignedSalesperson: "Gagan Sharma",
    customerSince: "Jan 2024",
    creditPeriod: "45 Days",
    outstandingPayment: "₹3,20,000",
    lastContactTime: "05 Sep 2026",
    nextFollowUp: "Today, 02:30 PM",
    paymentStatus: "pending",
    status: "Active",
    remarks: [
      {
        id: "rem-106",
        date: "05 Sep 2026",
        time: "12:45 PM",
        text: "Discussed expansion to 3 new warehouse locations in South Region.",
        author: "Gagan Sharma",
      },
    ],
    followUps: [
      {
        id: "fol-204",
        date: "Today",
        time: "02:30 PM",
        purpose: "Payment Reminder Call",
        status: "scheduled",
        notes: "Remind finance controller on invoice approval cycle.",
      },
    ],
    payments: [
      {
        id: "pay-305",
        invoiceNumber: "INV-2026-902",
        amount: "₹3,20,000",
        dueDate: "20 Sep 2026",
        status: "pending",
      },
    ],
  },
  {
    id: "cust-004",
    name: "Frontier Health Informatics",
    contactPerson: "Pooja Verma",
    phone: "+91 97170 99881",
    email: "pooja.v@frontierhealth.co",
    city: "Noida",
    assignedSalesperson: "Gagan Sharma",
    customerSince: "May 2023",
    creditPeriod: "30 Days",
    outstandingPayment: "₹0",
    lastContactTime: "02 Sep 2026",
    nextFollowUp: "Today, 05:30 PM",
    paymentStatus: "paid",
    status: "VIP",
    remarks: [
      {
        id: "rem-107",
        date: "02 Sep 2026",
        time: "05:00 PM",
        text: "Requested scheduled demo for new radiology analytics module.",
        author: "Gagan Sharma",
      },
    ],
    followUps: [
      {
        id: "fol-205",
        date: "Today",
        time: "05:30 PM",
        purpose: "Product Demo & Capability Walkthrough",
        status: "scheduled",
        notes: "Live demo on telemedicine dashboard integration.",
      },
    ],
    payments: [
      {
        id: "pay-306",
        invoiceNumber: "INV-2026-880",
        amount: "₹1,75,000",
        dueDate: "25 Aug 2026",
        status: "paid",
      },
    ],
  },
  {
    id: "cust-005",
    name: "Zenith Electronics Global",
    contactPerson: "Kavita Desai",
    phone: "+91 98450 67123",
    email: "kavita.desai@zenithelec.com",
    city: "Pune",
    assignedSalesperson: "Gagan Sharma",
    customerSince: "Nov 2021",
    creditPeriod: "60 Days",
    outstandingPayment: "₹0",
    lastContactTime: "03 Sep 2026",
    nextFollowUp: "15 Sep 2026",
    paymentStatus: "paid",
    status: "Active",
    remarks: [
      {
        id: "rem-108",
        date: "03 Sep 2026",
        time: "11:20 AM",
        text: "Account health check: 99.8% uptime reported, highly satisfied.",
        author: "Gagan Sharma",
      },
    ],
    followUps: [
      {
        id: "fol-206",
        date: "15 Sep 2026",
        time: "03:00 PM",
        purpose: "Hardware Refresh Discussion",
        status: "scheduled",
        notes: "Discuss replacement of older terminal devices.",
      },
    ],
    payments: [
      {
        id: "pay-307",
        invoiceNumber: "INV-2026-820",
        amount: "₹2,60,000",
        dueDate: "15 Aug 2026",
        status: "paid",
      },
    ],
  },
  {
    id: "cust-006",
    name: "BlueWave Marine Logistics",
    contactPerson: "Rajesh Khanna",
    phone: "+91 98220 55432",
    email: "rkhanna@bluewavemarine.com",
    city: "Mumbai",
    assignedSalesperson: "Gagan Sharma",
    customerSince: "Jun 2023",
    creditPeriod: "30 Days",
    outstandingPayment: "₹1,90,000",
    lastContactTime: "04 Sep 2026",
    nextFollowUp: "Tomorrow, 03:00 PM",
    paymentStatus: "pending",
    status: "Active",
    remarks: [
      {
        id: "rem-109",
        date: "04 Sep 2026",
        time: "04:30 PM",
        text: "Requested custom report export formats for container tracking.",
        author: "Gagan Sharma",
      },
    ],
    followUps: [
      {
        id: "fol-207",
        date: "Tomorrow",
        time: "03:00 PM",
        purpose: "Custom Integration Review",
        status: "scheduled",
        notes: "Walk through CSV auto-exporter plugin.",
      },
    ],
    payments: [
      {
        id: "pay-308",
        invoiceNumber: "INV-2026-915",
        amount: "₹1,90,000",
        dueDate: "22 Sep 2026",
        status: "pending",
      },
    ],
  },
  {
    id: "cust-007",
    name: "Vanguard Infrastructure Ltd",
    contactPerson: "Deepak Nair",
    phone: "+91 98401 23987",
    email: "deepak.nair@vanguardinfra.in",
    city: "Chennai",
    assignedSalesperson: "Gagan Sharma",
    customerSince: "Aug 2022",
    creditPeriod: "30 Days",
    outstandingPayment: "₹2,15,000",
    lastContactTime: "29 Aug 2026",
    nextFollowUp: "10 Sep 2026",
    paymentStatus: "overdue",
    status: "Active",
    remarks: [
      {
        id: "rem-110",
        date: "29 Aug 2026",
        time: "02:15 PM",
        text: "Sent notice regarding 15 days delay in highway project billing.",
        author: "Gagan Sharma",
      },
    ],
    followUps: [
      {
        id: "fol-208",
        date: "10 Sep 2026",
        time: "10:30 AM",
        purpose: "Escalation Call with CFO",
        status: "scheduled",
        notes: "Resolve pending approval bottleneck.",
      },
    ],
    payments: [
      {
        id: "pay-309",
        invoiceNumber: "INV-2026-750",
        amount: "₹2,15,000",
        dueDate: "20 Aug 2026",
        status: "overdue",
      },
    ],
  },
  {
    id: "cust-008",
    name: "Sunlight Renewable Energy",
    contactPerson: "Amit Saxena",
    phone: "+91 98390 11223",
    email: "amit.saxena@sunlightenergy.in",
    city: "Jaipur",
    assignedSalesperson: "Gagan Sharma",
    customerSince: "Sep 2024",
    creditPeriod: "15 Days",
    outstandingPayment: "₹0",
    lastContactTime: "01 Sep 2026",
    nextFollowUp: "18 Sep 2026",
    paymentStatus: "no_payment",
    status: "Active",
    remarks: [
      {
        id: "rem-111",
        date: "01 Sep 2026",
        time: "01:00 PM",
        text: "Initial trial deployment finished. Client configured 12 solar sites.",
        author: "Gagan Sharma",
      },
    ],
    followUps: [
      {
        id: "fol-209",
        date: "18 Sep 2026",
        time: "02:00 PM",
        purpose: "Commercial Conversion Review",
        status: "scheduled",
        notes: "Present annual enterprise pricing tier.",
      },
    ],
    payments: [],
  },
  {
    id: "cust-009",
    name: "Metro Pharma Solutions",
    contactPerson: "Meera Joshi",
    phone: "+91 98233 44556",
    email: "meera.j@metropharma.com",
    city: "Hyderabad",
    assignedSalesperson: "Gagan Sharma",
    customerSince: "Apr 2023",
    creditPeriod: "30 Days",
    outstandingPayment: "₹95,000",
    lastContactTime: "03 Sep 2026",
    nextFollowUp: "11 Sep 2026",
    paymentStatus: "pending",
    status: "Active",
    remarks: [
      {
        id: "rem-112",
        date: "03 Sep 2026",
        time: "03:45 PM",
        text: "Cold-chain temperature tracker API integration finalized.",
        author: "Gagan Sharma",
      },
    ],
    followUps: [
      {
        id: "fol-210",
        date: "11 Sep 2026",
        time: "11:00 AM",
        purpose: "Quality Audit Check",
        status: "scheduled",
        notes: "Confirm audit logs comply with FDA standards.",
      },
    ],
    payments: [
      {
        id: "pay-310",
        invoiceNumber: "INV-2026-899",
        amount: "₹95,000",
        dueDate: "24 Sep 2026",
        status: "pending",
      },
    ],
  },
  {
    id: "cust-010",
    name: "AeroTech Precision Components",
    contactPerson: "Harish Iyer",
    phone: "+91 98860 77889",
    email: "harish@aerotechparts.com",
    city: "Bengaluru",
    assignedSalesperson: "Gagan Sharma",
    customerSince: "Jul 2022",
    creditPeriod: "45 Days",
    outstandingPayment: "₹0",
    lastContactTime: "06 Sep 2026",
    nextFollowUp: "20 Sep 2026",
    paymentStatus: "paid",
    status: "VIP",
    remarks: [
      {
        id: "rem-113",
        date: "06 Sep 2026",
        time: "10:15 AM",
        text: "Signed 2-year multi-site service contract renewal.",
        author: "Gagan Sharma",
      },
    ],
    followUps: [
      {
        id: "fol-211",
        date: "20 Sep 2026",
        time: "04:00 PM",
        purpose: "Executive Sponsor Catchup",
        status: "scheduled",
        notes: "Discuss strategic expansion to defense supply chain.",
      },
    ],
    payments: [
      {
        id: "pay-311",
        invoiceNumber: "INV-2026-920",
        amount: "₹4,50,000",
        dueDate: "05 Sep 2026",
        status: "paid",
      },
    ],
  },
  {
    id: "cust-011",
    name: "Krystal Glass & Glazing",
    contactPerson: "Praveen Jain",
    phone: "+91 98250 99112",
    email: "praveen@krystalglass.in",
    city: "Ahmedabad",
    assignedSalesperson: "Gagan Sharma",
    customerSince: "Nov 2023",
    creditPeriod: "30 Days",
    outstandingPayment: "₹64,000",
    lastContactTime: "30 Aug 2026",
    nextFollowUp: "14 Sep 2026",
    paymentStatus: "pending",
    status: "Active",
    remarks: [
      {
        id: "rem-114",
        date: "30 Aug 2026",
        time: "11:50 AM",
        text: "Site survey conducted at Sanand manufacturing plant.",
        author: "Gagan Sharma",
      },
    ],
    followUps: [
      {
        id: "fol-212",
        date: "14 Sep 2026",
        time: "02:30 PM",
        purpose: "Delivery Timeline Sync",
        status: "scheduled",
        notes: "Coordinate logistics dispatch for batch 4.",
      },
    ],
    payments: [
      {
        id: "pay-312",
        invoiceNumber: "INV-2026-871",
        amount: "₹64,000",
        dueDate: "26 Sep 2026",
        status: "pending",
      },
    ],
  },
  {
    id: "cust-012",
    name: "Solitaire Jewels & Exports",
    contactPerson: "Ankit Singhal",
    phone: "+91 98290 66554",
    email: "ankit@solitairejewels.co",
    city: "Surat",
    assignedSalesperson: "Gagan Sharma",
    customerSince: "Feb 2024",
    creditPeriod: "15 Days",
    outstandingPayment: "₹1,10,000",
    lastContactTime: "28 Aug 2026",
    nextFollowUp: "16 Sep 2026",
    paymentStatus: "overdue",
    status: "Inactive",
    remarks: [
      {
        id: "rem-115",
        date: "28 Aug 2026",
        time: "04:10 PM",
        text: "Customer requested temporary pause due to GST audit.",
        author: "Gagan Sharma",
      },
    ],
    followUps: [
      {
        id: "fol-213",
        date: "16 Sep 2026",
        time: "12:00 PM",
        purpose: "Reactivation & Outstanding Recovery",
        status: "scheduled",
        notes: "Check audit completion status.",
      },
    ],
    payments: [
      {
        id: "pay-313",
        invoiceNumber: "INV-2026-733",
        amount: "₹1,10,000",
        dueDate: "15 Aug 2026",
        status: "overdue",
      },
    ],
  },
];

// In-memory store that can be mutated by interactive user actions
let customersStore: Customer[] = JSON.parse(JSON.stringify(INITIAL_CUSTOMERS));

/**
 * Fetch all customers (simulates network delay)
 */
export async function getMockCustomers(delayMs: number = 300): Promise<Customer[]> {
  if (delayMs > 0) {
    await new Promise((res) => setTimeout(res, delayMs));
  }
  return JSON.parse(JSON.stringify(customersStore));
}

/**
 * Fetch a single customer by ID
 */
export async function getMockCustomerById(id: string): Promise<Customer | undefined> {
  const customer = customersStore.find((c) => c.id === id);
  return customer ? JSON.parse(JSON.stringify(customer)) : undefined;
}

/**
 * Add a remark to a customer (mutates local state)
 */
export async function addMockCustomerRemark(
  customerId: string,
  text: string
): Promise<CustomerRemark> {
  const customer = customersStore.find((c) => c.id === customerId);
  if (!customer) throw new Error(`Customer with ID ${customerId} not found`);

  const newRemark: CustomerRemark = {
    id: `rem-${Date.now()}`,
    date: "Today",
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    text,
    author: "Gagan Sharma",
  };

  customer.remarks.unshift(newRemark);
  customer.lastContactTime = `Today, ${newRemark.time}`;
  return newRemark;
}

/**
 * Schedule a follow-up for a customer
 */
export async function scheduleMockCustomerFollowUp(
  customerId: string,
  followUpData: { date: string; time: string; purpose: string; notes: string }
): Promise<CustomerFollowUp> {
  const customer = customersStore.find((c) => c.id === customerId);
  if (!customer) throw new Error(`Customer with ID ${customerId} not found`);

  const newFollowUp: CustomerFollowUp = {
    id: `fol-${Date.now()}`,
    date: followUpData.date || "Tomorrow",
    time: followUpData.time || "11:00 AM",
    purpose: followUpData.purpose,
    status: "scheduled",
    notes: followUpData.notes,
  };

  customer.followUps.unshift(newFollowUp);
  customer.nextFollowUp = `${newFollowUp.date}, ${newFollowUp.time}`;
  return newFollowUp;
}

/**
 * Reset mock store back to initial data
 */
export function resetMockCustomers(): void {
  customersStore = JSON.parse(JSON.stringify(INITIAL_CUSTOMERS));
}
