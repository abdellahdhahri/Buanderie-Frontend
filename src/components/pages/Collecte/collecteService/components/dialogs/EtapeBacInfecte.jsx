import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Icons } from "../../../shared/icons";
import { ModalOverlay, BoutonSecondaire } from "../../../shared/dialogs/DialogParts";

/* ═══════════════════════════════════════════════════════════════════════════
   Sac infecté — Étape 3 : scan du bac rouge
   ═══════════════════════════════════════════════════════════════════════════ */
export function EtapeBacInfecte({
  categorie, quantite, codeBac, setCodeBac, loading, bacErr,
  onScan, onRetour, onClose,
}) {
  const { t } = useTranslation();
  const hasCode = !!codeBac.trim();

  return (
    <ModalOverlay
      onClose={onClose}
      maxWidth={420}
      backdropOpacity={0.7}
      shadow="0 24px 72px rgba(220,38,38,0.3)"
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 20 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 15,
          background: "linear-gradient(135deg, #fee2e2, #fecaca)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 14px rgba(220,38,38,0.25)",
        }}>
          <Icons.Biohazard size={26} color="#dc2626" strokeWidth={2.2} />
        </div>
        <div>
          <h3 style={{
            margin: 0, fontSize: 17, fontWeight: 800,
            color: "#dc2626", letterSpacing: "-0.01em",
          }}>
            {t('collecte.scan_red_bac')}
          </h3>
          <p style={{ margin: "3px 0 0 0", fontSize: 12, color: "#64748b", fontWeight: 500 }}>
            {quantite} {categorie.label}{quantite > 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={{
          fontSize: 11, fontWeight: 800, color: "#dc2626",
          display: "block", marginBottom: 6,
          textTransform: "uppercase", letterSpacing: "0.4px",
        }}>
          {t('collecte.red_bac_code')}
        </label>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={codeBac}
            onChange={e => setCodeBac(e.target.value)}
            onKeyDown={e => e.key === "Enter" && onScan()}
            placeholder={t('collecte.scan_or_enter')}
            autoFocus
            style={{
              flex: 1, padding: "12px 14px", borderRadius: 11,
              border: "2px solid #fca5a5", fontSize: 13, outline: "none",
              fontWeight: 600, color: "#0f172a",
              transition: "all 0.2s",
            }}
            onFocus={e => {
              e.currentTarget.style.borderColor = "#dc2626";
              e.currentTarget.style.boxShadow = "0 0 0 4px rgba(220,38,38,0.1)";
            }}
            onBlur={e => {
              e.currentTarget.style.borderColor = "#fca5a5";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
          <motion.button
            whileHover={hasCode && !loading ? { y: -1 } : {}}
            whileTap={hasCode && !loading ? { scale: 0.97 } : {}}
            onClick={onScan}
            disabled={loading || !hasCode}
            style={{
              padding: "12px 22px", borderRadius: 11, border: "none",
              background: !hasCode ? "#e2e8f0" : "linear-gradient(135deg, #ef4444, #dc2626)",
              color: !hasCode ? "#94a3b8" : "white",
              fontWeight: 800, fontSize: 13,
              cursor: !hasCode ? "not-allowed" : "pointer",
              boxShadow: hasCode ? "0 4px 14px rgba(220,38,38,0.35)" : "none",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            {loading ? (
              <div className="animate-spin">
                <Icons.Loader size={14} color="white" strokeWidth={2.5} />
              </div>
            ) : "OK"}
          </motion.button>
        </div>
        {bacErr && (
          <div style={{
            marginTop: 8, padding: "10px 12px", borderRadius: 9,
            background: "#fef2f2", border: "1px solid #fca5a5",
            fontSize: 11, color: "#dc2626", fontWeight: 600,
            display: "flex", alignItems: "center", gap: 7,
          }}>
            <Icons.AlertTriangle size={12} color="#dc2626" strokeWidth={2.5} />
            {bacErr}
          </div>
        )}
      </div>

      <BoutonSecondaire onClick={onRetour} withIcon style={{ width: "100%" }}>
        <Icons.ArrowLeft size={13} strokeWidth={2.5} />
        {t('common.back')}
      </BoutonSecondaire>
    </ModalOverlay>
  );
}
