import React from "react";
import { useTranslation } from "react-i18next";
import { Wind, Play, Square, X, Layers, Loader2, AlertTriangle, Sparkles } from "lucide-react";
import { useSechage } from "../../contextes/SechageContext";
import { machineBloquee } from "../../services/reclamationMachineService";
import { CarteCycle } from "../pages/Lavage/AtelierParts";

export default function RecapSechage() {
  const { t } = useTranslation();
  const {
    machine, lotsSelectionnes, retirerLot, poidsTotal, pctCharge,
    etape, cycleId, cycleInfo, demarrerSechage, terminerSechage, loading,
  } = useSechage();

  const niveau = pctCharge >= 90 ? "is-full" : pctCharge >= 70 ? "is-warn" : "";
  const programmeCycle = lotsSelectionnes[0]?.scanInfo || null;
  const programmesDifferents = new Set(lotsSelectionnes.map((ls) => ls.scanInfo?.programmeId ?? ls.scanInfo?.programmeRecommande ?? null)).size > 1;
  const present = (v) => v != null && v !== "" && v !== "—";

  return (
    <aside className="lv-recap" aria-label={t("recap_sechage.title", "Chargement séchoir")}>
      <header className="lv-recap__head">
        <h3><Wind size={16} /> {t("recap_sechage.title", "Chargement séchoir")}</h3>
        <span className="lv-count">{lotsSelectionnes.length}</span>
      </header>

      {machine && (
        <div className={`lv-gauge ${niveau}`}>
          <div className="lv-gauge__row">
            <span>{machine.code}</span>
            <strong>{poidsTotal.toFixed(1)} / {machine.capaciteKg} kg · {Math.round(pctCharge || 0)}%</strong>
          </div>
          <div
            className="lv-gauge__track"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(pctCharge || 0)}
            aria-label={t("recap_sechage.capacity", "Remplissage du séchoir")}
          >
            <i style={{ width: `${Math.min(pctCharge || 0, 100)}%` }} />
          </div>
          {pctCharge >= 90 && (
            <div className="lv-gauge__alert" role="status">
              <AlertTriangle size={13} /> {t("recap_chargement.almost_full", "Capacité presque atteinte")}
            </div>
          )}
        </div>
      )}

      {etape === "EN_COURS" && cycleInfo && (
        <CarteCycle
          cycle={{
            ...cycleInfo,
            id: cycleId,
            machine,
            programme: [cycleInfo.programme, cycleInfo.niveauHumidite && cycleInfo.niveauHumidite !== "—" ? `${t("recap_sechage.humidity", "Humidité")} ${cycleInfo.niveauHumidite}%` : null].filter((x) => x && x !== "—").join(" · ") || null,
            lots: lotsSelectionnes.map(({ lot }) => ({ codeLot: lot.codeLot })),
          }}
          icon={<Wind size={18} />}
        />
      )}

      {lotsSelectionnes.length === 0 ? (
        etape !== "EN_COURS" && (
          <div className="lv-empty">
            <Layers size={22} />
            <strong>{t("recap_chargement.empty", "Aucun lot sélectionné")}</strong>
            <span>{t("recap_chargement.empty_hint", "Scannez ou cliquez sur un lot")}</span>
          </div>
        )
      ) : (
        <ul className="lv-recap__list">
          {lotsSelectionnes.map(({ lot, scanInfo }) => (
            <li key={lot.codeLot}>
              <div>
                <strong>{lot.codeLot}</strong>
                <small>
                  {t(`categories.${lot.categorie}`, lot.categorie || "—")} · {(lot.poidsActuel || 0).toFixed(1)} kg
                  {scanInfo?.programmeRecommande && ` · ${scanInfo.programmeRecommande}`}
                </small>
              </div>
              {etape !== "EN_COURS" && (
                <button
                  type="button"
                  className="lv-icon-btn lv-icon-btn--danger"
                  onClick={() => retirerLot(lot.codeLot)}
                  aria-label={t("recap_chargement.remove", "Retirer le lot {{code}}", { code: lot.codeLot })}
                  title={t("recap_chargement.remove", "Retirer le lot {{code}}", { code: lot.codeLot })}
                >
                  <X size={15} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {lotsSelectionnes.length > 0 && (
        <dl className="lv-recap__totals">
          <div><dt>{t("recap_chargement.lots", "Lots")}</dt><dd>{lotsSelectionnes.length}</dd></div>
          <div><dt>{t("recap_chargement.weight", "Poids")}</dt><dd>{poidsTotal.toFixed(1)} kg</dd></div>
          <div><dt>{t("recap_sechage.fill", "Charge")}</dt><dd>{Math.round(pctCharge || 0)}%</dd></div>
        </dl>
      )}

      {etape === "LOTS" && programmeCycle?.programmeRecommande && (
        <div className={`lv-prog ${programmesDifferents ? "is-warn" : ""}`}>
          <span className="lv-prog__label"><Sparkles size={13} /> {t("recap_chargement.cycle_program", "Programme du cycle")}</span>
          <strong>{programmeCycle.programmeRecommande}</strong>
          <small>
            {[present(programmeCycle.temperature) && `${programmeCycle.temperature}°C`, present(programmeCycle.niveauHumidite) && `${t("recap_sechage.humidity", "Humidité")} ${programmeCycle.niveauHumidite}%`, present(programmeCycle.duree) && `${programmeCycle.duree} min`].filter(Boolean).join(" · ")}
          </small>
          {programmesDifferents && (
            <span className="lv-prog__warn"><AlertTriangle size={12} /> {t("recap_chargement.mixed_programs", "Lots avec des programmes différents : le programme du premier lot sera appliqué.")}</span>
          )}
        </div>
      )}

      <div className="lv-recap__actions">
        {etape === "LOTS" && (
          <button
            type="button"
            className="lv-btn lv-btn--primary lv-btn--block"
            onClick={() => demarrerSechage(poidsTotal)}
            disabled={lotsSelectionnes.length === 0 || loading || machineBloquee(machine)}
            title={machineBloquee(machine) ? t("recap_chargement.machine_blocked", "La machine {{code}} est en panne : démarrage impossible", { code: machine.code }) : undefined}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
            {t("recap_sechage.start", "Démarrer le séchage")} ({lotsSelectionnes.length})
          </button>
        )}
        {etape === "EN_COURS" && (
          <button type="button" className="lv-btn lv-btn--danger lv-btn--block" onClick={terminerSechage} disabled={loading}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Square size={15} />}
            {t("recap_sechage.finish", "Terminer le séchage")} #{cycleId}
          </button>
        )}
      </div>
    </aside>
  );
}
