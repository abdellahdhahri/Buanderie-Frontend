import React, { useState, useRef, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useModal } from "../../../contextes/ModalContext";

import ScanInput from "../../utils/shared/ScanInput";
import MuteButton from "../../utils/MuteButton";

import { cat } from "./collecteUtils";
import { useVoiceGuide } from "../../../hooks/useVoiceGuide";
import { getSetting, bipScan } from "../../../utils/appSettings";

import {
  fetchChambreByCode,
  fetchLitsChambre,
  fetchLitsInfectes,
  fetchAgentByCode,
  ouvrirCollecteChambre,
  scannerLit,
  traiterLitAvecContenant,
  marquerLingePropre,
  marquerLingeManquant,
  declarerLingeInfecte,
  cloturerCollecte,
  cloturerCollecteALaFermeture,
  annulerCollecteVide,
} from "../../../services/collecte/collecteChambreService";

import { getAgent, isAgentConnected } from "../../../services/agentService";

import "../Linge/WorkflowList.css";
import { LitTile, LitDialog, estActionInfecte } from "./components/ChambreLits";
import { useRattachementChambre, useCircuitInfecte } from "../../../hooks/useEstablishment";
import { ScanStatus as ScanStatusRh } from "./shared/ScanStatus";
import { Check, ChevronDown, RotateCcw, ScanLine, UserCheck } from "lucide-react";
import "../Reception/Reception.css";
import "./CollecteChambre.css";
import CollageListService from "./collecteService/CollageListService";


const Icons = {
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

  Bed: ({ size = 20, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 4v16" />
      <path d="M2 8h18a2 2 0 0 1 2 2v10" />
      <path d="M2 17h20" />
      <path d="M6 8v9" />
    </svg>
  ),

  CheckCircle: ({ size = 20, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
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

  Refresh: ({ size = 20, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  ),

  Loader: ({ size = 20, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  ),

  Shield: ({ size = 20, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
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

  Sparkles: ({ size = 20, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
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

  Info: ({ size = 20, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  ),

  CheckCheck: ({ size = 20, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 7 17l-5-5" />
      <path d="m22 10-7.5 7.5L13 16" />
    </svg>
  ),

  Square: ({ size = 20, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="3" />
    </svg>
  ),

  SquareCheck: ({ size = 20, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="m8 12 3 3 5-6" />
    </svg>
  ),
};


const calculerStatutLit = (linges) => {
  if (!linges.length || linges.some((lg) => !lg.statut)) return "";
  if (linges.some((lg) => lg.statut === "INFECTE")) return "INFECTE";
  if (linges.some((lg) => lg.statut === "BLANC")) return "BLANC";
  return "TRAITE";
};


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
              { num: 1, text: "Placez le linge dans un bac infecté (rouge)" },
              { num: 2, text: "Scannez le code ou le tag du bac infecté pour associer" },
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
            Scanner le bac infecté
          </button>
        </div>
      </div>
    </div>
  );
}


function ColageListInner() {
  const circuitInfecte = useCircuitInfecte();
  const { t } = useTranslation();
  const { showAlert, showConfirm } = useModal();

  const [voiceLang, setVoiceLang] = useState(() => getSetting("voice.lang"));
  const voice = useVoiceGuide(voiceLang);
  const voiceRef = useRef(voice);

  useEffect(() => { voiceRef.current = voice; }, [voice]);

  const [etape, setEtape] = useState("CHAMBRE");
  const [agent, setAgent] = useState(null);
  const [collecte, setCollecte] = useState(null);
  const [litEnCours, setLitEnCours] = useState(null);
  // Lit déjà traité ouvert en consultation (sans sélection)
  const [litConsulte, setLitConsulte] = useState(null);
  const [selection, setSelection] = useState([]);
  const [scanVal, setScanVal] = useState("");
  const [loading, setLoading] = useState(false);
  const [dlgManq, setDlgManq] = useState(null);
  const [dlgInfecte, setDlgInfecte] = useState(null);
  const [lingeInfecteEnCours, setLingeInfecteEnCours] = useState(null);
  const [scanStatus, setScanStatus] = useState(null);
  const [groupesOuverts, setGroupesOuverts] = useState({ traites: true, vides: true });

  const agentRef = useRef(null);
  const collecteRef = useRef(null);
  const scanInputRef = useRef(null);
  const scanTimeoutRef = useRef(null);

  useEffect(() => { agentRef.current = agent; }, [agent]);
  useEffect(() => { collecteRef.current = collecte; }, [collecte]);

  useEffect(() => {
    return () => { voice.cancel(); };
  }, []);

  // Fermeture de la fenêtre / de l'onglet ou sortie de la page : la collecte
  // ouverte est clôturée automatiquement pour ne pas rester « en cours ».
  useEffect(() => {
    const cloturerSiOuverte = () => {
      const c = collecteRef.current;
      if (!c?.id) return;
      collecteRef.current = null; // évite une double clôture (pagehide puis démontage)
      cloturerCollecteALaFermeture(c.id);
    };
    window.addEventListener("pagehide", cloturerSiOuverte);
    return () => {
      window.removeEventListener("pagehide", cloturerSiOuverte);
      cloturerSiOuverte();
    };
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

  const majLit = useCallback((litId, statut, codes = [], bacInfecteId = null) => {
    setCollecte((p) =>
      p ? {
        ...p,
        lits: p.lits.map((l) => {
          if (l.litId !== litId) return l;
          const linges = l.linges.map((lg) => ({
            ...lg,
            statut: codes.includes(lg.codeBarre) ? statut : lg.statut,
            bacInfecteId:
              statut === "INFECTE" && codes.includes(lg.codeBarre)
                ? bacInfecteId ?? lg.bacInfecteId ?? null
                : lg.bacInfecteId ?? null,
          }));
          return { ...l, linges, statut: calculerStatutLit(linges) };
        }),
      } : p
    );
  }, []);

  const majLinge = useCallback((lingeId, statut, bacInfecteId = null) => {
    setCollecte((p) =>
      p ? {
        ...p,
        lits: p.lits.map((l) => {
          if (!l.linges.some((lg) => lg.lingeId === lingeId)) return l;
          const linges = l.linges.map((lg) =>
            lg.lingeId === lingeId ? {
              ...lg, statut,
              bacInfecteId: statut === "INFECTE"
                ? bacInfecteId ?? lg.bacInfecteId ?? null
                : lg.bacInfecteId,
            } : lg
          );
          return { ...l, linges, statut: calculerStatutLit(linges) };
        }),
      } : p
    );
  }, []);

  const annulerSelection = useCallback(() => {
    setLitEnCours(null);
    setLitConsulte(null);
    setSelection([]);
  }, []);

  // Un linge déclaré (propre / manquant / infecté) sort de la sélection
  const retirerDeSelection = useCallback((lingeId) => {
    setSelection((s) => s.filter((id) => id !== lingeId));
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
      // Tous les lits de la chambre + lits infectés : le backend n'envoie
      // que les lits ayant des linges LIVRE, les autres doivent aussi être signalés
      const [tousLesLits, idsInfectes] = await Promise.all([
        fetchLitsChambre(ch.id).catch((err) => {
          console.warn("Lits de la chambre indisponibles :", err);
          return [];
        }),
        fetchLitsInfectes().catch((err) => {
          console.warn("Lits infectés indisponibles :", err);
          return new Set();
        }),
      ]);

      const litsCollecte = (res.lits || []).map((l) => ({
        ...l, statut: l.statut || "",
        estInfecte: !!l.estInfecte || idsInfectes.has(String(l.litId)),
        linges: (l.linges || []).map((lg) => ({
          ...lg, bacInfecteId: lg.bacInfecteId ?? null,
        })),
      }));

      // Ajouter les lits de la chambre sans linge, pour afficher tous les lits
      const litsVides = tousLesLits
        .filter((l) => !litsCollecte.some(
          (lc) => String(lc.litId) === String(l.id) || (l.code && lc.codeLit === l.code)
        ))
        .map((l) => ({
          litId: l.id, codeLit: l.code || `#${l.id}`, statut: "", linges: [],
          estInfecte: idsInfectes.has(String(l.id)),
        }));

      setCollecte({
        id: res.collecteId,
        codeChambre: res.codeChambre,
        lits: [...litsCollecte, ...litsVides].sort((a, b) =>
          String(a.codeLit).localeCompare(String(b.codeLit), undefined, { numeric: true })
        ),
      });
      annulerSelection();
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
        voiceRef.current.sayGuideChambre();
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
  }, [agent, showAlert, voice, annulerSelection]);

  const handleSelectionnerLit = useCallback(async (lit) => {
    if (!collecte || !lit) return;
    setLoading(true);
    setScanStatus({ loading: true, code: `Lit ${lit.codeLit}` });
    try {
      const res = await scannerLit(collecte.id, lit.litId);
      const nonTraites = lit.linges.filter((lg) => !lg.statut).map((lg) => lg.lingeId);
      setLitConsulte(null);
      setLitEnCours({
        litId: res.litId, codeLit: res.codeLit,
        estInfecte: res.estInfecte, nbLinges: res.nbLinges,
        actionSuivante: res.actionSuivante,
      });
      setSelection(nonTraites);
      setScanStatus({
        loading: false,
        success: {
          message: res.estInfecte ? `Lit ${res.codeLit} — infecté` : `Lit ${res.codeLit} — normal`,
          detail: res.estInfecte
            ? "Cochez les linges puis scannez le bac infecté"
            : "Cochez les linges puis scannez le bac blanc",
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

  const toggleSelection = useCallback((lingeId) => {
    setSelection((s) => s.includes(lingeId) ? s.filter((id) => id !== lingeId) : [...s, lingeId]);
  }, []);

  const lingesSelectionnables = (() => {
    if (!litEnCours || !collecte) return [];
    const lit = collecte.lits.find((l) => l.litId === litEnCours.litId);
    return lit ? lit.linges.filter((lg) => !lg.statut).map((lg) => lg.lingeId) : [];
  })();

  const toutCoche = lingesSelectionnables.length > 0
    && lingesSelectionnables.every((id) => selection.includes(id));

  const toggleTout = () => {
    if (toutCoche) {
      setSelection([]);
      voice.sayToutDecoche();
    } else {
      setSelection(lingesSelectionnables);
      voice.sayToutCoche(lingesSelectionnables.length);
    }
  };

  // Clic sur un lit : à collecter → sélection (scanner-lit), déjà traité → consultation
  const handleClickLit = useCallback((lit) => {
    if (!lit.linges.length) { voice.sayLitVide(lit.codeLit); return; }
    if (litEnCours?.litId === lit.litId) return;
    if (lit.statut) {
      setLitEnCours(null);
      setSelection([]);
      setLitConsulte(lit.litId);
      voice.sayLitDejaTraite(lit.codeLit);
      return;
    }
    handleSelectionnerLit(lit);
  }, [litEnCours, handleSelectionnerLit, voice]);

  const litOuvertId = litEnCours?.litId ?? litConsulte;
  const litOuvert = litOuvertId != null
    ? collecte?.lits?.find((l) => l.litId === litOuvertId) || null
    : null;

  const handleTraiterContenant = useCallback(async (codeContenant) => {
    if (!collecte || !litEnCours) return;
    if (selection.length === 0) {
      showAlert("Aucun linge coché", "Touchez au moins un linge avant de scanner le contenant.", "warning");
      voice.saySelectionVide();
      return;
    }
    setLoading(true);
    setScanStatus({ loading: true, code: codeContenant });
    try {
      const res = await traiterLitAvecContenant(
        collecte.id, litEnCours.litId, codeContenant, selection
      );
      const estInfecte = res.typeContenant === "BAC_INFECTE";
      const statut = estInfecte ? "INFECTE" : "BLANC";
      const bacId = estInfecte ? res.bacInfecteId ?? res.bacId ?? null : null;
      majLit(litEnCours.litId, statut, res.codes || [], bacId);

      const codeLit = litEnCours.codeLit;
      const restants = lingesSelectionnables.length - (res.nbTraites || 0);
      annulerSelection();

      setScanStatus({
        loading: false,
        success: {
          message: estInfecte ? `Bac infecté ${codeContenant} associé` : `Bac blanc ${codeContenant} associé`,
          detail: restants > 0
            ? `${res.nbTraites} linge(s) · Lit ${codeLit} · ${restants} restant(s) à déclarer`
            : `${res.nbTraites} linge(s) · Lit ${codeLit}`,
        },
        error: null,
      });
      setTimeout(() => setScanStatus(null), 3000);
      if (estInfecte) voice.sayBacInfecteOk(res.nbTraites, codeContenant);
      else voice.sayBacBlancOk(res.nbTraites, codeContenant);
      if (restants > 0) {
        setTimeout(() => {
          voiceRef.current.sayLingesRestantsLit(restants);
        }, 2500);
      }
    } catch (e) {
      setScanStatus({ loading: false, success: null, error: e.message });
      showAlert("Erreur", e.message, "error");
      voice.sayContenantErreur(e.message);
    } finally {
      setLoading(false);
    }
  }, [collecte, litEnCours, selection, lingesSelectionnables.length, majLit, annulerSelection, showAlert, voice]);

  const handlePropre = useCallback(async (linge) => {
    setLoading(true);
    try {
      await marquerLingePropre(collecteRef.current?.id, linge.codeBarre);
      majLinge(linge.lingeId, "PROPRE");
      retirerDeSelection(linge.lingeId);
      showAlert("Propre", linge.codeBarre, "info");
      voice.sayLingePropre();
    } catch (e) {
      showAlert("Erreur", e.message, "error");
      voice.sayErreurGenerique(e.message);
    } finally {
      setLoading(false);
    }
  }, [majLinge, retirerDeSelection, showAlert, voice]);

  const handleManquant = useCallback(async (linge) => {
    setDlgManq(null);
    setLoading(true);
    try {
      await marquerLingeManquant(collecteRef.current?.id, linge.lingeId);
      majLinge(linge.lingeId, "MANQUANT");
      retirerDeSelection(linge.lingeId);
      showAlert("Manquant", linge.codeBarre, "warning");
      voice.sayLingeManquant();
    } catch (e) {
      showAlert("Erreur", e.message, "error");
      voice.sayErreurGenerique(e.message);
    } finally {
      setLoading(false);
    }
  }, [majLinge, retirerDeSelection, showAlert, voice]);

  const handleInfecte = useCallback((linge) => {
    setDlgInfecte(linge);
    voice.sayGuideInfecte();
  }, [voice]);

  const handleScannerBacPourInfecte = useCallback((linge) => {
    setDlgInfecte(null);
    setLingeInfecteEnCours(linge);
    setScanStatus({ loading: false, success: null, error: null });
    setTimeout(() => {
      if (scanInputRef.current) scanInputRef.current.focus();
    }, 150);
    voice.sayScannerBacInfecte();
  }, [voice]);

  const handleDeclarerInfecte = useCallback(async (codeBacInfecte) => {
    if (!collecte || !lingeInfecteEnCours) return;
    setLoading(true);
    setScanStatus({ loading: true, code: codeBacInfecte });
    try {
      const res = await declarerLingeInfecte(collecte.id, lingeInfecteEnCours.lingeId, codeBacInfecte);
      majLinge(lingeInfecteEnCours.lingeId, "INFECTE", res?.bacInfecteId ?? res?.bacId ?? null);
      retirerDeSelection(lingeInfecteEnCours.lingeId);
      setScanStatus({
        loading: false,
        success: {
          message: "Linge déclaré infecté",
          detail: `${lingeInfecteEnCours.codeBarre} → Bac infecté ${res?.codeBacInfecte || codeBacInfecte}`,
        },
        error: null,
      });
      setLingeInfecteEnCours(null);
      setTimeout(() => setScanStatus(null), 3000);
      voice.sayLingeInfecteOk();
    } catch (e) {
      setScanStatus({ loading: false, success: null, error: e.message });
      showAlert("Erreur déclaration infecté", e.message, "error");
      voice.sayErreurGenerique(e.message);
    } finally {
      setLoading(false);
    }
  }, [collecte, lingeInfecteEnCours, majLinge, retirerDeSelection, showAlert, voice]);

  const handleCloturer = useCallback(async () => {
    if (!collecte) return;
    const nonTr = collecte?.lits?.filter((l) => !l.statut && l.linges.length > 0) || [];
    if (nonTr.length > 0) {
      voice.sayClotureRestants(nonTr.length);
      const ok = await showConfirm(
        "Lits non traités",
        `${nonTr.length} lit(s) avec des linges sans statut. Clôturer quand même ?`,
        "question"
      );
      if (!ok) return;
    }
    setLoading(true);
    try {
      const res = await cloturerCollecte(collecte.id);
      if (res.annulee) {
        showAlert("Collecte annulée", res.message || "Aucun linge collecté.", "info");
        setCollecte(null); annulerSelection(); setEtape("CHAMBRE");
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
      setCollecte(null); annulerSelection();
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
  }, [collecte, showAlert, showConfirm, voice, annulerSelection]);

  const handleScan = useCallback(async (code) => {
    if (!code) return;
    if (lingeInfecteEnCours) { await handleDeclarerInfecte(code); return; }
    if (etape === "CHAMBRE") { await handleChambre(code); return; }
    if (etape === "SCAN") {
      if (litEnCours) { await handleTraiterContenant(code); return; }
      const lit = collecteRef.current?.lits?.find(
        (l) => l.codeLit === code || String(l.litId) === code
      );
      if (lit && !lit.statut && lit.linges.length > 0) { await handleSelectionnerLit(lit); return; }
      try {
        const ag = await fetchAgentByCode(code);
        if (ag && collecte) { await handleCloturer(); return; }
      } catch {}
      showAlert("Code non reconnu", "Cliquez sur un lit, ou scannez un lit ou votre badge.", "error");
      voice.sayCodeNonReconnu();
    }
  }, [
    lingeInfecteEnCours, etape, litEnCours, collecte,
    handleDeclarerInfecte, handleChambre, handleTraiterContenant,
    handleSelectionnerLit, handleCloturer, showAlert, voice,
  ]);

  const totalLits = collecte?.lits?.length || 0;
  // Les lits sans linge n'ont rien à collecter : exclus de la progression
  const litsAvecLinge = collecte?.lits?.filter((l) => l.linges.length > 0).length || 0;
  const traites = collecte?.lits?.filter((l) => l.statut).length || 0;
  const nonTraites = litsAvecLinge - traites;
  const nbBlancs = collecte?.lits?.filter((l) => l.statut === "BLANC").length || 0;
  const nbInfectes = collecte?.lits?.filter((l) => l.statut === "INFECTE").length || 0;

  const aucunLingeTraite = !collecte?.lits?.some((l) => l.linges.some((lg) => lg.statut));

  const reset = async () => {
    voice.cancel();
    if (collecte && aucunLingeTraite) {
      try { await annulerCollecteVide(collecte.id); }
      catch (e) { console.warn("Annulation de la collecte vide impossible :", e); }
    } else if (collecte) {
      try { await cloturerCollecte(collecte.id); }
      catch (e) { console.warn("Clôture de la collecte impossible :", e); }
    }
    setAgent(null); setCollecte(null); annulerSelection();
    setLingeInfecteEnCours(null); setDlgInfecte(null);
    setEtape("CHAMBRE"); setScanVal(""); setScanStatus(null);
  };

  useEffect(() => {
    if (scanVal.trim().length < (Number(getSetting("scan.minLength")) || 3)) return;
    clearTimeout(scanTimeoutRef.current);
    scanTimeoutRef.current = setTimeout(() => {
      const code = scanVal.trim();
      setScanVal("");
      bipScan();
      handleScan(code);
    }, Math.max(100, (Number(getSetting("scan.delayMs")) || 400) - 100)); // un peu avant le champ de scan : évite un double envoi
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
    if (lingeInfecteEnCours) return `Scanner le bac infecté (code ou tag) pour ${lingeInfecteEnCours.codeBarre}...`;
    if (!collecte) return "Scannez le code de la chambre...";
    if (litEnCours) {
      return estActionInfecte(litEnCours.actionSuivante)
        ? `Scanner le bac infecté (code ou tag) — ${selection.length} linge(s) coché(s) — Lit ${litEnCours.codeLit}...`
        : `Scanner le bac blanc — ${selection.length} linge(s) coché(s) — Lit ${litEnCours.codeLit}...`;
    }
    return "Cliquez sur un lit, ou scannez votre badge pour clôturer...";
  };

  const borderColor = !agent
    ? "#e2e8f0"
    : lingeInfecteEnCours
    ? "#dc2626"
    : estActionInfecte(litEnCours?.actionSuivante)
    ? "#dc2626"
    : "#7c3aed";

  const nomAgent = agent ? String(agent.nomPrenom || agent.nom || agent.matricule || "").trim() : "";
  const initialesAgent = nomAgent.split(/\s+/).filter(Boolean).slice(0, 2).map((x) => x[0]).join("").toUpperCase() || "?";
  const pct = litsAvecLinge > 0 ? Math.round((traites / litsAvecLinge) * 100) : 0;
  const etapeFaite = [
    Boolean(agent),
    Boolean(collecte),
    Boolean(collecte) && litsAvecLinge > 0 && nonTraites === 0,
    false,
  ];
  const etapeActive = etapeFaite.findIndex((f) => !f);
  const etapes = ["Identification de l'agent", "Scan de la chambre", "Collecte des lits", "Clôture"];
  const litsParFiltre = {
    tous: collecte?.lits || [],
    afaire: (collecte?.lits || []).filter((l) => l.linges.length > 0 && !l.statut),
    traites: (collecte?.lits || []).filter((l) => l.statut),
    vides: (collecte?.lits || []).filter((l) => l.linges.length === 0),
  };
  const groupesLits = [
    { key: "afaire", titre: "À collecter", lits: litsParFiltre.afaire, repliable: false },
    { key: "traites", titre: "Traités", lits: litsParFiltre.traites, repliable: true },
    { key: "vides", titre: "Sans linge", lits: litsParFiltre.vides, repliable: true },
  ];
  const infecteActif = Boolean(lingeInfecteEnCours) || estActionInfecte(litEnCours?.actionSuivante);

  return (
    <div className="collecte-container cr-page rc cc">

      <DialogueManquant
        linge={dlgManq}
        onConfirmer={handleManquant}
        onFermer={() => setDlgManq(null)}
      />

      <DialogueInfecte
        linge={dlgInfecte}
        onFermer={() => setDlgInfecte(null)}
        onScanner={handleScannerBacPourInfecte}
      />

      <div className="rc-toolbar">
        <div className="rc-head__right">
          {collecte && (
            <span className="rc-mode"><i /> Chambre {collecte.codeChambre} · {totalLits} lits</span>
          )}
          {agent && (
            <div className="rc-agent">
              <span className="rc-agent__avatar">{initialesAgent}</span>
              <span className="rc-agent__text">
                <span className="rc-agent__name">{nomAgent || "—"}</span>
                <span className="rc-agent__id">{agent.codeBarre || agent.matricule}</span>
              </span>
            </div>
          )}
          <MuteButton
            muted={voice.muted}
            onToggle={voice.toggleMute}
            speaking={voice.speaking}
            lang={voiceLang}
            onLangChange={setVoiceLang}
          />
          {etape !== "CHAMBRE" && (
            <button type="button" className="rc-btn" onClick={reset}>
              <RotateCcw size={14} /> Réinitialiser
            </button>
          )}
        </div>
      </div>

      <ol className="rc-steps rc-steps--4" aria-label="Étapes de la collecte">
        {etapes.map((label, i) => (
          <li key={label} className={`rc-step ${etapeFaite[i] ? "is-done" : ""} ${etapeActive === i ? "is-active" : ""}`}>
            <span className="rc-step__num">{etapeFaite[i] ? <Check size={14} strokeWidth={3} /> : i + 1}</span>
            <span className="rc-step__label">{label}</span>
          </li>
        ))}
      </ol>

      {!agent ? (
        <section className="rc-card rc-welcome">
          <div className="rc-welcome__icon"><UserCheck size={34} strokeWidth={1.6} /></div>
          <div className="rc-welcome__body">
            <span className="rc-eyebrow">Collecte chambre</span>
            <h2>Aucun agent connecté</h2>
            <div className="rc-scan__field is-infecte">
              <ScanInput
                ref={scanInputRef}
                placeholder=""
                value={scanVal}
                onChange={setScanVal}
                onSubmit={handleScan}
                borderColor="#e03131"
                keepFocus
                autoDebounce
                disabled
              />
            </div>
          </div>
        </section>
      ) : (
        <div className={etape === "SCAN" && collecte ? "rc-layout" : ""}>
          <div className="rc-main">
            <section className={`rc-card rc-scan ${infecteActif ? "is-infecte" : ""}`}>
              <header className="rc-scan__bar">
                <span className="rc-scan__title"><ScanLine size={17} /> Collecte chambre</span>
                {litEnCours && (
                  <span className="rc-mode"><i /> Lit {litEnCours.codeLit} · {selection.length} coché(s)</span>
                )}
              </header>
              <div className="rc-scan__body">
                <div className={`rc-scan__field ${infecteActif ? "is-infecte" : ""}`}>
                  <ScanInput
                    ref={scanInputRef}
                    placeholder=""
                    value={scanVal}
                    onChange={setScanVal}
                    onSubmit={handleScan}
                    borderColor={infecteActif ? "#e03131" : "#0d9488"}
                    keepFocus
                    autoDebounce
                    disabled={loading}
                  />
                </div>
                {lingeInfecteEnCours && (
                  <div className="cc-alert">
                    <Icons.Biohazard size={18} color="currentColor" strokeWidth={2.2} />
                    <span>Bac infecté requis · linge <code>{lingeInfecteEnCours.codeBarre}</code></span>
                  </div>
                )}
                <ScanStatusRh status={scanStatus} />
              </div>
            </section>

            {etape === "SCAN" && collecte && (
              <section className="rc-card">
                <div className="rc-card__head">
                  <h3 className="rc-card__title"><Icons.Bed size={15} color="currentColor" strokeWidth={2.2} /> Lits de la chambre</h3>
                  <span className="rc-count">{totalLits}</span>
                  <div className="cc-progress">
                    <span>{traites} / {litsAvecLinge} traités</span>
                    <div className="cc-progress__bar"><i style={{ width: `${pct}%` }} /></div>
                    <strong>{pct}%</strong>
                  </div>
                </div>
                <div className="rc-card__body">
                  <div className="lit-groups">
                    {groupesLits.map((g) => {
                      const ouvert = !g.repliable || groupesOuverts[g.key];
                      if (g.key !== "afaire" && g.lits.length === 0) return null;
                      return (
                        <section key={g.key} className={`lit-group is-${g.key}`}>
                          <button
                            type="button"
                            className="lit-group__head"
                            disabled={!g.repliable}
                            onClick={() => setGroupesOuverts((o) => ({ ...o, [g.key]: !o[g.key] }))}
                            onMouseDown={(e) => e.preventDefault()}
                            aria-expanded={ouvert}
                          >
                            <span className="lit-group__title">{g.titre}</span>
                            <span className="lit-group__count">{g.lits.length}</span>
                            {g.repliable && <ChevronDown size={16} className="lit-group__chev" />}
                          </button>
                          {ouvert && (g.lits.length === 0 ? (
                            <div className="lit-group__empty"><Check size={16} strokeWidth={3} /> Tous les lits sont traités</div>
                          ) : (
                            <div className="lit-list">
                              {g.lits.map((lit) => (
                                <LitTile
                                  key={lit.litId}
                                  lit={lit}
                                  active={litOuvertId === lit.litId}
                                  onClick={handleClickLit}
                                />
                              ))}
                            </div>
                          ))}
                        </section>
                      );
                    })}
                  </div>
                </div>
              </section>
            )}
          </div>

          {etape === "SCAN" && collecte && (
            <aside className="rc-side">
              <section className="rc-card">
                <div className="rc-card__head">
                  <h3 className="rc-card__title"><Icons.Layers size={15} color="currentColor" strokeWidth={2.2} /> Bilan de la chambre</h3>
                </div>
                <div className="rc-stats">
                  <div className="rc-stat"><span className="rc-stat__value">{totalLits}</span><span className="rc-stat__label">Lits</span></div>
                  <div className="rc-stat"><span className="rc-stat__value">{nbBlancs}</span><span className="rc-stat__label">Blancs</span></div>
                  {circuitInfecte && (
                    <div className="rc-stat rc-stat--danger"><span className="rc-stat__value">{nbInfectes}</span><span className="rc-stat__label">Infectés</span></div>
                  )}
                  <div className="rc-stat"><span className="rc-stat__value">{nonTraites}</span><span className="rc-stat__label">Restants</span></div>
                </div>
              </section>
              <div className="rc-foot">
                <span>Agent : <b>{nomAgent}</b></span>
                <span>{new Date().toLocaleDateString("fr-FR")}</span>
              </div>
            </aside>
          )}
        </div>
      )}

      {litOuvert && etape === "SCAN" && (
        <LitDialog
          lit={litOuvert}
          enSelection={!!litEnCours}
          actionSuivante={litEnCours?.actionSuivante}
          selection={selection}
          nbSelectionnables={lingesSelectionnables.length}
          toutCoche={toutCoche}
          onToggle={toggleSelection}
          onToggleTout={toggleTout}
          onFermer={annulerSelection}
          onPropre={handlePropre}
          onManquant={(l) => setDlgManq(l)}
          onInfecte={handleInfecte}
          scanStatus={scanStatus}
          lingeInfecte={lingeInfecteEnCours}
          t={t}
        />
      )}

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
  const modeChambre = useRattachementChambre();
  if (modeChambre) return <CollageListService modeChambre />;
  return <ColageListInner />;
}