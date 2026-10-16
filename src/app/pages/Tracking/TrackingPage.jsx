import React, { useState, useContext, useEffect, useCallback, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { LingeContext } from "../../contextes/LingeContext";
import { ServiceContext } from "../../contextes/ServiceContext";
import { getSetting, formatDateTime as formatDateTimeReglage } from "../../utils/appSettings";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../../components/ui/button";
import "../Linge/WorkflowList.css";

const FONTS_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap');`;

const palette = {
  bg: "#EEF2F7",
  bgGrad: "radial-gradient(circle at 15% 10%, #FDF2F4 0%, transparent 45%), radial-gradient(circle at 85% 90%, #EEFBF6 0%, transparent 45%), linear-gradient(160deg, #F7F9FC 0%, #EEF2F7 100%)",
  surface: "rgba(255, 255, 255, 0.86)",
  surfaceSolid: "#FFFFFF",
  surfaceRaised: "#F3F6FA",
  border: "rgba(30, 41, 59, 0.08)",
  borderStrong: "rgba(30, 41, 59, 0.14)",
  textPrimary: "#1B2536",
  textMuted: "#64748B",
  textFaint: "#98A4B8",
  teal: "#0D9488",
  tealSoft: "rgba(13, 148, 136, 0.10)",
  rose: "#E11D48",
  roseSoft: "rgba(225, 29, 72, 0.10)",
  amber: "#D97706",
  amberSoft: "rgba(217, 119, 6, 0.10)",
  sky: "#0284C7",
  skySoft: "rgba(2, 132, 199, 0.10)",
  violet: "#7C3AED",
  violetSoft: "rgba(124, 58, 237, 0.10)",
};

const Icons = {
  Search: ({ size = 18, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
  ),
  Rfid: ({ size = 18, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M6 8.5a6.5 6.5 0 0 0 0 7" /><path d="M9 6a10 10 0 0 0 0 12" /><path d="M3 11a3 3 0 0 0 0 2" /><circle cx="17" cy="12" r="3" /><path d="M17 9V7" /><path d="M17 17v-2" /></svg>
  ),
  QrCode: ({ size = 18, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3h-3z" /><path d="M18 18h3v3h-3z" /><path d="M14 21h3" /><path d="M21 14v3" /></svg>
  ),
  Refresh: ({ size = 18, color = "currentColor", className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M3 21v-5h5" /></svg>
  ),
  Trash: ({ size = 18, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
  ),
  Tshirt: ({ size = 18, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" /></svg>
  ),
  Alert: ({ size = 18, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
  ),
  CheckCircle: ({ size = 18, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
  ),
  Info: ({ size = 18, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
  ),
  Truck: ({ size = 24, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M10 17h4V5H2v12h3" /><path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5v8h1" /><circle cx="7.5" cy="17.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" /></svg>
  ),
  Inbox: ({ size = 24, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12" /><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /></svg>
  ),
  Sort: ({ size = 24, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M7 12h10" /><path d="M10 18h4" /></svg>
  ),
  Wash: ({ size = 24, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><circle cx="12" cy="14" r="4" /><path d="M7 6h.01" /><path d="M11 6h.01" /></svg>
  ),
  Wind: ({ size = 24, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M9.59 4.59A2 2 0 1 1 11 8H2" /><path d="M17.73 7.73A2.5 2.5 0 1 1 19.5 12H2" /><path d="M12.59 19.41A2 2 0 1 0 14 16H2" /></svg>
  ),
  Fold: ({ size = 24, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v18" /><path d="m8 7 4-4 4 4" /><path d="m8 17 4 4 4-4" /><path d="M3 12h18" /></svg>
  ),
  Warehouse: ({ size = 24, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M22 8.35V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.35A2 2 0 0 1 3.26 6.5l8-3.2a2 2 0 0 1 1.48 0l8 3.2A2 2 0 0 1 22 8.35Z" /><path d="M6 18h12" /><path d="M6 14h12" /><path d="M6 10h12" /></svg>
  ),
  Package: ({ size = 24, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M16.5 9.4 7.55 4.24" /><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.29 7 12 12 20.71 7" /><line x1="12" y1="22" x2="12" y2="12" /></svg>
  ),
  ChevronLeft: ({ size = 18, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
  ),
  ChevronRight: ({ size = 18, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
  ),
  Activity: ({ size = 18, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
  ),
  Zap: ({ size = 18, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
  ),
  X: ({ size = 18, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
  ),
  Hash: ({ size = 18, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="9" x2="20" y2="9" /><line x1="4" y1="15" x2="20" y2="15" /><line x1="10" y1="3" x2="8" y2="21" /><line x1="16" y1="3" x2="14" y2="21" /></svg>
  ),
  User: ({ size = 18, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
  ),
  Clock: ({ size = 18, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
  ),
  Weight: ({ size = 18, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="2" /><path d="M5 22 8 9h8l3 13z" /></svg>
  ),
  Tag: ({ size = 18, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 2H2v10l9.29 9.29a1 1 0 0 0 1.42 0l7.29-7.29a1 1 0 0 0 0-1.42z" /><circle cx="7" cy="7" r="1" /></svg>
  ),
  Building: ({ size = 18, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="1" /><line x1="9" y1="7" x2="9" y2="7.01" /><line x1="15" y1="7" x2="15" y2="7.01" /><line x1="9" y1="12" x2="9" y2="12.01" /><line x1="15" y1="12" x2="15" y2="12.01" /><line x1="9" y1="17" x2="9" y2="17.01" /><line x1="15" y1="17" x2="15" y2="17.01" /></svg>
  ),
  ArrowUpRight: ({ size = 18, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" /></svg>
  ),
  Compass: ({ size = 22, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.4" /><polygon points="12,4 14,12 12,11 10,12" fill={color} /><polygon points="12,20 10,12 12,13 14,12" fill="#CBD5E1" /></svg>
  ),
  MapPin: ({ size = 18, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
  ),
};

const STATIONS = [
  { id: "COLLECTE", label: { fr: "Collecte", ar: "الجمع", en: "Collection" }, Icon: Icons.Truck, x: 12, y: 18, zone: "SALE", color: palette.rose },
  { id: "RECEPTION", label: { fr: "Réception", ar: "الاستلام", en: "Reception" }, Icon: Icons.Inbox, x: 33, y: 18, zone: "SALE", color: palette.rose },
  { id: "TRI", label: { fr: "Tri", ar: "الفرز", en: "Sorting" }, Icon: Icons.Sort, x: 54, y: 18, zone: "SALE", color: palette.amber },
  { id: "LAVAGE", label: { fr: "Lavage", ar: "الغسيل", en: "Washing" }, Icon: Icons.Wash, x: 75, y: 18, zone: "SALE", color: palette.sky },
  { id: "SECHAGE", label: { fr: "Séchage", ar: "التجفيف", en: "Drying" }, Icon: Icons.Wind, x: 25, y: 82, zone: "PROPRE", color: palette.violet },
  { id: "PLIAGE", label: { fr: "Pliage", ar: "الطي", en: "Folding" }, Icon: Icons.Fold, x: 47, y: 82, zone: "PROPRE", color: palette.violet },
  { id: "STOCKAGE", label: { fr: "Stockage", ar: "التخزين", en: "Storage" }, Icon: Icons.Warehouse, x: 69, y: 82, zone: "PROPRE", color: palette.teal },
  { id: "LIVRAISON", label: { fr: "Livraison", ar: "التسليم", en: "Delivery" }, Icon: Icons.Package, x: 90, y: 82, zone: "PROPRE", color: palette.teal },
];

const ETAT_TO_STATION = {
  COLLECTE: "COLLECTE", RECEPTION: "RECEPTION", RECEPTIONNE: "RECEPTION",
  EN_TRI: "TRI", EN_LAVAGE: "LAVAGE", LAVE: "LAVAGE",
  EN_SECHAGE: "SECHAGE", EN_SECHAGE_REPASSAGE: "SECHAGE", SECHE: "SECHAGE",
  PLIE: "PLIAGE", STOCKE: "STOCKAGE", PROPRE_PRET: "STOCKAGE",
  PRET_LIVRAISON: "LIVRAISON", LIVRE: "LIVRAISON",
  SALE: "COLLECTE", PROPRE: "STOCKAGE", MANQUANT: null,
};

const ETAT_STYLES = {
  RECEPTION: { color: palette.violet, bg: palette.violetSoft, Icon: Icons.Inbox },
  COLLECTE: { color: palette.rose, bg: palette.roseSoft, Icon: Icons.Truck },
  EN_TRI: { color: palette.amber, bg: palette.amberSoft, Icon: Icons.Sort },
  EN_LAVAGE: { color: palette.sky, bg: palette.skySoft, Icon: Icons.Wash },
  LAVE: { color: palette.sky, bg: palette.skySoft, Icon: Icons.Wash },
  EN_SECHAGE: { color: palette.violet, bg: palette.violetSoft, Icon: Icons.Wind },
  SECHE: { color: palette.violet, bg: palette.violetSoft, Icon: Icons.Wind },
  PLIE: { color: palette.violet, bg: palette.violetSoft, Icon: Icons.Fold },
  STOCKE: { color: palette.teal, bg: palette.tealSoft, Icon: Icons.Warehouse },
  LIVRE: { color: palette.teal, bg: palette.tealSoft, Icon: Icons.Package },
  PROPRE: { color: palette.teal, bg: palette.tealSoft, Icon: Icons.CheckCircle },
  MANQUANT: { color: palette.rose, bg: palette.roseSoft, Icon: Icons.Alert },
};

function getEtatStyle(etat) {
  return ETAT_STYLES[etat] || { color: palette.textMuted, bg: palette.surfaceRaised, Icon: Icons.Info };
}

// Format choisi dans Paramètres › Affichage
function formatDateTime(value) {
  if (!value) return null;
  const s = formatDateTimeReglage(value);
  return s === "—" ? null : s;
}

const DETAIL_FIELDS = [
  { key: "typeLinge", label: "Type de linge", Icon: Icons.Tag },
  { key: "poids", label: "Poids", Icon: Icons.Weight, suffix: " kg" },
  { key: "client", label: "Client", Icon: Icons.Building },
  { key: "numeroLot", label: "Lot", Icon: Icons.Hash },
  { key: "rfidTag", label: "Tag RFID", Icon: Icons.Rfid },
  { key: "chariot", label: "Chariot", Icon: Icons.Package },
  { key: "agentResponsable", label: "Agent en charge", Icon: Icons.User },
  { key: "dateCollecte", label: "Date de collecte", Icon: Icons.Clock, isDate: true },
  { key: "dateLivraisonPrevue", label: "Livraison prévue", Icon: Icons.Clock, isDate: true },
];

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

function pickValue(obj, keys) {
  if (!obj) return null;
  for (const k of keys) {
    const v = obj[k];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return null;
}

// Résout la chambre du linge (objet, code direct ou id à chercher dans la liste des chambres)
function resolveChambre(item, chambres) {
  const raw = item?.chambre ?? item?.Chambre;
  if (raw && typeof raw === "object") {
    return {
      code: pickValue(raw, ["code", "Code", "codeChambre", "numero", "nom"]),
      serviceId: pickValue(raw, ["serviceId", "ServiceId"]),
    };
  }
  const code = (typeof raw === "string" || typeof raw === "number") ? raw : pickValue(item, ["codeChambre", "chambreCode", "CodeChambre", "chambreNom", "numeroChambre"]);
  const id = pickValue(item, ["chambreIdSqlServer", "chambreId", "ChambreId", "idChambre"]);
  const found = id != null ? chambres.find((c) => String(c.id) === String(id)) : code != null ? chambres.find((c) => String(c.code) === String(code)) : null;
  if (!code && !found) return null;
  return { code: code ?? found?.code ?? `CH-${id}`, serviceId: found?.serviceId ?? null };
}

// Résout le service du linge, avec repli sur le service de la chambre
function resolveService(item, services, chambre) {
  const raw = item?.service ?? item?.Service;
  if (raw && typeof raw === "object") return pickValue(raw, ["code", "Code", "nom", "libelle", "designation"]);
  if (typeof raw === "string") return raw;
  const name = pickValue(item, ["serviceCode", "serviceNom", "serviceName", "nomService", "codeService"]);
  if (name) return name;
  const id = pickValue(item, ["serviceId", "ServiceId", "ServiceID", "idService"]) ?? chambre?.serviceId;
  if (id == null) return null;
  const s = (services || []).find((x) => String(x.id) === String(id));
  return s ? (s.code || s.nom || s.libelle) : null;
}

function MovingLinge({ fromStation, toStation, fromLabel, toLabel }) {
  const [phase, setPhase] = useState("idle");
  const [showLabel, setShowLabel] = useState(true);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("charge"), 50);
    const t2 = setTimeout(() => setPhase("travel"), 400);
    const t3 = setTimeout(() => setPhase("arrival"), 2400);
    const t4 = setTimeout(() => setPhase("done"), 3200);
    const tLabel = setTimeout(() => setShowLabel(false), 2800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(tLabel); };
  }, []);

  if (!fromStation || !toStation) return null;

  const fromX = fromStation.x, fromY = fromStation.y, toX = toStation.x, toY = toStation.y;
  const dx = toX - fromX, dy = toY - fromY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const travelDuration = Math.min(Math.max(distance / 25, 2.0), 3.0);
  const midX = (fromX + toX) / 2;
  const arcHeight = Math.max(10, Math.abs(dx) * 0.2);
  const midY = Math.min(fromY, toY) - arcHeight;
  const fromColor = fromStation.color, toColor = toStation.color;

  const particles = useMemo(() => Array.from({ length: 10 }).map((_, i) => ({
    id: i, angle: (i / 10) * Math.PI * 2, radius: 18 + Math.random() * 18, delay: Math.random() * 0.4, size: 2 + Math.random() * 2.4,
  })), []);

  return (
    <>
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 22, overflow: "visible" }} viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="trailMain" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={fromColor} stopOpacity="0" />
            <stop offset="30%" stopColor={fromColor} stopOpacity="0.55" />
            <stop offset="70%" stopColor={toColor} stopOpacity="0.9" />
            <stop offset="100%" stopColor={toColor} stopOpacity="0" />
          </linearGradient>
          <filter id="glowFilter" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="0.6" result="coloredBlur" />
            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        <motion.path d={`M ${fromX} ${fromY} Q ${midX} ${midY} ${toX} ${toY}`} stroke={toColor} strokeWidth="0.18" fill="none" strokeLinecap="round" strokeDasharray="1.4 2"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: phase === "travel" || phase === "arrival" || phase === "done" ? 1 : 0, opacity: phase === "travel" ? 0.45 : 0.25 }}
          transition={{ duration: travelDuration, ease: "easeInOut" }} />

        <motion.path d={`M ${fromX} ${fromY} Q ${midX} ${midY} ${toX} ${toY}`} stroke="url(#trailMain)" strokeWidth="1" fill="none" strokeLinecap="round" filter="url(#glowFilter)"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: phase === "travel" || phase === "arrival" || phase === "done" ? 1 : 0, opacity: phase === "travel" ? 0.95 : phase === "arrival" ? 0.4 : 0 }}
          transition={{ duration: travelDuration, ease: "easeInOut" }} />
      </svg>

      <motion.div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 24 }} initial={{ opacity: 0 }} animate={{ opacity: phase === "travel" ? 1 : 0 }} transition={{ duration: 0.3 }}>
        {particles.map((p) => (
          <motion.div key={p.id} style={{ position: "absolute", left: `${midX}%`, top: `${midY}%`, width: p.size, height: p.size, borderRadius: "50%", background: toColor, boxShadow: `0 0 6px ${toColor}` }}
            animate={{ x: [0, Math.cos(p.angle) * p.radius, 0], y: [0, Math.sin(p.angle) * p.radius, 0], opacity: [0, 1, 0], scale: [0.5, 1.5, 0.5] }}
            transition={{ duration: 1.8, repeat: Infinity, delay: p.delay, ease: "easeInOut" }} />
        ))}
      </motion.div>

      {(phase === "arrival" || phase === "done") && (
        <>
          <motion.div initial={{ scale: 0, opacity: 0.7 }} animate={{ scale: 8, opacity: 0 }} transition={{ duration: 1.2, ease: "easeOut" }}
            style={{ position: "absolute", left: `${toX}%`, top: `${toY}%`, width: "30px", height: "30px", marginLeft: "-15px", marginTop: "-15px", borderRadius: "50%", border: `3px solid ${toColor}`, pointerEvents: "none", zIndex: 26 }} />
          <motion.div initial={{ scale: 0, opacity: 0.6 }} animate={{ scale: 4, opacity: 0 }} transition={{ duration: 0.7, ease: "easeOut" }}
            style={{ position: "absolute", left: `${toX}%`, top: `${toY}%`, width: "40px", height: "40px", marginLeft: "-20px", marginTop: "-20px", borderRadius: "50%", background: `radial-gradient(circle, #ffffff 0%, ${toColor} 45%, transparent 75%)`, pointerEvents: "none", zIndex: 25 }} />
        </>
      )}

      <AnimatePresence>
        {phase !== "done" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0 }} transition={{ duration: 0.3 }}
            style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 28 }}>
            <motion.div
              initial={{ left: `${fromX}%`, top: `${fromY}%`, opacity: 0, scale: 0.2 }}
              animate={{
                left: phase === "charge" ? `${fromX}%` : [`${fromX}%`, `${midX}%`, `${toX}%`],
                top: phase === "charge" ? `${fromY}%` : [`${fromY}%`, `${midY}%`, `${toY}%`],
                opacity: phase === "charge" ? [0, 1] : [1, 1, 1, 1, 0.8, 1],
                scale: phase === "charge" ? [0.2, 1.5] : phase === "travel" ? [1.5, 1.4, 1.3, 1.2, 1.1, 1.0] : phase === "arrival" ? [0.6, 1.4, 1.0] : 0,
              }}
              transition={{
                left: { duration: travelDuration, ease: [0.34, 1.56, 0.64, 1] },
                top: { duration: travelDuration, ease: [0.34, 1.56, 0.64, 1] },
                opacity: { duration: phase === "charge" ? 0.3 : travelDuration, times: [0, 0.1, 0.5, 0.85, 0.95, 1] },
                scale: { duration: phase === "charge" ? 0.3 : travelDuration, times: [0, 0.1, 0.3, 0.5, 0.7, 0.9, 1] },
              }}
              style={{ position: "absolute", transform: "translate(-50%, -50%)" }}
            >
              <motion.div
                animate={{ rotate: phase === "travel" ? [0, 15, -15, 10, -10, 0] : phase === "arrival" ? [0, -8, 4, 0] : [0, 0, 0] }}
                transition={{ duration: phase === "travel" ? travelDuration : 0.6, ease: "easeInOut" }}
                style={{ position: "relative" }}
              >
                <motion.div
                  animate={{ scale: phase === "charge" ? [1, 2, 1] : [1, 1.8, 1], opacity: phase === "charge" ? [0.3, 0.6, 0.3] : [0.4, 0.1, 0.4] }}
                  transition={{ duration: phase === "charge" ? 0.8 : 1.2, repeat: Infinity, ease: "easeInOut" }}
                  style={{ position: "absolute", inset: "-30px", borderRadius: "50%", background: `radial-gradient(circle, ${toColor}45 0%, transparent 70%)`, pointerEvents: "none" }} />
                <motion.div animate={{ rotate: 360 }} transition={{ duration: phase === "charge" ? 1.5 : 2, repeat: Infinity, ease: "linear" }}
                  style={{ position: "absolute", inset: "-22px", borderRadius: "50%", border: `1.5px dashed ${toColor}70`, pointerEvents: "none" }} />
                <motion.div
                  animate={{ y: phase === "travel" ? [-4, 4, -4] : [0, -3, 0], scale: phase === "charge" ? [1, 1.15, 1] : phase === "arrival" ? [1, 1.2, 1] : [1, 1.05, 1] }}
                  transition={{ y: { duration: 1.2, repeat: Infinity, ease: "easeInOut" }, scale: { duration: phase === "arrival" ? 0.6 : 1, repeat: phase === "charge" ? Infinity : 0 } }}
                  style={{
                    position: "relative", padding: "15px", borderRadius: "20px",
                    background: "linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)",
                    boxShadow: phase === "charge"
                      ? `0 0 0 4px ${toColor}35, 0 16px 40px ${toColor}35, 0 6px 14px rgba(15,23,42,0.12)`
                      : phase === "arrival"
                      ? `0 0 0 6px ${toColor}45, 0 20px 48px ${toColor}45`
                      : `0 0 0 3px ${toColor}25, 0 14px 32px ${toColor}30, 0 6px 14px rgba(15,23,42,0.1)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <Icons.Tshirt size={34} color={toColor} />
                </motion.div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showLabel && (
          <motion.div
            initial={{ opacity: 0, y: -30, scale: 0.7 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -20, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            style={{
              position: "absolute", top: "20px", left: "50%", transform: "translateX(-50%)", padding: "9px 20px", borderRadius: "24px",
              background: "#FFFFFF", border: `1.5px solid ${toColor}35`, color: toColor, fontFamily: "'Space Grotesk', sans-serif",
              fontSize: "12px", fontWeight: 600, letterSpacing: "0.2px", display: "flex", alignItems: "center", gap: "10px", zIndex: 32,
              boxShadow: `0 16px 36px rgba(15,23,42,0.14), 0 0 0 1px ${toColor}12`,
            }}
          >
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              style={{ width: "14px", height: "14px", borderRadius: "50%", border: `2px solid ${toColor}25`, borderTopColor: toColor }} />
            <span style={{ color: fromColor }}>{fromLabel || fromStation.label?.fr}</span>
            <motion.div animate={{ x: [0, 4, 0] }} transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }} style={{ display: "flex" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke={toColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </motion.div>
            <span>{toLabel || toStation.label?.fr}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function StationMap({ currentStation, history, isAnimating, t, i18n, onStationClick }) {
  const [hoveredStation, setHoveredStation] = useState(null);
  const lang = i18n.language || "fr";

  const lastStation = React.useMemo(() => {
    if (!history || history.length < 2) return null;
    const previous = history[history.length - 2];
    return ETAT_TO_STATION[previous?.etatapres || previous?.etat] || null;
  }, [history]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: "28px", overflow: "hidden", background: palette.bgGrad, border: `1px solid ${palette.border}`, boxShadow: "0 24px 60px rgba(15,23,42,0.08), inset 0 1px 0 rgba(255,255,255,0.9)" }}>
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="saleZone" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(225, 29, 72, 0.05)" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
          <linearGradient id="propreZone" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="rgba(13, 148, 136, 0.06)" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
          <pattern id="gridPattern" width="18" height="18" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.5" fill="rgba(100,116,139,0.14)" />
          </pattern>
          <linearGradient id="lineTop" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={palette.rose} />
            <stop offset="45%" stopColor={palette.amber} />
            <stop offset="100%" stopColor={palette.sky} />
          </linearGradient>
          <linearGradient id="lineMid" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={palette.sky} />
            <stop offset="100%" stopColor={palette.violet} />
          </linearGradient>
          <linearGradient id="lineBottom" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={palette.violet} />
            <stop offset="100%" stopColor={palette.teal} />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="100" height="50" fill="url(#saleZone)" />
        <rect x="0" y="50" width="100" height="50" fill="url(#propreZone)" />
        <rect width="100" height="100" fill="url(#gridPattern)" />
        <path d="M 0 50 Q 25 46 50 50 Q 75 54 100 50" stroke="rgba(100,116,139,0.10)" strokeWidth="0.4" fill="none" strokeDasharray="0.6 1.6" />

        <path d="M 8 18 Q 20 18 33 18 Q 45 18 54 18 Q 65 18 75 18 Q 83 18 92 18" stroke="#FFFFFF" strokeWidth="3.4" fill="none" strokeLinecap="round" />
        <path d="M 8 18 Q 20 18 33 18 Q 45 18 54 18 Q 65 18 75 18 Q 83 18 92 18" stroke="url(#lineTop)" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.85" />

        <path d="M 75 18 Q 75 50 50 50 Q 25 50 25 82" stroke="#FFFFFF" strokeWidth="3.4" fill="none" strokeLinecap="round" />
        <path d="M 75 18 Q 75 50 50 50 Q 25 50 25 82" stroke="url(#lineMid)" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.85" />

        <path d="M 25 82 Q 36 82 47 82 Q 58 82 69 82 Q 80 82 90 82" stroke="#FFFFFF" strokeWidth="3.4" fill="none" strokeLinecap="round" />
        <path d="M 25 82 Q 36 82 47 82 Q 58 82 69 82 Q 80 82 90 82" stroke="url(#lineBottom)" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.85" />
      </svg>

      <div style={{ position: "absolute", top: "24px", left: "24px", display: "flex", alignItems: "center", gap: "9px", padding: "9px 18px 9px 13px", borderRadius: "24px", background: palette.surface, backdropFilter: "blur(16px)", border: `1px solid ${palette.rose}25`, color: palette.rose, fontFamily: "'Space Grotesk', sans-serif", fontSize: "11px", fontWeight: 600, letterSpacing: "0.3px", zIndex: 10, boxShadow: "0 8px 20px rgba(15,23,42,0.06)" }}>
        <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: palette.rose }} />
        {t('tracking.zone_sale') || "Zone sale"}
      </div>

      <div style={{ position: "absolute", bottom: "24px", left: "24px", display: "flex", alignItems: "center", gap: "9px", padding: "9px 18px 9px 13px", borderRadius: "24px", background: palette.surface, backdropFilter: "blur(16px)", border: `1px solid ${palette.teal}25`, color: palette.teal, fontFamily: "'Space Grotesk', sans-serif", fontSize: "11px", fontWeight: 600, letterSpacing: "0.3px", zIndex: 10, boxShadow: "0 8px 20px rgba(15,23,42,0.06)" }}>
        <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: palette.teal }} />
        {t('tracking.zone_propre') || "Zone propre"}
      </div>

      <div style={{ position: "absolute", top: "24px", right: "24px", width: "44px", height: "44px", borderRadius: "50%", background: palette.surface, backdropFilter: "blur(16px)", border: `1px solid ${palette.border}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 20px rgba(15,23,42,0.06)", zIndex: 10 }}>
        <Icons.Compass size={22} color={palette.textMuted} />
      </div>

      {STATIONS.map((station) => {
        const active = currentStation === station.id;
        const hovered = hoveredStation === station.id;
        const StationIcon = station.Icon;

        return (
          <motion.div
            key={station.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: STATIONS.indexOf(station) * 0.06, type: "spring", stiffness: 200 }}
            onMouseEnter={() => setHoveredStation(station.id)}
            onMouseLeave={() => setHoveredStation(null)}
            onClick={() => active && onStationClick && onStationClick()}
            style={{ position: "absolute", left: `${station.x}%`, top: `${station.y}%`, transform: "translate(-50%, -50%)", zIndex: active ? 20 : 10, cursor: active ? "pointer" : "default" }}
          >
            {active && <motion.div animate={{ scale: [1, 1.7, 1], opacity: [0.35, 0, 0.35] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} style={{ position: "absolute", inset: "-24px", borderRadius: "50%", background: `radial-gradient(circle, ${station.color}30 0%, transparent 70%)`, pointerEvents: "none" }} />}

            <motion.div animate={active ? { y: [-9, -5, -9] } : {}} transition={{ duration: 2, repeat: active ? Infinity : 0, ease: "easeInOut" }} style={{ position: "relative" }}>
              <div style={{ position: "absolute", bottom: "-9px", left: "50%", transform: "translateX(-50%)", width: active ? "34px" : "26px", height: "7px", borderRadius: "50%", background: "rgba(15,23,42,0.14)", filter: "blur(3px)" }} />

              <motion.div
                animate={active ? { scale: [1, 1.04, 1] } : {}}
                transition={{ duration: 1.5, repeat: active ? Infinity : 0, ease: "easeInOut" }}
                style={{
                  position: "relative", width: active ? "72px" : "60px", height: active ? "72px" : "60px", borderRadius: "22px",
                  background: active ? `linear-gradient(145deg, ${station.color} 0%, ${station.color}CC 100%)` : "#FFFFFF",
                  border: active ? "2.5px solid #FFFFFF" : `1.5px solid ${palette.border}`,
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  boxShadow: active ? `0 18px 36px ${station.color}45, 0 0 0 4px ${station.color}18` : "0 10px 24px rgba(15,23,42,0.08)",
                  transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)", transform: hovered ? "scale(1.08)" : "scale(1)",
                }}
              >
                <StationIcon size={active ? 26 : 22} color={active ? "#FFFFFF" : station.color} />
                <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: active ? "8px" : "7.5px", fontWeight: 700, color: active ? "#FFFFFF" : palette.textMuted, marginTop: "3px", letterSpacing: "0.2px" }}>
                  {station.label[lang] || station.label.fr}
                </span>
              </motion.div>

              <div style={{
                position: "absolute", bottom: "-8px", left: "50%", transform: "translateX(-50%) rotate(45deg)",
                width: active ? "14px" : "11px", height: active ? "14px" : "11px", borderRadius: "3px",
                background: active ? station.color : "#FFFFFF",
                border: active ? "none" : `1.5px solid ${palette.border}`,
                boxShadow: active ? `0 6px 12px ${station.color}40` : "0 4px 10px rgba(15,23,42,0.06)",
              }} />

              <div style={{ position: "absolute", bottom: "-4px", left: "50%", transform: "translateX(-50%)", width: "9px", height: "9px", borderRadius: "50%", background: station.color, border: "2px solid #FFFFFF", boxShadow: "0 2px 6px rgba(15,23,42,0.2)" }} />
            </motion.div>

            {active && (
              <motion.div initial={{ scale: 0, y: -8 }} animate={{ scale: 1, y: 0 }} style={{ position: "absolute", top: "-46px", left: "50%", transform: "translateX(-50%)", padding: "5px 13px", borderRadius: "20px", background: station.color, color: "#FFFFFF", fontFamily: "'Space Grotesk', sans-serif", fontSize: "9px", fontWeight: 700, whiteSpace: "nowrap", letterSpacing: "0.3px", boxShadow: `0 10px 22px ${station.color}45`, display: "flex", alignItems: "center", gap: "5px" }}>
                <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }} style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#FFFFFF" }} />
                {t('tracking.current') || "En cours"}
              </motion.div>
            )}

            <AnimatePresence>
              {hovered && !active && (
                <motion.div initial={{ opacity: 0, y: -4, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                  style={{ position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)", marginTop: "14px", padding: "7px 13px", borderRadius: "10px", background: "#1B2536", color: "#FFFFFF", fontFamily: "'Inter', sans-serif", fontSize: "11px", fontWeight: 500, whiteSpace: "nowrap", zIndex: 30, pointerEvents: "none", boxShadow: "0 14px 30px rgba(15,23,42,0.2)" }}>
                  {station.label[lang] || station.label.fr}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}

      <AnimatePresence>
        {isAnimating && lastStation && currentStation && lastStation !== currentStation && (
          <MovingLinge
            key={`${lastStation}-${currentStation}`}
            fromStation={STATIONS.find((s) => s.id === lastStation)}
            toStation={STATIONS.find((s) => s.id === currentStation)}
            fromLabel={STATIONS.find((s) => s.id === lastStation)?.label[lang]}
            toLabel={STATIONS.find((s) => s.id === currentStation)?.label[lang]}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function JournalList({ history, t, onItemClick, selectedId }) {
  if (!history || history.length === 0) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {history.map((step, index) => {
        const etat = step.etatapres || step.etat || "UNKNOWN";
        const config = getEtatStyle(etat);
        const isLast = index === history.length - 1;
        const isSelected = selectedId === step.id;
        const StepIcon = config.Icon;
        const dt = formatDateTime(step.dateOperation);

        return (
          <motion.div
            key={step.id || index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.04 }}
            onClick={() => onItemClick?.(step)}
            style={{
              display: "flex", alignItems: "center", gap: "12px", padding: "11px 12px", borderRadius: "12px",
              background: isSelected || isLast ? config.bg : "transparent",
              border: `1px solid ${isSelected || isLast ? config.color + "30" : "transparent"}`,
              cursor: "pointer", transition: "all 0.2s",
            }}
          >
            <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: isLast || isSelected ? config.color : palette.surfaceRaised, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <StepIcon size={15} color={isLast || isSelected ? "#FFFFFF" : config.color} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "12px", fontWeight: 600, color: config.color, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {t(`tracking.etat.${etat}`, etat)}
                </span>
                {isLast && <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "8px", fontWeight: 700, color: "#FFFFFF", background: config.color, padding: "2px 7px", borderRadius: "6px", flexShrink: 0, letterSpacing: "0.3px" }}>{t('tracking.current') || "En cours"}</span>}
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "3px", alignItems: "center", flexWrap: "wrap" }}>
                {dt && <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: palette.textFaint }}>{dt}</span>}
                {step.agentNom && <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "10px", color: palette.textFaint }}>{step.agentNom}</span>}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function InfoRow({ Icon, label, value }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "10px 0", borderBottom: `1px solid ${palette.border}` }}>
      <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: palette.surfaceRaised, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "1px" }}>
        <Icon size={13} color={palette.textMuted} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: "10px", color: palette.textFaint, fontWeight: 500 }}>{label}</div>
        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: palette.textPrimary, fontWeight: 600, marginTop: "2px", wordBreak: "break-word" }}>{value}</div>
      </div>
    </div>
  );
}

function ItemDetailModal({ item, history, chambre, serviceName, onClose, onOpenJournal, t }) {
  if (!item) return null;
  const etat = item.etat;
  const config = getEtatStyle(etat);
  const EtatIcon = config.Icon;
  const recentSteps = (history || []).slice(-3).reverse();

  const visibleFields = DETAIL_FIELDS
    .map((f) => {
      const raw = item[f.key];
      if (raw === undefined || raw === null || raw === "") return null;
      const value = f.isDate ? formatDateTime(raw) : `${raw}${f.suffix || ""}`;
      if (!value) return null;
      return { ...f, value };
    })
    .filter(Boolean);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(27, 37, 54, 0.35)", backdropFilter: "blur(6px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 280, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: "480px", maxHeight: "86vh", overflowY: "auto", borderRadius: "24px",
          background: "#FFFFFF", border: `1px solid ${palette.borderStrong}`, boxShadow: "0 40px 100px rgba(15,23,42,0.25)",
        }}
      >
        <div style={{ padding: "24px 24px 20px", background: `linear-gradient(135deg, ${config.color}10 0%, transparent 100%)`, borderBottom: `1px solid ${palette.border}`, position: "relative" }}>
          <button onClick={onClose} style={{ position: "absolute", top: "18px", right: "18px", width: "32px", height: "32px", borderRadius: "10px", border: `1px solid ${palette.border}`, background: palette.surfaceRaised, color: palette.textMuted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icons.X size={15} />
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ width: "52px", height: "52px", borderRadius: "16px", background: config.color, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 10px 24px ${config.color}40` }}>
              <Icons.Tshirt size={24} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "20px", fontWeight: 600, color: palette.textPrimary, letterSpacing: "0.5px" }}>
                {item.codeBarre || "N/A"}
              </div>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", color: palette.textMuted, marginTop: "2px" }}>
                {t('tracking.category') || "Catégorie"} · {item.categorie || "—"}
              </div>
            </div>
          </div>

          <div style={{ marginTop: "16px", display: "inline-flex", alignItems: "center", gap: "7px", padding: "7px 14px", borderRadius: "10px", background: config.bg, border: `1px solid ${config.color}30` }}>
            <EtatIcon size={13} color={config.color} />
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "12px", fontWeight: 600, color: config.color }}>
              {t(`tracking.etat.${etat}`, etat)}
            </span>
          </div>
        </div>

        <div style={{ padding: "8px 24px 4px" }}>
          <InfoRow Icon={Icons.Hash} label="Identifiant" value={`#${item.id}`} />
          <InfoRow Icon={Icons.Building} label={t('tracking.service', 'Service')} value={serviceName || "—"} />
          <InfoRow Icon={Icons.MapPin} label={t('tracking.room', 'Chambre')} value={chambre?.code || "—"} />
          {visibleFields.map((f) => (
            <InfoRow key={f.key} Icon={f.Icon} label={f.label} value={f.value} />
          ))}
        </div>

        {recentSteps.length > 0 && (
          <div style={{ padding: "18px 24px 24px" }}>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "11px", fontWeight: 600, color: palette.textFaint, letterSpacing: "0.3px", marginBottom: "10px" }}>
              {t('tracking.recent_activity') || "Dernières étapes"}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {recentSteps.map((step, i) => {
                const stepEtat = step.etatapres || step.etat || "UNKNOWN";
                const stepConfig = getEtatStyle(stepEtat);
                const dt = formatDateTime(step.dateOperation);
                return (
                  <div key={step.id || i} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: stepConfig.color, flexShrink: 0 }} />
                    <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", fontWeight: 600, color: stepConfig.color }}>
                      {t(`tracking.etat.${stepEtat}`, stepEtat)}
                    </span>
                    {dt && <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: palette.textFaint, marginLeft: "auto" }}>{dt}</span>}
                  </div>
                );
              })}
            </div>
            <button
              onClick={() => { onClose(); onOpenJournal(); }}
              style={{ marginTop: "16px", width: "100%", padding: "12px", borderRadius: "12px", border: "none", background: palette.teal, color: "#FFFFFF", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
            >
              {t('tracking.view_full_journal') || "Voir tout l'historique"}
              <Icons.ArrowUpRight size={14} color="#FFFFFF" />
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

export default function TrackingPage() {
  const { t, i18n } = useTranslation();
  const [searchValue, setSearchValue] = useState("");
  const [item, setItem] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedHistoryId, setSelectedHistoryId] = useState(null);
  const [showJournal, setShowJournal] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const { getLingeByCode, getHistorique, isRfidMode } = useContext(LingeContext);
  const scanInputRef = useRef(null);
  const [isFocused, setIsFocused] = useState(true);
  const location = useLocation();

  const { services } = useContext(ServiceContext);
  const [chambres, setChambres] = useState([]);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_URL}/api/sqlserver/chambres?page=0&size=300`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        const list = data?.content || data;
        setChambres(Array.isArray(list) ? list.map((c) => ({ id: c.Id ?? c.id, code: c.Code ?? c.code, serviceId: c.ServiceId ?? c.serviceId })) : []);
      })
      .catch((err) => { if (err.name !== "AbortError") console.error("Erreur chargement chambres:", err); });
    return () => controller.abort();
  }, []);

  const itemChambre = useMemo(() => (item ? resolveChambre(item, chambres) : null), [item, chambres]);
  const itemServiceName = useMemo(() => (item ? resolveService(item, services, itemChambre) : null), [item, services, itemChambre]);

  const currentStation = item ? ETAT_TO_STATION[item.etat] : null;

  const performSearch = useCallback(async (code, silent = false) => {
    if (!silent) { setLoading(true); setError(""); setItem(null); setHistory([]); }
    try {
      const foundItem = await getLingeByCode(code);
      if (foundItem) {
        setItem(foundItem);
        const hist = await getHistorique(code);
        setHistory(hist || []);
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 4000);
      } else if (!silent) {
        setError(isRfidMode ? t('tracking.error_not_found_rfid') : t('tracking.error_not_found_barcode'));
      }
    } catch (err) {
      if (!silent) setError(t('tracking.error_connection'));
    } finally {
      if (!silent) setLoading(false);
    }
  }, [getHistorique, getLingeByCode, isRfidMode, t]);

  useEffect(() => {
    if (!autoRefresh || !item) return;
    // Fréquence du mode LIVE : Paramètres › Rafraîchissement
    const interval = setInterval(() => performSearch(item.codeBarre, true), (Number(getSetting("refresh.trackingSeconds")) || 10) * 1000);
    return () => clearInterval(interval);
  }, [autoRefresh, item, performSearch]);

  const handleReset = () => {
    setSearchValue(""); setItem(null); setHistory([]); setError("");
    setLoading(false); setIsAnimating(false); setSelectedHistoryId(null); setShowDetail(false);
    if (scanInputRef.current) scanInputRef.current.focus();
  };

  useEffect(() => {
    const focusInput = () => {
      if (scanInputRef.current && document.activeElement !== scanInputRef.current) {
        scanInputRef.current.focus(); setIsFocused(true);
      }
    };
    focusInput();
    const handleBodyClick = (e) => {
      const selection = window.getSelection();
      if (selection && selection.toString().length > 0) return;
      if (e.target.closest("button, input, select, a, [data-no-refocus]")) return;
      focusInput();
    };
    document.addEventListener("click", handleBodyClick);
    return () => document.removeEventListener("click", handleBodyClick);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get("code");
    if (code) {
      const cleanCode = code.trim().replace(/\s/g, "").toUpperCase();
      setSearchValue(cleanCode);
      performSearch(cleanCode);
    }
  }, [location.search, performSearch]);

  useEffect(() => {
    if (searchValue.trim().length >= (Number(getSetting("scan.minLength")) || 3)) {
      const timer = setTimeout(() => performSearch(searchValue.trim()), Number(getSetting("scan.delayMs")) || 400);
      return () => clearTimeout(timer);
    }
  }, [searchValue, performSearch]);

  const handleSearch = (e) => {
    e.preventDefault();
    const cleanCode = searchValue.trim().replace(/\s/g, "").toUpperCase();
    if (!cleanCode) return;
    performSearch(cleanCode);
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100vh", overflow: "hidden", background: palette.bg, fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        ${FONTS_IMPORT}
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(100,116,139,0.25); border-radius: 8px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(100,116,139,0.4); }
      `}</style>

      <div style={{ position: "absolute", inset: 0, padding: "20px" }}>
        <StationMap currentStation={currentStation} history={history} isAnimating={isAnimating} t={t} i18n={i18n} onStationClick={() => setShowDetail(true)} />
      </div>

      <motion.div
        initial={{ y: -100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        style={{ position: "absolute", top: "40px", left: "40px", right: "40px", zIndex: 100, display: "flex", alignItems: "center", gap: "16px" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 20px", borderRadius: "16px", background: palette.surface, backdropFilter: "blur(20px)", border: `1px solid ${palette.border}`, boxShadow: "0 20px 48px rgba(15,23,42,0.10)" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: isRfidMode ? "linear-gradient(135deg, #A78BFA, #7C3AED)" : `linear-gradient(135deg, ${palette.teal}, #0F766E)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {isRfidMode ? <Icons.Rfid size={20} color="#FFFFFF" /> : <Icons.QrCode size={20} color="#FFFFFF" />}
          </div>
          <div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "15px", fontWeight: 700, color: palette.textPrimary, lineHeight: 1 }}>
              {t('tracking.title_3d') || "Suivi du linge"}
            </div>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: "10px", color: palette.textMuted, marginTop: "4px", display: "flex", alignItems: "center", gap: "5px" }}>
              <span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", background: isFocused ? palette.teal : palette.textFaint }} />
              {isFocused ? t('tracking.scan_ready') : t('tracking.waiting')}
            </div>
          </div>
        </div>

        <div style={{ flex: 1, maxWidth: "500px" }}>
          <form onSubmit={handleSearch} style={{ margin: 0 }}>
            <div style={{ position: "relative", display: "flex", alignItems: "center", gap: "10px", padding: "8px 8px 8px 16px", borderRadius: "16px", background: palette.surface, backdropFilter: "blur(20px)", border: `1.5px solid ${isFocused ? palette.teal + "50" : palette.border}`, boxShadow: isFocused ? `0 20px 48px ${palette.teal}18` : "0 20px 48px rgba(15,23,42,0.08)", transition: "all 0.2s" }}>
              <div style={{ color: palette.textMuted, display: "flex" }}>
                {isRfidMode ? <Icons.Rfid size={16} /> : <Icons.Search size={16} />}
              </div>
              <input
                ref={scanInputRef}
                type="text"
                placeholder={isRfidMode ? t('tracking.search_placeholder_rfid') : t('tracking.search_placeholder_barcode')}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                style={{ flex: 1, padding: "8px 0", border: "none", background: "transparent", fontFamily: "'IBM Plex Mono', monospace", fontSize: "14px", outline: "none", color: palette.textPrimary }}
                autoFocus
              />
              {searchValue && (
                <button type="button" onClick={() => setSearchValue("")} style={{ background: "none", border: "none", cursor: "pointer", color: palette.textMuted, padding: "6px", display: "flex" }}>
                  <Icons.Trash size={14} />
                </button>
              )}
              <Button type="submit" disabled={loading || !searchValue.trim()} style={{ padding: "8px 16px", borderRadius: "10px", border: "none", background: !searchValue.trim() || loading ? palette.surfaceRaised : `linear-gradient(135deg, ${palette.teal}, #0F766E)`, color: !searchValue.trim() || loading ? palette.textFaint : "#FFFFFF", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "12px", cursor: !searchValue.trim() || loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                {loading ? <Icons.Refresh size={12} className="animate-spin" /> : <Icons.Search size={12} />}
                {loading ? t('tracking.searching') : t('tracking.search_button')}
              </Button>
            </div>
          </form>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <motion.button
            type="button" onClick={() => setAutoRefresh(!autoRefresh)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            style={{
              padding: "12px 20px", borderRadius: "16px", border: `1px solid ${autoRefresh ? "transparent" : palette.border}`,
              background: autoRefresh ? `linear-gradient(135deg, ${palette.teal}, #0F766E)` : palette.surface, backdropFilter: "blur(20px)",
              color: autoRefresh ? "#FFFFFF" : palette.textMuted, cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "12px",
              display: "flex", alignItems: "center", gap: "8px", boxShadow: autoRefresh ? `0 16px 36px ${palette.teal}30` : "0 20px 48px rgba(15,23,42,0.08)",
            }}
          >
            <motion.div animate={autoRefresh ? { scale: [1, 1.3, 1], opacity: [1, 0.4, 1] } : {}} transition={{ duration: 1.5, repeat: autoRefresh ? Infinity : 0 }}
              style={{ width: "8px", height: "8px", borderRadius: "50%", background: autoRefresh ? "#FFFFFF" : palette.textFaint }} />
            <Icons.Zap size={14} />
            {autoRefresh ? "LIVE" : "OFF"}
          </motion.button>

          <motion.button
            type="button" onClick={handleReset} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            style={{ padding: "12px 16px", borderRadius: "16px", border: `1px solid ${palette.border}`, background: palette.surface, backdropFilter: "blur(20px)", color: palette.textMuted, cursor: "pointer", display: "flex", alignItems: "center", boxShadow: "0 20px 48px rgba(15,23,42,0.08)" }}
          >
            <Icons.Refresh size={16} />
          </motion.button>
        </div>
      </motion.div>

      <AnimatePresence>
        {item && (
          <motion.div
            data-no-refocus
            initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} transition={{ type: "spring", stiffness: 200 }}
            onClick={() => setShowDetail(true)}
            whileHover={{ y: -3 }}
            style={{
              position: "absolute", bottom: "40px", left: "40px", padding: "16px 20px", borderRadius: "20px",
              background: palette.surface, backdropFilter: "blur(20px)", border: `1px solid ${palette.border}`,
              boxShadow: "0 24px 56px rgba(15,23,42,0.12)", display: "flex", alignItems: "center", gap: "16px",
              zIndex: 100, minWidth: "340px", cursor: "pointer",
            }}
          >
            <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: `linear-gradient(135deg, ${palette.teal}, #0F766E)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icons.Tshirt size={24} color="#FFFFFF" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, fontSize: "17px", color: palette.textPrimary, letterSpacing: "0.4px" }}>
                {item.codeBarre || "N/A"}
              </div>
              <div style={{ color: palette.textMuted, fontFamily: "'Inter', sans-serif", fontSize: "11px", marginTop: "2px" }}>
                #{item.id} · {item.categorie || t('tracking.category')}
              </div>
            </div>
            {(() => {
              const cfg = getEtatStyle(item.etat);
              return (
                <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 12px", borderRadius: "10px", background: cfg.bg, color: cfg.color, fontFamily: "'Space Grotesk', sans-serif", fontSize: "11px", fontWeight: 600, border: `1px solid ${cfg.color}30` }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: cfg.color }} />
                  {t(`tracking.etat.${item.etat}`, item.etat)}
                </div>
              );
            })()}
            <div style={{ color: palette.textFaint, display: "flex", paddingLeft: "4px" }}>
              <Icons.ArrowUpRight size={14} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {item && !showJournal && (
          <motion.button
            type="button" onClick={() => setShowJournal(true)}
            initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            style={{
              position: "absolute", bottom: "40px", right: "40px", padding: "16px 24px", borderRadius: "20px", border: "none",
              background: `linear-gradient(135deg, ${palette.teal}, #0F766E)`, color: "#FFFFFF", cursor: "pointer",
              fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "13px", display: "flex", alignItems: "center", gap: "10px",
              boxShadow: `0 24px 56px ${palette.teal}35`, zIndex: 100,
            }}
          >
            <Icons.Activity size={18} />
            {t('tracking.journal')}
            <div style={{ padding: "2px 8px", borderRadius: "8px", background: "rgba(255,255,255,0.25)", fontSize: "11px", fontWeight: 800 }}>
              {history.length}
            </div>
            <Icons.ChevronLeft size={16} />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showJournal && item && (
          <motion.div
            initial={{ x: 400, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 400, opacity: 0 }} transition={{ type: "spring", stiffness: 250, damping: 30 }}
            style={{
              position: "absolute", top: "120px", bottom: "40px", right: "40px", width: "380px", borderRadius: "20px",
              background: palette.surface, backdropFilter: "blur(20px)", border: `1px solid ${palette.border}`,
              boxShadow: "0 24px 56px rgba(15,23,42,0.12)", zIndex: 110, display: "flex", flexDirection: "column", overflow: "hidden",
            }}
          >
            <div style={{ padding: "20px 22px", borderBottom: `1px solid ${palette.border}`, display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: `linear-gradient(135deg, ${palette.teal}, #0F766E)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icons.Activity size={18} color="#FFFFFF" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "15px", fontWeight: 700, color: palette.textPrimary }}>
                  {t('tracking.journal')}
                </div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", color: palette.textMuted, marginTop: "2px" }}>
                  {history.length} {t('tracking.steps')}
                </div>
              </div>
              <button onClick={() => setShowJournal(false)} style={{ width: "36px", height: "36px", borderRadius: "10px", border: `1px solid ${palette.border}`, background: palette.surfaceRaised, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: palette.textMuted }}>
                <Icons.ChevronRight size={16} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
              {history.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px", color: palette.textFaint }}>
                  <Icons.Inbox size={40} color={palette.textFaint} />
                  <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: "13px", marginTop: "8px" }}>
                    {t('tracking.no_history')}
                  </p>
                </div>
              ) : (
                <JournalList history={history} t={t} selectedId={selectedHistoryId} onItemClick={(step) => setSelectedHistoryId(step.id === selectedHistoryId ? null : step.id)} />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDetail && item && (
          <ItemDetailModal item={item} history={history} chambre={itemChambre} serviceName={itemServiceName} onClose={() => setShowDetail(false)} onOpenJournal={() => setShowJournal(true)} t={t} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
            style={{
              position: "absolute", top: "110px", left: "50%", transform: "translateX(-50%)", padding: "12px 20px", borderRadius: "12px",
              background: "#FFFFFF", backdropFilter: "blur(20px)", border: `1px solid ${palette.rose}30`, color: palette.rose,
              display: "flex", alignItems: "center", gap: "10px", fontFamily: "'Inter', sans-serif", fontSize: "13px", fontWeight: 600, zIndex: 100,
              boxShadow: "0 20px 48px rgba(225,29,72,0.12)",
            }}
          >
            <Icons.Alert size={16} />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!item && !error && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{
              position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center", padding: "40px",
              borderRadius: "24px", background: palette.surface, backdropFilter: "blur(20px)", border: `1px solid ${palette.border}`,
              boxShadow: "0 24px 56px rgba(15,23,42,0.1)", zIndex: 90, maxWidth: "480px",
            }}
          >
            <motion.div animate={{ y: [-4, 4, -4] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              style={{ width: "76px", height: "76px", borderRadius: "20px", background: palette.surfaceRaised, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              {isRfidMode ? <Icons.Rfid size={32} color={palette.textMuted} /> : <Icons.QrCode size={32} color={palette.textMuted} />}
            </motion.div>
            <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "19px", fontWeight: 700, color: palette.textPrimary, marginBottom: "8px" }}>
              {isRfidMode ? t('tracking.subtitle_rfid') : t('tracking.subtitle_barcode')}
            </h3>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: palette.textMuted, margin: 0 }}>
              {isRfidMode ? t('tracking.empty_rfid') : t('tracking.empty_barcode')}
            </p>
            <motion.div animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 2, repeat: Infinity }}
              style={{ marginTop: "20px", display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 16px", borderRadius: "20px", background: palette.tealSoft, border: `1px solid ${palette.teal}25`, color: palette.teal, fontFamily: "'Space Grotesk', sans-serif", fontSize: "11px", fontWeight: 600 }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: palette.teal }} />
              {t('tracking.scanner_ready') || "Scanner prêt"}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}