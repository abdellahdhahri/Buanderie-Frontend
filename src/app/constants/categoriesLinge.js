// Catégories de linge — miroir de l'enum backend tn.softsys.buanderie.entity.enums.CategLinge
import {
  BedDouble,
  BedSingle,
  Layers,
  Stethoscope,
  Bath,
  Droplets,
  Shirt,
  LayoutGrid,
  UtensilsCrossed,
  BriefcaseMedical,
  Package,
} from "lucide-react";

export const CATEGORIES_LINGE = [
  "DRAP",
  "TAIE_OREILLER",
  "COUETTE",
  "CHAMP_OPERATOIRE",
  "SERVIETTE_BAIN",
  "SERVIETTE_VISAGE",
  "PEIGNOIR",
  "NAPPE",
  "SERVIETTE_TABLE",
  "UNIFORME",
  "AUTRE",
];

// Icône + couleur d'accent par catégorie (utilisées par CategoryPicker)
export const CATEGORIE_META = {
  DRAP:             { Icon: BedDouble,        accent: "#0D9488" },
  TAIE_OREILLER:    { Icon: BedSingle,        accent: "#0284C7" },
  COUETTE:          { Icon: Layers,           accent: "#4F46E5" },
  CHAMP_OPERATOIRE: { Icon: Stethoscope,      accent: "#059669" },
  SERVIETTE_BAIN:   { Icon: Bath,             accent: "#0891B2" },
  SERVIETTE_VISAGE: { Icon: Droplets,         accent: "#2563EB" },
  PEIGNOIR:         { Icon: Shirt,            accent: "#7C3AED" },
  NAPPE:            { Icon: LayoutGrid,       accent: "#D97706" },
  SERVIETTE_TABLE:  { Icon: UtensilsCrossed,  accent: "#DB2777" },
  UNIFORME:         { Icon: BriefcaseMedical, accent: "#475569" },
  AUTRE:            { Icon: Package,          accent: "#64748B" },
};

export const getCategorieMeta = (cat) => CATEGORIE_META[cat] || CATEGORIE_META.AUTRE;
