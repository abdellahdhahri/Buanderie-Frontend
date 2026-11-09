import React, { useState, useRef, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useModal } from "../../../../contextes/ModalContext";
import { apiCall } from "../collecteUtils";
import { getAgent, isAgentConnected } from "../../../../services/agentService";
import "../../Linge/WorkflowList.css";
import { Icons } from "../shared/icons";
import { CollecteHeader } from "../shared/CollecteHeader";
import { ZoneScan } from "../shared/ZoneScan";
import { CollecteStyles } from "../shared/CollecteStyles";
import { DlgManquant } from "../shared/dialogs/DlgManquant";
import { UniformeInfoBar } from "./components/UniformeInfoBar";
import { StatistiquesUniforme } from "./components/StatistiquesUniforme";
import { MessagesEtapeUniforme } from "./components/MessagesEtapeUniforme";
import { UniformeEnCours } from "./components/UniformeEnCours";
import { BoutonCloturer } from "./components/BoutonCloturer";
import { ResumeUniforme } from "./components/ResumeUniforme";
import { ListeUniformes } from "./components/ListeUniformes";


/* ═══════════════════════════════════════════════════════════════════════════
   PAGE PRINCIPALE
   ═══════════════════════════════════════════════════════════════════════════ */
function CollageListUniformeInner() {
  const { t } = useTranslation();
  const { showAlert, showConfirm } = useModal();

  const [etape, setEtape] = useState("BADGE");
  const [agent, setAgent] = useState(null);
  const [collecte, setCollecte] = useState(null);
  const [uniformeEnCours, setUniformeEnCours] = useState(null);
  const [scanVal, setScanVal] = useState("");
  const [loading, setLoading] = useState(false);
  const [resume, setResume] = useState(null);
  const [dlgManq, setDlgManq] = useState(null);
  const [scanStatus, setScanStatus] = useState(null);

  const agentRef = useRef(null);
  const collecteRef = useRef(null);
  const scanInputRef = useRef(null);
  const scanTimeoutRef = useRef(null);

  useEffect(() => { agentRef.current = agent; }, [agent]);
  useEffect(() => { collecteRef.current = collecte; }, [collecte]);

  useEffect(() => {
    const agentData = getAgent();
    if (agentData && isAgentConnected()) {
      const ag = {
        matricule: agentData.codeBarre || agentData.matricule,
        nom: agentData.nom || "Inconnu",
        prenom: agentData.prenom || "",
        nomPrenom: agentData.nomPrenom || agentData.nom || "Inconnu",
        codeBarre: agentData.codeBarre || agentData.matricule,
        id: agentData.id,
        poste: agentData.poste || "AGENT_COLLECTE"
      };
      setAgent(ag);
      setEtape("BADGE");
      setScanStatus({
        loading: false,
        success: {
          message: `${ag.nomPrenom || ag.nom}`,
          detail: `${t('collecte_uniforme.connected')} · ${ag.codeBarre || ag.matricule}`
        },
        error: null
      });
      setTimeout(() => setScanStatus(null), 2000);
    } else {
      setEtape("BADGE");
      setScanStatus({
        loading: false,
        success: null,
        error: t('collecte_uniforme.no_agent_connected')
      });
    }
  }, [t]);

  useEffect(() => {
    if (scanVal.trim().length < 2) return;
    clearTimeout(scanTimeoutRef.current);
    scanTimeoutRef.current = setTimeout(() => {
      const code = scanVal.trim();
      setScanVal("");
      handleScan(code);
    }, 300);
    return () => clearTimeout(scanTimeoutRef.current);
  }, [scanVal]);

  useEffect(() => {
    const keepFocus = () => {
      if (scanInputRef.current && !document.querySelector('[data-modal="true"]')) {
        scanInputRef.current.focus();
      }
    };
    const id = setInterval(keepFocus, 500);
    keepFocus();
    return () => clearInterval(id);
  }, []);

  const majUniforme = useCallback((lingeId, statut) => {
    setCollecte(p => p ? {
      ...p,
      uniformes: p.uniformes.map(u => u.lingeId === lingeId ? { ...u, statut } : u)
    } : p);
  }, []);

  const handleBadge = useCallback(async (code) => {
    if (!agent) {
      showAlert(
        t('collecte_uniforme.errors.agent_not_connected'),
        t('collecte_uniforme.errors.agent_not_connected_text'),
        "error"
      );
      return;
    }
    setLoading(true);
    setScanStatus(null);
    try {
      const res = await apiCall("/api/collecte/uniforme/ouvrir", {
        matriculeAgent: agent.codeBarre || agent.matricule,
        codeBadge: code
      });
      setCollecte({
        id: res.collecteId,
        personnelNom: res.personnelNom,
        personnelFonction: res.personnelFonction,
        personnelId: res.personnelId,
        estInfecte: res.estInfecte,
        infoInfection: res.infoInfection,
        nbUniformes: res.nbUniformes,
        uniformes: (res.uniformes || []).map(u => ({ ...u, statut: "" }))
      });
      setUniformeEnCours(null);
      setEtape("SCAN");
      setScanStatus({
        loading: false,
        success: {
          message: res.estInfecte ? t('collecte_uniforme.infectious_contact') : res.personnelNom,
          detail: res.estInfecte
            ? res.infoInfection || t('collecte_uniforme.potentially_infected')
            : `${res.nbUniformes} ${t('collecte_uniforme.uniforms')}`
        },
        error: null
      });
      setTimeout(() => setScanStatus(null), 3000);

      if (res.estInfecte) {
        showAlert(
          t('collecte_uniforme.infectious_contact'),
          `${res.personnelNom} — ${res.infoInfection || t('collecte_uniforme.potentially_infected')}`,
          "warning"
        );
      } else {
        showAlert(
          t('collecte_uniforme.doctor_identified'),
          `${res.personnelNom} — ${res.nbUniformes} ${t('collecte_uniforme.uniforms')}`,
          "success"
        );
      }
    } catch (e) {
      setScanStatus({ loading: false, success: null, error: e.message });
      showAlert(t('common.error'), e.message, "error");
    } finally {
      setLoading(false);
    }
  }, [agent, showAlert, t]);

  const handleScanUniforme = useCallback((code) => {
    const u = collecteRef.current?.uniformes?.find(
      x => x.codeBarre === code || String(x.lingeId) === code
    );
    if (!u) {
      showAlert(t('collecte_uniforme.errors.uniform_not_found'), code, "error");
      return;
    }
    if (u.statut) {
      showAlert(t('collecte_uniforme.already_processed'), u.codeBarre, "info");
      return;
    }
    setUniformeEnCours(u);
    if (u.estInfecte) {
      showAlert(t('collecte_uniforme.infected_uniform'), t('collecte_uniforme.scan_red_bin'), "warning");
    } else {
      showAlert(t('collecte_uniforme.clean_uniform'), t('collecte_uniforme.scan_white_bin'), "success");
    }
  }, [showAlert, t]);

  const handleScanBac = useCallback(async (code) => {
    if (!uniformeEnCours) return;
    setLoading(true);
    setScanStatus({ loading: true, code: code });
    try {
      const res = await apiCall(`/api/collecte/uniforme/${collecteRef.current?.id}/traiter`, {
        codeUniforme: uniformeEnCours.codeBarre,
        codeBac: code
      });
      majUniforme(uniformeEnCours.lingeId, res.statut);
      setUniformeEnCours(null);
      setScanStatus({
        loading: false,
        success: {
          message: res.statut === "INFECTE"
            ? t('collecte_uniforme.red_bin')
            : t('collecte_uniforme.white_bin'),
          detail: `${uniformeEnCours.codeBarre} → ${res.bac}`
        },
        error: null
      });
      setTimeout(() => setScanStatus(null), 2000);

      if (res.statut === "INFECTE") {
        showAlert(
          t('collecte_uniforme.red_bin'),
          `${uniformeEnCours.codeBarre} → ${t('collecte_uniforme.red_bin')}`,
          "warning"
        );
      } else {
        showAlert(
          t('collecte_uniforme.white_bin'),
          `${uniformeEnCours.codeBarre} → ${t('collecte_uniforme.white_bin')}`,
          "success"
        );
      }
    } catch (e) {
      setScanStatus({ loading: false, success: null, error: e.message });
      showAlert(
        t('common.error'),
        e.message || t('collecte_uniforme.errors.invalid_bin'),
        "error"
      );
    } finally {
      setLoading(false);
    }
  }, [uniformeEnCours, showAlert, majUniforme, t]);

  const handleManquant = useCallback(async (u) => {
    setDlgManq(null);
    setLoading(true);
    try {
      await apiCall(`/api/collecte/uniforme/${collecteRef.current?.id}/manquant`, { lingeId: u.lingeId });
      majUniforme(u.lingeId, "MANQUANT");
      showAlert(t('collecte_uniforme.missing'), u.codeBarre, "warning");
    } catch (e) {
      showAlert(t('common.error'), e.message, "error");
    } finally {
      setLoading(false);
    }
  }, [showAlert, majUniforme, t]);

  const handleCloturer = useCallback(async () => {
    const nonTr = collecte?.uniformes?.filter(u => !u.statut) || [];
    if (nonTr.length > 0) {
      const ok = await showConfirm(
        t('collecte_uniforme.close'),
        `${nonTr.length} ${t('collecte_uniforme.unprocessed')}. ${t('collecte_uniforme.close_confirm')}`,
        "question"
      );
      if (!ok) return;
    }
    setLoading(true);
    try {
      const res = await apiCall(`/api/collecte/uniforme/${collecte.id}/cloturer`);
      setResume(res);
      setUniformeEnCours(null);
      setEtape("RESUME");
      showAlert(
        t('collecte_uniforme.collection_closed'),
        `${collecte.personnelNom} — ${res.nbBlancs} ${t('collecte_uniforme.white')}, ${res.nbInfectes} ${t('collecte_uniforme.infected')}`,
        "success"
      );
    } catch (e) {
      showAlert(t('common.error'), e.message, "error");
    } finally {
      setLoading(false);
    }
  }, [collecte, showAlert, showConfirm, t]);

  const handleScan = useCallback(async (code) => {
    setScanVal("");
    if (etape === "BADGE") { await handleBadge(code); return; }
    if (etape === "SCAN") {
      if (uniformeEnCours) {
        await handleScanBac(code);
        return;
      }
      handleScanUniforme(code);
    }
  }, [etape, uniformeEnCours, handleBadge, handleScanUniforme, handleScanBac]);

  const reset = () => {
    setCollecte(null);
    setResume(null);
    setUniformeEnCours(null);
    setEtape("BADGE");
    setScanVal("");
    setScanStatus(null);
    setTimeout(() => scanInputRef.current?.focus(), 200);
  };

  const traites = collecte?.uniformes?.filter(u => u.statut).length || 0;
  const total = collecte?.nbUniformes || 0;
  const nonTr = total - traites;
  const infectes = collecte?.uniformes?.filter(u => u.statut === "INFECTE").length || 0;
  const blancs = collecte?.uniformes?.filter(u => u.statut === "BLANC").length || 0;
  const manquants = collecte?.uniformes?.filter(u => u.statut === "MANQUANT").length || 0;

  const getPlaceholder = () => {
    if (!agent) return t('collecte_uniforme.no_agent_connected');
    if (!collecte) return t('collecte_uniforme.scan_doctor_badge');
    if (uniformeEnCours) return t('collecte_uniforme.scan_bin');
    if (etape === "RESUME") return t('collecte_uniforme.collection_closed');
    return t('collecte_uniforme.scan_uniform');
  };

  const getBorderColor = () => {
    if (!agent) return "#dc2626";
    if (etape === "RESUME") return "#e2e8f0";
    if (uniformeEnCours) {
      return uniformeEnCours.estInfecte ? "#dc2626" : "#0ea5e9";
    }
    return "#0ea5e9";
  };

  const isCloturee = etape === "RESUME";


  return (
    <div className="collecte-container cr-page">
      <DlgManquant
        linge={dlgManq}
        onOk={handleManquant}
        onClose={() => setDlgManq(null)}
        title={t('collecte_uniforme.missing_uniform')}
        message={<>Cet uniforme sera marqué comme <strong>manquant</strong> dans la collecte.</>}
        confirmLabel={t('collecte_uniforme.confirm_missing')}
      />

      <CollecteHeader
        icon={<Icons.UserMd size={28} color="white" strokeWidth={2.2} />}
        title={t('collecte_uniforme.title')}
        agent={agent}
        agentLabel={t('collecte_uniforme.agent')}
        noAgentLabel={t('collecte_uniforme.no_agent_connected')}
        accent="#0284c7"
      />

      <div className="cr-shell">
        <UniformeInfoBar agent={agent} collecte={collecte} onReset={reset} />

        {(etape === "SCAN" || etape === "RESUME") && collecte && (
          <StatistiquesUniforme
            total={total}
            blancs={blancs}
            infectes={infectes}
            manquants={manquants}
          />
        )}

        <ZoneScan
          scanInputRef={scanInputRef}
          placeholder={getPlaceholder()}
          value={scanVal}
          onChange={setScanVal}
          onSubmit={handleScan}
          borderColor={getBorderColor()}
          disabled={isCloturee || loading || !agent}
          isCloturee={isCloturee}
          showShimmer={false}
          scanStatus={scanStatus}
          scanningLabel={t('collecte_uniforme.scanning')}
          successLabel={t('collecte_uniforme.success')}
        />

        <MessagesEtapeUniforme
          agent={agent}
          collecte={collecte}
          etape={etape}
          uniformeEnCours={uniformeEnCours}
        />

        {uniformeEnCours && etape === "SCAN" && (
          <UniformeEnCours
            uniforme={uniformeEnCours}
            onCancel={() => setUniformeEnCours(null)}
          />
        )}

        {etape === "SCAN" && collecte && (
          <div style={{ marginTop: 20 }}>
            <BoutonCloturer
              onClick={handleCloturer}
              loading={loading}
              nonTr={nonTr}
              total={total}
            />
          </div>
        )}

        {etape === "RESUME" && resume && (
          <ResumeUniforme
            resume={resume}
            personnelNom={collecte?.personnelNom}
            onAutreMedecin={() => {
              setCollecte(null);
              setResume(null);
              setUniformeEnCours(null);
              setEtape("BADGE");
              setTimeout(() => scanInputRef.current?.focus(), 200);
            }}
            onTerminer={reset}
          />
        )}

        {etape === "SCAN" && collecte && (
          <ListeUniformes
            uniformes={collecte.uniformes}
            uniformeEnCours={uniformeEnCours}
            total={total}
            traites={traites}
            onManquant={x => setDlgManq(x)}
          />
        )}
      </div>

      <CollecteStyles />
    </div>
  );
}

export default function CollageListUniforme() {
  return <CollageListUniformeInner />;
}
