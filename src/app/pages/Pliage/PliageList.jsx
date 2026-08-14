import React, { useState, useContext, useRef, useEffect } from "react";
import { LingeContext } from "../../contextes/LingeContext";
import { useNavigate } from "react-router-dom";
import { FaRss, FaBarcode, FaUser, FaCheckCircle, FaTimes } from "react-icons/fa";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import DialoguePliage from "../../components/dialogues/DialoguePliage";
import { PliageProvider, usePliage } from "../../contextes/PliageContext";
import ModeToggle from "../../components/utils/shared/ModeToggle";
import EtapesStepper from "../../components/utils/shared/EtapesStepper";
import ScanInput from "../../components/utils/shared/ScanInput";
import "../Linge/WorkflowList.css";

function PliageInner() {
  const { getLingeByCode, isRfidMode, setIsRfidMode } = useContext(LingeContext);
  const navigate = useNavigate();
  const { agent, dialogueItem, loading, scanAgent, deconnecterAgent, scanPliage, fermerDialogue } = usePliage();

  const [scanValue, setScanValue] = useState("");
  const [mode,      setMode]      = useState(isRfidMode ? "RFID" : "BARCODE");

  const handleModeChange = (m) => { setMode(m); setIsRfidMode(m === "RFID"); };

  const handleScan = async (code) => {
    setScanValue("");
    if (!agent) { await scanAgent(code); return; }
    await scanPliage(code, getLingeByCode);
  };

  const ETAPES = [
    { id: "AGENT",   label: "Agent",  done: !!agent },
    { id: "PLIAGE",  label: "Pliage", done: !!dialogueItem },
  ];

  const getPlaceholder = () => !agent
    ? "👤 Scanner votre badge agent..."
    : mode === "RFID" ? "📡 Scanner tag RFID..." : "📦 Scanner un linge (état LAVE)...";

  return (
    <div className="collecte-container">
      {dialogueItem && (
        <DialoguePliage item={dialogueItem} agent={agent} onFermer={fermerDialogue} onSuccess={() => { fermerDialogue(); }} />
      )}

      <div className="page-header" style={{ marginBottom: 0, textAlign: "left" }}>
        <h1 className="text-3xl font-extrabold" style={{ marginBottom: "4px" }}>👔 Pliage</h1>
        <p className="text-sm" style={{ color: "#166d7c", marginBottom: "24px" }}>Scan linge LAVE → Pliage et préparation</p>
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
            <Button variant="outline" size="sm" onClick={() => { setScanValue(""); deconnecterAgent(); }}>
              Reset
            </Button>
          </div>
        </div>

        {/* Étapes */}
        <div style={{ marginBottom: "20px" }}>
          <EtapesStepper etapes={ETAPES} etapeActive={!agent ? "AGENT" : "PLIAGE"} />
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

        {/* Info agent */}
        {agent && (
          <Card style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
            <CardContent className="p-4">
              <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px" }}>
                <FaUser color="#22c55e" />
                <span style={{ fontWeight: 600, color: "#15803d" }}>Prêt à plier</span>
                <span style={{ color: "#64748b" }}>Scannez un linge en état LAVE</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function PliageList() {
  return <PliageProvider><PliageInner /></PliageProvider>;
}
