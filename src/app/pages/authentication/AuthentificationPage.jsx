import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FaUser, FaBarcode, FaCheckCircle, FaSpinner, FaTimes,
  FaArrowRight, FaIndustry, FaRobot, FaLongArrowAltDown,
  FaTruck, FaBoxes, FaWarehouse, FaSoap, FaWind,
  FaHands, FaHome, FaShieldAlt, FaClock, FaBuilding,
  FaMicrochip, FaNetworkWired, FaChartLine, FaUsers,
  FaCog, FaPrint, FaSearch, FaBell
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { useModal } from "../../contextes/ModalContext";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import ScanInput from "../../components/utils/shared/ScanInput";
import "../Linge/WorkflowList.css";

const API = "http://localhost:8082";

// ─── Configuration des étapes ──────────────────────────────────────────────
const ETAPES = [
  { id: "Collecte", route: "/collecte", icon: FaTruck, zone: "sale", color: "#8b5cf6", bg: "#f5f3ff" },
  { id: "Reception", route: "/receptions", icon: FaBoxes, zone: "sale", color: "#f59e0b", bg: "#fffbeb" },
  { id: "Tri", route: "/tri", icon: FaHands, zone: "sale", color: "#ec4899", bg: "#fdf2f8" },
  { id: "Lavage", route: "/lavages", icon: FaSoap, zone: "sale", color: "#3b82f6", bg: "#eff6ff" },
  { id: "Sechage", route: "/sechages", icon: FaWind, zone: "propre", color: "#14b8a6", bg: "#f0fdfa" },
  { id: "Pliage", route: "/pliage", icon: FaHands, zone: "propre", color: "#8b5cf6", bg: "#f5f3ff" },
  { id: "Stockage", route: "/stockage", icon: FaWarehouse, zone: "propre", color: "#10b981", bg: "#ecfdf5" },
  { id: "Livraison", route: "/livraisons", icon: FaHome, zone: "propre", color: "#ef4444", bg: "#fef2f2" }
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

export default function AuthentificationPage() {
  const navigate = useNavigate();
  const { showAlert } = useModal();
  const [agent, setAgent] = useState(null);
  const [scanValue, setScanValue] = useState("");
  const [isFocused, setIsFocused] = useState(true);
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [showProcess, setShowProcess] = useState(false);
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
      setShowProcess(true);
      
      showAlert("✅ Agent identifié", `${ag.nom} (${ag.matricule})`, "success");
      
      const etapeNom = POSTE_TO_ETAPE[ag.poste];
      if (etapeNom) {
        const etape = ETAPES.find(e => e.id === etapeNom);
        if (etape?.route) {
          setRedirecting(true);
          setTimeout(() => {
            navigate(etape.route);
          }, 2000);
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
    setShowProcess(false);
    setTimeout(() => {
      if (scanInputRef.current) {
        scanInputRef.current.focus();
        setIsFocused(true);
      }
    }, 200);
  };

  const etapeActive = agent ? ETAPES.find(e => e.id === POSTE_TO_ETAPE[agent?.poste]) : null;
  const etapeIndex = etapeActive ? ETAPES.indexOf(etapeActive) : -1;

  const zoneSale = ETAPES.slice(0, 4);
  const zonePropre = ETAPES.slice(4);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)",
      padding: "24px",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      position: "relative",
      overflow: "hidden"
    }}>
      {/* ─── Effet de fond ──────────────────────────────────────────────────── */}
      <div style={{
        position: "absolute",
        top: -200,
        right: -200,
        width: 600,
        height: 600,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)",
        pointerEvents: "none"
      }} />
      <div style={{
        position: "absolute",
        bottom: -200,
        left: -200,
        width: 600,
        height: 600,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)",
        pointerEvents: "none"
      }} />

      <div style={{
        maxWidth: "1000px",
        width: "100%",
        background: "rgba(255,255,255,0.05)",
        backdropFilter: "blur(40px)",
        borderRadius: "32px",
        padding: "40px 48px",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 25px 80px rgba(0,0,0,0.5), 0 4px 20px rgba(0,0,0,0.1)",
        position: "relative",
        zIndex: 1
      }}>

        {/* ─── Header ────────────────────────────────────────────────────────── */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "32px",
          flexWrap: "wrap",
          gap: "16px"
        }}>
          <div>
            <h1 style={{
              fontSize: "30px",
              fontWeight: 800,
              background: "linear-gradient(135deg, #f1f5f9, #94a3b8)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              display: "flex",
              alignItems: "center",
              gap: "14px",
              margin: 0,
              letterSpacing: "-0.5px"
            }}>
              <span style={{
                width: "48px",
                height: "48px",
                borderRadius: "16px",
                background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                WebkitTextFillColor: "white",
                boxShadow: "0 4px 16px rgba(59,130,246,0.3)"
              }}>
                <FaIndustry size={22} />
              </span>
              Buanderie
            </h1>
            <p style={{ 
              color: "rgba(255,255,255,0.5)", 
              margin: "4px 0 0 0", 
              fontSize: "14px",
              fontWeight: 400
            }}>
              {agent 
                ? `👤 ${agent.nom} · ${etapeActive?.id || agent.poste || "Poste non configuré"}`
                : "🔑 Authentification pour accéder à votre poste"}
            </p>
          </div>
          
          {agent && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={handleReset}
              style={{
                padding: "8px 20px",
                borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.15)",
                background: "rgba(255,255,255,0.05)",
                cursor: "pointer",
                fontSize: "12px",
                color: "rgba(255,255,255,0.6)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.2s",
                backdropFilter: "blur(10px)"
              }}
              onMouseEnter={(e) => { 
                e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                e.currentTarget.style.color = "rgba(255,255,255,0.9)";
              }}
              onMouseLeave={(e) => { 
                e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                e.currentTarget.style.color = "rgba(255,255,255,0.6)";
              }}
            >
              <FaTimes size={12} />
              Changer d'agent
            </motion.button>
          )}
        </div>

        {/* ─── Zone de Scan ────────────────────────────────────────────────── */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "36px"
        }}>
          <div style={{
            width: "70%",
            maxWidth: "600px",
            position: "relative"
          }}>
            <div style={{
              position: "relative",
              background: "rgba(255,255,255,0.05)",
              borderRadius: "16px",
              padding: "4px",
              border: "1px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(10px)"
            }}>
              <div style={{
                position: "absolute",
                top: "-2px",
                left: "-2px",
                right: "-2px",
                bottom: "-2px",
                borderRadius: "18px",
                background: agent 
                  ? "linear-gradient(135deg, #10b981, #059669)" 
                  : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                opacity: 0.2,
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
                  padding: "16px 24px",
                  fontSize: "16px",
                  color: "white"
                }}
                inputStyle={{
                  color: "white",
                  placeholderColor: "rgba(255,255,255,0.4)"
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
                  marginTop: "14px",
                  padding: "10px 24px",
                  background: "rgba(16,185,129,0.15)",
                  borderRadius: "12px",
                  border: "1px solid rgba(16,185,129,0.2)",
                  backdropFilter: "blur(10px)"
                }}
              >
                <FaCheckCircle color="#10b981" size={18} />
                <span style={{ fontWeight: 600, color: "#34d399", fontSize: "15px" }}>{agent.nom}</span>
                <span style={{ 
                  fontSize: "11px", 
                  background: "rgba(16,185,129,0.2)", 
                  color: "#34d399",
                  padding: "2px 14px",
                  borderRadius: "20px",
                  fontWeight: 600
                }}>
                  {agent.matricule}
                </span>
                <span style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#34d399",
                  background: "rgba(16,185,129,0.1)",
                  padding: "2px 14px",
                  borderRadius: "20px"
                }}>
                  {etapeActive?.id || "Poste"}
                </span>
                {redirecting && (
                  <span style={{ 
                    fontSize: "11px", 
                    color: "#60a5fa", 
                    animation: "pulse 1s infinite",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}>
                    <FaSpinner className="animate-spin" size={12} />
                    Redirection...
                  </span>
                )}
              </motion.div>
            )}
          </div>
        </div>

        {/* ─── Message de bienvenue ou processus ───────────────────────────── */}
        {!agent ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              textAlign: "center",
              padding: "40px 20px"
            }}
          >
            <div style={{
              fontSize: "64px",
              marginBottom: "16px"
            }}>
              🏥
            </div>
            <h2 style={{
              color: "white",
              fontSize: "22px",
              fontWeight: 700,
              marginBottom: "8px"
            }}>
              Bienvenue dans votre buanderie
            </h2>
            <p style={{
              color: "rgba(255,255,255,0.4)",
              fontSize: "14px",
              maxWidth: "400px",
              margin: "0 auto"
            }}>
              Scannez votre badge agent pour accéder à votre poste de travail
            </p>
            
            <div style={{
              display: "flex",
              justifyContent: "center",
              gap: "12px",
              marginTop: "24px",
              flexWrap: "wrap"
            }}>
              <div style={{
                padding: "8px 16px",
                borderRadius: "20px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.06)",
                color: "rgba(255,255,255,0.3)",
                fontSize: "11px",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}>
                <FaShieldAlt size={12} /> Sécurisé
              </div>
              <div style={{
                padding: "8px 16px",
                borderRadius: "20px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.06)",
                color: "rgba(255,255,255,0.3)",
                fontSize: "11px",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}>
                <FaClock size={12} /> 24/7
              </div>
              <div style={{
                padding: "8px 16px",
                borderRadius: "20px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.06)",
                color: "rgba(255,255,255,0.3)",
                fontSize: "11px",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}>
                <FaNetworkWired size={12} /> Connecté
              </div>
            </div>
          </motion.div>
        ) : (
          /* ─── Processus ──────────────────────────────────────────────────── */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div style={{
              display: "flex",
              gap: "20px",
              alignItems: "center",
              justifyContent: "center"
            }}>
              {/* ─── Zone Sale ────────────────────────────────────────────── */}
              <div style={{
                flex: 1,
                background: "rgba(220,38,38,0.08)",
                borderRadius: "16px",
                padding: "16px 14px",
                border: "1px solid rgba(220,38,38,0.12)"
              }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "12px",
                  paddingBottom: "10px",
                  borderBottom: "1px solid rgba(220,38,38,0.1)"
                }}>
                  <div style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: "#ef4444",
                    boxShadow: "0 0 12px rgba(239,68,68,0.3)"
                  }} />
                  <span style={{ 
                    fontWeight: 700, 
                    color: "rgba(255,255,255,0.7)", 
                    fontSize: "11px", 
                    letterSpacing: "0.5px", 
                    textTransform: "uppercase" 
                  }}>
                    Zone Sale
                  </span>
                  <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.2)", marginLeft: "auto" }}>
                    ⚡ {zoneSale.length}
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  {zoneSale.map((etape, idx) => {
                    const isActive = agent && POSTE_TO_ETAPE[agent.poste] === etape.id;
                    const Icon = etape.icon;
                    const isPast = etapeIndex > idx && agent;
                    
                    return (
                      <React.Fragment key={etape.id}>
                        <motion.div
                          whileHover={isActive ? { scale: 1.02 } : {}}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            padding: "8px 12px",
                            borderRadius: "8px",
                            background: isActive 
                              ? "rgba(239,68,68,0.2)" 
                              : isPast 
                                ? "rgba(255,255,255,0.03)" 
                                : "rgba(255,255,255,0.02)",
                            border: isActive 
                              ? "1px solid rgba(239,68,68,0.3)" 
                              : "1px solid transparent",
                            opacity: isPast ? 0.5 : 1,
                            cursor: isActive ? "pointer" : "default"
                          }}
                          onClick={() => {
                            if (agent && isActive) {
                              navigate(etape.route);
                            }
                          }}
                        >
                          <div style={{
                            width: "24px",
                            height: "24px",
                            borderRadius: "6px",
                            background: isActive 
                              ? "rgba(239,68,68,0.2)" 
                              : "rgba(255,255,255,0.05)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: isActive ? "#ef4444" : "rgba(255,255,255,0.3)"
                          }}>
                            <Icon size={12} />
                          </div>
                          <span style={{
                            fontSize: "12px",
                            fontWeight: isActive ? 600 : 400,
                            color: isActive ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.4)"
                          }}>
                            {etape.id}
                          </span>
                          {isActive && (
                            <span style={{
                              fontSize: "7px",
                              fontWeight: 700,
                              color: "rgba(255,255,255,0.8)",
                              background: "rgba(239,68,68,0.2)",
                              padding: "1px 8px",
                              borderRadius: "12px",
                              marginLeft: "auto",
                              textTransform: "uppercase"
                            }}>
                              Actif
                            </span>
                          )}
                          {isPast && !isActive && (
                            <FaCheckCircle style={{ color: "rgba(16,185,129,0.3)", marginLeft: "auto" }} size={10} />
                          )}
                        </motion.div>
                        {idx < zoneSale.length - 1 && (
                          <div style={{
                            display: "flex",
                            justifyContent: "center",
                            padding: "1px 0",
                            color: "rgba(255,255,255,0.05)"
                          }}>
                            <FaLongArrowAltDown size={10} />
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>

              {/* ─── Transition ────────────────────────────────────────────── */}
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "2px",
                padding: "0 2px",
                minWidth: "40px"
              }}>
                <div style={{
                  width: "1px",
                  height: "30px",
                  background: "linear-gradient(to bottom, rgba(239,68,68,0.2), rgba(245,158,11,0.2))"
                }} />
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #f59e0b, #d97706)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontSize: "14px",
                    boxShadow: "0 4px 20px rgba(245,158,11,0.2)"
                  }}
                >
                  <FaRobot size={14} />
                </motion.div>
                <div style={{
                  fontSize: "7px",
                  fontWeight: 700,
                  color: "rgba(245,158,11,0.5)",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase"
                }}>
                  Lavage
                </div>
                <div style={{
                  width: "1px",
                  height: "30px",
                  background: "linear-gradient(to bottom, rgba(245,158,11,0.2), rgba(16,185,129,0.2))"
                }} />
              </div>

              {/* ─── Zone Propre ────────────────────────────────────────────── */}
              <div style={{
                flex: 1,
                background: "rgba(16,185,129,0.08)",
                borderRadius: "16px",
                padding: "16px 14px",
                border: "1px solid rgba(16,185,129,0.12)"
              }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "12px",
                  paddingBottom: "10px",
                  borderBottom: "1px solid rgba(16,185,129,0.1)"
                }}>
                  <div style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: "#10b981",
                    boxShadow: "0 0 12px rgba(16,185,129,0.3)"
                  }} />
                  <span style={{ 
                    fontWeight: 700, 
                    color: "rgba(255,255,255,0.7)", 
                    fontSize: "11px", 
                    letterSpacing: "0.5px", 
                    textTransform: "uppercase" 
                  }}>
                    Zone Propre
                  </span>
                  <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.2)", marginLeft: "auto" }}>
                    ✨ {zonePropre.length}
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column-reverse", gap: "4px" }}>
                  {zonePropre.map((etape, idx) => {
                    const isActive = agent && POSTE_TO_ETAPE[agent.poste] === etape.id;
                    const Icon = etape.icon;
                    const globalIdx = ETAPES.indexOf(etape);
                    const isPast = etapeIndex > globalIdx && agent;
                    
                    return (
                      <React.Fragment key={etape.id}>
                        <motion.div
                          whileHover={isActive ? { scale: 1.02 } : {}}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            padding: "8px 12px",
                            borderRadius: "8px",
                            background: isActive 
                              ? "rgba(16,185,129,0.2)" 
                              : isPast 
                                ? "rgba(255,255,255,0.03)" 
                                : "rgba(255,255,255,0.02)",
                            border: isActive 
                              ? "1px solid rgba(16,185,129,0.3)" 
                              : "1px solid transparent",
                            opacity: isPast ? 0.5 : 1,
                            cursor: isActive ? "pointer" : "default"
                          }}
                          onClick={() => {
                            if (agent && isActive) {
                              navigate(etape.route);
                            }
                          }}
                        >
                          <div style={{
                            width: "24px",
                            height: "24px",
                            borderRadius: "6px",
                            background: isActive 
                              ? "rgba(16,185,129,0.2)" 
                              : "rgba(255,255,255,0.05)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: isActive ? "#10b981" : "rgba(255,255,255,0.3)"
                          }}>
                            <Icon size={12} />
                          </div>
                          <span style={{
                            fontSize: "12px",
                            fontWeight: isActive ? 600 : 400,
                            color: isActive ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.4)"
                          }}>
                            {etape.id}
                          </span>
                          {isActive && (
                            <span style={{
                              fontSize: "7px",
                              fontWeight: 700,
                              color: "rgba(255,255,255,0.8)",
                              background: "rgba(16,185,129,0.2)",
                              padding: "1px 8px",
                              borderRadius: "12px",
                              marginLeft: "auto",
                              textTransform: "uppercase"
                            }}>
                              Actif
                            </span>
                          )}
                          {isPast && !isActive && (
                            <FaCheckCircle style={{ color: "rgba(16,185,129,0.3)", marginLeft: "auto" }} size={10} />
                          )}
                        </motion.div>
                        {idx < zonePropre.length - 1 && (
                          <div style={{
                            display: "flex",
                            justifyContent: "center",
                            padding: "1px 0",
                            color: "rgba(255,255,255,0.05)"
                          }}>
                            <FaLongArrowAltDown size={10} />
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ─── Footer avec bouton d'accès ────────────────────────────── */}
            {agent && !redirecting && etapeActive && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  marginTop: "20px",
                  padding: "12px 20px",
                  borderRadius: "12px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "12px"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white"
                  }}>
                    <FaUser size={12} />
                  </div>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>
                      {agent.nom} · {etapeActive.id}
                    </div>
                    <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)" }}>
                      {etapeActive.zone === "sale" ? "🔴 Zone Sale" : "🟢 Zone Propre"}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => navigate(etapeActive.route)}
                  style={{
                    background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 20px",
                    borderRadius: "10px",
                    border: "none",
                    fontWeight: 600,
                    fontSize: "13px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    boxShadow: "0 4px 16px rgba(59,130,246,0.2)"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
                  onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
                >
                  Accéder <FaArrowRight size={12} />
                </button>
              </motion.div>
            )}

            {redirecting && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  marginTop: "16px",
                  textAlign: "center",
                  padding: "12px",
                  borderRadius: "10px",
                  background: "rgba(59,130,246,0.08)",
                  border: "1px solid rgba(59,130,246,0.15)"
                }}
              >
                <FaSpinner style={{ animation: "spin 1s linear infinite", display: "inline-block", marginRight: "10px", color: "#60a5fa" }} />
                <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)" }}>Redirection vers votre poste...</span>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ─── Footer ────────────────────────────────────────────────────────── */}
        <div style={{
          marginTop: "24px",
          paddingTop: "16px",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px"
        }}>
          <div style={{
            display: "flex",
            gap: "16px",
            fontSize: "11px",
            color: "rgba(255,255,255,0.2)"
          }}>
            <span>Version 1.0</span>
            <span>•</span>
            <span>{new Date().toLocaleDateString("fr-FR", { 
              day: "2-digit", 
              month: "long", 
              year: "numeric" 
            })}</span>
            <span>•</span>
            <span>{new Date().toLocaleTimeString("fr-FR", { 
              hour: "2-digit", 
              minute: "2-digit" 
            })}</span>
          </div>
          {agent && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "11px",
              color: "rgba(255,255,255,0.2)"
            }}>
              <span>👤 {agent.nom}</span>
              <span>•</span>
              <span>🔑 {agent.matricule}</span>
            </div>
          )}
        </div>
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
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}