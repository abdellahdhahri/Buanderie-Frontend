import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { 
  FaTruck, FaUsers, FaBuilding, FaArrowRight,
  FaBoxes, FaChevronRight
} from "react-icons/fa";
import { motion } from "framer-motion";
import "../../Linge/WorkflowList.css";

function CollecteListInner() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(null);

  const TYPES_COLLECTE = [
    {
      id: "service",
      label: t('collecte_list.types.service.label'),
      description: t('collecte_list.types.service.description'),
      icon: FaBuilding,
      route: "/service",
      color: "#3b82f6",
      bg: "#eff6ff",
      border: "#93c5fd",
      gradient: "linear-gradient(135deg, #3b82f6, #2563eb)"
    },
    {
      id: "uniforme",
      label: t('collecte_list.types.uniforme.label'),
      description: t('collecte_list.types.uniforme.description'),
      icon: FaUsers,
      route: "/uniforme",
      color: "#8b5cf6",
      bg: "#f5f3ff",
      border: "#c4b5fd",
      gradient: "linear-gradient(135deg, #8b5cf6, #7c3aed)"
    },
    {
      id: "linge",
      label: t('collecte_list.types.linge.label'),
      description: t('collecte_list.types.linge.description'),
      icon: FaBoxes,
      route: "/Collages",
      color: "#10b981",
      bg: "#ecfdf5",
      border: "#6ee7b7",
      gradient: "linear-gradient(135deg, #10b981, #059669)"
    }
  ];

  const handleNavigate = (route) => {
    navigate(route);
  };

  return (
    <div className="collecte-container" style={{ 
      minHeight: "calc(100vh - 100px)",
      display: "flex",
      flexDirection: "column"
    }}>
      
      {/* ─── Header ──────────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: "32px" }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          marginBottom: "8px"
        }}>
          <div style={{
            width: "52px",
            height: "52px",
            borderRadius: "16px",
            background: "linear-gradient(135deg, #0ca678, #119674)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            boxShadow: "0 4px 16px rgba(12, 166, 120, 0.25)"
          }}>
            <FaTruck size={24} />
          </div>
          <div>
            <h1 style={{
              fontSize: "28px",
              fontWeight: 800,
              color: "#0f172a",
              margin: 0
            }}>
              {t('collecte_list.title')}
            </h1>
            <p style={{
              fontSize: "14px",
              color: "#64748b",
              margin: "2px 0 0 0"
            }}>
              {t('collecte_list.subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* ─── Grille des boutons ────────────────────────────────────────────── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "16px",
        flex: 1,
        alignItems: "start"
      }}>
        {TYPES_COLLECTE.map((type, index) => {
          const Icon = type.icon;
          const isHovered = hovered === type.id;

          return (
            <motion.button
              key={type.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onMouseEnter={() => setHovered(type.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => handleNavigate(type.route)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                padding: "20px 24px",
                borderRadius: "16px",
                background: isHovered ? type.gradient : "white",
                border: isHovered ? "none" : `2px solid ${type.border}`,
                boxShadow: isHovered 
                  ? `0 8px 32px ${type.color}40` 
                  : "0 2px 8px rgba(0,0,0,0.04)",
                cursor: "pointer",
                transition: "all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                transform: isHovered ? "scale(1.02) translateY(-2px)" : "scale(1) translateY(0)",
                width: "100%",
                textAlign: "left",
                position: "relative",
                overflow: "hidden"
              }}
            >
              {/* Effet de brillance au survol */}
              {isHovered && (
                <div style={{
                  position: "absolute",
                  top: "-50%",
                  right: "-50%",
                  width: "200%",
                  height: "200%",
                  background: "radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)",
                  pointerEvents: "none"
                }} />
              )}

              {/* Icône */}
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: isHovered ? "rgba(255,255,255,0.2)" : type.bg,
                border: isHovered ? "1px solid rgba(255,255,255,0.2)" : `1px solid ${type.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                color: isHovered ? "white" : type.color,
                transition: "all 0.3s ease",
                flexShrink: 0
              }}>
                <Icon size={20} />
              </div>

              {/* Texte */}
              <div style={{
                flex: 1,
                minWidth: 0
              }}>
                <div style={{
                  fontSize: "16px",
                  fontWeight: 700,
                  color: isHovered ? "white" : "#0f172a",
                  transition: "color 0.3s ease",
                  marginBottom: "4px"
                }}>
                  {type.label}
                </div>
                <div style={{
                  fontSize: "13px",
                  color: isHovered ? "rgba(255,255,255,0.8)" : "#64748b",
                  transition: "color 0.3s ease"
                }}>
                  {type.description}
                </div>
              </div>

              {/* Flèche */}
              <motion.div
                animate={{ 
                  x: isHovered ? 6 : 0,
                  color: isHovered ? "white" : "#94a3b8"
                }}
                transition={{ duration: 0.3 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: isHovered ? "white" : "#94a3b8",
                  fontSize: "18px",
                  flexShrink: 0
                }}
              >
                <FaChevronRight size={18} />
              </motion.div>

              {/* Indicateur de progression en bas */}
              <div style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: "3px",
                background: isHovered ? "rgba(255,255,255,0.3)" : "transparent",
                transition: "all 0.3s ease"
              }} />
            </motion.button>
          );
        })}
      </div>

      {/* ─── Footer ──────────────────────────────────────────────────────────── */}
      <div style={{
        marginTop: "32px",
        padding: "16px 20px",
        borderRadius: "12px",
        background: "#f8fafc",
        border: "1px solid #f1f5f9",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "12px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: "#10b981",
            animation: "pulse 2s infinite"
          }} />
          <span style={{ fontSize: "13px", color: "#475569" }}>
            <strong style={{ color: "#0f172a" }}>{t('collecte_list.ready')}</strong> · {t('collecte_list.choose_type')}
          </span>
        </div>
        <div style={{
          fontSize: "12px",
          color: "#94a3b8",
          display: "flex",
          alignItems: "center",
          gap: "16px"
        }}>
          <span>📅 {new Date().toLocaleDateString('fr-FR', { 
            day: '2-digit', 
            month: 'long', 
            year: 'numeric' 
          })}</span>
          <span>🕐 {new Date().toLocaleTimeString('fr-FR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}</span>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.8); }
        }
      `}</style>
    </div>
  );
}

export default function CollecteList() {
  return <CollecteListInner />;
}