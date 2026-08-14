/**
 * CollageListService.jsx — Collecte SERVICE
 * Utilise DialogCategorie existant pour la déclaration des linges infectés.
 *
 * FLUX :
 *   AGENT → SERVICE → BAC BLANC → SCAN LINGES
 *   Pour infectés : bouton → DialogCategorie (sélection image) → saisir quantité → scan bac rouge → valider
 */
import React, { useState, useRef, useCallback, useEffect } from "react";
import { useModal } from "../../../contextes/ModalContext";
import {
  FaUser, FaTimes, FaBiohazard, FaCheckCircle, FaCheck,
  FaExclamationTriangle, FaSpinner, FaRedo, FaPlus, FaMinus,
  FaCheckDouble, FaArrowRight, FaArrowLeft
} from "react-icons/fa";
import { Card, CardContent } from "../../../components/ui/card";
import { Badge }             from "../../../components/ui/badge";
import ScanInput             from "../../../components/utils/shared/ScanInput";
import EtapesStepper         from "../../../components/utils/shared/EtapesStepper";
import DialogCategorie       from "../../../components/utils/collecte/DialogCategorie";
import { cat, ST_COLORS, apiCall } from "../collecteUtils";
import "../../Linge/WorkflowList.css";

const API = "http://localhost:8082";


function DlgSacInfecte({ visible, collecteId, onValider, onClose }) {
  const [etape,    setEtape]    = useState("CATEGORIE"); 
  const [catChoisie, setCatChoisie] = useState(null);  
  const [quantite, setQuantite] = useState(1);
  const [codeBac,  setCodeBac]  = useState("");
  const [bacId,    setBacId]    = useState(null);
  const [bacErr,   setBacErr]   = useState("");
  const [loading,  setLoading]  = useState(false);

  // Reset à chaque ouverture
  useEffect(() => {
    if (visible) {
      setEtape("CATEGORIE");
      setCatChoisie(null);
      setQuantite(1);
      setCodeBac("");
      setBacId(null);
      setBacErr("");
    }
  }, [visible]);

  if (!visible) return null;

  if (etape === "CATEGORIE") {
    return (
      <DialogCategorie
        onChoisir={(c) => {
          setCatChoisie(c);
          setEtape("QUANTITE");
        }}
        onFermer={onClose}
      />
    );
  }

  if (etape === "QUANTITE") {
    return (
      <div data-modal="true" style={{
        position:"fixed", inset:0, background:"rgba(0,0,0,0.55)",
        display:"flex", alignItems:"center", justifyContent:"center",
        zIndex:9999, backdropFilter:"blur(4px)"
      }}>
        <div style={{
          background:"white", borderRadius:22, padding:28,
          maxWidth:380, width:"95%",
          boxShadow:"0 24px 80px rgba(0,0,0,0.25)"
        }}>
          {/* Header */}
          <div style={{ display:"flex", justifyContent:"space-between",
            alignItems:"center", marginBottom:22 }}>
            <div style={{ display:"flex", alignItems:"center", gap:11 }}>
              <div style={{ width:44, height:44, borderRadius:"50%",
                background: catChoisie.bg,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:22 }}>
                {catChoisie.emoji}
              </div>
              <div>
                <div style={{ fontWeight:800, fontSize:16, color:"#1e293b" }}>
                  {catChoisie.label}
                </div>
                <div style={{ fontSize:11, color:"#64748b" }}>
                  Combien de {catChoisie.label.toLowerCase()}s infectés ?
                </div>
              </div>
            </div>
            <button onClick={onClose} style={{ background:"#f1f5f9", border:"none",
              borderRadius:"50%", width:32, height:32, cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center" }}>
              <FaTimes size={13} color="#64748b"/>
            </button>
          </div>

          <div style={{ display:"flex", gap:6, marginBottom:24 }}>
            {["CATEGORIE","QUANTITE","BAC"].map((e,i) => (
              <div key={e} style={{ flex:1, height:4, borderRadius:2,
                background: i <= 1 ? catChoisie.color : "#f1f5f9",
                transition:"background .3s" }}/>
            ))}
          </div>

          {/* Sélecteur quantité */}
          <div style={{ display:"flex", alignItems:"center",
            justifyContent:"center", gap:20, marginBottom:28 }}>
            <button
              onClick={() => setQuantite(q => Math.max(1, q-1))}
              style={{ width:52, height:52, borderRadius:"50%",
                border:`2px solid ${catChoisie.border}`,
                background: catChoisie.bg, cursor:"pointer",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:22, fontWeight:900, color:catChoisie.color }}>
              −
            </button>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:56, fontWeight:900, color:catChoisie.color,
                lineHeight:1 }}>{quantite}</div>
              <div style={{ fontSize:12, color:"#94a3b8", marginTop:4 }}>
                {catChoisie.label}{quantite > 1 ? "s" : ""}
              </div>
            </div>
            <button
              onClick={() => setQuantite(q => q+1)}
              style={{ width:52, height:52, borderRadius:"50%",
                border:`2px solid ${catChoisie.border}`,
                background: catChoisie.bg, cursor:"pointer",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:22, fontWeight:900, color:catChoisie.color }}>
              +
            </button>
          </div>

          {/* Boutons */}
          <div style={{ display:"flex", gap:9 }}>
            <button onClick={() => setEtape("CATEGORIE")}
              style={{ flex:1, padding:"11px", borderRadius:10,
                border:"1px solid #e2e8f0", background:"white",
                color:"#64748b", fontWeight:600, fontSize:13, cursor:"pointer",
                display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
              <FaArrowLeft size={10}/> Retour
            </button>
            <button onClick={() => setEtape("BAC")}
              style={{ flex:2, padding:"11px", borderRadius:10, border:"none",
                background:`linear-gradient(135deg,${catChoisie.color},#b91c1c)`,
                color:"white", fontWeight:700, fontSize:13, cursor:"pointer",
                display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
              {quantite} {catChoisie.label}{quantite>1?"s":""} →
              <FaArrowRight size={10}/>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (etape === "BAC") {
    const handleScanBac = async () => {
      if (!codeBac.trim()) return;
      setLoading(true); setBacErr("");
      try {
        const res = await apiCall(`/api/collecte/service/${collecteId}/bac`,
          { codeOuTag: codeBac.trim() });
        if (res.typeBac !== "INFECTE") {
          setBacErr(`Ce bac est de type ${res.typeBac}. Scannez un bac ROUGE.`);
          return;
        }
        setBacId(res.bacId);
        // Valider directement
        onValider({
          bacId: res.bacId,
          items: [{ categorie: catChoisie.id, quantiteDeclaree: quantite }]
        });
      } catch(e) { setBacErr(e.message); }
      finally { setLoading(false); }
    };

    return (
      <div data-modal="true" style={{
        position:"fixed", inset:0, background:"rgba(0,0,0,0.55)",
        display:"flex", alignItems:"center", justifyContent:"center",
        zIndex:9999, backdropFilter:"blur(4px)"
      }}>
        <div style={{
          background:"white", borderRadius:22, padding:28,
          maxWidth:380, width:"95%",
          boxShadow:"0 24px 80px rgba(0,0,0,0.25)"
        }}>
          {/* Header */}
          <div style={{ display:"flex", justifyContent:"space-between",
            alignItems:"center", marginBottom:18 }}>
            <div style={{ display:"flex", alignItems:"center", gap:11 }}>
              <div style={{ width:44, height:44, borderRadius:"50%",
                background:"#fee2e2", display:"flex",
                alignItems:"center", justifyContent:"center" }}>
                <FaBiohazard size={20} color="#dc2626"/>
              </div>
              <div>
                <div style={{ fontWeight:800, fontSize:15, color:"#1e293b" }}>
                  Scanner le bac rouge
                </div>
                <div style={{ fontSize:11, color:"#64748b" }}>
                  {quantite} {catChoisie.label}{quantite>1?"s":""} {catChoisie.emoji}
                </div>
              </div>
            </div>
            <button onClick={onClose} style={{ background:"#f1f5f9", border:"none",
              borderRadius:"50%", width:32, height:32, cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center" }}>
              <FaTimes size={13} color="#64748b"/>
            </button>
          </div>

          <div style={{ display:"flex", gap:6, marginBottom:22 }}>
            {["CATEGORIE","QUANTITE","BAC"].map((e,i) => (
              <div key={e} style={{ flex:1, height:4, borderRadius:2,
                background:"#dc2626", transition:"background .3s" }}/>
            ))}
          </div>

          {/* Récap */}
          <div style={{ padding:"12px 14px", background:"#fff5f5",
            borderRadius:12, border:"1.5px solid #fca5a5",
            marginBottom:18, display:"flex", alignItems:"center", gap:12 }}>
            <span style={{ fontSize:28 }}>{catChoisie.emoji}</span>
            <div>
              <div style={{ fontWeight:700, fontSize:14, color:"#dc2626" }}>
                {quantite} {catChoisie.label}{quantite>1?"s":""}
              </div>
              <div style={{ fontSize:11, color:"#94a3b8" }}>
                seront associés au bac rouge scanné
              </div>
            </div>
          </div>

          {/* Zone scan bac */}
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:12, fontWeight:700, color:"#dc2626",
              display:"block", marginBottom:7 }}>
              🔴 Code du bac rouge
            </label>
            <div style={{ display:"flex", gap:7 }}>
              <input
                value={codeBac}
                onChange={e => setCodeBac(e.target.value)}
                onKeyDown={e => e.key==="Enter" && handleScanBac()}
                placeholder="Scanner ou saisir..."
                autoFocus
                style={{ flex:1, padding:"10px 13px", borderRadius:9,
                  border:"2px solid #fca5a5", fontSize:13, outline:"none" }}
              />
              <button onClick={handleScanBac}
                disabled={loading || !codeBac.trim()}
                style={{ padding:"10px 16px", borderRadius:9, border:"none",
                  background: !codeBac.trim() ? "#e2e8f0"
                    : "linear-gradient(135deg,#dc2626,#b91c1c)",
                  color: !codeBac.trim() ? "#94a3b8" : "white",
                  fontWeight:700, fontSize:13,
                  cursor: !codeBac.trim() ? "not-allowed" : "pointer" }}>
                {loading
                  ? <FaSpinner style={{ animation:"spin 1s linear infinite" }}/>
                  : "OK"}
              </button>
            </div>
            {bacErr && (
              <div style={{ marginTop:7, fontSize:11, color:"#dc2626",
                padding:"6px 10px", background:"#fff5f5",
                borderRadius:7, border:"1px solid #fca5a5" }}>
                ⚠️ {bacErr}
              </div>
            )}
          </div>

          <div style={{ display:"flex", gap:9 }}>
            <button onClick={() => setEtape("QUANTITE")}
              style={{ flex:1, padding:"11px", borderRadius:10,
                border:"1px solid #e2e8f0", background:"white",
                color:"#64748b", fontWeight:600, fontSize:13, cursor:"pointer",
                display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
              <FaArrowLeft size={10}/> Retour
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Dialogue manquant
// ─────────────────────────────────────────────────────────────────────────────
function DlgManquant({ linge, onOk, onClose }) {
  if (!linge) return null;
  const c = cat(linge.categorie);
  return (
    <div data-modal="true" style={{
      position:"fixed", inset:0, background:"rgba(0,0,0,0.5)",
      display:"flex", alignItems:"center", justifyContent:"center",
      zIndex:9999, backdropFilter:"blur(4px)"
    }}>
      <div style={{ background:"white", borderRadius:18, padding:22,
        maxWidth:320, width:"95%", boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ display:"flex", justifyContent:"space-between",
          alignItems:"center", marginBottom:14 }}>
          <div style={{ display:"flex", alignItems:"center", gap:9 }}>
            <div style={{ width:36, height:36, borderRadius:"50%",
              background:"#fef3c7", display:"flex",
              alignItems:"center", justifyContent:"center" }}>
              <FaExclamationTriangle size={15} color="#d97706"/>
            </div>
            <div style={{ fontWeight:800, fontSize:13 }}>Linge manquant ?</div>
          </div>
          <button onClick={onClose} style={{ background:"#f1f5f9", border:"none",
            borderRadius:"50%", width:28, height:28, cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center" }}>
            <FaTimes size={10} color="#64748b"/>
          </button>
        </div>
        <div style={{ padding:"9px 12px", background:c.bg, borderRadius:10,
          marginBottom:14, display:"flex", alignItems:"center", gap:9 }}>
          <span style={{ fontSize:20 }}>{c.emoji}</span>
          <div>
            <div style={{ fontWeight:700, fontSize:12, color:c.color }}>{c.label}</div>
            <code style={{ fontSize:10, color:"#64748b" }}>{linge.codeBarre}</code>
          </div>
        </div>
        <div style={{ display:"flex", gap:7 }}>
          <button onClick={onClose} style={{ flex:1, padding:"9px",
            borderRadius:8, border:"1px solid #e2e8f0", background:"white",
            color:"#64748b", fontWeight:600, fontSize:12, cursor:"pointer" }}>
            Annuler
          </button>
          <button onClick={() => onOk(linge)} style={{ flex:2, padding:"9px",
            borderRadius:8, border:"none",
            background:"linear-gradient(135deg,#d97706,#b45309)",
            color:"white", fontWeight:700, fontSize:12, cursor:"pointer" }}>
            ⚠️ Confirmer
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Carte linge (colonne droite)
// ─────────────────────────────────────────────────────────────────────────────
function CarteLinge({ linge, bacBlanc, onBlanc, onPropre, onManquant }) {
  const c   = cat(linge.categorie);
  const col = ST_COLORS[linge.statut];
  return (
    <div style={{ display:"flex", justifyContent:"space-between",
      alignItems:"center", padding:"8px 11px", borderRadius:10,
      border:`1px solid ${col?.b||"#e2e8f0"}`,
      background:col?.bg||"#f8fafc" }}>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <span style={{ fontSize:17 }}>{c.emoji}</span>
        <div>
          <div style={{ fontSize:11, fontWeight:600, color:c.color }}>{c.label}</div>
          <code style={{ fontSize:10, color:"#94a3b8" }}>{linge.codeBarre}</code>
        </div>
      </div>
      {linge.statut ? (
        <span style={{ fontSize:9, fontWeight:700, padding:"2px 7px",
          borderRadius:20, background:col?.tag, color:col?.tc }}>
          {col?.lbl}
        </span>
      ) : (
        <div style={{ display:"flex", gap:3 }}>
          <button onClick={() => onBlanc(linge)} disabled={!bacBlanc?.bacId}
            title="Sale → bac blanc"
            style={{ width:26, height:26, borderRadius:"50%",
              border:"1.5px solid #bbf7d0", background:"#dcfce7",
              cursor:bacBlanc?.bacId?"pointer":"not-allowed",
              opacity:bacBlanc?.bacId?1:0.4,
              display:"flex", alignItems:"center", justifyContent:"center" }}>
            <FaCheck size={9} color="#16a34a"/>
          </button>
          <button onClick={() => onPropre(linge)} title="Propre → laisser en place"
            style={{ width:26, height:26, borderRadius:"50%",
              border:"1.5px solid #bae6fd", background:"#dbeafe",
              cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center" }}>
            <FaCheckCircle size={9} color="#0284c7"/>
          </button>
          <button onClick={() => onManquant(linge)} title="Manquant"
            style={{ width:26, height:26, borderRadius:"50%",
              border:"1.5px solid #fde68a", background:"#fef3c7",
              cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center" }}>
            <FaExclamationTriangle size={9} color="#d97706"/>
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE PRINCIPALE
// ─────────────────────────────────────────────────────────────────────────────
export default function CollageListService() {
  const { showAlert, showConfirm } = useModal();

  const [etape,        setEtape]        = useState("AGENT");
  const [agent,        setAgent]        = useState(null);
  const [collecte,     setCollecte]     = useState(null);
  const [bacBlanc,     setBacBlanc]     = useState(null);
  const [sacsDeclares, setSacsDeclares] = useState([]);
  const [scanVal,      setScanVal]      = useState("");
  const [loading,      setLoading]      = useState(false);
  const [resume,       setResume]       = useState(null);
  const [dlgSac,       setDlgSac]       = useState(false);
  const [dlgManq,      setDlgManq]      = useState(null);

  const agentRef    = useRef(null);
  const collecteRef = useRef(null);
  const bacRef      = useRef(null);
  useEffect(() => { agentRef.current    = agent;    }, [agent]);
  useEffect(() => { collecteRef.current = collecte; }, [collecte]);
  useEffect(() => { bacRef.current      = bacBlanc; }, [bacBlanc]);

  const majLinge = useCallback((lingeId, statut) => {
    setCollecte(p => p ? {
      ...p,
      linges: p.linges.map(l => l.lingeId===lingeId ? {...l,statut} : l)
    } : p);
  }, []);

  const handleAgent = useCallback(async code => {
    setLoading(true);
    try {
      const ag = await fetch(`${API}/api/agents/matricule/${code}`)
                       .then(r => r.ok ? r.json() : null);
      if (!ag) { showAlert("❌ Agent introuvable", code, "error"); return; }
      setAgent({ nom:ag.nom, matricule:ag.matricule });
      setEtape("SERVICE");
    } catch(e) { showAlert("❌ " + e.message, "", "error"); }
    finally { setLoading(false); }
  }, [showAlert]);

  const handleService = useCallback(async code => {
    setLoading(true);
    try {
      const svcRes = await fetch(
        `${API}/api/sqlserver/services/ref/${encodeURIComponent(code)}`
      );
      const svc = svcRes.ok ? await svcRes.json() : null;
      if (!svc) { showAlert("❌ Service introuvable", code, "error"); return; }

      const res = await apiCall("/api/collecte/service/ouvrir", {
        matriculeAgent: agentRef.current.matricule,
        serviceId:      svc.id
      });
      setCollecte({
        id:          res.collecteId,
        serviceNom:  res.serviceCode || svc.code,
        serviceId:   res.serviceId   || svc.id,
        nbAttendus:  res.nbAttendus,
        linges:      (res.linges||[]).map(l => ({...l, statut:""})),
      });
      setSacsDeclares([]); setBacBlanc(null);
      setEtape("BAC");
      showAlert("✅ " + svc.code, res.nbAttendus + " linge(s)", "success");
    } catch(e) { showAlert("❌ " + e.message, "", "error"); }
    finally { setLoading(false); }
  }, [showAlert]);

  const handleBac = useCallback(async code => {
    setLoading(true);
    try {
      const res = await apiCall(
        `/api/collecte/service/${collecteRef.current?.id}/bac`,
        { codeOuTag: code }
      );
      if (res.typeBac === "INFECTE") {
        showAlert("⚠️ Bac rouge", "Scannez le bac BLANC d'abord.", "warning");
        return;
      }
      setBacBlanc({ bacId:res.bacId, codeBac:res.codeBac });
      setEtape("SCAN");
      showAlert("✅ Bac blanc : " + res.codeBac, "Scannez les linges", "success");
    } catch(e) { showAlert("❌ " + e.message, "", "error"); }
    finally { setLoading(false); }
  }, [showAlert]);

  const handleScanBlanc = useCallback(async code => {
    const bac = bacRef.current;
    if (!bac?.bacId) { showAlert("❌ Scannez d'abord le bac blanc", "", "warning"); return; }
    setLoading(true);
    try {
      const res = await apiCall(
        `/api/collecte/service/${collecteRef.current?.id}/blanc`,
        { bacId:bac.bacId, codeOuTag:code }
      );
      majLinge(res.lingeId, "BLANC");
    } catch(e) { showAlert("❌ " + e.message, code, "error"); }
    finally { setLoading(false); }
  }, [showAlert, majLinge]);

  // ── PROPRE ─────────────────────────────────────────────────────────────────
  const handlePropre = useCallback(async linge => {
    setLoading(true);
    try {
      const res = await apiCall(
        `/api/collecte/service/${collecteRef.current?.id}/propre`,
        { codeOuTag:linge.codeBarre }
      );
      majLinge(res.lingeId, "PROPRE");
      showAlert("🔵 Propre", linge.codeBarre + " — laissé en place", "info");
    } catch(e) { showAlert("❌ " + e.message, "", "error"); }
    finally { setLoading(false); }
  }, [showAlert, majLinge]);

  // ── MANQUANT ───────────────────────────────────────────────────────────────
  const handleManquant = useCallback(async linge => {
    setDlgManq(null); setLoading(true);
    try {
      await apiCall(
        `/api/collecte/service/${collecteRef.current?.id}/manquant`,
        { lingeId:linge.lingeId }
      );
      majLinge(linge.lingeId, "MANQUANT");
      showAlert("⚠️ Manquant", linge.codeBarre, "warning");
    } catch(e) { showAlert("❌ " + e.message, "", "error"); }
    finally { setLoading(false); }
  }, [showAlert, majLinge]);

  // ── SAC INFECTÉ (reçoit { bacId, items:[{categorie, quantiteDeclaree}] }) ──
  const handleSacInfecte = useCallback(async ({ bacId, items }) => {
    setDlgSac(false); setLoading(true);
    try {
      const res = await apiCall(
        `/api/collecte/service/${collecteRef.current?.id}/infecte`,
        {},
        "POST",
        {
          matriculeAgent: agentRef.current.matricule,
          serviceId:      collecteRef.current.serviceId,
          bacId,
          items,
        }
      );
      setSacsDeclares(p => [...p, {
        ...res,
        categorie: items[0]?.categorie,
        quantite:  items[0]?.quantiteDeclaree,
      }]);
      const c = items[0];
      showAlert("🔴 Sac déclaré",
        `${c?.quantiteDeclaree} ${c?.categorie?.toLowerCase() || "linge"}(s) infectés`,
        "warning");
    } catch(e) { showAlert("❌ " + e.message, "", "error"); }
    finally { setLoading(false); }
  }, [showAlert]);

  // ── CLÔTURER ───────────────────────────────────────────────────────────────
  const handleCloturer = useCallback(async () => {
    const nbBlancs = collecte?.linges?.filter(l=>l.statut==="BLANC").length||0;
    const nbSacs   = sacsDeclares.length;
    if (nbBlancs===0 && nbSacs===0) {
      showAlert("⚠️ Rien à clôturer",
        "Scannez au moins un linge ou déclarez un sac infecté.", "warning");
      return;
    }
    if (!(await showConfirm("Clôturer la collecte ?",
      `${nbBlancs} linge(s) blanc${nbBlancs>1?"s":""} + ${nbSacs} sac(s) infecté(s)`,
      "question"))) return;
    setLoading(true);
    try {
      const res = await apiCall(`/api/collecte/service/${collecte.id}/cloturer`);
      setResume({...res, serviceNom:collecte.serviceNom});
      setEtape("RESUME");
    } catch(e) { showAlert("❌ " + e.message, "", "error"); }
    finally { setLoading(false); }
  }, [collecte, sacsDeclares, showAlert, showConfirm]);

  // ── DISPATCHER ─────────────────────────────────────────────────────────────
  const handleScan = useCallback(async code => {
    setScanVal("");
    if (etape==="AGENT")   { await handleAgent(code);      return; }
    if (etape==="SERVICE") { await handleService(code);    return; }
    if (etape==="BAC")     { await handleBac(code);        return; }
    if (etape==="SCAN")    { await handleScanBlanc(code);  }
  }, [etape, handleAgent, handleService, handleBac, handleScanBlanc]);

  const reset = () => {
    setAgent(null); setCollecte(null); setBacBlanc(null);
    setSacsDeclares([]); setResume(null);
    setEtape("AGENT"); setScanVal("");
  };

  // Compteurs
  const nbBlancs  = collecte?.linges?.filter(l=>l.statut==="BLANC").length||0;
  const nbPropres = collecte?.linges?.filter(l=>l.statut==="PROPRE").length||0;
  const nbManq    = collecte?.linges?.filter(l=>l.statut==="MANQUANT").length||0;
  const nbNonTr   = collecte?.linges?.filter(l=>!l.statut).length||0;
  const nbInfectes = sacsDeclares.reduce((s,sac)=>s+(sac.quantite||0), 0);

  const ETAPES = [
    { id:"AGENT",   label:"Agent",   done:!!agent    },
    { id:"SERVICE", label:"Service", done:!!collecte },
    { id:"BAC",     label:"Bac ⬜",  done:!!bacBlanc },
    { id:"SCAN",    label:"Scan",    done:etape==="RESUME" },
  ];

  const INSTRUCTION = {
    AGENT:   { icon:"👤", titre:"Scannez votre badge",        color:"#64748b", bg:"#f8fafc",  border:"#e2e8f0" },
    SERVICE: { icon:"🏢", titre:"Scannez le code du service", color:"#7c3aed", bg:"#faf5ff",  border:"#a78bfa" },
    BAC:     { icon:"📦", titre:"Scannez le bac blanc",       color:"#0369a1", bg:"#f0f9ff",  border:"#7dd3fc" },
    SCAN:    { icon:"🏷️", titre:"Scannez les linges blancs",  color:"#0369a1", bg:"#f0f9ff",  border:"#0ea5e9" },
  }[etape] || {};

  return (
    <div className="collecte-container">
      {/* Dialogues */}
      <DlgSacInfecte visible={dlgSac} collecteId={collecte?.id}
        onValider={handleSacInfecte} onClose={() => setDlgSac(false)}/>
      <DlgManquant linge={dlgManq}
        onOk={handleManquant} onClose={() => setDlgManq(null)}/>

      {/* En-tête */}
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontSize:22, fontWeight:900, color:"#1a1f36", marginBottom:4 }}>
          🏢 Collecte du service
        </h1>
        <p style={{ fontSize:13, color:"#64748b", margin:0 }}>
          {!agent ? "Scannez votre badge pour commencer"
           : !collecte ? agent.nom + " — Scannez un service"
           : `${agent.nom} · ${collecte.serviceNom}`}
        </p>
      </div>

      <div style={{ display:"grid",
        gridTemplateColumns: etape==="SCAN" ? "1fr 280px" : "1fr",
        gap:16 }}>

        {/* ── Colonne principale ── */}
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>

          {/* Barre agent */}
          {agent && (
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ display:"flex", alignItems:"center", gap:9, padding:"7px 13px",
                borderRadius:10, background:"#faf5ff", border:"1px solid #e9d5ff" }}>
                <FaUser size={12} color="#7c3aed"/>
                <span style={{ fontWeight:600, fontSize:12 }}>{agent.nom}</span>
                {collecte && <>
                  <span style={{ color:"#e2e8f0" }}>|</span>
                  <span style={{ fontWeight:700, fontSize:12, color:"#7c3aed" }}>
                    {collecte.serviceNom}
                  </span>
                  {bacBlanc && (
                    <Badge style={{ background:"#ede9fe", color:"#7c3aed", fontSize:9 }}>
                      📦 {bacBlanc.codeBac}
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


          {/* Zone scan avec instruction claire */}
          {etape !== "RESUME" && (
            <div style={{ padding:"20px", background:INSTRUCTION.bg||"#f8fafc",
              borderRadius:16, border:`2px dashed ${INSTRUCTION.border||"#e2e8f0"}` }}>
              <div style={{ textAlign:"center", marginBottom:14 }}>
                <div style={{ fontSize:32, marginBottom:5 }}>{INSTRUCTION.icon}</div>
                <div style={{ fontWeight:700, fontSize:14,
                  color:INSTRUCTION.color||"#1e293b" }}>
                  {INSTRUCTION.titre}
                </div>
              </div>
              <ScanInput placeholder="Scanner ici..." value={scanVal}
                onChange={setScanVal} onSubmit={handleScan}
                borderColor={INSTRUCTION.border||"#e2e8f0"}
                keepFocus autoDebounce disabled={loading}/>
              {loading && (
                <div style={{ marginTop:8, fontSize:11, color:"#64748b",
                  display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                  <FaSpinner style={{ animation:"spin 1s linear infinite" }}/> ...
                </div>
              )}
              {bacBlanc && etape==="SCAN" && (
                <div style={{ marginTop:9, padding:"6px 12px", background:"white",
                  borderRadius:8, border:"1px solid #bae6fd",
                  fontSize:12, color:"#0369a1", fontWeight:600,
                  display:"flex", alignItems:"center", gap:7 }}>
                  📦 Bac blanc actif : <strong>{bacBlanc.codeBac}</strong>
                </div>
              )}
            </div>
          )}

          {etape==="SCAN" && collecte && (
            <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
              {/* Compteurs */}
              <div style={{ display:"grid",
                gridTemplateColumns:"repeat(4,1fr)", gap:8 }}>
                {[["Blancs",    nbBlancs,   "#dcfce7","#15803d"],
                  ["Infectés",  nbInfectes, "#fee2e2","#dc2626"],
                  ["Propres",   nbPropres,  "#dbeafe","#0284c7"],
                  ["Manquants", nbManq,     "#fef3c7","#d97706"],
                ].map(([l,v,bg,co])=>(
                  <div key={l} style={{ background:bg, borderRadius:10,
                    padding:"10px 4px", textAlign:"center" }}>
                    <div style={{ fontSize:20, fontWeight:900, color:co }}>{v}</div>
                    <div style={{ fontSize:10, color:co, fontWeight:600 }}>{l}</div>
                  </div>
                ))}
              </div>

              {/* Sacs déclarés */}
              {sacsDeclares.length > 0 && (
                <div style={{ padding:"10px 13px", background:"#fff5f5",
                  borderRadius:10, border:"1px solid #fca5a5" }}>
                  <div style={{ fontSize:11, color:"#dc2626", fontWeight:700,
                    marginBottom:6 }}>
                    🔴 Sacs infectés déclarés :
                  </div>
                  {sacsDeclares.map((s,i) => {
                    const c = cat(s.categorie);
                    return (
                      <div key={i} style={{ display:"flex", alignItems:"center",
                        gap:8, fontSize:11, color:"#dc2626", marginBottom:3 }}>
                        <span>{c.emoji}</span>
                        <span style={{ fontWeight:600 }}>
                          {s.quantite} {c.label}{s.quantite>1?"s":""}
                        </span>
                        <span style={{ color:"#94a3b8", marginLeft:"auto" }}>
                          {s.numeroSac}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Bouton sac infecté — ouvre DialogCategorie */}
              <button onClick={() => setDlgSac(true)}
                style={{ padding:12, borderRadius:10,
                  border:"2px solid #fca5a5", background:"#fff5f5",
                  color:"#dc2626", fontWeight:700, fontSize:13,
                  cursor:"pointer", display:"flex",
                  alignItems:"center", justifyContent:"center", gap:8 }}>
                <FaBiohazard size={14}/>
                Déclarer des linges infectés 🔴
              </button>

              {/* Clôturer */}
              <button onClick={handleCloturer} disabled={loading}
                style={{ padding:12, borderRadius:10, border:"none",
                  background: loading ? "#e2e8f0"
                    : "linear-gradient(135deg,#0ea5e9,#0284c7)",
                  color:loading?"#94a3b8":"white",
                  fontWeight:700, fontSize:13,
                  cursor:loading?"not-allowed":"pointer",
                  display:"flex", alignItems:"center",
                  justifyContent:"center", gap:7 }}>
                {loading
                  ? <FaSpinner style={{ animation:"spin 1s linear infinite" }}/>
                  : <><FaCheckDouble size={12}/> Terminer et clôturer</>}
              </button>
            </div>
          )}

          {/* Résumé */}
          {etape==="RESUME" && resume && (
            <div style={{ background:"#f0fdf4", borderRadius:18, padding:26,
              border:"2px solid #22c55e", textAlign:"center" }}>
              <div style={{ fontSize:40, marginBottom:10 }}>✅</div>
              <div style={{ fontWeight:900, fontSize:18, color:"#15803d",
                marginBottom:16 }}>
                Collecte terminée — {resume.serviceNom||collecte?.serviceNom}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)",
                gap:8, marginBottom:20 }}>
                {[["Blancs",   resume.nbBlancs,    "#dcfce7","#15803d"],
                  ["Infectés", resume.nbInfectes,  "#fee2e2","#dc2626"],
                  ["Propres",  resume.nbPropres,   "#dbeafe","#0284c7"],
                  ["Manq.",    resume.nbManquants, "#fef3c7","#d97706"],
                ].map(([l,v,bg,co])=>(
                  <div key={l} style={{ background:bg,borderRadius:10,padding:"10px 4px" }}>
                    <div style={{ fontSize:22,fontWeight:900,color:co }}>{v||0}</div>
                    <div style={{ fontSize:10,color:co,fontWeight:600 }}>{l}</div>
                  </div>
                ))}
              </div>
              {sacsDeclares.length > 0 && (
                <div style={{ padding:"8px 12px", background:"#fff5f5",
                  borderRadius:9, fontSize:12, color:"#dc2626",
                  fontWeight:600, marginBottom:16 }}>
                  🔴 {sacsDeclares.length} sac{sacsDeclares.length>1?"s":""} infecté{sacsDeclares.length>1?"s":""}
                  → en attente de réception
                </div>
              )}
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={() => {
                  setCollecte(null); setBacBlanc(null);
                  setSacsDeclares([]); setResume(null); setEtape("SERVICE");
                }} style={{ flex:1, padding:"11px", borderRadius:10, border:"none",
                  background:"linear-gradient(135deg,#7c3aed,#6d28d9)",
                  color:"white", fontWeight:700, fontSize:13, cursor:"pointer" }}>
                  + Autre service
                </button>
                <button onClick={reset} style={{ flex:1, padding:"11px",
                  borderRadius:10, border:"1px solid #e2e8f0",
                  background:"white", color:"#64748b",
                  fontWeight:600, fontSize:13, cursor:"pointer" }}>
                  Terminer
                </button>
              </div>
            </div>
          )}

          {agent && (
            <div style={{ paddingTop:7, borderTop:"1px solid #e2e8f0",
              fontSize:10, color:"#94a3b8" }}>
              👤 {agent.nom} · 📍 {etape}
            </div>
          )}
        </div>

        {/* ── Colonne droite : liste des linges ── */}
        {etape==="SCAN" && collecte && (
          <div style={{ position:"sticky", top:20, alignSelf:"start",
            display:"flex", flexDirection:"column", gap:7,
            maxHeight:"calc(100vh - 120px)", overflowY:"auto" }}>
            <div style={{ background:"white", borderRadius:11, padding:"10px 13px",
              border:"1px solid #e2e8f0" }}>
              <div style={{ fontWeight:700, fontSize:12, color:"#1e293b",
                marginBottom:3 }}>
                {collecte.serviceNom}
              </div>
              <div style={{ fontSize:10, color:"#64748b" }}>
                {nbNonTr > 0
                  ? `${nbNonTr} linge${nbNonTr>1?"s":""} en attente`
                  : "✅ Tous traités"}
              </div>
            </div>
            {collecte.linges.map(l => (
              <CarteLinge key={l.lingeId} linge={l} bacBlanc={bacBlanc}
                onBlanc={() => handleScanBlanc(l.codeBarre)}
                onPropre={handlePropre}
                onManquant={lg => setDlgManq(lg)}/>
            ))}
            <div style={{ padding:"9px 12px", background:"#f8fafc",
              borderRadius:9, border:"1px solid #e2e8f0",
              fontSize:10, color:"#94a3b8", lineHeight:1.9 }}>
              ✅ = blanc (bac requis)<br/>
              🔵 = propre, reste en place<br/>
              ⚠️ = introuvable
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
