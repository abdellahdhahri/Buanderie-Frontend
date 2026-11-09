import React, { useState, useRef, useEffect } from "react";
import { FaTimes, FaBarcode, FaCheck, FaSpinner } from "react-icons/fa";
import { useLavage } from "../../contextes/LavageContext";

/**
 * Modal de scan des linges propres après lavage infecté.
 * Focus permanent sur l'input — le scan est immédiat.
 */
export default function ScanLingesPropresModal() {
  const {
    scanPropresNumerosac,
    setScanPropresNumerosac,
    affecterLingesPropres,
    loading,
  } = useLavage();

  const [codes,    setCodes]    = useState([]);
  const [inputVal, setInputVal] = useState("");
  const inputRef = useRef(null);

  // Reset + focus à l'ouverture
  useEffect(() => {
    if (!scanPropresNumerosac) return;
    setCodes([]);
    setInputVal("");
    setTimeout(() => inputRef.current?.focus(), 150);
  }, [scanPropresNumerosac]);

  // Focus permanent dans la modal
  useEffect(() => {
    if (!scanPropresNumerosac) return;
    const restore = () => { if (inputRef.current) inputRef.current.focus(); };
    document.addEventListener("click", restore);
    return () => document.removeEventListener("click", restore);
  }, [scanPropresNumerosac]);

  if (!scanPropresNumerosac) return null;

  const handleAjouter = () => {
    const list = inputVal.split(/[\s,;\n]+/).map(t => t.trim()).filter(Boolean);
    if (!list.length) return;
    const existants = new Set(codes);
    const nouveaux  = list.filter(c => !existants.has(c));
    if (nouveaux.length) setCodes(prev => [...prev, ...nouveaux]);
    setInputVal("");
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") { e.preventDefault(); handleAjouter(); }
  };

  const handleValider = () => {
    if (!codes.length) return;
    affecterLingesPropres(scanPropresNumerosac, codes);
    setCodes([]);
  };

  const handleFermer = () => {
    setScanPropresNumerosac(null);
    setCodes([]);
    setInputVal("");
  };

  return (
    <div
      data-modal="true"
      style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(0,0,0,0.55)", display: "flex",
        alignItems: "center", justifyContent: "center",
        zIndex: 9999, backdropFilter: "blur(5px)"
      }}
    >
      <div style={{
        background: "white", borderRadius: "22px", padding: "28px",
        maxWidth: "480px", width: "95%",
        boxShadow: "0 28px 80px rgba(0,0,0,0.22)"
      }}>

        {/* Header */}
        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: "20px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "44px", height: "44px", borderRadius: "12px",
              background: "#dbeafe", display: "flex",
              alignItems: "center", justifyContent: "center"
            }}>
              <FaBarcode size={20} color="#0ea5e9" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: "16px", color: "#0f172a" }}>
                Scanner les linges propres
              </div>
              <div style={{ fontSize: "12px", color: "#64748b" }}>
                {scanPropresNumerosac}
              </div>
            </div>
          </div>
          <button
            onClick={handleFermer}
            style={{
              background: "#f1f5f9", border: "none", borderRadius: "50%",
              width: "34px", height: "34px", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#64748b"
            }}
          >
            <FaTimes size={14} />
          </button>
        </div>

        {/* Zone scan */}
        <div style={{ position: "relative", marginBottom: "8px" }}>
          <div style={{
            position: "absolute", left: "14px", top: "50%",
            transform: "translateY(-50%)", color: "#9ca3af"
          }}>
            <FaBarcode size={16} />
          </div>
          <input
            ref={inputRef}
            type="text"
            placeholder="Scanner le code-barres ou tag RFID..."
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            style={{
              width: "100%", padding: "13px 13px 13px 42px",
              borderRadius: "10px", border: "2px solid #0ea5e9",
              fontSize: "15px", outline: "none", boxSizing: "border-box",
              boxShadow: "0 0 0 3px rgba(14,165,233,0.1)"
            }}
          />
        </div>

        <div style={{
          fontSize: "11px", color: "#94a3b8", marginBottom: "16px",
          display: "flex", alignItems: "center", gap: "6px"
        }}>
          <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#10b981" }} />
          Lecteur actif — Entrée après chaque scan
        </div>

        {/* Liste scannée */}
        <div style={{ minHeight: "80px", maxHeight: "180px", overflowY: "auto", marginBottom: "14px" }}>
          {codes.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px", color: "#94a3b8", fontSize: "13px" }}>
              <FaBarcode size={26} style={{ opacity: 0.2, marginBottom: "6px" }} />
              <div>Scannez les linges propres sortis de la machine</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {codes.map((code, i) => (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "7px 12px", background: "#f0f9ff",
                  borderRadius: "8px", border: "1px solid #bae6fd"
                }}>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <span style={{ fontSize: "11px", color: "#94a3b8", minWidth: "22px" }}>
                      #{i + 1}
                    </span>
                    <code style={{ fontSize: "13px", fontWeight: 600, color: "#0284c7" }}>
                      {code}
                    </code>
                  </div>
                  <button
                    onClick={() => setCodes(prev => prev.filter((_, j) => j !== i))}
                    style={{
                      background: "none", border: "none",
                      color: "#94a3b8", cursor: "pointer", padding: "2px 6px"
                    }}
                  >
                    <FaTimes size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Compteur */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "8px 14px", background: "#f8fafc",
          borderRadius: "9px", marginBottom: "14px", fontSize: "13px"
        }}>
          <span style={{ color: "#64748b" }}>Linges scannés</span>
          <strong style={{ color: "#0ea5e9", fontSize: "16px" }}>{codes.length}</strong>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={handleFermer}
            style={{
              flex: 1, padding: "12px", borderRadius: "10px",
              border: "1px solid #e2e8f0", background: "white",
              color: "#64748b", fontWeight: 600, fontSize: "14px", cursor: "pointer"
            }}
          >
            Annuler
          </button>
          <button
            onClick={handleValider}
            disabled={loading || !codes.length}
            style={{
              flex: 2, padding: "12px", borderRadius: "10px", border: "none",
              background: !codes.length
                ? "#e2e8f0"
                : "linear-gradient(135deg,#10b981,#059669)",
              color: !codes.length ? "#94a3b8" : "white",
              fontWeight: 700, fontSize: "14px",
              cursor: !codes.length ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
            }}
          >
            {loading
              ? <FaSpinner style={{ animation: "spin 1s linear infinite" }} />
              : <FaCheck size={13} />}
            Confirmer ({codes.length} linge{codes.length > 1 ? "s" : ""})
          </button>
        </div>
      </div>

      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}
