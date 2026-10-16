import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  FaSoap, FaFilter, FaCheckCircle, FaBiohazard,
  FaCalendarAlt, FaBoxes, FaSpinner, FaPlay, FaStop,
  FaUser, FaExclamationTriangle, FaTshirt, FaRedo,
  FaCheckDouble, FaClock, FaHistory, FaTimes
} from "react-icons/fa";
import { LavageProvider, useLavage } from "../../contextes/LavageContext";
import { getAgent, isAgentConnected } from "../../services/agentService";
import Swal from "sweetalert2";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";

import ScanInput              from "../../components/utils/ScanInput";
import CarteLot               from "../../components/utils/CarteLot";
import { LotBasketCard } from "../../components/utils/shared/LotBasket";
import MuteButton from "../../components/utils/MuteButton";
import { useVoiceGuide } from "../../hooks/useVoiceGuide";
import { getSetting } from "../../utils/appSettings";
import LotInfoDialog          from "../../components/utils/LotInfoDialog";
import ScanLingesPropresModal from "../../components/utils/ScanLingesPropresModal";
import RecapChargement        from "../../components/utils/RecapChargement";

import "../Linge/WorkflowList.css";
import { PageHeaderIcon } from "../../components/layout/PageHeaderIcon";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

// ═══════════════════════════════════════════════════════════════════════════
// 🎨 MachineCard — carte hero de la machine (NORMAL ou INFECTE)
// ═══════════════════════════════════════════════════════════════════════════
function MachineCard({ machine, mode }) {
  const { t } = useTranslation();
  if (!machine) return null;

  const isInfecte = mode === "INFECTE";
  const accent    = isInfecte ? "#dc2626" : "#0891b2";
  const accentBg  = isInfecte ? "#fef2f2" : "#ecfeff";
  const accentBd  = isInfecte ? "#fecaca" : "#a5f3fc";

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "16px",
      padding: "16px 18px",
      marginBottom: "16px",
      borderRadius: "16px",
      background: `linear-gradient(135deg, ${accentBg} 0%, #ffffff 100%)`,
      border: `1px solid ${accentBd}`,
      boxShadow: `0 4px 16px ${accent}15`,
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Halo décoratif */}
      <div style={{
        position: "absolute",
        right: "-30px",
        top: "-30px",
        width: "120px",
        height: "120px",
        borderRadius: "50%",
        background: `${accent}10`,
        pointerEvents: "none"
      }} />

      {/* Icône machine */}
      <div style={{
        width: "56px",
        height: "56px",
        borderRadius: "16px",
        background: `linear-gradient(135deg, ${accent}, ${isInfecte ? "#b91c1c" : "#0e7490"})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        flexShrink: 0,
        boxShadow: `0 6px 16px ${accent}40`,
        position: "relative",
        zIndex: 1
      }}>
        {isInfecte ? <FaBiohazard size={26} /> : <FaSoap size={26} />}
      </div>

      {/* Infos */}
      <div style={{ flex: 1, minWidth: 0, position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
          <span style={{ fontWeight: 800, fontSize: "18px", color: "#0f172a" }}>
            {machine.code}
          </span>
          <Badge style={{
            background: accent,
            color: "white",
            fontSize: "10px",
            fontWeight: 700,
            padding: "2px 8px",
            textTransform: "uppercase",
            letterSpacing: "0.3px"
          }}>
            {isInfecte ? t('lavage.infected_linen') : t('lavage.normal_linen')}
          </Badge>
        </div>
        <div style={{ fontSize: "12px", color: "#64748b", display: "flex", gap: "12px", flexWrap: "wrap" }}>
          {machine.marque && <span>🏷️ {machine.marque}</span>}
          {machine.capaciteKg && <span>⚖️ {machine.capaciteKg} kg</span>}
          {machine.type && <span>⚙️ {machine.type}</span>}
          {machine.etat && (
            <span style={{
              color: machine.etat === "DISPONIBLE" ? "#15803d" : "#dc2626",
              fontWeight: 600
            }}>
              ● {machine.etat}
            </span>
          )}
        </div>
      </div>

      {/* Indicateur "prête" */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "4px",
        padding: "8px 12px",
        borderRadius: "12px",
        background: "white",
        border: `1px solid ${accentBd}`,
        position: "relative",
        zIndex: 1
      }}>
        <div style={{
          width: "10px",
          height: "10px",
          borderRadius: "50%",
          background: "#22c55e",
          boxShadow: "0 0 0 4px #22c55e30",
          animation: "pulse 2s infinite"
        }} />
        <span style={{ fontSize: "10px", fontWeight: 700, color: "#15803d" }}>
          {t('lavage.ready_for_wash')}
        </span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 🎨 CarteSacInfecteCreative — carte biohazard (mode INFECTE)
// ═══════════════════════════════════════════════════════════════════════════
function CarteSacInfecteCreative({ sac, selectionne, onClick, disabled }) {
  const { t } = useTranslation();

  return (
    <div
      onClick={onClick}
      style={{
        position: "relative",
        padding: "14px",
        borderRadius: "14px",
        border: `2px solid ${selectionne ? "#dc2626" : "#e2e8f0"}`,
        background: selectionne
          ? "linear-gradient(135deg, #fef2f2 0%, #ffffff 100%)"
          : "white",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.18s ease",
        boxShadow: selectionne
          ? "0 6px 18px rgba(220,38,38,0.20)"
          : "0 1px 3px rgba(0,0,0,0.04)",
        overflow: "hidden",
        opacity: selectionne ? 0.95 : 1
      }}
      onMouseEnter={e => {
        if (!selectionne && !disabled) {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 8px 20px rgba(220,38,38,0.15)";
          e.currentTarget.style.borderColor = "#dc2626";
        }
      }}
      onMouseLeave={e => {
        if (!selectionne) {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)";
          e.currentTarget.style.borderColor = "#e2e8f0";
        }
      }}
    >
      {/* Bande danger hachurée */}
      <div style={{
        position: "absolute",
        top: 0, left: 0, right: 0,
        height: "4px",
        background: "repeating-linear-gradient(45deg, #dc2626, #dc2626 6px, #fbbf24 6px, #fbbf24 12px)"
      }} />

      {/* Fond biohazard décoratif */}
      <div style={{
        position: "absolute",
        right: "-10px",
        bottom: "-10px",
        opacity: 0.05,
        pointerEvents: "none",
        color: "#dc2626"
      }}>
        <FaBiohazard size={70} />
      </div>

      {/* En-tête : icône + numéro */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        marginBottom: "10px",
        marginTop: "2px",
        position: "relative",
        zIndex: 1
      }}>
        <div style={{
          width: "36px",
          height: "36px",
          borderRadius: "10px",
          background: "linear-gradient(135deg, #dc2626, #991b1b)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          flexShrink: 0,
          boxShadow: "0 3px 8px rgba(220,38,38,0.35)"
        }}>
          <FaBiohazard size={18} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{
            fontWeight: 800,
            fontSize: "13px",
            color: "#dc2626",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap"
          }}>
            {sac.numeroSac}
          </div>
          <div style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" }}>
            {t('lavage.infected_linen')}
          </div>
        </div>
        {selectionne && (
          <div style={{
            width: "22px",
            height: "22px",
            borderRadius: "50%",
            background: "#dc2626",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "12px",
            fontWeight: 700,
            boxShadow: "0 2px 8px rgba(220,38,38,0.5)",
            flexShrink: 0
          }}>
            ✓
          </div>
        )}
      </div>

      {/* Statistiques */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "8px",
        padding: "8px 10px",
        borderRadius: "10px",
        background: selectionne ? "#fff5f5" : "#f8fafc",
        border: `1px solid ${selectionne ? "#fecaca" : "#f1f5f9"}`,
        position: "relative",
        zIndex: 1
      }}>
        <div>
          <div style={{ fontSize: "9px", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" }}>
            {t('lavage.items')}
          </div>
          <div style={{ fontSize: "14px", fontWeight: 800, color: "#dc2626" }}>
            {sac.quantiteDeclaree || 0}
          </div>
        </div>
        <div>
          <div style={{ fontSize: "9px", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" }}>
            État
          </div>
          <div style={{
            fontSize: "11px",
            fontWeight: 700,
            color: sac.etat === "EN_LAVAGE" ? "#f59e0b" : "#dc2626",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            marginTop: "2px"
          }}>
            <span style={{
              width: "6px", height: "6px", borderRadius: "50%",
              background: sac.etat === "EN_LAVAGE" ? "#f59e0b" : "#dc2626"
            }} />
            {sac.etat || "RECU"}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── StatutCard ──────────────────────────────────────────────────────────────
function StatutCard({ label, value, icon, color, bg, subValue }) {
  return (
    <div style={{
      padding: "16px 18px", borderRadius: "14px", background: bg,
      border: `1px solid ${color}25`, flex: 1, minWidth: "100px",
      transition: "all 0.2s ease"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{
          width: "40px", height: "40px", borderRadius: "12px",
          background: `${color}15`, display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: "20px"
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
          {subValue && <p style={{ fontSize: "10px", color: "#94a3b8", margin: 0 }}>{subValue}</p>}
        </div>
      </div>
    </div>
  );
}

// ─── RecapChargementInfecte ──────────────────────────────────────────────────
function RecapChargementInfecte({
  sacsSelectionnes, poidsTotal, onRetirer, onTerminer,
  onArreter, onNouveauCycle, estTermine, estEnLavage, tempsEcoule
}) {
  const { t } = useTranslation();

  return (
    <div style={{
      background: "#f8fafc", borderRadius: "14px", padding: "16px",
      border: "1px solid #e2e8f0", position: "sticky", top: "20px", alignSelf: "start"
    }}>
      <div style={{ fontWeight: 700, fontSize: "14px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
        <FaBoxes color="#dc2626" />
        {t('lavage.infecte_bags_in_wash')}
        <Badge style={{ background: "#fee2e2", color: "#dc2626", marginLeft: "auto" }}>
          {sacsSelectionnes.length}
        </Badge>
      </div>

      {sacsSelectionnes.length === 0 ? (
        <div style={{ textAlign: "center", padding: "20px", color: "#94a3b8", fontSize: "13px" }}>
          <FaBiohazard size={28} style={{ opacity: 0.2, marginBottom: "8px" }} />
          <div>{t('lavage.no_bags_selected')}</div>
          <div style={{ fontSize: "11px", marginTop: "4px" }}>{t('lavage.scan_infected_bags')}</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "300px", overflowY: "auto" }}>
          {sacsSelectionnes.map((sac, index) => (
            <div key={sac.id || index} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "8px 12px", borderRadius: "8px",
              background: "white", border: "1px solid #fca5a5"
            }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: "13px", color: "#dc2626" }}>{sac.numeroSac}</div>
                <div style={{ fontSize: "11px", color: "#64748b" }}>
                  {sac.quantiteDeclaree || 0} {t('lavage.items')}
                </div>
              </div>
              {!estTermine && !estEnLavage && (
                <button onClick={() => onRetirer(sac)} style={{
                  padding: "4px 8px", borderRadius: "6px",
                  border: "1px solid #fca5a5", background: "#fff5f5",
                  color: "#dc2626", cursor: "pointer", fontSize: "11px"
                }}>
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #e2e8f0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "4px" }}>
          <span style={{ color: "#64748b" }}>{t('lavage.total_items')}</span>
          <span style={{ fontWeight: 700, color: "#0f172a" }}>{poidsTotal}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
          <span style={{ color: "#64748b" }}>{t('lavage.bags')}</span>
          <span style={{ fontWeight: 700, color: "#0f172a" }}>{sacsSelectionnes.length}</span>
        </div>
        {tempsEcoule > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginTop: "4px", paddingTop: "4px", borderTop: "1px solid #e2e8f0" }}>
            <span style={{ color: "#64748b" }}>
              <FaClock size={12} style={{ display: "inline", marginRight: "4px" }} />
              {t('lavage.time')}
            </span>
            <span style={{ fontWeight: 600, color: "#0f172a" }}>
              {Math.floor(tempsEcoule / 60)}m {tempsEcoule % 60}s
            </span>
          </div>
        )}
      </div>

      {!estTermine && !estEnLavage && (
        <button
          onClick={onTerminer}
          disabled={sacsSelectionnes.length === 0}
          style={{
            marginTop: "12px", width: "100%", padding: "10px",
            borderRadius: "8px", border: "none",
            background: sacsSelectionnes.length === 0 ? "#e2e8f0" : "linear-gradient(135deg, #10b981, #059669)",
            color: sacsSelectionnes.length === 0 ? "#94a3b8" : "white",
            fontWeight: 700, cursor: sacsSelectionnes.length === 0 ? "not-allowed" : "pointer",
            fontSize: "13px", display: "flex", alignItems: "center",
            justifyContent: "center", gap: "8px"
          }}
        >
          <FaPlay size={14} />
          {sacsSelectionnes.length === 0 ? t('lavage.no_bags_selected') : t('lavage.start_infected_cycle')}
        </button>
      )}

      {estEnLavage && !estTermine && (
        <>
          <button onClick={onTerminer} style={{
            marginTop: "12px", width: "100%", padding: "10px",
            borderRadius: "8px", border: "none",
            background: "linear-gradient(135deg, #10b981, #059669)",
            color: "white", fontWeight: 700, cursor: "pointer", fontSize: "13px",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
          }}>
            <FaCheckDouble size={14} /> {t('lavage.finish_infected_cycle')}
          </button>
          <button onClick={onArreter} style={{
            marginTop: "8px", width: "100%", padding: "10px",
            borderRadius: "8px", border: "none",
            background: "linear-gradient(135deg, #ef4444, #dc2626)",
            color: "white", fontWeight: 700, cursor: "pointer", fontSize: "13px",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
          }}>
            <FaStop size={14} /> {t('lavage.stop_cycle')}
          </button>
        </>
      )}

      {estTermine && (
        <button onClick={onNouveauCycle} style={{
          marginTop: "12px", width: "100%", padding: "10px",
          borderRadius: "8px", border: "none",
          background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
          color: "white", fontWeight: 700, cursor: "pointer", fontSize: "13px",
          display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
        }}>
          <FaRedo size={14} /> {t('lavage.new_cycle')}
        </button>
      )}
    </div>
  );
}

function LavageInner() {
  const { t } = useTranslation();

  const {
    agent: agentFromContext,
    setAgentDirect,
    identifierAgent,
    etapeBlanc, machine, lotsDisponibles, lotsSelectionnes,
    loadingLots, poidsTotal,
    scannerMachine, chargerLots, scannerLot,
    confirmerAjoutLot, retirerLot, nouveauCycleBlanc,
    sacsInfectes, loadingSacs,
    chargerSacsInfectes,
    loading, resetAll, finishCycle,
  } = useLavage();

  const [scanVal, setScanVal] = useState("");
  const [searchLot, setSearchLot] = useState("");

  // ✅ Source de vérité unique : l'agent vient du contexte
  const agent = agentFromContext;

  // ─── États pour les infectés ──────────────────────────────────────────────
  const [machineInfecte, setMachineInfecte] = useState(null);
  const [sacsSelectionnes, setSacsSelectionnes] = useState([]);
  const [etapeInfecte, setEtapeInfecte] = useState("MACHINE");
  const [modeLavage, setModeLavage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cycleTermineInfecte, setCycleTermineInfecte] = useState(false);
  const [cycleEnCours, setCycleEnCours] = useState(false);
  const [tempsEcoule, setTempsEcoule] = useState(0);
  const [timerInterval, setTimerInterval] = useState(null);

  const scanInputRef = useRef(null);

  // ─── Assistant vocal ──────────────────────────────────────────────────────
  const [voiceLang, setVoiceLang] = useState(() => getSetting("voice.lang"));
  const voice = useVoiceGuide(voiceLang);
  const voiceRef = useRef(voice);
  useEffect(() => { voiceRef.current = voice; }, [voice]);
  useEffect(() => () => voiceRef.current.cancel(), []);

  // Bienvenue une seule fois, dès que l'agent est connu
  const bienvenueFaite = useRef(false);
  useEffect(() => {
    if (!agent || bienvenueFaite.current) return;
    bienvenueFaite.current = true;
    setTimeout(() => voiceRef.current.sayMsg("bienvenue_lavage", "succes", agent.nomPrenom || agent.nom || ""), 600);
  }, [agent]);

  // Linge blanc : démarrage / fin du cycle (déclenchés dans le contexte)
  const etapeBlancPrec = useRef(etapeBlanc);
  useEffect(() => {
    const prec = etapeBlancPrec.current;
    etapeBlancPrec.current = etapeBlanc;
    if (prec === etapeBlanc) return;
    if (etapeBlanc === "EN_COURS") voiceRef.current.sayMsg("lavage_demarre", "succes", lotsSelectionnes.length);
    if (etapeBlanc === "TERMINE") voiceRef.current.sayMsg("lavage_termine", "succes");
  }, [etapeBlanc, lotsSelectionnes.length]);

  // Linge blanc : lot ajouté / retiré du chargement
  const lotsPrec = useRef(lotsSelectionnes);
  useEffect(() => {
    const prec = lotsPrec.current;
    lotsPrec.current = lotsSelectionnes;
    if (etapeBlanc !== "LOTS") return;
    if (lotsSelectionnes.length === prec.length + 1) {
      const ajoute = lotsSelectionnes[lotsSelectionnes.length - 1].lot;
      const charge = lotsSelectionnes.reduce((s, ls) => s + (ls.lot.poidsActuel || 0), 0);
      voiceRef.current.sayMsg("lot_ajoute", "succes", ajoute.codeLot, Number(charge.toFixed(1)), machine?.capaciteKg);
    } else if (lotsSelectionnes.length === prec.length - 1) {
      const retire = prec.find((ls) => !lotsSelectionnes.some((x) => x.lot.id === ls.lot.id));
      if (retire) voiceRef.current.sayMsg("lot_retire", null, retire.lot.codeLot);
    }
  }, [lotsSelectionnes, etapeBlanc, machine]);

  // ═══════════════════════════════════════════════════════════════════════
  // ✅ Récupérer l'agent depuis localStorage → pousser dans le contexte
  // ═══════════════════════════════════════════════════════════════════════
  useEffect(() => {
    const syncAgent = () => {
      const agentData = getAgent();
      if (agentData && isAgentConnected()) {
        setAgentDirect({
          ...agentData,
          matricule: agentData.matricule || agentData.codeBarre || agentData.login,
          codeBarre: agentData.codeBarre || agentData.matricule || agentData.login,
          nomPrenom: agentData.nomPrenom || agentData.nom || agentData.login || "Inconnu",
        });
      }
    };

    syncAgent();

    const handleFocus = () => syncAgent();
    const handleStorage = (e) => {
      if (e.key === "agent" || e.key === "auth") syncAgent();
    };
    window.addEventListener("focus", handleFocus);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("storage", handleStorage);
    };
  }, [setAgentDirect]);

  // Charger les lots / sacs selon le mode
  useEffect(() => {
    if (!agent) return;

    if (modeLavage === "NORMAL" && etapeBlanc === "LOTS") {
      chargerLots();
    }

    if (modeLavage === "INFECTE") {
      chargerSacsInfectes();
    }
  }, [modeLavage, agent, etapeBlanc, chargerLots, chargerSacsInfectes]);

  // Timer pour les infectés
  useEffect(() => {
    if (cycleEnCours && !cycleTermineInfecte) {
      const interval = setInterval(() => {
        setTempsEcoule(prev => prev + 1);
      }, 1000);
      setTimerInterval(interval);
      return () => clearInterval(interval);
    } else {
      if (timerInterval) {
        clearInterval(timerInterval);
        setTimerInterval(null);
      }
    }
  }, [cycleEnCours, cycleTermineInfecte]);

  // ✅ Helper pour récupérer le matricule de l'agent (source unique)
  const getAgentMatricule = useCallback(() => {
    return agent?.matricule || agent?.codeBarre || agent?.login || null;
  }, [agent]);

  const scannerMachineUnifie = useCallback(async (code) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/machines/code/${encodeURIComponent(code)}`);
      if (!res.ok) {
        voice.sayMsg("machine_introuvable", "erreur");
        await Swal.fire({
          icon: 'error', title: t('lavage.machine_not_found'),
          text: code, timer: 1500, showConfirmButton: false
        });
        return;
      }
      const mach = await res.json();

      if (mach.categorie === "LINGES_INFECTE") {
        setModeLavage("INFECTE");
        setMachineInfecte(mach);
        setEtapeInfecte("SACS");
        setSacsSelectionnes([]);
        setCycleTermineInfecte(false);
        setCycleEnCours(false);
        setTempsEcoule(0);
        const sacs = await chargerSacsInfectes();
        const nbEnAttente = (Array.isArray(sacs) ? sacs : []).filter(s => s.etat === "RECEPTIONNE" || s.etat === "RECEPTION").length;
        voice.sayMsg("machine_infectee", "infecte", mach.code, nbEnAttente);

        await Swal.fire({
          icon: 'success', title: t('lavage.infected_machine'),
          text: `${mach.code} - ${mach.marque}`, timer: 1500, showConfirmButton: false
        });
      } else {
        setModeLavage("NORMAL");
        const machineOk = await scannerMachine(code);
        if (machineOk) voice.sayMsg("machine_normale", "succes", mach.code);
        setEtapeInfecte(null);
        setMachineInfecte(null);
        setSacsSelectionnes([]);
        setCycleTermineInfecte(false);
        setCycleEnCours(false);
        setTempsEcoule(0);

        await Swal.fire({
          icon: 'success', title: t('lavage.normal_machine'),
          text: `${mach.code} - ${mach.marque}`, timer: 1500, showConfirmButton: false
        });
      }
    } catch (err) {
      voice.sayErreurGenerique(err.message);
      await Swal.fire({
        icon: 'error', title: t('common.error'), text: err.message
      });
    } finally {
      setIsLoading(false);
    }
  }, [scannerMachine, chargerSacsInfectes, t, voice]);

  // ─── Scanner Sac Infecté ──────────────────────────────────────────────────
  const scannerSacInfecte = useCallback(async (code) => {
    if (!machineInfecte) {
      voice.sayMsg("scanner_machine_d_abord", "alerte");
      await Swal.fire({
        icon: 'warning', title: t('lavage.scan_machine_first'),
        text: t('lavage.scan_machine_first_text'), timer: 2000, showConfirmButton: false
      });
      return;
    }

    if (cycleTermineInfecte || cycleEnCours) {
      voice.sayMsg("cycle_deja_en_cours", "alerte");
      await Swal.fire({
        icon: 'warning', title: t('lavage.cycle_in_progress'),
        text: t('lavage.cycle_in_progress_text'), timer: 1500, showConfirmButton: false
      });
      return;
    }

    const sac = sacsInfectes?.find(s => s.numeroSac === code || s.code === code);
    if (!sac) {
      voice.sayMsg("sac_introuvable", "erreur");
      await Swal.fire({
        icon: 'error', title: t('lavage.bag_not_found'),
        text: code, timer: 1500, showConfirmButton: false
      });
      return;
    }

    if (sacsSelectionnes.find(s => s.numeroSac === sac.numeroSac)) {
      voice.sayMsg("sac_deja_ajoute", "alerte", sac.numeroSac);
      await Swal.fire({
        icon: 'warning', title: t('lavage.bag_already_added'),
        text: sac.numeroSac, timer: 1500, showConfirmButton: false
      });
      return;
    }

    if (sac.etat === "EN_LAVAGE") {
      voice.sayMsg("sac_deja_en_lavage", "alerte", sac.numeroSac);
      await Swal.fire({
        icon: 'warning', title: t('lavage.bag_already_in_wash'),
        text: sac.numeroSac, timer: 1500, showConfirmButton: false
      });
      return;
    }

    setSacsSelectionnes(prev => [...prev, sac]);
    voice.sayMsg("sac_ajoute", "infecte", sac.numeroSac, sac.quantiteDeclaree || 0);

    await Swal.fire({
      icon: 'success', title: t('lavage.bag_added'),
      text: `${sac.numeroSac} - ${sac.quantiteDeclaree || 0} ${t('lavage.items')}`,
      timer: 1000, showConfirmButton: false
    });
  }, [machineInfecte, sacsInfectes, sacsSelectionnes, cycleTermineInfecte, cycleEnCours, t, voice]);

  const retirerSac = useCallback((sac) => {
    setSacsSelectionnes(prev => prev.filter(s => s.numeroSac !== sac.numeroSac));
  }, []);

  // ─── Lancer le cycle infecté ──────────────────────────────────────────────
  const lancerCycleInfecte = useCallback(async () => {
    if (sacsSelectionnes.length === 0) {
      voice.sayMsg("aucun_sac", "alerte");
      await Swal.fire({
        icon: 'warning', title: t('lavage.no_bags_selected'),
        text: t('lavage.no_bags_selected_text'), timer: 1500, showConfirmButton: false
      });
      return;
    }

    const matricule = getAgentMatricule();
    if (!matricule) {
      await Swal.fire({
        icon: 'error', title: t('common.error'),
        text: "Agent non identifié. Veuillez vous reconnecter."
      });
      return;
    }

    setIsLoading(true);
    try {
      for (const sac of sacsSelectionnes) {
        const res = await fetch(
          `${API_URL}/api/sacs-infectes/laver?numeroSac=${encodeURIComponent(sac.numeroSac)}` +
          `&matricule=${encodeURIComponent(matricule)}` +
          `&codeMachine=${machineInfecte.code}`,
          { method: "PUT" }
        );

        if (!res.ok) {
          const txt = await res.text();
          let msg = txt;
          try { msg = JSON.parse(txt).message || txt; } catch {}
          throw new Error(`Erreur pour ${sac.numeroSac}: ${msg}`);
        }
      }

      setEtapeInfecte("LAVAGE");
      setCycleEnCours(true);
      setTempsEcoule(0);
      await chargerSacsInfectes();
      voice.sayMsg("cycle_infecte_demarre", "infecte", sacsSelectionnes.length);

      await Swal.fire({
        icon: 'success', title: t('lavage.infected_cycle_started'),
        text: `${sacsSelectionnes.length} ${t('lavage.bags_in_wash')}`,
        timer: 2000, showConfirmButton: false
      });
    } catch (err) {
      await Swal.fire({
        icon: 'error', title: t('common.error'), text: err.message
      });
    } finally {
      setIsLoading(false);
    }
  }, [sacsSelectionnes, machineInfecte, getAgentMatricule, chargerSacsInfectes, t, voice]);

  // ─── Terminer le cycle infecté ──────────────────────────────────────────
  const terminerCycleInfecte = useCallback(async () => {
    if (sacsSelectionnes.length === 0) {
      await Swal.fire({
        icon: 'warning', title: t('lavage.no_bags_to_finish'),
        text: t('lavage.no_bags_to_finish_text'), timer: 1500, showConfirmButton: false
      });
      return;
    }

    const matricule = getAgentMatricule();
    if (!matricule) {
      await Swal.fire({
        icon: 'error', title: t('common.error'),
        text: "Agent non identifié. Veuillez vous reconnecter."
      });
      return;
    }

    const result = await Swal.fire({
      icon: 'question', title: t('lavage.finish_infected_cycle'),
      text: `${sacsSelectionnes.length} ${t('lavage.bags_will_be_finished')}`,
      showCancelButton: true, confirmButtonColor: '#7c3aed',
      cancelButtonColor: '#64748b',
      confirmButtonText: t('lavage.yes_finish'),
      cancelButtonText: t('common.cancel')
    });

    if (!result.isConfirmed) return;

    setIsLoading(true);
    try {
      for (const sac of sacsSelectionnes) {
        await fetch(
          `${API_URL}/api/sacs-infectes/terminer-lavage?numeroSac=${sac.numeroSac}` +
          `&matricule=${encodeURIComponent(matricule)}`,
          { method: "PUT" }
        );
      }

      setEtapeInfecte("TERMINE");
      voice.sayMsg("cycle_infecte_termine", "succes", sacsSelectionnes.length);
      setCycleTermineInfecte(true);
      setCycleEnCours(false);
      if (timerInterval) {
        clearInterval(timerInterval);
        setTimerInterval(null);
      }
      await chargerSacsInfectes();

      await Swal.fire({
        icon: 'success', title: t('lavage.infected_cycle_finished'),
        text: `${sacsSelectionnes.length} ${t('lavage.bags_washed_success')}`,
        timer: 2000, showConfirmButton: false
      });
    } catch (err) {
      await Swal.fire({
        icon: 'error', title: t('common.error'), text: err.message
      });
    } finally {
      setIsLoading(false);
    }
  }, [sacsSelectionnes, getAgentMatricule, chargerSacsInfectes, timerInterval, t, voice]);

  const arreterCycleInfecte = useCallback(async () => {
    const matricule = getAgentMatricule();
    if (!matricule) {
      await Swal.fire({
        icon: 'error', title: t('common.error'),
        text: "Agent non identifié. Veuillez vous reconnecter."
      });
      return;
    }

    const result = await Swal.fire({
      icon: 'warning', title: t('lavage.stop_infected_cycle'),
      text: `${sacsSelectionnes.length} ${t('lavage.bags_will_be_stopped')}`,
      showCancelButton: true, confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: t('lavage.yes_stop'),
      cancelButtonText: t('common.cancel')
    });

    if (!result.isConfirmed) return;

    setIsLoading(true);
    try {
      for (const sac of sacsSelectionnes) {
        await fetch(
          `${API_URL}/api/sacs-infectes/arreter-lavage?numeroSac=${sac.numeroSac}` +
          `&matricule=${encodeURIComponent(matricule)}`,
          { method: "PUT" }
        );
      }

      setEtapeInfecte("SACS");
      voice.sayMsg("cycle_infecte_arrete", "alerte");
      setCycleEnCours(false);
      setCycleTermineInfecte(false);
      if (timerInterval) {
        clearInterval(timerInterval);
        setTimerInterval(null);
      }
      setTempsEcoule(0);
      await chargerSacsInfectes();

      await Swal.fire({
        icon: 'info', title: t('lavage.infected_cycle_stopped'),
        text: `${sacsSelectionnes.length} ${t('lavage.bags_stopped')}`,
        timer: 2000, showConfirmButton: false
      });
    } catch (err) {
      await Swal.fire({
        icon: 'error', title: t('common.error'), text: err.message
      });
    } finally {
      setIsLoading(false);
    }
  }, [sacsSelectionnes, getAgentMatricule, chargerSacsInfectes, timerInterval, t, voice]);

  const nouveauCycleInfecte = useCallback(() => {
    setMachineInfecte(null);
    setSacsSelectionnes([]);
    setEtapeInfecte("MACHINE");
    setCycleTermineInfecte(false);
    setCycleEnCours(false);
    setModeLavage(null);
    setTempsEcoule(0);
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
    setScanVal("");
    setTimeout(() => scanInputRef.current?.focus(), 200);
  }, [timerInterval]);

  const handleResetAll = useCallback(() => {
    resetAll();
    setModeLavage(null);
    setMachineInfecte(null);
    setSacsSelectionnes([]);
    setEtapeInfecte("MACHINE");
    setCycleTermineInfecte(false);
    setCycleEnCours(false);
    setTempsEcoule(0);
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
    setScanVal("");
  }, [resetAll, timerInterval]);

  // ─── Scan général ──────────────────────────────────────────────────────
  const handleScan = useCallback(async (code) => {
    setScanVal("");
    if (!agent) return;
    if (!code?.trim()) return;

    if (!modeLavage) {
      await scannerMachineUnifie(code);
      return;
    }

    if (modeLavage === "NORMAL") {
      if (etapeBlanc === "MACHINE") {
        await scannerMachineUnifie(code);
        return;
      }
      if (etapeBlanc === "LOTS") {
        const c = code.trim();
        const lotTrouve = lotsDisponibles.find(l => l.codeLot === c);
        if (lotsSelectionnes.some(ls => ls.lot.codeLot === c)) voice.sayMsg("lot_deja_ajoute", "alerte", c);
        else if (!lotTrouve) voice.sayMsg("lot_introuvable", "erreur");
        else if (machine && poidsTotal + (lotTrouve.poidsActuel || 0) > machine.capaciteKg) voice.sayMsg("capacite_depassee", "alerte", machine.capaciteKg);
        await scannerLot(code, poidsTotal);
        return;
      }
    }

    if (modeLavage === "INFECTE") {
      if (etapeInfecte === "MACHINE") {
        await scannerMachineUnifie(code);
        return;
      }
      if (etapeInfecte === "SACS" || etapeInfecte === "LAVAGE") {
        await scannerSacInfecte(code);
        return;
      }
    }
  }, [agent, modeLavage, etapeBlanc, etapeInfecte, scannerMachineUnifie, scannerLot, scannerSacInfecte, poidsTotal, lotsDisponibles, lotsSelectionnes, machine, voice]);

  const lotsFiltres = useMemo(() => {
    const ids = new Set(lotsSelectionnes.map(ls => ls.lot.id));
    return lotsDisponibles.filter(l =>
      l.etat === "EN_TRI" &&
      !ids.has(l.id) &&
      (!searchLot ||
        l.codeLot.toLowerCase().includes(searchLot.toLowerCase()) ||
        l.categorie?.toLowerCase().includes(searchLot.toLowerCase()))
    );
  }, [lotsDisponibles, lotsSelectionnes, searchLot]);

  const getPlaceholder = () => {
    if (!agent) return t('lavage.agent_not_connected');
    if (!modeLavage) return t('lavage.scan_machine_code');

    if (modeLavage === "NORMAL") {
      if (etapeBlanc === "MACHINE") return t('lavage.scan_machine_code');
      if (etapeBlanc === "LOTS") return t('lavage.scan_lot');
    }

    if (modeLavage === "INFECTE") {
      if (etapeInfecte === "MACHINE") return t('lavage.scan_machine_code');
      if (etapeInfecte === "SACS") return t('lavage.scan_infected_bag');
      if (etapeInfecte === "LAVAGE") return t('lavage.scan_another_bag');
      if (etapeInfecte === "TERMINE") return t('lavage.cycle_finished');
    }
    return t('lavage.scan');
  };

  const getBorderColor = () => {
    if (!agent) return "#dc2626";
    if (modeLavage === "INFECTE") return "#dc2626";
    if (modeLavage === "NORMAL") return "#0ea5e9";
    return "#0ea5e9";
  };

  const getModeLabel = () => {
    if (!modeLavage) return t('lavage.waiting');
    if (modeLavage === "NORMAL") return t('lavage.normal_linen');
    return t('lavage.infected_linen');
  };

  const getModeColor = () => {
    if (!modeLavage) return "#64748b";
    if (modeLavage === "NORMAL") return "#0ea5e9";
    return "#dc2626";
  };

  const sacsDisponibles = sacsInfectes?.filter(s => s.etat === "RECEPTIONNE" || s.etat === "RECEPTION") || [];
  const totalArticles = sacsSelectionnes.reduce((sum, s) => sum + (s.quantiteDeclaree || 0), 0);

  return (
    <div className="collecte-container">
      <LotInfoDialog />
      <ScanLingesPropresModal />

      {/* ─── EN-TÊTE ─────────────────────────────────────────────────────── */}
      <div style={{
        marginBottom: "32px", display: "flex", alignItems: "center",
        justifyContent: "space-between", flexWrap: "wrap", gap: "12px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <PageHeaderIcon size={52} />
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
              {t('lavage.title')}
            </h1>
            <p style={{ fontSize: "14px", color: "#64748b", margin: "2px 0 0 0" }}>
              {agent ? `${t('lavage.agent')}: ${agent.nomPrenom || agent.nom || agent.matricule}` : t('lavage.no_agent_connected')}
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

      <div className="collecte-panel-grand" style={{
        background: "white", borderRadius: "20px", padding: "32px",
        border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(0,0,0,0.06)"
      }}>

        {/* Barre supérieure */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginBottom: "20px", flexWrap: "wrap", gap: "12px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {agent ? (
              <div style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: "8px 16px", background: "#f0fdf4",
                borderRadius: "10px", border: "1px solid #bbf7d0"
              }}>
                <FaCheckCircle color="#22c55e" size={16} />
                <span style={{ fontWeight: 700, color: "#15803d", fontSize: "14px" }}>
                  {agent.nomPrenom || agent.nom || agent.matricule}
                </span>
                <Badge variant="outline" style={{ fontSize: "11px" }}>
                  {getAgentMatricule()}
                </Badge>
                <button onClick={handleResetAll} style={{
                  background: "none", border: "none", color: "#94a3b8", cursor: "pointer"
                }}>
                  <FaTimes size={12} />
                </button>
              </div>
            ) : (
              <div style={{ fontSize: "13px", color: "#94a3b8" }}>{t('lavage.no_agent_connected')}</div>
            )}
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <span style={{
              padding: "4px 14px", borderRadius: "10px",
              background: modeLavage ? (modeLavage === "NORMAL" ? "#dbeafe" : "#fee2e2") : "#f1f5f9",
              color: getModeColor(), fontSize: "12px", fontWeight: 600
            }}>
              {getModeLabel()}
            </span>
            <Button variant="outline" size="sm" onClick={handleResetAll}>
              {t('common.reset')}
            </Button>
          </div>
        </div>

        {/* Message si agent non connecté */}
        {!agent && (
          <div style={{
            padding: "12px 16px", borderRadius: "10px", background: "#fef2f2",
            border: "1px solid #fca5a5", marginBottom: "16px",
            display: "flex", alignItems: "center", gap: "10px",
            fontSize: "13px", color: "#dc2626"
          }}>
            <FaExclamationTriangle size={16} />
            <span style={{ fontWeight: 600 }}>{t('lavage.no_agent_connected')}</span>
            <span style={{ color: "#64748b" }}>{t('lavage.no_agent_connect_text')}</span>
          </div>
        )}

        {/* Zone de scan */}
        <Card style={{ marginBottom: "20px", border: `2px dashed ${getBorderColor()}` }}>
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
              disabled={!agent || isLoading || etapeInfecte === "TERMINE"}
            />
          </CardContent>
        </Card>

        {/* Info agent */}
        {agent && (
          <Card style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", marginBottom: "16px" }}>
            <CardContent className="p-4">
              <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px" }}>
                <FaSoap color="#22c55e" size={16} />
                <span style={{ fontWeight: 600, color: "#15803d" }}>{t('lavage.ready_for_wash')}</span>
                <span style={{ color: "#64748b" }}>
                  {!modeLavage ? t('lavage.scan_machine') :
                   modeLavage === "NORMAL" ? t('lavage.scan_lot_status') :
                   t('lavage.scan_infected_bag')}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contenu selon le mode */}
        {agent && (
          <>
            {/* ═══════════════ MODE NORMAL ═══════════════ */}
            {modeLavage === "NORMAL" && (
              <>
                <MachineCard machine={machine} mode="NORMAL" />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "20px" }}>
                  <div>
                    {etapeBlanc === "MACHINE" && (
                      <div style={{
                        textAlign: "center", padding: "40px", background: "#f8fafc",
                        borderRadius: "14px", border: "2px dashed #e2e8f0", color: "#94a3b8"
                      }}>
                        <FaSoap size={36} style={{ opacity: 0.3, marginBottom: "12px" }} />
                        <div style={{ fontSize: "14px", fontWeight: 500 }}>{t('lavage.waiting_machine_scan')}</div>
                        <div style={{ fontSize: "12px", marginTop: "4px" }}>
                          {t('lavage.scan_machine_code_instruction')}
                        </div>
                      </div>
                    )}

                    {(etapeBlanc === "LOTS" || etapeBlanc === "EN_COURS") && (
                      <div style={{ background: "#f8fafc", borderRadius: "14px", padding: "16px", border: "1px solid #e2e8f0" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                          <div style={{ fontWeight: 700, fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                            <FaBoxes color="#64748b" /> {t('lavage.ready_lots')}
                            <span style={{ background: "#e2e8f0", padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: 500 }}>
                              {lotsFiltres.length}
                            </span>
                          </div>
                          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                            <input type="text" placeholder={t('common.search')}
                              value={searchLot} onChange={e => setSearchLot(e.target.value)}
                              onFocus={e => e.stopPropagation()}
                              style={{ padding: "6px 10px", borderRadius: "8px", border: "1px solid #e2e8f0",
                                       fontSize: "12px", outline: "none", width: "140px" }} />
                            <button onClick={chargerLots} style={{
                              padding: "6px 12px", borderRadius: "8px", border: "1px solid #e2e8f0",
                              background: "white", color: "#64748b", cursor: "pointer", fontSize: "12px"
                            }}>↻</button>
                          </div>
                        </div>

                        {loadingLots ? (
                          <div style={{ textAlign: "center", padding: "24px", color: "#94a3b8" }}>
                            <FaSpinner style={{ animation: "spin 1s linear infinite" }} /> {t('common.loading')}
                          </div>
                        ) : lotsFiltres.length === 0 ? (
                          <div style={{ textAlign: "center", padding: "30px", color: "#94a3b8", fontSize: "13px" }}>
                            <FaBoxes size={30} style={{ opacity: 0.2, marginBottom: "8px" }} />
                            <div>{t('lavage.no_lots_available')}</div>
                          </div>
                        ) : (
                          <div style={{
                            display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px,1fr))",
                            gap: "14px", maxHeight: "560px", overflowY: "auto", padding: "4px"
                          }}>
                            {lotsFiltres.map(lot => (
                              <LotBasketCard key={lot.id} lot={lot} t={t}
                                selected={!!lotsSelectionnes.find(ls => ls.lot.id === lot.id)}
                                onSelect={(l) => {
                                  const dejaSelectionne = !!lotsSelectionnes.find(ls => ls.lot.id === l.id);
                                  if (dejaSelectionne) retirerLot(l.codeLot);
                                  else scannerLot(l.codeLot, poidsTotal);
                                }} />
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {etapeBlanc === "TERMINE" && (
                      <div style={{
                        textAlign: "center", padding: "48px 20px", background: "#f0fdf4",
                        borderRadius: "16px", border: "2px solid #22c55e"
                      }}>
                        <div style={{ fontSize: "56px", marginBottom: "12px" }}>✅</div>
                        <div style={{ fontWeight: 800, fontSize: "20px", marginBottom: "8px", color: "#15803d" }}>
                          {t('lavage.wash_completed')}
                        </div>
                        <div style={{ color: "#64748b", marginBottom: "24px", fontSize: "14px" }}>
                          {lotsSelectionnes.length} {t('lavage.lots_washed_success')}
                        </div>
                        <button onClick={nouveauCycleBlanc} style={{
                          padding: "12px 28px", borderRadius: "10px", border: "none",
                          background: "linear-gradient(135deg,#10b981,#059669)",
                          color: "white", fontWeight: 700, cursor: "pointer", fontSize: "15px"
                        }}>
                          {t('lavage.new_cycle')} →
                        </button>
                      </div>
                    )}
                  </div>
                  <RecapChargement />
                </div>
              </>
            )}

            {/* ═══════════════ MODE INFECTE ═══════════════ */}
            {modeLavage === "INFECTE" && (
              <>
                <MachineCard machine={machineInfecte} mode="INFECTE" />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "20px" }}>
                  <div>
                    {etapeInfecte === "MACHINE" && (
                      <div style={{
                        textAlign: "center", padding: "40px", background: "#f8fafc",
                        borderRadius: "14px", border: "2px dashed #e2e8f0", color: "#94a3b8"
                      }}>
                        <FaSoap size={36} style={{ opacity: 0.3, marginBottom: "12px" }} />
                        <div style={{ fontSize: "14px", fontWeight: 500 }}>{t('lavage.waiting_machine_scan')}</div>
                        <div style={{ fontSize: "12px", marginTop: "4px" }}>
                          {t('lavage.scan_machine_code_instruction')}
                        </div>
                      </div>
                    )}

                    {(etapeInfecte === "SACS" || etapeInfecte === "LAVAGE") && (
                      <div style={{ background: "#f8fafc", borderRadius: "14px", padding: "16px", border: "1px solid #e2e8f0" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                          <div style={{ fontWeight: 700, fontSize: "14px", display: "flex", alignItems: "center", gap: "8px", color: "#dc2626" }}>
                            <FaBiohazard size={14} /> {t('lavage.available_bags')}
                            <span style={{ background: "#fee2e2", padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: 500, color: "#dc2626" }}>
                              {sacsDisponibles.length}
                            </span>
                          </div>
                        </div>

                        {loadingSacs ? (
                          <div style={{ textAlign: "center", padding: "24px", color: "#94a3b8" }}>
                            <FaSpinner style={{ animation: "spin 1s linear infinite" }} /> {t('common.loading')}
                          </div>
                        ) : sacsDisponibles.length === 0 ? (
                          <div style={{ textAlign: "center", padding: "30px", color: "#94a3b8", fontSize: "13px" }}>
                            <FaBoxes size={30} style={{ opacity: 0.2, marginBottom: "8px" }} />
                            <div>{t('lavage.no_bags_available')}</div>
                          </div>
                        ) : (
                          <div style={{
                            display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px,1fr))",
                            gap: "12px", maxHeight: "420px", overflowY: "auto", padding: "4px"
                          }}>
                            {sacsDisponibles.map(sac => {
                              const estSelectionne = sacsSelectionnes.find(s => s.numeroSac === sac.numeroSac);
                              const disabled =
                                !(etapeInfecte === "SACS" || etapeInfecte === "LAVAGE") ||
                                estSelectionne ||
                                cycleTermineInfecte ||
                                cycleEnCours;
                              return (
                                <CarteSacInfecteCreative
                                  key={sac.id}
                                  sac={sac}
                                  selectionne={!!estSelectionne}
                                  disabled={disabled}
                                  onClick={() => {
                                    if (!disabled) scannerSacInfecte(sac.numeroSac);
                                  }}
                                />
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {etapeInfecte === "TERMINE" && cycleTermineInfecte && (
                      <div style={{
                        textAlign: "center", padding: "48px 20px", background: "#f0fdf4",
                        borderRadius: "16px", border: "2px solid #22c55e"
                      }}>
                        <div style={{ fontSize: "56px", marginBottom: "12px" }}>✅</div>
                        <div style={{ fontWeight: 800, fontSize: "20px", marginBottom: "8px", color: "#15803d" }}>
                          {t('lavage.infected_cycle_completed')}
                        </div>
                        <div style={{ color: "#64748b", marginBottom: "24px", fontSize: "14px" }}>
                          {sacsSelectionnes.length} {t('lavage.bags_washed_success')}
                        </div>
                        <button onClick={nouveauCycleInfecte} style={{
                          padding: "12px 28px", borderRadius: "10px", border: "none",
                          background: "linear-gradient(135deg,#10b981,#059669)",
                          color: "white", fontWeight: 700, cursor: "pointer", fontSize: "15px"
                        }}>
                          {t('lavage.new_cycle')} →
                        </button>
                      </div>
                    )}
                  </div>

                  <RecapChargementInfecte
                    sacsSelectionnes={sacsSelectionnes}
                    poidsTotal={totalArticles}
                    onRetirer={retirerSac}
                    onTerminer={etapeInfecte === "SACS" ? lancerCycleInfecte : terminerCycleInfecte}
                    onArreter={arreterCycleInfecte}
                    onNouveauCycle={nouveauCycleInfecte}
                    estTermine={cycleTermineInfecte}
                    estEnLavage={cycleEnCours}
                    tempsEcoule={tempsEcoule}
                  />
                </div>
              </>
            )}
          </>
        )}

        {/* Footer */}
        {agent && (
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #e2e8f0",
            fontSize: "12px", color: "#64748b", flexWrap: "wrap", gap: "8px"
          }}>
            <div style={{ display: "flex", gap: "16px" }}>
              <span>🧺 {t('lavage.lots')} : <strong style={{ color: "#0ea5e9" }}>{lotsSelectionnes.length}</strong></span>
              <span>⚖️ {t('lavage.weight')} : <strong style={{ color: "#0ea5e9" }}>{poidsTotal.toFixed(1)} kg</strong></span>
              {machine && <span>🔧 {t('lavage.machine')} : <strong style={{ color: "#0ea5e9" }}>{machine.code}</strong></span>}
            </div>
            <span style={{
              padding: "2px 10px", borderRadius: "8px",
              background: modeLavage === "INFECTE" ? "#fee2e2" : "#e0f2fe",
              color: modeLavage === "INFECTE" ? "#dc2626" : "#0369a1",
              fontSize: "11px", fontWeight: 700
            }}>
              {getModeLabel()}
            </span>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.6; transform: scale(1.15); }
        }
      `}</style>
    </div>
  );
}

export default function LavageList() {
  return (
    <LavageProvider>
      <LavageInner />
    </LavageProvider>
  );
}