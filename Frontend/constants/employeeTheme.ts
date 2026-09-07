/**
 * Employee Workspace Theme Tokens
 * Strict implementation of Nexus Graphite Mint design system.
 */

export const EmployeeLightTheme = {
  isDark: false,
  background: "#F1F4F2",
  mainSurface: "#FFFFFF",
  secondarySurface: "#F7F9F8",
  mintSurface: "#DDF4EA",
  elevatedSurface: "#FFFFFF",
  primaryText: "#101513",
  secondaryText: "#5E6964",
  mutedText: "#8FA09A",
  primaryMint: "#00A879",
  brightMint: "#19C997",
  accentLime: "#A6E22E",
  border: "#D8E0DC",
  borderSubtle: "#E4ECE8",
  error: "#D84A4A",
  errorBg: "#FDF2F2",
  warning: "#E49B31",
  warningBg: "#FEF9EE",
  card: "#FFFFFF",
  dockBg: "#101815",
  dockBorder: "rgba(255, 255, 255, 0.1)",
  glassOverlay: "rgba(16, 21, 19, 0.6)",
};

export const EmployeeDarkTheme = {
  isDark: true,
  background: "#080C0B",
  mainSurface: "#0E1714",
  secondarySurface: "#121F1B",
  mintSurface: "rgba(53, 214, 160, 0.12)",
  elevatedSurface: "#15221D",
  primaryText: "#F1F7F4",
  secondaryText: "#8FA09A",
  mutedText: "#5A6D66",
  primaryMint: "#35D6A0",
  brightMint: "#20E3AD",
  accentLime: "#B7F34A",
  border: "#294039",
  borderSubtle: "#1C2F29",
  error: "#FF6B6B",
  errorBg: "rgba(255, 107, 107, 0.12)",
  warning: "#F2B84B",
  warningBg: "rgba(242, 184, 75, 0.12)",
  card: "#0E1714",
  dockBg: "#0C1411",
  dockBorder: "rgba(53, 214, 160, 0.18)",
  glassOverlay: "rgba(0, 0, 0, 0.75)",
};

export type EmployeeTheme = typeof EmployeeDarkTheme;
