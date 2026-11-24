import React, { useState, useRef, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useModal } from "../../../../contextes/ModalContext";
import { apiCall } from "../collecteUtils";
import { getAgent, isAgentConnected } from "../../../../services/agentService";
import "../../Linge/WorkflowList.css";
import { CollecteStyles } from "../shared/CollecteStyles";
import { DlgManquant } from "../shared/dialogs/DlgManquant";
import { ResumeUniforme } from "./components/ResumeUniforme";
import { ClipboardCheck, TriangleAlert } from "lucide-react";
import {
  ToolbarCollecte, EtapesCollecte, AccueilSansAgent, PosteScan, PastilleEtat, AlerteCollecte,
  LigneCollecte, BoutonIcone, GroupesLignes, BilanCollecte, nomAgentCollecte,
} from "../shared/CollecteRc";
import { getCategorieMeta } from "../../../../constants/categoriesLinge";


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

  const getBorderColor = () => {
    if (!agent) return "#e03131";
    if (etape === "RESUME") return "#cbd5e1";
    if (uniformeEnCours?.estInfecte) return "#e03131";
    return "#0d9488";
  };

  const isCloturee = etape === "RESUME";
  const infecteActif = Boolean(uniformeEnCours?.estInfecte);
  const pct = total > 0 ? Math.round((traites / total) * 100) : 0;
  const nomAgent = nomAgentCollecte(agent);

  const etatUniforme = (u) => {
    const map = {
      BLANC: ["ok", t("collecte_uniforme.white", "Blanc")],
      INFECTE: ["danger", t("collecte_uniforme.infected", "Infecté")],
      MANQUANT: ["warn", t("collecte_uniforme.missing", "Manquant")],
    }[u.statut];
    if (map) return <PastilleEtat tone={map[0]}>{map[1]}</PastilleEtat>;
    if (uniformeEnCours?.lingeId === u.lingeId) return <PastilleEtat tone={u.estInfecte ? "danger" : "info"}>{t("collecte_uniforme.in_progress", "En cours")}</PastilleEtat>;
    return null;
  };

  const ligne = (u) => {
    const { Icon, accent } = getCategorieMeta(u.categorie);
    const actif = uniformeEnCours?.lingeId === u.lingeId;
    return (
      <LigneCollecte
        key={u.lingeId}
        icone={<Icon size={18} strokeWidth={2} />}
        accent={u.estInfecte && !u.statut ? "var(--rc-sac)" : accent}
        titre={t(`categories.${u.categorie}`, u.categorie || "—")}
        code={u.codeBarre}
        tags={u.estInfecte && !u.statut ? <span className="cl-line__tag">{t("collecte_uniforme.infected", "Infecté")}</span> : null}
        active={actif}
        estompe={Boolean(u.statut)}
        etat={etatUniforme(u)}
        actions={!u.statut && (
          <BoutonIcone icone={<TriangleAlert size={16} strokeWidth={2.4} />} titre={t("collecte_uniforme.missing")} tone="warn" onClick={() => setDlgManq(u)} />
        )}
      />
    );
  };

  const uniformes = collecte?.uniformes || [];
  const groupes = [
    { key: "afaire", titre: t("collecte_uniforme.to_process", "À traiter"), items: uniformes.filter((u) => !u.statut), toujours: true },
    { key: "traites", titre: t("collecte_uniforme.processed", "Traités"), items: uniformes.filter((u) => u.statut), repliable: true, estompe: true },
  ];

  const etapes = [
    t("collecte_uniforme.step_identify", "Identification de l'agent"),
    t("collecte_uniforme.step_badge", "Badge du médecin"),
    t("collecte_uniforme.step_uniforms", "Uniformes"),
    t("collecte_uniforme.step_close", "Clôture"),
  ];
  const faites = [Boolean(agent), Boolean(collecte), Boolean(collecte) && total > 0 && nonTr === 0, isCloturee];

  const chipsPoste = collecte && !isCloturee ? (
    <>
      <PastilleEtat tone="info">{collecte.personnelNom}</PastilleEtat>
      {uniformeEnCours && <PastilleEtat tone={uniformeEnCours.estInfecte ? "danger" : "ok"}>{uniformeEnCours.estInfecte ? t("collecte_uniforme.red_bin", "Bac rouge") : t("collecte_uniforme.white_bin", "Bac blanc")}</PastilleEtat>}
    </>
  ) : null;

  return (
    <div className="collecte-container cr-page rc cc">
      <DlgManquant
        linge={dlgManq}
        onOk={handleManquant}
        onClose={() => setDlgManq(null)}
        title={t('collecte_uniforme.missing_uniform')}
        message={<>Cet uniforme sera marqué comme <strong>manquant</strong> dans la collecte.</>}
        confirmLabel={t('collecte_uniforme.confirm_missing')}
      />

      <ToolbarCollecte agent={agent} onReset={collecte ? reset : undefined} />
      <EtapesCollecte etapes={etapes} faites={faites} label={t("collecte_uniforme.steps", "Étapes de la collecte")} />

      {!agent ? (
        <AccueilSansAgent
          eyebrow={t("collecte_uniforme.title")}
          titre={t("collecte_uniforme.no_agent_connected")}
          scanInputRef={scanInputRef}
          value={scanVal}
          onChange={setScanVal}
          onSubmit={handleScan}
        />
      ) : etape === "RESUME" && resume ? (
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
      ) : (
        <div className={collecte ? "rc-layout" : ""}>
          <div className="rc-main">
            <PosteScan
              titre={t("collecte_uniforme.title")}
              chips={chipsPoste}
              infecte={infecteActif}
              alerte={collecte?.estInfecte ? (
                <AlerteCollecte>
                  {t("collecte_uniforme.infectious_contact", "Contact infectieux")}
                  {collecte.infoInfection ? ` · ${collecte.infoInfection}` : ""}
                </AlerteCollecte>
              ) : null}
              scanInputRef={scanInputRef}
              value={scanVal}
              onChange={setScanVal}
              onSubmit={handleScan}
              borderColor={getBorderColor()}
              disabled={isCloturee || loading || !agent}
              scanStatus={scanStatus}
              scanningLabel={t("collecte_uniforme.scanning")}
              successLabel={t("collecte_uniforme.success")}
            />

            {uniformeEnCours && (
              <div className={`cc-alert ${uniformeEnCours.estInfecte ? "" : "is-info"}`}>
                <span>
                  <code>{uniformeEnCours.codeBarre}</code> → {uniformeEnCours.estInfecte ? t("collecte_uniforme.red_bin", "Bac rouge") : t("collecte_uniforme.white_bin", "Bac blanc")}
                </span>
                <button type="button" className="rc-btn rc-btn--sm cl-cancel" onClick={() => setUniformeEnCours(null)}>
                  {t("common.cancel", "Annuler")}
                </button>
              </div>
            )}

            {collecte && (
              <section className="rc-card">
                <div className="rc-card__head">
                  <h3 className="rc-card__title">{t("collecte_uniforme.uniforms", "Uniformes")}</h3>
                  <span className="rc-count">{total}</span>
                </div>
                <div className="rc-card__body">
                  <GroupesLignes groupes={groupes} rendu={ligne} videMessage={t("collecte_uniforme.all_done", "Tous les uniformes sont traités")} />
                </div>
                <div className="cl-actions">
                  <button type="button" className="rc-btn rc-btn--primary rc-btn--lg" disabled={loading} onClick={handleCloturer}>
                    <ClipboardCheck size={16} />
                    {nonTr === 0 ? t("collecte_uniforme.finish_and_close", "Terminer et clôturer") : t("collecte_uniforme.close_with_unprocessed", "Clôturer avec des restants")}
                  </button>
                </div>
              </section>
            )}
          </div>

          {collecte && (
            <aside className="rc-side">
              <BilanCollecte
                titre={t("collecte_uniforme.balance", "Bilan de la collecte")}
                progression={pct}
                items={[
                  { label: t("collecte_uniforme.uniforms", "Uniformes"), value: total },
                  { label: t("collecte_uniforme.white", "Blancs"), value: blancs },
                  { label: t("collecte_uniforme.infected", "Infectés"), value: infectes, tone: "danger" },
                  { label: t("collecte_uniforme.missing", "Manquants"), value: manquants },
                ]}
              />
              <div className="rc-foot">
                <span>{t("collecte_uniforme.agent", "Agent")} : <b>{nomAgent}</b></span>
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

export default function CollageListUniforme() {
  return <CollageListUniformeInner />;
}
