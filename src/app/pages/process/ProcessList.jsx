import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FaUser, FaSpinner, FaCheckCircle, FaTimes,
  FaBarcode, FaBuilding, FaShieldAlt, FaHospital
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { useModal } from "../../contextes/ModalContext";
import "../Linge/WorkflowList.css";

const API = "http://localhost:8082";

// ─── Mapping poste → route ──────────────────────────────────────────────────
const POSTE_TO_ROUTE = {
  AGENT_COLLECTE: "/collecte",
  AGENT_RECEPTION: "/receptions",
  AGENT_TRI: "/tri",
  AGENT_LAVAGE: "/lavages",
  AGENT_SECHAGE: "/sechages",
  AGENT_PLIAGE: "/pliage",
  AGENT_STOCKAGE: "/stockage",
  AGENT_LIVRAISON: "/livraisons",
  CHEF_EQUIPE: "/collecte"
};

export default function Authentification() {
  const navigate = useNavigate();
  const { showAlert } = useModal();
  
  const [scanValue, setScanValue] = useState("");
  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isFocused, setIsFocused] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  
  const scanInputRef = useRef(null);
  const scanTimeoutRef = useRef(null);

  // ─── Vérifier si un agent est déjà connecté ──────────────────────────────
  useEffect(() => {
    const savedAgent = localStorage.getItem("agent");
    if (savedAgent) {
      try {
        const parsed = JSON.parse(savedAgent);
        setAgent(parsed);
        setTimeout(() => {
          const route = POSTE_TO_ROUTE[parsed.poste] || "/collecte";
          navigate(route);
        }, 2000);
      } catch (e) {
        localStorage.removeItem("agent");
      }
    }
  }, [navigate]);

  // ─── Focus ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    setTimeout(() => {
      if (scanInputRef.current) {
        scanInputRef.current.focus();
        setIsFocused(true);
      }
    }, 300);
  }, []);

  // ─── Scan automatique ──────────────────────────────────────────────────────
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

  // ─── Authentification ──────────────────────────────────────────────────────
  const handleScan = useCallback(async (code) => {
    if (!code) return;
    setLoading(true);
    setError(null);
    setRedirecting(false);
    
    try {
      const res = await fetch(`${API}/api/agents/matricule/${code}`);
      
      if (!res.ok) {
        setError("Matricule non reconnu");
        showAlert("Agent introuvable", "Vérifiez votre matricule", "error");
        setLoading(false);
        return;
      }
      
      const ag = await res.json();
      
      if (!ag.poste || !POSTE_TO_ROUTE[ag.poste]) {
        setError("Poste non configuré");
        showAlert("Poste non configuré", `${ag.nom} n'a pas de poste attribué.`, "warning");
        setLoading(false);
        return;
      }
      
      const agentData = {
        matricule: ag.matricule,
        nom: ag.nom,
        poste: ag.poste
      };
      localStorage.setItem("agent", JSON.stringify(agentData));
      
      setAgent(agentData);
      setRedirecting(true);
      showAlert("Authentifié", `Bienvenue ${ag.nom}`, "success");
      
      setTimeout(() => {
        const route = POSTE_TO_ROUTE[ag.poste];
        navigate(route);
      }, 1500);
      
    } catch (error) {
      setError("Erreur de connexion");
      showAlert("Erreur réseau", "Impossible de contacter le serveur", "error");
      console.error("Erreur scan:", error);
    } finally {
      setLoading(false);
    }
  }, [showAlert, navigate]);

  // ─── Déconnexion ──────────────────────────────────────────────────────────
  const handleLogout = () => {
    localStorage.removeItem("agent");
    setAgent(null);
    setScanValue("");
    setError(null);
    setRedirecting(false);
    showAlert("Déconnecté", "Vous avez été déconnecté", "info");
    setTimeout(() => scanInputRef.current?.focus(), 200);
  };

  // ─── Redirection si agent déjà connecté ──────────────────────────────────
  if (agent && !redirecting) {
    const route = POSTE_TO_ROUTE[agent.poste] || "/collecte";
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundImage: "url('https://images.unsplash.com/photo-1584225064785-c62a8b43d148?w=1920&q=80')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        padding: "24px",
        position: "relative"
      }}>
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(15, 23, 42, 0.6)",
          backdropFilter: "blur(4px)"
        }} />
        <div style={{
          maxWidth: "420px",
          width: "100%",
          background: "white",
          borderRadius: "24px",
          padding: "40px",
          textAlign: "center",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          position: "relative",
          zIndex: 1
        }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>👤</div>
          <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#0f172a", marginBottom: "4px" }}>
            {agent.nom}
          </h2>
          <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "8px" }}>
            {agent.matricule} · {agent.poste?.replace("AGENT_", "") || "Poste"}
          </p>
          <div style={{
            padding: "10px",
            borderRadius: "12px",
            background: "#dbeafe",
            color: "#1d4ed8",
            fontSize: "13px",
            fontWeight: 600,
            marginBottom: "20px"
          }}>
            Redirection en cours...
          </div>
          <button
            onClick={handleLogout}
            style={{
              padding: "10px 24px",
              borderRadius: "10px",
              border: "1px solid #e2e8f0",
              background: "white",
              color: "#64748b",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 500
            }}
          >
            Se déconnecter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      backgroundImage: "url('https://images.unsplash.com/photo-1582735689369-4fe89db7114c?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      padding: "24px",
      position: "relative"
    }}>
      
      {/* ─── Overlay sombre ──────────────────────────────────────────────────── */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(15, 23, 42, 0.5)",
        backdropFilter: "blur(3px)"
      }} />
      
      {/* ─── Carte de login ────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          maxWidth: "440px",
          width: "100%",
          borderRadius: "24px",
          overflow: "hidden",
          boxShadow: "0 24px 80px rgba(0,0,0,0.3)",
          position: "relative",
          zIndex: 1,
          background: "white"
        }}
      >
        {/* ─── Contenu ───────────────────────────────────────────────────────── */}
        <div style={{
          padding: "40px 36px",
          background: "white"
        }}>

          {/* ─── Logo centré ────────────────────────────────────────────────── */}
          <div style={{ textAlign: "center", marginBottom: "28px" }}>
            <div style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: "14px"
            }}>
              <img 
                src="https://cdn.polyclinique-ibnkhaldoun.com.tn/wp-content/uploads/2019/01/LOGO-ibnkhaldoun.jpg"
                alt="Polyclinique Ibn Khaldoun Sfax"
                style={{
                  maxWidth: "200px",
                  height: "auto",
                  display: "block"
                }}
                onError={(e) => {
                  e.target.style.display = "none";
                  const fallback = document.createElement("div");
                  fallback.style.cssText = `
                    fontSize: 52px;
                    display: flex;
                    justifyContent: center;
                    alignItems: center;
                    width: 80px;
                    height: 80px;
                    margin: 0 auto;
                    background: linear-gradient(135deg, #1e3a5f, #2d6a9f);
                    borderRadius: 20px;
                    color: white;
                  `;
                  fallback.textContent = "🏥";
                  e.target.parentNode.insertBefore(fallback, e.target);
                }}
              />
            </div>
            
            <h1 style={{
              fontSize: "22px",
              fontWeight: 700,
              color: "#0f172a",
              margin: "0 0 4px 0",
              letterSpacing: "-0.5px"
            }}>
              Authentification
            </h1>
            <p style={{
              fontSize: "14px",
              color: "#64748b",
              margin: 0,
              fontWeight: 400
            }}>
              Scannez votre badge agent
            </p>
          </div>

          {/* ─── Zone de scan ────────────────────────────────────────────────── */}
          <div style={{ marginBottom: "20px" }}>
            <div style={{
              position: "relative",
              background: "#f8fafc",
              borderRadius: "14px",
              border: `2px solid ${error ? "#ef4444" : isFocused ? "#2563eb" : "#e2e8f0"}`,
              transition: "all 0.2s",
              boxShadow: isFocused ? "0 0 0 4px rgba(37,99,235,0.08)" : "none"
            }}>
              <div style={{
                position: "absolute",
                left: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                color: isFocused ? "#2563eb" : "#94a3b8"
              }}>
                <FaBarcode size={18} />
              </div>
              <input
                ref={scanInputRef}
                type="text"
                placeholder="Scanner votre badge..."
                value={scanValue}
                onChange={(e) => setScanValue(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "16px 16px 16px 46px",
                  borderRadius: "12px",
                  border: "none",
                  fontSize: "16px",
                  background: "transparent",
                  outline: "none",
                  boxSizing: "border-box",
                  color: "#0f172a",
                  cursor: loading ? "not-allowed" : "text"
                }}
                autoFocus
              />
              {scanValue && !loading && (
                <button
                  type="button"
                  onClick={() => setScanValue("")}
                  style={{
                    position: "absolute",
                    right: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#94a3b8",
                    padding: "4px"
                  }}
                >
                  <FaTimes size={16} />
                </button>
              )}
              {loading && (
                <div style={{
                  position: "absolute",
                  right: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#2563eb"
                }}>
                  <FaSpinner style={{ animation: "spin 1s linear infinite" }} size={18} />
                </div>
              )}
            </div>

            {/* ─── Statut ────────────────────────────────────────────────────── */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              marginTop: "10px",
              fontSize: "13px",
              color: error ? "#dc2626" : "#64748b",
              minHeight: "24px"
            }}>
              {error ? (
                <>
                  <FaTimes size={14} color="#dc2626" />
                  <span>{error}</span>
                </>
              ) : loading ? (
                <>
                  <FaSpinner style={{ animation: "spin 1s linear infinite" }} size={14} color="#2563eb" />
                  <span style={{ color: "#2563eb" }}>Vérification...</span>
                </>
              ) : (
                <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                  {isFocused ? "📷 Lecteur prêt" : "Cliquez pour activer le scan"}
                </span>
              )}
            </div>
          </div>

          {/* ─── Bouton manuel ──────────────────────────────────────────────── */}
          <button
            onClick={() => {
              if (scanValue.trim()) {
                handleScan(scanValue.trim());
              }
            }}
            disabled={loading || !scanValue.trim()}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "12px",
              border: "none",
              background: loading || !scanValue.trim()
                ? "#e2e8f0"
                : "linear-gradient(135deg, #1e3a5f, #2d6a9f)",
              color: loading || !scanValue.trim() ? "#94a3b8" : "white",
              fontWeight: 600,
              fontSize: "15px",
              cursor: loading || !scanValue.trim() ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px"
            }}
          >
            {loading ? "..." : <><FaShieldAlt size={16} /> S'authentifier</>}
          </button>

          {/* ─── Footer ──────────────────────────────────────────────────────── */}
          <div style={{
            marginTop: "20px",
            paddingTop: "16px",
            borderTop: "1px solid #f1f5f9",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontSize: "12px",
            color: "#94a3b8",
            gap: "16px"
          }}>
            <span>Polyclinique Ibn Khaldoun</span>
            <span>•</span>
            <span>Sfax</span>
          </div>

          {/* ─── Message de redirection ──────────────────────────────────────── */}
          <AnimatePresence>
            {redirecting && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{
                  marginTop: "16px",
                  padding: "12px 16px",
                  borderRadius: "12px",
                  background: "#dcfce7",
                  border: "1px solid #86efac",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px"
                }}
              >
                <FaCheckCircle color="#16a34a" size={18} />
                <div>
                  <div style={{ fontWeight: 600, color: "#15803d", fontSize: "13px" }}>
                    Authentification réussie
                  </div>
                  <div style={{ fontSize: "12px", color: "#64748b" }}>
                    Redirection vers votre poste...
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </motion.div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}