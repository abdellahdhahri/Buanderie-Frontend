import { useEffect, useState } from "react";
import { isDarkTheme, onThemeChange } from "../utils/theme";

// true si le mode sombre est actif ; se met à jour au changement de thème
export function useIsDark() {
  const [dark, setDark] = useState(isDarkTheme);
  useEffect(() => onThemeChange(setDark), []);
  return dark;
}

// Couleurs des graphiques (Chart.js) selon le thème — valeurs claires inchangées
const CHART_THEME = {
  light: { grid: "#f1f5f9", ticks: "#94a3b8", legend: "#64748b", segmentBorder: "#ffffff" },
  dark:  { grid: "rgba(148, 163, 184, 0.12)", ticks: "#8d9bb0", legend: "#c1ccdb", segmentBorder: "#111a2b" },
};

export function useChartTheme() {
  return CHART_THEME[useIsDark() ? "dark" : "light"];
}
