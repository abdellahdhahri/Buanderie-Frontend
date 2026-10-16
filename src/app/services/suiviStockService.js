import { apiFetch } from "./api";

const BASE = "/api/suivi-stock";

async function request(endpoint) {
  const response = await apiFetch(`${BASE}${endpoint}`);
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!response.ok) {
    const message =
      (data && typeof data === "object" && (data.erreur || data.message || data.error)) ||
      (typeof data === "string" && data) ||
      `Erreur ${response.status}`;
    throw new Error(message);
  }
  return data;
}

const sum = (obj) => Object.values(obj || {}).reduce((s, n) => s + (Number(n) || 0), 0);

/**
 * parCategorie → [{ categorie, total, parZone }] trié par total décroissant.
 * Accepte aussi la forme objet { DRAP: { OFFICE: 3, ... } } par sécurité.
 */
function normalizeParCategorie(parCategorie) {
  const list = Array.isArray(parCategorie)
    ? parCategorie.map((c) => ({ categorie: c.categorie, parZone: c.parZone || {}, total: c.total ?? sum(c.parZone) }))
    : Object.entries(parCategorie || {}).map(([categorie, parZone]) => ({ categorie, parZone: parZone || {}, total: sum(parZone) }));
  return list.sort((a, b) => b.total - a.total);
}

function normalize(data) {
  return {
    ...data,
    totalParc: data?.totalParc ?? sum(data?.parZone),
    parZone: data?.parZone || {},
    parCategorie: normalizeParCategorie(data?.parCategorie),
    services: (data?.services || [])
      .map((s) => ({ ...s, parZone: s.parZone || {}, totalParc: s.totalParc ?? sum(s.parZone) }))
      .sort((a, b) => b.totalParc - a.totalParc),
  };
}

export const fetchSuiviGlobal = () => request("").then(normalize);

export const fetchSuiviService = (serviceId) => request(`/service/${serviceId}`).then(normalize);

export function fetchLingesSuivi({ zone, serviceId, categorie, page = 0, size = 50 }) {
  const params = new URLSearchParams();
  if (zone) params.set("zone", zone);
  if (serviceId != null) params.set("serviceId", serviceId);
  if (categorie) params.set("categorie", categorie);
  params.set("page", page);
  params.set("size", size);
  return request(`/linges?${params}`).then((d) => ({
    total: d?.total ?? 0,
    page: d?.page ?? page,
    totalPages: d?.totalPages ?? 0,
    linges: d?.linges || [],
  }));
}
