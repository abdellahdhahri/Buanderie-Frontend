import React from "react";
import { useTranslation } from "react-i18next";
import { WashingMachine, Play, Square, X, Layers, Loader2, AlertTriangle, Sparkles } from "lucide-react";
import { useLavage } from "../../contextes/LavageContext";
import { CarteCycle } from "../pages/Lavage/AtelierParts";
import ProduitsUtilises from "../pages/Lavage/ProduitsUtilises";
import { machineBloquee } from "../../services/reclamationMachineService";
import GroupeLavageBadge from "./shared/GroupeLavageBadge";

export default function RecapChargement() {
  const { t } = useTranslation();
  const {
    machine, lotsSelectionnes, retirerLot,
    poidsTotal, pctCharge, etapeBlanc, cycleId, cycleInfo,
    demarrerLavage, terminerLavage, loading,
  } = useLavage();

  const niveau = pctCharge >= 90 ? "is-full" : pctCharge >= 70 ? "is-warn" : "";
  const nbPieces = lotsSelectionnes.reduce((s, ls) => s + (ls.lot.nbLinges || ls.lot.nbPieces || 0), 0);
  const programmeCycle = lotsSelectionnes[0]?.scanInfo || null;
  const programmesDifferents = new Set(lotsSelectionnes.map((ls) => ls.scanInfo?.programmeId ?? ls.scanInfo?.programmeRecommande ?? null)).size > 1;

  return (
    <aside className="lv-recap" aria-label={t("recap_chargement.title", "Chargement machine")}>
      <header className="lv-recap__head">
        <h3><WashingMachine size={16} /> {t("recap_chargement.title", "Chargement machine")}</h3>
        <span className="lv-count">{lotsSelectionnes.length}</span>
      </header>

      {machine && (
        <div className={`lv-gauge ${niveau}`}>
          <div className="lv-gauge__row">
            <span>{machine.code}</span>
            <strong>{poidsTotal.toFixed(1)} / {machine.capaciteKg} kg</strong>
          </div>
          <div
            className="lv-gauge__track"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(pctCharge || 0)}
            aria-label={t("recap_chargement.capacity", "Remplissage de la machine")}
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

      {lotsSelectionnes.length === 0 ? (
        <div className="lv-empty">
          <Layers size={22} />
          <strong>{t("recap_chargement.empty", "Aucun lot sélectionné")}</strong>
          <span>{t("recap_chargement.empty_hint", "Scannez ou cliquez sur un lot")}</span>
        </div>
      ) : (
        <ul className="lv-recap__list">
          {lotsSelectionnes.map(({ lot, scanInfo }) => (
            <li key={lot.codeLot}>
              <div>
                <strong>{lot.codeLot} <GroupeLavageBadge groupe={scanInfo?.groupeLavage || lot.groupeLavage} /></strong>
                <small>
                  {t(`categories.${lot.categorie}`, lot.categorie || "—")} · {lot.poidsActuel?.toFixed(1) || 0} kg
                  {scanInfo?.programmeRecommande && ` · ${scanInfo.programmeRecommande}`}
                </small>
              </div>
              {etapeBlanc === "LOTS" && (
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
          <div><dt>{t("recap_chargement.pieces", "Pièces")}</dt><dd>{nbPieces}</dd></div>
        </dl>
      )}

      {etapeBlanc === "EN_COURS" && cycleInfo && (
        <CarteCycle
          cycle={{ ...cycleInfo, id: cycleId, machine, lots: lotsSelectionnes.map(({ lot }) => ({ codeLot: lot.codeLot })) }}
          icon={<WashingMachine size={18} />}
        />
      )}

      {etapeBlanc === "LOTS" && programmeCycle?.programmeRecommande && (
        <div className={`lv-prog ${programmesDifferents ? "is-warn" : ""}`}>
          <span className="lv-prog__label"><Sparkles size={13} /> {t("recap_chargement.cycle_program", "Programme du cycle")}</span>
          <strong>{programmeCycle.programmeRecommande}</strong>
          <small>
            {[programmeCycle.temperature != null && programmeCycle.temperature !== "" && `${programmeCycle.temperature}°C`, programmeCycle.vitesse != null && programmeCycle.vitesse !== "" && `${programmeCycle.vitesse} rpm`, programmeCycle.duree != null && programmeCycle.duree !== "" && `${programmeCycle.duree} min`].filter(Boolean).join(" · ")}
          </small>
          {programmesDifferents && (
            <span className="lv-prog__warn"><AlertTriangle size={12} /> {t("recap_chargement.mixed_programs", "Lots avec des programmes différents : le programme du premier lot sera appliqué.")}</span>
          )}
        </div>
      )}

      {etapeBlanc === "LOTS" && <ProduitsUtilises disabled={loading} />}

      <div className="lv-recap__actions">
        {etapeBlanc === "LOTS" && (
          <button
            type="button"
            className="lv-btn lv-btn--primary lv-btn--block"
            onClick={() => demarrerLavage(poidsTotal)}
            disabled={loading || lotsSelectionnes.length === 0 || machineBloquee(machine)}
            title={machineBloquee(machine) ? t("recap_chargement.machine_blocked", "La machine {{code}} est en panne : démarrage impossible", { code: machine.code }) : undefined}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
            {t("recap_chargement.start", "Démarrer le lavage")}
          </button>
        )}
        {etapeBlanc === "EN_COURS" && (
          <button type="button" className="lv-btn lv-btn--danger lv-btn--block" onClick={terminerLavage} disabled={loading}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Square size={15} />}
            {t("recap_chargement.finish", "Fin du lavage")}
          </button>
        )}
      </div>
    </aside>
  );
}
