import { CATEGORIE_META } from "../../../constants/categoriesLinge";

export const accentOf = (categorie) => CATEGORIE_META[categorie]?.accent || "#64748b";

export const shelfLabel = (emp) => (emp ? (emp.numero != null ? `${emp.nom} (n° ${emp.numero})` : emp.nom) : "");
