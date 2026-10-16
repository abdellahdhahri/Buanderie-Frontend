import { useEffect, useState } from "react";
import { CATEGORIES_LINGE } from "../constants/categoriesLinge";

/* ═══════════════════════════════════════════════════════════════════════════
   RÉGLAGES DE L'APPLICATION (Paramètres) — mémorisés sur ce poste.
   getSetting("scan.delayMs") lit une valeur, setSetting(...) l'enregistre et
   prévient les écrans ouverts ; useSetting(...) suit la valeur dans un composant.
   ═══════════════════════════════════════════════════════════════════════════ */

const STORAGE_KEY = "appSettings.v1";
const EVENT = "appsettingschange";

export const DEFAULT_SETTINGS = {
  voice: {
    enabled: false,       // assistant vocal actif à l'ouverture des écrans (muet par défaut)
    lang: "fr",           // langue par défaut : "fr" | "ar"
    rate: 1,              // vitesse de la voix (0.7 → 1.3)
    repeatSeconds: 20,    // répétition de la dernière consigne (0 = jamais)
    voiceFr: "",          // nom de la voix française ("" = la meilleure disponible)
    voiceAr: "",          // nom de la voix arabe ("" = la meilleure disponible)
  },
  thresholds: {
    lotFullPct: 80,       // lot considéré « plein » (paniers tri / lavage / séchage)
  },
  scan: {
    delayMs: 400,         // attente après la dernière frappe du lecteur avant validation
    minLength: 3,         // longueur minimale d'un code pour la validation automatique
    beep: false,          // bip à chaque scan validé
  },
  display: {
    pageSize: 10,         // lignes par page dans les listes
    dateStyle: "short",   // "short" 09/10/2026 14:30 · "medium" 9 oct. 2026, 14:30 · "long" 9 octobre 2026 à 14:30
  },
  dashboard: {
    hiddenKpis: [],       // identifiants des cartes KPI masquées
  },
  refresh: {
    statsSeconds: 30,     // tableau de bord Statistiques
    trackingSeconds: 10,  // suivi d'un linge (mode LIVE)
    distributionSeconds: 3, // comparatif de la distribution service
    machinesSeconds: 15,  // suivi des machines de lavage
  },
  categories: {
    active: [...CATEGORIES_LINGE], // catégories proposées dans les sélecteurs
  },
};

const isObject = (v) => v && typeof v === "object" && !Array.isArray(v);

function deepMerge(base, over) {
  if (!isObject(over)) return base;
  const out = { ...base };
  for (const k of Object.keys(over)) {
    out[k] = isObject(base[k]) && isObject(over[k]) ? deepMerge(base[k], over[k]) : over[k];
  }
  return out;
}

function readSaved() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") || {}; } catch { return {}; }
}

let cache = null;
export function getSettings() {
  if (!cache) cache = deepMerge(DEFAULT_SETTINGS, readSaved());
  return cache;
}

const getPath = (obj, path) => path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);

export function getSetting(path) {
  const v = getPath(getSettings(), path);
  return v === undefined ? getPath(DEFAULT_SETTINGS, path) : v;
}

export function setSetting(path, value) {
  const saved = readSaved();
  const keys = path.split(".");
  let node = saved;
  keys.slice(0, -1).forEach((k) => { if (!isObject(node[k])) node[k] = {}; node = node[k]; });
  node[keys[keys.length - 1]] = value;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(saved)); } catch { /* stockage indisponible */ }
  cache = null;
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { path } }));
}

/** Remet une section (ex. "scan") ou tout (sans argument) aux valeurs d'origine. */
export function resetSettings(section) {
  const saved = readSaved();
  if (section) delete saved[section];
  try {
    if (section) localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    else localStorage.removeItem(STORAGE_KEY);
  } catch { /* stockage indisponible */ }
  cache = null;
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { path: section || "*" } }));
}

export function onSettingsChange(callback) {
  const handler = (e) => callback(e.detail);
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}

/** Valeur d'un réglage, mise à jour quand il change. */
export function useSetting(path) {
  const [value, setValue] = useState(() => getSetting(path));
  useEffect(() => onSettingsChange(() => setValue(getSetting(path))), [path]);
  return value;
}

/* ─── Aides partagées ─────────────────────────────────────────────────────── */

/** Bip court de confirmation de scan (si activé). */
export function bipScan() {
  if (!getSetting("scan.beep")) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = 1320;
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch { /* audio indisponible */ }
}

/** Date + heure au format choisi dans Paramètres › Affichage. */
export function formatDateTime(value, { withTime = true } = {}) {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  const style = getSetting("display.dateStyle");
  const opts = { dateStyle: style };
  if (withTime) opts.timeStyle = "short";
  try { return d.toLocaleString("fr-FR", opts); } catch { return d.toLocaleString("fr-FR"); }
}

/** Catégories actives (ordre de référence conservé). */
export function getActiveCategories() {
  const active = getSetting("categories.active");
  const list = CATEGORIES_LINGE.filter((c) => !Array.isArray(active) || active.includes(c));
  return list.length ? list : [...CATEGORIES_LINGE];
}
