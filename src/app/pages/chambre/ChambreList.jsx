import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Plus, Search, Edit, Trash2, ChevronRight, ChevronLeft,
  RefreshCw, LayoutGrid, List, X,
} from "lucide-react";
import { Input } from "../../components/ui/input";
import { Card, CardContent } from "../../components/ui/card";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import BarcodeLabel from "../../components/BarcodeLabel";
import { PageHeaderIcon } from "../../components/layout/PageHeaderIcon";
import { SortableHeader } from "../../components/ui/SortableHeader";
import { useSortableData } from "../../hooks/useSortableData";
import { FormModal, FormSection } from "../../components/ui/modal-kit";
import { lireErreur } from "../../services/integrationService";
import { useIntegration } from "../../hooks/useIntegration";
import { useCircuitInfecte } from "../../hooks/useEstablishment";
import { BadgeImporte, BadgeInactif } from "../Arsenal/ArsenalEmplacements";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";
const JSON_HEADERS = { "Content-Type": "application/json" };
const TYPES_LIT = ["SIMPLE", "DOUBLE", "KING"];
const CHAMBRE_VIDE = { code: "", codeBarre: "", serviceId: "", actif: true, creerLitParDefaut: false };
const LIT_VIDE = { chambreId: "", code: "", reference: "", description: "", type: "SIMPLE", actif: true };

// Palette du template (layout.css / kpi-card)
const C = {
  teal: "#0d9488",
  green: "#0ca678",
  orange: "#e67700",
  red: "#e03131",
  blue: "#006f94",
  sky: "#0ea5e9",
  violet: "#6741d9",
};

/* ═══════════════════════════════════════════════════════════════
   ICÔNES — même convention que sidebarIcons : grille 24,
   trait 1.7 arrondi, remplissage translucide (duotone)
   ═══════════════════════════════════════════════════════════════ */
const tint = { fill: "currentColor", fillOpacity: 0.16 };
const dot = { fill: "currentColor", stroke: "none" };

function Glyph({ children, size = 22, className = "", style }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      style={style}
    >
      {children}
    </svg>
  );
}

// Porte de chambre avec plaque numérotée
const IconDoor = (p) => (
  <Glyph {...p}>
    <path d="M5 21V4.5A1.5 1.5 0 0 1 6.5 3h11A1.5 1.5 0 0 1 19 4.5V21" {...tint} />
    <path d="M3 21h18" />
    <rect x="9" y="6" width="6" height="3" rx="1" />
    <circle cx="15.5" cy="13.5" r="1" {...dot} />
  </Glyph>
);

// Bâtiment hospitalier (services)
const IconHospital = (p) => (
  <Glyph {...p}>
    <path d="M4 21V8.5A1.5 1.5 0 0 1 5.5 7H9V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7h3.5A1.5 1.5 0 0 1 20 8.5V21" {...tint} />
    <path d="M2.5 21h19" />
    <path d="M12 9.5v4M10 11.5h4" />
    <path d="M10 21v-3.5h4V21" />
  </Glyph>
);

// Étiquette code-barres
const IconBarcodeTag = (p) => (
  <Glyph {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2.5" {...tint} />
    <path d="M7 9v6M10 9v6M12.5 9v6M15 9v6M17 9v6" />
  </Glyph>
);

// Chambre sans service : porte en pointillés + point d'interrogation
const IconUnassigned = (p) => (
  <Glyph {...p}>
    <path d="M5 21V4.5A1.5 1.5 0 0 1 6.5 3h11A1.5 1.5 0 0 1 19 4.5V21" strokeDasharray="2.5 2.5" />
    <path d="M3 21h18" />
    <path d="M10 9.5a2 2 0 1 1 2.8 1.8c-.5.3-.8.7-.8 1.2v.5" />
    <circle cx="12" cy="15.8" r=".9" {...dot} />
  </Glyph>
);

// Bouclier biologique (lit infecté)
const IconBiohazard = (p) => (
  <Glyph {...p}>
    <path d="M12 3l7 3v5.5c0 4.3-3 7.9-7 9.5-4-1.6-7-5.2-7-9.5V6z" {...tint} />
    <circle cx="12" cy="11.5" r="1.6" />
    <path d="M12 7.5v2.4M8.6 13.5l2-1.1M15.4 13.5l-2-1.1" />
  </Glyph>
);

/* ═══════════════════════════════════════════════════════════════
   ILLUSTRATIONS
   ═══════════════════════════════════════════════════════════════ */

// Lit vu de côté : libre (draps tirés) / occupé (patient sous la couverture)
function BedIllustration({ occupied, color }) {
  return (
    <svg viewBox="0 0 96 56" className="w-full h-full" aria-hidden="true">
      <defs>
        <linearGradient id={`blanket-${occupied ? "o" : "f"}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.35" />
          <stop offset="1" stopColor={color} stopOpacity="0.15" />
        </linearGradient>
      </defs>
      {/* ombre */}
      <ellipse cx="48" cy="51" rx="40" ry="2.5" fill={color} opacity="0.12" />
      {/* tête et pied de lit */}
      <path d="M10 49V18a3 3 0 0 1 3-3h0a3 3 0 0 1 3 3v31" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M86 49V30a3 3 0 0 0-3-3h0a3 3 0 0 0-3 3v19" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
      {/* sommier */}
      <rect x="13" y="38" width="70" height="6" rx="3" fill={color} opacity="0.85" />
      {/* matelas */}
      <rect x="16" y="31" width="64" height="8" rx="4" fill="currentColor" className="text-white" stroke={color} strokeOpacity="0.35" strokeWidth="1.2" />
      {/* oreiller */}
      <rect x="19" y="25" width="17" height="7.5" rx="3.75" fill="currentColor" className="text-white" stroke={color} strokeOpacity="0.55" strokeWidth="1.4" />
      {occupied ? (
        <>
          {/* tête du patient */}
          <circle cx="29" cy="23" r="5.2" fill={color} opacity="0.9" />
          {/* couverture bombée */}
          <path d="M33 33c4-8 14-9 22-7.5 8 1.5 16 2 23 6.5v2.5H33z" fill={`url(#blanket-o)`} stroke={color} strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M45 27.5c2 2 2.5 4 2.5 6" fill="none" stroke={color} strokeOpacity="0.5" strokeWidth="1.2" strokeLinecap="round" />
        </>
      ) : (
        <>
          {/* drap plié */}
          <path d="M40 31.5h38a2 2 0 0 1 2 2v1H40z" fill={`url(#blanket-f)`} stroke={color} strokeWidth="1.2" strokeLinejoin="round" />
          {/* éclat "prêt" */}
          <path d="M66 13v6M63 16h6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M75 8v3.5M73.25 9.75h3.5" stroke={color} strokeWidth="1.4" strokeLinecap="round" opacity="0.6" />
        </>
      )}
    </svg>
  );
}

// Mini plan de chambre (vue grille)
function RoomPlan({ color, beds = 2 }) {
  const slots = Array.from({ length: Math.min(Math.max(beds, 1), 3) });
  return (
    <svg viewBox="0 0 120 64" className="w-full h-full" aria-hidden="true">
      <rect x="2" y="2" width="116" height="60" rx="10" fill={color} fillOpacity="0.06" stroke={color} strokeOpacity="0.35" strokeWidth="1.5" />
      {/* fenêtre */}
      <path d="M40 2h40" stroke={color} strokeWidth="4" strokeLinecap="round" opacity="0.45" />
      {/* porte + arc d'ouverture */}
      <path d="M2 40v14" stroke="currentColor" className="text-white" strokeWidth="4" />
      <path d="M2 40a14 14 0 0 1 14 14" fill="none" stroke={color} strokeOpacity="0.5" strokeWidth="1.2" strokeDasharray="2.5 2.5" />
      <path d="M2 40h14" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      {/* lits */}
      {slots.map((_, i) => {
        const x = 30 + i * 30;
        return (
          <g key={i}>
            <rect x={x} y="12" width="20" height="32" rx="4" fill="currentColor" className="text-white" stroke={color} strokeWidth="1.5" />
            <rect x={x + 4} y="15" width="12" height="6" rx="3" fill={color} fillOpacity="0.25" />
            <path d={`M${x} 27h20`} stroke={color} strokeOpacity="0.4" strokeWidth="1.2" />
          </g>
        );
      })}
      {/* table de chevet */}
      <rect x="100" y="12" width="10" height="10" rx="2.5" fill={color} fillOpacity="0.2" />
    </svg>
  );
}

// Illustration d'état vide : plan d'étage + loupe
function EmptyIllustration({ searching }) {
  return (
    <svg viewBox="0 0 200 140" className="w-48 h-auto mx-auto" aria-hidden="true">
      <ellipse cx="100" cy="128" rx="70" ry="6" fill={C.teal} opacity="0.08" />
      <rect x="30" y="22" width="140" height="92" rx="14" fill={C.teal} fillOpacity="0.05" stroke={C.teal} strokeOpacity="0.3" strokeWidth="1.6" />
      <path d="M30 68h140M100 22v92" stroke={C.teal} strokeOpacity="0.25" strokeWidth="1.4" strokeDasharray="4 4" />
      {[[44, 34], [114, 34], [44, 80], [114, 80]].map(([x, y], i) => (
        <g key={i} opacity={i === 3 ? 0.35 : 0.8}>
          <rect x={x} y={y} width="42" height="22" rx="5" fill="currentColor" className="text-white" stroke={C.teal} strokeOpacity="0.5" strokeWidth="1.4" />
          <rect x={x + 4} y={y + 5} width="9" height="12" rx="3" fill={C.teal} fillOpacity="0.22" />
        </g>
      ))}
      {searching ? (
        <g transform="translate(128 74)">
          <circle cx="18" cy="18" r="16" fill="currentColor" className="text-white" stroke={C.sky} strokeWidth="3" />
          <path d="M30 30l12 12" stroke={C.sky} strokeWidth="5" strokeLinecap="round" />
          <path d="M12 18h12" stroke={C.sky} strokeWidth="2.4" strokeLinecap="round" />
        </g>
      ) : (
        <g transform="translate(138 80)">
          <circle cx="14" cy="14" r="14" fill={C.teal} />
          <path d="M14 8v12M8 14h12" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
}

// Anneau d'occupation (occupés / libres / autres)
function OccupancyRing({ occupied, free, total, size = 108 }) {
  const r = 42;
  const circ = 2 * Math.PI * r;
  const occLen = total ? (occupied / total) * circ : 0;
  const freeLen = total ? (free / total) * circ : 0;
  const pct = total ? Math.round((occupied / total) * 100) : 0;
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true" className="-rotate-90">
      <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" className="text-slate-100" strokeWidth="9" />
      <motion.circle
        cx="50" cy="50" r={r} fill="none" stroke={C.green} strokeWidth="9" strokeLinecap="round"
        strokeDasharray={`${freeLen} ${circ}`}
        initial={{ strokeDashoffset: freeLen }}
        animate={{ strokeDashoffset: -occLen }}
        transition={{ duration: 0.9, ease: "easeOut" }}
      />
      <motion.circle
        cx="50" cy="50" r={r} fill="none" stroke={C.orange} strokeWidth="9" strokeLinecap="round"
        initial={{ strokeDasharray: `0 ${circ}` }}
        animate={{ strokeDasharray: `${occLen} ${circ}` }}
        transition={{ duration: 0.9, ease: "easeOut" }}
      />
      <text
        x="50" y="50" textAnchor="middle" dominantBaseline="central"
        transform="rotate(90 50 50)"
        className="fill-current text-slate-800"
        style={{ fontSize: 20, fontWeight: 800 }}
      >
        {pct}%
      </text>
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════
   KPI — style kpi-card du template, icône duotone à droite
   ═══════════════════════════════════════════════════════════════ */
function KpiTile({ icon: Icon, label, value, hint, color, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: "easeOut" }}
      className="group relative overflow-hidden flex items-center justify-between gap-4 bg-white border border-slate-200/70 rounded-[20px] px-6 py-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300"
    >
      <div
        className="absolute -right-10 -bottom-10 w-32 h-32 rounded-full opacity-[0.07] group-hover:opacity-[0.12] transition-opacity duration-500"
        style={{ background: color }}
      />
      <div className="relative min-w-0">
        <p className="text-xs font-bold tracking-wider text-slate-400 uppercase truncate">{label}</p>
        <p className="text-3xl font-extrabold text-slate-800 tracking-tight tabular-nums mt-1">{value}</p>
        {hint && <p className="text-[11px] text-slate-500 font-medium mt-1 truncate">{hint}</p>}
      </div>
      <div
        className="relative w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300"
        style={{ color, background: `${color}14`, border: `1px solid ${color}26` }}
      >
        <Icon size={28} />
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CARTE LIT — 0 = libre, 2 = occupé
   ═══════════════════════════════════════════════════════════════ */
function BedCard({ lit, isSelected, onClick, t, index, chambreCode, circuitInfecte, infectionVerrouillee, onToggleInfection, onEdit, onDisable }) {
  const lectureSeule = lit.source === "EXTERNE";
  const isFree = lit.etat === 0;
  const isOccupied = lit.etat === 2;
  const color = isFree ? C.green : isOccupied ? C.orange : "#94a3b8";
  const label = isFree ? t("chambre.free") : isOccupied ? t("chambre.occupied") : t("chambre.unknown");

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick()}
      className={`group relative rounded-2xl border bg-white cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(15,23,42,0.08)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0d9488]/40 ${
        isSelected ? "border-[#0d9488] ring-2 ring-[#0d9488]/20" : "border-slate-200"
      } ${lit.actif === false ? "opacity-60" : ""}`}
    >
      {/* Illustration */}
      <div
        className="relative h-[92px] rounded-t-2xl px-4 pt-3 overflow-hidden"
        style={{ background: `linear-gradient(180deg, ${color}12, transparent)` }}
      >
        <BedIllustration occupied={isOccupied} color={color} />
        {circuitInfecte && lit.infecte && (
          <span
            className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 pl-1 pr-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide"
            style={{ color: C.red, background: `${C.red}14`, border: `1px solid ${C.red}33` }}
            title={t("chambre.infected")}
          >
            <IconBiohazard size={14} />
            {t("chambre.infected")}
          </span>
        )}
        <AnimatePresence>
          {isSelected && (
            <motion.span
              initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
              className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full flex items-center justify-center text-white shadow"
              style={{ background: C.teal }}
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Infos */}
      <div className="px-4 pb-3.5 pt-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-bold text-sm text-slate-800 truncate">{lit.code || `LIT-${lit.id}`}</p>
            <p className="text-[11px] text-slate-500 truncate">
              {lit.description || t("chambre.standard_bed")}{lit.type ? ` · ${lit.type}` : ""}
            </p>
            <div className="-ml-1.5 mt-1 flex flex-wrap gap-y-1">
              <BadgeImporte item={lit} />
              <BadgeInactif item={lit} />
            </div>
          </div>
          {lit.etat != null && (
            <span
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide shrink-0"
              style={{ color, background: `${color}14` }}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isOccupied ? "animate-pulse" : ""}`} style={{ background: color }} />
              {label}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
          <span className="premium-table__code truncate max-w-[140px]">
            {lit.reference || `#${String(lit.id).padStart(4, "0")}`}
          </span>
          <BarcodeLabel item={lit} type="lit" ctx={{ chambre: chambreCode }} />
        </div>
        <div className="flex items-center justify-between gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
          {circuitInfecte ? (
          <label
            className={`inline-flex items-center gap-2 text-[11px] font-bold text-slate-600 ${infectionVerrouillee ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            title={infectionVerrouillee ? t("chambre.infection_locked", "L'état d'infection est synchronisé depuis le système externe") : undefined}
          >
            <input
              type="checkbox"
              role="switch"
              checked={!!lit.infecte}
              disabled={infectionVerrouillee}
              onChange={(e) => onToggleInfection(lit, e.target.checked)}
              className="w-4 h-4 accent-[#e03131]"
            />
            {t("chambre.infected")}
          </label>
          ) : <span />}
          {lectureSeule ? (
            <span className="text-[10px] text-slate-400">{t("integration.read_only", "Lecture seule")}</span>
          ) : (
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => onEdit(lit)} className="premium-table__icon-btn" title={t("chambre.edit_bed", "Modifier le lit")}>
                <Edit className="w-4 h-4" />
              </button>
              {lit.actif !== false && (
                <button type="button" onClick={() => onDisable(lit)} className="premium-table__icon-btn is-danger" title={t("chambre.disable_bed", "Désactiver le lit")}>
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Bouton de la barre d'outils (style du template)
function ToolbarButton({ color, icon: Icon, children, className = "", ...props }) {
  return (
    <button
      type="button"
      {...props}
      className={`flex items-center gap-2 px-5 py-2.5 bg-white border rounded-[14px] text-sm font-bold transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100 ${className}`}
      style={{ color, borderColor: `${color}4d` }}
      onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.background = `${color}0d`; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = ""; }}
    >
      <Icon className="w-4 h-4 stroke-[2.5]" />
      {children}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
   ═══════════════════════════════════════════════════════════════ */
export default function ChambreList() {
  const { t } = useTranslation();

  const [chambres, setChambres] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedChambre, setSelectedChambre] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [rafraichir, setRafraichir] = useState(0);
  const [expandedId, setExpandedId] = useState(null);
  const [chambreLits, setChambreLits] = useState([]);
  const [isLitsLoading, setIsLitsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [services, setServices] = useState([]);
  const [viewMode, setViewMode] = useState("table");
  const [newRec, setNewRec] = useState(CHAMBRE_VIDE);
  const [tous, setTous] = useState(false);
  const [litEdition, setLitEdition] = useState(null);
  const [litForm, setLitForm] = useState(LIT_VIDE);
  const [savingLit, setSavingLit] = useState(false);
  const { estImporte } = useIntegration();
  const chambresImportees = estImporte("CHAMBRE");
  const litsImportes = estImporte("LIT");
  const circuitInfecte = useCircuitInfecte();
  const infectionImportee = circuitInfecte && estImporte("LIT_INFECTE");
  const selectionImportee = selectedChambre?.source === "EXTERNE";
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchServices = async () => {
    try {
      const response = await fetch(`${API_URL}/api/services`);
      if (response.ok) {
        const data = await response.json();
        const list = data.content || data._embedded?.services || data;
        setServices(Array.isArray(list) ? list : []);
      }
    } catch (err) {
      console.error(err);
      setServices([]);
    }
  };

  const fetchChambres = useCallback(() => {
    setIsLoading(true);
    setRafraichir((n) => n + 1);
  }, []);

  useEffect(() => {
    let actif = true;
    fetch(`${API_URL}/api/chambres${tous ? "?tous=true" : ""}`)
      .then((response) => (response.ok ? response.json() : []))
      .then((data) => {
        if (!actif) return;
        setChambres(Array.isArray(data)
          ? data.map((c) => ({
              id: c.id,
              cle: c.cle,
              code: c.code,
              serviceId: c.serviceId,
              codeBarre: c.codeBarre,
              actif: c.actif !== false,
              source: c.source,
            }))
          : []);
      })
      .catch((err) => {
        console.error(err);
        if (actif) setChambres([]);
      })
      .finally(() => actif && setIsLoading(false));
    return () => { actif = false; };
  }, [tous, rafraichir]);

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, serviceFilter]);

  const fetchChambreLits = useCallback(async (chambreId) => {
    setIsLitsLoading(true);
    setChambreLits([]);
    try {
      const response = await fetch(`${API_URL}/api/lits/chambre/${chambreId}${tous ? "?tous=true" : ""}`);
      if (response.ok) {
        const data = await response.json();
        setChambreLits(Array.isArray(data) ? data : []);
      } else {
        setChambreLits([]);
      }
    } catch (err) {
      setChambreLits([]);
    } finally {
      setIsLitsLoading(false);
    }
  }, [tous]);

  const closePanel = useCallback(() => {
    setExpandedId(null);
    setSelectedId(null);
    setChambreLits([]);
  }, []);

  const toggleExpand = useCallback(
    (chambre) => {
      if (expandedId === chambre.id) {
        closePanel();
      } else {
        setExpandedId(chambre.id);
        setSelectedChambre(chambre);
        setSelectedId(null);
        fetchChambreLits(chambre.id);
      }
    },
    [expandedId, fetchChambreLits, closePanel]
  );

  const getServiceName = useCallback(
    (serviceId) => {
      if (!serviceId || !Array.isArray(services)) return t("chambre.not_assigned");
      const s = services.find((x) => x.id === serviceId);
      return s ? s.code : t("chambre.not_assigned");
    },
    [services, t]
  );

  // Indicateurs globaux (sur toutes les chambres)
  const kpis = useMemo(() => {
    const total = chambres.length;
    const servicesCovered = new Set(chambres.filter((c) => c.serviceId).map((c) => c.serviceId)).size;
    const withBarcode = chambres.filter((c) => c.codeBarre).length;
    const unassigned = chambres.filter((c) => !c.serviceId).length;
    return { total, servicesCovered, withBarcode, unassigned };
  }, [chambres]);

  // Indicateurs de la chambre ouverte
  const bedStats = useMemo(() => {
    const total = chambreLits.length;
    const occupied = chambreLits.filter((l) => l.etat === 2).length;
    const free = chambreLits.filter((l) => l.etat === 0).length;
    const infected = chambreLits.filter((l) => l.infecte).length;
    return { total, occupied, free, infected };
  }, [chambreLits]);

  const handleOpenCreateModal = useCallback(() => {
    setSelectedChambre(null);
    setNewRec({ ...CHAMBRE_VIDE, serviceId: services.length > 0 ? services[0].id : "" });
    setIsModalOpen(true);
  }, [services]);

  const handleOpenEditModal = useCallback((chambre) => {
    setSelectedChambre(chambre);
    setNewRec({
      ...CHAMBRE_VIDE,
      code: chambre.code || "",
      codeBarre: chambre.codeBarre || "",
      serviceId: chambre.serviceId || "",
      actif: chambre.actif !== false,
    });
    setIsModalOpen(true);
  }, []);

  const handleSave = useCallback(
    async (e) => {
      e.preventDefault();
      if (!selectionImportee && !newRec.code?.trim()) {
        Swal.fire({
          title: t("chambre.alerts.code_required"),
          text: t("chambre.alerts.code_required_text"),
          icon: "warning",
        });
        return;
      }
      setIsSaving(true);
      try {
        // Le PUT remplace toujours serviceId ; une chambre importée ne modifie que son service
        const serviceId = newRec.serviceId ? parseInt(newRec.serviceId) : null;
        const champs = { code: newRec.code.trim(), codeBarre: newRec.codeBarre.trim() || null, serviceId, actif: newRec.actif };
        const payload = !selectedChambre
          ? { ...champs, creerLitParDefaut: newRec.creerLitParDefaut }
          : selectionImportee ? { serviceId } : champs;
        const response = await fetch(
          selectedChambre ? `${API_URL}/api/chambres/${selectedChambre.id}` : `${API_URL}/api/chambres`,
          { method: selectedChambre ? "PUT" : "POST", headers: JSON_HEADERS, body: JSON.stringify(payload) }
        );
        if (!response.ok) throw new Error(await lireErreur(response, t("chambre.alerts.error")));
        Swal.fire({
          title: t(selectedChambre ? "chambre.alerts.updated" : "chambre.alerts.created"),
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
        setIsModalOpen(false);
        fetchChambres();
      } catch (err) {
        Swal.fire({ title: t("chambre.alerts.error"), text: err.message, icon: "error" });
      } finally {
        setIsSaving(false);
      }
    },
    [selectedChambre, selectionImportee, newRec, fetchChambres, t]
  );

  const deleteRec = useCallback(
    async (id) => {
      const result = await Swal.fire({
        title: t("chambre.alerts.delete_confirm"),
        text: t("chambre.alerts.delete_confirm_text"),
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#dc2626",
        cancelButtonColor: "#64748b",
        confirmButtonText: t("chambre.alerts.delete_yes"),
        cancelButtonText: t("chambre.alerts.delete_no"),
      });
      if (result.isConfirmed) {
        try {
          // DELETE désactive la chambre : elle disparaît de la liste des actives
          const response = await fetch(`${API_URL}/api/chambres/${id}`, { method: "DELETE" });
          if (!response.ok) throw new Error(await lireErreur(response, t("chambre.alerts.error")));
          if (expandedId === id) closePanel();
          fetchChambres();
          Swal.fire({ title: t("chambre.alerts.deleted"), icon: "success", timer: 1500, showConfirmButton: false });
        } catch (err) {
          Swal.fire({ title: t("chambre.alerts.error"), text: err.message, icon: "error" });
        }
      }
    },
    [expandedId, closePanel, fetchChambres, t]
  );

  const ouvrirLit = (lit) => {
    setLitEdition(lit || "nouveau");
    setLitForm(lit
      ? {
          chambreId: lit.chambreId,
          code: lit.code || "",
          reference: lit.reference || "",
          description: lit.description || "",
          type: lit.type || "SIMPLE",
          actif: lit.actif !== false,
        }
      : { ...LIT_VIDE, chambreId: expandedId });
  };

  const enregistrerLit = async (e) => {
    e.preventDefault();
    setSavingLit(true);
    try {
      const nouveau = litEdition === "nouveau";
      const payload = {
        chambreId: Number(litForm.chambreId),
        code: litForm.code.trim(),
        reference: litForm.reference.trim(),
        description: litForm.description.trim(),
        type: litForm.type.trim(),
        actif: litForm.actif,
        ...(nouveau ? { infecte: false } : {}),
      };
      const response = await fetch(nouveau ? `${API_URL}/api/lits` : `${API_URL}/api/lits/${litEdition.id}`, {
        method: nouveau ? "POST" : "PUT",
        headers: JSON_HEADERS,
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(await lireErreur(response, t("chambre.alerts.error")));
      setLitEdition(null);
      fetchChambreLits(expandedId);
      Swal.fire({ title: t("chambre.bed_saved", "Lit enregistré"), icon: "success", timer: 1500, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ title: t("chambre.alerts.error"), text: err.message, icon: "error" });
    } finally {
      setSavingLit(false);
    }
  };

  const desactiverLit = async (lit) => {
    const result = await Swal.fire({
      title: t("chambre.bed_disable_confirm", "Désactiver ce lit ?"),
      text: lit.code,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      confirmButtonText: t("chambre.disable_bed", "Désactiver le lit"),
      cancelButtonText: t("chambre.alerts.delete_no"),
    });
    if (!result.isConfirmed) return;
    try {
      const response = await fetch(`${API_URL}/api/lits/${lit.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error(await lireErreur(response, t("chambre.alerts.error")));
      fetchChambreLits(expandedId);
    } catch (err) {
      Swal.fire({ title: t("chambre.alerts.error"), text: err.message, icon: "error" });
    }
  };

  const basculerInfection = async (lit, infecte) => {
    try {
      const response = await fetch(`${API_URL}/api/lits/${lit.id}/infection`, {
        method: "PATCH",
        headers: JSON_HEADERS,
        body: JSON.stringify({ infecte }),
      });
      if (!response.ok) throw new Error(await lireErreur(response, t("chambre.alerts.error")));
      const maj = await response.json().catch(() => null);
      setChambreLits((prev) => prev.map((l) => (l.id === lit.id ? { ...l, ...(maj || { infecte }) } : l)));
    } catch (err) {
      Swal.fire({ title: t("chambre.alerts.error"), text: err.message, icon: "error" });
    }
  };

  // Services réellement utilisés par au moins une chambre (pour le filtre)
  const usedServices = useMemo(() => {
    const ids = new Set(chambres.map((c) => c.serviceId).filter(Boolean));
    return services.filter((s) => ids.has(s.id));
  }, [chambres, services]);

  const filteredChambres = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return chambres.filter((r) => {
      if (serviceFilter === "none" && r.serviceId) return false;
      if (serviceFilter && serviceFilter !== "none" && String(r.serviceId) !== serviceFilter) return false;
      if (!term) return true;
      return (
        r.code?.toLowerCase().includes(term) ||
        r.codeBarre?.toLowerCase().includes(term) ||
        getServiceName(r.serviceId).toLowerCase().includes(term)
      );
    });
  }, [chambres, searchTerm, serviceFilter, getServiceName]);

  const totalPages = Math.max(1, Math.ceil(filteredChambres.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;

  // Tri par colonne (clic sur l'en-tête : croissant → décroissant → aucun)
  const { sortedItems: sortedChambres, requestSort, directionFor } = useSortableData(filteredChambres, {
    service: (c) => getServiceName(c.serviceId),
  });
  const currentData = sortedChambres.slice(startIndex, startIndex + itemsPerPage);

  const panelOpen = expandedId !== null;
  const openChambre = chambres.find((c) => c.id === expandedId) || selectedChambre;
  const chambresActives = chambres.filter((c) => c.actif);
  const peutDesactiver = (chambre) => chambre?.source !== "EXTERNE" && chambre?.actif !== false;

  /* ─── Rendu ─────────────────────────────────────────────────── */
  const emptyState = (
    <div className="text-center py-16 px-6">
      <EmptyIllustration searching={!!(searchTerm || serviceFilter)} />
      <h3 className="text-lg font-bold text-slate-800 mt-5">
        {searchTerm || serviceFilter ? t("chambre.no_match") : t("chambre.no_data")}
      </h3>
      <p className="text-sm text-slate-500 mt-1">
        {searchTerm || serviceFilter
          ? t("chambre.empty_search_hint", "Essayez un autre code ou retirez le filtre de service.")
          : t("chambre.empty_hint", "Créez votre première chambre pour commencer.")}
      </p>
      {searchTerm || serviceFilter ? (
        <button
          type="button"
          onClick={() => { setSearchTerm(""); setServiceFilter(""); }}
          className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-[12px] border border-slate-200 bg-white text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <X className="w-4 h-4" /> {t("chambre.clear_filters", "Réinitialiser les filtres")}
        </button>
      ) : !chambresImportees && (
        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-[12px] text-sm font-bold text-white shadow-sm hover:shadow-md transition-all"
          style={{ background: `linear-gradient(135deg, ${C.green}, ${C.teal})` }}
        >
          <Plus className="w-4 h-4 stroke-[2.5]" /> {t("chambre.new")}
        </button>
      )}
    </div>
  );

  const loadingState = (
    <div className="p-4 space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-2 py-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-32 rounded bg-slate-100 animate-pulse" />
            <div className="h-2.5 w-20 rounded bg-slate-100 animate-pulse" />
          </div>
          <div className="h-6 w-24 rounded-full bg-slate-100 animate-pulse" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="relative flex flex-col lg:flex-row gap-4 h-full">
      {/* ═══ COLONNE PRINCIPALE ═══ */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* En-tête (identique aux autres pages) */}
        <div className="page-head flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <PageHeaderIcon size={52} />
            <div>
              <h1 className="text-[28px] font-extrabold text-slate-900 m-0 leading-tight">{t("chambre.title")}</h1>
              <p className="text-sm text-slate-500 mt-0.5">{t("chambre.subtitle")}</p>
            </div>
          </div>
        </div>

        {/* KPI */}
        <div className={`grid gap-4 grid-cols-1 sm:grid-cols-2 ${panelOpen ? "2xl:grid-cols-4" : "xl:grid-cols-4"}`}>
          <KpiTile icon={IconDoor} color={C.teal} delay={0}
            label={t("chambre.kpi_total", "Chambres")} value={kpis.total}
            hint={t("chambre.kpi_total_hint", "Enregistrées dans le système")} />
          <KpiTile icon={IconHospital} color={C.sky} delay={0.05}
            label={t("chambre.kpi_services", "Services couverts")} value={kpis.servicesCovered}
            hint={t("chambre.kpi_services_hint", "Au moins une chambre rattachée")} />
          <KpiTile icon={IconBarcodeTag} color={C.violet} delay={0.1}
            label={t("chambre.kpi_barcode", "Étiquetées")} value={kpis.withBarcode}
            hint={t("chambre.kpi_barcode_hint", "Avec code-barres")} />
          <KpiTile icon={IconUnassigned} color={kpis.unassigned ? C.orange : C.green} delay={0.15}
            label={t("chambre.kpi_unassigned", "Sans service")} value={kpis.unassigned}
            hint={kpis.unassigned
              ? t("chambre.kpi_unassigned_hint", "À rattacher à un service")
              : t("chambre.kpi_unassigned_ok", "Toutes sont rattachées")} />
        </div>

        {/* Barre d'outils */}
        <div className="flex flex-wrap items-center gap-3 bg-white/65 backdrop-blur-md p-4 rounded-[20px] border border-slate-200/50 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
          {!chambresImportees && (
            <>
              <ToolbarButton color={C.green} icon={Plus} onClick={handleOpenCreateModal}>
                {t("chambre.new")}
              </ToolbarButton>

              <div className="w-px h-[30px] bg-slate-200 mx-1" />
            </>
          )}

          <ToolbarButton color={C.blue} icon={Edit} disabled={!panelOpen}
            onClick={() => openChambre && handleOpenEditModal(openChambre)}>
            <span className="hidden sm:inline">{t("chambre.edit")}</span>
          </ToolbarButton>
          <ToolbarButton color={C.red} icon={Trash2} disabled={!panelOpen || !peutDesactiver(openChambre)}
            onClick={() => expandedId && deleteRec(expandedId)}>
            <span className="hidden sm:inline">{t("chambre.delete")}</span>
          </ToolbarButton>

          <button
            type="button"
            onClick={fetchChambres}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-300 rounded-[14px] text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">{t("chambre.refresh")}</span>
          </button>

          <div className="flex-1" />

          <div className="flex items-center bg-slate-100 p-1 rounded-[12px]" role="group">
            {[
              { mode: "table", icon: List, label: t("chambre.view_table", "Vue tableau") },
              { mode: "grid", icon: LayoutGrid, label: t("chambre.view_grid", "Vue plan") },
            ].map(({ mode, icon: Icon, label }) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                title={label}
                aria-pressed={viewMode === mode}
                className={`p-2 rounded-[9px] transition-all ${
                  viewMode === mode ? "bg-white shadow-sm text-[#0d9488]" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Icon className="w-4 h-4 stroke-[2.5]" />
              </button>
            ))}
          </div>
        </div>

        {/* Recherche + filtre service */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder={t("chambre.search_placeholder")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-10 pl-10 pr-9 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    aria-label={t("chambre.clear_filters", "Réinitialiser les filtres")}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="relative sm:w-60">
                <IconHospital size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <select
                  value={serviceFilter}
                  onChange={(e) => setServiceFilter(e.target.value)}
                  className="w-full h-10 pl-10 pr-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">{t("chambre.all_services", "Tous les services")}</option>
                  {usedServices.map((s) => (
                    <option key={s.id} value={String(s.id)}>{s.code}</option>
                  ))}
                  <option value="none">{t("chambre.not_assigned")}</option>
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-600 shrink-0">
                <input type="checkbox" checked={tous} onChange={(e) => { setIsLoading(true); setTous(e.target.checked); }} />
                {t("chambre.show_inactive", "Afficher les inactives")}
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Liste */}
        {viewMode === "table" ? (
          <Card>
            <CardContent className="p-0">
              {isLoading ? loadingState : currentData.length === 0 ? emptyState : (
                <div className="premium-table-wrap">
                  <table className="premium-table">
                    <thead>
                      <tr>
                        <th style={{ width: 56 }} aria-label={t("chambre.show_beds")} />
                        <SortableHeader direction={directionFor("code")} onSort={() => requestSort("code")}>
                          {t("chambre.code")}
                        </SortableHeader>
                        <SortableHeader direction={directionFor("codeBarre")} onSort={() => requestSort("codeBarre")}>
                          {t("chambre.code_barre")}
                        </SortableHeader>
                        <SortableHeader direction={directionFor("service")} onSort={() => requestSort("service")}>
                          {t("chambre.service")}
                        </SortableHeader>
                        <th style={{ textAlign: "right", paddingRight: 20 }}>{t("chambre.actions")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentData.map((chambre) => {
                        const isOpen = expandedId === chambre.id;
                        const assigned = !!chambre.serviceId;
                        return (
                          <tr
                            key={chambre.id}
                            onClick={() => toggleExpand(chambre)}
                            className={`${isOpen ? "is-selected" : ""} ${chambre.actif === false ? "opacity-60" : ""}`}
                            style={{ cursor: "pointer" }}
                          >
                            <td style={{ textAlign: "center" }}>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); toggleExpand(chambre); }}
                                className={`premium-table__icon-btn ${isOpen ? "is-open" : ""}`}
                                title={isOpen ? t("chambre.hide_beds") : t("chambre.show_beds")}
                              >
                                {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                              </button>
                            </td>
                            <td>
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                                  style={{ color: C.teal, background: `${C.teal}14`, border: `1px solid ${C.teal}26` }}
                                >
                                  <IconDoor size={20} />
                                </div>
                                <div>
                                  <div className="premium-table__primary">
                                    {chambre.code || `CH-${chambre.id}`}
                                    <BadgeImporte item={chambre} />
                                    <BadgeInactif item={chambre} />
                                  </div>
                                  <span className="premium-table__muted">#{String(chambre.id).padStart(4, "0")}</span>
                                </div>
                              </div>
                            </td>
                            <td>
                              {chambre.codeBarre
                                ? <span className="premium-table__code">{chambre.codeBarre}</span>
                                : <span className="premium-table__muted">—</span>}
                            </td>
                            <td>
                              <span
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                                style={assigned
                                  ? { color: C.sky, background: `${C.sky}14` }
                                  : { color: C.orange, background: `${C.orange}14` }}
                              >
                                {assigned ? <IconHospital size={14} /> : <IconUnassigned size={14} />}
                                {getServiceName(chambre.serviceId)}
                              </span>
                            </td>
                            <td style={{ textAlign: "right", paddingRight: 20 }} onClick={(e) => e.stopPropagation()}>
                              <div className="premium-table__actions">
                                <BarcodeLabel item={chambre} type="chambre" />
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditModal(chambre)}
                                  className="premium-table__icon-btn"
                                  title={t("chambre.edit")}
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                {peutDesactiver(chambre) && (
                                  <button
                                    type="button"
                                    onClick={() => deleteRec(chambre.id)}
                                    className="premium-table__icon-btn is-danger"
                                    title={t("chambre.delete")}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        ) : isLoading ? (
          <Card><CardContent className="p-0">{loadingState}</CardContent></Card>
        ) : currentData.length === 0 ? (
          <Card><CardContent className="p-0">{emptyState}</CardContent></Card>
        ) : (
          /* Vue plan : une carte par chambre */
          <div className={`grid gap-4 grid-cols-1 sm:grid-cols-2 ${panelOpen ? "2xl:grid-cols-3" : "lg:grid-cols-3 2xl:grid-cols-4"}`}>
            {currentData.map((chambre, idx) => {
              const isOpen = expandedId === chambre.id;
              const assigned = !!chambre.serviceId;
              const accent = assigned ? C.teal : C.orange;
              return (
                <motion.div
                  key={chambre.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  onClick={() => toggleExpand(chambre)}
                  className={`group relative bg-white rounded-[20px] border cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)] ${
                    isOpen ? "border-[#0d9488] ring-2 ring-[#0d9488]/20" : "border-slate-200/70 shadow-[0_4px_20px_rgba(0,0,0,0.03)]"
                  } ${chambre.actif === false ? "opacity-60" : ""}`}
                >
                  <div className="h-[88px] p-3 pb-0">
                    <RoomPlan color={accent} beds={2} />
                  </div>
                  <div className="p-4 pt-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-extrabold text-base text-slate-800 truncate">{chambre.code || `CH-${chambre.id}`}</h3>
                        <p className="premium-table__muted">
                          #{String(chambre.id).padStart(4, "0")}
                          <BadgeImporte item={chambre} />
                          <BadgeInactif item={chambre} />
                        </p>
                      </div>
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0"
                        style={assigned ? { color: C.sky, background: `${C.sky}14` } : { color: C.orange, background: `${C.orange}14` }}
                      >
                        {assigned ? <IconHospital size={13} /> : <IconUnassigned size={13} />}
                        {getServiceName(chambre.serviceId)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => toggleExpand(chambre)}
                        className="inline-flex items-center gap-1 text-xs font-bold transition-colors"
                        style={{ color: C.teal }}
                      >
                        {isOpen ? t("chambre.hide_beds") : t("chambre.show_beds")}
                        <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isOpen ? "rotate-180" : "group-hover:translate-x-0.5"}`} />
                      </button>
                      <div className="premium-table__actions">
                        <BarcodeLabel item={chambre} type="chambre" />
                        <button type="button" onClick={() => handleOpenEditModal(chambre)} className="premium-table__icon-btn" title={t("chambre.edit")}>
                          <Edit className="w-4 h-4" />
                        </button>
                        {peutDesactiver(chambre) && (
                          <button type="button" onClick={() => deleteRec(chambre.id)} className="premium-table__icon-btn is-danger" title={t("chambre.delete")}>
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && filteredChambres.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-1">
            <p className="text-sm text-slate-500">
              {t("chambre.pagination.showing")}{" "}
              <span className="font-bold text-slate-800">{startIndex + 1}</span>{" "}
              {t("chambre.pagination.to")}{" "}
              <span className="font-bold text-slate-800">{Math.min(startIndex + itemsPerPage, filteredChambres.length)}</span>{" "}
              {t("chambre.pagination.of")}{" "}
              <span className="font-bold text-slate-800">{filteredChambres.length}</span>{" "}
              {t("chambre.pagination.rooms")}
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="h-9 px-3 inline-flex items-center gap-1 rounded-[12px] border border-slate-200 bg-white text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" /> <span className="hidden sm:inline">{t("chambre.pagination.previous")}</span>
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .map((p, i, arr) => (
                    <React.Fragment key={p}>
                      {i > 0 && p - arr[i - 1] > 1 && <span className="px-1 text-slate-400">…</span>}
                      <button
                        type="button"
                        onClick={() => setCurrentPage(p)}
                        className={`h-9 min-w-9 px-3 rounded-[12px] text-sm font-bold transition-all ${
                          p === currentPage
                            ? "text-white shadow-sm"
                            : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                        style={p === currentPage ? { background: `linear-gradient(135deg, ${C.green}, ${C.teal})` } : undefined}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  ))}
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="h-9 px-3 inline-flex items-center gap-1 rounded-[12px] border border-slate-200 bg-white text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span className="hidden sm:inline">{t("chambre.pagination.next")}</span> <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══ PANNEAU LATÉRAL — lits de la chambre ═══ */}
      <AnimatePresence>
        {panelOpen && openChambre && (
          <motion.aside
            key="panel"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 30 } }}
            exit={{ opacity: 0, x: 60, transition: { duration: 0.2 } }}
            className="w-full lg:w-[420px] xl:w-[460px] shrink-0 bg-white rounded-[20px] border border-slate-200 shadow-[0_20px_50px_rgba(15,23,42,0.10)] overflow-hidden lg:sticky lg:top-20 lg:h-[calc(100vh-120px)] flex flex-col"
          >
            {/* En-tête du panneau */}
            <div className="relative p-5 border-b border-slate-100" style={{ background: `linear-gradient(135deg, ${C.teal}12, ${C.sky}08 60%, transparent)` }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-white"
                    style={{ background: `linear-gradient(135deg, ${C.green}, ${C.teal})`, boxShadow: `0 6px 18px ${C.teal}40` }}
                  >
                    <IconDoor size={24} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{t("chambre.beds")}</p>
                    <h3 className="text-lg font-extrabold text-slate-900 truncate">{openChambre.code || `CH-${openChambre.id}`}</h3>
                    <p className="text-xs text-slate-500 truncate">{getServiceName(openChambre.serviceId)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <BarcodeLabel item={openChambre} type="chambre" />
                  <button
                    type="button"
                    onClick={closePanel}
                    className="premium-table__icon-btn"
                    title={t("chambre.close", "Fermer")}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Synthèse d'occupation */}
              <div className="mt-5 flex items-center gap-5">
                {isLitsLoading ? (
                  <div className="w-[96px] h-[96px] rounded-full border-[9px] border-slate-100 animate-pulse shrink-0" />
                ) : (
                  <div className="shrink-0"><OccupancyRing occupied={bedStats.occupied} free={bedStats.free} total={bedStats.total} size={96} /></div>
                )}
                <div className="flex-1 grid grid-cols-2 gap-2">
                  {[
                    { label: t("chambre.beds_total", "Lits"), value: bedStats.total, color: "#64748b" },
                    { label: t("chambre.free"), value: bedStats.free, color: C.green },
                    { label: t("chambre.occupied"), value: bedStats.occupied, color: C.orange },
                    circuitInfecte && { label: t("chambre.infected"), value: bedStats.infected, color: C.red },
                  ].filter(Boolean).map((s) => (
                    <div key={s.label} className="rounded-xl bg-white border border-slate-100 px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">{s.label}</span>
                      </div>
                      <p className="text-lg font-extrabold text-slate-800 tabular-nums leading-tight mt-0.5">
                        {isLitsLoading ? "…" : s.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Liste des lits */}
            <div className="flex-1 overflow-y-auto p-4">
              {((!litsImportes && openChambre.actif !== false) || infectionImportee) && (
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  {infectionImportee ? (
                    <p className="text-[11px] text-slate-500">
                      {t("chambre.infection_locked", "L'état d'infection est synchronisé depuis le système externe")}
                    </p>
                  ) : <span />}
                  {!litsImportes && openChambre.actif !== false && (
                    <ToolbarButton color={C.green} icon={Plus} onClick={() => ouvrirLit(null)} className="!px-3 !py-1.5 !text-xs">
                      {t("chambre.new_bed", "Ajouter un lit")}
                    </ToolbarButton>
                  )}
                </div>
              )}
              {isLitsLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-[170px] rounded-2xl bg-slate-100 animate-pulse" />
                  ))}
                </div>
              ) : chambreLits.length === 0 ? (
                <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-slate-200">
                  <div className="w-32 h-20 mx-auto opacity-60">
                    <BedIllustration occupied={false} color="#94a3b8" />
                  </div>
                  <p className="text-sm font-bold text-slate-600 mt-3">{t("chambre.no_beds")}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3">
                  {chambreLits.map((lit, i) => (
                    <BedCard
                      key={lit.id}
                      lit={lit}
                      index={i}
                      isSelected={selectedId === lit.id}
                      chambreCode={openChambre.code}
                      onClick={() => setSelectedId((prev) => (prev === lit.id ? null : lit.id))}
                      t={t}
                      circuitInfecte={circuitInfecte}
                      infectionVerrouillee={infectionImportee}
                      onToggleInfection={basculerInfection}
                      onEdit={ouvrirLit}
                      onDisable={desactiverLit}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ═══ MODAL ═══ */}
      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedChambre
          ?`${t("chambre.modal.edit_title")} #${selectedChambre.id}`
          : t("chambre.modal.new_title")}
        mode={selectedChambre ? "edit" : "create"}
        size={"lg"}
        onSubmit={handleSave}
        saving={isSaving}
      >
        <FormSection title={t("modal.general_info", "Informations générales")} icon="specs" columns={2}>
          <Input
            label={t("chambre.form.code_label")}
            value={newRec.code}
            onChange={(e) => setNewRec({ ...newRec, code: e.target.value.toUpperCase() })}
            placeholder={t("chambre.form.code_placeholder")}
            required={!selectionImportee}
            disabled={selectionImportee}
          />
          <Input
            label={t("chambre.code_barre")}
            value={newRec.codeBarre}
            onChange={(e) => setNewRec({ ...newRec, codeBarre: e.target.value })}
            placeholder={selectedChambre ? "" : t("chambre.form.barcode_auto", "Généré si vide")}
            disabled={selectionImportee}
          />
          <div>
            <label className="block text-sm font-bold mb-2 text-slate-700">
              {t("chambre.form.service_label")}
            </label>
            <select
              value={newRec.serviceId || ""}
              onChange={(e) =>
                setNewRec({
                  ...newRec,
                  serviceId: e.target.value ? parseInt(e.target.value) : "",
                })
              }
              className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-[#0d9488] focus:ring-2 focus:ring-[#0d9488]/20 transition-all"
            >
              <option value="">{t("chambre.form.no_service")}</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>{service.code}</option>
              ))}
            </select>
          </div>
          {selectedChambre ? (
            <label className={`flex items-center gap-2 text-sm font-medium self-end h-10 ${selectionImportee ? "opacity-50" : ""}`}>
              <input type="checkbox" checked={newRec.actif} disabled={selectionImportee}
                onChange={(e) => setNewRec({ ...newRec, actif: e.target.checked })} />
              {t("common.active", "Actif")}
            </label>
          ) : (
            <label className="flex items-center gap-2 text-sm font-medium self-end h-10 md:col-span-2">
              <input type="checkbox" checked={newRec.creerLitParDefaut}
                onChange={(e) => setNewRec({ ...newRec, creerLitParDefaut: e.target.checked })} />
              {t("chambre.form.single_bed", "Créer un lit unique avec cette chambre (hôtel)")}
            </label>
          )}
          {selectionImportee && (
            <p className="text-xs text-slate-500 md:col-span-2">
              {t("chambre.form.imported_hint", "Chambre importée : seul le service est modifiable.")}
            </p>
          )}
        </FormSection>
      </FormModal>

      <FormModal
        isOpen={!!litEdition}
        onClose={() => setLitEdition(null)}
        title={litEdition === "nouveau" ? t("chambre.new_bed", "Ajouter un lit") : `${t("chambre.edit_bed", "Modifier le lit")} #${litEdition?.id ?? ""}`}
        mode={litEdition === "nouveau" ? "create" : "edit"}
        onSubmit={enregistrerLit}
        saving={savingLit}
      >
        <FormSection title={t("chambre.bed", "Lit")} icon="specs" columns={2}>
          <Input label={`${t("chambre.code")} *`} value={litForm.code}
            onChange={(e) => setLitForm({ ...litForm, code: e.target.value })} required={litEdition === "nouveau"} />
          <Input label={t("chambre.bed_reference", "Référence")} value={litForm.reference} maxLength={20}
            onChange={(e) => setLitForm({ ...litForm, reference: e.target.value })} />
          <Input label={t("chambre.bed_description", "Description")} value={litForm.description}
            onChange={(e) => setLitForm({ ...litForm, description: e.target.value })} />
          <Input label={t("chambre.bed_type", "Type")} value={litForm.type} maxLength={20} list="types-lit"
            onChange={(e) => setLitForm({ ...litForm, type: e.target.value.toUpperCase() })} />
          <datalist id="types-lit">
            {TYPES_LIT.map((type) => <option key={type} value={type} />)}
          </datalist>
          <div>
            <label className="block text-sm font-bold mb-2 text-slate-700">{t("chambre.bed_room", "Chambre")}</label>
            <select
              value={litForm.chambreId || ""}
              onChange={(e) => setLitForm({ ...litForm, chambreId: e.target.value })}
              disabled={litEdition === "nouveau"}
              className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-[#0d9488] focus:ring-2 focus:ring-[#0d9488]/20 transition-all"
            >
              {chambresActives.map((c) => <option key={c.id} value={c.id}>{c.code}</option>)}
            </select>
            {litEdition !== "nouveau" && (
              <p className="text-xs text-slate-400 mt-1">
                {t("chambre.bed_move_hint", "Un lit ne peut changer de chambre que s'il n'a aucun linge affecté.")}
              </p>
            )}
          </div>
          {litEdition !== "nouveau" && (
            <label className="flex items-center gap-2 text-sm font-medium self-end h-10">
              <input type="checkbox" checked={litForm.actif} onChange={(e) => setLitForm({ ...litForm, actif: e.target.checked })} />
              {t("common.active", "Actif")}
            </label>
          )}
        </FormSection>
      </FormModal>
    </div>
  );
}
