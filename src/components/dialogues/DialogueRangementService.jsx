import React, { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { CircleCheck, X } from "lucide-react";
import { ServiceContext } from "../../contextes/ServiceContext";
import { fetchServiceById } from "../../services/historiqueCollecteService";
import { Illustration } from "../pages/StockageArsenal/illustrations";
import { accentOf } from "../pages/StockageArsenal/arsenalUtils";

const DUREE = 6; // secondes avant fermeture automatique
const ACCENT = "#0ca678"; // Zone propre

const serviceLabel = (s) => s?.code || s?.nom || s?.designation || s?.libelle || null;

/**
 * Après pliage + contrôle qualité conforme : indique sur quelle étagère de la
 * buanderie poser le linge (celle de son service).
 */
export default function DialogueRangementService({ item, onClose }) {
  const { t } = useTranslation();
  const { getServiceById } = useContext(ServiceContext) || {};
  const [fetched, setFetched] = useState(null); // { id, nom } si chargé à la demande
  const [timeLeft, setTimeLeft] = useState(DUREE);
  const [paused, setPaused] = useState(false);

  const serviceId = item?.serviceId ?? item?.service?.id ?? null;
  const known = item?.serviceNom || serviceLabel(item?.service) || serviceLabel(getServiceById?.(serviceId)) ||
    (fetched?.id === serviceId ? fetched.nom : null);

  // Service absent de la liste en mémoire : on le charge
  useEffect(() => {
    if (known || serviceId == null) return;
    let cancelled = false;
    fetchServiceById(serviceId)
      .then((s) => !cancelled && setFetched({ id: serviceId, nom: serviceLabel(s) }))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [known, serviceId]);

  // Compte à rebours (suspendu au survol)
  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setTimeLeft((s) => Math.max(s - 0.1, 0)), 100);
    return () => clearInterval(id);
  }, [paused]);

  useEffect(() => {
    if (timeLeft <= 0) onClose();
  }, [timeLeft, onClose]);

  useEffect(() => {
    const onKey = (e) => (e.key === "Escape" || e.key === "Enter") && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!item) return null;

  const service = known || (serviceId != null ? `${t("dialogue_rangement.service")} ${serviceId}` : null);
  const categorie = item.categorie;
  const r = 19;
  const circ = 2 * Math.PI * r;

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", background: "rgba(15,23,42,0.7)", backdropFilter: "blur(8px)" }}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="rangement-title"
        onClick={(e) => e.stopPropagation()}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        initial={{ opacity: 0, scale: 0.94, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
        style={{ position: "relative", width: "100%", maxWidth: "500px", overflow: "hidden", borderRadius: "24px", background: "white", boxShadow: "0 32px 96px rgba(0,0,0,0.35)" }}
      >
        {/* Liseré + fermeture */}
        <div style={{ height: "5px", background: `linear-gradient(90deg, #20c997, ${ACCENT})` }} />
        <div style={{ position: "absolute", top: "18px", right: "18px", display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ position: "relative", width: 44, height: 44 }} title={t("dialogue_rangement.auto_close")}>
            <svg width="44" height="44" viewBox="0 0 44 44" style={{ transform: "rotate(-90deg)" }} aria-hidden="true">
              <circle cx="22" cy="22" r={r} fill="none" stroke="#e2e8f0" strokeWidth="3" />
              <circle cx="22" cy="22" r={r} fill="none" stroke={ACCENT} strokeWidth="3" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - timeLeft / DUREE)} style={{ transition: "stroke-dashoffset 0.1s linear" }} />
            </svg>
            <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 800, color: ACCENT }}>
              {Math.ceil(timeLeft)}
            </span>
          </div>
          <button type="button" onClick={onClose} aria-label={t("common.close")} style={{ width: 40, height: 40, borderRadius: 12, border: "none", background: "#f1f5f9", color: "#64748b", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: "28px 28px 24px", textAlign: "center" }}>
          <div style={{ width: "170px", margin: "0 auto" }}>
            <Illustration kind="shelf" color={ACCENT} />
          </div>

          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 12px", borderRadius: "999px", background: "#e6fcf5", color: "#087f5b", fontSize: "12px", fontWeight: 700, marginTop: "6px" }}>
            <CircleCheck size={14} /> {t("dialogue_rangement.badge")}
          </div>

          <h2 id="rangement-title" style={{ margin: "12px 0 6px", fontSize: "22px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.015em" }}>
            {t("dialogue_rangement.title")}
          </h2>
          <p style={{ margin: "0 auto 18px", maxWidth: "380px", fontSize: "14px", lineHeight: 1.55, color: "#64748b" }}>
            {t("dialogue_rangement.text")}
          </p>

          {/* Étagère du service : l'information principale */}
          <div style={{ padding: "16px 18px", borderRadius: "18px", border: `2px solid ${ACCENT}`, background: "#e6fcf5", boxShadow: "0 0 0 5px rgba(12,166,120,0.12)" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#087f5b" }}>
              {t("dialogue_rangement.shelf_of")}
            </div>
            <div style={{ marginTop: "4px", fontSize: "28px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em", wordBreak: "break-word" }}>
              {service || t("dialogue_rangement.unknown_service")}
            </div>
            <div style={{ marginTop: "2px", fontSize: "12.5px", color: "#475569" }}>{t("dialogue_rangement.location")}</div>
          </div>

          {/* Linge */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", flexWrap: "wrap", marginTop: "16px" }}>
            <code style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a", fontFamily: "'IBM Plex Mono', ui-monospace, monospace" }}>
              {item.codeBarre || item.codeSuivi}
            </code>
            {categorie && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "3px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: 600, color: accentOf(categorie), border: `1px solid ${accentOf(categorie)}40`, background: `${accentOf(categorie)}12` }}>
                <i style={{ width: 7, height: 7, borderRadius: "50%", background: accentOf(categorie) }} />
                {t(`categories.${categorie}`, categorie)}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{ marginTop: "20px", width: "100%", padding: "14px", border: "none", borderRadius: "14px", background: `linear-gradient(135deg, #20c997, ${ACCENT})`, color: "white", fontSize: "15px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", boxShadow: "0 10px 24px -10px rgba(12,166,120,0.7)" }}
          >
            <CircleCheck size={18} /> {t("dialogue_rangement.done")}
          </button>
          <div style={{ marginTop: "10px", fontSize: "11.5px", color: "#94a3b8" }}>{t("dialogue_rangement.next_hint")}</div>
        </div>
      </motion.div>
    </div>
  );
}
