import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { AlertOctagon, CheckCircle2, ChevronRight, HelpCircle, RefreshCw } from "lucide-react";
import { fetchLingesBloques } from "../../../services/analyseService";
import { formatDateTime } from "../../../utils/appSettings";
import { CHEMIN_LINGES_BLOQUES, etatsTries, libelleEtat } from "./lingesBloquesUtils";
import "./LingesBloques.css";

const RAFRAICHISSEMENT_MS = 60000;

export default function LingesBloquesWidget() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [erreur, setErreur] = useState(null);
  const [chargement, setChargement] = useState(false);

  const charger = useCallback(async () => {
    setChargement(true);
    try {
      const res = await fetchLingesBloques({ page: 0, size: 1 });
      setData(res);
      setErreur(null);
    } catch (e) {
      setErreur(e.message);
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    const premier = setTimeout(charger, 0);
    const id = setInterval(() => { if (!document.hidden) charger(); }, RAFRAICHISSEMENT_MS);
    return () => { clearTimeout(premier); clearInterval(id); };
  }, [charger]);

  const total = Number(data?.total) || 0;
  const manquants = Number(data?.manquantsPossibles) || 0;
  const etats = etatsTries(data?.parEtat);
  const max = Math.max(1, ...etats.map(([, n]) => n));
  const ouvrir = (etat) => navigate(etat ? `${CHEMIN_LINGES_BLOQUES}?etat=${encodeURIComponent(etat)}` : CHEMIN_LINGES_BLOQUES);

  return (
    <section className={`lb-widget ${data ? (total > 0 ? "is-alerte" : "is-ok") : ""}`} aria-labelledby="lb-widget-titre">
      <button type="button" className="lb-widget__main" onClick={() => ouvrir()}>
        <span className="lb-widget__icon" aria-hidden="true">
          {data && total === 0 ? <CheckCircle2 size={26} /> : <AlertOctagon size={26} />}
        </span>
        <span className="lb-widget__chiffres">
          <span id="lb-widget-titre" className="lb-widget__titre">{t("linges_bloques.title", "Linges bloqués")}</span>
          <strong className="lb-widget__total">{data ? total.toLocaleString("fr-FR") : "—"}</strong>
          <span className="lb-widget__manquants">
            <HelpCircle size={14} />
            {t("linges_bloques.missing_possible_count", "Manquants possibles")} : <b>{manquants.toLocaleString("fr-FR")}</b>
          </span>
        </span>
        <ChevronRight size={18} className="lb-widget__go" aria-hidden="true" />
      </button>

      <div className="lb-widget__etats">
        <div className="lb-widget__head">
          <span>{t("linges_bloques.by_state", "Répartition par état")}</span>
          <small>
            {erreur
              ? erreur
              : data?.dateAnalyse
                ? `${t("linges_bloques.last_analysis", "Dernière analyse")} : ${formatDateTime(data.dateAnalyse)}`
                : t("common.loading", "Chargement…")}
          </small>
          <button type="button" className="lb-widget__refresh" onClick={charger} aria-label={t("common.refresh", "Actualiser")} title={t("common.refresh", "Actualiser")}>
            <RefreshCw size={14} className={chargement ? "animate-spin" : ""} />
          </button>
        </div>
        {data && etats.length === 0 ? (
          <p className="lb-widget__vide"><CheckCircle2 size={16} /> {t("linges_bloques.empty", "Aucun linge bloqué")}</p>
        ) : (
          <ul className="lb-widget__liste">
            {etats.slice(0, 6).map(([etat, n]) => (
              <li key={etat}>
                <button type="button" onClick={() => ouvrir(etat)} title={t("linges_bloques.see_state", "Voir les linges bloqués : {{etat}}", { etat: libelleEtat(t, etat) })}>
                  <span className="lb-widget__label">{libelleEtat(t, etat)}</span>
                  <span className="lb-widget__bar" aria-hidden="true"><i style={{ width: `${(n / max) * 100}%` }} /></span>
                  <strong>{n}</strong>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
