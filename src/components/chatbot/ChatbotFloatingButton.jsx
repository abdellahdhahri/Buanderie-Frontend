import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, X } from "lucide-react";
import { useChatbot, BUBBLE_SIZE } from "./ChatbotProvider";

// Distance (px) au-delà de laquelle un appui devient un déplacement et non un clic
const DRAG_THRESHOLD = 5;

export const ChatbotFloatingButton = () => {
  const { t } = useTranslation();
  const { isOpen, toggle, bubble, viewport, moveBubble, saveBubble } = useChatbot();
  const [isDragging, setIsDragging] = useState(false);
  const drag = useRef(null);
  const justDragged = useRef(false);

  const onPointerDown = (e) => {
    if (e.button !== 0) return;
    drag.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: bubble.x,
      originY: bubble.y,
      moved: false,
    };
  };

  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (!d.moved) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      d.moved = true;
      setIsDragging(true);
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    moveBubble(d.originX + dx, d.originY + dy);
  };

  const endDrag = (e) => {
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    if (d.moved) {
      justDragged.current = true;
      saveBubble();
    }
    drag.current = null;
    setIsDragging(false);
  };

  const onClick = () => {
    // Un relâchement après déplacement ne doit pas ouvrir/fermer le chat
    if (justDragged.current) {
      justDragged.current = false;
      return;
    }
    toggle();
  };

  // Info-bulle du côté où il y a de la place
  const onRightSide = bubble.x + BUBBLE_SIZE / 2 > viewport.width / 2;
  const label = t("chatbot.tooltip", "Assistant IA");

  return (
    <motion.button
      type="button"
      onClick={onClick}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      aria-label={label}
      title={`${label} — glisser pour déplacer`}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: isDragging ? 1.1 : 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      whileHover={isDragging ? undefined : { scale: 1.08 }}
      whileTap={isDragging ? undefined : { scale: 0.92 }}
      style={{
        position: "fixed",
        left: bubble.x,
        top: bubble.y,
        width: BUBBLE_SIZE,
        height: BUBBLE_SIZE,
        borderRadius: "50%",
        border: "none",
        background: isOpen
          ? "linear-gradient(135deg, #64748b, #475569)"
          : "linear-gradient(135deg, #0ea5e9, #0284c7)",
        color: "white",
        cursor: isDragging ? "grabbing" : "grab",
        touchAction: "none",
        userSelect: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: isDragging
          ? "0 16px 36px rgba(2, 132, 199, 0.45)"
          : isOpen
            ? "0 8px 24px rgba(100, 116, 139, 0.35)"
            : "0 8px 24px rgba(14, 165, 233, 0.4)",
        zIndex: 99998,
        transition: "background 0.3s ease, box-shadow 0.2s ease",
      }}
    >
      {/* Halo pulsant quand fermé et immobile */}
      {!isOpen && !isDragging && (
        <motion.span
          animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            inset: -4,
            borderRadius: "50%",
            background: "rgba(14, 165, 233, 0.35)",
            zIndex: -1,
            pointerEvents: "none",
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
            style={{ display: "flex", pointerEvents: "none" }}
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
            style={{ display: "flex", pointerEvents: "none" }}
          >
            <Bot size={28} strokeWidth={2.2} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info-bulle texte (visible si fermé et immobile) */}
      <AnimatePresence>
        {!isOpen && !isDragging && (
          <motion.span
            initial={{ opacity: 0, x: onRightSide ? 10 : -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: onRightSide ? 10 : -10 }}
            transition={{ delay: 2, duration: 0.4 }}
            style={{
              position: "absolute",
              ...(onRightSide ? { right: "72px" } : { left: "72px" }),
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
            {label}
            <span
              style={{
                position: "absolute",
                ...(onRightSide ? { right: "-4px" } : { left: "-4px" }),
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
