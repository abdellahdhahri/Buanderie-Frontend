import React, { useState, useRef, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useModal } from "../../contextes/ModalContext";
import {
  FaUser,
  FaTimes,
  FaBiohazard,
  FaCheckCircle,
  FaExclamationTriangle,
  FaSpinner,
  FaBox,
  FaBed,
  FaRedo,
  FaCheckDouble,
  FaDoorOpen,
  FaCheck,
  FaBuilding,
  FaBoxes,
} from "react-icons/fa";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import ScanInput from "../../components/utils/shared/ScanInput";
import EtapesStepper from "../../components/utils/shared/EtapesStepper";
import DialogCategorie from "../../components/utils/collecte/DialogCategorie";
import { cat, ST_COLORS } from "./collecteUtils";
import {
  fetchChambreByCode,
  fetchAgentByCode,
  ouvrirCollecteChambre,
  traiterLitAvecBac,
  marquerLingePropre,
  marquerLingeManquant,
  cloturerCollecte,
} from "../../services/collecte/collecteChambreService";
import { getAgent, isAgentConnected } from "../../services/agentService";
import "../Linge/WorkflowList.css";

function ScanStatus({ loading, success, error, code, t }) {
  if (loading) {
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
            {t('collecte_chambre.scanning')}
          </p>
          <p
            style={{
              fontSize: "12px",
              color: "#64748b",
              margin: 0,
            }}
          >
            {code}
          </p>
        </div>
      </div>
    );
  }

  if (success) {
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
            ✓ {success.message || t('collecte_chambre.success')}
          </p>
          <p
            style={{
              fontSize: "12px",
              color: "#64748b",
              margin: 0,
            }}
          >
            {success.detail}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
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
          <p
            style={{
              fontSize: "12px",
              color: "#64748b",
              margin: 0,
            }}
          >
            {error}
          </p>
        </div>
      </div>
    );
  }

  return null;
}

function DialogueManquant({ linge, onConfirmer, onFermer, t }) {
  if (!linge) return null;
  const c = cat(linge.categorie);

  return (
    <div
      data-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: "18px",
          padding: "24px",
          maxWidth: "320px",
          width: "92%",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "14px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "#fef3c7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FaExclamationTriangle size={14} color="#d97706" />
            </div>
            <div
              style={{
                fontWeight: 700,
                fontSize: "13px",
                color: "#0f172a",
              }}
            >
              {t('collecte_chambre.missing_linen')}
            </div>
          </div>
          <button
            onClick={onFermer}
            style={{
              background: "#f1f5f9",
              border: "none",
              borderRadius: "50%",
              width: "28px",
              height: "28px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#94a3b8",
            }}
          >
            <FaTimes size={12} />
          </button>
        </div>

        <div
          style={{
            padding: "10px 14px",
            background: c.bg,
            borderRadius: "10px",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <span style={{ fontSize: "20px" }}>{c.emoji}</span>
          <div>
            <div
              style={{
                fontWeight: 600,
                fontSize: "13px",
                color: c.color,
              }}
            >
              {c.label}
            </div>
            <code
              style={{
                fontSize: "10px",
                color: "#64748b",
              }}
            >
              {linge.codeBarre}
            </code>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "8px",
          }}
        >
          <button
            onClick={onFermer}
            style={{
              flex: 1,
              padding: "9px",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              background: "white",
              color: "#64748b",
              fontWeight: 600,
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={() => onConfirmer(linge)}
            style={{
              flex: 2,
              padding: "9px",
              borderRadius: "8px",
              border: "none",
              background: "linear-gradient(135deg,#d97706,#b45309)",
              color: "white",
              fontWeight: 700,
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            {t('collecte_chambre.confirm_missing')}
          </button>
        </div>
      </div>
    </div>
  );
}

function CarteLit({ lit, onPropre, onManquant, t }) {
  const traites = lit.linges.filter((l) => l.statut).length;
  const stLit = lit.statut;
  const totalLinges = lit.linges.length;

  return (
    <div
      style={{
        borderRadius: "12px",
        border: `1px solid ${
          stLit === "BLANC"
            ? "#86efac"
            : stLit === "INFECTE"
              ? "#fca5a5"
              : "#e2e8f0"
        }`,
        background:
          stLit === "BLANC"
            ? "#f0fdf4"
            : stLit === "INFECTE"
              ? "#fef2f2"
              : "white",
        overflow: "hidden",
        marginBottom: "8px",
      }}
    >
      <div
        style={{
          padding: "10px 14px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: `1px solid ${
            stLit === "BLANC"
              ? "#86efac"
              : stLit === "INFECTE"
                ? "#fca5a5"
                : "#e2e8f0"
          }`,
          background: stLit
            ? stLit === "BLANC"
              ? "#dcfce7"
              : "#fee2e2"
            : "#f8fafc",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <FaBed
            size={14}
            color={stLit === "INFECTE" ? "#dc2626" : "#64748b"}
          />
          <span
            style={{
              fontWeight: 700,
              fontSize: "13px",
              color: stLit === "INFECTE" ? "#dc2626" : "#0f172a",
            }}
          >
            {t('collecte_chambre.bed')} {lit.codeLit}
          </span>
          {lit.estInfecte && !stLit && (
            <span
              style={{
                fontSize: "9px",
                padding: "2px 8px",
                borderRadius: "12px",
                background: "#fee2e2",
                color: "#dc2626",
                fontWeight: 700,
              }}
            >
              ⚠️ {t('collecte_chambre.infected')}
            </span>
          )}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          {stLit === "BLANC" && (
            <span
              style={{
                fontSize: "9px",
                fontWeight: 700,
                padding: "2px 10px",
                borderRadius: "12px",
                background: "#dcfce7",
                color: "#15803d",
              }}
            >
              ✅ {t('collecte_chambre.white')}
            </span>
          )}
          {stLit === "INFECTE" && (
            <span
              style={{
                fontSize: "9px",
                fontWeight: 700,
                padding: "2px 10px",
                borderRadius: "12px",
                background: "#fee2e2",
                color: "#dc2626",
              }}
            >
              🔴 {t('collecte_chambre.infected')}
            </span>
          )}
          {!stLit && (
            <span
              style={{
                fontSize: "11px",
                color: "#94a3b8",
                fontWeight: 500,
              }}
            >
              {traites}/{totalLinges}
            </span>
          )}
        </div>
      </div>

      <div style={{ padding: "6px 8px" }}>
        {lit.linges.map((linge) => {
          const c = cat(linge.categorie);
          const col = ST_COLORS[linge.statut];

          return (
            <div
              key={linge.lingeId}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "6px 10px",
                borderRadius: "8px",
                marginBottom: "4px",
                background: col?.bg || "#f8fafc",
                border: `1px solid ${col?.b || "#e2e8f0"}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span style={{ fontSize: "16px" }}>{c.emoji}</span>
                <div>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      color: c.color,
                    }}
                  >
                    {c.label}
                  </span>
                  <code
                    style={{
                      fontSize: "10px",
                      color: "#94a3b8",
                      marginLeft: "6px",
                    }}
                  >
                    {linge.codeBarre}
                  </code>
                </div>
              </div>

              {linge.statut ? (
                <span
                  style={{
                    fontSize: "9px",
                    fontWeight: 700,
                    padding: "2px 10px",
                    borderRadius: "12px",
                    background: col?.tag,
                    color: col?.tc,
                  }}
                >
                  {col?.lbl}
                </span>
              ) : (
                !stLit && (
                  <div
                    style={{
                      display: "flex",
                      gap: "4px",
                    }}
                  >
                    <button
                      onClick={() => onPropre(linge)}
                      title={t('collecte_chambre.clean')}
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        border: "1.5px solid #bae6fd",
                        background: "#dbeafe",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <FaCheckCircle size={9} color="#0284c7" />
                    </button>
                    <button
                      onClick={() => onManquant(linge)}
                      title={t('collecte_chambre.missing')}
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        border: "1.5px solid #fde68a",
                        background: "#fef3c7",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <FaExclamationTriangle size={9} color="#d97706" />
                    </button>
                  </div>
                )
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatutCard({ label, value, icon, color, bg, subValue }) {
  return (
    <div
      style={{
        padding: "14px 16px",
        borderRadius: "12px",
        background: bg,
        border: `1px solid ${color}25`,
        flex: 1,
        minWidth: "100px",
        transition: "all 0.2s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            background: `${color}15`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "18px",
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
              fontSize: "22px",
              fontWeight: 700,
              color,
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            {value}
          </p>
          {subValue && (
            <p
              style={{
                fontSize: "10px",
                color: "#94a3b8",
                margin: 0,
              }}
            >
              {subValue}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE PRINCIPALE
// ─────────────────────────────────────────────────────────────────────────────

function ColageListInner() {
  const { t } = useTranslation();
  const { showAlert, showConfirm } = useModal();

  const [etape, setEtape] = useState("CHAMBRE");
  const [agent, setAgent] = useState(null);
  const [collecte, setCollecte] = useState(null);
  const [litEnCours, setLitEnCours] = useState(null);
  const [scanVal, setScanVal] = useState("");
  const [loading, setLoading] = useState(false);
  const [dlgManq, setDlgManq] = useState(null);
  const [scanStatus, setScanStatus] = useState(null);
  const [isFocused, setIsFocused] = useState(true);

  const agentRef = useRef(null);
  const collecteRef = useRef(null);
  const scanInputRef = useRef(null);
  const scanTimeoutRef = useRef(null);

  // ───────────────────────────────────────────────────────────────────────────
  // Synchronisation des refs
  // ───────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    agentRef.current = agent;
  }, [agent]);

  useEffect(() => {
    collecteRef.current = collecte;
  }, [collecte]);

  // ───────────────────────────────────────────────────────────────────────────
  // Récupérer l'agent depuis localStorage
  // ───────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const agentData = getAgent();
    if (agentData && isAgentConnected()) {
      setAgent(agentData);
      setEtape("CHAMBRE");
      setScanStatus({
        loading: false,
        success: {
          message: `👤 ${agentData.nomPrenom || agentData.nom}`,
          detail: `${t('collecte_chambre.connected')} · ${agentData.codeBarre || agentData.matricule}`,
        },
        error: null,
      });
      setTimeout(() => setScanStatus(null), 2000);
    } else {
      setEtape("CHAMBRE");
      setScanStatus({
        loading: false,
        success: null,
        error: t('collecte_chambre.no_agent_connected'),
      });
    }
  }, [t]);

  // ───────────────────────────────────────────────────────────────────────────
  // Mise à jour statut lit
  // ───────────────────────────────────────────────────────────────────────────

  const majLit = useCallback((litId, statut) => {
    setCollecte((p) =>
      p
        ? {
            ...p,
            lits: p.lits.map((l) =>
              l.litId !== litId
                ? l
                : {
                    ...l,
                    statut,
                    linges: l.linges.map((lg) =>
                      lg.statut
                        ? lg
                        : {
                            ...lg,
                            statut,
                          },
                    ),
                  },
            ),
          }
        : p,
    );
  }, []);

  // ───────────────────────────────────────────────────────────────────────────
  // Mise à jour statut linge
  // ───────────────────────────────────────────────────────────────────────────

  const majLinge = useCallback((lingeId, statut) => {
    setCollecte((p) =>
      p
        ? {
            ...p,
            lits: p.lits.map((l) => ({
              ...l,
              linges: l.linges.map((lg) =>
                lg.lingeId === lingeId
                  ? {
                      ...lg,
                      statut,
                    }
                  : lg,
              ),
            })),
          }
        : p,
    );
  }, []);

  // ───────────────────────────────────────────────────────────────────────────
  // Clôturer collecte
  // ───────────────────────────────────────────────────────────────────────────

  const cloturerEtRetourner = useCallback(async () => {
    if (!collecte) return;
    setLoading(true);
    try {
      const nonTr = collecte?.lits?.filter((l) => !l.statut) || [];
      if (nonTr.length > 0) {
        const ok = await showConfirm(
          "⚠️ " + t('collecte_chambre.unprocessed_beds'),
          `${nonTr.length} ${t('collecte_chambre.unprocessed_beds_detail')}. ${t('collecte_chambre.close_confirm')}`,
          "question",
        );
        if (!ok) {
          setLoading(false);
          return false;
        }
      }

      await cloturerCollecte(collecte.id);
      showAlert(
        "✅ " + t('collecte_chambre.collection_closed'),
        `${t('collecte_chambre.room')} ${collecte.codeChambre} ${t('collecte_chambre.completed')}`,
        "success",
      );

      setCollecte(null);
      setLitEnCours(null);
      setEtape("CHAMBRE");
      setScanStatus({
        loading: false,
        success: {
          message: "✅ " + t('collecte_chambre.collection_closed'),
          detail: `${t('collecte_chambre.room')} ${collecte.codeChambre}`,
        },
        error: null,
      });
      setTimeout(() => setScanStatus(null), 2000);
      setTimeout(() => scanInputRef.current?.focus(), 300);
      return true;
    } catch (e) {
      showAlert("❌ " + t('common.error'), e.message, "error");
      return false;
    } finally {
      setLoading(false);
    }
  }, [collecte, showAlert, showConfirm, t]);

  const handleChambre = useCallback(
    async (code) => {
      if (!agent) {
        showAlert(t('collecte_chambre.errors.agent_not_connected'), t('collecte_chambre.errors.agent_not_connected_text'), "error");
        return;
      }
      setLoading(true);
      setScanStatus({
        loading: true,
        code,
      });
      try {
        const ch = await fetchChambreByCode(code);
        const res = await ouvrirCollecteChambre(
          ch.codeBarre || ch.code || code,
          agent.codeBarre || agent.matricule,
        );

        setCollecte({
          id: res.collecteId,
          codeChambre: res.codeChambre,
          lits: (res.lits || []).map((l) => ({
            ...l,
            statut: "",
          })),
        });
        setLitEnCours(null);
        setEtape("SCAN");
        setScanStatus({
          loading: false,
          success: {
            message: `✅ ${res.codeChambre}`,
            detail: `${res.nbLits} ${t('collecte_chambre.beds')}, ${res.nbLinges} ${t('collecte_chambre.linens')}`,
          },
          error: null,
        });
        setTimeout(() => setScanStatus(null), 2000);
        showAlert(
          "✅ " + t('collecte_chambre.room_opened'),
          `${res.codeChambre} — ${res.nbLits} ${t('collecte_chambre.beds')}, ${res.nbLinges} ${t('collecte_chambre.linens')}`,
          "success",
        );
      } catch (e) {
        setScanStatus({
          loading: false,
          success: null,
          error: e.message,
        });
        showAlert("❌ " + t('common.error'), e.message, "error");
      } finally {
        setLoading(false);
      }
    },
    [agent, showAlert, t],
  );

  // ───────────────────────────────────────────────────────────────────────────
  // Scanner un bac
  // ───────────────────────────────────────────────────────────────────────────

  const handleScanBac = useCallback(
    async (code) => {
      if (!litEnCours) return;
      setLoading(true);
      setScanStatus({
        loading: true,
        code,
      });
      try {
        const res = await traiterLitAvecBac(
          collecteRef.current?.id,
          litEnCours.litId,
          code,
        );
        const statut = res.typeBac === "INFECTE" ? "INFECTE" : "BLANC";
        majLit(litEnCours.litId, statut);
        const codeLit = litEnCours.codeLit;
        setLitEnCours(null);
        setScanStatus({
          loading: false,
          success: {
            message:
              res.typeBac === "INFECTE" ? "🔴 " + t('collecte_chambre.red_bin') : "✅ " + t('collecte_chambre.white_bin'),
            detail: `${res.nbTraites} ${t('collecte_chambre.linens')} ${t('collecte_chambre.from_bed')} ${codeLit}`,
          },
          error: null,
        });
        setTimeout(() => setScanStatus(null), 2000);
        showAlert(
          res.typeBac === "INFECTE" ? "🔴 " + t('collecte_chambre.red_bin') : "✅ " + t('collecte_chambre.white_bin'),
          `${res.nbTraites} ${t('collecte_chambre.linens')} ${t('collecte_chambre.from_bed')} ${codeLit}`,
          res.typeBac === "INFECTE" ? "warning" : "success",
        );
      } catch (e) {
        setScanStatus({
          loading: false,
          success: null,
          error: e.message,
        });
        showAlert("❌ " + t('common.error'), e.message, "error");
      } finally {
        setLoading(false);
      }
    },
    [litEnCours, majLit, showAlert, t],
  );

  const handleScan = useCallback(
    async (code) => {
      if (!code) return;
      if (etape === "CHAMBRE") {
        await handleChambre(code);
        return;
      }
      if (etape === "SCAN") {
        const lit = collecteRef.current?.lits?.find(
          (l) => l.codeLit === code || String(l.litId) === code,
        );
        if (lit && !lit.statut) {
          setLitEnCours(lit);
          showAlert(
            "📋 " + t('collecte_chambre.bed_scanned'),
            lit.estInfecte
              ? t('collecte_chambre.infected_scan_red')
              : t('collecte_chambre.scan_bin'),
            lit.estInfecte ? "warning" : "success",
          );
          return;
        }
        try {
          const agentTrouve = await fetchAgentByCode(code);
          if (agentTrouve && collecte) {
            await cloturerEtRetourner();
            return;
          }
        } catch {}
        if (litEnCours) {
          await handleScanBac(code);
          return;
        }
        showAlert(
          "❌ " + t('collecte_chambre.errors.code_not_recognized'),
          t('collecte_chambre.errors.scan_bed_bin_or_badge'),
          "error",
        );
      }
    },
    [
      etape,
      collecte,
      litEnCours,
      handleChambre,
      handleScanBac,
      cloturerEtRetourner,
      showAlert,
      t,
    ],
  );

  const handlePropre = useCallback(
    async (linge) => {
      setLoading(true);
      try {
        await marquerLingePropre(collecteRef.current?.id, linge.codeBarre);
        majLinge(linge.lingeId, "PROPRE");
        showAlert("🔵 " + t('collecte_chambre.clean'), `${linge.codeBarre} — ${t('collecte_chambre.kept_in_place')}`, "info");
      } catch (e) {
        showAlert("❌ " + t('common.error'), e.message, "error");
      } finally {
        setLoading(false);
      }
    },
    [majLinge, showAlert, t],
  );

  const handleManquant = useCallback(
    async (linge) => {
      setDlgManq(null);
      setLoading(true);
      try {
        await marquerLingeManquant(collecteRef.current?.id, linge.lingeId);
        majLinge(linge.lingeId, "MANQUANT");
        showAlert("⚠️ " + t('collecte_chambre.missing'), linge.codeBarre, "warning");
      } catch (e) {
        showAlert("❌ " + t('common.error'), e.message, "error");
      } finally {
        setLoading(false);
      }
    },
    [majLinge, showAlert, t],
  );

  const reset = () => {
    setAgent(null);
    setCollecte(null);
    setLitEnCours(null);
    setEtape("CHAMBRE");
    setScanVal("");
    setScanStatus(null);
    setTimeout(() => scanInputRef.current?.focus(), 200);
  };

  useEffect(() => {
    if (scanVal.trim().length < 2) return;
    clearTimeout(scanTimeoutRef.current);
    scanTimeoutRef.current = setTimeout(() => {
      const code = scanVal.trim();
      setScanVal("");
      handleScan(code);
    }, 300);
    return () => clearTimeout(scanTimeoutRef.current);
  }, [scanVal, handleScan]);

  useEffect(() => {
    const keepFocus = () => {
      if (
        scanInputRef.current &&
        !document.querySelector('[data-modal="true"]')
      ) {
        scanInputRef.current.focus();
      }
    };
    const id = setInterval(keepFocus, 500);
    keepFocus();
    return () => clearInterval(id);
  }, []);

  const totalLits = collecte?.lits?.length || 0;
  const traites = collecte?.lits?.filter((l) => l.statut).length || 0;
  const nonTraites = totalLits - traites;
  const nbBlancs =
    collecte?.lits?.filter((l) => l.statut === "BLANC").length || 0;
  const nbInfectes =
    collecte?.lits?.filter((l) => l.statut === "INFECTE").length || 0;

  const getPlaceholder = () => {
    if (!agent) return "👤 " + t('collecte_chambre.no_agent_connected');
    if (!collecte) return "🏢 " + t('collecte_chambre.scan_room_code');
    if (litEnCours) return `📦 ${t('collecte_chambre.scan_bin_for')} ${t('collecte_chambre.bed')} ${litEnCours.codeLit}...`;
    return "🛏️ " + t('collecte_chambre.scan_bed_or_badge');
  };

  const getBorderColor = () => {
    if (!agent) return "#dc2626";
    if (litEnCours) return litEnCours.estInfecte ? "#dc2626" : "#7c3aed";
    if (etape === "CHAMBRE") return "#7c3aed";
    if (etape === "SCAN") return "#7c3aed";
    return "#e2e8f0";
  };

  const showAgentHint = etape === "SCAN" && collecte;

  return (
    <div className="collecte-container">
      <DialogueManquant
        linge={dlgManq}
        onConfirmer={handleManquant}
        onFermer={() => setDlgManq(null)}
        t={t}
      />

      <div
        style={{
          marginBottom: "32px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "8px",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "18px",
              background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              boxShadow: "0 6px 20px rgba(124, 58, 237, 0.3)",
            }}
          >
            <FaDoorOpen size={26} />
          </div>
          <div>
            <h1
              style={{
                fontSize: "28px",
                fontWeight: 800,
                color: "#0f172a",
                margin: 0,
              }}
            >
              {t('collecte_chambre.title')}
            </h1>
            <p
              style={{
                fontSize: "14px",
                color: "#64748b",
                margin: "2px 0 0 0",
              }}
            >
              {agent
                ? `${t('collecte_chambre.agent')}: ${agent.nomPrenom || agent.nom}`
                : t('collecte_chambre.no_agent_connected')}
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
        {/* BARRE SUPÉRIEURE */}
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
            {agent && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "8px 18px",
                  background: "#faf5ff",
                  borderRadius: "12px",
                  border: "1px solid #e9d5ff",
                }}
              >
                <FaUser color="#7c3aed" size={16} />
                <span
                  style={{
                    fontWeight: 700,
                    color: "#7c3aed",
                    fontSize: "14px",
                  }}
                >
                  {agent.nomPrenom || agent.nom}
                </span>
                <Badge
                  style={{
                    background: "#ede9fe",
                    color: "#7c3aed",
                    fontSize: "10px",
                    padding: "2px 10px",
                    borderRadius: "12px",
                  }}
                >
                  {agent.codeBarre || agent.matricule}
                </Badge>
              </div>
            )}
            {collecte && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "8px 18px",
                  background: "#f0f9ff",
                  borderRadius: "12px",
                  border: "1px solid #bae6fd",
                }}
              >
                <FaBuilding color="#0284c7" size={16} />
                <span
                  style={{
                    fontWeight: 700,
                    color: "#0284c7",
                    fontSize: "14px",
                  }}
                >
                  {collecte.codeChambre}
                </span>
                <Badge
                  style={{
                    background: "#e0f2fe",
                    color: "#0284c7",
                    fontSize: "10px",
                    padding: "2px 10px",
                    borderRadius: "12px",
                  }}
                >
                  {totalLits} {t('collecte_chambre.beds')}
                </Badge>
              </div>
            )}
          </div>
          <div
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "center",
            }}
          >
            {etape !== "CHAMBRE" && (
              <Button
                variant="outline"
                size="sm"
                onClick={reset}
                style={{
                  fontSize: "12px",
                  gap: "6px",
                  borderColor: "#fca5a5",
                  color: "#dc2626",
                  borderRadius: "10px",
                  padding: "6px 14px",
                }}
              >
                <FaRedo size={10} />
                {t('common.reset')}
              </Button>
            )}
          </div>
        </div>

        <Card
          style={{
            marginBottom: "20px",
            border: `2px dashed ${getBorderColor()}`,
            background: "white",
            borderRadius: "16px",
          }}
        >
          <CardContent className="p-5">
            <ScanInput
              ref={scanInputRef}
              placeholder={getPlaceholder()}
              value={scanVal}
              onChange={setScanVal}
              onSubmit={handleScan}
              borderColor={getBorderColor()}
              keepFocus={true}
              autoDebounce={true}
              disabled={loading || !agent}
            />
            {showAgentHint && (
              <div
                style={{
                  marginTop: "8px",
                  padding: "6px 14px",
                  borderRadius: "8px",
                  background: "#fef3c7",
                  border: "1px solid #fcd34d",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "12px",
                  color: "#92400e",
                }}
              >
                <FaUser size={12} />
                <span>
                  💡 {t('collecte_chambre.scan_agent_to_close')}
                </span>
              </div>
            )}
            {scanStatus && <ScanStatus {...scanStatus} t={t} />}
          </CardContent>
        </Card>

        {!agent && (
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
                <span
                  style={{
                    fontWeight: 600,
                    color: "#dc2626",
                  }}
                >
                  {t('collecte_chambre.no_agent_connected')}
                </span>
                <span
                  style={{
                    color: "#64748b",
                  }}
                >
                  {t('collecte_chambre.connect_to_collect')}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {agent && !collecte && (
          <Card
            style={{
              background: "#faf5ff",
              border: "1px solid #e9d5ff",
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
                <FaBuilding color="#7c3aed" size={16} />
                <span
                  style={{
                    fontWeight: 600,
                    color: "#7c3aed",
                  }}
                >
                  {t('collecte_chambre.scan_room_code')}
                </span>
                <span
                  style={{
                    color: "#64748b",
                  }}
                >
                  {t('collecte_chambre.to_start_collection')}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {litEnCours && etape === "SCAN" && (
          <Card
            style={{
              background: litEnCours.estInfecte ? "#fef2f2" : "#faf5ff",
              border: `2px solid ${
                litEnCours.estInfecte ? "#fca5a5" : "#c4b5fd"
              }`,
              marginBottom: "16px",
              borderRadius: "12px",
            }}
          >
            <CardContent className="p-4">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "10px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <FaBed
                    size={20}
                    color={litEnCours.estInfecte ? "#dc2626" : "#7c3aed"}
                  />
                  <div>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: "14px",
                        color: litEnCours.estInfecte ? "#dc2626" : "#7c3aed",
                      }}
                    >
                      {t('collecte_chambre.bed')} {litEnCours.codeLit}
                      {litEnCours.estInfecte && ` — ⚠️ ${t('collecte_chambre.red_bin')}`}
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#64748b",
                      }}
                    >
                      {t('collecte_chambre.scan_destination_bin')}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setLitEnCours(null)}
                  style={{
                    padding: "4px 14px",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    background: "white",
                    color: "#64748b",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: 500,
                  }}
                >
                  {t('common.cancel')}
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {etape === "SCAN" && collecte && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: "12px",
              marginBottom: "20px",
            }}
          >
            <StatutCard
              label={t('collecte_chambre.total')}
              value={totalLits}
              icon="📊"
              color="#0ea5e9"
              bg="#f0f9ff"
            />
            <StatutCard
              label={t('collecte_chambre.white')}
              value={nbBlancs}
              icon="✅"
              color="#15803d"
              bg="#f0fdf4"
            />
            <StatutCard
              label={t('collecte_chambre.infected')}
              value={nbInfectes}
              icon="🔴"
              color="#dc2626"
              bg="#fef2f2"
            />
            <StatutCard
              label={t('collecte_chambre.remaining')}
              value={nonTraites}
              icon="⏳"
              color="#f59e0b"
              bg="#fffbeb"
            />
          </div>
        )}

        {etape === "SCAN" && collecte && (
          <div
            style={{
              marginTop: "4px",
              paddingTop: "16px",
              borderTop: "1px solid #e2e8f0",
            }}
          >
            <div
              style={{
                fontWeight: 600,
                fontSize: "13px",
                color: "#64748b",
                marginBottom: "8px",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>🛏️ {t('collecte_chambre.beds')} ({totalLits})</span>
              <span
                style={{
                  color: "#7c3aed",
                }}
              >
                {traites} {t('collecte_chambre.processed')}
              </span>
            </div>
            <div
              style={{
                maxHeight: "250px",
                overflowY: "auto",
              }}
            >
              {collecte.lits.map((lit) => (
                <CarteLit
                  key={lit.litId}
                  lit={lit}
                  onPropre={handlePropre}
                  onManquant={(l) => setDlgManq(l)}
                  t={t}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}

export default function ColageList() {
  return <ColageListInner />;
}