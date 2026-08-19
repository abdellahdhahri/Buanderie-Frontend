import React, { useState, useContext, useRef, useEffect } from "react";
import { LingeContext } from "../../contextes/LingeContext";
import { useNavigate } from "react-router-dom";
import { FaBarcode, FaWarehouse, FaUser, FaCheckCircle, FaTimes } from "react-icons/fa";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import DialogueControleQualite from "../../components/dialogues/DialogueControleQualite";
import { StockageProvider, useStockage } from "../../contextes/StockageContext";
import ModeToggle from "../../components/utils/shared/ModeToggle";
import EtapesStepper from "../../components/utils/shared/EtapesStepper";
import ScanInput from "../../components/utils/shared/ScanInput";
import "../Linge/WorkflowList.css";

function StockageInner() {
  const { getLingeByCode, isRfidMode, setIsRfidMode } = useContext(LingeContext);
  const navigate = useNavigate();
  const {
    agent, dialogueItem, reclamationCreee, messageStatut, loading, isConfirming,
    scanAgent, deconnecterAgent, scanStockage, confirmerControle, fermerDialogue,
  } = useStockage();

  const [scanValue, setScanValue] = useState("");
  const [mode,      setMode]      = useState(isRfidMode ? "RFID" : "BARCODE");

  const handleModeChange = (m) => { setMode(m); setIsRfidMode(m === "RFID"); };

  const handleScan = async (code) => {
    setScanValue("");
    if (!agent) { await scanAgent(code); return; }
    await scanStockage(code, getLingeByCode);
  };

  const ETAPES = [
    { id: "AGENT",    label: "Agent",     done: !!agent },
    { id: "CONTROLE", label: "Contrôle",  done: !!reclamationCreee },
    { id: "STOCKAGE", label: "Stockage",  done: false },
  ];

  const getPlaceholder = () => !agent
    ? " Scanner votre badge agent..."
    : mode === "RFID" ? "📡 Scanner tag RFID..." : " Scanner un linge (état seche)...";

  return (
    <div className="collecte-container">
      {dialogueItem && (
        <DialogueControleQualite
          item={dialogueItem}
          agent={agent}
          onConfirmer={confirmerControle}
          onFermer={fermerDialogue}
          isLoading={isConfirming || loading}
        />
      )}

     <div style={{ marginBottom: "32px" }}>
  <div style={{
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginBottom: "8px"
  }}>
    <div style={{
      width: "52px",
      height: "52px",
      borderRadius: "16px",
      background: "linear-gradient(135deg, #3b82f6, #2563eb)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "white",
      boxShadow: "0 4px 16px rgba(59, 130, 246, 0.25)"
    }}>
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    </div>
    <div>
      <h1 style={{
        fontSize: "28px",
        fontWeight: 800,
        color: "#0f172a",
        margin: 0
      }}>
        Stockage
      </h1>
      <p style={{
        fontSize: "14px",
        color: "#64748b",
        margin: "2px 0 0 0"
      }}>
        Gérez vos stocks et inventaires
      </p>
    </div>
  </div>
</div>

      <div className="collecte-panel-grand" style={{ background: "white", borderRadius: "20px", padding: "32px", border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>

        {/* Barre supérieure */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {agent ? (
              <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 16px", background: "#f0fdf4", borderRadius: "10px", border: "1px solid #bbf7d0" }}>
                <FaCheckCircle color="#22c55e" size={16} />
                <span style={{ fontWeight: 700, color: "#15803d", fontSize: "14px" }}>{agent.nom}</span>
                <Badge variant="outline" style={{ fontSize: "11px" }}>{agent.matricule}</Badge>
                <button onClick={deconnecterAgent} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}>
                  <FaTimes size={12} />
                </button>
              </div>
            ) : (
              <div style={{ fontSize: "13px", color: "#94a3b8" }}>Aucun agent connecté</div>
            )}
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <ModeToggle mode={mode} onChange={handleModeChange} />
            <Button variant="outline" size="sm" onClick={() => { setScanValue(""); deconnecterAgent(); }}>Reset</Button>
          </div>
        </div>

      

        {/* Zone scan */}
        <Card style={{ marginBottom: "20px", border: `2px dashed ${!agent ? "#e2e8f0" : "#0ea5e9"}` }}>
          <CardContent className="p-5">
            <ScanInput
              placeholder={getPlaceholder()}
              value={scanValue}
              onChange={setScanValue}
              onSubmit={handleScan}
              borderColor={!agent ? "#e2e8f0" : "#0ea5e9"}
              keepFocus={true}
              autoDebounce={true}
            />
          </CardContent>
        </Card>

        {/* Statut */}
        {messageStatut && (
          <Card style={{ background: reclamationCreee ? "#fefce8" : "#f0fdf4", border: `1px solid ${reclamationCreee ? "#fde68a" : "#bbf7d0"}`, marginBottom: "16px" }}>
            <CardContent className="p-3">
              <p style={{ fontSize: "13px", fontWeight: 600, color: reclamationCreee ? "#92400e" : "#15803d" }}>
                {messageStatut}
              </p>
            </CardContent>
          </Card>
        )}

        {agent && !dialogueItem && (
          <Card style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
            <CardContent className="p-4">
              <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px" }}>
                <FaWarehouse color="#22c55e" />
                <span style={{ fontWeight: 600, color: "#15803d" }}>Prêt pour contrôle</span>
                <span style={{ color: "#64748b" }}>Scannez un linge en état Seche</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function StockageList() {
  return <StockageProvider><StockageInner /></StockageProvider>;
}
