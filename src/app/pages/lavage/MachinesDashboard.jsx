import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router";
import {
  FaSoap, FaPlay, FaStop, FaClock, FaWeight,
  FaLayerGroup, FaCheckCircle, FaExclamationTriangle,
  FaBiohazard, FaThermometerHalf, FaTachometerAlt, FaTimes
} from "react-icons/fa";
import "../Linge/WorkflowList.css";

const API        = "http://localhost:8082/api";
const REFRESH_MS = 5000;

// ─── Thèmes par type de machine ───────────────────────────────────────────────
const THEME = {
  LINGE_NORMAL: {
    label:      "Linge Normal",
    emoji:      "⬜",
    primary:    "#0ea5e9",
    light:      "#e0f2fe",
    gradient:   "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)",
    border:     "#bae6fd",
    textDark:   "#0369a1",
    glow:       "rgba(14,165,233,0.18)",
  },
  LINGES_INFECTE: {
    label:      "Linge Infecté",
    emoji:      "🔴",
    primary:    "#dc2626",
    light:      "#fee2e2",
    gradient:   "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
    border:     "#fca5a5",
    textDark:   "#991b1b",
    glow:       "rgba(220,38,38,0.18)",
  },
};

// ─── États machine ────────────────────────────────────────────────────────────
const ETAT_CFG = {
  DISPONIBLE:  { label: "Disponible",  dot: "#10b981", pulse: false },
  EN_COURS:    { label: "En cours",    dot: "#7c3aed", pulse: true  },
  EN_PAUSE:    { label: "En pause",    dot: "#f59e0b", pulse: false },
  EN_PANNE:    { label: "En panne",    dot: "#ef4444", pulse: false },
  MAINTENANCE: { label: "Maintenance", dot: "#64748b", pulse: false },
};

// ─── Minuterie live ───────────────────────────────────────────────────────────
function Minuterie({ dateDebut }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!dateDebut) return;
    const tick = () => setElapsed(Math.floor((Date.now() - new Date(dateDebut)) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [dateDebut]);
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  const p = n => String(n).padStart(2, "0");
  return (
    <span style={{ fontFamily: "monospace", fontWeight: 800, letterSpacing: "2px" }}>
      {h > 0 && `${p(h)}:`}{p(m)}:{p(s)}
    </span>
  );
}

// ─── Jauge circulaire ─────────────────────────────────────────────────────────
function JaugeCirculaire({ pct, couleur, taille = 72 }) {
  const r  = (taille - 10) / 2;
  const cx = taille / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={taille} height={taille} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="#f1f5f9" strokeWidth="8" />
      <circle cx={cx} cy={cx} r={r} fill="none" stroke={couleur} strokeWidth="8"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.5s ease" }} />
    </svg>
  );
}

// ─── Carte Machine ────────────────────────────────────────────────────────────
function CarteMachine({ machine, onClick, onTerminer }) {
  const categorie  = machine.categorie || "LINGE_NORMAL";
  const theme      = THEME[categorie] || THEME.LINGE_NORMAL;
  const etatCfg    = ETAT_CFG[machine.etat] || ETAT_CFG.DISPONIBLE;
  const enCours    = machine.etat === "EN_COURS";
  const disponible = machine.etat === "DISPONIBLE";
  const pctPoids   = machine.capaciteKg
    ? Math.min(((machine.poidsActuel || 0) / machine.capaciteKg) * 100, 100)
    : 0;
  const couleurPoids = pctPoids >= 90 ? "#ef4444" : pctPoids >= 70 ? "#f59e0b" : theme.primary;

  return (
    <div onClick={() => onClick(machine)}
      style={{
        borderRadius: "20px", overflow: "hidden", cursor: "pointer",
        border: `1.5px solid ${theme.border}`,
        background: "white",
        boxShadow: enCours
          ? `0 8px 32px ${theme.glow}, 0 2px 8px rgba(0,0,0,0.06)`
          : "0 2px 10px rgba(0,0,0,0.05)",
        transition: "all 0.25s",
        position: "relative"
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = `0 16px 40px ${theme.glow}, 0 4px 12px rgba(0,0,0,0.08)`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = enCours ? `0 8px 32px ${theme.glow}, 0 2px 8px rgba(0,0,0,0.06)` : "0 2px 10px rgba(0,0,0,0.05)"; }}
    >
      {/* Bandeau type */}
      <div style={{ background: theme.gradient, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "18px" }}>{theme.emoji}</span>
          <span style={{ color: "white", fontWeight: 700, fontSize: "13px", opacity: 0.9 }}>{theme.label}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{
            width: "9px", height: "9px", borderRadius: "50%",
            background: etatCfg.dot,
            boxShadow: etatCfg.pulse ? `0 0 0 0 ${etatCfg.dot}` : "none",
            animation: etatCfg.pulse ? "pulseDot 1.5s infinite" : "none"
          }} />
          <span style={{ color: "white", fontSize: "11px", fontWeight: 600, opacity: 0.9 }}>{etatCfg.label}</span>
        </div>
      </div>

      {/* Corps */}
      <div style={{ padding: "18px 20px" }}>

        {/* Nom machine */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: "22px", color: "#0f172a", letterSpacing: "-0.5px" }}>
              {machine.code}
            </div>
            <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "1px" }}>
              Capacité {machine.capaciteKg} kg
            </div>
          </div>
          {/* Jauge circulaire */}
          <div style={{ position: "relative" }}>
            <JaugeCirculaire pct={pctPoids} couleur={couleurPoids} />
            <div style={{
              position: "absolute", top: "50%", left: "50%",
              transform: "translate(-50%,-50%) rotate(90deg)",
              fontSize: "12px", fontWeight: 800, color: couleurPoids, textAlign: "center"
            }}>
              {Math.round(pctPoids)}%
            </div>
          </div>
        </div>

        {/* EN COURS */}
        {enCours && machine.cycleActuel && (
          <>
            {/* Minuterie */}
            <div style={{
              display: "flex", alignItems: "center", gap: "10px",
              padding: "10px 14px", background: "#faf5ff",
              borderRadius: "10px", marginBottom: "14px",
              border: "1px solid #e9d5ff"
            }}>
              <FaClock size={13} color="#7c3aed" />
              <span style={{ fontSize: "12px", color: "#7c3aed", fontWeight: 600 }}>En cours depuis</span>
              <span style={{ marginLeft: "auto", color: "#7c3aed", fontSize: "16px" }}>
                <Minuterie dateDebut={machine.cycleActuel.dateDebut} />
              </span>
            </div>

            {/* Paramètres lavage */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "14px" }}>
              {[
                { icon: <FaThermometerHalf size={13} color="#ef4444" />, label: "Temp.", val: `${machine.cycleActuel.temperature || "—"}°C` },
                { icon: <FaTachometerAlt size={13} color="#0ea5e9" />,   label: "Ess.",  val: `${machine.cycleActuel.vitesse || "—"} rpm` },
                { icon: <FaLayerGroup size={13} color="#7c3aed" />,      label: "Lots",  val: machine.cycleActuel.nbLots || "—" },
              ].map(({ icon, label, val }) => (
                <div key={label} style={{ background: "#f8fafc", borderRadius: "9px", padding: "8px 10px", textAlign: "center" }}>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: "4px" }}>{icon}</div>
                  <div style={{ fontSize: "10px", color: "#94a3b8" }}>{label}</div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>{val}</div>
                </div>
              ))}
            </div>

            {/* Poids */}
            <div style={{ marginBottom: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "5px" }}>
                <span style={{ color: "#64748b", display: "flex", alignItems: "center", gap: "4px" }}>
                  <FaWeight size={10} /> Charge
                </span>
                <span style={{ fontWeight: 700, color: couleurPoids }}>
                  {machine.poidsActuel?.toFixed(1) || 0} / {machine.capaciteKg} kg
                </span>
              </div>
              <div style={{ height: "6px", background: "#f1f5f9", borderRadius: "3px", overflow: "hidden" }}>
                <div style={{
                  width: `${pctPoids}%`, height: "100%", borderRadius: "3px",
                  background: couleurPoids, transition: "width 0.5s ease"
                }} />
              </div>
            </div>

            {/* Programme */}
            {machine.cycleActuel.programme && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 12px", background: theme.light, borderRadius: "16px", fontSize: "11px", fontWeight: 700, color: theme.textDark, marginBottom: "14px" }}>
                <FaSoap size={10} /> {machine.cycleActuel.programme}
              </div>
            )}
          </>
        )}

        {/* DISPONIBLE */}
        {disponible && (
          <div style={{ textAlign: "center", padding: "10px 0 14px" }}>
            <div style={{ fontSize: "32px", marginBottom: "8px" }}>✅</div>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "#10b981" }}>Prête à l'emploi</div>
          </div>
        )}

        {/* EN PANNE / MAINTENANCE */}
        {!enCours && !disponible && (
          <div style={{ textAlign: "center", padding: "10px 0 14px" }}>
            <FaExclamationTriangle size={28} color={etatCfg.dot} style={{ marginBottom: "8px" }} />
            <div style={{ fontSize: "13px", fontWeight: 600, color: etatCfg.dot }}>{etatCfg.label}</div>
            {machine.observation && (
              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>{machine.observation}</div>
            )}
          </div>
        )}

        {/* Actions */}
        {disponible && (
          <Link to="/Lavages" state={{ machinePreconfigured: machine.code }}
            onClick={e => e.stopPropagation()}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              padding: "10px", borderRadius: "10px",
              background: theme.gradient,
              color: "white", fontWeight: 700, fontSize: "13px",
              textDecoration: "none"
            }}>
            <FaPlay size={11} /> Lancer un lavage
          </Link>
        )}

        {enCours && (
          <div style={{ display: "flex", gap: "8px" }}>
            <Link to="/Lavages" state={{ cycleId: machine.cycleActuel?.id }}
              onClick={e => e.stopPropagation()}
              style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                padding: "9px", borderRadius: "10px",
                background: theme.light, color: theme.textDark,
                fontWeight: 700, fontSize: "12px", textDecoration: "none"
              }}>
              Gérer →
            </Link>
            <button onClick={e => {
                e.stopPropagation();
                if (machine.cycleActuel?.id) onTerminer(machine.cycleActuel.id);
              }}
              style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                padding: "9px", borderRadius: "10px",
                background: "#fee2e2", color: "#dc2626",
                fontWeight: 700, fontSize: "12px", border: "none", cursor: "pointer"
              }}>
              <FaStop size={11} /> Fin
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Modal détail machine ─────────────────────────────────────────────────────
function ModalMachine({ machine, onFermer, onTerminer }) {
  if (!machine) return null;
  const categorie = machine.categorie || "LINGE_NORMAL";
  const theme     = THEME[categorie] || THEME.LINGE_NORMAL;
  const enCours   = machine.etat === "EN_COURS";

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, backdropFilter: "blur(5px)" }}>
      <div style={{ background: "white", borderRadius: "22px", overflow: "hidden", maxWidth: "500px", width: "95%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 28px 80px rgba(0,0,0,0.22)" }}>

        {/* Header coloré */}
        <div style={{ background: theme.gradient, padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {categorie === "LINGES_INFECTE" ? <FaBiohazard size={22} color="white" /> : <FaSoap size={22} color="white" />}
            </div>
            <div>
              <div style={{ color: "white", fontWeight: 800, fontSize: "20px" }}>{machine.code}</div>
              <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "12px" }}>{theme.label} · {machine.capaciteKg} kg</div>
            </div>
          </div>
          <button onClick={onFermer}
            style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "50%", width: "34px", height: "34px", cursor: "pointer", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FaTimes size={14} />
          </button>
        </div>

        <div style={{ padding: "24px" }}>
          {enCours && machine.cycleActuel && (
            <>
              {/* Minuterie */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", background: "#faf5ff", borderRadius: "12px", marginBottom: "16px", border: "1px solid #e9d5ff" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <FaClock size={15} color="#7c3aed" />
                  <span style={{ fontWeight: 600, color: "#7c3aed" }}>Cycle #{machine.cycleActuel.id}</span>
                </div>
                <span style={{ color: "#7c3aed", fontSize: "20px" }}>
                  <Minuterie dateDebut={machine.cycleActuel.dateDebut} />
                </span>
              </div>

              {/* Params */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "10px", marginBottom: "16px" }}>
                {[
                  { label: "Température", val: `${machine.cycleActuel.temperature || "—"}°C`, color: "#ef4444" },
                  { label: "Essorage",    val: `${machine.cycleActuel.vitesse || "—"} rpm`,   color: "#0ea5e9" },
                  { label: "Programme",   val: machine.cycleActuel.programme || "—",           color: "#7c3aed" },
                  { label: "Poids",       val: `${machine.poidsActuel?.toFixed(1)||0} kg`,     color: "#f59e0b" },
                  { label: "Capacité",    val: `${machine.capaciteKg} kg`,                     color: "#64748b" },
                  { label: "Nb Lots",     val: machine.cycleActuel.nbLots || "—",              color: "#10b981" },
                ].map(({ label, val, color }) => (
                  <div key={label} style={{ background: "#f8fafc", borderRadius: "10px", padding: "10px 12px" }}>
                    <div style={{ fontSize: "10px", color: "#94a3b8", marginBottom: "4px" }}>{label}</div>
                    <div style={{ fontSize: "14px", fontWeight: 800, color }}>{val}</div>
                  </div>
                ))}
              </div>

              {/* Barre poids */}
              <div style={{ marginBottom: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
                  <span style={{ color: "#64748b" }}>Charge machine</span>
                  <span style={{ fontWeight: 700, color: theme.primary }}>
                    {machine.poidsActuel?.toFixed(1) || 0} / {machine.capaciteKg} kg
                  </span>
                </div>
                <div style={{ height: "8px", background: "#f1f5f9", borderRadius: "4px", overflow: "hidden" }}>
                  <div style={{
                    width: `${Math.min(((machine.poidsActuel||0)/machine.capaciteKg)*100,100)}%`,
                    height: "100%", borderRadius: "4px", background: theme.gradient, transition: "width 0.5s"
                  }} />
                </div>
              </div>

              {/* Lots */}
              {machine.cycleActuel.lots?.length > 0 && (
                <div style={{ marginBottom: "16px" }}>
                  <div style={{ fontWeight: 600, fontSize: "12px", color: "#64748b", marginBottom: "8px" }}>
                    Lots en cours de lavage :
                  </div>
                  {machine.cycleActuel.lots.map((lot, i) => (
                    <div key={i} style={{ display: "flex", gap: "12px", padding: "8px 12px", background: "#f8fafc", borderRadius: "8px", marginBottom: "4px", fontSize: "12px", alignItems: "center" }}>
                      <FaLayerGroup size={11} color={theme.primary} />
                      <span style={{ fontWeight: 600, flex: 1 }}>{lot.codeLot}</span>
                      <span style={{ color: "#64748b" }}>{lot.categorie}</span>
                      <span style={{ fontWeight: 600, color: theme.primary }}>{lot.poidsActuel?.toFixed(1)} kg</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Bouton terminer */}
              <button onClick={() => { onTerminer(machine.cycleActuel.id); onFermer(); }}
                style={{ width: "100%", padding: "13px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg,#ef4444,#b91c1c)", color: "white", fontWeight: 800, fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                <FaStop size={13} /> Terminer ce lavage
              </button>
            </>
          )}

          {machine.etat === "DISPONIBLE" && (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: "48px", marginBottom: "12px" }}>✅</div>
              <div style={{ fontWeight: 700, fontSize: "16px", color: "#10b981", marginBottom: "16px" }}>
                Machine disponible
              </div>
              <Link to="/Lavages" state={{ machinePreconfigured: machine.code }}
                style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "12px 28px", borderRadius: "12px", background: theme.gradient, color: "white", fontWeight: 700, fontSize: "14px", textDecoration: "none" }}>
                <FaPlay size={12} /> Lancer un lavage
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function MachinesDashboard() {
  const [machines,        setMachines]        = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [lastRefresh,     setLastRefresh]     = useState(null);
  const [machineSelectee, setMachineSelectee] = useState(null);
  const [filtre,          setFiltre]          = useState("TOUS"); // TOUS | LINGE_NORMAL | LINGES_INFECTE
  const intervalRef = useRef(null);

  const chargerMachines = useCallback(async () => {
    try {
      const r = await fetch(`${API}/machines`);
      if (r.ok) { setMachines(await r.json()); setLastRefresh(new Date()); }
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => {
    chargerMachines();
    intervalRef.current = setInterval(chargerMachines, REFRESH_MS);
    return () => clearInterval(intervalRef.current);
  }, [chargerMachines]);

  const handleTerminer = useCallback(async (cycleId) => {
    try {
      await fetch(`${API}/lavage/${cycleId}/finish`, { method: "PUT" });
      chargerMachines();
    } catch {}
  }, [chargerMachines]);

  // ── Groupement par catégorie ───────────────────────────────────────────────
  const machinesNormal  = machines.filter(m => (m.categorie || "LINGE_NORMAL") === "LINGE_NORMAL");
  const machinesInfecte = machines.filter(m => m.categorie === "LINGES_INFECTE");

  const machinesFiltrees = filtre === "TOUS"
    ? machines
    : filtre === "LINGE_NORMAL" ? machinesNormal : machinesInfecte;

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = {
    totalNormal:    machinesNormal.length,
    totalInfecte:   machinesInfecte.length,
    enCoursNormal:  machinesNormal.filter(m => m.etat === "EN_COURS").length,
    enCoursInfecte: machinesInfecte.filter(m => m.etat === "EN_COURS").length,
    disponibles:    machines.filter(m => m.etat === "DISPONIBLE").length,
    poidsTotal:     machines.reduce((s, m) => s + (m.poidsActuel || 0), 0),
  };

  return (
    <div className="collecte-container">

      {machineSelectee && (
        <ModalMachine
          machine={machineSelectee}
          onFermer={() => setMachineSelectee(null)}
          onTerminer={handleTerminer}
        />
      )}

      {/* Header compact */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "22px", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ width: "46px", height: "46px", borderRadius: "13px", background: "linear-gradient(135deg,#0ea5e9,#0284c7)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(14,165,233,0.25)" }}>
            <FaSoap size={22} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: "20px", color: "#0f172a", letterSpacing: "-0.3px" }}>
              Suivi des Machines
            </div>
            <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "1px", display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10b981", display: "inline-block", animation: "pulseDot 2s infinite" }} />
              Temps réel · {REFRESH_MS/1000}s
              {lastRefresh && (
                <span>· {lastRefresh.toLocaleTimeString("fr-FR", { hour:"2-digit", minute:"2-digit", second:"2-digit" })}</span>
              )}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={chargerMachines}
            style={{ padding: "8px 14px", borderRadius: "9px", border: "1px solid #e2e8f0", background: "white", color: "#64748b", cursor: "pointer", fontSize: "12px", fontWeight: 500 }}>
            ↻
          </button>
          <Link to="/Lavages"
            style={{ padding: "8px 16px", borderRadius: "9px", background: "linear-gradient(135deg,#0ea5e9,#0284c7)", color: "white", fontWeight: 700, fontSize: "12px", textDecoration: "none", display: "flex", alignItems: "center", gap: "6px" }}>
            <FaPlay size={10} /> Nouveau lavage
          </Link>
        </div>
      </div>

      {/* Bandeau résumé */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "24px" }}>

        {/* Linge Normal */}
        <div style={{ borderRadius: "16px", overflow: "hidden", border: "1.5px solid #bae6fd", boxShadow: "0 4px 16px rgba(14,165,233,0.08)" }}>
          <div style={{ background: THEME.LINGE_NORMAL.gradient, padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "22px" }}>⬜</span>
              <span style={{ color: "white", fontWeight: 800, fontSize: "15px" }}>Linge Normal</span>
            </div>
            <span style={{ color: "rgba(255,255,255,0.85)", fontSize: "12px" }}>{stats.totalNormal} machine(s)</span>
          </div>
          <div style={{ background: "white", padding: "14px 20px", display: "flex", gap: "24px" }}>
            <div>
              <div style={{ fontSize: "11px", color: "#94a3b8" }}>En cours</div>
              <div style={{ fontWeight: 800, fontSize: "22px", color: "#0ea5e9" }}>{stats.enCoursNormal}</div>
            </div>
            <div>
              <div style={{ fontSize: "11px", color: "#94a3b8" }}>Disponibles</div>
              <div style={{ fontWeight: 800, fontSize: "22px", color: "#10b981" }}>
                {machinesNormal.filter(m => m.etat === "DISPONIBLE").length}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "11px", color: "#94a3b8" }}>Poids total</div>
              <div style={{ fontWeight: 800, fontSize: "22px", color: "#f59e0b" }}>
                {machinesNormal.reduce((s, m) => s + (m.poidsActuel || 0), 0).toFixed(1)} kg
              </div>
            </div>
          </div>
        </div>

        {/* Linge Infecté */}
        <div style={{ borderRadius: "16px", overflow: "hidden", border: "1.5px solid #fca5a5", boxShadow: "0 4px 16px rgba(220,38,38,0.08)" }}>
          <div style={{ background: THEME.LINGES_INFECTE.gradient, padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "22px" }}>🔴</span>
              <span style={{ color: "white", fontWeight: 800, fontSize: "15px" }}>Linge Infecté</span>
            </div>
            <span style={{ color: "rgba(255,255,255,0.85)", fontSize: "12px" }}>{stats.totalInfecte} machine(s)</span>
          </div>
          <div style={{ background: "white", padding: "14px 20px", display: "flex", gap: "24px" }}>
            <div>
              <div style={{ fontSize: "11px", color: "#94a3b8" }}>En cours</div>
              <div style={{ fontWeight: 800, fontSize: "22px", color: "#dc2626" }}>{stats.enCoursInfecte}</div>
            </div>
            <div>
              <div style={{ fontSize: "11px", color: "#94a3b8" }}>Disponibles</div>
              <div style={{ fontWeight: 800, fontSize: "22px", color: "#10b981" }}>
                {machinesInfecte.filter(m => m.etat === "DISPONIBLE").length}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "11px", color: "#94a3b8" }}>Poids total</div>
              <div style={{ fontWeight: 800, fontSize: "22px", color: "#f59e0b" }}>
                {machinesInfecte.reduce((s, m) => s + (m.poidsActuel || 0), 0).toFixed(1)} kg
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px", background: "#f1f5f9", padding: "5px", borderRadius: "12px", width: "fit-content" }}>
        {[
          { id: "TOUS",           label: "Toutes",         count: machines.length },
          { id: "LINGE_NORMAL",   label: "⬜ Normal",      count: machinesNormal.length },
          { id: "LINGES_INFECTE", label: "🔴 Infecté",     count: machinesInfecte.length },
        ].map(({ id, label, count }) => (
          <button key={id} onClick={() => setFiltre(id)}
            style={{
              padding: "7px 16px", borderRadius: "9px", border: "none", cursor: "pointer",
              fontSize: "12px", fontWeight: filtre === id ? 700 : 500, transition: "all 0.2s",
              background: filtre === id ? "white" : "transparent",
              color: filtre === id
                ? (id === "LINGES_INFECTE" ? "#dc2626" : id === "LINGE_NORMAL" ? "#0ea5e9" : "#0f172a")
                : "#64748b",
              boxShadow: filtre === id ? "0 2px 6px rgba(0,0,0,0.07)" : "none",
              display: "flex", alignItems: "center", gap: "6px"
            }}>
            {label}
            <span style={{
              padding: "1px 7px", borderRadius: "8px", fontSize: "10px", fontWeight: 700,
              background: filtre === id ? (id === "LINGES_INFECTE" ? "#fee2e2" : id === "LINGE_NORMAL" ? "#e0f2fe" : "#e2e8f0") : "#e2e8f0",
              color: filtre === id ? (id === "LINGES_INFECTE" ? "#dc2626" : id === "LINGE_NORMAL" ? "#0ea5e9" : "#64748b") : "#64748b"
            }}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Grille par catégorie */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px", color: "#94a3b8" }}>
          <FaSoap size={40} style={{ opacity: 0.2, marginBottom: "12px" }} />
          <div style={{ fontSize: "14px" }}>Chargement des machines...</div>
        </div>
      ) : filtre === "TOUS" ? (
        // Vue groupée par catégorie
        <>
          {/* Section Normal */}
          {machinesNormal.length > 0 && (
            <div style={{ marginBottom: "28px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                <div style={{ height: "3px", width: "32px", background: THEME.LINGE_NORMAL.gradient, borderRadius: "2px" }} />
                <span style={{ fontWeight: 700, fontSize: "14px", color: THEME.LINGE_NORMAL.textDark }}>
                  ⬜ Machines Linge Normal
                </span>
                <div style={{ height: "1px", flex: 1, background: "#f1f5f9" }} />
                <span style={{ fontSize: "12px", color: "#94a3b8" }}>{machinesNormal.length} machine(s)</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(270px,1fr))", gap: "16px" }}>
                {machinesNormal.map(m => (
                  <CarteMachine key={m.id || m.code} machine={m} onClick={setMachineSelectee} onTerminer={handleTerminer} />
                ))}
              </div>
            </div>
          )}

          {/* Séparateur */}
          {machinesNormal.length > 0 && machinesInfecte.length > 0 && (
            <div style={{ borderTop: "2px dashed #fee2e2", marginBottom: "28px" }} />
          )}

          {/* Section Infecté */}
          {machinesInfecte.length > 0 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                <div style={{ height: "3px", width: "32px", background: THEME.LINGES_INFECTE.gradient, borderRadius: "2px" }} />
                <span style={{ fontWeight: 700, fontSize: "14px", color: THEME.LINGES_INFECTE.textDark }}>
                  🔴 Machines Linge Infecté
                </span>
                <div style={{ height: "1px", flex: 1, background: "#fef2f2" }} />
                <span style={{ fontSize: "12px", color: "#94a3b8" }}>{machinesInfecte.length} machine(s)</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(270px,1fr))", gap: "16px" }}>
                {machinesInfecte.map(m => (
                  <CarteMachine key={m.id || m.code} machine={m} onClick={setMachineSelectee} onTerminer={handleTerminer} />
                ))}
              </div>
            </div>
          )}

          {machines.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px", background: "white", borderRadius: "16px", border: "2px dashed #e2e8f0", color: "#94a3b8" }}>
              <FaSoap size={40} style={{ opacity: 0.2, marginBottom: "12px" }} />
              <div>Aucune machine configurée</div>
            </div>
          )}
        </>
      ) : (
        // Vue filtrée
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(270px,1fr))", gap: "16px" }}>
          {machinesFiltrees.map(m => (
            <CarteMachine key={m.id || m.code} machine={m} onClick={setMachineSelectee} onTerminer={handleTerminer} />
          ))}
        </div>
      )}

      {/* Légende état */}
      <div style={{ display: "flex", gap: "16px", marginTop: "28px", padding: "12px 18px", background: "white", borderRadius: "12px", border: "1px solid #f1f5f9", flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}>États :</span>
        {Object.entries(ETAT_CFG).map(([key, val]) => (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "#64748b" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: val.dot }} />
            {val.label}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes pulseDot {
          0%   { box-shadow: 0 0 0 0 rgba(124,58,237,0.6); }
          70%  { box-shadow: 0 0 0 8px rgba(124,58,237,0); }
          100% { box-shadow: 0 0 0 0 rgba(124,58,237,0); }
        }
      `}</style>
    </div>
  );
}
