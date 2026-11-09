import React, { useState, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, X, Circle } from "lucide-react";
import { useChatbot, BUBBLE_SIZE } from "./ChatbotProvider";
import { ChatMessage } from "./ChatMessage";
import { ChatSuggestions } from "./ChatSuggestions";
import { ChatInput } from "./ChatInput";
import { askAssistant } from "../../services/aiAssistantService";
import {
  INITIAL_SUGGESTIONS,
  CONTEXTUAL_SUGGESTIONS,
  detectContext,
} from "../../constants/chatbotSuggestions";

const EDGE = 16; // marge minimale avec les bords de l'écran
const GAP = 16;  // espace entre la bulle et la fenêtre

// Place la fenêtre à côté de la bulle, du côté où il y a le plus de place
const computePlacement = (bubble, viewport) => {
  const width = Math.min(400, viewport.width - 2 * EDGE);
  const height = Math.min(600, viewport.height - 2 * EDGE - BUBBLE_SIZE - GAP);
  const clamp = (v, max) => Math.min(Math.max(v, EDGE), Math.max(max, EDGE));

  const onRight = bubble.x + BUBBLE_SIZE / 2 > viewport.width / 2;
  const onBottom = bubble.y + BUBBLE_SIZE / 2 > viewport.height / 2;

  const left = clamp(onRight ? bubble.x + BUBBLE_SIZE - width : bubble.x, viewport.width - width - EDGE);
  const top = clamp(
    onBottom ? bubble.y - GAP - height : bubble.y + BUBBLE_SIZE + GAP,
    viewport.height - height - EDGE
  );

  return {
    left, top, width, height,
    origin: `${onBottom ? "bottom" : "top"} ${onRight ? "right" : "left"}`,
    fromY: onBottom ? 20 : -20,
  };
};

export const ChatbotWindow = () => {
  const { t } = useTranslation();
  const { isOpen, close, bubble, viewport } = useChatbot();
  const placement = computePlacement(bubble, viewport);

  const [messages, setMessages] = useState([]);
  const [suggestions, setSuggestions] = useState(INITIAL_SUGGESTIONS);
  const [isLoading, setIsLoading] = useState(false);

  const scrollRef = useRef(null);

  // ✅ Message initial au premier ouverture
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: t("chatbot.welcome"),
        },
      ]);
    }
  }, [isOpen, messages.length, t]);

  // ✅ Auto-scroll en bas
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // ✅ Fermer avec Escape
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape" && isOpen) close();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, close]);

  const sendQuestion = useCallback(
    async (question) => {
      if (!question || isLoading) return;

      const userMessage = {
        id: `u-${Date.now()}`,
        role: "user",
        content: question,
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setSuggestions([]); // Cache les suggestions pendant la requête

      try {
        const answer = await askAssistant(question);
        const assistantMessage = {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: answer,
        };
        setMessages((prev) => [...prev, assistantMessage]);

        // ✅ Suggestions contextuelles après la réponse
        const context = detectContext(answer);
        setSuggestions(CONTEXTUAL_SUGGESTIONS[context] || INITIAL_SUGGESTIONS);
      } catch (error) {
        console.error("Chatbot error:", error);
        setMessages((prev) => [
          ...prev,
          {
            id: `e-${Date.now()}`,
            role: "assistant",
            content: t(
              "chatbot.error_message",
              "Désolé, je n'arrive pas à récupérer cette information pour le moment. Veuillez réessayer."
            ),
            onRetry: () => sendQuestion(question),
          },
        ]);
        setSuggestions(INITIAL_SUGGESTIONS);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, t]
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: placement.fromY, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: placement.fromY, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          style={{
            position: "fixed",
            left: placement.left,
            top: placement.top,
            width: placement.width,
            height: placement.height,
            transformOrigin: placement.origin,
            borderRadius: "20px",
            background: "white",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            zIndex: 99999, // ✅ Toujours au premier plan
            boxShadow:
              "0 24px 60px rgba(15, 23, 42, 0.2), 0 0 0 1px rgba(15, 23, 42, 0.05)",
          }}
        >
          {/* ─── HEADER ─────────────────────────────────────────────── */}
          <div
            style={{
              padding: "14px 16px",
              background: "linear-gradient(135deg, #0d9488, #0ea5e9)",
              color: "white",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              flexShrink: 0,
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Décoration */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "radial-gradient(circle at 80% 20%, rgba(255,255,255,0.15) 0%, transparent 50%)",
                pointerEvents: "none",
              }}
            />

            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                background: "rgba(255, 255, 255, 0.2)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                position: "relative",
                zIndex: 1,
              }}
            >
              <Bot size={22} strokeWidth={2.2} />
            </div>

            <div style={{ flex: 1, minWidth: 0, position: "relative", zIndex: 1 }}>
              <div
                style={{
                  fontSize: "14.5px",
                  fontWeight: 800,
                  letterSpacing: "-0.2px",
                  lineHeight: 1.2,
                }}
              >
                {t("chatbot.title", "Assistant Buanderie")}
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: "rgba(255, 255, 255, 0.85)",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  marginTop: "2px",
                }}
              >
                <Circle
                  size={7}
                  fill="#4ade80"
                  color="#4ade80"
                  strokeWidth={0}
                  style={{ filter: "drop-shadow(0 0 4px #4ade80)" }}
                />
                {t("chatbot.online", "En ligne")}
              </div>
            </div>

            <button
              type="button"
              onClick={close}
              aria-label={t("chatbot.close", "Fermer")}
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "10px",
                border: "none",
                background: "rgba(255, 255, 255, 0.15)",
                color: "white",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "background 0.2s",
                position: "relative",
                zIndex: 1,
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(255, 255, 255, 0.3)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)")
              }
            >
              <X size={16} strokeWidth={2.5} />
            </button>
          </div>

          {/* ─── MESSAGES ───────────────────────────────────────────── */}
          <div
            ref={scrollRef}
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "16px",
              background: "#f8fafc",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}

            {isLoading && (
              <ChatMessage
                message={{
                  id: "loading",
                  role: "assistant",
                  content: "",
                  isLoading: true,
                }}
              />
            )}

            {/* Suggestions contextuelles */}
            {!isLoading && suggestions.length > 0 && (
              <ChatSuggestions
                suggestions={suggestions}
                onSelect={sendQuestion}
                disabled={isLoading}
              />
            )}
          </div>

          {/* ─── INPUT ──────────────────────────────────────────────── */}
          <ChatInput onSend={sendQuestion} isLoading={isLoading} />
        </motion.div>
      )}
    </AnimatePresence>
  );
};