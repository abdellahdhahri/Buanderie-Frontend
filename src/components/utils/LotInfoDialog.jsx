import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FaTimes, FaLayerGroup, FaThermometerHalf,
  FaTachometerAlt, FaSoap, FaCheck, FaEdit, FaBoxes
} from "react-icons/fa";
import { useLavage } from "../../contextes/LavageContext";

export default function LotInfoDialog() {
  const { t } = useTranslation();
  const { lotDialog, setLotDialog, confirmerAjoutLot } = useLavage();
  const [modeManuel, setModeManuel] = useState(false);
  const [prog, setProg] = useState({ nom: "", temperature: "", vitesse: "", duree: "" });

  if (!lotDialog) return null;
  const { lotInfo, linges, lot } = lotDialog;

  const handleConfirmer = () => {
    const scanInfo = modeManuel
      ? {
          ...lotInfo,
          temperature:        prog.temperature,
          vitesse:            prog.vitesse,
          duree:              prog.duree,
          programmeRecommande: prog.nom,
        }
      : lotInfo;
    confirmerAjoutLot(lot, scanInfo);
    setModeManuel(false);
    setProg({ nom: "", temperature: "", vitesse: "", duree: "" });
  };

  const handleFermer = () => {
    setLotDialog(null);
    setModeManuel(false);
  };

  return (
    <div
      data-modal="true"
      style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(0,0,0,0.55)", display: "flex",
        alignItems: "center", justifyContent: "center",
        zIndex: 9999, backdropFilter: "blur(5px)"
      }}
    >
      <div style={{
        background: "white", borderRadius: "22px", padding: "28px",
        maxWidth: "540px", width: "95%", maxHeight: "90vh", overflowY: "auto",
        boxShadow: "0 28px 80px rgba(0,0,0,0.22)"
      }}>

        {/* Header */}
        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: "22px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "44px", height: "44px", borderRadius: "12px",
              background: "#d1fae5", display: "flex",
              alignItems: "center", justifyContent: "center"
            }}>
              <FaLayerGroup size={20} color="#10b981" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: "17px", color: "#0f172a" }}>
                {lotInfo?.codeLot || lot.codeLot}
              </div>
              <div style={{ fontSize: "12px", color: "#64748b" }}>
                {lot.categorie} · {lot.typeCollecte}
                · {lot.poidsActuel?.toFixed(1) || 0} kg
                · {lot.nbLinges || linges.length} pcs
              </div>
            </div>
          </div>
          <button
            onClick={handleFermer}
            style={{
              background: "#f1f5f9", border: "none", borderRadius: "50%",
              width: "34px", height: "34px", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#64748b"
            }}
          >
            <FaTimes size={14} />
          </button>
        </div>

        {/* Toggle mode */}
        <div style={{
          display: "flex", gap: "8px", marginBottom: "20px",
          background: "#f1f5f9", padding: "4px", borderRadius: "10px"
        }}>
          {[
            { id: false, icon: <FaSoap size={12} />, label: t('lot_dialog.suggested_program') },
            { id: true,  icon: <FaEdit size={12} />, label: t('lot_dialog.manual_entry') },
          ].map(({ id, icon, label }) => (
            <button
              key={String(id)}
              onClick={() => setModeManuel(id)}
              style={{
                flex: 1, padding: "8px", borderRadius: "8px", border: "none",
                cursor: "pointer", fontWeight: 600, fontSize: "13px",
                background: modeManuel === id ? "white" : "transparent",
                color: modeManuel === id ? "#10b981" : "#94a3b8",
                boxShadow: modeManuel === id ? "0 2px 6px rgba(0,0,0,0.07)" : "none",
                transition: "all 0.2s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "6px"
              }}
            >
              {icon} {label}
            </button>
          ))}
        </div>

        {/* Programme suggéré */}
        {!modeManuel && lotInfo && (
          <div style={{ marginBottom: "20px" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              padding: "7px 16px", background: "#10b981", borderRadius: "20px",
              fontSize: "13px", fontWeight: 700, color: "white", marginBottom: "16px"
            }}>
              <FaSoap size={12} /> {lotInfo.programmeRecommande}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "10px" }}>
              {[
                { icon: <FaThermometerHalf />, label: t('lot_dialog.temperature'), val: `${lotInfo.temperature}°C`,  color: "#ef4444" },
                { icon: <FaTachometerAlt />,   label: t('lot_dialog.spin_speed'),    val: `${lotInfo.vitesse} rpm`,    color: "#0ea5e9" },
                { icon: <FaSoap />,            label: t('lot_dialog.duration'),       val: lotInfo.duree || "—",        color: "#7c3aed" },
              ].map(({ icon, label, val, color }) => (
                <div key={label} style={{
                  background: "#f8fafc", borderRadius: "10px",
                  padding: "12px", border: "1px solid #e2e8f0"
                }}>
                  <div style={{
                    fontSize: "11px", color: "#94a3b8",
                    display: "flex", alignItems: "center", gap: "5px", marginBottom: "6px"
                  }}>
                    <span style={{ color }}>{icon}</span> {label}
                  </div>
                  <div style={{ fontWeight: 800, fontSize: "16px", color: "#0f172a" }}>{val}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Saisie manuelle */}
        {modeManuel && (
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px",
            marginBottom: "20px"
          }}>
            {[
              { key: "nom",         label: t('lot_dialog.program_name'), placeholder: t('lot_dialog.program_name_placeholder'), full: true  },
              { key: "temperature", label: t('lot_dialog.temperature'), placeholder: t('lot_dialog.temperature_placeholder'), full: false },
              { key: "vitesse",     label: t('lot_dialog.spin_speed'),   placeholder: t('lot_dialog.spin_speed_placeholder'), full: false },
              { key: "duree",       label: t('lot_dialog.duration'),      placeholder: t('lot_dialog.duration_placeholder'), full: false },
            ].map(({ key, label, placeholder, full }) => (
              <div key={key} style={{ gridColumn: full ? "1 / -1" : "auto" }}>
                <label style={{
                  fontSize: "11px", fontWeight: 600, color: "#64748b",
                  display: "block", marginBottom: "5px"
                }}>
                  {label}
                </label>
                <input
                  type={key === "nom" ? "text" : "number"}
                  placeholder={placeholder}
                  value={prog[key]}
                  onChange={e => setProg(prev => ({ ...prev, [key]: e.target.value }))}
                  style={{
                    width: "100%", padding: "10px 12px",
                    borderRadius: "8px", border: "2px solid #e2e8f0",
                    fontSize: "14px", outline: "none",
                    boxSizing: "border-box", fontWeight: 500
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Liste linges */}
        {linges.length > 0 && (
          <div style={{ marginBottom: "18px" }}>
            <div style={{
              fontSize: "12px", fontWeight: 600, color: "#64748b",
              marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px"
            }}>
              <FaBoxes size={11} /> {linges.length} {t('lot_dialog.linens_in_lot')}
            </div>
            <div style={{ maxHeight: "110px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "3px" }}>
              {linges.map((l, i) => (
                <div key={i} style={{
                  display: "flex", gap: "10px", padding: "5px 10px",
                  background: "#f8fafc", borderRadius: "7px",
                  fontSize: "12px", border: "1px solid #f1f5f9"
                }}>
                  <code style={{ fontWeight: 600, color: "#0ea5e9", minWidth: "90px" }}>
                    {l.codeBarre}
                  </code>
                  <span style={{ color: "#64748b" }}>{l.categorie}</span>
                  <span style={{ marginLeft: "auto", color: "#94a3b8" }}>{l.etat}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={handleFermer}
            style={{
              flex: 1, padding: "12px", borderRadius: "10px",
              border: "1px solid #e2e8f0", background: "white",
              color: "#64748b", fontWeight: 600, fontSize: "14px", cursor: "pointer"
            }}
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleConfirmer}
            style={{
              flex: 2, padding: "12px", borderRadius: "10px", border: "none",
              background: "linear-gradient(135deg,#10b981,#059669)",
              color: "white", fontWeight: 700, fontSize: "14px", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
            }}
          >
            <FaCheck size={13} /> {t('lot_dialog.add_to_load')}
          </button>
        </div>
      </div>
    </div>
  );
}