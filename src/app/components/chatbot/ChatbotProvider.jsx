import React, { createContext, useContext, useState, useCallback } from "react";
import { ChatbotFloatingButton } from "./ChatbotFloatingButton";
import { ChatbotWindow } from "./ChatbotWindow";

const ChatbotContext = createContext();

export const useChatbot = () => {
  const ctx = useContext(ChatbotContext);
  if (!ctx) throw new Error("useChatbot must be used within ChatbotProvider");
  return ctx;
};

export const ChatbotProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);

  return (
    <ChatbotContext.Provider value={{ isOpen, open, close, toggle }}>
      {children}
      {/* ✅ Toujours montés → accessibles depuis n'importe quelle page */}
      <ChatbotFloatingButton />
      <ChatbotWindow />
    </ChatbotContext.Provider>
  );
};