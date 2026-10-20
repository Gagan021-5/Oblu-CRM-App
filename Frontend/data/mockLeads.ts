export type LeadStage = "New" | "Contacted" | "Qualified" | "Proposal" | "Won";
export type LeadIntent = "High" | "Medium" | "Low";

export interface LeadNote {
  id: string;
  date: string;
  time: string;
  text: string;
  author: string;
}

export interface LeadActivity {
  id: string;
  type: string;
  date: string;
  time: string;
  description: string;
  title?: string;
  duration?: string;
}

export interface LeadFollowUp {
  id: string;
  date: string;
  time: string;
  purpose: string;
  status: "scheduled" | "completed" | "cancelled";
  notes?: string;
}

export interface Lead {
  id: string;
  name: string;
  companyName: string;
  company: string;
  contactPerson: string;
  phone: string;
  email: string;
  city: string;
  state?: string;
  district?: string;
  leadSource: string;
  assignedSalesperson: string;
  assignedEmployee?: string;
  stage: LeadStage;
  stage_name?: string;
  stage_color?: string;
  intent: LeadIntent;
  intentLevel: LeadIntent;
  intentScore: number;
  estimatedValue: string;
  estimatedValueNum?: number;
  createdDate: string;
  lastContactTime: string;
  lastContactDate?: string;
  nextFollowUp: string;
  expectedClosingDate: string;
  notes: LeadNote[];
  activities: LeadActivity[];
  activity: LeadActivity[];
  followUps: LeadFollowUp[];
}

const INITIAL_LEADS: Lead[] = [];
let mockLeadsStore: Lead[] = [...INITIAL_LEADS];

export async function getMockLeads(delayMs: number = 0): Promise<Lead[]> {
  if (delayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  return [...mockLeadsStore];
}

export async function getMockLeadById(id: string): Promise<Lead | undefined> {
  return mockLeadsStore.find((l) => l.id === id);
}

export async function updateMockLeadStage(
  leadId: string,
  newStage: LeadStage
): Promise<Lead | undefined> {
  const lead = mockLeadsStore.find((l) => l.id === leadId);
  if (!lead) return undefined;
  lead.stage = newStage;
  return lead;
}

export async function addMockLeadNote(leadId: string, text: string): Promise<LeadNote> {
  const note: LeadNote = {
    id: `note-${Date.now()}`,
    date: "Today",
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    text,
    author: "You",
  };
  const lead = mockLeadsStore.find((l) => l.id === leadId);
  if (lead) {
    lead.notes.unshift(note);
  }
  return note;
}

export async function scheduleMockLeadFollowUp(
  leadId: string,
  data: { date: string; time: string; purpose: string }
): Promise<LeadFollowUp> {
  const followUp: LeadFollowUp = {
    id: `fu-${Date.now()}`,
    date: data.date,
    time: data.time,
    purpose: data.purpose,
    status: "scheduled",
    notes: data.purpose,
  };
  const lead = mockLeadsStore.find((l) => l.id === leadId);
  if (lead) {
    lead.followUps.unshift(followUp);
    lead.nextFollowUp = `${data.date}, ${data.time}`;
  }
  return followUp;
}

export async function createMockLead(data: {
  name: string;
  company: string;
  phone: string;
  email: string;
  city: string;
  leadSource: string;
  intent: LeadIntent;
  estimatedValue: string;
}): Promise<Lead> {
  const newLead: Lead = {
    id: `lead-${Date.now()}`,
    name: data.name,
    company: data.company,
    companyName: data.company,
    contactPerson: data.name,
    phone: data.phone,
    email: data.email,
    city: data.city,
    leadSource: data.leadSource,
    assignedSalesperson: "You",
    assignedEmployee: "You",
    stage: "New",
    intent: data.intent,
    intentLevel: data.intent,
    intentScore: 80,
    estimatedValue: data.estimatedValue,
    estimatedValueNum: 0,
    createdDate: "Today",
    lastContactTime: "Never",
    lastContactDate: "Never",
    nextFollowUp: "Not scheduled",
    expectedClosingDate: "Next Month",
    notes: [],
    activities: [],
    activity: [],
    followUps: [],
  };
  mockLeadsStore.unshift(newLead);
  return newLead;
}

export function resetMockLeads(): void {
  mockLeadsStore = [...INITIAL_LEADS];
}
