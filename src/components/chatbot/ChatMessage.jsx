import React from "react";
import { motion } from "framer-motion";
import { Bot, User } from "lucide-react";

export const ChatMessage = ({ message }) => {
  const { role, content, isLoading, onRetry } = message;
  const isUser = role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      style={{
        display: "flex",
        gap: "10px",
        alignItems: "flex-start",
        flexDirection: isUser ? "row-reverse" : "row",
        marginBottom: "14px",
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: "32px",
          height: "32px",
          borderRadius: "10px",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: isUser
            ? "linear-gradient(135deg, #0ea5e9, #0284c7)"
            : "linear-gradient(135deg, #0d9488, #14b8a6)",
          color: "white",
          boxShadow: isUser
            ? "0 2px 8px rgba(14, 165, 233, 0.3)"
            : "0 2px 8px rgba(13, 148, 136, 0.3)",
        }}
      >
        {isUser ? <User size={16} strokeWidth={2.5} /> : <Bot size={16} strokeWidth={2.5} />}
      </div>

      {/* Bulle */}
      <div
        style={{
          maxWidth: "78%",
          padding: "10px 14px",
          borderRadius: isUser
            ? "14px 14px 4px 14px"
            : "14px 14px 14px 4px",
          background: isUser
            ? "linear-gradient(135deg, #0ea5e9, #0284c7)"
            : "white",
          color: isUser ? "white" : "#0f172a",
          fontSize: "13.5px",
          lineHeight: 1.5,
          fontWeight: 500,
          boxShadow: isUser
            ? "0 2px 8px rgba(14, 165, 233, 0.2)"
            : "0 1px 3px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(15, 23, 42, 0.04)",
          wordBreak: "break-word",
          whiteSpace: "pre-wrap",
        }}
      >
        {isLoading ? (
          <div style={{ display: "flex", gap: "4px", padding: "4px 0" }}>
            <motion.span
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
              style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#0d9488" }}
            />
            <motion.span
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
              style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#0d9488" }}
            />
            <motion.span
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
              style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#0d9488" }}
            />
          </div>
        ) : (
          <>
            {content}
            {onRetry && (
              <button
                onClick={onRetry}
                style={{
                  display: "block",
                  marginTop: "8px",
                  padding: "5px 12px",
                  borderRadius: "8px",
                  border: "1px solid #fecaca",
                  background: "#fef2f2",
                  color: "#dc2626",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Réessayer
              </button>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};