import React, { useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Flag, History, PackagePlus, RefreshCw, ScanBarcode, TriangleAlert, Truck, Undo2 } from "lucide-react";
import { RemiseLingeProvider, useRemiseLinge } from "../../../contextes/RemiseLingeContext";
import { formatDate, getRemiseStatutConfig } from "../../../services/remiseLingeService";
import { useServiceName } from "../../../hooks/useServiceName";
import ApercuRemise, { CollectesConcernees } from "./ApercuRemise";
import { accentOf } from "../StockageArsenal/arsenalUtils";
import { getCategorieMeta } from "../../../constants/categoriesLinge";
import { ConfirmDialog } from "../../kit";
import {
  ToolbarCollecte, EtapesCollecte, PosteScan, PastilleEtat, LigneCollecte, BoutonIcone, BilanCollecte, nomAgentCollecte,
} from "../Collecte/shared/CollecteRc";
import "./RemiseLinge.css";

const ORDRE = ["AGENT_REMISE", "AGENT_COLLECTE", "APERCU", "SCAN"];

function RemiseLingeInner() {
  const { t } = useTranslation();
  const serviceName = useServiceName();

  const {
    agentRemise,
    agentCollecte,
    remise,
    remises,
    loading,
    scanStatus,
    etape,
    isCloturee,
    apercu,
    serviceChoisi,
    items,
    lingesRemis,
    totaux,
    scanAgentRemise,
    scanAgentCollecte,
    choisirService,
    changerAgentCollecte,
    creerRemise,
    nouvelleRemise,
    scanLinge,
    annulerLinge,
    rafraichir,
    resetAll,
    clearScanStatus,
  } = useRemiseLinge();

  const [scanValue, setScanValue] = useState("");
  const [historiqueOuvert, setHistoriqueOuvert] = useState(false);
  const [modeAnnulation, setModeAnnulation] = useState(false);
  const [aAnnuler, setAAnnuler] = useState(null);
  const scanInputRef = useRef(null);

  const showAlert = useCallback((title, text, icon = "info") => {
    const notifier = icon === "error" ? toast.error : icon === "success" ? toast.success : icon === "warning" ? toast.warning : toast.info;
    notifier(title, text ? { description: text } : undefined);
    return Promise.resolve();
  }, []);

  const handleScan = useCallback(
    async (code) => {
      if (!code?.trim()) return;

      setScanValue("");

      try {
        if (etape === "AGENT_REMISE") {
          const agent = await scanAgentRemise(code.trim());
          await showAlert(
            t('remise.agent_identified'),
            `✅ ${agent.nom} (${agent.matricule})`,
            "success",
            1500
          );
          setTimeout(() => scanInputRef.current?.focus(), 200);
          return;
        }

        if (etape === "AGENT_COLLECTE") {
          await scanAgentCollecte(code.trim(), agentRemise);
          return;
        }

        if (etape === "SCAN" && modeAnnulation) {
          await annulerLinge(code.trim());
          setTimeout(() => clearScanStatus(), 2500);
          setTimeout(() => scanInputRef.current?.focus(), 100);
          return;
        }

        if (etape === "SCAN") {
          const result = await scanLinge(code.trim());

          if (result.isComplete) {
            toast.success(t('remise.delivery_completed_title'), { description: t('remise.delivery_completed_text') });
          }

          setTimeout(() => {
            clearScanStatus();
          }, 2000);
          return;
        }
      } catch (error) {
        await showAlert(t('common.error'), error.message, "error");
        setTimeout(() => {
          clearScanStatus();
        }, 3000);
      }

      setTimeout(() => scanInputRef.current?.focus(), 100);
    },
    [etape, agentRemise, modeAnnulation, scanAgentRemise, scanAgentCollecte, scanLinge, annulerLinge, clearScanStatus, showAlert, t]
  );

  const handleAnnulerDepuisListe = async () => {
    const codeBarre = aAnnuler;
    setAAnnuler(null);
    if (!codeBarre) return;
    try {
      await annulerLinge(codeBarre);
      setTimeout(() => clearScanStatus(), 2500);
    } catch (error) {
      await showAlert(t('common.error'), error.message, "error");
      setTimeout(() => clearScanStatus(), 3000);
    }
    setTimeout(() => scanInputRef.current?.focus(), 100);
  };

  const handleCreerRemise = async () => {
    try {
      const created = await creerRemise();
      await showAlert(
        t('remise.delivery_created'),
        `${t('remise.delivery')} ${created.numeroLivraison}`,
        "success",
        2000
      );
    } catch (error) {
      await showAlert(t('common.error'), error.message, "error");
    }
    setTimeout(() => scanInputRef.current?.focus(), 200);
  };

  const collectesRemise = (apercu?.collectes || []).filter(
    (c) => remise?.service == null || String(c.serviceId) === String(remise.service)
  );

  const getPlaceholder = () => {
    if (!agentRemise) return t('remise.scan_delivery_agent');
    if (!agentCollecte) return t('remise.scan_collection_agent');
    if (etape === "SCAN" && modeAnnulation) return t('remise.scan_to_cancel');
    if (isCloturee) return t('remise.delivery_finished');
    return t('remise.scan_linen_barcode');
  };

  const isDisabled = (isCloturee && !modeAnnulation) || loading || !agentRemise || etape === "APERCU";

  const at = ORDRE.indexOf(etape);
  const stateOf = (id, termine = false) => {
    const i = ORDRE.indexOf(id);
    if (termine) return "done";
    if (i === at) return "active";
    return i < at ? "done" : "todo";
  };
  const serviceRemise = remise?.service ?? serviceChoisi;
  const nbCollectesService = (apercu?.collectes || []).filter(
    (c) => serviceRemise == null || String(c.serviceId) === String(serviceRemise)
  ).length;

  const nomAgent = nomAgentCollecte(agentRemise);
  const faites = [Boolean(agentRemise), Boolean(agentCollecte), at > 2 || isCloturee, isCloturee];
  const etapes = [
    t("remise.step_delivery_agent", "Agent de remise"),
    t("remise.step_collection_agent", "Agent de collecte"),
    t("remise.service", "Service"),
    t("remise.delivery", "Remise des linges"),
  ];

  const statutScan = !scanStatus ? null
    : scanStatus.loading ? { loading: true, code: scanStatus.code }
      : scanStatus.error ? { error: scanStatus.error }
        : scanStatus.success ? {
          success: {
            message: scanStatus.success.annule ? t("remise.linen_cancelled") : t("remise.linen_delivered_success"),
            detail: `${scanStatus.success.codeBarre} · ${t(`categories.${scanStatus.success.categorie}`, scanStatus.success.categorie)}`,
          },
        } : null;

  const heure = (d) => d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const statutRemise = remise ? getRemiseStatutConfig(remise.etat).label : null;

  const chipsPoste = etape === "SCAN" ? (
    <>
      <button type="button" className={`rc-btn rc-btn--sm ${!modeAnnulation ? "is-on" : ""}`} onClick={() => setModeAnnulation(false)} onMouseDown={(e) => e.preventDefault()}>
        <ScanBarcode size={13} /> {t("remise.mode_deliver")}
      </button>
      <button type="button" className={`rc-btn rc-btn--sm ${modeAnnulation ? "is-on rl-cancel-on" : ""}`} onClick={() => setModeAnnulation(true)} onMouseDown={(e) => e.preventDefault()}>
        <Undo2 size={13} /> {t("remise.mode_cancel")}
      </button>
    </>
  ) : null;

  const extraToolbar = (
    <>
      {remise && <span className="rc-mode"><Truck size={13} /> {remise.numeroLivraison} · {statutRemise}</span>}
      <button type="button" className="rc-btn" disabled={loading || etape !== "SCAN"} onClick={rafraichir}>
        <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> {t("common.refresh")}
      </button>
      <button type="button" className="rc-btn" disabled={loading || etape !== "SCAN"} onClick={() => { setModeAnnulation(false); nouvelleRemise(); }}>
        <PackagePlus size={15} /> {t("remise.new_delivery")}
      </button>
      <button type="button" className={`rc-btn ${historiqueOuvert ? "is-on" : ""}`} disabled={etape !== "SCAN"} onClick={() => setHistoriqueOuvert((o) => !o)}>
        <History size={15} /> {historiqueOuvert ? t("remise.hide_history") : t("remise.show_history")} ({remises.length})
      </button>
    </>
  );

  const ligneCategorie = (item) => {
    const { Icon, accent } = getCategorieMeta(item.categorie);
    const collecte = item.quantiteCollectee || 0;
    const livre = item.quantiteRemise || 0;
    const reste = Math.max(collecte - livre, 0);
    const complet = reste === 0 && collecte > 0;
    const pct = collecte > 0 ? Math.round((livre / collecte) * 100) : 0;
    return (
      <LigneCollecte
        key={item.categorie}
        icone={<Icon size={18} strokeWidth={2} />}
        accent={accent}
        titre={t(`categories.${item.categorie}`, item.categorie)}
        code={`${t("remise.total_to_deliver")} ${collecte}`}
        estompe={complet}
        etat={complet
          ? <PastilleEtat tone="ok">{t("remise.complete")}</PastilleEtat>
          : <PastilleEtat tone="warn">{t("remise.n_left", { count: reste })}</PastilleEtat>}
        actions={(
          <span className="cl-mini">
            <span className="cl-mini__bar"><i style={{ width: `${pct}%` }} /></span>
            <strong>{livre}<small>/{collecte}</small></strong>
          </span>
        )}
      />
    );
  };

  const ligneRemise = (l) => {
    const { Icon, accent } = getCategorieMeta(l.categorie);
    return (
      <LigneCollecte
        key={l.codeBarre}
        icone={<Icon size={18} strokeWidth={2} />}
        accent={accent}
        titre={t(`categories.${l.categorie}`, l.categorie)}
        code={l.codeBarre}
        etat={<PastilleEtat tone="muted">{heure(l.date)}</PastilleEtat>}
        actions={<BoutonIcone icone={<Undo2 size={16} strokeWidth={2.4} />} titre={t("remise.cancel_linen")} tone="danger" disabled={loading} onClick={() => setAAnnuler(l.codeBarre)} />}
      />
    );
  };

  return (
    <div className="collecte-container cr-page rc cc">
      <ToolbarCollecte agent={agentRemise} extra={extraToolbar} onReset={() => { setModeAnnulation(false); resetAll(); }} resetLabel={t("common.reset")} />
      <EtapesCollecte etapes={etapes} faites={faites} label={t("remise.track_title")} />

      {etape === "APERCU" && apercu ? (
        <div className="rc-main">
          <ApercuRemise
            apercu={apercu}
            agentCollecte={agentCollecte}
            serviceChoisi={serviceChoisi}
            onChoisirService={choisirService}
            onCreer={handleCreerRemise}
            onChangerAgent={changerAgentCollecte}
            loading={loading}
          />
        </div>
      ) : (
        <div className={etape === "SCAN" && remise ? "rc-layout" : ""}>
          <div className="rc-main">
            <PosteScan
              titre={t("remise.title")}
              chips={chipsPoste}
              infecte={etape === "SCAN" && modeAnnulation}
              alerte={!agentRemise ? (
                <div className="cc-alert"><TriangleAlert size={18} /><span>{t("remise.no_agent_connected")}</span></div>
              ) : null}
              scanInputRef={scanInputRef}
              value={scanValue}
              onChange={setScanValue}
              onSubmit={handleScan}
              borderColor={etape === "SCAN" && modeAnnulation ? "#e03131" : isCloturee ? "#cbd5e1" : !agentRemise ? "#e03131" : "#0d9488"}
              disabled={isDisabled}
              scanStatus={statutScan}
            />

            {etape === "SCAN" && remise && (
              <>
                {items.length > 0 && (
                  <section className="rc-card">
                    <div className="rc-card__head">
                      <h3 className="rc-card__title">{t("remise.category_details")}</h3>
                      <span className="rc-count">{items.length}</span>
                    </div>
                    <div className="cl-list">{items.map(ligneCategorie)}</div>
                  </section>
                )}

                {lingesRemis.length > 0 && (
                  <section className="rc-card">
                    <div className="rc-card__head">
                      <h3 className="rc-card__title">{t("remise.delivered_this_session")}</h3>
                      <span className="rc-count">{lingesRemis.length}</span>
                    </div>
                    <div className="cl-list">{lingesRemis.map(ligneRemise)}</div>
                  </section>
                )}

                <CollectesConcernees collectes={collectesRemise} title={t("remise.collectes_ouvertes")} />

                {historiqueOuvert && (
                  <section className="rc-card">
                    <div className="rc-card__head">
                      <h3 className="rc-card__title"><History size={15} /> {t("remise.show_history")}</h3>
                      <span className="rc-count">{remises.length}</span>
                    </div>
                    {remises.length === 0 ? (
                      <div className="rc-empty"><strong>{t("remise.no_deliveries")}</strong></div>
                    ) : (
                      <div className="cl-list">
                        {remises.map((r) => (
                          <LigneCollecte
                            key={r.id ?? r.numeroLivraison}
                            icone={<Truck size={18} strokeWidth={2} />}
                            titre={r.numeroLivraison || r.id}
                            code={`${r.agentRemiseNom || "—"} · ${formatDate(r.dateRemise)}`}
                            etat={<PastilleEtat tone="info">{getRemiseStatutConfig(r.etat).label}</PastilleEtat>}
                            actions={<span className="rl-reste"><strong>{r.nbLinges || 0}</strong><small>{t("remise.linens")}</small></span>}
                          />
                        ))}
                      </div>
                    )}
                  </section>
                )}
              </>
            )}
          </div>

          {etape === "SCAN" && remise && (
            <aside className="rc-side">
              <BilanCollecte
                titre={t("remise.delivery_progress")}
                progression={totaux.pourcentage}
                items={[
                  { label: t("remise.total_to_deliver"), value: totaux.collecte },
                  { label: t("remise.total_delivered"), value: totaux.remis },
                  { label: t("remise.remaining"), value: totaux.reste },
                  { label: t("remise.status"), value: statutRemise, texte: true },
                ]}
              />
              <div className="rc-foot">
                <span>{t("remise.agent")} : <b>{nomAgent}</b></span>
                <span>{new Date().toLocaleDateString("fr-FR")}</span>
              </div>
            </aside>
          )}
        </div>
      )}

      <ConfirmDialog
        open={!!aAnnuler}
        title={t('remise.cancel_confirm_title')}
        message={aAnnuler ? t('remise.cancel_confirm_text', { code: aAnnuler }) : ""}
        confirmLabel={t('remise.cancel_linen')}
        onConfirm={handleAnnulerDepuisListe}
        onClose={() => setAAnnuler(null)}
      />
    </div>
  );
}

export default function RemiseLinge() {
  return (
    <RemiseLingeProvider>
      <RemiseLingeInner />
    </RemiseLingeProvider>
  );
}
