
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
  Loader2, Upload, Check, CheckSquare, Square, Package 
} from "lucide-react";
import { LingeImportModal } from "./LingeImportModal";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

// ─── MODE TOGGLE ──────────────────────────────────────────────────────────
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
        setPersonnel(Array.isArray(data) ? data : []);
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

      {/* ─── MODAL CRÉATION/MODIFICATION ────────────────────────────────── */}
      <Modal
        isOpen={showPopup}
        onClose={() => setShowPopup(false)}
        title={lingeToEdit ? t('linge.edit_article') : t('linge.new_article')}
        size="lg"
      >
        <form onSubmit={handleSave}>
          {!lingeToEdit && (
            <div className="flex p-1 mb-4 bg-gray-100 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setCreationMode("auto");
                  setNewLinge({ ...newLinge, codebarre: "", rfidTag: "" });
                }}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                  creationMode === "auto"
                    ? "bg-white text-[#0ca678] shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t('linge.new_linen')}
              </button>
              <button
                type="button"
                onClick={() => setCreationMode("manual")}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                  creationMode === "manual"
                    ? "bg-white text-[#0ca678] shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t('linge.existing_linen')}
              </button>
            </div>
          )}

          <div className="space-y-4">
            {creationMode === "manual" && !lingeToEdit && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('linge.tracking_code')}
                </label>
                <Input
                  type="text"
                  placeholder={t('linge.scan_code_here')}
                  value={newLinge.codebarre}
                  onChange={(e) => setNewLinge({ ...newLinge, codebarre: e.target.value })}
                  required
                />
              </div>
            )}

            {!lingeToEdit && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  RFID {t('common.optional')}
                </label>
                <Input
                  type="text"
                  placeholder={t('linge.scan_rfid_or_leave_empty')}
                  value={newLinge.rfidTag}
                  onChange={(e) => setNewLinge({ ...newLinge, rfidTag: e.target.value })}
                />
                <p className="text-xs text-gray-400 mt-1">
                  💡 {t('linge.rfid_optional_hint')}
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('linge.category')} <span className="text-red-500">*</span>
              </label>
              <select
                value={newLinge.categorie}
                onChange={(e) => {
                  setNewLinge({ 
                    ...newLinge, 
                    categorie: e.target.value,
                    porteurId: e.target.value !== "UNIFORME" ? "" : newLinge.porteurId
                  });
                }}
                className="w-full h-10 px-3 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">{t('linge.select_category')}</option>
                {CATEGORIES.map((cat, i) => (
                  <option key={i} value={cat}>{t(`categories.${cat}`, cat)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('linge.weight_kg')} <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                step="0.1"
                value={newLinge.poids}
                onChange={(e) => setNewLinge({ ...newLinge, poids: parseFloat(e.target.value) })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('linge.life_cycles')}
              </label>
              <Input
                type="number"
                step="1"
                min="0"
                placeholder={t('linge.life_cycles_placeholder')}
                value={newLinge.dureVie}
                onChange={(e) => setNewLinge({ ...newLinge, dureVie: e.target.value })}
              />
              <p className="text-xs text-gray-400 mt-1">
                💡 {t('linge.life_cycles_hint')}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('linge.service')} <span className="text-red-500">*</span>
              </label>
              <select
                value={newLinge.serviceId || ""}
                onChange={(e) => setNewLinge({ ...newLinge, serviceId: parseInt(e.target.value) })}
                className="w-full h-10 px-3 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">{t('linge.select_service')}</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>{s.code}</option>
                ))}
              </select>
            </div>

            {isUniforme && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('linge.carrier')} <span className="text-red-500">*</span>
                </label>
                <select
                  value={newLinge.porteurId || ""}
                  onChange={(e) => setNewLinge({ ...newLinge, porteurId: e.target.value ? parseInt(e.target.value) : "" })}
                  className="w-full h-10 px-3 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required={isUniforme}
                >
                  <option value="">{t('linge.select_carrier')}</option>
                  {personnel.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.prenom} {p.nom} - {p.codeBarre}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-blue-500 mt-1">
                  👤 {t('linge.select_carrier_hint')}
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('linge.status')}
              </label>
              <select
                value={newLinge.etat}
                onChange={(e) => setNewLinge({ ...newLinge, etat: e.target.value })}
                className="w-full h-10 px-3 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('linge.observations')}
              </label>
              <textarea
                value={newLinge.observations}
                onChange={(e) => setNewLinge({ ...newLinge, observations: e.target.value })}
                placeholder={t('linge.observations_placeholder')}
                className="w-full min-h-[60px] px-3 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowPopup(false)} type="button" disabled={isSaving}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? t('common.saving') : (lingeToEdit ? t('common.save') : t('common.create'))}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ─── MODAL ASSOCIATION RFID ────────────────────────────────────── */}
      <Modal
        isOpen={showRfidPopup}
        onClose={() => {
          setShowRfidPopup(false);
          setRfidCode("");
          setSelectedLingeForRfid(null);
        }}
        title={t('linge.associate_rfid_tag')}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('linge.selected_linen')}
            </label>
            <Input
              value={selectedLingeForRfid ? `${selectedLingeForRfid.codebarre} - ${selectedLingeForRfid.categorie}` : t('common.none')}
              disabled
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              RFID {t('common.tag')}
            </label>
            <Input
              type="text"
              placeholder={t('linge.scan_or_enter_rfid')}
              value={rfidCode}
              onChange={(e) => setRfidCode(e.target.value)}
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-1">
              {t('linge.rfid_scan_hint')}
            </p>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowRfidPopup(false);
                setRfidCode("");
                setSelectedLingeForRfid(null);
              }}
              type="button"
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleAssocierRfid}
              disabled={!rfidCode.trim()}
            >
              <Tag className="w-4 h-4 mr-2" /> {t('linge.associate_rfid')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ─── MODAL DÉTAILS ──────────────────────────────────────────────── */}
      <Modal
        isOpen={!!selectedLingeDetail}
        onClose={() => setSelectedLingeDetail(null)}
        title={`${t('linge.details')} - #${selectedLingeDetail?.id}`}
        size="lg"
      >
        {selectedLingeDetail && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('common.id')}</label>
              <Input value={selectedLingeDetail.id} disabled />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('linge.tracking_code')}</label>
              <Input value={selectedLingeDetail.codebarre} disabled />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">RFID</label>
              <Input value={selectedLingeDetail.rfidTag || t('linge.not_associated')} disabled />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('linge.category')}</label>
              <Input value={t(`categories.${selectedLingeDetail.categorie}`, selectedLingeDetail.categorie)} disabled />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('linge.weight')}</label>
              <Input value={`${selectedLingeDetail.poids} kg`} disabled />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('linge.status')}</label>
              <div>{getEtatBadge(selectedLingeDetail.etat)}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('linge.collection_type')}</label>
              <Input value={selectedLingeDetail.typeCollecte || t('common.undefined')} disabled />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('linge.life_cycles')}</label>
              <Input value={selectedLingeDetail.dureVie ? `${selectedLingeDetail.dureVie} ${t('common.cycles')}` : t('common.undefined')} disabled />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('linge.service')}</label>
              <Input value={getServiceName(selectedLingeDetail.serviceId)} disabled />
            </div>
            {selectedLingeDetail.porteurId && (
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('linge.carrier')}</label>
                <div className="flex items-center gap-2 p-2 rounded-lg border border-input bg-slate-50">
                  <UserIcon className="w-4 h-4 text-slate-400" />
                  <span>{selectedLingeDetail.porteurNom || getPorteurName(selectedLingeDetail.porteurId)}</span>
                </div>
              </div>
            )}
            {selectedLingeDetail.dateCreation && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('common.creation_date')}</label>
                <Input value={new Date(selectedLingeDetail.dateCreation).toLocaleString('fr-FR')} disabled />
              </div>
            )}
            {selectedLingeDetail.observations && (
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('linge.observations')}</label>
                <Input value={selectedLingeDetail.observations} disabled />
              </div>
            )}
          </div>
        )}
        <div className="flex justify-end mt-6">
          <Button onClick={() => setSelectedLingeDetail(null)}>
            {t('common.close')}
          </Button>
        </div>
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