import React, { useContext, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Boxes, Check, Droplets, Gauge, Layers, Loader2, Sparkles, Star, Tag, Thermometer, Timer, TriangleAlert, Wind } from "lucide-react";
import { Modal, Button } from "../kit";
import { useLavage } from "../../contextes/LavageContext";
import { useSechage } from "../../contextes/SechageContext";
import { listeQuantites } from "../../services/lavageInfecteService";
import { ProgrammeContext } from "../../contextes/ProgrammeContext";
import { programmesCandidats, versScanInfo } from "../pages/Lavage/programmeSuggestion";
import GroupeLavageBadge, { libelleOrigineProgramme } from "./shared/GroupeLavageBadge";
import "./LotInfoDialog.css";

function CarteProgramme({ programme, sechage, actif, recommande, defaut, categorieLabel, onChoisir }) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      role="radio"
      aria-checked={actif}
      className={`lid-prog ${actif ? "is-active" : ""} ${defaut && !recommande ? "is-default" : ""}`}
      onClick={() => onChoisir(programme.id)}
    >
      <span className="lid-prog__radio" aria-hidden="true">{actif && <Check size={12} strokeWidth={3} />}</span>
      <span className="lid-prog__body">
        <span className="lid-prog__top">
          <strong>{programme.nom}</strong>
          {recommande && <span className="lid-badge is-reco"><Sparkles size={11} /> {t("lot_dialog.recommended", "Recommandé")}</span>}
          {defaut && <span className="lid-badge is-default"><Star size={11} /> {t("lot_dialog.default_badge", "Par défaut")}</span>}
          {!recommande && !defaut && <span className="lid-badge"><Tag size={11} /> {categorieLabel}</span>}
        </span>
        <span className="lid-prog__specs">
          <span><Thermometer size={13} /> {programme.temperatureCelsius != null ? `${programme.temperatureCelsius}°C` : "—"}</span>
          {sechage
            ? <span><Droplets size={13} /> {programme.niveauHumidite != null ? `${programme.niveauHumidite}%` : "—"}</span>
            : <span><Gauge size={13} /> {programme.vitesseEssorageRpm != null ? `${programme.vitesseEssorageRpm} rpm` : "—"}</span>}
          <span><Timer size={13} /> {programme.dureeMinutes != null ? `${programme.dureeMinutes} min` : "—"}</span>
        </span>
        {programme.description && <span className="lid-prog__desc">{programme.description}</span>}
      </span>
    </button>
  );
}

function Contenu({ lotDialog, onFermer, onConfirmer, type = "lavage" }) {
  const { t } = useTranslation();
  const sechage = type === "sechage";
  const ctx = useContext(ProgrammeContext) || {};
  const programmesLavage = sechage ? ctx.programmesSechage : ctx.programmesLavage;
  const loadProgrammesLavage = sechage ? ctx.loadProgrammesSechage : ctx.loadProgrammesLavage;
  const [chargement, setChargement] = useState(!programmesLavage?.length);
  const [choix, setChoix] = useState(null);
  const poidsInitial = lotDialog.lot.poidsCharge ?? lotDialog.lot.poidsBalance ?? lotDialog.lotInfo?.poidsBalance ?? null;
  const [poids, setPoids] = useState(poidsInitial != null ? String(poidsInitial) : "");
  const { lotInfo, lot } = lotDialog;
  const linges = lotDialog.linges || [];
  const quantites = sechage ? (listeQuantites(lot).length ? listeQuantites(lot) : listeQuantites(lotInfo)) : [];
  const quantiteDeclaree = sechage ? (lot.quantiteDeclaree ?? lotInfo?.quantiteDeclaree ?? null) : null;
  const titreProgramme = sechage ? t("lot_dialog.choose_program_dryer", "Programme de séchage") : t("lot_dialog.choose_program", "Programme de lavage");
  const categorie = lotInfo?.categorie || lot.categorie;
  const categorieLabel = categorie ? t(`categories.${categorie}`, categorie) : "—";

  useEffect(() => {
    if (programmesLavage?.length || !loadProgrammesLavage) return undefined;
    let actif = true;
    loadProgrammesLavage().catch(() => null).finally(() => { if (actif) setChargement(false); });
    return () => { actif = false; };
  }, []);

  const candidats = useMemo(
    () => programmesCandidats(programmesLavage, categorie, lotInfo?.programmeRecommande),
    [programmesLavage, categorie, lotInfo?.programmeRecommande],
  );
  const choisiId = choix ?? candidats.initialId;
  const tous = [...candidats.suggeres, ...(candidats.defaut ? [candidats.defaut] : [])];
  const choisi = tous.find((p) => p.id === choisiId) || null;
  const aucunSuggere = candidats.suggeres.length === 0;

  const confirmer = () => {
    const origine = !choisi ? null : choisi.id === candidats.defautId && aucunSuggere ? "DEFAUT" : choisi.id === candidats.recommandeId ? "RECOMMANDE" : "CHOIX";
    const poidsCharge = poids !== "" && Number(poids) > 0 ? Number(poids) : null;
    onConfirmer({ ...lot, poidsCharge, poidsActuel: poidsCharge ?? lot.poidsActuel }, versScanInfo(lotInfo, choisi, origine === "RECOMMANDE" ? (lotInfo?.origineProgramme || origine) : origine));
  };

  const nbPieces = lot.nbLinges || lot.nbPieces || linges.length;

  return (
    <Modal
      size="md"
      icon={sechage ? <Wind size={20} /> : <Layers size={20} />}
      title={lotInfo?.codeLot || lot.codeLot}
      subtitle={[categorieLabel, lot.typeCollecte, `${Number(lot.poidsActuel || 0).toFixed(1)} kg`, nbPieces ? `${nbPieces} ${t("lot_dialog.pieces", "pcs")}` : null].filter(Boolean).join(" · ")}
      headerActions={(lotInfo?.groupeLavage || lot.groupeLavage) ? <GroupeLavageBadge groupe={lotInfo?.groupeLavage || lot.groupeLavage} /> : undefined}
      onClose={onFermer}
      footer={(
        <>
          <Button variant="secondary" onClick={onFermer}>{t("common.cancel")}</Button>
          <Button icon={<Check size={16} />} onClick={confirmer} disabled={chargement && !choisi}>
            {sechage ? t("lot_dialog_sechage.add_to_dryer", "Ajouter au séchoir") : t("lot_dialog.add_to_load")}
          </Button>
        </>
      )}
    >
      <div className="lid" data-modal="true">
        <label className="lid__poids">
          <span>{t("lot_dialog.load_weight", "Poids de chargement (kg)")}</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={poids}
            onChange={(e) => setPoids(e.target.value)}
            placeholder={t("lot_dialog.load_weight_placeholder", "Poids de la balance")}
          />
          <small>
            {(lot.poidsBalance ?? lotInfo?.poidsBalance) != null
              ? t("lot_dialog.load_weight_hint", "Proposé : poids de la balance du bac ({{kg}} kg). Modifiable.", { kg: Number(lot.poidsBalance ?? lotInfo?.poidsBalance).toFixed(2) })
              : t("lot_dialog.load_weight_none", "Aucune pesée : saisissez le poids de la charge.")}
          </small>
        </label>
        <div className="lid__head">
          <span>{titreProgramme}</span>
          {choisi && <small>{t("lot_dialog.selected_program", "Sélectionné : {{nom}}", { nom: choisi.nom })}</small>}
        </div>
        {lotInfo?.origineProgramme && !sechage && (
          <div className="lid__notice">
            <div>
              <strong>{libelleOrigineProgramme(t, lotInfo.origineProgramme)}</strong>
              {lotInfo.programmeRecommande && <span>{lotInfo.programmeRecommande}</span>}
            </div>
          </div>
        )}

        {chargement && !tous.length ? (
          <div className="lid__empty"><Loader2 size={18} className="animate-spin" /> {t("common.loading")}</div>
        ) : !tous.length ? (
          <div className="lid__notice is-warn">
            <TriangleAlert size={16} />
            <div>
              <strong>{t("lot_dialog.no_program", "Aucun programme disponible")}</strong>
              <span>{lotInfo?.programmeRecommande
                ? t("lot_dialog.server_program", "Le serveur appliquera : {{nom}}", { nom: lotInfo.programmeRecommande })
                : t("lot_dialog.no_program_hint", "Créez un programme pour cette catégorie ou un programme par défaut.")}</span>
            </div>
          </div>
        ) : (
          <div className="lid__groups" role="radiogroup" aria-label={titreProgramme}>
            {candidats.suggeres.length > 0 && (
              <section>
                <h4>{t("lot_dialog.suggested_for", "Suggérés pour {{categorie}}", { categorie: categorieLabel })}</h4>
                <div className="lid__list">
                  {candidats.suggeres.map((p) => (
                    <CarteProgramme
                      key={p.id}
                      programme={p}
                      sechage={sechage}
                      actif={p.id === choisiId}
                      recommande={p.id === candidats.recommandeId}
                      defaut={p.id === candidats.defautId}
                      categorieLabel={categorieLabel}
                      onChoisir={setChoix}
                    />
                  ))}
                </div>
              </section>
            )}

            {candidats.defaut && (
              <section>
                <h4>{t("lot_dialog.default_program", "Programme par défaut")}</h4>
                {aucunSuggere && (
                  <div className="lid__notice is-warn">
                    <TriangleAlert size={15} />
                    <div>
                      <strong>{t("lot_dialog.origin_default", "Programme par défaut — aucun programme pour la catégorie {{categorie}}", { categorie: categorieLabel })}</strong>
                      <span>{t("lot_dialog.origin_default_hint", "Vérifiez qu'il convient à ce linge.")}</span>
                    </div>
                  </div>
                )}
                <div className="lid__list">
                  <CarteProgramme
                    programme={candidats.defaut}
                    sechage={sechage}
                    actif={candidats.defaut.id === choisiId}
                    recommande={candidats.defaut.id === candidats.recommandeId}
                    defaut
                    categorieLabel={categorieLabel}
                    onChoisir={setChoix}
                  />
                </div>
              </section>
            )}
          </div>
        )}

        {(quantites.length > 0 || quantiteDeclaree != null) && (
          <div className="lid__notice is-danger">
            <TriangleAlert size={15} />
            <div>
              <strong>{t("lavage_infecte.quantities")}{quantiteDeclaree != null ? ` · ${t("lavage_infecte.total_declared")} : ${quantiteDeclaree}` : ""}</strong>
              {quantites.length > 0 && (
                <span className="lid__qtes">
                  {quantites.map((q) => <em key={q.categorie}>{t(`categories.${q.categorie}`, q.categorie)} <b>{q.quantite}</b></em>)}
                </span>
              )}
            </div>
          </div>
        )}

        {linges.length > 0 && (
          <details className="lid__linges">
            <summary><Boxes size={13} /> {linges.length} {t("lot_dialog.linens_in_bac", "linge(s) dans le bac")}</summary>
            <ul>
              {linges.map((l, i) => (
                <li key={l.id ?? l.codeBarre ?? i}>
                  <code>{l.codeBarre}</code>
                  <span>{l.categorie ? t(`categories.${l.categorie}`, l.categorie) : "—"}</span>
                  <small>{l.etat}</small>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </Modal>
  );
}

export default function LotInfoDialog() {
  const { lotDialog, setLotDialog, confirmerAjoutLot } = useLavage();
  if (!lotDialog) return null;
  return (
    <Contenu
      key={lotDialog.lot?.codeLot}
      lotDialog={lotDialog}
      onFermer={() => setLotDialog(null)}
      onConfirmer={confirmerAjoutLot}
    />
  );
}

export function LotInfoDialogSechage() {
  const { lotDialog, setLotDialog, confirmerAjoutLot } = useSechage();
  if (!lotDialog) return null;
  return (
    <Contenu
      key={lotDialog.lot?.codeLot}
      type="sechage"
      lotDialog={lotDialog}
      onFermer={() => setLotDialog(null)}
      onConfirmer={confirmerAjoutLot}
    />
  );
}
