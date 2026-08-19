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

function useRefMirror(v) {
  const r = useRef(v);
  useEffect(() => { r.current = v; }, [v]);
  return r;
}

function LigneComparatif({ item }) {
  const c       = cat(item.categorie);
  const livree  = Number(item.quantiteLivree  || 0);
  const demande = Number(item.quantiteDemandee || 0);
  const reste   = Math.max(0, demande - livree);
  const pct     = demande > 0 ? Math.min(Math.round((livree / demande) * 100), 100) : 0;
  const complet = livree >= demande && demande > 0;

  return (
    <tr style={{ borderBottom:"1px solid #f1f5f9" }}>
      <td style={{ padding:"10px 14px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
          <span style={{ fontSize:"18px" }}>{c.emoji}</span>
          <span style={{ fontWeight:600, fontSize:"13px", color:"#0f172a" }}>{c.label}</span>
        </div>
      </td>
      <td style={{ padding:"10px 14px", textAlign:"right", fontSize:"13px", color:"#64748b" }}>
        {item.quantiteCollectee ?? "—"}
      </td>
      <td style={{ padding:"10px 14px", textAlign:"right", fontSize:"13px", fontWeight:600, color:"#0f172a" }}>
        {demande}
      </td>
      <td style={{ padding:"10px 14px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
          <div style={{ flex:1, height:"6px", background:"#f1f5f9", borderRadius:"3px", overflow:"hidden", minWidth:"60px" }}>
            <div style={{
              width:`${pct}%`, height:"100%", borderRadius:"3px",
              background: complet ? "#10b981" : "#0ea5e9",
              transition:"width 0.5s ease"
            }} />
          </div>
          <span style={{ fontWeight:700, fontSize:"12px", color: complet?"#10b981":"#0f172a", minWidth:"40px", textAlign:"right" }}>
            {livree}
          </span>
        </div>
      </td>
      <td style={{ padding:"10px 14px", textAlign:"right", fontWeight:600, fontSize:"13px", color: reste===0?"#10b981":"#f59e0b" }}>
        {reste}
      </td>
      <td style={{ padding:"10px 14px", textAlign:"center" }}>
        {complet ? (
          <span style={{ padding:"2px 10px", borderRadius:"10px", background:"#dcfce7", color:"#15803d", fontSize:"11px", fontWeight:600 }}>
            Terminé
          </span>
        ) : livree > 0 ? (
          <span style={{ padding:"2px 10px", borderRadius:"10px", background:"#dbeafe", color:"#1d4ed8", fontSize:"11px", fontWeight:600 }}>
            {pct}%
          </span>
        ) : (
          <span style={{ padding:"2px 10px", borderRadius:"10px", background:"#f1f5f9", color:"#94a3b8", fontSize:"11px", fontWeight:600 }}>
            Attente
          </span>
        )}
      </td>
    </tr>
  );
}

// ─── Composant StatCard ──────────────────────────────────────────────────────
function StatCard({ value, label, color, subValue }) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "12px 16px",
      borderRadius: "10px",
      background: "white",
      border: `1px solid ${color}33`,
      textAlign: "center",
      minWidth: "80px"
    }}>
      <span style={{
        fontSize: "24px",
        fontWeight: 800,
        color: color,
        lineHeight: 1.2
      }}>
        {value}
      </span>
      {subValue && (
        <span style={{
          fontSize: "11px",
          color: "#94a3b8",
          fontWeight: 400,
          marginTop: "2px"
        }}>
          {subValue}
        </span>
      )}
      <span style={{
        fontSize: "11px",
        color: "#64748b",
        fontWeight: 500,
        marginTop: "2px"
      }}>
        {label}
      </span>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function LivraisonList() {
  const { services }           = useContext(ServiceContext);
  const { showAlert, showConfirm } = useModal();

  const [etape,        setEtape]        = useState("AGENT");   
  const [agent,        setAgent]        = useState(null);
  const [service,      setService]      = useState(null);
  const [distribution, setDistribution] = useState(null);
  const [comparatif,   setComparatif]   = useState([]);
  const [historique,   setHistorique]   = useState([]);
  const [loading,      setLoading]      = useState(false);

  const [scanValue,    setScanValue]    = useState("");
  const [searchSvc,    setSearchSvc]    = useState("");
  const [isFocused,    setIsFocused]    = useState(true);

  const distributionRef = useRefMirror(distribution);
  const scanTimeoutRef = useRef(null);
  const scanInputRef = useRef(null);

  // ─── Debounce scan automatique ────────────────────────────────────────────
  useEffect(() => {
    if (scanValue.trim().length < 2) return;
    
    clearTimeout(scanTimeoutRef.current);
    scanTimeoutRef.current = setTimeout(() => {
      const code = scanValue.trim();
      setScanValue("");
      handleScan(code);
    }, 300);

    return () => clearTimeout(scanTimeoutRef.current);
  }, [scanValue]);

  // ─── Focus permanent ──────────────────────────────────────────────────────
  useEffect(() => {
    const keepFocus = () => {
      if (scanInputRef.current && !document.querySelector('[data-modal="true"]')) {
        scanInputRef.current.focus();
      }
    };
    const id = setInterval(keepFocus, 500);
    keepFocus();
    return () => clearInterval(id);
  }, []);

  const stats = useMemo(() => {
    const demande = comparatif.reduce((s,c) => s + Number(c.quantiteDemandee||0), 0);
    const livree  = comparatif.reduce((s,c) => s + Number(c.quantiteLivree||0), 0);
    const reste   = Math.max(0, demande - livree);
    const pct     = demande > 0 ? Math.round((livree/demande)*100) : 0;
    return { demande, livree, reste, pct };
  }, [comparatif]);

  // ─── Rafraîchissement périodique ──────────────────────────────────────────
  useEffect(() => {
    if (etape !== "SCAN" || !distribution?.id) return;
    const id = setInterval(() => rafraichirComparatif(distribution.id), 3000);
    return () => clearInterval(id);
  }, [etape, distribution]);

  const rafraichirComparatif = useCallback(async (distId) => {
    if (!distId) return;
    try {
      const res = await fetch(`${API}/api/distributions/${distId}/comparatif`);
      if (!res.ok) return;
      const data = await res.json();
      setComparatif(data);
      
      // Vérifier si tous les articles sont livrés
      const dem = data.reduce((s,c) => s + Number(c.quantiteDemandee||0), 0);
      const liv = data.reduce((s,c) => s + Number(c.quantiteLivree||0), 0);
      if (dem > 0 && liv >= dem) {
        showAlert("Distribution terminée", `✅ Tous les articles du service ${service?.nom} sont livrés`, "success");
        setEtape("SERVICE");
        setDistribution(null);
        setComparatif([]);
        setHistorique([]);
        setService(null);
      }
    } catch {}
  }, [service, showAlert]);

  // ─── Vérifier si un code est un agent ─────────────────────────────────────
  const verifierSiAgent = useCallback(async (code) => {
    try {
      const res = await fetch(`${API}/api/agents/matricule/${code}`);
      if (res.ok) {
        const ag = await res.json();
        return ag;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  // ─── Scan Agent ─────────────────────────────────────────────────────────────
  const execScanAgent = useCallback(async (code) => {
    setLoading(true);
    try {
      // Si une distribution est en cours, la clôturer
      if (distributionRef.current?.id) {
        showAlert(
          "Distribution terminée", 
          `✅ Distribution #${distributionRef.current.id} pour le service ${service?.nom || ''} est terminée`,
          "success"
        );
        setDistribution(null);
        setComparatif([]);
        setHistorique([]);
        setService(null);
      }

      const res = await fetch(`${API}/api/agents/matricule/${code}`);
      if (!res.ok) { 
        showAlert("Agent introuvable", code, "error"); 
        setLoading(false);
        return; 
      }
      
      const ag = await res.json();
      setAgent(ag);
      setEtape("SERVICE");
      showAlert("Agent identifié", ag.nom, "success");
      
    } catch (err) {
      showAlert("Erreur réseau", err.message, "error");
    } finally { 
      setLoading(false); 
    }
  }, [distributionRef, service, showAlert]);

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
      showAlert("Distribution créée", `Scannez les articles pour ${svc.nom}`, "success");
    } catch (err) {
      showAlert("Erreur", err.message, "error");
    } finally { setLoading(false); }
  }, [agent, showAlert, rafraichirComparatif]);

  const execScanService = useCallback(async (code) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/sqlserver/services/ref/${encodeURIComponent(code)}`);
      if (!res.ok) {
        showAlert("Service introuvable", code, "error");
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
        showAlert("Scan refusé", msg, "error");
        return;
      }

      setHistorique(prev => [{ code, ok:true, heure }, ...prev.slice(0,49)]);
      showAlert("Article livré", code, "success");
      await rafraichirComparatif(dist.id);
    } catch (err) {
      showAlert("Erreur réseau", err.message, "error");
    } finally { setLoading(false); }
  }, [distributionRef, showAlert, rafraichirComparatif]);

  // ─── Gestion du scan ──────────────────────────────────────────────────────
  const handleScan = useCallback(async (code) => {
    if (!code) return;
    
    // Étape AGENT : scan d'un agent
    if (etape === "AGENT") {
      await execScanAgent(code);
      return;
    }
    
    // Étape SERVICE : scan d'un service
    if (etape === "SERVICE") {
      await execScanService(code);
      return;
    }
    
    // Étape SCAN : on scanne normalement des articles
    if (etape === "SCAN") {
      // Vérifier si le code scanné est un agent
      const agentTrouve = await verifierSiAgent(code);
      
      if (agentTrouve) {
        // C'est un agent → clôturer la distribution et changer d'agent
        await execScanAgent(code);
      } else {
        // C'est un article → le livrer
        await execScanLinge(code);
      }
      return;
    }
  }, [etape, execScanAgent, execScanService, execScanLinge, verifierSiAgent]);

  const handleReset = async () => {
    const ok = await showConfirm("Réinitialiser", "La distribution en cours sera abandonnée.", "warning");
    if (!ok) return;
    setEtape("AGENT"); setAgent(null); setService(null);
    setDistribution(null); setComparatif([]); setHistorique([]);
    setScanValue(""); setSearchSvc("");
    showAlert("Réinitialisé", "", "info");
  };

  const getPlaceholder = () => {
    if (etape === "AGENT")   return "Scanner le badge agent...";
    if (etape === "SERVICE") return "Scanner le code service...";
    if (etape === "SCAN")    return "Scanner un article à livrer...";
    return "Scanner...";
  };

  const servicesFiltres = useMemo(() =>
    services.filter(s => !searchSvc || s.nom?.toLowerCase().includes(searchSvc.toLowerCase()))
  , [services, searchSvc]);

  return (
    <div className="collecte-container">

      {/* ── Header ── */}
      <div className="page-header" style={{ marginBottom: 2, textAlign: "left" }}>
        <h1 className="text-3xl font-extrabold" style={{ marginBottom: "4px" }}>
          🚚 Distribution
        </h1>
      </div>

      <div
        className="collecte-panel-grand"
        style={{
          background: "white",
          borderRadius: "20px",
          padding: "32px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
          minHeight: "600px"
        }}
      >

        {/* ── Barre d'info ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ background: "#dbeafe", width: "48px", height: "48px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FaTruck size={18} color="#0ea5e9" />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: "#1e3a8a", fontSize: "20px" }}>
                {service ? service.nom : "Distribution aux services"}
              </div>
              <div style={{ fontSize: "13px", color: "#64748b" }}>
                {agent && <span>Agent: <strong>{agent.nom}</strong></span>}
                {distribution && <span style={{ marginLeft: "12px" }}>Distribution #{distribution.id}</span>}
                {etape === "SCAN" && <span style={{ marginLeft: "12px" }}>{stats.livree}/{stats.demande} livrés</span>}
              </div>
            </div>
          </div>
          {etape !== "AGENT" && (
            <button onClick={handleReset} style={btnStyle}>
              Réinitialiser
            </button>
          )}
        </div>

        {/* ── Stats ── */}
        {(etape === "SCAN" || etape === "SERVICE") && (
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", 
            gap: "12px", 
            marginBottom: "20px", 
            padding: "16px", 
            background: "#f8fafc", 
            borderRadius: "12px", 
            border: "1px solid #e2e8f0" 
          }}>
            <StatCard 
              value={stats.demande || 0} 
              label="Demandé" 
              color="#0ea5e9" 
            />
            <StatCard 
              value={stats.livree || 0} 
              label="Livré" 
              color="#10b981"
              subValue={stats.pct > 0 ? `${stats.pct}%` : ""}
            />
            <StatCard 
              value={stats.reste || 0} 
              label="Reste" 
              color="#f59e0b" 
            />
            <StatCard 
              value={`${stats.pct || 0}%`}
              label="Avancement" 
              color="#8b5cf6"
              subValue={stats.pct === 100 ? "✅ Terminé" : ""}
            />
          </div>
        )}

        {/* ── Zone scan ── */}
        <div style={{ display: "flex", gap: "16px", marginBottom: "24px", flexWrap: "wrap", padding: "20px", background: "#f8fafc", borderRadius: "12px", border: agent ? "2px solid #22c55e" : "2px dashed #e2e8f0" }}>
          <div style={{ flex: 1, minWidth: "300px" }}>
            <div style={{ position: "relative", width: "100%" }}>
              <div style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}>
                {etape === "AGENT" ? <FaUser size={18} /> : etape === "SERVICE" ? <FaBuilding size={18} /> : <FaBarcode size={18} />}
              </div>
              <input
                ref={scanInputRef}
                type="text"
                placeholder={getPlaceholder()}
                value={scanValue}
                onChange={e => setScanValue(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "16px 16px 16px 48px",
                  borderRadius: "10px",
                  border: `2px solid ${isFocused ? "#0ea5e9" : "#e2e8f0"}`,
                  fontSize: "16px",
                  background: loading ? "#f1f5f9" : "white",
                  transition: "all 0.2s",
                  outline: "none",
                  boxShadow: isFocused ? "0 0 0 3px rgba(14,165,233,0.1)" : "none",
                  cursor: loading ? "not-allowed" : "text",
                  boxSizing: "border-box"
                }}
                autoFocus
              />
              {scanValue && (
                <button
                  type="button"
                  onClick={() => setScanValue("")}
                  style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: "8px" }}
                >
                  <FaTimes size={16} />
                </button>
              )}
            </div>

            <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#94a3b8" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: isFocused ? "#10b981" : "#9ca3af", transition: "background 0.3s" }} />
              <span>Lecteur: {isFocused ? "Prêt" : "Inactif"}</span>
              {loading && <span style={{ marginLeft: "16px", color: "#0ea5e9" }}>Traitement...</span>}
              <span style={{ marginLeft: "16px" }}>
                {etape === "AGENT" ? "Agent" : etape === "SERVICE" ? "Service" : "Article"}
              </span>
              {distribution && etape === "SCAN" && (
                <span style={{ marginLeft: "16px", color: "#7c3aed" }}>
                  Distribution #{distribution.id}
                </span>
              )}
              {etape === "SCAN" && (
                <span style={{ marginLeft: "16px", color: "#f59e0b", fontSize: "11px" }}>
                  (scan agent = clôture)
                </span>
              )}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ padding: "8px 16px", borderRadius: "10px", background: agent ? "#dcfce7" : "#f1f5f9", color: agent ? "#15803d" : "#94a3b8", fontSize: "14px", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
              {agent ? <FaCheck size={14} color="#22c55e" /> : <FaTimes size={14} />}
              {agent ? agent.nom : "Déconnecté"}
            </div>
            <div style={{ padding: "8px 16px", borderRadius: "10px", background: "#f1f5f9", color: "#64748b", fontSize: "13px", fontWeight: 500 }}>
              {etape === "AGENT" ? "👤 Agent" : etape === "SERVICE" ? "🏢 Service" : etape === "SCAN" ? "📦 Scan" : "✅ Terminé"}
            </div>
          </div>
        </div>

        {/* ── Étape SERVICE : liste des services ── */}
        {etape === "SERVICE" && (
          <div style={{ background: "#faf5ff", borderRadius: "12px", padding: "16px", border: "1px solid #e2e8f0", marginBottom: "20px" }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "#64748b", marginBottom: "10px" }}>
              Choisir un service pour la distribution
            </div>
            <div style={{ position: "relative", marginBottom: "12px" }}>
              <FaSearch size={12} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchSvc}
                onChange={e => setSearchSvc(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px 10px 36px",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  fontSize: "14px",
                  outline: "none",
                  boxSizing: "border-box"
                }}
              />
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", maxHeight: "200px", overflowY: "auto" }}>
              {servicesFiltres.map(svc => (
                <button
                  key={svc.id}
                  onClick={() => execCreerDistribution(svc)}
                  disabled={loading}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    background: "white",
                    cursor: loading ? "not-allowed" : "pointer",
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "#0f172a",
                    transition: "all 0.15s"
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = "#7c3aed";
                    e.currentTarget.style.background = "#faf5ff";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = "#e2e8f0";
                    e.currentTarget.style.background = "white";
                  }}
                >
                  {svc.code}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Historique des scans ── */}
        {etape === "SCAN" && historique.length > 0 && (
          <div style={{ background: "#f8fafc", borderRadius: "12px", padding: "16px", border: "1px solid #e2e8f0", marginBottom: "20px" }}>
            <div style={{ fontWeight: 600, fontSize: "13px", color: "#64748b", marginBottom: "10px", display: "flex", justifyContent: "space-between" }}>
              <span>Derniers scans</span>
              <button onClick={() => setHistorique([])} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "12px" }}>
                Effacer
              </button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", maxHeight: "80px", overflowY: "auto" }}>
              {historique.slice(0,20).map((h,i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "2px 10px",
                    borderRadius: "8px",
                    fontSize: "11px",
                    fontWeight: 500,
                    background: h.ok ? "#dcfce7" : "#fee2e2",
                    color: h.ok ? "#15803d" : "#dc2626",
                    border: `1px solid ${h.ok ? "#bbf7d0" : "#fecaca"}`
                  }}
                >
                  {h.ok ? <FaCheck size={8} /> : <FaTimes size={8} />}
                  <code>{h.code}</code>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Étape AGENT : état d'attente ── */}
        {etape === "AGENT" && (
          <div style={{
            textAlign: "center",
            padding: "40px 20px",
            color: "#94a3b8",
            border: "2px dashed #e2e8f0",
            borderRadius: "12px",
            marginBottom: "20px"
          }}>
            <div style={{ fontSize: "40px", marginBottom: "8px" }}>👤</div>
            <div style={{ fontSize: "14px", fontWeight: 500, color: "#64748b" }}>
              Scannez votre badge agent
            </div>
            <div style={{ fontSize: "12px", color: "#94a3b8" }}>
              Pour démarrer une distribution
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "16px", borderTop: "1px solid #e2e8f0", fontSize: "12px", color: "#64748b", flexWrap: "wrap", gap: "8px" }}>
          <div style={{ display: "flex", gap: "16px" }}>
            {agent && <span>Agent: <strong style={{ color: "#0f172a" }}>{agent.nom}</strong></span>}
            {service && <span>Service: <strong style={{ color: "#0f172a" }}>{service.nom}</strong></span>}
            {distribution && <span style={{ color: "#7c3aed" }}>Distribution #{distribution.id}</span>}
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <span>{new Date().toLocaleDateString("fr-FR")}</span>
            <span>•</span>
            <span>{new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
          </div>
        </div>

      </div>

      {/* ── Comparatif ── */}
      {(etape === "SCAN" || etape === "SERVICE") && comparatif.length > 0 && (
        <div style={{
          marginTop: "24px",
          background: "white",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          overflow: "hidden"
        }}>
          <div style={{
            padding: "12px 16px",
            background: "#f8fafc",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <span style={{ fontWeight: 600, fontSize: "14px", color: "#0f172a" }}>
              Comparatif
            </span>
            <span style={{ fontSize: "12px", color: "#64748b" }}>
              {stats.livree} / {stats.demande} ({stats.pct}%)
            </span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600, color: "#64748b", borderBottom: "1px solid #e2e8f0" }}>Catégorie</th>
                  <th style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600, color: "#64748b", borderBottom: "1px solid #e2e8f0" }}>Collecté</th>
                  <th style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600, color: "#64748b", borderBottom: "1px solid #e2e8f0" }}>Demandé</th>
                  <th style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600, color: "#64748b", borderBottom: "1px solid #e2e8f0" }}>Livré</th>
                  <th style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600, color: "#64748b", borderBottom: "1px solid #e2e8f0" }}>Reste</th>
                  <th style={{ padding: "8px 12px", textAlign: "center", fontWeight: 600, color: "#64748b", borderBottom: "1px solid #e2e8f0" }}>État</th>
                </tr>
              </thead>
              <tbody>
                {comparatif.map(item => (
                  <LigneComparatif key={item.categorie} item={item} />
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: "#f8fafc", borderTop: "2px solid #e2e8f0" }}>
                  <td style={{ padding: "8px 12px", fontWeight: 700 }}>Total</td>
                  <td style={{ padding: "8px 12px", textAlign: "right", color: "#64748b" }}>—</td>
                  <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700 }}>{stats.demande}</td>
                  <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, color: "#0ea5e9" }}>{stats.livree}</td>
                  <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, color: "#f59e0b" }}>{stats.reste}</td>
                  <td style={{ padding: "8px 12px", textAlign: "center" }}>
                    {stats.pct === 100 ? (
                      <span style={{ padding: "2px 10px", borderRadius: "8px", background: "#dcfce7", color: "#15803d", fontSize: "11px", fontWeight: 600 }}>Terminé</span>
                    ) : (
                      <span style={{ padding: "2px 10px", borderRadius: "8px", background: "#dbeafe", color: "#1d4ed8", fontSize: "11px", fontWeight: 600 }}>{stats.pct}%</span>
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}

const btnStyle = {
  padding: "8px 20px",
  border: "1px solid #e2e8f0",
  borderRadius: "10px",
  background: "white",
  color: "#64748b",
  cursor: "pointer",
  fontSize: "13px",
  fontWeight: 500,
  display: "flex",
  alignItems: "center",
  gap: "6px"
};