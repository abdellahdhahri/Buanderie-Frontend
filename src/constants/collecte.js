// ─── Poids moyens par catégorie (kg) ─────────────────────────────────────────
export const POIDS_MOYEN = {
  DRAP:             0.8,
  TAIE_OREILLER:   0.15,
  SERVIETTE_BAIN:  0.5,
  SERVIETTE_VISAGE: 0.2,
  PEIGNOIR:        0.6,
  NAPPE:           0.4,
  SERVIETTE_TABLE: 0.15,
  UNIFORME:        0.4,
  AUTRE:           0.3,
};

export const CAPACITE_SAC_KG = 20;

export const CATEGORIES_INFECTE = [
  { id: "DRAP",             label: "Drap",           emoji: "🛏️", color: "#dc2626", bg: "#fee2e2", border: "#fca5a5" },
  { id: "TAIE_OREILLER",   label: "Taie Oreiller",  emoji: "💤", color: "#ea580c", bg: "#ffedd5", border: "#fdba74" },
  { id: "SERVIETTE_BAIN",  label: "Serviette Bain", emoji: "🛁", color: "#d97706", bg: "#fef3c7", border: "#fcd34d" },
  { id: "SERVIETTE_VISAGE",label: "Serv. Visage",   emoji: "🧻", color: "#65a30d", bg: "#ecfccb", border: "#a3e635" },
  { id: "PEIGNOIR",        label: "Peignoir",        emoji: "🥼", color: "#0891b2", bg: "#cffafe", border: "#67e8f9" },
  { id: "NAPPE",           label: "Nappe",           emoji: "🍽️", color: "#7c3aed", bg: "#ede9fe", border: "#c4b5fd" },
  { id: "SERVIETTE_TABLE", label: "Serv. Table",     emoji: "🍴", color: "#be185d", bg: "#fce7f3", border: "#f9a8d4" },
  { id: "UNIFORME",        label: "Uniforme",        emoji: "👔", color: "#0f766e", bg: "#ccfbf1", border: "#5eead4" },
  { id: "AUTRE",           label: "Autre",           emoji: "📦", color: "#475569", bg: "#f1f5f9", border: "#cbd5e1" },
];

export const VOIX_MAP = [
  { mots: ["drap", "draps"],                               cat: "DRAP"             },
  { mots: ["taie", "taies", "oreiller"],                   cat: "TAIE_OREILLER"   },
  { mots: ["serviette bain", "bain", "grande serviette"],  cat: "SERVIETTE_BAIN"  },
  { mots: ["serviette visage", "visage", "débarbouillette"],cat:"SERVIETTE_VISAGE" },
  { mots: ["peignoir", "peignoirs"],                       cat: "PEIGNOIR"        },
  { mots: ["nappe", "nappes"],                             cat: "NAPPE"           },
  { mots: ["serviette table", "table"],                    cat: "SERVIETTE_TABLE" },
  { mots: ["uniforme", "uniformes", "blouse", "tenue"],    cat: "UNIFORME"        },
  { mots: ["annule", "annuler", "efface", "supprimer"],    cat: "ANNULE"          },
];

export const NOMBRES_FR = {
  un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5,
  six: 6, sept: 7, huit: 8, neuf: 9, dix: 10,
  onze: 11, douze: 12, treize: 13, quatorze: 14, quinze: 15,
};
