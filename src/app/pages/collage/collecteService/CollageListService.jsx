import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useModal } from "../../../contextes/ModalContext";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import ScanInput from "../../../components/utils/shared/ScanInput";
import DialogCategorie from "../../../components/utils/collecte/DialogCategorie";
import { cat, ST_COLORS, apiCall } from "../collecteUtils";
import { getAgent, isAgentConnected } from "../../../services/agentService";
import "../../Linge/WorkflowList.css";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8082';



const Icons = {
  User: ({ size = 20, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),

  X: ({ size = 20, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  ),

  Biohazard: ({ size = 20, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="2" />
      <path d="M12 7a5 5 0 0 0-4.546 2.914" />
      <path d="M7.454 14.914A5 5 0 0 0 12 17" />
      <path d="M16.546 14.914A5 5 0 0 0 16.546 9.086" />
      <path d="M12 2a7 7 0 0 0-6.062 3.5" />
      <path d="M12 22a7 7 0 0 0 6.062-3.5" />
      <path d="M18.062 5.5A7 7 0 0 0 12 2" />
      <path d="M5.938 18.5A7 7 0 0 0 12 22" />
    </svg>
  ),

  CheckCircle: ({ size = 20, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),

  Check: ({ size = 20, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  ),

  CheckCheck: ({ size = 20, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 7 17l-5-5" />
      <path d="m22 10-7.5 7.5L13 16" />
    </svg>
  ),

  AlertTriangle: ({ size = 20, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  ),

  Loader: ({ size = 20, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  ),

  Refresh: ({ size = 20, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  ),

  Building: ({ size = 20, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18" />
      <path d="M5 21V7l7-4 7 4v14" />
      <path d="M9 9h.01M15 9h.01M9 13h.01M15 13h.01M9 17h.01M15 17h.01" />
    </svg>
  ),

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

  Package: ({ size = 20, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M16.5 9.4 7.55 4.24" />
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  ),

  Boxes: ({ size = 20, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.97 12.92A2 2 0 0 0 2 14.63v3.24a2 2 0 0 0 .97 1.71l3 1.8a2 2 0 0 0 2.06 0L12 19v-5.5l-4.5-2.63a2 2 0 0 0-2.06 0L2.97 12.92Z" />
      <path d="m7 16.5-4.74-2.85" />
      <path d="m7 16.5 5-3" />
      <path d="M7 16.5v5.17" />
      <path d="M12 13.5V19l3.97 2.38a2 2 0 0 0 2.06 0l3-1.8a2 2 0 0 0 .97-1.71v-3.24a2 2 0 0 0-.97-1.71L17 10.5a2 2 0 0 0-2.06 0L12 13.5Z" />
      <path d="m17 16.5-5-3" />
      <path d="m17 16.5 4.74-2.85" />
      <path d="M17 16.5v5.17" />
      <path d="M7.97 4.42A2 2 0 0 0 7 6.13v4.37l5 3 5-3V6.13a2 2 0 0 0-.97-1.71l-3-1.8a2 2 0 0 0-2.06 0l-3 1.8Z" />
      <path d="M12 8 7.26 5.15" />
      <path d="m12 8 4.74-2.85" />
      <path d="M12 13.5V8" />
    </svg>
  ),

  Filter: ({ size = 20, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  ),

  ClipboardCheck: ({ size = 20, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="m9 14 2 2 4-4" />
    </svg>
  ),

  HandHoldingHeart: ({ size = 20, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 14h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 16" />
      <path d="m7 20 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9" />
      <path d="m2 15 6 6" />
      <path d="M19.5 8.5c.7-.7 1.5-1.6 1.5-2.7A2.73 2.73 0 0 0 16 4a2.78 2.78 0 0 0-5 1.8c0 1.2.8 2 1.5 2.8L16 12Z" />
    </svg>
  ),

  BoxOpen: ({ size = 20, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22v-5" />
      <path d="M9 8V2" />
      <path d="M15 8V2" />
      <path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z" />
    </svg>
  ),

  ArrowRight: ({ size = 20, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  ),

  ArrowLeft: ({ size = 20, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </svg>
  ),

  Sparkles: ({ size = 20, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
    </svg>
  ),

  Plus: ({ size = 20, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  ),

  Minus: ({ size = 20, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
    </svg>
  ),

  Info: ({ size = 20, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  ),

  Clock: ({ size = 20, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  ),
};


/* ═══════════════════════════════════════════════════════════════════════════
   ProgressionBar
   ═══════════════════════════════════════════════════════════════════════════ */
function ProgressionBar({ value, label, color = "#14b8a6", emoji }) {
  const pct = Math.min(Math.max(value, 0), 100);
  const isComplete = pct === 100;

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{
        display: "flex", justifyContent: "space-between",
        fontSize: 12, marginBottom: 4,
      }}>
        <span style={{
          fontWeight: 600, color: "#64748b",
          display: "flex", alignItems: "center", gap: 6,
        }}>
          {emoji && <span>{emoji}</span>} {label}
        </span>
        <span style={{
          fontWeight: 800,
          color: isComplete ? "#10b981" : "#0f172a",
        }}>
          {pct}%
        </span>
      </div>
      <div style={{
        height: 6, borderRadius: 4, background: "#f1f5f9",
        overflow: "hidden", position: "relative",
      }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{
            height: "100%", borderRadius: 4,
            background: isComplete
              ? "linear-gradient(90deg, #10b981, #059669)"
              : `linear-gradient(90deg, ${color}, ${color}dd)`,
            boxShadow: isComplete ? "0 0 12px rgba(16,185,129,0.3)" : "none",
          }}
        />
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════════════════
   StatutCard — Identique à Distribution & Collecte Chambre
   ═══════════════════════════════════════════════════════════════════════════ */
function StatutCard({ label, value, icon, color, bg, subValue, onClick, active }) {
  const isClickable = !!onClick;
  const isActive = active || false;

  return (
    <motion.div
      whileHover={isClickable ? { y: -3, scale: 1.02 } : { y: -3 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      style={{
        padding: "16px 18px", borderRadius: 16, background: bg,
        border: `1.5px solid ${isActive ? color : `${color}25`}`,
        flex: 1, minWidth: 120, position: "relative", overflow: "hidden",
        cursor: isClickable ? "pointer" : "default",
        opacity: isActive ? 1 : 0.9,
        boxShadow: isActive ? `0 8px 20px ${color}20` : "none",
        transition: "all 0.25s",
      }}
      onMouseEnter={(e) => {
        if (!isClickable) {
          e.currentTarget.style.transform = "translateY(-3px)";
          e.currentTarget.style.boxShadow = `0 10px 24px ${color}22`;
        }
      }}
      onMouseLeave={(e) => {
        if (!isClickable) {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "none";
        }
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
          background: isActive ? `${color}25` : `${color}15`,
          display: "flex", alignItems: "center", justifyContent: "center",
          border: `1px solid ${color}25`,
          transition: "all 0.3s",
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

      {isActive && isClickable && (
        <div style={{
          position: "absolute", bottom: 6, right: 10,
          fontSize: 9, color, opacity: 0.6,
        }}>
          ●
        </div>
      )}
    </motion.div>
  );
}


/* ═══════════════════════════════════════════════════════════════════════════
   ScanStatus — Identique à Distribution & Collecte Chambre
   ═══════════════════════════════════════════════════════════════════════════ */
function ScanStatusComponent({ status, t }) {
  if (!status) return null;

  if (status.loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          padding: "14px 18px", borderRadius: 12,
          background: "linear-gradient(135deg, #eff6ff, #dbeafe)",
          border: "1px solid #93c5fd",
          display: "flex", alignItems: "center", gap: 14, marginTop: 12,
          boxShadow: "0 4px 12px rgba(59,130,246,0.08)",
        }}
      >
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
            {t('collecte.scanning')}
          </p>
          <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0 0" }}>
            {status.code}
          </p>
        </div>
      </motion.div>
    );
  }

  if (status.success) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          padding: "14px 18px", borderRadius: 12,
          background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
          border: "1px solid #86efac",
          display: "flex", alignItems: "center", gap: 14, marginTop: 12,
          boxShadow: "0 4px 12px rgba(34,197,94,0.08)",
        }}
      >
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
            {status.success.message}
          </p>
          <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0 0" }}>
            {status.success.detail}
          </p>
        </div>
      </motion.div>
    );
  }

  if (status.error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          padding: "14px 18px", borderRadius: 12,
          background: "linear-gradient(135deg, #fef2f2, #fee2e2)",
          border: "1px solid #fca5a5",
          display: "flex", alignItems: "center", gap: 14, marginTop: 12,
          boxShadow: "0 4px 12px rgba(239,68,68,0.08)",
        }}
      >
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
          <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0 0" }}>
            {status.error}
          </p>
        </div>
      </motion.div>
    );
  }

  return null;
}


/* ═══════════════════════════════════════════════════════════════════════════
   BoutonAction — Bouton circulaire (identique Collecte Chambre)
   ═══════════════════════════════════════════════════════════════════════════ */
function BoutonAction({ onClick, disabled, title, Icon, color, bg, border }) {
  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.12, y: -2 } : {}}
      whileTap={!disabled ? { scale: 0.92 } : {}}
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        width: 36, height: 36, borderRadius: 11,
        border: `1.5px solid ${border}`,
        background: bg,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.25s cubic-bezier(0.34,1.56,0.64,1)",
        boxShadow: disabled ? "none" : `0 3px 10px ${color}25`,
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.boxShadow = `0 6px 16px ${color}40`;
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.boxShadow = `0 3px 10px ${color}25`;
        }
      }}
    >
      <Icon size={14} color={color} strokeWidth={2.5} />
    </motion.button>
  );
}


/* ═══════════════════════════════════════════════════════════════════════════
   CarteLinge — Ligne de linge premium
   ═══════════════════════════════════════════════════════════════════════════ */
function CarteLinge({ linge, bacBlanc, onBlanc, onPropre, onManquant, t }) {
  const c = cat(linge.categorie);
  const col = ST_COLORS[linge.statut];
  const isTraite = !!linge.statut;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "center", padding: "12px 16px", borderRadius: 14,
        border: `1.5px solid ${isTraite ? col?.b || "#e2e8f0" : "#e2e8f0"}`,
        background: isTraite
          ? `linear-gradient(135deg, ${col?.bg || "#f8fafc"}, ${col?.bg || "#f1f5f9"})`
          : "linear-gradient(135deg, #ffffff, #f8fafc)",
        marginBottom: 8,
        transition: "all 0.25s",
        boxShadow: isTraite ? "none" : "0 2px 8px rgba(15,23,42,0.04)",
        position: "relative",
      }}
      onMouseEnter={(e) => {
        if (!isTraite) {
          e.currentTarget.style.boxShadow = "0 6px 18px rgba(15,23,42,0.08)";
          e.currentTarget.style.borderColor = "#cbd5e1";
        }
      }}
      onMouseLeave={(e) => {
        if (!isTraite) {
          e.currentTarget.style.boxShadow = "0 2px 8px rgba(15,23,42,0.04)";
          e.currentTarget.style.borderColor = "#e2e8f0";
        }
      }}
    >
      {!isTraite && bacBlanc?.bacId && (
        <div style={{
          position: "absolute", left: 0, top: 0, bottom: 0, width: 3,
          borderRadius: "3px 0 0 3px",
          background: "linear-gradient(180deg, #14b8a6, #0d9488)",
        }} />
      )}

      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        flex: 1, minWidth: 0,
        paddingLeft: isTraite ? 0 : 6,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 11,
          background: c.bg,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 19, flexShrink: 0,
          border: `1px solid ${c.color}20`,
        }}>
          {c.emoji}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{
            fontSize: 12.5, fontWeight: 700, color: c.color,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {c.label}
          </div>
          <code style={{
            fontSize: 10.5, color: "#94a3b8", fontWeight: 600,
            display: "block", overflow: "hidden",
            textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {linge.codeBarre}
          </code>
        </div>
      </div>

      {isTraite ? (
        <span style={{
          fontSize: 10, fontWeight: 800, letterSpacing: "0.4px",
          padding: "5px 12px", borderRadius: 20,
          background: col?.tag, color: col?.tc,
          flexShrink: 0,
          textTransform: "uppercase",
          border: `1px solid ${col?.b}`,
        }}>
          {col?.lbl}
        </span>
      ) : (
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <BoutonAction
            onClick={() => onBlanc(linge)}
            disabled={!bacBlanc?.bacId}
            title={t('collecte.sale_to_white')}
            Icon={Icons.Check}
            color="#16a34a"
            bg="#dcfce7"
            border="#bbf7d0"
          />
          <BoutonAction
            onClick={() => onPropre(linge)}
            title={t('collecte.propre_keep')}
            Icon={Icons.CheckCircle}
            color="#0284c7"
            bg="#dbeafe"
            border="#bae6fd"
          />
          <BoutonAction
            onClick={() => onManquant(linge)}
            title={t('collecte.missing')}
            Icon={Icons.AlertTriangle}
            color="#d97706"
            bg="#fef3c7"
            border="#fde68a"
          />
        </div>
      )}
    </motion.div>
  );
}


/* ═══════════════════════════════════════════════════════════════════════════
   ActionButton — Bouton d'action principal (identique Distribution)
   ═══════════════════════════════════════════════════════════════════════════ */
function ActionButton({
  onClick, disabled, loading, icon, label, type = "primary", badge,
}) {
  const themes = {
    primary: {
      gradient: "linear-gradient(135deg, #14b8a6, #0d9488)",
      shadow: "rgba(20,184,166,0.35)",
      hoverShadow: "rgba(20,184,166,0.5)",
      text: "white",
      border: "transparent",
    },
    success: {
      gradient: "linear-gradient(135deg, #10b981, #059669)",
      shadow: "rgba(16,185,129,0.35)",
      hoverShadow: "rgba(16,185,129,0.5)",
      text: "white",
      border: "transparent",
    },
    danger: {
      gradient: "linear-gradient(135deg, #ef4444, #dc2626)",
      shadow: "rgba(220,38,38,0.35)",
      hoverShadow: "rgba(220,38,38,0.5)",
      text: "white",
      border: "transparent",
    },
    warning: {
      gradient: "linear-gradient(135deg, #f59e0b, #d97706)",
      shadow: "rgba(217,119,6,0.35)",
      hoverShadow: "rgba(217,119,6,0.5)",
      text: "white",
      border: "transparent",
    },
    default: {
      gradient: "white",
      shadow: "rgba(15,23,42,0.06)",
      hoverShadow: "rgba(15,23,42,0.1)",
      text: "#64748b",
      border: "#e2e8f0",
    },
  };

  const theme = themes[type] || themes.primary;

  return (
    <motion.button
      whileHover={!disabled && !loading ? { y: -2, scale: 1.02 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.97 } : {}}
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        padding: "13px 26px", borderRadius: 12,
        border: `1.5px solid ${theme.border}`,
        background: disabled || loading ? "#e2e8f0" : theme.gradient,
        color: disabled || loading ? "#94a3b8" : theme.text,
        fontWeight: 800, fontSize: 13,
        cursor: disabled || loading ? "not-allowed" : "pointer",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        gap: 8,
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        boxShadow: disabled || loading ? "none" : `0 4px 16px ${theme.shadow}`,
        position: "relative", overflow: "hidden",
        flexShrink: 0, minWidth: 130,
      }}
      onMouseEnter={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.boxShadow = `0 6px 22px ${theme.hoverShadow}`;
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.boxShadow = `0 4px 16px ${theme.shadow}`;
        }
      }}
    >
      {loading ? (
        <div className="animate-spin">
          <Icons.Loader size={15} color={theme.text} strokeWidth={2.5} />
        </div>
      ) : (
        <>
          {icon}
          {label}
        </>
      )}
      {badge && !disabled && !loading && (
        <span style={{
          background: "rgba(255,255,255,0.25)",
          padding: "2px 9px", borderRadius: 10,
          fontSize: 10, fontWeight: 800,
        }}>
          {badge}
        </span>
      )}
    </motion.button>
  );
}


/* ═══════════════════════════════════════════════════════════════════════════
   DlgSacInfecte — Dialogue sac infecté premium
   ═══════════════════════════════════════════════════════════════════════════ */
function DlgSacInfecte({ visible, collecteId, onValider, onClose, t }) {
  const [etape, setEtape] = useState("CATEGORIE");
  const [catChoisie, setCatChoisie] = useState(null);
  const [quantite, setQuantite] = useState(1);
  const [codeBac, setCodeBac] = useState("");
  const [loading, setLoading] = useState(false);
  const [bacErr, setBacErr] = useState("");

  useEffect(() => {
    if (visible) {
      setEtape("CATEGORIE");
      setCatChoisie(null);
      setQuantite(1);
      setCodeBac("");
      setBacErr("");
    }
  }, [visible]);

  if (!visible) return null;

  if (etape === "CATEGORIE") {
    return (
      <DialogCategorie
        onChoisir={(c) => {
          setCatChoisie(c);
          setEtape("QUANTITE");
        }}
        onFermer={onClose}
      />
    );
  }

  if (etape === "QUANTITE") {
    return (
      <div data-modal="true" onClick={onClose} style={{
        position: "fixed", inset: 0, background: "rgba(15,23,42,0.65)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 9999, backdropFilter: "blur(6px)",
        animation: "fadeIn 0.2s ease-out",
      }}>
        <div onClick={e => e.stopPropagation()} style={{
          background: "white", borderRadius: 22, padding: 28,
          maxWidth: 400, width: "95%",
          boxShadow: "0 24px 72px rgba(0,0,0,0.35)",
          animation: "scaleIn 0.25s cubic-bezier(0.34,1.56,0.64,1)",
        }}>
          <div style={{
            display: "flex", justifyContent: "space-between",
            alignItems: "flex-start", marginBottom: 20,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 15,
                background: `linear-gradient(135deg, ${catChoisie.bg}, ${catChoisie.border})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: `0 4px 14px ${catChoisie.color}25`,
                fontSize: 26,
              }}>
                {catChoisie.emoji}
              </div>
              <div>
                <h3 style={{
                  margin: 0, fontSize: 17, fontWeight: 800,
                  color: "#0f172a", letterSpacing: "-0.01em",
                }}>
                  {catChoisie.label}
                </h3>
                <p style={{ margin: "3px 0 0 0", fontSize: 12, color: "#64748b", fontWeight: 500 }}>
                  {t('collecte.how_many_infected', { label: catChoisie.label.toLowerCase() })}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "#f1f5f9", border: "none", borderRadius: 10,
                width: 32, height: 32, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <Icons.X size={14} color="#64748b" strokeWidth={2.5} />
            </button>
          </div>

          <div style={{
            display: "flex", alignItems: "center",
            justifyContent: "center", gap: 20, marginBottom: 24,
          }}>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setQuantite(q => Math.max(1, q - 1))}
              style={{
                width: 48, height: 48, borderRadius: "50%",
                border: `2px solid ${catChoisie.border}`,
                background: catChoisie.bg, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <Icons.Minus size={20} color={catChoisie.color} strokeWidth={2.5} />
            </motion.button>
            <div style={{ textAlign: "center", minWidth: 90 }}>
              <div style={{
                fontSize: 46, fontWeight: 800,
                color: catChoisie.color, lineHeight: 1,
                letterSpacing: "-0.03em",
              }}>
                {quantite}
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, marginTop: 4 }}>
                {catChoisie.label}{quantite > 1 ? "s" : ""}
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setQuantite(q => q + 1)}
              style={{
                width: 48, height: 48, borderRadius: "50%",
                border: `2px solid ${catChoisie.border}`,
                background: catChoisie.bg, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <Icons.Plus size={20} color={catChoisie.color} strokeWidth={2.5} />
            </motion.button>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => setEtape("CATEGORIE")}
              style={{
                flex: 1, padding: 13, borderRadius: 12,
                border: "1px solid #e2e8f0", background: "white",
                color: "#64748b", fontWeight: 700, fontSize: 13,
                cursor: "pointer", transition: "all 0.2s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
              onMouseLeave={e => e.currentTarget.style.background = "white"}
            >
              <Icons.ArrowLeft size={13} strokeWidth={2.5} />
              {t('common.back')}
            </button>
            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setEtape("BAC")}
              style={{
                flex: 2, padding: 13, borderRadius: 12, border: "none",
                background: `linear-gradient(135deg, ${catChoisie.color}, #b91c1c)`,
                color: "white", fontWeight: 800, fontSize: 13,
                cursor: "pointer",
                boxShadow: `0 4px 14px ${catChoisie.color}40`,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              {quantite} {catChoisie.label}{quantite > 1 ? "s" : ""}
              <Icons.ArrowRight size={14} color="white" strokeWidth={2.5} />
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  if (etape === "BAC") {
    const handleScanBac = async () => {
      if (!codeBac.trim()) return;
      setLoading(true);
      setBacErr("");
      try {
        const res = await apiCall(
          `/api/collecte/service/${collecteId}/bac`,
          { codeOuTag: codeBac.trim() }
        );
        if (res.typeBac !== "INFECTE") {
          setBacErr(t('collecte.errors.bac_not_infected', { type: res.typeBac }));
          return;
        }
        onValider({
          bacId: res.bacId,
          items: [{ categorie: catChoisie.id, quantiteDeclaree: quantite }]
        });
      } catch (e) {
        setBacErr(e.message);
      } finally {
        setLoading(false);
      }
    };

    return (
      <div data-modal="true" onClick={onClose} style={{
        position: "fixed", inset: 0, background: "rgba(15,23,42,0.7)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 9999, backdropFilter: "blur(6px)",
        animation: "fadeIn 0.2s ease-out",
      }}>
        <div onClick={e => e.stopPropagation()} style={{
          background: "white", borderRadius: 22, padding: 28,
          maxWidth: 420, width: "95%",
          boxShadow: "0 24px 72px rgba(220,38,38,0.3)",
          animation: "scaleIn 0.25s cubic-bezier(0.34,1.56,0.64,1)",
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 20 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 15,
              background: "linear-gradient(135deg, #fee2e2, #fecaca)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 14px rgba(220,38,38,0.25)",
            }}>
              <Icons.Biohazard size={26} color="#dc2626" strokeWidth={2.2} />
            </div>
            <div>
              <h3 style={{
                margin: 0, fontSize: 17, fontWeight: 800,
                color: "#dc2626", letterSpacing: "-0.01em",
              }}>
                {t('collecte.scan_red_bac')}
              </h3>
              <p style={{ margin: "3px 0 0 0", fontSize: 12, color: "#64748b", fontWeight: 500 }}>
                {quantite} {catChoisie.label}{quantite > 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{
              fontSize: 11, fontWeight: 800, color: "#dc2626",
              display: "block", marginBottom: 6,
              textTransform: "uppercase", letterSpacing: "0.4px",
            }}>
              {t('collecte.red_bac_code')}
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={codeBac}
                onChange={e => setCodeBac(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleScanBac()}
                placeholder={t('collecte.scan_or_enter')}
                autoFocus
                style={{
                  flex: 1, padding: "12px 14px", borderRadius: 11,
                  border: "2px solid #fca5a5", fontSize: 13, outline: "none",
                  fontWeight: 600, color: "#0f172a",
                  transition: "all 0.2s",
                }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = "#dc2626";
                  e.currentTarget.style.boxShadow = "0 0 0 4px rgba(220,38,38,0.1)";
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = "#fca5a5";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
              <motion.button
                whileHover={codeBac.trim() && !loading ? { y: -1 } : {}}
                whileTap={codeBac.trim() && !loading ? { scale: 0.97 } : {}}
                onClick={handleScanBac}
                disabled={loading || !codeBac.trim()}
                style={{
                  padding: "12px 22px", borderRadius: 11, border: "none",
                  background: !codeBac.trim() ? "#e2e8f0" : "linear-gradient(135deg, #ef4444, #dc2626)",
                  color: !codeBac.trim() ? "#94a3b8" : "white",
                  fontWeight: 800, fontSize: 13,
                  cursor: !codeBac.trim() ? "not-allowed" : "pointer",
                  boxShadow: codeBac.trim() ? "0 4px 14px rgba(220,38,38,0.35)" : "none",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                {loading ? (
                  <div className="animate-spin">
                    <Icons.Loader size={14} color="white" strokeWidth={2.5} />
                  </div>
                ) : "OK"}
              </motion.button>
            </div>
            {bacErr && (
              <div style={{
                marginTop: 8, padding: "10px 12px", borderRadius: 9,
                background: "#fef2f2", border: "1px solid #fca5a5",
                fontSize: 11, color: "#dc2626", fontWeight: 600,
                display: "flex", alignItems: "center", gap: 7,
              }}>
                <Icons.AlertTriangle size={12} color="#dc2626" strokeWidth={2.5} />
                {bacErr}
              </div>
            )}
          </div>

          <button
            onClick={() => setEtape("QUANTITE")}
            style={{
              width: "100%", padding: 13, borderRadius: 12,
              border: "1px solid #e2e8f0", background: "white",
              color: "#64748b", fontWeight: 700, fontSize: 13,
              cursor: "pointer", transition: "all 0.2s",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
            onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
            onMouseLeave={e => e.currentTarget.style.background = "white"}
          >
            <Icons.ArrowLeft size={13} strokeWidth={2.5} />
            {t('common.back')}
          </button>
        </div>
      </div>
    );
  }

  return null;
}


/* ═══════════════════════════════════════════════════════════════════════════
   DlgManquant — Dialogue premium
   ═══════════════════════════════════════════════════════════════════════════ */
function DlgManquant({ linge, onOk, onClose, t }) {
  if (!linge) return null;
  const c = cat(linge.categorie);

  return (
    <div data-modal="true" onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(15,23,42,0.65)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 9999, backdropFilter: "blur(6px)",
      animation: "fadeIn 0.2s ease-out",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "white", borderRadius: 22, padding: 28,
        maxWidth: 400, width: "95%",
        boxShadow: "0 24px 72px rgba(0,0,0,0.35)",
        animation: "scaleIn 0.25s cubic-bezier(0.34,1.56,0.64,1)",
      }}>
        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "flex-start", marginBottom: 20,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: "linear-gradient(135deg, #fef3c7, #fde68a)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 12px rgba(217,119,6,0.2)",
            }}>
              <Icons.AlertTriangle size={22} color="#d97706" strokeWidth={2.2} />
            </div>
            <div>
              <h3 style={{
                margin: 0, fontSize: 17, fontWeight: 800,
                color: "#0f172a", letterSpacing: "-0.01em",
              }}>
                {t('collecte.missing_linen')}
              </h3>
              <p style={{ margin: "3px 0 0 0", fontSize: 12, color: "#64748b", fontWeight: 500 }}>
                Confirmation requise
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "#f1f5f9", border: "none", borderRadius: 10,
              width: 32, height: 32, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <Icons.X size={14} color="#64748b" strokeWidth={2.5} />
          </button>
        </div>

        <div style={{
          padding: 14, background: c.bg, borderRadius: 14,
          marginBottom: 18, display: "flex", alignItems: "center", gap: 12,
          border: `1px solid ${c.color}25`,
        }}>
          <span style={{ fontSize: 26 }}>{c.emoji}</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: c.color }}>
              {c.label}
            </div>
            <code style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>
              {linge.codeBarre}
            </code>
          </div>
        </div>

        <div style={{
          padding: "12px 14px", borderRadius: 12, marginBottom: 20,
          background: "linear-gradient(135deg, #fffbeb, #fef3c7)",
          border: "1px solid #fde68a",
          display: "flex", alignItems: "flex-start", gap: 10,
        }}>
          <div style={{ flexShrink: 0, marginTop: 1 }}>
            <Icons.AlertTriangle size={13} color="#d97706" strokeWidth={2.5} />
          </div>
          <p style={{ margin: 0, fontSize: 12, color: "#92400e", lineHeight: 1.5, fontWeight: 500 }}>
            Ce linge sera marqué comme <strong>manquant</strong> dans la collecte.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: 13, borderRadius: 12,
              border: "1px solid #e2e8f0", background: "white",
              color: "#64748b", fontWeight: 700, fontSize: 13,
              cursor: "pointer", transition: "all 0.2s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
            onMouseLeave={e => e.currentTarget.style.background = "white"}
          >
            {t('common.cancel')}
          </button>
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onOk(linge)}
            style={{
              flex: 2, padding: 13, borderRadius: 12, border: "none",
              background: "linear-gradient(135deg, #f59e0b, #d97706)",
              color: "white", fontWeight: 800, fontSize: 13,
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(217,119,6,0.35)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
            }}
          >
            <Icons.AlertTriangle size={13} color="white" strokeWidth={2.5} />
            {t('collecte.confirm_missing')}
          </motion.button>
        </div>
      </div>
    </div>
  );
}



function CollageListServiceInner() {
  const { t } = useTranslation();
  const { showAlert, showConfirm } = useModal();

  const [agent, setAgent] = useState(null);
  const [collecte, setCollecte] = useState(null);
  const [bacBlanc, setBacBlanc] = useState(null);
  const [sacsDeclares, setSacsDeclares] = useState([]);
  const [scanVal, setScanVal] = useState("");
  const [loading, setLoading] = useState(false);
  const [resume, setResume] = useState(null);
  const [dlgSac, setDlgSac] = useState(false);
  const [dlgManq, setDlgManq] = useState(null);
  const [scanStatus, setScanStatus] = useState(null);
  const [filter, setFilter] = useState("all");

  const scanInputRef = useRef(null);

  useEffect(() => {
    const agentData = getAgent();
    if (agentData && isAgentConnected()) {
      setAgent(agentData);
      setScanStatus({
        loading: false,
        success: {
          message: `${agentData.nomPrenom || agentData.nom}`,
          detail: `${t('collecte.connected')} · ${agentData.codeBarre || agentData.matricule}`,
        },
        error: null,
      });
      setTimeout(() => setScanStatus(null), 1500);
    }
  }, [t]);

  const nbBlancs = collecte?.linges?.filter(l => l.statut === "BLANC").length || 0;
  const nbPropres = collecte?.linges?.filter(l => l.statut === "PROPRE").length || 0;
  const nbManq = collecte?.linges?.filter(l => l.statut === "MANQUANT").length || 0;
  const nbNonTr = collecte?.linges?.filter(l => !l.statut).length || 0;
  const nbInfectes = sacsDeclares.reduce((s, sac) => s + (sac.quantite || 0), 0);
  const totalAttendu = collecte?.nbAttendus || 0;
  const totalTraite = nbBlancs + nbPropres + nbManq + nbInfectes;
  const progression = totalAttendu > 0 ? Math.min(Math.round((totalTraite / totalAttendu) * 100), 100) : 0;

  const filteredLinges = useMemo(() => {
    if (!collecte?.linges) return [];
    if (filter === "all") return collecte.linges;
    if (filter === "untreated") return collecte.linges.filter(l => !l.statut);
    return collecte.linges.filter(l => l.statut === filter.toUpperCase());
  }, [collecte, filter]);

  const majLinge = useCallback((lingeId, statut) => {
    setCollecte(p =>
      p ? {
        ...p,
        linges: p.linges.map(l =>
          l.lingeId === lingeId ? { ...l, statut } : l
        ),
      } : p
    );
  }, []);

  const handleService = useCallback(async code => {
    if (!agent) {
      showAlert(
        t('collecte.errors.agent_not_connected'),
        t('collecte.errors.agent_not_connected_text'),
        "error"
      );
      return;
    }
    setLoading(true);
    setScanStatus(null);
    try {
      const svcRes = await fetch(
        `${API_URL}/api/sqlserver/services/ref/${encodeURIComponent(code)}`
      );
      const svc = svcRes.ok ? await svcRes.json() : null;
      if (!svc) {
        setScanStatus({
          loading: false,
          success: null,
          error: t('collecte.errors.service_not_found'),
        });
        showAlert(t('collecte.errors.service_not_found'), code, "error");
        return;
      }
      const res = await apiCall("/api/collecte/service/ouvrir", {
        matriculeAgent: agent.codeBarre || agent.matricule,
        serviceId: svc.id,
      });
      setCollecte({
        id: res.collecteId,
        serviceNom: res.serviceCode || svc.code,
        serviceId: res.serviceId || svc.id,
        nbAttendus: res.nbAttendus,
        linges: (res.linges || []).map(l => ({ ...l,lingeId: l.lingeId ?? l.id, })),
      });
      setSacsDeclares([]);
      setBacBlanc(null);
      setScanStatus({
        loading: false,
        success: {
          message: `${svc.code}`,
          detail: `${res.nbAttendus} ${t('collecte.linens')}`,
        },
        error: null,
      });
      setTimeout(() => setScanStatus(null), 1500);
      showAlert(
        svc.code,
        res.nbAttendus + " " + t('collecte.linens'),
        "success"
      );
    } catch (e) {
      setScanStatus({ loading: false, success: null, error: e.message });
      showAlert(e.message, "", "error");
    } finally {
      setLoading(false);
    }
  }, [agent, showAlert, t]);

  const handleBac = useCallback(async code => {
    setLoading(true);
    setScanStatus(null);
    try {
      const res = await apiCall(
        `/api/collecte/service/${collecte.id}/bac`,
        { codeOuTag: code }
      );
      if (res.typeBac === "INFECTE") {
        setScanStatus({
          loading: false,
          success: null,
          error: t('collecte.errors.red_bac_detected'),
        });
        showAlert(
          t('collecte.errors.red_bac_detected'),
          t('collecte.errors.scan_white_first'),
          "warning"
        );
        return;
      }
      setBacBlanc({ bacId: res.bacId, codeBac: res.codeBac });
      setScanStatus({
        loading: false,
        success: {
          message: `${t('collecte.white_bac')}`,
          detail: res.codeBac,
        },
        error: null,
      });
      setTimeout(() => setScanStatus(null), 1500);
      showAlert(t('collecte.white_bac'), res.codeBac, "success");
    } catch (e) {
      setScanStatus({ loading: false, success: null, error: e.message });
      showAlert(e.message, "", "error");
    } finally {
      setLoading(false);
    }
  }, [collecte, showAlert, t]);
const handleScanBlanc = useCallback(async code => {
  if (!bacBlanc?.bacId) {
    showAlert(t('collecte.errors.scan_white_first'), "", "warning");
    return;
  }
  setLoading(true);
  setScanStatus({ loading: true, code });
  try {
    const res = await apiCall(
      `/api/collecte/service/${collecte.id}/blanc`,
      { bacId: bacBlanc.bacId, codeOuTag: code }
    );

    // ✅ Chercher le lingeId de plusieurs manières pour être robuste
    const lingeIdCible = res.lingeId
      ?? res.id
      ?? collecte?.linges?.find(l => l.codeBarre === code)?.lingeId
      ?? collecte?.linges?.find(l => l.codeBarre === res.codeBarre)?.lingeId;

    if (lingeIdCible != null) {
      majLinge(lingeIdCible, "BLANC");
    } else {
      console.warn("⚠️ lingeId introuvable après scan BLANC :", { code, res });
    }

    setScanStatus({
      loading: false,
      success: {
        message: t('collecte.linen_scanned'),
        detail: t('collecte.added_to_white_bac'),
      },
      error: null,
    });
    setTimeout(() => setScanStatus(null), 1000);
  } catch (e) {
    setScanStatus({ loading: false, success: null, error: e.message });
    showAlert(e.message, code, "error");
  } finally {
    setLoading(false);
  }
}, [bacBlanc, collecte, showAlert, majLinge, t]);

  const handlePropre = useCallback(async linge => {
    setLoading(true);
    try {
      await apiCall(
        `/api/collecte/service/${collecte.id}/propre`,
        { codeOuTag: linge.codeBarre }
      );
      majLinge(linge.lingeId, "PROPRE");
      showAlert(t('collecte.propre'), linge.codeBarre, "info");
    } catch (e) {
      showAlert(e.message, "", "error");
    } finally {
      setLoading(false);
    }
  }, [collecte, showAlert, majLinge, t]);

  const handleManquant = useCallback(async linge => {
    setDlgManq(null);
    setLoading(true);
    try {
      await apiCall(
        `/api/collecte/service/${collecte.id}/manquant`,
        { lingeId: linge.lingeId }
      );
      majLinge(linge.lingeId, "MANQUANT");
      showAlert(t('collecte.missing'), linge.codeBarre, "warning");
    } catch (e) {
      showAlert(e.message, "", "error");
    } finally {
      setLoading(false);
    }
  }, [collecte, showAlert, majLinge, t]);

  const handleSacInfecte = useCallback(async ({ bacId, items }) => {
    setDlgSac(false);
    setLoading(true);
    try {
      const res = await apiCall(
        `/api/collecte/service/${collecte.id}/infecte`,
        {},
        "POST",
        {
          matriculeAgent: agent.codeBarre || agent.matricule,
          serviceId: collecte.serviceId,
          bacId,
          items,
        }
      );
      setSacsDeclares(p => [
        ...p,
        {
          ...res,
          categorie: items[0]?.categorie,
          quantite: items[0]?.quantiteDeclaree,
        },
      ]);
      const c = items[0];
      showAlert(
        t('collecte.sac_declared'),
        `${c?.quantiteDeclaree} ${c?.categorie?.toLowerCase() || t('collecte.linen')}${
          c?.quantiteDeclaree > 1 ? "s" : ""
        }`,
        "warning"
      );
    } catch (e) {
      showAlert(e.message, "", "error");
    } finally {
      setLoading(false);
    }
  }, [agent, collecte, showAlert, t]);

const handleCloturer = useCallback(async () => {
  const nbBlancs = collecte?.linges?.filter(l => l.statut === "BLANC").length || 0;
  const nbSacs = sacsDeclares.length;
  const nbTraites = collecte?.linges?.filter(l => l.statut).length || 0;
  const nbPropres = collecte?.linges?.filter(l => l.statut === "PROPRE").length || 0;
  const nbManquants = collecte?.linges?.filter(l => l.statut === "MANQUANT").length || 0;

  // ✅ Condition corrigée : au moins 1 linge traité (BLANC, PROPRE, MANQUANT) OU 1 sac
  if (nbTraites === 0 && nbSacs === 0) {
    showAlert(
      t('collecte.errors.nothing_to_close'),
      t('collecte.errors.scan_at_least_one'),
      "warning"
    );
    return;
  }

  // Construire un message récapitulatif complet
  const parts = [];
  if (nbBlancs > 0) parts.push(`${nbBlancs} ${t('collecte.white_linens')}${nbBlancs > 1 ? "s" : ""}`);
  if (nbPropres > 0) parts.push(`${nbPropres} ${t('collecte.propre')}${nbPropres > 1 ? "s" : ""}`);
  if (nbManquants > 0) parts.push(`${nbManquants} ${t('collecte.missing')}${nbManquants > 1 ? "s" : ""}`);
  if (nbSacs > 0) parts.push(`${nbSacs} ${t('collecte.infected_sacs')}${nbSacs > 1 ? "s" : ""}`);

  if (
    !(await showConfirm(
      t('collecte.close_collection'),
      parts.join(" + "),
      "question"
    ))
  )
    return;

  setLoading(true);
  try {
    const res = await apiCall(`/api/collecte/service/${collecte.id}/cloturer`);
    setResume({ ...res, serviceNom: collecte.serviceNom });
  } catch (e) {
    showAlert(e.message, "", "error");
  } finally {
    setLoading(false);
  }
}, [collecte, sacsDeclares, showAlert, showConfirm, t]);

  const handleScan = useCallback(async code => {
    setScanVal("");
    if (!collecte) {
      await handleService(code);
      return;
    }
    if (!bacBlanc) {
      await handleBac(code);
      return;
    }
    await handleScanBlanc(code);
  }, [collecte, bacBlanc, handleService, handleBac, handleScanBlanc]);

  const reset = () => {
    setCollecte(null);
    setBacBlanc(null);
    setSacsDeclares([]);
    setResume(null);
    setScanVal("");
    setScanStatus(null);
    setFilter("all");
    setTimeout(() => scanInputRef.current?.focus(), 200);
  };

  const getPlaceholder = () => {
    if (!agent) return t('collecte.agent_not_connected');
    if (!collecte) return t('collecte.scan_service_code');
    if (!bacBlanc) return t('collecte.scan_white_bac');
    if (resume) return t('collecte.collection_closed');
    return t('collecte.scan_white_linens');
  };

  const getBorderColor = () => {
    if (!agent) return "#dc2626";
    if (resume) return "#e2e8f0";
    return "#14b8a6";
  };

  const isCloturee = !!resume;
  const isDisabled = isCloturee || loading || !agent;

  return (
    <div className="collecte-container">
      <DlgSacInfecte
        visible={dlgSac}
        collecteId={collecte?.id}
        onValider={handleSacInfecte}
        onClose={() => setDlgSac(false)}
        t={t}
      />
      <DlgManquant
        linge={dlgManq}
        onOk={handleManquant}
        onClose={() => setDlgManq(null)}
        t={t}
      />

      {/* ═══════════════════════════════════════════════════════════
          HEADER PREMIUM — Identique à Distribution & Collecte Chambre
          ═══════════════════════════════════════════════════════════ */}
      <div style={{ marginBottom: 32 }}>
        <div style={{
          display: "flex", alignItems: "center",
          gap: 16, marginBottom: 8,
        }}>
          <motion.div
            whileHover={{ rotate: -5, scale: 1.05 }}
            transition={{ duration: 0.3 }}
            style={{
              width: 60, height: 60, borderRadius: 20,
              background: "linear-gradient(135deg, #14b8a6, #0d9488)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "white",
              boxShadow: "0 10px 28px rgba(20, 184, 166, 0.35)",
            }}
          >
            <Icons.Building size={28} color="white" strokeWidth={2.2} />
          </motion.div>
          <div>
            <h1 style={{
              fontSize: 28, fontWeight: 800, color: "#0f172a",
              margin: 0, letterSpacing: "-0.025em",
            }}>
              {t('collecte.service_collection')}
            </h1>
            <p style={{
              fontSize: 13.5, color: "#64748b",
              margin: "4px 0 0 0", fontWeight: 500,
              display: "flex", alignItems: "center", gap: 7,
            }}>
              {agent ? (
                <>
                  <Icons.User size={13} color="#0d9488" strokeWidth={2.2} />
                  {`${t('collecte.agent')}: ${agent.nomPrenom || agent.nom}`}
                </>
              ) : (
                t('collecte.no_agent_connected')
              )}
            </p>
          </div>
        </div>
      </div>

      <div style={{
        background: "white", borderRadius: 24, padding: 30,
        border: "1px solid #e2e8f0",
        boxShadow: "0 12px 40px rgba(15,23,42,0.06)",
      }}>

        {/* ═══ BARRE D'INFO ═══ */}
        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: 20,
          flexWrap: "wrap", gap: 10,
        }}>
          <div style={{
            display: "flex", alignItems: "center",
            gap: 10, flexWrap: "wrap",
          }}>
            {agent && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{
                  display: "flex", alignItems: "center", gap: 9,
                  padding: "9px 18px", background: "#f0fdf4",
                  borderRadius: 12, border: "1px solid #bbf7d0",
                }}
              >
                <Icons.User size={14} color="#15803d" strokeWidth={2.2} />
                <span style={{ fontSize: 13, fontWeight: 700, color: "#15803d" }}>
                  {agent.nomPrenom || agent.nom}
                </span>
              </motion.div>
            )}
            {collecte && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                style={{
                  display: "flex", alignItems: "center", gap: 9,
                  padding: "9px 18px", background: "#f0f9ff",
                  borderRadius: 12, border: "1px solid #bae6fd",
                }}
              >
                <Icons.Building size={14} color="#0284c7" strokeWidth={2.2} />
                <span style={{ fontSize: 13, fontWeight: 700, color: "#0284c7" }}>
                  {collecte.serviceNom}
                </span>
                <Badge style={{
                  background: "#dbeafe", color: "#0284c7",
                  fontSize: 10, padding: "2px 10px", borderRadius: 20,
                  fontWeight: 700,
                }}>
                  {totalAttendu}
                </Badge>
              </motion.div>
            )}
            {bacBlanc && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                style={{
                  display: "flex", alignItems: "center", gap: 9,
                  padding: "9px 18px", background: "#faf5ff",
                  borderRadius: 12, border: "1px solid #c4b5fd",
                }}
              >
                <Icons.Boxes size={14} color="#7c3aed" strokeWidth={2.2} />
                <span style={{ fontSize: 13, fontWeight: 700, color: "#7c3aed" }}>
                  {bacBlanc.codeBac}
                </span>
                <Badge style={{
                  background: "#ede9fe", color: "#7c3aed",
                  fontSize: 10, padding: "2px 10px", borderRadius: 20,
                  fontWeight: 700,
                }}>
                  {t('collecte.white_bac')}
                </Badge>
              </motion.div>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={reset}
            style={{
              fontSize: 12, gap: 6, borderColor: "#fca5a5",
              color: "#dc2626", borderRadius: 10, padding: "7px 15px",
              transition: "all 0.2s", fontWeight: 700,
              display: "inline-flex", alignItems: "center",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "#fef2f2"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <Icons.Refresh size={13} strokeWidth={2.5} />
            {t('common.reset')}
          </Button>
        </div>

        {/* ═══ ZONE DE SCAN ═══ */}
        <Card style={{
          marginBottom: 20,
          border: `2px dashed ${getBorderColor()}`,
          borderRadius: 16, position: "relative", overflow: "hidden",
          background: isCloturee ? "#f8fafc" : "white",
        }}>
          {!isCloturee && bacBlanc && (
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 3,
              background: "linear-gradient(90deg, #14b8a6, #0d9488, #14b8a6)",
              backgroundSize: "200% 100%",
              animation: "shimmer 2s infinite",
            }} />
          )}
          <CardContent className="p-5">
            <ScanInput
              ref={scanInputRef}
              placeholder={getPlaceholder()}
              value={scanVal}
              onChange={setScanVal}
              onSubmit={handleScan}
              borderColor={getBorderColor()}
              keepFocus={true}
              autoDebounce={true}
              disabled={isDisabled}
            />
            <ScanStatusComponent status={scanStatus} t={t} />
          </CardContent>
        </Card>

        {/* ═══ MESSAGES D'ÉTAT ═══ */}
        {!agent && (
          <div style={{
            padding: "13px 17px", borderRadius: 12,
            background: "linear-gradient(135deg, #fef2f2, #fee2e2)",
            border: "1px solid #fca5a5", marginBottom: 16,
            display: "flex", alignItems: "center", gap: 11,
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
              <div style={{ fontSize: 13.5, color: "#dc2626", fontWeight: 800 }}>
                {t('collecte.no_agent_connected')}
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2, fontWeight: 500 }}>
                {t('collecte.connect_to_collect')}
              </div>
            </div>
          </div>
        )}

        {agent && !collecte && (
          <div style={{
            padding: "13px 17px", borderRadius: 12,
            background: "linear-gradient(135deg, #eff6ff, #dbeafe)",
            border: "1px solid #93c5fd", marginBottom: 16,
            display: "flex", alignItems: "center", gap: 11,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "white", display: "flex",
              alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 8px rgba(59,130,246,0.15)",
            }}>
              <Icons.Building size={16} color="#3b82f6" strokeWidth={2.2} />
            </div>
            <div>
              <div style={{ fontSize: 13.5, color: "#1d4ed8", fontWeight: 800 }}>
                {t('collecte.scan_service_code')}
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2, fontWeight: 500 }}>
                {t('collecte.to_start_collection')}
              </div>
            </div>
          </div>
        )}

        {agent && collecte && !bacBlanc && !resume && (
          <div style={{
            padding: "13px 17px", borderRadius: 12,
            background: "linear-gradient(135deg, #faf5ff, #ede9fe)",
            border: "1px solid #c4b5fd", marginBottom: 16,
            display: "flex", alignItems: "center", gap: 11,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "white", display: "flex",
              alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 8px rgba(124,58,237,0.15)",
            }}>
              <Icons.Boxes size={16} color="#7c3aed" strokeWidth={2.2} />
            </div>
            <div>
              <div style={{ fontSize: 13.5, color: "#7c3aed", fontWeight: 800 }}>
                {t('collecte.scan_white_bac')}
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2, fontWeight: 500 }}>
                {t('collecte.to_associate_linens')}
              </div>
            </div>
          </div>
        )}

        {agent && collecte && bacBlanc && !resume && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              padding: "13px 17px", borderRadius: 12,
              background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
              border: "1px solid #bbf7d0", marginBottom: 16,
              display: "flex", alignItems: "center", gap: 11, flexWrap: "wrap",
            }}
          >
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "white", display: "flex",
              alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 8px rgba(34,197,94,0.15)",
            }}>
              <Icons.CheckCircle size={16} color="#22c55e" strokeWidth={2.5} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, color: "#15803d", fontWeight: 800 }}>
                {t('collecte.ready_to_collect')}
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2, fontWeight: 500 }}>
                {t('collecte.scan_linens_to_collect')}
              </div>
            </div>
            <Badge style={{
              background: "#dcfce7", color: "#15803d",
              fontSize: 10, padding: "5px 14px", borderRadius: 20,
              fontWeight: 800,
              display: "inline-flex", alignItems: "center", gap: 6,
            }}>
              <Icons.Package size={12} color="#15803d" strokeWidth={2.5} />
              {bacBlanc.codeBac}
            </Badge>
          </motion.div>
        )}

        {/* ═══ PROGRESSION ═══ */}
        {collecte && !resume && (
          <div style={{
            padding: "16px 20px", borderRadius: 14,
            background: "linear-gradient(135deg, #f8fafc, #f1f5f9)",
            marginBottom: 20, border: "1px solid #e2e8f0",
          }}>
            <div style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "center", flexWrap: "wrap", gap: 8,
              marginBottom: 8,
            }}>
              <span style={{
                fontSize: 13, color: "#475569", fontWeight: 600,
                display: "flex", alignItems: "center", gap: 7,
              }}>
                <Icons.HandHoldingHeart size={15} color="#14b8a6" strokeWidth={2.2} />
                <strong style={{ color: "#0f172a" }}>{totalTraite}</strong> / {totalAttendu}{" "}
                {t('collecte.pieces_processed')}
              </span>
              <span style={{
                fontSize: 22, fontWeight: 800,
                color: progression === 100 ? "#10b981" : "#14b8a6",
                display: "flex", alignItems: "center", gap: 6,
                letterSpacing: "-0.02em",
              }}>
                {progression}%
                {progression === 100 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500 }}
                  >
                    <Icons.Sparkles size={18} color="#10b981" strokeWidth={2.5} />
                  </motion.div>
                )}
              </span>
            </div>
            <ProgressionBar
              value={progression}
              label=""
              color={progression === 100 ? "#10b981" : "#14b8a6"}
            />
          </div>
        )}

        {/* ═══ STATISTIQUES ═══ */}
        {collecte && !resume && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 12, marginBottom: 20,
          }}>
            <StatutCard
              label={t('collecte.white')}
              value={nbBlancs}
              icon={<Icons.CheckCheck size={19} color="#15803d" strokeWidth={2.5} />}
              color="#15803d"
              bg="linear-gradient(135deg, #f0fdf4, #dcfce7)"
              subValue={`${collecte.nbAttendus} ${t('collecte.expected')}`}
              onClick={() => setFilter("blanc")}
              active={filter === "blanc"}
            />
            <StatutCard
              label={t('collecte.infected')}
              value={nbInfectes}
              icon={<Icons.Biohazard size={19} color="#dc2626" strokeWidth={2.2} />}
              color="#dc2626"
              bg="linear-gradient(135deg, #fef2f2, #fee2e2)"
              subValue={`${sacsDeclares.length} ${t('collecte.sacs')}`}
            />
            <StatutCard
              label={t('collecte.propre')}
              value={nbPropres}
              icon={<Icons.CheckCircle size={19} color="#0284c7" strokeWidth={2.5} />}
              color="#0284c7"
              bg="linear-gradient(135deg, #f0f9ff, #e0f2fe)"
              subValue={t('collecte.kept_in_place')}
              onClick={() => setFilter("propre")}
              active={filter === "propre"}
            />
            <StatutCard
              label={t('collecte.missing')}
              value={nbManq}
              icon={<Icons.AlertTriangle size={19} color="#d97706" strokeWidth={2.2} />}
              color="#d97706"
              bg="linear-gradient(135deg, #fffbeb, #fef3c7)"
              subValue={t('collecte.to_report')}
              onClick={() => setFilter("manquant")}
              active={filter === "manquant"}
            />
            <StatutCard
              label={t('collecte.remaining')}
              value={nbNonTr}
              icon={<Icons.Refresh size={19} color={nbNonTr > 0 ? "#f59e0b" : "#10b981"} strokeWidth={2.2} />}
              color={nbNonTr > 0 ? "#f59e0b" : "#10b981"}
              bg={nbNonTr > 0 ? "linear-gradient(135deg, #fffbeb, #fef3c7)" : "linear-gradient(135deg, #f0fdf4, #dcfce7)"}
              subValue={
                nbNonTr > 0
                  ? `${Math.round((nbNonTr / totalAttendu) * 100)}%`
                  : `${t('collecte.all_done')}`
              }
              onClick={() => setFilter("untreated")}
              active={filter === "untreated"}
            />
          </div>
        )}

        {/* ═══ SACS INFECTÉS DÉCLARÉS ═══ */}
        {sacsDeclares.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            style={{
              padding: "14px 18px",
              background: "linear-gradient(135deg, #fef2f2, #fff5f5)",
              borderRadius: 14, border: "1px solid #fca5a5",
              marginBottom: 18, overflow: "hidden",
            }}
          >
            <div style={{
              display: "flex", alignItems: "center",
              gap: 11, marginBottom: 12,
            }}>
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: "white", display: "flex",
                  alignItems: "center", justifyContent: "center",
                  boxShadow: "0 2px 8px rgba(220,38,38,0.15)",
                }}
              >
                <Icons.Biohazard size={16} color="#dc2626" strokeWidth={2.2} />
              </motion.div>
              <span style={{
                fontSize: 13.5, color: "#dc2626", fontWeight: 800,
              }}>
                {t('collecte.infected_sacs_declared')}
              </span>
              <Badge style={{
                background: "#fee2e2", color: "#dc2626",
                fontSize: 10, padding: "4px 12px",
                marginLeft: "auto", borderRadius: 20,
                fontWeight: 800,
              }}>
                {sacsDeclares.length} {t('collecte.sacs')} · {nbInfectes}{" "}
                {t('collecte.pieces')}
              </Badge>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {sacsDeclares.map((s, i) => {
                const c = cat(s.categorie);
                return (
                  <motion.div
                    key={i}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "6px 12px", background: "white",
                      borderRadius: 9, border: "1px solid #fca5a5",
                      fontSize: 11, boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                    }}
                  >
                    <span style={{ fontSize: 14 }}>{c.emoji}</span>
                    <span style={{ fontWeight: 800, color: "#dc2626" }}>
                      {s.quantite}
                    </span>
                    <span style={{
                      color: "#94a3b8", fontSize: 10,
                      fontFamily: "monospace", fontWeight: 600,
                    }}>
                      {s.numeroSac}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ═══ FILTRES ═══ */}
        {collecte && !resume && (
          <>
            <div style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "center", flexWrap: "wrap", gap: 8,
              marginBottom: 14,
            }}>
              <div style={{
                display: "flex", alignItems: "center",
                gap: 7, flexWrap: "wrap",
              }}>
                <Icons.Filter size={14} color="#94a3b8" strokeWidth={2.2} />
                <span style={{ fontSize: 11.5, color: "#94a3b8", fontWeight: 700 }}>
                  {t('collecte.filter')}:
                </span>
                {["all", "untreated", "blanc", "propre", "manquant"].map(f => (
                  <motion.button
                    key={f}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setFilter(f)}
                    style={{
                      padding: "5px 14px", borderRadius: 12,
                      border: filter === f ? "1.5px solid #14b8a6" : "1px solid #e2e8f0",
                      background: filter === f ? "#ccfbf1" : "transparent",
                      color: filter === f ? "#0d9488" : "#64748b",
                      fontSize: 11.5, fontWeight: filter === f ? 800 : 600,
                      cursor: "pointer", transition: "all 0.2s",
                    }}
                  >
                    {f === "all" && t('collecte.all')}
                    {f === "untreated" && t('collecte.to_treat')}
                    {f === "blanc" && t('collecte.white')}
                    {f === "propre" && t('collecte.propre')}
                    {f === "manquant" && t('collecte.missing')}
                  </motion.button>
                ))}
              </div>
              <span style={{
                fontSize: 11, color: "#94a3b8",
                fontWeight: 800, padding: "4px 13px",
                background: "#f1f5f9", borderRadius: 10,
              }}>
                {filteredLinges.length}
              </span>
            </div>

            {/* ═══ LISTE DES LINGES ═══ */}
            <div style={{
              maxHeight: 280, overflowY: "auto",
              marginBottom: 18, paddingRight: 4,
            }}>
              <AnimatePresence>
                {filteredLinges.length === 0 ? (
                  <div style={{
                    textAlign: "center", padding: 24,
                    color: "#94a3b8", fontSize: 12.5, fontWeight: 500,
                  }}>
                    {t('collecte.no_linens_match_filter')}
                  </div>
                ) : (
                  filteredLinges.map(linge => (
                    <CarteLinge
                      key={linge.lingeId}
                      linge={linge}
                      bacBlanc={bacBlanc}
                      onBlanc={handleScanBlanc}
                      onPropre={handlePropre}
                      onManquant={x => setDlgManq(x)}
                      t={t}
                    />
                  ))
                )}
              </AnimatePresence>
            </div>

            {/* ═══ BOUTONS D'ACTION ═══ */}
<div style={{
  display: "flex", gap: 12, flexWrap: "wrap",
  alignItems: "center", justifyContent: "flex-start",
  paddingTop: 16, borderTop: "1px solid #f1f5f9",
}}>
  <ActionButton
    onClick={() => setDlgSac(true)}
    icon={<Icons.Biohazard size={15} color="white" strokeWidth={2.5} />}
    label={t('collecte.declare_infected')}
    type="danger"
  />

  {nbNonTr > 0 && (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "8px 14px", background: "#fffbeb",
        borderRadius: 10, border: "1px solid #fcd34d",
      }}
    >
      <Icons.AlertTriangle size={13} color="#d97706" strokeWidth={2.5} />
      <span style={{ fontSize: 12, fontWeight: 800, color: "#d97706" }}>
        {nbNonTr} {t('collecte.remaining').toLowerCase()}
      </span>
    </motion.div>
  )}

  {nbNonTr === 0 && collecte && (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "8px 14px", background: "#f0fdf4",
        borderRadius: 10, border: "1px solid #86efac",
      }}
    >
      <Icons.CheckCircle size={13} color="#10b981" strokeWidth={2.5} />
      <span style={{ fontSize: 12, fontWeight: 800, color: "#15803d" }}>
        {t('collecte.all_done')}
      </span>
      <Icons.Sparkles size={13} color="#10b981" strokeWidth={2.5} />
    </motion.div>
  )}

  <ActionButton
    onClick={handleCloturer}
    disabled={
      loading ||
      // ✅ Désactiver si AUCUN linge traité ET aucun sac déclaré
      (totalTraite === 0 && sacsDeclares.length === 0)
    }
    loading={loading}
    icon={nbNonTr === 0
      ? <Icons.ClipboardCheck size={15} color="white" strokeWidth={2.5} />
      : <Icons.ArrowRight size={15} color="white" strokeWidth={2.5} />}
    label={nbNonTr === 0
      ? t('collecte.finish_and_close')
      : t('collecte.close_with_remaining', { count: nbNonTr })}
    type={nbNonTr === 0 ? "success" : "warning"}
    badge={nbNonTr > 0 ? `${nbNonTr}` : null}
  />
</div>
          </>
        )}

        {/* ═══ RÉSUMÉ ═══ */}
        {resume && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            style={{
              background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
              borderRadius: 20, padding: 32,
              border: "2px solid #86efac", textAlign: "center",
              position: "relative", overflow: "hidden",
            }}
          >
            <div style={{
              position: "absolute", top: 0, right: 0,
              width: 140, height: 140,
              background: "radial-gradient(circle, rgba(16,185,129,0.12), transparent)",
              borderRadius: "50%", transform: "translate(60px, -60px)",
            }} />

            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.2 }}
              style={{
                width: 80, height: 80, borderRadius: "50%",
                background: "linear-gradient(135deg, #dcfce7, #bbf7d0)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 16px",
                boxShadow: "0 12px 32px rgba(16,185,129,0.25)",
                border: "2px solid #86efac",
              }}
            >
              <Icons.CheckCheck size={38} color="#15803d" strokeWidth={2.5} />
            </motion.div>

            <h2 style={{
              fontSize: 24, fontWeight: 800, color: "#15803d",
              margin: 0, marginBottom: 6, letterSpacing: "-0.02em",
            }}>
              {t('collecte.collection_completed')}
            </h2>
            <p style={{ fontSize: 13.5, color: "#059669", marginBottom: 22, fontWeight: 600 }}>
              {resume.serviceNom || collecte?.serviceNom}
            </p>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
              gap: 12, marginBottom: 22,
              background: "white", borderRadius: 16, padding: 18,
              boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
              border: "1px solid #bbf7d0",
            }}>
              {[
                [<Icons.CheckCheck size={22} color="#15803d" strokeWidth={2.5} />, t('collecte.white'), resume.nbBlancs, "#15803d", "#f0fdf4"],
                [<Icons.Biohazard size={22} color="#dc2626" strokeWidth={2.2} />, t('collecte.infected'), resume.nbInfectes, "#dc2626", "#fef2f2"],
                [<Icons.CheckCircle size={22} color="#0284c7" strokeWidth={2.5} />, t('collecte.propre'), resume.nbPropres, "#0284c7", "#f0f9ff"],
                [<Icons.AlertTriangle size={22} color="#d97706" strokeWidth={2.2} />, t('collecte.missing'), resume.nbManquants, "#d97706", "#fffbeb"],
              ].map(([icon, label, value, color, bg], i) => (
                <motion.div
                  key={label}
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 + i * 0.08 }}
                  style={{
                    background: bg, borderRadius: 12,
                    padding: "14px 8px", border: `1px solid ${color}25`,
                  }}
                >
                  <div style={{
                    display: "flex", alignItems: "center",
                    justifyContent: "center", marginBottom: 8,
                  }}>
                    {icon}
                  </div>
                  <div style={{
                    fontSize: 24, fontWeight: 800, color,
                    lineHeight: 1, letterSpacing: "-0.02em",
                  }}>
                    {value || 0}
                  </div>
                  <div style={{
                    fontSize: 10, color: "#64748b",
                    fontWeight: 800, marginTop: 6,
                    textTransform: "uppercase", letterSpacing: "0.5px",
                  }}>
                    {label}
                  </div>
                </motion.div>
              ))}
            </div>

            {sacsDeclares.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                style={{
                  padding: "12px 18px", background: "#fef2f2",
                  borderRadius: 12, fontSize: 12.5, color: "#dc2626",
                  fontWeight: 700, marginBottom: 22,
                  border: "1px solid #fca5a5",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  gap: 9,
                }}
              >
                <Icons.Biohazard size={15} color="#dc2626" strokeWidth={2.5} />
                {sacsDeclares.length} {t('collecte.infected_sacs')} (
                {nbInfectes} {t('collecte.pieces')}) → {t('collecte.waiting_for_reception')}
              </motion.div>
            )}

            <div style={{
              display: "flex", gap: 12, flexWrap: "wrap",
              justifyContent: "center",
            }}>
              <ActionButton
                onClick={() => {
                  setCollecte(null);
                  setBacBlanc(null);
                  setSacsDeclares([]);
                  setResume(null);
                  setFilter("all");
                }}
                icon={<Icons.BoxOpen size={15} color="white" strokeWidth={2.5} />}
                label={`+ ${t('collecte.another_service')}`}
                type="primary"
              />
              <ActionButton
                onClick={reset}
                icon={null}
                label={t('collecte.finish')}
                type="default"
              />
            </div>
          </motion.div>
        )}
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
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
          display: inline-block;
        }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 4px; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  );
}

export default function CollageListService() {
  return <CollageListServiceInner />;
}