import React, { useState, useRef, useCallback, useEffect } from "react";
import { useModal } from "../../contextes/ModalContext";
import {
  FaUser, FaBed, FaRedo, FaSpinner, FaCheckDouble,
  FaCheck, FaDoorOpen, FaBoxes, FaArrowRight
} from "react-icons/fa";
import { Card, CardContent } from "../../components/ui/card";
import { Badge }             from "../../components/ui/badge";
import ScanInput             from "../../components/utils/shared/ScanInput";
import EtapesStepper         from "../../components/utils/shared/EtapesStepper";
import { cat, apiCall }      from "../collage/collecteUtils";
import "../Linge/WorkflowList.css";

// ─── Variables d'environnement ──────────────────────────────────────────
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

function CarteLit({ lit, actif, onClick }) {
  const complet  = !lit.litVide;
  const infecte  = lit.estInfecte;
  const bg       = actif ? "#ede9fe" : complet ? "#f0fdf4" : infecte ? "#fff5f5" : "#f8fafc";
  const border   = actif ? "#a78bfa" : complet ? "#bbf7d0" : infecte ? "#fca5a5" : "#e2e8f0";
  const nb       = lit.lingesPoses?.length || 0;

  return (
    <div onClick={onClick} style={{
      borderRadius: 13, border: `2px solid ${border}`,
      background: bg, padding: "12px 14px", cursor: "pointer",
      transition: "all .18s",
      boxShadow: actif ? "0 0 0 3px #c4b5fd" : "none",
    }}
    onMouseEnter={e => { if (!actif) e.currentTarget.style.borderColor = "#a78bfa"; }}
    onMouseLeave={e => { if (!actif) e.currentTarget.style.borderColor = border; }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: 8 }}>
        <div style={{ display:"flex", alignItems:"center", gap: 7 }}>
          <FaBed size={13} color={infecte ? "#dc2626" : "#7c3aed"} />
          <span style={{ fontWeight: 800, fontSize: 13, color: infecte ? "#dc2626" : "#1e293b" }}>
            Lit {lit.codeLit}
          </span>
        </div>
        {infecte && <Badge style={{ background:"#fee2e2", color:"#dc2626", fontSize:9 }}>⚠️ Infecté</Badge>}
        {complet  && <Badge style={{ background:"#dcfce7", color:"#15803d", fontSize:9 }}>✅ Fait</Badge>}
        {actif    && <Badge style={{ background:"#ede9fe", color:"#7c3aed", fontSize:9 }}>● Sélectionné</Badge>}
      </div>

      {nb > 0 && (
        <div style={{ display:"flex", flexWrap:"wrap", gap: 4, marginBottom: 4 }}>
          {lit.lingesPoses.map((l, i) => {
            const c = cat(l.categorie);
            return (
              <span key={i} style={{ fontSize: 10, padding:"2px 7px", borderRadius: 20,
                background: c.bg, color: c.color, fontWeight: 600 }}>
                {c.emoji} {l.categorie}
              </span>
            );
          })}
        </div>
      )}
      <div style={{ fontSize: 10, color: "#94a3b8" }}>
        {nb > 0 ? `${nb} linge${nb>1?"s":""} posé${nb>1?"s":""}` : "Lit vide — à équiper"}
      </div>
    </div>
  );
}

function CarteLingeDispo({ linge, onPoser, litActif }) {
  const c = cat(linge.categorie);
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
      padding:"8px 11px", borderRadius: 9,
      background: "#f8fafc", border:"1px solid #e2e8f0" }}>
      <div style={{ display:"flex", alignItems:"center", gap: 8 }}>
        <span style={{ fontSize: 16 }}>{c.emoji}</span>
        <div>
          <div style={{ fontSize:11, fontWeight:600, color:c.color }}>{c.label}</div>
          <code style={{ fontSize:10, color:"#94a3b8" }}>{linge.codeBarre}</code>
        </div>
      </div>
      <button onClick={() => onPoser(linge)} disabled={!litActif}
        title={litActif ? `Poser sur Lit ${litActif.codeLit}` : "Sélectionnez un lit d'abord"}
        style={{ display:"flex", alignItems:"center", gap:5,
          padding:"5px 10px", borderRadius:8, border:"none",
          background: litActif ? "linear-gradient(135deg,#7c3aed,#6d28d9)" : "#e2e8f0",
          color: litActif ? "white" : "#94a3b8",
          fontWeight:700, fontSize:11,
          cursor: litActif ? "pointer" : "not-allowed",
          transition:"all .15s" }}>
        <FaCheck size={9} />
        {litActif ? `→ Lit ${litActif.codeLit}` : "Choisir lit"}
      </button>
    </div>
  );
}

function Resume({ res, onNouvelle, onTerminer }) {
  return (
    <div style={{ background:"#f0fdf4", borderRadius:18, padding:28,
      border:"2px solid #22c55e", textAlign:"center" }}>
      <div style={{ fontSize:44, marginBottom:10 }}>✅</div>
      <div style={{ fontWeight:900, fontSize:18, color:"#15803d", marginBottom:6 }}>
        Chambre {res.codeChambre} équipée
      </div>
      <div style={{ fontSize:13, color:"#64748b", marginBottom:20 }}>
        {res.nbLinges} linge{res.nbLinges>1?"s":""} distribué{res.nbLinges>1?"s":""} sur {res.nbLits} lit{res.nbLits>1?"s":""}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:22 }}>
        {res.litsEquipes?.map((l,i) => (
          <div key={i} style={{ background:"white", borderRadius:10, padding:"9px 12px",
            border:"1px solid #bbf7d0", fontSize:11 }}>
            <div style={{ fontWeight:700, color:"#15803d" }}>🛏️ Lit {l.codeLit}</div>
            <div style={{ color:"#64748b" }}>{l.nb} linge{l.nb>1?"s":""}</div>
          </div>
        ))}
      </div>
      <div style={{ display:"flex", gap:8 }}>
        <button onClick={onNouvelle} style={{ flex:1, padding:"11px", borderRadius:10,
          border:"none", background:"linear-gradient(135deg,#7c3aed,#6d28d9)",
          color:"white", fontWeight:700, fontSize:13, cursor:"pointer" }}>
          <FaArrowRight size={11} style={{ marginRight:6 }}/> Autre chambre
        </button>
        <button onClick={onTerminer} style={{ flex:1, padding:"11px", borderRadius:10,
          border:"1px solid #e2e8f0", background:"white",
          color:"#64748b", fontWeight:600, fontSize:13, cursor:"pointer" }}>
          Terminer
        </button>
      </div>
    </div>
  );
}

export default function DistributionChambre() {
  const { showAlert, showConfirm } = useModal();

  const [etape,    setEtape]    = useState("AGENT");
  const [agent,    setAgent]    = useState(null);
  const [chambre,  setChambre]  = useState(null);  
  const [litActif, setLitActif] = useState(null);  
  const [scanVal,  setScanVal]  = useState("");
  const [loading,  setLoading]  = useState(false);
  const [resume,   setResume]   = useState(null);
  const [poses,    setPoses]    = useState([]);    
  const agentRef  = useRef(null);
  const chambreRef = useRef(null);
  const litRef    = useRef(null);
  useEffect(() => { agentRef.current   = agent;   }, [agent]);
  useEffect(() => { chambreRef.current = chambre; }, [chambre]);
  useEffect(() => { litRef.current     = litActif;}, [litActif]);

  const enregistrerPose = useCallback((linge, lit) => {
    setChambre(p => p ? {
      ...p,
      disponibles: p.disponibles.filter(l => l.lingeId !== linge.lingeId),
      lits: p.lits.map(l => l.litId !== lit.litId ? l : {
        ...l,
        litVide: false,
        lingesPoses: [...(l.lingesPoses||[]), { ...linge }]
      })
    } : p);
    setPoses(p => {
      const ex = p.find(x => x.litId === lit.litId);
      if (ex) return p.map(x => x.litId===lit.litId ? {...x, nb:x.nb+1} : x);
      return [...p, { litId:lit.litId, codeLit:lit.codeLit, nb:1 }];
    });
  }, []);

  const handleAgent = useCallback(async code => {
    setLoading(true);
    try {
      const ag = await fetch(`${API_URL}/api/agents/matricule/${code}`)
                       .then(r => r.ok ? r.json() : null);
      if (!ag) { showAlert("❌ Agent introuvable", code, "error"); return; }
      setAgent({ nom: ag.nom, matricule: ag.matricule });
      setEtape("CHAMBRE");
    } catch(e) { showAlert("❌ " + e.message, "", "error"); }
    finally { setLoading(false); }
  }, [showAlert]);

  const handleChambre = useCallback(async code => {
    setLoading(true);
    try {
      const res = await apiCall("/api/distribution/chambre", {
        codeBarre: code,
        matriculeAgent: agentRef.current.matricule
      }, "GET");
      setChambre({
        chambreId:    res.chambreId,
        codeChambre:  res.codeChambre,
        lits:         res.lits     || [],
        disponibles:  (res.disponibles || []).map(l => ({ ...l, lingeId: l.lingeId || l.id })),
      });
      setLitActif(null); setPoses([]);
      setEtape("DISTRIBUER");
      showAlert("✅ Chambre " + res.codeChambre,
        res.lits?.length + " lit(s) · " + (res.disponibles?.length||0) + " linge(s) disponibles",
        "success");
    } catch(e) { showAlert("❌ " + e.message, "", "error"); }
    finally { setLoading(false); }
  }, [showAlert]);

  const handleScanLinge = useCallback(async code => {
    const lit = litRef.current;
    if (!lit) { showAlert("🛏️ Sélectionnez d'abord un lit", "", "warning"); return; }
    setLoading(true);
    try {
      const c = chambreRef.current;
      const res = await apiCall("/api/distribution/chambre/lit", {
        chambreId:      c.chambreId,
        litId:          lit.litId,
        codeOuTag:      code,
        matriculeAgent: agentRef.current.matricule
      });
      const linge = c.disponibles.find(l => l.codeBarre === code || l.lingeId === res.lingeId)
                 || { lingeId: res.lingeId, codeBarre: res.codeBarre, categorie: res.categorie };
      enregistrerPose(linge, lit);
    } catch(e) { showAlert("❌ " + e.message, code, "error"); }
    finally { setLoading(false); }
  }, [showAlert, enregistrerPose]);

  const handlePoserBouton = useCallback(async linge => {
    const lit = litRef.current;
    if (!lit) { showAlert("🛏️ Sélectionnez un lit", "", "warning"); return; }
    setLoading(true);
    try {
      const c = chambreRef.current;
      await apiCall("/api/distribution/chambre/lit", {
        chambreId:      c.chambreId,
        litId:          lit.litId,
        codeOuTag:      linge.codeBarre,
        matriculeAgent: agentRef.current.matricule
      });
      enregistrerPose(linge, lit);
    } catch(e) { showAlert("❌ " + e.message, "", "error"); }
    finally { setLoading(false); }
  }, [showAlert, enregistrerPose]);

  const handleScan = useCallback(async code => {
    setScanVal("");
    if (etape === "AGENT")     { await handleAgent(code);      return; }
    if (etape === "CHAMBRE")   { await handleChambre(code);    return; }
    if (etape === "DISTRIBUER"){ await handleScanLinge(code);  }
  }, [etape, handleAgent, handleChambre, handleScanLinge]);

  const handleCloturer = useCallback(async () => {
    if (poses.length === 0) {
      showAlert("⚠️ Aucun linge distribué", "Posez au moins un linge.", "warning");
      return;
    }
    const nbTotal = poses.reduce((s,p)=>s+p.nb, 0);
    if (!(await showConfirm("Terminer la distribution",
      `${nbTotal} linge(s) distribués sur ${poses.length} lit(s) ?`, "question"))) return;
    setResume({
      codeChambre: chambre.codeChambre,
      nbLinges: nbTotal,
      nbLits: poses.length,
      litsEquipes: poses
    });
    setEtape("RESUME");
  }, [poses, chambre, showAlert, showConfirm]);

  const reset = () => {
    setAgent(null); setChambre(null); setLitActif(null);
    setPoses([]); setResume(null); setEtape("AGENT"); setScanVal("");
  };

  const ETAPES = [
    { id:"AGENT",     label:"Agent",   done:!!agent   },
    { id:"CHAMBRE",   label:"Chambre", done:!!chambre },
    { id:"DISTRIBUER",label:"Lits",    done:etape==="RESUME" },
  ];

  const PH = etape==="AGENT"   ? "👤 Scanner votre badge..."
           : etape==="CHAMBRE" ? "🚪 Scanner le code chambre..."
           : litActif ? `🏷️ Scanner un linge → Lit ${litActif.codeLit}...`
           : "🛏️ Sélectionnez un lit pour commencer...";

  const BORDER = etape==="AGENT" ? "#e2e8f0"
               : etape==="CHAMBRE" ? "#0d9488"
               : litActif ? "#7c3aed" : "#e2e8f0";

  const nbPoses   = poses.reduce((s,p)=>s+p.nb, 0);
  const nbDispo   = chambre?.disponibles?.length || 0;
  const litsVides = chambre?.lits?.filter(l=>l.litVide).length || 0;

  return (
    <div className="collecte-container">
      <div className="page-header" style={{ marginBottom:0 }}>
        <h1 className="text-3xl font-extrabold" style={{ marginBottom:2 }}>
          🏥 Distribution — Chambre
        </h1>
        <p style={{ color:"#166d7c", fontSize:13, marginBottom:18 }}>
          {agent ? `${agent.nom} · Association linge ↔ lit` : "Scannez votre badge"}
        </p>
      </div>

      <div style={{ display:"grid",
        gridTemplateColumns: etape==="DISTRIBUER" ? "1fr 300px" : "1fr",
        gap:16 }}>

        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>

          {agent && (
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ display:"flex", alignItems:"center", gap:9, padding:"7px 13px",
                borderRadius:10, background:"#f8fafc", border:"1px solid #e2e8f0" }}>
                <FaUser size={12} color="#64748b"/>
                <span style={{ fontWeight:600, fontSize:12 }}>{agent.nom}</span>
                {chambre && <>
                  <span style={{ color:"#e2e8f0" }}>|</span>
                  <FaDoorOpen size={12} color="#0d9488"/>
                  <span style={{ fontWeight:700, fontSize:12, color:"#0d9488" }}>
                    Chambre {chambre.codeChambre}
                  </span>
                  <span style={{ fontSize:10, color:"#94a3b8" }}>
                    {nbPoses} posé{nbPoses>1?"s":""} · {litsVides} lit{litsVides!==1?"s":""} vide{litsVides!==1?"s":""}
                  </span>
                </>}
              </div>
              <button onClick={reset}
                style={{ padding:"6px 11px", border:"1px solid #fca5a5",
                  borderRadius:8, background:"#fff5f5", color:"#dc2626",
                  cursor:"pointer", fontSize:11, fontWeight:600,
                  display:"flex", alignItems:"center", gap:3 }}>
                <FaRedo size={8}/> Reset
              </button>
            </div>
          )}

          <div className="mb-6">
            <EtapesStepper etapes={ETAPES} etapeActive={etape} couleurActive={BORDER} />
          </div>

          {etape !== "RESUME" && (
            <Card style={{ border:`2px dashed ${BORDER}` }}>
              <CardContent className="p-4">
                <ScanInput placeholder={PH} value={scanVal} onChange={setScanVal}
                  onSubmit={handleScan} borderColor={BORDER}
                  keepFocus autoDebounce disabled={loading}/>
                {loading && (
                  <div style={{ marginTop:6, fontSize:11, color:"#64748b",
                    display:"flex", alignItems:"center", gap:5 }}>
                    <FaSpinner style={{ animation:"spin 1s linear infinite"}}/> ...
                  </div>
                )}
                {litActif && (
                  <div style={{ marginTop:7, padding:"5px 11px", background:"#ede9fe",
                    borderRadius:7, fontSize:11, color:"#7c3aed", fontWeight:700 }}>
                    🛏️ Lit actif : {litActif.codeLit} — scannez les linges à y poser
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {etape==="AGENT" && (
            <Card style={{ border:"2px dashed #e2e8f0" }}>
              <CardContent style={{ textAlign:"center", padding:"44px 20px", color:"#94a3b8" }}>
                <FaUser size={36} style={{ opacity:.18, marginBottom:10 }}/>
                <div style={{ fontSize:13, fontWeight:600 }}>Scannez votre badge agent</div>
              </CardContent>
            </Card>
          )}

          {etape==="CHAMBRE" && (
            <Card style={{ border:"2px dashed #ccfbf1", background:"#f0fdfa" }}>
              <CardContent style={{ textAlign:"center", padding:"34px 20px", color:"#0d9488" }}>
                <FaDoorOpen size={32} style={{ opacity:.4, marginBottom:8 }}/>
                <div style={{ fontSize:13, fontWeight:700 }}>Scannez le code de la chambre</div>
                <div style={{ fontSize:11, color:"#64748b", marginTop:3 }}>
                  Plusieurs chambres possibles par tournée
                </div>
              </CardContent>
            </Card>
          )}

          {etape==="DISTRIBUER" && chambre && (
            <>
              <div style={{ padding:"10px 14px", background:"#f5f3ff",
                borderRadius:10, border:"1px solid #c4b5fd",
                fontSize:12, color:"#7c3aed", display:"flex",
                alignItems:"center", gap:10 }}>
                <span style={{ fontSize:22 }}>💡</span>
                <div>
                  <strong>Comment faire :</strong> Cliquez sur un lit pour le sélectionner,
                  puis scannez les linges à poser, ou utilisez le bouton → sur chaque linge.
                </div>
              </div>

              <div style={{ display:"grid",
                gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",
                gap:10 }}>
                {chambre.lits.map(lit => (
                  <CarteLit key={lit.litId} lit={lit}
                    actif={litActif?.litId === lit.litId}
                    onClick={() => {
                      setLitActif(l => l?.litId === lit.litId ? null : lit);
                    }}/>
                ))}
              </div>

              <Card style={{ border:"1px solid #e2e8f0" }}>
                <CardContent className="p-4">
                  <div style={{ marginBottom:10 }}>
                    <div style={{ display:"flex", justifyContent:"space-between",
                      fontSize:11, color:"#64748b", marginBottom:3 }}>
                      <span>Linges distribués</span>
                      <span style={{ fontWeight:700 }}>
                        {nbPoses}/{nbPoses + nbDispo}
                      </span>
                    </div>
                    <div style={{ height:5, background:"#f1f5f9",
                      borderRadius:3, overflow:"hidden" }}>
                      <div style={{
                        width: `${(nbPoses+nbDispo)>0 ? Math.round(nbPoses/(nbPoses+nbDispo)*100):0}%`,
                        height:"100%", background: litsVides===0 ? "#10b981":"#7c3aed",
                        borderRadius:3, transition:"width .3s"
                      }}/>
                    </div>
                  </div>
                  <button onClick={handleCloturer} disabled={loading||nbPoses===0}
                    style={{ width:"100%", padding:11, borderRadius:9, border:"none",
                      background: loading||nbPoses===0 ? "#e2e8f0"
                        : "linear-gradient(135deg,#0d9488,#0f766e)",
                      color: loading||nbPoses===0 ? "#94a3b8" : "white",
                      fontWeight:700, fontSize:13,
                      cursor:loading||nbPoses===0?"not-allowed":"pointer",
                      display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                    {loading
                      ? <FaSpinner style={{ animation:"spin 1s linear infinite" }}/>
                      : <><FaCheckDouble size={11}/>
                          Terminer — {nbPoses} linge{nbPoses>1?"s":""} distribué{nbPoses>1?"s":""}
                        </>}
                  </button>
                </CardContent>
              </Card>
            </>
          )}

          {etape==="RESUME" && resume && (
            <Resume res={resume}
              onNouvelle={() => {
                setChambre(null); setLitActif(null);
                setPoses([]); setResume(null); setEtape("CHAMBRE");
              }}
              onTerminer={reset}/>
          )}

          {agent && (
            <div style={{ paddingTop:7, borderTop:"1px solid #e2e8f0",
              fontSize:10, color:"#94a3b8" }}>
              👤 {agent.nom} · 📍 {etape}
              {litActif && ` · 🛏️ Lit ${litActif.codeLit} actif`}
            </div>
          )}
        </div>

        {etape==="DISTRIBUER" && chambre && (
          <div style={{ position:"sticky", top:20, alignSelf:"start",
            display:"flex", flexDirection:"column", gap:8,
            maxHeight:"calc(100vh - 120px)", overflowY:"auto" }}>

            <div style={{ padding:"10px 13px", background:"#f8fafc",
              borderRadius:10, border:"1px solid #e2e8f0" }}>
              <div style={{ fontWeight:700, fontSize:12, marginBottom:4,
                display:"flex", alignItems:"center", gap:7 }}>
                <FaBoxes size={12} color="#64748b"/>
                Linges disponibles
                <span style={{ background:"#e2e8f0", padding:"1px 7px",
                  borderRadius:20, fontSize:10, fontWeight:500 }}>
                  {chambre.disponibles.length}
                </span>
              </div>
              {litActif
                ? <div style={{ fontSize:10, color:"#7c3aed", fontWeight:600 }}>
                    Cliquez → pour poser sur Lit {litActif.codeLit}
                  </div>
                : <div style={{ fontSize:10, color:"#94a3b8" }}>
                    Sélectionnez un lit pour activer les boutons
                  </div>}
            </div>

            {chambre.disponibles.length === 0 ? (
              <div style={{ textAlign:"center", padding:"24px 12px",
                color:"#94a3b8", fontSize:12 }}>
                <FaBoxes size={28} style={{ opacity:.2, marginBottom:8 }}/>
                <div>Tous les linges ont été distribués</div>
              </div>
            ) : (
              chambre.disponibles.map(l => (
                <CarteLingeDispo key={l.lingeId || l.codeBarre}
                  linge={l} litActif={litActif}
                  onPoser={handlePoserBouton}/>
              ))
            )}

            <div style={{ padding:"9px 12px", background:"#f8fafc",
              borderRadius:9, border:"1px solid #e2e8f0",
              fontSize:10, color:"#94a3b8", lineHeight:1.9 }}>
              🛏️ Cliquer lit = sélectionner<br/>
              🏷️ Scan = poser sur lit actif<br/>
              → Bouton = poser sur lit actif
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}