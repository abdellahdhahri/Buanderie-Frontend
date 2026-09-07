import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router";
import {
  FaSoap, FaPlay, FaStop, FaClock, FaWeight,
  FaLayerGroup, FaCheckCircle, FaExclamationTriangle,
  FaBiohazard, FaThermometerHalf, FaTachometerAlt, FaTimes,
  FaWater, FaFan, FaSpinner, FaArrowRight, FaCircle,
  FaWrench, FaPowerOff, FaHistory, FaCheckDouble,
 FaMicrochip , FaBolt, FaShieldAlt ,
  FaServer, FaWaveSquare,
} from "react-icons/fa";
import { FaCircleDot,FaGaugeHigh  } from "react-icons/fa6";
import { motion, AnimatePresence } from "framer-motion";
import { useMachineContext } from "../../contextes/MachineContext";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import "../Linge/WorkflowList.css";

const REFRESH_MS = 5000;

const THEME = {
  LINGE_NORMAL: {
    label: "Linge Normal",
    emoji: "⬜",
    primary: "#0ea5e9",
    light: "#e0f2fe",
    gradient: "linear-gradient(145deg, #0ea5e9, #0284c7)",
    border: "#bae6fd",
    textDark: "#0369a1",
    glow: "rgba(14,165,233,0.15)",
    iconBg: "#dbeafe",
    ringColor: "#0ea5e9",
    statusColor: "#0ea5e9"
  },
  LINGES_INFECTE: {
    label: "Linge Infecté",
    emoji: "🔴",
    primary: "#dc2626",
    light: "#fee2e2",
    gradient: "linear-gradient(145deg, #dc2626, #b91c1c)",
    border: "#fca5a5",
    textDark: "#991b1b",
    glow: "rgba(220,38,38,0.15)",
    iconBg: "#fee2e2",
    ringColor: "#dc2626",
    statusColor: "#dc2626"
  },
};

const ETAT_CFG = {
  DISPONIBLE: { label: "Disponible", color: "#10b981", icon: "🟢" },
  EN_COURS: { label: "En cours", color: "#7c3aed", icon: "🟣" },
  EN_PAUSE: { label: "En pause", color: "#f59e0b", icon: "🟡" },
  EN_PANNE: { label: "En panne", color: "#ef4444", icon: "🔴" },
  MAINTENANCE: { label: "Maintenance", color: "#64748b", icon: "⚪" },
};

function CircularProgress({ value, max, size = 80, strokeWidth = 6, color, label, subLabel }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min((value / max) * 100, 100);
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.8s ease" }}
          />
        </svg>
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          textAlign: "center"
        }}>
          <div style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>
            {Math.round(percentage)}%
          </div>
          <div style={{ fontSize: "9px", color: "#94a3b8", fontWeight: 500 }}>
            {label}
          </div>
        </div>
      </div>
      {subLabel && (
        <div style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 500 }}>{subLabel}</div>
      )}
    </div>
  );
}

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
    <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "16px", color: "#7c3aed" }}>
      {h > 0 && `${p(h)}:`}{p(m)}:{p(s)}
    </span>
  );
}

function CarteMachine({ machine, cycles, onClick, onTerminer }) {
  const categorie = machine.categorie || "LINGE_NORMAL";
  const theme = THEME[categorie] || THEME.LINGE_NORMAL;
  const etatCfg = ETAT_CFG[machine.etatImmobilisation] || ETAT_CFG.DISPONIBLE;
  const enCours = machine.etatImmobilisation === "EN_COURS";
  const disponible = machine.etatImmobilisation === "DISPONIBLE";
  
  const cycleActif = cycles?.find(c => 
    c.machine?.id === machine.id && c.statut === "EN_COURS"
  );
  
  const cyclesRecents = cycles?.filter(c => 
    c.machine?.id === machine.id && c.statut === "TERMINE"
  ).slice(0, 3) || [];

  const pctPoids = machine.capaciteKg
    ? Math.min(((machine.poidsActuel || 0) / machine.capaciteKg) * 100, 100)
    : 0;

  const dureeMax = cycleActif?.programmeLavage?.dureeMinutes * 60 || 1800;
  const dureeEcoulee = cycleActif?.dureeEcoulee || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6, scale: 1.01, transition: { duration: 0.2 } }}
      onClick={() => onClick(machine)}
      style={{
        borderRadius: "24px",
        overflow: "hidden",
        cursor: "pointer",
        background: `linear-gradient(145deg, #ffffff, ${enCours ? '#faf5ff' : '#fafafa'})`,
        border: `1.5px solid ${enCours ? theme.border : "#e2e8f0"}`,
        boxShadow: enCours
          ? `0 12px 48px ${theme.glow}, 0 4px 12px rgba(0,0,0,0.06)`
          : "0 2px 8px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.02)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        position: "relative"
      }}
    >
      {/* Effet de bordure lumineuse en cours */}
      {enCours && (
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: "24px",
          background: `linear-gradient(135deg, ${theme.primary}22, transparent 60%)`,
          pointerEvents: "none",
          zIndex: 0
        }} />
      )}

      {/* Badge état - version épurée sans ✅ */}
      <div style={{
        position: "absolute",
        top: "14px",
        right: "14px",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        background: "white",
        padding: "4px 14px 4px 10px",
        borderRadius: "20px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        zIndex: 2,
        fontSize: "11px",
        fontWeight: 600,
        color: etatCfg.color,
        border: `1px solid ${etatCfg.color}22`
      }}>
        <div style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          background: etatCfg.color,
          animation: enCours ? "pulseDot 1.5s infinite" : "none",
          boxShadow: enCours ? `0 0 12px ${etatCfg.color}66` : "none"
        }} />
        {etatCfg.label}
      </div>

      {/* En-tête */}
      <div style={{
        padding: "18px 20px 14px",
        display: "flex",
        alignItems: "center",
        gap: "14px",
        borderBottom: `1px solid ${enCours ? theme.border : "#f1f5f9"}`,
        position: "relative",
        zIndex: 1
      }}>
        <div style={{
          width: "52px",
          height: "52px",
          borderRadius: "16px",
          background: enCours ? `linear-gradient(145deg, ${theme.iconBg}, ${theme.primary}22)` : theme.iconBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "22px",
          transition: "all 0.3s",
          boxShadow: enCours ? `0 4px 16px ${theme.glow}` : "none"
        }}>
          {categorie === "LINGES_INFECTE" ? "🔴" : "🧺"}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{
            fontWeight: 700,
            fontSize: "20px",
            color: "#0f172a",
            letterSpacing: "-0.4px",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            {machine.code}
            {enCours && (
              <span style={{
                fontSize: "10px",
                fontWeight: 600,
                color: theme.primary,
                background: `${theme.primary}15`,
                padding: "2px 12px",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                gap: "4px"
              }}>
                <FaTachometerAlt  size={10} /> ACTIF
              </span>
            )}
          </div>
          <div style={{
            fontSize: "12px",
            color: "#94a3b8",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexWrap: "wrap"
          }}>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              {theme.emoji} {theme.label}
            </span>
            <span style={{ width: "3px", height: "3px", borderRadius: "50%", background: "#d1d5db" }} />
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <FaWeight size={11} /> {machine.capaciteKg} kg
            </span>
            {cycleActif && (
              <>
                <span style={{ width: "3px", height: "3px", borderRadius: "50%", background: "#d1d5db" }} />
                <span style={{ display: "flex", alignItems: "center", gap: "4px", color: theme.primary }}>
                  <FaClock size={11} /> Cycle #{cycleActif.id}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Corps */}
      <div style={{ padding: "16px 20px 20px", position: "relative", zIndex: 1 }}>
        {/* Jauge de poids */}
        <div style={{ marginBottom: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
            <span style={{ color: "#64748b", display: "flex", alignItems: "center", gap: "4px" }}>
              <FaGaugeHigh size={12} /> Charge
            </span>
            <span style={{ fontWeight: 600, color: pctPoids >= 90 ? "#ef4444" : "#0f172a" }}>
              {machine.poidsActuel?.toFixed(1) || 0} / {machine.capaciteKg} kg
            </span>
          </div>
          <div style={{
            height: "8px",
            background: "#f1f5f9",
            borderRadius: "6px",
            overflow: "hidden",
            boxShadow: "inset 0 1px 3px rgba(0,0,0,0.05)"
          }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(pctPoids, 100)}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              style={{
                height: "100%",
                borderRadius: "6px",
                background: `linear-gradient(90deg, ${theme.primary}, ${pctPoids >= 90 ? "#ef4444" : theme.primary})`,
                boxShadow: `0 0 20px ${theme.primary}33`
              }}
            />
          </div>
        </div>

        {/* Cycle actif - Progress Circle */}
        {cycleActif && (
          <div style={{
            background: `linear-gradient(145deg, ${theme.light}, white)`,
            borderRadius: "16px",
            padding: "14px 16px",
            border: `1px solid ${theme.border}`,
            marginBottom: "14px"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <CircularProgress
                value={dureeEcoulee}
                max={dureeMax}
                size={60}
                strokeWidth={5}
                color={theme.ringColor}
                label="Progression"
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: "14px", color: "#0f172a", marginBottom: "4px" }}>
                  {cycleActif.programmeLavage?.nom || "Lavage"}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#64748b" }}>
                    <FaClock size={11} color="#7c3aed" />
                    <Minuterie dateDebut={cycleActif.dateDebut} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#64748b" }}>
                    <FaThermometerHalf size={11} color="#ef4444" />
                    <span>{cycleActif.programmeLavage?.temperatureCelsius || 0}°C</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#64748b" }}>
                    <FaLayerGroup size={11} color="#8b5cf6" />
                    <span>{cycleActif.items?.length || 0} lots</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cycles récemment terminés */}
        {cyclesRecents.length > 0 && !enCours && (
          <div style={{ marginBottom: "12px" }}>
            <div style={{
              fontSize: "10px",
              color: "#94a3b8",
              textTransform: "uppercase",
              letterSpacing: "0.8px",
              marginBottom: "6px",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}>
              <FaHistory size={10} /> Derniers cycles
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {cyclesRecents.map((cycle, i) => (
                <div key={i} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "3px 12px",
                  borderRadius: "12px",
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  fontSize: "10px",
                  fontWeight: 600,
                  color: "#15803d"
                }}>
                  <FaCheckDouble size={8} />
                  {cycle.programmeLavage?.nom || "Cycle"}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DISPONIBLE - version épurée */}
        {disponible && !cycleActif && (
          <div style={{
            textAlign: "center",
            padding: "12px 0",
            background: "linear-gradient(145deg, #f0fdf4, #dcfce7)",
            borderRadius: "12px",
            border: "1px solid #bbf7d0"
          }}>
            <div style={{
              fontSize: "14px",
              fontWeight: 600,
              color: "#10b981",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px"
            }}>
              <span style={{
                display: "inline-block",
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#10b981",
                boxShadow: "0 0 12px rgba(16,185,129,0.4)"
              }} />
              Prête à l'emploi
            </div>
            <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
              Capacité disponible {machine.capaciteKg - (machine.poidsActuel || 0)} kg
            </div>
          </div>
        )}

        {/* AUTRES ÉTATS */}
        {!enCours && !disponible && (
          <div style={{
            textAlign: "center",
            padding: "12px 0",
            background: `${etatCfg.color}11`,
            borderRadius: "12px",
            border: `1px solid ${etatCfg.color}33`
          }}>
            <div style={{
              fontSize: "14px",
              fontWeight: 600,
              color: etatCfg.color,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px"
            }}>
              <span style={{
                display: "inline-block",
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: etatCfg.color
              }} />
              {etatCfg.label}
            </div>
          </div>
        )}

        {/* Boutons d'action */}
        <div style={{ marginTop: "12px", display: "flex", gap: "8px" }}>
          {disponible && (
            <Link
              to="/Lavages"
              state={{ machinePreconfigured: machine.code }}
              onClick={e => e.stopPropagation()}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "10px 16px",
                borderRadius: "12px",
                background: `linear-gradient(145deg, ${theme.primary}, ${theme.primary}dd)`,
                color: "white",
                fontWeight: 700,
                fontSize: "13px",
                textDecoration: "none",
                transition: "all 0.3s",
                boxShadow: `0 4px 16px ${theme.glow}`,
                position: "relative",
                overflow: "hidden"
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = `0 8px 24px ${theme.glow}`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = `0 4px 16px ${theme.glow}`;
              }}
            >
              <FaPlay size={12} /> Démarrer
            </Link>
          )}

          {enCours && cycleActif && (
            <>
              <Link
                to="/Lavages"
                state={{ cycleId: cycleActif.id }}
                onClick={e => e.stopPropagation()}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  padding: "10px 16px",
                  borderRadius: "12px",
                  background: "white",
                  color: theme.textDark,
                  fontWeight: 600,
                  fontSize: "13px",
                  textDecoration: "none",
                  border: `1px solid ${theme.border}`,
                  transition: "all 0.3s"
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = theme.light;
                  e.currentTarget.style.borderColor = theme.primary;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = "white";
                  e.currentTarget.style.borderColor = theme.border;
                }}
              >
                <FaArrowRight size={11} /> Gérer
              </Link>
              
              <button
                onClick={e => {
                  e.stopPropagation();
                  if (cycleActif?.id) onTerminer(cycleActif.id);
                }}
                style={{
                  padding: "10px 18px",
                  borderRadius: "12px",
                  border: "none",
                  background: "linear-gradient(145deg, #ef4444, #dc2626)",
                  color: "white",
                  fontWeight: 700,
                  fontSize: "13px",
                  cursor: "pointer",
                  transition: "all 0.3s",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 4px 16px rgba(239,68,68,0.3)",
                  minWidth: "70px",
                  justifyContent: "center"
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = "scale(1.05)";
                  e.currentTarget.style.boxShadow = "0 8px 24px rgba(239,68,68,0.4)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "0 4px 16px rgba(239,68,68,0.3)";
                }}
              >
                <FaStop size={12} /> Fin
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function ModalMachine({ machine, cycles, onFermer, onTerminer }) {
  if (!machine) return null;
  const categorie = machine.categorie || "LINGE_NORMAL";
  const theme = THEME[categorie] || THEME.LINGE_NORMAL;
  const enCours = machine.etatImmobilisation === "EN_COURS";
  const cycleActif = cycles?.find(c => c.machine?.id === machine.id && c.statut === "EN_COURS");
  const cyclesTermines = cycles?.filter(c => c.machine?.id === machine.id && c.statut === "TERMINE") || [];

  const dureeMax = cycleActif?.programmeLavage?.dureeMinutes * 60 || 1800;
  const dureeEcoulee = cycleActif?.dureeEcoulee || 0;

  return (
    <AnimatePresence>
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(15, 23, 42, 0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        backdropFilter: "blur(12px)",
        padding: "20px"
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 30 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          style={{
            background: "white",
            borderRadius: "28px",
            overflow: "hidden",
            maxWidth: "560px",
            width: "100%",
            maxHeight: "90vh",
            overflowY: "auto",
            boxShadow: "0 32px 80px rgba(0,0,0,0.35)"
          }}
        >
          {/* Header */}
          <div style={{
            background: theme.gradient,
            padding: "24px 28px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div style={{
                width: "52px",
                height: "52px",
                borderRadius: "16px",
                background: "rgba(255,255,255,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
                backdropFilter: "blur(4px)"
              }}>
                {categorie === "LINGES_INFECTE" ? "🔴" : "🧺"}
              </div>
              <div>
                <div style={{ color: "white", fontWeight: 800, fontSize: "22px", letterSpacing: "-0.3px" }}>
                  {machine.code}
                </div>
                <div style={{ color: "rgba(255,255,255,0.85)", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span>{theme.label}</span>
                  <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "rgba(255,255,255,0.4)" }} />
                  <span>{machine.capaciteKg} kg</span>
                  {enCours && (
                    <>
                      <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "rgba(255,255,255,0.4)" }} />
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <FaTachometerAlt  size={12} /> En cours
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onFermer}
              style={{
                background: "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "50%",
                width: "36px",
                height: "36px",
                cursor: "pointer",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s"
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.25)" }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.15)" }}
            >
              <FaTimes size={16} />
            </button>
          </div>

          {/* Contenu */}
          <div style={{ padding: "24px 28px" }}>
            {/* Cycle actif */}
            {enCours && cycleActif && (
              <div style={{ marginBottom: "24px" }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "20px",
                  padding: "20px",
                  background: "linear-gradient(145deg, #faf5ff, #f3e8ff)",
                  borderRadius: "16px",
                  border: "1px solid #e9d5ff"
                }}>
                  <CircularProgress
                    value={dureeEcoulee}
                    max={dureeMax}
                    size={80}
                    strokeWidth={7}
                    color={theme.ringColor}
                    label="Progression"
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: "17px", color: "#0f172a", marginBottom: "6px" }}>
                      {cycleActif.programmeLavage?.nom || "Lavage en cours"}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px", color: "#7c3aed" }}>
                        <FaClock size={14} />
                        <Minuterie dateDebut={cycleActif.dateDebut} />
                      </div>
                      <div style={{ display: "flex", gap: "12px", fontSize: "13px", color: "#64748b" }}>
                        <span>🌡️ {cycleActif.programmeLavage?.temperatureCelsius || 0}°C</span>
                        <span>⏱️ {cycleActif.programmeLavage?.dureeMinutes || 0} min</span>
                        <span>📦 {cycleActif.items?.length || 0} lots</span>
                      </div>
                    </div>
                    <button
                      onClick={() => { onTerminer(cycleActif.id); onFermer(); }}
                      style={{
                        marginTop: "12px",
                        padding: "10px 24px",
                        borderRadius: "12px",
                        border: "none",
                        background: "linear-gradient(145deg, #ef4444, #dc2626)",
                        color: "white",
                        fontWeight: 700,
                        fontSize: "14px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        transition: "all 0.3s",
                        boxShadow: "0 4px 16px rgba(239,68,68,0.3)",
                        width: "100%",
                        justifyContent: "center"
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.transform = "scale(1.02)";
                        e.currentTarget.style.boxShadow = "0 8px 24px rgba(239,68,68,0.4)";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = "scale(1)";
                        e.currentTarget.style.boxShadow = "0 4px 16px rgba(239,68,68,0.3)";
                      }}
                    >
                      <FaStop size={14} /> Terminer le cycle
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Cycles terminés */}
            {cyclesTermines.length > 0 && (
              <div>
                <div style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#64748b",
                  marginBottom: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px"
                }}>
                  <FaHistory size={14} /> Historique ({cyclesTermines.length})
                </div>
                <div style={{ maxHeight: "200px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px" }}>
                  {cyclesTermines.slice(0, 10).map((cycle, i) => (
                    <div key={i} style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px 14px",
                      background: "#f8fafc",
                      borderRadius: "10px",
                      border: "1px solid #e2e8f0",
                      fontSize: "13px",
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "white"; e.currentTarget.style.borderColor = "#cbd5e1" }}
                    onMouseLeave={e => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.borderColor = "#e2e8f0" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <FaCheckCircle color="#22c55e" size={14} />
                        <span style={{ fontWeight: 500 }}>{cycle.programmeLavage?.nom || "Cycle"}</span>
                      </div>
                      <div style={{ color: "#94a3b8", fontSize: "12px" }}>
                        {cycle.dateFin ? new Date(cycle.dateFin).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : ""}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Machine disponible */}
            {machine.etatImmobilisation === "DISPONIBLE" && (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{
                  width: "72px",
                  height: "72px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #d1fae5, #a7f3d0)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 12px",
                  fontSize: "32px"
                }}>
                  <FaCircleDot size={28} color="#10b981" />
                </div>
                <div style={{ fontWeight: 700, fontSize: "20px", color: "#10b981", marginBottom: "4px" }}>
                  Machine disponible
                </div>
                <div style={{ fontSize: "14px", color: "#64748b", marginBottom: "16px" }}>
                  Capacité: {machine.capaciteKg - (machine.poidsActuel || 0)} kg disponible
                </div>
                <Link
                  to="/Lavages"
                  state={{ machinePreconfigured: machine.code }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "14px 36px",
                    borderRadius: "14px",
                    background: theme.gradient,
                    color: "white",
                    fontWeight: 700,
                    fontSize: "15px",
                    textDecoration: "none",
                    boxShadow: `0 4px 20px ${theme.glow}`,
                    transition: "all 0.3s"
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = `0 8px 32px ${theme.glow}`;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = `0 4px 20px ${theme.glow}`;
                  }}
                >
                  <FaPlay size={14} /> Lancer un lavage
                </Link>
              </div>
            )}

            {/* États spéciaux */}
            {!enCours && machine.etatImmobilisation !== "DISPONIBLE" && (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{
                  width: "72px",
                  height: "72px",
                  borderRadius: "50%",
                  background: `${machine.etatImmobilisation === "EN_PANNE" ? '#fee2e2' : '#f1f5f9'}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 12px",
                  fontSize: "32px"
                }}>
                  <FaWrench size={28} color={machine.etatImmobilisation === "EN_PANNE" ? "#dc2626" : "#64748b"} />
                </div>
                <div style={{ fontWeight: 700, fontSize: "20px", color: machine.etatImmobilisation === "EN_PANNE" ? "#dc2626" : "#64748b" }}>
                  {ETAT_CFG[machine.etatImmobilisation]?.label || machine.etatImmobilisation}
                </div>
                {machine.observation && (
                  <div style={{ fontSize: "14px", color: "#94a3b8", marginTop: "4px" }}>{machine.observation}</div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default function MachinesDashboard() {
  const {
    machines,
    cycles,
    isLoading,
    lastRefresh,
    loadAllData,
    terminerCycle
  } = useMachineContext();

  const [machineSelectee, setMachineSelectee] = useState(null);
  const [filtre, setFiltre] = useState("TOUS");
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef(null);

  const rafraichir = useCallback(async () => {
    setLoading(true);
    try {
      await loadAllData();
    } finally {
      setLoading(false);
    }
  }, [loadAllData]);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      loadAllData();
    }, REFRESH_MS);
    return () => clearInterval(intervalRef.current);
  }, [loadAllData]);

  const handleTerminer = useCallback(async (cycleId) => {
    await terminerCycle(cycleId);
  }, [terminerCycle]);

  const machinesNormal = machines.filter(m => {
    const cat = m.categorie || (m.type === "LAVEUR" ? "LINGE_NORMAL" : "LINGE_NORMAL");
    return cat === "LINGE_NORMAL" || cat === "LINGES_NORMAL";
  });

  const machinesInfecte = machines.filter(m => {
    const cat = m.categorie || (m.type === "LAVEUR" ? "LINGE_NORMAL" : "LINGE_NORMAL");
    return cat === "LINGES_INFECTE";
  });

  const machinesFiltrees = filtre === "TOUS"
    ? machines
    : filtre === "LINGE_NORMAL" ? machinesNormal : machinesInfecte;

  const cyclesEnCours = cycles?.filter(c => c.statut === "EN_COURS") || [];
  const cyclesTermines = cycles?.filter(c => c.statut === "TERMINE") || [];

  const stats = {
    totalNormal: machinesNormal.length,
    totalInfecte: machinesInfecte.length,
    enCoursNormal: machinesNormal.filter(m => m.etatImmobilisation === "EN_COURS").length,
    enCoursInfecte: machinesInfecte.filter(m => m.etatImmobilisation === "EN_COURS").length,
    disponibles: machines.filter(m => m.etatImmobilisation === "DISPONIBLE").length,
    poidsTotal: machines.reduce((s, m) => s + (m.poidsActuel || 0), 0),
    cyclesEnCours: cyclesEnCours.length,
    cyclesTermines: cyclesTermines.length,
  };

  return (
    <div className="collecte-container" style={{ padding: "0 4px" }}>

      {machineSelectee && (
        <ModalMachine
          machine={machineSelectee}
          cycles={cycles}
          onFermer={() => setMachineSelectee(null)}
          onTerminer={handleTerminer}
        />
      )}

      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "28px",
        flexWrap: "wrap",
        gap: "12px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{
            width: "56px",
            height: "56px",
            borderRadius: "18px",
            background: "linear-gradient(135deg, #0ea5e9, #0284c7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 20px rgba(14,165,233,0.3)",
            color: "white"
          }}>
            <FaServer size={28} />
          </div>
          <div>
            <h1 style={{
              fontSize: "26px",
              fontWeight: 800,
              color: "#0f172a",
              margin: 0,
              letterSpacing: "-0.5px",
              display: "flex",
              alignItems: "center",
              gap: "10px"
            }}>
              Machines de Lavage
              <span style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "#10b981",
                background: "#dcfce7",
                padding: "2px 12px",
                borderRadius: "12px"
              }}>
                <span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", background: "#10b981", marginRight: "6px" }} />
                {REFRESH_MS / 1000}s
              </span>
            </h1>
            <div style={{
              fontSize: "13px",
              color: "#64748b",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginTop: "2px"
            }}>
              <FaTachometerAlt  size={12} color="#0ea5e9" />
              <span>{stats.cyclesEnCours} cycles en cours · {stats.cyclesTermines} terminés</span>
              {lastRefresh && (
                <span>· {lastRefresh.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
              )}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={rafraichir}
            disabled={loading}
            style={{
              padding: "10px 20px",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              background: "white",
              color: "#64748b",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 500,
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "#f8fafc" }}
            onMouseLeave={e => { e.currentTarget.style.background = "white" }}
          >
            <FaSpinner className={loading ? "animate-spin" : ""} size={14} />
            Actualiser
          </button>
          <Link
            to="/Lavages"
            style={{
              padding: "10px 24px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #0ea5e9, #0284c7)",
              color: "white",
              fontWeight: 700,
              fontSize: "13px",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 4px 16px rgba(14,165,233,0.3)",
              transition: "all 0.3s"
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(14,165,233,0.4)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 16px rgba(14,165,233,0.3)";
            }}
          >
            <FaPlay size={12} /> Nouveau lavage
          </Link>
        </div>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "14px",
        marginBottom: "28px"
      }}>
        <div style={{
          background: "white",
          borderRadius: "16px",
          padding: "16px 20px",
          border: "1px solid #e2e8f0",
          display: "flex",
          alignItems: "center",
          gap: "14px",
          transition: "all 0.2s",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
        }}
        onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.06)"; e.currentTarget.style.transform = "translateY(-2px)" }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)"; e.currentTarget.style.transform = "translateY(0)" }}>
          <div style={{
            width: "44px",
            height: "44px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, #e0f2fe, #bae6fd)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "20px"
          }}>🧺</div>
          <div>
            <div style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a" }}>{machines.length}</div>
            <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>Machines</div>
          </div>
        </div>

        <div style={{
          background: "white",
          borderRadius: "16px",
          padding: "16px 20px",
          border: "1px solid #e2e8f0",
          display: "flex",
          alignItems: "center",
          gap: "14px",
          transition: "all 0.2s"
        }}
        onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.06)"; e.currentTarget.style.transform = "translateY(-2px)" }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)"; e.currentTarget.style.transform = "translateY(0)" }}>
          <div style={{
            width: "44px",
            height: "44px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, #dcfce7, #bbf7d0)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "20px"
          }}>
            <FaCircleDot size={20} color="#10b981" />
          </div>
          <div>
            <div style={{ fontSize: "22px", fontWeight: 800, color: "#10b981" }}>{stats.disponibles}</div>
            <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>Disponibles</div>
          </div>
        </div>

        <div style={{
          background: "white",
          borderRadius: "16px",
          padding: "16px 20px",
          border: "1px solid #e2e8f0",
          display: "flex",
          alignItems: "center",
          gap: "14px",
          transition: "all 0.2s"
        }}
        onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.06)"; e.currentTarget.style.transform = "translateY(-2px)" }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)"; e.currentTarget.style.transform = "translateY(0)" }}>
          <div style={{
            width: "44px",
            height: "44px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, #faf5ff, #e9d5ff)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "20px"
          }}>
            <FaTachometerAlt  ivity size={20} color="#7c3aed" />
          </div>
          <div>
            <div style={{ fontSize: "22px", fontWeight: 800, color: "#7c3aed" }}>{stats.cyclesEnCours}</div>
            <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>Cycles en cours</div>
          </div>
        </div>

        <div style={{
          background: "white",
          borderRadius: "16px",
          padding: "16px 20px",
          border: "1px solid #e2e8f0",
          display: "flex",
          alignItems: "center",
          gap: "14px",
          transition: "all 0.2s"
        }}
        onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.06)"; e.currentTarget.style.transform = "translateY(-2px)" }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)"; e.currentTarget.style.transform = "translateY(0)" }}>
          <div style={{
            width: "44px",
            height: "44px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, #fef3c7, #fde68a)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "20px"
          }}>
            <FaWeight size={20} color="#f59e0b" />
          </div>
          <div>
            <div style={{ fontSize: "22px", fontWeight: 800, color: "#f59e0b" }}>{stats.poidsTotal.toFixed(1)} kg</div>
            <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>Poids total</div>
          </div>
        </div>
      </div>

      <div style={{
        display: "flex",
        gap: "6px",
        marginBottom: "20px",
        background: "#f1f5f9",
        padding: "4px",
        borderRadius: "14px",
        width: "fit-content"
      }}>
        {[
          { id: "TOUS", label: "Toutes", count: machines.length },
          { id: "LINGE_NORMAL", label: "⬜ Normal", count: machinesNormal.length },
          { id: "LINGES_INFECTE", label: "🔴 Infecté", count: machinesInfecte.length },
        ].map(({ id, label, count }) => (
          <button
            key={id}
            onClick={() => setFiltre(id)}
            style={{
              padding: "8px 18px",
              borderRadius: "10px",
              border: "none",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: filtre === id ? 700 : 500,
              transition: "all 0.2s",
              background: filtre === id ? "white" : "transparent",
              color: filtre === id
                ? (id === "LINGES_INFECTE" ? "#dc2626" : id === "LINGE_NORMAL" ? "#0ea5e9" : "#0f172a")
                : "#64748b",
              boxShadow: filtre === id ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            {label}
            <span style={{
              padding: "2px 10px",
              borderRadius: "10px",
              fontSize: "11px",
              fontWeight: 700,
              background: filtre === id ? (id === "LINGES_INFECTE" ? "#fee2e2" : id === "LINGE_NORMAL" ? "#e0f2fe" : "#e2e8f0") : "#e2e8f0",
              color: filtre === id ? (id === "LINGES_INFECTE" ? "#dc2626" : id === "LINGE_NORMAL" ? "#0ea5e9" : "#64748b") : "#64748b"
            }}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div style={{
          textAlign: "center",
          padding: "80px 20px",
          background: "white",
          borderRadius: "20px",
          border: "1px solid #e2e8f0"
        }}>
          <FaSpinner className="animate-spin" size={40} color="#0ea5e9" style={{ opacity: 0.5 }} />
          <div style={{ marginTop: "16px", fontSize: "15px", color: "#94a3b8", fontWeight: 500 }}>
            Chargement des machines...
          </div>
        </div>
      ) : filtre === "TOUS" ? (
        <>
          {machinesNormal.length > 0 && (
            <div style={{ marginBottom: "32px" }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "16px"
              }}>
                <div style={{
                  width: "4px",
                  height: "20px",
                  borderRadius: "2px",
                  background: "linear-gradient(180deg, #0ea5e9, #0284c7)"
                }} />
                <span style={{ fontWeight: 700, fontSize: "16px", color: "#0f172a" }}>
                  Machines Linge Normal
                </span>
                <span style={{
                  fontSize: "12px",
                  color: "#94a3b8",
                  background: "#f1f5f9",
                  padding: "2px 12px",
                  borderRadius: "12px"
                }}>
                  {machinesNormal.length}
                </span>
                <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
                <span style={{ fontSize: "11px", color: "#64748b", display: "flex", alignItems: "center", gap: "4px" }}>
                  <FaCircleDot size={10} color="#10b981" />
                  {machinesNormal.filter(m => m.etatImmobilisation === "DISPONIBLE").length} dispo
                </span>
              </div>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: "18px"
              }}>
                {machinesNormal.map(m => (
                  <CarteMachine 
                    key={m.id || m.code} 
                    machine={m} 
                    cycles={cycles} 
                    onClick={setMachineSelectee} 
                    onTerminer={handleTerminer} 
                  />
                ))}
              </div>
            </div>
          )}

          {machinesNormal.length > 0 && machinesInfecte.length > 0 && (
            <div style={{ borderTop: "2px dashed #f1f5f9", marginBottom: "32px" }} />
          )}

          {machinesInfecte.length > 0 && (
            <div>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "16px"
              }}>
                <div style={{
                  width: "4px",
                  height: "20px",
                  borderRadius: "2px",
                  background: "linear-gradient(180deg, #dc2626, #b91c1c)"
                }} />
                <span style={{ fontWeight: 700, fontSize: "16px", color: "#0f172a" }}>
                  Machines Linge Infecté
                </span>
                <span style={{
                  fontSize: "12px",
                  color: "#94a3b8",
                  background: "#f1f5f9",
                  padding: "2px 12px",
                  borderRadius: "12px"
                }}>
                  {machinesInfecte.length}
                </span>
                <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
                <span style={{ fontSize: "11px", color: "#64748b", display: "flex", alignItems: "center", gap: "4px" }}>
                  <FaCircleDot size={10} color="#10b981" />
                  {machinesInfecte.filter(m => m.etatImmobilisation === "DISPONIBLE").length} dispo
                </span>
              </div>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: "18px"
              }}>
                {machinesInfecte.map(m => (
                  <CarteMachine 
                    key={m.id || m.code} 
                    machine={m} 
                    cycles={cycles} 
                    onClick={setMachineSelectee} 
                    onTerminer={handleTerminer} 
                  />
                ))}
              </div>
            </div>
          )}

          {machines.length === 0 && (
            <div style={{
              textAlign: "center",
              padding: "80px 20px",
              background: "white",
              borderRadius: "20px",
              border: "2px dashed #e2e8f0"
            }}>
              <FaServer size={48} style={{ opacity: 0.2, marginBottom: "16px" }} />
              <div style={{ fontSize: "18px", fontWeight: 600, color: "#64748b" }}>
                Aucune machine configurée
              </div>
              <div style={{ fontSize: "14px", color: "#94a3b8", marginTop: "4px" }}>
                Commencez par ajouter une machine dans les paramètres
              </div>
            </div>
          )}
        </>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "18px"
        }}>
          {machinesFiltrees.map(m => (
            <CarteMachine 
              key={m.id || m.code} 
              machine={m} 
              cycles={cycles} 
              onClick={setMachineSelectee} 
              onTerminer={handleTerminer} 
            />
          ))}
        </div>
      )}

      <div style={{
        display: "flex",
        gap: "18px",
        marginTop: "28px",
        padding: "14px 22px",
        background: "white",
        borderRadius: "14px",
        border: "1px solid #e2e8f0",
        flexWrap: "wrap",
        alignItems: "center"
      }}>
        <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase" }}>
          Légende
        </span>
        {Object.entries(ETAT_CFG).map(([key, val]) => (
          <div key={key} style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "12px",
            color: "#64748b"
          }}>
            <div style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: val.color,
              boxShadow: key === "EN_COURS" ? `0 0 12px ${val.color}66` : "none"
            }} />
            {val.label}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulseDot {
          0% { box-shadow: 0 0 0 0 rgba(124,58,237,0.6); }
          70% { box-shadow: 0 0 0 8px rgba(124,58,237,0); }
          100% { box-shadow: 0 0 0 0 rgba(124,58,237,0); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}