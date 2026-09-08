export interface EmployeeProfile {
  id: string;
  name: string;
  designation: string;
  region: string;
  avatarInitials: string;
  email?: string;
  phone?: string;
  employeeSince?: string;
  department?: string;
  location?: string;
  manager?: string;
  activeAccounts?: number;
  totalDeals?: number;
  pipelineValue?: string;
}

export const mockEmployee: EmployeeProfile = {
  id: "EMP-2024-001",
  name: "Gagan Sharma",
  designation: "Senior Sales Executive",
  region: "North Region (Delhi NCR)",
  avatarInitials: "GS",
  email: "gagan.sharma@nexuscorp.com",
  phone: "+91 98765 43210",
  employeeSince: "March 2023",
  department: "Enterprise Solutions & Cloud Sales",
  location: "Cyber City, Gurugram HQ",
  manager: "Rajesh Verma (VP Sales)",
  activeAccounts: 128,
  totalDeals: 34,
  pipelineValue: "₹4.2L",
};

export async function getMockEmployee(): Promise<EmployeeProfile> {
  return mockEmployee;
}
