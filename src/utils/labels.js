import printJS from "print-js";
import { getEstablishment, urlLogo, DEFAULT_LOGO } from "../services/establishmentService";

/* ═══════════════════════════════════════════════════════════════════════════
   MOTEUR D'ÉTIQUETTES — une seule mise en page pour toutes les étiquettes,
   paramétrable par type dans Paramètres › Étiquettes (mémorisé sur le poste).
   ═══════════════════════════════════════════════════════════════════════════ */

const STORAGE_KEY = "labelSettings.v1";
const EVENT = "labelsettingschange";

const escapeHtml = (s = "") =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const serviceName = (item, ctx) => {
  if (item.serviceNom) return item.serviceNom;
  const id = item.serviceId ?? item.ServiceId;
  if (id == null) return "";
  const s = (ctx.services || []).find((x) => String(x.id) === String(id));
  return s ? (s.code || s.nom || "") : "";
};
const categorie = (item, ctx) => (item.categorie ? ctx.t(`categories.${item.categorie}`, item.categorie) : "");

// ─── Formats d'étiquette (mm) ──────────────────────────────────────────────
export const LABEL_SIZES = {
  "90x60": { w: 90, h: 60, label: "90 × 60 mm" },
  "70x40": { w: 70, h: 40, label: "70 × 40 mm" },
  "60x40": { w: 60, h: 40, label: "60 × 40 mm" },
  "50x30": { w: 50, h: 30, label: "50 × 30 mm" },
};

// ─── Éléments communs à toutes les étiquettes ──────────────────────────────
export const LABEL_ELEMENTS = [
  { key: "header", fr: "En-tête (type d'article)" },
  { key: "date", fr: "Date d'impression" },
  { key: "barcode", fr: "Code-barres" },
  { key: "codeText", fr: "Code en clair" },
  { key: "colorBand", fr: "Bande de couleur" },
  { key: "logo", fr: "Logo de l'établissement" },
  { key: "establishment", fr: "Nom de l'établissement" },
];

// ─── Types d'étiquettes : couleur, code, informations disponibles ─────────
export const LABEL_TYPES = {
  linge: {
    color: "#0ca678",
    code: (it) => it.codebarre || it.codeBarre || it.code || `ID-${it.id}`,
    fields: {
      categorie: { fr: "Catégorie", get: categorie },
      service: { fr: "Service", get: serviceName },
      poids: { fr: "Poids", get: (it) => (it.poids != null ? `${it.poids} kg` : "") },
      rfid: { fr: "Tag RFID", get: (it) => it.rfidTag || "" },
      porteur: { fr: "Porteur", get: (it, ctx) => it.porteurNom || ctx.porteurName || "" },
    },
    defaults: { size: "50x30", fields: ["categorie", "service"] },
    sample: { codebarre: "10201800012728", categorie: "DRAP", serviceNom: "CARDIO", poids: 0.8, rfidTag: "E2801160600002", porteurNom: "Dr Ali Ben Salah" },
  },

  bac: {
    color: "#d97706",
    code: (it) => it.code || it.codeBarre || it.reference || `BAC-${it.id}`,
    fields: {
      reference: { fr: "Référence", get: (it) => it.reference || "" },
      type: { fr: "Type", get: (it) => it.type || it.typeBac || "" },
      service: { fr: "Service", get: serviceName },
    },
    defaults: { size: "90x60", fields: ["reference"] },
    sample: { code: "BAC-0007", reference: "Bac blanc 120 L", type: "BLANC", serviceNom: "URGENCES" },
  },
  machine: {
    color: "#0d9488",
    code: (it) => it.code || it.codeBarre || `MACH-${it.id}`,
    fields: {
      designation: { fr: "Désignation / marque", get: (it) => it.designation || it.marque || "" },
      capacite: { fr: "Capacité", get: (it) => (it.capaciteKg ? `${it.capaciteKg} kg` : "") },
      categorie: { fr: "Type de machine", get: (it) => it.categorie || "" },
    },
    defaults: { size: "90x60", fields: ["designation", "capacite"] },
    sample: { code: "LAV-03", marque: "Electrolux", capaciteKg: 30, categorie: "LINGES_BLANCS" },
  },
  chambre: {
    color: "#ec4899",
    code: (it) => it.codeBarre || it.code || `CH-${it.id}`,
    fields: {
      chambre: { fr: "Chambre", get: (it) => it.code || "" },
      service: { fr: "Service", get: serviceName },
    },
    defaults: { size: "90x60", fields: ["chambre", "service"] },
    sample: { code: "CH-104", codeBarre: "20104000104", serviceNom: "CHIRURGIE" },
  },
  lit: {
    color: "#2563eb",
    code: (it) => it.code || it.codeBarre || `LIT-${it.id}`,
    fields: {
      chambre: { fr: "Chambre", get: (it, ctx) => it.chambreCode || it.chambreNom || ctx.chambre || "" },
      description: { fr: "Description", get: (it) => it.description || "" },
    },
    defaults: { size: "70x40", fields: ["chambre"] },
    sample: { code: "LIT-104-A", chambreCode: "CH-104", description: "Lit médicalisé" },
  },

  arsenal: {
    color: "#0284c7",
    code: (it) => it.code || it.nom || `ARS-${it.id}`,
    fields: {
      nom: { fr: "Nom", get: (it) => it.nom || "" },
      service: { fr: "Service", get: serviceName },
    },
    defaults: { size: "60x40", fields: ["service"] },
    sample: { code: "ARS-12", nom: "Arsenal bloc", serviceNom: "BLOC OP." },
  },
  etape: {
    color: "#7c3aed",
    code: (it) => it.codeBarre || it.code || `ETAPE-${it.id}`,
    fields: {
      nom: { fr: "Étape", get: (it) => it.nom || "" },
      zone: { fr: "Zone", get: (it) => it.zone || "" },
      ordre: { fr: "Ordre", get: (it) => (it.ordre != null ? String(it.ordre) : "") },
    },
    defaults: { size: "90x60", fields: ["nom", "zone"] },
    sample: { codeBarre: "ETP-0004", nom: "Lavage", zone: "ZONE_PROPRE", ordre: 4 },
  },
  immobilisation: {
    color: "#475569",
    code: (it) => it.codeBarre || it.code || `IMM-${it.id}`,
    fields: {
      designation: { fr: "Désignation", get: (it) => it.designation || "" },
      etat: { fr: "État", get: (it) => it.etatImmobilisation || it.etat || "" },
    },
    defaults: { size: "60x40", fields: ["designation"] },
    sample: { codeBarre: "IMM-000318", designation: "Champ de table double", etatImmobilisation: "DISPONIBLE" },
  },
  default: {
    color: "#475569",
    code: (it) => it.codeBarre || it.code || it.reference || `ID-${it.id}`,
    fields: {
      designation: { fr: "Désignation", get: (it, ctx) => it.designation || categorie(it, ctx) || "" },
    },
    defaults: { size: "90x60", fields: ["designation"] },
    sample: { code: "ART-0001", designation: "Article" },
  },
};

export const LABEL_TYPE_KEYS = Object.keys(LABEL_TYPES).filter((k) => k !== "default");

const BASE_ELEMENTS = { header: true, date: true, barcode: true, codeText: true, colorBand: true, logo: false, establishment: true };

export function defaultLabelSettings(type) {
  const def = (LABEL_TYPES[type] || LABEL_TYPES.default).defaults;
  return { size: def.size, elements: { ...BASE_ELEMENTS }, fields: [...def.fields], layout: {} };
}

// ─── Lecture / écriture des réglages ───────────────────────────────────────
function readAll() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") || {}; } catch { return {}; }
}

export function getLabelSettings(type) {
  const base = defaultLabelSettings(type);
  const saved = readAll()[type];
  if (!saved) return base;
  return {
    size: LABEL_SIZES[saved.size] ? saved.size : base.size,
    elements: { ...base.elements, ...(saved.elements || {}) },
    fields: Array.isArray(saved.fields) ? saved.fields : base.fields,
    layout: saved.layout && typeof saved.layout === "object" ? saved.layout : {},
  };
}

export function saveLabelSettings(type, settings) {
  const all = readAll();
  if (settings) all[type] = settings; else delete all[type];
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(all)); } catch { /* stockage indisponible */ }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { type } }));
}

export function onLabelSettingsChange(callback) {
  const handler = (e) => callback(e.detail);
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}

const detectFormat = (value) => {
  const v = String(value || "").replace(/\s+/g, "");
  if (/^\d{13}$/.test(v)) return "ean13";
  if (/^\d{8}$/.test(v)) return "ean8";
  if (/^\d{12}$/.test(v)) return "upc";
  return "code128";
};

export const LABEL_BLOCKS = [
  { key: "logo", fr: "Logo", font: false },
  { key: "header", fr: "En-tête", font: true },
  { key: "date", fr: "Date", font: true },
  { key: "info", fr: "Informations", font: true },
  { key: "barcode", fr: "Code-barres", font: false },
  { key: "codeText", fr: "Code en clair", font: true },
  { key: "establishment", fr: "Établissement", font: true },
];

export function visibleBlocks(settings) {
  const el = settings.elements;
  return LABEL_BLOCKS.map((b) => b.key).filter((k) => {
    if (k === "info") return settings.fields.length > 0;
    return !!el[k];
  });
}

export function getDefaultLayout(settings) {
  const { w, h } = LABEL_SIZES[settings.size] || LABEL_SIZES["90x60"];
  const el = settings.elements;
  const small = h <= 32;
  const medium = !small && h <= 42;
  const p = small ? 1.6 : 3;
  const band = el.colorBand ? (small ? 1.5 : 2.5) : 0;
  const x0 = band + p;
  const W = w - band - 2 * p;
  const rh = small ? 3.2 : 5.5;
  const logoW = small ? 10 : 18;
  const dateW = small ? 12 : 18;
  const fs = { title: small ? 6.5 : medium ? 8 : 10, info: small ? 5.5 : medium ? 6.5 : 7.5, code: small ? 7.5 : medium ? 9.5 : 12, foot: small ? 4.5 : 5.5 };
  const infoY = p + rh + (small ? 1 : 2);
  const infoH = small ? 4 : medium ? 6.5 : 9;
  const footH = small ? 2.2 : 3;
  const footY = h - p - footH;
  const codeH = small ? 3.2 : medium ? 4.5 : 5.5;
  const afterCode = el.establishment ? footY - 0.6 : h - p;
  const codeY = afterCode - codeH;
  const barY = infoY + infoH + 0.5;
  const bottom = el.codeText ? codeY - 0.8 : afterCode;
  const barH = Math.max(4, bottom - barY);
  const headX = x0 + (el.logo ? logoW + 1.5 : 0);
  const headW = Math.max(5, W - (el.logo ? logoW + 1.5 : 0) - (el.date ? dateW + 1 : 0));
  return {
    logo: { x: x0, y: p, w: logoW, h: rh, fs: 0 },
    header: { x: headX, y: p, w: headW, h: rh, fs: fs.title },
    date: { x: x0 + W - dateW, y: p, w: dateW, h: rh, fs: fs.info },
    info: { x: x0, y: infoY, w: W, h: infoH, fs: fs.info },
    barcode: { x: x0, y: barY, w: W, h: barH, fs: 0 },
    codeText: { x: x0, y: codeY, w: W, h: codeH, fs: fs.code },
    establishment: { x: x0, y: footY, w: W, h: footH, fs: fs.foot },
  };
}

export function resolveLayout(settings) {
  const base = getDefaultLayout(settings);
  const out = {};
  Object.keys(base).forEach((k) => {
    out[k] = { ...base[k], ...((settings.layout && settings.layout[k]) || {}) };
  });
  return out;
}

export function buildLabelHtml(type, item, ctx, settings = getLabelSettings(type)) {
  const def = LABEL_TYPES[type] || LABEL_TYPES.default;
  const { w, h } = LABEL_SIZES[settings.size] || LABEL_SIZES["90x60"];
  const el = settings.elements;
  const small = h <= 32;
  const color = def.color;
  const code = def.code(item);
  const identite = getEstablishment();
  const logo = new URL(urlLogo(identite) || DEFAULT_LOGO, window.location.origin).href;
  const est = { name: identite.raisonSociale || identite.nomApplication, logo };
  const title = ctx.t(`barcode_label.types.${type}`, ctx.t("barcode_label.types.default"));
  const date = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const L = resolveLayout(settings);
  const band = el.colorBand ? (small ? 1.5 : 2.5) : 0;

  const fields = settings.fields
    .map((k) => def.fields[k] && { label: ctx.t(`label_settings.fields.${type}.${k}`, def.fields[k].fr), value: def.fields[k].get(item, ctx) })
    .filter((f) => f && f.value);

  const box = (k, inner, extra = "") => {
    const b = L[k];
    return `<div data-block="${k}" style="position:absolute;left:${b.x}mm;top:${b.y}mm;width:${b.w}mm;height:${b.h}mm;overflow:hidden;box-sizing:border-box;${extra}">${inner}</div>`;
  };
  const flex = "display:flex;align-items:center;";

  const blocks = [];
  if (el.logo && est.logo) blocks.push(box("logo", `<img src="${escapeHtml(est.logo)}" style="width:100%;height:100%;object-fit:contain;object-position:left center;display:block;" alt="" />`));
  if (el.header) blocks.push(box("header", `<span style="font-size:${L.header.fs}pt;font-weight:800;color:${color};text-transform:uppercase;letter-spacing:.4pt;white-space:nowrap;">${escapeHtml(title)}</span>`, flex));
  if (el.date) blocks.push(box("date", `<span style="font-size:${L.date.fs}pt;font-weight:600;color:#64748b;white-space:nowrap;">${date}</span>`, `${flex}justify-content:flex-end;`));
  if (fields.length) {
    blocks.push(box("info", fields.map((f) => `<span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;"><span style="color:#64748b;">${escapeHtml(f.label)} :</span> <strong>${escapeHtml(f.value)}</strong></span>`).join(""), `display:flex;flex-wrap:wrap;align-content:flex-start;gap:${small ? 0.6 : 1}mm ${small ? 1.5 : 2.5}mm;font-size:${L.info.fs}pt;line-height:1.25;color:#0f172a;`));
  }
  if (el.barcode) blocks.push(box("barcode", `<img src="https://barcodeapi.org/api/${detectFormat(code)}/${encodeURIComponent(code)}" style="width:100%;height:100%;object-fit:contain;display:block;" alt="${escapeHtml(code)}" />`));
  if (el.codeText) blocks.push(box("codeText", escapeHtml(code), `${flex}justify-content:center;border-radius:1.5mm;background:${color}12;font-family:'Courier New',monospace;font-size:${L.codeText.fs}pt;font-weight:800;letter-spacing:.6pt;color:#0f172a;white-space:nowrap;`));
  if (el.establishment) blocks.push(box("establishment", escapeHtml(est.name), `${flex}justify-content:center;font-size:${L.establishment.fs}pt;font-weight:700;letter-spacing:.4pt;text-transform:uppercase;color:#94a3b8;white-space:nowrap;`));

  return `
    <div style="position:relative;width:${w}mm;height:${h}mm;box-sizing:border-box;overflow:hidden;background:#fff;font-family:'Segoe UI',Arial,sans-serif;">
      ${band ? `<div style="position:absolute;left:0;top:0;bottom:0;width:${band}mm;background:${color};"></div>` : ""}
      ${blocks.join("")}
    </div>`;
}

/** Imprime l'étiquette d'un article selon les réglages de son type. */
export function printLabel(type, item, ctx) {
  if (!item) return;
  const settings = getLabelSettings(type);
  const { w, h } = LABEL_SIZES[settings.size] || LABEL_SIZES["90x60"];
  const code = (LABEL_TYPES[type] || LABEL_TYPES.default).code(item);
  printJS({
    printable: buildLabelHtml(type, item, ctx, settings),
    type: "raw-html",
    style: `
      * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      @page { size: ${w}mm ${h}mm; margin: 0; }
      body { margin: 0; width: ${w}mm; height: ${h}mm; }
    `,
    documentTitle: `Etiquette_${type}_${code}`,
  });
}

export function printLabels(type, items, ctxOf) {
  const liste = (items || []).filter(Boolean);
  if (!liste.length) return;
  const settings = getLabelSettings(type);
  const { w, h } = LABEL_SIZES[settings.size] || LABEL_SIZES["90x60"];
  printJS({
    printable: liste.map((item, i) => `<div style="${i < liste.length - 1 ? "page-break-after:always;break-after:page;" : ""}">${buildLabelHtml(type, item, ctxOf(item), settings)}</div>`).join(""),
    type: "raw-html",
    style: `
      * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      @page { size: ${w}mm ${h}mm; margin: 0; }
      body { margin: 0; width: ${w}mm; }
    `,
    documentTitle: `Etiquettes_${type}_${liste.length}`,
  });
}
