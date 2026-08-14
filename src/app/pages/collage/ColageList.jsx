/**
 * ColageList — Collecte CHAMBRE
 * Backend : CollecteChambreController → /api/collecte/chambre/*
 * Flux : scan chambre → lits + linges
 *        scan lit → scan bac → tous les linges du lit associés
 *        bouton PROPRE individuel · bouton MANQUANT dialogue
 */
import React, { useState, useRef, useCallback, useEffect } from "react";
import { useModal } from "../../contextes/ModalContext";
import {
  FaUser, FaTimes, FaBiohazard, FaCheckCircle,
  FaExclamationTriangle, FaSpinner, FaBox, FaBed, FaRedo, FaCheckDouble
} from "react-icons/fa";
import { Card, CardContent } from "../../components/ui/card";
import { Badge }             from "../../components/ui/badge";
import ScanInput             from "../../components/utils/shared/ScanInput";
import EtapesStepper         from "../../components/utils/shared/EtapesStepper";
import { cat, ST_COLORS, apiCall } from "./collecteUtils";
import "../Linge/WorkflowList.css";

// ─── Dialogue manquant ────────────────────────────────────────────
function DialogueManquant({ linge, onConfirmer, onFermer }) {
  if (!linge) return null;
  const c = cat(linge.categorie);
  return (
    <div data-modal="true" style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",
      display:"flex",alignItems:"center",justifyContent:"center",
      zIndex:9999,backdropFilter:"blur(5px)" }}>
      <div style={{ background:"white",borderRadius:"20px",padding:"22px",
        maxWidth:"340px",width:"95%",boxShadow:"0 24px 80px rgba(0,0,0,0.25)" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px" }}>
          <div style={{ display:"flex",alignItems:"center",gap:"9px" }}>
            <div style={{ width:"36px",height:"36px",borderRadius:"50%",background:"#fef3c7",
              display:"flex",alignItems:"center",justifyContent:"center" }}>
              <FaExclamationTriangle size={16} color="#d97706"/>
            </div>
            <div style={{ fontWeight:800,fontSize:"13px" }}>Linge introuvable</div>
          </div>
          <button onClick={onFermer} style={{ background:"#f1f5f9",border:"none",borderRadius:"50%",
            width:"28px",height:"28px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>
            <FaTimes size={10} color="#64748b"/>
          </button>
        </div>
        <div style={{ padding:"8px 11px",background:c.bg,borderRadius:"9px",
          marginBottom:"14px",display:"flex",alignItems:"center",gap:"8px" }}>
          <span style={{ fontSize:"20px" }}>{c.emoji}</span>
          <div>
            <div style={{ fontWeight:700,fontSize:"12px",color:c.color }}>{c.label}</div>
            <code style={{ fontSize:"10px",color:"#64748b" }}>{linge.codeBarre}</code>
          </div>
        </div>
        <div style={{ display:"flex",gap:"7px" }}>
          <button onClick={onFermer} style={{ flex:1,padding:"9px",borderRadius:"8px",
            border:"1px solid #e2e8f0",background:"white",color:"#64748b",
            fontWeight:600,fontSize:"11px",cursor:"pointer" }}>Annuler</button>
          <button onClick={()=>onConfirmer(linge)} style={{ flex:2,padding:"9px",borderRadius:"8px",
            border:"none",background:"linear-gradient(135deg,#d97706,#b45309)",
            color:"white",fontWeight:700,fontSize:"11px",cursor:"pointer" }}>
            ⚠️ Confirmer manquant
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Carte lit ────────────────────────────────────────────────────
function CarteLit({ lit, onPropre, onManquant }) {
  const traites = lit.linges.filter(l=>l.statut).length;
  const stLit   = lit.statut;
  const fondC   = stLit==="BLANC"?"#f0fdf4":stLit==="INFECTE"?"#fff5f5":"white";
  const bordC   = stLit==="BLANC"?"#bbf7d0":stLit==="INFECTE"?"#fca5a5":"#e2e8f0";
  return (
    <div style={{ borderRadius:"13px",border:`1.5px solid ${bordC}`,
      background:fondC,overflow:"hidden" }}>
      <div style={{ padding:"8px 12px",display:"flex",justifyContent:"space-between",
        alignItems:"center",borderBottom:`1px solid ${bordC}`,
        background:lit.estInfecte?"#fff0f0":"#f8fafc" }}>
        <div style={{ display:"flex",alignItems:"center",gap:"7px" }}>
          <FaBed size={12} color={lit.estInfecte?"#dc2626":"#64748b"}/>
          <span style={{ fontWeight:700,fontSize:"12px",color:lit.estInfecte?"#dc2626":"#1e293b" }}>
            Lit {lit.codeLit}
          </span>
          {lit.estInfecte&&<Badge style={{ background:"#fee2e2",color:"#dc2626",fontSize:"9px" }}>⚠️ Infecté</Badge>}
        </div>
        <div style={{ display:"flex",alignItems:"center",gap:"5px" }}>
          {stLit==="BLANC"&&<Badge style={{ background:"#dcfce7",color:"#15803d",fontSize:"9px" }}>✅ Bac blanc</Badge>}
          {stLit==="INFECTE"&&<Badge style={{ background:"#fee2e2",color:"#dc2626",fontSize:"9px" }}>🔴 Bac rouge</Badge>}
          {!stLit&&<span style={{ fontSize:"10px",color:"#94a3b8" }}>{traites}/{lit.linges.length}</span>}
        </div>
      </div>
      <div style={{ padding:"6px 8px",display:"flex",flexDirection:"column",gap:"4px" }}>
        {lit.linges.map(linge => {
          const c = cat(linge.categorie);
          const col = ST_COLORS[linge.statut];
          return (
            <div key={linge.lingeId} style={{ display:"flex",justifyContent:"space-between",
              alignItems:"center",padding:"5px 9px",borderRadius:"8px",
              background:col?.bg||"#f8fafc",border:`1px solid ${col?.b||"#e2e8f0"}` }}>
              <div style={{ display:"flex",alignItems:"center",gap:"7px" }}>
                <span style={{ fontSize:"15px" }}>{c.emoji}</span>
                <div>
                  <div style={{ fontSize:"11px",fontWeight:600,color:c.color }}>{c.label}</div>
                  <code style={{ fontSize:"10px",color:"#94a3b8" }}>{linge.codeBarre}</code>
                </div>
              </div>
              {linge.statut ? (
                <span style={{ fontSize:"9px",fontWeight:700,padding:"2px 6px",borderRadius:"5px",
                  background:col?.tag,color:col?.tc }}>{col?.lbl}</span>
              ) : !stLit && (
                <div style={{ display:"flex",gap:"3px" }}>
                  <button onClick={()=>onPropre(linge)} title="Propre"
                    style={{ width:"24px",height:"24px",borderRadius:"50%",border:"1px solid #bae6fd",
                      background:"#dbeafe",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>
                    <FaCheckCircle size={8} color="#0284c7"/>
                  </button>
                  <button onClick={()=>onManquant(linge)} title="Manquant"
                    style={{ width:"24px",height:"24px",borderRadius:"50%",border:"1px solid #fde68a",
                      background:"#fef3c7",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>
                    <FaExclamationTriangle size={8} color="#d97706"/>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Résumé ───────────────────────────────────────────────────────
function ResumeCloture({ res, onNouvelle, onTerminer }) {
  return (
    <Card style={{ border:"2px solid #22c55e",background:"#f0fdf4" }}>
      <CardContent className="p-4">
        <div style={{ fontWeight:800,fontSize:"15px",color:"#15803d",textAlign:"center",marginBottom:"12px" }}>
          ✅ Chambre {res.codeChambre} clôturée
        </div>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"6px",marginBottom:"12px" }}>
          {[["Blancs",res.nbBlancs,"#dcfce7","#15803d"],["Infectés",res.nbInfectes,"#fee2e2","#dc2626"],
            ["Propres",res.nbPropres,"#dbeafe","#0284c7"],["Manq.",res.nbManquants,"#fef3c7","#d97706"],
          ].map(([l,v,bg,co])=>(
            <div key={l} style={{ background:bg,borderRadius:"9px",padding:"8px 4px",textAlign:"center" }}>
              <div style={{ fontSize:"18px",fontWeight:900,color:co }}>{v||0}</div>
              <div style={{ fontSize:"9px",color:co,fontWeight:600 }}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{ display:"flex",gap:"8px" }}>
          <button onClick={onNouvelle} style={{ flex:1,padding:"10px",borderRadius:"9px",border:"none",
            background:"linear-gradient(135deg,#0ea5e9,#0284c7)",color:"white",
            fontWeight:700,fontSize:"12px",cursor:"pointer" }}>+ Chambre suivante</button>
          <button onClick={onTerminer} style={{ flex:1,padding:"10px",borderRadius:"9px",
            border:"1px solid #e2e8f0",background:"white",color:"#64748b",
            fontWeight:600,fontSize:"12px",cursor:"pointer" }}>Terminer</button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────
export default function ColageList() {
  const { showAlert, showConfirm } = useModal();
  const [etape,   setEtape]   = useState("AGENT");
  const [agent,   setAgent]   = useState(null);
  const [collecte,setCollecte]= useState(null);
  const [litEnCours,setLitEnCours] = useState(null);
  const [scanVal, setScanVal] = useState("");
  const [loading, setLoading] = useState(false);
  const [resume,  setResume]  = useState(null);
  const [dlgManq, setDlgManq] = useState(null);

  const agentRef    = useRef(null);
  const collecteRef = useRef(null);
  useEffect(()=>{ agentRef.current    = agent;    },[agent]);
  useEffect(()=>{ collecteRef.current = collecte; },[collecte]);

  const majLit = useCallback((litId, statut) => {
    setCollecte(p => p ? { ...p, lits: p.lits.map(l =>
      l.litId!==litId ? l : { ...l, statut,
        linges: l.linges.map(lg => lg.statut?lg:{...lg,statut}) }
    )} : p);
  }, []);

  const majLinge = useCallback((lingeId, statut) => {
    setCollecte(p => p ? { ...p, lits: p.lits.map(l => ({
      ...l, linges: l.linges.map(lg => lg.lingeId===lingeId?{...lg,statut}:lg)
    }))} : p);
  }, []);

  const handleAgent = useCallback(async code => {
    setLoading(true);
    try {
      const ag = await fetch(`http://localhost:8082/api/agents/matricule/${code}`).then(r=>r.ok?r.json():null);
      if (!ag){showAlert("❌ Agent introuvable",code,"error");return;}
      setAgent({nom:ag.nom,matricule:ag.matricule});
      setEtape("CHAMBRE"); showAlert("✅ "+ag.nom,"Scannez une chambre","success");
    } catch(e){showAlert("❌ "+e.message,"","error");} finally{setLoading(false);}
  },[showAlert]);

  const handleChambre = useCallback(async code => {
    setLoading(true);
    try {
      // Chercher la chambre SQL Server par code-barres
   const ch = await fetch(
  `http://localhost:8082/api/sqlserver/chambres/code/{code}?code=${code}`
)
.then(r => r.ok ? r.json() : null);
      if (!ch){showAlert("❌ Chambre introuvable",code,"error");return;}
      const res = await apiCall("/api/collecte/chambre/ouvrir",{
        codeBarre:ch.codeBarre||code, matriculeAgent:agentRef.current.matricule });
      setCollecte({ id:res.collecteId, codeChambre:res.codeChambre,
        lits:(res.lits||[]).map(l=>({...l,statut:""})) });
      setResume(null); setLitEnCours(null); setEtape("SCAN");
      showAlert("✅ Chambre "+res.codeChambre, res.nbLits+" lit(s) — "+res.nbLinges+" linge(s)","success");
    } catch(e){showAlert("❌ "+e.message,"","error");} finally{setLoading(false);}
  },[showAlert]);

  const handleScanLit = useCallback(code => {
    const lit = collecteRef.current?.lits?.find(l=>l.codeLit===code||String(l.litId)===code);
    if (!lit){showAlert("❌ Lit introuvable",code,"error");return;}
    if (lit.statut){showAlert("ℹ️ Lit déjà traité",lit.codeLit,"info");return;}
    setLitEnCours(lit);
    showAlert("🛏️ Lit "+lit.codeLit, lit.estInfecte?"⚠️ Infecté — scannez bac rouge":"Scannez le bac",
      lit.estInfecte?"warning":"success");
  },[showAlert]);

  const handleScanBac = useCallback(async code => {
    if (!litEnCours) return;
    setLoading(true);
    try {
      const res = await apiCall(`/api/collecte/chambre/${collecteRef.current?.id}/lit`,{
        litId:litEnCours.litId, codeBac:code });
      majLit(litEnCours.litId, res.typeBac==="INFECTE"?"INFECTE":"BLANC");
      setLitEnCours(null);
      showAlert(res.typeBac==="INFECTE"?`🔴 ${res.nbTraites} linge(s) → bac rouge`
        :`✅ ${res.nbTraites} linge(s) → bac blanc`, "Lit "+litEnCours.codeLit,"success");
    } catch(e){showAlert("❌ "+e.message,"","error");} finally{setLoading(false);}
  },[litEnCours,showAlert,majLit]);

  const handlePropre = useCallback(async linge => {
    setLoading(true);
    try {
      await apiCall(`/api/collecte/chambre/${collecteRef.current?.id}/propre`,{codeOuTag:linge.codeBarre});
      majLinge(linge.lingeId,"PROPRE"); showAlert("🔵 Propre",linge.codeBarre+" — laissé en place","info");
    } catch(e){showAlert("❌ "+e.message,"","error");} finally{setLoading(false);}
  },[showAlert,majLinge]);

  const handleManquant = useCallback(async linge => {
    setDlgManq(null); setLoading(true);
    try {
      await apiCall(`/api/collecte/chambre/${collecteRef.current?.id}/manquant`,{lingeId:linge.lingeId});
      majLinge(linge.lingeId,"MANQUANT"); showAlert("⚠️ Manquant",linge.codeBarre,"warning");
    } catch(e){showAlert("❌ "+e.message,"","error");} finally{setLoading(false);}
  },[showAlert,majLinge]);

  const handleCloturer = useCallback(async () => {
    const nonTr = collecte?.lits?.filter(l=>!l.statut)||[];
    if (nonTr.length>0) {
      const ok = await showConfirm("Lits non traités",
        `${nonTr.length} lit(s) non traité(s). Clôturer ?`,"question");
      if (!ok) return;
    }
    setLoading(true);
    try {
      const res = await apiCall(`/api/collecte/chambre/${collecte.id}/cloturer`);
      setResume({...res,codeChambre:collecte.codeChambre});
      setLitEnCours(null); setEtape("RESUME");
    } catch(e){showAlert("❌ "+e.message,"","error");} finally{setLoading(false);}
  },[collecte,showAlert,showConfirm]);

  const handleScan = useCallback(async code => {
    setScanVal("");
    if (etape==="AGENT")   { await handleAgent(code);   return; }
    if (etape==="CHAMBRE") { await handleChambre(code); return; }
    if (etape==="SCAN") {
      if (litEnCours) { await handleScanBac(code); return; }
      handleScanLit(code);
    }
  },[etape,litEnCours,handleAgent,handleChambre,handleScanLit,handleScanBac]);

  const totalLits  = collecte?.lits?.length||0;
  const traites    = collecte?.lits?.filter(l=>l.statut).length||0;
  const nonTraites = totalLits-traites;

  const ETAPES = [
    {id:"AGENT",label:"Agent",done:!!agent},
    {id:"CHAMBRE",label:"Chambre",done:!!collecte},
    {id:"SCAN",label:"Lits + Bacs",done:etape==="RESUME"},
  ];

  const PH = etape==="AGENT"?"👤 Scanner votre badge..."
    :etape==="CHAMBRE"?"🚪 Scanner le code chambre..."
    :litEnCours?`📦 Scanner le bac pour Lit ${litEnCours.codeLit}...`
    :"🛏️ Scanner un lit...";

  const BORDER = litEnCours?(litEnCours.estInfecte?"#dc2626":"#7c3aed")
    :{AGENT:"#e2e8f0",CHAMBRE:"#10b981",SCAN:"#0ea5e9"}[etape]||"#e2e8f0";

  return (
    <div className="collecte-container">
      <DialogueManquant linge={dlgManq} onConfirmer={handleManquant} onFermer={()=>setDlgManq(null)}/>

      <div className="page-header" style={{ marginBottom:0 }}>
        <h1 className="text-3xl font-extrabold" style={{ marginBottom:"2px" }}>🚪 Collecte — Chambre</h1>
        <p style={{ color:"#166d7c",fontSize:"13px",marginBottom:"18px" }}>
          {agent?agent.nom:"Scannez votre badge"}
        </p>
      </div>

      <div style={{ display:"grid",gridTemplateColumns:etape==="SCAN"&&collecte?"1fr 300px":"1fr",gap:"15px" }}>
        <div style={{ display:"flex",flexDirection:"column",gap:"12px" }}>
          {agent&&(
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
              <div style={{ display:"flex",alignItems:"center",gap:"8px",padding:"7px 12px",
                borderRadius:"9px",background:"#f8fafc",border:"1px solid #e2e8f0" }}>
                <FaUser size={12} color="#64748b"/>
                <span style={{ fontWeight:600,fontSize:"12px" }}>{agent.nom}</span>
                {collecte&&<>
                  <span style={{ color:"#e2e8f0" }}>|</span>
                  <span style={{ fontWeight:700,fontSize:"12px",color:"#0ea5e9" }}>
                    Chambre {collecte.codeChambre}
                  </span>
                  <span style={{ fontSize:"10px",color:"#94a3b8" }}>{traites}/{totalLits} lits</span>
                </>}
              </div>
              <button onClick={()=>{setAgent(null);setCollecte(null);setResume(null);
                setLitEnCours(null);setEtape("AGENT");setScanVal("");}}
                style={{ padding:"6px 11px",border:"1px solid #fca5a5",borderRadius:"8px",
                  background:"#fff5f5",color:"#dc2626",cursor:"pointer",fontSize:"11px",
                  fontWeight:600,display:"flex",alignItems:"center",gap:"3px" }}>
                <FaRedo size={8}/> Reset
              </button>
            </div>
          )}

          {litEnCours&&(
            <div style={{ padding:"10px 14px",background:"#f5f3ff",borderRadius:"10px",
              border:`2px solid ${litEnCours.estInfecte?"#fca5a5":"#c4b5fd"}`,
              display:"flex",alignItems:"center",gap:"10px" }}>
              <FaBed size={15} color={litEnCours.estInfecte?"#dc2626":"#7c3aed"}/>
              <div>
                <div style={{ fontWeight:700,fontSize:"12px",color:litEnCours.estInfecte?"#dc2626":"#7c3aed" }}>
                  Lit {litEnCours.codeLit} — scannez le bac
                  {litEnCours.estInfecte?" 🔴 (rouge recommandé)":""}
                </div>
                <div style={{ fontSize:"10px",color:"#94a3b8" }}>📦 Blanc = normal · 🔴 Rouge = infecté</div>
              </div>
              <div style={{ marginLeft:"auto",display:"flex",gap:"6px" }}>
                <FaBox size={18} color="#15803d"/>
                <FaBiohazard size={18} color="#dc2626"/>
              </div>
              <button onClick={()=>setLitEnCours(null)} style={{ background:"none",border:"none",
                cursor:"pointer",color:"#94a3b8" }}>✕</button>
            </div>
          )}

          <EtapesStepper etapes={ETAPES} etapeActive={etape} couleurActive={BORDER}/>

          {etape!=="RESUME"&&(
            <Card style={{ border:`2px dashed ${BORDER}` }}>
              <CardContent className="p-4">
                <ScanInput placeholder={PH} value={scanVal} onChange={setScanVal}
                  onSubmit={handleScan} borderColor={BORDER} keepFocus autoDebounce disabled={loading}/>
                {loading&&<div style={{ marginTop:"5px",fontSize:"11px",color:"#64748b",
                  display:"flex",alignItems:"center",gap:"4px" }}>
                  <FaSpinner style={{ animation:"spin 1s linear infinite" }}/> ...
                </div>}
              </CardContent>
            </Card>
          )}

          {etape==="AGENT"&&<Card style={{ border:"2px dashed #e2e8f0" }}>
            <CardContent style={{ textAlign:"center",padding:"40px 20px",color:"#94a3b8" }}>
              <FaUser size={34} style={{ opacity:0.18,marginBottom:"8px" }}/>
              <div style={{ fontSize:"13px",fontWeight:600 }}>Scannez votre badge agent</div>
            </CardContent>
          </Card>}

          {etape==="CHAMBRE"&&<Card style={{ border:"2px dashed #d1fae5",background:"#f0fdf4" }}>
            <CardContent style={{ textAlign:"center",padding:"32px 20px",color:"#15803d" }}>
              <div style={{ fontSize:"30px",marginBottom:"6px" }}>🚪</div>
              <div style={{ fontSize:"13px",fontWeight:700 }}>Scannez le code chambre</div>
            </CardContent>
          </Card>}

          {etape==="SCAN"&&collecte&&(
            <Card style={{ border:"1px solid #e2e8f0" }}>
              <CardContent className="p-4">
                <div style={{ marginBottom:"10px" }}>
                  <div style={{ display:"flex",justifyContent:"space-between",
                    fontSize:"11px",color:"#64748b",marginBottom:"3px" }}>
                    <span>Lits traités</span>
                    <span style={{ fontWeight:700 }}>{traites}/{totalLits}</span>
                  </div>
                  <div style={{ height:"4px",background:"#f1f5f9",borderRadius:"3px",overflow:"hidden" }}>
                    <div style={{ width:`${totalLits>0?Math.round(traites/totalLits*100):0}%`,
                      height:"100%",background:traites===totalLits?"#15803d":"#0ea5e9",
                      borderRadius:"3px",transition:"width 0.3s" }}/>
                  </div>
                </div>
                <button onClick={handleCloturer} disabled={loading}
                  style={{ width:"100%",padding:"11px",borderRadius:"9px",border:"none",
                    background:loading?"#e2e8f0":nonTraites>0
                      ?"linear-gradient(135deg,#d97706,#b45309)"
                      :"linear-gradient(135deg,#0ea5e9,#0284c7)",
                    color:loading?"#94a3b8":"white",fontWeight:700,fontSize:"12px",
                    cursor:loading?"not-allowed":"pointer",
                    display:"flex",alignItems:"center",justifyContent:"center",gap:"5px" }}>
                  {loading?<><FaSpinner style={{ animation:"spin 1s linear infinite" }}/> ...</>
                   :nonTraites>0?`⚠️ Clôturer (${nonTraites} lit(s) non traité(s))`
                   :<><FaCheckDouble size={10}/>Clôturer chambre {collecte.codeChambre}</>}
                </button>
              </CardContent>
            </Card>
          )}

          {etape==="RESUME"&&resume&&(
            <ResumeCloture res={resume}
              onNouvelle={()=>{setCollecte(null);setLitEnCours(null);setResume(null);setEtape("CHAMBRE");}}
              onTerminer={()=>{setAgent(null);setCollecte(null);setResume(null);
                setLitEnCours(null);setEtape("AGENT");setScanVal("");}}/>
          )}

          {agent&&<div style={{ paddingTop:"7px",borderTop:"1px solid #e2e8f0",
            fontSize:"10px",color:"#94a3b8" }}>
            👤 {agent.nom} · 📍 {etape}
            {litEnCours&&` · 🛏️ Lit ${litEnCours.codeLit} — attente bac`}
          </div>}
        </div>

        {/* Colonne droite */}
        {etape==="SCAN"&&collecte&&(
          <div style={{ position:"sticky",top:"20px",alignSelf:"start",
            display:"flex",flexDirection:"column",gap:"8px",
            maxHeight:"calc(100vh - 120px)",overflowY:"auto" }}>
            <div style={{ padding:"9px 12px",background:"#f8fafc",borderRadius:"9px",
              border:"1px solid #e2e8f0" }}>
              <div style={{ fontWeight:700,fontSize:"12px",marginBottom:"5px" }}>
                Chambre {collecte.codeChambre}
              </div>
              <div style={{ display:"flex",gap:"5px" }}>
                <Badge style={{ background:"#dcfce7",color:"#15803d",fontSize:"9px" }}>{traites} traité(s)</Badge>
                {nonTraites>0&&<Badge style={{ background:"#fef3c7",color:"#d97706",fontSize:"9px" }}>
                  {nonTraites} restant(s)
                </Badge>}
              </div>
            </div>
            {collecte.lits.map(lit=>(
              <CarteLit key={lit.litId} lit={lit}
                onPropre={handlePropre} onManquant={l=>setDlgManq(l)}/>
            ))}
            <div style={{ padding:"8px 11px",background:"#f8fafc",borderRadius:"8px",
              border:"1px solid #e2e8f0",fontSize:"10px",color:"#94a3b8",lineHeight:"1.9" }}>
              🛏️ Scan lit → scan bac<br/>
              📦 Bac blanc = normal · 🔴 Bac rouge = infecté<br/>
              🔵 = propre · ⚠️ = manquant
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
