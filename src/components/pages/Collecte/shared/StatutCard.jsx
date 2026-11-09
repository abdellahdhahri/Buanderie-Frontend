import React from "react";
import "./CollecteRh.css";

export function StatutCard({ label, value, icon, color, subValue, onClick, active }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`cr-kpi ${onClick ? "is-clickable" : ""} ${active ? "is-active" : ""}`}
      style={{ "--k": color }}
    >
      <span className="cr-kpi__icon">{icon}</span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
        {subValue && <em>{subValue}</em>}
      </div>
    </Tag>
  );
}
