import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Icons } from "../../../shared/icons";
import { ModalOverlay, BoutonFermer, BoutonSecondaire } from "../../../shared/dialogs/DialogParts";

function BoutonQuantite({ onClick, categorie, Icon }) {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      style={{
        width: 48, height: 48, borderRadius: "50%",
        border: `2px solid ${categorie.border}`,
        background: categorie.bg, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <Icon size={20} color={categorie.color} strokeWidth={2.5} />
    </motion.button>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Sac infecté — Étape 2 : quantité de linges
   ═══════════════════════════════════════════════════════════════════════════ */
export function EtapeQuantite({ categorie, quantite, setQuantite, onRetour, onSuivant, onClose }) {
  const { t } = useTranslation();
  const libelle = `${categorie.label}${quantite > 1 ? "s" : ""}`;

  return (
    <ModalOverlay onClose={onClose}>
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "flex-start", marginBottom: 20,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 15,
            background: `linear-gradient(135deg, ${categorie.bg}, ${categorie.border})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 4px 14px ${categorie.color}25`,
            fontSize: 26,
          }}>
            {categorie.emoji}
          </div>
          <div>
            <h3 style={{
              margin: 0, fontSize: 17, fontWeight: 800,
              color: "#0f172a", letterSpacing: "-0.01em",
            }}>
              {categorie.label}
            </h3>
            <p style={{ margin: "3px 0 0 0", fontSize: 12, color: "#64748b", fontWeight: 500 }}>
              {t('collecte.how_many_infected', { label: categorie.label.toLowerCase() })}
            </p>
          </div>
        </div>
        <BoutonFermer onClick={onClose} />
      </div>

      <div style={{
        display: "flex", alignItems: "center",
        justifyContent: "center", gap: 20, marginBottom: 24,
      }}>
        <BoutonQuantite
          onClick={() => setQuantite(q => Math.max(1, q - 1))}
          categorie={categorie}
          Icon={Icons.Minus}
        />
        <div style={{ textAlign: "center", minWidth: 90 }}>
          <div style={{
            fontSize: 46, fontWeight: 800,
            color: categorie.color, lineHeight: 1,
            letterSpacing: "-0.03em",
          }}>
            {quantite}
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, marginTop: 4 }}>
            {libelle}
          </div>
        </div>
        <BoutonQuantite
          onClick={() => setQuantite(q => q + 1)}
          categorie={categorie}
          Icon={Icons.Plus}
        />
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <BoutonSecondaire onClick={onRetour} withIcon>
          <Icons.ArrowLeft size={13} strokeWidth={2.5} />
          {t('common.back')}
        </BoutonSecondaire>
        <motion.button
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.97 }}
          onClick={onSuivant}
          style={{
            flex: 2, padding: 13, borderRadius: 12, border: "none",
            background: `linear-gradient(135deg, ${categorie.color}, #b91c1c)`,
            color: "white", fontWeight: 800, fontSize: 13,
            cursor: "pointer",
            boxShadow: `0 4px 14px ${categorie.color}40`,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          {quantite} {libelle}
          <Icons.ArrowRight size={14} color="white" strokeWidth={2.5} />
        </motion.button>
      </div>
    </ModalOverlay>
  );
}
