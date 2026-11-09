import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Workflow, Lock, ArrowDownRight, Inbox, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { SettingsCard, Toggle } from "./SettingsUI";
import { DataTable, VueSwitch, useVue, Badge } from "../../../kit";
import { parcoursService, rafraichirEtapes } from "../../../../services/parcoursService";

const trierParOrdre = (a, b) => (a.ordre ?? 999) - (b.ordre ?? 999);

export function ParcoursSection() {
  const { t } = useTranslation();
  const [etapes, setEtapes] = useState([]);
  const [parcours, setParcours] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [enCours, setEnCours] = useState(null);
  const [vue, setVue] = useVue("parametres.parcours");

  const charger = useCallback(async () => {
    setChargement(true);
    try {
      const [e, p] = await Promise.all([parcoursService.getEtapes(), parcoursService.getParcours()]);
      setEtapes((Array.isArray(e) ? e : []).sort(trierParOrdre));
      setParcours(Array.isArray(p) ? p : []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => { charger(); }, [charger]);

  const parCode = useMemo(() => Object.fromEntries(parcours.map((p) => [p.code, p])), [parcours]);
  const standards = etapes.filter((e) => e.standard !== false && e.code);
  const codesStandards = standards.map((e) => e.code);

  const executer = async (cle, action, succes) => {
    setEnCours(cle);
    try {
      await action();
      toast.success(succes);
      await Promise.all([charger(), rafraichirEtapes()]);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setEnCours(null);
    }
  };

  const basculerActif = (etape) =>
    executer(
      `actif-${etape.id}`,
      () => parcoursService.activer(etape.id, !etape.actif),
      etape.actif
        ? t("parcours.disabled_ok", "Étape {{nom}} désactivée", { nom: etape.nom })
        : t("parcours.enabled_ok", "Étape {{nom}} activée", { nom: etape.nom })
    );

  const basculerSuivante = (etape, code) => {
    const actuelles = etape.suivantes || [];
    const suivantes = actuelles.includes(code) ? actuelles.filter((c) => c !== code) : [...actuelles, code];
    executer(
      `suiv-${etape.id}-${code}`,
      () => parcoursService.setSuivantes(etape.id, suivantes),
      t("parcours.next_saved", "Suivantes de {{nom}} enregistrées", { nom: etape.nom })
    );
  };

  const nomDe = (code) => etapes.find((e) => e.code === code)?.nom || code;

  const interrupteur = (etape) => {
    const verrou = etape.obligatoire || etape.standard === false;
    const info = etape.standard === false
      ? t("parcours.custom_locked", "Étape personnalisée : hors parcours")
      : t("parcours.mandatory_locked", "Étape obligatoire : elle ne peut pas être désactivée");
    return (
      <span className={`pc-switch ${verrou ? "is-locked" : ""}`} title={verrou ? info : undefined}>
        {verrou ? (
          <span className="pc-lock"><Lock size={13} /> {etape.standard === false ? t("parcours.custom", "Personnalisée") : t("parcours.mandatory", "Obligatoire")}</span>
        ) : enCours === `actif-${etape.id}` ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <Toggle checked={etape.actif !== false} onChange={() => basculerActif(etape)} label={etape.nom} />
        )}
      </span>
    );
  };

  const suivantesChips = (etape) => {
    if (etape.standard === false) return <span className="pc-muted">—</span>;
    return (
      <div className="pc-next">
        {codesStandards.filter((c) => c !== etape.code).map((code) => {
          const coche = (etape.suivantes || []).includes(code);
          const inactive = etapes.find((e) => e.code === code)?.actif === false;
          return (
            <button
              key={code}
              type="button"
              className={`pc-next__chip ${coche ? "is-on" : ""} ${inactive ? "is-inactive" : ""}`}
              aria-pressed={coche}
              disabled={!!enCours}
              onClick={() => basculerSuivante(etape, code)}
              title={inactive ? t("parcours.inactive_step", "Étape inactive") : undefined}
            >
              <span className="pc-next__box" />
              {nomDe(code)}
            </button>
          );
        })}
      </div>
    );
  };

  const accepte = (etape) => {
    const p = parCode[etape.code];
    if (!p || etape.standard === false) return <span className="pc-muted">—</span>;
    return (
      <div className="pc-accept">
        {(p.etatsAcceptes || []).length
          ? p.etatsAcceptes.map((e) => <span key={e} className="pc-state">{t(`linge_etat.${e}`, e)}</span>)
          : <span className="pc-muted">{t("parcours.entry_point", "Point d'entrée")}</span>}
        {p.etatProduit && (
          <span className="pc-produit"><ArrowDownRight size={12} /> {t(`linge_etat.${p.etatProduit}`, p.etatProduit)}</span>
        )}
      </div>
    );
  };

  return (
    <div className="param-stack">
      <SettingsCard
        icon={<Workflow size={15} />}
        title={t("parcours.title", "Parcours du linge")}
        description={t("parcours.desc", "Activez les étapes utilisées par l'établissement et définissez les étapes suivantes possibles.")}
      >
        <div className="pc-toolbar">
          <span className="pc-legend"><Lock size={12} /> {t("parcours.legend_mandatory", "Collecte, Réception, Lavage et Distribution sont obligatoires")}</span>
          <VueSwitch value={vue} onChange={setVue} />
          <button type="button" className="pc-refresh" onClick={charger} title={t("common.refresh", "Actualiser")}>
            <RefreshCw size={15} className={chargement ? "animate-spin" : ""} />
          </button>
        </div>

        {chargement && !etapes.length ? (
          <div className="pc-empty"><Loader2 size={18} className="animate-spin" /> {t("common.loading", "Chargement…")}</div>
        ) : !etapes.length ? (
          <div className="pc-empty"><Inbox size={18} /> {t("parcours.empty", "Aucune étape configurée.")}</div>
        ) : vue === "tableau" ? (
          <DataTable
            columns={{
              ordre: { label: "#", render: (e) => e.ordre ?? "—" },
              nom: { label: t("parcours.step", "Étape"), render: (e) => <strong>{e.nom}</strong> },
              zone: { label: t("parcours.zone", "Zone"), render: (e) => (e.zone ? <Badge variant="info">{e.zone}</Badge> : "—") },
              actif: { label: t("parcours.active", "Active"), render: interrupteur },
              suivantes: { label: t("parcours.next", "Suivantes possibles"), render: suivantesChips },
              accepte: { label: t("parcours.accepts", "Accepte"), render: accepte },
            }}
            rows={etapes}
            rowKey={(e) => e.id}
            rowClassName={(e) => (e.actif === false ? "kit-row-inactive" : "")}
          />
        ) : (
          <ol className="pc-flow">
            {etapes.map((etape, i) => (
              <li
                key={etape.id}
                className={`pc-step ${etape.actif === false ? "is-off" : ""} ${etape.standard === false ? "is-custom" : ""}`}
              >
                <span className="pc-step__rail">
                  <span className="pc-step__dot">{etape.ordre ?? i + 1}</span>
                </span>
                <div className="pc-step__card">
                  <div className="pc-step__head">
                    <div className="pc-step__title">
                      <h5>{etape.nom}</h5>
                      <div className="pc-step__tags">
                        {etape.code ? <code>{etape.code}</code> : <span className="pc-tag pc-tag--custom"><Sparkles size={11} /> {t("parcours.custom", "Personnalisée")}</span>}
                        {etape.zone && <span className="pc-tag">{etape.zone}</span>}
                      </div>
                    </div>
                    {interrupteur(etape)}
                  </div>
                  {etape.standard !== false && (
                    <div className="pc-step__body">
                      <div>
                        <small>{t("parcours.next", "Suivantes possibles")}</small>
                        {suivantesChips(etape)}
                      </div>
                      <div>
                        <small>{t("parcours.accepts", "Accepte")}</small>
                        {accepte(etape)}
                      </div>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </SettingsCard>
    </div>
  );
}
