import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaBoxes, FaCheckCircle } from "react-icons/fa";

export default function DialoguePliage({ item, onClose }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (item) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onClose, 300);
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [item, onClose]);

  if (!item) return null;

  return (
    <AnimatePresence>
      {visible && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.55)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          backdropFilter: "blur(5px)"
        }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 20 }}
            transition={{ duration: 0.2 }}
            style={{
              background: "white",
              borderRadius: "22px",
              padding: "28px",
              maxWidth: "460px",
              width: "95%",
              boxShadow: "0 28px 80px rgba(0,0,0,0.22)"
            }}
          >
            {/* Header */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: "#dcfce7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "20px"
                }}>
                  ✅
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: "17px", color: "#0f172a" }}>
                    Linge plié
                  </div>
                  <div style={{ fontSize: "12px", color: "#64748b" }}>
                    Stockage automatique
                  </div>
                </div>
              </div>
              <button
                onClick={() => { setVisible(false); setTimeout(onClose, 300); }}
                style={{
                  background: "#f1f5f9",
                  border: "none",
                  borderRadius: "50%",
                  width: "34px",
                  height: "34px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#64748b"
                }}
              >
                <FaTimes size={14} />
              </button>
            </div>

            {/* Infos du linge */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px 16px",
              padding: "14px 0",
              borderTop: "1px solid #f1f5f9",
              borderBottom: "1px solid #f1f5f9"
            }}>
              <div>
                <div style={{
                  fontSize: "10px",
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px"
                }}>
                  Code
                </div>
                <code style={{
                  fontWeight: 600,
                  fontSize: "13px",
                  color: "#0ea5e9"
                }}>
                  {item.codeSuivi || item.codeBarre || "N/A"}
                </code>
              </div>
              <div>
                <div style={{
                  fontSize: "10px",
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px"
                }}>
                  Catégorie
                </div>
                <span style={{
                  fontWeight: 600,
                  fontSize: "13px",
                  color: "#0f172a"
                }}>
                  {item.categorie || "NC"}
                </span>
              </div>
              <div>
                <div style={{
                  fontSize: "10px",
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px"
                }}>
                  Chambre
                </div>
                <span style={{
                  fontWeight: 600,
                  fontSize: "13px",
                  color: "#0f172a"
                }}>
                  {item.chambre || "—"}
                </span>
              </div>
              <div>
                <div style={{
                  fontSize: "10px",
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px"
                }}>
                  Poids
                </div>
                <span style={{
                  fontWeight: 600,
                  fontSize: "13px",
                  color: "#0f172a"
                }}>
                  {item.poids || 0} kg
                </span>
              </div>
            </div>

            {/* Footer du dialogue */}
            <div style={{
              marginTop: "14px",
              fontSize: "11px",
              color: "#94a3b8",
              textAlign: "center"
            }}>
              ⏱️ Fermeture automatique dans 3s
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}