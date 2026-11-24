import React, { useState, useRef, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useModal } from "../../../../contextes/ModalContext";
import { apiCall } from "../collecteUtils";
import { getAgent, isAgentConnected } from "../../../../services/agentService";
import "../../Linge/WorkflowList.css";
import { DlgBacInfecte } from "./components/dialogs/DlgBacInfecte";
import { DlgManquant } from "../shared/dialogs/DlgManquant";
import { Biohazard, Check, ClipboardCheck, Sparkles, TriangleAlert } from "lucide-react";
import {
  ToolbarCollecte, EtapesCollecte, AccueilSansAgent, PosteScan, PastilleEtat, AlerteCollecte,
  LigneCollecte, BoutonIcone, GroupesLignes, BilanCollecte, nomAgentCollecte,
} from "../shared/CollecteRc";
import { getCategorieMeta } from "../../../../constants/categoriesLinge";
import { collecteService } from "../../../../services/collecte/collecteService";
import { ResumeCollecte } from "./components/ResumeCollecte";
import { CollecteStyles } from "../shared/CollecteStyles";
import { useCircuitInfecte } from "../../../../hooks/useEstablishment";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8082';


function CollageListServiceInner({ modeChambre = false }) {
  const circuitInfecte = useCircuitInfecte();
  const { t } = useTranslation();
  const { showAlert, showConfirm } = useModal();

  const [agent, setAgent] = useState(null);
  const [collecte, setCollecte] = useState(null);
  const [bacBlanc, setBacBlanc] = useState(null);
  const [bacsDeclares, setBacsDeclares] = useState([]);
  const [scanVal, setScanVal] = useState("");
  const [loading, setLoading] = useState(false);
  const [resume, setResume] = useState(null);
  const [dlgBac, setDlgBac] = useState(false);
  const [dlgManq, setDlgManq] = useState(null);
  const [scanStatus, setScanStatus] = useState(null);

  const scanInputRef = useRef(null);

  useEffect(() => {
    const agentData = getAgent();
    if (agentData && isAgentConnected()) {
      setAgent(agentData);
      setScanStatus({
        loading: false,
        success: {
          message: `${agentData.nomPrenom || agentData.nom}`,
          detail: `${t('collecte.connected')} · ${agentData.codeBarre || agentData.matricule}`,
        },
        error: null,
      });
      setTimeout(() => setScanStatus(null), 1500);
    }
  }, [t]);

  const nbBlancs = collecte?.linges?.filter(l => l.statut === "BLANC").length || 0;
  const nbPropres = collecte?.linges?.filter(l => l.statut === "PROPRE").length || 0;
  const nbManq = collecte?.linges?.filter(l => l.statut === "MANQUANT").length || 0;
  const nbNonTr = collecte?.linges?.filter(l => !l.statut).length || 0;
  const nbInfectes = bacsDeclares.reduce((s, d) => s + (Number(d.quantiteTotale) || 0), 0);
  const totalAttendu = collecte?.nbAttendus || 0;
  const totalTraite = nbBlancs + nbPropres + nbManq + nbInfectes;
  const progression = totalAttendu > 0 ? Math.min(Math.round((totalTraite / totalAttendu) * 100), 100) : 0;

  const majLinge = useCallback((lingeId, statut) => {
    setCollecte(p =>
      p ? {
        ...p,
        linges: p.linges.map(l =>
          l.lingeId === lingeId ? { ...l, statut } : l
        ),
      } : p
    );
  }, []);

  const handleService = useCallback(async code => {
    if (!agent) {
      showAlert(
        t('collecte.errors.agent_not_connected'),
        t('collecte.errors.agent_not_connected_text'),
        "error"
      );
      return;
    }
    setLoading(true);
    setScanStatus(null);
    if (modeChambre) {
      try {
        const res = await apiCall("/api/collecte/service/chambre/ouvrir", {
          matriculeAgent: agent.codeBarre || agent.matricule,
          codeChambre: code,
        });
        const libelle = `${t('collecte.room', 'Chambre')} ${res.codeChambre || code}`;
        setCollecte({
          id: res.collecteId,
          numeroCollecte: res.numeroCollecte,
          codeChambre: res.codeChambre || code,
          chambreId: res.chambreId,
          serviceNom: libelle,
          serviceId: res.serviceId,
          nbAttendus: res.nbAttendus,
          attendusParCategorie: res.attendusParCategorie,
          linges: (res.linges || []).map(l => ({ ...l, lingeId: l.lingeId ?? l.id })),
        });
        setBacsDeclares([]);
        setBacBlanc(null);
        setScanStatus({
          loading: false,
          success: { message: libelle, detail: `${res.nbAttendus} ${t('collecte.linens')}` },
          error: null,
        });
        setTimeout(() => setScanStatus(null), 1500);
        showAlert(libelle, res.nbAttendus + " " + t('collecte.linens'), "success");
      } catch (e) {
        setScanStatus({ loading: false, success: null, error: e.message });
        showAlert(e.message, "", "error");
      } finally {
        setLoading(false);
      }
      return;
    }
    try {
      const svcRes = await fetch(
        `${API_URL}/api/services/ref/${encodeURIComponent(code)}`
      );
      const svc = svcRes.ok ? await svcRes.json() : null;
      if (!svc) {
        setScanStatus({
          loading: false,
          success: null,
          error: t('collecte.errors.service_not_found'),
        });
        showAlert(t('collecte.errors.service_not_found'), code, "error");
        return;
      }
      const res = await apiCall("/api/collecte/service/ouvrir", {
        matriculeAgent: agent.codeBarre || agent.matricule,
        serviceId: svc.id,
      });
      setCollecte({
        id: res.collecteId,
        serviceNom: res.serviceCode || svc.code,
        serviceId: res.serviceId || svc.id,
        nbAttendus: res.nbAttendus,
        linges: (res.linges || []).map(l => ({ ...l,lingeId: l.lingeId ?? l.id, })),
      });
      setBacsDeclares([]);
      setBacBlanc(null);
      setScanStatus({
        loading: false,
        success: {
          message: `${svc.code}`,
          detail: `${res.nbAttendus} ${t('collecte.linens')}`,
        },
        error: null,
      });
      setTimeout(() => setScanStatus(null), 1500);
      showAlert(
        svc.code,
        res.nbAttendus + " " + t('collecte.linens'),
        "success"
      );
    } catch (e) {
      setScanStatus({ loading: false, success: null, error: e.message });
      showAlert(e.message, "", "error");
    } finally {
      setLoading(false);
    }
  }, [agent, modeChambre, showAlert, t]);

  const handleBac = useCallback(async code => {
    setLoading(true);
    setScanStatus(null);
    try {
      const res = await apiCall(
        `/api/collecte/service/${collecte.id}/bac`,
        { codeOuTag: code }
      );
      if (res.typeBac === "INFECTE") {
        setScanStatus({
          loading: false,
          success: null,
          error: t('collecte.errors.red_bac_detected'),
        });
        showAlert(
          t('collecte.errors.red_bac_detected'),
          t('collecte.errors.scan_white_first'),
          "warning"
        );
        return;
      }
      setBacBlanc({ bacId: res.bacId, codeBac: res.codeBac });
      setScanStatus({
        loading: false,
        success: {
          message: `${t('collecte.white_bac')}`,
          detail: res.codeBac,
        },
        error: null,
      });
      setTimeout(() => setScanStatus(null), 1500);
      showAlert(t('collecte.white_bac'), res.codeBac, "success");
    } catch (e) {
      setScanStatus({ loading: false, success: null, error: e.message });
      showAlert(e.message, "", "error");
    } finally {
      setLoading(false);
    }
  }, [collecte, showAlert, t]);
const handleScanBlanc = useCallback(async code => {
  if (!bacBlanc?.bacId) {
    showAlert(t('collecte.errors.scan_white_first'), "", "warning");
    return;
  }
  setLoading(true);
  setScanStatus({ loading: true, code });
  try {
    const res = await apiCall(
      `/api/collecte/service/${collecte.id}/blanc`,
      { bacId: bacBlanc.bacId, codeOuTag: code }
    );

    // ✅ Chercher le lingeId de plusieurs manières pour être robuste
    const lingeIdCible = res.lingeId
      ?? res.id
      ?? collecte?.linges?.find(l => l.codeBarre === code)?.lingeId
      ?? collecte?.linges?.find(l => l.codeBarre === res.codeBarre)?.lingeId;

    if (lingeIdCible != null) {
      majLinge(lingeIdCible, "BLANC");
    } else {
      console.warn("⚠️ lingeId introuvable après scan BLANC :", { code, res });
    }

    setScanStatus({
      loading: false,
      success: {
        message: t('collecte.linen_scanned'),
        detail: t('collecte.added_to_white_bac'),
      },
      error: null,
    });
    setTimeout(() => setScanStatus(null), 1000);
  } catch (e) {
    setScanStatus({ loading: false, success: null, error: e.message });
    showAlert(e.message, code, "error");
  } finally {
    setLoading(false);
  }
}, [bacBlanc, collecte, showAlert, majLinge, t]);

  const handlePropre = useCallback(async linge => {
    setLoading(true);
    try {
      await apiCall(
        `/api/collecte/service/${collecte.id}/propre`,
        { codeOuTag: linge.codeBarre }
      );
      majLinge(linge.lingeId, "PROPRE");
      showAlert(t('collecte.propre'), linge.codeBarre, "info");
    } catch (e) {
      showAlert(e.message, "", "error");
    } finally {
      setLoading(false);
    }
  }, [collecte, showAlert, majLinge, t]);

  const handleManquant = useCallback(async linge => {
    setDlgManq(null);
    setLoading(true);
    try {
      await apiCall(
        `/api/collecte/service/${collecte.id}/manquant`,
        { lingeId: linge.lingeId }
      );
      majLinge(linge.lingeId, "MANQUANT");
      showAlert(t('collecte.missing'), linge.codeBarre, "warning");
    } catch (e) {
      showAlert(e.message, "", "error");
    } finally {
      setLoading(false);
    }
  }, [collecte, showAlert, majLinge, t]);

  const handleBacInfecte = useCallback(async ({ bacId, items, observations }) => {
    setLoading(true);
    try {
      const res = await collecteService.declarerQuantitesInfectees(collecte.id, {
        matriculeAgent: agent.codeBarre || agent.matricule,
        serviceId: collecte.serviceId,
        chambre: collecte.codeChambre || null,
        observations,
        bacId,
        items,
      });
      const quantiteTotale = res?.quantiteTotale ?? items.reduce((s, i) => s + i.quantiteDeclaree, 0);
      setBacsDeclares(p => [...p, { ...res, quantiteTotale, items: res?.items || items }]);
      setDlgBac(false);
      showAlert(
        t('collecte.bac_infecte.declared', 'Quantités infectées enregistrées'),
        t('collecte.bac_infecte.declared_text', 'Bac {{code}} · {{n}} pièce(s)', { code: res?.codeBac || bacId, n: quantiteTotale }),
        "warning"
      );
    } catch (e) {
      showAlert(t('collecte.bac_infecte.refused', 'Déclaration refusée'), e.message, "error");
      throw e;
    } finally {
      setLoading(false);
    }
  }, [agent, collecte, showAlert, t]);

const handleCloturer = useCallback(async () => {
  const nbBlancs = collecte?.linges?.filter(l => l.statut === "BLANC").length || 0;
  const nbBacs = bacsDeclares.length;
  const nbTraites = collecte?.linges?.filter(l => l.statut).length || 0;
  const nbPropres = collecte?.linges?.filter(l => l.statut === "PROPRE").length || 0;
  const nbManquants = collecte?.linges?.filter(l => l.statut === "MANQUANT").length || 0;

  if (nbTraites === 0 && nbBacs === 0) {
    showAlert(
      t('collecte.errors.nothing_to_close'),
      t('collecte.errors.scan_at_least_one'),
      "warning"
    );
    return;
  }

  // Construire un message récapitulatif complet
  const parts = [];
  if (nbBlancs > 0) parts.push(`${nbBlancs} ${t('collecte.white_linens')}${nbBlancs > 1 ? "s" : ""}`);
  if (nbPropres > 0) parts.push(`${nbPropres} ${t('collecte.propre')}${nbPropres > 1 ? "s" : ""}`);
  if (nbManquants > 0) parts.push(`${nbManquants} ${t('collecte.missing')}${nbManquants > 1 ? "s" : ""}`);
  if (nbBacs > 0) parts.push(t('collecte.bac_infecte.summary', '{{n}} pièce(s) infectée(s) déclarée(s)', { n: nbInfectes }));

  if (
    !(await showConfirm(
      t('collecte.close_collection'),
      parts.join(" + "),
      "question"
    ))
  )
    return;

  setLoading(true);
  try {
    const res = await apiCall(`/api/collecte/service/${collecte.id}/cloturer`);
    setResume({ ...res, serviceNom: collecte.serviceNom });
  } catch (e) {
    showAlert(e.message, "", "error");
  } finally {
    setLoading(false);
  }
}, [collecte, bacsDeclares, nbInfectes, showAlert, showConfirm, t]);

  const handleScan = useCallback(async code => {
    setScanVal("");
    if (!collecte) {
      await handleService(code);
      return;
    }
    if (!bacBlanc) {
      await handleBac(code);
      return;
    }
    await handleScanBlanc(code);
  }, [collecte, bacBlanc, handleService, handleBac, handleScanBlanc]);

  const reset = () => {
    setCollecte(null);
    setBacBlanc(null);
    setBacsDeclares([]);
    setResume(null);
    setScanVal("");
    setScanStatus(null);
    setTimeout(() => scanInputRef.current?.focus(), 200);
  };

  const getBorderColor = () => {
    if (!agent) return "#e03131";
    if (resume) return "#cbd5e1";
    return "#0d9488";
  };

  const isCloturee = !!resume;
  const isDisabled = isCloturee || loading || !agent;

  const etatLinge = (l) => {
    const map = {
      BLANC: ["ok", t("collecte.white", "Blanc")],
      PROPRE: ["info", t("collecte.propre", "Propre")],
      MANQUANT: ["warn", t("collecte.missing", "Manquant")],
      INFECTE: ["danger", t("collecte.infected", "Infecté")],
      INFECTE_PRESUME: ["danger", t("collecte.infected", "Infecté")],
    }[l.statut];
    return map ? <PastilleEtat tone={map[0]}>{map[1]}</PastilleEtat> : null;
  };

  const ligne = (l) => {
    const { Icon, accent } = getCategorieMeta(l.categorie);
    return (
      <LigneCollecte
        key={l.lingeId}
        icone={<Icon size={18} strokeWidth={2} />}
        accent={accent}
        titre={t(`categories.${l.categorie}`, l.categorie || "—")}
        code={l.codeBarre}
        estompe={Boolean(l.statut)}
        etat={etatLinge(l)}
        actions={!l.statut && (
          <>
            <BoutonIcone icone={<Check size={17} strokeWidth={2.6} />} titre={t("collecte.sale_to_white")} tone="ok" disabled={!bacBlanc?.bacId} onClick={() => handleScanBlanc(l.codeBarre)} />
            <BoutonIcone icone={<Sparkles size={16} strokeWidth={2.4} />} titre={t("collecte.propre_keep")} tone="info" onClick={() => handlePropre(l)} />
            <BoutonIcone icone={<TriangleAlert size={16} strokeWidth={2.4} />} titre={t("collecte.missing")} tone="warn" onClick={() => setDlgManq(l)} />
          </>
        )}
      />
    );
  };

  const lingesCollecte = collecte?.linges || [];
  const groupes = [
    { key: "afaire", titre: t("collecte.to_treat", "À traiter"), items: lingesCollecte.filter((l) => !l.statut), toujours: true },
    { key: "traites", titre: t("collecte.processed", "Traités"), items: lingesCollecte.filter((l) => l.statut), repliable: true, estompe: true },
  ];

  const nomAgent = nomAgentCollecte(agent);
  const etapes = [
    t("collecte.step_identify", "Identification de l'agent"),
    modeChambre ? t("collecte.room", "Chambre") : t("collecte.step_service", "Service"),
    t("collecte.step_linens", "Collecte des linges"),
    t("collecte.step_close", "Clôture"),
  ];
  const faites = [
    Boolean(agent),
    Boolean(collecte),
    Boolean(collecte) && lingesCollecte.length > 0 && nbNonTr === 0,
    isCloturee,
  ];
  const nomCollecte = modeChambre
    ? `${t("collecte.room", "Chambre")}${collecte?.codeChambre ? ` ${collecte.codeChambre}` : ""}`
    : collecte?.serviceNom;

  const chipsPoste = collecte && !isCloturee ? (
    <>
      <PastilleEtat tone="info">{nomCollecte}</PastilleEtat>
      {bacBlanc
        ? <PastilleEtat tone="ok">{t("collecte.white_bac", "Bac blanc")} · {bacBlanc.codeBac}</PastilleEtat>
        : <PastilleEtat tone="warn">{t("collecte.white_bac", "Bac blanc")} · {t("collecte.required", "requis")}</PastilleEtat>}
    </>
  ) : null;

  return (
    <div className="collecte-container cr-page rc cc">
      <DlgBacInfecte
        visible={dlgBac && circuitInfecte}
        onValider={handleBacInfecte}
        onClose={() => setDlgBac(false)}
      />
      <DlgManquant
        linge={dlgManq}
        onOk={handleManquant}
        onClose={() => setDlgManq(null)}
        title={t('collecte.missing_linen')}
        message={<>Ce linge sera marqué comme <strong>manquant</strong> dans la collecte.</>}
        confirmLabel={t('collecte.confirm_missing')}
      />

      <ToolbarCollecte agent={agent} onReset={collecte ? reset : undefined} />
      <EtapesCollecte etapes={etapes} faites={faites} label={t("collecte.steps", "Étapes de la collecte")} />

      {!agent ? (
        <AccueilSansAgent
          eyebrow={modeChambre ? t("collecte.room_collection", "Collecte chambre") : t("collecte.service_collection")}
          titre={t("collecte.no_agent_connected")}
          scanInputRef={scanInputRef}
          value={scanVal}
          onChange={setScanVal}
          onSubmit={handleScan}
        />
      ) : resume ? (
        <ResumeCollecte
          resume={resume}
          serviceNom={collecte?.serviceNom}
          nbBacs={bacsDeclares.length}
          nbInfectes={nbInfectes}
          onAutreService={() => {
            setCollecte(null);
            setBacBlanc(null);
            setBacsDeclares([]);
            setResume(null);
          }}
          onTerminer={reset}
        />
      ) : (
        <div className={collecte ? "rc-layout" : ""}>
          <div className="rc-main">
            <PosteScan
              titre={modeChambre ? t("collecte.room_collection", "Collecte chambre") : t("collecte.service_collection")}
              chips={chipsPoste}
              scanInputRef={scanInputRef}
              value={scanVal}
              onChange={setScanVal}
              onSubmit={handleScan}
              borderColor={getBorderColor()}
              disabled={isDisabled}
              scanStatus={scanStatus}
            />

            {collecte && (
              <section className="rc-card">
                <div className="rc-card__head">
                  <h3 className="rc-card__title">{t("collecte.linens_title", "Linges attendus")}</h3>
                  <span className="rc-count">{totalAttendu}</span>
                </div>
                <div className="rc-card__body">
                  <GroupesLignes groupes={groupes} rendu={ligne} videMessage={t("collecte.all_done", "Tout est traité")} />
                </div>
                <div className="cl-actions">
                  {circuitInfecte && (
                    <button type="button" className="rc-btn" onClick={() => setDlgBac(true)}>
                      <Biohazard size={15} /> {t("collecte.declare_infected", "Déclarer infecté")}
                    </button>
                  )}
                  <button
                    type="button"
                    className="rc-btn rc-btn--primary rc-btn--lg"
                    disabled={loading || (totalTraite === 0 && bacsDeclares.length === 0)}
                    onClick={handleCloturer}
                  >
                    <ClipboardCheck size={16} />
                    {nbNonTr === 0 ? t("collecte.finish_and_close", "Terminer et clôturer") : t("collecte.close_with_remaining", { count: nbNonTr, defaultValue: "Clôturer ({{count}} restant(s))" })}
                  </button>
                </div>
              </section>
            )}

            {bacsDeclares.length > 0 && (
              <section className="rc-card">
                <div className="rc-card__head">
                  <h3 className="rc-card__title"><Biohazard size={15} /> {t("collecte.bac_infecte.declared_title", "Quantités infectées déclarées")}</h3>
                  <span className="rc-count">{nbInfectes}</span>
                </div>
                {bacsDeclares.map((d, i) => (
                  <div key={`${d.bacId}-${i}`} className="cl-decl">
                    <code>{d.codeBac || `#${d.bacId}`}</code>
                    <span className="cl-decl__n">{d.quantiteTotale ?? 0}</span>
                    <span className="cl-decl__items">
                      {(d.items || []).map((it) => (
                        <span key={it.categorie}>{t(`categories.${it.categorie}`, it.categorie)} · {it.quantiteDeclaree}</span>
                      ))}
                    </span>
                  </div>
                ))}
              </section>
            )}
          </div>

          {collecte && (
            <aside className="rc-side">
              <BilanCollecte
                titre={t("collecte.balance", "Bilan de la collecte")}
                progression={progression}
                items={[
                  { label: t("collecte.expected", "Attendus"), value: totalAttendu },
                  { label: t("collecte.white", "Blancs"), value: nbBlancs },
                  { label: t("collecte.propre", "Propres"), value: nbPropres },
                  { label: t("collecte.missing", "Manquants"), value: nbManq },
                  ...(circuitInfecte ? [{ label: t("collecte.infected", "Infectés"), value: nbInfectes, tone: "danger" }] : []),
                  { label: t("collecte.remaining", "Restants"), value: nbNonTr },
                ]}
              />
              <div className="rc-foot">
                <span>{t("collecte.agent", "Agent")} : <b>{nomAgent}</b></span>
                <span>{new Date().toLocaleDateString("fr-FR")}</span>
              </div>
            </aside>
          )}
        </div>
      )}

      <CollecteStyles />
    </div>
  );
}

export default function CollageListService({ modeChambre = false }) {
  return <CollageListServiceInner modeChambre={modeChambre} />;
}
