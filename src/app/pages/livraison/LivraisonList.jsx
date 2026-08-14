import React, {
  useState, useContext, useRef, useEffect,
  useCallback, useMemo
} from "react";
import { ServiceContext } from "../../contextes/ServiceContext";
import { useModal }       from "../../contextes/ModalContext";
import {
  FaTruck, FaBarcode, FaUser, FaCheck, FaTimes,
  FaSpinner, FaBoxes, FaHistory, FaWarehouse,
  FaCheckCircle, FaClock, FaSearch, FaBuilding
} from "react-icons/fa";
import { Card, CardContent } from "../../components/ui/card";
import { Badge }     from "../../components/ui/badge";
import EtapesStepper from "../../components/utils/shared/EtapesStepper";
import ScanInput     from "../../components/utils/shared/ScanInput";
import "../Linge/WorkflowList.css";

const API = "http://localhost:8082";

const CAT = {
  DRAP:             { label:"Drap",           emoji:"🛏️", color:"#dc2626", bg:"#fee2e2", border:"#fca5a5" },
  TAIE_OREILLER:    { label:"Taie Oreiller",  emoji:"💤", color:"#ea580c", bg:"#ffedd5", border:"#fdba74" },
  SERVIETTE_BAIN:   { label:"Serv. Bain",     emoji:"🛁", color:"#d97706", bg:"#fef3c7", border:"#fcd34d" },
  SERVIETTE_VISAGE: { label:"Serv. Visage",   emoji:"🧻", color:"#65a30d", bg:"#ecfccb", border:"#a3e635" },
  PEIGNOIR:         { label:"Peignoir",        emoji:"🥼", color:"#0891b2", bg:"#cffafe", border:"#67e8f9" },
  NAPPE:            { label:"Nappe",           emoji:"🍽️", color:"#7c3aed", bg:"#ede9fe", border:"#c4b5fd" },
  SERVIETTE_TABLE:  { label:"Serv. Table",     emoji:"🍴", color:"#be185d", bg:"#fce7f3", border:"#f9a8d4" },
  UNIFORME:         { label:"Uniforme",        emoji:"👔", color:"#0f766e", bg:"#ccfbf1", border:"#5eead4" },
  AUTRE:            { label:"Autre",           emoji:"📦", color:"#475569", bg:"#f1f5f9", border:"#cbd5e1" },
};
const cat = (id) => CAT[id] || { label:id, emoji:"📦", color:"#64748b", bg:"#f1f5f9", border:"#e2e8f0" };

// ─── Ref miroir — évite stale closures ────────────────────────────────────────
function useRefMirror(v) {
  const r = useRef(v);
  useEffect(() => { r.current = v; }, [v]);
  return r;
}

// ─── Ligne du tableau comparatif ─────────────────────────────────────────────
function LigneComparatif({ item }) {
  const c       = cat(item.categorie);
  const livree  = Number(item.quantiteLivree  || 0);
  const demande = Number(item.quantiteDemandee || 0);
  const reste   = Math.max(0, demande - livree);
  const pct     = demande > 0 ? Math.min(Math.round((livree / demande) * 100), 100) : 0;
  const complet = livree >= demande && demande > 0;

  return (
    <tr style={{ borderBottom:"1px solid #f1f5f9", transition:"background 0.2s" }}
        onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"}
        onMouseLeave={e=>e.currentTarget.style.background="white"}>
      <td style={{ padding:"12px 16px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
          <span style={{ fontSize:"20px" }}>{c.emoji}</span>
          <span style={{ fontWeight:600, fontSize:"13px", color:"#0f172a" }}>{c.label}</span>
        </div>
      </td>
      <td style={{ padding:"12px 16px", textAlign:"right", fontSize:"13px", fontWeight:600, color:"#64748b" }}>
        {item.quantiteCollectee ?? "—"}
      </td>
      <td style={{ padding:"12px 16px", textAlign:"right", fontSize:"13px", fontWeight:600, color:"#0f172a" }}>
        {demande}
      </td>
      <td style={{ padding:"12px 16px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
          <div style={{ flex:1, height:"8px", background:"#f1f5f9", borderRadius:"4px", overflow:"hidden", minWidth:"80px" }}>
            <div style={{
              width:`${pct}%`, height:"100%", borderRadius:"4px",
              background: complet ? "#10b981" : livree > 0 ? "#0ea5e9" : "#e2e8f0",
              transition:"width 0.5s ease"
            }} />
          </div>
          <span style={{ fontWeight:800, fontSize:"13px", color: complet?"#10b981":livree>0?"#0ea5e9":"#94a3b8", minWidth:"50px", textAlign:"right" }}>
            {livree} / {demande}
          </span>
        </div>
      </td>
      <td style={{ padding:"12px 16px", textAlign:"right" }}>
        <span style={{ fontWeight:700, fontSize:"13px", color: reste===0?"#10b981":"#f59e0b" }}>{reste}</span>
      </td>
      <td style={{ padding:"12px 16px", textAlign:"center" }}>
        {complet ? (
          <span style={{ display:"inline-flex", alignItems:"center", gap:"5px", padding:"3px 10px", borderRadius:"12px", background:"#dcfce7", color:"#15803d", fontSize:"11px", fontWeight:700 }}>
            <FaCheck size={9} /> Terminé
          </span>
        ) : livree > 0 ? (
          <span style={{ display:"inline-flex", alignItems:"center", gap:"5px", padding:"3px 10px", borderRadius:"12px", background:"#dbeafe", color:"#1d4ed8", fontSize:"11px", fontWeight:700 }}>
            <FaClock size={9} /> {pct}%
          </span>
        ) : (
          <span style={{ display:"inline-flex", alignItems:"center", gap:"5px", padding:"3px 10px", borderRadius:"12px", background:"#f1f5f9", color:"#94a3b8", fontSize:"11px", fontWeight:700 }}>
            En attente
          </span>
        )}
      </td>
    </tr>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function LivraisonList() {
  const { services }           = useContext(ServiceContext);
  const { showAlert, showConfirm } = useModal();

  // ── Workflow ──────────────────────────────────────────────────────────────
  const [etape,        setEtape]        = useState("AGENT");   // AGENT|SERVICE|SCAN|TERMINE
  const [agent,        setAgent]        = useState(null);
  const [service,      setService]      = useState(null);
  const [distribution, setDistribution] = useState(null);
  const [comparatif,   setComparatif]   = useState([]);
  const [historique,   setHistorique]   = useState([]);
  const [loading,      setLoading]      = useState(false);

  const [scanValue,    setScanValue]    = useState("");
  const [searchSvc,    setSearchSvc]    = useState("");

  const distributionRef = useRefMirror(distribution);

  const stats = useMemo(() => {
    const demande = comparatif.reduce((s,c) => s + Number(c.quantiteDemandee||0), 0);
    const livree  = comparatif.reduce((s,c) => s + Number(c.quantiteLivree||0), 0);
    const reste   = Math.max(0, demande - livree);
    const pct     = demande > 0 ? Math.round((livree/demande)*100) : 0;
    return { demande, livree, reste, pct };
  }, [comparatif]);

  const rafraichirComparatif = useCallback(async (distId) => {
    if (!distId) return;
    try {
      const res = await fetch(`${API}/api/distributions/${distId}/comparatif`);
      if (!res.ok) return;
      const data = await res.json();
      setComparatif(data);
      const dem = data.reduce((s,c)=>s+Number(c.quantiteDemandee||0),0);
      const liv = data.reduce((s,c)=>s+Number(c.quantiteLivree||0),0);
      if (dem > 0 && liv >= dem) {
        setEtape("TERMINE");
        showAlert("🎉 Distribution complète !", "Tous les articles livrés.", "success");
      }
    } catch {}
  }, [showAlert]);

  useEffect(() => {
    if (etape !== "SCAN" || !distribution?.id) return;
    const id = setInterval(() => rafraichirComparatif(distribution.id), 3000);
    return () => clearInterval(id);
  }, [etape, distribution, rafraichirComparatif]);

  const execScanAgent = useCallback(async (code) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/agents/matricule/${code}`);
      if (!res.ok) { showAlert("❌ Agent introuvable", code, "error"); return; }
      const ag = await res.json();
      setAgent(ag);
      setEtape("SERVICE");
      showAlert("✅ " + ag.nom, `(${ag.matricule})`, "success");
    } catch { showAlert("Erreur réseau","","error"); }
    finally { setLoading(false); }
  }, [showAlert]);

  
  
  const execCreerDistribution = useCallback(async (svc) => {
    setLoading(true);
    try {
      const payload = {
        serviceId:      svc.id,
        matriculeAgent: agent.matricule,
      };

      const res = await fetch(`${API}/api/distributions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const txt = await res.text();
        let msg = txt; try { msg = JSON.parse(txt).message || txt; } catch {}
        throw new Error(msg);
      }

      const dist = await res.json();
      setService(svc);
      setDistribution(dist);
      await rafraichirComparatif(dist.id);
      setEtape("SCAN");
      showAlert("🚀 Distribution créée", `#${dist.id} — Scannez les linges`, "success");
    } catch (err) {
      showAlert("❌ Erreur", err.message, "error");
    } finally { setLoading(false); }
  }, [agent, showAlert, rafraichirComparatif]);

const execScanService = useCallback(async (code) => {
  setLoading(true);

  try {
    const res = await fetch(
      `${API}/api/sqlserver/services/ref/${encodeURIComponent(code)}`
    );

    if (!res.ok) {
      showAlert("❌ Service introuvable", code, "error");
      return;
    }

    const svc = await res.json();
    await execCreerDistribution(svc);

  } catch (e) {
    console.error(e);
    showAlert("Erreur réseau", e.message, "error");
  } finally {
    setLoading(false);
  }
}, [execCreerDistribution, showAlert]);
  const execScanLinge = useCallback(async (code) => {
    const dist = distributionRef.current;
    if (!dist?.id) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${API}/api/distributions/${dist.id}/scan?codeOuTag=${encodeURIComponent(code)}`,
        { method: "POST" }
      );

      const heure = new Date().toLocaleTimeString("fr-FR", { hour:"2-digit", minute:"2-digit", second:"2-digit" });

      if (!res.ok) {
        const txt = await res.text();
        let msg = txt; try { msg = JSON.parse(txt).message || txt; } catch {}
        setHistorique(prev => [{ code, ok:false, msg, heure }, ...prev.slice(0,49)]);
        showAlert("❌ Scan refusé", msg, "error");
        return;
      }

      setHistorique(prev => [{ code, ok:true, heure }, ...prev.slice(0,49)]);
      showAlert("✅ Livré", `${code} → LIVRE`, "success");
      await rafraichirComparatif(dist.id);
    } catch (err) {
      showAlert("❗ Erreur réseau", err.message, "error");
    } finally { setLoading(false); }
  }, [distributionRef, showAlert, rafraichirComparatif]);

  const handleScan = useCallback(async (code) => {
    setScanValue("");
    if (etape === "AGENT")   { await execScanAgent(code);   return; }
    if (etape === "SERVICE") { await execScanService(code); return; }
    if (etape === "SCAN")    { await execScanLinge(code);   return; }
  }, [etape, execScanAgent, execScanService, execScanLinge]);

  const handleReset = async () => {
    const ok = await showConfirm("Réinitialiser ?", "La distribution en cours sera abandonnée.", "warning");
    if (!ok) return;
    setEtape("AGENT"); setAgent(null); setService(null);
    setDistribution(null); setComparatif([]); setHistorique([]);
    setScanValue(""); setSearchSvc("");
    showAlert("✅ Réinitialisé","","info");
  };

  const getPlaceholder = () => {
    if (etape === "AGENT")   return "👤 Scanner votre badge agent...";
    if (etape === "SERVICE") return "🏢 Scanner le code service...";
    if (etape === "SCAN")    return "📦 Scanner linge (code-barres ou RFID)...";
    return "Scanner...";
  };

  const getBorderColor = () => {
    if (etape === "SERVICE") return "#7c3aed";
    if (etape === "SCAN")    return "#0ea5e9";
    return "#e2e8f0";
  };

  const ETAPES = [
    { id:"AGENT",   label:"Agent",   done:!!agent       },
    { id:"SERVICE", label:"Service", done:!!service      },
    { id:"SCAN",    label:"Scan",    done:etape==="TERMINE" },
    { id:"TERMINE", label:"Terminé", done:false          },
  ];
  const servicesFiltres = useMemo(() =>
    services.filter(s => !searchSvc || s.nom?.toLowerCase().includes(searchSvc.toLowerCase()))
  , [services, searchSvc]);
  return (
    <div className="collecte-container">
      {/* Header */}
      <div className="page-header" style={{ marginBottom:0, textAlign:"left" }}>
        <h1 className="text-3xl font-extrabold" style={{ marginBottom:"4px" }}>🚚 Distribution aux Services</h1>
        <p className="text-sm" style={{ color:"#166d7c", marginBottom:"24px" }}>
        </p>
      </div>
      <div style={{ display:"grid", gridTemplateColumns: etape==="SCAN"||etape==="TERMINE" ? "1fr 400px" : "1fr", gap:"20px" }}>

        <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>

          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:"12px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
              <div style={{ background:"#dbeafe", width:"48px", height:"48px", borderRadius:"12px", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <FaTruck size={22} color="#0ea5e9" />
              </div>
              <div>
                <div style={{ fontWeight:700, color:"#1e3a8a", fontSize:"17px" }}>
                  {service ? service.nom : agent ? "Choisir le service" : "Distribution"}
                </div>
                <div style={{ fontSize:"12px", color:"#64748b", display:"flex", gap:"10px" }}>
                  {agent       && <span>👤 {agent.nom}</span>}
                  {distribution && <span style={{ color:"#7c3aed" }}>#{distribution.id}</span>}
                  {etape==="SCAN" && <span>📦 {stats.livree}/{stats.demande} livrés ({stats.pct}%)</span>}
                </div>
              </div>
            </div>
            {etape !== "AGENT" && (
              <button onClick={handleReset} style={{ padding:"8px 14px", border:"1px solid #e2e8f0", borderRadius:"10px", background:"white", color:"#64748b", cursor:"pointer", fontSize:"13px", fontWeight:500 }}>
                Reset
              </button>
            )}
          </div>

        

          {/* ── Zone scan ── */}
          <Card style={{ border:`2px dashed ${getBorderColor()}`, background: etape==="SERVICE"?"#faf5ff": etape==="SCAN"?"#f0f9ff":"#f8fafc" }}>
            <CardContent className="p-5">
              <ScanInput
                placeholder={getPlaceholder()}
                value={scanValue}
                onChange={setScanValue}
                onSubmit={handleScan}
                borderColor={getBorderColor()}
                keepFocus={etape !== "TERMINE"}
                autoDebounce={true}
                disabled={loading || etape === "TERMINE"}
              />
              {loading && (
                <div style={{ marginTop:"8px", display:"flex", alignItems:"center", gap:"8px", fontSize:"12px", color:"#64748b" }}>
                  <FaSpinner style={{ animation:"spin 1s linear infinite" }} /> Traitement en cours...
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── ÉTAPE SERVICE : grille services ── */}
          {etape === "SERVICE" && (
            <Card style={{ border:"1px solid #e2e8f0" }}>
              <CardContent className="p-5">
                <div style={{ fontSize:"13px", fontWeight:600, color:"#64748b", marginBottom:"10px", display:"flex", alignItems:"center", gap:"6px" }}>
                  <FaBuilding size={12} /> Ou choisissez un service directement
                </div>
                <div style={{ position:"relative", marginBottom:"10px" }}>
                  <FaSearch size={12} style={{ position:"absolute", left:"12px", top:"50%", transform:"translateY(-50%)", color:"#9ca3af" }} />
                  <input type="text" placeholder="Rechercher..." value={searchSvc} onChange={e => setSearchSvc(e.target.value)}
                    style={{ width:"100%", padding:"8px 12px 8px 32px", borderRadius:"8px", border:"1px solid #e2e8f0", fontSize:"13px", outline:"none", boxSizing:"border-box" }} />
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:"8px", maxHeight:"220px", overflowY:"auto" }}>
                  {servicesFiltres.map(svc => (
                    <button key={svc.id} onClick={() => execCreerDistribution(svc)} disabled={loading}
                      style={{ padding:"10px 14px", borderRadius:"10px", border:"1.5px solid #e2e8f0", background:"white", cursor:loading?"not-allowed":"pointer", textAlign:"left", fontWeight:600, fontSize:"12px", color:"#0f172a", transition:"all 0.15s" }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor="#7c3aed"; e.currentTarget.style.background="#faf5ff"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor="#e2e8f0"; e.currentTarget.style.background="white"; }}>
                      🏥 {svc.code}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── ÉTAPE SCAN : historique scans ── */}
          {etape === "SCAN" && historique.length > 0 && (
            <Card style={{ border:"1px solid #e2e8f0" }}>
              <CardContent className="p-4">
                <div style={{ fontWeight:600, fontSize:"13px", color:"#64748b", marginBottom:"10px", display:"flex", justifyContent:"space-between" }}>
                  <span>📋 Derniers scans</span>
                  <button onClick={() => setHistorique([])} style={{ background:"none", border:"none", color:"#94a3b8", cursor:"pointer", fontSize:"12px" }}>Effacer</button>
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:"6px", maxHeight:"100px", overflowY:"auto" }}>
                  {historique.slice(0,20).map((h,i) => (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:"5px", padding:"3px 10px", borderRadius:"10px", fontSize:"11px", fontWeight:600, background: h.ok?"#dcfce7":"#fee2e2", color: h.ok?"#15803d":"#dc2626", border:`1px solid ${h.ok?"#bbf7d0":"#fecaca"}` }}>
                      {h.ok ? <FaCheck size={9}/> : <FaTimes size={9}/>}
                      <code>{h.code}</code>
                      <span style={{ opacity:0.6 }}>{h.heure}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── ÉTAPE TERMINÉ ── */}
          {etape === "TERMINE" && (
            <Card style={{ background:"#f0fdf4", border:"2px solid #22c55e" }}>
              <CardContent className="p-8" style={{ textAlign:"center" }}>
                <div style={{ fontSize:"56px", marginBottom:"12px" }}>✅</div>
                <div style={{ fontWeight:800, fontSize:"20px", color:"#15803d", marginBottom:"8px" }}>Distribution complète !</div>
                <div style={{ color:"#64748b", marginBottom:"24px", fontSize:"14px" }}>
                  {stats.livree} article(s) livrés au service <strong>{service?.nom}</strong>
                </div>
                <button onClick={handleReset} style={{ padding:"12px 28px", borderRadius:"10px", border:"none", background:"linear-gradient(135deg,#10b981,#059669)", color:"white", fontWeight:700, cursor:"pointer", fontSize:"15px" }}>
                  Nouvelle distribution →
                </button>
              </CardContent>
            </Card>
          )}

          {/* ── État d'attente ── */}
          {etape === "AGENT" && (
            <Card style={{ border:"2px dashed #e2e8f0" }}>
              <CardContent style={{ textAlign:"center", padding:"48px 20px", color:"#94a3b8" }}>
                <div style={{ fontSize:"48px", marginBottom:"12px" }}>👤</div>
                <div style={{ fontSize:"14px", fontWeight:500 }}>Scannez votre badge agent</div>
                <div style={{ fontSize:"12px", marginTop:"4px" }}>Pour démarrer une distribution</div>
              </CardContent>
            </Card>
          )}

          {/* Footer */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingTop:"12px", borderTop:"1px solid #e2e8f0", fontSize:"12px", color:"#64748b", flexWrap:"wrap", gap:"8px" }}>
            <div style={{ display:"flex", gap:"14px" }}>
              {agent       && <span>👤 <strong>{agent.nom}</strong></span>}
              {service     && <span>🏥 <strong>{service.nom}</strong></span>}
              {distribution && <span style={{ color:"#7c3aed" }}>Distribution <strong>#{distribution.id}</strong></span>}
            </div>
            <Badge variant="outline" style={{ fontSize:"11px" }}>📍 {etape}</Badge>
          </div>
        </div>

        {/* ── Colonne droite : comparatif (SCAN + TERMINE) ── */}
        {(etape === "SCAN" || etape === "TERMINE") && (
          <div style={{ position:"sticky", top:"20px", alignSelf:"start" }}>
            <Card style={{ border:"1px solid #e2e8f0", overflow:"hidden" }}>
              {/* Header comparatif */}
              <div style={{ padding:"14px 18px", background:"linear-gradient(135deg,#0ea5e9,#0284c7)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ display:"flex", alignItems:"center", gap:"8px", color:"white" }}>
                  <FaBoxes size={16} />
                  <span style={{ fontWeight:700, fontSize:"14px" }}>Comparatif temps réel</span>
                </div>
                {distribution?.id && <Badge style={{ background:"rgba(255,255,255,0.2)", color:"white", border:"none", fontSize:"11px" }}>#{distribution.id}</Badge>}
              </div>

              {/* Barre globale */}
              <div style={{ padding:"14px 18px", background:"#f0f9ff", borderBottom:"1px solid #e0f2fe" }}>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:"12px", fontWeight:600, marginBottom:"6px" }}>
                  <span style={{ color:"#0284c7" }}>Avancement global</span>
                  <span style={{ color: stats.pct===100?"#10b981":"#0284c7" }}>
                    {stats.livree} / {stats.demande} — {stats.pct}%
                  </span>
                </div>
                <div style={{ height:"10px", background:"#e0f2fe", borderRadius:"5px", overflow:"hidden" }}>
                  <div style={{
                    width:`${stats.pct}%`, height:"100%", borderRadius:"5px",
                    background: stats.pct===100?"#10b981":"linear-gradient(90deg,#0ea5e9,#0284c7)",
                    transition:"width 0.5s ease"
                  }} />
                </div>
                {stats.reste > 0 && (
                  <div style={{ fontSize:"11px", color:"#64748b", marginTop:"4px" }}>
                    Reste : <strong style={{ color:"#f59e0b" }}>{stats.reste}</strong> article(s)
                  </div>
                )}
              </div>

              {/* Tableau */}
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead>
                    <tr style={{ background:"#f8fafc" }}>
                      {["Catégorie","Collecté","Demandé","Livré","Reste","État"].map(h => (
                        <th key={h} style={{ padding:"10px 14px", textAlign: h==="Catégorie"?"left":"right", fontSize:"11px", fontWeight:700, color:"#64748b", whiteSpace:"nowrap", borderBottom:"1px solid #e2e8f0" }}>
                          {h==="Livré" ? <span style={{ color:"#0ea5e9" }}>{h}</span> : h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {comparatif.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign:"center", padding:"32px", color:"#94a3b8", fontSize:"13px" }}>
                          <FaBoxes size={28} style={{ opacity:0.2, marginBottom:"8px" }} />
                          <div>Chargement...</div>
                        </td>
                      </tr>
                    ) : (
                      comparatif.map(item => <LigneComparatif key={item.categorie} item={item} />)
                    )}
                  </tbody>
                  {comparatif.length > 0 && (
                    <tfoot>
                      <tr style={{ background:"#f8fafc", borderTop:"2px solid #e2e8f0" }}>
                        <td style={{ padding:"10px 16px", fontWeight:800, fontSize:"13px" }}>Total</td>
                        <td style={{ padding:"10px 14px", textAlign:"right", fontSize:"13px", color:"#64748b" }}>—</td>
                        <td style={{ padding:"10px 14px", textAlign:"right", fontWeight:800, fontSize:"13px" }}>{stats.demande}</td>
                        <td style={{ padding:"10px 14px", textAlign:"right" }} colSpan={1}>
                          <span style={{ fontWeight:800, fontSize:"14px", color:"#0ea5e9" }}>{stats.livree}</span>
                        </td>
                        <td style={{ padding:"10px 14px", textAlign:"right", fontWeight:800, color:"#f59e0b", fontSize:"13px" }}>{stats.reste}</td>
                        <td style={{ padding:"10px 14px", textAlign:"right" }}>
                          {stats.pct === 100 ? (
                            <span style={{ padding:"4px 10px", borderRadius:"10px", background:"#dcfce7", color:"#15803d", fontSize:"11px", fontWeight:700 }}>✅ Terminé</span>
                          ) : (
                            <span style={{ padding:"4px 10px", borderRadius:"10px", background:"#dbeafe", color:"#1d4ed8", fontSize:"11px", fontWeight:700 }}>{stats.pct}%</span>
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </Card>
          </div>
        )}
      </div>

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
