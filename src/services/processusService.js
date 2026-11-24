import { lireErreur } from "./integrationService";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

const enTetes = () => {
  try {
    const token = JSON.parse(localStorage.getItem("auth") || "null")?.token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
};

export const ROUTES_ETAPES = {
  COLLECTE: "/collecteList",
  RECEPTION: "/Receptions",
  TRI: "/tri",
  LAVAGE: "/Lavages",
  SECHAGE: "/Sechages",
  PLIAGE: "/Pliages",
  STOCKAGE: "/stockage-arsenal",
  DISTRIBUTION: "/distribution",
};

export const codeEtape = (e) => String(e?.code ?? e?.codeEtape ?? "").toUpperCase();
export const nomEtape = (e) => e?.nom ?? e?.libelle ?? e?.designation ?? codeEtape(e);
export const routeEtape = (e) => ROUTES_ETAPES[codeEtape(e)] || null;
export const estActive = (e) => e?.actif !== false;

export const idsSuivantes = (e) =>
  (Array.isArray(e?.suivantes) ? e.suivantes : [])
    .map((s) => (s && typeof s === "object" ? s.id : s))
    .filter((id) => id != null);

export async function chargerParcours() {
  const res = await fetch(`${API_URL}/api/linge-etapes/parcours`, { headers: enTetes() });
  if (!res.ok) throw new Error(await lireErreur(res, "Erreur chargement du parcours"));
  const data = await res.json();
  const liste = Array.isArray(data) ? data : data?.content || data?.etapes || [];
  return [...liste].sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0));
}

export async function chercherEtapeParCode(codeBarre) {
  const res = await fetch(`${API_URL}/api/linge-etapes/code/${encodeURIComponent(codeBarre)}`, { headers: enTetes() });
  if (res.status === 404) return { inconnu: true };
  if (!res.ok) return { erreur: await lireErreur(res, "Code d'étape inconnu") };
  const etape = await res.json().catch(() => null);
  return etape ? { etape } : { inconnu: true };
}
