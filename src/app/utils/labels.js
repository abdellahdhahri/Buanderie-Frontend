import printJS from "print-js";
import { getEstablishment } from "../services/establishmentService";

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
  lot: {
    color: "#7c3aed",
    code: (it) => it.codeLot || it.code || `LOT-${it.id}`,
    fields: {
      categorie: { fr: "Catégorie", get: categorie },
      typeCollecte: { fr: "Type de collecte", get: (it) => it.typeCollecte || "" },
      poids: { fr: "Poids / capacité", get: (it) => (it.capaciteMax ? `${(it.poidsActuel ?? 0).toFixed(1)} / ${it.capaciteMax} kg` : "") },
    },
    defaults: { size: "90x60", fields: ["categorie", "typeCollecte"] },
    sample: { codeLot: "LOT-2026-0042", categorie: "SERVIETTE_BAIN", typeCollecte: "BLANC", poidsActuel: 12.5, capaciteMax: 30 },
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
    code: (it) => it.code || it.codeBarre || `CH-${it.id}`,
    fields: {
      service: { fr: "Service", get: serviceName },
    },
    defaults: { size: "90x60", fields: ["service"] },
    sample: { code: "CH-104", serviceNom: "CHIRURGIE" },
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
  sac: {
    color: "#dc2626",
    code: (it) => it.numeroSac || it.code || `SAC-${it.id}`,
    fields: {
      service: { fr: "Service", get: serviceName },
      chambre: { fr: "Chambre", get: (it) => it.chambre || it.chambreCode || "" },
      quantite: { fr: "Nombre d'articles", get: (it) => (it.quantiteDeclaree != null ? String(it.quantiteDeclaree) : "") },
    },
    defaults: { size: "90x60", fields: ["service", "chambre"] },
    sample: { numeroSac: "SAC-INF-0193", serviceNom: "RÉANIMATION", chambre: "CH-210", quantiteDeclaree: 8 },
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
    code: (it) => it.codeBarre || it.code || it.numeroSac || it.codeLot || it.reference || `ID-${it.id}`,
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
  return { size: def.size, elements: { ...BASE_ELEMENTS }, fields: [...def.fields] };
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

/**
 * HTML de l'étiquette (styles en ligne, unités en mm), utilisé à la fois
 * pour l'impression et pour l'aperçu dans les paramètres.
 * ctx : { t, services?, porteurName?, chambre? }
 */
export function buildLabelHtml(type, item, ctx, settings = getLabelSettings(type)) {
  const def = LABEL_TYPES[type] || LABEL_TYPES.default;
  const { w, h } = LABEL_SIZES[settings.size] || LABEL_SIZES["90x60"];
  const el = settings.elements;
  const small = h <= 32;
  const medium = !small && h <= 42;
  const color = def.color;
  const code = def.code(item);
  const est = getEstablishment();
  const title = ctx.t(`barcode_label.types.${type}`, ctx.t("barcode_label.types.default"));
  const date = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });

  const fields = settings.fields
    .map((k) => def.fields[k] && { label: ctx.t(`label_settings.fields.${type}.${k}`, def.fields[k].fr), value: def.fields[k].get(item, ctx) })
    .filter((f) => f && f.value);

  const pad = small ? 1.6 : 3;
  const band = el.colorBand ? (small ? 1.5 : 2.5) : 0;
  const fs = { title: small ? 6.5 : medium ? 8 : 10, info: small ? 5.5 : medium ? 6.5 : 7.5, code: small ? 7.5 : medium ? 9.5 : 12, foot: small ? 4.5 : 5.5 };

  const header = el.header || el.date || el.logo
    ? `<div style="display:flex;align-items:center;justify-content:space-between;gap:1.5mm;padding-bottom:${small ? 0.8 : 1.5}mm;margin-bottom:${small ? 0.8 : 1.5}mm;border-bottom:0.8pt solid ${color};">
        <div style="display:flex;align-items:center;gap:1.5mm;min-width:0;">
          ${el.logo && est.logo ? `<img src="${escapeHtml(est.logo)}" style="height:${small ? 3.5 : 6}mm;max-width:${small ? 10 : 18}mm;object-fit:contain;" alt="" />` : ""}
          ${el.header ? `<span style="font-size:${fs.title}pt;font-weight:800;color:${color};text-transform:uppercase;letter-spacing:.4pt;white-space:nowrap;">${escapeHtml(title)}</span>` : ""}
        </div>
        ${el.date ? `<span style="font-size:${fs.info}pt;font-weight:600;color:#64748b;white-space:nowrap;">${date}</span>` : ""}
      </div>`
    : "";

  const info = fields.length
    ? `<div style="display:flex;flex-wrap:wrap;gap:${small ? 0.6 : 1}mm ${small ? 1.5 : 2.5}mm;margin-bottom:${small ? 0.6 : 1}mm;font-size:${fs.info}pt;line-height:1.25;color:#0f172a;">
        ${fields.map((f) => `<span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;"><span style="color:#64748b;">${escapeHtml(f.label)} :</span> <strong>${escapeHtml(f.value)}</strong></span>`).join("")}
      </div>`
    : "";

  const barcode = el.barcode
    ? `<div style="flex:1;min-height:0;display:flex;align-items:center;justify-content:center;">
        <img src="https://barcodeapi.org/api/${detectFormat(code)}/${encodeURIComponent(code)}" style="max-height:100%;max-width:100%;height:${small ? 11 : medium ? 15 : 20}mm;display:block;" alt="${escapeHtml(code)}" />
      </div>`
    : `<div style="flex:1;"></div>`;

  const codeText = el.codeText
    ? `<div style="margin-top:${small ? 0.5 : 1}mm;padding:${small ? 0.5 : 1}mm ${small ? 1 : 2}mm;border-radius:1.5mm;background:${color}12;text-align:center;font-family:'Courier New',monospace;font-size:${fs.code}pt;font-weight:800;letter-spacing:.6pt;color:#0f172a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(code)}</div>`
    : "";

  const footer = el.establishment
    ? `<div style="margin-top:${small ? 0.5 : 1}mm;text-align:center;font-size:${fs.foot}pt;font-weight:700;letter-spacing:.4pt;text-transform:uppercase;color:#94a3b8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(est.name)}</div>`
    : "";

  return `
    <div style="position:relative;width:${w}mm;height:${h}mm;box-sizing:border-box;overflow:hidden;background:#fff;font-family:'Segoe UI',Arial,sans-serif;">
      ${band ? `<div style="position:absolute;left:0;top:0;bottom:0;width:${band}mm;background:${color};"></div>` : ""}
      <div style="position:absolute;inset:0;left:${band}mm;padding:${pad}mm;display:flex;flex-direction:column;box-sizing:border-box;">
        ${header}${info}${barcode}${codeText}${footer}
      </div>
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
