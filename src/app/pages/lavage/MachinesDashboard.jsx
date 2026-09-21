// pages/Machines/MachinesDashboard.jsx
import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { useMachineContext } from "../../contextes/MachineContext";
import { Badge } from "../../components/ui/badge";
import "../Linge/WorkflowList.css";

//const REFRESH_MS = 5000;
const REFRESH_MS = 5000000;



const Icons = {
  Wash: ({ size = 20, color = "currentColor", strokeWidth = 1.8 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <circle cx="12" cy="14" r="4" />
      <path d="M7 6h.01" /><path d="M11 6h.01" />
    </svg>
  ),
  Wind: ({ size = 20, color = "currentColor", strokeWidth = 1.8 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.59 4.59A2 2 0 1 1 11 8H2" />
      <path d="M17.73 7.73A2.5 2.5 0 1 1 19.5 12H2" />
      <path d="M12.59 19.41A2 2 0 1 0 14 16H2" />
    </svg>
  ),
  Combined: ({ size = 20, color = "currentColor", strokeWidth = 1.8 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M8 8l8 8M16 8l-8 8" />
    </svg>
  ),
  Play: ({ size = 14, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="6 3 20 12 6 21 6 3" fill={color} />
    </svg>
  ),
  Stop: ({ size = 14, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="5" width="14" height="14" rx="1.5" fill={color} />
    </svg>
  ),
  Clock: ({ size = 14, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  Weight: ({ size = 14, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
      <path d="M6 21V10a6 6 0 0 1 12 0v11" />
    </svg>
  ),
  Thermometer: ({ size = 14, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
    </svg>
  ),
  Layers: ({ size = 14, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  ),
  Gauge: ({ size = 14, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 14l4-4" />
      <path d="M3.34 19a10 10 0 1 1 17.32 0" />
    </svg>
  ),
  History: ({ size = 14, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l4 2" />
    </svg>
  ),
  Arrow: ({ size = 12, color = "currentColor", strokeWidth = 2, direction = "right" }) => {
    const rotations = { right: 0, down: 90, left: 180, up: 270 };
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={{ transform: `rotate(${rotations[direction]}deg)` }}>
        <path d="M5 12h14M13 6l6 6-6 6" />
      </svg>
    );
  },
  Check: ({ size = 12, color = "currentColor", strokeWidth = 2.5 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Cross: ({ size = 16, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  ),
  Refresh: ({ size = 14, color = "currentColor", strokeWidth = 2, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  ),
  Wrench: ({ size = 20, color = "currentColor", strokeWidth = 1.8 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  ),
  Server: ({ size = 24, color = "currentColor", strokeWidth = 1.8 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="6" rx="2" />
      <rect x="2" y="15" width="20" height="6" rx="2" />
      <line x1="6" y1="6" x2="6.01" y2="6" />
      <line x1="6" y1="18" x2="6.01" y2="18" />
    </svg>
  ),
  Zap: ({ size = 12, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  CircleDot: ({ size = 12, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" fill={color} />
    </svg>
  ),
  AlertTriangle: ({ size = 20, color = "currentColor", strokeWidth = 1.8 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  Biohazard: ({ size = 20, color = "currentColor", strokeWidth = 1.8 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="11" r="2" />
      <path d="M12 7V4" />
      <path d="M9.5 17a5.5 5.5 0 0 1-4.7-2.7" />
      <path d="M19.2 14.3A5.5 5.5 0 0 1 14.5 17" />
      <path d="M7 9.5a5.5 5.5 0 0 1 4.5-2.2" />
      <path d="M12.5 7.3a5.5 5.5 0 0 1 4.5 2.2" />
    </svg>
  ),
};

// ═══════════════════════════════════════════════════════════════════════════
// 🎨 THEME & CONFIG
// ═══════════════════════════════════════════════════════════════════════════

const THEME = {
  LINGE_NORMAL: {
    label: "Linge Normal",
    short: "Normal",
    primary: "#0ea5e9",
    gradient: "linear-gradient(135deg, #0ea5e9, #0284c7)",
    light: "#e0f2fe",
    border: "#bae6fd",
    textDark: "#0369a1",
    glow: "rgba(14, 165, 233, 0.3)",
    Icon: Icons.Wash,
  },
  LINGES_INFECTE: {
    label: "Linge Infecté",
    short: "Infecté",
    primary: "#dc2626",
    gradient: "linear-gradient(135deg, #dc2626, #b91c1c)",
    light: "#fee2e2",
    border: "#fca5a5",
    textDark: "#991b1b",
    glow: "rgba(220, 38, 38, 0.3)",
    Icon: Icons.Biohazard,
  },
};

const ETAT_CFG = {
  DISPONIBLE: { label: "Disponible", color: "#10b981", bg: "#ecfdf5" },
  EN_COURS: { label: "En cours", color: "#7c3aed", bg: "#f5f3ff" },
  EN_PAUSE: { label: "En pause", color: "#f59e0b", bg: "#fffbeb" },
  EN_PANNE: { label: "En panne", color: "#ef4444", bg: "#fef2f2" },
  MAINTENANCE: { label: "Maintenance", color: "#64748b", bg: "#f1f5f9" },
};

// ═══════════════════════════════════════════════════════════════════════════
// 🎯 COMPOSANT : Circular Progress
// ═══════════════════════════════════════════════════════════════════════════

function CircularProgress({ value, max, size = 80, strokeWidth = 6, color, label, subLabel }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min((value / max) * 100, 100);
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            strokeLinecap="round"
          />
        </svg>
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "16px",
              fontWeight: 800,
              color: "#0f172a",
              fontFeatureSettings: "'tnum'",
            }}
          >
            {Math.round(percentage)}%
          </div>
          <div style={{ fontSize: "9px", color: "#94a3b8", fontWeight: 600 }}>{label}</div>
        </div>
      </div>
      {subLabel && (
        <div style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 500 }}>{subLabel}</div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ⏱️ COMPOSANT : Minuterie
// ═══════════════════════════════════════════════════════════════════════════

function Minuterie({ dateDebut }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!dateDebut) return;
    const tick = () => setElapsed(Math.floor((Date.now() - new Date(dateDebut)) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [dateDebut]);

  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  const p = (n) => String(n).padStart(2, "0");

  return (
    <span
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontWeight: 700,
        fontSize: "16px",
        color: "#7c3aed",
        fontFeatureSettings: "'tnum'",
        letterSpacing: "0.5px",
      }}
    >
      {h > 0 && `${p(h)}:`}{p(m)}:{p(s)}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 🎴 COMPOSANT : Carte Machine
// ═══════════════════════════════════════════════════════════════════════════

function CarteMachine({ machine, cycles, onClick, onTerminer }) {
  const { t } = useTranslation();

  const categorie = machine.categorie || "LINGE_NORMAL";
  const theme = THEME[categorie] || THEME.LINGE_NORMAL;
  const MachineIcon = theme.Icon;
  const etatCfg = ETAT_CFG[machine.etatImmobilisation] || ETAT_CFG.DISPONIBLE;
  const enCours = machine.etatImmobilisation === "EN_COURS";
  const disponible = machine.etatImmobilisation === "DISPONIBLE";

  const cycleActif = cycles?.find((c) => c.machine?.id === machine.id && c.statut === "EN_COURS");
  const cyclesRecents = cycles?.filter((c) => c.machine?.id === machine.id && c.statut === "TERMINE").slice(0, 3) || [];

  const pctPoids = machine.capaciteKg
    ? Math.min(((machine.poidsActuel || 0) / machine.capaciteKg) * 100, 100)
    : 0;

  const dureeMax = cycleActif?.programmeLavage?.dureeMinutes * 60 || 1800;
  const dureeEcoulee = cycleActif?.dureeEcoulee || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      onClick={() => onClick(machine)}
      style={{
        borderRadius: "20px",
        overflow: "hidden",
        cursor: "pointer",
        background: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: `1.5px solid ${enCours ? theme.border : "#e2e8f0"}`,
        boxShadow: enCours
          ? `0 8px 32px ${theme.glow}, 0 2px 8px rgba(15, 23, 42, 0.04)`
          : "0 2px 8px rgba(15, 23, 42, 0.04)",
        transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        position: "relative",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = enCours
          ? `0 12px 48px ${theme.glow}, 0 4px 12px rgba(15, 23, 42, 0.06)`
          : "0 8px 24px rgba(15, 23, 42, 0.08)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = enCours
          ? `0 8px 32px ${theme.glow}, 0 2px 8px rgba(15, 23, 42, 0.04)`
          : "0 2px 8px rgba(15, 23, 42, 0.04)";
      }}
    >
      {/* Halo en cours */}
      {enCours && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "3px",
            background: theme.gradient,
            zIndex: 2,
          }}
        />
      )}

      {/* Badge état */}
      <div
        style={{
          position: "absolute",
          top: "14px",
          right: "14px",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          background: "white",
          padding: "4px 12px 4px 10px",
          borderRadius: "20px",
          boxShadow: "0 2px 8px rgba(15, 23, 42, 0.08)",
          zIndex: 2,
          fontSize: "10px",
          fontWeight: 700,
          color: etatCfg.color,
          border: `1px solid ${etatCfg.color}25`,
        }}
      >
        <motion.div
          animate={enCours ? { scale: [1, 1.3, 1], opacity: [1, 0.5, 1] } : {}}
          transition={{ duration: 1.5, repeat: enCours ? Infinity : 0 }}
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: etatCfg.color,
            boxShadow: enCours ? `0 0 8px ${etatCfg.color}80` : "none",
          }}
        />
        {t(`machine_status.${machine.etatImmobilisation}`, etatCfg.label)}
      </div>

      {/* En-tête */}
      <div
        style={{
          padding: "18px 20px 14px",
          display: "flex",
          alignItems: "center",
          gap: "14px",
          borderBottom: `1px solid ${enCours ? theme.border + "80" : "#f1f5f9"}`,
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            width: "52px",
            height: "52px",
            borderRadius: "14px",
            background: enCours ? theme.gradient : theme.light,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.3s",
            boxShadow: enCours ? `0 4px 16px ${theme.glow}` : "none",
          }}
        >
          <MachineIcon size={26} color={enCours ? "white" : theme.primary} strokeWidth={2} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontWeight: 800,
              fontSize: "18px",
              color: "#0f172a",
              letterSpacing: "-0.4px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            {machine.code}
            {enCours && (
              <span
                style={{
                  fontSize: "9px",
                  fontWeight: 700,
                  color: theme.primary,
                  background: `${theme.primary}15`,
                  padding: "2px 10px",
                  borderRadius: "10px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                <Icons.Zap size={8} color={theme.primary} style={{ marginRight: "3px", display: "inline" }} />
                {t('machines_dashboard.status_in_progress')}
              </span>
            )}
          </div>
          <div
            style={{
              fontSize: "11px",
              color: "#94a3b8",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              flexWrap: "wrap",
              marginTop: "2px",
              fontWeight: 500,
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              {theme.short}
            </span>
            <span style={{ width: "3px", height: "3px", borderRadius: "50%", background: "#cbd5e1" }} />
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <Icons.Weight size={11} color="#94a3b8" /> {machine.capaciteKg} kg
            </span>
            {cycleActif && (
              <>
                <span style={{ width: "3px", height: "3px", borderRadius: "50%", background: "#cbd5e1" }} />
                <span style={{ display: "flex", alignItems: "center", gap: "4px", color: theme.primary, fontWeight: 700 }}>
                  <Icons.CircleDot size={10} color={theme.primary} />
                  {t('machines_dashboard.status_cycle', { id: cycleActif.id })}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Corps */}
      <div style={{ padding: "16px 20px 20px", position: "relative", zIndex: 1 }}>
        {/* Barre de poids */}
        <div style={{ marginBottom: "14px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "11px",
              marginBottom: "6px",
            }}
          >
            <span style={{ color: "#64748b", display: "flex", alignItems: "center", gap: "4px", fontWeight: 600 }}>
              <Icons.Gauge size={12} color="#64748b" /> {t('machines_dashboard.load')}
            </span>
            <span
              style={{
                fontWeight: 800,
                color: pctPoids >= 90 ? "#ef4444" : "#0f172a",
                fontFeatureSettings: "'tnum'",
              }}
            >
              {machine.poidsActuel?.toFixed(1) || 0} / {machine.capaciteKg} kg
            </span>
          </div>
          <div
            style={{
              height: "8px",
              background: "#f1f5f9",
              borderRadius: "10px",
              overflow: "hidden",
              boxShadow: "inset 0 1px 2px rgba(0,0,0,0.04)",
            }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(pctPoids, 100)}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              style={{
                height: "100%",
                borderRadius: "10px",
                background:
                  pctPoids >= 90
                    ? "linear-gradient(90deg, #ef4444, #dc2626)"
                    : `linear-gradient(90deg, ${theme.primary}, ${theme.primary}dd)`,
                boxShadow: `0 0 12px ${theme.primary}40`,
              }}
            />
          </div>
        </div>

        {/* Cycle actif */}
        {cycleActif && (
          <div
            style={{
              background: `linear-gradient(135deg, ${theme.light}, white)`,
              borderRadius: "14px",
              padding: "14px 16px",
              border: `1px solid ${theme.border}`,
              marginBottom: "14px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <CircularProgress
                value={dureeEcoulee}
                max={dureeMax}
                size={62}
                strokeWidth={5}
                color={theme.primary}
                label={t('machines_dashboard.status_cycle_progress')}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: "13px",
                    color: "#0f172a",
                    marginBottom: "4px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {cycleActif.programmeLavage?.nom || t('machines_dashboard.cycle_name')}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "11px",
                      color: "#64748b",
                    }}
                  >
                    <Icons.Clock size={11} color="#7c3aed" />
                    <Minuterie dateDebut={cycleActif.dateDebut} />
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "11px",
                      color: "#64748b",
                    }}
                  >
                    <Icons.Thermometer size={11} color="#ef4444" />
                    <span>{cycleActif.programmeLavage?.temperatureCelsius || 0}°C</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "11px",
                      color: "#64748b",
                    }}
                  >
                    <Icons.Layers size={11} color="#8b5cf6" />
                    <span>{cycleActif.items?.length || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Historique récent */}
        {cyclesRecents.length > 0 && !enCours && (
          <div style={{ marginBottom: "12px" }}>
            <div
              style={{
                fontSize: "9px",
                color: "#94a3b8",
                textTransform: "uppercase",
                letterSpacing: "0.8px",
                marginBottom: "6px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontWeight: 700,
              }}
            >
              <Icons.History size={10} color="#94a3b8" />
              {t('machines_dashboard.status_recent_cycles')}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
              {cyclesRecents.map((cycle, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "3px 10px",
                    borderRadius: "10px",
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    fontSize: "10px",
                    fontWeight: 700,
                    color: "#15803d",
                  }}
                >
                  <Icons.Check size={8} color="#15803d" />
                  {cycle.programmeLavage?.nom || t('machines_dashboard.cycle_name')}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Message disponible */}
        {disponible && !cycleActif && (
          <div
            style={{
              textAlign: "center",
              padding: "12px 0",
              background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
              borderRadius: "12px",
              border: "1px solid #bbf7d0",
            }}
          >
            <div
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "#10b981",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
              }}
            >
              <motion.span
                animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{
                  display: "inline-block",
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "#10b981",
                  boxShadow: "0 0 8px #10b981",
                }}
              />
              {t('machines_dashboard.status_available')}
            </div>
            <div style={{ fontSize: "10px", color: "#64748b", marginTop: "2px", fontWeight: 500 }}>
              {t('machines_dashboard.status_available_capacity', {
                capacity: (machine.capaciteKg - (machine.poidsActuel || 0)).toFixed(1),
              })}
            </div>
          </div>
        )}

        {/* Message non disponible */}
        {!enCours && !disponible && (
          <div
            style={{
              textAlign: "center",
              padding: "12px 0",
              background: etatCfg.bg,
              borderRadius: "12px",
              border: `1px solid ${etatCfg.color}30`,
            }}
          >
            <div
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: etatCfg.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
              }}
            >
              <Icons.AlertTriangle size={14} color={etatCfg.color} />
              {t(`machine_status.${machine.etatImmobilisation}`, etatCfg.label)}
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ marginTop: "12px", display: "flex", gap: "8px" }}>
          {disponible && (
            <Link
              to="/Lavages"
              state={{ machinePreconfigured: machine.code }}
              onClick={(e) => e.stopPropagation()}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                padding: "10px 16px",
                borderRadius: "10px",
                background: theme.gradient,
                color: "white",
                fontWeight: 700,
                fontSize: "12px",
                textDecoration: "none",
                transition: "all 0.3s",
                boxShadow: `0 4px 12px ${theme.glow}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = `0 8px 20px ${theme.glow}`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = `0 4px 12px ${theme.glow}`;
              }}
            >
              <Icons.Play size={12} color="white" />
              {t('machines_dashboard.btn_start')}
            </Link>
          )}

          {enCours && cycleActif && (
            <>
              <Link
                to="/Lavages"
                state={{ cycleId: cycleActif.id }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  padding: "10px 16px",
                  borderRadius: "10px",
                  background: "white",
                  color: theme.textDark,
                  fontWeight: 700,
                  fontSize: "12px",
                  textDecoration: "none",
                  border: `1.5px solid ${theme.border}`,
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = theme.light;
                  e.currentTarget.style.borderColor = theme.primary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "white";
                  e.currentTarget.style.borderColor = theme.border;
                }}
              >
                <Icons.Arrow size={11} color={theme.textDark} />
                {t('machines_dashboard.btn_manage')}
              </Link>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (cycleActif?.id) onTerminer(cycleActif.id);
                }}
                style={{
                  padding: "10px 16px",
                  borderRadius: "10px",
                  border: "none",
                  background: "linear-gradient(135deg, #ef4444, #dc2626)",
                  color: "white",
                  fontWeight: 700,
                  fontSize: "12px",
                  cursor: "pointer",
                  transition: "all 0.3s",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.05)";
                  e.currentTarget.style.boxShadow = "0 8px 20px rgba(239, 68, 68, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(239, 68, 68, 0.3)";
                }}
              >
                <Icons.Stop size={12} color="white" />
                {t('machines_dashboard.btn_finish')}
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 🪟 COMPOSANT : Modal Machine
// ═══════════════════════════════════════════════════════════════════════════

function ModalMachine({ machine, cycles, onFermer, onTerminer }) {
  const { t } = useTranslation();

  if (!machine) return null;
  const categorie = machine.categorie || "LINGE_NORMAL";
  const theme = THEME[categorie] || THEME.LINGE_NORMAL;
  const MachineIcon = theme.Icon;
  const enCours = machine.etatImmobilisation === "EN_COURS";
  const cycleActif = cycles?.find((c) => c.machine?.id === machine.id && c.statut === "EN_COURS");
  const cyclesTermines = cycles?.filter((c) => c.machine?.id === machine.id && c.statut === "TERMINE") || [];

  const dureeMax = cycleActif?.programmeLavage?.dureeMinutes * 60 || 1800;
  const dureeEcoulee = cycleActif?.dureeEcoulee || 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, 0.7)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "20px",
        }}
        onClick={onFermer}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 30 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: "white",
            borderRadius: "24px",
            overflow: "hidden",
            maxWidth: "560px",
            width: "100%",
            maxHeight: "90vh",
            overflowY: "auto",
            boxShadow: "0 32px 80px rgba(0, 0, 0, 0.35)",
          }}
        >
          {/* Header */}
          <div
            style={{
              background: theme.gradient,
              padding: "24px 28px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "14px",
                  background: "rgba(255, 255, 255, 0.2)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MachineIcon size={26} color="white" strokeWidth={2} />
              </div>
              <div>
                <div
                  style={{
                    color: "white",
                    fontWeight: 800,
                    fontSize: "22px",
                    letterSpacing: "-0.3px",
                  }}
                >
                  {machine.code}
                </div>
                <div
                  style={{
                    color: "rgba(255, 255, 255, 0.85)",
                    fontSize: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginTop: "2px",
                  }}
                >
                  <span>{theme.label}</span>
                  <span
                    style={{
                      width: "3px",
                      height: "3px",
                      borderRadius: "50%",
                      background: "rgba(255, 255, 255, 0.5)",
                    }}
                  />
                  <span>{machine.capaciteKg} kg</span>
                  {enCours && (
                    <>
                      <span
                        style={{
                          width: "3px",
                          height: "3px",
                          borderRadius: "50%",
                          background: "rgba(255, 255, 255, 0.5)",
                        }}
                      />
                      <span>{t('machines_dashboard.status_in_progress')}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onFermer}
              style={{
                background: "rgba(255, 255, 255, 0.15)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "12px",
                width: "36px",
                height: "36px",
                cursor: "pointer",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icons.Cross size={16} color="white" />
            </motion.button>
          </div>

          {/* Contenu */}
          <div style={{ padding: "24px 28px" }}>
            {/* Cycle actif */}
            {enCours && cycleActif && (
              <div
                style={{
                  marginBottom: "20px",
                  padding: "20px",
                  background: `linear-gradient(135deg, ${theme.light}, white)`,
                  borderRadius: "16px",
                  border: `1px solid ${theme.border}`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                  <CircularProgress
                    value={dureeEcoulee}
                    max={dureeMax}
                    size={80}
                    strokeWidth={7}
                    color={theme.primary}
                    label={t('machines_dashboard.modal_loading')}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 800,
                        fontSize: "16px",
                        color: "#0f172a",
                        marginBottom: "6px",
                      }}
                    >
                      {cycleActif.programmeLavage?.nom || t('machines_dashboard.cycle_name')}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          fontSize: "14px",
                          color: "#7c3aed",
                          fontWeight: 700,
                        }}
                      >
                        <Icons.Clock size={14} color="#7c3aed" />
                        <Minuterie dateDebut={cycleActif.dateDebut} />
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: "12px",
                          fontSize: "12px",
                          color: "#64748b",
                          flexWrap: "wrap",
                        }}
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <Icons.Thermometer size={12} color="#ef4444" />
                          {cycleActif.programmeLavage?.temperatureCelsius || 0}°C
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <Icons.Clock size={12} color="#0ea5e9" />
                          {cycleActif.programmeLavage?.dureeMinutes || 0} min
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <Icons.Layers size={12} color="#8b5cf6" />
                          {cycleActif.items?.length || 0} {t('machines_dashboard.cycle_items')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onTerminer(cycleActif.id);
                    onFermer();
                  }}
                  style={{
                    marginTop: "16px",
                    padding: "12px 20px",
                    borderRadius: "12px",
                    border: "none",
                    background: "linear-gradient(135deg, #ef4444, #dc2626)",
                    color: "white",
                    fontWeight: 700,
                    fontSize: "13px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    boxShadow: "0 4px 16px rgba(239, 68, 68, 0.3)",
                    width: "100%",
                    justifyContent: "center",
                    transition: "all 0.3s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.02)";
                    e.currentTarget.style.boxShadow = "0 8px 24px rgba(239, 68, 68, 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.boxShadow = "0 4px 16px rgba(239, 68, 68, 0.3)";
                  }}
                >
                  <Icons.Stop size={14} color="white" />
                  {t('machines_dashboard.btn_terminate_cycle')}
                </button>
              </div>
            )}

            {/* Historique */}
            {cyclesTermines.length > 0 && (
              <div>
                <div
                  style={{
                    fontSize: "10px",
                    fontWeight: 800,
                    color: "#94a3b8",
                    marginBottom: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    textTransform: "uppercase",
                    letterSpacing: "0.8px",
                  }}
                >
                  <Icons.History size={14} color="#94a3b8" />
                  {t('machines_dashboard.modal_history')} · {cyclesTermines.length}
                </div>
                <div
                  style={{
                    maxHeight: "200px",
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  {cyclesTermines.slice(0, 10).map((cycle, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "10px 14px",
                        background: "#f8fafc",
                        borderRadius: "10px",
                        border: "1px solid #f1f5f9",
                        fontSize: "12px",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "white";
                        e.currentTarget.style.borderColor = "#cbd5e1";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#f8fafc";
                        e.currentTarget.style.borderColor = "#f1f5f9";
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Icons.Check size={12} color="#22c55e" />
                        <span style={{ fontWeight: 600, color: "#0f172a" }}>
                          {cycle.programmeLavage?.nom || t('machines_dashboard.cycle_name')}
                        </span>
                      </div>
                      <div style={{ color: "#94a3b8", fontSize: "11px", fontWeight: 600 }}>
                        {cycle.dateFin
                          ? new Date(cycle.dateFin).toLocaleTimeString("fr-FR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : ""}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Disponible */}
            {machine.etatImmobilisation === "DISPONIBLE" && (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  style={{
                    width: "72px",
                    height: "72px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #d1fae5, #a7f3d0)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 12px",
                    boxShadow: "0 8px 24px rgba(16, 185, 129, 0.25)",
                  }}
                >
                  <Icons.CircleDot size={32} color="#10b981" strokeWidth={2} />
                </motion.div>
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: "18px",
                    color: "#10b981",
                    marginBottom: "4px",
                  }}
                >
                  {t('machines_dashboard.modal_available')}
                </div>
                <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "20px" }}>
                  {t('machines_dashboard.modal_available_capacity', {
                    capacity: (machine.capaciteKg - (machine.poidsActuel || 0)).toFixed(1),
                  })}
                </div>
                <Link
                  to="/Lavages"
                  state={{ machinePreconfigured: machine.code }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "14px 32px",
                    borderRadius: "14px",
                    background: theme.gradient,
                    color: "white",
                    fontWeight: 700,
                    fontSize: "14px",
                    textDecoration: "none",
                    boxShadow: `0 4px 20px ${theme.glow}`,
                    transition: "all 0.3s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = `0 8px 32px ${theme.glow}`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = `0 4px 20px ${theme.glow}`;
                  }}
                >
                  <Icons.Play size={14} color="white" />
                  {t('machines_dashboard.btn_start_wash')}
                </Link>
              </div>
            )}

            {/* Non disponible */}
            {!enCours && machine.etatImmobilisation !== "DISPONIBLE" && (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div
                  style={{
                    width: "72px",
                    height: "72px",
                    borderRadius: "50%",
                    background:
                      machine.etatImmobilisation === "EN_PANNE" ? "#fee2e2" : "#f1f5f9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 12px",
                  }}
                >
                  <Icons.Wrench
                    size={32}
                    color={machine.etatImmobilisation === "EN_PANNE" ? "#dc2626" : "#64748b"}
                    strokeWidth={2}
                  />
                </div>
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: "18px",
                    color: machine.etatImmobilisation === "EN_PANNE" ? "#dc2626" : "#64748b",
                  }}
                >
                  {t(`machine_status.${machine.etatImmobilisation}`, machine.etatImmobilisation)}
                </div>
                {machine.observation && (
                  <div style={{ fontSize: "13px", color: "#94a3b8", marginTop: "4px" }}>
                    {machine.observation}
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 📊 COMPOSANT : Stat Card
// ═══════════════════════════════════════════════════════════════════════════

function StatCard({ icon, iconColor, iconBg, value, label, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -2 }}
      style={{
        background: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(12px)",
        borderRadius: "16px",
        padding: "16px 20px",
        border: "1px solid #e2e8f0",
        display: "flex",
        alignItems: "center",
        gap: "14px",
        transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        boxShadow: "0 1px 3px rgba(15, 23, 42, 0.02)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `0 8px 24px ${iconColor}15`;
        e.currentTarget.style.borderColor = `${iconColor}40`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 1px 3px rgba(15, 23, 42, 0.02)";
        e.currentTarget.style.borderColor = "#e2e8f0";
      }}
    >
      <div
        style={{
          width: "44px",
          height: "44px",
          borderRadius: "12px",
          background: iconBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: "22px",
            fontWeight: 800,
            color: iconColor,
            fontFeatureSettings: "'tnum'",
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
          }}
        >
          {value}
        </div>
        <div
          style={{
            fontSize: "11px",
            color: "#64748b",
            fontWeight: 600,
            marginTop: "2px",
          }}
        >
          {label}
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 🚀 PAGE PRINCIPALE
// ═══════════════════════════════════════════════════════════════════════════

export default function MachinesDashboard() {
  const { t } = useTranslation();

  const { machines, cycles, isLoading, lastRefresh, loadAllData, terminerCycle } =
    useMachineContext();

  const [machineSelectee, setMachineSelectee] = useState(null);
  const [filtre, setFiltre] = useState("TOUS");
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef(null);

  const rafraichir = useCallback(async () => {
    setLoading(true);
    try {
      await loadAllData();
    } finally {
      setLoading(false);
    }
  }, [loadAllData]);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      loadAllData();
    }, REFRESH_MS);
    return () => clearInterval(intervalRef.current);
  }, [loadAllData]);

  const handleTerminer = useCallback(
    async (cycleId) => {
      await terminerCycle(cycleId);
    },
    [terminerCycle]
  );

  const machinesNormal = useMemo(
    () =>
      machines.filter((m) => {
        const cat = m.categorie || "LINGE_NORMAL";
        return cat === "LINGE_NORMAL" || cat === "LINGES_NORMAL";
      }),
    [machines]
  );

  const machinesInfecte = useMemo(
    () =>
      machines.filter((m) => {
        const cat = m.categorie || "LINGE_NORMAL";
        return cat === "LINGES_INFECTE";
      }),
    [machines]
  );

  const machinesFiltrees =
    filtre === "TOUS"
      ? machines
      : filtre === "LINGE_NORMAL"
      ? machinesNormal
      : machinesInfecte;

  const cyclesEnCours = cycles?.filter((c) => c.statut === "EN_COURS") || [];
  const cyclesTermines = cycles?.filter((c) => c.statut === "TERMINE") || [];

  const stats = {
    totalNormal: machinesNormal.length,
    totalInfecte: machinesInfecte.length,
    disponibles: machines.filter((m) => m.etatImmobilisation === "DISPONIBLE").length,
    poidsTotal: machines.reduce((s, m) => s + (m.poidsActuel || 0), 0),
    cyclesEnCours: cyclesEnCours.length,
    cyclesTermines: cyclesTermines.length,
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
        padding: "32px 40px 48px",
        fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
        color: "#0f172a",
      }}
    >
      <div style={{ maxWidth: "1600px", margin: "0 auto" }}>
        {machineSelectee && (
          <ModalMachine
            machine={machineSelectee}
            cycles={cycles}
            onFermer={() => setMachineSelectee(null)}
            onTerminer={handleTerminer}
          />
        )}

        {/* ═══ HEADER ═══ */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "28px",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "16px",
                background: "linear-gradient(135deg, #0ea5e9, #0284c7)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 24px rgba(14, 165, 233, 0.3)",
              }}
            >
              <Icons.Server size={28} color="white" strokeWidth={2} />
            </motion.div>
            <div>
              <h1
                style={{
                  fontSize: "26px",
                  fontWeight: 800,
                  color: "#0f172a",
                  margin: 0,
                  letterSpacing: "-0.03em",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  lineHeight: 1.1,
                }}
              >
                {t('machines_dashboard.title')}
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    color: "#10b981",
                    background: "#dcfce7",
                    padding: "3px 10px",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  <motion.span
                    animate={{ opacity: [1, 0.4, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    style={{
                      display: "inline-block",
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: "#10b981",
                      boxShadow: "0 0 6px #10b981",
                    }}
                  />
                  {REFRESH_MS / 1000}s
                </span>
              </h1>
              <div
                style={{
                  fontSize: "12px",
                  color: "#64748b",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginTop: "4px",
                  fontWeight: 500,
                }}
              >
                <Icons.Gauge size={12} color="#0ea5e9" />
                <span>
                  {t('machines_dashboard.subtitle', {
                    enCours: stats.cyclesEnCours,
                    termines: stats.cyclesTermines,
                  })}
                </span>
                {lastRefresh && (
                  <span style={{ color: "#94a3b8" }}>
                    ·{" "}
                    {lastRefresh.toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={rafraichir}
              disabled={loading}
              style={{
                padding: "10px 18px",
                borderRadius: "12px",
                border: "1.5px solid #e2e8f0",
                background: "white",
                color: "#64748b",
                cursor: loading ? "wait" : "pointer",
                fontSize: "12px",
                fontWeight: 700,
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#f8fafc";
                e.currentTarget.style.borderColor = "#cbd5e1";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "white";
                e.currentTarget.style.borderColor = "#e2e8f0";
              }}
            >
              <Icons.Refresh size={14} color="#64748b" className={loading ? "animate-spin" : ""} />
              {t('machines_dashboard.refresh')}
            </motion.button>
            <Link
              to="/Lavages"
              style={{
                padding: "10px 20px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #0ea5e9, #0284c7)",
                color: "white",
                fontWeight: 700,
                fontSize: "12px",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 4px 16px rgba(14, 165, 233, 0.3)",
                transition: "all 0.3s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(14, 165, 233, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 16px rgba(14, 165, 233, 0.3)";
              }}
            >
              <Icons.Play size={12} color="white" />
              {t('machines_dashboard.new_wash')}
            </Link>
          </div>
        </motion.div>

        {/* ═══ STATS ═══ */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "14px",
            marginBottom: "24px",
          }}
        >
          <StatCard
            delay={0.0}
            icon={<Icons.Server size={20} color="#0ea5e9" strokeWidth={2} />}
            iconColor="#0ea5e9"
            iconBg="linear-gradient(135deg, #e0f2fe, #bae6fd)"
            value={machines.length}
            label={t('machines_dashboard.stats_machines')}
          />
          <StatCard
            delay={0.05}
            icon={<Icons.CircleDot size={20} color="#10b981" strokeWidth={2} />}
            iconColor="#10b981"
            iconBg="linear-gradient(135deg, #dcfce7, #bbf7d0)"
            value={stats.disponibles}
            label={t('machines_dashboard.stats_available')}
          />
          <StatCard
            delay={0.1}
            icon={<Icons.Gauge size={20} color="#7c3aed" strokeWidth={2} />}
            iconColor="#7c3aed"
            iconBg="linear-gradient(135deg, #faf5ff, #e9d5ff)"
            value={stats.cyclesEnCours}
            label={t('machines_dashboard.stats_cycles')}
          />
          <StatCard
            delay={0.15}
            icon={<Icons.Weight size={20} color="#f59e0b" strokeWidth={2} />}
            iconColor="#f59e0b"
            iconBg="linear-gradient(135deg, #fef3c7, #fde68a)"
            value={`${stats.poidsTotal.toFixed(1)} kg`}
            label={t('machines_dashboard.stats_weight')}
          />
        </div>

        {/* ═══ FILTRES ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            display: "flex",
            gap: "6px",
            marginBottom: "20px",
            background: "#f1f5f9",
            padding: "4px",
            borderRadius: "14px",
            width: "fit-content",
          }}
        >
          {[
            { id: "TOUS", label: t('machines_dashboard.filter_all'), count: machines.length, color: "#0f172a" },
            { id: "LINGE_NORMAL", label: t('machines_dashboard.filter_normal'), count: machinesNormal.length, color: "#0ea5e9" },
            { id: "LINGES_INFECTE", label: t('machines_dashboard.filter_infected'), count: machinesInfecte.length, color: "#dc2626" },
          ].map(({ id, label, count, color }) => (
            <button
              key={id}
              onClick={() => setFiltre(id)}
              style={{
                padding: "8px 16px",
                borderRadius: "10px",
                border: "none",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: filtre === id ? 700 : 500,
                transition: "all 0.2s",
                background: filtre === id ? "white" : "transparent",
                color: filtre === id ? color : "#64748b",
                boxShadow: filtre === id ? "0 2px 8px rgba(15, 23, 42, 0.06)" : "none",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              {label}
              <span
                style={{
                  padding: "2px 8px",
                  borderRadius: "8px",
                  fontSize: "10px",
                  fontWeight: 800,
                  background: filtre === id ? `${color}15` : "#e2e8f0",
                  color: filtre === id ? color : "#64748b",
                  fontFeatureSettings: "'tnum'",
                }}
              >
                {count}
              </span>
            </button>
          ))}
        </motion.div>

        {/* ═══ LISTE MACHINES ═══ */}
        {isLoading ? (
          <div
            style={{
              textAlign: "center",
              padding: "80px 20px",
              background: "white",
              borderRadius: "20px",
              border: "1px solid #e2e8f0",
            }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              style={{ display: "inline-flex" }}
            >
              <Icons.Refresh size={40} color="#0ea5e9" />
            </motion.div>
            <div
              style={{
                marginTop: "16px",
                fontSize: "14px",
                color: "#94a3b8",
                fontWeight: 600,
              }}
            >
              {t('machines_dashboard.loading')}
            </div>
          </div>
        ) : filtre === "TOUS" ? (
          <>
            {machinesNormal.length > 0 && (
              <div style={{ marginBottom: "32px" }}>
                <SectionHeader
                  color="#0ea5e9"
                  title={t('machines_dashboard.section_normal')}
                  count={machinesNormal.length}
                  disponibles={machinesNormal.filter((m) => m.etatImmobilisation === "DISPONIBLE").length}
                />
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                    gap: "18px",
                  }}
                >
                  {machinesNormal.map((m) => (
                    <CarteMachine
                      key={m.id || m.code}
                      machine={m}
                      cycles={cycles}
                      onClick={setMachineSelectee}
                      onTerminer={handleTerminer}
                    />
                  ))}
                </div>
              </div>
            )}

            {machinesNormal.length > 0 && machinesInfecte.length > 0 && (
              <div style={{ borderTop: "2px dashed #f1f5f9", marginBottom: "32px" }} />
            )}

            {machinesInfecte.length > 0 && (
              <div>
                <SectionHeader
                  color="#dc2626"
                  title={t('machines_dashboard.section_infected')}
                  count={machinesInfecte.length}
                  disponibles={machinesInfecte.filter((m) => m.etatImmobilisation === "DISPONIBLE").length}
                />
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                    gap: "18px",
                  }}
                >
                  {machinesInfecte.map((m) => (
                    <CarteMachine
                      key={m.id || m.code}
                      machine={m}
                      cycles={cycles}
                      onClick={setMachineSelectee}
                      onTerminer={handleTerminer}
                    />
                  ))}
                </div>
              </div>
            )}

            {machines.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "80px 20px",
                  background: "white",
                  borderRadius: "20px",
                  border: "2px dashed #e2e8f0",
                }}
              >
                <Icons.Server size={48} color="#cbd5e1" strokeWidth={1.5} />
                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: 700,
                    color: "#64748b",
                    marginTop: "16px",
                  }}
                >
                  {t('machines_dashboard.no_machines')}
                </div>
                <div
                  style={{
                    fontSize: "13px",
                    color: "#94a3b8",
                    marginTop: "4px",
                    fontWeight: 500,
                  }}
                >
                  {t('machines_dashboard.no_machines_text')}
                </div>
              </div>
            )}
          </>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: "18px",
            }}
          >
            {machinesFiltrees.map((m) => (
              <CarteMachine
                key={m.id || m.code}
                machine={m}
                cycles={cycles}
                onClick={setMachineSelectee}
                onTerminer={handleTerminer}
              />
            ))}
          </div>
        )}

        {/* ═══ LÉGENDE ═══ */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          style={{
            display: "flex",
            gap: "18px",
            marginTop: "28px",
            padding: "14px 22px",
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(12px)",
            borderRadius: "14px",
            border: "1px solid #e2e8f0",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: "10px",
              color: "#94a3b8",
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            {t('machines_dashboard.legend')}
          </span>
          {Object.entries(ETAT_CFG).map(([key, val]) => (
            <div
              key={key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "11px",
                color: "#64748b",
                fontWeight: 600,
              }}
            >
              <motion.div
                animate={key === "EN_COURS" ? { scale: [1, 1.3, 1], opacity: [1, 0.5, 1] } : {}}
                transition={{ duration: 1.5, repeat: key === "EN_COURS" ? Infinity : 0 }}
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: val.color,
                  boxShadow: key === "EN_COURS" ? `0 0 8px ${val.color}80` : "none",
                }}
              />
              {t(`machine_status.${key}`, val.label)}
            </div>
          ))}
        </motion.div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        ::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 8px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 🧩 COMPOSANT : Section Header
// ═══════════════════════════════════════════════════════════════════════════

function SectionHeader({ color, title, count, disponibles }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        marginBottom: "16px",
      }}
    >
      <div
        style={{
          width: "4px",
          height: "22px",
          borderRadius: "2px",
          background: color,
        }}
      />
      <span
        style={{
          fontWeight: 800,
          fontSize: "15px",
          color: "#0f172a",
          letterSpacing: "-0.01em",
        }}
      >
        {title}
      </span>
      <span
        style={{
          fontSize: "11px",
          color: color,
          background: `${color}15`,
          padding: "3px 12px",
          borderRadius: "10px",
          fontWeight: 800,
          fontFeatureSettings: "'tnum'",
        }}
      >
        {count}
      </span>
      <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
      <span
        style={{
          fontSize: "11px",
          color: "#64748b",
          display: "flex",
          alignItems: "center",
          gap: "5px",
          fontWeight: 700,
        }}
      >
        <span
          style={{
            display: "inline-block",
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: "#10b981",
            boxShadow: "0 0 6px #10b98180",
          }}
        />
        {disponibles} disponibles
      </span>
    </div>
  );
}