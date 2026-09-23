import React, { useState, useRef, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useModal } from "../../contextes/ModalContext";

import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import ScanInput from "../../components/utils/shared/ScanInput";
import MuteButton from "../../components/utils/MuteButton";

import { cat, ST_COLORS } from "./collecteUtils";
import { useVoiceGuide } from "../../hooks/useVoiceGuide";

import {
  fetchChambreByCode,
  fetchAgentByCode,
  ouvrirCollecteChambre,
  scannerLit,
  traiterLitAvecContenant,
  marquerLingePropre,
  marquerLingeManquant,
  declarerLingeInfecte,
  cloturerCollecte,
  annulerCollecteVide,
} from "../../services/collecte/collecteChambreService";

import { getAgent, isAgentConnected } from "../../services/agentService";

import "../Linge/WorkflowList.css";




const Icons = {
  /* ─── Bâtiment / Chambre ─── */
  Building: ({ size = 20, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18" />
      <path d="M5 21V7l7-4 7 4v14" />
      <path d="M9 9h.01M15 9h.01M9 13h.01M15 13h.01M9 17h.01M15 17h.01" />
    </svg>
  ),

  /* ─── Porte / Door open ─── */
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

  /* ─── Check circle (Propre) ─── */
  CheckCircle: ({ size = 20, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),

  /* ─── Alert triangle (Manquant) ─── */
  AlertTriangle: ({ size = 20, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  ),

  /* ─── Biohazard (Infecté) ─── */
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

  /* ─── User / Agent ─── */
  User: ({ size = 20, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),

  /* ─── X / Close ─── */
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

  /* ─── Loader / Spinner ─── */
  Loader: ({ size = 20, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  ),

  /* ─── Shield / Protection ─── */
  Shield: ({ size = 20, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),

  /* ─── Package / Bac ─── */
  Package: ({ size = 20, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M16.5 9.4 7.55 4.24" />
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  ),

  /* ─── Sparkles / Décoratif ─── */
  Sparkles: ({ size = 20, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
    </svg>
  ),

  /* ─── Activity / Pulse ─── */
  Activity: ({ size = 20, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2" />
    </svg>
  ),

  /* ─── Layers / List ─── */
  Layers: ({ size = 20, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" />
      <path d="m22 12.18-9.17 4.16a2 2 0 0 1-1.66 0L2 12.18" />
      <path d="m22 17.18-9.17 4.16a2 2 0 0 1-1.66 0L2 17.18" />
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

  /* ─── Check Double (Validé) ─── */
  CheckCheck: ({ size = 20, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 7 17l-5-5" />
      <path d="m22 10-7.5 7.5L13 16" />
    </svg>
  ),
};



function ScanStatus({ loading, success, error, code }) {
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
          width: 36, height: 36, borderRadius: "50%",
          background: "white", display: "flex",
          alignItems: "center", justifyContent: "center",
          boxShadow: "0 2px 8px rgba(59,130,246,0.15)",
        }}>
          <div className="animate-spin">
            <Icons.Loader size={18} color="#3b82f6" strokeWidth={2.5} />
          </div>
        </div>
        <div>
          <p style={{ fontWeight: 700, color: "#1d4ed8", fontSize: 13, margin: 0 }}>
            Scan en cours...
          </p>
          <p style={{ fontSize: 11, color: "#64748b", margin: "2px 0 0 0" }}>
            {code}
          </p>
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
          width: 36, height: 36, borderRadius: "50%",
          background: "white", display: "flex",
          alignItems: "center", justifyContent: "center",
          boxShadow: "0 2px 8px rgba(34,197,94,0.15)",
        }}>
          <Icons.CheckCircle size={18} color="#22c55e" strokeWidth={2.5} />
        </div>
        <div>
          <p style={{ fontWeight: 700, color: "#15803d", fontSize: 13, margin: 0 }}>
            {success.message}
          </p>
          <p style={{ fontSize: 11, color: "#64748b", margin: "2px 0 0 0" }}>
            {success.detail}
          </p>
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
          width: 36, height: 36, borderRadius: "50%",
          background: "white", display: "flex",
          alignItems: "center", justifyContent: "center",
          boxShadow: "0 2px 8px rgba(239,68,68,0.15)",
        }}>
          <Icons.AlertTriangle size={18} color="#ef4444" strokeWidth={2.5} />
        </div>
        <div>
          <p style={{ fontWeight: 700, color: "#dc2626", fontSize: 13, margin: 0 }}>
            Erreur
          </p>
          <p style={{ fontSize: 11, color: "#64748b", margin: "2px 0 0 0" }}>
            {error}
          </p>
        </div>
      </div>
    );
  }

  return null;
}


/* ═══════════════════════════════════════════════════════════════════════════
   DialogueManquant — Design premium avec SVG
   ═══════════════════════════════════════════════════════════════════════════ */
function DialogueManquant({ linge, onConfirmer, onFermer }) {
  if (!linge) return null;
  const c = cat(linge.categorie);

  return (
    <div
      data-modal="true"
      onClick={onFermer}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(15,23,42,0.65)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 9999, backdropFilter: "blur(6px)",
        animation: "fadeIn 0.2s ease-out",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "white", borderRadius: 22, padding: 28,
          maxWidth: 400, width: "92%",
          boxShadow: "0 24px 72px rgba(0,0,0,0.35)",
          animation: "scaleIn 0.25s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
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
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.01em" }}>
                Déclarer manquant
              </h3>
              <p style={{ margin: "3px 0 0 0", fontSize: 12, color: "#64748b", fontWeight: 500 }}>
                Confirmation requise
              </p>
            </div>
          </div>
          <button
            onClick={onFermer}
            style={{
              background: "#f1f5f9", border: "none", borderRadius: 10,
              width: 32, height: 32, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#e2e8f0"}
            onMouseLeave={(e) => e.currentTarget.style.background = "#f1f5f9"}
          >
            <Icons.X size={14} color="#64748b" strokeWidth={2.5} />
          </button>
        </div>

        {/* Card linge */}
        <div style={{
          padding: 14, background: c.bg, borderRadius: 14, marginBottom: 18,
          display: "flex", alignItems: "center", gap: 12,
          border: `1px solid ${c.color}25`,
        }}>
          <span style={{ fontSize: 26 }}>{c.emoji}</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: c.color }}>{c.label}</div>
            <code style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>{linge.codeBarre}</code>
          </div>
        </div>

        {/* Avertissement */}
        <div style={{
          padding: "12px 14px", borderRadius: 12, marginBottom: 20,
          background: "linear-gradient(135deg, #fffbeb, #fef3c7)",
          border: "1px solid #fde68a",
          display: "flex", alignItems: "flex-start", gap: 10,
        }}>
          <div style={{ flexShrink: 0, marginTop: 1 }}>
            <Icons.AlertTriangle size={14} color="#d97706" strokeWidth={2.2} />
          </div>
          <p style={{ margin: 0, fontSize: 12, color: "#92400e", lineHeight: 1.5, fontWeight: 500 }}>
            Ce linge sera marqué comme <strong>manquant</strong> dans la collecte. Cette action est tracée.
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onFermer}
            style={{
              flex: 1, padding: "13px", borderRadius: 12,
              border: "1px solid #e2e8f0", background: "white",
              color: "#64748b", fontWeight: 700, fontSize: 13, cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.borderColor = "#cbd5e1"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "white"; e.currentTarget.style.borderColor = "#e2e8f0"; }}
          >
            Annuler
          </button>
          <button
            onClick={() => onConfirmer(linge)}
            style={{
              flex: 2, padding: "13px", borderRadius: 12, border: "none",
              background: "linear-gradient(135deg, #f59e0b, #d97706)",
              color: "white", fontWeight: 800, fontSize: 13, cursor: "pointer",
              boxShadow: "0 4px 14px rgba(217,119,6,0.35)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 18px rgba(217,119,6,0.45)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(217,119,6,0.35)"; }}
          >
            <Icons.AlertTriangle size={14} color="white" strokeWidth={2.5} />
            Confirmer manquant
          </button>
        </div>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════════════════
   DialogueInfecte — Design premium avec SVG + procédure
   ═══════════════════════════════════════════════════════════════════════════ */
function DialogueInfecte({ linge, onFermer, onScanner }) {
  if (!linge) return null;
  const c = cat(linge.categorie);

  return (
    <div
      data-modal="true"
      onClick={onFermer}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(15,23,42,0.7)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 9999, backdropFilter: "blur(6px)",
        animation: "fadeIn 0.2s ease-out",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "white", borderRadius: 22, padding: 28,
          maxWidth: 440, width: "92%",
          boxShadow: "0 24px 72px rgba(220,38,38,0.3)",
          animation: "scaleIn 0.25s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 15,
              background: "linear-gradient(135deg, #fee2e2, #fecaca)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 14px rgba(220,38,38,0.25)",
            }}>
              <Icons.Biohazard size={26} color="#dc2626" strokeWidth={2.2} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#dc2626", letterSpacing: "-0.01em" }}>
                Déclarer infecté
              </h3>
              <p style={{ margin: "3px 0 0 0", fontSize: 12, color: "#64748b", fontWeight: 500 }}>
                Procédure de biosécurité
              </p>
            </div>
          </div>
          <button
            onClick={onFermer}
            style={{
              background: "#f1f5f9", border: "none", borderRadius: 10,
              width: 32, height: 32, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <Icons.X size={14} color="#64748b" strokeWidth={2.5} />
          </button>
        </div>

        {/* Card linge */}
        <div style={{
          padding: 14, background: c.bg, borderRadius: 14, marginBottom: 18,
          display: "flex", alignItems: "center", gap: 12,
          border: `1px solid ${c.color}25`,
        }}>
          <span style={{ fontSize: 26 }}>{c.emoji}</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: c.color }}>{c.label}</div>
            <code style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>{linge.codeBarre}</code>
          </div>
        </div>

        {/* Procédure */}
        <div style={{
          padding: 16, borderRadius: 14, marginBottom: 20,
          background: "linear-gradient(135deg, #fef2f2, #fee2e2)",
          border: "1px solid #fecaca",
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 9,
            color: "#991b1b", fontSize: 13, fontWeight: 800, marginBottom: 14,
            letterSpacing: "-0.01em",
          }}>
            <Icons.Shield size={15} color="#991b1b" strokeWidth={2.2} />
            Procédure obligatoire
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { num: 1, text: "Placez le linge dans un sac infecté (rouge)" },
              { num: 2, text: "Scannez le code-barres du sac pour associer" },
            ].map((step) => (
              <div key={step.num} style={{ display: "flex", alignItems: "flex-start", gap: 11 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: "50%",
                  background: "linear-gradient(135deg, #ef4444, #dc2626)",
                  color: "white", display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: 11, fontWeight: 800,
                  flexShrink: 0, boxShadow: "0 2px 8px rgba(220,38,38,0.3)",
                }}>
                  {step.num}
                </div>
                <p style={{ margin: "2px 0 0 0", fontSize: 12.5, color: "#7f1d1d", lineHeight: 1.5, fontWeight: 500 }}>
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onFermer}
            style={{
              flex: 1, padding: "13px", borderRadius: 12,
              border: "1px solid #e2e8f0", background: "white",
              color: "#64748b", fontWeight: 700, fontSize: 13, cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.borderColor = "#cbd5e1"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "white"; e.currentTarget.style.borderColor = "#e2e8f0"; }}
          >
            Annuler
          </button>
          <button
            onClick={() => onScanner(linge)}
            style={{
              flex: 2, padding: "13px", borderRadius: 12, border: "none",
              background: "linear-gradient(135deg, #ef4444, #dc2626)",
              color: "white", fontWeight: 800, fontSize: 13, cursor: "pointer",
              boxShadow: "0 4px 16px rgba(220,38,38,0.4)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 22px rgba(220,38,38,0.5)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(220,38,38,0.4)"; }}
          >
            <Icons.Biohazard size={15} color="white" strokeWidth={2.5} />
            Scanner le sac infecté
          </button>
        </div>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════════════════
   BoutonDeclaration — Bouton d'action premium avec SVG
   ═══════════════════════════════════════════════════════════════════════════ */
function BoutonDeclaration({ type, onClick, title }) {
  const themes = {
    propre: {
      gradient: "linear-gradient(135deg, #0ea5e9, #0284c7)",
      shadow: "rgba(2,132,199,0.35)",
      hoverShadow: "rgba(2,132,199,0.5)",
      Icon: Icons.CheckCircle,
    },
    manquant: {
      gradient: "linear-gradient(135deg, #f59e0b, #d97706)",
      shadow: "rgba(217,119,6,0.35)",
      hoverShadow: "rgba(217,119,6,0.5)",
      Icon: Icons.AlertTriangle,
    },
    infecte: {
      gradient: "linear-gradient(135deg, #ef4444, #dc2626)",
      shadow: "rgba(220,38,38,0.35)",
      hoverShadow: "rgba(220,38,38,0.5)",
      Icon: Icons.Biohazard,
    },
  };

  const theme = themes[type];
  const IconComponent = theme.Icon;

  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 36, height: 36, borderRadius: 11,
        border: "none", background: theme.gradient,
        color: "white", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: `0 3px 10px ${theme.shadow}`,
        transition: "all 0.25s cubic-bezier(0.34,1.56,0.64,1)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px) scale(1.05)";
        e.currentTarget.style.boxShadow = `0 6px 16px ${theme.hoverShadow}`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0) scale(1)";
        e.currentTarget.style.boxShadow = `0 3px 10px ${theme.shadow}`;
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = "translateY(0) scale(0.92)";
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = "translateY(-2px) scale(1.05)";
      }}
    >
      <IconComponent size={14} color="white" strokeWidth={2.5} />
    </button>
  );
}


/* ═══════════════════════════════════════════════════════════════════════════
   LingeRow — Ligne de linge premium
   ═══════════════════════════════════════════════════════════════════════════ */
function LingeRow({ linge, stLit, onPropre, onManquant, onInfecte }) {
  const c = cat(linge.categorie);
  const col = ST_COLORS[linge.statut];

  return (
    <div
      style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "10px 14px", borderRadius: 12, marginBottom: 6,
        background: linge.statut
          ? `linear-gradient(135deg, ${col?.bg || "#f8fafc"}, ${col?.bg || "#f1f5f9"})`
          : "linear-gradient(135deg, #ffffff, #f8fafc)",
        border: `1.5px solid ${col?.b || "#e2e8f0"}`,
        transition: "all 0.2s",
        boxShadow: linge.statut ? "none" : "0 1px 3px rgba(15,23,42,0.04)",
      }}
      onMouseEnter={(e) => {
        if (!linge.statut) {
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(15,23,42,0.08)";
          e.currentTarget.style.borderColor = "#cbd5e1";
        }
      }}
      onMouseLeave={(e) => {
        if (!linge.statut) {
          e.currentTarget.style.boxShadow = "0 1px 3px rgba(15,23,42,0.04)";
          e.currentTarget.style.borderColor = "#e2e8f0";
        }
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0, flex: 1 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 11,
          background: c.bg, display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 19, flexShrink: 0,
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

      <div style={{ flexShrink: 0 }}>
        {linge.statut ? (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            fontSize: 10, fontWeight: 800, letterSpacing: "0.4px",
            padding: "5px 12px", borderRadius: 20,
            background: col?.tag, color: col?.tc,
            textTransform: "uppercase", whiteSpace: "nowrap",
            border: `1px solid ${col?.b}`,
          }}>
            {col?.lbl}
          </span>
        ) : (
          !stLit && (
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <BoutonDeclaration type="propre" onClick={() => onPropre(linge)} title="Déclarer propre" />
              <BoutonDeclaration type="manquant" onClick={() => onManquant(linge)} title="Déclarer manquant" />
              <BoutonDeclaration type="infecte" onClick={() => onInfecte(linge)} title="Déclarer infecté" />
            </div>
          )
        )}
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════════════════
   CarteLit — Carte de lit premium avec SVG
   ═══════════════════════════════════════════════════════════════════════════ */
function CarteLit({ lit, onPropre, onManquant, onInfecte }) {
  const traites = lit.linges.filter((l) => l.statut).length;
  const stLit = lit.statut;
  const totalLinges = lit.linges.length;

  const theme = stLit === "BLANC"
    ? {
        border: "#86efac",
        bg: "linear-gradient(135deg, #f0fdf4, #ecfdf5)",
        headerBg: "linear-gradient(135deg, #dcfce7, #bbf7d0)",
        headerBorder: "#86efac",
        iconColor: "#15803d",
        titleColor: "#14532d",
        badgeBg: "#dcfce7",
        badgeColor: "#15803d",
        badgeText: "BLANC",
        badgeIcon: <Icons.CheckCheck size={11} color="#15803d" strokeWidth={3} />,
      }
    : stLit === "INFECTE"
    ? {
        border: "#fca5a5",
        bg: "linear-gradient(135deg, #fef2f2, #fee2e2)",
        headerBg: "linear-gradient(135deg, #fee2e2, #fecaca)",
        headerBorder: "#fca5a5",
        iconColor: "#dc2626",
        titleColor: "#7f1d1d",
        badgeBg: "#fee2e2",
        badgeColor: "#dc2626",
        badgeText: "INFECTÉ",
        badgeIcon: <Icons.Biohazard size={11} color="#dc2626" strokeWidth={2.5} />,
      }
    : {
        border: "#e2e8f0",
        bg: "linear-gradient(135deg, #ffffff, #f8fafc)",
        headerBg: "linear-gradient(135deg, #f8fafc, #f1f5f9)",
        headerBorder: "#e2e8f0",
        iconColor: "#64748b",
        titleColor: "#0f172a",
        badgeBg: null,
        badgeColor: null,
        badgeText: null,
      };

  const progressPercent = totalLinges > 0 ? (traites / totalLinges) * 100 : 0;

  return (
    <div style={{
      borderRadius: 16, border: `1.5px solid ${theme.border}`,
      background: theme.bg, overflow: "hidden", marginBottom: 12,
      transition: "all 0.25s",
      boxShadow: "0 2px 8px rgba(15,23,42,0.04)",
    }}>
      {/* Header */}
      <div style={{
        padding: "14px 18px", display: "flex", justifyContent: "space-between",
        alignItems: "center", borderBottom: `1.5px solid ${theme.headerBorder}`,
        background: theme.headerBg,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: "white", display: "flex",
            alignItems: "center", justifyContent: "center",
            boxShadow: "0 2px 8px rgba(15,23,42,0.08)",
            border: `1px solid ${theme.headerBorder}`,
          }}>
            <Icons.Bed size={18} color={theme.iconColor} strokeWidth={2.2} />
          </div>

          <div>
            <div style={{
              fontWeight: 800, fontSize: 15, color: theme.titleColor,
              letterSpacing: "-0.01em",
            }}>
              Lit {lit.codeLit}
            </div>
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 500, marginTop: 2 }}>
              {totalLinges} linge{totalLinges > 1 ? "s" : ""}
              {!stLit && ` · ${traites}/${totalLinges} traité${traites > 1 ? "s" : ""}`}
            </div>
          </div>

          {lit.estInfecte && !stLit && (
            <span style={{
              fontSize: 10, padding: "5px 11px", borderRadius: 20,
              background: "#fee2e2", color: "#dc2626", fontWeight: 800,
              border: "1px solid #fca5a5", letterSpacing: "0.4px",
              display: "inline-flex", alignItems: "center", gap: 5,
            }}>
              <Icons.Biohazard size={10} color="#dc2626" strokeWidth={2.5} />
              INFECTÉ
            </span>
          )}
        </div>

        {stLit && (
          <span style={{
            fontSize: 10.5, fontWeight: 800, letterSpacing: "0.5px",
            padding: "7px 14px", borderRadius: 20,
            background: theme.badgeBg, color: theme.badgeColor,
            border: `1px solid ${theme.headerBorder}`,
            textTransform: "uppercase",
            display: "inline-flex", alignItems: "center", gap: 6,
          }}>
            {theme.badgeIcon}
            {theme.badgeText}
          </span>
        )}
      </div>

      {/* Barre de progression */}
      {!stLit && totalLinges > 0 && (
        <div style={{ padding: "12px 18px 0 18px" }}>
          <div style={{
            height: 4, borderRadius: 2, background: "#f1f5f9",
            overflow: "hidden", position: "relative",
          }}>
            <div style={{
              height: "100%", width: `${progressPercent}%`,
              background: progressPercent === 100
                ? "linear-gradient(90deg, #10b981, #059669)"
                : "linear-gradient(90deg, #3b82f6, #2563eb)",
              borderRadius: 2, transition: "width 0.4s cubic-bezier(0.4,0,0.2,1)",
              boxShadow: "0 0 8px rgba(59,130,246,0.4)",
            }} />
          </div>
        </div>
      )}

      {/* Liste des linges */}
      <div style={{ padding: "14px 14px" }}>
        {lit.linges.map((linge) => (
          <LingeRow
            key={linge.lingeId}
            linge={linge}
            stLit={stLit}
            onPropre={onPropre}
            onManquant={onManquant}
            onInfecte={onInfecte}
          />
        ))}
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════════════════
   StatutCard — Carte statistique premium avec SVG
   ═══════════════════════════════════════════════════════════════════════════ */
function StatutCard({ label, value, icon, color, bg }) {
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
          <p style={{ fontSize: 24, fontWeight: 800, color, margin: 0, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════════════════
   PAGE PRINCIPALE
   ═══════════════════════════════════════════════════════════════════════════ */
function ColageListInner() {
  const { t } = useTranslation();
  const { showAlert, showConfirm } = useModal();

  const [voiceLang, setVoiceLang] = useState("fr");
  const voice = useVoiceGuide(voiceLang);
  const voiceRef = useRef(voice);

  useEffect(() => { voiceRef.current = voice; }, [voice]);

  const [etape, setEtape] = useState("CHAMBRE");
  const [agent, setAgent] = useState(null);
  const [collecte, setCollecte] = useState(null);
  const [litEnCours, setLitEnCours] = useState(null);
  const [scanVal, setScanVal] = useState("");
  const [loading, setLoading] = useState(false);
  const [dlgManq, setDlgManq] = useState(null);
  const [dlgInfecte, setDlgInfecte] = useState(null);
  const [lingeInfecteEnCours, setLingeInfecteEnCours] = useState(null);
  const [scanStatus, setScanStatus] = useState(null);

  const agentRef = useRef(null);
  const collecteRef = useRef(null);
  const scanInputRef = useRef(null);
  const scanTimeoutRef = useRef(null);

  useEffect(() => { agentRef.current = agent; }, [agent]);
  useEffect(() => { collecteRef.current = collecte; }, [collecte]);

  useEffect(() => {
    return () => { voice.cancel(); };
  }, []);

  useEffect(() => {
    const agentData = getAgent();
    if (agentData && isAgentConnected()) {
      setAgent(agentData);
      setEtape("CHAMBRE");
      setTimeout(() => {
        voice.sayBienvenue(agentData.nomPrenom || agentData.nom || "");
      }, 600);
    } else {
      setScanStatus({
        loading: false, success: null,
        error: "Aucun agent connecté",
      });
    }
  }, []);

  const majLit = useCallback((litId, statut, codes = [], sacInfecteId = null) => {
    setCollecte((p) =>
      p ? {
        ...p,
        lits: p.lits.map((l) =>
          l.litId !== litId ? l : {
            ...l, statut,
            linges: l.linges.map((lg) => ({
              ...lg,
              statut: codes.includes(lg.codeBarre) ? statut : lg.statut,
              sacInfecteId:
                statut === "INFECTE" && codes.includes(lg.codeBarre)
                  ? sacInfecteId ?? lg.sacInfecteId ?? null
                  : lg.sacInfecteId ?? null,
            })),
          }
        ),
      } : p
    );
  }, []);

  const majLinge = useCallback((lingeId, statut, sacInfecteId = null) => {
    setCollecte((p) =>
      p ? {
        ...p,
        lits: p.lits.map((l) => ({
          ...l,
          linges: l.linges.map((lg) =>
            lg.lingeId === lingeId ? {
              ...lg, statut,
              sacInfecteId: statut === "INFECTE"
                ? sacInfecteId ?? lg.sacInfecteId ?? null
                : lg.sacInfecteId,
            } : lg
          ),
        })),
      } : p
    );
  }, []);

  const handleChambre = useCallback(async (code) => {
    if (!agent) {
      showAlert("Agent non connecté", "", "error");
      voice.sayChambreErreur();
      return;
    }
    setLoading(true);
    setScanStatus({ loading: true, code });
    try {
      const ch = await fetchChambreByCode(code);
      const res = await ouvrirCollecteChambre(
        ch.codeBarre || ch.code || code,
        agent.codeBarre || agent.matricule
      );
      setCollecte({
        id: res.collecteId,
        codeChambre: res.codeChambre,
        lits: (res.lits || []).map((l) => ({
          ...l, statut: l.statut || "",
          linges: (l.linges || []).map((lg) => ({
            ...lg, sacInfecteId: lg.sacInfecteId ?? null,
          })),
        })),
      });
      setLitEnCours(null);
      setEtape("SCAN");
      setScanStatus({
        loading: false,
        success: {
          message: `${res.codeChambre}`,
          detail: `${res.nbLits} lits, ${res.nbLinges} linges`,
        },
        error: null,
      });
      setTimeout(() => setScanStatus(null), 2500);
      voiceRef.current.sayChambreIdentifiee(res.codeChambre, res.nbLits, res.nbLinges);
      setTimeout(() => {
        if (!collecteRef.current) return;
        voiceRef.current.sayGuidePropresManquants();
      }, 3500);
    } catch (e) {
      setScanStatus({ loading: false, success: null, error: e.message });
      showAlert("Erreur", e.message, "error");
      if (e.message?.toLowerCase().includes("réseau") || e.message?.toLowerCase().includes("network")) {
        voice.sayErreurReseau();
      } else {
        voice.sayChambreErreur();
      }
    } finally {
      setLoading(false);
    }
  }, [agent, showAlert, voice]);

  const handleScannerLit = useCallback(async (litId) => {
    if (!collecte) return;
    setLoading(true);
    setScanStatus({ loading: true, code: `lit-${litId}` });
    try {
      const res = await scannerLit(collecte.id, litId);
      setLitEnCours({
        litId: res.litId, codeLit: res.codeLit,
        estInfecte: res.estInfecte, nbLinges: res.nbLinges,
        actionSuivante: res.actionSuivante,
      });
      setScanStatus({
        loading: false,
        success: {
          message: res.estInfecte ? `Lit ${res.codeLit} — infecté` : `Lit ${res.codeLit} — normal`,
          detail: res.estInfecte ? "Scannez le sac rouge" : "Scannez le bac blanc",
        },
        error: null,
      });
      setTimeout(() => setScanStatus(null), 2500);
      if (res.estInfecte) voice.sayLitInfecte(res.codeLit, res.nbLinges);
      else voice.sayLitNormal(res.codeLit, res.nbLinges);
    } catch (e) {
      setScanStatus({ loading: false, success: null, error: e.message });
      showAlert("Erreur", e.message, "error");
      voice.sayErreurGenerique(e.message);
    } finally {
      setLoading(false);
    }
  }, [collecte, showAlert, voice]);

  const handleTraiterContenant = useCallback(async (codeContenant) => {
    if (!collecte || !litEnCours) return;
    setLoading(true);
    setScanStatus({ loading: true, code: codeContenant });
    try {
      const res = await traiterLitAvecContenant(collecte.id, litEnCours.litId, codeContenant);
      const estInfecte = res.typeContenant === "SAC_INFECTE";
      const statut = estInfecte ? "INFECTE" : "BLANC";
      const sacId = res.sacInfecteId ?? res.sacInfecte?.id ?? null;
      majLit(litEnCours.litId, statut, res.codes || [], sacId);
      const codeLit = litEnCours.codeLit;
      setLitEnCours(null);
      setScanStatus({
        loading: false,
        success: {
          message: estInfecte ? `Sac traité` : `Bac traité`,
          detail: `${res.nbTraites} linges · Lit ${codeLit}`,
        },
        error: null,
      });
      setTimeout(() => setScanStatus(null), 2500);
      if (estInfecte) voice.saySacInfecteOk(res.nbTraites, codeContenant);
      else voice.sayBacBlancOk(res.nbTraites, codeContenant);
    } catch (e) {
      setScanStatus({ loading: false, success: null, error: e.message });
      showAlert("Erreur", e.message, "error");
      voice.sayContenantErreur(e.message);
    } finally {
      setLoading(false);
    }
  }, [collecte, litEnCours, majLit, showAlert, voice]);

  const handlePropre = useCallback(async (linge) => {
    setLoading(true);
    try {
      await marquerLingePropre(collecteRef.current?.id, linge.codeBarre);
      majLinge(linge.lingeId, "PROPRE");
      showAlert("Propre", linge.codeBarre, "info");
      voice.sayLingePropre();
    } catch (e) {
      showAlert("Erreur", e.message, "error");
      voice.sayErreurGenerique(e.message);
    } finally {
      setLoading(false);
    }
  }, [majLinge, showAlert, voice]);

  const handleManquant = useCallback(async (linge) => {
    setDlgManq(null);
    setLoading(true);
    try {
      await marquerLingeManquant(collecteRef.current?.id, linge.lingeId);
      majLinge(linge.lingeId, "MANQUANT");
      showAlert("Manquant", linge.codeBarre, "warning");
      voice.sayLingeManquant();
    } catch (e) {
      showAlert("Erreur", e.message, "error");
      voice.sayErreurGenerique(e.message);
    } finally {
      setLoading(false);
    }
  }, [majLinge, showAlert, voice]);

  const handleInfecte = useCallback((linge) => {
    setDlgInfecte(linge);
    voice.say("Ce linge va être déclaré infecté. Placez-le dans un sac infecté puis scannez le sac.");
  }, [voice]);

  const handleScannerSacPourInfecte = useCallback((linge) => {
    setDlgInfecte(null);
    setLingeInfecteEnCours(linge);
    setScanStatus({ loading: false, success: null, error: null });
    setTimeout(() => {
      if (scanInputRef.current) scanInputRef.current.focus();
    }, 150);
    voice.say("Scannez maintenant le code du sac infecté.");
  }, [voice]);

  const handleDeclarerInfecte = useCallback(async (codeSac) => {
    if (!collecte || !lingeInfecteEnCours) return;
    setLoading(true);
    setScanStatus({ loading: true, code: codeSac });
    try {
      const res = await declarerLingeInfecte(
        collecte.id, lingeInfecteEnCours.lingeId, codeSac,
        agentRef.current?.codeBarre || agentRef.current?.matricule
      );
      const sacId = res?.sacInfecteId ?? res?.sacInfecte?.id ?? null;
      majLinge(lingeInfecteEnCours.lingeId, "INFECTE", sacId);
      setScanStatus({
        loading: false,
        success: {
          message: "Linge déclaré infecté",
          detail: `${lingeInfecteEnCours.codeBarre} → Sac ${codeSac}`,
        },
        error: null,
      });
      setLingeInfecteEnCours(null);
      setTimeout(() => setScanStatus(null), 3000);
      voice.say("Le linge a été déclaré infecté et associé au sac infecté.");
    } catch (e) {
      setScanStatus({ loading: false, success: null, error: e.message });
      showAlert("Erreur déclaration infecté", e.message, "error");
      voice.sayErreurGenerique(e.message);
    } finally {
      setLoading(false);
    }
  }, [collecte, lingeInfecteEnCours, majLinge, showAlert, voice]);

  const handleCloturer = useCallback(async () => {
    if (!collecte) return;
    const nonTr = collecte?.lits?.filter((l) => !l.statut) || [];
    if (nonTr.length > 0) {
      voice.sayClotureRestants(nonTr.length);
      const ok = await showConfirm(
        "Lits non traités",
        `${nonTr.length} lit(s) non traité(s). Clôturer quand même ?`,
        "question"
      );
      if (!ok) return;
    }
    setLoading(true);
    try {
      const res = await cloturerCollecte(collecte.id);
      if (res.annulee) {
        showAlert("Collecte annulée", res.message || "Aucun linge collecté.", "info");
        setCollecte(null); setLitEnCours(null); setEtape("CHAMBRE");
        return;
      }
      showAlert(
        "Collecte clôturée",
        `${collecte.codeChambre} — ${res.nbBlancs || 0}B ${res.nbInfectes || 0}I ${res.nbPropres || 0}P`,
        "success"
      );
      voice.sayClotureOk(
        collecte.codeChambre,
        res.nbBlancs || 0, res.nbInfectes || 0,
        res.nbPropres || 0, res.nbManquants || 0
      );
      setCollecte(null); setLitEnCours(null);
      setLingeInfecteEnCours(null); setEtape("CHAMBRE");
      setScanStatus({
        loading: false,
        success: { message: "Collecte clôturée", detail: `${collecte.codeChambre}` },
        error: null,
      });
      setTimeout(() => setScanStatus(null), 3000);
    } catch (e) {
      showAlert("Erreur", e.message, "error");
      voice.sayClotureErreur();
    } finally {
      setLoading(false);
    }
  }, [collecte, showAlert, showConfirm, voice]);

  const handleScan = useCallback(async (code) => {
    if (!code) return;
    if (lingeInfecteEnCours) { await handleDeclarerInfecte(code); return; }
    if (etape === "CHAMBRE") { await handleChambre(code); return; }
    if (etape === "SCAN") {
      if (litEnCours) { await handleTraiterContenant(code); return; }
      const lit = collecteRef.current?.lits?.find(
        (l) => l.codeLit === code || String(l.litId) === code
      );
      if (lit && !lit.statut) { await handleScannerLit(lit.litId); return; }
      try {
        const ag = await fetchAgentByCode(code);
        if (ag && collecte) { await handleCloturer(); return; }
      } catch {}
      showAlert("Code non reconnu", "Scannez un lit, un bac, un sac infecté ou votre badge.", "error");
      voice.sayCodeNonReconnu();
    }
  }, [
    lingeInfecteEnCours, etape, litEnCours, collecte,
    handleDeclarerInfecte, handleChambre, handleTraiterContenant,
    handleScannerLit, handleCloturer, showAlert, voice,
  ]);

  const totalLits = collecte?.lits?.length || 0;
  const traites = collecte?.lits?.filter((l) => l.statut).length || 0;
  const nonTraites = totalLits - traites;
  const nbBlancs = collecte?.lits?.filter((l) => l.statut === "BLANC").length || 0;
  const nbInfectes = collecte?.lits?.filter((l) => l.statut === "INFECTE").length || 0;

  const reset = async () => {
    voice.cancel();
    if (collecte && traites === 0) {
      try { await annulerCollecteVide(collecte.id); } catch {}
    }
    setAgent(null); setCollecte(null); setLitEnCours(null);
    setLingeInfecteEnCours(null); setDlgInfecte(null);
    setEtape("CHAMBRE"); setScanVal(""); setScanStatus(null);
  };

  useEffect(() => {
    if (scanVal.trim().length < 2) return;
    clearTimeout(scanTimeoutRef.current);
    scanTimeoutRef.current = setTimeout(() => {
      const code = scanVal.trim();
      setScanVal("");
      handleScan(code);
    }, 300);
    return () => clearTimeout(scanTimeoutRef.current);
  }, [scanVal, handleScan]);

  useEffect(() => {
    const keep = () => {
      if (scanInputRef.current && !document.querySelector('[data-modal="true"]')) {
        scanInputRef.current.focus();
      }
    };
    const id = setInterval(keep, 500);
    keep();
    return () => clearInterval(id);
  }, []);

  const getPlaceholder = () => {
    if (!agent) return "Aucun agent connecté";
    if (lingeInfecteEnCours) return `Scanner le sac infecté pour ${lingeInfecteEnCours.codeBarre}...`;
    if (!collecte) return "Scannez le code de la chambre...";
    if (litEnCours) {
      return litEnCours.actionSuivante === "SCANNER_SAC_INFECTE"
        ? `Scanner le sac rouge — Lit ${litEnCours.codeLit}...`
        : `Scanner le bac blanc — Lit ${litEnCours.codeLit}...`;
    }
    return "Scanner un lit ou votre badge pour clôturer...";
  };

  const borderColor = !agent
    ? "#e2e8f0"
    : lingeInfecteEnCours
    ? "#dc2626"
    : litEnCours?.actionSuivante === "SCANNER_SAC_INFECTE"
    ? "#dc2626"
    : "#7c3aed";

  return (
    <div className="collecte-container">

      <DialogueManquant
        linge={dlgManq}
        onConfirmer={handleManquant}
        onFermer={() => setDlgManq(null)}
      />

      <DialogueInfecte
        linge={dlgInfecte}
        onFermer={() => setDlgInfecte(null)}
        onScanner={handleScannerSacPourInfecte}
      />

      {/* ═══ Header premium ═══ */}
      <div style={{ marginBottom: 28 }}>
        <div style={{
          display: "flex", alignItems: "center",
          justifyContent: "space-between", flexWrap: "wrap", gap: 12,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{
              width: 60, height: 60, borderRadius: 20,
              background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 10px 28px rgba(124,58,237,0.35)",
            }}>
              <Icons.DoorOpen size={28} color="white" strokeWidth={2.2} />
            </div>
            <div>
              <h1 style={{
                fontSize: 28, fontWeight: 800, color: "#0f172a",
                margin: 0, letterSpacing: "-0.025em",
              }}>
                Collecte Chambre
              </h1>
              <p style={{
                fontSize: 13.5, color: "#64748b",
                margin: "4px 0 0 0", fontWeight: 500,
                display: "flex", alignItems: "center", gap: 7,
              }}>
                {agent ? (
                  <>
                    <Icons.User size={13} color="#7c3aed" strokeWidth={2.2} />
                    {agent.nomPrenom || agent.nom}
                  </>
                ) : (
                  "Aucun agent connecté"
                )}
              </p>
            </div>
          </div>

          <MuteButton
            muted={voice.muted}
            onToggle={voice.toggleMute}
            speaking={voice.speaking}
            lang={voiceLang}
            onLangChange={setVoiceLang}
          />
        </div>
      </div>

      <div style={{
        background: "white", borderRadius: 24, padding: 30,
        border: "1px solid #e2e8f0",
        boxShadow: "0 12px 40px rgba(15,23,42,0.06)",
      }}>

        {/* ═══ Barre agent + chambre ═══ */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginBottom: 20, flexWrap: "wrap", gap: 10,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {agent && (
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "9px 16px", background: "#faf5ff",
                border: "1px solid #e9d5ff", borderRadius: 12,
              }}>
                <Icons.User size={15} color="#7c3aed" strokeWidth={2.2} />
                <span style={{ fontWeight: 700, color: "#7c3aed", fontSize: 13 }}>
                  {agent.nomPrenom || agent.nom}
                </span>
                <Badge style={{
                  background: "#ede9fe", color: "#7c3aed",
                  fontSize: 10, padding: "2px 10px", borderRadius: 20,
                  fontWeight: 700,
                }}>
                  {agent.codeBarre || agent.matricule}
                </Badge>
              </div>
            )}

            {collecte && (
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "9px 16px", background: "#f0f9ff",
                border: "1px solid #bae6fd", borderRadius: 12,
              }}>
                <Icons.Building size={15} color="#0284c7" strokeWidth={2.2} />
                <span style={{ fontWeight: 700, color: "#0284c7", fontSize: 13 }}>
                  {collecte.codeChambre}
                </span>
                <Badge style={{
                  background: "#e0f2fe", color: "#0284c7",
                  fontSize: 10, padding: "2px 10px", borderRadius: 20,
                  fontWeight: 700,
                }}>
                  {totalLits} lits
                </Badge>
              </div>
            )}
          </div>

          {etape !== "CHAMBRE" && (
            <Button
              variant="outline"
              size="sm"
              onClick={reset}
              style={{
                fontSize: 12, borderColor: "#fca5a5", color: "#dc2626",
                borderRadius: 10, padding: "7px 15px", fontWeight: 700,
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              <Icons.Refresh size={12} strokeWidth={2.5} />
              Reset
            </Button>
          )}
        </div>

        {/* ═══ Zone scan ═══ */}
        <Card style={{
          marginBottom: 20,
          border: `2px dashed ${borderColor}`,
          borderRadius: 16,
          background: "linear-gradient(135deg, #ffffff, #fafbfc)",
        }}>
          <CardContent className="p-5">

            <ScanInput
              ref={scanInputRef}
              placeholder={getPlaceholder()}
              value={scanVal}
              onChange={setScanVal}
              onSubmit={handleScan}
              borderColor={borderColor}
              keepFocus
              autoDebounce
              disabled={loading || !agent}
            />

            {lingeInfecteEnCours && (
              <div style={{
                marginTop: 12, padding: "11px 15px", borderRadius: 10,
                background: "linear-gradient(135deg, #fee2e2, #fecaca)",
                border: "1px solid #fca5a5",
                fontSize: 12, color: "#991b1b",
                display: "flex", alignItems: "center", gap: 9,
                fontWeight: 700, animation: "fadeIn 0.3s ease-out",
              }}>
                <Icons.Biohazard size={14} color="#991b1b" strokeWidth={2.5} />
                Scannez le sac infecté pour le linge {lingeInfecteEnCours.codeBarre}
              </div>
            )}

            {etape === "SCAN" && collecte && !lingeInfecteEnCours && (
              <div style={{
                marginTop: 10, padding: "10px 15px", borderRadius: 10,
                background: "linear-gradient(135deg, #fef3c7, #fde68a)",
                border: "1px solid #fcd34d",
                fontSize: 12, color: "#92400e",
                display: "flex", alignItems: "center", gap: 9,
                fontWeight: 600,
              }}>
                <Icons.Info size={14} color="#92400e" strokeWidth={2.2} />
                Scannez votre badge pour clôturer la collecte
              </div>
            )}

            {scanStatus && <ScanStatus {...scanStatus} />}

          </CardContent>
        </Card>

        {/* ═══ Lit en cours ═══ */}
        {litEnCours && etape === "SCAN" && (
          <Card style={{
            marginBottom: 16, borderRadius: 14,
            background: litEnCours.actionSuivante === "SCANNER_SAC_INFECTE"
              ? "linear-gradient(135deg, #fef2f2, #fee2e2)"
              : "linear-gradient(135deg, #f0fdf4, #dcfce7)",
            border: `2px solid ${litEnCours.actionSuivante === "SCANNER_SAC_INFECTE" ? "#fca5a5" : "#bbf7d0"}`,
            boxShadow: "0 4px 16px rgba(15,23,42,0.06)",
          }}>
            <CardContent className="p-5">
              <div style={{
                display: "flex", justifyContent: "space-between",
                alignItems: "center", flexWrap: "wrap", gap: 12,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 14,
                    background: "white", display: "flex",
                    alignItems: "center", justifyContent: "center",
                    boxShadow: "0 3px 10px rgba(15,23,42,0.1)",
                    border: `1.5px solid ${litEnCours.actionSuivante === "SCANNER_SAC_INFECTE" ? "#fca5a5" : "#86efac"}`,
                  }}>
                    {litEnCours.actionSuivante === "SCANNER_SAC_INFECTE" ? (
                      <Icons.Biohazard size={26} color="#dc2626" strokeWidth={2.2} />
                    ) : (
                      <Icons.CheckCircle size={26} color="#15803d" strokeWidth={2.2} />
                    )}
                  </div>

                  <div>
                    <div style={{
                      fontWeight: 800, fontSize: 15,
                      color: litEnCours.actionSuivante === "SCANNER_SAC_INFECTE" ? "#dc2626" : "#15803d",
                    }}>
                      Lit {litEnCours.codeLit}
                      {litEnCours.actionSuivante === "SCANNER_SAC_INFECTE" ? " — Infecté" : " — Normal"}
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 3, fontWeight: 500 }}>
                      {litEnCours.actionSuivante === "SCANNER_SAC_INFECTE"
                        ? "Scannez le sac rouge pour valider"
                        : "Scannez le bac blanc pour valider"}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setLitEnCours(null)}
                  style={{
                    padding: "9px 17px", borderRadius: 10,
                    border: "1px solid #e2e8f0", background: "white",
                    color: "#64748b", cursor: "pointer", fontSize: 12,
                    fontWeight: 700, transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#f8fafc"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "white"; }}
                >
                  Annuler
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ═══ Aucun agent ═══ */}
        {!agent && (
          <Card style={{
            background: "linear-gradient(135deg, #fef2f2, #fee2e2)",
            border: "1.5px solid #fca5a5", marginBottom: 16, borderRadius: 14,
          }}>
            <CardContent className="p-5">
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 12,
                  background: "white", display: "flex",
                  alignItems: "center", justifyContent: "center",
                  boxShadow: "0 2px 8px rgba(220,38,38,0.15)",
                }}>
                  <Icons.AlertTriangle size={18} color="#dc2626" strokeWidth={2.2} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, color: "#dc2626", fontSize: 13.5 }}>
                    Aucun agent connecté
                  </div>
                  <div style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>
                    Connectez-vous pour démarrer la collecte
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ═══ Aucune chambre ═══ */}
        {agent && !collecte && (
          <Card style={{
            background: "linear-gradient(135deg, #faf5ff, #f3e8ff)",
            border: "1.5px solid #e9d5ff", marginBottom: 16, borderRadius: 14,
          }}>
            <CardContent className="p-5">
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 12,
                  background: "white", display: "flex",
                  alignItems: "center", justifyContent: "center",
                  boxShadow: "0 2px 8px rgba(124,58,237,0.15)",
                }}>
                  <Icons.Building size={18} color="#7c3aed" strokeWidth={2.2} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, color: "#7c3aed", fontSize: 13.5 }}>
                    Scannez le code de la chambre
                  </div>
                  <div style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>
                    pour démarrer une nouvelle collecte
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ═══ Stats + Lits ═══ */}
        {etape === "SCAN" && collecte && (
          <>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: 12, marginBottom: 24,
            }}>
              <StatutCard
                label="Total"
                value={totalLits}
                icon={<Icons.Layers size={19} color="#0ea5e9" strokeWidth={2.2} />}
                color="#0ea5e9"
                bg="linear-gradient(135deg, #f0f9ff, #e0f2fe)"
              />
              <StatutCard
                label="Blancs"
                value={nbBlancs}
                icon={<Icons.CheckCheck size={19} color="#15803d" strokeWidth={2.5} />}
                color="#15803d"
                bg="linear-gradient(135deg, #f0fdf4, #dcfce7)"
              />
              <StatutCard
                label="Infectés"
                value={nbInfectes}
                icon={<Icons.Biohazard size={19} color="#dc2626" strokeWidth={2.2} />}
                color="#dc2626"
                bg="linear-gradient(135deg, #fef2f2, #fee2e2)"
              />
              <StatutCard
                label="Restants"
                value={nonTraites}
                icon={<Icons.Activity size={19} color="#f59e0b" strokeWidth={2.2} />}
                color="#f59e0b"
                bg="linear-gradient(135deg, #fffbeb, #fef3c7)"
              />
            </div>

            <div style={{ paddingTop: 20, borderTop: "1.5px solid #e2e8f0" }}>
              {/* Header section lits */}
              <div style={{
                display: "flex", justifyContent: "space-between",
                alignItems: "center", marginBottom: 18,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 12,
                    background: "linear-gradient(135deg, #ede9fe, #ddd6fe)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    border: "1px solid #c4b5fd",
                  }}>
                    <Icons.Bed size={18} color="#7c3aed" strokeWidth={2.2} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 15.5, color: "#0f172a", letterSpacing: "-0.01em" }}>
                      Lits de la chambre
                    </div>
                    <div style={{ fontSize: 11.5, color: "#64748b", fontWeight: 500, marginTop: 2 }}>
                      {totalLits} lit{totalLits > 1 ? "s" : ""} · {traites} traité{traites > 1 ? "s" : ""}
                    </div>
                  </div>
                </div>

                <div style={{
                  display: "flex", alignItems: "center", gap: 11,
                  padding: "9px 15px", borderRadius: 11,
                  background: "#f8fafc", border: "1px solid #e2e8f0",
                }}>
                  <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px" }}>
                    Progression
                  </div>
                  <div style={{
                    width: 90, height: 6, borderRadius: 3,
                    background: "#e2e8f0", overflow: "hidden",
                  }}>
                    <div style={{
                      height: "100%",
                      width: `${totalLits > 0 ? (traites / totalLits) * 100 : 0}%`,
                      background: "linear-gradient(90deg, #7c3aed, #6d28d9)",
                      transition: "width 0.4s ease",
                    }} />
                  </div>
                  <div style={{ fontSize: 11.5, color: "#7c3aed", fontWeight: 800, minWidth: 32, textAlign: "right" }}>
                    {totalLits > 0 ? Math.round((traites / totalLits) * 100) : 0}%
                  </div>
                </div>
              </div>

              {/* Liste des lits */}
              <div style={{ maxHeight: 560, overflowY: "auto", paddingRight: 4 }}>
                {collecte.lits.map((lit) => (
                  <CarteLit
                    key={lit.litId}
                    lit={lit}
                    onPropre={handlePropre}
                    onManquant={(l) => setDlgManq(l)}
                    onInfecte={handleInfecte}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.92); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-spin { animation: spin 1s linear infinite; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 4px; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  );
}

export default function ColageList() {
  return <ColageListInner />;
}