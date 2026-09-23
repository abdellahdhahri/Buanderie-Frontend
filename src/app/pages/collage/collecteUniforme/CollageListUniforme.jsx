import React, { useState, useRef, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useModal } from "../../../contextes/ModalContext";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import ScanInput from "../../../components/utils/shared/ScanInput";
import { cat, ST_COLORS, apiCall } from "../collecteUtils";
import { getAgent, isAgentConnected } from "../../../services/agentService";
import "../../Linge/WorkflowList.css";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8082';


/* ═══════════════════════════════════════════════════════════════════════════
   BIBLIOTHÈQUE SVG PERSONNALISÉE
   ═══════════════════════════════════════════════════════════════════════════ */
const Icons = {
  User: ({ size = 20, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),

  UserMd: ({ size = 20, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
      <path d="M12 15v6" />
      <path d="M9 18h6" />
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

  Package: ({ size = 20, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M16.5 9.4 7.55 4.24" />
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
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

  Shirt: ({ size = 20, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
    </svg>
  ),

  Activity: ({ size = 20, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2" />
    </svg>
  ),

  Layers: ({ size = 20, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" />
      <path d="m22 12.18-9.17 4.16a2 2 0 0 1-1.66 0L2 12.18" />
      <path d="m22 17.18-9.17 4.16a2 2 0 0 1-1.66 0L2 17.18" />
    </svg>
  ),

  Sparkles: ({ size = 20, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
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

  ClipboardCheck: ({ size = 20, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="m9 14 2 2 4-4" />
    </svg>
  ),

  ArrowRight: ({ size = 20, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  ),

  AlertOctagon: ({ size = 20, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </svg>
  ),
};


/* ═══════════════════════════════════════════════════════════════════════════
   ScanStatus — Identique à CollecteChambre
   ═══════════════════════════════════════════════════════════════════════════ */
function ScanStatus({ loading, success, error, code, t }) {
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
            {t('collecte_uniforme.scanning')}
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
            {success.message || t('collecte_uniforme.success')}
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
   StatutCard — Identique à CollecteChambre
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
    >
      <Icon size={14} color={color} strokeWidth={2.5} />
    </motion.button>
  );
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
        maxWidth: 400, width: "92%",
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
                {t('collecte_uniforme.missing_uniform')}
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
            Cet uniforme sera marqué comme <strong>manquant</strong> dans la collecte.
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
            {t('collecte_uniforme.confirm_missing')}
          </motion.button>
        </div>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════════════════
   CarteUniforme — Ligne d'uniforme premium
   ═══════════════════════════════════════════════════════════════════════════ */
function CarteUniforme({ u, uniformeEnCours, onManquant, t }) {
  const c = cat(u.categorie);
  const col = ST_COLORS[u.statut];
  const estActif = uniformeEnCours?.lingeId === u.lingeId;
  const isTraite = !!u.statut;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "center", padding: "12px 16px", borderRadius: 14,
        border: `1.5px solid ${estActif ? "#0ea5e9" : isTraite ? (col?.b || "#e2e8f0") : "#e2e8f0"}`,
        background: estActif
          ? "linear-gradient(135deg, #e0f2fe, #bae6fd)"
          : isTraite
          ? `linear-gradient(135deg, ${col?.bg || "#f8fafc"}, ${col?.bg || "#f1f5f9"})`
          : "linear-gradient(135deg, #ffffff, #f8fafc)",
        marginBottom: 8,
        transition: "all 0.25s",
        boxShadow: estActif
          ? "0 8px 20px rgba(14,165,233,0.15)"
          : isTraite ? "none" : "0 2px 8px rgba(15,23,42,0.04)",
        position: "relative",
      }}
    >
      {estActif && (
        <div style={{
          position: "absolute", left: 0, top: 0, bottom: 0, width: 3,
          borderRadius: "3px 0 0 3px",
          background: "linear-gradient(180deg, #0ea5e9, #0284c7)",
        }} />
      )}

      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        flex: 1, minWidth: 0,
        paddingLeft: estActif ? 6 : 0,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 11,
          background: c.bg, display: "flex",
          alignItems: "center", justifyContent: "center",
          fontSize: 19, flexShrink: 0,
          border: `1px solid ${c.color}20`,
        }}>
          {c.emoji}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 6, marginBottom: 2,
          }}>
            <span style={{
              fontSize: 12.5, fontWeight: 700, color: c.color,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {c.label}
            </span>
            {u.estInfecte && !u.statut && (
              <span style={{
                fontSize: 9, padding: "2px 7px", borderRadius: 20,
                background: "#fee2e2", color: "#dc2626", fontWeight: 800,
                display: "inline-flex", alignItems: "center", gap: 3,
                border: "1px solid #fca5a5",
                letterSpacing: "0.3px",
              }}>
                <Icons.Biohazard size={9} color="#dc2626" strokeWidth={2.5} />
                INF
              </span>
            )}
            {estActif && (
              <span style={{
                fontSize: 9, padding: "2px 8px", borderRadius: 20,
                background: "#cffafe", color: "#0891b2", fontWeight: 800,
                border: "1px solid #a5f3fc",
                letterSpacing: "0.3px",
                display: "inline-flex", alignItems: "center", gap: 3,
              }}>
                <Icons.Package size={9} color="#0891b2" strokeWidth={2.5} />
                {t('collecte_uniforme.scan_bin')}
              </span>
            )}
          </div>
          <code style={{
            fontSize: 10.5, color: "#94a3b8", fontWeight: 600,
            display: "block", overflow: "hidden",
            textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {u.codeBarre}
          </code>
        </div>
      </div>

      {isTraite ? (
        <span style={{
          fontSize: 10, fontWeight: 800, letterSpacing: "0.4px",
          padding: "5px 12px", borderRadius: 20,
          background: col?.tag, color: col?.tc,
          flexShrink: 0, textTransform: "uppercase",
          border: `1px solid ${col?.b}`,
        }}>
          {col?.lbl}
        </span>
      ) : (
        <BoutonAction
          onClick={() => onManquant(u)}
          title={t('collecte_uniforme.missing')}
          Icon={Icons.AlertTriangle}
          color="#d97706"
          bg="#fef3c7"
          border="#fde68a"
        />
      )}
    </motion.div>
  );
}


/* ═══════════════════════════════════════════════════════════════════════════
   BoutonCloturer — NOUVEAU design premium (celui-ci ne vous plaisait pas)
   
   Design : Bouton hero pleine largeur avec icône à gauche, label structuré
   au centre, badge à droite. 3 variantes selon la progression.
   ═══════════════════════════════════════════════════════════════════════════ */
function BoutonCloturer({ onClick, loading, nonTr, total, t }) {
  const isComplete = nonTr === 0;
  const pct = total > 0 ? Math.round(((total - nonTr) / total) * 100) : 0;

  const theme = isComplete
    ? {
        gradient: "linear-gradient(135deg, #10b981, #059669)",
        hoverGradient: "linear-gradient(135deg, #059669, #047857)",
        shadow: "rgba(16,185,129,0.35)",
        hoverShadow: "rgba(16,185,129,0.5)",
        Icon: Icons.ClipboardCheck,
        iconColor: "white",
        title: t('collecte_uniforme.finish_and_close'),
        subtitle: "Tous les uniformes traités",
        badgeText: "100%",
      }
    : {
        gradient: "linear-gradient(135deg, #f59e0b, #d97706)",
        hoverGradient: "linear-gradient(135deg, #d97706, #b45309)",
        shadow: "rgba(217,119,6,0.35)",
        hoverShadow: "rgba(217,119,6,0.5)",
        Icon: Icons.AlertOctagon,
        iconColor: "white",
        title: t('collecte_uniforme.close_with_unprocessed'),
        subtitle: `${nonTr} ${t('collecte_uniforme.unprocessed')} restant${nonTr > 1 ? "s" : ""}`,
        badgeText: `${pct}%`,
      };

  const IconComponent = theme.Icon;

  return (
    <motion.button
      whileHover={!loading ? { y: -2 } : {}}
      whileTap={!loading ? { scale: 0.985 } : {}}
      onClick={onClick}
      disabled={loading}
      style={{
        width: "100%",
        padding: "18px 24px",
        borderRadius: 16,
        border: "none",
        background: loading ? "#e2e8f0" : theme.gradient,
        color: loading ? "#94a3b8" : "white",
        cursor: loading ? "not-allowed" : "pointer",
        display: "flex", alignItems: "center", gap: 16,
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        boxShadow: loading ? "none" : `0 8px 24px ${theme.shadow}`,
        position: "relative", overflow: "hidden",
        textAlign: "left",
      }}
      onMouseEnter={(e) => {
        if (!loading) {
          e.currentTarget.style.boxShadow = `0 12px 32px ${theme.hoverShadow}`;
        }
      }}
      onMouseLeave={(e) => {
        if (!loading) {
          e.currentTarget.style.boxShadow = `0 8px 24px ${theme.shadow}`;
        }
      }}
    >
      {/* Halo décoratif */}
      <div style={{
        position: "absolute", top: -40, right: -40,
        width: 140, height: 140, borderRadius: "50%",
        background: "rgba(255,255,255,0.12)",
        filter: "blur(20px)", pointerEvents: "none",
      }} />

      {/* Icône dans un carré */}
      <div style={{
        width: 52, height: 52, borderRadius: 14,
        background: "rgba(255,255,255,0.2)",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(255,255,255,0.3)",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
        position: "relative", zIndex: 1,
      }}>
        {loading ? (
          <div className="animate-spin">
            <Icons.Loader size={24} color="white" strokeWidth={2.5} />
          </div>
        ) : (
          <IconComponent size={26} color="white" strokeWidth={2.2} />
        )}
      </div>

      {/* Textes */}
      <div style={{ flex: 1, position: "relative", zIndex: 1 }}>
        <div style={{
          fontSize: 15, fontWeight: 800,
          letterSpacing: "-0.01em", marginBottom: 3,
        }}>
          {loading ? "Traitement..." : theme.title}
        </div>
        <div style={{
          fontSize: 12, fontWeight: 600,
          opacity: 0.85,
          display: "flex", alignItems: "center", gap: 6,
        }}>
          {!loading && isComplete && (
            <Icons.Sparkles size={12} color="white" strokeWidth={2.5} />
          )}
          {theme.subtitle}
        </div>
      </div>

      {/* Badge progression */}
      {!loading && (
        <div style={{
          padding: "8px 16px", borderRadius: 20,
          background: "rgba(255,255,255,0.2)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,0.3)",
          fontSize: 14, fontWeight: 800,
          letterSpacing: "-0.01em",
          flexShrink: 0,
          position: "relative", zIndex: 1,
        }}>
          {theme.badgeText}
        </div>
      )}
    </motion.button>
  );
}


/* ═══════════════════════════════════════════════════════════════════════════
   PAGE PRINCIPALE
   ═══════════════════════════════════════════════════════════════════════════ */
function CollageListUniformeInner() {
  const { t } = useTranslation();
  const { showAlert, showConfirm } = useModal();

  const [etape, setEtape] = useState("BADGE");
  const [agent, setAgent] = useState(null);
  const [collecte, setCollecte] = useState(null);
  const [uniformeEnCours, setUniformeEnCours] = useState(null);
  const [scanVal, setScanVal] = useState("");
  const [loading, setLoading] = useState(false);
  const [resume, setResume] = useState(null);
  const [dlgManq, setDlgManq] = useState(null);
  const [scanStatus, setScanStatus] = useState(null);

  const agentRef = useRef(null);
  const collecteRef = useRef(null);
  const scanInputRef = useRef(null);
  const scanTimeoutRef = useRef(null);

  useEffect(() => { agentRef.current = agent; }, [agent]);
  useEffect(() => { collecteRef.current = collecte; }, [collecte]);

  useEffect(() => {
    const agentData = getAgent();
    if (agentData && isAgentConnected()) {
      const ag = {
        matricule: agentData.codeBarre || agentData.matricule,
        nom: agentData.nom || "Inconnu",
        prenom: agentData.prenom || "",
        nomPrenom: agentData.nomPrenom || agentData.nom || "Inconnu",
        codeBarre: agentData.codeBarre || agentData.matricule,
        id: agentData.id,
        poste: agentData.poste || "AGENT_COLLECTE"
      };
      setAgent(ag);
      setEtape("BADGE");
      setScanStatus({
        loading: false,
        success: {
          message: `${ag.nomPrenom || ag.nom}`,
          detail: `${t('collecte_uniforme.connected')} · ${ag.codeBarre || ag.matricule}`
        },
        error: null
      });
      setTimeout(() => setScanStatus(null), 2000);
    } else {
      setEtape("BADGE");
      setScanStatus({
        loading: false,
        success: null,
        error: t('collecte_uniforme.no_agent_connected')
      });
    }
  }, [t]);

  useEffect(() => {
    if (scanVal.trim().length < 2) return;
    clearTimeout(scanTimeoutRef.current);
    scanTimeoutRef.current = setTimeout(() => {
      const code = scanVal.trim();
      setScanVal("");
      handleScan(code);
    }, 300);
    return () => clearTimeout(scanTimeoutRef.current);
  }, [scanVal]);

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

  const majUniforme = useCallback((lingeId, statut) => {
    setCollecte(p => p ? {
      ...p,
      uniformes: p.uniformes.map(u => u.lingeId === lingeId ? { ...u, statut } : u)
    } : p);
  }, []);

  const handleBadge = useCallback(async (code) => {
    if (!agent) {
      showAlert(
        t('collecte_uniforme.errors.agent_not_connected'),
        t('collecte_uniforme.errors.agent_not_connected_text'),
        "error"
      );
      return;
    }
    setLoading(true);
    setScanStatus(null);
    try {
      const res = await apiCall("/api/collecte/uniforme/ouvrir", {
        matriculeAgent: agent.codeBarre || agent.matricule,
        codeBadge: code
      });
      setCollecte({
        id: res.collecteId,
        personnelNom: res.personnelNom,
        personnelFonction: res.personnelFonction,
        personnelId: res.personnelId,
        estInfecte: res.estInfecte,
        infoInfection: res.infoInfection,
        nbUniformes: res.nbUniformes,
        uniformes: (res.uniformes || []).map(u => ({ ...u, statut: "" }))
      });
      setUniformeEnCours(null);
      setEtape("SCAN");
      setScanStatus({
        loading: false,
        success: {
          message: res.estInfecte ? t('collecte_uniforme.infectious_contact') : res.personnelNom,
          detail: res.estInfecte
            ? res.infoInfection || t('collecte_uniforme.potentially_infected')
            : `${res.nbUniformes} ${t('collecte_uniforme.uniforms')}`
        },
        error: null
      });
      setTimeout(() => setScanStatus(null), 3000);

      if (res.estInfecte) {
        showAlert(
          t('collecte_uniforme.infectious_contact'),
          `${res.personnelNom} — ${res.infoInfection || t('collecte_uniforme.potentially_infected')}`,
          "warning"
        );
      } else {
        showAlert(
          t('collecte_uniforme.doctor_identified'),
          `${res.personnelNom} — ${res.nbUniformes} ${t('collecte_uniforme.uniforms')}`,
          "success"
        );
      }
    } catch (e) {
      setScanStatus({ loading: false, success: null, error: e.message });
      showAlert(t('common.error'), e.message, "error");
    } finally {
      setLoading(false);
    }
  }, [agent, showAlert, t]);

  const handleScanUniforme = useCallback((code) => {
    const u = collecteRef.current?.uniformes?.find(
      x => x.codeBarre === code || String(x.lingeId) === code
    );
    if (!u) {
      showAlert(t('collecte_uniforme.errors.uniform_not_found'), code, "error");
      return;
    }
    if (u.statut) {
      showAlert(t('collecte_uniforme.already_processed'), u.codeBarre, "info");
      return;
    }
    setUniformeEnCours(u);
    if (u.estInfecte) {
      showAlert(t('collecte_uniforme.infected_uniform'), t('collecte_uniforme.scan_red_bin'), "warning");
    } else {
      showAlert(t('collecte_uniforme.clean_uniform'), t('collecte_uniforme.scan_white_bin'), "success");
    }
  }, [showAlert, t]);

  const handleScanBac = useCallback(async (code) => {
    if (!uniformeEnCours) return;
    setLoading(true);
    setScanStatus({ loading: true, code: code });
    try {
      const res = await apiCall(`/api/collecte/uniforme/${collecteRef.current?.id}/traiter`, {
        codeUniforme: uniformeEnCours.codeBarre,
        codeBac: code
      });
      majUniforme(uniformeEnCours.lingeId, res.statut);
      setUniformeEnCours(null);
      setScanStatus({
        loading: false,
        success: {
          message: res.statut === "INFECTE"
            ? t('collecte_uniforme.red_bin')
            : t('collecte_uniforme.white_bin'),
          detail: `${uniformeEnCours.codeBarre} → ${res.bac}`
        },
        error: null
      });
      setTimeout(() => setScanStatus(null), 2000);

      if (res.statut === "INFECTE") {
        showAlert(
          t('collecte_uniforme.red_bin'),
          `${uniformeEnCours.codeBarre} → ${t('collecte_uniforme.red_bin')}`,
          "warning"
        );
      } else {
        showAlert(
          t('collecte_uniforme.white_bin'),
          `${uniformeEnCours.codeBarre} → ${t('collecte_uniforme.white_bin')}`,
          "success"
        );
      }
    } catch (e) {
      setScanStatus({ loading: false, success: null, error: e.message });
      showAlert(
        t('common.error'),
        e.message || t('collecte_uniforme.errors.invalid_bin'),
        "error"
      );
    } finally {
      setLoading(false);
    }
  }, [uniformeEnCours, showAlert, majUniforme, t]);

  const handleManquant = useCallback(async (u) => {
    setDlgManq(null);
    setLoading(true);
    try {
      await apiCall(`/api/collecte/uniforme/${collecteRef.current?.id}/manquant`, { lingeId: u.lingeId });
      majUniforme(u.lingeId, "MANQUANT");
      showAlert(t('collecte_uniforme.missing'), u.codeBarre, "warning");
    } catch (e) {
      showAlert(t('common.error'), e.message, "error");
    } finally {
      setLoading(false);
    }
  }, [showAlert, majUniforme, t]);

  const handleCloturer = useCallback(async () => {
    const nonTr = collecte?.uniformes?.filter(u => !u.statut) || [];
    if (nonTr.length > 0) {
      const ok = await showConfirm(
        t('collecte_uniforme.close'),
        `${nonTr.length} ${t('collecte_uniforme.unprocessed')}. ${t('collecte_uniforme.close_confirm')}`,
        "question"
      );
      if (!ok) return;
    }
    setLoading(true);
    try {
      const res = await apiCall(`/api/collecte/uniforme/${collecte.id}/cloturer`);
      setResume(res);
      setUniformeEnCours(null);
      setEtape("RESUME");
      showAlert(
        t('collecte_uniforme.collection_closed'),
        `${collecte.personnelNom} — ${res.nbBlancs} ${t('collecte_uniforme.white')}, ${res.nbInfectes} ${t('collecte_uniforme.infected')}`,
        "success"
      );
    } catch (e) {
      showAlert(t('common.error'), e.message, "error");
    } finally {
      setLoading(false);
    }
  }, [collecte, showAlert, showConfirm, t]);

  const handleScan = useCallback(async (code) => {
    setScanVal("");
    if (etape === "BADGE") { await handleBadge(code); return; }
    if (etape === "SCAN") {
      if (uniformeEnCours) {
        await handleScanBac(code);
        return;
      }
      handleScanUniforme(code);
    }
  }, [etape, uniformeEnCours, handleBadge, handleScanUniforme, handleScanBac]);

  const reset = () => {
    setCollecte(null);
    setResume(null);
    setUniformeEnCours(null);
    setEtape("BADGE");
    setScanVal("");
    setScanStatus(null);
    setTimeout(() => scanInputRef.current?.focus(), 200);
  };

  const traites = collecte?.uniformes?.filter(u => u.statut).length || 0;
  const total = collecte?.nbUniformes || 0;
  const nonTr = total - traites;
  const infectes = collecte?.uniformes?.filter(u => u.statut === "INFECTE").length || 0;
  const blancs = collecte?.uniformes?.filter(u => u.statut === "BLANC").length || 0;
  const manquants = collecte?.uniformes?.filter(u => u.statut === "MANQUANT").length || 0;

  const getPlaceholder = () => {
    if (!agent) return t('collecte_uniforme.no_agent_connected');
    if (!collecte) return t('collecte_uniforme.scan_doctor_badge');
    if (uniformeEnCours) return t('collecte_uniforme.scan_bin');
    if (etape === "RESUME") return t('collecte_uniforme.collection_closed');
    return t('collecte_uniforme.scan_uniform');
  };

  const getBorderColor = () => {
    if (!agent) return "#dc2626";
    if (etape === "RESUME") return "#e2e8f0";
    if (uniformeEnCours) {
      return uniformeEnCours.estInfecte ? "#dc2626" : "#0ea5e9";
    }
    return "#0ea5e9";
  };

  const isCloturee = etape === "RESUME";

  return (
    <div className="collecte-container">
      <DlgManquant linge={dlgManq} onOk={handleManquant} onClose={() => setDlgManq(null)} t={t} />

      {/* ═══════════════════════════════════════════════════════════
          HEADER PREMIUM — Identique à Collecte Chambre
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
              background: "linear-gradient(135deg, #0ea5e9, #0284c7)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "white",
              boxShadow: "0 10px 28px rgba(14, 165, 233, 0.35)",
            }}
          >
            <Icons.UserMd size={28} color="white" strokeWidth={2.2} />
          </motion.div>
          <div>
            <h1 style={{
              fontSize: 28, fontWeight: 800, color: "#0f172a",
              margin: 0, letterSpacing: "-0.025em",
            }}>
              {t('collecte_uniforme.title')}
            </h1>
            <p style={{
              fontSize: 13.5, color: "#64748b",
              margin: "4px 0 0 0", fontWeight: 500,
              display: "flex", alignItems: "center", gap: 7,
            }}>
              {agent ? (
                <>
                  <Icons.User size={13} color="#0284c7" strokeWidth={2.2} />
                  {`${t('collecte_uniforme.agent')}: ${agent.nomPrenom || agent.nom}`}
                </>
              ) : (
                t('collecte_uniforme.no_agent_connected')
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
                  padding: "9px 18px", background: "#faf5ff",
                  borderRadius: 12, border: "1px solid #e9d5ff",
                }}
              >
                <Icons.User size={14} color="#7c3aed" strokeWidth={2.2} />
                <span style={{ fontSize: 13, fontWeight: 700, color: "#7c3aed" }}>
                  {agent.nomPrenom || agent.nom}
                </span>
                <Badge style={{
                  background: "#ede9fe", color: "#7c3aed",
                  fontSize: 10, padding: "2px 10px", borderRadius: 20,
                  fontWeight: 700,
                }}>
                  {agent.codeBarre || agent.matricule}
                </Badge>
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
                <Icons.UserMd size={14} color="#0284c7" strokeWidth={2.2} />
                <span style={{ fontSize: 13, fontWeight: 700, color: "#0284c7" }}>
                  {collecte.personnelNom}
                </span>
                <Badge style={{
                  background: "#e0f2fe", color: "#0284c7",
                  fontSize: 10, padding: "2px 10px", borderRadius: 20,
                  fontWeight: 700,
                }}>
                  {collecte.nbUniformes} {t('collecte_uniforme.uniforms')}
                </Badge>
                {collecte.estInfecte && (
                  <Badge style={{
                    background: "#fee2e2", color: "#dc2626",
                    fontSize: 10, padding: "2px 10px", borderRadius: 20,
                    fontWeight: 700,
                    display: "inline-flex", alignItems: "center", gap: 4,
                  }}>
                    <Icons.Biohazard size={10} color="#dc2626" strokeWidth={2.5} />
                    {t('collecte_uniforme.infected')}
                  </Badge>
                )}
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

        {/* ═══ STATISTIQUES ═══ */}
        {(etape === "SCAN" || etape === "RESUME") && collecte && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 12, marginBottom: 20,
          }}>
            <StatutCard
              label={t('collecte_uniforme.total')}
              value={total}
              icon={<Icons.Layers size={19} color="#0ea5e9" strokeWidth={2.2} />}
              color="#0ea5e9"
              bg="linear-gradient(135deg, #f0f9ff, #e0f2fe)"
            />
            <StatutCard
              label={t('collecte_uniforme.white')}
              value={blancs}
              icon={<Icons.CheckCheck size={19} color="#15803d" strokeWidth={2.5} />}
              color="#15803d"
              bg="linear-gradient(135deg, #f0fdf4, #dcfce7)"
            />
            <StatutCard
              label={t('collecte_uniforme.infected')}
              value={infectes}
              icon={<Icons.Biohazard size={19} color="#dc2626" strokeWidth={2.2} />}
              color="#dc2626"
              bg="linear-gradient(135deg, #fef2f2, #fee2e2)"
            />
            <StatutCard
              label={t('collecte_uniforme.missing')}
              value={manquants}
              icon={<Icons.AlertTriangle size={19} color="#d97706" strokeWidth={2.2} />}
              color="#d97706"
              bg="linear-gradient(135deg, #fffbeb, #fef3c7)"
            />
          </div>
        )}

        {/* ═══ ZONE DE SCAN ═══ */}
        <Card style={{
          marginBottom: 20,
          border: `2px dashed ${getBorderColor()}`,
          background: isCloturee ? "#f8fafc" : "white",
          borderRadius: 16, position: "relative", overflow: "hidden",
        }}>
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
              disabled={isCloturee || loading || !agent}
            />
            {scanStatus && <ScanStatus {...scanStatus} t={t} />}
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
                {t('collecte_uniforme.no_agent_connected')}
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2, fontWeight: 500 }}>
                {t('collecte_uniforme.connect_to_collect')}
              </div>
            </div>
          </div>
        )}

        {agent && !collecte && (
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
              <Icons.UserMd size={16} color="#7c3aed" strokeWidth={2.2} />
            </div>
            <div>
              <div style={{ fontSize: 13.5, color: "#7c3aed", fontWeight: 800 }}>
                {t('collecte_uniforme.scan_doctor_badge')}
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2, fontWeight: 500 }}>
                {t('collecte_uniforme.to_start_collection')}
              </div>
            </div>
          </div>
        )}

        {agent && collecte && etape === "SCAN" && !uniformeEnCours && (
          <div style={{
            padding: "13px 17px", borderRadius: 12,
            background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
            border: "1px solid #bbf7d0", marginBottom: 16,
            display: "flex", alignItems: "center", gap: 11,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "white", display: "flex",
              alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 8px rgba(34,197,94,0.15)",
            }}>
              <Icons.CheckCircle size={16} color="#22c55e" strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontSize: 13.5, color: "#15803d", fontWeight: 800 }}>
                {t('collecte_uniforme.ready_to_collect')}
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2, fontWeight: 500 }}>
                {t('collecte_uniforme.scan_uniform')}
              </div>
            </div>
          </div>
        )}

        {/* ═══ UNIFORME EN COURS ═══ */}
        {uniformeEnCours && etape === "SCAN" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              padding: "14px 18px", borderRadius: 14,
              background: uniformeEnCours.estInfecte
                ? "linear-gradient(135deg, #fef2f2, #fee2e2)"
                : "linear-gradient(135deg, #e0f2fe, #bae6fd)",
              border: `2px solid ${uniformeEnCours.estInfecte ? "#fca5a5" : "#7dd3fc"}`,
              marginBottom: 16,
              display: "flex", alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap", gap: 12,
              boxShadow: uniformeEnCours.estInfecte
                ? "0 4px 16px rgba(220,38,38,0.1)"
                : "0 4px 16px rgba(14,165,233,0.1)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: "white",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 3px 10px rgba(15,23,42,0.1)",
                border: `1.5px solid ${uniformeEnCours.estInfecte ? "#fca5a5" : "#7dd3fc"}`,
              }}>
                {uniformeEnCours.estInfecte ? (
                  <Icons.Biohazard size={22} color="#dc2626" strokeWidth={2.2} />
                ) : (
                  <Icons.Shirt size={22} color="#0284c7" strokeWidth={2.2} />
                )}
              </div>
              <div>
                <div style={{
                  fontWeight: 800, fontSize: 14,
                  color: uniformeEnCours.estInfecte ? "#dc2626" : "#0284c7",
                  letterSpacing: "-0.01em",
                  display: "flex", alignItems: "center", gap: 7,
                }}>
                  {uniformeEnCours.codeBarre}
                  {uniformeEnCours.estInfecte && (
                    <span style={{
                      fontSize: 9, padding: "2px 8px", borderRadius: 20,
                      background: "#fecaca", color: "#991b1b", fontWeight: 800,
                      letterSpacing: "0.3px", textTransform: "uppercase",
                    }}>
                      {t('collecte_uniforme.red_bin')}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 3, fontWeight: 500 }}>
                  {t('collecte_uniforme.scan_destination_bin')}
                </div>
              </div>
            </div>
            <button
              onClick={() => setUniformeEnCours(null)}
              style={{
                padding: "9px 17px", borderRadius: 10,
                border: "1px solid #e2e8f0", background: "white",
                color: "#64748b", cursor: "pointer", fontSize: 12,
                fontWeight: 700, transition: "all 0.2s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
              onMouseLeave={e => e.currentTarget.style.background = "white"}
            >
              {t('common.cancel')}
            </button>
          </motion.div>
        )}

        {/* ═══ BOUTON CLÔTURER PREMIUM (nouveau design) ═══ */}
        {etape === "SCAN" && collecte && (
          <div style={{ marginTop: 20 }}>
            <BoutonCloturer
              onClick={handleCloturer}
              loading={loading}
              nonTr={nonTr}
              total={total}
              t={t}
            />
          </div>
        )}

        {/* ═══ RÉSUMÉ ═══ */}
        {etape === "RESUME" && resume && (
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
              {t('collecte_uniforme.collection_completed')}
            </h2>
            <p style={{ fontSize: 13.5, color: "#059669", marginBottom: 22, fontWeight: 600 }}>
              {collecte?.personnelNom}
            </p>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
              gap: 12, marginBottom: 22,
              background: "white", borderRadius: 16, padding: 18,
              boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
              border: "1px solid #bbf7d0",
            }}>
              {[
                [<Icons.CheckCheck size={22} color="#15803d" strokeWidth={2.5} />, t('collecte_uniforme.white'), resume.nbBlancs, "#15803d", "#f0fdf4"],
                [<Icons.Biohazard size={22} color="#dc2626" strokeWidth={2.2} />, t('collecte_uniforme.infected'), resume.nbInfectes, "#dc2626", "#fef2f2"],
                [<Icons.CheckCircle size={22} color="#0284c7" strokeWidth={2.5} />, t('collecte_uniforme.clean'), resume.nbPropres, "#0284c7", "#f0f9ff"],
                [<Icons.AlertTriangle size={22} color="#d97706" strokeWidth={2.2} />, t('collecte_uniforme.missing_short'), resume.nbManquants, "#d97706", "#fffbeb"],
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

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  setCollecte(null);
                  setResume(null);
                  setUniformeEnCours(null);
                  setEtape("BADGE");
                  setTimeout(() => scanInputRef.current?.focus(), 200);
                }}
                style={{
                  padding: "13px 28px", borderRadius: 12, border: "none",
                  background: "linear-gradient(135deg, #0ea5e9, #0284c7)",
                  color: "white", fontWeight: 800, fontSize: 13, cursor: "pointer",
                  boxShadow: "0 4px 16px rgba(14,165,233,0.35)",
                  display: "inline-flex", alignItems: "center", gap: 8,
                }}
              >
                <Icons.UserMd size={15} color="white" strokeWidth={2.5} />
                {t('collecte_uniforme.another_doctor')}
              </motion.button>
              <button
                onClick={reset}
                style={{
                  padding: "13px 28px", borderRadius: 12,
                  border: "1px solid #e2e8f0", background: "white",
                  color: "#64748b", fontWeight: 700, fontSize: 13, cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                onMouseLeave={e => e.currentTarget.style.background = "white"}
              >
                {t('collecte_uniforme.finish')}
              </button>
            </div>
          </motion.div>
        )}

        {/* ═══ LISTE DES UNIFORMES ═══ */}
        {etape === "SCAN" && collecte && (
          <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1.5px solid #e2e8f0" }}>
            <div style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "center", marginBottom: 14,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: "linear-gradient(135deg, #e0f2fe, #bae6fd)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: "1px solid #7dd3fc",
                }}>
                  <Icons.Shirt size={16} color="#0284c7" strokeWidth={2.2} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 14, color: "#0f172a", letterSpacing: "-0.01em" }}>
                    {t('collecte_uniforme.uniforms')}
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b", fontWeight: 500, marginTop: 1 }}>
                    {total} {t('collecte_uniforme.uniforms')} · {traites} {t('collecte_uniforme.processed')}
                  </div>
                </div>
              </div>
              <span style={{
                fontSize: 11, color: "#0284c7",
                fontWeight: 800, padding: "5px 14px",
                background: "#e0f2fe", borderRadius: 20,
                border: "1px solid #bae6fd",
              }}>
                {Math.round((traites / total) * 100)}%
              </span>
            </div>

            <div style={{ maxHeight: 280, overflowY: "auto", paddingRight: 4 }}>
              <AnimatePresence>
                {collecte.uniformes.map((u, i) => (
                  <CarteUniforme
                    key={u.lingeId}
                    u={u}
                    uniformeEnCours={uniformeEnCours}
                    onManquant={x => setDlgManq(x)}
                    t={t}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>
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

export default function CollageListUniforme() {
  return <CollageListUniformeInner />;
}