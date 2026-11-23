// pages/Distribution/DistributionUniforme.js
import React, { useState, useRef, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { BarChart3, Check, Flag, Plus, Undo2 } from "lucide-react";
import {
  getAgentFromStorage,
  isAgentConnected,
  fetchAgentByCode,
  fetchUniformesPersonnel,
  distribuerUniforme,
  getCategorie
} from "../../../services/distributionUniformeService";
import Swal from "../../kit/dialogueApi";
import "../Linge/WorkflowList.css";
import { QuickStats } from "../../kit";
import {
  ToolbarCollecte, EtapesCollecte, AccueilSansAgent, PosteScan, PastilleEtat,
  LigneCollecte, BoutonIcone, BilanCollecte, nomAgentCollecte,
} from "../Collecte/shared/CollecteRc";
import { getCategorieMeta } from "../../../constants/categoriesLinge";
import MuteButton from "../../utils/MuteButton";
import { useVoiceGuide } from "../../../hooks/useVoiceGuide";
import { getSetting } from "../../../utils/appSettings";

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────
export default function DistributionUniforme() {
  const { t } = useTranslation();

  const [etape, setEtape] = useState("PERSONNEL");
  const [agent, setAgent] = useState(null);
  const [personnel, setPersonnel] = useState(null);
  const [enPossession, setEnPossession] = useState([]);
  const [disponibles, setDisponibles] = useState([]);
  const [scanVal, setScanVal] = useState("");
  const [loading, setLoading] = useState(false);
  const [resume, setResume] = useState(null);
  const [scanStatus, setScanStatus] = useState(null);
  const [distribues, setDistribues] = useState([]);

  const agentRef = useRef(null);
  const personnelRef = useRef(null);
  const scanInputRef = useRef(null);

  // Assistant vocal
  const [voiceLang, setVoiceLang] = useState(() => getSetting("voice.lang"));
  const voice = useVoiceGuide(voiceLang);
  const voiceRef = useRef(voice);
  useEffect(() => { voiceRef.current = voice; }, [voice]);
  useEffect(() => () => voiceRef.current.cancel(), []);

  useEffect(() => { agentRef.current = agent; }, [agent]);
  useEffect(() => { personnelRef.current = personnel; }, [personnel]);

  // ✅ Récupérer l'agent depuis localStorage (clé 'auth')
  useEffect(() => {
    console.log("🔍 Recherche de l'agent dans le stockage...");
    const agentData = getAgentFromStorage();
    
    if (agentData) {
      console.log("✅ Agent trouvé:", agentData);
      setAgent(agentData);
      setEtape("PERSONNEL");
      setScanStatus({
        loading: false,
        success: {
          message: `👤 ${t('distribution_uniforme.agent')} ${agentData.nom}`,
          detail: `${t('distribution_uniforme.connected')} · ${agentData.codeBarre || agentData.matricule}`
        },
        error: null
      });
      setTimeout(() => setScanStatus(null), 2000);
      setTimeout(() => voiceRef.current.sayBienvenueDistributionUniforme(agentData.nomPrenom || agentData.nom || ""), 600);
    } else {
      console.warn("⚠️ Aucun agent trouvé dans le stockage");
      setEtape("PERSONNEL");
      setScanStatus({
        loading: false,
        success: null,
        error: t('distribution_uniforme.no_agent_connected')
      });
    }
  }, [t]);

  // ─── Focus permanent ──────────────────────────────────────────────────
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

  // ─── Clôturer la distribution ──────────────────────────────────────────
  const cloturerDistribution = useCallback(async () => {
    if (distribues.length === 0) {
      voice.sayAucunUniformeDistribue();
      await Swal.fire({
        icon: 'warning',
        title: t('distribution_uniforme.no_uniform_distributed_title'),
        text: t('distribution_uniforme.no_uniform_distributed_text'),
        timer: 1500,
        showConfirmButton: false
      });
      return false;
    }

    setResume({
      personnelNom: personnel.nom,
      nbDistribues: distribues.length,
      uniformes: distribues
    });
    setEtape("RESUME");
    voice.sayDistributionUniformeTerminee(personnel.nom, distribues.length);
    setScanStatus({
      loading: false,
      success: { 
        message: "✅ " + t('distribution_uniforme.distribution_completed'), 
        detail: `${distribues.length} ${t('distribution_uniforme.uniform')}s ${t('distribution_uniforme.distributed')}` 
      },
      error: null
    });
    setTimeout(() => setScanStatus(null), 2000);
    return true;
  }, [distribues, personnel, t, voice]);

  // ─── Scan Personnel ──────────────────────────────────────────────────────
  const handlePersonnel = useCallback(async code => {
    if (!agent) {
      await Swal.fire({
        icon: 'warning',
        title: t('distribution_uniforme.agent_not_connected_title'),
        text: t('distribution_uniforme.agent_not_connected_text'),
        timer: 1500,
        showConfirmButton: false
      });
      return;
    }
    setLoading(true);
    setScanStatus({ loading: true, code });
    try {
      const data = await fetchUniformesPersonnel(code, agent.matricule);
      
      setPersonnel({
        id: data.personnelId,
        nom: data.personnelNom,
        fonction: data.personnelFonction
      });
      setEnPossession(data.enPossession || []);
      setDisponibles(data.disponibles || []);
      setDistribues([]);
      setEtape("DISTRIBUER");
      voice.sayPersonnelDistribution(data.personnelNom, data.disponibles?.length || 0);
      setScanStatus({
        loading: false,
        success: { 
          message: `✅ ${data.personnelNom}`, 
          detail: `${data.disponibles?.length || 0} ${t('distribution_uniforme.uniform')}s ${t('distribution_uniforme.available')}` 
        },
        error: null
      });
      setTimeout(() => setScanStatus(null), 2000);
      await Swal.fire({
        icon: 'success',
        title: `✅ ${data.personnelNom}`,
        text: `${data.disponibles?.length || 0} ${t('distribution_uniforme.uniform')}s ${t('distribution_uniforme.available')} · ${data.enPossession?.length || 0} ${t('distribution_uniforme.in_possession')}`,
        timer: 1500,
        showConfirmButton: false
      });
    } catch (e) {
      setScanStatus({ loading: false, success: null, error: e.message });
      if (/réseau|network|fetch/i.test(e.message || "")) voice.sayErreurReseau();
      else voice.sayErreurGenerique(e.message);
      await Swal.fire({
        icon: 'error',
        title: t('common.error'),
        text: e.message
      });
    } finally {
      setLoading(false);
    }
  }, [agent, t, voice]);

  // ─── Scan Uniforme ──────────────────────────────────────────────────────
  const handleScanUniforme = useCallback(async code => {
    if (!personnel) {
      voice.sayScannerPersonnelDabord();
      await Swal.fire({
        icon: 'warning',
        title: t('distribution_uniforme.scan_personnel_first_title'),
        text: t('distribution_uniforme.scan_personnel_first_text'),
        timer: 1500,
        showConfirmButton: false
      });
      return;
    }
    setLoading(true);
    setScanStatus({ loading: true, code });
    try {
      const data = await distribuerUniforme(
        personnel.id,
        personnel.nom,
        code,
        agent.matricule
      );

      setDisponibles(prev => prev.filter(l => l.lingeId !== data.lingeId));
      setEnPossession(prev => [...prev, data]);
      setDistribues(prev => [...prev, data]);
      voice.sayUniformeDistribue(distribues.length + 1);

      setScanStatus({
        loading: false,
        success: { 
          message: t('distribution_uniforme.uniform_distributed'), 
          detail: data.codeBarre 
        },
        error: null
      });
      setTimeout(() => setScanStatus(null), 1500);
      await Swal.fire({
        icon: 'success',
        title: t('distribution_uniforme.uniform_distributed'),
        text: data.codeBarre,
        timer: 1000,
        showConfirmButton: false
      });
    } catch (e) {
      setScanStatus({ loading: false, success: null, error: e.message });
      voice.sayErreurGenerique(e.message);
      await Swal.fire({
        icon: 'error',
        title: t('common.error'),
        text: e.message,
        timer: 1500,
        showConfirmButton: false
      });
    } finally {
      setLoading(false);
    }
  }, [personnel, agent, distribues.length, t, voice]);

  // ─── Retirer un uniforme ──────────────────────────────────────────────
  const handleRetirer = useCallback(async (linge) => {
    setEnPossession(prev => prev.filter(l => l.lingeId !== linge.lingeId));
    setDisponibles(prev => [...prev, linge]);
    setDistribues(prev => prev.filter(l => l.lingeId !== linge.lingeId));
    voice.sayUniformeRetire();

    await Swal.fire({
      icon: 'info',
      title: t('distribution_uniforme.uniform_removed'),
      text: linge.codeBarre,
      timer: 1000,
      showConfirmButton: false
    });
  }, [t, voice]);

  // ─── Gestion scan ──────────────────────────────────────────────────────
  const handleScan = useCallback(async code => {
    if (!code || loading) return;
    setScanVal("");

    console.log("🔍 Scan reçu:", code, "Étape:", etape);

    if (etape === "PERSONNEL") {
      console.log("👔 Scan personnel:", code);
      await handlePersonnel(code);
      return;
    }

    if (etape === "DISTRIBUER") {
      try {
        const agentTrouve = await fetchAgentByCode(code.trim());
        if (agentTrouve) {
          console.log("🔄 Agent trouvé, clôture de la distribution");
          await cloturerDistribution();
          return;
        }
      } catch (e) {
        console.log("❌ Ce n'est pas un agent valide:", e.message);
      }
      
      console.log("👕 Distribution de l'uniforme:", code);
      await handleScanUniforme(code);
    }
  }, [etape, loading, handlePersonnel, handleScanUniforme, cloturerDistribution]);

  // ─── Reset ──────────────────────────────────────────────────────────────
  const reset = useCallback(async () => {
    if (etape !== "PERSONNEL" && etape !== "RESUME") {
      const result = await Swal.fire({
        icon: 'warning',
        title: t('distribution_uniforme.reset_title'),
        text: t('distribution_uniforme.reset_text'),
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#64748b',
        confirmButtonText: t('distribution_uniforme.yes_reset'),
        cancelButtonText: t('common.cancel')
      });
      if (!result.isConfirmed) return;
    }
    setPersonnel(null);
    setEnPossession([]);
    setDisponibles([]);
    setDistribues([]);
    setResume(null);
    setEtape("PERSONNEL");
    setScanVal("");
    setScanStatus(null);
  }, [etape, t]);

  const getPlaceholder = () => {
    if (!agent) return t('distribution_uniforme.agent_not_connected_placeholder');
    if (etape === "PERSONNEL") return t('distribution_uniforme.scan_personnel_badge');
    if (etape === "RESUME") return t('distribution_uniforme.distribution_completed');
    return t('distribution_uniforme.scan_uniform_to_distribute');
  };

  const isCloturee = etape === "RESUME";
  const [showStats, setShowStats] = useState(false);

  const nouvellePersonne = () => {
    setPersonnel(null);
    setEnPossession([]);
    setDisponibles([]);
    setDistribues([]);
    setResume(null);
    setEtape("PERSONNEL");
    setScanStatus(null);
    setTimeout(() => scanInputRef.current?.focus(), 300);
  };

  const totalUniformes = disponibles.length + enPossession.length;
  const parCategorie = Object.values(enPossession.reduce((acc, l) => {
    const c = getCategorie(l.categorie);
    acc[c.label] = acc[c.label] || { label: c.label, value: 0 };
    acc[c.label].value += 1;
    return acc;
  }, {}));

  const nomAgent = nomAgentCollecte(agent);
  const etapes = [
    t("distribution_uniforme.step_identify", "Identification de l'agent"),
    t("distribution_uniforme.personnel", "Personnel"),
    t("distribution_uniforme.step_distribute", "Distribution"),
    t("distribution_uniforme.step_close", "Clôture"),
  ];
  const faites = [Boolean(agent), Boolean(personnel), distribues.length > 0, isCloturee];

  const ligne = (l, etat, actions) => {
    const { Icon, accent } = getCategorieMeta(l.categorie);
    return (
      <LigneCollecte
        key={l.lingeId ?? l.codeBarre}
        icone={<Icon size={18} strokeWidth={2} />}
        accent={accent}
        titre={t(`categories.${l.categorie}`, getCategorie(l.categorie).label)}
        code={l.codeBarre}
        etat={etat}
        actions={actions}
      />
    );
  };

  const extraToolbar = (
    <>
      <MuteButton muted={voice.muted} onToggle={voice.toggleMute} speaking={voice.speaking} lang={voiceLang} onLangChange={setVoiceLang} />
      <button type="button" className="rc-btn" onClick={() => setShowStats(true)}>
        <BarChart3 size={15} /> {t("common.statistics", "Statistiques")}
      </button>
      {etape === "DISTRIBUER" && (
        <button type="button" className="rc-btn rc-btn--primary" disabled={loading || distribues.length === 0} onClick={cloturerDistribution}>
          <Flag size={14} /> {t("distribution_uniforme.finish", "Terminer la distribution")}
        </button>
      )}
    </>
  );

  return (
    <div className="collecte-container cr-page rc cc">
      <ToolbarCollecte
        agent={agent}
        extra={extraToolbar}
        onReset={etape !== "PERSONNEL" ? reset : undefined}
        resetLabel={t("common.reset", "Réinitialiser")}
      />
      <EtapesCollecte etapes={etapes} faites={faites} label={t("distribution_uniforme.steps", "Étapes de la distribution")} />

      {!agent ? (
        <AccueilSansAgent
          eyebrow={t("distribution_uniforme.title")}
          titre={t("distribution_uniforme.no_agent_connected")}
          scanInputRef={scanInputRef}
          value={scanVal}
          onChange={setScanVal}
          onSubmit={handleScan}
        />
      ) : isCloturee && resume ? (
        <section className="rc-card rc-ticket">
          <div className="rc-ticket__banner">
            <Check size={16} strokeWidth={3} />
            <strong>{t("distribution_uniforme.uniforms_distributed", "Uniformes distribués")}</strong>
          </div>
          <div className="rc-ticket__body" style={{ gridTemplateColumns: "minmax(0, 1fr) auto" }}>
            <div className="rc-ticket__main">
              <span className="rc-label">{t("distribution_uniforme.personnel", "Personnel")}</span>
              <code className="rc-ticket__code">{resume.personnelNom}</code>
              <span style={{ color: "var(--rc-muted)", fontSize: 14 }}>
                {resume.nbDistribues} {t("distribution_uniforme.uniform")}{resume.nbDistribues > 1 ? "s" : ""}
              </span>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button type="button" className="rc-btn" onClick={reset}>{t("common.finish", "Terminer")}</button>
              <button type="button" className="rc-btn rc-btn--primary rc-btn--lg" onClick={nouvellePersonne}>
                <Plus size={16} /> {t("distribution_uniforme.another_personnel", "Autre personne")}
              </button>
            </div>
          </div>
          {resume.uniformes?.length > 0 && (
            <div className="cl-list">{resume.uniformes.map((u) => ligne(u, <PastilleEtat tone="ok">{t("distribution_uniforme.distributed", "Distribué")}</PastilleEtat>, null))}</div>
          )}
        </section>
      ) : (
        <div className={etape === "DISTRIBUER" && personnel ? "rc-layout" : ""}>
          <div className="rc-main">
            <PosteScan
              titre={t("distribution_uniforme.title")}
              chips={personnel ? <PastilleEtat tone="info">{personnel.nom}{personnel.fonction ? ` · ${personnel.fonction}` : ""}</PastilleEtat> : null}
              scanInputRef={scanInputRef}
              value={scanVal}
              onChange={setScanVal}
              onSubmit={handleScan}
              borderColor="#0d9488"
              disabled={loading}
              scanStatus={scanStatus}
            />

            {etape === "DISTRIBUER" && personnel && (
              <>
                <section className="rc-card">
                  <div className="rc-card__head">
                    <h3 className="rc-card__title">{t("distribution_uniforme.available", "À distribuer")}</h3>
                    <span className="rc-count">{disponibles.length}</span>
                  </div>
                  {disponibles.length === 0 ? (
                    <div className="rc-empty"><Check size={26} strokeWidth={1.6} /><strong>{t("distribution_uniforme.no_uniform_available", "Aucun uniforme disponible")}</strong></div>
                  ) : (
                    <div className="cl-list">
                      {disponibles.map((l) => ligne(
                        l,
                        null,
                        <BoutonIcone icone={<Check size={17} strokeWidth={2.6} />} titre={t("distribution_uniforme.distribute", "Distribuer")} tone="ok" disabled={loading} onClick={() => handleScanUniforme(l.codeBarre)} />
                      ))}
                    </div>
                  )}
                </section>

                <section className="rc-card">
                  <div className="rc-card__head">
                    <h3 className="rc-card__title">{t("distribution_uniforme.in_possession", "En possession")}</h3>
                    <span className="rc-count">{enPossession.length}</span>
                  </div>
                  {enPossession.length === 0 ? (
                    <div className="rc-empty"><strong>{t("distribution_uniforme.no_uniform_in_possession", "Aucun uniforme en possession")}</strong></div>
                  ) : (
                    <div className="cl-list">
                      {enPossession.map((l) => ligne(
                        l,
                        distribues.some((d) => d.lingeId === l.lingeId) ? <PastilleEtat tone="ok">{t("distribution_uniforme.distributed", "Distribué")}</PastilleEtat> : null,
                        <BoutonIcone icone={<Undo2 size={16} strokeWidth={2.4} />} titre={t("distribution_uniforme.remove", "Retirer")} tone="danger" disabled={loading} onClick={() => handleRetirer(l)} />
                      ))}
                    </div>
                  )}
                </section>
              </>
            )}
          </div>

          {etape === "DISTRIBUER" && personnel && (
            <aside className="rc-side">
              <BilanCollecte
                titre={t("distribution_uniforme.balance", "Bilan de la distribution")}
                progression={totalUniformes > 0 ? Math.round((enPossession.length / totalUniformes) * 100) : 0}
                items={[
                  { label: t("distribution_uniforme.to_distribute", "À distribuer"), value: disponibles.length },
                  { label: t("distribution_uniforme.in_possession", "En possession"), value: enPossession.length },
                  { label: t("distribution_uniforme.distributed", "Distribués"), value: distribues.length },
                  { label: t("distribution_uniforme.personnel", "Personnel"), value: personnel.nom, texte: true },
                ]}
              />
              <div className="rc-foot">
                <span>{t("distribution_uniforme.agent", "Agent")} : <b>{nomAgent}</b></span>
                <span>{new Date().toLocaleDateString("fr-FR")}</span>
              </div>
            </aside>
          )}
        </div>
      )}

      {showStats && (
        <QuickStats
          title={t('distribution_uniforme.title')}
          subtitle={personnel?.nom || undefined}
          onClose={() => setShowStats(false)}
          kpis={[
            { label: t('distribution_uniforme.to_distribute'), value: disponibles.length, color: "#7c3aed" },
            { label: t('distribution_uniforme.in_possession'), value: enPossession.length, color: "#0794a4" },
            { label: t('distribution_uniforme.distributed'), value: distribues.length, color: "#10b981" },
          ]}
          repartitions={[{ title: t('distribution_uniforme.in_possession'), items: parCategorie }]}
        />
      )}
    </div>
  );
}
