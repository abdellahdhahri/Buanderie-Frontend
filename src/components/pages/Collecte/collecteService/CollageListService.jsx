import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useModal } from "../../../../contextes/ModalContext";
import { apiCall } from "../collecteUtils";
import { getAgent, isAgentConnected } from "../../../../services/agentService";
import "../../Linge/WorkflowList.css";
import { DlgSacInfecte } from "./components/dialogs/DlgSacInfecte";
import { DlgManquant } from "../shared/dialogs/DlgManquant";
import { CollecteHeader } from "../shared/CollecteHeader";
import { Icons } from "../shared/icons";
import { CollecteInfoBar } from "./components/CollecteInfoBar";
import { ZoneScan } from "../shared/ZoneScan";
import { MessagesEtape } from "./components/MessagesEtape";
import { ProgressionCollecte } from "./components/ProgressionCollecte";
import { StatistiquesCollecte } from "./components/StatistiquesCollecte";
import { SacsDeclares } from "./components/SacsDeclares";
import { FiltresLinges } from "./components/FiltresLinges";
import { ListeLinges } from "./components/ListeLinges";
import { ActionsCollecte } from "./components/ActionsCollecte";
import { ResumeCollecte } from "./components/ResumeCollecte";
import { CollecteStyles } from "../shared/CollecteStyles";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8082';


function CollageListServiceInner() {
  const { t } = useTranslation();
  const { showAlert, showConfirm } = useModal();

  const [agent, setAgent] = useState(null);
  const [collecte, setCollecte] = useState(null);
  const [bacBlanc, setBacBlanc] = useState(null);
  const [sacsDeclares, setSacsDeclares] = useState([]);
  const [scanVal, setScanVal] = useState("");
  const [loading, setLoading] = useState(false);
  const [resume, setResume] = useState(null);
  const [dlgSac, setDlgSac] = useState(false);
  const [dlgManq, setDlgManq] = useState(null);
  const [scanStatus, setScanStatus] = useState(null);
  const [filter, setFilter] = useState("all");

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
  const nbInfectes = sacsDeclares.reduce((s, sac) => s + (sac.quantite || 0), 0);
  const totalAttendu = collecte?.nbAttendus || 0;
  const totalTraite = nbBlancs + nbPropres + nbManq + nbInfectes;
  const progression = totalAttendu > 0 ? Math.min(Math.round((totalTraite / totalAttendu) * 100), 100) : 0;

  const filteredLinges = useMemo(() => {
    if (!collecte?.linges) return [];
    if (filter === "all") return collecte.linges;
    if (filter === "untreated") return collecte.linges.filter(l => !l.statut);
    return collecte.linges.filter(l => l.statut === filter.toUpperCase());
  }, [collecte, filter]);

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
      setSacsDeclares([]);
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
  }, [agent, showAlert, t]);

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

  const handleSacInfecte = useCallback(async ({ bacId, items }) => {
    setDlgSac(false);
    setLoading(true);
    try {
      const res = await apiCall(
        `/api/collecte/service/${collecte.id}/infecte`,
        {},
        "POST",
        {
          matriculeAgent: agent.codeBarre || agent.matricule,
          serviceId: collecte.serviceId,
          bacId,
          items,
        }
      );
      setSacsDeclares(p => [
        ...p,
        {
          ...res,
          categorie: items[0]?.categorie,
          quantite: items[0]?.quantiteDeclaree,
        },
      ]);
      const c = items[0];
      showAlert(
        t('collecte.sac_declared'),
        `${c?.quantiteDeclaree} ${c?.categorie?.toLowerCase() || t('collecte.linen')}${
          c?.quantiteDeclaree > 1 ? "s" : ""
        }`,
        "warning"
      );
    } catch (e) {
      showAlert(e.message, "", "error");
    } finally {
      setLoading(false);
    }
  }, [agent, collecte, showAlert, t]);

const handleCloturer = useCallback(async () => {
  const nbBlancs = collecte?.linges?.filter(l => l.statut === "BLANC").length || 0;
  const nbSacs = sacsDeclares.length;
  const nbTraites = collecte?.linges?.filter(l => l.statut).length || 0;
  const nbPropres = collecte?.linges?.filter(l => l.statut === "PROPRE").length || 0;
  const nbManquants = collecte?.linges?.filter(l => l.statut === "MANQUANT").length || 0;

  // ✅ Condition corrigée : au moins 1 linge traité (BLANC, PROPRE, MANQUANT) OU 1 sac
  if (nbTraites === 0 && nbSacs === 0) {
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
  if (nbSacs > 0) parts.push(`${nbSacs} ${t('collecte.infected_sacs')}${nbSacs > 1 ? "s" : ""}`);

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
}, [collecte, sacsDeclares, showAlert, showConfirm, t]);

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
    setSacsDeclares([]);
    setResume(null);
    setScanVal("");
    setScanStatus(null);
    setFilter("all");
    setTimeout(() => scanInputRef.current?.focus(), 200);
  };

  const getPlaceholder = () => {
    if (!agent) return t('collecte.agent_not_connected');
    if (!collecte) return t('collecte.scan_service_code');
    if (!bacBlanc) return t('collecte.scan_white_bac');
    if (resume) return t('collecte.collection_closed');
    return t('collecte.scan_white_linens');
  };

  const getBorderColor = () => {
    if (!agent) return "#dc2626";
    if (resume) return "#e2e8f0";
    return "#14b8a6";
  };

  const isCloturee = !!resume;
  const isDisabled = isCloturee || loading || !agent;

  return (
    <div className="collecte-container">
      <DlgSacInfecte
        visible={dlgSac}
        collecteId={collecte?.id}
        onValider={handleSacInfecte}
        onClose={() => setDlgSac(false)}
      />
      <DlgManquant
        linge={dlgManq}
        onOk={handleManquant}
        onClose={() => setDlgManq(null)}
        title={t('collecte.missing_linen')}
        message={<>Ce linge sera marqué comme <strong>manquant</strong> dans la collecte.</>}
        confirmLabel={t('collecte.confirm_missing')}
      />

      <CollecteHeader
        icon={<Icons.Building size={28} color="white" strokeWidth={2.2} />}
        title={t('collecte.service_collection')}
        agent={agent}
        agentLabel={t('collecte.agent')}
        noAgentLabel={t('collecte.no_agent_connected')}
        accent="#0d9488"
      />

      <div style={{
        background: "white", borderRadius: 24, padding: 30,
        border: "1px solid #e2e8f0",
        boxShadow: "0 12px 40px rgba(15,23,42,0.06)",
      }}>
        <CollecteInfoBar
          agent={agent}
          collecte={collecte}
          bacBlanc={bacBlanc}
          totalAttendu={totalAttendu}
          onReset={reset}
        />

        <ZoneScan
          scanInputRef={scanInputRef}
          placeholder={getPlaceholder()}
          value={scanVal}
          onChange={setScanVal}
          onSubmit={handleScan}
          borderColor={getBorderColor()}
          disabled={isDisabled}
          isCloturee={isCloturee}
          showShimmer={!isCloturee && !!bacBlanc}
          scanStatus={scanStatus}
        />

        <MessagesEtape
          agent={agent}
          collecte={collecte}
          bacBlanc={bacBlanc}
          resume={resume}
        />

        {collecte && !resume && (
          <ProgressionCollecte
            totalTraite={totalTraite}
            totalAttendu={totalAttendu}
            progression={progression}
          />
        )}

        {collecte && !resume && (
          <StatistiquesCollecte
            nbBlancs={nbBlancs}
            nbInfectes={nbInfectes}
            nbPropres={nbPropres}
            nbManq={nbManq}
            nbNonTr={nbNonTr}
            nbAttendus={collecte.nbAttendus}
            totalAttendu={totalAttendu}
            nbSacs={sacsDeclares.length}
            filter={filter}
            onFilter={setFilter}
          />
        )}

        {sacsDeclares.length > 0 && (
          <SacsDeclares sacs={sacsDeclares} nbInfectes={nbInfectes} />
        )}

        {collecte && !resume && (
          <>
            <FiltresLinges
              filter={filter}
              onFilter={setFilter}
              count={filteredLinges.length}
            />

            <ListeLinges
              linges={filteredLinges}
              bacBlanc={bacBlanc}
              onBlanc={handleScanBlanc}
              onPropre={handlePropre}
              onManquant={x => setDlgManq(x)}
            />

            <ActionsCollecte
              nbNonTr={nbNonTr}
              loading={loading}
              // ✅ Désactiver si AUCUN linge traité ET aucun sac déclaré
              canClose={!(totalTraite === 0 && sacsDeclares.length === 0)}
              onDeclarerSac={() => setDlgSac(true)}
              onCloturer={handleCloturer}
            />
          </>
        )}

        {resume && (
          <ResumeCollecte
            resume={resume}
            serviceNom={collecte?.serviceNom}
            nbSacs={sacsDeclares.length}
            nbInfectes={nbInfectes}
            onAutreService={() => {
              setCollecte(null);
              setBacBlanc(null);
              setSacsDeclares([]);
              setResume(null);
              setFilter("all");
            }}
            onTerminer={reset}
          />
        )}
      </div>

      <CollecteStyles />
    </div>
  );
}

export default function CollageListService() {
  return <CollageListServiceInner />;
}
