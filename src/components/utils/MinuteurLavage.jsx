import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import "./MinuteurLavage.css";

export default function MinuteurLavage({
  dateDebut,
  dureePrevue,
  programme,
  temperature,
  vitesse,
}) {
  const { t } = useTranslation();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!dateDebut) return;
    const tick = () =>
      setElapsed(Math.floor((Date.now() - new Date(dateDebut)) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [dateDebut]);

  const formaterTemps = (sec) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    const p = (n) => String(n).padStart(2, "0");
    return h > 0 ? `${p(h)}:${p(m)}:${p(s)}` : `${p(m)}:${p(s)}`;
  };

  const dureePrevueSec = dureePrevue ? dureePrevue * 60 : null;
  const pct = dureePrevueSec
    ? Math.min((elapsed / dureePrevueSec) * 100, 100)
    : null;
  const depasse = dureePrevueSec && elapsed > dureePrevueSec;
  const presqueFini = pct >= 90 && !depasse;

  const couleur = depasse ? "#b91c1c" : presqueFini ? "#d97706" : "#0794a4";

  const tempsRestant = dureePrevueSec
    ? Math.max(0, dureePrevueSec - elapsed)
    : null;

  const parametres = [
    { label: t("minuteur.temperature", "Température"), val: temperature && temperature !== "—" ? `${temperature}°C` : "—" },
    { label: t("minuteur.spin", "Essorage"), val: vitesse && vitesse !== "—" ? `${vitesse} rpm` : "—" },
    { label: t("minuteur.start", "Départ"), val: dateDebut ? new Date(dateDebut).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "—" },
    { label: t("minuteur.duration", "Durée"), val: dureePrevue ? `${dureePrevue} min` : "—" },
  ];

  return (
    <div className="lv-timer" style={{ "--tm": couleur }}>
      <div className="lv-timer__head">
        <strong>{programme || t("minuteur.running", "Lavage en cours")}</strong>
        {depasse ? (
          <span className="lv-tag is-infecte"><AlertTriangle size={11} /> {t("minuteur.over", "Dépassé")}</span>
        ) : presqueFini ? (
          <span className="lv-tag is-warn">{t("minuteur.almost", "Bientôt fini")}</span>
        ) : null}
      </div>

      <div className="lv-timer__clock">
        <output aria-live="off" aria-label={t("minuteur.elapsed", "Temps écoulé")}>{formaterTemps(elapsed)}</output>
        {dureePrevueSec && (
          <small>
            {depasse
              ? t("minuteur.overrun", "+{{temps}} de dépassement", { temps: formaterTemps(elapsed - dureePrevueSec) })
              : t("minuteur.remaining", "Reste : {{temps}}", { temps: formaterTemps(tempsRestant) })}
          </small>
        )}
      </div>

      {pct !== null && (
        <div>
          <div
            className="lv-timer__bar"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(pct)}
            aria-label={t("minuteur.progress", "Progression du programme")}
          >
            <i style={{ width: `${pct}%` }} />
          </div>
          <div className="lv-timer__scale">
            <span>0 min</span>
            <strong>{Math.round(pct)}%</strong>
            <span>{dureePrevue} min</span>
          </div>
        </div>
      )}

      <dl className="lv-timer__params">
        {parametres.map(({ label, val }) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{val}</dd>
          </div>
        ))}
      </dl>

      {depasse && (
        <div className="lv-timer__msg is-over" role="status">
          <AlertTriangle size={14} />
          {t("minuteur.program_over", "Programme terminé — vous pouvez arrêter la machine")}
        </div>
      )}

      {!depasse && pct === 100 && (
        <div className="lv-timer__msg is-ok" role="status">
          <CheckCircle2 size={14} />
          {t("minuteur.done", "Lavage terminé")}
        </div>
      )}
    </div>
  );
}
