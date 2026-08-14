import React, { useState, useEffect, useMemo } from "react";
import { FaClock, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";

/**
 * Minuteur live pour un cycle de lavage en cours.
 * Affiche le temps écoulé, la durée prévue et une barre de progression.
 * Change de couleur quand le programme est terminé (dépassement).
 *
 * Props :
 *  - dateDebut     : ISO string du démarrage
 *  - dureePrevue   : durée en minutes (null = pas de durée connue)
 *  - programme     : nom du programme (ex: "Coton 60°C")
 *  - temperature   : string (ex: "60°C")
 *  - vitesse       : string (ex: "1200 rpm")
 */
export default function MinuteurLavage({
  dateDebut,
  dureePrevue,
  programme,
  temperature,
  vitesse,
}) {
  const [elapsed, setElapsed] = useState(0); // secondes écoulées

  useEffect(() => {
    if (!dateDebut) return;
    const tick = () =>
      setElapsed(Math.floor((Date.now() - new Date(dateDebut)) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [dateDebut]);

  // Formatage HH:MM:SS ou MM:SS
  const formaterTemps = (sec) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    const p = (n) => String(n).padStart(2, "0");
    return h > 0 ? `${p(h)}:${p(m)}:${p(s)}` : `${p(m)}:${p(s)}`;
  };

  // Calculs progression
  const dureePrevueSec = dureePrevue ? dureePrevue * 60 : null;
  const pct = dureePrevueSec
    ? Math.min((elapsed / dureePrevueSec) * 100, 100)
    : null;
  const depasse     = dureePrevueSec && elapsed > dureePrevueSec;
  const presqueFini = pct >= 90 && !depasse;

  // Couleur selon avancement
  const couleur = depasse
    ? "#ef4444"
    : presqueFini
    ? "#f59e0b"
    : "#7c3aed";

  const tempsRestant = dureePrevueSec
    ? Math.max(0, dureePrevueSec - elapsed)
    : null;

  return (
    <div style={{
      background: depasse ? "#fff5f5" : presqueFini ? "#fefce8" : "#faf5ff",
      borderRadius: "14px",
      border: `2px solid ${depasse ? "#fca5a5" : presqueFini ? "#fde68a" : "#e9d5ff"}`,
      padding: "16px",
      marginBottom: "14px"
    }}>

      {/* Programme + état */}
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "center", marginBottom: "12px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{
            width: "8px", height: "8px", borderRadius: "50%",
            background: couleur,
            animation: !depasse ? "pulseDot 1.5s infinite" : "none"
          }} />
          <span style={{ fontWeight: 700, fontSize: "13px", color: couleur }}>
            {programme || "Lavage en cours"}
          </span>
        </div>
        {depasse ? (
          <span style={{
            fontSize: "11px", fontWeight: 700, color: "#ef4444",
            background: "#fee2e2", padding: "2px 8px", borderRadius: "8px",
            display: "flex", alignItems: "center", gap: "4px"
          }}>
            <FaExclamationTriangle size={10} /> Dépassé
          </span>
        ) : presqueFini ? (
          <span style={{
            fontSize: "11px", fontWeight: 700, color: "#f59e0b",
            background: "#fef3c7", padding: "2px 8px", borderRadius: "8px"
          }}>
            Bientôt fini
          </span>
        ) : null}
      </div>

      {/* Compteur principal */}
      <div style={{ textAlign: "center", marginBottom: "12px" }}>
        <div style={{
          fontFamily: "monospace", fontSize: "36px", fontWeight: 800,
          color: couleur, letterSpacing: "2px", lineHeight: 1
        }}>
          {formaterTemps(elapsed)}
        </div>
        {dureePrevueSec && (
          <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "6px" }}>
            {depasse
              ? `+${formaterTemps(elapsed - dureePrevueSec)} de dépassement`
              : `Reste : ${formaterTemps(tempsRestant)}`}
          </div>
        )}
      </div>

      {/* Barre de progression (si durée connue) */}
      {pct !== null && (
        <div style={{ marginBottom: "12px" }}>
          <div style={{
            display: "flex", justifyContent: "space-between",
            fontSize: "11px", color: "#94a3b8", marginBottom: "5px"
          }}>
            <span>0 min</span>
            <span style={{ fontWeight: 600, color: couleur }}>
              {Math.round(pct)}%
            </span>
            <span>{dureePrevue} min</span>
          </div>
          <div style={{
            height: "10px", background: "#f1f5f9",
            borderRadius: "5px", overflow: "hidden"
          }}>
            <div style={{
              width: `${pct}%`, height: "100%",
              borderRadius: "5px", background: couleur,
              transition: "width 1s linear"
            }} />
          </div>
        </div>
      )}

      {/* Paramètres */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
        {[
          { label: "Temp.",   val: temperature ? `${temperature}°C`   : "—", color: "#ef4444" },
          { label: "Essor.",  val: vitesse     ? `${vitesse} rpm`     : "—", color: "#0ea5e9" },
          { label: "Départ",  val: dateDebut   ? new Date(dateDebut).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "—", color: "#64748b" },
          { label: "Durée",   val: dureePrevue ? `${dureePrevue} min` : "—", color: "#7c3aed" },
        ].map(({ label, val, color }) => (
          <div key={label} style={{
            background: "white", borderRadius: "8px",
            padding: "7px 10px", border: "1px solid #f1f5f9"
          }}>
            <div style={{ fontSize: "10px", color: "#94a3b8" }}>{label}</div>
            <div style={{ fontWeight: 700, fontSize: "13px", color }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Message fin */}
      {depasse && (
        <div style={{
          marginTop: "10px", padding: "8px 12px", background: "#fee2e2",
          borderRadius: "8px", fontSize: "12px", color: "#991b1b",
          fontWeight: 600, display: "flex", alignItems: "center", gap: "6px"
        }}>
          <FaExclamationTriangle size={12} />
          Programme terminé — vous pouvez arrêter la machine
        </div>
      )}

      {!depasse && pct === 100 && (
        <div style={{
          marginTop: "10px", padding: "8px 12px", background: "#dcfce7",
          borderRadius: "8px", fontSize: "12px", color: "#15803d",
          fontWeight: 600, display: "flex", alignItems: "center", gap: "6px"
        }}>
          <FaCheckCircle size={12} />
          Lavage terminé !
        </div>
      )}

      <style>{`
        @keyframes pulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
}
