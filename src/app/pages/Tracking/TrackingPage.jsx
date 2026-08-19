import React, { useState, useContext, useEffect, useCallback, useRef } from "react";
import { LingeContext } from "../../contextes/LingeContext";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaSearch, FaHistory, FaMapMarkerAlt, FaCheckCircle, FaUser, FaRss, FaBarcode, FaSoap, FaArrowLeft, FaEye, FaRedoAlt, FaTrash } from "react-icons/fa";
import "../Linge/WorkflowList.css";

export default function TrackingPage() {
  const [searchValue, setSearchValue] = useState("");
  const [item, setItem] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { getLingeByCode, getHistorique, formatEPC, isRfidMode } = useContext(LingeContext);
  const scanInputRef = useRef(null);
  const [isFocused, setIsFocused] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue.trim().length > 3) {
        handleSearch({ preventDefault: () => {} });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchValue]);
  const navigate = useNavigate();
  const location = useLocation();

  const performSearch = useCallback(async (code) => {
    setLoading(true);
    setError("");
    setItem(null);
    setHistory([]);

    try {
      const foundItem = await getLingeByCode(code);
      if (foundItem) {
        console.log(foundItem)
        setItem(foundItem);
        const hist = await getHistorique(code);
        setHistory(hist || []);
        console.log("l historique de cet utilisateur :",history)
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

    const handleGlobalKeyDown = (e) => {
      if (
        document.activeElement.tagName !== "INPUT" && 
        document.activeElement.tagName !== "TEXTAREA" && 
        e.key.length === 1 && /[a-zA-Z0-9]/.test(e.key)
      ) {
        focusInput();
      }
    };

    document.addEventListener("click", handleBodyClick);
    document.addEventListener("keydown", handleGlobalKeyDown);

    return () => {
      document.removeEventListener("click", handleBodyClick);
      document.removeEventListener("keydown", handleGlobalKeyDown);
    };
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

  const handleSearch = (e) => {
    e.preventDefault();
    const cleanCode = searchValue.trim().replace(/\s/g, '').toUpperCase();
    if (!cleanCode) return;
    performSearch(cleanCode);
  };

  const formatDate = (dateString) => {
    const options = { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  return (
    <div >



<div style={{ marginBottom: "32px" }}>
  <div style={{
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginBottom: "8px"
  }}>
    <div style={{
      width: "52px",
      height: "52px",
      borderRadius: "16px",
      background: isRfidMode 
        ? "linear-gradient(135deg, #8b5cf6, #7c3aed)" 
        : "linear-gradient(135deg, #0ea5e9, #0284c7)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "white",
      boxShadow: isRfidMode
        ? "0 4px 16px rgba(139, 92, 246, 0.25)"
        : "0 4px 16px rgba(14, 165, 233, 0.25)"
    }}>
      {isRfidMode ? (
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <rect x="2" y="2" width="20" height="20" rx="2.18" />
          <line x1="8" y1="2" x2="8" y2="22" />
          <line x1="16" y1="2" x2="16" y2="22" />
          <line x1="2" y1="8" x2="22" y2="8" />
          <line x1="2" y1="16" x2="22" y2="16" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      ) : (
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <polyline points="3 6 5 6 5 8" />
          <polyline points="3 18 5 18 5 16" />
          <polyline points="21 6 19 6 19 8" />
          <polyline points="21 18 19 18 19 16" />
          <line x1="8" y1="6" x2="16" y2="6" />
          <line x1="8" y1="18" x2="16" y2="18" />
          <line x1="9" y1="10" x2="9" y2="14" />
          <line x1="15" y1="10" x2="15" y2="14" />
          <line x1="10" y1="10" x2="14" y2="10" />
          <line x1="10" y1="14" x2="14" y2="14" />
        </svg>
      )}
    </div>
    <div>
      <h1 style={{
        fontSize: "28px",
        fontWeight: 800,
        color: "#0f172a",
        margin: 0
      }}>
        {isRfidMode ? "Traçabilité RFID" : "Suivi d'article"}
      </h1>
      <p style={{
        fontSize: "14px",
        color: "#64748b",
        margin: "2px 0 0 0"
      }}>
        Suivi d'état d'un article
      </p>
    </div>
  </div>
</div>
      <div className="filter-panel-section">
        <div className="filter-main-layout">
          <div className="filter-row" style={{ alignItems: "flex-end" }}>
            <div className="filter-group-item" style={{ flex: 2 }}>
              <span className="filter-label">
                {isRfidMode ? "Scanner un tag RFID" : "Scanner un code article"}
              </span>
              <div className="filter-input-with-operator" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <form onSubmit={handleSearch} style={{ flex: 1, margin: 0 }}>
                  <div style={{ position: "relative", width: "100%" }}>
                    <div style={{ 
                      position: "absolute", 
                      left: "12px", 
                      top: "50%", 
                      transform: "translateY(-50%)",
                      color: "#9ca3af",
                      display: "flex",
                      alignItems: "center"
                    }}>
                      {isRfidMode ? <FaRss size={12} /> : <FaSearch size={12} />}
                    </div>
                    <input
                      ref={scanInputRef}
                      type="text"
                      placeholder={isRfidMode ? "Entrez ou scannez le tag RFID (EPC)..." : "Scanner pour suivre l'article..."}
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      className="filter-input"
                      style={{ 
                        width: "100%",
                        padding: "12px 16px 12px 40px",
                        fontSize: "14px",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        outline: "none",
                        transition: "all 0.3s"
                      }}
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
                          color: "#9ca3af",
                          display: "flex",
                          alignItems: "center",
                          padding: 0
                        }}
                      >
                        <FaTrash size={10} />
                      </button>
                    )}
                  </div>
                </form>
                <button 
                  type="submit" 
                  onClick={handleSearch}
                  disabled={loading || !searchValue.trim()}
                  className="action-btn-vertical"
                  style={{ 
                    margin: 0, 
                    padding: "0 4px",
                    height: "30px",
                    width:"10px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    opacity: (!searchValue.trim() || loading) ? 0.6 : 1,
                    cursor: (!searchValue.trim() || loading) ? "not-allowed" : "pointer"
                  }}
                >
                  {loading ? (
                    <span className="btn-label">Chargement...</span>
                  ) : (
                    <>
                      <span className="btn-icon">{isRfidMode ? <FaRss   size={6} /> : <FaSearch     size={6}/>}</span>
                    </>
                  )}
                </button>
                <div className="operator-box" style={{ height: "42px", display: "flex", alignItems: "center", justifyContent: "center", minWidth: "40px" }}>
                  <div className={`status-dot ${isFocused ? 'active' : ''}`} style={{ width: "10px", height: "10px", borderRadius: "50%", background: isFocused ? "#10b981" : "#9ca3af" }}></div>
                </div>
              </div>
            </div>
            <div className="filter-group-item" style={{ flex: 1 }}>
              <span className="filter-label">Statut lecteur</span>
              <div className="filter-input-with-operator">
                <span className="filter-input" style={{ 
                  background: isFocused ? "#e8f5e9" : "#f5f5f5", 
                  color: isFocused ? "#2e7d32" : "#757575",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}>
                  <div className={`status-dot ${isFocused ? 'active' : ''}`} style={{ width: "8px", height: "8px", borderRadius: "50%", background: isFocused ? "#10b981" : "#9ca3af" }}></div>
                  {isFocused ? "Prêt à scanner" : "Inactif"}
                </span>
                <div className="operator-box">
                  <svg width="20" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="linge-list-section">
        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0 }}
              style={{ 
                background: "#fee2e2", 
                color: "#991b1b", 
                padding: "16px 20px", 
                borderRadius: "12px", 
                marginBottom: "20px",
                textAlign: "center",
                fontWeight: 500
              }}
            >
              {error}
            </motion.div>
          )}

          {item && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="table-wrapper" style={{ marginBottom: "30px" }}>
                <table className="modern-table">
                  <thead>
                    <tr style={{ background: "linear-gradient(135deg, #119674, #1e40af)" }}>
                      <th colSpan="2" style={{ color: "white", fontSize: "18px" }}>
                        {isRfidMode ? "📡 Informations RFID" : "📋 Informations article"}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ width: "180px", fontWeight: 600, background: "#f8fafc" }}>Catégorie</td>
                      <td><span className="matricule-badge">{item.categorie}</span></td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600, background: "#f8fafc" }}>ID</td>
                      <td>#{item.id}</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600, background: "#f8fafc" }}>{isRfidMode ? "Tag RFID (EPC)" : "Code suivi"}</td>
                      <td>
                        {isRfidMode ? (
                          <code className="rfid-tag">{(item.codeBarre)}</code>
                        ) : (
                          <code className="tracking-code">{item.codeBarre}</code>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600, background: "#f8fafc" }}>État actuel</td>
                      <td>
                        <span className={`status-badge ${item.etat.toLowerCase()}`} style={{
                          display: "inline-block",
                          padding: "4px 12px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: 600,
                          background: item.etat === "STOCKE" ? "#d1fae5" : item.etat === "PROPRE_PRET" ? "#dbeafe" : "#fed7aa",
                          color: item.etat === "STOCKE" ? "#065f46" : item.etat === "PROPRE_PRET" ? "#1e40af" : "#92400e"
                        }}>
                          {item.etat}
                        </span>
                      </td>
                    </tr>
                    <tr>
                                           <td style={{ fontWeight: 600, background: "#f8fafc" }}>Poids</td>

                      <td>{item.poids || "—"  }Kg</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="table-wrapper">
                <div className="page-header-container" style={{ marginBottom: "0", paddingBottom: "15px" }}>
                  <div className="page-title-section">
                    <div className="title-icon-box" style={{ background: "#e0e7ff" ,left:"30px",marginLeft:"10px" }}>
                      <FaHistory color="#20a785" />
                    </div>
                    <h3 style={{ margin: 0 }}>Journal des mouvements</h3>
                  </div>
                </div>
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th>État</th>
                      <th>Date et heure</th>
                      <th>Etat</th>
                      <th>Remarques</th>
                      <th>Utilisateur</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="center" style={{ padding: "40px", textAlign: "center" }}>
                          <div style={{ fontSize: "32px", marginBottom: "10px" }}>📭</div>
                          <span>Aucun historique disponible pour cet article</span>
                        </td>
                      </tr>
                    ) : (
                      history.map((step, index) => (
                        <motion.tr 
                          key={step.id} 
                          initial={{ opacity: 0, x: -20 }} 
                          animate={{ opacity: 1, x: 0 }} 
                          transition={{ delay: index * 0.05 }}
                        >
                          <td>
                            <span className="matricule-badge">{step.codeLinge}</span>
                          </td>
                          <td>{formatDate(step.dateOperation)}</td>
                          <td>
                            {step.etatapres ? (
                              <span style={{ display: "flex", alignItems: "center", gap: "6px"}}>
                                <FaSoap size={12} /> {step.etatapres}
                              </span>
                            ) : "—"}
                          </td>
                          <td style={{ fontStyle: step.observations ? "italic" : "normal", color: step.remarques ? "#4b5563" : "#9ca3af" }}>
                            {step.observations || "—"}
                          </td>
                          <td>
                            {step.agentNom ? (
                              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <FaUser size={12} /> {step.agentNom}
                              </span>
                            ) : "—"}
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}