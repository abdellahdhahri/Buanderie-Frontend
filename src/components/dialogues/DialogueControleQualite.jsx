import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaTimes, FaCheckCircle, FaExclamationTriangle,
  FaCut, FaCircle, FaPaintBrush, FaRuler,
  FaTrash, FaBox, FaDoorOpen, FaWeightHanging,
  FaTag, FaBarcode, FaBed,FaSoap 
} from "react-icons/fa";



/** Cercle de progression circulaire pour le compte à rebours */
function ProgressRing({ progress, size = 44, stroke = 3, color = "#0ea5e9" }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - progress * circumference;

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#e2e8f0"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.1s linear" }}
      />
    </svg>
  );
}

/** Checkmark SVG animé */
function CheckmarkSVG({ size = 24, color = "#22c55e" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <motion.path
        d="M5 13l4 4L19 7"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
    </svg>
  );
}

/** Icône défaut SVG animée (pulse) */
function DefectPulseSVG({ color = "#dc2626", size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <motion.circle
        cx="12"
        cy="12"
        r="9"
        stroke={color}
        strokeWidth="2"
        fill="none"
        animate={{ scale: [1, 1.2, 1], opacity: [1, 0.4, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        style={{ transformOrigin: "center" }}
      />
      <circle cx="12" cy="12" r="3" fill={color} />
    </svg>
  );
}

/** Fond décoratif avec particules */
function DecorativeBackground({ color = "#0ea5e9" }) {
  return (
    <svg
      style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }}
      viewBox="0 0 600 800"
      preserveAspectRatio="none"
    >
      <defs>
        <radialGradient id="glow1" cx="50%" cy="0%" r="60%">
          <stop offset="0%" stopColor={color} stopOpacity="0.08" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="glow2" cx="100%" cy="100%" r="50%">
          <stop offset="0%" stopColor={color} stopOpacity="0.06" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="600" height="800" fill="url(#glow1)" />
      <rect width="600" height="800" fill="url(#glow2)" />
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 📋 Types de réclamation
// ═══════════════════════════════════════════════════════════════════════════
const TYPES_RECLAMATION = [
  { id: "DECHIRE",           label: "Déchiré",            color: "#dc2626", bg: "#fef2f2", icon: FaCut },
  { id: "TROU",              label: "Trou",               color: "#ea580c", bg: "#fff7ed", icon: FaCircle },
  { id: "TACHE_PERSISTANTE", label: "Tâche persistante",  color: "#d97706", bg: "#fffbeb", icon: FaPaintBrush },
  { id: "COUTURE_ABIMEE",    label: "Couture abîmée",     color: "#7c3aed", bg: "#f5f3ff", icon: FaRuler },
  { id: "BOUTON_MANQUANT",   label: "Bouton manquant",    color: "#0891b2", bg: "#ecfeff", icon: FaTimes },
  { id: "A_REFORMER",        label: "À reformer",         color: "#475569", bg: "#f8fafc", icon: FaTrash },
  { id: "MAL_LAVE",          label: "Mal Lavé",           color: "#24426d", bg: "#f1f5f9", icon: FaSoap  },
];

// ═══════════════════════════════════════════════════════════════════════════
// 🎯 Composant principal
// ═══════════════════════════════════════════════════════════════════════════
export default function DialogueControleQualite({ item, agent, onClose, onConfirmer }) {
  const { t } = useTranslation();
  const [selectedType, setSelectedType] = useState(null);
  const [description, setDescription] = useState("");
  const [timeLeft, setTimeLeft] = useState(5); // secondes

  // ⏱️ Compte à rebours visuel
  useEffect(() => {
    if (selectedType) return; // stop si un défaut est sélectionné

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0.1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 0.1;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [selectedType]);

  // ✅ Auto-validation à 0
  useEffect(() => {
    if (timeLeft <= 0 && !selectedType) {
      onConfirmer(null, null);
    }
  }, [timeLeft, selectedType, onConfirmer]);

  if (!item) return null;

  const handleConfirmer = () => {
    if (selectedType) {
      onConfirmer(selectedType, description);
    } else {
      onConfirmer(null, null);
    }
  };

  // Traduction des types
  const translatedTypes = useMemo(() =>
    TYPES_RECLAMATION.map(type => ({
      ...type,
      label: t(`reclamation_types.${type.id}`, type.label)
    }))
  , [t]);

  const progress = 1 - (timeLeft / 5);
  const totalProgressColor = timeLeft > 3 ? "#22c55e" : timeLeft > 1.5 ? "#f59e0b" : "#dc2626";

  return (
    <AnimatePresence>
      <div style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.75)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "16px"
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 30 }}
          transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
          style={{
            position: "relative",
            background: "white",
            borderRadius: "24px",
            width: "100%",
            maxWidth: "620px",
            maxHeight: "92vh",
            overflow: "hidden",
            boxShadow: "0 32px 96px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.05)"
          }}
        >
          <DecorativeBackground color={selectedType?.color || "#0ea5e9"} />

          {/* ═══ En-tête ═══ */}
          <div style={{
            position: "relative",
            padding: "24px 28px 20px",
            borderBottom: "1px solid #f1f5f9",
            background: "linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" }}>
              {/* Icône + titre */}
              <div style={{ display: "flex", alignItems: "center", gap: "14px", flex: 1, minWidth: 0 }}>
                <motion.div
                  initial={{ rotate: -10, scale: 0.9 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                  style={{
                    width: "54px",
                    height: "54px",
                    borderRadius: "16px",
                    background: "linear-gradient(135deg, #0ea5e9, #0284c7)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    boxShadow: "0 8px 24px rgba(14,165,233,0.35)",
                    flexShrink: 0
                  }}
                >
                  {/* SVG check-list */}
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 11l3 3L22 4" />
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                  </svg>
                </motion.div>
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    fontWeight: 800,
                    fontSize: "19px",
                    color: "#0f172a",
                    letterSpacing: "-0.3px",
                    marginBottom: "2px"
                  }}>
                    {t('dialogue_controle.title')}
                  </div>
                  <div style={{
                    fontSize: "12px",
                    color: "#64748b",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    flexWrap: "wrap"
                  }}>
                    <span>🧑‍💼 {agent?.nom || t('dialogue_controle.agent')}</span>
                    <span style={{ width: "3px", height: "3px", borderRadius: "50%", background: "#cbd5e1" }} />
                    <code style={{ fontSize: "12px", fontWeight: 700, color: "#0ea5e9" }}>
                      {item.codeSuivi || item.codeBarre}
                    </code>
                  </div>
                </div>
              </div>

              {/* Compte à rebours + close */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                {!selectedType && (
                  <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <ProgressRing progress={progress} color={totalProgressColor} />
                    <span style={{
                      position: "absolute",
                      fontSize: "12px",
                      fontWeight: 800,
                      color: totalProgressColor
                    }}>
                      {Math.ceil(timeLeft)}
                    </span>
                  </div>
                )}
                <motion.button
                  whileHover={{ scale: 1.08, rotate: 90 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => onConfirmer(null, null)}
                  style={{
                    background: "#f1f5f9",
                    border: "none",
                    borderRadius: "12px",
                    width: "40px",
                    height: "40px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#64748b",
                    transition: "background 0.2s"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#e2e8f0"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "#f1f5f9"}
                >
                  <FaTimes size={16} />
                </motion.button>
              </div>
            </div>
          </div>

          {/* ═══ Corps scrollable ═══ */}
          <div style={{
            position: "relative",
            padding: "20px 28px 24px",
            maxHeight: "calc(92vh - 220px)",
            overflowY: "auto"
          }}>

            {/* ─── Grille d'infos (cards) ─── */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "10px",
              marginBottom: "20px"
            }}>
              <InfoCard
                icon={<FaBarcode size={14} />}
                label={t('dialogue_controle.code')}
                value={item.codeSuivi || item.codeBarre || "N/A"}
                accent="#0ea5e9"
              />
              <InfoCard
                icon={<FaTag size={14} />}
                label={t('dialogue_controle.category')}
                value={item.categorie || "NC"}
                accent="#7c3aed"
              />
              <InfoCard
                icon={<FaDoorOpen size={14} />}
                label={t('dialogue_controle.room')}
                value={item.chambre || "—"}
                accent="#f59e0b"
              />
              <InfoCard
                icon={<FaWeightHanging size={14} />}
                label={t('dialogue_controle.weight')}
                value={`${item.poids || 0} kg`}
                accent="#10b981"
              />
            </div>

            {/* ─── Bandeau de statut ─── */}
            <motion.div
              layout
              style={{
                padding: "14px 16px",
                borderRadius: "14px",
                background: selectedType
                  ? `linear-gradient(135deg, ${selectedType.bg}, #ffffff)`
                  : "linear-gradient(135deg, #f0fdf4, #ffffff)",
                border: `1px solid ${selectedType ? selectedType.color + "40" : "#bbf7d0"}`,
                marginBottom: "20px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                boxShadow: selectedType
                  ? `0 4px 16px ${selectedType.color}20`
                  : "0 4px 16px rgba(34,197,94,0.10)"
              }}
            >
              <div style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: selectedType ? selectedType.color : "#22c55e",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                flexShrink: 0
              }}>
                {selectedType ? <DefectPulseSVG color="white" size={20} /> : <CheckmarkSVG size={20} color="white" />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: selectedType ? selectedType.color : "#15803d",
                  marginBottom: "2px"
                }}>
                  {selectedType
                    ? t('dialogue_controle.reclamation_selected', { label: selectedType.label })
                    : t('dialogue_controle.no_defect')}
                </div>
                <div style={{ fontSize: "11px", color: "#64748b" }}>
                  {selectedType
                    ? "Décrivez le défaut ci-dessous (optionnel)"
                    : "Cliquez sur un défaut ci-dessous si nécessaire"}
                </div>
              </div>
            </motion.div>

            {/* ─── Titre section défauts ─── */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "12px"
            }}>
              <FaExclamationTriangle size={13} color="#dc2626" />
              <span style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "#475569",
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}>
                {t('dialogue_controle.select_defect')}
              </span>
            </div>

            {/* ─── Grille des défauts ─── */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
              gap: "10px",
              marginBottom: "20px"
            }}>
              {translatedTypes.map((type, idx) => {
                const Icon = type.icon;
                const isSelected = selectedType?.id === type.id;
                return (
                  <motion.button
                    key={type.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    whileHover={{ y: -3, scale: 1.03 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => {
                      setSelectedType(isSelected ? null : type);
                      if (!isSelected) setDescription("");
                    }}
                    style={{
                      position: "relative",
                      padding: "14px 10px",
                      borderRadius: "14px",
                      border: `2px solid ${isSelected ? type.color : "#e2e8f0"}`,
                      background: isSelected
                        ? `linear-gradient(135deg, ${type.color}, ${type.color}dd)`
                        : "white",
                      color: isSelected ? "white" : "#334155",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "8px",
                      boxShadow: isSelected
                        ? `0 8px 24px ${type.color}40`
                        : "0 1px 3px rgba(0,0,0,0.04)",
                      overflow: "hidden"
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = type.color;
                        e.currentTarget.style.background = type.bg;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = "#e2e8f0";
                        e.currentTarget.style.background = "white";
                      }
                    }}
                  >
                    {/* Bande colorée si sélectionné */}
                    {isSelected && (
                      <motion.div
                        layoutId="selected-badge"
                        style={{
                          position: "absolute",
                          top: 0, left: 0, right: 0,
                          height: "3px",
                          background: "white",
                          opacity: 0.5
                        }}
                      />
                    )}

                    {/* Icône */}
                    <div style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "10px",
                      background: isSelected ? "rgba(255,255,255,0.2)" : type.bg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: isSelected ? "white" : type.color,
                      transition: "all 0.2s"
                    }}>
                      <Icon size={18} />
                    </div>

                    {/* Label */}
                    <span style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      textAlign: "center",
                      lineHeight: 1.25,
                      letterSpacing: "-0.1px"
                    }}>
                      {type.label}
                    </span>

                    {/* Badge check */}
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        style={{
                          position: "absolute",
                          top: "6px",
                          right: "6px",
                          width: "18px",
                          height: "18px",
                          borderRadius: "50%",
                          background: "white",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                        <CheckmarkSVG size={12} color={type.color} />
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* ─── Zone description ─── */}
            <AnimatePresence>
              {selectedType && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: "auto", marginBottom: 20 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.25 }}
                  style={{ overflow: "hidden" }}
                >
                  <label style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#475569",
                    marginBottom: "8px"
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round">
                      <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                    {t('dialogue_controle.description_label')}
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t('dialogue_controle.description_placeholder')}
                    style={{
                      width: "100%",
                      minHeight: "72px",
                      padding: "12px 14px",
                      borderRadius: "12px",
                      border: `1.5px solid ${selectedType.color}30`,
                      fontSize: "13px",
                      outline: "none",
                      resize: "vertical",
                      fontFamily: "inherit",
                      transition: "all 0.2s",
                      boxSizing: "border-box",
                      background: selectedType.bg
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = selectedType.color;
                      e.currentTarget.style.boxShadow = `0 0 0 4px ${selectedType.color}15`;
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = `${selectedType.color}30`;
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ═══ Actions (sticky bottom) ═══ */}
          <div style={{
            position: "relative",
            padding: "16px 28px 20px",
            borderTop: "1px solid #f1f5f9",
            background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
            display: "flex",
            gap: "10px"
          }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onConfirmer(null, null)}
              style={{
                flex: 1,
                padding: "13px 16px",
                borderRadius: "12px",
                border: "1.5px solid #22c55e",
                background: "white",
                color: "#15803d",
                fontWeight: 700,
                fontSize: "14px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "all 0.2s",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#f0fdf4";
                e.currentTarget.style.boxShadow = "0 4px 16px rgba(34,197,94,0.20)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "white";
                e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)";
              }}
            >
              <CheckmarkSVG size={18} color="#22c55e" />
              {t('dialogue_controle.conform')}
            </motion.button>

            <motion.button
              whileHover={selectedType ? { scale: 1.02 } : {}}
              whileTap={selectedType ? { scale: 0.97 } : {}}
              onClick={handleConfirmer}
              disabled={!selectedType}
              style={{
                flex: 1.5,
                padding: "13px 16px",
                borderRadius: "12px",
                border: "none",
                background: selectedType
                  ? `linear-gradient(135deg, ${selectedType.color}, ${selectedType.color}cc)`
                  : "linear-gradient(135deg, #cbd5e1, #94a3b8)",
                color: "white",
                fontWeight: 700,
                fontSize: "14px",
                cursor: selectedType ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "all 0.2s",
                boxShadow: selectedType ? `0 8px 24px ${selectedType.color}40` : "none",
                opacity: selectedType ? 1 : 0.7
              }}
            >
              <FaExclamationTriangle size={16} />
              {selectedType
                ? t('dialogue_controle.report_defect', { label: selectedType.label })
                : t('dialogue_controle.select_defect_first')}
            </motion.button>
          </div>

          {/* ═══ Footer note ═══ */}
          <div style={{
            position: "relative",
            padding: "0 28px 16px",
            fontSize: "11px",
            color: "#94a3b8",
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px"
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            {t('dialogue_controle.auto_validation')}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 📦 InfoCard
// ═══════════════════════════════════════════════════════════════════════════
function InfoCard({ icon, label, value, accent = "#0ea5e9" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        padding: "10px 12px",
        borderRadius: "12px",
        background: "white",
        border: "1px solid #f1f5f9",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        transition: "all 0.2s",
        cursor: "default"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = accent + "40";
        e.currentTarget.style.boxShadow = `0 4px 12px ${accent}15`;
        e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#f1f5f9";
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div style={{
        width: "32px",
        height: "32px",
        borderRadius: "9px",
        background: `${accent}15`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: accent,
        flexShrink: 0
      }}>
        {icon}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{
          fontSize: "9px",
          color: "#94a3b8",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          fontWeight: 700,
          marginBottom: "2px"
        }}>
          {label}
        </div>
        <div style={{
          fontWeight: 700,
          fontSize: "13px",
          color: "#0f172a",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap"
        }}>
          {value}
        </div>
      </div>
    </motion.div>
  );
}