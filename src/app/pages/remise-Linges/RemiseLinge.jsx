import React, { useState, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import { FaCheckDouble } from "react-icons/fa";
import {
  Check,
  CircleCheck,
  Flag,
  History,
  Hourglass,
  LoaderCircle,
  Package,
  PackageCheck,
  PackagePlus,
  RefreshCw,
  RotateCcw,
  TriangleAlert,
  Truck,
  User,
  Users,
  ChevronDown,
  ScanBarcode,
  Undo2,
} from "lucide-react";
import ScanInput from "../../components/utils/shared/ScanInput";
import { RemiseLingeProvider, useRemiseLinge } from "../../contextes/RemiseLingeContext";
import { formatDate, getRemiseStatutConfig } from "../../services/remiseLingeService";
import { useServiceName } from "../../hooks/useServiceName";
import ApercuRemise, { CollectesConcernees } from "./ApercuRemise";
import { accentOf } from "../stockageArsenal/arsenalUtils";
import { Illustration } from "../stockageArsenal/illustrations";
import "../Linge/WorkflowList.css";
import "../stockageArsenal/StockageArsenal.css";
import "./RemiseLinge.css";

import lottie from "lottie-web";
import { PageHeaderIcon } from "../../components/layout/PageHeaderIcon";


function SuccessAnimation({ show, onComplete }) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const containerRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    if (show) {
      setVisible(true);
      setIsExiting(false);

      const loadAnimation = async () => {
        try {
          const response = await fetch(
            "https://assets2.lottiefiles.com/packages/lf20_usmfx6bp.json"
          );
          const animationData = await response.json();

          if (containerRef.current) {
            animationRef.current = lottie.loadAnimation({
              container: containerRef.current,
              renderer: "svg",
              loop: false,
              autoplay: true,
              animationData: animationData,
              rendererSettings: {
                preserveAspectRatio: "xMidYMid meet",
              },
            });

            animationRef.current.addEventListener("complete", () => {
              console.log("Animation terminée");
            });
          }
        } catch (err) {
          console.error("Erreur chargement animation Lottie:", err);
          if (containerRef.current) {
            containerRef.current.innerHTML = `
              <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;border-radius:50%;background:linear-gradient(135deg,#10b981,#059669);">
                <svg viewBox="0 0 100 100" style="width:60%;height:60%;">
                  <path d="M25 50 L42 67 L75 34" fill="none" stroke="white" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </div>
            `;
          }
        }
      };

      loadAnimation();

      const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => {
          setVisible(false);
          if (animationRef.current) {
            animationRef.current.destroy();
            animationRef.current = null;
          }
          if (onComplete) onComplete();
        }, 600);
      }, 3000);

      return () => {
        clearTimeout(timer);
        if (animationRef.current) {
          animationRef.current.destroy();
          animationRef.current = null;
        }
      };
    } else {
      if (animationRef.current) {
        animationRef.current.destroy();
        animationRef.current = null;
      }
    }
  }, [show, onComplete]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0, 0, 0, 0.5)",
        backdropFilter: "blur(8px)",
        animation: isExiting
          ? "fadeOut 0.5s ease-in-out forwards"
          : "fadeIn 0.4s ease-out",
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: "32px",
          padding: "48px 56px",
          maxWidth: "480px",
          width: "100%",
          textAlign: "center",
          boxShadow: "0 40px 80px rgba(0,0,0,0.3)",
          transform: isExiting ? "scale(0.9)" : "scale(1)",
          transition: "transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
          animation: isExiting
            ? "scaleDown 0.5s ease-in-out forwards"
            : "scaleUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        }}
      >
        <div
          ref={containerRef}
          style={{
            width: "200px",
            height: "200px",
            margin: "0 auto -20px",
          }}
        />

        <h2
          style={{
            fontSize: "28px",
            fontWeight: 800,
            color: "#0f172a",
            margin: "0 0 8px 0",
          }}
        >
          {t('remise.delivery_success_title')}
        </h2>
        <p
          style={{
            fontSize: "16px",
            color: "#64748b",
            margin: 0,
          }}
        >
          {t('remise.delivery_success_text')}
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: "16px",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #10b981, #059669)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          >
            <FaCheckDouble size={24} color="white" />
          </div>
        </div>

        <div
          style={{
            marginTop: "12px",
            display: "inline-block",
            padding: "4px 16px",
            borderRadius: "12px",
            background: "#f0fdf4",
            border: "1px solid #86efac",
            color: "#059669",
            fontSize: "12px",
            fontWeight: 600,
          }}
        >
          ✨ {t('remise.confirmation_sent')}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; backdrop-filter: blur(0px); }
          to { opacity: 1; backdrop-filter: blur(8px); }
        }
        @keyframes fadeOut {
          from { opacity: 1; backdrop-filter: blur(8px); }
          to { opacity: 0; backdrop-filter: blur(0px); }
        }
        @keyframes scaleUp {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes scaleDown {
          from { transform: scale(1); opacity: 1; }
          to { transform: scale(0.8); opacity: 0; }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}



// ─── Éléments visuels (thème global .sa-* + .rl-*) ──────────────────────────

function Meter({ value, label }) {
  const pct = Math.min(Math.max(value, 0), 100);
  return (
    <div className="sa-meter" style={{ marginBottom: 18 }}>
      <div className="sa-meter__row">
        <span>{label}</span>
        <strong>{pct} %</strong>
      </div>
      <div className="sa-meter__bar">
        <span style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Kpi({ label, value, sub, Icon, color }) {
  return (
    <div className="rl-kpi" style={color ? { "--k": color } : undefined}>
      <div className="rl-kpi__top">
        <span className="rl-kpi__label">{label}</span>
        <span className="rl-kpi__icon"><Icon size={16} /></span>
      </div>
      <div className="rl-kpi__value">{value}</div>
      {sub && <div className="rl-kpi__sub">{sub}</div>}
    </div>
  );
}

/** remis / à remettre pour une catégorie (quantiteRemise / quantiteCollectee). */
function CategorieRow({ categorie, collecte, livre, reste }) {
  const { t } = useTranslation();
  const isComplete = reste === 0 && collecte > 0;
  const pct = collecte > 0 ? Math.round((livre / collecte) * 100) : 0;
  return (
    <div className={`rl-cat ${isComplete ? "is-done" : ""}`} style={{ "--c": accentOf(categorie) }}>
      <span className="rl-cat__name">
        <i className="sa-dot" />
        {t(`categories.${categorie}`, categorie)}
      </span>
      <div className="rl-cat__bar"><span style={{ width: `${pct}%` }} /></div>
      <span className="rl-cat__nums">
        <span><b>{livre}</b> / {collecte}</span>
        {isComplete ? (
          <span className="rl-pill is-done">✓ {t("remise.complete")}</span>
        ) : (
          <span className="rl-pill is-left">{t("remise.n_left", { count: reste })}</span>
        )}
      </span>
    </div>
  );
}

function ScanFeedback({ status }) {
  const { t } = useTranslation();
  if (!status) return null;
  if (status.loading) {
    return (
      <div className="rl-feedback is-loading">
        <LoaderCircle size={16} className="animate-spin" />
        <strong>{t("remise.scanning")}</strong>
        <code>{status.code}</code>
      </div>
    );
  }
  if (status.success?.annule) {
    return (
      <div className="rl-feedback is-loading">
        <Undo2 size={16} />
        <strong>{t("remise.linen_cancelled")}</strong>
        <code>{status.success.codeBarre}</code>
        <span>· {t(`categories.${status.success.categorie}`, status.success.categorie)}</span>
      </div>
    );
  }
  if (status.success) {
    return (
      <div className="rl-feedback is-ok">
        <CircleCheck size={16} />
        <strong>{t("remise.linen_delivered_success")}</strong>
        <code>{status.success.codeBarre}</code>
        <span>· {t(`categories.${status.success.categorie}`, status.success.categorie)}</span>
      </div>
    );
  }
  if (status.error) {
    return (
      <div className="rl-feedback is-ko">
        <TriangleAlert size={16} />
        <strong>{t("common.error")}</strong>
        <span>{status.error}</span>
      </div>
    );
  }
  return null;
}

function TrackItem({ icon, label, value, meta, state, action, onAction }) {
  const { t } = useTranslation();
  return (
    <li className={`sa-track__item is-${state}`} aria-current={state === "active" ? "step" : undefined}>
      <span className="sa-track__dot">{state === "done" ? <Check size={13} strokeWidth={3} /> : icon}</span>
      <div className="sa-track__body">
        <span className="sa-track__label">{label}</span>
        {value ? (
          <span className="sa-track__value">{value}</span>
        ) : (
          <span className="sa-track__placeholder">{state === "active" ? t("remise.in_progress") : "—"}</span>
        )}
        {meta && <span className="sa-track__meta">{meta}</span>}
      </div>
      {action && (
        <button type="button" className="sa-link" onClick={onAction}>
          {action}
        </button>
      )}
    </li>
  );
}

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────

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
  // Mode « Annuler un linge » : le scan retire le linge de la remise au lieu de le remettre
  const [modeAnnulation, setModeAnnulation] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const scanInputRef = useRef(null);

  // ─── Alertes ─────────────────────────────────────────────────────────────
  const showAlert = useCallback(
    (title, text, icon = "info", timer = null) => {
      return Swal.fire({
        title,
        text,
        icon,
        timer,
        timerProgressBar: true,
        showConfirmButton: !!timer,
        confirmButtonColor: "#0ca678",
        confirmButtonText: t('common.ok'),
        ...(timer ? { showConfirmButton: false } : {}),
      });
    },
    [t]
  );

  // ─── Handlers ────────────────────────────────────────────────────────────
  const handleScan = useCallback(
    async (code) => {
      if (!code?.trim()) return;

      setScanValue("");

      try {
        // Étape 1: Scan Agent Remise
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

        // Étape 2: Scan Agent Collecte → aperçu des collectes (la remise est créée après)
        if (etape === "AGENT_COLLECTE") {
          await scanAgentCollecte(code.trim(), agentRemise);
          return;
        }

        // Étape 3 bis: annulation de la remise d'un linge
        if (etape === "SCAN" && modeAnnulation) {
          await annulerLinge(code.trim());
          setTimeout(() => clearScanStatus(), 2500);
          setTimeout(() => scanInputRef.current?.focus(), 100);
          return;
        }

        // Étape 3: Scan Linge
        if (etape === "SCAN") {
          const result = await scanLinge(code.trim());

          if (result && !result.error) {
            setShowSuccessAnimation(true);
          }

          if (result.isComplete) {
            await Swal.fire({
              title: t('remise.delivery_completed_title'),
              text: t('remise.delivery_completed_text'),
              icon: "success",
              timer: 2500,
              timerProgressBar: true,
              showConfirmButton: false,
              confirmButtonColor: "#0ca678",
            });
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

  // Annulation depuis la liste « Remis pendant cette séance » (avec confirmation)
  const handleAnnulerDepuisListe = async (codeBarre) => {
    const { isConfirmed } = await Swal.fire({
      title: t('remise.cancel_confirm_title'),
      text: t('remise.cancel_confirm_text', { code: codeBarre }),
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#e03131",
      confirmButtonText: t('remise.cancel_linen'),
      cancelButtonText: t('common.cancel'),
    });
    if (!isConfirmed) return;
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

  // Collectes encore ouvertes pour le service de la remise (rafraîchies après chaque scan)
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

  // En mode annulation, le scan reste possible même si la remise est terminée
  const isDisabled = (isCloturee && !modeAnnulation) || loading || !agentRemise || etape === "APERCU";

  // ─── Parcours ───────────────────────────────────────────────────────────
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

  const STAGES = {
    AGENT_REMISE: { title: t("remise.stage_agent_remise_title"), text: t("remise.stage_agent_remise_text"), art: "badge" },
    AGENT_COLLECTE: { title: t("remise.stage_agent_collecte_title"), text: t("remise.stage_agent_collecte_text"), art: "badge" },
    APERCU: { title: t("remise.stage_apercu_title"), text: t("remise.stage_apercu_text"), art: "remise" },
    SCAN: isCloturee
      ? { title: t("remise.delivery_completed"), text: t("remise.stage_done_text"), art: "done" }
      : { title: t("remise.stage_scan_title"), text: t("remise.stage_scan_text"), art: "count" },
  };
  const stage = STAGES[etape] || STAGES.AGENT_REMISE;

  return (
    <div className="collecte-container sa-page">
      <SuccessAnimation
        show={showSuccessAnimation}
        onComplete={() => {
          setShowSuccessAnimation(false);
          setTimeout(() => scanInputRef.current?.focus(), 200);
        }}
      />

      {/* ─── En-tête ───────────────────────────────────────────────────── */}
      <header className="page-head sa-topbar">
        <div className="sa-header">
          <PageHeaderIcon size={44} radius={14} />
          <div style={{ minWidth: 0 }}>
            <h1>{t('remise.title')}</h1>
            <p>
              {agentRemise
                ? `${t('remise.agent')} : ${agentRemise.nomPrenom || agentRemise.nom}`
                : t('remise.no_agent_connected')}
              {remise && <span className="rl-num"><Truck size={12} /> {remise.numeroLivraison}</span>}
            </p>
          </div>
        </div>

        <div className="rl-actions">
          {etape === "SCAN" && (
            <>
              <button type="button" className="sa-btn sa-btn--sm" onClick={rafraichir} disabled={loading}>
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> {t('common.refresh')}
              </button>
              <button type="button" className="sa-btn sa-btn--sm" onClick={() => { setModeAnnulation(false); nouvelleRemise(); }} disabled={loading}>
                <PackagePlus size={14} /> {t('remise.new_delivery')}
              </button>
            </>
          )}
          <button type="button" className="sa-btn sa-btn--sm sa-btn--ghost rl-btn-danger" onClick={() => { setModeAnnulation(false); resetAll(); }}>
            <RotateCcw size={14} /> {t('common.reset')}
          </button>
        </div>
      </header>

      <div className="sa-flow">
        {/* ─── Parcours ────────────────────────────────────────────────── */}
        <aside className="sa-track" aria-label={t('remise.track_title')}>
          <div className="sa-track__title">{t('remise.track_title')}</div>
          <ol>
            <TrackItem
              icon={<User size={13} />}
              label={t('remise.step_delivery_agent')}
              value={agentRemise ? agentRemise.nomPrenom || agentRemise.nom : null}
              meta={agentRemise ? agentRemise.codeBarre || agentRemise.matricule : null}
              state={agentRemise ? "done" : "active"}
            />
            <TrackItem
              icon={<Users size={13} />}
              label={t('remise.step_collection_agent')}
              value={agentCollecte ? agentCollecte.nomPrenom || agentCollecte.nom : null}
              meta={agentCollecte ? agentCollecte.codeBarre || agentCollecte.matricule : null}
              state={stateOf("AGENT_COLLECTE")}
              action={etape === "APERCU" ? t('common.edit') : null}
              onAction={changerAgentCollecte}
            />
            <TrackItem
              icon={<Package size={13} />}
              label={t('remise.service')}
              value={serviceRemise != null ? serviceName(serviceRemise) : null}
              meta={etape === "APERCU" && serviceRemise != null ? t('remise.n_collectes', { count: nbCollectesService }) : null}
              state={stateOf("APERCU")}
            />
            <TrackItem
              icon={<PackageCheck size={13} />}
              label={t('remise.delivery')}
              value={remise?.numeroLivraison}
              meta={remise ? t('remise.n_delivered_of', { done: totaux.remis, total: totaux.collecte }) : null}
              state={stateOf("SCAN", isCloturee)}
            />
          </ol>
        </aside>

        {/* ─── Étape en cours ──────────────────────────────────────────── */}
        <section className="sa-stage">
          <div className="sa-stage__head">
            <div style={{ minWidth: 0, flex: 1 }}>
              <span className="sa-eyebrow">{t('remise.step_of', { n: Math.max(at, 0) + 1, total: ORDRE.length })}</span>
              <h2 className="sa-stage__title">{stage.title}</h2>
              <p className="sa-stage__text">{stage.text}</p>
            </div>
            <div className="sa-stage__art"><Illustration kind={stage.art} /></div>
          </div>

          {!agentRemise && (
            <div className="sa-banner is-warning" style={{ marginBottom: 14 }}>
              <span className="sa-banner__icon"><TriangleAlert size={18} /></span>
              <div>
                <strong>{t('remise.no_agent_connected')}</strong>
                <span>{t('remise.no_agent_connect_text')}</span>
              </div>
            </div>
          )}

          {/* Champ de scan (masqué pendant l'aperçu) */}
          {etape !== "APERCU" && (
            <div className="sa-scan" style={{ marginBottom: 16 }}>
              {etape === "SCAN" && (
                <div className="sa-segment" role="tablist" aria-label={t('remise.scan_mode')}>
                  <button type="button" role="tab" aria-selected={!modeAnnulation} className={!modeAnnulation ? "is-active" : ""} onClick={() => setModeAnnulation(false)}>
                    <ScanBarcode size={15} /> {t('remise.mode_deliver')}
                  </button>
                  <button type="button" role="tab" aria-selected={modeAnnulation} className={modeAnnulation ? "is-active rl-mode-cancel" : ""} onClick={() => setModeAnnulation(true)}>
                    <Undo2 size={15} /> {t('remise.mode_cancel')}
                  </button>
                </div>
              )}
              <ScanInput
                ref={scanInputRef}
                placeholder={getPlaceholder()}
                value={scanValue}
                onChange={setScanValue}
                onSubmit={handleScan}
                borderColor={etape === "SCAN" && modeAnnulation ? "#e03131" : isCloturee ? "#cbd5e1" : !agentRemise ? "#e03131" : "#0ca678"}
                keepFocus={true}
                autoDebounce={true}
                disabled={isDisabled}
              />
              <ScanFeedback status={scanStatus} />
            </div>
          )}

          {/* Aperçu des collectes non clôturées, avant la création de la remise */}
          {etape === "APERCU" && apercu && (
            <ApercuRemise
              apercu={apercu}
              agentCollecte={agentCollecte}
              serviceChoisi={serviceChoisi}
              onChoisirService={choisirService}
              onCreer={handleCreerRemise}
              onChangerAgent={changerAgentCollecte}
              loading={loading}
            />
          )}

          {etape === "SCAN" && remise && (
            <>
              <div className="rl-kpis">
                <Kpi
                  label={t('remise.total_to_deliver')}
                  value={totaux.collecte}
                  sub={t('remise.n_open_collectes', { count: collectesRemise.length })}
                  Icon={Package}
                />
                <Kpi
                  label={t('remise.total_delivered')}
                  value={totaux.remis}
                  sub={`${totaux.pourcentage} % ${t('remise.of_total')}`}
                  Icon={CircleCheck}
                  color="var(--sa)"
                />
                <Kpi
                  label={t('remise.remaining')}
                  value={totaux.reste}
                  sub={totaux.reste === 0 ? `✓ ${t('remise.completed')}` : t('remise.pending')}
                  Icon={Hourglass}
                  color={totaux.reste === 0 ? "var(--sa)" : "var(--sa-warn)"}
                />
                <Kpi
                  label={t('remise.status')}
                  value={getRemiseStatutConfig(remise.etat).label}
                  sub={isCloturee ? t('remise.delivery_finished') : t('remise.in_progress')}
                  Icon={Flag}
                  color={isCloturee ? "var(--sa)" : undefined}
                />
              </div>

              <Meter value={totaux.pourcentage} label={t('remise.delivery_progress')} />

              {/* Collectes encore ouvertes : elles disparaissent une fois compensées */}
              <CollectesConcernees collectes={collectesRemise} title={t('remise.collectes_ouvertes')} />

              {/* Linges remis pendant cette séance : annulables d'un clic */}
              {lingesRemis.length > 0 && (
                <div>
                  <div className="sa-subhead">
                    {t('remise.delivered_this_session')}
                    <span className="sa-count">{lingesRemis.length}</span>
                  </div>
                  <div className="rl-cats">
                    {lingesRemis.map((l) => (
                      <div key={l.codeBarre} className="rl-remis" style={{ "--c": accentOf(l.categorie) }}>
                        <i className="sa-dot" />
                        <code>{l.codeBarre}</code>
                        <span>{t(`categories.${l.categorie}`, l.categorie)}</span>
                        <small>{l.date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</small>
                        <button type="button" className="sa-btn sa-btn--sm rl-btn-danger" onClick={() => handleAnnulerDepuisListe(l.codeBarre)} disabled={loading}>
                          <Undo2 size={13} /> {t('remise.cancel_linen')}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {items.length > 0 && (
                <div>
                  <div className="sa-subhead">
                    {t('remise.category_details')}
                    <span className="sa-count">{items.length}</span>
                  </div>
                  <div className="rl-cats">
                    {/* remis / à remettre : quantiteRemise / quantiteCollectee (total de la remise) */}
                    {items.map((item) => (
                      <CategorieRow
                        key={item.categorie}
                        categorie={item.categorie}
                        collecte={item.quantiteCollectee || 0}
                        livre={item.quantiteRemise || 0}
                        reste={Math.max((item.quantiteCollectee || 0) - (item.quantiteRemise || 0), 0)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Historique des remises */}
              <button type="button" className="rl-history-toggle" onClick={() => setHistoriqueOuvert(!historiqueOuvert)} aria-expanded={historiqueOuvert}>
                <History size={15} />
                {historiqueOuvert ? t('remise.hide_history') : t('remise.show_history')}
                <span className="sa-count">{remises.length}</span>
                <ChevronDown size={15} style={{ marginInlineStart: "auto", transform: historiqueOuvert ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
              </button>

              {historiqueOuvert && (
                remises.length === 0 ? (
                  <p className="sa-hint" style={{ marginTop: 10 }}>{t('remise.no_deliveries')}</p>
                ) : (
                  <div className="rl-history">
                    {remises.map((r, i) => {
                      const config = getRemiseStatutConfig(r.etat);
                      return (
                        <div key={r.id ?? i} className="rl-history__row">
                          <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <code>{r.numeroLivraison || r.id}</code>
                            <span className="sa-tag" style={{ color: config.text }}>{config.label}</span>
                          </span>
                          <span className="rl-history__meta">
                            <span>{r.agentRemiseNom || t('remise.agent')}</span>
                            <span>{formatDate(r.dateRemise)}</span>
                            <span><b>{r.nbLinges || 0}</b> {t('remise.linens')}</span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )
              )}
            </>
          )}
        </section>
      </div>
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
