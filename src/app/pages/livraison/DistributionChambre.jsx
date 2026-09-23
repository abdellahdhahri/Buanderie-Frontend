// pages/Distribution/DistributionChambre.js
import React, { useState, useRef, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import ScanInput from "../../components/utils/shared/ScanInput";
import {
  getAgentFromStorage,
  isAgentConnected,
  fetchChambre,
  poserLinge,
  fetchAgentByCode,
  getCategorie
} from "../../services/distributionChambreService";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import "../Linge/WorkflowList.css";


/* ═══════════════════════════════════════════════════════════════════════════
   BIBLIOTHÈQUE SVG PERSONNALISÉE — Toutes les icônes dessinées main
   Stroke uniforme 2 / 2.2 / 2.5 · Linecap & Linejoin round · ViewBox 24
   ═══════════════════════════════════════════════════════════════════════════ */

const Icons = {
  /* ─── Utilisateur / Agent ─── */
  User: ({ size = 20, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),

  /* ─── Lit ─── */
  Bed: ({ size = 20, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 4v16" />
      <path d="M2 8h18a2 2 0 0 1 2 2v10" />
      <path d="M2 17h20" />
      <path d="M6 8v9" />
    </svg>
  ),

  /* ─── Porte / Chambre ─── */
  DoorOpen: ({ size = 20, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 4h3a2 2 0 0 1 2 2v14" />
      <path d="M2 20h3" />
      <path d="M13 20h9" />
      <path d="M10 12v.01" />
      <path d="M13 4.562v16.157a1 1 0 0 1-1.242.97L5 20V5.562a2 2 0 0 1 1.515-1.94l4-1A2 2 0 0 1 13 4.562Z" />
    </svg>
  ),

  /* ─── Check ─── */
  Check: ({ size = 20, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  ),

  /* ─── Check double ─── */
  CheckCheck: ({ size = 20, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 7 17l-5-5" />
      <path d="m22 10-7.5 7.5L13 16" />
    </svg>
  ),

  /* ─── Check circle ─── */
  CheckCircle: ({ size = 20, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),

  /* ─── Alert triangle ─── */
  AlertTriangle: ({ size = 20, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  ),

  /* ─── X ─── */
  X: ({ size = 20, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  ),

  /* ─── Refresh / Reset ─── */
  Refresh: ({ size = 20, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  ),

  /* ─── Loader ─── */
  Loader: ({ size = 20, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  ),

  /* ─── Package ─── */
  Package: ({ size = 20, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M16.5 9.4 7.55 4.24" />
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  ),

  /* ─── Layers ─── */
  Layers: ({ size = 20, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" />
      <path d="m22 12.18-9.17 4.16a2 2 0 0 1-1.66 0L2 12.18" />
      <path d="m22 17.18-9.17 4.16a2 2 0 0 1-1.66 0L2 17.18" />
    </svg>
  ),

  /* ─── Activity ─── */
  Activity: ({ size = 20, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2" />
    </svg>
  ),

  /* ─── Plus ─── */
  Plus: ({ size = 20, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  ),

  /* ─── Minus ─── */
  Minus: ({ size = 20, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
    </svg>
  ),

  /* ─── Trash ─── */
  Trash: ({ size = 20, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  ),

  /* ─── Clock ─── */
  Clock: ({ size = 20, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  ),

  /* ─── Circle (empty) ─── */
  Circle: ({ size = 20, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
    </svg>
  ),

  /* ─── Circle filled ─── */
  CircleDot: ({ size = 20, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="4" fill={color} />
    </svg>
  ),

  /* ─── Info ─── */
  Info: ({ size = 20, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  ),

  /* ─── Sparkles ─── */
  Sparkles: ({ size = 20, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
    </svg>
  ),
};


/* ═══════════════════════════════════════════════════════════════════════════
   ScanStatus — Barre de statut premium
   ═══════════════════════════════════════════════════════════════════════════ */
function ScanStatus({ loading, success, error, code }) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div style={{
        padding: "14px 18px", borderRadius: 12,
        background: "linear-gradient(135deg, #eff6ff, #dbeafe)",
        border: "1px solid #93c5fd",
        display: "flex", alignItems: "center", gap: 14, marginTop: 12,
        boxShadow: "0 4px 12px rgba(59,130,246,0.08)",
        animation: "fadeIn 0.3s ease-out",
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: "50%",
          background: "white", display: "flex",
          alignItems: "center", justifyContent: "center",
          boxShadow: "0 2px 8px rgba(59,130,246,0.15)",
        }}>
          <div className="animate-spin">
            <Icons.Loader size={20} color="#3b82f6" strokeWidth={2.5} />
          </div>
        </div>
        <div>
          <p style={{ fontWeight: 700, color: "#1d4ed8", fontSize: 14, margin: 0 }}>
            {t('distribution_chambre.scanning')}
          </p>
          <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0 0" }}>{code}</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div style={{
        padding: "14px 18px", borderRadius: 12,
        background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
        border: "1px solid #86efac",
        display: "flex", alignItems: "center", gap: 14, marginTop: 12,
        boxShadow: "0 4px 12px rgba(34,197,94,0.08)",
        animation: "fadeIn 0.3s ease-out",
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: "50%",
          background: "white", display: "flex",
          alignItems: "center", justifyContent: "center",
          boxShadow: "0 2px 8px rgba(34,197,94,0.15)",
        }}>
          <Icons.CheckCircle size={20} color="#22c55e" strokeWidth={2.5} />
        </div>
        <div>
          <p style={{ fontWeight: 700, color: "#15803d", fontSize: 14, margin: 0 }}>
            {success.message || t('common.success')}
          </p>
          <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0 0" }}>{success.detail}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: "14px 18px", borderRadius: 12,
        background: "linear-gradient(135deg, #fef2f2, #fee2e2)",
        border: "1px solid #fca5a5",
        display: "flex", alignItems: "center", gap: 14, marginTop: 12,
        boxShadow: "0 4px 12px rgba(239,68,68,0.08)",
        animation: "fadeIn 0.3s ease-out",
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: "50%",
          background: "white", display: "flex",
          alignItems: "center", justifyContent: "center",
          boxShadow: "0 2px 8px rgba(239,68,68,0.15)",
        }}>
          <Icons.AlertTriangle size={20} color="#ef4444" strokeWidth={2.5} />
        </div>
        <div>
          <p style={{ fontWeight: 700, color: "#dc2626", fontSize: 14, margin: 0 }}>
            {t('common.error')}
          </p>
          <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0 0" }}>{error}</p>
        </div>
      </div>
    );
  }

  return null;
}


/* ═══════════════════════════════════════════════════════════════════════════
   StatutCard — Carte statistique premium avec SVG
   ═══════════════════════════════════════════════════════════════════════════ */
function StatutCard({ label, value, icon, color, bg, subValue }) {
  return (
    <div
      style={{
        padding: "16px 18px", borderRadius: 16, background: bg,
        border: `1.5px solid ${color}25`,
        flex: 1, minWidth: 120, position: "relative", overflow: "hidden",
        transition: "all 0.25s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.boxShadow = `0 10px 24px ${color}22`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div style={{
        position: "absolute", top: -20, right: -20,
        width: 70, height: 70, borderRadius: "50%",
        background: `${color}12`, filter: "blur(20px)",
      }} />

      <div style={{ display: "flex", alignItems: "center", gap: 12, position: "relative" }}>
        <div style={{
          width: 42, height: 42, borderRadius: 12,
          background: `${color}15`, display: "flex",
          alignItems: "center", justifyContent: "center",
          border: `1px solid ${color}25`,
        }}>
          {icon}
        </div>

        <div>
          <p style={{
            fontSize: 9.5, fontWeight: 800, color: "#94a3b8",
            textTransform: "uppercase", letterSpacing: "0.7px",
            margin: 0,
          }}>
            {label}
          </p>
          <p style={{
            fontSize: 24, fontWeight: 800, color,
            margin: 0, lineHeight: 1.1, letterSpacing: "-0.02em",
          }}>
            {value}
          </p>
          {subValue && (
            <p style={{ fontSize: 10, color: "#94a3b8", margin: 0, fontWeight: 600 }}>
              {subValue}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════════════════
   CarteLit — Carte de lit premium avec SVG
   ═══════════════════════════════════════════════════════════════════════════ */
function CarteLit({ lit, actif, onClick }) {
  const { t } = useTranslation();

  const complet = !lit.litVide;
  const infecte = lit.estInfecte;
  const nb = lit.lingesPoses?.length || 0;

  const statusConfig = complet
    ? { label: t('distribution_chambre.completed'), color: "#10b981", bg: "#dcfce7", Icon: Icons.CheckCheck }
    : infecte
      ? { label: t('distribution_chambre.infected'), color: "#dc2626", bg: "#fee2e2", Icon: Icons.AlertTriangle }
      : nb > 0
        ? { label: t('distribution_chambre.in_progress'), color: "#7c3aed", bg: "#ede9fe", Icon: Icons.CircleDot }
        : { label: t('distribution_chambre.empty'), color: "#94a3b8", bg: "#f1f5f9", Icon: Icons.Circle };

  const StatusIcon = statusConfig.Icon;

  const borderColor = actif ? "#7c3aed" : complet ? "#10b981" : infecte ? "#dc2626" : "#e2e8f0";
  const barColor = actif ? "#7c3aed" : complet ? "#10b981" : infecte ? "#dc2626" : "#e2e8f0";
  const iconBgColor = actif ? "#ede9fe" : complet ? "#dcfce7" : infecte ? "#fee2e2" : "#f8fafc";
  const iconColor = actif ? "#7c3aed" : complet ? "#10b981" : infecte ? "#dc2626" : "#94a3b8";

  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      onClick={onClick}
      style={{
        borderRadius: 16, cursor: "pointer", background: "white",
        border: `2px solid ${borderColor}`,
        boxShadow: actif
          ? "0 0 0 4px rgba(124, 58, 237, 0.15), 0 8px 24px rgba(124, 58, 237, 0.12)"
          : complet
            ? "0 2px 8px rgba(16, 185, 129, 0.1)"
            : "0 2px 8px rgba(0,0,0,0.04)",
        transition: "all 0.3s ease",
        position: "relative", overflow: "hidden",
      }}
    >
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 3,
        background: barColor, opacity: actif ? 1 : 0.5,
      }} />

      <div style={{
        padding: "16px 18px", display: "flex",
        justifyContent: "space-between", alignItems: "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: iconBgColor, display: "flex",
            alignItems: "center", justifyContent: "center",
            transition: "all 0.3s",
            border: `1px solid ${iconColor}20`,
          }}>
            <Icons.Bed size={18} color={iconColor} strokeWidth={2.2} />
          </div>
          <div>
            <div style={{
              fontWeight: 800, fontSize: 15, color: "#0f172a",
              display: "flex", alignItems: "center", gap: 8,
              letterSpacing: "-0.01em",
            }}>
              {t('distribution_chambre.bed')} {lit.codeLit}
              <span style={{
                fontSize: 10, fontWeight: 800,
                color: statusConfig.color, background: statusConfig.bg,
                padding: "4px 11px", borderRadius: 20,
                display: "inline-flex", alignItems: "center", gap: 5,
                border: `1px solid ${statusConfig.color}25`,
                letterSpacing: "0.3px", textTransform: "uppercase",
              }}>
                <StatusIcon size={11} color={statusConfig.color} strokeWidth={2.5} />
                {statusConfig.label}
              </span>
            </div>
            <div style={{
              fontSize: 12, color: "#94a3b8",
              display: "flex", alignItems: "center", gap: 6, marginTop: 3,
              fontWeight: 500,
            }}>
              <span>{nb} {t('distribution_chambre.linen')}{nb > 1 ? 's' : ''}</span>
              {nb > 0 && (
                <>
                  <span style={{
                    width: 3, height: 3, borderRadius: "50%",
                    background: "#d1d5db",
                  }} />
                  <span>{lit.lingesPoses?.map(l => l.categorie).join(", ")}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {actif && (
          <div style={{
            padding: "5px 13px", borderRadius: 20,
            background: "#ede9fe", color: "#7c3aed",
            fontSize: 10, fontWeight: 800, letterSpacing: "0.3px",
            display: "inline-flex", alignItems: "center", gap: 5,
            border: "1px solid #c4b5fd",
          }}>
            <Icons.CircleDot size={10} color="#7c3aed" strokeWidth={2.5} />
            {t('distribution_chambre.in_progress')}
          </div>
        )}
      </div>

      {nb > 0 && (
        <div style={{
          padding: "0 18px 16px",
          display: "flex", flexWrap: "wrap", gap: 6,
        }}>
          {lit.lingesPoses.map((l, i) => {
            const c = getCategorie(l.categorie);
            return (
              <div
                key={i}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "5px 11px", borderRadius: 9,
                  background: `${c.color}12`,
                  border: `1px solid ${c.color}25`,
                  fontSize: 11, fontWeight: 600, color: c.color,
                }}
              >
                <span style={{ fontSize: 14 }}>{c.emoji}</span>
                {l.categorie}
              </div>
            );
          })}
        </div>
      )}

      {nb === 0 && !complet && !infecte && (
        <div style={{
          padding: "0 18px 16px",
          fontSize: 12, color: "#94a3b8", fontStyle: "italic",
        }}>
          {t('distribution_chambre.no_linen_placed')}
        </div>
      )}
    </motion.div>
  );
}


/* ═══════════════════════════════════════════════════════════════════════════
   Resume — Écran de fin premium avec SVG
   ═══════════════════════════════════════════════════════════════════════════ */
function Resume({ res, onNouvelle, onTerminer }) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      style={{
        background: "linear-gradient(135deg, #f0fdf4, #ecfdf5)",
        borderRadius: 24, padding: 40,
        border: "2px solid #86efac",
        boxShadow: "0 12px 40px rgba(16, 185, 129, 0.15)",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
          style={{
            width: 72, height: 72, borderRadius: "50%",
            background: "linear-gradient(135deg, #dcfce7, #bbf7d0)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px",
            boxShadow: "0 8px 24px rgba(16,185,129,0.2)",
            border: "2px solid #86efac",
          }}
        >
          <Icons.CheckCheck size={34} color="#15803d" strokeWidth={2.5} />
        </motion.div>
        <h2 style={{
          fontSize: 26, fontWeight: 800, color: "#15803d",
          margin: 0, letterSpacing: "-0.02em",
        }}>
          {t('distribution_chambre.room_equipped', { code: res.codeChambre })}
        </h2>
        <p style={{ fontSize: 14, color: "#64748b", marginTop: 6, fontWeight: 500 }}>
          {res.nbLinges} {t('distribution_chambre.linen')}{res.nbLinges > 1 ? 's' : ''} {t('distribution_chambre.distributed_on')} {res.nbLits} {t('distribution_chambre.bed')}{res.nbLits > 1 ? 's' : ''}
        </p>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
        gap: 12, marginBottom: 28,
      }}>
        {res.litsEquipes?.map((l, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            style={{
              background: "white", borderRadius: 14,
              padding: "14px 16px",
              border: "1px solid #bbf7d0",
              display: "flex", alignItems: "center", gap: 12,
              boxShadow: "0 2px 8px rgba(16,185,129,0.08)",
            }}
          >
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "linear-gradient(135deg, #dcfce7, #bbf7d0)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#15803d", border: "1px solid #86efac",
            }}>
              <Icons.Bed size={16} color="#15803d" strokeWidth={2.2} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 13, color: "#0f172a", letterSpacing: "-0.01em" }}>
                {t('distribution_chambre.bed')} {l.codeLit}
              </div>
              <div style={{ fontSize: 11, color: "#64748b", fontWeight: 500 }}>
                {l.nb} {t('distribution_chambre.linen')}{l.nb > 1 ? 's' : ''}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
        <button
          onClick={onNouvelle}
          style={{
            padding: "13px 30px", borderRadius: 12, border: "none",
            background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
            color: "white", fontWeight: 800, fontSize: 14, cursor: "pointer",
            transition: "all 0.2s", boxShadow: "0 6px 20px rgba(124, 58, 237, 0.3)",
            display: "inline-flex", alignItems: "center", gap: 8,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 10px 28px rgba(124, 58, 237, 0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 6px 20px rgba(124, 58, 237, 0.3)";
          }}
        >
          <Icons.Plus size={15} color="white" strokeWidth={2.5} />
          {t('distribution_chambre.another_room')}
        </button>
        <button
          onClick={onTerminer}
          style={{
            padding: "13px 30px", borderRadius: 12,
            border: "1px solid #e2e8f0", background: "white",
            color: "#64748b", fontWeight: 700, fontSize: 14, cursor: "pointer",
            transition: "all 0.2s",
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
          {t('common.finish')}
        </button>
      </div>
    </motion.div>
  );
}


/* ═══════════════════════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL — Logique 100% préservée
   ═══════════════════════════════════════════════════════════════════════════ */
export default function DistributionChambre() {
  const { t } = useTranslation();

  const [etape, setEtape] = useState("CHAMBRE");
  const [agent, setAgent] = useState(null);
  const [chambre, setChambre] = useState(null);
  const [litActif, setLitActif] = useState(null);
  const [scanVal, setScanVal] = useState("");
  const [loading, setLoading] = useState(false);
  const [resume, setResume] = useState(null);
  const [poses, setPoses] = useState([]);
  const [scanStatus, setScanStatus] = useState(null);

  const agentRef = useRef(null);
  const chambreRef = useRef(null);
  const litRef = useRef(null);
  const scanInputRef = useRef(null);

  useEffect(() => { agentRef.current = agent; }, [agent]);
  useEffect(() => { chambreRef.current = chambre; }, [chambre]);
  useEffect(() => { litRef.current = litActif; }, [litActif]);

  useEffect(() => {
    const agentData = getAgentFromStorage();
    if (agentData) {
      setAgent(agentData);
      setEtape("CHAMBRE");
      setScanStatus({
        loading: false,
        success: {
          message: `${t('distribution_chambre.agent')} ${agentData.nom}`,
          detail: `${t('distribution_chambre.connected')} · ${agentData.codeBarre || agentData.matricule}`
        },
        error: null
      });
      setTimeout(() => setScanStatus(null), 2000);
    } else {
      setEtape("CHAMBRE");
      setScanStatus({
        loading: false,
        success: null,
        error: t('distribution_chambre.no_agent_connected')
      });
    }
  }, [t]);

  useEffect(() => {
    const keepFocus = () => {
      if (scanInputRef.current && !document.querySelector('[data-modal="true"]')) {
        scanInputRef.current.focus();
      }
    };
    const id = setInterval(keepFocus, 500);
    keepFocus();
    return () => clearInterval(id);
  }, []);

  const cloturerDistribution = useCallback(async () => {
    if (poses.length === 0) {
      await Swal.fire({
        icon: 'warning',
        title: t('distribution_chambre.no_linen_distributed_title'),
        text: t('distribution_chambre.no_linen_distributed_text'),
        timer: 1500,
        showConfirmButton: false
      });
      return false;
    }

    const result = await Swal.fire({
      icon: 'question',
      title: t('distribution_chambre.finish_distribution_title'),
      text: t('distribution_chambre.finish_distribution_text', {
        count: poses.reduce((s, p) => s + p.nb, 0),
        beds: poses.length
      }),
      showCancelButton: true,
      confirmButtonColor: '#0d9488',
      cancelButtonColor: '#64748b',
      confirmButtonText: t('distribution_chambre.yes_finish'),
      cancelButtonText: t('common.cancel')
    });

    if (!result.isConfirmed) return false;

    const nbTotal = poses.reduce((s, p) => s + p.nb, 0);
    setResume({
      codeChambre: chambre.codeChambre,
      nbLinges: nbTotal,
      nbLits: poses.length,
      litsEquipes: poses
    });
    setEtape("RESUME");
    setLitActif(null);
    return true;
  }, [poses, chambre, t]);

  const handleChambre = useCallback(async code => {
    if (!agent) {
      await Swal.fire({
        icon: 'warning',
        title: t('distribution_chambre.agent_not_connected_title'),
        text: t('distribution_chambre.agent_not_connected_text'),
        timer: 1500,
        showConfirmButton: false
      });
      return;
    }
    setLoading(true);
    setScanStatus({ loading: true, code });
    try {
      const res = await fetchChambre(code);

      setChambre({
        chambreId: res.chambreId,
        codeChambre: res.codeChambre,
        lits: res.lits || [],
        disponibles: (res.disponibles || []).map(l => ({ ...l, lingeId: l.lingeId || l.id })),
      });
      setLitActif(null);
      setPoses([]);
      setEtape("DISTRIBUER");
      setScanStatus({
        loading: false,
        success: {
          message: `${t('distribution_chambre.room')} ${res.codeChambre}`,
          detail: `${res.lits?.length} ${t('distribution_chambre.bed')}s · ${res.disponibles?.length || 0} ${t('distribution_chambre.linen')}s`
        },
        error: null
      });
      setTimeout(() => setScanStatus(null), 2000);
      await Swal.fire({
        icon: 'success',
        title: `${t('distribution_chambre.room')} ${res.codeChambre}`,
        text: `${res.lits?.length} ${t('distribution_chambre.bed')}s · ${res.disponibles?.length || 0} ${t('distribution_chambre.linen')}s ${t('distribution_chambre.available')}`,
        timer: 1500,
        showConfirmButton: false
      });
    } catch (e) {
      setScanStatus({ loading: false, success: null, error: e.message });
      await Swal.fire({
        icon: 'error',
        title: t('common.error'),
        text: e.message
      });
    } finally {
      setLoading(false);
    }
  }, [agent, t]);

  const handleScanLinge = useCallback(async code => {
    const lit = litRef.current;
    if (!lit) {
      await Swal.fire({
        icon: 'warning',
        title: t('distribution_chambre.select_bed_first_title'),
        text: t('distribution_chambre.select_bed_first_text'),
        timer: 1500,
        showConfirmButton: false
      });
      return;
    }
    setLoading(true);
    setScanStatus({ loading: true, code });
    try {
      const c = chambreRef.current;
      const res = await poserLinge(c.chambreId, lit.litId, code);

      const linge = c.disponibles.find(l => l.codeBarre === code || l.lingeId === res.lingeId)
        || { lingeId: res.lingeId, codeBarre: res.codeBarre, categorie: res.categorie };

      setChambre(p => p ? {
        ...p,
        disponibles: p.disponibles.filter(l => l.lingeId !== linge.lingeId),
        lits: p.lits.map(l => l.litId !== lit.litId ? l : {
          ...l,
          litVide: false,
          lingesPoses: [...(l.lingesPoses || []), { ...linge }]
        })
      } : p);

      setPoses(p => {
        const ex = p.find(x => x.litId === lit.litId);
        if (ex) return p.map(x => x.litId === lit.litId ? { ...x, nb: x.nb + 1 } : x);
        return [...p, { litId: lit.litId, codeLit: lit.codeLit, nb: 1 }];
      });

      setScanStatus({
        loading: false,
        success: {
          message: t('distribution_chambre.linen_placed'),
          detail: `${t('distribution_chambre.bed')} ${lit.codeLit}`
        },
        error: null
      });
      setTimeout(() => setScanStatus(null), 1500);
    } catch (e) {
      setScanStatus({ loading: false, success: null, error: e.message });
      await Swal.fire({
        icon: 'error',
        title: t('common.error'),
        text: e.message,
        timer: 1500,
        showConfirmButton: false
      });
    } finally {
      setLoading(false);
    }
  }, [t]);

  const handleScan = useCallback(async code => {
    if (!code || loading) return;
    setScanVal("");

    if (etape === "CHAMBRE") {
      await handleChambre(code);
      return;
    }

    if (etape === "DISTRIBUER") {
      await handleScanLinge(code.trim());
    }
  }, [etape, loading, handleChambre, handleScanLinge, cloturerDistribution]);

  const reset = useCallback(async () => {
    if (etape !== "CHAMBRE" && etape !== "RESUME") {
      const result = await Swal.fire({
        icon: 'warning',
        title: t('distribution_chambre.reset_title'),
        text: t('distribution_chambre.reset_text'),
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#64748b',
        confirmButtonText: t('distribution_chambre.yes_reset'),
        cancelButtonText: t('common.cancel')
      });
      if (!result.isConfirmed) return;
    }
    setChambre(null);
    setLitActif(null);
    setPoses([]);
    setResume(null);
    setEtape("CHAMBRE");
    setScanVal("");
    setScanStatus(null);
  }, [etape, t]);

  const getPlaceholder = () => {
    if (!agent) return t('distribution_chambre.agent_not_connected_placeholder');
    if (etape === "CHAMBRE") return t('distribution_chambre.scan_room_code');
    if (etape === "RESUME") return t('distribution_chambre.distribution_completed');
    if (litActif) return t('distribution_chambre.scan_linen_to_bed', { code: litActif.codeLit });
    return t('distribution_chambre.select_bed_hint');
  };

  const getBorderColor = () => {
    if (!agent) return "#dc2626";
    if (litActif) return litActif.estInfecte ? "#dc2626" : "#7c3aed";
    if (etape === "CHAMBRE") return "#0d9488";
    if (etape === "DISTRIBUER") return "#7c3aed";
    return "#e2e8f0";
  };

  const nbPoses = poses.reduce((s, p) => s + p.nb, 0);
  const nbDispo = chambre?.disponibles?.length || 0;
  const litsVides = chambre?.lits?.filter(l => l.litVide).length || 0;
  const nbTotal = nbPoses + nbDispo;
  const pctAvancement = nbTotal > 0 ? Math.round((nbPoses / nbTotal) * 100) : 0;
  const isCloturee = etape === "RESUME";

  return (
    <div className="collecte-container">
      {/* ═══ Header premium ═══ */}
      <div style={{ marginBottom: 32 }}>
        <div style={{
          display: "flex", alignItems: "center",
          gap: 16, marginBottom: 8,
        }}>
          <div style={{
            width: 60, height: 60, borderRadius: 20,
            background: "linear-gradient(135deg, #0d9488, #0f766e)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "white",
            boxShadow: "0 10px 28px rgba(13, 148, 136, 0.35)",
          }}>
            <Icons.Bed size={28} color="white" strokeWidth={2.2} />
          </div>
          <div>
            <h1 style={{
              fontSize: 28, fontWeight: 800, color: "#0f172a",
              margin: 0, letterSpacing: "-0.025em",
            }}>
              {t('distribution_chambre.title')}
            </h1>
            <p style={{
              fontSize: 13.5, color: "#64748b",
              margin: "4px 0 0 0", fontWeight: 500,
              display: "flex", alignItems: "center", gap: 7,
            }}>
              {agent ? (
                <>
                  <Icons.User size={13} color="#0d9488" strokeWidth={2.2} />
                  {`${t('distribution_chambre.agent')}: ${agent.nom}`}
                </>
              ) : (
                t('distribution_chambre.no_agent_connected')
              )}
            </p>
          </div>
        </div>
      </div>

      <div style={{
        background: "white", borderRadius: 24, padding: 32,
        border: "1px solid #e2e8f0",
        boxShadow: "0 12px 40px rgba(15,23,42,0.06)",
      }}>

        {/* ═══ Barre agent + chambre ═══ */}
        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: 20,
          flexWrap: "wrap", gap: 12,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            {agent && (
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "9px 18px", background: "#faf5ff",
                borderRadius: 12, border: "1px solid #e9d5ff",
              }}>
                <Icons.User size={15} color="#7c3aed" strokeWidth={2.2} />
                <span style={{ fontWeight: 700, color: "#7c3aed", fontSize: 14 }}>
                  {agent.nom}
                </span>
                <Badge style={{
                  background: "#ede9fe", color: "#7c3aed",
                  fontSize: 10, padding: "2px 10px", borderRadius: 12,
                  fontWeight: 700,
                }}>
                  {agent.codeBarre || agent.matricule}
                </Badge>
              </div>
            )}
            {chambre && (
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "9px 18px", background: "#f0fdfa",
                borderRadius: 12, border: "1px solid #99f6e4",
              }}>
                <Icons.DoorOpen size={15} color="#0d9488" strokeWidth={2.2} />
                <span style={{ fontWeight: 700, color: "#0d9488", fontSize: 14 }}>
                  {t('distribution_chambre.room')} {chambre.codeChambre}
                </span>
                <Badge style={{
                  background: "#ccfbf1", color: "#0d9488",
                  fontSize: 10, padding: "2px 10px", borderRadius: 12,
                  fontWeight: 700,
                }}>
                  {chambre.lits?.length || 0} {t('distribution_chambre.bed')}s
                </Badge>
              </div>
            )}
            {etape === "DISTRIBUER" && litActif && (
              <Badge style={{
                background: "#ede9fe", color: "#7c3aed",
                fontSize: 11, padding: "5px 15px", borderRadius: 12,
                display: "inline-flex", alignItems: "center", gap: 6,
                fontWeight: 700,
              }}>
                <Icons.Bed size={12} color="#7c3aed" strokeWidth={2.5} />
                {t('distribution_chambre.bed')} {litActif.codeLit}
              </Badge>
            )}
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {etape !== "CHAMBRE" && etape !== "RESUME" && (
              <button
                onClick={reset}
                style={{
                  padding: "7px 15px", borderRadius: 10,
                  border: "1px solid #fca5a5", background: "#fff5f5",
                  color: "#dc2626", cursor: "pointer", fontSize: 12,
                  fontWeight: 700, display: "flex",
                  alignItems: "center", gap: 6,
                }}
              >
                <Icons.Refresh size={12} color="#dc2626" strokeWidth={2.5} />
                {t('common.reset')}
              </button>
            )}
          </div>
        </div>

        {!agent && (
          <div style={{
            padding: "13px 17px", borderRadius: 12,
            background: "linear-gradient(135deg, #fef2f2, #fee2e2)",
            border: "1px solid #fca5a5", marginBottom: 16,
            display: "flex", alignItems: "center", gap: 11,
            fontSize: 13, color: "#dc2626",
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "white", display: "flex",
              alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 8px rgba(220,38,38,0.15)",
            }}>
              <Icons.AlertTriangle size={16} color="#dc2626" strokeWidth={2.2} />
            </div>
            <div>
              <div style={{ fontWeight: 800, color: "#dc2626", fontSize: 13.5 }}>
                {t('distribution_chambre.no_agent_connected')}
              </div>
              <div style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>
                {t('distribution_chambre.no_agent_connect_text')}
              </div>
            </div>
          </div>
        )}

        {/* ═══ Zone scan ═══ */}
        <Card style={{
          marginBottom: 20,
          border: `2px dashed ${isCloturee ? "#e2e8f0" : getBorderColor()}`,
          background: isCloturee ? "#f8fafc" : "white",
          borderRadius: 16,
        }}>
          <CardContent className="p-5">
            <ScanInput
              ref={scanInputRef}
              placeholder={getPlaceholder()}
              value={scanVal}
              onChange={setScanVal}
              onSubmit={handleScan}
              borderColor={isCloturee ? "#e2e8f0" : getBorderColor()}
              keepFocus={true}
              autoDebounce={true}
              disabled={isCloturee || loading || !agent}
            />
            {scanStatus && <ScanStatus {...scanStatus} />}
          </CardContent>
        </Card>

        {etape === "DISTRIBUER" && chambre && !isCloturee && (
          <div style={{
            padding: "11px 17px", borderRadius: 12,
            background: "linear-gradient(135deg, #fef3c7, #fde68a)",
            border: "1px solid #fcd34d", marginBottom: 16,
            display: "flex", alignItems: "center", gap: 10,
            fontSize: 12, color: "#92400e", fontWeight: 600,
          }}>
            <Icons.Info size={15} color="#92400e" strokeWidth={2.2} />
            <span>{t('distribution_chambre.scan_agent_to_close')}</span>
          </div>
        )}

        {agent && etape === "CHAMBRE" && (
          <Card style={{
            background: "linear-gradient(135deg, #f0fdfa, #ccfbf1)",
            border: "1.5px solid #99f6e4",
            marginBottom: 16, borderRadius: 14,
          }}>
            <CardContent className="p-5">
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 12,
                  background: "white", display: "flex",
                  alignItems: "center", justifyContent: "center",
                  boxShadow: "0 2px 8px rgba(13,148,136,0.15)",
                  border: "1px solid #99f6e4",
                }}>
                  <Icons.DoorOpen size={18} color="#0d9488" strokeWidth={2.2} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, color: "#0d9488", fontSize: 13.5 }}>
                    {t('distribution_chambre.scan_room_to_load')}
                  </div>
                  <div style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>
                    {t('distribution_chambre.to_load_beds')}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {etape === "DISTRIBUER" && chambre && !isCloturee && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 12, marginBottom: 22,
          }}>
            <StatutCard
              label={t('distribution_chambre.distributed')}
              value={nbPoses}
              icon={<Icons.CheckCheck size={19} color="#15803d" strokeWidth={2.5} />}
              color="#15803d"
              bg="linear-gradient(135deg, #f0fdf4, #dcfce7)"
            />
            <StatutCard
              label={t('distribution_chambre.available')}
              value={nbDispo}
              icon={<Icons.Package size={19} color="#0ea5e9" strokeWidth={2.2} />}
              color="#0ea5e9"
              bg="linear-gradient(135deg, #f0f9ff, #e0f2fe)"
            />
            <StatutCard
              label={t('distribution_chambre.empty_beds')}
              value={litsVides}
              icon={<Icons.Bed size={19} color="#d97706" strokeWidth={2.2} />}
              color="#d97706"
              bg="linear-gradient(135deg, #fef3c7, #fde68a)"
            />
            <StatutCard
              label={t('distribution_chambre.progress')}
              value={`${pctAvancement}%`}
              icon={<Icons.Activity size={19} color="#7c3aed" strokeWidth={2.2} />}
              color="#7c3aed"
              bg="linear-gradient(135deg, #faf5ff, #ede9fe)"
              subValue={pctAvancement === 100 ? `${t('distribution_chambre.complete')}` : ""}
            />
          </div>
        )}

        {etape === "DISTRIBUER" && chambre && !isCloturee && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: 14,
          }}>
            {chambre.lits.map(lit => (
              <CarteLit
                key={lit.litId}
                lit={lit}
                actif={litActif?.litId === lit.litId}
                onClick={() => {
                  setLitActif(l => l?.litId === lit.litId ? null : lit);
                }}
              />
            ))}
          </div>
        )}

        {etape === "RESUME" && resume && (
          <Resume
            res={resume}
            onNouvelle={() => {
              setChambre(null);
              setLitActif(null);
              setPoses([]);
              setResume(null);
              setEtape("CHAMBRE");
              setScanStatus(null);
              setTimeout(() => scanInputRef.current?.focus(), 300);
            }}
            onTerminer={reset}
          />
        )}

        {/* ═══ Footer ═══ */}
        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "center", paddingTop: 18,
          borderTop: "1px solid #e2e8f0", fontSize: 12,
          color: "#64748b", flexWrap: "wrap", gap: 8, marginTop: 20,
        }}>
          <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
            {agent && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                <Icons.User size={12} color="#94a3b8" strokeWidth={2.2} />
                {t('distribution_chambre.agent')}: <strong style={{ color: "#0f172a" }}>{agent.nom}</strong>
              </span>
            )}
            {chambre && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                <Icons.DoorOpen size={12} color="#0d9488" strokeWidth={2.2} />
                {t('distribution_chambre.room')}: <strong style={{ color: "#0d9488" }}>{chambre.codeChambre}</strong>
              </span>
            )}
            {litActif && (
              <span style={{ color: "#7c3aed", display: "inline-flex", alignItems: "center", gap: 5 }}>
                <Icons.Bed size={12} color="#7c3aed" strokeWidth={2.2} />
                {t('distribution_chambre.bed')} {litActif.codeLit}
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Icons.Clock size={12} color="#94a3b8" strokeWidth={2.2} />
            <span>{new Date().toLocaleDateString("fr-FR")}</span>
            <span>•</span>
            <span>{new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
          </div>
        </div>

      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.92); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}