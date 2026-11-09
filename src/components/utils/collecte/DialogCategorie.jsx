import React from "react";
import { FaTimes, FaBiohazard } from "react-icons/fa";
import { CATEGORIES_INFECTE } from "../../../constants/collecte";
import { getActiveCategories } from "../../../utils/appSettings";

import drapImage from "../../../assets/linges/drap.png";
import taieImage from "../../../assets/linges/taie.png";
import servietteBainImage from "../../../assets/linges/sbain.png";
import servietteVisageImage from "../../../assets/linges/svisage.png";
import peignoirImage from "../../../assets/linges/PEIGNOIR.png";
import nappeImage from "../../../assets/linges/nape.png";
import servietteTableImage from "../../../assets/linges/serviettetable.png";
import uniformeImage from "../../../assets/linges/tenue-de-bloc.jpg";
import autreImage from "../../../assets/linges/uniforme.png";

const CATEGORY_IMAGES = {
  DRAP: drapImage,
  TAIE_OREILLER: taieImage,
  SERVIETTE_BAIN: servietteBainImage,
  SERVIETTE_VISAGE: servietteVisageImage,
  PEIGNOIR: peignoirImage,
  NAPPE: nappeImage,
  SERVIETTE_TABLE: servietteTableImage,
  UNIFORME: uniformeImage,
  AUTRE: autreImage,
};


export default function DialogCategorie({ onChoisir, onFermer }) {
  const handleImageError = (e) => {
    e.target.style.display = 'none';
    const parent = e.target.parentElement;
    const fallback = document.createElement('span');
    fallback.textContent = e.target.alt || '📦';
    fallback.style.fontSize = '32px';
    fallback.style.fontWeight = '400';
    parent.insertBefore(fallback, e.target);
  };

  return (
    <div style={{ 
      position: "fixed", 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      background: "rgba(15, 23, 42, 0.75)", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center", 
      zIndex: 9999, 
      backdropFilter: "blur(6px)" 
    }}>
      <div style={{ 
        background: "#ffffff", 
        borderRadius: "16px", 
        padding: "32px", 
        maxWidth: "640px", 
        width: "92%", 
        boxShadow: "0 24px 64px rgba(0,0,0,0.35)", 
        maxHeight: "90vh", 
        overflowY: "auto",
        border: "1px solid #e2e8f0"
      }}>
        {/* ─── Header ─── */}
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          marginBottom: "28px",
          paddingBottom: "16px",
          borderBottom: "1px solid #e2e8f0"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ 
              width: "44px", 
              height: "44px", 
              borderRadius: "10px", 
              background: "#0f172a", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center" 
            }}>
              <FaBiohazard size={20} color="#94a3b8" />
            </div>
            <div>
              <div style={{ 
                fontWeight: 600, 
                fontSize: "18px", 
                color: "#0f172a",
                letterSpacing: "-0.3px"
              }}>
                Sélectionner une catégorie
              </div>
              <div style={{ 
                fontSize: "13px", 
                color: "#64748b", 
                marginTop: "2px",
                fontWeight: 400
              }}>
                Choisissez la catégorie du linge infecté
              </div>
            </div>
          </div>
          <button 
            onClick={onFermer} 
            style={{ 
              background: "transparent", 
              border: "1px solid #e2e8f0", 
              borderRadius: "8px", 
              width: "36px", 
              height: "36px", 
              cursor: "pointer", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              transition: "all 0.15s",
              color: "#94a3b8"
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "#f1f5f9";
              e.currentTarget.style.borderColor = "#94a3b8";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.borderColor = "#e2e8f0";
            }}
          >
            <FaTimes size={16} />
          </button>
        </div>

        {/* ─── Grille de catégories ─── */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(3, 1fr)", 
          gap: "12px" 
        }}>
          {CATEGORIES_INFECTE.filter((cat) => getActiveCategories().includes(cat.id)).map((cat) => {
            const imageSrc = CATEGORY_IMAGES[cat.id];
            const isImageAvailable = imageSrc !== undefined;

            return (
              <button
                key={cat.id}
                onClick={() => onChoisir(cat)}
                style={{
                  padding: "20px 12px",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  background: "#fafbfc",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "10px",
                  transition: "all 0.15s ease",
                  position: "relative",
                  minHeight: "120px"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#0f172a";
                  e.currentTarget.style.background = "#f1f5f9";
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#e2e8f0";
                  e.currentTarget.style.background = "#fafbfc";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                {/* Image de la catégorie */}
                {isImageAvailable ? (
                  <img
                    src={imageSrc}
                    alt={cat.label}
                    style={{
                      width: "48px",
                      height: "48px",
                      objectFit: "contain",
                      display: "block",
                      opacity: 0.85
                    }}
                    onError={handleImageError}
                  />
                ) : (
                  <span style={{ fontSize: "32px", lineHeight: 1, opacity: 0.7 }}>
                    {cat.emoji || "📦"}
                  </span>
                )}
                
                {/* Nom de la catégorie */}
                <span style={{
                  fontWeight: 500,
                  fontSize: "12px",
                  color: "#0f172a",
                  textAlign: "center",
                  lineHeight: 1.3,
                  letterSpacing: "0.2px"
                }}>
                  {cat.label}
                </span>

                {/* Badge "Infecté" */}
                {cat.infecte && (
                  <span style={{
                    position: "absolute",
                    top: "8px",
                    right: "8px",
                    background: "#0f172a",
                    color: "#f8fafc",
                    fontSize: "8px",
                    fontWeight: 600,
                    padding: "2px 8px",
                    borderRadius: "4px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>
                    ⚠️
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ─── Footer ─── */}
        <div style={{
          marginTop: "20px",
          paddingTop: "16px",
          borderTop: "1px solid #f1f5f9",
          display: "flex",
          justifyContent: "center",
          gap: "12px",
          fontSize: "12px",
          color: "#94a3b8",
          fontWeight: 400
        }}>
          <span>Cliquez sur une catégorie pour continuer</span>
        </div>
      </div>
    </div>
  );
}