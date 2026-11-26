// constants/theme.ts - Update your colors
export const colors = {
  dark: {
    background: "#000C1D", // Dark gray-blue background (matching image)
    surface: "#0b1015ff", // Card background color
    primary: "#60a5fa",
    secondary: "#a78bfa",
    accent: "#34d399",
    text: "#ffffff",
    textSecondary: "#cbd5e1",
    border: "#1e3a5f",
    cardBackground: "#1a2942", // Elevated card color
    tableHeader: "#0D1B2A",
    tableBody: "#0e233aff",

    iconGreen: "#4ade80",
    iconBlue: "#60a5fa",
    iconOrange: "#fb923c",
    iconPurple: "#c084fc",
  },

  light: {
    background: "#f5f5f5",
    surface: "#ffffff",
    primary: "#2563eb",
    secondary: "#7c3aed",
    accent: "#059669",
    text: "#000000",
    textSecondary: "#64748b",
    border: "#e2e8f0",
    cardBackground: "#ffffff",

    iconGreen: "#22c55e",
    iconBlue: "#3b82f6",
    iconOrange: "#f97316",
    iconPurple: "#a855f7",
  },
};

export type ThemeColors = typeof colors.dark;

export const getIconColor = (index: number): string => {
  const iconColors = [
    colors.dark.iconGreen,
    colors.dark.iconBlue,
    colors.dark.iconOrange,
    colors.dark.iconPurple,
    colors.dark.iconGreen,
    colors.dark.iconBlue,
    colors.dark.iconOrange,
    colors.dark.iconBlue,
    colors.dark.iconPurple,
    colors.dark.iconGreen,
    colors.dark.iconOrange,
    colors.dark.iconBlue,
    colors.dark.iconPurple,
    colors.dark.iconOrange,
  ];
  return iconColors[index % iconColors.length];
};
