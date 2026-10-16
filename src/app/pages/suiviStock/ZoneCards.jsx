import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Boxes } from "lucide-react";
import { ZONES_STOCK, zoneLabel } from "../../constants/zonesStock";
import ZoneIcon from "./ZoneIcon";

const pct = (n, total) => (total > 0 ? (n / total) * 100 : 0);
const fmtPct = (p) => `${p >= 10 || p === 0 ? Math.round(p) : p.toFixed(1)} %`;

/** Carte « total parc » puis une carte par zone ; clic → linges de la zone. */
export default function ZoneCards({ parZone, totalParc, onZoneClick }) {
  const { t } = useTranslation();
  return (
    <div className="ss-zones">
      <div className="ss-zone ss-zone--total">
        <div className="ss-zone__top">
          <span className="ss-zone__icon"><Boxes size={18} /></span>
          <span className="ss-zone__pct">100 %</span>
        </div>
        <div className="ss-zone__count">{totalParc.toLocaleString("fr-FR")}</div>
        <div className="ss-zone__label">{t("suiviStock.total_parc")}</div>
        <div className="ss-zone__bar"><span style={{ width: "100%" }} /></div>
      </div>

      {ZONES_STOCK.map((z, i) => {
        const n = parZone[z.id] || 0;
        const p = pct(n, totalParc);
        return (
          <motion.button
            key={z.id}
            type="button"
            className="ss-zone"
            style={{ "--z": z.color }}
            onClick={() => onZoneClick(z.id)}
            disabled={n === 0}
            title={n ? t("suiviStock.see_linges") : undefined}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.03 * i }}
          >
            <div className="ss-zone__top">
              <span className="ss-zone__icon"><ZoneIcon zone={z.id} /></span>
              <span className="ss-zone__pct">{fmtPct(p)}</span>
            </div>
            <div className="ss-zone__count">{n.toLocaleString("fr-FR")}</div>
            <div className="ss-zone__label">{zoneLabel(t, z.id)}</div>
            <div className="ss-zone__bar"><span style={{ width: `${p}%` }} /></div>
          </motion.button>
        );
      })}
    </div>
  );
}
