import React, { useState, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import {
  FaBoxes, FaUser, FaCheckCircle, FaTimes, FaSpinner,
  FaHistory, FaExclamationTriangle, FaTshirt, FaChartLine,
  FaCheckDouble, FaClock
} from "react-icons/fa";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import ScanInput from "../../components/utils/shared/ScanInput";
import EtapesStepper from "../../components/utils/shared/EtapesStepper";
import { RemiseLingeProvider, useRemiseLinge } from "../../contextes/RemiseLingeContext";
import { getCategorieInfo, formatDate, getRemiseStatutConfig } from "../../services/remiseLingeService";
import "../Linge/WorkflowList.css";

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


function ProgressionBar({ value, label }) {
  const pct = Math.min(Math.max(value, 0), 100);
   const { t } = useTranslation();
  const isComplete = pct === 100;

  return (
    <div style={{ marginBottom: "16px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "13px",
          marginBottom: "4px",
        }}
      >
        <span style={{ fontWeight: 500, color: "#64748b" }}>{label}</span>
        <span style={{ fontWeight: 700, color: "#0f172a" }}>{pct}%</span>
      </div>
      <div
        style={{
          height: "8px",
          borderRadius: "6px",
          background: "#f1f5f9",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            borderRadius: "6px",
            background: isComplete
              ? "linear-gradient(90deg, #10b981, #059669)"
              : "linear-gradient(90deg, #14b8a6, #0d9488)",
            width: `${pct}%`,
            transition: "width 0.5s ease-in-out",
          }}
        />
      </div>
      {isComplete && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            marginTop: "4px",
            fontSize: "11px",
            color: "#059669",
            fontWeight: 600,
          }}
        >
          <FaCheckCircle size={12} /> {t('remise.collection_completed')}
        </div>
      )}
    </div>
  );
}

function StatutCard({ label, value, icon, color, bg, subValue }) {
  return (
    <div
      style={{
        padding: "16px 18px",
        borderRadius: "14px",
        background: bg,
        border: `1px solid ${color}25`,
        flex: 1,
        minWidth: "120px",
        transition: "all 0.2s ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "12px",
            background: `${color}15`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "20px",
          }}
        >
          {icon}
        </div>
        <div>
          <p
            style={{
              fontSize: "10px",
              fontWeight: 600,
              color: "#94a3b8",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              margin: 0,
            }}
          >
            {label}
          </p>
          <p
            style={{
              fontSize: "24px",
              fontWeight: 700,
              color: color,
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            {value}
          </p>
          {subValue && (
            <p style={{ fontSize: "10px", color: "#94a3b8", margin: 0 }}>
              {subValue}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function CategorieRow({ categorie, collecte, livre, reste }) {
  const { t } = useTranslation();
  const isComplete = reste === 0 && collecte > 0;
  const pct = collecte > 0 ? Math.round((livre / collecte) * 100) : 0;
  const info = getCategorieInfo(categorie);

  return (
    <div
      style={{
        padding: "12px 16px",
        borderRadius: "10px",
        background: isComplete ? "#f0fdf4" : "white",
        border: `1px solid ${isComplete ? "#bbf7d0" : "#e2e8f0"}`,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "8px",
        transition: "all 0.2s ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
        <span style={{ fontSize: "20px" }}>{info.emoji}</span>
        <span style={{ fontWeight: 600, color: "#0f172a", fontSize: "14px" }}>
          {info.label}
        </span>
        {isComplete ? (
          <Badge
            style={{
              background: "#dcfce7",
              color: "#15803d",
              fontSize: "9px",
              padding: "2px 10px",
              borderRadius: "12px",
            }}
          >
            ✓ {t('remise.complete')}
          </Badge>
        ) : (
          <Badge
            style={{
              background: "#f1f5f9",
              color: "#64748b",
              fontSize: "9px",
              padding: "2px 10px",
              borderRadius: "12px",
            }}
          >
            {pct}%
          </Badge>
        )}
      </div>
      <div style={{ display: "flex", gap: "20px", fontSize: "13px", alignItems: "center" }}>
        <span style={{ color: "#64748b" }}>
          <span style={{ fontWeight: 600, color: "#0f172a" }}>{collecte}</span>
        </span>
        <span style={{ color: "#059669", fontWeight: 600 }}>
          <FaCheckCircle size={12} style={{ display: "inline", marginRight: "4px" }} />
          {livre}
        </span>
        {reste > 0 && (
          <span style={{ color: "#d97706", fontWeight: 600 }}>
            <FaClock size={12} style={{ display: "inline", marginRight: "4px" }} />
            {reste}
          </span>
        )}
        {reste === 0 && collecte > 0 && (
          <span style={{ color: "#059669", fontWeight: 600 }}>✓</span>
        )}
      </div>
    </div>
  );
}

function ScanStatusComponent({ status }) {
  const { t } = useTranslation();

  if (!status) return null;

  if (status.loading) {
    return (
      <div
        style={{
          padding: "14px 18px",
          borderRadius: "12px",
          background: "#eff6ff",
          border: "1px solid #93c5fd",
          display: "flex",
          alignItems: "center",
          gap: "14px",
          marginTop: "12px",
          animation: "fadeIn 0.3s ease-out",
        }}
      >
        <FaSpinner className="animate-spin" color="#3b82f6" size={22} />
        <div>
          <p
            style={{
              fontWeight: 600,
              color: "#1d4ed8",
              fontSize: "14px",
              margin: 0,
            }}
          >
            {t('remise.scanning')}
          </p>
          <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
            {status.code}
          </p>
        </div>
      </div>
    );
  }

  if (status.success) {
    return (
      <div
        style={{
          padding: "14px 18px",
          borderRadius: "12px",
          background: "#f0fdf4",
          border: "1px solid #86efac",
          display: "flex",
          alignItems: "center",
          gap: "14px",
          marginTop: "12px",
          animation: "fadeIn 0.3s ease-out",
        }}
      >
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: "#dcfce7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <FaCheckCircle color="#22c55e" size={20} />
        </div>
        <div>
          <p
            style={{
              fontWeight: 600,
              color: "#15803d",
              fontSize: "14px",
              margin: 0,
            }}
          >
            ✓ {t('remise.linen_delivered_success')}
          </p>
          <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
            <strong>{status.success.codeBarre}</strong> · {status.success.categorie}
          </p>
        </div>
      </div>
    );
  }

  if (status.error) {
    return (
      <div
        style={{
          padding: "14px 18px",
          borderRadius: "12px",
          background: "#fef2f2",
          border: "1px solid #fca5a5",
          display: "flex",
          alignItems: "center",
          gap: "14px",
          marginTop: "12px",
          animation: "fadeIn 0.3s ease-out",
        }}
      >
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: "#fee2e2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <FaExclamationTriangle color="#ef4444" size={18} />
        </div>
        <div>
          <p
            style={{
              fontWeight: 600,
              color: "#dc2626",
              fontSize: "14px",
              margin: 0,
            }}
          >
            {t('common.error')}
          </p>
          <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
            {status.error}
          </p>
        </div>
      </div>
    );
  }

  return null;
}

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────

function RemiseLingeInner() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const {
    agentRemise,
    agentCollecte,
    remise,
    collecteId,
    statut,
    remises,
    loading,
    scanStatus,
    etape,
    isCloturee,
    scanAgentRemise,
    scanAgentCollecte,
    scanLinge,
    chargerStatut,
    chargerHistorique,
    rafraichir,
    resetAll,
    clearScanStatus,
  } = useRemiseLinge();

  const [scanValue, setScanValue] = useState("");
  const [historiqueOuvert, setHistoriqueOuvert] = useState(false);
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
        confirmButtonColor: "#0d9488",
        confirmButtonText: t('common.ok'),
        ...(timer ? { showConfirmButton: false } : {}),
      });
    },
    [t]
  );

  // ─── Handlers ────────────────────────────────────────────────────────────
  const handleScan = useCallback(

    
    async (code) => {
       console.log("========== SCAN ==========");
    console.log("Code reçu :", code);
    console.log("Étape actuelle :", etape);
    console.log("Agent remise :", agentRemise);
    console.log("Agent collecte :", agentCollecte);
    console.log("Remise :", remise);
    console.log("==========================");

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

        // Étape 2: Scan Agent Collecte
        if (etape === "AGENT_COLLECTE") {
          const result = await scanAgentCollecte(code.trim(), agentRemise);
          await showAlert(
            t('remise.delivery_created'),
            `${t('remise.delivery')} ${result.remise.numeroLivraison} · ${result.remise.collecte?.numeroCollecte}`,
            "success",
            2000
          );
          setTimeout(() => scanInputRef.current?.focus(), 200);
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
              title: t('remise.collection_completed_title'),
              text: t('remise.collection_completed_text'),
              icon: "success",
              timer: 2500,
              timerProgressBar: true,
              showConfirmButton: false,
              confirmButtonColor: "#0d9488",
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
    [
      etape,
      agentRemise,
      scanAgentRemise,
      scanAgentCollecte,
      scanLinge,
      clearScanStatus,
      showAlert,
      t,
    ]
  );

  // ─── RENDU ──────────────────────────────────────────────────────────────

  const ETAPES = [
    { id: "AGENT_REMISE", label: t('remise.step_delivery_agent'), done: !!agentRemise },
    { id: "AGENT_COLLECTE", label: t('remise.step_collection_agent'), done: !!agentCollecte },
    { id: "SCAN", label: t('remise.step_scan'), done: isCloturee },
  ];

  const getPlaceholder = () => {
    if (!agentRemise) return t('remise.scan_delivery_agent');
    if (!agentCollecte) return t('remise.scan_collection_agent');
    if (isCloturee) return t('remise.collection_finished');
    return t('remise.scan_linen_barcode');
  };

  const getBorderColor = () => {
    if (!agentRemise || (etape === "AGENT_COLLECTE" && !agentCollecte))
      return "#dc2626";
    if (isCloturee) return "#e2e8f0";
    return "#0ea5e9";
  };

  const isDisabled = isCloturee || loading || !agentRemise;

  return (
    <div className="collecte-container">
      <SuccessAnimation
        show={showSuccessAnimation}
        onComplete={() => {
          setShowSuccessAnimation(false);
          setTimeout(() => scanInputRef.current?.focus(), 200);
        }}
      />

      {/* ─── EN-TÊTE ─────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: "32px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "8px",
          }}
        >
          <PageHeaderIcon size={56} />
          <div>
            <h1
              style={{
                fontSize: "28px",
                fontWeight: 800,
                color: "#0f172a",
                margin: 0,
              }}
            >
              {t('remise.title')}
            </h1>
            <p
              style={{
                fontSize: "14px",
                color: "#64748b",
                margin: "2px 0 0 0",
              }}
            >
              {agentRemise
                ? `${t('remise.agent')}: ${agentRemise.nomPrenom || agentRemise.nom}`
                : t('remise.no_agent_connected')}
            </p>
          </div>
        </div>
      </div>

      <div
        style={{
          background: "white",
          borderRadius: "20px",
          padding: "32px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            {agentRemise && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "8px 18px",
                  background: "#f0fdf4",
                  borderRadius: "12px",
                  border: "1px solid #bbf7d0",
                }}
              >
                <FaCheckCircle color="#22c55e" size={16} />
                <span
                  style={{
                    fontWeight: 700,
                    color: "#15803d",
                    fontSize: "14px",
                  }}
                >
                  {agentRemise.nomPrenom || agentRemise.nom}
                </span>
                <Badge
                  style={{
                    background: "#dcfce7",
                    color: "#15803d",
                    fontSize: "10px",
                    padding: "2px 10px",
                    borderRadius: "12px",
                  }}
                >
                  {agentRemise.codeBarre || agentRemise.matricule}
                </Badge>
                <button
                  onClick={() => {
                    resetAll();
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#94a3b8",
                    cursor: "pointer",
                  }}
                >
                  <FaTimes size={12} />
                </button>
              </div>
            )}
            {agentCollecte && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "8px 18px",
                  background: "#eff6ff",
                  borderRadius: "12px",
                  border: "1px solid #93c5fd",
                }}
              >
                <FaUser color="#3b82f6" size={16} />
                <span
                  style={{
                    fontWeight: 700,
                    color: "#1d4ed8",
                    fontSize: "14px",
                  }}
                >
                  {agentCollecte.nomPrenom || agentCollecte.nom}
                </span>
                <Badge
                  style={{
                    background: "#dbeafe",
                    color: "#1d4ed8",
                    fontSize: "10px",
                    padding: "2px 10px",
                    borderRadius: "12px",
                  }}
                >
                  {agentCollecte.codeBarre || agentCollecte.matricule}
                </Badge>
              </div>
            )}
            {remise && (
              <Badge
                style={{
                  background: "#f1f5f9",
                  color: "#64748b",
                  fontSize: "11px",
                  padding: "4px 14px",
                  borderRadius: "12px",
                }}
              >
                {t('remise.delivery')} {remise.numeroLivraison}
              </Badge>
            )}
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            {etape === "SCAN" && (
              <Button
                variant="outline"
                size="sm"
                onClick={rafraichir}
                style={{
                  fontSize: "12px",
                  gap: "6px",
                  borderColor: "#e2e8f0",
                  color: "#64748b",
                  borderRadius: "10px",
                  padding: "6px 14px",
                }}
                disabled={loading}
              >
                <FaSpinner className={loading ? "animate-spin" : ""} size={10} />
                {t('common.refresh')}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={resetAll}
              style={{
                fontSize: "12px",
                gap: "6px",
                borderColor: "#fca5a5",
                color: "#dc2626",
                borderRadius: "10px",
                padding: "6px 14px",
              }}
            >
              <FaTimes size={10} />
              {t('common.reset')}
            </Button>
          </div>
        </div>

        <Card
          style={{
            marginBottom: "20px",
            border: `2px dashed ${getBorderColor()}`,
            background: isCloturee ? "#f8fafc" : "white",
            borderRadius: "16px",
          }}
        >
          <CardContent className="p-5">
            <ScanInput
              ref={scanInputRef}
              placeholder={getPlaceholder()}
              value={scanValue}
              onChange={setScanValue}
              onSubmit={handleScan}
              borderColor={getBorderColor()}
              keepFocus={true}
              autoDebounce={true}
              disabled={isDisabled}
            />
            <ScanStatusComponent status={scanStatus} />
          </CardContent>
        </Card>

        {!agentRemise && (
          <Card
            style={{
              background: "#fef2f2",
              border: "1px solid #fca5a5",
              marginBottom: "16px",
              borderRadius: "12px",
            }}
          >
            <CardContent className="p-4">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  fontSize: "13px",
                }}
              >
                <FaExclamationTriangle color="#dc2626" size={16} />
                <span style={{ fontWeight: 600, color: "#dc2626" }}>
                  {t('remise.no_agent_connected')}
                </span>
                <span style={{ color: "#64748b" }}>
                  {t('remise.no_agent_connect_text')}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {agentRemise && !agentCollecte && (
          <Card
            style={{
              background: "#eff6ff",
              border: "1px solid #93c5fd",
              marginBottom: "16px",
              borderRadius: "12px",
            }}
          >
            <CardContent className="p-4">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  fontSize: "13px",
                }}
              >
                <FaUser color="#3b82f6" size={16} />
                <span style={{ fontWeight: 600, color: "#1d4ed8" }}>
                  {t('remise.scan_collection_agent_prompt')}
                </span>
                <span style={{ color: "#64748b" }}>{t('remise.to_create_delivery')}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {agentRemise && agentCollecte && !isCloturee && (
          <Card
            style={{
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              marginBottom: "16px",
              borderRadius: "12px",
            }}
          >
            <CardContent className="p-4">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  fontSize: "13px",
                }}
              >
                <FaCheckCircle color="#22c55e" size={16} />
                <span style={{ fontWeight: 600, color: "#15803d" }}>
                  {t('remise.ready_to_deliver')}
                </span>
                <span style={{ color: "#64748b" }}>
                  {t('remise.scan_linens_to_deliver')}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {etape === "SCAN" && statut && (
          <>
            {isCloturee && (
              <div
                style={{
                  padding: "20px",
                  borderRadius: "14px",
                  background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
                  border: "2px solid #86efac",
                  textAlign: "center",
                  marginBottom: "20px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "14px",
                  }}
                >
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "50%",
                      background: "#dcfce7",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <FaCheckDouble color="#22c55e" size={24} />
                  </div>
                  <div>
                    <p
                      style={{
                        fontSize: "20px",
                        fontWeight: 700,
                        color: "#15803d",
                        margin: 0,
                      }}
                    >
                      ✓ {t('remise.collection_completed')}
                    </p>
                    <p style={{ fontSize: "14px", color: "#059669", margin: 0 }}>
                      {statut.totalLivre || 0} / {statut.totalCollecte || 0} {t('remise.linens_delivered')} · 100%
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                gap: "14px",
                marginBottom: "20px",
              }}
            >
              <StatutCard
                label={t('remise.total_collected')}
                value={statut.totalCollecte || 0}
                icon="📦"
                color="#0ea5e9"
                bg="#f0f9ff"
                subValue={t('remise.linens_in_collection')}
              />
              <StatutCard
                label={t('remise.total_delivered')}
                value={statut.totalLivre || 0}
                icon="✅"
                color="#059669"
                bg="#f0fdf4"
                subValue={`${statut.pourcentage || 0}% ${t('remise.of_total')}`}
              />
              <StatutCard
                label={t('remise.remaining')}
                value={statut.totalRestant || 0}
                icon="⏳"
                color={statut.totalRestant === 0 ? "#059669" : "#d97706"}
                bg={statut.totalRestant === 0 ? "#f0fdf4" : "#fffbeb"}
                subValue={statut.totalRestant === 0 ? `✓ ${t('remise.completed')}` : t('remise.pending')}
              />
              <StatutCard
                label={t('remise.status')}
                value={statut.statut || "—"}
                icon={statut.statut === "CLOTUREE" ? "🏁" : "🔄"}
                color={statut.statut === "CLOTUREE" ? "#059669" : "#0ea5e9"}
                bg={statut.statut === "CLOTUREE" ? "#f0fdf4" : "#f0f9ff"}
                subValue={
                  statut.statut === "CLOTUREE"
                    ? t('remise.collection_closed')
                    : t('remise.in_progress')
                }
              />
            </div>

            <ProgressionBar
              value={statut.pourcentage || 0}
              label={t('remise.collection_progress')}
            />

            {statut.categories && statut.categories.length > 0 && (
              <div style={{ marginBottom: "20px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    marginBottom: "14px",
                  }}
                >
                  <FaTshirt size={16} color="#64748b" />
                  <h3
                    style={{
                      fontSize: "15px",
                      fontWeight: 700,
                      color: "#0f172a",
                      margin: 0,
                    }}
                  >
                    {t('remise.category_details')}
                  </h3>
                  <Badge
                    style={{
                      background: "#f1f5f9",
                      color: "#64748b",
                      fontSize: "10px",
                      padding: "2px 10px",
                      borderRadius: "12px",
                    }}
                  >
                    {statut.categories.length} {t('remise.categories')}
                  </Badge>
                </div>
                <div>
                  {statut.categories.map((cat, i) => (
                    <CategorieRow
                      key={i}
                      categorie={cat.categorie}
                      collecte={cat.quantiteCollectee}
                      livre={cat.quantiteLivree}
                      reste={cat.quantiteRestante}
                    />
                  ))}
                </div>
              </div>
            )}

            <div>
              <button
                onClick={() => setHistoriqueOuvert(!historiqueOuvert)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#64748b",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "10px 0",
                  width: "100%",
                  borderTop: "1px solid #f1f5f9",
                  marginTop: "8px",
                }}
              >
                <FaHistory size={14} />
                {historiqueOuvert ? t('remise.hide_history') : t('remise.show_history')}
                <Badge
                  style={{
                    background: "#f1f5f9",
                    color: "#64748b",
                    fontSize: "10px",
                    padding: "2px 10px",
                    borderRadius: "12px",
                    marginLeft: "auto",
                  }}
                >
                  {remises.length}
                </Badge>
              </button>

              {historiqueOuvert && (
                <div
                  style={{
                    padding: "16px",
                    borderRadius: "12px",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    marginTop: "8px",
                  }}
                >
                  {remises.length === 0 ? (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "20px",
                        color: "#94a3b8",
                        fontSize: "13px",
                      }}
                    >
                      {t('remise.no_deliveries')}
                    </div>
                  ) : (
                    <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                      {remises.map((r, i) => {
                        const config = getRemiseStatutConfig(r.etat);
                        return (
                          <div
                            key={i}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "12px 16px",
                              borderRadius: "10px",
                              background:
                                r.etat === "COMPLETEE"
                                  ? "#f0fdf4"
                                  : "white",
                              border: `1px solid ${
                                r.etat === "COMPLETEE"
                                  ? "#bbf7d0"
                                  : "#e2e8f0"
                              }`,
                              marginBottom: "6px",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                              }}
                            >
                              <span
                                style={{
                                  fontFamily: "monospace",
                                  fontWeight: 600,
                                  fontSize: "13px",
                                  color: "#0f172a",
                                }}
                              >
                                {r.numeroLivraison || r.id}
                              </span>
                              <Badge
                                style={{
                                  background: config.bg,
                                  color: config.text,
                                  fontSize: "10px",
                                  padding: "2px 12px",
                                  borderRadius: "12px",
                                }}
                              >
                                {config.icon} {config.label}
                              </Badge>
                            </div>
                            <div
                              style={{
                                display: "flex",
                                gap: "16px",
                                fontSize: "11px",
                                color: "#94a3b8",
                              }}
                            >
                              <span>{r.agentRemiseNom || t('remise.agent')}</span>
                              <span>{formatDate(r.dateRemise)}</span>
                              <span
                                style={{
                                  fontWeight: 600,
                                  color: "#0f172a",
                                }}
                              >
                                {r.nbLinges || 0} {t('remise.linens')}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
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