// src/components/machines/MachineList.jsx

import React, { useState } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Barcode,
  RefreshCw,
  MapPin,
  AlertCircle,
  CheckCircle,
  Clock,
  Wrench,
  Upload,
  ChevronLeft,
  ChevronRight,
  Package,
  Filter,
  LayoutGrid,
} from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Modal } from "../../components/ui/modal";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import printJS from "print-js";
import { useMachineContext } from "../../contextes/MachineContext";
import { MachineImportModal } from "./MachineImportModal";

const TYPES_MACHINE = [
  { value: "LAVEUR", label: "🧺 Laveur", icon: "🧺", color: "#2563eb", bg: "#eff6ff" },
  { value: "SECHEUR", label: "🌬️ Sécheur", icon: "🌬️", color: "#d97706", bg: "#fef3c7" },
];

const ETATS_TECHNIQUES = [
  { value: "FONCTIONNEL", label: "Fonctionnel", color: "#10b981", bg: "#d1fae5", icon: <CheckCircle className="w-3 h-3" /> },
  { value: "EN_PANNE", label: "En panne", color: "#ef4444", bg: "#fee2e2", icon: <AlertCircle className="w-3 h-3" /> },
  { value: "EN_MAINTENANCE", label: "En maintenance", color: "#f59e0b", bg: "#fef3c7", icon: <Wrench className="w-3 h-3" /> },
  { value: "HORS_SERVICE", label: "Hors service", color: "#64748b", bg: "#f1f5f9", icon: <AlertCircle className="w-3 h-3" /> },
];

const ETATS_IMMOBILISATION = [
  { value: "DISPONIBLE", label: "Disponible", color: "#10b981", bg: "#d1fae5", icon: <CheckCircle className="w-3 h-3" /> },
  { value: "OCCUPE", label: "Occupé", color: "#3b82f6", bg: "#dbeafe", icon: <Clock className="w-3 h-3" /> },
  { value: "EN_REPARATION", label: "En réparation", color: "#f59e0b", bg: "#fef3c7", icon: <Wrench className="w-3 h-3" /> },
  { value: "IMMOBILISE", label: "Immobilisé", color: "#ef4444", bg: "#fee2e2", icon: <AlertCircle className="w-3 h-3" /> },
];

const CATEGORIES_MACHINE = [
  { value: "LINGES_INFECTE", label: "Linges infectés" },
  { value: "LINGES_NORMAL", label: "Linges normaux" }
];

const TYPE_COLORS = {
  LAVEUR: { bg: "#eff6ff", color: "#2563eb", label: "🧺 Laveur" },
  SECHEUR: { bg: "#fef3c7", color: "#d97706", label: "🌬️ Sécheur" },
  LAVEUR_SECHEUR: { bg: "#f5f3ff", color: "#7c3aed", label: "🧺🌬️ Laveur/Sécheur" }
};

export default function MachineList() {
  const {
    machines,
    isLoading,
    pagination,
    setPagination,
    loadMachines,
    createMachine,
    updateMachine,
    deleteMachine,
    setIsImportModalOpen,
    setImportType, // Nouvelle fonction pour définir le type d'import
  } = useMachineContext();

  const [activeTab, setActiveTab] = useState("LAVEUR");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedMachineDetail, setSelectedMachineDetail] = useState(null);

  const [newRec, setNewRec] = useState({
    reference: "",
    type: "LAVEUR",
    marque: "",
    categorie: "",
    capaciteKg: "",
    code: "",
    etatTechnique: "FONCTIONNEL",
    etatImmobilisation: "DISPONIBLE",
    localisation: "",
    designation: "",
    modele: "",
  });

  // Pagination
  const itemsPerPage = pagination.itemsPerPage || 10;
  const currentPage = pagination.currentPage || 1;
  
  // Filtrer les machines par type et recherche
  const filteredMachines = machines.filter((r) => {
    const matchType = r.type === activeTab;
    const matchSearch = !searchTerm || (
      (r.designation || r.reference || '')?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.code || '')?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.marque || '')?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.modele || '')?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return matchType && matchSearch;
  });

  const totalPages = Math.ceil(filteredMachines.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentMachines = filteredMachines.slice(startIndex, endIndex);

  // Stats par type
  const getStats = (type) => {
    const typeMachines = machines.filter(m => m.type === type);
    const total = typeMachines.length;
    const fonctionnel = typeMachines.filter(m => m.etatTechnique === 'FONCTIONNEL').length;
    const disponible = typeMachines.filter(m => m.etatImmobilisation === 'DISPONIBLE').length;
    return { total, fonctionnel, disponible };
  };

  const laveurStats = getStats('LAVEUR');
  const secheurStats = getStats('SECHEUR');

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  // ─── Ouvrir l'import avec le type actif ──────────────────────────────
  const handleOpenImport = () => {
    setImportType(activeTab);
    setIsImportModalOpen(true);
  };

  // ─── Get Badge État Technique ──────────────────────────────────────────
  const getEtatTechniqueBadge = (etat) => {
    const config = ETATS_TECHNIQUES.find(e => e.value === etat) || { 
      label: etat || 'Inconnu', 
      color: '#64748b', 
      bg: '#f1f5f9',
      icon: null
    };
    return (
      <span 
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
        style={{ background: config.bg, color: config.color, border: `1px solid ${config.color}30` }}
      >
        {config.icon}
        {config.label}
      </span>
    );
  };

  // ─── Get Badge État Immobilisation ────────────────────────────────────
  const getEtatImmobilisationBadge = (etat) => {
    const config = ETATS_IMMOBILISATION.find(e => e.value === etat) || { 
      label: etat || 'Inconnu', 
      color: '#64748b', 
      bg: '#f1f5f9',
      icon: null
    };
    return (
      <span 
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
        style={{ background: config.bg, color: config.color, border: `1px solid ${config.color}30` }}
      >
        {config.icon}
        {config.label}
      </span>
    );
  };

  // ─── Get Type Badge ────────────────────────────────────────────────────
  const getTypeBadge = (type) => {
    const config = TYPE_COLORS[type] || { bg: "#f1f5f9", color: "#64748b", label: type };
    return (
      <Badge style={{ background: config.bg, color: config.color, border: `1px solid ${config.color}30` }}>
        {config.label}
      </Badge>
    );
  };

  // ─── Handle Open Create Modal ──────────────────────────────────────────
  const handleOpenCreateModal = () => {
    setSelectedMachine(null);
    setNewRec({
      reference: "",
      type: activeTab,
      marque: "",
      categorie: "",
      capaciteKg: "",
      code: "",
      etatTechnique: "FONCTIONNEL",
      etatImmobilisation: "DISPONIBLE",
      localisation: "",
      designation: "",
      modele: "",
    });
    setIsModalOpen(true);
  };

  // ─── Handle Open Edit Modal ──────────────────────────────────────────
  const handleOpenEditModal = (machine) => {
    setSelectedMachine(machine);
    setNewRec({
      reference: machine.reference || "",
      type: machine.type || activeTab,
      marque: machine.marque || "",
      categorie: machine.categorie || "",
      capaciteKg: machine.capaciteKg || "",
      code: machine.code || "",
      etatTechnique: machine.etatTechnique || "FONCTIONNEL",
      etatImmobilisation: machine.etatImmobilisation || "DISPONIBLE",
      localisation: machine.localisation || "",
      designation: machine.designation || "",
      modele: machine.modele || "",
    });
    setIsModalOpen(true);
  };

  // ─── Handle Save ──────────────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();

    if (!newRec.reference && !newRec.designation) {
      Swal.fire({ title: "⚠️ Référence ou désignation requise", text: "Veuillez saisir une référence ou une désignation.", icon: "warning" });
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        reference: newRec.reference?.trim() || newRec.designation?.trim(),
        designation: newRec.designation?.trim(),
        modele: newRec.modele?.trim(),
        type: newRec.type || activeTab,
        marque: newRec.marque?.trim(),
        categorie: newRec.categorie || null,
        capaciteKg: parseFloat(newRec.capaciteKg) || 0,
        code: newRec.code?.trim() || undefined,
        etatTechnique: newRec.etatTechnique || "FONCTIONNEL",
        etatImmobilisation: newRec.etatImmobilisation || "DISPONIBLE",
        localisation: newRec.localisation?.trim() || null
      };

      if (selectedMachine) {
        await updateMachine(selectedMachine.id, payload);
        Swal.fire({ title: "✅ Modifié!", text: "Machine mise à jour avec succès.", icon: "success", timer: 1500, showConfirmButton: false });
      } else {
        await createMachine(payload);
        Swal.fire({ title: "✅ Créé!", text: "Nouvelle machine créée avec succès.", icon: "success", timer: 1500, showConfirmButton: false });
      }

      setIsModalOpen(false);
      loadMachines();
    } catch (err) {
      Swal.fire({ title: "❌ Erreur", text: err.message || "Une erreur est survenue.", icon: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Handle Delete ──────────────────────────────────────────────────
  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Es-tu sûr?",
      text: "Cette action supprimera la machine.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Oui, supprimer!",
      cancelButtonText: "Annuler",
    });

    if (result.isConfirmed) {
      try {
        await deleteMachine(id);
        if (selectedId === id) setSelectedId(null);
        Swal.fire({ title: "✅ Supprimé!", text: "Machine supprimée avec succès.", icon: "success", timer: 1500, showConfirmButton: false });
        loadMachines();
      } catch (err) {
        Swal.fire({ title: "❌ Erreur", text: err.message || "Erreur lors de la suppression.", icon: "error" });
      }
    }
  };

  // ─── Handle Row Click ────────────────────────────────────────────────
  const handleRowClick = (id) => {
    setSelectedId((prev) => (prev === id ? null : id));
  };

  // ─── Handle Detail ──────────────────────────────────────────────────
  const handleDetail = (machine) => {
    setSelectedMachineDetail(machine);
    setShowDetailModal(true);
  };

  // ─── Print Code ──────────────────────────────────────────────────────
  const detectFormat = (value) => {
    if (!value) return "code128";
    const cleanValue = value.replace(/\s+/g, "");
    if (/^\d{13}$/.test(cleanValue)) return "ean13";
    if (/^\d{8}$/.test(cleanValue)) return "ean8";
    if (/^\d{12}$/.test(cleanValue)) return "upc";
    return "code128";
  };

  const handlePrintCode = (machine) => {
    if (!machine) return;
    const code = machine.code || machine.reference || machine.designation || `M-${machine.id}`;
    const format = detectFormat(code);
    
    printJS({
      printable: `
        <div style="width:60mm; padding:3mm; font-family:'Courier New',monospace; background:white; text-align:center;">
          <div style="border-bottom:1px solid #ddd; padding-bottom:2mm; margin-bottom:2mm;">
            <div style="font-size:10pt; font-weight:bold; color:#1a1a1a;">CODE MACHINE</div>
            <div style="font-size:8pt; color:#666;">${machine.type || 'N/A'} - ${machine.marque || machine.designation || 'N/A'}</div>
          </div>
          <div style="display:flex; justify-content:center; margin:2mm 0;">
            <img src="https://barcodeapi.org/api/${format}/${encodeURIComponent(code)}" style="height:70px; width:100%; max-width:180px;" alt="Code-barres" />
          </div>
          <div style="font-size:8pt; color:#666; margin-top:2mm; border-top:1px solid #ddd; padding-top:2mm;">
            <div>📦 ${machine.categorie || 'N/A'} · ${machine.capaciteKg || 0} kg</div>
            <div style="font-size:7pt; margin-top:1mm;">
              ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      `,
      type: "raw-html",
      style: "* { margin: 0; padding: 0; box-sizing: border-box; } body { background: white; display: flex; justify-content: center; }",
      documentTitle: `Code_Machine_${machine.code || machine.id}`,
      css: `@page { size: 60mm 45mm; margin: 0; }`
    });
  };

  // Stats du type actif
  const currentStats = activeTab === 'LAVEUR' ? laveurStats : secheurStats;

  return (
    <div className="relative flex h-full gap-4">
      <motion.div className="transition-all duration-500 ease-in-out w-full">
        <div className="space-y-4">
          {/* En-tête */}
          <div style={{ marginBottom: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "8px" }}>
              <div style={{
                width: "52px",
                height: "52px",
                borderRadius: "16px",
                background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                boxShadow: "0 4px 16px rgba(99, 102, 241, 0.25)"
              }}>
                <Package className="w-6 h-6" />
              </div>
              <div>
                <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                  Gestion des Machines
                </h1>
                <p style={{ fontSize: "14px", color: "#64748b", margin: "2px 0 0 0" }}>
                  Gérez les machines, leurs états techniques et immobilisations
                </p>
              </div>
            </div>
          </div>

          {/* Onglets Laveur / Sécheur */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
              {TYPES_MACHINE.map((tab) => {
                const stats = tab.value === 'LAVEUR' ? laveurStats : secheurStats;
                const isActive = activeTab === tab.value;
                return (
                  <button
                    key={tab.value}
                    onClick={() => {
                      setActiveTab(tab.value);
                      setSelectedId(null);
                      setPagination(prev => ({ ...prev, currentPage: 1 }));
                    }}
                    className={`
                      flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200
                      ${isActive 
                        ? 'bg-white shadow-md text-slate-800' 
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                      }
                    `}
                  >
                    <span>{tab.icon}</span>
                    {tab.label}
                    <span className={`
                      ml-1 px-2 py-0.5 rounded-full text-xs font-bold
                      ${isActive ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-500'}
                    `}>
                      {stats.total}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Stats rapides */}
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-green-500" />
                {currentStats.fonctionnel} fonctionnel
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-blue-500" />
                {currentStats.disponible} disponible
              </span>
            </div>
          </div>

          {/* Barre d'outils - Toujours visible en haut */}
          <div className="flex flex-wrap items-center gap-3 bg-white/65 backdrop-blur-md p-4 rounded-[20px] border border-slate-200/50 shadow-[0_4px_20px_rgba(0,0,0,0.02)] mb-4 sticky top-0 z-10">
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#0ca678]/30 rounded-[14px] text-sm font-bold text-[#0ca678] hover:bg-[#0ca678]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" /> Nouvelle Machine
            </button>

            {/* Bouton Importer - Toujours visible avec couleur claire */}
            <button
              onClick={handleOpenImport}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-[14px] text-sm font-bold text-indigo-700 hover:from-indigo-100 hover:to-purple-100 transition-all shadow-[0_2px_8px_rgba(99,102,241,0.15)] hover:shadow-[0_4px_16px_rgba(99,102,241,0.25)] hover:scale-[1.02]"
            >
              <Upload className="w-4 h-4 stroke-[2.5]" /> 
              Importer des {activeTab === 'LAVEUR' ? 'Laveurs' : 'Sécheurs'}
            </button>

            <div style={{ width: "1px", height: "30px", background: "#e2e8f0", margin: "0 8px" }} />

            <button
              disabled={!selectedId}
              onClick={() => {
                if (selectedId) {
                  const machine = machines.find(m => m.id === selectedId);
                  if (machine) handleDetail(machine);
                }
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#006f94]/30 rounded-[14px] text-sm font-bold text-[#006f94] hover:bg-[#006f94]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
            >
              <Eye className="w-4 h-4 stroke-[2.5]" /> Détails
            </button>

            <button
              disabled={!selectedId}
              onClick={() => {
                if (selectedId) {
                  const machine = machines.find(m => m.id === selectedId);
                  if (machine) handlePrintCode(machine);
                }
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#8b5cf6]/30 rounded-[14px] text-sm font-bold text-[#8b5cf6] hover:bg-[#8b5cf6]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
            >
              <Barcode className="w-4 h-4 stroke-[2.5]" /> Code
            </button>

            <button
              disabled={!selectedId}
              onClick={() => handleOpenEditModal(machines.find(m => m.id === selectedId))}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#e67700]/30 rounded-[14px] text-sm font-bold text-[#e67700] hover:bg-[#e67700]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
            >
              <Edit className="w-4 h-4 stroke-[2.5]" /> Modifier
            </button>

            <button
              disabled={!selectedId}
              onClick={() => handleDelete(selectedId)}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#e03131]/30 rounded-[14px] text-sm font-bold text-[#e03131] hover:bg-[#e03131]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
            >
              <Trash2 className="w-4 h-4 stroke-[2.5]" /> Supprimer
            </button>

            <button
              onClick={loadMachines}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-300 rounded-[14px] text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> Actualiser
            </button>
          </div>

          {/* Recherche et filtres */}
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="flex gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder={`Rechercher dans les ${activeTab === 'LAVEUR' ? 'Laveurs' : 'Sécheurs'}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full h-10 pl-10 pr-4 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <LayoutGrid className="w-4 h-4" />
                  <span>{filteredMachines.length} machine(s)</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tableau */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border bg-muted/50">
                    <tr>
                      <th className="text-center py-3 px-4 text-sm font-medium">Code</th>
                      <th className="text-center py-3 px-4 text-sm font-medium">Désignation</th>
                      <th className="text-center py-3 px-4 text-sm font-medium">Marque</th>
                      <th className="text-center py-3 px-4 text-sm font-medium">Modèle</th>
                      <th className="text-center py-3 px-4 text-sm font-medium">Code Barre</th>
                      <th className="text-center py-3 px-4 text-sm font-medium">État Technique</th>
                      <th className="text-center py-3 px-4 text-sm font-medium">Disponibilité</th>
                      <th className="text-center py-3 px-4 text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-muted-foreground">
                          <div className="flex items-center justify-center gap-2">
                            <svg className="animate-spin w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Chargement...
                          </div>
                        </td>
                      </tr>
                    ) : filteredMachines.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-muted-foreground">
                          {searchTerm ? "Aucune machine correspondante" : `Aucun ${activeTab === 'LAVEUR' ? 'laveur' : 'sécheur'} trouvé`}
                        </td>
                      </tr>
                    ) : (
                      currentMachines.map((machine) => (
                        <tr
                          key={machine.id}
                          onClick={() => handleRowClick(machine.id)}
                          className={`border-b border-border hover:bg-accent/50 transition-colors cursor-pointer ${selectedId === machine.id ? 'bg-blue-50' : ''}`}
                        >
                          <td className="text-center py-3 px-4">
                            <div className="font-mono text-sm font-medium text-blue-600">
                              {machine.code || machine.reference || '-'}
                            </div>
                          </td>
                          <td className="text-center py-3 px-4">
                            <div className="font-medium text-sm">
                              {machine.designation || machine.reference || '-'}
                            </div>
                          </td>
                          <td className="text-center py-3 px-4">
                            <span className="text-sm">{machine.marque || '-'}</span>
                          </td>
                          <td className="text-center py-3 px-4">
                            <span className="text-sm">{machine.modele || '-'}</span>
                          </td>
                          <td className="text-center py-3 px-4">
                            <code className="text-xs font-mono bg-slate-100 px-2 py-1 rounded">
                              {machine.code || '-'}
                            </code>
                          </td>
                          <td className="text-center py-3 px-4">
                            {getEtatTechniqueBadge(machine.etatTechnique)}
                          </td>
                          <td className="text-center py-3 px-4">
                            {getEtatImmobilisationBadge(machine.etatImmobilisation)}
                          </td>
                          <td className="text-center py-3 px-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePrintCode(machine);
                                }}
                                className="p-2 hover:bg-accent rounded-lg transition-colors"
                                title="Imprimer le code"
                              >
                                <Barcode className="w-4 h-4 text-[#e67700]" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEditModal(machine);
                                }}
                                className="p-2 hover:bg-accent rounded-lg transition-colors"
                                title="Modifier"
                              >
                                <Edit className="w-4 h-4 text-[#006f94]" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(machine.id);
                                }}
                                className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {filteredMachines.length > 0 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                  <div className="text-sm text-muted-foreground">
                    {startIndex + 1} - {Math.min(endIndex, filteredMachines.length)} sur {filteredMachines.length}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-border hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-8 h-8 rounded-lg transition-colors ${
                            currentPage === pageNum
                              ? 'bg-primary text-primary-foreground'
                              : 'hover:bg-accent'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg border border-border hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Modal d'import */}
      <MachineImportModal />

      {/* Modal Détails */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={`Détails de la machine - ${selectedMachineDetail?.designation || selectedMachineDetail?.reference || 'N/A'}`}
        size="lg"
      >
        {selectedMachineDetail && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ID</label>
              <Input value={selectedMachineDetail.id} disabled />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Code</label>
              <Input value={selectedMachineDetail.code || "-"} disabled />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Désignation</label>
              <Input value={selectedMachineDetail.designation || selectedMachineDetail.reference || "-"} disabled />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <div className="mt-1">{getTypeBadge(selectedMachineDetail.type)}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Marque</label>
              <Input value={selectedMachineDetail.marque || "-"} disabled />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Modèle</label>
              <Input value={selectedMachineDetail.modele || "-"} disabled />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
              <Input value={selectedMachineDetail.categorie || "-"} disabled />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Capacité</label>
              <Input value={`${selectedMachineDetail.capaciteKg || 0} kg`} disabled />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">État Technique</label>
              <div className="mt-1">{getEtatTechniqueBadge(selectedMachineDetail.etatTechnique)}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Disponibilité</label>
              <div className="mt-1">{getEtatImmobilisationBadge(selectedMachineDetail.etatImmobilisation)}</div>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Localisation</label>
              <div className="flex items-center gap-2 p-2 rounded-lg border border-input bg-slate-50">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span>{selectedMachineDetail.localisation || "Non définie"}</span>
              </div>
            </div>
          </div>
        )}
        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="outline"
            onClick={() => {
              if (selectedMachineDetail) handlePrintCode(selectedMachineDetail);
            }}
          >
            <Barcode className="w-4 h-4 mr-2" /> Imprimer code
          </Button>
          <Button onClick={() => setShowDetailModal(false)}>Fermer</Button>
        </div>
      </Modal>

      {/* Modal Formulaire */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedMachine ? `Modifier la machine #${selectedMachine.id}` : `Nouveau ${activeTab === 'LAVEUR' ? 'Laveur' : 'Sécheur'}`}
        size="lg"
      >
        <form onSubmit={handleSave}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input
                label="Désignation *"
                value={newRec.designation}
                onChange={(e) => setNewRec({ ...newRec, designation: e.target.value })}
                placeholder="ex: Lave-linge Miele PW 6243"
              />
            </div>
            <div>
              <Input
                label="Code"
                value={newRec.code}
                onChange={(e) => setNewRec({ ...newRec, code: e.target.value.toUpperCase() })}
                placeholder="Généré automatiquement"
                disabled={!!selectedMachine}
              />
              <p className="text-xs text-slate-400 mt-1">
                {selectedMachine ? "Le code ne peut pas être modifié" : "Laissez vide pour génération automatique"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Type *</label>
              <select
                value={newRec.type}
                onChange={(e) => setNewRec({ ...newRec, type: e.target.value })}
                className="w-full h-10 px-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                required
              >
                {TYPES_MACHINE.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <div>
              <Input
                label="Marque"
                value={newRec.marque}
                onChange={(e) => setNewRec({ ...newRec, marque: e.target.value })}
                placeholder="ex: Miele"
              />
            </div>
            <div>
              <Input
                label="Modèle"
                value={newRec.modele}
                onChange={(e) => setNewRec({ ...newRec, modele: e.target.value })}
                placeholder="ex: PW 6243"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Catégorie</label>
              <select
                value={newRec.categorie}
                onChange={(e) => setNewRec({ ...newRec, categorie: e.target.value })}
                className="w-full h-10 px-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Sélectionner une catégorie</option>
                {CATEGORIES_MACHINE.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div>
              <Input
                type="number"
                label="Capacité (kg)"
                value={newRec.capaciteKg}
                onChange={(e) => setNewRec({ ...newRec, capaciteKg: e.target.value })}
                placeholder="10"
                step="0.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">État Technique</label>
              <select
                value={newRec.etatTechnique}
                onChange={(e) => setNewRec({ ...newRec, etatTechnique: e.target.value })}
                className="w-full h-10 px-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {ETATS_TECHNIQUES.map((etat) => (
                  <option key={etat.value} value={etat.value}>{etat.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Disponibilité</label>
              <select
                value={newRec.etatImmobilisation}
                onChange={(e) => setNewRec({ ...newRec, etatImmobilisation: e.target.value })}
                className="w-full h-10 px-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {ETATS_IMMOBILISATION.map((etat) => (
                  <option key={etat.value} value={etat.value}>{etat.label}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <Input
                label="Localisation"
                value={newRec.localisation}
                onChange={(e) => setNewRec({ ...newRec, localisation: e.target.value })}
                placeholder="ex: Atelier A - Zone Lavage"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setIsModalOpen(false)} type="button" disabled={isSaving}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Enregistrement..." : (selectedMachine ? "Enregistrer" : "Créer")}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}