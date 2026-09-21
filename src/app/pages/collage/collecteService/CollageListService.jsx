import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useModal } from "../../../contextes/ModalContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaUser, FaTimes, FaBiohazard, FaCheckCircle, FaCheck,
  FaExclamationTriangle, FaSpinner, FaRedo,
  FaBuilding, FaBoxes, FaBarcode, FaFilter,
  FaTags, FaClipboardCheck, FaHandHoldingHeart,
  FaBoxOpen, FaArrowRight
} from "react-icons/fa";
import { Card, CardContent } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import ScanInput from "../../../components/utils/shared/ScanInput";
import DialogCategorie from "../../../components/utils/collecte/DialogCategorie";
import { cat, ST_COLORS, apiCall } from "../collecteUtils";
import { getAgent, isAgentConnected } from "../../../services/agentService";
import "../../Linge/WorkflowList.css";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8082';

function ProgressionBar({ value, label, color = "#14b8a6", emoji }) {
  const pct = Math.min(Math.max(value, 0), 100);
  const isComplete = pct === 100;

  return (
    <div style={{ marginBottom: "12px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "12px",
          marginBottom: "3px",
        }}
      >
        <span style={{ fontWeight: 500, color: "#64748b", display: "flex", alignItems: "center", gap: "6px" }}>
          {emoji && <span>{emoji}</span>} {label}
        </span>
        <span style={{ fontWeight: 700, color: isComplete ? "#10b981" : "#0f172a" }}>
          {isComplete ? "✅" : ""} {pct}%
        </span>
      </div>
      <div
        style={{
          height: "6px",
          borderRadius: "4px",
          background: "#f1f5f9",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{
            height: "100%",
            borderRadius: "4px",
            background: isComplete
              ? "linear-gradient(90deg, #10b981, #059669)"
              : `linear-gradient(90deg, ${color}, ${color}dd)`,
            boxShadow: isComplete ? "0 0 12px rgba(16,185,129,0.3)" : "none",
            position: "relative",
          }}
        >
          {pct > 0 && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: 0,
                height: "100%",
                width: "20px",
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2))",
              }}
            />
          )}
        </motion.div>
      </div>
    </div>
  );
}

// ─── COMPOSANT : Carte de statistique ─────────────────────────────────────
function StatutCard({ label, value, icon, color, bg, subValue, onClick, active }) {
  const isClickable = !!onClick;
  const isActive = active || false;

  return (
    <motion.div
      whileHover={isClickable ? { y: -3, scale: 1.02 } : {}}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      style={{
        padding: "12px 14px",
        borderRadius: "12px",
        background: isActive ? bg : bg,
        border: `2px solid ${isActive ? color : `${color}25`}`,
        flex: 1,
        minWidth: "90px",
        cursor: isClickable ? "pointer" : "default",
        opacity: isActive ? 1 : 0.85,
        boxShadow: isActive ? `0 4px 16px ${color}25` : "none",
        position: "relative",
        overflow: "hidden",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {isActive && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "60px",
            height: "60px",
            background: `radial-gradient(circle, ${color}15, transparent)`,
            borderRadius: "50%",
            transform: "translate(30px, -30px)",
          }}
        />
      )}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", position: "relative", zIndex: 1 }}>
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "10px",
            background: isActive ? `${color}20` : `${color}10`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "14px",
            transition: "all 0.3s",
          }}
        >
          {icon}
        </div>
        <div>
          <p
            style={{
              fontSize: "9px",
              fontWeight: 600,
              color: "#94a3b8",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              margin: 0,
            }}
          >
            {label}
          </p>
          <p
            style={{
              fontSize: "20px",
              fontWeight: 700,
              color: color,
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            {value}
          </p>
          {subValue && (
            <p style={{ fontSize: "9px", color: "#94a3b8", margin: 0 }}>
              {subValue}
            </p>
          )}
        </div>
      </div>
      {isActive && isClickable && (
        <div
          style={{
            position: "absolute",
            bottom: 4,
            right: 8,
            fontSize: "8px",
            color: color,
            opacity: 0.6,
          }}
        >
          ●
        </div>
      )}
    </motion.div>
  );
}

// ─── COMPOSANT : Scan Status ──────────────────────────────────────────────
function ScanStatusComponent({ status, t }) {
  if (!status) return null;

  if (status.loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          padding: "10px 16px",
          borderRadius: "10px",
          background: "#eff6ff",
          border: "1px solid #93c5fd",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginTop: "10px",
        }}
      >
        <div style={{ position: "relative" }}>
          <FaSpinner className="animate-spin" color="#3b82f6" size={18} />
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "#3b82f6",
              opacity: 0.5,
            }}
          />
        </div>
        <div>
          <p style={{ fontWeight: 600, color: "#1d4ed8", fontSize: "13px", margin: 0 }}>
            {t('collecte.scanning')}
          </p>
          <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>
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
          padding: "10px 16px",
          borderRadius: "10px",
          background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
          border: "1px solid #86efac",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginTop: "10px",
        }}
      >
        <div
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            background: "#dcfce7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 8px rgba(16,185,129,0.2)",
          }}
        >
          <FaCheckCircle color="#22c55e" size={14} />
        </div>
        <div>
          <p style={{ fontWeight: 600, color: "#15803d", fontSize: "13px", margin: 0 }}>
            {status.success.message}
          </p>
          <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>
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
          padding: "10px 16px",
          borderRadius: "10px",
          background: "linear-gradient(135deg, #fef2f2, #fee2e2)",
          border: "1px solid #fca5a5",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginTop: "10px",
        }}
      >
        <div
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            background: "#fee2e2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <FaExclamationTriangle color="#ef4444" size={14} />
        </div>
        <div>
          <p style={{ fontWeight: 600, color: "#dc2626", fontSize: "13px", margin: 0 }}>
            {t('common.error')}
          </p>
          <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>
            {status.error}
          </p>
        </div>
      </motion.div>
    );
  }

  return null;
}

// ─── CARTE LINGE ──────────────────────────────────────────────────────────
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
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "8px 14px",
        borderRadius: "10px",
        border: `1px solid ${isTraite ? col?.b || "#e2e8f0" : "#e2e8f0"}`,
        background: isTraite ? col?.bg || "#f8fafc" : "white",
        marginBottom: "4px",
        transition: "all 0.2s",
        boxShadow: isTraite ? "none" : "0 1px 3px rgba(0,0,0,0.04)",
        position: "relative",
      }}
    >
      {!isTraite && bacBlanc?.bacId && (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: "3px",
            borderRadius: "3px 0 0 3px",
            background: "linear-gradient(180deg, #14b8a6, #0d9488)",
          }}
        />
      )}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: 0, paddingLeft: isTraite ? 0 : "4px" }}>
        <span style={{ fontSize: "16px", flexShrink: 0 }}>{c.emoji}</span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <span style={{ fontSize: "11px", fontWeight: 600, color: c.color }}>{c.label}</span>
          <code style={{ fontSize: "9px", color: "#94a3b8", display: "block", wordBreak: "break-all" }}>
            {linge.codeBarre}
          </code>
        </div>
      </div>

      {isTraite ? (
        <span
          style={{
            fontSize: "8px",
            fontWeight: 700,
            padding: "2px 12px",
            borderRadius: "12px",
            background: col?.tag,
            color: col?.tc,
            flexShrink: 0,
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          {col?.lbl}
        </span>
      ) : (
        <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
          <motion.button
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onBlanc(linge)}
            disabled={!bacBlanc?.bacId}
            title={t('collecte.sale_to_white')}
            style={{
              width: "30px",
              height: "30px",
              borderRadius: "50%",
              border: "1.5px solid #bbf7d0",
              background: "#dcfce7",
              cursor: bacBlanc?.bacId ? "pointer" : "not-allowed",
              opacity: bacBlanc?.bacId ? 1 : 0.4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
              boxShadow: bacBlanc?.bacId ? "0 2px 6px rgba(16,185,129,0.15)" : "none",
            }}
          >
            <FaCheck size={9} color="#16a34a" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onPropre(linge)}
            title={t('collecte.propre_keep')}
            style={{
              width: "30px",
              height: "30px",
              borderRadius: "50%",
              border: "1.5px solid #bae6fd",
              background: "#dbeafe",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
              boxShadow: "0 2px 6px rgba(2,132,199,0.15)",
            }}
          >
            <FaCheckCircle size={9} color="#0284c7" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onManquant(linge)}
            title={t('collecte.missing')}
            style={{
              width: "30px",
              height: "30px",
              borderRadius: "50%",
              border: "1.5px solid #fde68a",
              background: "#fef3c7",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
              boxShadow: "0 2px 6px rgba(217,119,6,0.15)",
            }}
          >
            <FaExclamationTriangle size={9} color="#d97706" />
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}

// ─── COMPOSANT : Action Button ────────────────────────────────────────────
function ActionButton({ 
  onClick, 
  disabled, 
  loading, 
  icon, 
  label, 
  type = "primary", 
  badge,
  className 
}) {
  const isPrimary = type === "primary";
  const isSuccess = type === "success";
  const isDanger = type === "danger";
  const isWarning = type === "warning";
  const isDefault = type === "default";

  let bgColor = "white";
  let textColor = "#64748b";
  let borderColor = "#e2e8f0";
  let hoverBg = "#f8fafc";
  let boxShadow = "none";

  if (isPrimary) {
    bgColor = "linear-gradient(135deg, #14b8a6, #0d9488)";
    textColor = "white";
    borderColor = "transparent";
    hoverBg = "linear-gradient(135deg, #0d9488, #0f766e)";
    boxShadow = "0 4px 16px rgba(20,184,166,0.3)";
  } else if (isSuccess) {
    bgColor = "linear-gradient(135deg, #10b981, #059669)";
    textColor = "white";
    borderColor = "transparent";
    hoverBg = "linear-gradient(135deg, #059669, #047857)";
    boxShadow = "0 4px 16px rgba(16,185,129,0.3)";
  } else if (isDanger) {
    bgColor = "white";
    textColor = "#dc2626";
    borderColor = "#fca5a5";
    hoverBg = "#fef2f2";
    boxShadow = "0 2px 8px rgba(220,38,38,0.1)";
  } else if (isWarning) {
    bgColor = "linear-gradient(135deg, #f59e0b, #d97706)";
    textColor = "white";
    borderColor = "transparent";
    hoverBg = "linear-gradient(135deg, #d97706, #b45309)";
    boxShadow = "0 4px 16px rgba(245,158,11,0.3)";
  } else if (isDefault) {
    bgColor = "white";
    textColor = "#64748b";
    borderColor = "#e2e8f0";
    hoverBg = "#f8fafc";
    boxShadow = "none";
  }

  return (
    <motion.button
      whileHover={!disabled ? { y: -2, scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.97 } : {}}
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        padding: "10px 22px",
        borderRadius: "10px",
        border: `1.5px solid ${borderColor}`,
        background: disabled || loading ? "#e2e8f0" : bgColor,
        color: disabled || loading ? "#94a3b8" : textColor,
        fontWeight: 600,
        fontSize: "13px",
        cursor: disabled || loading ? "not-allowed" : "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        boxShadow: disabled || loading ? "none" : boxShadow,
        position: "relative",
        overflow: "hidden",
        flexShrink: 0,
        minWidth: "120px",
      }}
    >
      {!disabled && !loading && (
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          style={{
            position: "absolute",
            top: "-50%",
            right: "-50%",
            width: "200%",
            height: "200%",
            background: "radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
      )}
      {loading ? (
        <FaSpinner className="animate-spin" size={14} />
      ) : (
        <>
          {icon}
          {label}
        </>
      )}
      {badge && !disabled && !loading && (
        <span
          style={{
            background: "rgba(255,255,255,0.2)",
            padding: "1px 8px",
            borderRadius: "10px",
            fontSize: "10px",
            fontWeight: 700,
          }}
        >
          {badge}
        </span>
      )}
    </motion.button>
  );
}

// ─── DIALOGUE SAC INFECTÉ ──────────────────────────────────────────────────
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
      <div data-modal="true" style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 9999, backdropFilter: "blur(4px)"
      }}>
        <div style={{
          background: "white", borderRadius: "16px", padding: "24px",
          maxWidth: "360px", width: "95%",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "24px" }}>{catChoisie.emoji}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: "14px", color: "#0f172a" }}>{catChoisie.label}</div>
                <div style={{ fontSize: "11px", color: "#64748b" }}>
                  {t('collecte.how_many_infected', { label: catChoisie.label.toLowerCase() })}
                </div>
              </div>
            </div>
            <button onClick={onClose} style={{
              background: "transparent", border: "none", cursor: "pointer", color: "#94a3b8"
            }}>
              <FaTimes size={16} />
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", marginBottom: "20px" }}>
            <button
              onClick={() => setQuantite(q => Math.max(1, q - 1))}
              style={{
                width: "40px", height: "40px", borderRadius: "50%",
                border: `2px solid ${catChoisie.border}`,
                background: catChoisie.bg, cursor: "pointer",
                fontSize: "18px", fontWeight: 700, color: catChoisie.color
              }}
            >
              −
            </button>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "40px", fontWeight: 700, color: catChoisie.color, lineHeight: 1 }}>
                {quantite}
              </div>
              <div style={{ fontSize: "11px", color: "#94a3b8" }}>{catChoisie.label}{quantite > 1 ? "s" : ""}</div>
            </div>
            <button
              onClick={() => setQuantite(q => q + 1)}
              style={{
                width: "40px", height: "40px", borderRadius: "50%",
                border: `2px solid ${catChoisie.border}`,
                background: catChoisie.bg, cursor: "pointer",
                fontSize: "18px", fontWeight: 700, color: catChoisie.color
              }}
            >
              +
            </button>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => setEtape("CATEGORIE")}
              style={{
                flex: 1, padding: "8px", borderRadius: "8px",
                border: "1px solid #e2e8f0", background: "white",
                color: "#64748b", fontWeight: 600, fontSize: "12px", cursor: "pointer"
              }}
            >
              {t('common.back')}
            </button>
            <button
              onClick={() => setEtape("BAC")}
              style={{
                flex: 2, padding: "8px", borderRadius: "8px", border: "none",
                background: `linear-gradient(135deg, ${catChoisie.color}, #b91c1c)`,
                color: "white", fontWeight: 700, fontSize: "12px", cursor: "pointer"
              }}
            >
              {quantite} {catChoisie.label}{quantite > 1 ? "s" : ""} →
            </button>
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
      <div data-modal="true" style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 9999, backdropFilter: "blur(4px)"
      }}>
        <div style={{
          background: "white", borderRadius: "16px", padding: "24px",
          maxWidth: "360px", width: "95%",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <FaBiohazard color="#dc2626" size={20} />
            <div>
              <div style={{ fontWeight: 700, fontSize: "14px", color: "#0f172a" }}>
                {t('collecte.scan_red_bac')}
              </div>
              <div style={{ fontSize: "11px", color: "#64748b" }}>
                {quantite} {catChoisie.label}{quantite > 1 ? "s" : ""}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label style={{ fontSize: "11px", fontWeight: 600, color: "#dc2626", display: "block", marginBottom: "4px" }}>
              🔴 {t('collecte.red_bac_code')}
            </label>
            <div style={{ display: "flex", gap: "6px" }}>
              <input
                value={codeBac}
                onChange={e => setCodeBac(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleScanBac()}
                placeholder={t('collecte.scan_or_enter')}
                autoFocus
                style={{
                  flex: 1, padding: "8px 12px", borderRadius: "8px",
                  border: "2px solid #fca5a5", fontSize: "13px", outline: "none"
                }}
              />
              <button
                onClick={handleScanBac}
                disabled={loading || !codeBac.trim()}
                style={{
                  padding: "8px 16px", borderRadius: "8px", border: "none",
                  background: !codeBac.trim() ? "#e2e8f0" : "#dc2626",
                  color: !codeBac.trim() ? "#94a3b8" : "white",
                  fontWeight: 600, fontSize: "12px",
                  cursor: !codeBac.trim() ? "not-allowed" : "pointer"
                }}
              >
                {loading ? <FaSpinner className="animate-spin" size={14} /> : "OK"}
              </button>
            </div>
            {bacErr && (
              <div style={{ marginTop: "4px", fontSize: "11px", color: "#dc2626" }}>
                ⚠️ {bacErr}
              </div>
            )}
          </div>

          <button
            onClick={() => setEtape("QUANTITE")}
            style={{
              width: "100%", padding: "8px", borderRadius: "8px",
              border: "1px solid #e2e8f0", background: "white",
              color: "#64748b", fontWeight: 600, fontSize: "12px", cursor: "pointer"
            }}
          >
            {t('common.back')}
          </button>
        </div>
      </div>
    );
  }

  return null;
}

// ─── DIALOGUE MANQUANT ─────────────────────────────────────────────────────
function DlgManquant({ linge, onOk, onClose, t }) {
  if (!linge) return null;
  const c = cat(linge.categorie);

  return (
    <div data-modal="true" style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 9999, backdropFilter: "blur(4px)"
    }}>
      <div style={{
        background: "white", borderRadius: "16px", padding: "20px",
        maxWidth: "300px", width: "95%", boxShadow: "0 20px 60px rgba(0,0,0,0.2)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
          <FaExclamationTriangle color="#d97706" size={18} />
          <span style={{ fontWeight: 700, fontSize: "14px", color: "#0f172a" }}>
            {t('collecte.missing_linen')}
          </span>
        </div>

        <div style={{
          padding: "8px 12px", background: c.bg, borderRadius: "8px",
          marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px"
        }}>
          <span style={{ fontSize: "18px" }}>{c.emoji}</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: "12px", color: c.color }}>{c.label}</div>
            <code style={{ fontSize: "10px", color: "#64748b" }}>{linge.codeBarre}</code>
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: "8px", borderRadius: "8px",
              border: "1px solid #e2e8f0", background: "white",
              color: "#64748b", fontWeight: 600, fontSize: "12px", cursor: "pointer"
            }}
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={() => onOk(linge)}
            style={{
              flex: 2, padding: "8px", borderRadius: "8px", border: "none",
              background: "#d97706", color: "white", fontWeight: 700, fontSize: "12px", cursor: "pointer"
            }}
          >
            {t('collecte.confirm_missing')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── PAGE PRINCIPALE ──────────────────────────────────────────────────────
function CollageListServiceInner() {
  const { t } = useTranslation();
  const { showAlert, showConfirm } = useModal();

  // ─── États ─────────────────────────────────────────────────────────────
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

  // ─── Effets ────────────────────────────────────────────────────────────
  useEffect(() => {
    const agentData = getAgent();
    if (agentData && isAgentConnected()) {
      setAgent(agentData);
      setScanStatus({
        loading: false,
        success: {
          message: `👤 ${agentData.nomPrenom || agentData.nom}`,
          detail: `${t('collecte.connected')} · ${agentData.codeBarre || agentData.matricule}`,
        },
        error: null,
      });
      setTimeout(() => setScanStatus(null), 1500);
    }
  }, [t]);

  // ─── Calculs ───────────────────────────────────────────────────────────
  const nbBlancs = collecte?.linges?.filter(l => l.statut === "BLANC").length || 0;
  const nbPropres = collecte?.linges?.filter(l => l.statut === "PROPRE").length || 0;
  const nbManq = collecte?.linges?.filter(l => l.statut === "MANQUANT").length || 0;
  const nbNonTr = collecte?.linges?.filter(l => !l.statut).length || 0;
  const nbInfectes = sacsDeclares.reduce((s, sac) => s + (sac.quantite || 0), 0);
  const totalAttendu = collecte?.nbAttendus || 0;
  const totalTraite = nbBlancs + nbPropres + nbManq + nbInfectes;
  const progression = totalAttendu > 0 ? Math.min(Math.round((totalTraite / totalAttendu) * 100), 100) : 0;

  // ─── Filtrage ──────────────────────────────────────────────────────────
  const filteredLinges = useMemo(() => {
    if (!collecte?.linges) return [];
    if (filter === "all") return collecte.linges;
    if (filter === "untreated") return collecte.linges.filter(l => !l.statut);
    return collecte.linges.filter(l => l.statut === filter.toUpperCase());
  }, [collecte, filter]);

  // ─── Fonctions métier ──────────────────────────────────────────────────
  const majLinge = useCallback((lingeId, statut) => {
    setCollecte(p =>
      p
        ? {
            ...p,
            linges: p.linges.map(l =>
              l.lingeId === lingeId ? { ...l, statut } : l
            ),
          }
        : p
    );
  }, []);

  const handleService = useCallback(
    async code => {
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
          linges: (res.linges || []).map(l => ({ ...l, statut: "" })),
        });

        setSacsDeclares([]);
        setBacBlanc(null);

        setScanStatus({
          loading: false,
          success: {
            message: `✅ ${svc.code}`,
            detail: `${res.nbAttendus} ${t('collecte.linens')}`,
          },
          error: null,
        });
        setTimeout(() => setScanStatus(null), 1500);

        showAlert(
          "✅ " + svc.code,
          res.nbAttendus + " " + t('collecte.linens'),
          "success"
        );
      } catch (e) {
        setScanStatus({ loading: false, success: null, error: e.message });
        showAlert("❌ " + e.message, "", "error");
      } finally {
        setLoading(false);
      }
    },
    [agent, showAlert, t]
  );

  const handleBac = useCallback(
    async code => {
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
            message: `✅ ${t('collecte.white_bac')}`,
            detail: res.codeBac,
          },
          error: null,
        });
        setTimeout(() => setScanStatus(null), 1500);

        showAlert(`✅ ${t('collecte.white_bac')}`, res.codeBac, "success");
      } catch (e) {
        setScanStatus({ loading: false, success: null, error: e.message });
        showAlert("❌ " + e.message, "", "error");
      } finally {
        setLoading(false);
      }
    },
    [collecte, showAlert, t]
  );

  const handleScanBlanc = useCallback(
    async code => {
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
        majLinge(res.lingeId, "BLANC");

        setScanStatus({
          loading: false,
          success: {
            message: "✓ " + t('collecte.linen_scanned'),
            detail: t('collecte.added_to_white_bac'),
          },
          error: null,
        });
        setTimeout(() => setScanStatus(null), 1000);
      } catch (e) {
        setScanStatus({ loading: false, success: null, error: e.message });
        showAlert("❌ " + e.message, code, "error");
      } finally {
        setLoading(false);
      }
    },
    [bacBlanc, collecte, showAlert, majLinge, t]
  );

  const handlePropre = useCallback(
    async linge => {
      setLoading(true);
      try {
        await apiCall(
          `/api/collecte/service/${collecte.id}/propre`,
          { codeOuTag: linge.codeBarre }
        );
        majLinge(linge.lingeId, "PROPRE");
        showAlert(
          "🔵 " + t('collecte.propre'),
          linge.codeBarre,
          "info"
        );
      } catch (e) {
        showAlert("❌ " + e.message, "", "error");
      } finally {
        setLoading(false);
      }
    },
    [collecte, showAlert, majLinge, t]
  );

  const handleManquant = useCallback(
    async linge => {
      setDlgManq(null);
      setLoading(true);
      try {
        await apiCall(
          `/api/collecte/service/${collecte.id}/manquant`,
          { lingeId: linge.lingeId }
        );
        majLinge(linge.lingeId, "MANQUANT");
        showAlert("⚠️ " + t('collecte.missing'), linge.codeBarre, "warning");
      } catch (e) {
        showAlert("❌ " + e.message, "", "error");
      } finally {
        setLoading(false);
      }
    },
    [collecte, showAlert, majLinge, t]
  );

  const handleSacInfecte = useCallback(
    async ({ bacId, items }) => {
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
          "🔴 " + t('collecte.sac_declared'),
          `${c?.quantiteDeclaree} ${c?.categorie?.toLowerCase() || t('collecte.linen')}${
            c?.quantiteDeclaree > 1 ? "s" : ""
          }`,
          "warning"
        );
      } catch (e) {
        showAlert("❌ " + e.message, "", "error");
      } finally {
        setLoading(false);
      }
    },
    [agent, collecte, showAlert, t]
  );

  const handleCloturer = useCallback(async () => {
    const nbBlancs = collecte?.linges?.filter(l => l.statut === "BLANC").length || 0;
    const nbSacs = sacsDeclares.length;

    if (nbBlancs === 0 && nbSacs === 0) {
      showAlert(
        "⚠️ " + t('collecte.errors.nothing_to_close'),
        t('collecte.errors.scan_at_least_one'),
        "warning"
      );
      return;
    }

    if (
      !(await showConfirm(
        t('collecte.close_collection'),
        `${nbBlancs} ${t('collecte.white_linens')}${
          nbBlancs > 1 ? "s" : ""
        } + ${nbSacs} ${t('collecte.infected_sacs')}${
          nbSacs > 1 ? "s" : ""
        }`,
        "question"
      ))
    )
      return;

    setLoading(true);
    try {
      const res = await apiCall(`/api/collecte/service/${collecte.id}/cloturer`);
      setResume({ ...res, serviceNom: collecte.serviceNom });
    } catch (e) {
      showAlert("❌ " + e.message, "", "error");
    } finally {
      setLoading(false);
    }
  }, [collecte, sacsDeclares, showAlert, showConfirm, t]);

  const handleScan = useCallback(
    async code => {
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
    },
    [collecte, bacBlanc, handleService, handleBac, handleScanBlanc]
  );

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
    if (!agent) return "👤 " + t('collecte.agent_not_connected');
    if (!collecte) return "🏢 " + t('collecte.scan_service_code');
    if (!bacBlanc) return "📦 " + t('collecte.scan_white_bac');
    if (resume) return "🔒 " + t('collecte.collection_closed');
    return "🏷️ " + t('collecte.scan_white_linens');
  };

  const getBorderColor = () => {
    if (!agent) return "#dc2626";
    if (resume) return "#e2e8f0";
    return "#14b8a6";
  };

  const isCloturee = !!resume;
  const isDisabled = isCloturee || loading || !agent;

  // ─── RENDU ──────────────────────────────────────────────────────────────
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

      {/* ─── EN-TÊTE ─────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: "24px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            marginBottom: "6px",
          }}
        >
          <motion.div
            whileHover={{ rotate: -5, scale: 1.05 }}
            transition={{ duration: 0.3 }}
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #14b8a6, #0d9488)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              boxShadow: "0 4px 16px rgba(20, 184, 166, 0.3)",
            }}
          >
            <FaBuilding size={22} />
          </motion.div>
          <div>
            <h1
              style={{
                fontSize: "22px",
                fontWeight: 700,
                color: "#0f172a",
                margin: 0,
                letterSpacing: "-0.3px",
              }}
            >
              {t('collecte.service_collection')}
            </h1>
            <p
              style={{
                fontSize: "13px",
                color: "#64748b",
                margin: "2px 0 0 0",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              {agent ? (
                <>
                  <span
                    style={{
                      display: "inline-block",
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: "#10b981",
                    }}
                  />
                  {t('collecte.agent')}: {agent.nomPrenom || agent.nom}
                </>
              ) : (
                t('collecte.no_agent_connected')
              )}
            </p>
          </div>
        </div>
      </div>

      <div
        style={{
          background: "white",
          borderRadius: "16px",
          padding: "20px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        {/* ─── BARRE D'INFO ────────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
            flexWrap: "wrap",
            gap: "8px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            {agent && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "4px 12px",
                  background: "#f0fdf4",
                  borderRadius: "8px",
                  border: "1px solid #bbf7d0",
                }}
              >
                <FaUser size={12} color="#15803d" />
                <span style={{ fontSize: "12px", fontWeight: 600, color: "#15803d" }}>
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
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "4px 12px",
                  background: "#f0f9ff",
                  borderRadius: "8px",
                  border: "1px solid #bae6fd",
                }}
              >
                <FaBuilding size={12} color="#0284c7" />
                <span style={{ fontSize: "12px", fontWeight: 600, color: "#0284c7" }}>
                  {collecte.serviceNom}
                </span>
                <Badge
                  style={{
                    background: "#dbeafe",
                    color: "#0284c7",
                    fontSize: "9px",
                    padding: "1px 8px",
                  }}
                >
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
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "4px 12px",
                  background: "#faf5ff",
                  borderRadius: "8px",
                  border: "1px solid #c4b5fd",
                }}
              >
                <FaBoxes size={12} color="#7c3aed" />
                <span style={{ fontSize: "12px", fontWeight: 600, color: "#7c3aed" }}>
                  {bacBlanc.codeBac}
                </span>
                <Badge
                  style={{
                    background: "#ede9fe",
                    color: "#7c3aed",
                    fontSize: "9px",
                    padding: "1px 8px",
                  }}
                >
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
              fontSize: "11px",
              gap: "4px",
              borderColor: "#fca5a5",
              color: "#dc2626",
              borderRadius: "8px",
              padding: "4px 12px",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "#fef2f2";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <FaRedo size={10} />
            {t('common.reset')}
          </Button>
        </div>

        {/* ─── ZONE DE SCAN ────────────────────────────────────────────── */}
        <Card
          style={{
            marginBottom: "16px",
            border: `2px dashed ${getBorderColor()}`,
            borderRadius: "12px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {!isCloturee && bacBlanc && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "3px",
                background: "linear-gradient(90deg, #14b8a6, #0d9488, #14b8a6)",
                backgroundSize: "200% 100%",
                animation: "shimmer 2s infinite",
              }}
            />
          )}
          <CardContent className="p-4">
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

        {/* ─── MESSAGES D'ÉTAT ──────────────────────────────────────────── */}
        {!agent && (
          <div
            style={{
              padding: "8px 14px",
              background: "linear-gradient(135deg, #fef2f2, #fee2e2)",
              borderRadius: "8px",
              border: "1px solid #fca5a5",
              marginBottom: "12px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <FaExclamationTriangle color="#dc2626" size={14} />
            <span style={{ fontSize: "12px", color: "#dc2626", fontWeight: 500 }}>
              {t('collecte.no_agent_connected')}
            </span>
            <span style={{ fontSize: "12px", color: "#64748b" }}>
              {t('collecte.connect_to_collect')}
            </span>
          </div>
        )}

        {agent && !collecte && (
          <div
            style={{
              padding: "8px 14px",
              background: "linear-gradient(135deg, #eff6ff, #dbeafe)",
              borderRadius: "8px",
              border: "1px solid #93c5fd",
              marginBottom: "12px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <FaBuilding color="#3b82f6" size={14} />
            <span style={{ fontSize: "12px", color: "#1d4ed8", fontWeight: 500 }}>
              {t('collecte.scan_service_code')}
            </span>
            <span style={{ fontSize: "12px", color: "#64748b" }}>
              {t('collecte.to_start_collection')}
            </span>
          </div>
        )}

        {agent && collecte && !bacBlanc && !resume && (
          <div
            style={{
              padding: "8px 14px",
              background: "linear-gradient(135deg, #faf5ff, #ede9fe)",
              borderRadius: "8px",
              border: "1px solid #c4b5fd",
              marginBottom: "12px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <FaBoxes color="#7c3aed" size={14} />
            <span style={{ fontSize: "12px", color: "#7c3aed", fontWeight: 500 }}>
              {t('collecte.scan_white_bac')}
            </span>
            <span style={{ fontSize: "12px", color: "#64748b" }}>
              {t('collecte.to_associate_linens')}
            </span>
          </div>
        )}

        {agent && collecte && bacBlanc && !resume && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              padding: "8px 14px",
              background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
              borderRadius: "8px",
              border: "1px solid #bbf7d0",
              marginBottom: "12px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            <FaCheckCircle color="#22c55e" size={14} />
            <span style={{ fontSize: "12px", color: "#15803d", fontWeight: 500 }}>
              {t('collecte.ready_to_collect')}
            </span>
            <span style={{ fontSize: "12px", color: "#64748b" }}>
              {t('collecte.scan_linens_to_collect')}
            </span>
            <Badge
              style={{
                background: "#dcfce7",
                color: "#15803d",
                fontSize: "9px",
                padding: "2px 10px",
                borderRadius: "10px",
                marginLeft: "auto",
              }}
            >
              📦 {bacBlanc.codeBac}
            </Badge>
          </motion.div>
        )}

        {/* ─── PROGRESSION ────────────────────────────────────────────── */}
        {collecte && !resume && (
          <div
            style={{
              padding: "12px 16px",
              background: "linear-gradient(135deg, #f8fafc, #f1f5f9)",
              borderRadius: "10px",
              marginBottom: "14px",
              border: "1px solid #e2e8f0",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "4px",
                marginBottom: "4px",
              }}
            >
              <span style={{ fontSize: "12px", color: "#475569", display: "flex", alignItems: "center", gap: "6px" }}>
                <FaHandHoldingHeart size={13} color="#14b8a6" />
                <strong>{totalTraite}</strong> / {totalAttendu}{" "}
                {t('collecte.pieces_processed')}
              </span>
              <span
                style={{
                  fontSize: "18px",
                  fontWeight: 700,
                  color: progression === 100 ? "#10b981" : "#14b8a6",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                {progression}%
                {progression === 100 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500 }}
                  >
                    🎉
                  </motion.span>
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

        {/* ─── STATISTIQUES ────────────────────────────────────────────── */}
        {collecte && !resume && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
              gap: "8px",
              marginBottom: "14px",
            }}
          >
            <StatutCard
              label={t('collecte.white')}
              value={nbBlancs}
              icon="✅"
              color="#15803d"
              bg="#f0fdf4"
              subValue={`${collecte.nbAttendus} ${t('collecte.expected')}`}
              onClick={() => setFilter("blanc")}
              active={filter === "blanc"}
            />
            <StatutCard
              label={t('collecte.infected')}
              value={nbInfectes}
              icon="🔴"
              color="#dc2626"
              bg="#fef2f2"
              subValue={`${sacsDeclares.length} ${t('collecte.sacs')}`}
            />
            <StatutCard
              label={t('collecte.propre')}
              value={nbPropres}
              icon="🔵"
              color="#0284c7"
              bg="#f0f9ff"
              subValue={t('collecte.kept_in_place')}
              onClick={() => setFilter("propre")}
              active={filter === "propre"}
            />
            <StatutCard
              label={t('collecte.missing')}
              value={nbManq}
              icon="⚠️"
              color="#d97706"
              bg="#fffbeb"
              subValue={t('collecte.to_report')}
              onClick={() => setFilter("manquant")}
              active={filter === "manquant"}
            />
            <StatutCard
              label={t('collecte.remaining')}
              value={nbNonTr}
              icon="⏳"
              color={nbNonTr > 0 ? "#f59e0b" : "#10b981"}
              bg={nbNonTr > 0 ? "#fffbeb" : "#f0fdf4"}
              subValue={
                nbNonTr > 0
                  ? `${Math.round((nbNonTr / totalAttendu) * 100)}%`
                  : `✓ ${t('collecte.all_done')}`
              }
              onClick={() => setFilter("untreated")}
              active={filter === "untreated"}
            />
          </div>
        )}

        {/* ─── SACS INFECTÉS ───────────────────────────────────────────── */}
        {sacsDeclares.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            style={{
              padding: "10px 14px",
              background: "linear-gradient(135deg, #fef2f2, #fff5f5)",
              borderRadius: "10px",
              border: "1px solid #fca5a5",
              marginBottom: "14px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "6px",
              }}
            >
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
              >
                <FaBiohazard color="#dc2626" size={14} />
              </motion.div>
              <span
                style={{
                  fontSize: "12px",
                  color: "#dc2626",
                  fontWeight: 600,
                }}
              >
                🔴 {t('collecte.infected_sacs_declared')}
              </span>
              <Badge
                style={{
                  background: "#fee2e2",
                  color: "#dc2626",
                  fontSize: "9px",
                  padding: "2px 10px",
                  marginLeft: "auto",
                  borderRadius: "10px",
                }}
              >
                {sacsDeclares.length} {t('collecte.sacs')} · {nbInfectes}{" "}
                {t('collecte.pieces')}
              </Badge>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {sacsDeclares.map((s, i) => {
                const c = cat(s.categorie);
                return (
                  <motion.div
                    key={i}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "3px 10px",
                      background: "white",
                      borderRadius: "6px",
                      border: "1px solid #fca5a5",
                      fontSize: "11px",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                    }}
                  >
                    <span>{c.emoji}</span>
                    <span style={{ fontWeight: 600, color: "#dc2626" }}>
                      {s.quantite}
                    </span>
                    <span style={{ color: "#94a3b8", fontSize: "9px", fontFamily: "monospace" }}>
                      {s.numeroSac}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ─── FILTRES ET LISTE ────────────────────────────────────────── */}
        {collecte && !resume && (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "6px",
                marginBottom: "10px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  flexWrap: "wrap",
                }}
              >
                <FaFilter size={11} color="#94a3b8" />
                <span
                  style={{
                    fontSize: "10px",
                    color: "#94a3b8",
                  }}
                >
                  {t('collecte.filter')}:
                </span>
                {["all", "untreated", "blanc", "propre", "manquant"].map(f => (
                  <motion.button
                    key={f}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setFilter(f)}
                    style={{
                      padding: "2px 10px",
                      borderRadius: "10px",
                      border:
                        filter === f ? "1.5px solid #14b8a6" : "1px solid #e2e8f0",
                      background: filter === f ? "#ccfbf1" : "transparent",
                      color: filter === f ? "#0d9488" : "#64748b",
                      fontSize: "10px",
                      fontWeight: filter === f ? 600 : 400,
                      cursor: "pointer",
                      transition: "all 0.2s",
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
              <span style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 500 }}>
                {filteredLinges.length}
              </span>
            </div>

            {/* ─── LISTE DES LINGES ────────────────────────────────────── */}
            <div
              style={{
                maxHeight: "220px",
                overflowY: "auto",
                marginBottom: "14px",
                paddingRight: "2px",
              }}
            >
              <AnimatePresence>
                {filteredLinges.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "16px",
                      color: "#94a3b8",
                      fontSize: "12px",
                    }}
                  >
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

            {/* ─── BOUTONS D'ACTION CRÉATIFS ────────────────────────────── */}
            <div
              style={{
                display: "flex",
                gap: "12px",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "flex-start",
                paddingTop: "10px",
                borderTop: "1px solid #f1f5f9",
              }}
            >
              <ActionButton
                onClick={() => setDlgSac(true)}
                icon={<FaBiohazard size={14} />}
                label={t('collecte.declare_infected')}
                type="danger"
              />

              {nbNonTr > 0 && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "4px 10px",
                    background: "#fffbeb",
                    borderRadius: "8px",
                    border: "1px solid #fcd34d",
                  }}
                >
                  <FaExclamationTriangle size={11} color="#d97706" />
                  <span style={{ fontSize: "11px", fontWeight: 600, color: "#d97706" }}>
                    {nbNonTr} {t('collecte.remaining').toLowerCase()}
                  </span>
                </motion.div>
              )}

              {nbNonTr === 0 && collecte && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "4px 10px",
                    background: "#f0fdf4",
                    borderRadius: "8px",
                    border: "1px solid #86efac",
                  }}
                >
                  <FaCheckCircle size={11} color="#10b981" />
                  <span style={{ fontSize: "11px", fontWeight: 600, color: "#15803d" }}>
                    {t('collecte.all_done')} ✨
                  </span>
                </motion.div>
              )}

              <ActionButton
                onClick={handleCloturer}
                disabled={loading}
                loading={loading}
                icon={nbNonTr === 0 ? <FaClipboardCheck size={14} /> : <FaArrowRight size={14} />}
                label={nbNonTr === 0 ? t('collecte.finish_and_close') : t('collecte.close_with_remaining', { count: nbNonTr })}
                type={nbNonTr === 0 ? "success" : "warning"}
                badge={nbNonTr > 0 ? `${nbNonTr}` : null}
              />
            </div>
          </>
        )}

        {/* ─── RÉSUMÉ ────────────────────────────────────────────────────── */}
        {resume && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            style={{
              background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
              borderRadius: "14px",
              padding: "20px",
              border: "2px solid #86efac",
              textAlign: "center",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                width: "100px",
                height: "100px",
                background: "radial-gradient(circle, rgba(16,185,129,0.1), transparent)",
                borderRadius: "50%",
                transform: "translate(50px, -50px)",
              }}
            />
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, delay: 0.2 }}
              style={{ fontSize: "40px", marginBottom: "4px" }}
            >
              🎉
            </motion.div>
            <h2
              style={{
                fontSize: "20px",
                fontWeight: 700,
                color: "#15803d",
                margin: 0,
                marginBottom: "4px",
              }}
            >
              {t('collecte.collection_completed')}
            </h2>
            <p style={{ fontSize: "13px", color: "#059669", marginBottom: "14px" }}>
              {resume.serviceNom || collecte?.serviceNom}
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(80px, 1fr))",
                gap: "8px",
                marginBottom: "14px",
                background: "white",
                borderRadius: "10px",
                padding: "12px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}
            >
              {[
                ["🟢", t('collecte.white'), resume.nbBlancs, "#15803d", "#f0fdf4"],
                ["🔴", t('collecte.infected'), resume.nbInfectes, "#dc2626", "#fef2f2"],
                ["🔵", t('collecte.propre'), resume.nbPropres, "#0284c7", "#f0f9ff"],
                ["🟠", t('collecte.missing'), resume.nbManquants, "#d97706", "#fffbeb"],
              ].map(([icon, label, value, color, bg]) => (
                <motion.div
                  key={label}
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 + Math.random() * 0.2 }}
                  style={{
                    background: bg,
                    borderRadius: "8px",
                    padding: "8px 4px",
                    border: `1px solid ${color}20`,
                  }}
                >
                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: 700,
                      color,
                    }}
                  >
                    {value || 0}
                  </div>
                  <div style={{ fontSize: "9px", color: "#64748b", fontWeight: 500 }}>
                    {icon} {label}
                  </div>
                </motion.div>
              ))}
            </div>

            {sacsDeclares.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                style={{
                  padding: "8px 14px",
                  background: "#fef2f2",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "#dc2626",
                  fontWeight: 600,
                  marginBottom: "14px",
                  border: "1px solid #fca5a5",
                }}
              >
                <FaBiohazard style={{ display: "inline", marginRight: "6px" }} size={13} />
                {sacsDeclares.length} {t('collecte.infected_sacs')} (
                {nbInfectes} {t('collecte.pieces')}) → {t('collecte.waiting_for_reception')}
              </motion.div>
            )}

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
              <ActionButton
                onClick={() => {
                  setCollecte(null);
                  setBacBlanc(null);
                  setSacsDeclares([]);
                  setResume(null);
                  setFilter("all");
                }}
                icon={<FaBoxOpen size={14} />}
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
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
          display: inline-block;
        }
      `}</style>
    </div>
  );
}

export default function CollageListService() {
  return <CollageListServiceInner />;
}