import React, { useState, useRef, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useModal } from "../../../contextes/ModalContext";
import {
  FaUser, FaTimes, FaBiohazard, FaCheckCircle, FaCheck,
  FaExclamationTriangle, FaSpinner, FaRedo, FaPlus, FaMinus,
  FaCheckDouble, FaArrowRight, FaArrowLeft, FaBuilding,
  FaBoxes
} from "react-icons/fa";
import { Card, CardContent } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import ScanInput from "../../../components/utils/shared/ScanInput";
import EtapesStepper from "../../../components/utils/shared/EtapesStepper";
import DialogCategorie from "../../../components/utils/collecte/DialogCategorie";
import { cat, ST_COLORS, apiCall } from "../collecteUtils";
import { getAgent, isAgentConnected } from "../../../services/agentService";
import "../../Linge/WorkflowList.css";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8082';

function StatutCard({ label, value, icon, color, bg, subValue }) {
  return (
    <div style={{
      padding: "16px 18px",
      borderRadius: "14px",
      background: bg,
      border: `1px solid ${color}25`,
      flex: 1,
      minWidth: "100px",
      transition: "all 0.2s ease"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{
          width: "40px",
          height: "40px",
          borderRadius: "12px",
          background: `${color}15`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "20px"
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
          {subValue && (
            <p style={{ fontSize: "10px", color: "#94a3b8", margin: 0 }}>{subValue}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── COMPOSANT : Scan Status ──────────────────────────────────────────────
function ScanStatus({ loading, success, error, code, t }) {
  if (loading) {
    return (
      <div style={{
        padding: "14px 18px",
        borderRadius: "12px",
        background: "#eff6ff",
        border: "1px solid #93c5fd",
        display: "flex",
        alignItems: "center",
        gap: "14px",
        marginTop: "12px",
        animation: "fadeIn 0.3s ease-out"
      }}>
        <FaSpinner className="animate-spin" color="#3b82f6" size={22} />
        <div>
          <p style={{ fontWeight: 600, color: "#1d4ed8", fontSize: "14px", margin: 0 }}>{t('collecte.scanning')}</p>
          <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>{code}</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div style={{
        padding: "14px 18px",
        borderRadius: "12px",
        background: "#f0fdf4",
        border: "1px solid #86efac",
        display: "flex",
        alignItems: "center",
        gap: "14px",
        marginTop: "12px",
        animation: "fadeIn 0.3s ease-out"
      }}>
        <div style={{
          width: "36px",
          height: "36px",
          borderRadius: "50%",
          background: "#dcfce7",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <FaCheckCircle color="#22c55e" size={20} />
        </div>
        <div>
          <p style={{ fontWeight: 600, color: "#15803d", fontSize: "14px", margin: 0 }}>✓ {success.message || t('collecte.success')}</p>
          <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>{success.detail}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: "14px 18px",
        borderRadius: "12px",
        background: "#fef2f2",
        border: "1px solid #fca5a5",
        display: "flex",
        alignItems: "center",
        gap: "14px",
        marginTop: "12px",
        animation: "fadeIn 0.3s ease-out"
      }}>
        <div style={{
          width: "36px",
          height: "36px",
          borderRadius: "50%",
          background: "#fee2e2",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <FaExclamationTriangle color="#ef4444" size={18} />
        </div>
        <div>
          <p style={{ fontWeight: 600, color: "#dc2626", fontSize: "14px", margin: 0 }}>{t('common.error')}</p>
          <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>{error}</p>
        </div>
      </div>
    );
  }

  return null;
}

// ─── DIALOGUE SAC INFECTÉ ──────────────────────────────────────────────────
function DlgSacInfecte({ visible, collecteId, onValider, onClose, t }) {
  const [etape, setEtape] = useState("CATEGORIE");
  const [catChoisie, setCatChoisie] = useState(null);
  const [quantite, setQuantite] = useState(1);
  const [codeBac, setCodeBac] = useState("");
  const [bacId, setBacId] = useState(null);
  const [bacErr, setBacErr] = useState("");
  const [loading, setLoading] = useState(false);

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
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 9999, backdropFilter: "blur(4px)"
      }}>
        <div style={{
          background: "white", borderRadius: 22, padding: 28,
          maxWidth: 380, width: "95%",
          boxShadow: "0 24px 80px rgba(0,0,0,0.25)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between",
            alignItems: "center", marginBottom: 22 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%",
                background: catChoisie.bg,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22 }}>
                {catChoisie.emoji}
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16, color: "#1e293b" }}>
                  {catChoisie.label}
                </div>
                <div style={{ fontSize: 11, color: "#64748b" }}>
                  {t('collecte.how_many_infected', { label: catChoisie.label.toLowerCase() })}
                </div>
              </div>
            </div>
            <button onClick={onClose} style={{ background: "#f1f5f9", border: "none",
              borderRadius: "50%", width: 32, height: 32, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FaTimes size={13} color="#64748b" />
            </button>
          </div>

          <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
            {["CATEGORIE", "QUANTITE", "BAC"].map((e, i) => (
              <div key={e} style={{ flex: 1, height: 4, borderRadius: 2,
                background: i <= 1 ? catChoisie.color : "#f1f5f9",
                transition: "background .3s" }} />
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center",
            justifyContent: "center", gap: 20, marginBottom: 28 }}>
            <button
              onClick={() => setQuantite(q => Math.max(1, q - 1))}
              style={{ width: 52, height: 52, borderRadius: "50%",
                border: `2px solid ${catChoisie.border}`,
                background: catChoisie.bg, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22, fontWeight: 900, color: catChoisie.color }}>
              −
            </button>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 56, fontWeight: 900, color: catChoisie.color,
                lineHeight: 1 }}>{quantite}</div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
                {catChoisie.label}{quantite > 1 ? "s" : ""}
              </div>
            </div>
            <button
              onClick={() => setQuantite(q => q + 1)}
              style={{ width: 52, height: 52, borderRadius: "50%",
                border: `2px solid ${catChoisie.border}`,
                background: catChoisie.bg, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22, fontWeight: 900, color: catChoisie.color }}>
              +
            </button>
          </div>

          <div style={{ display: "flex", gap: 9 }}>
            <button onClick={() => setEtape("CATEGORIE")}
              style={{ flex: 1, padding: "11px", borderRadius: 10,
                border: "1px solid #e2e8f0", background: "white",
                color: "#64748b", fontWeight: 600, fontSize: 13, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
              <FaArrowLeft size={10} /> {t('common.back')}
            </button>
            <button onClick={() => setEtape("BAC")}
              style={{ flex: 2, padding: "11px", borderRadius: 10, border: "none",
                background: `linear-gradient(135deg,${catChoisie.color},#b91c1c)`,
                color: "white", fontWeight: 700, fontSize: 13, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
              {quantite} {catChoisie.label}{quantite > 1 ? "s" : ""} →
              <FaArrowRight size={10} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (etape === "BAC") {
    const handleScanBac = async () => {
      if (!codeBac.trim()) return;
      setLoading(true);
      setBacErr("");
      try {
        const res = await apiCall(`/api/collecte/service/${collecteId}/bac`,
          { codeOuTag: codeBac.trim() });
        if (res.typeBac !== "INFECTE") {
          setBacErr(t('collecte.errors.bac_not_infected', { type: res.typeBac }));
          return;
        }
        setBacId(res.bacId);
        onValider({
          bacId: res.bacId,
          items: [{ categorie: catChoisie.id, quantiteDeclaree: quantite }]
        });
      } catch (e) { setBacErr(e.message); } finally { setLoading(false); }
    };

    return (
      <div data-modal="true" style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 9999, backdropFilter: "blur(4px)"
      }}>
        <div style={{
          background: "white", borderRadius: 22, padding: 28,
          maxWidth: 380, width: "95%",
          boxShadow: "0 24px 80px rgba(0,0,0,0.25)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between",
            alignItems: "center", marginBottom: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%",
                background: "#fee2e2", display: "flex",
                alignItems: "center", justifyContent: "center" }}>
                <FaBiohazard size={20} color="#dc2626" />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, color: "#1e293b" }}>
                  {t('collecte.scan_red_bac')}
                </div>
                <div style={{ fontSize: 11, color: "#64748b" }}>
                  {quantite} {catChoisie.label}{quantite > 1 ? "s" : ""} {catChoisie.emoji}
                </div>
              </div>
            </div>
            <button onClick={onClose} style={{ background: "#f1f5f9", border: "none",
              borderRadius: "50%", width: 32, height: 32, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FaTimes size={13} color="#64748b" />
            </button>
          </div>

          <div style={{ display: "flex", gap: 6, marginBottom: 22 }}>
            {["CATEGORIE", "QUANTITE", "BAC"].map((e, i) => (
              <div key={e} style={{ flex: 1, height: 4, borderRadius: 2,
                background: "#dc2626", transition: "background .3s" }} />
            ))}
          </div>

          <div style={{ padding: "12px 14px", background: "#fff5f5",
            borderRadius: 12, border: "1.5px solid #fca5a5",
            marginBottom: 18, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 28 }}>{catChoisie.emoji}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#dc2626" }}>
                {quantite} {catChoisie.label}{quantite > 1 ? "s" : ""}
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>
                {t('collecte.will_be_associated')}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#dc2626",
              display: "block", marginBottom: 7 }}>
              🔴 {t('collecte.red_bac_code')}
            </label>
            <div style={{ display: "flex", gap: 7 }}>
              <input
                value={codeBac}
                onChange={e => setCodeBac(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleScanBac()}
                placeholder={t('collecte.scan_or_enter')}
                autoFocus
                style={{ flex: 1, padding: "10px 13px", borderRadius: 9,
                  border: "2px solid #fca5a5", fontSize: 13, outline: "none" }}
              />
              <button onClick={handleScanBac}
                disabled={loading || !codeBac.trim()}
                style={{ padding: "10px 16px", borderRadius: 9, border: "none",
                  background: !codeBac.trim() ? "#e2e8f0"
                    : "linear-gradient(135deg,#dc2626,#b91c1c)",
                  color: !codeBac.trim() ? "#94a3b8" : "white",
                  fontWeight: 700, fontSize: 13,
                  cursor: !codeBac.trim() ? "not-allowed" : "pointer" }}>
                {loading
                  ? <FaSpinner style={{ animation: "spin 1s linear infinite" }} />
                  : "OK"}
              </button>
            </div>
            {bacErr && (
              <div style={{ marginTop: 7, fontSize: 11, color: "#dc2626",
                padding: "6px 10px", background: "#fff5f5",
                borderRadius: 7, border: "1px solid #fca5a5" }}>
                ⚠️ {bacErr}
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 9 }}>
            <button onClick={() => setEtape("QUANTITE")}
              style={{ flex: 1, padding: "11px", borderRadius: 10,
                border: "1px solid #e2e8f0", background: "white",
                color: "#64748b", fontWeight: 600, fontSize: 13, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
              <FaArrowLeft size={10} /> {t('common.back')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// ─── DIALOGUE MANQUANT ─────────────────────────────────────────────────────
function DlgManquant({ linge, onOk, onClose, t }) {
  if (!linge) return null;
  const c = cat(linge.categorie);
  return (
    <div data-modal="true" style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 9999, backdropFilter: "blur(4px)"
    }}>
      <div style={{ background: "white", borderRadius: 18, padding: 22,
        maxWidth: 320, width: "95%", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%",
              background: "#fef3c7", display: "flex",
              alignItems: "center", justifyContent: "center" }}>
              <FaExclamationTriangle size={15} color="#d97706" />
            </div>
            <div style={{ fontWeight: 800, fontSize: 13 }}>{t('collecte.missing_linen')}</div>
          </div>
          <button onClick={onClose} style={{ background: "#f1f5f9", border: "none",
            borderRadius: "50%", width: 28, height: 28, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FaTimes size={10} color="#64748b" />
          </button>
        </div>
        <div style={{ padding: "9px 12px", background: c.bg, borderRadius: 10,
          marginBottom: 14, display: "flex", alignItems: "center", gap: 9 }}>
          <span style={{ fontSize: 20 }}>{c.emoji}</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 12, color: c.color }}>{c.label}</div>
            <code style={{ fontSize: 10, color: "#64748b" }}>{linge.codeBarre}</code>
          </div>
        </div>
        <div style={{ display: "flex", gap: 7 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "9px",
            borderRadius: 8, border: "1px solid #e2e8f0", background: "white",
            color: "#64748b", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
            {t('common.cancel')}
          </button>
          <button onClick={() => onOk(linge)} style={{ flex: 2, padding: "9px",
            borderRadius: 8, border: "none",
            background: "linear-gradient(135deg,#d97706,#b45309)",
            color: "white", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
            ⚠️ {t('collecte.confirm_missing')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── CARTE LINGE ──────────────────────────────────────────────────────────
function CarteLinge({ linge, bacBlanc, onBlanc, onPropre, onManquant, t }) {
  const c = cat(linge.categorie);
  const col = ST_COLORS[linge.statut];
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "10px 14px",
      borderRadius: "10px",
      border: `1px solid ${col?.b || "#e2e8f0"}`,
      background: col?.bg || "#f8fafc",
      marginBottom: "6px"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{ fontSize: "18px" }}>{c.emoji}</span>
        <div>
          <div style={{ fontSize: "12px", fontWeight: 600, color: c.color }}>{c.label}</div>
          <code style={{ fontSize: "10px", color: "#94a3b8" }}>{linge.codeBarre}</code>
        </div>
      </div>
      {linge.statut ? (
        <span style={{
          fontSize: "9px",
          fontWeight: 700,
          padding: "2px 10px",
          borderRadius: "12px",
          background: col?.tag,
          color: col?.tc
        }}>
          {col?.lbl}
        </span>
      ) : (
        <div style={{ display: "flex", gap: "4px" }}>
          <button onClick={() => onBlanc(linge)} disabled={!bacBlanc?.bacId}
            title={t('collecte.sale_to_white')}
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              border: "1.5px solid #bbf7d0",
              background: "#dcfce7",
              cursor: bacBlanc?.bacId ? "pointer" : "not-allowed",
              opacity: bacBlanc?.bacId ? 1 : 0.4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
            <FaCheck size={9} color="#16a34a" />
          </button>
          <button onClick={() => onPropre(linge)} title={t('collecte.propre_keep')}
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              border: "1.5px solid #bae6fd",
              background: "#dbeafe",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
            <FaCheckCircle size={9} color="#0284c7" />
          </button>
          <button onClick={() => onManquant(linge)} title={t('collecte.missing')}
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              border: "1.5px solid #fde68a",
              background: "#fef3c7",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
            <FaExclamationTriangle size={9} color="#d97706" />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── PAGE PRINCIPALE ──────────────────────────────────────────────────────
function CollageListServiceInner() {
  const { t } = useTranslation();
  const { showAlert, showConfirm } = useModal();

  const [etape, setEtape] = useState("SERVICE");
  const [agent, setAgent] = useState(null);
  const [collecte, setCollecte] = useState(null);
  const [bacBlanc, setBacBlanc] = useState(null);
  const [sacsDeclares, setSacsDeclares] = useState([]);
  const [scanVal, setScanVal] = useState("");
  const [loading, setLoading] = useState(false);
  const [resume, setResume] = useState(null);
  const [dlgSac, setDlgSac] = useState(false);
  const [dlgManq, setDlgManq] = useState(null);
  const [scanStatus, setScanStatus] = useState(null);

  const agentRef = useRef(null);
  const collecteRef = useRef(null);
  const bacRef = useRef(null);
  const scanInputRef = useRef(null);

  // ✅ Récupérer l'agent depuis localStorage au chargement
  useEffect(() => {
    const agentData = getAgent();
    if (agentData && isAgentConnected()) {
      setAgent(agentData);
      setEtape("SERVICE");
      setScanStatus({
        loading: false,
        success: { 
          message: `👤 ${agentData.nomPrenom || agentData.nom}`, 
          detail: `${t('collecte.connected')} · ${agentData.codeBarre || agentData.matricule}` 
        },
        error: null
      });
      setTimeout(() => setScanStatus(null), 2000);
    } else {
      setEtape("AGENT");
    }
  }, [t]);

  useEffect(() => { agentRef.current = agent; }, [agent]);
  useEffect(() => { collecteRef.current = collecte; }, [collecte]);
  useEffect(() => { bacRef.current = bacBlanc; }, [bacBlanc]);

  const majLinge = useCallback((lingeId, statut) => {
    setCollecte(p => p ? {
      ...p,
      linges: p.linges.map(l => l.lingeId === lingeId ? { ...l, statut } : l)
    } : p);
  }, []);

  const handleService = useCallback(async code => {
    if (!agent) {
      showAlert(t('collecte.errors.agent_not_connected'), t('collecte.errors.agent_not_connected_text'), "error");
      return;
    }
    setLoading(true);
    setScanStatus(null);
    try {
      const svcRes = await fetch(
        `${API_URL}/api/sqlserver/services/ref/${encodeURIComponent(code)}`
      );
      const svc = svcRes.ok ? await svcRes.json() : null;
      if (!svc) {
        setScanStatus({ loading: false, success: null, error: t('collecte.errors.service_not_found') });
        showAlert(t('collecte.errors.service_not_found'), code, "error");
        return;
      }

      const res = await apiCall("/api/collecte/service/ouvrir", {
        matriculeAgent: agent.codeBarre || agent.matricule,
        serviceId: svc.id
      });
      setCollecte({
        id: res.collecteId,
        serviceNom: res.serviceCode || svc.code,
        serviceId: res.serviceId || svc.id,
        nbAttendus: res.nbAttendus,
        linges: (res.linges || []).map(l => ({ ...l, statut: "" })),
      });
      setSacsDeclares([]);
      setBacBlanc(null);
      setEtape("BAC");
      setScanStatus({
        loading: false,
        success: { message: `✅ ${svc.code}`, detail: `${res.nbAttendus} ${t('collecte.linens')}` },
        error: null
      });
      setTimeout(() => setScanStatus(null), 2000);
      showAlert("✅ " + svc.code, res.nbAttendus + " " + t('collecte.linens'), "success");
    } catch (e) {
      setScanStatus({ loading: false, success: null, error: e.message });
      showAlert("❌ " + e.message, "", "error");
    } finally { setLoading(false); }
  }, [agent, showAlert, t]);

  const handleBac = useCallback(async code => {
    setLoading(true);
    setScanStatus(null);
    try {
      const res = await apiCall(
        `/api/collecte/service/${collecteRef.current?.id}/bac`,
        { codeOuTag: code }
      );
      if (res.typeBac === "INFECTE") {
        setScanStatus({ loading: false, success: null, error: t('collecte.errors.red_bac_detected') });
        showAlert(t('collecte.errors.red_bac_detected'), t('collecte.errors.scan_white_first'), "warning");
        return;
      }
      setBacBlanc({ bacId: res.bacId, codeBac: res.codeBac });
      setEtape("SCAN");
      setScanStatus({
        loading: false,
        success: { message: `✅ ${t('collecte.white_bac')} : ${res.codeBac}`, detail: t('collecte.scan_linens') },
        error: null
      });
      setTimeout(() => setScanStatus(null), 2000);
      showAlert(`✅ ${t('collecte.white_bac')} : ${res.codeBac}`, t('collecte.scan_linens'), "success");
    } catch (e) {
      setScanStatus({ loading: false, success: null, error: e.message });
      showAlert("❌ " + e.message, "", "error");
    } finally { setLoading(false); }
  }, [showAlert, t]);

  const handleScanBlanc = useCallback(async code => {
    const bac = bacRef.current;
    if (!bac?.bacId) {
      showAlert(t('collecte.errors.scan_white_first'), "", "warning");
      return;
    }
    setLoading(true);
    setScanStatus({ loading: true, code: code });
    try {
      const res = await apiCall(
        `/api/collecte/service/${collecteRef.current?.id}/blanc`,
        { bacId: bac.bacId, codeOuTag: code }
      );
      majLinge(res.lingeId, "BLANC");
      setScanStatus({
        loading: false,
        success: { message: "✓ " + t('collecte.linen_scanned'), detail: t('collecte.added_to_white_bac') },
        error: null
      });
      setTimeout(() => setScanStatus(null), 1500);
    } catch (e) {
      setScanStatus({ loading: false, success: null, error: e.message });
      showAlert("❌ " + e.message, code, "error");
    } finally { setLoading(false); }
  }, [showAlert, majLinge, t]);

  const handlePropre = useCallback(async linge => {
    setLoading(true);
    try {
      const res = await apiCall(
        `/api/collecte/service/${collecteRef.current?.id}/propre`,
        { codeOuTag: linge.codeBarre }
      );
      majLinge(res.lingeId, "PROPRE");
      showAlert("🔵 " + t('collecte.propre'), linge.codeBarre + " — " + t('collecte.kept_in_place'), "info");
    } catch (e) { showAlert("❌ " + e.message, "", "error"); } finally { setLoading(false); }
  }, [showAlert, majLinge, t]);

  const handleManquant = useCallback(async linge => {
    setDlgManq(null);
    setLoading(true);
    try {
      await apiCall(
        `/api/collecte/service/${collecteRef.current?.id}/manquant`,
        { lingeId: linge.lingeId }
      );
      majLinge(linge.lingeId, "MANQUANT");
      showAlert("⚠️ " + t('collecte.missing'), linge.codeBarre, "warning");
    } catch (e) { showAlert("❌ " + e.message, "", "error"); } finally { setLoading(false); }
  }, [showAlert, majLinge, t]);

  const handleSacInfecte = useCallback(async ({ bacId, items }) => {
    setDlgSac(false);
    setLoading(true);
    try {
      const res = await apiCall(
        `/api/collecte/service/${collecteRef.current?.id}/infecte`,
        {},
        "POST",
        {
          matriculeAgent: agent.codeBarre || agent.matricule,
          serviceId: collecteRef.current.serviceId,
          bacId,
          items,
        }
      );
      setSacsDeclares(p => [...p, {
        ...res,
        categorie: items[0]?.categorie,
        quantite: items[0]?.quantiteDeclaree,
      }]);
      const c = items[0];
      showAlert("🔴 " + t('collecte.sac_declared'),
        `${c?.quantiteDeclaree} ${c?.categorie?.toLowerCase() || t('collecte.linen')}${c?.quantiteDeclaree > 1 ? "s" : ""} ${t('collecte.infected')}`,
        "warning");
    } catch (e) { showAlert("❌ " + e.message, "", "error"); } finally { setLoading(false); }
  }, [agent, showAlert, t]);

  const handleCloturer = useCallback(async () => {
    const nbBlancs = collecte?.linges?.filter(l => l.statut === "BLANC").length || 0;
    const nbSacs = sacsDeclares.length;
    if (nbBlancs === 0 && nbSacs === 0) {
      showAlert("⚠️ " + t('collecte.errors.nothing_to_close'),
        t('collecte.errors.scan_at_least_one'), "warning");
      return;
    }
    if (!(await showConfirm(t('collecte.close_collection'),
      `${nbBlancs} ${t('collecte.white_linens')}${nbBlancs > 1 ? "s" : ""} + ${nbSacs} ${t('collecte.infected_sacs')}${nbSacs > 1 ? "s" : ""}`,
      "question"))) return;
    setLoading(true);
    try {
      const res = await apiCall(`/api/collecte/service/${collecte.id}/cloturer`);
      setResume({ ...res, serviceNom: collecte.serviceNom });
      setEtape("RESUME");
    } catch (e) { showAlert("❌ " + e.message, "", "error"); } finally { setLoading(false); }
  }, [collecte, sacsDeclares, showAlert, showConfirm, t]);

  const handleScan = useCallback(async code => {
    setScanVal("");
    if (etape === "SERVICE") { await handleService(code); return; }
    if (etape === "BAC") { await handleBac(code); return; }
    if (etape === "SCAN") { await handleScanBlanc(code); }
  }, [etape, handleService, handleBac, handleScanBlanc]);

  const reset = () => {
    setCollecte(null);
    setBacBlanc(null);
    setSacsDeclares([]);
    setResume(null);
    setEtape("SERVICE");
    setScanVal("");
    setScanStatus(null);
    setTimeout(() => scanInputRef.current?.focus(), 200);
  };

  const nbBlancs = collecte?.linges?.filter(l => l.statut === "BLANC").length || 0;
  const nbPropres = collecte?.linges?.filter(l => l.statut === "PROPRE").length || 0;
  const nbManq = collecte?.linges?.filter(l => l.statut === "MANQUANT").length || 0;
  const nbNonTr = collecte?.linges?.filter(l => !l.statut).length || 0;
  const nbInfectes = sacsDeclares.reduce((s, sac) => s + (sac.quantite || 0), 0);

  const ETAPES = [
    { id: "SERVICE", label: t('collecte.service'), done: !!collecte },
    { id: "BAC", label: t('collecte.white_bac'), done: !!bacBlanc },
    { id: "SCAN", label: t('collecte.scan'), done: etape === "RESUME" },
  ];

  const getPlaceholder = () => {
    if (!agent) return "👤 " + t('collecte.agent_not_connected');
    if (!collecte) return "🏢 " + t('collecte.scan_service_code');
    if (!bacBlanc) return "📦 " + t('collecte.scan_white_bac');
    if (etape === "RESUME") return "🔒 " + t('collecte.collection_closed');
    return "🏷️ " + t('collecte.scan_white_linens');
  };

  const isCloturee = etape === "RESUME";

  return (
    <div className="collecte-container">
      <DlgSacInfecte visible={dlgSac} collecteId={collecte?.id}
        onValider={handleSacInfecte} onClose={() => setDlgSac(false)} t={t} />
      <DlgManquant linge={dlgManq}
        onOk={handleManquant} onClose={() => setDlgManq(null)} t={t} />

      {/* ─── EN-TÊTE ─────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: "32px" }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          marginBottom: "8px"
        }}>
          <div style={{
            width: "56px",
            height: "56px",
            borderRadius: "18px",
            background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            boxShadow: "0 6px 20px rgba(124, 58, 237, 0.3)"
          }}>
            <FaBuilding size={26} />
          </div>
          <div>
            <h1 style={{
              fontSize: "28px",
              fontWeight: 800,
              color: "#0f172a",
              margin: 0
            }}>
              {t('collecte.service_collection')}
            </h1>
            <p style={{
              fontSize: "14px",
              color: "#64748b",
              margin: "2px 0 0 0"
            }}>
              {agent ? `${t('collecte.agent')}: ${agent.nomPrenom || agent.nom}` : t('collecte.no_agent_connected')}
            </p>
          </div>
        </div>
      </div>

      <div style={{
        background: "white",
        borderRadius: "20px",
        padding: "32px",
        border: "1px solid #e2e8f0",
        boxShadow: "0 4px 20px rgba(0,0,0,0.06)"
      }}>

        {/* ─── BARRE SUPÉRIEURE ─────────────────────────────────────────── */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "12px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            {agent && (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px 18px",
                background: "#faf5ff",
                borderRadius: "12px",
                border: "1px solid #e9d5ff"
              }}>
                <FaUser color="#7c3aed" size={16} />
                <span style={{ fontWeight: 700, color: "#7c3aed", fontSize: "14px" }}>
                  {agent.nomPrenom || agent.nom}
                </span>
                <Badge style={{ background: "#ede9fe", color: "#7c3aed", fontSize: "10px", padding: "2px 10px", borderRadius: "12px" }}>
                  {agent.codeBarre || agent.matricule}
                </Badge>
              </div>
            )}
            {collecte && (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px 18px",
                background: "#f0f9ff",
                borderRadius: "12px",
                border: "1px solid #bae6fd"
              }}>
                <FaBuilding color="#0284c7" size={16} />
                <span style={{ fontWeight: 700, color: "#0284c7", fontSize: "14px" }}>{collecte.serviceNom}</span>
                <Badge style={{ background: "#e0f2fe", color: "#0284c7", fontSize: "10px", padding: "2px 10px", borderRadius: "12px" }}>
                  {collecte.nbAttendus} {t('collecte.linens')}
                </Badge>
              </div>
            )}
            {bacBlanc && (
              <Badge style={{ background: "#ede9fe", color: "#7c3aed", fontSize: "11px", padding: "4px 14px", borderRadius: "12px" }}>
                📦 {bacBlanc.codeBac}
              </Badge>
            )}
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <Button
              variant="outline"
              size="sm"
              onClick={reset}
              style={{
                fontSize: "12px",
                gap: "6px",
                borderColor: "#fca5a5",
                color: "#dc2626",
                borderRadius: "10px",
                padding: "6px 14px"
              }}
            >
              <FaRedo size={10} />
              {t('common.reset')}
            </Button>
          </div>
        </div>

        {/* ─── ZONE DE SCAN ────────────────────────────────────────────── */}
        <Card style={{
          marginBottom: "20px",
          border: `2px dashed ${isCloturee ? "#e2e8f0" : "#7c3aed"}`,
          background: isCloturee ? "#f8fafc" : "white",
          borderRadius: "16px"
        }}>
          <CardContent className="p-5">
            <ScanInput
              ref={scanInputRef}
              placeholder={getPlaceholder()}
              value={scanVal}
              onChange={setScanVal}
              onSubmit={handleScan}
              borderColor={isCloturee ? "#e2e8f0" : "#7c3aed"}
              keepFocus={true}
              autoDebounce={true}
              disabled={isCloturee || loading || !agent}
            />
            {scanStatus && <ScanStatus {...scanStatus} t={t} />}
          </CardContent>
        </Card>

        {/* ─── INFO AGENT ────────────────────────────────────────────────── */}
        {!agent && (
          <Card style={{ background: "#fef2f2", border: "1px solid #fca5a5", marginBottom: "16px", borderRadius: "12px" }}>
            <CardContent className="p-4">
              <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px" }}>
                <FaExclamationTriangle color="#dc2626" size={16} />
                <span style={{ fontWeight: 600, color: "#dc2626" }}>{t('collecte.no_agent_connected')}</span>
                <span style={{ color: "#64748b" }}>{t('collecte.connect_to_collect')}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {agent && !collecte && (
          <Card style={{ background: "#faf5ff", border: "1px solid #e9d5ff", marginBottom: "16px", borderRadius: "12px" }}>
            <CardContent className="p-4">
              <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px" }}>
                <FaBuilding color="#7c3aed" size={16} />
                <span style={{ fontWeight: 600, color: "#7c3aed" }}>{t('collecte.scan_service_code')}</span>
                <span style={{ color: "#64748b" }}>{t('collecte.to_start_collection')}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {agent && collecte && !bacBlanc && etape !== "RESUME" && (
          <Card style={{ background: "#f0f9ff", border: "1px solid #bae6fd", marginBottom: "16px", borderRadius: "12px" }}>
            <CardContent className="p-4">
              <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px" }}>
                <FaBoxes color="#0284c7" size={16} />
                <span style={{ fontWeight: 600, color: "#0284c7" }}>{t('collecte.scan_white_bac')}</span>
                <span style={{ color: "#64748b" }}>{t('collecte.to_associate_linens')}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {agent && collecte && bacBlanc && etape === "SCAN" && (
          <Card style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", marginBottom: "16px", borderRadius: "12px" }}>
            <CardContent className="p-4">
              <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", flexWrap: "wrap" }}>
                <FaCheckCircle color="#22c55e" size={16} />
                <span style={{ fontWeight: 600, color: "#15803d" }}>{t('collecte.ready_to_collect')}</span>
                <span style={{ color: "#64748b" }}>{t('collecte.scan_linens_to_collect')}</span>
                <Badge style={{ background: "#dcfce7", color: "#15803d", fontSize: "10px", padding: "2px 12px", borderRadius: "12px" }}>
                  {t('collecte.bac')} {bacBlanc.codeBac}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ─── TABLEAU DE BORD ──────────────────────────────────────────── */}
        {etape === "SCAN" && collecte && (
          <>
            {/* ─── BANNIÈRE CLÔTURE ─────────────────────────────────────── */}
            {isCloturee && (
              <div style={{
                padding: "20px",
                borderRadius: "14px",
                background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
                border: "2px solid #86efac",
                textAlign: "center",
                marginBottom: "20px"
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "14px" }}>
                  <div style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    background: "#dcfce7",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    <FaCheckDouble color="#22c55e" size={24} />
                  </div>
                  <div>
                    <p style={{ fontSize: "20px", fontWeight: 700, color: "#15803d", margin: 0 }}>✓ {t('collecte.collection_completed')}</p>
                    <p style={{ fontSize: "14px", color: "#059669", margin: 0 }}>
                      {collecte.nbAttendus} {t('collecte.linens_processed')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ─── STATUTS ───────────────────────────────────────────────── */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: "12px",
              marginBottom: "20px"
            }}>
              <StatutCard
                label={t('collecte.white')}
                value={nbBlancs}
                icon="✅"
                color="#15803d"
                bg="#f0fdf4"
                subValue={`${collecte.nbAttendus} ${t('collecte.expected')}`}
              />
              <StatutCard
                label={t('collecte.infected')}
                value={nbInfectes}
                icon="🔴"
                color="#dc2626"
                bg="#fef2f2"
                subValue={`${sacsDeclares.length} ${t('collecte.sacs')}`}
              />
              <StatutCard
                label={t('collecte.propre')}
                value={nbPropres}
                icon="🔵"
                color="#0284c7"
                bg="#f0f9ff"
                subValue={t('collecte.kept_in_place')}
              />
              <StatutCard
                label={t('collecte.missing')}
                value={nbManq}
                icon="⚠️"
                color="#d97706"
                bg="#fffbeb"
                subValue={t('collecte.to_report')}
              />
            </div>

            {/* ─── SACS DÉCLARÉS ─────────────────────────────────────────── */}
            {sacsDeclares.length > 0 && (
              <div style={{
                padding: "14px 18px",
                background: "#fef2f2",
                borderRadius: "12px",
                border: "1px solid #fca5a5",
                marginBottom: "16px"
              }}>
                <div style={{ fontSize: "12px", color: "#dc2626", fontWeight: 700, marginBottom: "8px" }}>
                  🔴 {t('collecte.infected_sacs_declared')} :
                </div>
                {sacsDeclares.map((s, i) => {
                  const c = cat(s.categorie);
                  return (
                    <div key={i} style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      fontSize: "12px",
                      color: "#dc2626",
                      marginBottom: "4px"
                    }}>
                      <span>{c.emoji}</span>
                      <span style={{ fontWeight: 600 }}>
                        {s.quantite} {c.label}{s.quantite > 1 ? "s" : ""}
                      </span>
                      <span style={{ color: "#94a3b8", marginLeft: "auto" }}>
                        {s.numeroSac}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ─── BOUTONS ───────────────────────────────────────────────── */}
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button onClick={() => setDlgSac(true)}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "10px",
                  border: "2px solid #fca5a5",
                  background: "#fff5f5",
                  color: "#dc2626",
                  fontWeight: 700,
                  fontSize: "13px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  minWidth: "140px"
                }}>
                <FaBiohazard size={14} />
                {t('collecte.declare_infected')} 🔴
              </button>

              <button onClick={handleCloturer} disabled={loading}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "10px",
                  border: "none",
                  background: loading ? "#e2e8f0"
                    : "linear-gradient(135deg, #7c3aed, #6d28d9)",
                  color: loading ? "#94a3b8" : "white",
                  fontWeight: 700,
                  fontSize: "13px",
                  cursor: loading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "7px",
                  minWidth: "140px"
                }}>
                {loading
                  ? <FaSpinner style={{ animation: "spin 1s linear infinite" }} />
                  : <><FaCheckDouble size={12} /> {t('collecte.finish_and_close')}</>}
              </button>
            </div>
          </>
        )}

        {/* ─── RÉSUMÉ ────────────────────────────────────────────────────── */}
        {etape === "RESUME" && resume && (
          <div style={{
            background: "#f0fdf4",
            borderRadius: "18px",
            padding: "26px",
            border: "2px solid #22c55e",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "48px", marginBottom: "10px" }}>✅</div>
            <div style={{ fontWeight: 900, fontSize: "20px", color: "#15803d", marginBottom: "16px" }}>
              {t('collecte.collection_completed')} — {resume.serviceNom || collecte?.serviceNom}
            </div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "8px",
              marginBottom: "20px"
            }}>
              {[
                [t('collecte.white'), resume.nbBlancs, "#dcfce7", "#15803d"],
                [t('collecte.infected'), resume.nbInfectes, "#fee2e2", "#dc2626"],
                [t('collecte.propre'), resume.nbPropres, "#dbeafe", "#0284c7"],
                [t('collecte.missing_short'), resume.nbManquants, "#fef3c7", "#d97706"],
              ].map(([l, v, bg, co]) => (
                <div key={l} style={{ background: bg, borderRadius: "10px", padding: "10px 4px" }}>
                  <div style={{ fontSize: "22px", fontWeight: 900, color: co }}>{v || 0}</div>
                  <div style={{ fontSize: "10px", color: co, fontWeight: 600 }}>{l}</div>
                </div>
              ))}
            </div>
            {sacsDeclares.length > 0 && (
              <div style={{
                padding: "8px 12px",
                background: "#fff5f5",
                borderRadius: "9px",
                fontSize: "12px",
                color: "#dc2626",
                fontWeight: 600,
                marginBottom: "16px"
              }}>
                🔴 {sacsDeclares.length} {t('collecte.sac')}{sacsDeclares.length > 1 ? "s" : ""} {t('collecte.infected')}
                → {t('collecte.waiting_for_reception')}
              </div>
            )}
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => {
                setCollecte(null);
                setBacBlanc(null);
                setSacsDeclares([]);
                setResume(null);
                setEtape("SERVICE");
              }} style={{
                flex: 1,
                padding: "11px",
                borderRadius: "10px",
                border: "none",
                background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                color: "white",
                fontWeight: 700,
                fontSize: "13px",
                cursor: "pointer"
              }}>
                + {t('collecte.another_service')}
              </button>
              <button onClick={reset} style={{
                flex: 1,
                padding: "11px",
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
                background: "white",
                color: "#64748b",
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer"
              }}>
                {t('collecte.finish')}
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}

export default function CollageListService() {
  return <CollageListServiceInner />;
}