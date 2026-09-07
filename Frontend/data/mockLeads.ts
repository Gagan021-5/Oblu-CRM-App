export type LeadStage = "New" | "Contacted" | "Qualified" | "Proposal" | "Won";
export type LeadIntent = "High" | "Medium" | "Low";

export interface LeadNote {
  id: string;
  date: string;
  text: string;
  author: string;
}

export interface LeadActivity {
  id: string;
  date: string;
  time: string;
  title: string;
  type: "call" | "meeting" | "stage_change" | "email" | "note";
  description: string;
}

export interface LeadFollowUp {
  id: string;
  date: string;
  time: string;
  purpose: string;
  status: "scheduled" | "completed";
  notes: string;
}

export interface Lead {
  id: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string;
  leadSource: "Referral" | "Website" | "Cold Call" | "LinkedIn" | "Exhibition";
  stage: LeadStage;
  intentLevel: LeadIntent;
  intentScore: number; // 0 to 100
  estimatedValue: string;
  estimatedValueNum: number;
  lastContactDate: string;
  nextFollowUp: string;
  expectedClosingDate: string;
  assignedEmployee: string;
  notes: LeadNote[];
  activity: LeadActivity[];
  followUps: LeadFollowUp[];
}

const INITIAL_LEADS: Lead[] = [
  {
    id: "lead-001",
    companyName: "NexGen Cloud Solutions",
    contactPerson: "Suresh Nair",
    phone: "+91 98110 45678",
    email: "suresh@nexgencloud.io",
    leadSource: "Website",
    stage: "Proposal",
    intentLevel: "High",
    intentScore: 92,
    estimatedValue: "₹1,20,000",
    estimatedValueNum: 120000,
    lastContactDate: "Yesterday",
    nextFollowUp: "Today, 03:00 PM",
    expectedClosingDate: "18 Sep 2026",
    assignedEmployee: "Gagan Sharma",
    notes: [
      {
        id: "nt-1",
        date: "Yesterday",
        text: "Delivered customized commercial proposal for 45 team seats with multi-location sync.",
        author: "Gagan Sharma",
      },
      {
        id: "nt-2",
        date: "02 Sep 2026",
        text: "Technical team approved security and data retention protocols.",
        author: "Gagan Sharma",
      },
    ],
    activity: [
      {
        id: "act-1",
        date: "Yesterday",
        time: "04:30 PM",
        title: "Proposal Sent",
        type: "email",
        description: "Sent commercial contract v2 with standard 12-month SLA.",
      },
      {
        id: "act-2",
        date: "03 Sep 2026",
        time: "11:00 AM",
        title: "Demo Completed",
        type: "meeting",
        description: "Product demonstration with CTO and VP of Engineering.",
      },
    ],
    followUps: [
      {
        id: "fol-1",
        date: "Today",
        time: "03:00 PM",
        purpose: "Proposal Review Call",
        status: "scheduled",
        notes: "Address any pricing concerns and finalize signoff timeline.",
      },
    ],
  },
  {
    id: "lead-002",
    companyName: "Aura Retail Group",
    contactPerson: "Priya Kulkarni",
    phone: "+91 98205 33412",
    email: "priya@auraretail.com",
    leadSource: "Referral",
    stage: "Qualified",
    intentLevel: "High",
    intentScore: 88,
    estimatedValue: "₹85,000",
    estimatedValueNum: 85000,
    lastContactDate: "04 Sep 2026",
    nextFollowUp: "Today, 11:30 AM",
    expectedClosingDate: "25 Sep 2026",
    assignedEmployee: "Gagan Sharma",
    notes: [
      {
        id: "nt-3",
        date: "04 Sep 2026",
        text: "Needs POS order sync across 14 outlet locations in Maharashtra.",
        author: "Gagan Sharma",
      },
    ],
    activity: [
      {
        id: "act-3",
        date: "04 Sep 2026",
        time: "02:15 PM",
        title: "Requirement Scoping",
        type: "call",
        description: "Completed 35-minute intake call regarding store fleet management.",
      },
    ],
    followUps: [
      {
        id: "fol-2",
        date: "Today",
        time: "11:30 AM",
        purpose: "Product Architecture Walkthrough",
        status: "scheduled",
        notes: "Present store-level offline cache architecture.",
      },
    ],
  },
  {
    id: "lead-003",
    companyName: "Quantum Robotics Labs",
    contactPerson: "Aditya Kapoor",
    phone: "+91 99100 88231",
    email: "aditya@quantumrobotics.in",
    leadSource: "Exhibition",
    stage: "New",
    intentLevel: "Medium",
    intentScore: 68,
    estimatedValue: "₹65,000",
    estimatedValueNum: 65000,
    lastContactDate: "05 Sep 2026",
    nextFollowUp: "Tomorrow, 02:00 PM",
    expectedClosingDate: "30 Sep 2026",
    assignedEmployee: "Gagan Sharma",
    notes: [
      {
        id: "nt-4",
        date: "05 Sep 2026",
        text: "Met at TechExpo Delhi booth. Looking for automated field service dispatch.",
        author: "Gagan Sharma",
      },
    ],
    activity: [
      {
        id: "act-4",
        date: "05 Sep 2026",
        time: "05:00 PM",
        title: "Lead Created",
        type: "note",
        description: "Imported from TechExpo QR scanner.",
      },
    ],
    followUps: [
      {
        id: "fol-3",
        date: "Tomorrow",
        time: "02:00 PM",
        purpose: "Discovery Intro Call",
        status: "scheduled",
        notes: "Understand current field dispatch workflow and pain points.",
      },
    ],
  },
  {
    id: "lead-004",
    companyName: "Hyperion Media Network",
    contactPerson: "Tanvi Bhatia",
    phone: "+91 98330 11982",
    email: "tanvi.b@hyperionmedia.com",
    leadSource: "LinkedIn",
    stage: "Contacted",
    intentLevel: "Medium",
    intentScore: 62,
    estimatedValue: "₹45,000",
    estimatedValueNum: 45000,
    lastContactDate: "03 Sep 2026",
    nextFollowUp: "10 Sep 2026",
    expectedClosingDate: "05 Oct 2026",
    assignedEmployee: "Gagan Sharma",
    notes: [
      {
        id: "nt-5",
        date: "03 Sep 2026",
        text: "Sent brochure and video walkthrough. Tanvi is comparing with two competitors.",
        author: "Gagan Sharma",
      },
    ],
    activity: [
      {
        id: "act-5",
        date: "03 Sep 2026",
        time: "10:30 AM",
        title: "First Touch Call",
        type: "call",
        description: "Connected on phone and verified project budget.",
      },
    ],
    followUps: [
      {
        id: "fol-4",
        date: "10 Sep 2026",
        time: "04:00 PM",
        purpose: "Competitive Differentiation Pitch",
        status: "scheduled",
        notes: "Highlight our real-time synchronization speed vs competitor X.",
      },
    ],
  },
  {
    id: "lead-005",
    companyName: "Urban Mobility Technologies",
    contactPerson: "Karan Singhania",
    phone: "+91 98190 77443",
    email: "karan@urbanmobility.in",
    leadSource: "Referral",
    stage: "Won",
    intentLevel: "High",
    intentScore: 98,
    estimatedValue: "₹1,50,000",
    estimatedValueNum: 150000,
    lastContactDate: "Today, 09:15 AM",
    nextFollowUp: "15 Sep 2026",
    expectedClosingDate: "07 Sep 2026",
    assignedEmployee: "Gagan Sharma",
    notes: [
      {
        id: "nt-6",
        date: "Today",
        text: "Purchase order received and counter-signed! Onboarding handover initiated.",
        author: "Gagan Sharma",
      },
    ],
    activity: [
      {
        id: "act-6",
        date: "Today",
        time: "09:15 AM",
        title: "Deal Closed (Won)",
        type: "stage_change",
        description: "PO #UMT-2026-09 signed for ₹1,50,000 annual subscription.",
      },
    ],
    followUps: [
      {
        id: "fol-5",
        date: "15 Sep 2026",
        time: "10:00 AM",
        purpose: "Kickoff Implementation Meeting",
        status: "scheduled",
        notes: "Introduce client to solution architecture lead.",
      },
    ],
  },
  {
    id: "lead-006",
    companyName: "Silverline Packaging Ltd",
    contactPerson: "Ritu Chawla",
    phone: "+91 98711 22334",
    email: "ritu.c@silverlinepack.com",
    leadSource: "Cold Call",
    stage: "New",
    intentLevel: "Low",
    intentScore: 40,
    estimatedValue: "₹35,000",
    estimatedValueNum: 35000,
    lastContactDate: "01 Sep 2026",
    nextFollowUp: "12 Sep 2026",
    expectedClosingDate: "20 Oct 2026",
    assignedEmployee: "Gagan Sharma",
    notes: [
      {
        id: "nt-7",
        date: "01 Sep 2026",
        text: "Preliminary cold call. Expressed interest in warehouse barcode tracking.",
        author: "Gagan Sharma",
      },
    ],
    activity: [
      {
        id: "act-7",
        date: "01 Sep 2026",
        time: "03:00 PM",
        title: "Cold Call",
        type: "call",
        description: "Gatekeeper passed call to plant manager.",
      },
    ],
    followUps: [
      {
        id: "fol-6",
        date: "12 Sep 2026",
        time: "02:30 PM",
        purpose: "Intro Email Follow-up",
        status: "scheduled",
        notes: "Check if product brief was reviewed.",
      },
    ],
  },
  {
    id: "lead-007",
    companyName: "Pulse Healthcare Logistics",
    contactPerson: "Sunil Deshmukh",
    phone: "+91 98221 66778",
    email: "sunil.d@pulsehealth.in",
    leadSource: "Website",
    stage: "Proposal",
    intentLevel: "High",
    intentScore: 89,
    estimatedValue: "₹90,000",
    estimatedValueNum: 90000,
    lastContactDate: "05 Sep 2026",
    nextFollowUp: "Today, 04:30 PM",
    expectedClosingDate: "20 Sep 2026",
    assignedEmployee: "Gagan Sharma",
    notes: [
      {
        id: "nt-8",
        date: "05 Sep 2026",
        text: "Custom SLA requested for temperature alerts within 60 seconds.",
        author: "Gagan Sharma",
      },
    ],
    activity: [
      {
        id: "act-8",
        date: "05 Sep 2026",
        time: "01:00 PM",
        title: "Proposal Shared",
        type: "email",
        description: "Standard quote with premium telemetry add-on sent.",
      },
    ],
    followUps: [
      {
        id: "fol-7",
        date: "Today",
        time: "04:30 PM",
        purpose: "Final Negotiations Call",
        status: "scheduled",
        notes: "Confirm agreement on 24/7 hotline support clause.",
      },
    ],
  },
  {
    id: "lead-008",
    companyName: "Titan Supply Chain Hub",
    contactPerson: "Alok Tandon",
    phone: "+91 99200 44119",
    email: "alok.tandon@titansupply.com",
    leadSource: "Referral",
    stage: "Contacted",
    intentLevel: "Medium",
    intentScore: 70,
    estimatedValue: "₹1,10,000",
    estimatedValueNum: 110000,
    lastContactDate: "04 Sep 2026",
    nextFollowUp: "Tomorrow, 10:00 AM",
    expectedClosingDate: "15 Oct 2026",
    assignedEmployee: "Gagan Sharma",
    notes: [
      {
        id: "nt-9",
        date: "04 Sep 2026",
        text: "Expanding third-party logistics fleet in Gujarat and Rajasthan corridor.",
        author: "Gagan Sharma",
      },
    ],
    activity: [
      {
        id: "act-9",
        date: "04 Sep 2026",
        time: "11:30 AM",
        title: "Initial Qualification",
        type: "call",
        description: "Confirmed fleet count of 85 heavy commercial vehicles.",
      },
    ],
    followUps: [
      {
        id: "fol-8",
        date: "Tomorrow",
        time: "10:00 AM",
        purpose: "Fleet Architecture Review",
        status: "scheduled",
        notes: "Present device telemetry tracking architecture.",
      },
    ],
  },
  {
    id: "lead-009",
    companyName: "Omni Biotech Devices",
    contactPerson: "Divya Pillai",
    phone: "+91 98455 33221",
    email: "divya@omnibiotech.org",
    leadSource: "LinkedIn",
    stage: "Qualified",
    intentLevel: "High",
    intentScore: 84,
    estimatedValue: "₹75,000",
    estimatedValueNum: 75000,
    lastContactDate: "03 Sep 2026",
    nextFollowUp: "09 Sep 2026",
    expectedClosingDate: "28 Sep 2026",
    assignedEmployee: "Gagan Sharma",
    notes: [
      {
        id: "nt-10",
        date: "03 Sep 2026",
        text: "Needs calibration certificate generation linked to service records.",
        author: "Gagan Sharma",
      },
    ],
    activity: [
      {
        id: "act-10",
        date: "03 Sep 2026",
        time: "03:15 PM",
        title: "Technical Discovery",
        type: "meeting",
        description: "Reviewed PDF certificate formatting requirements.",
      },
    ],
    followUps: [
      {
        id: "fol-9",
        date: "09 Sep 2026",
        time: "11:30 AM",
        purpose: "Certificate Generator Demo",
        status: "scheduled",
        notes: "Demonstrate template designer module.",
      },
    ],
  },
  {
    id: "lead-010",
    companyName: "Crestview Hospitality Tech",
    contactPerson: "Nikhil Chopra",
    phone: "+91 98101 99008",
    email: "nikhil@crestviewtech.in",
    leadSource: "Website",
    stage: "New",
    intentLevel: "Medium",
    intentScore: 65,
    estimatedValue: "₹50,000",
    estimatedValueNum: 50000,
    lastContactDate: "06 Sep 2026",
    nextFollowUp: "11 Sep 2026",
    expectedClosingDate: "22 Oct 2026",
    assignedEmployee: "Gagan Sharma",
    notes: [
      {
        id: "nt-11",
        date: "06 Sep 2026",
        text: "Inquired about guest concierge request logging & escalation engine.",
        author: "Gagan Sharma",
      },
    ],
    activity: [
      {
        id: "act-11",
        date: "06 Sep 2026",
        time: "06:00 PM",
        title: "Inbound Form",
        type: "email",
        description: "Website contact form submission received.",
      },
    ],
    followUps: [
      {
        id: "fol-10",
        date: "11 Sep 2026",
        time: "03:00 PM",
        purpose: "Intro Call with Hotel GM",
        status: "scheduled",
        notes: "Assess roll-out across 3 boutique property locations.",
      },
    ],
  },
  {
    id: "lead-011",
    companyName: "Beacon Infotech Global",
    contactPerson: "Sameera Sheikh",
    phone: "+91 98200 12890",
    email: "sameera@beaconinfotech.com",
    leadSource: "Referral",
    stage: "Proposal",
    intentLevel: "High",
    intentScore: 94,
    estimatedValue: "₹1,40,000",
    estimatedValueNum: 140000,
    lastContactDate: "Yesterday",
    nextFollowUp: "Today, 01:30 PM",
    expectedClosingDate: "16 Sep 2026",
    assignedEmployee: "Gagan Sharma",
    notes: [
      {
        id: "nt-12",
        date: "Yesterday",
        text: "Finalized commercial quotation. Sameera promised to sign off after board approval today.",
        author: "Gagan Sharma",
      },
    ],
    activity: [
      {
        id: "act-12",
        date: "Yesterday",
        time: "05:00 PM",
        title: "Board Package Delivered",
        type: "email",
        description: "Executive summary and pricing matrix delivered to board secretary.",
      },
    ],
    followUps: [
      {
        id: "fol-11",
        date: "Today",
        time: "01:30 PM",
        purpose: "Post-Board Call",
        status: "scheduled",
        notes: "Receive verbal signoff and confirm invoice entity details.",
      },
    ],
  },
];

let leadsStore: Lead[] = JSON.parse(JSON.stringify(INITIAL_LEADS));

/**
 * Fetch all leads (simulates network delay)
 */
export async function getMockLeads(delayMs: number = 300): Promise<Lead[]> {
  if (delayMs > 0) {
    await new Promise((res) => setTimeout(res, delayMs));
  }
  return JSON.parse(JSON.stringify(leadsStore));
}

/**
 * Fetch single lead by ID
 */
export async function getMockLeadById(id: string): Promise<Lead | undefined> {
  const lead = leadsStore.find((l) => l.id === id);
  return lead ? JSON.parse(JSON.stringify(lead)) : undefined;
}

/**
 * Update lead stage (mutates state and records activity)
 */
export async function updateMockLeadStage(
  leadId: string,
  newStage: LeadStage
): Promise<void> {
  const lead = leadsStore.find((l) => l.id === leadId);
  if (!lead) throw new Error(`Lead ${leadId} not found`);

  const prevStage = lead.stage;
  lead.stage = newStage;

  lead.activity.unshift({
    id: `act-${Date.now()}`,
    date: "Today",
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    title: `Stage Changed to ${newStage}`,
    type: "stage_change",
    description: `Pipeline stage moved from ${prevStage} to ${newStage}.`,
  });
}

/**
 * Add a note to a lead
 */
export async function addMockLeadNote(leadId: string, text: string): Promise<LeadNote> {
  const lead = leadsStore.find((l) => l.id === leadId);
  if (!lead) throw new Error(`Lead ${leadId} not found`);

  const newNote: LeadNote = {
    id: `nt-${Date.now()}`,
    date: "Today",
    text,
    author: "Gagan Sharma",
  };

  lead.notes.unshift(newNote);
  lead.lastContactDate = "Today";
  return newNote;
}

/**
 * Schedule a follow-up for a lead
 */
export async function scheduleMockLeadFollowUp(
  leadId: string,
  data: { date: string; time: string; purpose: string; notes: string }
): Promise<LeadFollowUp> {
  const lead = leadsStore.find((l) => l.id === leadId);
  if (!lead) throw new Error(`Lead ${leadId} not found`);

  const newFollowUp: LeadFollowUp = {
    id: `fol-${Date.now()}`,
    date: data.date || "Tomorrow",
    time: data.time || "11:00 AM",
    purpose: data.purpose,
    status: "scheduled",
    notes: data.notes,
  };

  lead.followUps.unshift(newFollowUp);
  lead.nextFollowUp = `${newFollowUp.date}, ${newFollowUp.time}`;
  return newFollowUp;
}

/**
 * Create a new lead from quick actions
 */
export async function createMockLead(data: {
  companyName: string;
  contactPerson: string;
  phone: string;
  estimatedValue: string;
  leadSource?: "Referral" | "Website" | "Cold Call" | "LinkedIn" | "Exhibition";
}): Promise<Lead> {
  const newLead: Lead = {
    id: `lead-${Date.now()}`,
    companyName: data.companyName,
    contactPerson: data.contactPerson,
    phone: data.phone,
    email: `${data.contactPerson.toLowerCase().replace(/\s+/g, ".")}@${data.companyName.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`,
    leadSource: data.leadSource || "Website",
    stage: "New",
    intentLevel: "High",
    intentScore: 75,
    estimatedValue: data.estimatedValue || "₹50,000",
    estimatedValueNum: parseInt(data.estimatedValue.replace(/[^0-9]/g, "")) || 50000,
    lastContactDate: "Today",
    nextFollowUp: "Tomorrow, 11:00 AM",
    expectedClosingDate: "30 Sep 2026",
    assignedEmployee: "Gagan Sharma",
    notes: [
      {
        id: `nt-${Date.now()}`,
        date: "Today",
        text: "Lead manually logged from Employee Workspace quick actions.",
        author: "Gagan Sharma",
      },
    ],
    activity: [
      {
        id: `act-${Date.now()}`,
        date: "Today",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        title: "Lead Created",
        type: "note",
        description: "Created via quick action in mobile app.",
      },
    ],
    followUps: [
      {
        id: `fol-${Date.now()}`,
        date: "Tomorrow",
        time: "11:00 AM",
        purpose: "Initial Intake Discovery",
        status: "scheduled",
        notes: "Qualify technical fit and budget approval.",
      },
    ],
  };

  leadsStore.unshift(newLead);
  return newLead;
}

/**
 * Reset mock store back to initial data
 */
export function resetMockLeads(): void {
  leadsStore = JSON.parse(JSON.stringify(INITIAL_LEADS));
}
