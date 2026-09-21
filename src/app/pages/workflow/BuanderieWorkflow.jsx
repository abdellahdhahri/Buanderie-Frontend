import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

// ─── Constantes ──────────────────────────────────────────────────────────
const BUTTON_WIDTH = 260;
const BUTTON_HEIGHT = 50;
const BUTTON_GAP = 30;
const ARROW_COLOR = "#c084fc";
const ARROW_HEIGHT = BUTTON_GAP;
const COLUMN_GAP = 100; // Espace entre les deux colonnes

// ─── Configuration des étapes (avec liens) ──────────────────────────────
const ETAPES_DROITE = [
  { id: 1, key: "collage", icon: "🔴", color: "pink", path: "/collages" },
  { id: 2, key: "reception", icon: "🔴", color: "pink", path: "/receptions" },
  { id: 3, key: "tri", icon: "🔴", color: "pink", path: "/tri" },
  { id: 4, key: "lavage", icon: "🔴", color: "pink", path: "/lavages" },
];

const ETAPES_GAUCHE = [
  { id: 5, key: "livraison", icon: "🟢", color: "green", path: "/remise" },
  { id: 6, key: "stockage", icon: "🟢", color: "green", path: "/stockages" },
  { id: 7, key: "pliage", icon: "🟢", color: "green", path: "/pliages" },
  { id: 8, key: "sechoir", icon: "🟢", color: "green", path: "/sechages" },
];

// ─── Composant : Bouton étape ────────────────────────────────────────────
function EtapeButton({ etape, onClick, t }) {
  const isGreen = etape.color === "green";

  return (
    <button
      onClick={() => onClick?.(etape)}
      style={{
        width: `${BUTTON_WIDTH}px`,
        height: `${BUTTON_HEIGHT}px`,
        borderRadius: "28px",
        border: "none",
        cursor: "pointer",
        fontWeight: 700,
        fontSize: "15px",
        color: "white",
        letterSpacing: "0.3px",
        background: isGreen
          ? "linear-gradient(180deg, #7ee8d3 0%, #4dd4b8 50%, #2bb89a 100%)"
          : "linear-gradient(180deg, #f9a8c4 0%, #e8567f 50%, #c9245c 100%)",
        boxShadow: isGreen
          ? "0 6px 0 #1e8a75, 0 8px 16px rgba(43, 184, 154, 0.35), inset 0 2px 4px rgba(255,255,255,0.4)"
          : "0 6px 0 #9c1a45, 0 8px 16px rgba(201, 36, 92, 0.35), inset 0 2px 4px rgba(255,255,255,0.4)",
        textShadow: "0 1px 3px rgba(0,0,0,0.3)",
        transition: "all 0.15s ease",
        position: "relative",
        zIndex: 5,
        textAlign: "center",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = isGreen
          ? "0 8px 0 #1e8a75, 0 12px 20px rgba(43, 184, 154, 0.45), inset 0 2px 4px rgba(255,255,255,0.4)"
          : "0 8px 0 #9c1a45, 0 12px 20px rgba(201, 36, 92, 0.45), inset 0 2px 4px rgba(255,255,255,0.4)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = isGreen
          ? "0 6px 0 #1e8a75, 0 8px 16px rgba(43, 184, 154, 0.35), inset 0 2px 4px rgba(255,255,255,0.4)"
          : "0 6px 0 #9c1a45, 0 8px 16px rgba(201, 36, 92, 0.35), inset 0 2px 4px rgba(255,255,255,0.4)";
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = "translateY(4px)";
        e.currentTarget.style.boxShadow = isGreen
          ? "0 2px 0 #1e8a75, 0 4px 8px rgba(43, 184, 154, 0.3), inset 0 2px 4px rgba(255,255,255,0.3)"
          : "0 2px 0 #9c1a45, 0 4px 8px rgba(201, 36, 92, 0.3), inset 0 2px 4px rgba(255,255,255,0.3)";
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
    >
      {t(`buanderie.steps.${etape.key}`)}
    </button>
  );
}

// ─── Composant : Flèche entre deux boutons ───────────────────────────────
function ArrowBetween({ direction = "down", color = ARROW_COLOR }) {
  return (
    <div
      style={{
        height: `${ARROW_HEIGHT}px`,
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        zIndex: 10,
      }}
    >
      {direction === "down" ? (
        <>
          <div
            style={{
              width: "3px",
              height: "20px",
              background: color,
              borderRadius: "2px",
            }}
          />
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: "7px solid transparent",
              borderRight: "7px solid transparent",
              borderTop: `10px solid ${color}`,
              marginTop: "-1px",
            }}
          />
        </>
      ) : (
        <>
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: "7px solid transparent",
              borderRight: "7px solid transparent",
              borderBottom: `10px solid ${color}`,
              marginBottom: "-1px",
            }}
          />
          <div
            style={{
              width: "3px",
              height: "20px",
              background: color,
              borderRadius: "2px",
            }}
          />
        </>
      )}
    </div>
  );
}

// ─── COMPOSANT PRINCIPAL ─────────────────────────────────────────────────
export default function BuanderieWorkflow({ onEtapeClick }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // ─── Gestion du clic sur une étape ─────────────────────────────────────
  const handleEtapeClick = (etape) => {
    if (onEtapeClick) {
      onEtapeClick(etape);
      return;
    }
    if (etape.path) {
      navigate(etape.path);
    }
  };

  // ─── Calcul des positions X ────────────────────────────────────────────
  // Centre colonne GAUCHE = BUTTON_WIDTH / 2 = 130
  // Centre colonne DROITE = BUTTON_WIDTH + COLUMN_GAP + BUTTON_WIDTH / 2 = 490
  const CENTER_LEFT = BUTTON_WIDTH / 2;
  const CENTER_RIGHT = BUTTON_WIDTH + COLUMN_GAP + BUTTON_WIDTH / 2;
  const SVG_WIDTH = BUTTON_WIDTH * 2 + COLUMN_GAP;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f8fafc",
        padding: "40px 20px",
        fontFamily: "'Segoe UI', 'Roboto', sans-serif",
      }}
    >
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* ─── Titre "Buanderie" ─────────────────────────────────────── */}
        <div
          style={{
            padding: "8px 40px",
            borderRadius: "12px",
            background: "rgba(233, 213, 255, 0.4)",
            border: "1px solid rgba(192, 132, 252, 0.3)",
            color: "#a78bfa",
            fontWeight: 700,
            fontSize: "18px",
            letterSpacing: "1px",
            textShadow: "0 1px 2px rgba(255,255,255,0.8)",
            marginBottom: "40px",
          }}
        >
          {t('buanderie.title')}
        </div>

        {/* ─── Conteneur principal ───────────────────────────────────── */}
        <div
          style={{
            position: "relative",
            display: "flex",
            gap: `${COLUMN_GAP}px`,
            alignItems: "flex-start",
            paddingTop: "70px", // Espace pour la flèche du haut
          }}
        >
          {/* ═══ FLÈCHE HAUTE (Livraison → Collage) ═════════════════════
              Départ : Livraison (colonne GAUCHE) → X = 130
              Arrivée : Collage (colonne DROITE) → X = 490
              Sens : gauche → droite
              Pointe : vers le BAS (au-dessus du bouton Collage)
          ════════════════════════════════════════════════════════════ */}
          <div
            style={{
              position: "absolute",
              top: "-5px",
              left: 0,
              right: 0,
              height: "70px",
              pointerEvents: "none",
              zIndex: 10,
            }}
          >
            <svg
              style={{
                width: "100%",
                height: "100%",
                overflow: "visible",
              }}
              viewBox={`0 0 ${SVG_WIDTH} 70`}
              preserveAspectRatio="none"
            >
              <path
                d={`
                  M ${CENTER_LEFT} 70
                  L ${CENTER_LEFT} 25
                  Q ${CENTER_LEFT} 10 ${CENTER_LEFT + 15} 10
                  L ${CENTER_RIGHT - 15} 10
                  Q ${CENTER_RIGHT} 10 ${CENTER_RIGHT} 25
                  L ${CENTER_RIGHT} 58
                `}
                stroke={ARROW_COLOR}
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
              />
              {/* Pointe de flèche vers le BAS */}
              <polygon
                points={`
                  ${CENTER_RIGHT - 7},58
                  ${CENTER_RIGHT + 7},58
                  ${CENTER_RIGHT},70
                `}
                fill={ARROW_COLOR}
              />
            </svg>
          </div>

          {/* ═══ COLONNE GAUCHE (5-6-7-8) ═══════════════════════════════ */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              position: "relative",
            }}
          >
            <EtapeButton etape={ETAPES_GAUCHE[0]} onClick={handleEtapeClick} t={t} />
            <ArrowBetween direction="up" />
            <EtapeButton etape={ETAPES_GAUCHE[1]} onClick={handleEtapeClick} t={t} />
            <ArrowBetween direction="up" />
            <EtapeButton etape={ETAPES_GAUCHE[2]} onClick={handleEtapeClick} t={t} />
            <ArrowBetween direction="up" />
            <EtapeButton etape={ETAPES_GAUCHE[3]} onClick={handleEtapeClick} t={t} />
          </div>

          {/* ═══ COLONNE DROITE (1-2-3-4) ═══════════════════════════════ */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              position: "relative",
            }}
          >
            <EtapeButton etape={ETAPES_DROITE[0]} onClick={handleEtapeClick} t={t} />
            <ArrowBetween direction="down" />
            <EtapeButton etape={ETAPES_DROITE[1]} onClick={handleEtapeClick} t={t} />
            <ArrowBetween direction="down" />
            <EtapeButton etape={ETAPES_DROITE[2]} onClick={handleEtapeClick} t={t} />
            <ArrowBetween direction="down" />
            <EtapeButton etape={ETAPES_DROITE[3]} onClick={handleEtapeClick} t={t} />
          </div>

          {/* ═══ FLÈCHE BASSE (Lavage → Séchoir) ═══════════════════════
              Départ : Lavage (colonne DROITE) → X = 490
              Arrivée : Séchoir (colonne GAUCHE) → X = 130
              Sens : droite → gauche
              Pointe : vers le HAUT (en dessous du bouton Séchoir)
          ════════════════════════════════════════════════════════════ */}
          <div
            style={{
              position: "absolute",
              bottom: "-70px",
              left: 0,
              right: 0,
              height: "70px",
              pointerEvents: "none",
              zIndex: 10,
            }}
          >
            <svg
              style={{
                width: "100%",
                height: "100%",
                overflow: "visible",
              }}
              viewBox={`0 0 ${SVG_WIDTH} 70`}
              preserveAspectRatio="none"
            >
              <path
                d={`
                  M ${CENTER_RIGHT} 0
                  L ${CENTER_RIGHT} 45
                  Q ${CENTER_RIGHT} 60 ${CENTER_RIGHT - 15} 60
                  L ${CENTER_LEFT + 15} 60
                  Q ${CENTER_LEFT} 60 ${CENTER_LEFT} 45
                  L ${CENTER_LEFT} 12
                `}
                stroke={ARROW_COLOR}
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
              />
              {/* Pointe de flèche vers le HAUT */}
              <polygon
                points={`
                  ${CENTER_LEFT - 7},12
                  ${CENTER_LEFT + 7},12
                  ${CENTER_LEFT},0
                `}
                fill={ARROW_COLOR}
              />
            </svg>
          </div>
        </div>

        {/* ─── Légende ───────────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            gap: "32px",
            marginTop: "120px",
            fontSize: "13px",
            color: "#64748b",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "20px",
                height: "12px",
                borderRadius: "6px",
                background: "linear-gradient(180deg, #f9a8c4, #c9245c)",
              }}
            />
            <span>{t('buanderie.circuit_sale')}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "20px",
                height: "12px",
                borderRadius: "6px",
                background: "linear-gradient(180deg, #7ee8d3, #2bb89a)",
              }}
            />
            <span>{t('buanderie.circuit_propre')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}