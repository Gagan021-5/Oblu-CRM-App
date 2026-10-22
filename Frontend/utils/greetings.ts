/**
 * Role-tailored headline and metrics title helper.
 * Provides dynamic, contextual workspace titles based on employee role, department, and time of day.
 */

export interface RoleWorkspaceContext {
  headline: string;
  metricsTitle: string;
  subGreeting: string;
  unit: string;
}

export function getRoleWorkspaceContext(
  userRole?: string | null,
  department?: string | null,
  unitName: string = "Oblu Healthcare Pvt Ltd",
  username?: string | null
): RoleWorkspaceContext {
  const roleLower = (userRole || "").toLowerCase().trim();
  const deptLower = (department || "").toLowerCase().trim();
  const userLower = (username || "").toLowerCase().trim();

  const hour = new Date().getHours();
  const timeGreeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  // 1. HR / People Operations (Check username, role, or department FIRST)
  if (
    userLower.includes("vanshika") ||
    userLower.includes("anshika") ||
    roleLower.includes("hr") ||
    roleLower.includes("people") ||
    roleLower.includes("human") ||
    deptLower.includes("hr") ||
    deptLower.includes("people")
  ) {
    return {
      headline: "HR Operations & People Workspace",
      metricsTitle: "Workforce Overview",
      subGreeting: timeGreeting,
      unit: unitName,
    };
  }

  // 2. Business Manager (Specialized Role)
  if (roleLower.includes("business") || userLower.includes("vibhuti")) {
    return {
      headline: "Business Operations Suite",
      metricsTitle: "Enterprise Portfolio & Operations",
      subGreeting: timeGreeting,
      unit: unitName,
    };
  }

  // 3. Sales / RSM / ASM / Saleshead / Sales Executive
  if (
    roleLower.includes("sales") ||
    roleLower.includes("rsm") ||
    roleLower.includes("asm") ||
    roleLower.includes("head") ||
    roleLower.includes("executive") ||
    deptLower.includes("sales") ||
    deptLower.includes("commercial")
  ) {
    return {
      headline: "Today's Target & Pipeline",
      metricsTitle: "Performance Metrics",
      subGreeting: timeGreeting,
      unit: unitName,
    };
  }

  // 4. Finance / Accounts
  if (
    roleLower.includes("finance") ||
    roleLower.includes("account") ||
    roleLower.includes("billing") ||
    deptLower.includes("finance") ||
    deptLower.includes("account")
  ) {
    return {
      headline: "Financial Overview & Receivables",
      metricsTitle: "Ledger & Collections",
      subGreeting: timeGreeting,
      unit: unitName,
    };
  }

  // 5. Warehouse / Inventory / Logistics
  if (
    roleLower.includes("warehouse") ||
    roleLower.includes("inventory") ||
    roleLower.includes("logistic") ||
    roleLower.includes("dispatch") ||
    roleLower.includes("supply") ||
    deptLower.includes("inventory") ||
    deptLower.includes("warehouse")
  ) {
    return {
      headline: "Dispatch & Stock Console",
      metricsTitle: "Inventory Status",
      subGreeting: timeGreeting,
      unit: unitName,
    };
  }

  // 6. Admin / Directors / Executives
  if (
    roleLower.includes("admin") ||
    roleLower.includes("director") ||
    roleLower.includes("chief") ||
    roleLower.includes("ceo") ||
    roleLower.includes("md") ||
    deptLower.includes("management") ||
    deptLower.includes("executive")
  ) {
    return {
      headline: "Executive Overview",
      metricsTitle: "Organization Pulse",
      subGreeting: timeGreeting,
      unit: unitName,
    };
  }

  // 7. Default / General Employee
  return {
    headline: "Today's Focus",
    metricsTitle: "Daily Activity",
    subGreeting: timeGreeting,
    unit: unitName,
  };
}
