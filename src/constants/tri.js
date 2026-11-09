export const STATS_INITIALES = { totalTrie: 0, lotsUtilises: 0, poidsTotal: 0 };

export const MODE_RFID      = "rfid";
export const MODE_CODEBARRE = "codebarre";

export const COULEURS_LOTS = [
  { id: "lot1",  color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe", emoji: "📦" },
  { id: "lot2",  color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe", emoji: "📦" },
  { id: "lot3",  color: "#0891b2", bg: "#ecfeff", border: "#a5f3fc", emoji: "📦" },
  { id: "lot4",  color: "#059669", bg: "#ecfdf5", border: "#a7f3d0", emoji: "📦" },
  { id: "lot5",  color: "#d97706", bg: "#fffbeb", border: "#fde68a", emoji: "📦" },
  { id: "lot6",  color: "#dc2626", bg: "#fef2f2", border: "#fecaca", emoji: "📦" },
  { id: "lot7",  color: "#4f46e5", bg: "#eef2ff", border: "#c7d2fe", emoji: "📦" },
  { id: "lot8",  color: "#0d9488", bg: "#f0fdfa", border: "#99f6e4", emoji: "📦" },
  { id: "lot9",  color: "#ea580c", bg: "#fff7ed", border: "#fed7aa", emoji: "📦" },
  { id: "lot10", color: "#8b5cf6", bg: "#f5f3ff", border: "#ddd6fe", emoji: "📦" },
];

export const STYLES_ETAPE = {
  active:    { background: "#0ea5e9", color: "white", border: "2px solid #0ea5e9", fontWeight: 700 },
  completed: { background: "#22c55e", color: "white", border: "2px solid #22c55e", fontWeight: 500 },
  idle:      { background: "white",   color: "#94a3b8", border: "1px solid #e2e8f0", fontWeight: 500 },
};
