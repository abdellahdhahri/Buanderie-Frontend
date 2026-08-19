import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaTimes, FaCheckCircle, FaExclamationTriangle,
  FaCut, FaCircle, FaPaintBrush, FaRuler,
  FaTrash, FaUser, FaBox, FaDoorOpen
} from "react-icons/fa";

const TYPES_RECLAMATION = [
  { id: "DECHIRE", label: "Déchiré", color: "#dc2626", bg: "#fee2e2", icon: FaCut },
  { id: "TROU", label: "Trou", color: "#ea580c", bg: "#ffedd5", icon: FaCircle },
  { id: "TACHE_PERSISTANTE", label: "Tâche persistante", color: "#d97706", bg: "#fef3c7", icon: FaPaintBrush },
  { id: "COUTURE_ABIMEE", label: "Couture abîmée", color: "#7c3aed", bg: "#ede9fe", icon: FaRuler },
  { id: "BOUTON_MANQUANT", label: "Bouton manquant", color: "#0891b2", bg: "#cffafe", icon: FaTimes },
  { id: "A_REFORMER", label: "À reformer", color: "#475569", bg: "#f1f5f9", icon: FaTrash },
  { id: "MAL_LAVE", label: "Mal Lavé", color: "#24426d", bg: "#f1f5f9", icon: FaTrash },
];

export default function DialogueControleQualite({ item, agent, onClose, onConfirmer }) {
  const [selectedType, setSelectedType] = useState(null);
  const [description, setDescription] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!selectedType) {
        onConfirmer(null, null);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [selectedType, onConfirmer]);

  if (!item) return null;

  const handleConfirmer = () => {
    if (selectedType) {
      // Créer une réclamation
      onConfirmer(selectedType, description);
    } else {
      // Conforme : pas de réclamation
      onConfirmer(null, null);
    }
  };

  return (
    <AnimatePresence>
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        backdropFilter: "blur(5px)"
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: 20 }}
          transition={{ duration: 0.25 }}
          style={{
            background: "white",
            borderRadius: "24px",
            padding: "32px",
            maxWidth: "580px",
            width: "95%",
            maxHeight: "90vh",
            overflowY: "auto",
            boxShadow: "0 28px 80px rgba(0,0,0,0.25)"
          }}
        >
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "20px"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                background: "#dbeafe",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px"
              }}>
                📋
              </div>
              <div>
                <div style={{
                  fontWeight: 800,
                  fontSize: "18px",
                  color: "#0f172a"
                }}>
                  Contrôle Qualité
                </div>
                <div style={{
                  fontSize: "13px",
                  color: "#64748b",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  flexWrap: "wrap"
                }}>
                  <span>🧑‍💼 {agent?.nom || "Agent"}</span>
                  <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#94a3b8" }} />
                  <code style={{ fontSize: "12px", fontWeight: 600, color: "#0ea5e9" }}>
                    {item.codeSuivi || item.codeBarre}
                  </code>
                  <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#94a3b8" }} />
                  <span style={{ fontSize: "12px", color: "#475569" }}>
                    {item.categorie}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                onConfirmer(null, null);
              }}
              style={{
                background: "#f1f5f9",
                border: "none",
                borderRadius: "50%",
                width: "34px",
                height: "34px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#64748b",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#e2e8f0"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#f1f5f9"; }}
            >
              <FaTimes size={16} />
            </button>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "6px 16px",
            padding: "12px 0",
            borderTop: "1px solid #f1f5f9",
            borderBottom: "1px solid #f1f5f9",
            marginBottom: "16px"
          }}>
            <div>
              <div style={{ fontSize: "10px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Code
              </div>
              <code style={{ fontWeight: 600, fontSize: "13px", color: "#0ea5e9" }}>
                {item.codeSuivi || item.codeBarre || "N/A"}
              </code>
            </div>
            <div>
              <div style={{ fontSize: "10px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Catégorie
              </div>
              <span style={{ fontWeight: 600, fontSize: "13px", color: "#0f172a" }}>
                {item.categorie || "NC"}
              </span>
            </div>
            <div>
              <div style={{ fontSize: "10px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Chambre
              </div>
              <span style={{ fontWeight: 600, fontSize: "13px", color: "#0f172a" }}>
                {item.chambre || "—"}
              </span>
            </div>
            <div>
              <div style={{ fontSize: "10px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Poids
              </div>
              <span style={{ fontWeight: 600, fontSize: "13px", color: "#0f172a" }}>
                {item.poids || 0} kg
              </span>
            </div>
          </div>

          <div style={{
            padding: "10px 14px",
            background: "#f0fdf4",
            borderRadius: "10px",
            border: "1px solid #bbf7d0",
            marginBottom: "16px",
            fontSize: "13px",
            color: "#15803d",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            <FaCheckCircle size={16} color="#22c55e" />
            <span>
              {selectedType
                ? `⚠️ Réclamation sélectionnée : ${selectedType.label}`
                : "✅ Aucun défaut détecté — Validation automatique dans 5s"}
            </span>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <div style={{
              fontSize: "12px",
              color: "#64748b",
              fontWeight: 600,
              marginBottom: "10px",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}>
              <FaExclamationTriangle size={12} color="#dc2626" />
              Sélectionner un défaut (optionnel)
            </div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "8px"
            }}>
              {TYPES_RECLAMATION.map((type) => {
                const Icon = type.icon;
                const isSelected = selectedType?.id === type.id;
                return (
                  <button
                    key={type.id}
                    onClick={() => {
                      setSelectedType(isSelected ? null : type);
                      if (!isSelected) setDescription("");
                    }}
                    style={{
                      padding: "12px 8px",
                      borderRadius: "12px",
                      border: `2px solid ${isSelected ? type.color : type.bg}`,
                      background: isSelected ? type.color : type.bg,
                      color: isSelected ? "white" : type.color,
                      cursor: "pointer",
                      transition: "all 0.2s",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "4px",
                      boxShadow: isSelected ? `0 4px 16px ${type.color}44` : "none",
                      transform: isSelected ? "scale(1.04)" : "scale(1)"
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = type.color;
                        e.currentTarget.style.transform = "scale(1.04)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = type.bg;
                        e.currentTarget.style.transform = "scale(1)";
                      }
                    }}
                  >
                    <Icon size={20} />
                    <span style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      textAlign: "center",
                      lineHeight: 1.2
                    }}>
                      {type.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedType && (
            <div style={{ marginBottom: "16px" }}>
              <label style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 600,
                color: "#64748b",
                marginBottom: "6px"
              }}>
                Description du défaut (optionnel)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Décrivez le problème en détail..."
                style={{
                  width: "100%",
                  minHeight: "60px",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: "1px solid #e2e8f0",
                  fontSize: "13px",
                  outline: "none",
                  resize: "vertical",
                  fontFamily: "inherit",
                  transition: "border-color 0.2s",
                  boxSizing: "border-box"
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#0ea5e9"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; }}
              />
            </div>
          )}

          <div style={{
            display: "flex",
            gap: "10px",
            marginTop: "4px"
          }}>
            <button
              onClick={() => onConfirmer(null, null)}
              style={{
                flex: 1,
                padding: "12px",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                background: "white",
                color: "#22c55e",
                fontWeight: 700,
                fontSize: "14px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#f0fdf4"; e.currentTarget.style.borderColor = "#22c55e"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "white"; e.currentTarget.style.borderColor = "#e2e8f0"; }}
            >
              <FaCheckCircle size={16} /> Conforme
            </button>
            <button
              onClick={handleConfirmer}
              disabled={!selectedType}
              style={{
                flex: 2,
                padding: "12px",
                borderRadius: "12px",
                border: "none",
                background: selectedType ? "linear-gradient(135deg, #ef4444, #dc2626)" : "#e2e8f0",
                color: selectedType ? "white" : "#94a3b8",
                fontWeight: 700,
                fontSize: "14px",
                cursor: selectedType ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "all 0.2s",
                boxShadow: selectedType ? "0 4px 16px rgba(239,68,68,0.3)" : "none"
              }}
            >
              <FaExclamationTriangle size={16} />
              {selectedType ? `Signaler ${selectedType.label}` : "Sélectionnez un défaut"}
            </button>
          </div>

          <div style={{
            marginTop: "12px",
            fontSize: "11px",
            color: "#94a3b8",
            textAlign: "center"
          }}>
            ⏱️ Validation automatique dans {selectedType ? "5s" : "5s"} sans sélection
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}