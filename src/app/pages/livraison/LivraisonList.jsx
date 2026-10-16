import React, {
  useState, useRef, useEffect,
  useCallback, useMemo
} from "react";
import { useTranslation } from "react-i18next";
import { useContext } from "react";
import { ServiceContext } from "../../contextes/ServiceContext";
import { useModal } from "../../contextes/ModalContext";
import {
  FaTruck, FaUser, FaCheck, FaTimes,
  FaSpinner, FaBoxes, FaHistory, 
  FaCheckCircle, FaClock, FaSearch, FaBuilding, FaRedo,
  FaExclamationTriangle
} from "react-icons/fa";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import ScanInput from "../../components/utils/shared/ScanInput";
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
} from "../../services/distributionService";
import Swal from "sweetalert2";
import "../Linge/WorkflowList.css";
import { PageHeaderIcon } from "../../components/layout/PageHeaderIcon";
import MuteButton from "../../components/utils/MuteButton";
import { useVoiceGuide } from "../../hooks/useVoiceGuide";
import { getSetting, bipScan } from "../../utils/appSettings";

function ScanStatus({ loading, success, error, code }) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div style={{
        padding: "14px 18px",
        borderRadius: "12px",
        background: "#eff6ff",
        border: "1px solid #93c5fd",
        display: "flex",
        alignItems: "center",
        gap: "14px",
        marginTop: "12px",
        animation: "fadeIn 0.3s ease-out"
      }}>
        <FaSpinner className="animate-spin" color="#3b82f6" size={22} />
        <div>
          <p style={{ fontWeight: 600, color: "#1d4ed8", fontSize: "14px", margin: 0 }}>
            {t('livraison.scanning')}
          </p>
          <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>{code}</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div style={{
        padding: "14px 18px",
        borderRadius: "12px",
        background: "#f0fdf4",
        border: "1px solid #86efac",
        display: "flex",
        alignItems: "center",
        gap: "14px",
        marginTop: "12px",
        animation: "fadeIn 0.3s ease-out"
      }}>
        <div style={{
          width: "36px",
          height: "36px",
          borderRadius: "50%",
          background: "#dcfce7",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <FaCheckCircle color="#22c55e" size={20} />
        </div>
        <div>
          <p style={{ fontWeight: 600, color: "#15803d", fontSize: "14px", margin: 0 }}>
            ✓ {success.message || t('common.success')}
          </p>
          <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>{success.detail}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: "14px 18px",
        borderRadius: "12px",
        background: "#fef2f2",
        border: "1px solid #fca5a5",
        display: "flex",
        alignItems: "center",
        gap: "14px",
        marginTop: "12px",
        animation: "fadeIn 0.3s ease-out"
      }}>
        <div style={{
          width: "36px",
          height: "36px",
          borderRadius: "50%",
          background: "#fee2e2",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <FaExclamationTriangle color="#ef4444" size={18} />
        </div>
        <div>
          <p style={{ fontWeight: 600, color: "#dc2626", fontSize: "14px", margin: 0 }}>
            {t('common.error')}
          </p>
          <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>{error}</p>
        </div>
      </div>
    );
  }

  return null;
}

// ─── StatutCard ──────────────────────────────────────────────────────────────
function StatutCard({ label, value, icon, color, bg, subValue }) {
  return (
    <div style={{
      padding: "16px 18px",
      borderRadius: "14px",
      background: bg,
      border: `1px solid ${color}25`,
      flex: 1,
      minWidth: "100px",
      transition: "all 0.2s ease"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{
          width: "40px",
          height: "40px",
          borderRadius: "12px",
          background: `${color}15`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "20px"
        }}>
          {icon}
        </div>
        <div>
          <p style={{ fontSize: "10px", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", margin: 0 }}>
            {label}
          </p>
          <p style={{ fontSize: "24px", fontWeight: 700, color: color, margin: 0, lineHeight: 1.2 }}>
            {value}
          </p>
          {subValue && (
            <p style={{ fontSize: "10px", color: "#94a3b8", margin: 0 }}>{subValue}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── LigneComparatif ──────────────────────────────────────────────────────────
function LigneComparatif({ item }) {
  const { t } = useTranslation();
  const c = getCategorie(item.categorie);
  const livree = Number(item.quantiteLivree || 0);
  const demande = Number(item.quantiteDemandee || 0);
  const reste = Math.max(0, demande - livree);
  const pct = demande > 0 ? Math.min(Math.round((livree / demande) * 100), 100) : 0;
  const complet = livree >= demande && demande > 0;

  return (
    <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
      <td style={{ padding: "8px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "18px" }}>{c.emoji}</span>
          <span style={{ fontWeight: 600, fontSize: "12px", color: "#0f172a" }}>{c.label}</span>
        </div>
      </td>
      <td style={{ padding: "8px 12px", textAlign: "right", fontSize: "12px", color: "#64748b" }}>
        {item.quantiteCollectee ?? "—"}
      </td>
      <td style={{ padding: "8px 12px", textAlign: "right", fontSize: "12px", fontWeight: 600, color: "#0f172a" }}>
        {demande}
      </td>
      <td style={{ padding: "8px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ flex: 1, height: "6px", background: "#f1f5f9", borderRadius: "3px", overflow: "hidden", minWidth: "50px" }}>
            <div style={{
              width: `${pct}%`, height: "100%", borderRadius: "3px",
              background: complet ? "#10b981" : "#0ea5e9",
              transition: "width 0.5s ease"
            }} />
          </div>
          <span style={{ fontWeight: 700, fontSize: "12px", color: complet ? "#10b981" : "#0f172a", minWidth: "35px", textAlign: "right" }}>
            {livree}
          </span>
        </div>
      </td>
      <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600, fontSize: "12px", color: reste === 0 ? "#10b981" : "#f59e0b" }}>
        {reste}
      </td>
      <td style={{ padding: "8px 12px", textAlign: "center" }}>
        {complet ? (
          <span style={{ padding: "2px 10px", borderRadius: "10px", background: "#dcfce7", color: "#15803d", fontSize: "10px", fontWeight: 600 }}>
            {t('livraison.completed')}
          </span>
        ) : livree > 0 ? (
          <span style={{ padding: "2px 10px", borderRadius: "10px", background: "#dbeafe", color: "#1d4ed8", fontSize: "10px", fontWeight: 600 }}>
            {pct}%
          </span>
        ) : (
          <span style={{ padding: "2px 10px", borderRadius: "10px", background: "#f1f5f9", color: "#94a3b8", fontSize: "10px", fontWeight: 600 }}>
            {t('livraison.pending')}
          </span>
        )}
      </td>
    </tr>
  );
}

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

  const getBorderColor = () => {
    if (!agent) return "#dc2626";
    if (etape === "SERVICE") return "#0ea5e9";
    if (etape === "SCAN") return "#0ea5e9";
    return "#e2e8f0";
  };

  const isCloturee = etape === "RESUME";
  const showAgentHint = etape === "SCAN" && distribution;

  const servicesFiltres = useMemo(() =>
    services.filter(s => !searchSvc || s.nom?.toLowerCase().includes(searchSvc.toLowerCase()) || s.code?.toLowerCase().includes(searchSvc.toLowerCase())),
    [services, searchSvc]
  );

  return (
    <div className="collecte-container">

      <div style={{
        marginBottom: "32px", display: "flex", alignItems: "center",
        justifyContent: "space-between", flexWrap: "wrap", gap: "12px"
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "16px"
        }}>
          <PageHeaderIcon size={56} />
          <div>
            <h1 style={{
              fontSize: "28px",
              fontWeight: 800,
              color: "#0f172a",
              margin: 0
            }}>
              {t('livraison.title')}
            </h1>
            <p style={{
              fontSize: "14px",
              color: "#64748b",
              margin: "2px 0 0 0"
            }}>
              {agent ? `${t('livraison.agent')}: ${agent.nom}` : t('livraison.no_agent_connected')}
            </p>
          </div>
        </div>

        <MuteButton
          muted={voice.muted}
          onToggle={voice.toggleMute}
          speaking={voice.speaking}
          lang={voiceLang}
          onLangChange={setVoiceLang}
        />
      </div>

      <div style={{
        background: "white",
        borderRadius: "20px",
        padding: "32px",
        border: "1px solid #e2e8f0",
        boxShadow: "0 4px 20px rgba(0,0,0,0.06)"
      }}>

        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "12px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            {agent && (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px 18px",
                background: "#faf5ff",
                borderRadius: "12px",
                border: "1px solid #e9d5ff"
              }}>
                <FaUser color="#7c3aed" size={16} />
                <span style={{ fontWeight: 700, color: "#7c3aed", fontSize: "14px" }}>{agent.nom}</span>
                <Badge style={{ background: "#ede9fe", color: "#7c3aed", fontSize: "10px", padding: "2px 10px", borderRadius: "12px" }}>
                  {agent.matricule}
                </Badge>
              </div>
            )}
            {service && (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px 18px",
                background: "#f0f9ff",
                borderRadius: "12px",
                border: "1px solid #bae6fd"
              }}>
                <FaBuilding color="#0284c7" size={16} />
                <span style={{ fontWeight: 700, color: "#0284c7", fontSize: "14px" }}>{service.nom}</span>
                <Badge style={{ background: "#e0f2fe", color: "#0284c7", fontSize: "10px", padding: "2px 10px", borderRadius: "12px" }}>
                  {stats.demande} {t('livraison.articles')}
                </Badge>
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            {etape !== "SERVICE" && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                style={{
                  fontSize: "12px",
                  gap: "6px",
                  borderColor: "#fca5a5",
                  color: "#dc2626",
                  borderRadius: "10px",
                  padding: "6px 14px"
                }}
              >
                <FaRedo size={10} />
                {t('common.reset')}
              </Button>
            )}
          </div>
        </div>

        {!agent && (
          <div style={{
            padding: "12px 16px",
            borderRadius: "10px",
            background: "#fef2f2",
            border: "1px solid #fca5a5",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "13px",
            color: "#dc2626"
          }}>
            <FaExclamationTriangle size={16} />
            <span style={{ fontWeight: 600, color: "#dc2626" }}>{t('livraison.no_agent_connected')}</span>
            <span style={{ color: "#64748b" }}>{t('livraison.no_agent_connect_text')}</span>
          </div>
        )}

        <Card style={{
          marginBottom: "20px",
          border: `2px dashed ${isCloturee ? "#e2e8f0" : getBorderColor()}`,
          background: isCloturee ? "#f8fafc" : "white",
          borderRadius: "16px"
        }}>
          <CardContent className="p-5">
            <ScanInput
              ref={scanInputRef}
              placeholder={getPlaceholder()}
              value={scanValue}
              onChange={setScanValue}
              onSubmit={handleScan}
              borderColor={isCloturee ? "#e2e8f0" : getBorderColor()}
              keepFocus={true}
              autoDebounce={true}
              disabled={isCloturee || loading || !agent}
            />
            {scanStatus && <ScanStatus {...scanStatus} />}
          </CardContent>
        </Card>

        {showAgentHint && (
          <Card style={{ background: "#fef3c7", border: "1px solid #fcd34d", marginBottom: "16px", borderRadius: "12px" }}>
            <CardContent className="p-4">
              <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px" }}>
                <FaUser color="#d97706" size={16} />
                <span style={{ fontWeight: 600, color: "#92400e" }}>💡 {t('livraison.scan_agent_to_close')}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {agent && etape === "SERVICE" && (
          <Card style={{ background: "#f0f9ff", border: "1px solid #bae6fd", marginBottom: "16px", borderRadius: "12px" }}>
            <CardContent className="p-4">
              <div style={{ fontSize: "13px", fontWeight: 600, color: "#0284c7", marginBottom: "10px" }}>
                🏢 {t('livraison.choose_service')}
              </div>
              <div style={{ position: "relative", marginBottom: "10px" }}>
                <FaSearch size={12} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
                <input
                  type="text"
                  placeholder={t('common.search')}
                  value={searchSvc}
                  onChange={e => setSearchSvc(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px 8px 34px",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    fontSize: "13px",
                    outline: "none",
                    boxSizing: "border-box"
                  }}
                />
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", maxHeight: "180px", overflowY: "auto" }}>
                {servicesFiltres.map(svc => (
                  <button
                    key={svc.id}
                    onClick={() => {
                      execScanService(svc.reference);
                    }}
                    disabled={loading}
                    style={{
                      padding: "6px 14px",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      background: "white",
                      cursor: loading ? "not-allowed" : "pointer",
                      fontSize: "12px",
                      fontWeight: 500,
                      color: "#0f172a",
                      transition: "all 0.15s"
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "#7c3aed"; e.currentTarget.style.background = "#faf5ff"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "white"; }}
                  >
                    {svc.code} - {svc.nom}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {(etape === "SCAN" || etape === "SERVICE") && agent && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: "12px",
            marginBottom: "20px"
          }}>
            <StatutCard
              label={t('livraison.requested')}
              value={stats.demande || 0}
              icon="📋"
              color="#0ea5e9"
              bg="#f0f9ff"
            />
            <StatutCard
              label={t('livraison.delivered')}
              value={stats.livree || 0}
              icon="✅"
              color="#15803d"
              bg="#f0fdf4"
              subValue={stats.pct > 0 ? `${stats.pct}%` : ""}
            />
            <StatutCard
              label={t('livraison.remaining')}
              value={stats.reste || 0}
              icon="⏳"
              color="#d97706"
              bg="#fef3c7"
            />
            <StatutCard
              label={t('livraison.progress')}
              value={`${stats.pct || 0}%`}
              icon="📊"
              color="#7c3aed"
              bg="#faf5ff"
              subValue={stats.pct === 100 ? `✅ ${t('livraison.completed')}` : ""}
            />
          </div>
        )}

        {etape === "SCAN" && historique.length > 0 && (
          <div style={{
            background: "#f8fafc",
            borderRadius: "12px",
            padding: "12px 16px",
            border: "1px solid #e2e8f0",
            marginBottom: "16px"
          }}>
            <div style={{ fontWeight: 600, fontSize: "12px", color: "#64748b", marginBottom: "8px", display: "flex", justifyContent: "space-between" }}>
              <span>📋 {t('livraison.last_scans')}</span>
              <button onClick={() => setHistorique([])} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "11px" }}>
                {t('common.clear')}
              </button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", maxHeight: "70px", overflowY: "auto" }}>
              {historique.slice(0, 20).map((h, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "2px 10px",
                    borderRadius: "8px",
                    fontSize: "10px",
                    fontWeight: 500,
                    background: h.ok ? "#dcfce7" : "#fee2e2",
                    color: h.ok ? "#15803d" : "#dc2626",
                    border: `1px solid ${h.ok ? "#bbf7d0" : "#fecaca"}`
                  }}
                >
                  {h.ok ? <FaCheck size={8} /> : <FaTimes size={8} />}
                  <code>{h.code}</code>
                  <span style={{ color: "#94a3b8", fontSize: "8px" }}>{h.heure}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {(etape === "SCAN" || etape === "SERVICE") && comparatif.length > 0 && (
          <div style={{
            marginTop: "20px",
            background: "#f8fafc",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            overflow: "hidden"
          }}>
            <div style={{
              padding: "10px 16px",
              background: "#f1f5f9",
              borderBottom: "1px solid #e2e8f0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <span style={{ fontWeight: 600, fontSize: "13px", color: "#0f172a" }}>📊 {t('livraison.comparison')}</span>
              <span style={{ fontSize: "12px", color: "#64748b" }}>{stats.livree} / {stats.demande} ({stats.pct}%)</span>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    <th style={{ padding: "6px 12px", textAlign: "left", fontWeight: 600, color: "#64748b", borderBottom: "1px solid #e2e8f0" }}>{t('livraison.category')}</th>
                    <th style={{ padding: "6px 12px", textAlign: "right", fontWeight: 600, color: "#64748b", borderBottom: "1px solid #e2e8f0" }}>{t('livraison.collected')}</th>
                    <th style={{ padding: "6px 12px", textAlign: "right", fontWeight: 600, color: "#64748b", borderBottom: "1px solid #e2e8f0" }}>{t('livraison.requested')}</th>
                    <th style={{ padding: "6px 12px", textAlign: "right", fontWeight: 600, color: "#64748b", borderBottom: "1px solid #e2e8f0" }}>{t('livraison.delivered')}</th>
                    <th style={{ padding: "6px 12px", textAlign: "right", fontWeight: 600, color: "#64748b", borderBottom: "1px solid #e2e8f0" }}>{t('livraison.remaining')}</th>
                    <th style={{ padding: "6px 12px", textAlign: "center", fontWeight: 600, color: "#64748b", borderBottom: "1px solid #e2e8f0" }}>{t('livraison.status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {comparatif.map(item => (
                    <LigneComparatif key={item.categorie} item={item} />
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: "#f8fafc", borderTop: "2px solid #e2e8f0" }}>
                    <td style={{ padding: "6px 12px", fontWeight: 700 }}>{t('livraison.total')}</td>
                    <td style={{ padding: "6px 12px", textAlign: "right", color: "#64748b" }}>—</td>
                    <td style={{ padding: "6px 12px", textAlign: "right", fontWeight: 700 }}>{stats.demande}</td>
                    <td style={{ padding: "6px 12px", textAlign: "right", fontWeight: 700, color: "#0ea5e9" }}>{stats.livree}</td>
                    <td style={{ padding: "6px 12px", textAlign: "right", fontWeight: 700, color: "#f59e0b" }}>{stats.reste}</td>
                    <td style={{ padding: "6px 12px", textAlign: "center" }}>
                      {stats.pct === 100 ? (
                        <span style={{ padding: "2px 10px", borderRadius: "8px", background: "#dcfce7", color: "#15803d", fontSize: "10px", fontWeight: 600 }}>{t('livraison.completed')}</span>
                      ) : (
                        <span style={{ padding: "2px 10px", borderRadius: "8px", background: "#dbeafe", color: "#1d4ed8", fontSize: "10px", fontWeight: 600 }}>{stats.pct}%</span>
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: "16px",
          borderTop: "1px solid #e2e8f0",
          fontSize: "12px",
          color: "#64748b",
          flexWrap: "wrap",
          gap: "8px",
          marginTop: "16px"
        }}>
          <div style={{ display: "flex", gap: "16px" }}>
            {agent && <span>{t('livraison.agent')}: <strong style={{ color: "#0f172a" }}>{agent.nom}</strong></span>}
            {service && <span>{t('livraison.service')}: <strong style={{ color: "#0f172a" }}>{service.nom}</strong></span>}
            {distribution && <span style={{ color: "#7c3aed" }}>{t('livraison.distribution')} #{distribution.id}</span>}
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <span>{new Date().toLocaleDateString("fr-FR")}</span>
            <span>•</span>
            <span>{new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
          </div>
        </div>

      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}