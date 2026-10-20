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
  id: "EMP-001",
  name: "Employee",
  designation: "Sales Executive",
  region: "North Region",
  avatarInitials: "EM",
  email: "employee@oblutools.com",
  phone: "",
  employeeSince: "2024",
  department: "Sales",
  location: "Headquarters",
  manager: "Sales Manager",
  activeAccounts: 0,
  totalDeals: 0,
  pipelineValue: "₹0",
};

export async function getMockEmployee(): Promise<EmployeeProfile> {
  return mockEmployee;
}
