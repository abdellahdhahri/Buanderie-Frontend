import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from "react";
import { ChatbotFloatingButton } from "./ChatbotFloatingButton";
import { ChatbotWindow } from "./ChatbotWindow";
import { useAuth } from "../../contextes/Authentication/AuthContext";
import { NAV_ITEMS } from "../layout/sidebar";
import { isAdministrateur } from "../../utils/privileges";

const ChatbotContext = createContext();

export const BUBBLE_SIZE = 60;
const MARGIN = 16;
const DEFAULT_OFFSET = 24;
const STORAGE_KEY = "chatbot.bubblePosition";

export const useChatbot = () => {
  const ctx = useContext(ChatbotContext);
  if (!ctx) throw new Error("useChatbot must be used within ChatbotProvider");
  return ctx;
};

const getViewport = () => ({ width: window.innerWidth, height: window.innerHeight });

// La position est stockée en fractions (0 → 1) de l'espace disponible,
// pour que la bulle garde sa place relative quand la fenêtre change de taille.
const readStoredPosition = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && typeof saved.fx === "number" && typeof saved.fy === "number") return saved;
  } catch { /* stockage indisponible : position par défaut */ }
  return null;
};

const defaultPosition = ({ width, height }) => ({
  fx: (width - BUBBLE_SIZE - DEFAULT_OFFSET - MARGIN) / Math.max(width - BUBBLE_SIZE - 2 * MARGIN, 1),
  fy: (height - BUBBLE_SIZE - DEFAULT_OFFSET - MARGIN) / Math.max(height - BUBBLE_SIZE - 2 * MARGIN, 1),
});

const clamp01 = (v) => Math.min(Math.max(v, 0), 1);

export const ChatbotProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewport, setViewport] = useState(getViewport);
  const [fraction, setFraction] = useState(() => readStoredPosition() ?? defaultPosition(getViewport()));

  // Chatbot réservé à l'administrateur (tous les droits)
  const { isAuthenticated, admin, privileges } = useAuth();
  const canUseChatbot = isAuthenticated && (admin || isAdministrateur(privileges, NAV_ITEMS));

  useEffect(() => {
    if (!canUseChatbot) setIsOpen(false);
  }, [canUseChatbot]);

  useEffect(() => {
    const onResize = () => setViewport(getViewport());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);

  // Position en pixels (coin haut-gauche de la bulle), toujours dans l'écran
  const rangeX = Math.max(viewport.width - BUBBLE_SIZE - 2 * MARGIN, 0);
  const rangeY = Math.max(viewport.height - BUBBLE_SIZE - 2 * MARGIN, 0);
  const bubble = useMemo(() => ({
    x: MARGIN + clamp01(fraction.fx) * rangeX,
    y: MARGIN + clamp01(fraction.fy) * rangeY,
  }), [fraction, rangeX, rangeY]);

  const moveBubble = useCallback((x, y) => {
    setFraction({
      fx: rangeX ? clamp01((x - MARGIN) / rangeX) : 0,
      fy: rangeY ? clamp01((y - MARGIN) / rangeY) : 0,
    });
  }, [rangeX, rangeY]);

  const saveBubble = useCallback(() => {
    setFraction((f) => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(f)); } catch { /* ignoré */ }
      return f;
    });
  }, []);

  const value = {
    isOpen, open, close, toggle,
    bubble, viewport, moveBubble, saveBubble,
  };

  return (
    <ChatbotContext.Provider value={value}>
      {children}
      {/* ✅ Montés pour l'administrateur → accessibles depuis n'importe quelle page */}
      {canUseChatbot && (
        <>
          <ChatbotFloatingButton />
          <ChatbotWindow />
        </>
      )}
    </ChatbotContext.Provider>
  );
};
