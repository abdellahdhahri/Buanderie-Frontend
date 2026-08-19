import React, { useContext, useState, useEffect, useRef } from "react";
import { LingeContext, CATEGORIES } from "../../contextes/LingeContext";
import { ServiceContext } from "../../contextes/ServiceContext";
import { FaTrash, FaEye, FaPlus, FaHistory, FaPrint, FaEdit, FaBarcode, FaRss, FaWifi, FaMicrophone } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useModal } from "../../contextes/ModalContext";
import { useReactToPrint } from "react-to-print";
import BarcodeLabel from "./BarcodeLabel";
import "./WorkflowList.css";
import "./LingeList.css";
import { FaSearch } from "react-icons/fa";
import { Modal } from "../../components/ui/modal";
import { Input } from "../../components/ui/input";
import { Select } from "../../components/ui/select";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import printJS from "print-js";
import Swal from 'sweetalert2'
import { Plus, Eye, Trash2, Edit, History, Barcode, RefreshCw, Search, Filter, X, Tag, User as UserIcon, Calendar, Loader2 } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

function ModeToggle({ mode, onChange }) {
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
        <FaBarcode size={16} /> Code-barres
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
  const [filters, setFilters] = useState({
    categorie: "",
    etat: "",
    serviceId: "",
    search: "",
  });

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
    setPagedData
  } = useContext(LingeContext);
  
  const { services } = useContext(ServiceContext);
  const navigate = useNavigate();
  const { showAlert, showConfirm } = useModal();

  const [showPopup, setShowPopup] = useState(false);
  const [selectedLingeForPrint, setSelectedLingeForPrint] = useState(null);
  const [lingeToPrint, setLingeToPrint] = useState(null);
  const [selectedLingeDetail, setSelectedLingeDetail] = useState(null);
  const [lingeToEdit, setLingeToEdit] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [showRfidPopup, setShowRfidPopup] = useState(false);
  const [rfidCode, setRfidCode] = useState("");
  const [selectedLingeForRfid, setSelectedLingeForRfid] = useState(null);
  const [filterService, setFilterService] = useState("");
  const [displayMode, setDisplayMode] = useState(isRfidMode ? "RFID" : "BARCODE");
  const [personnel, setPersonnel] = useState([]);
  const [isPersonnelLoading, setIsPersonnelLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const printRef = React.useRef(null);

  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

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

  // Chargement initial
  useEffect(() => {
    loadPage(0);
  }, []);

  // Recharger quand les filtres changent
  useEffect(() => {
    loadPage(0);
  }, [filters]);

  const handleModeChange = (mode) => {
    const newMode = mode === "RFID";
    setIsRfidMode(newMode);
    setDisplayMode(mode);
    loadPage(0);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < pagedData.totalPages) {
      loadPage(newPage);
    }
  };

  const detectFormat = (value) => {
    if (!value) return "code128";
    const cleanValue = value.replace(/\s+/g, "");
    if (/^\d{13}$/.test(cleanValue)) return "ean13";
    if (/^\d{8}$/.test(cleanValue)) return "ean8";
    if (/^\d{12}$/.test(cleanValue)) return "upc";
    return "code128";
  };

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

  const [creationMode, setCreationMode] = useState("auto");

  useEffect(() => {
    if (!showPopup || creationMode === "auto") return;
    const handleGlobalScan = (e) => {
      if (e.target.tagName === "INPUT" && e.target.placeholder !== "Scanner le code ici...") return;
    };
    document.addEventListener("keydown", handleGlobalScan);
    return () => document.removeEventListener("keydown", handleGlobalScan);
  }, [showPopup, creationMode]);

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

        console.log('📤 Update payload:', JSON.stringify(updatePayload, null, 2));

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
        
        // Mettre à jour la liste locale
        const updatedLinges = (pagedData.content || []).map(l => 
          l.id === updated.id ? updated : l
        );
        setPagedData({ ...pagedData, content: updatedLinges });
        
        setLingeToEdit(null);
        setShowPopup(false);
        loadPage(currentPage);
        
        Swal.fire({
          title: "✅ Modifié!",
          text: "Linge modifié avec succès.",
          icon: "success",
          timer: 1500,
          showConfirmButton: false
        });
        return;
      }

      // ✅ CRÉATION
      if (creationMode === "manual") {
        const codeToCheck = newLinge.codebarre.trim();
        if (!codeToCheck) {
          showAlert("Attention", "Veuillez scanner ou saisir un code de suivi en mode manuel.", "warning");
          setIsSaving(false);
          return;
        }
        if (checkCodeExists) {
          const exists = await checkCodeExists(codeToCheck);
          if (exists) {
            showAlert("Code Existant", `L'article avec le code "${codeToCheck}" existe déjà dans l'inventaire. L'ajout est bloqué.`, "error");
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

      console.log('📤 Payload envoyé:', JSON.stringify(payload, null, 2));

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
        showAlert("Succès", "Article créé avec succès", "success");
      }
    } catch (error) {
      console.error('❌ Erreur:', error);
      showAlert("Erreur", error.message || "Erreur lors de l'opération", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAssocierRfid = async () => {
    if (!selectedLingeForRfid) {
      showAlert("Erreur", "Aucun linge sélectionné.", "error");
      return;
    }
    if (!rfidCode.trim()) {
      showAlert("Attention", "Veuillez saisir un tag RFID.", "warning");
      return;
    }

    try {
      const result = await associerTagRfid(selectedLingeForRfid.codebarre, rfidCode.trim());
      if (result) {
        showAlert("Succès", `✅ Tag RFID associé au linge ${selectedLingeForRfid.codebarre}`, "success");
        setShowRfidPopup(false);
        setRfidCode("");
        setSelectedLingeForRfid(null);
        loadPage(currentPage);
      }
    } catch (error) {
      showAlert("Erreur", `❌ ${error.message || "Erreur lors de l'association RFID"}`, "error");
    }
  };

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
      showAlert("Erreur", "Article non trouvé dans la liste.", "error");
    }
  };

  const handleEdit = (linge) => {
    if (!linge && selectedId) {
      const l = displayedLinges.find(item => item.id === selectedId) ||
                pagedData.content.find(item => item.id === selectedId);
      if (l) {
        linge = l;
      }
    }
    if (!linge) {
      showAlert("Erreur", "Aucun article sélectionné.", "error");
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

  const displayedLinges = pagedData.content || [];
  const selectedLinge = displayedLinges.find((l) => l.id === selectedId);

  const handleRowClick = (id) => {
    setSelectedId((prev) => (prev === id ? null : id));
  };

  const [chambres, setChambres] = useState([]);
  useEffect(() => {
    fetch(`${API_URL}/api/chambres`)
      .then(res => res.json())
      .then(data => {
        const chambresData = Array.isArray(data) ? data : data.content || [];
        setChambres(chambresData);
      })
      .catch(err => console.error("Erreur chambres :", err));
  }, []);

  const resetFilters = () => {
    setFilters({
      categorie: "",
      etat: "",
      serviceId: "",
      search: "",
    });
    setFilterService("");
    loadPage(0);
  };

  // ─── Badges ────────────────────────────────────────────────────────────────
  const getEtatBadge = (etat) => {
    const etatColors = {
      SALE: "danger",
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
      INFECTE_COLLECTE: "danger",
      INFECTE_EN_LAVAGE: "danger",
      INFECTE_LAVE: "danger",
      INFECTE_ECART: "danger",
      PROPRE: "success",
      MANQUANT: "destructive"
    };
    const variant = etatColors[etat] || "secondary";
    return <Badge variant={variant}>{etat}</Badge>;
  };

  // Obtenir le nom du service à partir de l'ID
  const getServiceName = (serviceId) => {
    if (!serviceId) return "Non assigné";
    const service = services.find(s => s.id === serviceId);
    return service ? service.code : "Non assigné";
  };

  const getPorteurName = (porteurId) => {
    if (!porteurId) return "Non assigné";
    const porteur = personnel.find(p => p.id === porteurId);
    if (porteur) {
      return `${porteur.prenom} ${porteur.nom}`;
    }
    return "Non assigné";
  };

  // Vérifier si la catégorie est UNIFORME
  const isUniforme = newLinge.categorie === "UNIFORME";

  return (
    <div className="space-y-8">
      <div className="space-y-2">
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
        {displayMode === "RFID" ? "Gestion des Linges RFID" : "Gestion des Linges"}
      </h1>
      <p style={{
        fontSize: "14px",
        color: "#64748b",
        margin: "2px 0 0 0"
      }}>
        {displayMode === "RFID" 
          ? "Suivi et traçabilité des linges par puce RFID" 
          : "Gestion et suivi des linges"}
      </p>
    </div>
  </div>
</div>
      </div>

      {/* Mode Toggle */}
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
          <Plus className="w-4 h-4 stroke-[2.5]" /> Nouvel Article
        </button>
        <button
          onClick={() => {
            if (!selectedId) {
              showAlert("Sélection", "Veuillez sélectionner un article.", "info");
              return;
            }
            const linge = displayedLinges.find(l => l.id === selectedId) || linges.find(l => l.id === selectedId);
            if (!linge) {
              showAlert("Erreur", "Article non trouvé.", "error");
              return;
            }
            if (linge.rfidTag && linge.rfidTag !== "") {
              showAlert("Attention", "Cet article possède déjà un tag RFID.", "warning");
              return;
            }
            setSelectedLingeForRfid(linge);
            setRfidCode("");
            setShowRfidPopup(true);
          }}
          disabled={!selectedId}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#8b5cf6]/30 rounded-[14px] text-sm font-bold text-[#8b5cf6] hover:bg-[#8b5cf6]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
        >
          <Tag className="w-4 h-4 stroke-[2.5]" /> Associer RFID
        </button>
        <button
          disabled={!selectedId}
          onClick={() => selectedId && handleDetail(selectedId)}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#006f94]/30 rounded-[14px] text-sm font-bold text-[#006f94] hover:bg-[#006f94]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
        >
          <Eye className="w-4 h-4 stroke-[2.5]" /> Détails
        </button>
        <button
          disabled={!selectedId}
          onClick={() => selectedId && handleEdit(selectedLinge)}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#e67700]/30 rounded-[14px] text-sm font-bold text-[#e67700] hover:bg-[#e67700]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
        >
          <Edit className="w-4 h-4 stroke-[2.5]" /> Modifier
        </button>
        <button
          disabled={!selectedId}
          onClick={async () => {
            if (selectedId) {
              const confirmed = await showConfirm("Suppression", "Voulez-vous vraiment supprimer cet article ?", "warning");
              if (confirmed) {
                await deleteLinge(selectedId);
                setSelectedId(null);
                loadPage(currentPage);
              }
            }
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#e03131]/30 rounded-[14px] text-sm font-bold text-[#e03131] hover:bg-[#e03131]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
        >
          <Trash2 className="w-4 h-4 stroke-[2.5]" /> Supprimer
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
          <Barcode className="w-4 h-4 stroke-[2.5]" /> Étiquette
        </button>
        <button
          disabled={!selectedId}
          onClick={() => selectedId && navigate(`/tracking?code=${selectedLinge?.codebarre}`)}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#0ca678]/30 rounded-[14px] text-sm font-bold text-[#0ca678] hover:bg-[#0ca678]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
        >
          <History className="w-4 h-4 stroke-[2.5]" /> Historique
        </button>
        <button
          onClick={() => loadPage(currentPage)}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-300 rounded-[14px] text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
        >
          <RefreshCw className="w-4 h-4" /> Actualiser
        </button>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">État</label>
              <select
                value={filters.etat}
                onChange={(e) => setFilters({ ...filters, etat: e.target.value })}
                className="w-full h-10 px-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Tous</option>
                <option value="SALE">Sale</option>
                <option value="EN_LAVAGE">En lavage</option>
                <option value="LAVE">Lavé</option>
                <option value="EN_SECHAGE">En séchage</option>
                <option value="SECHE">Séché</option>
                <option value="PLIE">Plié</option>
                <option value="COLLE">Collé</option>
                <option value="STOCKE">Stocké</option>
                <option value="COLLECTE">Collecte</option>
                <option value="LIVRE">Livre</option>
                <option value="HORS_SERVICE">Hors service</option>
                <option value="EN_TRI">En tri</option>
                <option value="RECEPTION">Réception</option>
                <option value="PROPRE">Propre</option>
                <option value="MANQUANT">Manquant</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Catégorie</label>
              <select
                value={filters.categorie}
                onChange={(e) => setFilters({ ...filters, categorie: e.target.value })}
                className="w-full h-10 px-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Toutes</option>
                {CATEGORIES.map((cat, i) => (
                  <option key={i} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Service</label>
              <select
                value={filters.serviceId}
                onChange={(e) => setFilters({ ...filters, serviceId: e.target.value })}
                className="w-full h-10 px-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Tous les services</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>{s.code}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Recherche</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Code, chambre, service..."
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
              <Filter className="w-4 h-4 stroke-[2.5]" /> Réinitialiser
            </button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="param-table">
              <thead>
                <tr>
                  <th className="text-center py-3 px-4">ID</th>
                  <th className="text-center py-3 px-4">{displayMode === "RFID" ? "RFID TAG (EPC)" : "Code"}</th>
                  <th className="text-center py-3 px-4">Catégorie</th>
                  <th className="text-center py-3 px-4">Poids</th>
                  <th className="text-center py-3 px-4">État</th>
                  <th className="text-center py-3 px-4">Service</th>
                  <th className="text-center py-3 px-4">Porteur</th>
                  <th className="text-center py-3 px-4">RFID</th>
                  <th className="text-center py-3 px-4 actions-th">Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-muted-foreground">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                      Chargement en cours...
                    </td>
                  </tr>
                ) : displayedLinges.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-muted-foreground">
                      Aucun article trouvé
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
                              <span className="text-muted-foreground text-sm">Non associé</span>
                            )
                          ) : (
                            <code className="tracking-code">{l.codebarre}</code>
                          )}
                        </td>
                        <td className="text-center font-semibold text-slate-800">{l.categorie}</td>
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
      <span className="text-xs text-slate-400">Non assigné</span>
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
                            <Badge variant="secondary" className="text-xs">Non associé</Badge>
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
                              <Eye className="w-4 h-4" /> Détails
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

      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-muted-foreground">
          Affichage de {displayedLinges.length > 0 ? currentPage * 10 + 1 : 0} à {Math.min((currentPage + 1) * 10, pagedData.totalElements)} sur {pagedData.totalElements} articles
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 0 || isLoading}
            onClick={() => handlePageChange(currentPage - 1)}
          >
            Précédent
          </Button>
          <span className="text-sm">
            Page {currentPage + 1} / {pagedData.totalPages || 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= (pagedData.totalPages - 1) || isLoading}
            onClick={() => handlePageChange(currentPage + 1)}
          >
            Suivant
          </Button>
        </div>
      </div>

      {/* ─── Modal Création/Modification ──────────────────────────────────── */}
      <Modal
        isOpen={showPopup}
        onClose={() => setShowPopup(false)}
        title={lingeToEdit ? "Modifier le linge" : "Nouvel Article"}
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
                Nouveau linge
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
                Linge existant
              </button>
            </div>
          )}

          <div className="space-y-4">
            {creationMode === "manual" && !lingeToEdit && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Code de Suivi (Scan)
                </label>
                <Input
                  type="text"
                  placeholder="Scanner le code ici..."
                  value={newLinge.codebarre}
                  onChange={(e) => setNewLinge({ ...newLinge, codebarre: e.target.value })}
                  required
                />
              </div>
            )}

            {!lingeToEdit && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tag RFID <span className="text-xs text-gray-400">(optionnel)</span>
                </label>
                <Input
                  type="text"
                  placeholder="Scanner un tag RFID ou laisser vide..."
                  value={newLinge.rfidTag}
                  onChange={(e) => setNewLinge({ ...newLinge, rfidTag: e.target.value })}
                />
                <p className="text-xs text-gray-400 mt-1">
                  💡 Laissez vide si vous ne souhaitez pas associer de tag RFID
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Catégorie <span className="text-red-500">*</span>
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
                <option value="">Sélectionner une catégorie...</option>
                {CATEGORIES.map((cat, i) => (
                  <option key={i} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Poids (kg) <span className="text-red-500">*</span>
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
                Durée de vie (cycles)
              </label>
              <Input
                type="number"
                step="1"
                min="0"
                placeholder="Nombre de cycles de lavage"
                value={newLinge.dureVie}
                onChange={(e) => setNewLinge({ ...newLinge, dureVie: e.target.value })}
              />
              <p className="text-xs text-gray-400 mt-1">
                💡 Nombre de cycles de lavage estimé pour cet article
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service <span className="text-red-500">*</span>
              </label>
              <select
                value={newLinge.serviceId || ""}
                onChange={(e) => setNewLinge({ ...newLinge, serviceId: parseInt(e.target.value) })}
                className="w-full h-10 px-3 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Sélectionner un service...</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>{s.code}</option>
                ))}
              </select>
            </div>

            {isUniforme && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Porteur <span className="text-red-500">*</span>
                </label>
                <select
                  value={newLinge.porteurId || ""}
                  onChange={(e) => setNewLinge({ ...newLinge, porteurId: e.target.value ? parseInt(e.target.value) : "" })}
                  className="w-full h-10 px-3 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required={isUniforme}
                >
                  <option value="">Sélectionner un porteur...</option>
                  {personnel.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.prenom} {p.nom} - {p.codeBarre}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-blue-500 mt-1">
                  👤 Sélectionnez le personnel porteur de cet uniforme
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                État
              </label>
              <select
                value={newLinge.etat}
                onChange={(e) => setNewLinge({ ...newLinge, etat: e.target.value })}
                className="w-full h-10 px-3 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="SALE">Sale</option>
                <option value="EN_LAVAGE">En lavage</option>
                <option value="LAVE">Lavé</option>
                <option value="EN_SECHAGE">En séchage</option>
                <option value="SECHE">Séché</option>
                <option value="PLIE">Plié</option>
                <option value="COLLE">Collé</option>
                <option value="STOCKE">Stocké</option>
                <option value="COLLECTE">Collecte</option>
                <option value="LIVRE">Livre</option>
                <option value="HORS_SERVICE">Hors service</option>
                <option value="EN_TRI">En tri</option>
                <option value="RECEPTION">Réception</option>
                <option value="PROPRE">Propre</option>
                <option value="MANQUANT">Manquant</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observations
              </label>
              <textarea
                value={newLinge.observations}
                onChange={(e) => setNewLinge({ ...newLinge, observations: e.target.value })}
                placeholder="Observations..."
                className="w-full min-h-[60px] px-3 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowPopup(false)} type="button" disabled={isSaving}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Enregistrement..." : (lingeToEdit ? "Enregistrer" : "Créer")}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Association RFID */}
      <Modal
        isOpen={showRfidPopup}
        onClose={() => {
          setShowRfidPopup(false);
          setRfidCode("");
          setSelectedLingeForRfid(null);
        }}
        title="Associer un tag RFID"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Linge sélectionné
            </label>
            <Input
              value={selectedLingeForRfid ? `${selectedLingeForRfid.codebarre} - ${selectedLingeForRfid.categorie}` : "Aucun"}
              disabled
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tag RFID (EPC)
            </label>
            <Input
              type="text"
              placeholder="Scanner ou saisir le tag RFID..."
              value={rfidCode}
              onChange={(e) => setRfidCode(e.target.value)}
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-1">
              Scannez un tag RFID UHF ou saisissez son code EPC.
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
              Annuler
            </Button>
            <Button
              onClick={handleAssocierRfid}
              disabled={!rfidCode.trim()}
            >
              <Tag className="w-4 h-4 mr-2" /> Associer RFID
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Détails */}
      <Modal
        isOpen={!!selectedLingeDetail}
        onClose={() => setSelectedLingeDetail(null)}
        title={`Détails du linge - #${selectedLingeDetail?.id}`}
        size="lg"
      >
        {selectedLingeDetail && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ID</label>
              <Input value={selectedLingeDetail.id} disabled />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Code Suivi</label>
              <Input value={selectedLingeDetail.codebarre} disabled />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tag RFID</label>
              <Input value={selectedLingeDetail.rfidTag || "Non associé"} disabled />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
              <Input value={selectedLingeDetail.categorie} disabled />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Poids</label>
              <Input value={`${selectedLingeDetail.poids} kg`} disabled />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">État</label>
              <div>{getEtatBadge(selectedLingeDetail.etat)}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type de collecte</label>
              <Input value={selectedLingeDetail.typeCollecte || "Non défini"} disabled />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Durée de vie</label>
              <Input value={selectedLingeDetail.dureVie ? `${selectedLingeDetail.dureVie} cycles` : "Non définie"} disabled />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Service</label>
              <Input value={getServiceName(selectedLingeDetail.serviceId)} disabled />
            </div>
            {selectedLingeDetail.porteurId && (
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Porteur</label>
                <div className="flex items-center gap-2 p-2 rounded-lg border border-input bg-slate-50">
                  <UserIcon className="w-4 h-4 text-slate-400" />
                  <span>{selectedLingeDetail.porteurNom || getPorteurName(selectedLingeDetail.porteurId)}</span>
                </div>
              </div>
            )}
            {selectedLingeDetail.dateCreation && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date de création</label>
                <Input value={new Date(selectedLingeDetail.dateCreation).toLocaleString('fr-FR')} disabled />
              </div>
            )}
            {selectedLingeDetail.observations && (
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Observations</label>
                <Input value={selectedLingeDetail.observations} disabled />
              </div>
            )}
          </div>
        )}
        <div className="flex justify-end mt-6">
          <Button onClick={() => setSelectedLingeDetail(null)}>
            Fermer
          </Button>
        </div>
      </Modal>

      {/* Modal Impression */}
      <Modal
        isOpen={!!lingeToPrint}
        onClose={() => setLingeToPrint(null)}
        title="Linge créé avec succès"
        size="md"
      >
        <p className="mb-6">Voulez-vous imprimer l'étiquette ?</p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setLingeToPrint(null)}>
            Non
          </Button>
          <Button
            onClick={() => {
              setSelectedLingeForPrint(lingeToPrint);
              setTimeout(() => handlePrint(), 500);
              setLingeToPrint(null);
            }}
          >
            Oui, imprimer
          </Button>
        </div>
      </Modal>

      <div className="print-only">
        <BarcodeLabel linge={selectedLingeForPrint} />
      </div>
    </div>
  );
}