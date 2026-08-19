import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FaBuilding, FaUser, FaBarcode, FaTimes, FaArrowRight,
  FaTruck, FaBoxes, FaWarehouse, FaSoap, FaWind,
  FaHands, FaHome, FaCheckCircle, FaSpinner,
  FaLongArrowAltDown, FaCog, FaIndustry, FaNetworkWired,
  FaMicrochip, FaRobot, FaChartLine
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { useModal } from "../../contextes/ModalContext";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import ScanInput from "../../components/utils/shared/ScanInput";
import "../Linge/WorkflowList.css";

const API = "http://localhost:8082";

const ETAPES = [
  { id: "Collecte", route: "/collecte", icon: FaTruck, zone: "sale", gradient: "from-purple-600 to-purple-400" },
  { id: "Reception", route: "/receptions", icon: FaBoxes, zone: "sale", gradient: "from-amber-600 to-amber-400" },
  { id: "Tri", route: "/tri", icon: FaHands, zone: "sale", gradient: "from-pink-600 to-pink-400" },
  { id: "Lavage", route: "/lavages", icon: FaSoap, zone: "sale", gradient: "from-blue-600 to-blue-400" },
  { id: "Sechage", route: "/sechages", icon: FaWind, zone: "propre", gradient: "from-teal-600 to-teal-400" },
  { id: "Pliage", route: "/pliage", icon: FaHands, zone: "propre", gradient: "from-violet-600 to-violet-400" },
  { id: "Stockage", route: "/stockage", icon: FaWarehouse, zone: "propre", gradient: "from-emerald-600 to-emerald-400" },
  { id: "Livraison", route: "/livraisons", icon: FaHome, zone: "propre", gradient: "from-red-600 to-red-400" }
];

const POSTE_TO_ETAPE = {
  AGENT_COLLECTE: "Collecte",
  AGENT_RECEPTION: "Reception",
  AGENT_TRI: "Tri",
  AGENT_LAVAGE: "Lavage",
  AGENT_SECHAGE: "Sechage",
  AGENT_PLIAGE: "Pliage",
  AGENT_STOCKAGE: "Stockage",
  AGENT_LIVRAISON: "Livraison",
  CHEF_EQUIPE: "Collecte"
};

export default function ProcessList() {
  const navigate = useNavigate();
  const { showAlert } = useModal();
  const [agent, setAgent] = useState(null);
  const [scanValue, setScanValue] = useState("");
  const [isFocused, setIsFocused] = useState(true);
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const scanInputRef = useRef(null);

  useEffect(() => {
    setTimeout(() => {
      if (scanInputRef.current) {
        scanInputRef.current.focus();
        setIsFocused(true);
      }
    }, 300);
  }, []);

  const execScanAgent = useCallback(async (code) => {
    setLoading(true);
    setRedirecting(false);
    try {
      const res = await fetch(`${API}/agents/matricule/${code}`);
      if (!res.ok) { 
        showAlert("❌ Agent introuvable", "Matricule non reconnu", "error"); 
        return; 
      }
      const ag = await res.json();
      setAgent(ag);
      setScanValue("");
      
      showAlert("✅ Agent identifié", `${ag.nom} (${ag.matricule})`, "success");
      
      const etapeNom = POSTE_TO_ETAPE[ag.poste];
      if (etapeNom) {
        const etape = ETAPES.find(e => e.id === etapeNom);
        if (etape?.route) {
          setRedirecting(true);
          setTimeout(() => {
            navigate(etape.route);
          }, 1500);
        }
      } else {
        showAlert("⚠️ Poste non reconnu", `L'agent ${ag.nom} n'a pas de poste configuré.`, "warning");
      }
    } catch (error) {
      showAlert("❌ Erreur réseau", "Impossible de contacter le serveur", "error");
      console.error("Erreur scan agent:", error);
    } finally { 
      setLoading(false); 
    }
  }, [showAlert, navigate]);

  const handleScan = (code) => {
    if (!code) return;
    execScanAgent(code);
  };

  const handleReset = () => {
    setAgent(null);
    setScanValue("");
    setRedirecting(false);
  };

  const etapeActive = agent ? ETAPES.find(e => e.id === POSTE_TO_ETAPE[agent?.poste]) : null;
  const etapeIndex = etapeActive ? ETAPES.indexOf(etapeActive) : -1;

  const zoneSale = ETAPES.slice(0, 4);
  const zonePropre = ETAPES.slice(4);

  return (
    <div style={{
      minHeight: "calc(100vh - 80px)",
      background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
      padding: "24px",
      display: "flex",
      justifyContent: "center",
      alignItems: "center"
    }}>
      
      <div style={{
        maxWidth: "1100px",
        width: "100%",
        background: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(20px)",
        borderRadius: "32px",
        padding: "32px 40px",
        border: "1px solid rgba(255,255,255,0.3)",
        boxShadow: "0 25px 80px rgba(0,0,0,0.08), 0 4px 20px rgba(0,0,0,0.02)"
      }}>

        {/* ─── Header ────────────────────────────────────────────────────────── */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "28px",
          flexWrap: "wrap",
          gap: "16px"
        }}>
          <div>
            <h1 style={{
              fontSize: "28px",
              fontWeight: 800,
              background: "linear-gradient(135deg, #0f172a, #334155)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              margin: 0
            }}>
              <span style={{
                width: "44px",
                height: "44px",
                borderRadius: "14px",
                background: "linear-gradient(135deg, #1e293b, #475569)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                WebkitTextFillColor: "white"
              }}>
                <FaIndustry size={20} />
              </span>
              Processus Buanderie
            </h1>
            <p style={{ color: "#64748b", margin: "4px 0 0 0", fontSize: "14px" }}>
              {agent 
                ? `👤 ${agent.nom} · ${etapeActive?.id || agent.poste || "Poste non configuré"}`
                : "🔑 Authentification requise pour accéder au poste"}
            </p>
          </div>
          
          {agent && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={handleReset}
              style={{
                padding: "8px 18px",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                background: "white",
                cursor: "pointer",
                fontSize: "12px",
                color: "#64748b",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.2s",
                boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.borderColor = "#cbd5e1"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "white"; e.currentTarget.style.borderColor = "#e2e8f0"; }}
            >
              <FaTimes size={12} />
              Changer d'agent
            </motion.button>
          )}
        </div>

        {/* ─── Zone de Scan ──────────────────────────────────────────────────── */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "32px"
        }}>
          <div style={{
            width: "65%",
            maxWidth: "600px",
            position: "relative"
          }}>
            <div style={{
              position: "relative",
              background: "white",
              borderRadius: "16px",
              padding: "4px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.04), 0 1px 4px rgba(0,0,0,0.02)"
            }}>
              <div style={{
                position: "absolute",
                top: "-2px",
                left: "-2px",
                right: "-2px",
                bottom: "-2px",
                borderRadius: "18px",
                background: agent ? "linear-gradient(135deg, #10b981, #059669)" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                opacity: 0.15,
                zIndex: -1
              }} />
              <ScanInput
                placeholder={!agent ? "👤 Scanner votre badge agent..." : "✅ Agent connecté - Scannez pour changer"}
                value={scanValue}
                onChange={setScanValue}
                onSubmit={handleScan}
                borderColor="transparent"
                keepFocus={true}
                autoDebounce={true}
                style={{
                  border: "none",
                  background: "transparent",
                  padding: "14px 20px",
                  fontSize: "15px"
                }}
              />
            </div>
            
            {agent && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "12px",
                  marginTop: "12px",
                  padding: "8px 20px",
                  background: "linear-gradient(135deg, #ecfdf5, #d1fae5)",
                  borderRadius: "12px",
                  border: "1px solid #6ee7b7"
                }}
              >
                <FaCheckCircle color="#059669" size={16} />
                <span style={{ fontWeight: 600, color: "#065f46", fontSize: "14px" }}>{agent.nom}</span>
                <span style={{ 
                  fontSize: "11px", 
                  background: "#059669", 
                  color: "white",
                  padding: "2px 12px",
                  borderRadius: "20px",
                  fontWeight: 600
                }}>
                  {agent.matricule}
                </span>
                <span style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#065f46",
                  background: "rgba(5,150,105,0.15)",
                  padding: "2px 12px",
                  borderRadius: "20px"
                }}>
                  {etapeActive?.id || "Poste"}
                </span>
                {redirecting && (
                  <span style={{ fontSize: "11px", color: "#3b82f6", animation: "pulse 1s infinite" }}>
                    Redirection...
                  </span>
                )}
              </motion.div>
            )}
          </div>
        </div>

        {/* ─── Processus ────────────────────────────────────────────────────── */}
        <div style={{
          display: "flex",
          gap: "24px",
          alignItems: "center",
          justifyContent: "center"
        }}>

          {/* ─── Zone Sale ──────────────────────────────────────────────────── */}
          <div style={{
            flex: 1,
            background: "linear-gradient(180deg, #fef2f2 0%, #fecaca 100%)",
            borderRadius: "20px",
            padding: "20px 16px",
            border: "1px solid #fca5a5",
            boxShadow: "0 4px 20px rgba(220,38,38,0.06)"
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "16px",
              paddingBottom: "12px",
              borderBottom: "2px solid rgba(220,38,38,0.15)"
            }}>
              <div style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#dc2626",
                boxShadow: "0 0 12px rgba(220,38,38,0.3)"
              }} />
              <span style={{ fontWeight: 700, color: "#991b1b", fontSize: "13px", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                Zone Sale
              </span>
              <span style={{ fontSize: "10px", color: "#7f1d1d", marginLeft: "auto" }}>
                ⚡ {zoneSale.length} étapes
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {zoneSale.map((etape, idx) => {
                const isActive = agent && POSTE_TO_ETAPE[agent.poste] === etape.id;
                const Icon = etape.icon;
                const isPast = etapeIndex > idx && agent;
                const isNext = etapeIndex + 1 === idx && agent;
                
                return (
                  <React.Fragment key={etape.id}>
                    <motion.div
                      onClick={() => {
                        if (agent && isActive) {
                          navigate(etape.route);
                        }
                      }}
                      whileHover={isActive ? { scale: 1.02 } : {}}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "12px 16px",
                        borderRadius: "12px",
                        background: isActive 
                          ? "linear-gradient(135deg, #dc2626, #b91c1c)" 
                          : isPast 
                            ? "rgba(255,255,255,0.5)" 
                            : "rgba(255,255,255,0.7)",
                        border: isActive 
                          ? "2px solid #dc2626" 
                          : isPast 
                            ? "1px solid rgba(220,38,38,0.2)" 
                            : "1px solid rgba(255,255,255,0.5)",
                        boxShadow: isActive 
                          ? "0 4px 20px rgba(220,38,38,0.2)" 
                          : "0 1px 4px rgba(0,0,0,0.02)",
                        cursor: isActive ? "pointer" : "default",
                        transition: "all 0.3s",
                        opacity: isPast ? 0.7 : 1
                      }}
                    >
                      <div style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "10px",
                        background: isActive 
                          ? "rgba(255,255,255,0.2)" 
                          : isPast 
                            ? "rgba(220,38,38,0.1)" 
                            : "rgba(220,38,38,0.05)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: isActive ? "white" : (isPast ? "#991b1b" : "#dc2626")
                      }}>
                        <Icon size={14} />
                      </div>
                      <span style={{
                        fontSize: "13px",
                        fontWeight: isActive ? 700 : 500,
                        color: isActive ? "white" : (isPast ? "#7f1d1d" : "#1e293b")
                      }}>
                        {etape.id}
                      </span>
                      {isActive && (
                        <span style={{
                          fontSize: "8px",
                          fontWeight: 700,
                          color: "white",
                          background: "rgba(255,255,255,0.2)",
                          padding: "2px 10px",
                          borderRadius: "20px",
                          marginLeft: "auto",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px"
                        }}>
                          Actif
                        </span>
                      )}
                      {isPast && !isActive && (
                        <FaCheckCircle style={{ color: "#16a34a", marginLeft: "auto" }} size={12} />
                      )}
                      {isNext && !isActive && !isPast && (
                        <div style={{
                          marginLeft: "auto",
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          background: "#f59e0b",
                          boxShadow: "0 0 12px rgba(245,158,11,0.4)"
                        }} />
                      )}
                    </motion.div>
                    {idx < zoneSale.length - 1 && (
                      <motion.div
                        initial={{ opacity: 0.3 }}
                        animate={{ opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          padding: "2px 0",
                          color: "rgba(220,38,38,0.25)"
                        }}
                      >
                        <FaLongArrowAltDown size={14} />
                      </motion.div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* ─── Transition ──────────────────────────────────────────────────── */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "4px",
            padding: "0 4px",
            minWidth: "50px"
          }}>
            <div style={{
              width: "2px",
              height: "40px",
              background: "linear-gradient(to bottom, #dc2626, #f59e0b)"
            }} />
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #f59e0b, #d97706)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "18px",
                boxShadow: "0 4px 24px rgba(245,158,11,0.3)"
              }}
            >
              <FaRobot size={18} />
            </motion.div>
            <div style={{
              fontSize: "8px",
              fontWeight: 700,
              color: "#92400e",
              letterSpacing: "0.5px",
              textTransform: "uppercase",
              background: "rgba(245,158,11,0.1)",
              padding: "2px 12px",
              borderRadius: "20px",
              border: "1px solid rgba(245,158,11,0.2)"
            }}>
              Lavage
            </div>
            <div style={{
              width: "2px",
              height: "40px",
              background: "linear-gradient(to bottom, #f59e0b, #16a34a)"
            }} />
          </div>

          {/* ─── Zone Propre ────────────────────────────────────────────────── */}
          <div style={{
            flex: 1,
            background: "linear-gradient(180deg, #ecfdf5 0%, #a7f3d0 100%)",
            borderRadius: "20px",
            padding: "20px 16px",
            border: "1px solid #6ee7b7",
            boxShadow: "0 4px 20px rgba(22,163,74,0.06)"
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "16px",
              paddingBottom: "12px",
              borderBottom: "2px solid rgba(22,163,74,0.15)"
            }}>
              <div style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#16a34a",
                boxShadow: "0 0 12px rgba(22,163,74,0.3)"
              }} />
              <span style={{ fontWeight: 700, color: "#065f46", fontSize: "13px", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                Zone Propre
              </span>
              <span style={{ fontSize: "10px", color: "#065f46", marginLeft: "auto" }}>
                ✨ {zonePropre.length} étapes
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column-reverse", gap: "6px" }}>
              {zonePropre.map((etape, idx) => {
                const isActive = agent && POSTE_TO_ETAPE[agent.poste] === etape.id;
                const Icon = etape.icon;
                const globalIdx = ETAPES.indexOf(etape);
                const isPast = etapeIndex > globalIdx && agent;
                const isNext = etapeIndex + 1 === globalIdx && agent;
                
                return (
                  <React.Fragment key={etape.id}>
                    <motion.div
                      onClick={() => {
                        if (agent && isActive) {
                          navigate(etape.route);
                        }
                      }}
                      whileHover={isActive ? { scale: 1.02 } : {}}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "12px 16px",
                        borderRadius: "12px",
                        background: isActive 
                          ? "linear-gradient(135deg, #16a34a, #15803d)" 
                          : isPast 
                            ? "rgba(255,255,255,0.5)" 
                            : "rgba(255,255,255,0.7)",
                        border: isActive 
                          ? "2px solid #16a34a" 
                          : isPast 
                            ? "1px solid rgba(22,163,74,0.2)" 
                            : "1px solid rgba(255,255,255,0.5)",
                        boxShadow: isActive 
                          ? "0 4px 20px rgba(22,163,74,0.2)" 
                          : "0 1px 4px rgba(0,0,0,0.02)",
                        cursor: isActive ? "pointer" : "default",
                        transition: "all 0.3s",
                        opacity: isPast ? 0.7 : 1
                      }}
                    >
                      <div style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "10px",
                        background: isActive 
                          ? "rgba(255,255,255,0.2)" 
                          : isPast 
                            ? "rgba(22,163,74,0.1)" 
                            : "rgba(22,163,74,0.05)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: isActive ? "white" : (isPast ? "#065f46" : "#16a34a")
                      }}>
                        <Icon size={14} />
                      </div>
                      <span style={{
                        fontSize: "13px",
                        fontWeight: isActive ? 700 : 500,
                        color: isActive ? "white" : (isPast ? "#065f46" : "#1e293b")
                      }}>
                        {etape.id}
                      </span>
                      {isActive && (
                        <span style={{
                          fontSize: "8px",
                          fontWeight: 700,
                          color: "white",
                          background: "rgba(255,255,255,0.2)",
                          padding: "2px 10px",
                          borderRadius: "20px",
                          marginLeft: "auto",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px"
                        }}>
                          Actif
                        </span>
                      )}
                      {isPast && !isActive && (
                        <FaCheckCircle style={{ color: "#16a34a", marginLeft: "auto" }} size={12} />
                      )}
                      {isNext && !isActive && !isPast && (
                        <div style={{
                          marginLeft: "auto",
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          background: "#f59e0b",
                          boxShadow: "0 0 12px rgba(245,158,11,0.4)"
                        }} />
                      )}
                    </motion.div>
                    {idx < zonePropre.length - 1 && (
                      <motion.div
                        initial={{ opacity: 0.3 }}
                        animate={{ opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          padding: "2px 0",
                          color: "rgba(22,163,74,0.25)"
                        }}
                      >
                        <FaLongArrowAltDown size={14} />
                      </motion.div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>

        {agent && !redirecting && etapeActive && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              marginTop: "24px",
              padding: "14px 24px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, #f1f5f9, #e2e8f0)",
              border: "1px solid #cbd5e1",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "12px"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #1e293b, #475569)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white"
              }}>
                <FaUser size={14} />
              </div>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>
                  {agent.nom} · {etapeActive.id}
                </div>
                <div style={{ fontSize: "12px", color: "#64748b" }}>
                  {etapeActive.zone === "sale" ? "🔴 Zone Sale" : "🟢 Zone Propre"} · Cliquez sur la carte active pour accéder
                </div>
              </div>
            </div>
            <button
              onClick={() => navigate(etapeActive.route)}
              style={{
                background: "linear-gradient(135deg, #1e293b, #334155)",
                color: "white",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 24px",
                borderRadius: "12px",
                border: "none",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
            >
              Accéder au poste <FaArrowRight size={14} />
            </button>
          </motion.div>
        )}

        {redirecting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              marginTop: "20px",
              textAlign: "center",
              padding: "14px",
              borderRadius: "12px",
              background: "rgba(59,130,246,0.08)",
              border: "1px solid rgba(59,130,246,0.2)"
            }}
          >
            <FaSpinner style={{ animation: "spin 1s linear infinite", display: "inline-block", marginRight: "10px" }} />
            <span style={{ fontSize: "14px", color: "#1e40af", fontWeight: 500 }}>Redirection vers votre poste...</span>
          </motion.div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}