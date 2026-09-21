import React, { useContext, useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { LingeContext, CATEGORIES } from "../../contextes/LingeContext";
import { ServiceContext } from "../../contextes/ServiceContext";
import {
  FaTrash, FaEye, FaPlus, FaHistory, FaPrint, FaEdit,
  FaBarcode, FaRss, FaWifi, FaMicrophone
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useModal } from "../../contextes/ModalContext";
import { useReactToPrint } from "react-to-print";
import BarcodeLabel from "../../components/BarcodeLabel";
import "./WorkflowList.css";
import "./LingeList.css";
import { Modal } from "../../components/ui/modal";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import printJS from "print-js";
import Swal from 'sweetalert2';
import {
  Plus, Eye, Trash2, Edit, History, Barcode, RefreshCw,
  Search, Filter, X, Tag, User as UserIcon, Calendar,
  Loader2, Upload, Check, CheckSquare, Square, Package,
  CheckCircle, Building2, FileText, Clock, Sparkles, ShieldCheck
} from "lucide-react";
import { LingeImportModal } from "./LingeImportModal";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

// ═══════════════════════════════════════════════════════════════════════════
// 🎨 MODE TOGGLE
// ═══════════════════════════════════════════════════════════════════════════
function ModeToggle({ mode, onChange }) {
  const { t } = useTranslation();

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px", background: "#f1f5f9", borderRadius: "12px" }}>
      <button
        onClick={() => onChange("BARCODE")}
        style={{
          display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", borderRadius: "8px",
          border: "none", cursor: "pointer", fontWeight: 700, fontSize: "13px", transition: "all 0.2s",
          background: mode === "BARCODE" ? "white" : "transparent",
          color: mode === "BARCODE" ? "#0ea5e9" : "#94a3b8",
          boxShadow: mode === "BARCODE" ? "0 2px 8px rgba(0,0,0,0.1)" : "none"
        }}
      >
        <FaBarcode size={16} /> {t('linge.mode_barcode')}
      </button>
      <button
        onClick={() => onChange("RFID")}
        style={{
          display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", borderRadius: "8px",
          border: "none", cursor: "pointer", fontWeight: 700, fontSize: "13px", transition: "all 0.2s",
          background: mode === "RFID" ? "#7c3aed" : "transparent",
          color: mode === "RFID" ? "white" : "#94a3b8",
          boxShadow: mode === "RFID" ? "0 2px 8px rgba(124,58,237,0.3)" : "none"
        }}
      >
        <FaRss size={16} /> RFID
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 🎨 HELPERS DE DESIGN — Sections & Champs de formulaire
// ═══════════════════════════════════════════════════════════════════════════
function FormSection({ icon, title, subtitle, accent = "#0ea5e9", children }) {
  return (
    <div style={{
      padding: "16px",
      borderRadius: "16px",
      background: "linear-gradient(135deg, #fafbfc 0%, #ffffff 100%)",
      border: "1px solid #f1f5f9",
      marginBottom: "16px"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
        <div style={{
          width: "32px", height: "32px", borderRadius: "9px",
          background: `${accent}15`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: accent, flexShrink: 0
        }}>
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: "13px", fontWeight: 800, color: "#0f172a",
            letterSpacing: "-0.01em", lineHeight: 1.2
          }}>
            {title}
          </div>
          {subtitle && (
            <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px", fontWeight: 500 }}>
              {subtitle}
            </div>
          )}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {children}
      </div>
    </div>
  );
}

function FormField({ label, required, hint, icon, children }) {
  return (
    <div>
      <label style={{
        display: "flex", alignItems: "center", gap: "6px",
        fontSize: "11px", fontWeight: 700, color: "#475569",
        marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.4px"
      }}>
        {icon && <span style={{ color: "#94a3b8", display: "flex" }}>{icon}</span>}
        <span>{label}</span>
        {required && (
          <span style={{
            color: "#ef4444", fontSize: "14px", lineHeight: 1,
            marginLeft: "2px"
          }}>*</span>
        )}
      </label>
      {children}
      {hint && (
        <p style={{
          fontSize: "11px", color: "#94a3b8", margin: "5px 0 0",
          display: "flex", alignItems: "flex-start", gap: "4px", lineHeight: 1.4
        }}>
          <span style={{ flexShrink: 0 }}>💡</span>
          <span>{hint}</span>
        </p>
      )}
    </div>
  );
}

function ModernInput({ value, onChange, placeholder, type = "text", disabled, required, step, min, autoFocus }) {
  const [focused, setFocused] = React.useState(false);
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      step={step}
      min={min}
      autoFocus={autoFocus}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        width: "100%",
        height: "42px",
        padding: "0 14px",
        borderRadius: "12px",
        border: `1.5px solid ${focused ? "#0ea5e9" : "#e2e8f0"}`,
        background: disabled ? "#f8fafc" : "white",
        fontSize: "13px",
        fontWeight: 500,
        color: "#0f172a",
        outline: "none",
        transition: "all 0.2s ease",
        boxShadow: focused ? "0 0 0 4px rgba(14,165,233,0.12)" : "0 1px 2px rgba(0,0,0,0.03)",
        boxSizing: "border-box",
        cursor: disabled ? "not-allowed" : "text"
      }}
    />
  );
}

function ModernSelect({ value, onChange, disabled, required, children }) {
  const [focused, setFocused] = React.useState(false);
  return (
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      required={required}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        width: "100%",
        height: "42px",
        padding: "0 36px 0 14px",
        borderRadius: "12px",
        border: `1.5px solid ${focused ? "#0ea5e9" : "#e2e8f0"}`,
        background: disabled ? "#f8fafc" : "white",
        fontSize: "13px",
        fontWeight: 500,
        color: "#0f172a",
        outline: "none",
        transition: "all 0.2s ease",
        boxShadow: focused ? "0 0 0 4px rgba(14,165,233,0.12)" : "0 1px 2px rgba(0,0,0,0.03)",
        boxSizing: "border-box",
        cursor: disabled ? "not-allowed" : "pointer",
        appearance: "none",
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 14px center"
      }}
    >
      {children}
    </select>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 🔍 AUTOCOMPLETE PERSONNEL — Recherche par nom, prénom, matricule, code-barre
// ═══════════════════════════════════════════════════════════════════════════
function PersonnelAutocomplete({ value, onChange, personnel = [], placeholder = "Rechercher..." }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [highlightedIndex, setHighlightedIndex] = React.useState(0);
  const [focused, setFocused] = React.useState(false);
  const containerRef = React.useRef(null);
  const inputRef = React.useRef(null);

  // Porteur actuellement sélectionné
  const selected = personnel.find(p => p.id === value) || null;

  // Filtrer selon la query
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return personnel.slice(0, 50);
    return personnel.filter(p => {
      const full = `${p.prenom} ${p.nom}`.toLowerCase();
      const rev  = `${p.nom} ${p.prenom}`.toLowerCase();
      return (
        full.includes(q) ||
        rev.includes(q) ||
        (p.matricule || "").toLowerCase().includes(q) ||
        (p.codeBarre || "").toLowerCase().includes(q) ||
        (p.nomPrenom || "").toLowerCase().includes(q)
      );
    }).slice(0, 50);
  }, [personnel, query]);

  const openDropdown = () => {
    setIsOpen(true);
    setHighlightedIndex(0);
  };

  const selectPerson = (person) => {
    onChange(person.id);
    setQuery("");
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const clearSelection = (e) => {
    e.stopPropagation();
    onChange("");
    setQuery("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (!isOpen && (e.key === "ArrowDown" || e.key === "Enter")) {
      openDropdown();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex(i => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[highlightedIndex]) selectPerson(filtered[highlightedIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      {/* ─── Champ de saisie ─── */}
      <div
        onClick={() => {
          inputRef.current?.focus();
          openDropdown();
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          height: "42px",
          padding: "0 12px 0 14px",
          borderRadius: "12px",
          border: `1.5px solid ${focused || isOpen ? "#0ea5e9" : "#e2e8f0"}`,
          background: "white",
          boxShadow: focused || isOpen ? "0 0 0 4px rgba(14,165,233,0.12)" : "0 1px 2px rgba(0,0,0,0.03)",
          transition: "all 0.2s ease",
          cursor: "text",
          boxSizing: "border-box"
        }}
      >
        <UserIcon size={14} style={{ color: "#94a3b8", flexShrink: 0 }} />

        {selected ? (
          <div style={{
            flex: 1, display: "flex", alignItems: "center", gap: "8px", minWidth: 0
          }}>
            <span style={{
              fontSize: "13px", fontWeight: 600, color: "#0f172a",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
            }}>
              {selected.prenom} {selected.nom}
            </span>
            {selected.codeBarre && (
              <code style={{
                fontSize: "10px", fontWeight: 700, color: "#0ea5e9",
                background: "#ecfeff", padding: "2px 6px", borderRadius: "5px",
                flexShrink: 0
              }}>
                {selected.codeBarre}
              </code>
            )}
          </div>
        ) : (
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              openDropdown();
              setHighlightedIndex(0);
            }}
            onFocus={() => { setFocused(true); openDropdown(); }}
            onBlur={() => setFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            style={{
              flex: 1,
              height: "100%",
              border: "none",
              outline: "none",
              fontSize: "13px",
              fontWeight: 500,
              color: "#0f172a",
              background: "transparent",
              padding: 0,
              minWidth: 0
            }}
          />
        )}

        {selected ? (
          <button
            type="button"
            onClick={clearSelection}
            style={{
              width: "20px", height: "20px",
              borderRadius: "50%",
              border: "none",
              background: "#f1f5f9",
              color: "#64748b",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
              transition: "all 0.15s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#fee2e2";
              e.currentTarget.style.color = "#dc2626";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#f1f5f9";
              e.currentTarget.style.color = "#64748b";
            }}
          >
            <X size={11} strokeWidth={3} />
          </button>
        ) : (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            style={{
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
              flexShrink: 0
            }}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        )}
      </div>

      {/* ─── Dropdown ─── */}
      {isOpen && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 6px)",
          left: 0,
          right: 0,
          maxHeight: "260px",
          overflowY: "auto",
          background: "white",
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          boxShadow: "0 12px 32px rgba(15,23,42,0.12), 0 0 0 1px rgba(15,23,42,0.02)",
          zIndex: 9999,
          padding: "4px"
        }}>
          <div style={{
            padding: "6px 10px",
            fontSize: "10px",
            fontWeight: 700,
            color: "#94a3b8",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            borderBottom: "1px solid #f1f5f9",
            marginBottom: "4px"
          }}>
            {filtered.length} {filtered.length > 1 ? "résultats" : "résultat"}
            {query && ` pour "${query}"`}
          </div>

          {filtered.length === 0 ? (
            <div style={{
              padding: "20px",
              textAlign: "center",
              fontSize: "12px",
              color: "#94a3b8"
            }}>
              <div style={{ fontSize: "20px", marginBottom: "6px", opacity: 0.3 }}>🔍</div>
              Aucun porteur trouvé
            </div>
          ) : (
            filtered.map((p, idx) => {
              const isHighlighted = idx === highlightedIndex;
              const isSelected = p.id === value;
              return (
                <button
                  key={p.id}
                  type="button"
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  onClick={() => selectPerson(p)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "8px 10px",
                    borderRadius: "8px",
                    border: "none",
                    background: isSelected
                      ? "#ecfeff"
                      : isHighlighted
                        ? "#f8fafc"
                        : "transparent",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.1s",
                    boxSizing: "border-box"
                  }}
                >
                  <div style={{
                    width: "30px", height: "30px",
                    borderRadius: "9px",
                    background: isSelected
                      ? "linear-gradient(135deg, #0ea5e9, #0284c7)"
                      : "linear-gradient(135deg, #e0f2fe, #bae6fd)",
                    color: isSelected ? "white" : "#0369a1",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "11px", fontWeight: 800,
                    flexShrink: 0
                  }}>
                    {(p.prenom?.[0] || "").toUpperCase()}{(p.nom?.[0] || "").toUpperCase()}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: "13px", fontWeight: 700, color: "#0f172a",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                    }}>
                      {p.prenom} {p.nom}
                    </div>
                    <div style={{
                      fontSize: "10.5px", color: "#94a3b8", fontWeight: 600,
                      display: "flex", gap: "8px", marginTop: "1px"
                    }}>
                      {p.matricule && <span>#{p.matricule}</span>}
                      {p.codeBarre && <span>· {p.codeBarre}</span>}
                    </div>
                  </div>

                  {isSelected && (
                    <Check size={14} style={{ color: "#0ea5e9", flexShrink: 0 }} strokeWidth={3} />
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

function InfoTile({ icon, label, value, accent = "#0ea5e9", span = 1 }) {
  return (
    <div style={{
      gridColumn: span === 2 ? "span 2" : "span 1",
      padding: "12px 14px",
      borderRadius: "14px",
      background: "linear-gradient(135deg, #fafbfc 0%, #ffffff 100%)",
      border: "1px solid #f1f5f9",
      display: "flex",
      alignItems: "center",
      gap: "12px",
      transition: "all 0.2s ease"
    }}>
      <div style={{
        width: "34px", height: "34px", borderRadius: "10px",
        background: `${accent}15`,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: accent, flexShrink: 0
      }}>
        {icon}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{
          fontSize: "9.5px", color: "#94a3b8",
          textTransform: "uppercase", letterSpacing: "0.5px",
          fontWeight: 700, marginBottom: "2px"
        }}>
          {label}
        </div>
        <div style={{
          fontSize: "13px", fontWeight: 700, color: "#0f172a",
          overflow: "hidden", textOverflow: "ellipsis",
          whiteSpace: span === 2 ? "normal" : "nowrap",
          lineHeight: 1.3
        }}>
          {value}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 🚀 COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════
export default function LingeList() {
  const { t } = useTranslation();

  // ─── CONTEXTES ──────────────────────────────────────────────────────────
  const {
    linges,
    addLinge,
    deleteLinge,
    updateLinge,
    formatEPC,
    isRfidMode,
    setIsRfidMode,
    fetchLingesPaged,
    checkCodeExists,
    associerTagRfid,
    pagedData,
    setPagedData,
    setIsImportModalOpen,
    setImportType,
  } = useContext(LingeContext);

  const { services } = useContext(ServiceContext);
  const navigate = useNavigate();
  const { showAlert, showConfirm } = useModal();

  // ─── ÉTATS ──────────────────────────────────────────────────────────────
  const [filters, setFilters] = useState({
    categorie: "",
    etat: "",
    serviceId: "",
    search: "",
  });

  const [showPopup, setShowPopup] = useState(false);
  const [selectedLingeForPrint, setSelectedLingeForPrint] = useState(null);
  const [lingeToPrint, setLingeToPrint] = useState(null);
  const [selectedLingeDetail, setSelectedLingeDetail] = useState(null);
  const [lingeToEdit, setLingeToEdit] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [showRfidPopup, setShowRfidPopup] = useState(false);
  const [rfidCode, setRfidCode] = useState("");
  const [selectedLingeForRfid, setSelectedLingeForRfid] = useState(null);
  const [displayMode, setDisplayMode] = useState(isRfidMode ? "RFID" : "BARCODE");
  const [personnel, setPersonnel] = useState([]);
  const [isPersonnelLoading, setIsPersonnelLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [creationMode, setCreationMode] = useState("auto");

  const printRef = React.useRef(null);

  // ─── ÉTAT DU FORMULAIRE ────────────────────────────────────────────────
  const [newLinge, setNewLinge] = useState({
    categorie: "",
    poids: 0,
    serviceId: "",
    codebarre: "",
    rfidTag: "",
    dureVie: "",
    porteurId: "",
    etat: "SALE",
    observations: ""
  });

  // ─── CHARGEMENT PERSONNEL ──────────────────────────────────────────────
  const fetchPersonnel = async () => {
    setIsPersonnelLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/sqlserver/personnel`);
      if (response.ok) {
        const data = await response.json();
        const normalized = (Array.isArray(data) ? data : []).map((p) => ({
          id:         p.Id         ?? p.id,
          nom:        p.Nom        ?? p.nom        ?? "",
          prenom:     p.Prenom     ?? p.prenom     ?? "",
          nomPrenom:  p.NomPrenom  ?? p.nomPrenom  ?? "",
          matricule:  p.Matricule  ?? p.matricule  ?? "",
          codeBarre:  p.CodeBarre  ?? p.codeBarre  ?? "",
          fonction:   p.Fonction   ?? p.fonction   ?? null,
          serviceId:  p.ServiceID  ?? p.serviceId  ?? null,
        }));
        setPersonnel(normalized);
      }
    } catch (err) {
      console.error("Erreur chargement personnel:", err);
    } finally {
      setIsPersonnelLoading(false);
    }
  };

  useEffect(() => {
    fetchPersonnel();
  }, []);

  // ─── CHARGEMENT PAGINÉ ─────────────────────────────────────────────────
  const loadPage = async (page) => {
    if (!fetchLingesPaged) return;
    setIsLoading(true);
    try {
      const data = await fetchLingesPaged(page, 10, filters);
      if (data) {
        setPagedData(data);
        setCurrentPage(data.number || 0);
      }
    } catch (error) {
      console.error("Erreur chargement page:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPage(0);
  }, []);

  useEffect(() => {
    loadPage(0);
  }, [filters]);

  // ─── MODE CHANGE ──────────────────────────────────────────────────────
  const handleModeChange = (mode) => {
    const newMode = mode === "RFID";
    setIsRfidMode(newMode);
    setDisplayMode(mode);
    loadPage(0);
  };

  // ─── PAGINATION ─────────────────────────────────────────────────────────
  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < pagedData.totalPages) {
      loadPage(newPage);
    }
  };

  // ─── DÉTECTION FORMAT CODE-BARRES ─────────────────────────────────────
  const detectFormat = (value) => {
    if (!value) return "code128";
    const cleanValue = value.replace(/\s+/g, "");
    if (/^\d{13}$/.test(cleanValue)) return "ean13";
    if (/^\d{8}$/.test(cleanValue)) return "ean8";
    if (/^\d{12}$/.test(cleanValue)) return "upc";
    return "code128";
  };

  // ─── IMPRESSION ÉTIQUETTE ─────────────────────────────────────────────
  const handlePrint = () => {
    if (!selectedLingeForPrint) return;
    const { id, codebarre, categorie, serviceNom } = selectedLingeForPrint || {};
    const format = detectFormat(codebarre);
    printJS({
      printable: `
        <div style="width:50mm; padding:2mm; font-family:'Courier New',monospace; background:white;">
          <div style="display:flex; justify-content:space-between; font-size:7pt; border-bottom:0.5pt solid black; margin-bottom:1mm; padding-bottom:0.5mm;">
            <span>${new Date().toLocaleDateString()}</span>
          </div>
          <div style="display:flex; justify-content:center; margin:1mm 0;">
            <img
              src="https://barcodeapi.org/api/${format}/${encodeURIComponent(codebarre)}"
              style="height:60px;"
            />
          </div>
        </div>
      `,
      type: "raw-html",
      style: "* { margin: 0; padding: 0; box-sizing: border-box; }",
      documentTitle: "Etiquette_Linge",
    });
    setSelectedLingeForPrint(null);
  };

  // ─── SAUVEGARDE ─────────────────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (lingeToEdit) {
        const updatePayload = {
          categorie: newLinge.categorie,
          poids: parseFloat(newLinge.poids) || 0,
          serviceId: newLinge.serviceId ? parseInt(newLinge.serviceId) : null,
          etat: newLinge.etat,
          durevie: newLinge.dureVie ? parseInt(newLinge.dureVie) : null,
          porteurId: newLinge.porteurId ? parseInt(newLinge.porteurId) : null,
          rfidTag: newLinge.rfidTag?.trim() || null,
          observations: newLinge.observations?.trim() || null
        };

        const response = await fetch(`${API_URL}/api/linges/${lingeToEdit.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatePayload)
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(error);
        }

        const updated = await response.json();

        const updatedLinges = (pagedData.content || []).map(l =>
          l.id === updated.id ? updated : l
        );
        setPagedData({ ...pagedData, content: updatedLinges });

        setLingeToEdit(null);
        setShowPopup(false);
        loadPage(currentPage);

        Swal.fire({
          title: "✅ " + t('messages.success'),
          text: t('linge.update_success'),
          icon: "success",
          timer: 1500,
          showConfirmButton: false
        });
        return;
      }

      if (creationMode === "manual") {
        const codeToCheck = newLinge.codebarre.trim();
        if (!codeToCheck) {
          showAlert(t('messages.warning'), t('linge.scan_required_manual'), "warning");
          setIsSaving(false);
          return;
        }
        if (checkCodeExists) {
          const exists = await checkCodeExists(codeToCheck);
          if (exists) {
            showAlert(t('messages.error'), t('linge.code_exists', { code: codeToCheck }), "error");
            setIsSaving(false);
            return;
          }
        }
      }

      const payload = {
        codeBarre: (creationMode === "auto" || !newLinge.codebarre.trim()) ? null : newLinge.codebarre.trim(),
        categorie: newLinge.categorie,
        poids: parseFloat(newLinge.poids) || 0,
        etat: newLinge.etat || "SALE",
        serviceId: newLinge.serviceId ? parseInt(newLinge.serviceId) : null,
        durevie: newLinge.dureVie ? parseInt(newLinge.dureVie) : null,
        porteurId: newLinge.porteurId ? parseInt(newLinge.porteurId) : null,
        observations: newLinge.observations?.trim() || null
      };

      if (newLinge.rfidTag?.trim()) {
        payload.rfidTag = newLinge.rfidTag.trim();
      }

      if (!payload.serviceId && services.length > 0) {
        payload.serviceId = services[0].id;
      }

      const created = await addLinge(payload);
      if (created) {
        setLingeToPrint(created);
        setShowPopup(false);
        setNewLinge({
          categorie: "",
          poids: 0,
          serviceId: "",
          codebarre: "",
          rfidTag: "",
          dureVie: "",
          porteurId: "",
          etat: "SALE",
          observations: ""
        });
        loadPage(0);
        showAlert(t('messages.success'), t('linge.create_success'), "success");
      }
    } catch (error) {
      console.error('❌ Erreur:', error);
      showAlert(t('messages.error'), error.message || t('linge.error_operation'), "error");
    } finally {
      setIsSaving(false);
    }
  };

  // ─── ASSOCIATION RFID ──────────────────────────────────────────────────
  const handleAssocierRfid = async () => {
    if (!selectedLingeForRfid) {
      showAlert(t('messages.error'), t('linge.no_linge_selected'), "error");
      return;
    }
    if (!rfidCode.trim()) {
      showAlert(t('messages.warning'), t('linge.rfid_required'), "warning");
      return;
    }

    try {
      const result = await associerTagRfid(selectedLingeForRfid.codebarre, rfidCode.trim());
      if (result) {
        showAlert(t('messages.success'), t('linge.rfid_success', { code: selectedLingeForRfid.codebarre }), "success");
        setShowRfidPopup(false);
        setRfidCode("");
        setSelectedLingeForRfid(null);
        loadPage(currentPage);
      }
    } catch (error) {
      showAlert(t('messages.error'), `❌ ${error.message || t('linge.rfid_error')}`, "error");
    }
  };

  // ─── DÉTAILS ────────────────────────────────────────────────────────────
  const handleDetail = (id) => {
    let l = displayedLinges.find(item => item.id === id);
    if (!l && linges && linges.length > 0) {
      l = linges.find(item => item.id === id);
    }
    if (!l && pagedData.content) {
      l = pagedData.content.find(item => item.id === id);
    }
    if (l) {
      setSelectedLingeDetail(l);
    } else {
      showAlert(t('messages.error'), t('linge.not_found'), "error");
    }
  };

  // ─── ÉDITION ────────────────────────────────────────────────────────────
  const handleEdit = (linge) => {
    if (!linge && selectedId) {
      const l = displayedLinges.find(item => item.id === selectedId) ||
                pagedData.content.find(item => item.id === selectedId);
      if (l) {
        linge = l;
      }
    }
    if (!linge) {
      showAlert(t('messages.error'), t('linge.no_selection'), "error");
      return;
    }
    setNewLinge({
      categorie: linge.categorie || "",
      poids: linge.poids || 0,
      serviceId: linge.serviceId || "",
      codebarre: linge.codebarre || "",
      rfidTag: linge.rfidTag || "",
      dureVie: linge.dureVie || "",
      porteurId: linge.porteurId || "",
      etat: linge.etat || "SALE",
      observations: linge.observations || ""
    });
    setLingeToEdit(linge);
    setShowPopup(true);
  };

  // ─── OUVERTURE IMPORT ──────────────────────────────────────────────────
  const handleOpenImport = () => {
    setImportType('LINGE');
    setIsImportModalOpen(true);
  };

  // ─── RÉINITIALISATION FILTRES ──────────────────────────────────────────
  const resetFilters = () => {
    setFilters({
      categorie: "",
      etat: "",
      serviceId: "",
      search: "",
    });
    loadPage(0);
  };

  // ─── ROW CLICK ─────────────────────────────────────────────────────────
  const handleRowClick = (id) => {
    setSelectedId((prev) => (prev === id ? null : id));
  };

  // ─── DONNÉES AFFICHÉES ─────────────────────────────────────────────────
  const displayedLinges = pagedData.content || [];
  const selectedLinge = displayedLinges.find((l) => l.id === selectedId);

  // ─── GET SERVICE NAME ──────────────────────────────────────────────────
  const getServiceName = (serviceId) => {
    if (!serviceId) return t('linge.unassigned');
    const service = services.find(s => s.id === serviceId);
    return service ? service.code : t('linge.unassigned');
  };

  // ─── GET PORTEUR NAME ──────────────────────────────────────────────────
  const getPorteurName = (porteurId) => {
    if (!porteurId) return t('linge.unassigned');
    const porteur = personnel.find(p => p.id === porteurId);
    if (porteur) {
      return `${porteur.prenom} ${porteur.nom}`;
    }
    return t('linge.unassigned');
  };

  // ─── BADGE ÉTAT ────────────────────────────────────────────────────────
  const getEtatBadge = (etat) => {
    const etatColors = {
      SALE: "destructive",
      EN_LAVAGE: "info",
      LAVE: "success",
      EN_SECHAGE: "info",
      SECHE: "success",
      PLIE: "secondary",
      COLLE: "secondary",
      STOCKE: "secondary",
      COLLECTE: "warning",
      LIVRE: "success",
      HORS_SERVICE: "destructive",
      EN_TRI: "info",
      RECEPTION: "info",
      INFECTE_COLLECTE: "destructive",
      INFECTE_EN_LAVAGE: "destructive",
      INFECTE_LAVE: "destructive",
      INFECTE_ECART: "destructive",
      PROPRE: "success",
      MANQUANT: "destructive"
    };
    const variant = etatColors[etat] || "secondary";
    return <Badge variant={variant}>{t(`linge_etat.${etat}`, etat)}</Badge>;
  };

  // ─── VÉRIFICATION UNIFORME ─────────────────────────────────────────────
  const isUniforme = newLinge.categorie === "UNIFORME";

  return (
    <div className="space-y-8">
      {/* ─── EN-TÊTE ────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: "32px" }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          marginBottom: "8px"
        }}>
          <div style={{
            width: "52px",
            height: "52px",
            borderRadius: "16px",
            background: displayMode === "RFID"
              ? "linear-gradient(135deg, #8b5cf6, #7c3aed)"
              : "linear-gradient(135deg, #14b8a6, #0d9488)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            boxShadow: displayMode === "RFID"
              ? "0 4px 16px rgba(139, 92, 246, 0.25)"
              : "0 4px 16px rgba(20, 184, 166, 0.25)"
          }}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
              {displayMode === "RFID" && (
                <>
                  <circle cx="12" cy="14" r="2" />
                  <path d="M10 18a4 4 0 0 1 4 0" />
                </>
              )}
            </svg>
          </div>
          <div>
            <h1 style={{
              fontSize: "28px",
              fontWeight: 800,
              color: "#0f172a",
              margin: 0
            }}>
              {displayMode === "RFID" ? t('linge.title_rfid') : t('linge.title')}
            </h1>
            <p style={{
              fontSize: "14px",
              color: "#64748b",
              margin: "2px 0 0 0"
            }}>
              {displayMode === "RFID"
                ? t('linge.subtitle_rfid')
                : t('linge.subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* ─── BARRE D'OUTILS ────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 bg-white/65 backdrop-blur-md p-4 rounded-[20px] border border-slate-200/50 shadow-[0_4px_20px_rgba(0,0,0,0.02)] mb-6">
        <ModeToggle mode={displayMode} onChange={handleModeChange} />

        <div style={{ width: "1px", height: "30px", background: "#e2e8f0", margin: "0 8px" }} />

        <button
          onClick={() => {
            setShowPopup(true);
            setLingeToEdit(null);
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#0ca678]/30 rounded-[14px] text-sm font-bold text-[#0ca678] hover:bg-[#0ca678]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" /> {t('linge.new_article')}
        </button>

        <button
          onClick={handleOpenImport}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-[14px] text-sm font-bold text-indigo-700 hover:from-indigo-100 hover:to-purple-100 transition-all shadow-[0_2px_8px_rgba(99,102,241,0.15)] hover:shadow-[0_4px_16px_rgba(99,102,241,0.25)] hover:scale-[1.02]"
        >
          <Upload className="w-4 h-4 stroke-[2.5]" /> {t('linge.import_linens')}
        </button>

        <div style={{ width: "1px", height: "30px", background: "#e2e8f0", margin: "0 8px" }} />

        <button
          onClick={() => {
            if (!selectedId) {
              showAlert(t('messages.info'), t('linge.select_article'), "info");
              return;
            }
            const linge = displayedLinges.find(l => l.id === selectedId) || linges.find(l => l.id === selectedId);
            if (!linge) {
              showAlert(t('messages.error'), t('linge.not_found'), "error");
              return;
            }
            if (linge.rfidTag && linge.rfidTag !== "") {
              showAlert(t('messages.warning'), t('linge.rfid_already'), "warning");
              return;
            }
            setSelectedLingeForRfid(linge);
            setRfidCode("");
            setShowRfidPopup(true);
          }}
          disabled={!selectedId}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#8b5cf6]/30 rounded-[14px] text-sm font-bold text-[#8b5cf6] hover:bg-[#8b5cf6]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
        >
          <Tag className="w-4 h-4 stroke-[2.5]" /> {t('linge.associate_rfid')}
        </button>

        <button
          disabled={!selectedId}
          onClick={() => selectedId && handleDetail(selectedId)}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#006f94]/30 rounded-[14px] text-sm font-bold text-[#006f94] hover:bg-[#006f94]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
        >
          <Eye className="w-4 h-4 stroke-[2.5]" /> {t('common.details')}
        </button>

        <button
          disabled={!selectedId}
          onClick={() => selectedId && handleEdit(selectedLinge)}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#e67700]/30 rounded-[14px] text-sm font-bold text-[#e67700] hover:bg-[#e67700]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
        >
          <Edit className="w-4 h-4 stroke-[2.5]" /> {t('common.edit')}
        </button>

        <button
          disabled={!selectedId}
          onClick={async () => {
            if (selectedId) {
              const confirmed = await showConfirm(t('messages.warning'), t('linge.delete_confirm_text'), "warning");
              if (confirmed) {
                await deleteLinge(selectedId);
                setSelectedId(null);
                loadPage(currentPage);
              }
            }
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#e03131]/30 rounded-[14px] text-sm font-bold text-[#e03131] hover:bg-[#e03131]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
        >
          <Trash2 className="w-4 h-4 stroke-[2.5]" /> {t('common.delete')}
        </button>

        <button
          disabled={!selectedId}
          onClick={() => {
            if (selectedId) {
              setSelectedLingeForPrint(selectedLinge);
              setTimeout(() => handlePrint(), 300);
            }
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#8b5cf6]/30 rounded-[14px] text-sm font-bold text-[#8b5cf6] hover:bg-[#8b5cf6]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
        >
          <Barcode className="w-4 h-4 stroke-[2.5]" /> {t('linge.label')}
        </button>

        <button
          disabled={!selectedId}
          onClick={() => selectedId && navigate(`/tracking?code=${selectedLinge?.codebarre}`)}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#0ca678]/30 rounded-[14px] text-sm font-bold text-[#0ca678] hover:bg-[#0ca678]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
        >
          <History className="w-4 h-4 stroke-[2.5]" /> {t('linge.history')}
        </button>

        <button
          onClick={() => loadPage(currentPage)}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-300 rounded-[14px] text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> {t('common.refresh')}
        </button>
      </div>

      {/* ─── FILTRES ────────────────────────────────────────────────────── */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t('linge.status')}</label>
              <select
                value={filters.etat}
                onChange={(e) => setFilters({ ...filters, etat: e.target.value })}
                className="w-full h-10 px-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">{t('common.all')}</option>
                <option value="SALE">{t('linge_etat.SALE')}</option>
                <option value="EN_LAVAGE">{t('linge_etat.EN_LAVAGE')}</option>
                <option value="LAVE">{t('linge_etat.LAVE')}</option>
                <option value="EN_SECHAGE">{t('linge_etat.EN_SECHAGE')}</option>
                <option value="SECHE">{t('linge_etat.SECHE')}</option>
                <option value="PLIE">{t('linge_etat.PLIE')}</option>
                <option value="COLLE">{t('linge_etat.COLLE')}</option>
                <option value="STOCKE">{t('linge_etat.STOCKE')}</option>
                <option value="COLLECTE">{t('linge_etat.COLLECTE')}</option>
                <option value="LIVRE">{t('linge_etat.LIVRE')}</option>
                <option value="HORS_SERVICE">{t('linge_etat.HORS_SERVICE')}</option>
                <option value="EN_TRI">{t('linge_etat.EN_TRI')}</option>
                <option value="RECEPTION">{t('linge_etat.RECEPTION')}</option>
                <option value="PROPRE">{t('linge_etat.PROPRE')}</option>
                <option value="MANQUANT">{t('linge_etat.MANQUANT')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t('linge.category')}</label>
              <select
                value={filters.categorie}
                onChange={(e) => setFilters({ ...filters, categorie: e.target.value })}
                className="w-full h-10 px-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">{t('common.all')}</option>
                {CATEGORIES.map((cat, i) => (
                  <option key={i} value={cat}>{t(`categories.${cat}`, cat)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t('linge.service')}</label>
              <select
                value={filters.serviceId}
                onChange={(e) => setFilters({ ...filters, serviceId: e.target.value })}
                className="w-full h-10 px-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">{t('common.all')}</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>{s.code}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t('common.search')}</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={t('linge.search_placeholder')}
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="w-full h-10 pl-10 pr-4 rounded-lg border border-input bg-input-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button
              onClick={resetFilters}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#e67700]/30 rounded-[14px] text-sm font-bold text-[#e67700] hover:bg-[#e67700]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02]"
            >
              <Filter className="w-4 h-4 stroke-[2.5]" /> {t('common.reset')}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* ─── TABLEAU ────────────────────────────────────────────────────── */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="param-table">
              <thead>
                <tr>
                  <th className="text-center py-3 px-4">{t('common.id')}</th>
                  <th className="text-center py-3 px-4">{displayMode === "RFID" ? t('linge.rfid_tag') : t('common.code')}</th>
                  <th className="text-center py-3 px-4">{t('linge.category')}</th>
                  <th className="text-center py-3 px-4">{t('linge.weight')}</th>
                  <th className="text-center py-3 px-4">{t('linge.status')}</th>
                  <th className="text-center py-3 px-4">{t('linge.service')}</th>
                  <th className="text-center py-3 px-4">{t('linge.carrier')}</th>
                  <th className="text-center py-3 px-4">RFID</th>
                  <th className="text-center py-3 px-4 actions-th">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-muted-foreground">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                      {t('common.loading')}
                    </td>
                  </tr>
                ) : displayedLinges.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-muted-foreground">
                      {t('linge.no_articles')}
                    </td>
                  </tr>
                ) : (
                  displayedLinges.map((l) => {
                    const serviceName = getServiceName(l.serviceId);
                    const isSelected = selectedId === l.id;
                    const hasRfid = l.rfidTag && l.rfidTag !== "";
                    const isUniformeRow = l.categorie === "UNIFORME";

                    return (
                      <tr
                        key={l.id}
                        onClick={() => handleRowClick(l.id)}
                        className={isSelected ? "expanded" : ""}
                        style={{ cursor: "pointer" }}
                      >
                        <td className="text-center py-3 px-4">
                          <span className="code-badge">{l.id}</span>
                        </td>
                        <td className="text-center py-3 px-4">
                          {displayMode === "RFID" ? (
                            l.rfidTag ? (
                              <code className="rfid-tag">{formatEPC(l.rfidTag)}</code>
                            ) : (
                              <span className="text-muted-foreground text-sm">{t('linge.not_associated')}</span>
                            )
                          ) : (
                            <code className="tracking-code">{l.codebarre}</code>
                          )}
                        </td>
                        <td className="text-center font-semibold text-slate-800">{t(`categories.${l.categorie}`, l.categorie)}</td>
                        <td className="text-center font-bold">{l.poids} kg</td>
                        <td className="text-center">{getEtatBadge(l.etat)}</td>
                        <td className="text-center">{serviceName}</td>
                        <td className="text-center">
                          {isUniformeRow ? (
                            l.porteurNom ? (
                              <span className="text-xs font-medium text-blue-600 flex items-center justify-center gap-1">
                                <UserIcon className="w-3 h-3" /> {l.porteurNom}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400">{t('linge.unassigned')}</span>
                            )
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                        <td className="text-center">
                          {hasRfid ? (
                            <Badge variant="success" className="text-xs">
                              <FaRss className="mr-1" size={10} /> {l.rfidTag.substring(0, 8)}...
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">{t('linge.not_associated')}</Badge>
                          )}
                        </td>
                        <td className="text-center py-3 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDetail(l.id);
                              }}
                              className="text-[#0794a4] hover:text-[#068391] font-semibold text-sm flex items-center gap-1.5 hover:underline"
                            >
                              <Eye className="w-4 h-4" /> {t('common.details')}
                            </button>
                            {!hasRfid && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedLingeForRfid(l);
                                  setRfidCode("");
                                  setShowRfidPopup(true);
                                }}
                                className="text-[#8b5cf6] hover:text-[#7c3aed] font-semibold text-sm flex items-center gap-1.5 hover:underline"
                              >
                                <Tag className="w-4 h-4" /> RFID
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ─── PAGINATION ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-muted-foreground">
          {t('common.showing')} {displayedLinges.length > 0 ? currentPage * 10 + 1 : 0} {t('common.to')} {Math.min((currentPage + 1) * 10, pagedData.totalElements)} {t('common.of')} {pagedData.totalElements} {t('common.items')}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 0 || isLoading}
            onClick={() => handlePageChange(currentPage - 1)}
          >
            {t('common.previous')}
          </Button>
          <span className="text-sm">
            {t('common.page')} {currentPage + 1} / {pagedData.totalPages || 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= (pagedData.totalPages - 1) || isLoading}
            onClick={() => handlePageChange(currentPage + 1)}
          >
            {t('common.next')}
          </Button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          MODAL CRÉATION / MODIFICATION — DESIGN MODERNE
      ═══════════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={showPopup}
        onClose={() => setShowPopup(false)}
        title={null}
        size="lg"
      >
        <div style={{ marginTop: "-8px" }}>
          {/* ─── En-tête custom ─── */}
          <div style={{
            display: "flex", alignItems: "center", gap: "14px",
            paddingBottom: "16px", marginBottom: "18px",
            borderBottom: "1px solid #f1f5f9"
          }}>
            <div style={{
              width: "48px", height: "48px", borderRadius: "14px",
              background: lingeToEdit
                ? "linear-gradient(135deg, #f59e0b, #d97706)"
                : "linear-gradient(135deg, #0ca678, #059669)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "white",
              boxShadow: lingeToEdit
                ? "0 6px 16px rgba(245,158,11,0.30)"
                : "0 6px 16px rgba(12,166,120,0.30)"
            }}>
              {lingeToEdit
                ? <Edit className="w-6 h-6" strokeWidth={2.4} />
                : <Plus className="w-6 h-6" strokeWidth={2.6} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{
                fontSize: "18px", fontWeight: 800, color: "#0f172a",
                margin: 0, letterSpacing: "-0.02em", lineHeight: 1.2
              }}>
                {lingeToEdit ? t('linge.edit_article') : t('linge.new_article')}
              </h2>
              <p style={{
                fontSize: "12px", color: "#64748b", margin: "3px 0 0",
                fontWeight: 500
              }}>
                {lingeToEdit
                  ? `#${lingeToEdit.id} · ${lingeToEdit.codebarre}`
                  : "Remplissez les informations du linge"}
              </p>
            </div>
          </div>

          <form onSubmit={handleSave}>
            {/* ─── Toggle Auto / Manuel ─── */}
            {!lingeToEdit && (
              <div style={{
                display: "flex", padding: "4px",
                background: "#f1f5f9", borderRadius: "12px",
                marginBottom: "18px"
              }}>
                <button
                  type="button"
                  onClick={() => {
                    setCreationMode("auto");
                    setNewLinge({ ...newLinge, codebarre: "", rfidTag: "" });
                  }}
                  style={{
                    flex: 1, padding: "10px", borderRadius: "9px",
                    border: "none", cursor: "pointer",
                    fontWeight: 700, fontSize: "12.5px",
                    transition: "all 0.2s ease",
                    background: creationMode === "auto" ? "white" : "transparent",
                    color: creationMode === "auto" ? "#0ca678" : "#94a3b8",
                    boxShadow: creationMode === "auto" ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "6px"
                  }}
                >
                  <Sparkles className="w-4 h-4" strokeWidth={2.4} />
                  {t('linge.new_linen')}
                </button>
                <button
                  type="button"
                  onClick={() => setCreationMode("manual")}
                  style={{
                    flex: 1, padding: "10px", borderRadius: "9px",
                    border: "none", cursor: "pointer",
                    fontWeight: 700, fontSize: "12.5px",
                    transition: "all 0.2s ease",
                    background: creationMode === "manual" ? "white" : "transparent",
                    color: creationMode === "manual" ? "#0ca678" : "#94a3b8",
                    boxShadow: creationMode === "manual" ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "6px"
                  }}
                >
                  <ShieldCheck className="w-4 h-4" strokeWidth={2.4} />
                  {t('linge.existing_linen')}
                </button>
              </div>
            )}

            {/* ─── SECTION : Identification ─── */}
            <FormSection
              icon={<Barcode className="w-4 h-4" strokeWidth={2.4} />}
              title="Identification"
              subtitle="Code-barres et tag RFID"
              accent="#0ea5e9"
            >
              {creationMode === "manual" && !lingeToEdit && (
                <FormField
                  label={t('linge.tracking_code')}
                  required
                  icon={<Barcode size={12} />}
                >
                  <ModernInput
                    type="text"
                    placeholder={t('linge.scan_code_here')}
                    value={newLinge.codebarre}
                    onChange={(e) => setNewLinge({ ...newLinge, codebarre: e.target.value })}
                    required
                  />
                </FormField>
              )}

              {!lingeToEdit && (
                <FormField
                  label={`RFID ${t('common.optional')}`}
                  icon={<Tag size={12} />}
                  hint={t('linge.rfid_optional_hint')}
                >
                  <ModernInput
                    type="text"
                    placeholder={t('linge.scan_rfid_or_leave_empty')}
                    value={newLinge.rfidTag}
                    onChange={(e) => setNewLinge({ ...newLinge, rfidTag: e.target.value })}
                  />
                </FormField>
              )}
            </FormSection>

            {/* ─── SECTION : Caractéristiques ─── */}
            <FormSection
              icon={<Package className="w-4 h-4" strokeWidth={2.4} />}
              title="Caractéristiques"
              subtitle="Catégorie, poids et durée de vie"
              accent="#8b5cf6"
            >
              <FormField
                label={t('linge.category')}
                required
                icon={<Package size={12} />}
              >
                <ModernSelect
                  value={newLinge.categorie}
                  onChange={(e) => {
                    setNewLinge({
                      ...newLinge,
                      categorie: e.target.value,
                      porteurId: e.target.value !== "UNIFORME" ? "" : newLinge.porteurId
                    });
                  }}
                  required
                >
                  <option value="">{t('linge.select_category')}</option>
                  {CATEGORIES.map((cat, i) => (
                    <option key={i} value={cat}>{t(`categories.${cat}`, cat)}</option>
                  ))}
                </ModernSelect>
              </FormField>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <FormField
                  label={t('linge.weight_kg')}
                  required
                  icon={<span style={{ fontSize: "11px" }}>⚖️</span>}
                >
                  <ModernInput
                    type="number"
                    step="0.1"
                    value={newLinge.poids}
                    onChange={(e) => setNewLinge({ ...newLinge, poids: parseFloat(e.target.value) })}
                    required
                  />
                </FormField>

                <FormField
                  label={t('linge.life_cycles')}
                  icon={<Calendar size={12} />}
                >
                  <ModernInput
                    type="number"
                    step="1"
                    min="0"
                    placeholder="—"
                    value={newLinge.dureVie}
                    onChange={(e) => setNewLinge({ ...newLinge, dureVie: e.target.value })}
                  />
                </FormField>
              </div>
            </FormSection>

            {/* ─── SECTION : Affectation ─── */}
            <FormSection
              icon={<UserIcon className="w-4 h-4" strokeWidth={2.4} />}
              title="Affectation"
              subtitle="Service et porteur"
              accent="#10b981"
            >
              <FormField
                label={t('linge.service')}
                required
                icon={<Building2 size={12} />}
              >
                <ModernSelect
                  value={newLinge.serviceId || ""}
                  onChange={(e) => setNewLinge({ ...newLinge, serviceId: parseInt(e.target.value) })}
                  required
                >
                  <option value="">{t('linge.select_service')}</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>{s.code}</option>
                  ))}
                </ModernSelect>
              </FormField>

              {isUniforme && (
                <FormField
                  label={t('linge.carrier')}
                  required
                  icon={<UserIcon size={12} />}
                  hint="Tapez un nom, prénom, matricule ou code-barre pour filtrer"
                >
                  <PersonnelAutocomplete
                    value={newLinge.porteurId || ""}
                    onChange={(id) => setNewLinge({ ...newLinge, porteurId: id })}
                    personnel={personnel}
                    placeholder={t('linge.select_carrier')}
                  />
                </FormField>
              )}
            </FormSection>

            {/* ─── SECTION : État & Notes ─── */}
            <FormSection
              icon={<CheckCircle className="w-4 h-4" strokeWidth={2.4} />}
              title="État & Observations"
              subtitle="Statut actuel et notes"
              accent="#f59e0b"
            >
              <FormField label={t('linge.status')} icon={<span style={{ fontSize: "11px" }}>🎯</span>}>
                <ModernSelect
                  value={newLinge.etat}
                  onChange={(e) => setNewLinge({ ...newLinge, etat: e.target.value })}
                >
                  <option value="SALE">{t('linge_etat.SALE')}</option>
                  <option value="EN_LAVAGE">{t('linge_etat.EN_LAVAGE')}</option>
                  <option value="LAVE">{t('linge_etat.LAVE')}</option>
                  <option value="EN_SECHAGE">{t('linge_etat.EN_SECHAGE')}</option>
                  <option value="SECHE">{t('linge_etat.SECHE')}</option>
                  <option value="PLIE">{t('linge_etat.PLIE')}</option>
                  <option value="COLLE">{t('linge_etat.COLLE')}</option>
                  <option value="STOCKE">{t('linge_etat.STOCKE')}</option>
                  <option value="COLLECTE">{t('linge_etat.COLLECTE')}</option>
                  <option value="LIVRE">{t('linge_etat.LIVRE')}</option>
                  <option value="HORS_SERVICE">{t('linge_etat.HORS_SERVICE')}</option>
                  <option value="EN_TRI">{t('linge_etat.EN_TRI')}</option>
                  <option value="RECEPTION">{t('linge_etat.RECEPTION')}</option>
                  <option value="PROPRE">{t('linge_etat.PROPRE')}</option>
                  <option value="MANQUANT">{t('linge_etat.MANQUANT')}</option>
                </ModernSelect>
              </FormField>

              <FormField label={t('linge.observations')} icon={<FileText size={12} />}>
                <textarea
                  value={newLinge.observations}
                  onChange={(e) => setNewLinge({ ...newLinge, observations: e.target.value })}
                  placeholder={t('linge.observations_placeholder')}
                  style={{
                    width: "100%",
                    minHeight: "80px",
                    padding: "12px 14px",
                    borderRadius: "12px",
                    border: "1.5px solid #e2e8f0",
                    background: "white",
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "#0f172a",
                    outline: "none",
                    resize: "vertical",
                    fontFamily: "inherit",
                    transition: "all 0.2s ease",
                    boxSizing: "border-box"
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#0ea5e9";
                    e.currentTarget.style.boxShadow = "0 0 0 4px rgba(14,165,233,0.12)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#e2e8f0";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </FormField>
            </FormSection>

            {/* ─── Actions ─── */}
            <div style={{
              display: "flex", gap: "10px", marginTop: "20px",
              paddingTop: "18px", borderTop: "1px solid #f1f5f9"
            }}>
              <Button
                variant="outline"
                type="button"
                onClick={() => setShowPopup(false)}
                disabled={isSaving}
                style={{
                  flex: 1, padding: "12px",
                  borderRadius: "12px", fontWeight: 700, fontSize: "13px"
                }}
              >
                {t('common.cancel')}
              </Button>
              <button
                type="submit"
                disabled={isSaving}
                style={{
                  flex: 1.5,
                  padding: "12px",
                  borderRadius: "12px",
                  border: "none",
                  background: lingeToEdit
                    ? "linear-gradient(135deg, #f59e0b, #d97706)"
                    : "linear-gradient(135deg, #0ca678, #059669)",
                  color: "white",
                  fontWeight: 700,
                  fontSize: "13px",
                  cursor: isSaving ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "all 0.2s ease",
                  boxShadow: lingeToEdit
                    ? "0 4px 16px rgba(245,158,11,0.30)"
                    : "0 4px 16px rgba(12,166,120,0.30)",
                  opacity: isSaving ? 0.7 : 1
                }}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.5} />
                    {t('common.saving')}
                  </>
                ) : lingeToEdit ? (
                  <>
                    <Check className="w-4 h-4" strokeWidth={2.6} />
                    {t('common.save')}
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" strokeWidth={2.8} />
                    {t('common.create')}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* ═══════════════════════════════════════════════════════════════════
          MODAL ASSOCIATION RFID — DESIGN MODERNE
      ═══════════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={showRfidPopup}
        onClose={() => {
          setShowRfidPopup(false);
          setRfidCode("");
          setSelectedLingeForRfid(null);
        }}
        title={null}
        size="md"
      >
        <div style={{ marginTop: "-8px" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: "14px",
            paddingBottom: "16px", marginBottom: "18px",
            borderBottom: "1px solid #f1f5f9"
          }}>
            <div style={{
              width: "48px", height: "48px", borderRadius: "14px",
              background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "white",
              boxShadow: "0 6px 16px rgba(139,92,246,0.30)"
            }}>
              <Tag className="w-6 h-6" strokeWidth={2.4} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{
                fontSize: "18px", fontWeight: 800, color: "#0f172a",
                margin: 0, letterSpacing: "-0.02em", lineHeight: 1.2
              }}>
                {t('linge.associate_rfid_tag')}
              </h2>
              <p style={{ fontSize: "12px", color: "#64748b", margin: "3px 0 0", fontWeight: 500 }}>
                Associer un tag RFID à un linge existant
              </p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{
              padding: "14px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #f5f3ff, #ffffff)",
              border: "1px solid #ddd6fe"
            }}>
              <div style={{
                fontSize: "10px", fontWeight: 700, color: "#7c3aed",
                textTransform: "uppercase", letterSpacing: "0.5px",
                marginBottom: "8px"
              }}>
                {t('linge.selected_linen')}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{
                  width: "36px", height: "36px", borderRadius: "10px",
                  background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "white"
                }}>
                  <Package className="w-4 h-4" strokeWidth={2.4} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: "13px", fontWeight: 800, color: "#0f172a",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                  }}>
                    {selectedLingeForRfid?.codebarre || "—"}
                  </div>
                  <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>
                    {selectedLingeForRfid?.categorie || "—"}
                  </div>
                </div>
              </div>
            </div>

            <FormField
              label={`RFID ${t('common.tag')}`}
              required
              icon={<Tag size={12} />}
              hint={t('linge.rfid_scan_hint')}
            >
              <ModernInput
                type="text"
                placeholder={t('linge.scan_or_enter_rfid')}
                value={rfidCode}
                onChange={(e) => setRfidCode(e.target.value)}
                autoFocus
              />
            </FormField>
          </div>

          <div style={{
            display: "flex", gap: "10px", marginTop: "20px",
            paddingTop: "18px", borderTop: "1px solid #f1f5f9"
          }}>
            <Button
              variant="outline"
              onClick={() => {
                setShowRfidPopup(false);
                setRfidCode("");
                setSelectedLingeForRfid(null);
              }}
              type="button"
              style={{
                flex: 1, padding: "12px",
                borderRadius: "12px", fontWeight: 700, fontSize: "13px"
              }}
            >
              {t('common.cancel')}
            </Button>
            <button
              onClick={handleAssocierRfid}
              disabled={!rfidCode.trim()}
              style={{
                flex: 1.5, padding: "12px", borderRadius: "12px", border: "none",
                background: rfidCode.trim()
                  ? "linear-gradient(135deg, #8b5cf6, #7c3aed)"
                  : "linear-gradient(135deg, #cbd5e1, #94a3b8)",
                color: "white", fontWeight: 700, fontSize: "13px",
                cursor: rfidCode.trim() ? "pointer" : "not-allowed",
                display: "flex", alignItems: "center", justifyContent: "center",
                gap: "8px", transition: "all 0.2s ease",
                boxShadow: rfidCode.trim() ? "0 4px 16px rgba(139,92,246,0.30)" : "none",
                opacity: rfidCode.trim() ? 1 : 0.7
              }}
            >
              <Tag className="w-4 h-4" strokeWidth={2.6} />
              {t('linge.associate_rfid')}
            </button>
          </div>
        </div>
      </Modal>

      {/* ═══════════════════════════════════════════════════════════════════
          MODAL DÉTAILS — DESIGN MODERNE
      ═══════════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={!!selectedLingeDetail}
        onClose={() => setSelectedLingeDetail(null)}
        title={null}
        size="lg"
      >
        {selectedLingeDetail && (
          <div style={{ marginTop: "-8px" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: "14px",
              paddingBottom: "16px", marginBottom: "18px",
              borderBottom: "1px solid #f1f5f9"
            }}>
              <div style={{
                width: "52px", height: "52px", borderRadius: "14px",
                background: selectedLingeDetail.categorie === "UNIFORME"
                  ? "linear-gradient(135deg, #3b82f6, #2563eb)"
                  : "linear-gradient(135deg, #14b8a6, #0d9488)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "white",
                boxShadow: selectedLingeDetail.categorie === "UNIFORME"
                  ? "0 6px 16px rgba(59,130,246,0.30)"
                  : "0 6px 16px rgba(20,184,166,0.30)"
              }}>
                <Package className="w-6 h-6" strokeWidth={2.4} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2 style={{
                  fontSize: "18px", fontWeight: 800, color: "#0f172a",
                  margin: 0, letterSpacing: "-0.02em", lineHeight: 1.2
                }}>
                  {t('linge.details')}
                </h2>
                <div style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  marginTop: "4px", flexWrap: "wrap"
                }}>
                  <code style={{
                    fontSize: "11px", fontWeight: 800, color: "#0ea5e9",
                    background: "#ecfeff", padding: "2px 8px",
                    borderRadius: "6px"
                  }}>
                    #{selectedLingeDetail.id}
                  </code>
                  <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>
                    {selectedLingeDetail.codebarre}
                  </span>
                </div>
              </div>
              <div>{getEtatBadge(selectedLingeDetail.etat)}</div>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "12px"
            }}>
              <InfoTile
                icon={<Barcode size={14} />}
                label={t('linge.tracking_code')}
                value={selectedLingeDetail.codebarre}
                accent="#0ea5e9"
              />
              <InfoTile
                icon={<Tag size={14} />}
                label="RFID"
                value={selectedLingeDetail.rfidTag || t('linge.not_associated')}
                accent={selectedLingeDetail.rfidTag ? "#8b5cf6" : "#94a3b8"}
              />
              <InfoTile
                icon={<Package size={14} />}
                label={t('linge.category')}
                value={t(`categories.${selectedLingeDetail.categorie}`, selectedLingeDetail.categorie)}
                accent="#10b981"
              />
              <InfoTile
                icon={<span style={{ fontSize: "13px" }}>⚖️</span>}
                label={t('linge.weight')}
                value={`${selectedLingeDetail.poids} kg`}
                accent="#f59e0b"
              />
              <InfoTile
                icon={<Building2 size={14} />}
                label={t('linge.service')}
                value={getServiceName(selectedLingeDetail.serviceId)}
                accent="#3b82f6"
              />
              <InfoTile
                icon={<Calendar size={14} />}
                label={t('linge.life_cycles')}
                value={selectedLingeDetail.dureVie ? `${selectedLingeDetail.dureVie} ${t('common.cycles')}` : "—"}
                accent="#7c3aed"
              />
              {selectedLingeDetail.porteurId && (
                <InfoTile
                  icon={<UserIcon size={14} />}
                  label={t('linge.carrier')}
                  value={selectedLingeDetail.porteurNom || getPorteurName(selectedLingeDetail.porteurId)}
                  accent="#ec4899"
                  span={2}
                />
              )}
              {selectedLingeDetail.typeCollecte && (
                <InfoTile
                  icon={<FileText size={14} />}
                  label={t('linge.collection_type')}
                  value={selectedLingeDetail.typeCollecte}
                  accent="#06b6d4"
                />
              )}
              {selectedLingeDetail.dateCreation && (
                <InfoTile
                  icon={<Clock size={14} />}
                  label={t('common.creation_date')}
                  value={new Date(selectedLingeDetail.dateCreation).toLocaleString('fr-FR')}
                  accent="#64748b"
                />
              )}
              {selectedLingeDetail.observations && (
                <InfoTile
                  icon={<Edit size={14} />}
                  label={t('linge.observations')}
                  value={selectedLingeDetail.observations}
                  accent="#8b5cf6"
                  span={2}
                />
              )}
            </div>

            <div style={{
              display: "flex", gap: "10px", marginTop: "20px",
              paddingTop: "18px", borderTop: "1px solid #f1f5f9"
            }}>
              <button
                onClick={() => setSelectedLingeDetail(null)}
                style={{
                  flex: 1, padding: "12px", borderRadius: "12px",
                  border: "1.5px solid #e2e8f0", background: "white",
                  color: "#64748b", fontWeight: 700, fontSize: "13px",
                  cursor: "pointer", transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#f8fafc";
                  e.currentTarget.style.borderColor = "#cbd5e1";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "white";
                  e.currentTarget.style.borderColor = "#e2e8f0";
                }}
              >
                {t('common.close')}
              </button>
              <button
                onClick={() => {
                  setSelectedLingeDetail(null);
                  handleEdit(selectedLingeDetail);
                }}
                style={{
                  flex: 1.5, padding: "12px", borderRadius: "12px",
                  border: "none",
                  background: "linear-gradient(135deg, #f59e0b, #d97706)",
                  color: "white", fontWeight: 700, fontSize: "13px",
                  cursor: "pointer", transition: "all 0.2s ease",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  gap: "8px",
                  boxShadow: "0 4px 16px rgba(245,158,11,0.30)"
                }}
              >
                <Edit className="w-4 h-4" strokeWidth={2.6} />
                {t('common.edit')}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ─── MODAL IMPRESSION ───────────────────────────────────────────── */}
      <Modal
        isOpen={!!lingeToPrint}
        onClose={() => setLingeToPrint(null)}
        title={t('linge.created_success')}
        size="md"
      >
        <p className="mb-6">{t('linge.print_label_question')}</p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setLingeToPrint(null)}>
            {t('common.no')}
          </Button>
          <Button
            onClick={() => {
              setSelectedLingeForPrint(lingeToPrint);
              setTimeout(() => handlePrint(), 500);
              setLingeToPrint(null);
            }}
          >
            {t('common.yes_print')}
          </Button>
        </div>
      </Modal>

      {/* ─── MODAL D'IMPORT ─────────────────────────────────────────────── */}
      <LingeImportModal />

      {/* ─── ZONE D'IMPRESSION ──────────────────────────────────────────── */}
      <div className="print-only">
        <BarcodeLabel linge={selectedLingeForPrint} />
      </div>
    </div>
  );
}