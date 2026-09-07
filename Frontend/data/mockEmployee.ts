export interface EmployeeProfile {
  id: string;
  name: string;
  designation: string;
  region: string;
  avatarInitials: string;
  email?: string;
  phone?: string;
}

export const mockEmployee: EmployeeProfile = {
  id: "emp-001",
  name: "Gagan Sharma",
  designation: "Sales Executive",
  region: "North Region",
  avatarInitials: "GS",
  email: "gagan.sharma@nexuscorp.com",
  phone: "+91 98765 43210",
};

export async function getMockEmployee(): Promise<EmployeeProfile> {
  // Simulates instant or fast network resolution
  return mockEmployee;
}
