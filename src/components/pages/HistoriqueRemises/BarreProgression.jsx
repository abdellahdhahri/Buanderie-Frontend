import React from "react";
import "./HistoriqueRemises.css";

export default function BarreProgression({ remise, collectee }) {
  const pct = collectee > 0 ? Math.min(100, Math.round((remise / collectee) * 100)) : 0;
  return (
    <div className={`hr-progress ${pct >= 100 ? "is-complete" : ""}`}>
      <div className="hr-progress__track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
        <i style={{ width: `${pct}%` }} />
      </div>
      <span>{pct}%</span>
    </div>
  );
}
