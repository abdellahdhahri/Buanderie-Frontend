import React from "react";
import { motion } from "framer-motion";
import "./CollecteRh.css";

const TONES = {
  red: "#dc2626",
  blue: "#0794a4",
  purple: "#6366f1",
  green: "#10b981",
};

export function MessageEtape({ tone, icon, title, subtitle, extra, animated }) {
  const Wrapper = animated ? motion.div : "div";
  const animProps = animated ? { initial: { opacity: 0, y: -6 }, animate: { opacity: 1, y: 0 } } : {};
  return (
    <Wrapper {...animProps} className={`cr-step ${extra ? "is-wrap" : ""}`} style={{ "--t": TONES[tone] || TONES.blue }}>
      <span className="cr-step__icon">{icon}</span>
      <div className="cr-step__text">
        <strong>{title}</strong>
        {subtitle && <small>{subtitle}</small>}
      </div>
      {extra}
    </Wrapper>
  );
}
