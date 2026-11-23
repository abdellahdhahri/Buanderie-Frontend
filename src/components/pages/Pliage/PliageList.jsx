import React, { useState, useContext, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { LingeContext } from "../../../contextes/LingeContext";
import { useNavigate } from "react-router-dom";
import { Check, Radio, RotateCcw, ScanLine, Shirt } from "lucide-react";
import DialogueControleQualite from "../../dialogues/DialogueControleQualite";
import DialogueRangementService from "../../dialogues/DialogueRangementService";
import { Page } from "../../kit";
import { EmplacementMachine } from "../Lavage/PosteLavage";
import { PliageProvider, usePliage } from "../../../contextes/PliageContext";
import ScanInput from "../../utils/shared/ScanInput";
import { getAgent, isAgentConnected } from "../../../services/agentService";
import "../Linge/WorkflowList.css";
import "../Collecte/shared/CollecteRh.css";
import "../Lavage/Lavage.css";
import "../Lavage/PosteLavage.css";
import "../Reception/Reception.css";
import "../Lavage/LavageV2.css";

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

  const getBorderColor = () => !agent ? "#dc2626" : "#0794a4";

  const reinitialiser = () => {
    setScanValue("");
    deconnecterAgent();
    setAgent(null);
  };

  const lingeCourant = dialogueItem || rangementItem;
  const nomAgent = agent ? String(agent.nomPrenom || agent.nom || agent.matricule || "").trim() : "";
  const initialesAgent = nomAgent.split(/\s+/).filter(Boolean).slice(0, 2).map((x) => x[0]).join("").toUpperCase() || "?";
  const etapeFaite = [Boolean(agent), Boolean(lingeCourant), Boolean(rangementItem && !dialogueItem), false];
  const etapeActive = etapeFaite.findIndex((f) => !f);
  const etapes = [
    t("pliage.step_identify", "Identification de l'agent"),
    t("pliage.step_scan", "Scan du linge"),
    t("pliage.step_quality", "Contrôle qualité"),
    t("pliage.step_storage", "Rangement"),
  ];
  const libelleMode = mode === "RFID" ? "RFID" : t("pliage.barcode_mode", "Code-barres");

  return (
    <Page className="cr-page lv-page lw-page rc lw-v2">
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

      <div className="rc-toolbar">
        <div className="rc-head__right">
          {agent && (
            <div className="rc-agent">
              <span className="rc-agent__avatar">{initialesAgent}</span>
              <span className="rc-agent__text">
                <span className="rc-agent__name">{nomAgent || "—"}</span>
                <span className="rc-agent__id">{agent.matricule || agent.codeBarre}</span>
              </span>
            </div>
          )}
          <button type="button" className="rc-btn" disabled={!agent} onClick={reinitialiser}>
            <RotateCcw size={14} /> {t("common.reset")}
          </button>
        </div>
      </div>

      <ol className="rc-steps rc-steps--4" aria-label={t("pliage.steps", "Étapes du pliage")}>
        {etapes.map((label, i) => (
          <li key={label} className={`rc-step ${etapeFaite[i] ? "is-done" : ""} ${etapeActive === i ? "is-active" : ""}`}>
            <span className="rc-step__num">{etapeFaite[i] ? <Check size={14} strokeWidth={3} /> : i + 1}</span>
            <span className="rc-step__label">{label}</span>
          </li>
        ))}
      </ol>

      <div className="lw-stack">
        <section className={`rc-card rc-scan ${!agent ? "is-infecte" : ""}`}>
          <header className="rc-scan__bar">
            <span className="rc-scan__title"><ScanLine size={17} /> {t("pliage.title")}</span>
            <span className="rc-mode"><i /> {libelleMode}</span>
          </header>
          <div className="rc-scan__body lv2-scan">
            <div className={`rc-scan__field ${!agent ? "is-infecte" : ""}`}>
              <ScanInput
                placeholder=""
                value={scanValue}
                onChange={setScanValue}
                onSubmit={handleScan}
                borderColor={getBorderColor()}
                keepFocus={true}
                autoDebounce={true}
                disabled={!agent || !!dialogueItem}
              />
            </div>
            <EmplacementMachine
              machine={lingeCourant ? { code: lingeCourant.codeSuivi || lingeCourant.codeBarre || "—" } : null}
              icon={mode === "RFID" ? <Radio size={20} /> : <Shirt size={20} />}
              libelle={dialogueItem ? t("pliage.step_quality", "Contrôle qualité") : t("pliage.step_storage", "Rangement")}
              videTitre={t("pliage.no_linen", "Aucun linge en cours")}
              detail={lingeCourant?.categorie ? t(`categories.${lingeCourant.categorie}`, lingeCourant.categorie) : null}
              tone="teal"
            />
          </div>
        </section>
      </div>
    </Page>
  );
}

export default function PliageList() {
  return <PliageProvider><PliageInner /></PliageProvider>;
}