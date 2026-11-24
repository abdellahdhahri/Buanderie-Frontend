import React, {
  useState, useRef, useEffect,
  useCallback, useMemo
} from "react";
import { useTranslation } from "react-i18next";
import { useContext } from "react";
import { ServiceContext } from "../../../contextes/ServiceContext";
import { useModal } from "../../../contextes/ModalContext";
import { ArrowRight, BarChart3, Building2, Check, ClipboardList, History, RotateCcw, X } from "lucide-react";
import ScanInput from "../../utils/shared/ScanInput";
import {
  getAgentFromStorage,
  isAgentConnected,
  fetchAgentByMatricule,
  fetchServiceByReference,
  createDistribution,
  fetchComparatifDistribution,
  scanArticleForDistribution,
  cloturerDistribution,
  calculerStats,
  isDistributionComplete,
  getCategorie
} from "../../../services/distributionService";
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
import { getSetting, bipScan } from "../../../utils/appSettings";

function useRefMirror(v) {
  const r = useRef(v);
  useEffect(() => { r.current = v; }, [v]);
  return r;
}

// ─── Page principale ──────────────────────────────────────────────────────
export default function LivraisonList() {
  const { t } = useTranslation();
  const { services } = useContext(ServiceContext);

  const [etape, setEtape] = useState("SERVICE");
  const [agent, setAgent] = useState(null);
  const [service, setService] = useState(null);
  const [distribution, setDistribution] = useState(null);
  const [comparatif, setComparatif] = useState([]);
  const [historique, setHistorique] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scanStatus, setScanStatus] = useState(null);

  const [scanValue, setScanValue] = useState("");
  const [searchSvc, setSearchSvc] = useState("");

  const distributionRef = useRefMirror(distribution);
  const scanInputRef = useRef(null);

  // Assistant vocal
  const [voiceLang, setVoiceLang] = useState(() => getSetting("voice.lang"));
  const voice = useVoiceGuide(voiceLang);
  const voiceRef = useRef(voice);
  useEffect(() => { voiceRef.current = voice; }, [voice]);
  useEffect(() => () => voiceRef.current.cancel(), []);

  useEffect(() => {
    const agentData = getAgentFromStorage();
    if (agentData) {
      setAgent(agentData);
      setEtape("SERVICE");
      setScanStatus({
        loading: false,
        success: { 
          message: `👤 ${t('livraison.agent')} ${agentData.nomPrenom || agentData.nom}`, 
          detail: `${t('livraison.connected')} · ${agentData.codeBarre || agentData.matricule}` 
        },
        error: null
      });
      setTimeout(() => setScanStatus(null), 2000);
      setTimeout(() => voiceRef.current.sayBienvenueDistributionService(agentData.nomPrenom || agentData.nom || ""), 600);
    } else {
      console.warn("⚠️ Aucun agent trouvé dans le stockage");
      setEtape("SERVICE");
      setScanStatus({
        loading: false,
        success: null,
        error: t('livraison.no_agent_connected')
      });
    }
  }, [t]);

  // ─── Scan automatique ──────────────────────────────────────────────────
  useEffect(() => {
    if (scanValue.trim().length < (Number(getSetting("scan.minLength")) || 3)) return;
    const timeout = setTimeout(() => {
      const code = scanValue.trim();
      setScanValue("");
      bipScan();
      handleScan(code);
    }, Math.max(100, (Number(getSetting("scan.delayMs")) || 400) - 100)); // un peu avant le champ de scan : évite un double envoi
    return () => clearTimeout(timeout);
  }, [scanValue]);

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

  // ─── Calcul stats ──────────────────────────────────────────────────────
  const stats = useMemo(() => calculerStats(comparatif), [comparatif]);

  // ─── Rafraîchir comparatif ──────────────────────────────────────────────
  const rafraichirComparatif = useCallback(async (distId) => {
    if (!distId) return;
    try {
      const data = await fetchComparatifDistribution(distId);
      setComparatif(data);

      if (isDistributionComplete(data)) {
        voiceRef.current.sayDistributionServiceComplete();
        await Swal.fire({
          icon: 'success',
          title: t('livraison.distribution_completed'),
          text: t('livraison.all_articles_delivered'),
          timer: 2000,
          showConfirmButton: false
        });
        setEtape("SERVICE");
        setDistribution(null);
        setComparatif([]);
        setHistorique([]);
        setService(null);
      }
      return data;
    } catch (error) {
      console.error("Erreur rafraîchissement:", error);
      return null;
    }
  }, [t]);

  // ─── Auto-refresh ──────────────────────────────────────────────────────
  useEffect(() => {
    if (etape !== "SCAN" || !distribution?.id) return;
    // Fréquence : Paramètres › Rafraîchissement
    const id = setInterval(() => rafraichirComparatif(distribution.id), (Number(getSetting("refresh.distributionSeconds")) || 3) * 1000);
    return () => clearInterval(id);
  }, [etape, distribution, rafraichirComparatif]);

  // ─── Vérifier si un code est un agent ──────────────────────────────────
  const verifierSiAgent = useCallback(async (code) => {
    try {
      return await fetchAgentByMatricule(code);
    } catch {
      return null;
    }
  }, []);

  // ─── Clôturer automatiquement ──────────────────────────────────────────
  const cloturerEtRetourner = useCallback(async () => {
    if (!distribution) return false;

    setLoading(true);
    setScanStatus({ loading: true, code: t('livraison.closing') });

    try {
      const reste = stats.reste || 0;
      if (reste > 0) {
        voice.sayArticlesRestantsCloture(reste);
        const result = await Swal.fire({
          icon: 'warning',
          title: t('livraison.remaining_articles'),
          text: t('livraison.remaining_articles_text', { count: reste }),
          showCancelButton: true,
          confirmButtonColor: '#d97706',
          cancelButtonColor: '#64748b',
          confirmButtonText: t('livraison.yes_close'),
          cancelButtonText: t('common.cancel')
        });
        if (!result.isConfirmed) {
          setScanStatus(null);
          setLoading(false);
          return false;
        }
      }

      await cloturerDistribution(distribution.id);
      voice.sayDistributionServiceCloturee(service?.nom || service?.code || "");

      await Swal.fire({
        icon: 'success',
        title: t('livraison.distribution_closed'),
        text: t('livraison.service_completed', { name: service?.nom || '' }),
        timer: 2000,
        showConfirmButton: false
      });

      setDistribution(null);
      setComparatif([]);
      setHistorique([]);
      setService(null);
      setEtape("SERVICE");
      setScanStatus(null);

      setTimeout(() => scanInputRef.current?.focus(), 300);
      return true;
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: t('common.error'),
        text: error.message || t('livraison.close_error')
      });
      setScanStatus(null);
      return false;
    } finally {
      setLoading(false);
    }
  }, [distribution, service, stats.reste, t, voice]);

  // ─── Scan Service ──────────────────────────────────────────────────────
  const execScanService = useCallback(async (code) => {
    if (!agent) {
      await Swal.fire({
        icon: 'warning',
        title: t('livraison.agent_required'),
        text: t('livraison.agent_required_text')
      });
      return;
    }

    setLoading(true);
    setScanStatus({ loading: true, code });
    try {
      const svc = await fetchServiceByReference(code);
      
      const dist = await createDistribution(svc.id, agent.matricule);
      
      setService(svc);
      setDistribution(dist);
      const comp = await rafraichirComparatif(dist.id);
      setEtape("SCAN");
      voice.sayServiceDistribution(svc.nom || svc.code, calculerStats(comp || []).reste);
      setScanStatus({
        loading: false,
        success: { message: `✅ ${svc.code}`, detail: `${dist.id}` },
        error: null
      });
      setTimeout(() => setScanStatus(null), 2000);
      await Swal.fire({
        icon: 'success',
        title: t('livraison.distribution_created'),
        text: t('livraison.scan_articles_for', { name: svc.nom }),
        timer: 1500,
        showConfirmButton: false
      });
    } catch (error) {
      setScanStatus({ loading: false, success: null, error: error.message });
      if (/réseau|network|fetch/i.test(error.message || "")) voice.sayErreurReseau();
      else voice.sayErreurGenerique(error.message);
      await Swal.fire({
        icon: 'error',
        title: t('common.error'),
        text: error.message
      });
    } finally {
      setLoading(false);
    }
  }, [agent, rafraichirComparatif, t, voice]);

  // ─── Scan Linge ──────────────────────────────────────────────────────
  const execScanLinge = useCallback(async (code) => {
    const dist = distributionRef.current;
    if (!dist?.id) return;
    setLoading(true);
    setScanStatus({ loading: true, code });

    try {
      const result = await scanArticleForDistribution(dist.id, code);

      const heure = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      
      setHistorique(prev => [{ 
        code, 
        ok: true, 
        msg: result.message || t('livraison.delivered'),
        heure 
      }, ...prev.slice(0, 49)]);
      
      setScanStatus({
        loading: false,
        success: { 
          message: result.message || t('livraison.article_delivered'), 
          detail: code 
        },
        error: null
      });
      setTimeout(() => setScanStatus(null), 1500);
      const comp = await rafraichirComparatif(dist.id);
      if (comp && !isDistributionComplete(comp)) voice.sayArticleLivre(calculerStats(comp).reste);
    } catch (error) {
      const heure = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      setHistorique(prev => [{ 
        code, 
        ok: false, 
        msg: error.message, 
        heure 
      }, ...prev.slice(0, 49)]);
      setScanStatus({ 
        loading: false, 
        success: null, 
        error: error.message 
      });
      voice.sayArticleRefuse(error.message);
      await Swal.fire({
        icon: 'error',
        title: t('livraison.scan_rejected'),
        text: error.message,
        timer: 1500,
        showConfirmButton: false
      });
      setTimeout(() => setScanStatus(null), 2000);
    } finally {
      setLoading(false);
    }
  }, [distributionRef, rafraichirComparatif, t, voice]);

  // ─── Gestion du scan ──────────────────────────────────────────────────
  const handleScan = useCallback(async (code) => {
    if (!code || loading) return;
    setScanValue("");

    if (etape === "SERVICE") {
      await execScanService(code);
      return;
    }

    if (etape === "SCAN") {
      const agentTrouve = await verifierSiAgent(code);
      if (agentTrouve) {
        await cloturerEtRetourner();
      } else {
        await execScanLinge(code);
      }
      return;
    }
  }, [etape, loading, execScanService, execScanLinge, verifierSiAgent, cloturerEtRetourner]);

  // ─── Reset ──────────────────────────────────────────────────────────────
  const handleReset = async () => {
    const result = await Swal.fire({
      icon: 'warning',
      title: t('livraison.reset_title'),
      text: t('livraison.reset_text'),
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: t('livraison.yes_reset'),
      cancelButtonText: t('common.cancel')
    });
    if (!result.isConfirmed) return;

    setService(null);
    setDistribution(null);
    setComparatif([]);
    setHistorique([]);
    setScanValue("");
    setSearchSvc("");
    setScanStatus(null);
    setEtape("SERVICE");
    await Swal.fire({
      icon: 'info',
      title: t('livraison.reset_success'),
      timer: 1000,
      showConfirmButton: false
    });
  };

  // ─── Helpers ──────────────────────────────────────────────────────────
  const getPlaceholder = () => {
    if (!agent) return t('livraison.agent_not_connected_placeholder');
    if (etape === "SERVICE") return t('livraison.scan_service_code');
    if (etape === "SCAN") return t('livraison.scan_articles');
    return t('livraison.scan');
  };

  const isCloturee = etape === "RESUME";
  const [showStats, setShowStats] = useState(false);

  const servicesFiltres = useMemo(() =>
    services.filter(s => !searchSvc || s.nom?.toLowerCase().includes(searchSvc.toLowerCase()) || s.code?.toLowerCase().includes(searchSvc.toLowerCase())),
    [services, searchSvc]
  );

  const parCategorie = comparatif
    .map((item) => ({ label: getCategorie(item.categorie).label, value: Number(item.quantiteLivree || 0) }))
    .filter((it) => it.value > 0);

  const nomAgent = nomAgentCollecte(agent);
  const etapes = [
    t("livraison.step_identify", "Identification de l'agent"),
    t("livraison.service", "Service"),
    t("livraison.step_articles", "Distribution des articles"),
    t("livraison.step_close", "Clôture"),
  ];
  const faites = [Boolean(agent), Boolean(service), Boolean(service) && stats.demande > 0 && stats.reste === 0, false];

  const ligneComparatif = (item) => {
    const { Icon, accent } = getCategorieMeta(item.categorie);
    const livree = Number(item.quantiteLivree || 0);
    const demande = Number(item.quantiteDemandee || 0);
    const pct = demande > 0 ? Math.min(Math.round((livree / demande) * 100), 100) : 0;
    const complet = demande > 0 && livree >= demande;
    return (
      <LigneCollecte
        key={item.categorie}
        icone={<Icon size={18} strokeWidth={2} />}
        accent={accent}
        titre={t(`categories.${item.categorie}`, getCategorie(item.categorie).label)}
        code={`${t("livraison.collected", "Collecté")} ${item.quantiteCollectee ?? "—"} · ${t("livraison.requested", "Demandé")} ${demande}`}
        estompe={complet}
        etat={complet
          ? <PastilleEtat tone="ok">{t("livraison.completed", "Terminé")}</PastilleEtat>
          : livree > 0
            ? <PastilleEtat tone="info">{pct}%</PastilleEtat>
            : <PastilleEtat tone="muted">{t("livraison.pending", "En attente")}</PastilleEtat>}
        actions={(
          <span className="cl-mini" aria-label={`${livree}/${demande}`}>
            <span className="cl-mini__bar"><i style={{ width: `${pct}%` }} /></span>
            <strong>{livree}<small>/{demande}</small></strong>
          </span>
        )}
      />
    );
  };

  return (
    <div className="collecte-container cr-page rc cc">
      <ToolbarCollecte
        agent={agent}
        chips={distribution ? <span className="rc-mode"><i /> {t("livraison.distribution", "Distribution")} #{distribution.id}</span> : null}
        extra={(
          <>
            <MuteButton
              muted={voice.muted}
              onToggle={voice.toggleMute}
              speaking={voice.speaking}
              lang={voiceLang}
              onLangChange={setVoiceLang}
            />
            <button type="button" className="rc-btn" onClick={() => setShowStats(true)}>
              <BarChart3 size={15} /> {t("common.statistics", "Statistiques")}
            </button>
          </>
        )}
        onReset={etape !== "SERVICE" ? handleReset : undefined}
        resetLabel={t("common.reset", "Réinitialiser")}
      />
      <EtapesCollecte etapes={etapes} faites={faites} label={t("livraison.steps", "Étapes de la distribution")} />

      {!agent ? (
        <AccueilSansAgent
          eyebrow={t("livraison.title")}
          titre={t("livraison.no_agent_connected")}
          scanInputRef={scanInputRef}
          value={scanValue}
          onChange={setScanValue}
          onSubmit={handleScan}
        />
      ) : (
        <div className={etape === "SCAN" ? "rc-layout" : ""}>
          <div className="rc-main">
            <PosteScan
              titre={t("livraison.title")}
              chips={service ? <PastilleEtat tone="info">{service.nom || service.code}</PastilleEtat> : null}
              scanInputRef={scanInputRef}
              value={scanValue}
              onChange={setScanValue}
              onSubmit={handleScan}
              borderColor="#0d9488"
              disabled={isCloturee || loading}
              scanStatus={scanStatus}
            />

            {etape === "SERVICE" && (
              <section className="rc-card">
                <div className="rc-card__head">
                  <h3 className="rc-card__title"><Building2 size={15} /> {t("livraison.choose_service", "Choisir un service")}</h3>
                  <span className="rc-count">{servicesFiltres.length}</span>
                  <input
                    type="search"
                    className="rc-search-input"
                    placeholder={t("common.search")}
                    aria-label={t("common.search")}
                    value={searchSvc}
                    onChange={(e) => setSearchSvc(e.target.value)}
                  />
                </div>
                {servicesFiltres.length === 0 ? (
                  <div className="rc-empty"><Building2 size={26} strokeWidth={1.4} /><strong>{t("common.no_data")}</strong></div>
                ) : (
                  <div className="cl-list">
                    {servicesFiltres.map((svc) => (
                      <LigneCollecte
                        key={svc.id}
                        icone={<Building2 size={18} strokeWidth={2} />}
                        titre={svc.nom}
                        code={svc.code}
                        actions={<BoutonIcone icone={<ArrowRight size={17} strokeWidth={2.4} />} titre={t("livraison.start", "Démarrer")} tone="info" disabled={loading} onClick={() => execScanService(svc.reference)} />}
                      />
                    ))}
                  </div>
                )}
              </section>
            )}

            {(etape === "SCAN" || etape === "SERVICE") && comparatif.length > 0 && (
              <section className="rc-card">
                <div className="rc-card__head">
                  <h3 className="rc-card__title"><ClipboardList size={15} /> {t("livraison.comparison", "Comparatif")}</h3>
                  <span className="rc-count">{comparatif.length}</span>
                </div>
                <div className="cl-list">{comparatif.map(ligneComparatif)}</div>
              </section>
            )}
          </div>

          {etape === "SCAN" && (
            <aside className="rc-side">
              <BilanCollecte
                titre={t("livraison.balance", "Bilan de la distribution")}
                progression={stats.pct || 0}
                items={[
                  { label: t("livraison.requested", "Demandés"), value: stats.demande || 0 },
                  { label: t("livraison.delivered", "Livrés"), value: stats.livree || 0 },
                  { label: t("livraison.remaining", "Restants"), value: stats.reste || 0 },
                  { label: t("livraison.service", "Service"), value: service?.code || "—", texte: true },
                ]}
              />

              <section className="rc-card">
                <div className="rc-card__head">
                  <h3 className="rc-card__title"><History size={15} /> {t("livraison.last_scans", "Derniers scans")}</h3>
                  <span className="rc-count">{historique.length}</span>
                  {historique.length > 0 && (
                    <button type="button" className="rc-btn rc-btn--sm cl-clear" onClick={() => setHistorique([])}>
                      <X size={13} /> {t("common.clear", "Effacer")}
                    </button>
                  )}
                </div>
                {historique.length === 0 ? (
                  <div className="rc-empty"><History size={26} strokeWidth={1.4} /><strong>{t("livraison.no_scans", "Aucun scan")}</strong></div>
                ) : (
                  <div className="rc-log cl-log">
                    {historique.slice(0, 20).map((h, i) => (
                      <div key={i} className={`rc-log__row ${h.ok ? "" : "is-sac"} ${i === 0 ? "is-last" : ""}`} title={h.msg}>
                        <span className="rc-log__time">{h.heure}</span>
                        <span className="rc-log__code"><code>{h.code}</code></span>
                        <span className={`cl-log__icon ${h.ok ? "is-ok" : "is-ko"}`}>{h.ok ? <Check size={14} strokeWidth={3} /> : <X size={14} strokeWidth={3} />}</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <div className="rc-foot">
                <span>{t("livraison.agent", "Agent")} : <b>{nomAgent}</b></span>
                <span>{new Date().toLocaleDateString("fr-FR")}</span>
              </div>
            </aside>
          )}
        </div>
      )}

      {showStats && (
        <QuickStats
          title={t('livraison.title')}
          subtitle={service?.nom || undefined}
          onClose={() => setShowStats(false)}
          kpis={[
            { label: t('livraison.requested'), value: stats.demande || 0 },
            { label: t('livraison.delivered'), value: stats.livree || 0, color: "#10b981" },
            { label: t('livraison.remaining'), value: stats.reste || 0, color: "#f59e0b" },
            { label: t('livraison.progress'), value: `${stats.pct || 0}%`, color: "#6366f1" },
          ]}
          repartitions={[{ title: t('livraison.category'), items: parCategorie }]}
        />
      )}
    </div>
  );
}
