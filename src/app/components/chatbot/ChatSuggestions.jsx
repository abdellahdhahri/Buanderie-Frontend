import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export const ChatSuggestions = ({ suggestions, onSelect, disabled }) => {
  const { t } = useTranslation();

  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "8px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          fontSize: "10.5px",
          fontWeight: 800,
          color: "#94a3b8",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          marginBottom: "4px",
        }}
      >
        <Sparkles size={11} strokeWidth={2.5} />
        {t("chatbot.suggestions_title", "Questions suggérées")}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
        {suggestions.map((key, index) => (
          <motion.button
            key={key}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(t(key))}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={!disabled ? { scale: 1.03 } : {}}
            whileTap={!disabled ? { scale: 0.97 } : {}}
            style={{
              padding: "7px 12px",
              borderRadius: "10px",
              border: "1px solid #e2e8f0",
              background: disabled ? "#f1f5f9" : "white",
              color: disabled ? "#94a3b8" : "#0f172a",
              fontSize: "12px",
              fontWeight: 600,
              cursor: disabled ? "not-allowed" : "pointer",
              textAlign: "left",
              lineHeight: 1.3,
              transition: "all 0.2s",
              boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
            }}
            onMouseEnter={(e) => {
              if (!disabled) {
                e.currentTarget.style.background = "#f0fdfa";
                e.currentTarget.style.borderColor = "#99f6e4";
                e.currentTarget.style.color = "#0d9488";
              }
            }}
            onMouseLeave={(e) => {
              if (!disabled) {
                e.currentTarget.style.background = "white";
                e.currentTarget.style.borderColor = "#e2e8f0";
                e.currentTarget.style.color = "#0f172a";
              }
            }}
          >
            {t(key)}
          </motion.button>
        ))}
      </div>
    </div>
  );
};