import React from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence } from "framer-motion";
import { CarteLinge } from "./CarteLinge";

/* ═══════════════════════════════════════════════════════════════════════════
   LISTE DES LINGES
   ═══════════════════════════════════════════════════════════════════════════ */
export function ListeLinges({ linges, bacBlanc, onBlanc, onPropre, onManquant }) {
  const { t } = useTranslation();

  return (
    <div style={{
      maxHeight: 280, overflowY: "auto",
      marginBottom: 18, paddingRight: 4,
    }}>
      <AnimatePresence>
        {linges.length === 0 ? (
          <div style={{
            textAlign: "center", padding: 24,
            color: "#94a3b8", fontSize: 12.5, fontWeight: 500,
          }}>
            {t('collecte.no_linens_match_filter')}
          </div>
        ) : (
          linges.map(linge => (
            <CarteLinge
              key={linge.lingeId}
              linge={linge}
              bacBlanc={bacBlanc}
              onBlanc={onBlanc}
              onPropre={onPropre}
              onManquant={onManquant}
            />
          ))
        )}
      </AnimatePresence>
    </div>
  );
}
