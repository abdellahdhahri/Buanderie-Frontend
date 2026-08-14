
 
import React, { useState, useRef, useCallback, useEffect } from "react";
import { useModal } from "../../contextes/ModalContext";
import {
  FaUser, FaUserMd, FaRedo, FaSpinner,
  FaCheck, FaCheckDouble, FaArrowRight,
  FaTshirt, FaBiohazard
} from "react-icons/fa";
import { Card, CardContent } from "../../components/ui/card";
import { Badge }             from "../../components/ui/badge";
import ScanInput             from "../../components/utils/shared/ScanInput";
import EtapesStepper         from "../../components/utils/shared/EtapesStepper";
import { cat, apiCall }      from "../collage/collecteUtils";
import "../Linge/WorkflowList.css";

function CarteUniformeDispo({ uniforme, onDistribuer, actif }) {
  const c = cat(uniforme.categorie);
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
      padding:"10px 13px", borderRadius:11,
      background: actif ? "#f0fdfa" : "#f8fafc",
      border:`1.5px solid ${actif ? "#5eead4" : "#e2e8f0"}`,
      transition:"all .15s" }}>
      <div style={{ display:"flex", alignItems:"center", gap:9 }}>
        <span style={{ fontSize:18 }}>{c.emoji}</span>
        <div>
          <div style={{ fontSize:12, fontWeight:600, color:c.color }}>{c.label}</div>
          <code style={{ fontSize:10, color:"#94a3b8" }}>{uniforme.codeBarre}</code>
        </div>
      </div>
      <button onClick={() => onDistribuer(uniforme)}
        style={{ display:"flex", alignItems:"center", gap:5,
          padding:"6px 12px", borderRadius:8, border:"none",
          background:"linear-gradient(135deg,#0d9488,#0f766e)",
          color:"white", fontWeight:700, fontSize:11,
          cursor:"pointer", transition:"opacity .15s" }}
        onMouseEnter={e=>e.currentTarget.style.opacity=".85"}
        onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
        <FaCheck size={9}/> Attribuer
      </button>
    </div>
  );
}

function CarteUniformePossession({ uniforme }) {
  const c = cat(uniforme.categorie);
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8,
      padding:"7px 11px", borderRadius:9,
      background:"#f0fdfa", border:"1px solid #99f6e4" }}>
      <span style={{ fontSize:16 }}>{c.emoji}</span>
      <div>
        <div style={{ fontSize:11, fontWeight:600, color:c.color }}>{c.label}</div>
        <code style={{ fontSize:10, color:"#94a3b8" }}>{uniforme.codeBarre}</code>
      </div>
      <span style={{ marginLeft:"auto", fontSize:9, padding:"2px 7px",
        borderRadius:20, background:"#ccfbf1", color:"#0d9488", fontWeight:700 }}>
        ✓ Déjà attribué
      </span>
    </div>
  );
}

function Resume({ res, onNouveau, onTerminer }) {
  return (
    <div style={{ background:"#f0fdfa", borderRadius:18, padding:28,
      border:"2px solid #0d9488", textAlign:"center" }}>
      <div style={{ fontSize:44, marginBottom:10 }}>✅</div>
      <div style={{ fontWeight:900, fontSize:18, color:"#0d9488", marginBottom:6 }}>
        Uniformes attribués à {res.personnelNom}
      </div>
      <div style={{ fontSize:13, color:"#64748b", marginBottom:6 }}>
        {res.personnelFonction}
      </div>
      <div style={{ fontSize:13, color:"#0d9488", fontWeight:700, marginBottom:20 }}>
        {res.nbAttribues} uniforme{res.nbAttribues>1?"s":""} attribué{res.nbAttribues>1?"s":""}
        · Total en possession : {res.nbTotal}
      </div>
      <div style={{ display:"flex", gap:8 }}>
        <button onClick={onNouveau} style={{ flex:1, padding:"11px", borderRadius:10,
          border:"none", background:"linear-gradient(135deg,#0d9488,#0f766e)",
          color:"white", fontWeight:700, fontSize:13, cursor:"pointer" }}>
          <FaArrowRight size={11} style={{ marginRight:6 }}/> Autre médecin
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


export default function DistributionUniforme() {
  const { showAlert, showConfirm } = useModal();

  const [etape,     setEtape]     = useState("AGENT");
  const [agent,     setAgent]     = useState(null);
  const [personnel, setPersonnel] = useState(null); 
  const [scanVal,   setScanVal]   = useState("");
  const [loading,   setLoading]   = useState(false);
  const [resume,    setResume]    = useState(null);
  const [nbAttribues, setNbAttribues] = useState(0);

  const agentRef     = useRef(null);
  const personnelRef = useRef(null);
  useEffect(() => { agentRef.current     = agent;     }, [agent]);
  useEffect(() => { personnelRef.current = personnel; }, [personnel]);

  // Attribuer uniforme localement
  const enregistrerAttribution = useCallback((uniforme) => {
    setPersonnel(p => p ? {
      ...p,
      disponibles:   p.disponibles.filter(u => u.lingeId !== uniforme.lingeId),
      enPossession:  [...(p.enPossession||[]), { ...uniforme }],
      nbEnPossession: (p.nbEnPossession||0) + 1,
    } : p);
    setNbAttribues(n => n + 1);
  }, []);

  const handleAgent = useCallback(async code => {
    setLoading(true);
    try {
      const ag = await fetch(`http://localhost:8082/api/agents/matricule/${code}`)
                       .then(r => r.ok ? r.json() : null);
      if (!ag) { showAlert("❌ Agent introuvable", code, "error"); return; }
      setAgent({ nom: ag.nom, matricule: ag.matricule });
      setEtape("BADGE");
    } catch(e) { showAlert("❌ " + e.message, "", "error"); }
    finally { setLoading(false); }
  }, [showAlert]);

  const handleBadge = useCallback(async code => {
    setLoading(true);
    try {
      const res = await apiCall("/api/distribution/uniforme", {
        codeBadge:      code,
        matriculeAgent: agentRef.current.matricule
      }, "GET");
      setPersonnel({
        personnelId:       res.personnelId,
        personnelNom:      res.personnelNom,
        personnelFonction: res.personnelFonction,
        nbEnPossession:    res.nbEnPossession || 0,
        disponibles:       (res.disponibles  || []).map(u => ({...u, lingeId:u.lingeId||u.id})),
        enPossession:      (res.enPossession || []).map(u => ({...u, lingeId:u.lingeId||u.id})),
      });
      setNbAttribues(0);
      setEtape("DISTRIBUER");
      showAlert("✅ " + res.personnelNom,
        (res.disponibles?.length||0) + " uniforme(s) disponible(s) · "
        + (res.nbEnPossession||0) + " déjà en possession",
        "success");
    } catch(e) { showAlert("❌ " + e.message, "", "error"); }
    finally { setLoading(false); }
  }, [showAlert]);

  const handleScanUniforme = useCallback(async code => {
    setLoading(true);
    try {
      const p   = personnelRef.current;
      const res = await apiCall("/api/distribution/uniforme", {
        porteurId:      p.personnelId,
        porteurNom:     p.personnelNom,
        codeOuTag:      code,
        matriculeAgent: agentRef.current.matricule
      });
      const uniforme = p.disponibles.find(u => u.codeBarre===code || u.lingeId===res.lingeId)
                    || { lingeId:res.lingeId, codeBarre:res.codeBarre, categorie:res.categorie };
      enregistrerAttribution(uniforme);
    } catch(e) { showAlert("❌ " + e.message, code, "error"); }
    finally { setLoading(false); }
  }, [showAlert, enregistrerAttribution]);

  const handleAttribuerBouton = useCallback(async uniforme => {
    setLoading(true);
    try {
      const p = personnelRef.current;
      await apiCall("/api/distribution/uniforme", {
        porteurId:      p.personnelId,
        porteurNom:     p.personnelNom,
        codeOuTag:      uniforme.codeBarre,
        matriculeAgent: agentRef.current.matricule
      });
      enregistrerAttribution(uniforme);
    } catch(e) { showAlert("❌ " + e.message, "", "error"); }
    finally { setLoading(false); }
  }, [showAlert, enregistrerAttribution]);

  const handleScan = useCallback(async code => {
    setScanVal("");
    if (etape==="AGENT")     { await handleAgent(code);         return; }
    if (etape==="BADGE")     { await handleBadge(code);         return; }
    if (etape==="DISTRIBUER"){ await handleScanUniforme(code);  }
  }, [etape, handleAgent, handleBadge, handleScanUniforme]);

  const handleTerminer = useCallback(async () => {
    if (nbAttribues === 0) {
      showAlert("⚠️ Aucun uniforme attribué", "", "warning"); return;
    }
    if (!(await showConfirm("Terminer l'attribution",
      `${nbAttribues} uniforme(s) attribué(s) à ${personnel.personnelNom} ?`,
      "question"))) return;
    setResume({
      personnelNom:       personnel.personnelNom,
      personnelFonction:  personnel.personnelFonction,
      nbAttribues,
      nbTotal:            personnel.nbEnPossession,
    });
    setEtape("RESUME");
  }, [nbAttribues, personnel, showAlert, showConfirm]);

  const reset = () => {
    setAgent(null); setPersonnel(null); setNbAttribues(0);
    setResume(null); setEtape("AGENT"); setScanVal("");
  };

  const ETAPES = [
    { id:"AGENT",      label:"Agent",       done:!!agent     },
    { id:"BADGE",      label:"Badge médecin",done:!!personnel },
    { id:"DISTRIBUER", label:"Attribution",  done:etape==="RESUME" },
  ];

  const PH = etape==="AGENT"     ? "👤 Scanner votre badge..."
           : etape==="BADGE"     ? "🏥 Scanner le badge du médecin..."
           : "👔 Scanner un uniforme...";

  const BORDER = etape==="AGENT" ? "#e2e8f0"
               : etape==="BADGE" ? "#0d9488"
               : "#0d9488";

  const nbDispo      = personnel?.disponibles?.length || 0;
  const nbPossession = personnel?.nbEnPossession     || 0;

  return (
    <div className="collecte-container">
      <div className="page-header" style={{ marginBottom:0 }}>
        <h1 className="text-3xl font-extrabold" style={{ marginBottom:2 }}>
          👔 Distribution — Uniformes
        </h1>
        <p style={{ color:"#166d7c", fontSize:13, marginBottom:18 }}>
          {agent ? `${agent.nom} · Attribution uniforme ↔ personnel` : "Scannez votre badge"}
        </p>
      </div>

      <div style={{ display:"grid",
        gridTemplateColumns: etape==="DISTRIBUER" && personnel ? "1fr 300px" : "1fr",
        gap:16 }}>

        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>

          {/* Barre agent */}
          {agent && (
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ display:"flex", alignItems:"center", gap:9, padding:"7px 13px",
                borderRadius:10, background:"#f0fdfa", border:"1px solid #99f6e4" }}>
                <FaUser size={12} color="#0d9488"/>
                <span style={{ fontWeight:600, fontSize:12 }}>{agent.nom}</span>
                {personnel && <>
                  <span style={{ color:"#e2e8f0" }}>|</span>
                  <FaUserMd size={12} color="#0d9488"/>
                  <span style={{ fontWeight:700, fontSize:12, color:"#0d9488" }}>
                    {personnel.personnelNom}
                  </span>
                  <Badge style={{ background:"#ccfbf1", color:"#0d9488", fontSize:9 }}>
                    {personnel.personnelFonction}
                  </Badge>
                  {nbAttribues > 0 && (
                    <Badge style={{ background:"#dcfce7", color:"#15803d", fontSize:9 }}>
                      +{nbAttribues} attribué{nbAttribues>1?"s":""}
                    </Badge>
                  )}
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

          {/* Stepper */}
          <EtapesStepper etapes={ETAPES} etapeActive={etape} couleurActive={BORDER}/>

          {/* Zone scan */}
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
              </CardContent>
            </Card>
          )}

          {/* États vides */}
          {etape==="AGENT" && (
            <Card style={{ border:"2px dashed #e2e8f0" }}>
              <CardContent style={{ textAlign:"center", padding:"44px 20px", color:"#94a3b8" }}>
                <FaUser size={36} style={{ opacity:.18, marginBottom:10 }}/>
                <div style={{ fontSize:13, fontWeight:600 }}>Scannez votre badge agent</div>
              </CardContent>
            </Card>
          )}

          {etape==="BADGE" && (
            <Card style={{ border:"2px dashed #99f6e4", background:"#f0fdfa" }}>
              <CardContent style={{ textAlign:"center", padding:"34px 20px", color:"#0d9488" }}>
                <FaUserMd size={32} style={{ opacity:.4, marginBottom:8 }}/>
                <div style={{ fontSize:13, fontWeight:700 }}>
                  Scannez le badge du médecin ou du personnel
                </div>
                <div style={{ fontSize:11, color:"#64748b", marginTop:3 }}>
                  Le système affiche ses uniformes actuels et les disponibles
                </div>
              </CardContent>
            </Card>
          )}

          {etape==="DISTRIBUER" && personnel && (
            <>
              {/* Fiche personnel */}
              <div style={{ padding:"14px 16px", background:"#f0fdfa",
                borderRadius:12, border:"1.5px solid #5eead4",
                display:"flex", alignItems:"center", gap:14 }}>
                <div style={{ width:50, height:50, borderRadius:"50%",
                  background:"linear-gradient(135deg,#0d9488,#14b8a6)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  color:"white", fontWeight:900, fontSize:18, flexShrink:0 }}>
                  {personnel.personnelNom?.split(" ").map(n=>n[0]).join("").slice(0,2)||"?"}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:800, fontSize:15, color:"#0d9488" }}>
                    {personnel.personnelNom}
                  </div>
                  <div style={{ fontSize:12, color:"#64748b" }}>
                    {personnel.personnelFonction}
                  </div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:22, fontWeight:900, color:"#0d9488" }}>
                    {nbPossession}
                  </div>
                  <div style={{ fontSize:10, color:"#64748b" }}>en possession</div>
                </div>
              </div>

              {/* Uniformes en possession actuelle */}
              {personnel.enPossession?.length > 0 && (
                <div>
                  <div style={{ fontSize:11, fontWeight:700, color:"#64748b",
                    marginBottom:6, display:"flex", alignItems:"center", gap:6 }}>
                    <FaTshirt size={11}/>
                    En possession actuellement ({personnel.enPossession.length})
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                    {personnel.enPossession.map(u => (
                      <CarteUniformePossession key={u.lingeId||u.codeBarre} uniforme={u}/>
                    ))}
                  </div>
                </div>
              )}

              {/* Bouton terminer */}
              <Card style={{ border:"1px solid #e2e8f0" }}>
                <CardContent className="p-4">
                  {nbDispo === 0 && nbAttribues === 0 ? (
                    <div style={{ textAlign:"center", padding:"16px 0",
                      color:"#64748b", fontSize:13 }}>
                      <FaTshirt size={28} style={{ opacity:.2, marginBottom:8 }}/>
                      <div>Aucun uniforme STOCKE disponible</div>
                      <div style={{ fontSize:11, color:"#94a3b8", marginTop:3 }}>
                        Les uniformes doivent être en état STOCKE dans l'arsenal
                      </div>
                    </div>
                  ) : (
                    <>
                      {nbAttribues > 0 && (
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr",
                          gap:7, marginBottom:10 }}>
                          {[["Attribués auj.", nbAttribues, "#dcfce7","#15803d"],
                            ["Total possession", nbPossession, "#ccfbf1","#0d9488"]
                          ].map(([l,v,bg,co])=>(
                            <div key={l} style={{ background:bg, borderRadius:9,
                              padding:"8px 4px", textAlign:"center" }}>
                              <div style={{ fontSize:20, fontWeight:900, color:co }}>{v}</div>
                              <div style={{ fontSize:9, color:co, fontWeight:600 }}>{l}</div>
                            </div>
                          ))}
                        </div>
                      )}
                      <button onClick={handleTerminer}
                        disabled={loading || nbAttribues === 0}
                        style={{ width:"100%", padding:11, borderRadius:9, border:"none",
                          background: loading || nbAttribues===0 ? "#e2e8f0"
                            : "linear-gradient(135deg,#0d9488,#0f766e)",
                          color: loading || nbAttribues===0 ? "#94a3b8" : "white",
                          fontWeight:700, fontSize:13,
                          cursor: loading || nbAttribues===0 ? "not-allowed" : "pointer",
                          display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                        {loading
                          ? <FaSpinner style={{ animation:"spin 1s linear infinite" }}/>
                          : nbAttribues === 0
                            ? "Attribuez au moins un uniforme"
                            : <><FaCheckDouble size={11}/>
                                Terminer — {nbAttribues} uniforme{nbAttribues>1?"s":""} attribué{nbAttribues>1?"s":""}
                              </>}
                      </button>
                    </>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {/* Résumé */}
          {etape==="RESUME" && resume && (
            <Resume res={resume}
              onNouveau={() => {
                setPersonnel(null); setNbAttribues(0);
                setResume(null); setEtape("BADGE");
              }}
              onTerminer={reset}/>
          )}

          {agent && (
            <div style={{ paddingTop:7, borderTop:"1px solid #e2e8f0",
              fontSize:10, color:"#94a3b8" }}>
              👤 {agent.nom} · 📍 {etape}
            </div>
          )}
        </div>

        {/* ── Colonne droite : uniformes disponibles ── */}
        {etape==="DISTRIBUER" && personnel && nbDispo > 0 && (
          <div style={{ position:"sticky", top:20, alignSelf:"start",
            display:"flex", flexDirection:"column", gap:8,
            maxHeight:"calc(100vh - 120px)", overflowY:"auto" }}>

            <div style={{ padding:"10px 13px", background:"#f0fdfa",
              borderRadius:10, border:"1px solid #99f6e4" }}>
              <div style={{ fontWeight:700, fontSize:12, marginBottom:3,
                display:"flex", alignItems:"center", gap:7, color:"#0d9488" }}>
<FaTshirt size={12} />
                Uniformes disponibles
                <span style={{ background:"#ccfbf1", padding:"1px 7px",
                  borderRadius:20, fontSize:10, fontWeight:500 }}>
                  {nbDispo}
                </span>
              </div>
              <div style={{ fontSize:10, color:"#64748b" }}>
                Scannez ou cliquez "Attribuer"
              </div>
            </div>

            {personnel.disponibles.map(u => (
              <CarteUniformeDispo
                key={u.lingeId || u.codeBarre}
                uniforme={u}
                onDistribuer={handleAttribuerBouton}
                actif={true}
              />
            ))}

            <div style={{ padding:"9px 12px", background:"#f8fafc",
              borderRadius:9, border:"1px solid #e2e8f0",
              fontSize:10, color:"#94a3b8", lineHeight:1.9 }}>
              👔 Scan = attribuer automatiquement<br/>
              ✓ Bouton = attribuer manuellement
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
