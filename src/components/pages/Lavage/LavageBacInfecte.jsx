import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import ProduitsUtilises from "./ProduitsUtilises";
import { machineBloquee } from "../../../services/reclamationMachineService";
import { AlertTriangle, Biohazard, Loader2, Lock, Play, ShieldCheck, Weight, X } from "lucide-react";

const poidsDuBac = (bac) => bac?.poidsActuel ?? bac?.poids ?? bac?.poidsTotal ?? null;

export function CarteBacInfecte({ bac }) {
  const { t } = useTranslation();
  const poids = poidsDuBac(bac);
  return (
    <div className="lv-sac lvb-bac" aria-pressed="true">
      <div className="lv-sac__head">
        <Biohazard size={16} color="#b91c1c" aria-hidden="true" />
        <strong>{bac.code}</strong>
        <span className="lv-tag is-infecte">{t("lavage_infecte.source_BAC_INFECTE")}</span>
      </div>
      <dl className="lv-sac__meta">
        <div><dt>{t("lavage.state", "État")}</dt><dd>{bac.etat ? t(`bac_status.${bac.etat}`, bac.etat) : "—"}</dd></div>
        <div><dt>{t("lavage_infecte.weight_bac")}</dt><dd>{poids != null ? `${Number(poids).toFixed(1)} kg` : "—"}</dd></div>
      </dl>
    </div>
  );
}

export function RecapBacInfecte({ bac, machine, onRetirer, onDemarrer }) {
  const { t } = useTranslation();
  const [poids, setPoids] = useState("");
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState(null);
  const poidsBac = poidsDuBac(bac);

  const demarrer = async () => {
    setBusy(true);
    setErreur(null);
    try {
      await onDemarrer(poids === "" ? null : Number(poids));
    } catch (err) {
      setErreur(err.message);
      setBusy(false);
    }
  };

  return (
    <aside className="lv-recap lvb-recap" aria-label={t("lavage_infecte.title")}>
      <header className="lv-recap__head">
        <h3><Biohazard size={16} /> {t("lavage_infecte.title")}</h3>
      </header>

      <ul className="lv-recap__list">
        <li>
          <div>
            <strong>{bac.code}</strong>
            <small>{t("lavage_infecte.source_BAC_INFECTE")}{poidsBac != null ? ` · ${Number(poidsBac).toFixed(1)} kg` : ""}</small>
          </div>
          <button
            type="button"
            className="lv-icon-btn lv-icon-btn--danger"
            onClick={onRetirer}
            disabled={busy}
            aria-label={t("common.remove", "Retirer")}
            title={t("common.remove", "Retirer")}
          >
            <X size={15} />
          </button>
        </li>
      </ul>

      <div className="lvb-field">
        <label htmlFor="lvb-programme">{t("lavage_infecte.programme")}</label>
        <div className="lvb-readonly" id="lvb-programme">
          <ShieldCheck size={16} />
          <strong>{t("lavage_infecte.programme_value")}</strong>
          <span><Lock size={12} /> {t("lavage_infecte.programme_hint")}</span>
        </div>
      </div>

      <ProduitsUtilises disabled={busy} />

      <div className="lvb-field" data-modal="true">
        <label htmlFor="lvb-poids">{t("lavage_infecte.weight")}</label>
        <div className="lvb-input">
          <Weight size={16} aria-hidden="true" />
          <input
            id="lvb-poids"
            type="number"
            min="0"
            step="0.1"
            inputMode="decimal"
            value={poids}
            onChange={(e) => setPoids(e.target.value)}
            placeholder={poidsBac != null ? Number(poidsBac).toFixed(1) : "—"}
            disabled={busy}
          />
          <span>kg</span>
        </div>
        <small>{t("lavage_infecte.weight_hint")}</small>
      </div>

      {erreur && (
        <div className="lv-alert" role="alert">
          <AlertTriangle size={16} />
          <div>
            <strong>{t("lavage_infecte.error_title")}</strong>
            <span>{erreur}</span>
          </div>
        </div>
      )}

      <div className="lv-recap__actions">
        <button type="button" className="lv-btn lv-btn--danger lv-btn--block" onClick={demarrer} disabled={busy || machineBloquee(machine)}>
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
          {busy ? t("lavage_infecte.starting") : t("lavage_infecte.start")}
        </button>
      </div>
    </aside>
  );
}
