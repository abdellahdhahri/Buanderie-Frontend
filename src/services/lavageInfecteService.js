const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

export const TYPES_SOURCE = {
  BAC: "Bac de tri",
  BAC_INFECTE: "Bac infecté",
};

export const libelleTypeSource = (t, type) =>
  t(`lavage_infecte.source_${type}`, TYPES_SOURCE[type] || type || "—");

export async function lireMessageServeur(res, fallback) {
  const texte = await res.text().catch(() => "");
  if (!texte) return `${fallback} (${res.status})`;
  try {
    const data = JSON.parse(texte);
    if (typeof data === "string") return data;
    return data?.message || data?.erreur || data?.error || `${fallback} (${res.status})`;
  } catch {
    return texte;
  }
}

async function exiger(res, fallback) {
  if (!res.ok) {
    const err = new Error(await lireMessageServeur(res, fallback));
    err.status = res.status;
    throw err;
  }
  const texte = await res.text();
  try { return texte ? JSON.parse(texte) : null; } catch { return texte; }
}

const estTypeInfecte = (v) =>
  String(v || "").toUpperCase().normalize("NFD").replace(/[̀-ͯ]/g, "").includes("INFECT");

export const typeDuBac = (bac) => bac?.typebac ?? bac?.typeBac ?? bac?.typeCollecte ?? bac?.type ?? null;

export const estBacInfecte = (bac) => estTypeInfecte(typeDuBac(bac));

export function estCycleInfecte(cycle) {
  if (!cycle) return false;
  if (cycle.infecte != null) return Boolean(cycle.infecte);
  if (cycle.machine?.categorie === "LINGES_INFECTE") return true;
  const prog = cycle.programmeLavage || {};
  if (prog.desinfection || prog.estDesinfection || prog.programmeDesinfection) return true;
  return (cycle.items || []).some((i) => i.typeSource === "BAC_INFECTE");
}

export async function chercherMachine(code) {
  const res = await fetch(`${API_URL}/api/machines/code/${encodeURIComponent(code)}`);
  if (res.status === 404) return null;
  return exiger(res, "Lecture de la machine impossible");
}

export async function chercherBac(code) {
  const res = await fetch(`${API_URL}/api/bacs/code/${encodeURIComponent(code)}`);
  if (res.status === 404) return null;
  return exiger(res, "Lecture du bac impossible");
}

export async function listerBacsInfectes() {
  const res = await fetch(`${API_URL}/api/bacs`);
  const data = await exiger(res, "Lecture des bacs impossible");
  const liste = Array.isArray(data) ? data : data?.content || [];
  return liste.filter(estBacInfecte);
}

export async function chercherAgent(code) {
  const res = await fetch(`${API_URL}/api/personnel/code/${encodeURIComponent(code)}`);
  if (res.status === 404) return null;
  return exiger(res, "Lecture de l'agent impossible");
}

export async function demarrerLavageBacInfecte({ codeMachine, codeBac, matriculeAgent, poidsCharge, produitIds }) {
  const params = new URLSearchParams({ codeMachine, codeBac, matriculeAgent });
  if (poidsCharge != null && poidsCharge !== "") params.append("poidsCharge", poidsCharge);
  if (Array.isArray(produitIds) && produitIds.length) params.append("produitIds", produitIds.join(","));
  const res = await fetch(`${API_URL}/api/lavage/start-bac-infecte?${params}`, { method: "POST" });
  return exiger(res, "Démarrage du lavage impossible");
}

export async function terminerCycleLavage(cycleId, codeBac) {
  const query = codeBac ? `?${new URLSearchParams({ codeBac })}` : "";
  const res = await fetch(`${API_URL}/api/lavage/${cycleId}/finish${query}`, { method: "PUT" });
  return exiger(res, "Fin de cycle impossible");
}

export async function chargerItemsCycle(cycleId) {
  const res = await fetch(`${API_URL}/api/lavage/cycles/${cycleId}/items`);
  const data = await exiger(res, "Lecture des éléments du cycle impossible");
  return Array.isArray(data) ? data : data?.content || data?.items || [];
}

export const codeElement = (item) =>
  (item.typeSource === "BAC" ? item.codeBac || item.codeSource : null)
  || item.codeSource || item.codeBac || item.codeBarre || item.code
  || (item.sourceId != null ? `#${item.sourceId}` : "—");

export function listeQuantites(source) {
  const d = source?.detailQuantites;
  if (!d) return [];
  if (Array.isArray(d)) {
    return d
      .map((x) => ({ categorie: x.categorie || x.cle || x.key, quantite: Number(x.quantite ?? x.quantiteDeclaree ?? x.valeur ?? 0) }))
      .filter((x) => x.categorie);
  }
  if (typeof d === "object") {
    return Object.entries(d).map(([categorie, quantite]) => ({ categorie, quantite: Number(quantite) || 0 }));
  }
  return [];
}

export async function cycleEnCoursSurMachine(codeMachine) {
  const res = await fetch(`${API_URL}/api/lavage/cycles`);
  const data = await exiger(res, "Lecture des cycles impossible");
  const liste = Array.isArray(data) ? data : data?.content || [];
  return liste.find((c) => c.statut === "EN_COURS" && c.machine?.code === codeMachine) || null;
}

export async function cycleContientInfecte(cycleId) {
  const items = await chargerItemsCycle(cycleId);
  return items.some((i) => i.typeSource === "BAC_INFECTE");
}
