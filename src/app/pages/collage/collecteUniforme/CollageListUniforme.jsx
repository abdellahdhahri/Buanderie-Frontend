
import React, { useState, useRef, useCallback, useEffect } from "react";
import { useModal } from "../../../contextes/ModalContext";
import { FaUser, FaTimes, FaExclamationTriangle, FaSpinner,
         FaRedo, FaBiohazard, FaUserMd, FaBox, FaCheckDouble } from "react-icons/fa";
import { Card, CardContent } from "../../../components/ui/card";
import { Badge }             from "../../../components/ui/badge";
import ScanInput             from "../../../components/utils/shared/ScanInput";
import EtapesStepper         from "../../../components/utils/shared/EtapesStepper";
import { cat, ST_COLORS, apiCall } from "../collecteUtils";
import "../../Linge/WorkflowList.css";

function DlgManquant({ linge, onOk, onClose }) {
  if (!linge) return null;
  const c = cat(linge.categorie);
  return (
    <div data-modal="true" style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",
      display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999,backdropFilter:"blur(4px)" }}>
      <div style={{ background:"white",borderRadius:"18px",padding:"20px",
        maxWidth:"310px",width:"95%",boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px" }}>
          <div style={{ display:"flex",alignItems:"center",gap:"8px" }}>
            <div style={{ width:"32px",height:"32px",borderRadius:"50%",background:"#fef3c7",
              display:"flex",alignItems:"center",justifyContent:"center" }}>
              <FaExclamationTriangle size={13} color="#d97706"/>
            </div>
            <div style={{ fontWeight:800,fontSize:"12px" }}>Uniforme manquant ?</div>
          </div>
          <button onClick={onClose} style={{ background:"#f1f5f9",border:"none",borderRadius:"50%",
            width:"26px",height:"26px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>
            <FaTimes size={9} color="#64748b"/>
          </button>
        </div>
        <div style={{ padding:"7px 10px",background:c.bg,borderRadius:"8px",
          marginBottom:"12px",display:"flex",alignItems:"center",gap:"7px" }}>
          <span style={{ fontSize:"18px" }}>{c.emoji}</span>
          <div>
            <div style={{ fontWeight:700,fontSize:"11px",color:c.color }}>{c.label}</div>
            <code style={{ fontSize:"10px",color:"#64748b" }}>{linge.codeBarre}</code>
          </div>
        </div>
        <div style={{ display:"flex",gap:"6px" }}>
          <button onClick={onClose} style={{ flex:1,padding:"8px",borderRadius:"7px",
            border:"1px solid #e2e8f0",background:"white",color:"#64748b",
            fontWeight:600,fontSize:"11px",cursor:"pointer" }}>Annuler</button>
          <button onClick={()=>onOk(linge)} style={{ flex:2,padding:"8px",borderRadius:"7px",
            border:"none",background:"linear-gradient(135deg,#d97706,#b45309)",
            color:"white",fontWeight:700,fontSize:"11px",cursor:"pointer" }}>⚠️ Confirmer</button>
        </div>
      </div>
    </div>
  );
}

function CarteUniforme({ u, uniformeEnCours, onManquant }) {
  const c   = cat(u.categorie);
  const col = ST_COLORS[u.statut];
  const actif = uniformeEnCours?.lingeId === u.lingeId;
  return (
    <div style={{ padding:"8px 11px",borderRadius:"10px",
      border:`1.5px solid ${actif?"#7c3aed":col?.b||"#e2e8f0"}`,
      background:actif?"#faf5ff":col?.bg||"#f8fafc",transition:"all 0.15s" }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
        <div style={{ display:"flex",alignItems:"center",gap:"8px" }}>
          <span style={{ fontSize:"17px" }}>{c.emoji}</span>
          <div>
            <div style={{ display:"flex",alignItems:"center",gap:"4px" }}>
              <span style={{ fontSize:"11px",fontWeight:600,color:c.color }}>{c.label}</span>
              {u.estInfecte&&!u.statut&&<span style={{ fontSize:"9px",padding:"1px 4px",
                borderRadius:"4px",background:"#fee2e2",color:"#dc2626",fontWeight:700 }}>⚠️ Suspect</span>}
              {actif&&<Badge style={{ background:"#ede9fe",color:"#7c3aed",fontSize:"9px" }}>⏳ Bac</Badge>}
            </div>
            <code style={{ fontSize:"10px",color:"#94a3b8" }}>{u.codeBarre}</code>
          </div>
        </div>
        {u.statut ? (
          <span style={{ fontSize:"9px",fontWeight:700,padding:"2px 6px",borderRadius:"5px",
            background:col?.tag,color:col?.tc }}>{col?.lbl}</span>
        ) : (
          <button onClick={()=>onManquant(u)} title="Manquant"
            style={{ width:"24px",height:"24px",borderRadius:"50%",border:"1px solid #fde68a",
              background:"#fef3c7",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>
            <FaExclamationTriangle size={8} color="#d97706"/>
          </button>
        )}
      </div>
    </div>
  );
}

export default function CollageListUniforme() {
  const { showAlert, showConfirm } = useModal();
  const [etape,   setEtape]   = useState("AGENT");
  const [agent,   setAgent]   = useState(null);
  const [collecte,setCollecte]= useState(null);
  const [uniformeEnCours, setUniformeEnCours] = useState(null);
  const [scanVal, setScanVal] = useState("");
  const [loading, setLoading] = useState(false);
  const [resume,  setResume]  = useState(null);
  const [dlgManq, setDlgManq] = useState(null);

  const agentRef    = useRef(null);
  const collecteRef = useRef(null);
  useEffect(()=>{ agentRef.current    = agent;    },[agent]);
  useEffect(()=>{ collecteRef.current = collecte; },[collecte]);

  const majUniforme = useCallback((lingeId,statut)=>{
    setCollecte(p=>p?{...p,uniformes:p.uniformes.map(u=>u.lingeId===lingeId?{...u,statut}:u)}:p);
  },[]);

  const handleAgent = useCallback(async code=>{
    setLoading(true);
    try {
      const ag=await fetch(`http://localhost:8082/api/agents/matricule/${code}`).then(r=>r.ok?r.json():null);
      if(!ag){showAlert("❌ Agent introuvable",code,"error");return;}
      setAgent({nom:ag.nom,matricule:ag.matricule});
      setEtape("BADGE"); showAlert("✅ "+ag.nom,"Scannez le badge du médecin","success");
    } catch(e){showAlert("❌ "+e.message,"","error");} finally{setLoading(false);}
  },[showAlert]);

  const handleBadge = useCallback(async code=>{
    setLoading(true);
    try {
      const res=await apiCall("/api/collecte/uniforme/ouvrir",{
        matriculeAgent:agentRef.current.matricule, codeBadge:code});
      setCollecte({id:res.collecteId,personnelNom:res.personnelNom,
        personnelFonction:res.personnelFonction,personnelId:res.personnelId,
        estInfecte:res.estInfecte,infoInfection:res.infoInfection,
        nbUniformes:res.nbUniformes,
        uniformes:(res.uniformes||[]).map(u=>({...u,statut:""}))});
      setResume(null); setUniformeEnCours(null); setEtape("SCAN");
      if(res.estInfecte)
        showAlert("⚠️ Contact infectieux — "+res.personnelNom,
          res.infoInfection||"Uniformes potentiellement infectés","warning");
      else
        showAlert("✅ "+res.personnelNom, res.nbUniformes+" uniforme(s)","success");
    } catch(e){showAlert("❌ "+e.message,"","error");} finally{setLoading(false);}
  },[showAlert]);

  const handleScanUniforme = useCallback(code=>{
    const u=collecteRef.current?.uniformes?.find(x=>x.codeBarre===code||String(x.lingeId)===code);
    if(!u){showAlert("❌ Uniforme introuvable",code,"error");return;}
    if(u.statut){showAlert("ℹ️ Déjà traité",u.codeBarre,"info");return;}
    setUniformeEnCours(u);
    showAlert("👔 "+u.codeBarre, u.estInfecte?"⚠️ Suspect → bac rouge":"Scannez le bac",
      u.estInfecte?"warning":"success");
  },[showAlert]);

  const handleScanBac = useCallback(async code=>{
    if(!uniformeEnCours) return;
    setLoading(true);
    try {
      const res=await apiCall(`/api/collecte/uniforme/${collecteRef.current?.id}/traiter`,{
        codeUniforme:uniformeEnCours.codeBarre, codeBac:code});
      majUniforme(uniformeEnCours.lingeId, res.statut);
      setUniformeEnCours(null);
      showAlert(res.statut==="INFECTE"?`🔴 Infecté → bac ${res.bac}`:`✅ Blanc → bac ${res.bac}`,
        uniformeEnCours.codeBarre,res.statut==="INFECTE"?"warning":"success");
    } catch(e){showAlert("❌ "+e.message,"","error");} finally{setLoading(false);}
  },[uniformeEnCours,showAlert,majUniforme]);

  const handleManquant = useCallback(async u=>{
    setDlgManq(null); setLoading(true);
    try {
      await apiCall(`/api/collecte/uniforme/${collecteRef.current?.id}/manquant`,{lingeId:u.lingeId});
      majUniforme(u.lingeId,"MANQUANT"); showAlert("⚠️ Manquant",u.codeBarre,"warning");
    } catch(e){showAlert("❌ "+e.message,"","error");} finally{setLoading(false);}
  },[showAlert,majUniforme]);

  const handleCloturer = useCallback(async()=>{
    const nonTr=collecte?.uniformes?.filter(u=>!u.statut)||[];
    if(nonTr.length>0){
      const ok=await showConfirm("Uniformes non traités",`${nonTr.length} uniforme(s). Clôturer ?`,"question");
      if(!ok) return;
    }
    setLoading(true);
    try {
      const res=await apiCall(`/api/collecte/uniforme/${collecte.id}/cloturer`);
      setResume(res); setUniformeEnCours(null); setEtape("RESUME");
    } catch(e){showAlert("❌ "+e.message,"","error");} finally{setLoading(false);}
  },[collecte,showAlert,showConfirm]);

  const handleScan = useCallback(async code=>{
    setScanVal("");
    if(etape==="AGENT")  {await handleAgent(code);  return;}
    if(etape==="BADGE")  {await handleBadge(code);  return;}
    if(etape==="SCAN") {
      if(uniformeEnCours){await handleScanBac(code); return;}
      handleScanUniforme(code);
    }
  },[etape,uniformeEnCours,handleAgent,handleBadge,handleScanUniforme,handleScanBac]);

  const reset=()=>{setAgent(null);setCollecte(null);setResume(null);
    setUniformeEnCours(null);setEtape("AGENT");setScanVal("");};

  const traites = collecte?.uniformes?.filter(u=>u.statut).length||0;
  const total   = collecte?.nbUniformes||0;
  const nonTr   = total-traites;

  const PH=etape==="AGENT"?"👤 Badge agent..."
    :etape==="BADGE"?"🏥 Badge médecin..."
    :uniformeEnCours?`📦 Scanner le bac pour ${uniformeEnCours.codeBarre}...`
    :"👔 Scanner un uniforme...";

  const BORDER=uniformeEnCours?(uniformeEnCours.estInfecte?"#dc2626":"#7c3aed")
    :{AGENT:"#e2e8f0",BADGE:"#0f766e",SCAN:"#0ea5e9"}[etape]||"#e2e8f0";

  const ETAPES=[{id:"AGENT",label:"Agent",done:!!agent},
    {id:"BADGE",label:"Badge médecin",done:!!collecte},
    {id:"SCAN",label:"Scan uniformes",done:etape==="RESUME"}];

  return (
    <div className="collecte-container">
      <DlgManquant linge={dlgManq} onOk={handleManquant} onClose={()=>setDlgManq(null)}/>

      <div className="page-header" style={{ marginBottom:0 }}>
        <h1 className="text-3xl font-extrabold" style={{ marginBottom:"2px" }}>👔 Collecte — Uniforme</h1>
        <p style={{ color:"#166d7c",fontSize:"13px",marginBottom:"18px" }}>
          {agent?agent.nom:"Scannez votre badge"}
        </p>
      </div>

      <div style={{ display:"grid",gridTemplateColumns:etape==="SCAN"&&collecte?"1fr 290px":"1fr",gap:"15px" }}>
        <div style={{ display:"flex",flexDirection:"column",gap:"12px" }}>
          {agent&&(
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
              <div style={{ display:"flex",alignItems:"center",gap:"8px",padding:"7px 12px",
                borderRadius:"9px",background:"#f0fdfa",border:"1px solid #99f6e4" }}>
                <FaUser size={12} color="#0f766e"/>
                <span style={{ fontWeight:600,fontSize:"12px" }}>{agent.nom}</span>
                {collecte&&<>
                  <span style={{ color:"#e2e8f0" }}>|</span>
                  <FaUserMd size={12} color="#0f766e"/>
                  <span style={{ fontWeight:700,fontSize:"12px",color:"#0f766e" }}>{collecte.personnelNom}</span>
                  {collecte.estInfecte&&<Badge style={{ background:"#fee2e2",color:"#dc2626",fontSize:"9px" }}>⚠️ Infecté</Badge>}
                </>}
              </div>
              <button onClick={reset} style={{ padding:"6px 11px",border:"1px solid #fca5a5",
                borderRadius:"8px",background:"#fff5f5",color:"#dc2626",cursor:"pointer",
                fontSize:"11px",fontWeight:600,display:"flex",alignItems:"center",gap:"3px" }}>
                <FaRedo size={8}/> Reset
              </button>
            </div>
          )}
          {collecte?.estInfecte&&etape==="SCAN"&&(
            <div style={{ padding:"9px 13px",background:"#fff5f5",borderRadius:"10px",
              border:"1.5px solid #fca5a5",display:"flex",alignItems:"center",gap:"9px" }}>
              <FaBiohazard size={16} color="#dc2626"/>
              <div>
                <div style={{ fontWeight:700,fontSize:"12px",color:"#dc2626" }}>Contact infectieux détecté</div>
                <div style={{ fontSize:"10px",color:"#94a3b8" }}>{collecte.infoInfection}</div>
              </div>
            </div>
          )}
          {uniformeEnCours&&(
            <div style={{ padding:"9px 13px",background:"#f5f3ff",borderRadius:"10px",
              border:`2px solid ${uniformeEnCours.estInfecte?"#fca5a5":"#c4b5fd"}`,
              display:"flex",alignItems:"center",gap:"9px" }}>
              <span style={{ fontSize:"20px" }}>👔</span>
              <div>
                <div style={{ fontWeight:700,fontSize:"12px",
                  color:uniformeEnCours.estInfecte?"#dc2626":"#7c3aed" }}>
                  {uniformeEnCours.codeBarre}
                  {uniformeEnCours.estInfecte?" ⚠️ → bac rouge":""}
                </div>
                <div style={{ fontSize:"10px",color:"#94a3b8" }}>📦 Scannez le bac</div>
              </div>
              <div style={{ marginLeft:"auto",display:"flex",gap:"5px" }}>
                <FaBox size={16} color="#15803d"/>
                <FaBiohazard size={16} color="#dc2626"/>
              </div>
              <button onClick={()=>setUniformeEnCours(null)}
                style={{ background:"none",border:"none",cursor:"pointer",color:"#94a3b8" }}>✕</button>
            </div>
          )}
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
          {etape==="BADGE"&&<Card style={{ border:"2px dashed #99f6e4",background:"#f0fdfa" }}>
            <CardContent style={{ textAlign:"center",padding:"32px 20px",color:"#0f766e" }}>
              <FaUserMd size={30} style={{ opacity:0.4,marginBottom:"8px" }}/>
              <div style={{ fontSize:"13px",fontWeight:700 }}>Scannez le badge du médecin</div>
              <div style={{ fontSize:"11px",color:"#64748b",marginTop:"3px" }}>
                Le système détecte automatiquement les contacts infectieux
              </div>
            </CardContent>
          </Card>}
          {etape==="SCAN"&&collecte&&(
            <Card style={{ border:"1px solid #e2e8f0" }}>
              <CardContent className="p-4">
                <div style={{ marginBottom:"10px" }}>
                  <div style={{ display:"flex",justifyContent:"space-between",fontSize:"11px",color:"#64748b",marginBottom:"3px" }}>
                    <span>Traités</span><span style={{ fontWeight:700 }}>{traites}/{total}</span>
                  </div>
                  <div style={{ height:"4px",background:"#f1f5f9",borderRadius:"3px",overflow:"hidden" }}>
                    <div style={{ width:`${total>0?Math.round(traites/total*100):0}%`,
                      height:"100%",background:traites===total?"#15803d":"#0ea5e9",
                      borderRadius:"3px",transition:"width 0.3s" }}/>
                  </div>
                </div>
                <button onClick={handleCloturer} disabled={loading}
                  style={{ width:"100%",padding:"10px",borderRadius:"8px",border:"none",
                    background:loading?"#e2e8f0":nonTr>0
                      ?"linear-gradient(135deg,#d97706,#b45309)"
                      :"linear-gradient(135deg,#0ea5e9,#0284c7)",
                    color:loading?"#94a3b8":"white",fontWeight:700,fontSize:"12px",
                    cursor:loading?"not-allowed":"pointer",
                    display:"flex",alignItems:"center",justifyContent:"center",gap:"5px" }}>
                  {loading?<><FaSpinner style={{ animation:"spin 1s linear infinite" }}/> ...</>
                   :nonTr>0?`⚠️ Clôturer (${nonTr} non traité(s))`
                   :<><FaCheckDouble size={10}/>Clôturer uniformes</>}
                </button>
              </CardContent>
            </Card>
          )}
          {etape==="RESUME"&&resume&&(
            <Card style={{ border:"2px solid #22c55e",background:"#f0fdf4" }}>
              <CardContent className="p-4">
                <div style={{ fontWeight:800,fontSize:"15px",color:"#15803d",textAlign:"center",marginBottom:"12px" }}>
                  ✅ Uniformes clôturés
                </div>
                <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"6px",marginBottom:"12px" }}>
                  {[["Blancs",resume.nbBlancs,"#dcfce7","#15803d"],
                    ["Infectés",resume.nbInfectes,"#fee2e2","#dc2626"],
                    ["Propres",resume.nbPropres,"#dbeafe","#0284c7"],
                    ["Manq.",resume.nbManquants,"#fef3c7","#d97706"],
                  ].map(([l,v,bg,co])=>(
                    <div key={l} style={{ background:bg,borderRadius:"8px",padding:"7px 4px",textAlign:"center" }}>
                      <div style={{ fontSize:"17px",fontWeight:900,color:co }}>{v||0}</div>
                      <div style={{ fontSize:"9px",color:co,fontWeight:600 }}>{l}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display:"flex",gap:"7px" }}>
                  <button onClick={()=>{setCollecte(null);setResume(null);setUniformeEnCours(null);setEtape("BADGE");}}
                    style={{ flex:1,padding:"9px",borderRadius:"8px",border:"none",
                      background:"linear-gradient(135deg,#0ea5e9,#0284c7)",color:"white",
                      fontWeight:700,fontSize:"11px",cursor:"pointer" }}>+ Autre médecin</button>
                  <button onClick={reset} style={{ flex:1,padding:"9px",borderRadius:"8px",
                    border:"1px solid #e2e8f0",background:"white",color:"#64748b",
                    fontWeight:600,fontSize:"11px",cursor:"pointer" }}>Terminer</button>
                </div>
              </CardContent>
            </Card>
          )}
          {agent&&<div style={{ paddingTop:"7px",borderTop:"1px solid #e2e8f0",fontSize:"10px",color:"#94a3b8" }}>
            👤 {agent.nom} · 📍 {etape}
            {uniformeEnCours&&` · 👔 ${uniformeEnCours.codeBarre} — attente bac`}
          </div>}
        </div>
        {etape==="SCAN"&&collecte&&(
          <div style={{ position:"sticky",top:"20px",alignSelf:"start",
            display:"flex",flexDirection:"column",gap:"6px",maxHeight:"calc(100vh - 120px)",overflowY:"auto" }}>
            <div style={{ padding:"9px 12px",background:"#f0fdfa",borderRadius:"9px",border:"1px solid #99f6e4" }}>
              <div style={{ fontWeight:700,fontSize:"12px",color:"#0f766e",marginBottom:"3px" }}>
                {collecte.personnelNom}
              </div>
              <div style={{ fontSize:"10px",color:"#64748b" }}>
                {collecte.personnelFonction} · {total} uniforme(s)
              </div>
              {collecte.estInfecte&&<div style={{ fontSize:"10px",color:"#dc2626",fontWeight:600,marginTop:"3px" }}>
                ⚠️ Contact infectieux
              </div>}
            </div>
            {collecte.uniformes.map(u=>(
              <CarteUniforme key={u.lingeId} u={u}
                uniformeEnCours={uniformeEnCours}
                onManquant={x=>setDlgManq(x)}/>
            ))}
            <div style={{ padding:"8px 11px",background:"#f8fafc",borderRadius:"8px",
              border:"1px solid #e2e8f0",fontSize:"10px",color:"#94a3b8",lineHeight:"1.9" }}>
              👔 Scan uniforme → scan bac<br/>
              📦 Blanc = normal · 🔴 Rouge = infecté<br/>⚠️ = manquant
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
