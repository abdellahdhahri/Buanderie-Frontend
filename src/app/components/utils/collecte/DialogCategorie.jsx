import React from "react";
import { FaTimes, FaBiohazard } from "react-icons/fa";
import { CATEGORIES_INFECTE } from "../../../constants/collecte";

// ─── Import des images depuis assets ──────────────────────────────────────
// Assurez-vous que les images existent dans le dossier assets/categories/
import drapImage from "../../../../assets/linges/drap.png";
import taieImage from "../../../../assets/linges/taie.png";
import servietteBainImage from "../../../../assets/linges/sbain.png";
import servietteVisageImage from "../../../../assets/linges/svisage.png";
import peignoirImage from "../../../../assets/linges/PEIGNOIR.png";
import nappeImage from "../../../../assets/linges/nape.png";
import servietteTableImage from "../../../../assets/linges/serviettetable.png";
import uniformeImage from "../../../../assets/linges/uniforme.png";
import autreImage from "../../../../assets/linges/uniforme.png";

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

/**
 * Dialog de sélection de catégorie linge infecté.
 * Boutons visuels avec images — accessible aux agents non lecteurs.
 */
export default function DialogCategorie({ onChoisir, onFermer }) {
  // Gestionnaire d'erreur d'image (fallback)
  const handleImageError = (e) => {
    e.target.style.display = 'none';
    // Afficher un texte de remplacement
    const parent = e.target.parentElement;
    const fallback = document.createElement('span');
    fallback.textContent = e.target.alt || '📦';
    fallback.style.fontSize = '34px';
    parent.insertBefore(fallback, e.target);
  };

  return (
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
      backdropFilter: "blur(4px)" 
    }}>
      <div style={{ 
        background: "white", 
        borderRadius: "24px", 
        padding: "28px", 
        maxWidth: "560px", 
        width: "95%", 
        boxShadow: "0 24px 80px rgba(0,0,0,0.3)", 
        maxHeight: "90vh", 
        overflowY: "auto" 
      }}>
        {/* ─── Header ─── */}
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          marginBottom: "24px" 
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ 
              width: "44px", 
              height: "44px", 
              borderRadius: "50%", 
              background: "#fee2e2", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center" 
            }}>
              <FaBiohazard size={22} color="#dc2626" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: "17px", color: "#1e293b" }}>
                Sélectionner une catégorie
              </div>
              <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                Appuyez sur la catégorie correspondante
              </div>
            </div>
          </div>
          <button 
            onClick={onFermer} 
            style={{ 
              background: "#f1f5f9", 
              border: "none", 
              borderRadius: "50%", 
              width: "36px", 
              height: "36px", 
              cursor: "pointer", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              transition: "all 0.2s"
            }}
            onMouseEnter={e => e.currentTarget.style.background = "#e2e8f0"}
            onMouseLeave={e => e.currentTarget.style.background = "#f1f5f9"}
          >
            <FaTimes size={16} color="#64748b" />
          </button>
        </div>

        {/* ─── Grille de catégories ─── */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(3, 1fr)", 
          gap: "12px" 
        }}>
          {CATEGORIES_INFECTE.map((cat) => {
            const imageSrc = CATEGORY_IMAGES[cat.id];
            const isImageAvailable = imageSrc !== undefined;

            return (
              <button
                key={cat.id}
                onClick={() => onChoisir(cat)}
                style={{
                  padding: "16px 8px",
                  borderRadius: "14px",
                  border: `2px solid ${cat.border}`,
                  background: cat.bg,
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "8px",
                  transition: "all 0.2s ease",
                  position: "relative",
                  minHeight: "100px"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.05)";
                  e.currentTarget.style.borderColor = cat.color;
                  e.currentTarget.style.boxShadow = `0 4px 16px ${cat.color}40`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.borderColor = cat.border;
                  e.currentTarget.style.boxShadow = "none";
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
                      display: "block"
                    }}
                    onError={handleImageError}
                  />
                ) : (
                  // Fallback si l'image n'est pas disponible
                  <span style={{ fontSize: "34px", lineHeight: 1 }}>
                    {cat.emoji || "📦"}
                  </span>
                )}
                
                {/* Nom de la catégorie */}
                <span style={{
                  fontWeight: 700,
                  fontSize: "12px",
                  color: cat.color,
                  textAlign: "center",
                  lineHeight: 1.3
                }}>
                  {cat.label}
                </span>

                {/* Badge "Infecté" si applicable */}
                {cat.infecte && (
                  <span style={{
                    position: "absolute",
                    top: "-6px",
                    right: "-6px",
                    background: "#dc2626",
                    color: "white",
                    fontSize: "8px",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: "12px",
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
          marginTop: "16px",
          paddingTop: "12px",
          borderTop: "1px solid #f1f5f9",
          display: "flex",
          justifyContent: "center",
          gap: "8px",
          fontSize: "11px",
          color: "#94a3b8"
        }}>
          <span>🖱️ Cliquez sur une catégorie</span>
          <span>•</span>
        </div>
      </div>
    </div>
  );
}