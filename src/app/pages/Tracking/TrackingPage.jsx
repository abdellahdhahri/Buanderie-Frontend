// pages/Tracking/TrackingPage.js
import React, { useState, useContext, useEffect, useCallback, useRef } from "react";
import { LingeContext } from "../../contextes/LingeContext";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaSearch, FaHistory, FaMapMarkerAlt, FaCheckCircle, FaUser, 
  FaRss, FaBarcode, FaSoap, FaArrowLeft, FaEye, FaRedoAlt, 
  FaTrash, FaQrcode, FaClock, FaTag, FaCube, FaBox,
  FaCalendarAlt, FaWeightHanging, FaInfoCircle, FaChevronRight,
  FaTshirt, FaClipboardList, FaHourglassHalf, FaCheckDouble,
  FaExclamationTriangle
} from "react-icons/fa";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import "../Linge/WorkflowList.css";

// ─── Composant de statut ──────────────────────────────────────────────────
function StatusTimeline({ history }) {
  if (!history || history.length === 0) return null;

  const etatColors = {
    RECEPTION: { bg: "#f3e8ff", color: "#7c3aed", icon: "📥", label: "Réception" },
    COLLECTE: { bg: "#e0f2fe", color: "#0284c7", icon: "🚚", label: "Collecte" },
    EN_TRI: { bg: "#fef3c7", color: "#d97706", icon: "🔀", label: "Tri" },
    EN_LAVAGE: { bg: "#dbeafe", color: "#2563eb", icon: "🫧", label: "Lavage" },
    LAVE: { bg: "#cffafe", color: "#0891b2", icon: "💧", label: "Lavé" },
    EN_SECHAGE: { bg: "#ffedd5", color: "#ea580c", icon: "🌬️", label: "Séchage" },
    SECHE: { bg: "#ecfccb", color: "#65a30d", icon: "☀️", label: "Séché" },
    PLIE: { bg: "#f3e8ff", color: "#7c3aed", icon: "📐", label: "Plié" },
    STOCKE: { bg: "#d1fae5", color: "#059669", icon: "📦", label: "Stocké" },
    LIVRE: { bg: "#d1fae5", color: "#059669", icon: "✅", label: "Livré" },
    PROPRE: { bg: "#d1fae5", color: "#059669", icon: "✨", label: "Propre" },
    MANQUANT: { bg: "#fee2e2", color: "#dc2626", icon: "❌", label: "Manquant" },
    SALE: { bg: "#fef3c7", color: "#d97706", icon: "🟡", label: "Sale" },
    EN_LAVAGE: { bg: "#dbeafe", color: "#2563eb", icon: "🫧", label: "En lavage" },
  };

  // ✅ Conserver l'ordre retourné par l'API (pas de reverse)
  const sortedHistory = [...history];

  return (
    <div style={{ position: "relative", padding: "20px 0" }}>
      <div style={{
        position: "absolute",
        left: "24px",
        top: "40px",
        bottom: "40px",
        width: "2px",
        background: "linear-gradient(180deg, #e9d5ff, #c4b5fd, #a78bfa)",
        opacity: 0.4
      }} />

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {sortedHistory.map((step, index) => {
          const etat = step.etatapres || step.etat || "UNKNOWN";
          const config = etatColors[etat] || { bg: "#f1f5f9", color: "#64748b", icon: "📌", label: etat };
          const isLast = index === sortedHistory.length - 1;
          const isFirst = index === 0;

          return (
            <motion.div
              key={step.id || index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.06 }}
              style={{
                display: "flex",
                gap: "16px",
                position: "relative",
                paddingLeft: "16px"
              }}
            >
              {/* Cercle chronologique */}
              <div style={{
                width: "38px",
                height: "38px",
                borderRadius: "50%",
                background: isLast ? "linear-gradient(135deg, #10b981, #059669)" : config.bg,
                border: isLast ? "3px solid #10b981" : "2px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                zIndex: 2,
                boxShadow: isLast ? "0 0 0 4px rgba(16,185,129,0.15)" : "none",
                position: "relative"
              }}>
                <span style={{ fontSize: "15px" }}>{isLast ? "📍" : config.icon}</span>
                {isLast && (
                  <div style={{
                    position: "absolute",
                    top: "-4px",
                    right: "-4px",
                    width: "16px",
                    height: "16px",
                    borderRadius: "50%",
                    background: "#10b981",
                    border: "2px solid white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "8px",
                    color: "white"
                  }}>
                    <FaCheckDouble size={8} />
                  </div>
                )}
              </div>

              {/* Contenu */}
              <div style={{
                flex: 1,
                background: isLast ? "linear-gradient(135deg, #f0fdf4, #dcfce7)" : "white",
                borderRadius: "12px",
                padding: "14px 18px",
                border: isLast ? "2px solid #86efac" : "1px solid #f1f5f9",
                boxShadow: isLast ? "0 4px 12px rgba(16,185,129,0.08)" : "0 1px 3px rgba(0,0,0,0.04)",
                transition: "all 0.3s"
              }}
              onMouseEnter={e => {
                e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)";
                e.currentTarget.style.transform = "translateX(4px)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = isLast ? "0 4px 12px rgba(16,185,129,0.08)" : "0 1px 3px rgba(0,0,0,0.04)";
                e.currentTarget.style.transform = "translateX(0)";
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <Badge style={{
                      background: config.bg,
                      color: config.color,
                      fontSize: "11px",
                      fontWeight: 600,
                      padding: "3px 12px",
                      borderRadius: "12px",
                      border: `1px solid ${config.color}25`
                    }}>
                      {config.icon} {config.label}
                    </Badge>
                    {isLast && (
                      <Badge style={{
                        background: "#dcfce7",
                        color: "#15803d",
                        fontSize: "9px",
                        padding: "1px 10px",
                        borderRadius: "10px",
                        fontWeight: 600
                      }}>
                        ● Actuel
                      </Badge>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#94a3b8" }}>
                    <FaCalendarAlt size={10} />
                    {step.dateOperation ? new Date(step.dateOperation).toLocaleString("fr-FR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    }) : "—"}
                  </div>
                </div>
                {step.observations && (
                  <div style={{ 
                    marginTop: "6px", 
                    fontSize: "12px", 
                    color: "#64748b",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    background: "#f8fafc",
                    padding: "4px 10px",
                    borderRadius: "6px"
                  }}>
                    <FaInfoCircle size={10} color="#94a3b8" />
                    {step.observations}
                  </div>
                )}
                {step.agentNom && (
                  <div style={{
                    marginTop: "6px",
                    fontSize: "11px",
                    color: "#94a3b8",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    borderTop: "1px solid #f1f5f9",
                    paddingTop: "6px"
                  }}>
                    <FaUser size={10} />
                    {step.agentNom}
                  </div>
                )}
                {step.codeLinge && (
                  <div style={{
                    fontSize: "10px",
                    color: "#94a3b8",
                    fontFamily: "monospace",
                    marginTop: "2px"
                  }}>
                    Code: {step.codeLinge}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Composant Carte Info ─────────────────────────────────────────────────
function InfoCard({ icon, label, value, color, bg }) {
  return (
    <div style={{
      padding: "12px 16px",
      borderRadius: "10px",
      background: bg || "white",
      border: `1px solid ${color}25`,
      flex: 1,
      minWidth: "120px"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div style={{ color: color, fontSize: "16px" }}>{icon}</div>
        <div>
          <div style={{ fontSize: "9px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.3px" }}>
            {label}
          </div>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a", marginTop: "1px" }}>
            {value || "—"}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PAGE PRINCIPALE ──────────────────────────────────────────────────────
export default function TrackingPage() {
  const [searchValue, setSearchValue] = useState("");
  const [item, setItem] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isScanned, setIsScanned] = useState(false);
  const { getLingeByCode, getHistorique, formatEPC, isRfidMode } = useContext(LingeContext);
  const scanInputRef = useRef(null);
  const [isFocused, setIsFocused] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();

  const performSearch = useCallback(async (code) => {
    setLoading(true);
    setError("");
    setItem(null);
    setHistory([]);
    setIsScanned(false);

    try {
      const foundItem = await getLingeByCode(code);
      if (foundItem) {
        setItem(foundItem);
        const hist = await getHistorique(code);
        setHistory(hist || []);
        setIsScanned(true);
      } else {
        setError(isRfidMode ? "Tag RFID (EPC) non trouvé." : "Code de suivi non trouvé.");
      }
    } catch (err) {
      setError("Erreur de connexion au serveur.");
    } finally {
      setLoading(false);
    }
  }, [getHistorique, getLingeByCode, isRfidMode]);

  const handleReset = () => {
    setSearchValue("");
    setItem(null);
    setHistory([]);
    setError("");
    setLoading(false);
    setIsScanned(false);
    if (scanInputRef.current) {
      scanInputRef.current.focus();
      setIsFocused(true);
    }
  };

  useEffect(() => {
    const focusInput = () => {
      if (scanInputRef.current && document.activeElement !== scanInputRef.current) {
        scanInputRef.current.focus();
        setIsFocused(true);
      }
    };
    focusInput();
    const handleBodyClick = (e) => {
      const selection = window.getSelection();
      if (selection && selection.toString().length > 0) return;
      if (e.target.closest('button, input, select, a')) return;
      focusInput();
    };
    document.addEventListener("click", handleBodyClick);
    return () => document.removeEventListener("click", handleBodyClick);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get("code");
    if (code) {
      const cleanCode = code.trim().replace(/\s/g, '').toUpperCase();
      setSearchValue(cleanCode);
      performSearch(cleanCode);
    }
  }, [location.search, performSearch]);

  useEffect(() => {
    if (searchValue.trim().length > 3) {
      const timer = setTimeout(() => {
        performSearch(searchValue.trim());
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [searchValue, performSearch]);

  const handleSearch = (e) => {
    e.preventDefault();
    const cleanCode = searchValue.trim().replace(/\s/g, '').toUpperCase();
    if (!cleanCode) return;
    performSearch(cleanCode);
  };

  const getEtatColor = (etat) => {
    const colors = {
      RECEPTION: { bg: "#f3e8ff", color: "#7c3aed", icon: "📥", label: "Réception" },
      COLLECTE: { bg: "#e0f2fe", color: "#0284c7", icon: "🚚", label: "Collecte" },
      EN_TRI: { bg: "#fef3c7", color: "#d97706", icon: "🔀", label: "Tri" },
      EN_LAVAGE: { bg: "#dbeafe", color: "#2563eb", icon: "🫧", label: "Lavage" },
      LAVE: { bg: "#cffafe", color: "#0891b2", icon: "💧", label: "Lavé" },
      EN_SECHAGE: { bg: "#ffedd5", color: "#ea580c", icon: "🌬️", label: "Séchage" },
      SECHE: { bg: "#ecfccb", color: "#65a30d", icon: "☀️", label: "Séché" },
      PLIE: { bg: "#f3e8ff", color: "#7c3aed", icon: "📐", label: "Plié" },
      STOCKE: { bg: "#d1fae5", color: "#059669", icon: "📦", label: "Stocké" },
      LIVRE: { bg: "#d1fae5", color: "#059669", icon: "✅", label: "Livré" },
      PROPRE: { bg: "#d1fae5", color: "#059669", icon: "✨", label: "Propre" },
    };
    return colors[etat] || { bg: "#f1f5f9", color: "#64748b", icon: "📌", label: etat };
  };

  const getStatusBadge = (etat) => {
    const config = getEtatColor(etat);
    return (
      <Badge style={{
        background: config.bg,
        color: config.color,
        fontSize: "12px",
        fontWeight: 600,
        padding: "4px 14px",
        borderRadius: "12px",
        border: `1px solid ${config.color}25`,
        display: "inline-flex",
        alignItems: "center",
        gap: "6px"
      }}>
        <span>{config.icon}</span>
        {config.label}
      </Badge>
    );
  };

  return (
    <div style={{ maxWidth: "100%", padding: "0 4px" }}>

      {/* ─── EN-TÊTE ─────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: "28px" }}>
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
            background: isRfidMode 
              ? "linear-gradient(135deg, #7c3aed, #6d28d9)" 
              : "linear-gradient(135deg, #0d9488, #0f766e)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            boxShadow: isRfidMode
              ? "0 4px 20px rgba(124, 58, 237, 0.3)"
              : "0 4px 20px rgba(13, 148, 136, 0.3)"
          }}>
            {isRfidMode ? <FaRss size={26} /> : <FaQrcode size={26} />}
          </div>
          <div>
            <h1 style={{
              fontSize: "28px",
              fontWeight: 800,
              color: "#0f172a",
              margin: 0,
              letterSpacing: "-0.5px"
            }}>
              {isRfidMode ? "Traçabilité RFID" : "Suivi d'article"}
            </h1>
            <p style={{
              fontSize: "14px",
              color: "#64748b",
              margin: "2px 0 0 0",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}>
              <span style={{
                display: "inline-block",
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: isFocused ? "#10b981" : "#94a3b8"
              }} />
              {isFocused ? "🔍 Scanner prêt" : "En attente"}
            </p>
          </div>
        </div>
      </div>

      {/* ─── ZONE DE RECHERCHE ──────────────────────────────────────────── */}
      <Card style={{
        marginBottom: "24px",
        borderRadius: "16px",
        border: `2px solid ${isFocused ? '#c4b5fd' : '#e2e8f0'}`,
        boxShadow: isFocused ? "0 4px 20px rgba(124,58,237,0.08)" : "0 2px 8px rgba(0,0,0,0.04)",
        transition: "all 0.3s"
      }}>
        <CardContent className="p-5">
          <form onSubmit={handleSearch} style={{ margin: 0 }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap"
            }}>
              <div style={{ flex: 1, position: "relative", minWidth: "250px" }}>
                <div style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94a3b8"
                }}>
                  {isRfidMode ? <FaRss size={16} /> : <FaSearch size={16} />}
                </div>
                <input
                  ref={scanInputRef}
                  type="text"
                  placeholder={isRfidMode ? "Scanner ou saisir le tag RFID..." : "Scanner ou saisir le code article..."}
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  style={{
                    width: "100%",
                    padding: "14px 16px 14px 44px",
                    borderRadius: "12px",
                    border: `2px solid ${isFocused ? '#7c3aed' : '#e2e8f0'}`,
                    fontSize: "15px",
                    outline: "none",
                    transition: "all 0.3s",
                    background: isFocused ? "#faf5ff" : "white",
                    boxShadow: isFocused ? "0 0 0 4px rgba(124,58,237,0.06)" : "none"
                  }}
                  autoFocus
                />
                {searchValue && (
                  <button
                    type="button"
                    onClick={() => setSearchValue("")}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#94a3b8",
                      padding: "4px"
                    }}
                  >
                    <FaTrash size={12} />
                  </button>
                )}
              </div>

              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <Button
                  type="submit"
                  disabled={loading || !searchValue.trim()}
                  style={{
                    padding: "12px 24px",
                    borderRadius: "12px",
                    border: "none",
                    background: !searchValue.trim() || loading ? "#e2e8f0" : "linear-gradient(135deg, #0d9488, #0f766e)",
                    color: !searchValue.trim() || loading ? "#94a3b8" : "white",
                    fontWeight: 700,
                    fontSize: "13px",
                    cursor: !searchValue.trim() || loading ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    transition: "all 0.2s"
                  }}
                >
                  {loading ? (
                    <span className="animate-spin">⟳</span>
                  ) : (
                    <FaSearch size={14} />
                  )}
                  {loading ? "Recherche..." : "Suivre"}
                </Button>

                <Button
                  variant="outline"
                  onClick={handleReset}
                  style={{
                    padding: "12px 16px",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    background: "white",
                    color: "#64748b",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#f8fafc" }}
                  onMouseLeave={e => { e.currentTarget.style.background = "white" }}
                >
                  <FaRedoAlt size={14} />
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ─── ERREUR ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              padding: "14px 20px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #fef2f2, #fee2e2)",
              border: "1px solid #fca5a5",
              color: "#dc2626",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              fontSize: "14px"
            }}
          >
            <FaExclamationTriangle size={18} />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── RÉSULTATS ───────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {item && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            {/* ─── CARTE ARTICLE ────────────────────────────────────────── */}
            <Card style={{
              marginBottom: "24px",
              borderRadius: "16px",
              border: "2px solid #a78bfa",
              background: "linear-gradient(135deg, #faf5ff, #f5f3ff)",
              overflow: "hidden"
            }}>
              <div style={{
                padding: "20px 24px",
                background: "linear-gradient(135deg, #0d9488, #0f766e)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    background: "rgba(255,255,255,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "20px"
                  }}>
                    <FaTshirt color="white" />
                  </div>
                  <div>
                    <div style={{ color: "white", fontWeight: 700, fontSize: "18px" }}>
                      {item.codeBarre || "N/A"}
                    </div>
                    <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "12px" }}>
                      ID #{item.id} · {item.categorie || "Non catégorisé"}
                    </div>
                  </div>
                </div>
                {getStatusBadge(item.etat)}
              </div>

              <CardContent className="p-5">
                {/* Grille d'informations */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "12px",
                  marginBottom: "16px"
                }}>
                  <InfoCard
                    icon={<FaTag />}
                    label="Catégorie"
                    value={item.categorie || "—"}
                    color="#7c3aed"
                    bg="#f3e8ff"
                  />
                  <InfoCard
                    icon={<FaWeightHanging />}
                    label="Poids"
                    value={item.poids ? `${item.poids} kg` : "—"}
                    color="#0d9488"
                    bg="#ccfbf1"
                  />
                  <InfoCard
                    icon={<FaBox />}
                    label="État"
                    value={item.etat || "—"}
                    color="#059669"
                    bg="#d1fae5"
                  />
                  <InfoCard
                    icon={<FaCalendarAlt />}
                    label="Date création"
                    value={item.dateCreation ? new Date(item.dateCreation).toLocaleDateString("fr-FR") : "—"}
                    color="#d97706"
                    bg="#fef3c7"
                  />
                </div>

                {/* Puce RFID si présente */}
                {item.rfidTag && (
                  <div style={{
                    padding: "8px 14px",
                    borderRadius: "8px",
                    background: "#f3e8ff",
                    border: "1px solid #c4b5fd",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "12px",
                    color: "#6d28d9"
                  }}>
                    <FaRss size={12} />
                    <span style={{ fontFamily: "monospace" }}>RFID: {item.rfidTag}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ─── HISTORIQUE ───────────────────────────────────────────── */}
            <Card style={{
              borderRadius: "16px",
              border: "1px solid #e2e8f0",
              overflow: "hidden"
            }}>
              <div style={{
                padding: "16px 20px",
                background: "#f8fafc",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                gap: "10px"
              }}>
                <div style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  background: "linear-gradient(135deg, #0d9488, #0f766e)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white"
                }}>
                  <FaHistory size={14} />
                </div>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>
                  Journal des mouvements
                </h3>
                <Badge style={{ background: "#ccfbf1", color: "#0d9488", fontSize: "10px" }}>
                  {history.length} étape{history.length > 1 ? 's' : ''}
                </Badge>
              </div>

              <CardContent className="p-4">
                {history.length === 0 ? (
                  <div style={{
                    textAlign: "center",
                    padding: "40px 20px",
                    color: "#94a3b8"
                  }}>
                    <div style={{ fontSize: "40px", marginBottom: "12px" }}>📭</div>
                    <p style={{ fontWeight: 600, fontSize: "16px" }}>Aucun historique</p>
                    <p style={{ fontSize: "13px" }}>Cet article n'a pas encore de mouvements enregistrés</p>
                  </div>
                ) : (
                  <StatusTimeline history={history} />
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── ÉTAT VIDE ───────────────────────────────────────────────────── */}
      {!item && !error && !loading && (
        <div style={{
          textAlign: "center",
          padding: "60px 20px",
          background: "white",
          borderRadius: "16px",
          border: "2px dashed #e2e8f0"
        }}>
          <div style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            background: "#f1f5f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
            fontSize: "32px"
          }}>
            {isRfidMode ? <FaRss color="#94a3b8" /> : <FaSearch color="#94a3b8" />}
          </div>
          <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", marginBottom: "4px" }}>
            {isRfidMode ? "Recherche RFID" : "Recherche d'article"}
          </h3>
          <p style={{ fontSize: "14px", color: "#94a3b8" }}>
            {isRfidMode 
              ? "Scannez ou saisissez un tag RFID pour suivre son parcours"
              : "Scannez ou saisissez un code article pour suivre son parcours"}
          </p>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
          display: inline-block;
        }
      `}</style>
    </div>
  );
}