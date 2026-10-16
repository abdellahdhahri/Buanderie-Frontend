import React, { useState, useContext, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { LingeContext } from "../../contextes/LingeContext";
import { useNavigate } from "react-router-dom";
import { FaRss, FaBarcode, FaUser, FaCheckCircle, FaTimes, FaExclamationTriangle } from "react-icons/fa";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import DialogueControleQualite from "../../components/dialogues/DialogueControleQualite";
import DialogueRangementService from "../../components/dialogues/DialogueRangementService";
import { PliageProvider, usePliage } from "../../contextes/PliageContext";
import EtapesStepper from "../../components/utils/shared/EtapesStepper";
import ScanInput from "../../components/utils/shared/ScanInput";
import { getAgent, isAgentConnected } from "../../services/agentService";
import "../Linge/WorkflowList.css";
import { PageHeaderIcon } from "../../components/layout/PageHeaderIcon";

function PliageInner() {
  const { t } = useTranslation();

  const { getLingeByCode, isRfidMode } = useContext(LingeContext);
  const navigate = useNavigate();
  const {
    agent: agentFromContext,
    dialogueItem,
    rangementItem,
    loading,
    isConfirming,
    scanAgent,
    deconnecterAgent,
    scanPliage,
    confirmerControle,
    fermerDialogue,
    fermerRangement
  } = usePliage();

  const [scanValue, setScanValue] = useState("");
  // Mode de lecture réglé dans Paramètres › Lecture / Scan
  const mode = isRfidMode ? "RFID" : "BARCODE";
  const [agent, setAgent] = useState(null);

  // ✅ Récupérer l'agent depuis localStorage
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
        poste: agentData.poste || "AGENT_PLIAGE"
      };
      setAgent(ag);
    } else {
      setAgent(null);
    }
  }, []);

  // ✅ Si l'agent du contexte change, mettre à jour l'agent local
  useEffect(() => {
    if (agentFromContext) {
      setAgent(agentFromContext);
    }
  }, [agentFromContext]);

  const getAgentFullName = () => {
    if (!agent) return '';
    return agent.nomPrenom || agent.nom || agent.matricule;
  };

  const handleScan = async (code) => {
    setScanValue("");
    if (dialogueItem) return; // contrôle qualité en cours
    if (rangementItem) fermerRangement(); // scan du linge suivant
    if (!agent) {
      if (scanAgent) {
        await scanAgent(code);
      }
      return;
    }
    await scanPliage(code, getLingeByCode);
  };

  const getPlaceholder = () => {
    if (!agent) return t('pliage.agent_not_connected');
    return mode === "RFID" ? t('pliage.scan_rfid') : t('pliage.scan_linge');
  };

  const getBorderColor = () => !agent ? "#dc2626" : "#0ea5e9";

  return (
    <div className="collecte-container">
      {/* Après pliage : contrôle qualité, puis consigne de rangement sur l'étagère du service */}
      {dialogueItem && (
        <DialogueControleQualite
          key={dialogueItem.id ?? dialogueItem.codeBarre}
          item={dialogueItem}
          agent={agent}
          onConfirmer={confirmerControle}
          onClose={fermerDialogue}
          isLoading={isConfirming || loading}
        />
      )}
      {rangementItem && !dialogueItem && (
        <DialogueRangementService
          key={rangementItem.id ?? rangementItem.codeBarre}
          item={rangementItem}
          onClose={fermerRangement}
        />
      )}

      {/* ─── EN-TÊTE ─────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: "32px" }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          marginBottom: "8px"
        }}>
          <PageHeaderIcon size={52} />
          <div>
            <h1 style={{
              fontSize: "28px",
              fontWeight: 800,
              color: "#0f172a",
              margin: 0
            }}>
              {t('pliage.title')}
            </h1>
            <p style={{
              fontSize: "14px",
              color: "#64748b",
              margin: "2px 0 0 0"
            }}>
              {agent 
                ? `${t('pliage.agent')}: ${getAgentFullName()}`
                : t('pliage.no_agent_connected')}
            </p>
          </div>
        </div>
      </div>

      <div className="collecte-panel-grand" style={{
        background: "white",
        borderRadius: "20px",
        padding: "32px",
        border: "1px solid #e2e8f0",
        boxShadow: "0 4px 16px rgba(0,0,0,0.06)"
      }}>

        {/* Barre supérieure */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "12px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {agent ? (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px 16px",
                background: "#f0fdf4",
                borderRadius: "10px",
                border: "1px solid #bbf7d0"
              }}>
                <FaCheckCircle color="#22c55e" size={16} />
                <span style={{ fontWeight: 700, color: "#15803d", fontSize: "14px" }}>
                  {getAgentFullName()}
                </span>
                <Badge variant="outline" style={{ fontSize: "11px" }}>
                  {agent.codeBarre || agent.matricule}
                </Badge>
                <button
                  onClick={() => {
                    deconnecterAgent();
                    setAgent(null);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#94a3b8",
                    cursor: "pointer"
                  }}
                >
                  <FaTimes size={12} />
                </button>
              </div>
            ) : (
              <div style={{ fontSize: "13px", color: "#94a3b8" }}>{t('pliage.no_agent_connected')}</div>
            )}
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setScanValue("");
                deconnecterAgent();
                setAgent(null);
              }}
            >
              {t('common.reset')}
            </Button>
          </div>
        </div>

        {/* ─── Message si agent non connecté ──────────────────────────────── */}
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
            <span style={{ fontWeight: 600 }}>{t('pliage.no_agent_connected')}</span>
            <span style={{ color: "#64748b" }}>{t('pliage.no_agent_connect_text')}</span>
          </div>
        )}

        {/* Zone scan */}
        <Card style={{
          marginBottom: "20px",
          border: `2px dashed ${getBorderColor()}`
        }}>
          <CardContent className="p-5">
            <ScanInput
              placeholder={getPlaceholder()}
              value={scanValue}
              onChange={setScanValue}
              onSubmit={handleScan}
              borderColor={getBorderColor()}
              keepFocus={true}
              autoDebounce={true}
              disabled={!agent || !!dialogueItem}
            />
          </CardContent>
        </Card>

        {/* Info agent */}
        {agent && (
          <Card style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
            <CardContent className="p-4">
              <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px" }}>
                <FaUser color="#22c55e" />
                <span style={{ fontWeight: 600, color: "#15803d" }}>{t('pliage.ready_to_fold')}</span>
                <span style={{ color: "#64748b" }}>{t('pliage.scan_sec_linge')}</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default function PliageList() {
  return <PliageProvider><PliageInner /></PliageProvider>;
}