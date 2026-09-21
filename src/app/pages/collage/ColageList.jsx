import React, { useState, useRef, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useModal } from "../../contextes/ModalContext";
import {
  FaUser, FaTimes, FaBiohazard, FaCheckCircle,
  FaExclamationTriangle, FaSpinner, FaBed, FaRedo,
  FaCheckDouble, FaDoorOpen, FaBuilding, FaBoxes,
} from "react-icons/fa";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import ScanInput   from "../../components/utils/shared/ScanInput";
import MuteButton  from "../../components/utils/MuteButton";
import { cat, ST_COLORS } from "./collecteUtils";
import { useVoiceGuide } from "../../hooks/useVoiceGuide";
import {
  fetchChambreByCode, fetchAgentByCode,
  ouvrirCollecteChambre, scannerLit,
  traiterLitAvecContenant, marquerLingePropre,
  marquerLingeManquant, cloturerCollecte,
  annulerCollecteVide,
} from "../../services/collecte/collecteChambreService";
import { getAgent, isAgentConnected } from "../../services/agentService";
import "../Linge/WorkflowList.css";

// ─── ScanStatus ────────────────────────────────────────────────────────────
function ScanStatus({ loading, success, error, code }) {
  if (loading) return (
    <div style={{ padding:"12px 16px", borderRadius:10, background:"#eff6ff",
      border:"1px solid #93c5fd", display:"flex", alignItems:"center",
      gap:12, marginTop:10 }}>
      <FaSpinner className="animate-spin" color="#3b82f6" size={20}/>
      <div>
        <p style={{ fontWeight:600, color:"#1d4ed8", fontSize:13, margin:0 }}>
          Scan en cours...
        </p>
        <p style={{ fontSize:11, color:"#64748b", margin:0 }}>{code}</p>
      </div>
    </div>
  );
  if (success) return (
    <div style={{ padding:"12px 16px", borderRadius:10, background:"#f0fdf4",
      border:"1px solid #86efac", display:"flex", alignItems:"center",
      gap:12, marginTop:10 }}>
      <FaCheckCircle color="#22c55e" size={20}/>
      <div>
        <p style={{ fontWeight:600, color:"#15803d", fontSize:13, margin:0 }}>
          {success.message}
        </p>
        <p style={{ fontSize:11, color:"#64748b", margin:0 }}>{success.detail}</p>
      </div>
    </div>
  );
  if (error) return (
    <div style={{ padding:"12px 16px", borderRadius:10, background:"#fef2f2",
      border:"1px solid #fca5a5", display:"flex", alignItems:"center",
      gap:12, marginTop:10 }}>
      <FaExclamationTriangle color="#ef4444" size={18}/>
      <div>
        <p style={{ fontWeight:600, color:"#dc2626", fontSize:13, margin:0 }}>Erreur</p>
        <p style={{ fontSize:11, color:"#64748b", margin:0 }}>{error}</p>
      </div>
    </div>
  );
  return null;
}

// ─── DialogueManquant ───────────────────────────────────────────────────────
function DialogueManquant({ linge, onConfirmer, onFermer }) {
  if (!linge) return null;
  const c = cat(linge.categorie);
  return (
    <div data-modal="true" style={{ position:"fixed", inset:0,
      background:"rgba(15,23,42,0.6)", display:"flex",
      alignItems:"center", justifyContent:"center",
      zIndex:9999, backdropFilter:"blur(4px)" }}>
      <div style={{ background:"white", borderRadius:18, padding:24,
        maxWidth:320, width:"92%", boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ display:"flex", justifyContent:"space-between",
          alignItems:"center", marginBottom:14 }}>
          <div style={{ display:"flex", alignItems:"center", gap:9 }}>
            <div style={{ width:34, height:34, borderRadius:"50%",
              background:"#fef3c7", display:"flex",
              alignItems:"center", justifyContent:"center" }}>
              <FaExclamationTriangle size={13} color="#d97706"/>
            </div>
            <span style={{ fontWeight:700, fontSize:13 }}>Linge manquant</span>
          </div>
          <button onClick={onFermer} style={{ background:"#f1f5f9", border:"none",
            borderRadius:"50%", width:28, height:28, cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center" }}>
            <FaTimes size={11} color="#94a3b8"/>
          </button>
        </div>
        <div style={{ padding:"9px 13px", background:c.bg, borderRadius:10,
          marginBottom:14, display:"flex", alignItems:"center", gap:9 }}>
          <span style={{ fontSize:19 }}>{c.emoji}</span>
          <div>
            <div style={{ fontWeight:600, fontSize:12, color:c.color }}>{c.label}</div>
            <code style={{ fontSize:10, color:"#64748b" }}>{linge.codeBarre}</code>
          </div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={onFermer} style={{ flex:1, padding:9, borderRadius:8,
            border:"1px solid #e2e8f0", background:"white", color:"#64748b",
            fontWeight:600, fontSize:12, cursor:"pointer" }}>
            Annuler
          </button>
          <button onClick={() => onConfirmer(linge)} style={{ flex:2, padding:9,
            borderRadius:8, border:"none",
            background:"linear-gradient(135deg,#d97706,#b45309)",
            color:"white", fontWeight:700, fontSize:12, cursor:"pointer" }}>
            Confirmer manquant
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── CarteLit ───────────────────────────────────────────────────────────────
function CarteLit({ lit, onPropre, onManquant }) {
  const traites    = lit.linges.filter(l => l.statut).length;
  const stLit      = lit.statut;
  const totalLinges = lit.linges.length;
  const borderColor = stLit === "BLANC" ? "#86efac"
    : stLit === "INFECTE" ? "#fca5a5" : "#e2e8f0";
  const bgColor = stLit === "BLANC" ? "#f0fdf4"
    : stLit === "INFECTE" ? "#fef2f2" : "white";

  return (
    <div style={{ borderRadius:12, border:`1px solid ${borderColor}`,
      background:bgColor, overflow:"hidden", marginBottom:8 }}>
      <div style={{ padding:"9px 13px", display:"flex",
        justifyContent:"space-between", alignItems:"center",
        borderBottom:`1px solid ${borderColor}`,
        background: stLit ? (stLit === "BLANC" ? "#dcfce7" : "#fee2e2") : "#f8fafc" }}>
        <div style={{ display:"flex", alignItems:"center", gap:7 }}>
          <FaBed size={13} color={stLit === "INFECTE" ? "#dc2626" : "#64748b"}/>
          <span style={{ fontWeight:700, fontSize:12,
            color:stLit === "INFECTE" ? "#dc2626" : "#0f172a" }}>
            Lit {lit.codeLit}
          </span>
          {lit.estInfecte && !stLit && (
            <span style={{ fontSize:9, padding:"1px 7px", borderRadius:20,
              background:"#fee2e2", color:"#dc2626", fontWeight:700 }}>
              ⚠️ Infecté
            </span>
          )}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:5 }}>
          {stLit === "BLANC" && (
            <span style={{ fontSize:9, fontWeight:700, padding:"1px 9px",
              borderRadius:20, background:"#dcfce7", color:"#15803d" }}>
              ✅ Blanc
            </span>
          )}
          {stLit === "INFECTE" && (
            <span style={{ fontSize:9, fontWeight:700, padding:"1px 9px",
              borderRadius:20, background:"#fee2e2", color:"#dc2626" }}>
              🔴 Infecté
            </span>
          )}
          {!stLit && (
            <span style={{ fontSize:10, color:"#94a3b8" }}>
              {traites}/{totalLinges}
            </span>
          )}
        </div>
      </div>
      <div style={{ padding:"5px 7px" }}>
        {lit.linges.map(linge => {
          const c   = cat(linge.categorie);
          const col = ST_COLORS[linge.statut];
          return (
            <div key={linge.lingeId} style={{ display:"flex",
              justifyContent:"space-between", alignItems:"center",
              padding:"5px 9px", borderRadius:7, marginBottom:3,
              background:col?.bg || "#f8fafc",
              border:`1px solid ${col?.b || "#e2e8f0"}` }}>
              <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                <span style={{ fontSize:15 }}>{c.emoji}</span>
                <div>
                  <span style={{ fontSize:11, fontWeight:600, color:c.color }}>
                    {c.label}
                  </span>
                  <code style={{ fontSize:10, color:"#94a3b8", marginLeft:5 }}>
                    {linge.codeBarre}
                  </code>
                </div>
              </div>
              {linge.statut ? (
                <span style={{ fontSize:9, fontWeight:700, padding:"1px 9px",
                  borderRadius:20, background:col?.tag, color:col?.tc }}>
                  {col?.lbl}
                </span>
              ) : (
                !stLit && (
                  <div style={{ display:"flex", gap:3 }}>
                    <button onClick={() => onPropre(linge)} title="Propre"
                      style={{ width:26, height:26, borderRadius:"50%",
                        border:"1.5px solid #bae6fd", background:"#dbeafe",
                        cursor:"pointer", display:"flex",
                        alignItems:"center", justifyContent:"center" }}>
                      <FaCheckCircle size={9} color="#0284c7"/>
                    </button>
                    <button onClick={() => onManquant(linge)} title="Manquant"
                      style={{ width:26, height:26, borderRadius:"50%",
                        border:"1.5px solid #fde68a", background:"#fef3c7",
                        cursor:"pointer", display:"flex",
                        alignItems:"center", justifyContent:"center" }}>
                      <FaExclamationTriangle size={9} color="#d97706"/>
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

// ─── StatutCard ─────────────────────────────────────────────────────────────
function StatutCard({ label, value, icon, color, bg }) {
  return (
    <div style={{ padding:"13px 15px", borderRadius:12, background:bg,
      border:`1px solid ${color}25`, flex:1, minWidth:100 }}>
      <div style={{ display:"flex", alignItems:"center", gap:9 }}>
        <div style={{ width:34, height:34, borderRadius:9,
          background:`${color}15`, display:"flex",
          alignItems:"center", justifyContent:"center", fontSize:17 }}>
          {icon}
        </div>
        <div>
          <p style={{ fontSize:9, fontWeight:600, color:"#94a3b8",
            textTransform:"uppercase", letterSpacing:"0.5px", margin:0 }}>
            {label}
          </p>
          <p style={{ fontSize:21, fontWeight:700, color, margin:0 }}>{value}</p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE PRINCIPALE
// ═══════════════════════════════════════════════════════════════════════════
function ColageListInner() {
  const { t }                      = useTranslation();
  const { showAlert, showConfirm } = useModal();

  // ── Langue IA (indépendante de i18n) ────────────────────────────────────
  const [voiceLang, setVoiceLang] = useState("fr");
  const voice = useVoiceGuide(voiceLang);
const voiceRef = useRef(voice);
useEffect(() => { voiceRef.current = voice; }, [voice]);
  // ── États page ───────────────────────────────────────────────────────────
  const [etape,      setEtape]      = useState("CHAMBRE");
  const [agent,      setAgent]      = useState(null);
  const [collecte,   setCollecte]   = useState(null);
  const [litEnCours, setLitEnCours] = useState(null);
  const [scanVal,    setScanVal]    = useState("");
  const [loading,    setLoading]    = useState(false);
  const [dlgManq,    setDlgManq]    = useState(null);
  const [scanStatus, setScanStatus] = useState(null);

  const agentRef    = useRef(null);
  const collecteRef = useRef(null);
  const scanInputRef = useRef(null);
  const scanTimeoutRef = useRef(null);

  useEffect(() => { agentRef.current    = agent;    }, [agent]);
  useEffect(() => { collecteRef.current = collecte; }, [collecte]);
useEffect(() => {
  return () => {
    // Appelé automatiquement quand le composant est démonté (changement de page)
    voice.cancel();
  };
}, []);
  useEffect(() => {
    const agentData = getAgent();
    if (agentData && isAgentConnected()) {
      setAgent(agentData);
      setEtape("CHAMBRE");
      setTimeout(() => {
        voice.sayBienvenue(agentData.nomPrenom || agentData.nom || "");
      }, 600);
    } else {
      setScanStatus({ loading:false, success:null,
        error:"Aucun agent connecté" });
    }
  }, []); 

  const majLit = useCallback((litId, statut, codes = [], sacInfecteId = null) => {
    setCollecte(p => p ? {
      ...p,
      lits: p.lits.map(l => l.litId !== litId ? l : {
        ...l, statut,
        linges: l.linges.map(lg => ({
          ...lg,
          statut: codes.includes(lg.codeBarre) ? statut : lg.statut,
          sacInfecteId: statut === "INFECTE" && codes.includes(lg.codeBarre)
            ? (sacInfecteId ?? lg.sacInfecteId ?? null)
            : (lg.sacInfecteId ?? null),
        })),
      }),
    } : p);
  }, []);

  const majLinge = useCallback((lingeId, statut) => {
    setCollecte(p => p ? {
      ...p,
      lits: p.lits.map(l => ({
        ...l,
        linges: l.linges.map(lg =>
          lg.lingeId === lingeId ? { ...lg, statut } : lg
        ),
      })),
    } : p);
  }, []);

  // ── 1. Ouvrir chambre ────────────────────────────────────────────────────
  const handleChambre = useCallback(async (code) => {
    if (!agent) {
      showAlert("Agent non connecté", "", "error");
      voice.sayChambreErreur();
      return;
    }
    setLoading(true);
    setScanStatus({ loading:true, code });
    try {
      const ch  = await fetchChambreByCode(code);
      const res = await ouvrirCollecteChambre(
        ch.codeBarre || ch.code || code,
        agent.codeBarre || agent.matricule
      );
      setCollecte({
        id:          res.collecteId,
        codeChambre: res.codeChambre,
        lits:        (res.lits || []).map(l => ({
          ...l,
          statut: l.statut || "",
          linges: (l.linges || []).map(lg => ({
            ...lg,
            sacInfecteId: lg.sacInfecteId ?? null,
          })),
        })),
      });
      setLitEnCours(null);
      setEtape("SCAN");
      setScanStatus({ loading:false,
        success:{ message:`✅ ${res.codeChambre}`,
          detail:`${res.nbLits} lits, ${res.nbLinges} linges` },
        error:null });
      setTimeout(() => setScanStatus(null), 2500);

      const codeChambre = res.codeChambre;
const nbLits      = res.nbLits;
const nbLinges    = res.nbLinges;

voiceRef.current.sayChambreIdentifiee(codeChambre, nbLits, nbLinges);

setTimeout(() => {
  if (!collecteRef.current) return;
  voiceRef.current.sayGuidePropresManquants();
}, 3500);
    } catch(e) {
      setScanStatus({ loading:false, success:null, error:e.message });
      showAlert("❌ Erreur", e.message, "error");
      // ── IA ──
      if (e.message?.toLowerCase().includes("réseau") || e.message?.toLowerCase().includes("network"))
        voice.sayErreurReseau();
      else
        voice.sayChambreErreur();
    } finally { setLoading(false); }
  }, [agent, showAlert, voice]);

  // ── 2. Scanner lit ───────────────────────────────────────────────────────
  const handleScannerLit = useCallback(async (litId) => {
    if (!collecte) return;
    setLoading(true);
    setScanStatus({ loading:true, code:`lit-${litId}` });
    try {
      const res = await scannerLit(collecte.id, litId);
      setLitEnCours({ litId:res.litId, codeLit:res.codeLit,
        estInfecte:res.estInfecte, nbLinges:res.nbLinges,
        actionSuivante:res.actionSuivante });
      setScanStatus({ loading:false,
        success:{ message: res.estInfecte
          ? `🔴 Lit ${res.codeLit} — infecté`
          : `🟢 Lit ${res.codeLit} — normal`,
          detail: res.estInfecte
            ? "Scannez le sac rouge"
            : "Scannez le bac blanc" },
        error:null });
      setTimeout(() => setScanStatus(null), 2500);

      // ── IA ──
      if (res.estInfecte)
        voice.sayLitInfecte(res.codeLit, res.nbLinges);
      else
        voice.sayLitNormal(res.codeLit, res.nbLinges);

    } catch(e) {
      setScanStatus({ loading:false, success:null, error:e.message });
      showAlert("❌ Erreur", e.message, "error");
      voice.sayErreurGenerique(e.message);
    } finally { setLoading(false); }
  }, [collecte, showAlert, voice]);

  // ── 3. Traiter contenant ─────────────────────────────────────────────────
  const handleTraiterContenant = useCallback(async (codeContenant) => {
    if (!collecte || !litEnCours) return;
    setLoading(true);
    setScanStatus({ loading:true, code:codeContenant });
    try {
      const res = await traiterLitAvecContenant(
        collecte.id, litEnCours.litId, codeContenant);
      const estInfecte = res.typeContenant === "SAC_INFECTE";
      const statut     = estInfecte ? "INFECTE" : "BLANC";
      const sacId      = res.sacInfecteId ?? res.sacInfecte?.id ?? null;
      majLit(litEnCours.litId, statut, res.codes || [], sacId);
      const codeLit = litEnCours.codeLit;
      setLitEnCours(null);
      setScanStatus({ loading:false,
        success:{ message: estInfecte
          ? `🔴 Sac traité`
          : `✅ Bac traité`,
          detail:`${res.nbTraites} linges · Lit ${codeLit}` },
        error:null });
      setTimeout(() => setScanStatus(null), 2500);

      // ── IA ──
      if (estInfecte)
        voice.saySacInfecteOk(res.nbTraites, codeContenant);
      else
        voice.sayBacBlancOk(res.nbTraites, codeContenant);

      // Vérifier si tous les lits sont traités
      const litsRestants = collecteRef.current?.lits?.filter(l => !l.statut).length ?? 0;
      if (litsRestants === 0)
        setTimeout(() => voice.sayTousLitsTraites(), 1500);
      else
        setTimeout(() => voice.sayLitsRestants(litsRestants), 1500);

    } catch(e) {
      setScanStatus({ loading:false, success:null, error:e.message });
      showAlert("❌ Erreur", e.message, "error");
      voice.sayContenantErreur(e.message);
    } finally { setLoading(false); }
  }, [collecte, litEnCours, majLit, showAlert, voice]);

  // ── 4. Propre ────────────────────────────────────────────────────────────
  const handlePropre = useCallback(async (linge) => {
    setLoading(true);
    try {
      await marquerLingePropre(collecteRef.current?.id, linge.codeBarre);
      majLinge(linge.lingeId, "PROPRE");
      showAlert("🔵 Propre", linge.codeBarre, "info");
      voice.sayLingePropre();
    } catch(e) {
      showAlert("❌ Erreur", e.message, "error");
      voice.sayErreurGenerique(e.message);
    } finally { setLoading(false); }
  }, [majLinge, showAlert, voice]);

  // ── 5. Manquant ──────────────────────────────────────────────────────────
  const handleManquant = useCallback(async (linge) => {
    setDlgManq(null);
    setLoading(true);
    try {
      await marquerLingeManquant(collecteRef.current?.id, linge.lingeId);
      majLinge(linge.lingeId, "MANQUANT");
      showAlert("⚠️ Manquant", linge.codeBarre, "warning");
      voice.sayLingeManquant();
    } catch(e) {
      showAlert("❌ Erreur", e.message, "error");
      voice.sayErreurGenerique(e.message);
    } finally { setLoading(false); }
  }, [majLinge, showAlert, voice]);

  // ── 6. Clôturer ──────────────────────────────────────────────────────────
  const handleCloturer = useCallback(async () => {
    if (!collecte) return;
    const nonTr = collecte?.lits?.filter(l => !l.statut) || [];
    if (nonTr.length > 0) {
      voice.sayClotureRestants(nonTr.length);
      const ok = await showConfirm("Lits non traités",
        `${nonTr.length} lit(s) non traité(s). Clôturer quand même ?`, "question");
      if (!ok) return;
    }
    setLoading(true);
    try {
      const res = await cloturerCollecte(collecte.id);

      if (res.annulee) {
        showAlert("ℹ️ Collecte annulée",
          res.message || "Aucun linge collecté.", "info");
        setCollecte(null);
        setLitEnCours(null);
        setEtape("CHAMBRE");
        return;
      }

      showAlert("✅ Collecte clôturée",
        `${collecte.codeChambre} — ${res.nbBlancs||0}B ${res.nbInfectes||0}I ${res.nbPropres||0}P`,
        "success");

      // ── IA ──
      voice.sayClotureOk(
        collecte.codeChambre,
        res.nbBlancs    || 0,
        res.nbInfectes  || 0,
        res.nbPropres   || 0,
        res.nbManquants || 0
      );

      setCollecte(null);
      setLitEnCours(null);
      setEtape("CHAMBRE");
      setScanStatus({ loading:false,
        success:{ message:"✅ Collecte clôturée",
          detail:`${collecte.codeChambre}` }, error:null });
      setTimeout(() => setScanStatus(null), 3000);
    } catch(e) {
      showAlert("❌ Erreur", e.message, "error");
      voice.sayClotureErreur();
    } finally { setLoading(false); }
  }, [collecte, showAlert, showConfirm, voice]);

  // ── Dispatcher scan ──────────────────────────────────────────────────────
  const handleScan = useCallback(async (code) => {
    if (!code) return;
    if (etape === "CHAMBRE") { await handleChambre(code); return; }
    if (etape === "SCAN") {
      if (litEnCours) { await handleTraiterContenant(code); return; }
      const lit = collecteRef.current?.lits?.find(
        l => l.codeLit === code || String(l.litId) === code);
      if (lit && !lit.statut) { await handleScannerLit(lit.litId); return; }
      try {
        const ag = await fetchAgentByCode(code);
        if (ag && collecte) { await handleCloturer(); return; }
      } catch {}
      showAlert("❌ Code non reconnu", "Scannez un lit, un bac ou votre badge.", "error");
      voice.sayCodeNonReconnu();
    }
  }, [etape, collecte, litEnCours, handleChambre, handleScannerLit,
      handleTraiterContenant, handleCloturer, showAlert, voice]);

  // ── Calculs affichage (utilisés aussi par reset) ────────────────────────
  const totalLits   = collecte?.lits?.length || 0;
  const traites     = collecte?.lits?.filter(l => l.statut).length || 0;
  const nonTraites  = totalLits - traites;
  const nbBlancs    = collecte?.lits?.filter(l => l.statut === "BLANC").length || 0;
  const nbInfectes  = collecte?.lits?.filter(l => l.statut === "INFECTE").length || 0;

  const reset = async () => {
    voice.cancel();
    if (collecte && traites === 0) {
      try {
        await annulerCollecteVide(collecte.id);
      } catch {}
    }
    setAgent(null); setCollecte(null); setLitEnCours(null);
    setEtape("CHAMBRE"); setScanVal(""); setScanStatus(null);
  };

  // ── Auto-scan debounce ───────────────────────────────────────────────────
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
    const keep = () => {
      if (scanInputRef.current && !document.querySelector('[data-modal="true"]'))
        scanInputRef.current.focus();
    };
    const id = setInterval(keep, 500);
    keep();
    return () => clearInterval(id);
  }, []);

  const getPlaceholder = () => {
    if (!agent)    return "👤 Aucun agent connecté";
    if (!collecte) return "🏢 Scannez le code de la chambre...";
    if (litEnCours) return litEnCours.actionSuivante === "SCANNER_SAC_INFECTE"
      ? `🔴 Scanner le sac rouge — Lit ${litEnCours.codeLit}...`
      : `📦 Scanner le bac blanc — Lit ${litEnCours.codeLit}...`;
    return "🛏️ Scanner un lit ou votre badge pour clôturer...";
  };

  const borderColor = !agent ? "#e2e8f0"
    : litEnCours?.actionSuivante === "SCANNER_SAC_INFECTE" ? "#dc2626"
    : "#7c3aed";

  return (
    <div className="collecte-container">
      <DialogueManquant linge={dlgManq}
        onConfirmer={handleManquant}
        onFermer={() => setDlgManq(null)}/>

      {/* En-tête */}
      <div style={{ marginBottom:28 }}>
        <div style={{ display:"flex", alignItems:"center",
          justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ width:52, height:52, borderRadius:16,
              background:"linear-gradient(135deg,#7c3aed,#6d28d9)",
              display:"flex", alignItems:"center", justifyContent:"center",
              boxShadow:"0 6px 20px rgba(124,58,237,0.3)" }}>
              <FaDoorOpen size={24} color="white"/>
            </div>
            <div>
              <h1 style={{ fontSize:26, fontWeight:800, color:"#0f172a", margin:0 }}>
                Collecte Chambre
              </h1>
              <p style={{ fontSize:13, color:"#64748b", margin:"2px 0 0 0" }}>
                {agent ? agent.nomPrenom || agent.nom : "Aucun agent connecté"}
              </p>
            </div>
          </div>

          {/* Bouton mute + switch langue */}
          <MuteButton
            muted={voice.muted}
            onToggle={voice.toggleMute}
            speaking={voice.speaking}
            lang={voiceLang}
            onLangChange={setVoiceLang}
          />
        </div>
      </div>

      <div style={{ background:"white", borderRadius:20, padding:28,
        border:"1px solid #e2e8f0", boxShadow:"0 4px 20px rgba(0,0,0,0.06)" }}>

        {/* Barre agent + chambre + reset */}
        <div style={{ display:"flex", justifyContent:"space-between",
          alignItems:"center", marginBottom:18, flexWrap:"wrap", gap:10 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
            {agent && (
              <div style={{ display:"flex", alignItems:"center", gap:9,
                padding:"7px 16px", background:"#faf5ff", borderRadius:11,
                border:"1px solid #e9d5ff" }}>
                <FaUser color="#7c3aed" size={15}/>
                <span style={{ fontWeight:700, color:"#7c3aed", fontSize:13 }}>
                  {agent.nomPrenom || agent.nom}
                </span>
                <Badge style={{ background:"#ede9fe", color:"#7c3aed",
                  fontSize:10, padding:"1px 9px", borderRadius:20 }}>
                  {agent.codeBarre || agent.matricule}
                </Badge>
              </div>
            )}
            {collecte && (
              <div style={{ display:"flex", alignItems:"center", gap:9,
                padding:"7px 16px", background:"#f0f9ff", borderRadius:11,
                border:"1px solid #bae6fd" }}>
                <FaBuilding color="#0284c7" size={15}/>
                <span style={{ fontWeight:700, color:"#0284c7", fontSize:13 }}>
                  {collecte.codeChambre}
                </span>
                <Badge style={{ background:"#e0f2fe", color:"#0284c7",
                  fontSize:10, padding:"1px 9px", borderRadius:20 }}>
                  {totalLits} lits
                </Badge>
              </div>
            )}
          </div>
          {etape !== "CHAMBRE" && (
            <Button variant="outline" size="sm" onClick={reset}
              style={{ fontSize:12, borderColor:"#fca5a5",
                color:"#dc2626", borderRadius:9, padding:"5px 13px" }}>
              <FaRedo size={9} style={{ marginRight:5 }}/> Reset
            </Button>
          )}
        </div>

        {/* Zone scan */}
        <Card style={{ marginBottom:16, border:`2px dashed ${borderColor}`,
          borderRadius:14 }}>
          <CardContent className="p-5">
            <ScanInput ref={scanInputRef}
              placeholder={getPlaceholder()}
              value={scanVal} onChange={setScanVal}
              onSubmit={handleScan}
              borderColor={borderColor}
              keepFocus autoDebounce
              disabled={loading || !agent}/>
            {etape === "SCAN" && collecte && (
              <div style={{ marginTop:7, padding:"5px 13px", borderRadius:8,
                background:"#fef3c7", border:"1px solid #fcd34d",
                fontSize:11, color:"#92400e",
                display:"flex", alignItems:"center", gap:7 }}>
                <FaUser size={11}/>
                💡 Scannez votre badge pour clôturer la collecte
              </div>
            )}
            {scanStatus && <ScanStatus {...scanStatus}/>}
          </CardContent>
        </Card>

        {/* Lit en cours */}
        {litEnCours && etape === "SCAN" && (
          <Card style={{ marginBottom:14, borderRadius:11,
            background: litEnCours.actionSuivante === "SCANNER_SAC_INFECTE"
              ? "#fef2f2" : "#f0fdf4",
            border:`2px solid ${litEnCours.actionSuivante === "SCANNER_SAC_INFECTE"
              ? "#fca5a5" : "#bbf7d0"}` }}>
            <CardContent className="p-4">
              <div style={{ display:"flex", justifyContent:"space-between",
                alignItems:"center", flexWrap:"wrap", gap:9 }}>
                <div style={{ display:"flex", alignItems:"center", gap:11 }}>
                  <div style={{ width:38, height:38, borderRadius:"50%",
                    background: litEnCours.actionSuivante === "SCANNER_SAC_INFECTE"
                      ? "#fee2e2" : "#dcfce7",
                    display:"flex", alignItems:"center",
                    justifyContent:"center", fontSize:18 }}>
                    {litEnCours.actionSuivante === "SCANNER_SAC_INFECTE" ? "🔴" : "🟢"}
                  </div>
                  <div>
                    <div style={{ fontWeight:700, fontSize:13,
                      color: litEnCours.actionSuivante === "SCANNER_SAC_INFECTE"
                        ? "#dc2626" : "#15803d" }}>
                      Lit {litEnCours.codeLit}
                      {litEnCours.actionSuivante === "SCANNER_SAC_INFECTE"
                        ? " — ⚠️ Infecté" : " — Normal"}
                    </div>
                    <div style={{ fontSize:11, color:"#64748b" }}>
                      {litEnCours.actionSuivante === "SCANNER_SAC_INFECTE"
                        ? "Scannez le sac rouge" : "Scannez le bac blanc"}
                    </div>
                  </div>
                </div>
                <button onClick={() => setLitEnCours(null)}
                  style={{ padding:"4px 13px", borderRadius:8,
                    border:"1px solid #e2e8f0", background:"white",
                    color:"#64748b", cursor:"pointer", fontSize:12 }}>
                  Annuler
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* État vide agent */}
        {!agent && (
          <Card style={{ background:"#fef2f2", border:"1px solid #fca5a5",
            marginBottom:14, borderRadius:11 }}>
            <CardContent className="p-4">
              <div style={{ display:"flex", alignItems:"center", gap:9, fontSize:12 }}>
                <FaExclamationTriangle color="#dc2626" size={15}/>
                <span style={{ fontWeight:600, color:"#dc2626" }}>
                  Aucun agent connecté —
                </span>
                <span style={{ color:"#64748b" }}>Connectez-vous pour démarrer</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* État vide chambre */}
        {agent && !collecte && (
          <Card style={{ background:"#faf5ff", border:"1px solid #e9d5ff",
            marginBottom:14, borderRadius:11 }}>
            <CardContent className="p-4">
              <div style={{ display:"flex", alignItems:"center", gap:9, fontSize:12 }}>
                <FaBuilding color="#7c3aed" size={15}/>
                <span style={{ fontWeight:600, color:"#7c3aed" }}>
                  Scannez le code de la chambre
                </span>
                <span style={{ color:"#64748b" }}>pour démarrer la collecte</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats + liste lits */}
        {etape === "SCAN" && collecte && (
          <>
            <div style={{ display:"grid",
              gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",
              gap:10, marginBottom:18 }}>
              <StatutCard label="Total"    value={totalLits}  icon="📊" color="#0ea5e9" bg="#f0f9ff"/>
              <StatutCard label="Blancs"   value={nbBlancs}   icon="✅" color="#15803d" bg="#f0fdf4"/>
              <StatutCard label="Infectés" value={nbInfectes} icon="🔴" color="#dc2626" bg="#fef2f2"/>
              <StatutCard label="Restants" value={nonTraites} icon="⏳" color="#f59e0b" bg="#fffbeb"/>
            </div>

            <div style={{ paddingTop:14, borderTop:"1px solid #e2e8f0" }}>
              <div style={{ fontWeight:600, fontSize:12, color:"#64748b",
                marginBottom:8, display:"flex", justifyContent:"space-between" }}>
                <span>🛏️ Lits ({totalLits})</span>
                <span style={{ color:"#7c3aed" }}>{traites} traités</span>
              </div>
              <div style={{ maxHeight:260, overflowY:"auto" }}>
                {collecte.lits.map(lit => (
                  <CarteLit key={lit.litId} lit={lit}
                    onPropre={handlePropre}
                    onManquant={l => setDlgManq(l)}/>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}

export default function ColageList() {
  return <ColageListInner/>;
}