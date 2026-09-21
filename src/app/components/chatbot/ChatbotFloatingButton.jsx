import React from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, X } from "lucide-react";
import { useChatbot } from "./ChatbotProvider";

export const ChatbotFloatingButton = () => {
  const { t } = useTranslation();
  const { isOpen, toggle } = useChatbot();

  return (
    <motion.button
      type="button"
      onClick={toggle}
      aria-label={t("chatbot.tooltip", "Assistant IA")}
      title={t("chatbot.tooltip", "Assistant IA")}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        width: "60px",
        height: "60px",
        borderRadius: "50%",
        border: "none",
        background: isOpen
          ? "linear-gradient(135deg, #64748b, #475569)"
          : "linear-gradient(135deg, #0ea5e9, #0284c7)",
        color: "white",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: isOpen
          ? "0 8px 24px rgba(100, 116, 139, 0.35)"
          : "0 8px 24px rgba(14, 165, 233, 0.4), 0 0 0 0 rgba(14, 165, 233, 0.5)",
        zIndex: 99998,
        transition: "background 0.3s ease",
      }}
    >
      {/* Halo pulsant quand fermé */}
      {!isOpen && (
        <motion.span
          animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            inset: -4,
            borderRadius: "50%",
            background: "rgba(14, 165, 233, 0.35)",
            zIndex: -1,
          }}
        />
      )}

      <AnimatePresence mode="wait">
        {isOpen ? (
          <motion.div
            key="close"
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ display: "flex" }}
          >
            <X size={26} strokeWidth={2.5} />
          </motion.div>
        ) : (
          <motion.div
            key="bot"
            initial={{ rotate: 90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: -90, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ display: "flex" }}
          >
            <Bot size={28} strokeWidth={2.2} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tooltip texte (visible si fermé) */}
      <AnimatePresence>
        {!isOpen && (
          <motion.span
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ delay: 2, duration: 0.4 }}
            style={{
              position: "absolute",
              right: "72px",
              top: "50%",
              transform: "translateY(-50%)",
              whiteSpace: "nowrap",
              padding: "6px 12px",
              borderRadius: "10px",
              background: "rgba(15, 23, 42, 0.9)",
              color: "white",
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.3px",
              pointerEvents: "none",
              boxShadow: "0 4px 12px rgba(15, 23, 42, 0.2)",
            }}
          >
            {t("chatbot.tooltip", "Assistant IA")}
            <span
              style={{
                position: "absolute",
                right: "-4px",
                top: "50%",
                transform: "translateY(-50%) rotate(45deg)",
                width: "8px",
                height: "8px",
                background: "rgba(15, 23, 42, 0.9)",
              }}
            />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
};