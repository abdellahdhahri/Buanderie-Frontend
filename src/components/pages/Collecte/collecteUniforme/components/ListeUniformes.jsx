import React from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence } from "framer-motion";
import { Icons } from "../../shared/icons";
import { CarteUniforme } from "./CarteUniforme";

/* ═══════════════════════════════════════════════════════════════════════════
   LISTE DES UNIFORMES — en-tête avec progression + cartes
   ═══════════════════════════════════════════════════════════════════════════ */
export function ListeUniformes({ uniformes, uniformeEnCours, total, traites, onManquant }) {
  const { t } = useTranslation();

  return (
    <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1.5px solid #e2e8f0" }}>
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "center", marginBottom: 14,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(135deg, #e0f2fe, #bae6fd)",
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "1px solid #7dd3fc",
          }}>
            <Icons.Shirt size={16} color="#0284c7" strokeWidth={2.2} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, color: "#0f172a", letterSpacing: "-0.01em" }}>
              {t('collecte_uniforme.uniforms')}
            </div>
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 500, marginTop: 1 }}>
              {total} {t('collecte_uniforme.uniforms')} · {traites} {t('collecte_uniforme.processed')}
            </div>
          </div>
        </div>
        <span style={{
          fontSize: 11, color: "#0284c7",
          fontWeight: 800, padding: "5px 14px",
          background: "#e0f2fe", borderRadius: 20,
          border: "1px solid #bae6fd",
        }}>
          {Math.round((traites / total) * 100)}%
        </span>
      </div>

      <div style={{ maxHeight: 280, overflowY: "auto", paddingRight: 4 }}>
        <AnimatePresence>
          {uniformes.map((u) => (
            <CarteUniforme
              key={u.lingeId}
              u={u}
              uniformeEnCours={uniformeEnCours}
              onManquant={onManquant}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
