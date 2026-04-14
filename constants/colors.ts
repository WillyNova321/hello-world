const colors: {
  light: Record<string, string>;
  dark: Record<string, string>;
  radius: number;
} = {
  light: {
    text: "#0F172A",
    tint: "#0EA5E9",
    background: "#F8FAFC",
    foreground: "#0F172A",
    card: "#FFFFFF",
    cardForeground: "#0F172A",
    primary: "#0EA5E9",
    primaryForeground: "#FFFFFF",
    secondary: "#F1F5F9",
    secondaryForeground: "#1E293B",
    muted: "#F1F5F9",
    mutedForeground: "#64748B",
    accent: "#F97316",
    accentForeground: "#FFFFFF",
    destructive: "#EF4444",
    destructiveForeground: "#FFFFFF",
    border: "#E2E8F0",
    input: "#E2E8F0",
    pulseGreen: "#10B981",
    pulseYellow: "#F59E0B",
    pulseRed: "#EF4444",
    pulseBg: "#F0FDF4",
    surface: "#FFFFFF",
    surfaceElevated: "#F8FAFC",
  },
  dark: {
    text: "#F1F5F9",
    tint: "#38BDF8",
    background: "#0A1628",
    foreground: "#F1F5F9",
    card: "#0F2040",
    cardForeground: "#F1F5F9",
    primary: "#38BDF8",
    primaryForeground: "#0A1628",
    secondary: "#1A2F50",
    secondaryForeground: "#CBD5E1",
    muted: "#1A2F50",
    mutedForeground: "#94A3B8",
    accent: "#FB923C",
    accentForeground: "#0A1628",
    destructive: "#F87171",
    destructiveForeground: "#0A1628",
    border: "#1E3A5F",
    input: "#1E3A5F",
    pulseGreen: "#34D399",
    pulseYellow: "#FBBF24",
    pulseRed: "#F87171",
    pulseBg: "#022C22",
    surface: "#0F2040",
    surfaceElevated: "#162945",
  },
  radius: 16,
};

export type ColorScheme = "light" | "dark";
export type ThemeColors = Record<string, string>;

export default colors;
