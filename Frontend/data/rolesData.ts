/**
 * Official Role Definitions & Permissions from the Org Chart.
 * Matches exact specifications from the yellow boxes in the organizational diagram.
 */

export interface YellowBoxPermissions {
  customerDashboard: {
    enabled: boolean;
    features: string[];
    scope: "All Organization" | "Team Members" | "Individual" | "Payment Status Only" | "None";
    description: string;
  };
  inventory: {
    enabled: boolean;
    label: string;
  };
  incentiveCall: {
    enabled: boolean;
    scope: "Org" | "ASM, RSM, Org" | "ASM" | "ASM, RSM" | "None";
    label: string;
  };
  logs: {
    enabled: boolean;
    type: "Call logs (Full)" | "Req logs" | "None";
    label: string;
  };
  performaInvoice: {
    enabled: boolean;
    features: string[];
    description: string;
  };
}

export interface DummyTestUser {
  name: string;
  username: string;
  password: string; // test1234
  email: string;
  avatarInitials: string;
  designation: string;
  department: string;
  region: string;
  manager?: string;
  activeAccounts: number;
  totalDeals: number;
  pipelineValue: string;
}

export interface SubRoleConfig {
  key: string;
  title: string;
  shortTitle: string;
  badgeColor: string;
  users: DummyTestUser[];
  permissions: YellowBoxPermissions;
}

export interface RoleConfig {
  key: string;
  title: string;
  shortTitle: string;
  badgeColor: string;
  icon: string;
  users: DummyTestUser[];
  permissions: YellowBoxPermissions;
  subRole?: SubRoleConfig;
}

export const ASM_PERMISSIONS: YellowBoxPermissions = {
  customerDashboard: {
    enabled: true,
    features: [
      "Salesperson customer (team members)",
      "Payment status (team members)",
      "Customer Transfer",
    ],
    scope: "Team Members",
    description:
      "Oversees field executive accounts, payment clearance tracking, and customer account reassignment.",
  },
  inventory: {
    enabled: false,
    label: "Restricted",
  },
  incentiveCall: {
    enabled: true,
    scope: "ASM, RSM",
    label: "Incentive Call Reviews (ASM, RSM)",
  },
  logs: {
    enabled: false,
    type: "None",
    label: "Area Team Logs",
  },
  performaInvoice: {
    enabled: true,
    features: ["Creation"],
    description: "Proforma Invoice Creation for area customers.",
  },
};

export const ORG_ROLES: RoleConfig[] = [
  {
    key: "admin",
    title: "Admin (Executive Leadership)",
    shortTitle: "ADMIN",
    badgeColor: "#8B5CF6", // Purple
    icon: "shield-checkmark",
    users: [
      {
        name: "Nitin Aggarwal",
        username: "Nitin_Aggarwal",
        password: "test1234",
        email: "nitin.aggarwal@oblu.in",
        avatarInitials: "NA",
        designation: "Executive Director & System Admin",
        department: "Executive Management & Operations",
        region: "National HQ (All Regions)",
        activeAccounts: 450,
        totalDeals: 120,
        pipelineValue: "₹45.0L",
      },
      {
        name: "Akshay Narayan",
        username: "Akshay_Narayan",
        password: "test1234",
        email: "akshay.narayan@oblu.in",
        avatarInitials: "AN",
        designation: "Managing Director & System Admin",
        department: "Executive Management & Strategy",
        region: "National HQ (All Regions)",
        activeAccounts: 450,
        totalDeals: 115,
        pipelineValue: "₹42.5L",
      },
      {
        name: "Infected (Admin)",
        username: "infected",
        password: "Passw0rd!",
        email: "infected@oblu.in",
        avatarInitials: "INF",
        designation: "Super Administrator",
        department: "Executive Management & Operations",
        region: "National HQ (All Regions)",
        activeAccounts: 500,
        totalDeals: 150,
        pipelineValue: "₹50.0L",
      },
    ],
    permissions: {
      customerDashboard: {
        enabled: true,
        features: ["Data", "Salesperson customer", "Payment status", "Customer edit", "Credit period"],
        scope: "All Organization",
        description: "Full enterprise visibility across all salespersons, accounts, credit limits, and payment statuses.",
      },
      inventory: {
        enabled: true,
        label: "Full Inventory & Stock Management",
      },
      incentiveCall: {
        enabled: true,
        scope: "Org",
        label: "Organization-wide Incentive Review (Org)",
      },
      logs: {
        enabled: true,
        type: "Call logs (Full)",
        label: "Full Call Tracking Logs & Audit Trail",
      },
      performaInvoice: {
        enabled: true,
        features: ["Creation", "Price (sales)", "Prices (admin)", "Stock Req", "Credit overdue", "Dispatch"],
        description: "Complete authority: Creation, Price edits, Admin approvals, Stock requests, Credit overdue bypass, and Dispatch.",
      },
    },
  },
  {
    key: "sales_mgr",
    title: "Sales Manager",
    shortTitle: "SALES MGR",
    badgeColor: "#3B82F6", // Blue
    icon: "trending-up",
    users: [
      {
        name: "Bhavya Bhardwaj",
        username: "Bhavya_Bhardwaj",
        password: "test1234",
        email: "bhavya.bhardwaj@oblu.in",
        avatarInitials: "BB",
        designation: "National Sales Manager",
        department: "Commercial Sales & Growth",
        region: "National Sales Division",
        manager: "Nitin Aggarwal",
        activeAccounts: 260,
        totalDeals: 65,
        pipelineValue: "₹24.0L",
      },
    ],
    permissions: {
      customerDashboard: {
        enabled: true,
        features: ["Data", "Salesperson customer", "Payment status", "Customer edit", "Credit period"],
        scope: "All Organization",
        description: "Comprehensive customer dashboard with sales data, payment statuses, and customer edit capabilities.",
      },
      inventory: {
        enabled: false,
        label: "No Direct Inventory Access",
      },
      incentiveCall: {
        enabled: true,
        scope: "ASM, RSM, Org",
        label: "Incentive Review (ASM, RSM, Org)",
      },
      logs: {
        enabled: false,
        type: "None",
        label: "Standard Pipeline Monitoring",
      },
      performaInvoice: {
        enabled: true,
        features: ["Creation", "Price (sales)"],
        description: "Proforma Invoice Creation and Commercial Sales Price Adjustment.",
      },
    },
  },
  {
    key: "buss_mgr",
    title: "Business Manager",
    shortTitle: "BUSS. MGR",
    badgeColor: "#0EA5E9", // Cyan
    icon: "briefcase",
    users: [
      {
        name: "Vibhuti Panwar",
        username: "vibhuti_panwar",
        password: "test1234",
        email: "vibhuti.panwar@oblu.in",
        avatarInitials: "VP",
        designation: "Senior Business Manager",
        department: "Business Operations & Enterprise Accounts",
        region: "North & Central Region",
        manager: "Nitin Aggarwal",
        activeAccounts: 180,
        totalDeals: 48,
        pipelineValue: "₹18.5L",
      },
    ],
    permissions: {
      customerDashboard: {
        enabled: true,
        features: ["Data", "Salesperson customer", "Payment status", "Customer edit", "Credit period"],
        scope: "All Organization",
        description: "Full access to customer data, payment statuses, customer editing, and credit period tracking.",
      },
      inventory: {
        enabled: true,
        label: "Stock & Inventory Visibility",
      },
      incentiveCall: {
        enabled: true,
        scope: "ASM, RSM, Org",
        label: "Incentive Review (ASM, RSM, Org)",
      },
      logs: {
        enabled: true,
        type: "Req logs",
        label: "System Request Logs (Req logs)",
      },
      performaInvoice: {
        enabled: true,
        features: ["Creation"],
        description: "Proforma Invoice Creation authorized.",
      },
    },
  },
  {
    key: "hr",
    title: "Human Resources (HR)",
    shortTitle: "HR",
    badgeColor: "#EC4899", // Pink
    icon: "people",
    users: [
      {
        name: "Vanshika",
        username: "vanshika",
        password: "test1234",
        email: "vanshika.hr@oblu.in",
        avatarInitials: "VK",
        designation: "HR Manager",
        department: "Human Resources & Talent Management",
        region: "Corporate HQ",
        activeAccounts: 140,
        totalDeals: 30,
        pipelineValue: "₹10.0L",
      },
      {
        name: "Anshika",
        username: "anshika",
        password: "test1234",
        email: "anshika.hr@oblu.in",
        avatarInitials: "AK",
        designation: "HR Operations Lead",
        department: "Human Resources & Operations",
        region: "Corporate HQ",
        activeAccounts: 140,
        totalDeals: 28,
        pipelineValue: "₹9.5L",
      },
    ],
    permissions: {
      customerDashboard: {
        enabled: true,
        features: ["Data", "Salesperson customer", "Payment status", "Customer edit", "Credit period"],
        scope: "All Organization",
        description: "Organizational visibility to support employee performance reviews and incentive evaluation.",
      },
      inventory: {
        enabled: true,
        label: "Inventory Overview",
      },
      incentiveCall: {
        enabled: true,
        scope: "ASM, RSM, Org",
        label: "Incentive Call Reviews (ASM, RSM, Org)",
      },
      logs: {
        enabled: true,
        type: "Req logs",
        label: "Employee Request Logs (Req logs)",
      },
      performaInvoice: {
        enabled: true,
        features: ["Creation"],
        description: "Proforma Invoice Creation.",
      },
    },
  },
  {
    key: "accounts_ops",
    title: "Accounts & Operations",
    shortTitle: "ACCOUNTS & OPS",
    badgeColor: "#F59E0B", // Amber
    icon: "calculator",
    users: [
      {
        name: "Sujal Wadhwa",
        username: "sujal_wadhwa",
        password: "test1234",
        email: "sujal.wadhwa@oblu.in",
        avatarInitials: "SW",
        designation: "Chief Accounts Officer",
        department: "Finance & Accounts",
        region: "Corporate Finance",
        activeAccounts: 320,
        totalDeals: 90,
        pipelineValue: "₹38.0L",
      },
      {
        name: "Neha Sharma",
        username: "neha_sharma",
        password: "test1234",
        email: "neha.sharma@oblu.in",
        avatarInitials: "NS",
        designation: "Senior Operations & Accounts Manager",
        department: "Commercial Operations",
        region: "Corporate Finance",
        activeAccounts: 310,
        totalDeals: 85,
        pipelineValue: "₹35.0L",
      },
      {
        name: "Sanyam Arora",
        username: "sanyam_arora",
        password: "test1234",
        email: "sanyam.arora@oblu.in",
        avatarInitials: "SA",
        designation: "Accounts Specialist",
        department: "Finance & Accounts",
        region: "Corporate Finance",
        activeAccounts: 300,
        totalDeals: 80,
        pipelineValue: "₹32.0L",
      },
    ],
    permissions: {
      customerDashboard: {
        enabled: true,
        features: ["Payment status"],
        scope: "Payment Status Only",
        description: "Payment Status clearance, invoice settlements, and debtor tracking.",
      },
      inventory: {
        enabled: true,
        label: "Inventory & Material Stock Audit",
      },
      incentiveCall: {
        enabled: true,
        scope: "ASM, RSM, Org",
        label: "Incentive Calculation Audit (ASM, RSM, Org)",
      },
      logs: {
        enabled: false,
        type: "None",
        label: "Standard Financial Records",
      },
      performaInvoice: {
        enabled: true,
        features: ["Stock Req", "Dispatch"],
        description: "Proforma Invoice Stock Requisition verification and Dispatch release authorization.",
      },
    },
  },
  {
    key: "warehouse",
    title: "Warehouse & Logistics",
    shortTitle: "WAREHOUSE",
    badgeColor: "#78716C", // Warm Stone
    icon: "cube",
    users: [
      {
        name: "Vikas",
        username: "vikas",
        password: "test1234",
        email: "vikas.warehouse@oblu.in",
        avatarInitials: "VK",
        designation: "Warehouse Logistics Manager",
        department: "Fulfillment & Supply Chain",
        region: "Central Fulfillment Hub",
        activeAccounts: 80,
        totalDeals: 40,
        pipelineValue: "₹14.0L",
      },
      {
        name: "Vivek",
        username: "vivek",
        password: "test1234",
        email: "vivek.warehouse@oblu.in",
        avatarInitials: "VV",
        designation: "Dispatch Supervisor",
        department: "Warehouse & Outward Logistics",
        region: "Central Fulfillment Hub",
        activeAccounts: 75,
        totalDeals: 38,
        pipelineValue: "₹13.2L",
      },
    ],
    permissions: {
      customerDashboard: {
        enabled: false,
        features: [],
        scope: "None",
        description: "Customer CRM dashboard is restricted for warehouse personnel.",
      },
      inventory: {
        enabled: true,
        label: "Physical Inventory & Dispatch Stock",
      },
      incentiveCall: {
        enabled: false,
        scope: "None",
        label: "Not Applicable",
      },
      logs: {
        enabled: false,
        type: "None",
        label: "Outward Consignment Records",
      },
      performaInvoice: {
        enabled: true,
        features: ["Dispatch"],
        description: "Authorized strictly for Proforma Invoice Dispatch and Tracking Number updates.",
      },
    },
  },
  {
    key: "rsm_ankush",
    title: "Regional Sales Manager (Ankush Unit)",
    shortTitle: "RSM (ANKUSH)",
    badgeColor: "#10B981", // Emerald
    icon: "earth",
    users: [
      {
        name: "Ankush Oblu",
        username: "Ankush_Oblu",
        password: "test1234",
        email: "ankush.oblu@oblu.in",
        avatarInitials: "AO",
        designation: "Regional Sales Manager (West & North)",
        department: "Regional Sales Division",
        region: "North & West Region",
        manager: "Bhavya Bhardwaj",
        activeAccounts: 175,
        totalDeals: 44,
        pipelineValue: "₹16.8L",
      },
    ],
    permissions: {
      customerDashboard: {
        enabled: true,
        features: ["Data", "Salesperson customer (Individual)", "Payment status (Individual)"],
        scope: "Individual",
        description: "Access to assigned regional sales data, individual customer records, and individual payment statuses.",
      },
      inventory: {
        enabled: false,
        label: "Restricted",
      },
      incentiveCall: {
        enabled: true,
        scope: "ASM",
        label: "Incentive Call Reviews (ASM)",
      },
      logs: {
        enabled: false,
        type: "None",
        label: "Team Activity Overview",
      },
      performaInvoice: {
        enabled: true,
        features: ["Creation"],
        description: "Proforma Invoice Creation for regional clients.",
      },
    },
    subRole: {
      key: "asm_ankush",
      title: "ASM Team reporting to Ankush",
      shortTitle: "ASM",
      badgeColor: "#14B8A6", // Teal
      users: [
        {
          name: "Satish Kumar",
          username: "Satish_Kumar",
          password: "test1234",
          email: "satish.kumar@oblu.in",
          avatarInitials: "SK",
          designation: "Area Sales Manager (ASM)",
          department: "Field Commercial Sales",
          region: "Punjab & Haryana Zone",
          manager: "Ankush Oblu (RSM)",
          activeAccounts: 85,
          totalDeals: 19,
          pipelineValue: "₹6.8L",
        },
        {
          name: "Naveen K",
          username: "Naveen_K",
          password: "test1234",
          email: "naveen.k@oblu.in",
          avatarInitials: "NK",
          designation: "Area Sales Manager (ASM)",
          department: "Field Commercial Sales",
          region: "Karnataka & South Zone",
          manager: "Ankush Oblu (RSM)",
          activeAccounts: 90,
          totalDeals: 20,
          pipelineValue: "₹7.2L",
        },
      ],
      permissions: ASM_PERMISSIONS,
    },
  },
  {
    key: "rsm_aman",
    title: "Regional Sales Manager (Aman Unit)",
    shortTitle: "RSM (AMAN)",
    badgeColor: "#059669", // Dark Emerald
    icon: "compass",
    users: [
      {
        name: "Aman Poddar",
        username: "Aman_Poddar",
        password: "test1234",
        email: "aman.poddar@oblu.in",
        avatarInitials: "AP",
        designation: "Regional Sales Manager (East & South)",
        department: "Regional Sales Division",
        region: "East & South Region",
        manager: "Bhavya Bhardwaj",
        activeAccounts: 190,
        totalDeals: 52,
        pipelineValue: "₹19.4L",
      },
    ],
    permissions: {
      customerDashboard: {
        enabled: true,
        features: ["Salesperson customer (team members)", "Payment status (team members)", "Customer Transfer"],
        scope: "Team Members",
        description: "Full management of team members' customer accounts, payment statuses, and inter-team Customer Transfer.",
      },
      inventory: {
        enabled: false,
        label: "Restricted",
      },
      incentiveCall: {
        enabled: true,
        scope: "ASM, RSM",
        label: "Incentive Call Reviews (ASM, RSM)",
      },
      logs: {
        enabled: false,
        type: "None",
        label: "Team Follow-up Records",
      },
      performaInvoice: {
        enabled: true,
        features: ["Creation"],
        description: "Proforma Invoice Creation for assigned territory.",
      },
    },
    subRole: {
      key: "asm_aman",
      title: "ASM Team reporting to Aman",
      shortTitle: "ASM",
      badgeColor: "#14B8A6", // Teal
      users: [
        {
          name: "Kaushik Tiwari",
          username: "Kaushik_Tiwari",
          password: "test1234",
          email: "kaushik.tiwari@oblu.in",
          avatarInitials: "KT",
          designation: "Area Sales Manager (ASM)",
          department: "Field Commercial Sales",
          region: "Delhi & NCR Zone",
          manager: "Aman Poddar (RSM)",
          activeAccounts: 110,
          totalDeals: 26,
          pipelineValue: "₹8.8L",
        },
        {
          name: "Rushikesh Dhornala",
          username: "Dhornala_Rushikesh",
          password: "test1234",
          email: "rushikesh.obluhc@gmail.com",
          avatarInitials: "RD",
          designation: "Area Sales Manager (ASM)",
          department: "Field Commercial Sales",
          region: "Maharashtra & Central Zone",
          manager: "Aman Poddar (RSM)",
          activeAccounts: 115,
          totalDeals: 28,
          pipelineValue: "₹9.2L",
        },
      ],
      permissions: ASM_PERMISSIONS,
    },
  },
];

/**
 * Helper to look up role and user details by username, role key, or name.
 */
export function getRoleAndUserDetails(usernameOrKey?: string): {
  role: RoleConfig;
  user: DummyTestUser;
} {
  if (!usernameOrKey) {
    return {
      role: ORG_ROLES[0],
      user: ORG_ROLES[0].users[0],
    };
  }

  let query = usernameOrKey.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (query === "abm") {
    query = "asm";
  }

  // 1. Direct username match in main users or subRole users
  for (const role of ORG_ROLES) {
    for (const u of role.users) {
      const uClean = u.username.toLowerCase().replace(/[^a-z0-9]/g, "");
      const nClean = u.name.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (uClean === query || nClean.includes(query) || query.includes(uClean)) {
        return { role, user: u };
      }
    }

    if (role.subRole) {
      for (const u of role.subRole.users) {
        const uClean = u.username.toLowerCase().replace(/[^a-z0-9]/g, "");
        const nClean = u.name.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (uClean === query || nClean.includes(query) || query.includes(uClean)) {
          const subRoleAsConfig: RoleConfig = {
            key: "asm",
            title: "Area Sales Manager (ASM)",
            shortTitle: "ASM",
            badgeColor: role.subRole.badgeColor,
            icon: "pin",
            users: role.subRole.users,
            permissions: role.subRole.permissions,
          };
          return { role: subRoleAsConfig, user: u };
        }
      }
    }
  }

  // 2. Role key match
  for (const role of ORG_ROLES) {
    if (role.key.toLowerCase() === query || role.shortTitle.toLowerCase().replace(/[^a-z0-9]/g, "") === query) {
      return { role, user: role.users[0] };
    }
    if (
      role.subRole &&
      (query === "asm" ||
        query === role.subRole.key.toLowerCase() ||
        role.subRole.shortTitle.toLowerCase() === query)
    ) {
      const subRoleAsConfig: RoleConfig = {
        key: "asm",
        title: "Area Sales Manager (ASM)",
        shortTitle: "ASM",
        badgeColor: role.subRole.badgeColor,
        icon: "pin",
        users: role.subRole.users,
        permissions: role.subRole.permissions,
      };
      return { role: subRoleAsConfig, user: role.subRole.users[0] };
    }
  }

  // Fallback to first user in Admin
  return {
    role: ORG_ROLES[0],
    user: ORG_ROLES[0].users[0],
  };
}

/**
 * Returns a flat list of all dummy test users across all roles for quick 1-tap testing.
 */
export function getAllDummyUsers(): Array<DummyTestUser & { roleKey: string; roleTitle: string; roleBadgeColor: string }> {
  const result: Array<DummyTestUser & { roleKey: string; roleTitle: string; roleBadgeColor: string }> = [];
  for (const r of ORG_ROLES) {
    for (const u of r.users) {
      result.push({
        ...u,
        roleKey: r.key,
        roleTitle: r.shortTitle,
        roleBadgeColor: r.badgeColor,
      });
    }
    if (r.subRole) {
      for (const u of r.subRole.users) {
        result.push({
          ...u,
          roleKey: "asm",
          roleTitle: "ASM",
          roleBadgeColor: r.subRole.badgeColor,
        });
      }
    }
  }
  return result;
}
