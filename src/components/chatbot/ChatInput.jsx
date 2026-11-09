import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Send, Loader2 } from "lucide-react";

export const ChatInput = ({ onSend, isLoading, disabled }) => {
  const { t } = useTranslation();
  const [value, setValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef(null);

  // Auto-resize du textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  }, [value]);

  const handleSubmit = () => {
    if (!value.trim() || isLoading || disabled) return;
    onSend(value.trim());
    setValue("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isDisabled = !value.trim() || isLoading || disabled;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: "8px",
        padding: "12px 14px",
        borderTop: "1px solid #f1f5f9",
        background: "white",
      }}
    >
      <div
        style={{
          flex: 1,
          position: "relative",
          border: `1.5px solid ${isFocused ? "#0d9488" : "#e2e8f0"}`,
          borderRadius: "12px",
          background: "#f8fafc",
          transition: "all 0.2s",
          boxShadow: isFocused ? "0 0 0 3px rgba(13, 148, 136, 0.1)" : "none",
        }}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={isLoading || disabled}
          placeholder={t("chatbot.placeholder", "Écrire votre question...")}
          rows={1}
          style={{
            width: "100%",
            padding: "10px 12px",
            border: "none",
            background: "transparent",
            fontSize: "13.5px",
            fontFamily: "inherit",
            color: "#0f172a",
            outline: "none",
            resize: "none",
            maxHeight: "120px",
            lineHeight: 1.5,
            boxSizing: "border-box",
          }}
        />
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isDisabled}
        aria-label={t("chatbot.send", "Envoyer")}
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "12px",
          border: "none",
          flexShrink: 0,
          background: isDisabled
            ? "#e2e8f0"
            : "linear-gradient(135deg, #0d9488, #14b8a6)",
          color: "white",
          cursor: isDisabled ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.2s",
          boxShadow: isDisabled ? "none" : "0 4px 12px rgba(13, 148, 136, 0.3)",
        }}
      >
        {isLoading ? (
          <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
        ) : (
          <Send size={16} strokeWidth={2.5} />
        )}
      </button>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};