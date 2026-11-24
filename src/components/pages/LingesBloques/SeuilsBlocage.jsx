import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Info, Loader2, RefreshCw, RotateCcw, Save, Timer } from "lucide-react";
import { fetchSeuilsBlocage, majSeuilBlocage } from "../../../services/analyseService";
import { formatDuree, libelleEtat } from "./lingesBloquesUtils";
import "./LingesBloques.css";

const versBrouillon = (s) => ({ dureeMaxHeures: String(s.dureeMaxHeures ?? ""), actif: s.actif !== false });

export default function SeuilsBlocage() {
  const { t } = useTranslation();
  const [seuils, setSeuils] = useState([]);
  const [brouillons, setBrouillons] = useState({});
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [enCours, setEnCours] = useState(null);

  const charger = useCallback(async () => {
    setChargement(true);
    try {
      const liste = await fetchSeuilsBlocage();
      setSeuils(liste);
      setBrouillons(Object.fromEntries(liste.map((s) => [s.etat, versBrouillon(s)])));
      setErreur(null);
    } catch (e) {
      setErreur(e.message);
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    const id = setTimeout(charger, 0);
    return () => clearTimeout(id);
  }, [charger]);

  const modifier = (etat, champ, valeur) => setBrouillons((b) => ({ ...b, [etat]: { ...b[etat], [champ]: valeur } }));

  const valeurValide = (v) => {
    const n = Number(v);
    return v !== "" && Number.isFinite(n) && n > 0;
  };

  const estModifie = (s) => {
    const b = brouillons[s.etat];
    if (!b) return false;
    return Number(b.dureeMaxHeures) !== Number(s.dureeMaxHeures) || b.actif !== (s.actif !== false);
  };

  const enregistrer = async (s) => {
    const b = brouillons[s.etat];
    if (!valeurValide(b.dureeMaxHeures)) {
      toast.error(t("linges_bloques.thresholds.invalid", "La durée max doit être supérieure à 0."));
      return;
    }
    setEnCours(s.etat);
    try {
      const maj = await majSeuilBlocage(s.etat, { dureeMaxHeures: Number(b.dureeMaxHeures), actif: b.actif });
      const nouveau = maj && typeof maj === "object" && maj.etat ? maj : { ...s, dureeMaxHeures: Number(b.dureeMaxHeures), actif: b.actif };
      setSeuils((liste) => liste.map((x) => (x.etat === s.etat ? nouveau : x)));
      setBrouillons((br) => ({ ...br, [s.etat]: versBrouillon(nouveau) }));
      toast.success(t("linges_bloques.thresholds.saved", "Seuil « {{etat}} » enregistré", { etat: libelleEtat(t, s.etat) }));
    } catch (e) {
      toast.error(e.message);
    } finally {
      setEnCours(null);
    }
  };

  const annuler = (s) => setBrouillons((b) => ({ ...b, [s.etat]: versBrouillon(s) }));

  const nbModifies = seuils.filter(estModifie).length;

  return (
    <div className="rh-param rh-seuils">
      <div className="rh-seuils__bar">
        <span className="rh-seuils__info">
          <Timer size={14} />
          {nbModifies > 0
            ? t("linges_bloques.thresholds.pending", "{{count}} ligne(s) modifiée(s) non enregistrée(s)", { count: nbModifies })
            : t("linges_bloques.thresholds.compact_hint", "{{count}} seuil(s) · durée max en heures avant alerte", { count: seuils.length })}
        </span>
        <button
          type="button"
          className="rh-seuils__refresh"
          onClick={charger}
          aria-label={t("common.refresh", "Actualiser")}
          title={t("common.refresh", "Actualiser")}
        >
          <RefreshCw size={14} className={chargement ? "animate-spin" : ""} />
        </button>
      </div>

      {chargement && seuils.length === 0 && <p className="rh-seuils__vide">{t("common.loading", "Chargement…")}</p>}
      {!chargement && erreur && <p className="rh-seuils__vide is-erreur">{erreur}</p>}
      {!chargement && !erreur && seuils.length === 0 && <p className="rh-seuils__vide">{t("linges_bloques.thresholds.empty", "Aucun seuil configuré")}</p>}

      {seuils.length > 0 && (
        <ul className="rh-seuils__grid">
          <li className="rh-seuil rh-seuil--head" aria-hidden="true">
            <span>{t("linges_bloques.thresholds.state", "État")}</span>
            <span>{t("linges_bloques.thresholds.max_duration", "Durée max (heures)")}</span>
            <span />
            <span>{t("linges_bloques.thresholds.active", "Actif")}</span>
            <span />
          </li>
          {seuils.map((s) => {
            const b = brouillons[s.etat] || versBrouillon(s);
            const modifie = estModifie(s);
            const valide = valeurValide(b.dureeMaxHeures);
            const occupe = enCours === s.etat;
            const idChamp = `seuil-${s.etat}`;
            return (
              <li key={s.id ?? s.etat} className={`rh-seuil ${modifie ? "is-dirty" : ""} ${b.actif ? "" : "is-off"}`}>
                <div className="rh-seuil__id">
                  <label htmlFor={idChamp}>{libelleEtat(t, s.etat)}</label>
                  <span className="matricule-badge">{s.etat}</span>
                  {s.etat === "LIVRE" && (
                    <span className="rh-seuil__note" title={t("linges_bloques.thresholds.livre_note", "S'applique uniquement aux linges remis non rangés à l'arsenal")}>
                      <Info size={13} />
                      <span>{t("linges_bloques.thresholds.livre_note", "S'applique uniquement aux linges remis non rangés à l'arsenal")}</span>
                    </span>
                  )}
                </div>
                <div className="rh-seuil__ctrl">
                  <div className={`rh-param__input ${valide ? "" : "is-invalid"}`} title={valide ? `≈ ${formatDuree(Number(b.dureeMaxHeures))}` : t("linges_bloques.thresholds.invalid", "La durée max doit être supérieure à 0.")}>
                    <input
                      id={idChamp}
                      type="number"
                      min="1"
                      step="1"
                      inputMode="numeric"
                      value={b.dureeMaxHeures}
                      onChange={(e) => modifier(s.etat, "dureeMaxHeures", e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && modifie && valide) enregistrer(s); }}
                      aria-invalid={!valide}
                      disabled={occupe}
                    />
                    <span className="operator-box">h</span>
                  </div>
                  <small className={`rh-seuil__equiv ${valide ? "" : "is-erreur"}`}>{valide ? formatDuree(Number(b.dureeMaxHeures)) : "> 0"}</small>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={b.actif}
                    aria-label={`${t("linges_bloques.thresholds.active", "Actif")} · ${libelleEtat(t, s.etat)}`}
                    title={b.actif ? t("linges_bloques.thresholds.on", "Actif") : t("linges_bloques.thresholds.off", "Inactif")}
                    className={`rh-switch ${b.actif ? "is-on" : ""}`}
                    onClick={() => modifier(s.etat, "actif", !b.actif)}
                    disabled={occupe}
                  >
                    <span />
                  </button>
                  <div className="rh-seuil__actions">
                    {modifie && (
                      <button
                        type="button"
                        className="h-action-btn view"
                        onClick={() => annuler(s)}
                        disabled={occupe}
                        aria-label={t("common.cancel", "Annuler")}
                        title={t("common.cancel", "Annuler")}
                      >
                        <RotateCcw size={14} />
                      </button>
                    )}
                    <button
                      type="button"
                      className="h-action-btn add"
                      onClick={() => enregistrer(s)}
                      disabled={!modifie || !valide || occupe}
                      aria-label={`${t("common.save", "Enregistrer")} · ${libelleEtat(t, s.etat)}`}
                      title={t("common.save", "Enregistrer")}
                    >
                      {occupe ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
