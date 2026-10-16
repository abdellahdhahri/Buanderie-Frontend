/* ═══════════════════════════════════════════════════════════════════════════
   KIT « HISTORIQUE » — éléments partagés par les pages de suivi
   (Historique des collectes, Réclamations…) : palette, icônes duotone,
   indicateurs, avatar, pastille d'état, panneau latéral, pagination.
   ═══════════════════════════════════════════════════════════════════════════ */
import React, { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Palette du template
export const C = {
  teal: "#0d9488", green: "#0ca678", orange: "#e67700", red: "#e03131",
  blue: "#006f94", sky: "#0ea5e9", violet: "#6741d9", amber: "#d97706",
  pink: "#db2777", cyan: "#0891b2", slate: "#64748b",
};

/* ── Icônes duotone : grille 24, trait 1.7 (comme le menu) ─────────────── */
export const tint = { fill: "currentColor", fillOpacity: 0.16 };
export const dot = { fill: "currentColor", stroke: "none" };

export function Glyph({ children, size = 20, className = "", style }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={1.7}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className} style={style}>
      {children}
    </svg>
  );
}

/* ── Indicateur (style kpi-card du template) ───────────────────────────── */
export function KpiTile({ icon: Icon, label, value, hint, color, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: "easeOut" }}
      className="group relative overflow-hidden flex items-center justify-between gap-4 bg-white border border-slate-200/70 rounded-[20px] px-6 py-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300"
    >
      <div className="absolute -right-10 -bottom-10 w-32 h-32 rounded-full opacity-[0.07] group-hover:opacity-[0.12] transition-opacity duration-500" style={{ background: color }} />
      <div className="relative min-w-0">
        <p className="text-xs font-bold tracking-wider text-slate-400 uppercase truncate">{label}</p>
        <p className="text-3xl font-extrabold text-slate-800 tracking-tight tabular-nums mt-1">{value}</p>
        {hint && <p className="text-[11px] text-slate-500 font-medium mt-1 truncate">{hint}</p>}
      </div>
      <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300"
        style={{ color, background: `${color}14`, border: `1px solid ${color}26` }}>
        <Icon size={28} />
      </div>
    </motion.div>
  );
}

/* ── Tuile d'icône colorée ─────────────────────────────────────────────── */
export function IconTile({ icon: Icon, color, size = 40 }) {
  return (
    <div className="flex items-center justify-center shrink-0 rounded-xl"
      style={{ width: size, height: size, color, background: `${color}14`, border: `1px solid ${color}26` }}>
      <Icon size={Math.round(size * 0.5)} />
    </div>
  );
}

/* ── Pastille d'état ───────────────────────────────────────────────────── */
export function StatusPill({ color, label, pulse = false }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap"
      style={{ color, background: `${color}14`, border: `1px solid ${color}26` }}>
      <span className={`w-1.5 h-1.5 rounded-full ${pulse ? "animate-pulse" : ""}`} style={{ background: color }} />
      {label}
    </span>
  );
}

/* ── Avatar à initiales ────────────────────────────────────────────────── */
const AVATAR_COLORS = [C.teal, C.sky, C.violet, C.orange, C.blue, C.green];
export const initials = (name = "") =>
  String(name).trim().split(/\s+/).slice(0, 2).map((s) => s.charAt(0).toUpperCase()).join("") || "?";
const avatarColor = (key = "") =>
  AVATAR_COLORS[[...String(key)].reduce((a, ch) => a + ch.charCodeAt(0), 0) % AVATAR_COLORS.length];

export function Avatar({ name, id, size = 30 }) {
  const color = avatarColor(id ?? name);
  return (
    <span className="inline-flex items-center justify-center rounded-full font-bold shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.38, color, background: `${color}1a`, border: `1px solid ${color}33` }}>
      {initials(name)}
    </span>
  );
}

/* ── Temps relatif (« il y a 2 h ») dans la langue de l'interface ──────── */
export function useRelativeTime() {
  const { i18n } = useTranslation();
  return useCallback((date) => {
    if (!date) return "";
    const diff = (new Date(date) - Date.now()) / 1000;
    if (Number.isNaN(diff)) return "";
    const rtf = new Intl.RelativeTimeFormat(i18n.language || "fr", { numeric: "auto" });
    const abs = Math.abs(diff);
    if (abs < 60) return rtf.format(Math.round(diff), "second");
    if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute");
    if (abs < 86400) return rtf.format(Math.round(diff / 3600), "hour");
    if (abs < 86400 * 30) return rtf.format(Math.round(diff / 86400), "day");
    if (abs < 86400 * 365) return rtf.format(Math.round(diff / (86400 * 30)), "month");
    return rtf.format(Math.round(diff / (86400 * 365)), "year");
  }, [i18n.language]);
}

/* ── Panneau latéral : portail sur <body>, au-dessus de la barre du haut ─ */
export function DrawerShell({ onClose, ariaLabel, children, width = 560 }) {
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);

  // Page derrière figée + Échap pour fermer
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && closeRef.current();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return createPortal(
    <>
      <motion.div className="fixed inset-0 z-[1000] bg-slate-900/40 backdrop-blur-[2px]"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.aside
        role="dialog" aria-modal="true" aria-label={ariaLabel}
        className="fixed inset-y-0 right-0 z-[1001] h-[100dvh] w-full sm:max-w-[92vw] bg-slate-50 shadow-[0_0_60px_rgba(15,23,42,0.25)] flex flex-col overflow-hidden"
        style={{ width: `min(100vw, ${width}px)` }}
        initial={{ x: "100%" }} animate={{ x: 0, transition: { type: "spring", stiffness: 320, damping: 34 } }}
        exit={{ x: "100%", transition: { duration: 0.22 } }}
      >
        {children}
      </motion.aside>
    </>,
    document.body
  );
}

// Bloc de contenu du panneau
export function DrawerSection({ title, aside, children }) {
  return (
    <section className="bg-white rounded-[18px] border border-slate-200 p-5">
      {(title || aside) && (
        <div className="flex items-center justify-between gap-3 mb-4">
          {title && <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">{title}</h3>}
          {aside}
        </div>
      )}
      {children}
    </section>
  );
}

/* ── Pagination ────────────────────────────────────────────────────────── */
export function HistoryPagination({ page, pageSize, total, onChange, unitLabel }) {
  const { t } = useTranslation();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (!total) return null;
  const start = (page - 1) * pageSize;
  const btn = "h-9 px-3 inline-flex items-center gap-1 rounded-[12px] border border-slate-200 bg-white text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed";
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-1">
      <p className="text-sm text-slate-500">
        <span className="font-bold text-slate-800">{start + 1}</span>–<span className="font-bold text-slate-800">{Math.min(start + pageSize, total)}</span>
        {" / "}<span className="font-bold text-slate-800">{total}</span> {unitLabel}
      </p>
      {totalPages > 1 && (
        <div className="flex items-center gap-1.5">
          <button type="button" disabled={page === 1} onClick={() => onChange(page - 1)} className={btn}>
            <ChevronLeft className="w-4 h-4" /> <span className="hidden sm:inline">{t("common.previous")}</span>
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
            .map((p, i, arr) => (
              <React.Fragment key={p}>
                {i > 0 && p - arr[i - 1] > 1 && <span className="px-1 text-slate-400">…</span>}
                <button type="button" onClick={() => onChange(p)}
                  className={`h-9 min-w-9 px-3 rounded-[12px] text-sm font-bold transition-all ${p === page ? "text-white shadow-sm" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
                  style={p === page ? { background: `linear-gradient(135deg, ${C.green}, ${C.teal})` } : undefined}>
                  {p}
                </button>
              </React.Fragment>
            ))}
          <button type="button" disabled={page === totalPages} onClick={() => onChange(page + 1)} className={btn}>
            <span className="hidden sm:inline">{t("common.next")}</span> <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Filtre par pastilles (origine, statut…) ───────────────────────────── */
export function PillFilter({ options, value, onChange, ariaLabel }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5" role="radiogroup" aria-label={ariaLabel}>
      {options.map((o) => {
        const active = value === o.id;
        return (
          <button key={o.id || "all"} type="button" role="radio" aria-checked={active} onClick={() => onChange(o.id)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[12px] text-sm font-bold border transition-all"
            style={active
              ? { color: "#fff", background: o.color, borderColor: o.color, boxShadow: `0 4px 12px ${o.color}40` }
              : { color: o.color, background: "transparent", borderColor: `${o.color}40` }}>
            {o.Icon && <o.Icon size={16} />}
            {o.label}
            {o.count != null && (
              <span className="ml-0.5 px-1.5 rounded-md text-[11px] tabular-nums" style={{ background: active ? "rgba(255,255,255,0.22)" : `${o.color}14` }}>{o.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ── Raccourcis de période ─────────────────────────────────────────────── */
export const isoDay = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

export function quickRange(days) {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - (days - 1));
  return { dateFrom: isoDay(from), dateTo: isoDay(to) };
}

export function activeQuickRange(dateFrom, dateTo) {
  if (!dateFrom || dateTo !== isoDay(new Date())) return null;
  const days = Math.round((new Date(dateTo) - new Date(dateFrom)) / 86400000) + 1;
  return [1, 7, 30].includes(days) ? days : null;
}

export function QuickRanges({ dateFrom, dateTo, onPick }) {
  const { t } = useTranslation();
  const active = activeQuickRange(dateFrom, dateTo);
  return (
    <>
      {[{ d: 1, label: t("historique_collecte.today", "Aujourd'hui") }, { d: 7, label: t("historique_collecte.last_7", "7 jours") }, { d: 30, label: t("historique_collecte.last_30", "30 jours") }].map(({ d, label }) => (
        <button key={d} type="button" onClick={() => onPick(quickRange(d))}
          className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${active === d ? "bg-[#0d9488] border-[#0d9488] text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
          {label}
        </button>
      ))}
    </>
  );
}

/* ── Illustration d'état vide ──────────────────────────────────────────── */
export function EmptyIllustration() {
  return (
    <svg viewBox="0 0 200 130" className="w-44 h-auto mx-auto" aria-hidden="true">
      <ellipse cx="100" cy="120" rx="66" ry="6" fill={C.teal} opacity="0.08" />
      <rect x="44" y="20" width="112" height="88" rx="14" fill={C.teal} fillOpacity="0.05" stroke={C.teal} strokeOpacity="0.3" strokeWidth="1.6" />
      {[38, 58, 78].map((y, i) => (
        <g key={y} opacity={1 - i * 0.25}>
          <circle cx="64" cy={y} r="5" fill={C.teal} fillOpacity="0.25" />
          <rect x="76" y={y - 4} width={60 - i * 12} height="8" rx="4" fill={C.teal} fillOpacity="0.18" />
        </g>
      ))}
      <g transform="translate(124 70)">
        <circle cx="16" cy="16" r="14" fill="currentColor" className="text-white" stroke={C.sky} strokeWidth="3" />
        <path d="M26 26l10 10" stroke={C.sky} strokeWidth="5" strokeLinecap="round" />
      </g>
    </svg>
  );
}

/* ── Chargement (lignes squelettes) ────────────────────────────────────── */
export function LoadingRows({ rows = 6 }) {
  return (
    <div className="p-4 space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-2 py-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 animate-pulse" />
          <div className="flex-1 space-y-2"><div className="h-3 w-40 rounded bg-slate-100 animate-pulse" /><div className="h-2.5 w-24 rounded bg-slate-100 animate-pulse" /></div>
          <div className="h-2 w-36 rounded-full bg-slate-100 animate-pulse" />
          <div className="h-6 w-20 rounded-full bg-slate-100 animate-pulse" />
        </div>
      ))}
    </div>
  );
}
