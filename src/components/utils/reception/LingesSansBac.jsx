import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Biohazard, Building2 } from "lucide-react";
import { getCategorieMeta } from "../../../constants/categoriesLinge";
import { LingeGlyph } from "../../pages/Reception/ReceptionArt";

// Styles : pages/Reception/Reception.css (classes rc-*)
export default function LingesSansBac({ linges, dernierCode }) {
  const { t } = useTranslation();

  if (!linges.length) return null;

  const dernier = linges.find((l) => l.codeBarre === dernierCode) || null;
  const groupes = Object.values(
    linges.reduce((acc, l) => {
      const cle = l.serviceId ?? l.service ?? "?";
      if (!acc[cle]) acc[cle] = { cle, service: l.service || t("reception.no_service"), linges: [], parCategorie: {} };
      acc[cle].linges.push(l);
      const cat = l.categorie || "AUTRE";
      acc[cle].parCategorie[cat] = (acc[cle].parCategorie[cat] || 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => b.linges.length - a.linges.length);

  const libelleCategorie = (cat) => t(`categories.${cat}`, cat);
  const estInfecte = (l) => l.typeCollecte === "INFECTE";

  return (
    <section className="rc-card">
      <div className="rc-card__head">
        <h3 className="rc-card__title">
          <LingeGlyph size={22} />
          {t("reception.linges_sans_bac")}
        </h3>
        <span className="rc-count" style={{ marginLeft: "auto" }}>{linges.length}</span>
      </div>

      <div className="rc-card__body">
        {dernier && (
          <motion.div
            key={dernier.codeBarre}
            className={`rc-last-linge ${estInfecte(dernier) ? "is-infecte" : ""}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="rc-eyebrow">{t("reception.last_linge")}</span>
            <code>{dernier.codeBarre}</code>
            <span style={{ fontSize: 13, color: "var(--rc-muted)" }}>
              {dernier.designation || libelleCategorie(dernier.categorie)}
            </span>
            {estInfecte(dernier) && (
              <span className="rc-pill rc-pill--ko">
                <Biohazard size={12} /> {t("reception.infected")}
              </span>
            )}
            <span className="rc-service">
              <Building2 size={14} />
              {dernier.service || t("reception.no_service")}
            </span>
          </motion.div>
        )}

        {groupes.map((g) => (
          <div key={g.cle} className="rc-group">
            <div className="rc-group__head">
              <Building2 size={15} color="var(--rc-bac)" />
              <strong>{g.service}</strong>
              <small>{t("reception.n_linges", { count: g.linges.length })}</small>
              <div className="rc-chips">
                {Object.entries(g.parCategorie).map(([cat, n]) => (
                  <span key={cat} className="rc-chip" style={{ "--c": getCategorieMeta(cat).accent }}>
                    <i /> {libelleCategorie(cat)} <b>{n}</b>
                  </span>
                ))}
              </div>
            </div>
            <div className="rc-grid">
              {g.linges.map((l) => {
                const { Icon, accent } = getCategorieMeta(l.categorie);
                return (
                  <div
                    key={l.lingeId ?? l.codeBarre}
                    className={`rc-item ${l.codeBarre === dernierCode ? "is-active" : ""}`}
                    style={{ "--c": accent }}
                  >
                    <span className="rc-item__icon"><Icon size={20} strokeWidth={1.9} /></span>
                    <span className="rc-item__body">
                      <span className="rc-item__code">{l.codeBarre}</span>
                      <span className="rc-item__cat">{libelleCategorie(l.categorie)}</span>
                      {l.designation && <span className="rc-item__desc">{l.designation}</span>}
                      {estInfecte(l) && (
                        <span className="rc-item__foot">
                          <span className="rc-pill rc-pill--ko">
                            <Biohazard size={11} /> {t("reception.infected")}
                          </span>
                        </span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
