// ═══════════════════════════════════════════════════════════════════════════
// 📊 LINGES — chargement de toute la sélection filtrée, statistiques, export
// ═══════════════════════════════════════════════════════════════════════════
import { exportXlsx } from "../../utils/excelExport";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";
const CHUNK = 1000;

// Tous les linges correspondant aux filtres (toutes les pages), sans toucher
// à la page affichée dans le tableau
export async function fetchAllLinges(filters = {}) {
  const all = [];
  for (let page = 0; ; page++) {
    const params = new URLSearchParams({ page, size: CHUNK });
    ["categorie", "etat", "serviceId", "search"].forEach((k) => filters[k] && params.append(k, filters[k]));
    const res = await fetch(`${API_URL}/api/linges/paged?${params}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    all.push(...(data.content || []));
    if (data.last || page + 1 >= (data.totalPages || 0) || !(data.content || []).length) break;
  }
  return all;
}

const countBy = (list, keyOf) => {
  const m = new Map();
  list.forEach((l) => {
    const k = keyOf(l) ?? "";
    m.set(k, (m.get(k) || 0) + 1);
  });
  return [...m.entries()].map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count);
};

export function computeLingeStats(linges) {
  const total = linges.length;
  const poids = linges.map((l) => Number(l.poids) || 0);
  const poidsTotal = poids.reduce((s, p) => s + p, 0);
  const avecPoids = poids.filter((p) => p > 0).length;
  const durees = linges.map((l) => Number(l.durevie ?? l.dureVie)).filter((d) => Number.isFinite(d) && d > 0);
  const rfid = linges.filter((l) => l.rfidTag).length;
  const sansService = linges.filter((l) => !l.serviceId).length;
  const avecPorteur = linges.filter((l) => l.porteurId).length;

  return {
    total,
    poidsTotal,
    poidsMoyen: avecPoids ? poidsTotal / avecPoids : 0,
    dureeMoyenne: durees.length ? durees.reduce((s, d) => s + d, 0) / durees.length : 0,
    rfid,
    rfidPct: total ? Math.round((rfid / total) * 100) : 0,
    sansService,
    avecPorteur,
    parEtat: countBy(linges, (l) => l.etat || "—"),
    parCategorie: countBy(linges, (l) => l.categorie || "AUTRE"),
    parService: countBy(linges, (l) => l.serviceId || ""),
  };
}

const stamp = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}`;
};

// Classeur : feuille « Linges » (détail) + feuille « Synthèse »
export function exportLingesXlsx(linges, { t, getServiceName, getPorteurName, filtersLabel }) {
  const stats = computeLingeStats(linges);
  const etat = (e) => (e ? t(`linge_etat.${e}`, e) : "");
  const cat = (c) => (c ? t(`categories.${c}`, c) : "");

  const detail = {
    name: t("linge.export.sheet_linges", "Linges"),
    columns: [
      { header: t("linge.export.barcode", "Code-barres"), key: "codebarre", width: 20 },
      { header: "RFID", key: "rfid", width: 26 },
      { header: t("linge.category", "Catégorie"), key: "categorie", width: 20 },
      { header: t("linge.status", "État"), key: "etat", width: 16 },
      { header: t("linge.service", "Service"), key: "service", width: 24 },
      { header: t("linge.export.weight", "Poids (kg)"), key: "poids", width: 12, type: "number" },
      { header: t("linge.export.lifespan", "Durée de vie"), key: "durevie", width: 13, type: "integer" },
      { header: t("linge.export.wearer", "Porteur"), key: "porteur", width: 24 },
      { header: t("linge.export.bin", "Bac"), key: "bac", width: 10 },
      { header: t("linge.export.lot", "Lot"), key: "lot", width: 10 },
      { header: "ID", key: "id", width: 8, type: "integer" },
    ],
    rows: linges.map((l) => ({
      codebarre: l.codebarre ?? l.codeBarre ?? "",
      rfid: l.rfidTag || "",
      categorie: cat(l.categorie),
      etat: etat(l.etat),
      service: l.serviceId ? getServiceName(l.serviceId) : "",
      poids: l.poids ?? "",
      durevie: l.durevie ?? l.dureVie ?? "",
      porteur: l.porteurId ? getPorteurName(l.porteurId) : "",
      bac: l.bacCode || l.bacId || "",
      lot: l.lotId || "",
      id: l.id,
    })),
  };

  const pct = (n) => (stats.total ? Math.round((n / stats.total) * 1000) / 10 : 0);
  const block = (title, list, label) => [
    { a: title, b: "", c: "" },
    ...list.map((x) => ({ a: label(x.key), b: x.count, c: pct(x.count) })),
    { a: "", b: "", c: "" },
  ];
  const synthese = {
    name: t("linge.export.sheet_summary", "Synthèse"),
    title: t("linge.export.title", "Inventaire des linges"),
    subtitle: `${t("linge.export.generated", "Généré le")} ${new Date().toLocaleString()} · ${filtersLabel}`,
    columns: [
      { header: t("linge.export.indicator", "Indicateur"), key: "a", width: 32 },
      { header: t("linge.export.value", "Valeur"), key: "b", width: 14, type: "number" },
      { header: "%", key: "c", width: 10, type: "number" },
    ],
    rows: [
      { a: t("linge.stats.total", "Linges"), b: stats.total, c: "" },
      { a: t("linge.stats.total_weight", "Poids total (kg)"), b: Math.round(stats.poidsTotal * 100) / 100, c: "" },
      { a: t("linge.stats.avg_weight", "Poids moyen (kg)"), b: Math.round(stats.poidsMoyen * 100) / 100, c: "" },
      { a: t("linge.stats.avg_lifespan", "Durée de vie moyenne"), b: Math.round(stats.dureeMoyenne * 10) / 10, c: "" },
      { a: t("linge.stats.rfid", "Avec tag RFID"), b: stats.rfid, c: pct(stats.rfid) },
      { a: t("linge.stats.no_service", "Sans service"), b: stats.sansService, c: pct(stats.sansService) },
      { a: "", b: "", c: "" },
      ...block(t("linge.stats.by_status", "Par état"), stats.parEtat, etat),
      ...block(t("linge.stats.by_category", "Par catégorie"), stats.parCategorie, cat),
      ...block(t("linge.stats.by_service", "Par service"), stats.parService, (id) => (id ? getServiceName(id) : t("linge.unassigned", "Non assigné"))),
    ],
  };

  exportXlsx({ fileName: `linges_${stamp()}.xlsx`, sheets: [detail, synthese] });
}
