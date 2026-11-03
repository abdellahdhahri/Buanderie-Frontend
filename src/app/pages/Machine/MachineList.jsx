
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
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
import { useMachineContext } from "../../contextes/MachineContext";
import { SynchroniserButton } from "../../components/ui/SynchroniserButton";
import { useIntegration } from "../../hooks/useIntegration";
import { formatDateTime } from "../../utils/appSettings";
import BarcodeLabel from "../../components/BarcodeLabel";
import { PageHeaderIcon } from "../../components/layout/PageHeaderIcon";
import { SortableHeader } from "../../components/ui/SortableHeader";
import { useSortableData } from "../../hooks/useSortableData";
import { DetailModal, FormModal, FormSection } from "../../components/ui/modal-kit";

const TYPES_MACHINE = [
  { value: "LAVEUR", label: "🧺 Laveur", icon: "🧺", color: "#2563eb", bg: "#eff6ff" },
  { value: "SECHEUR", label: "🌬️ Sécheur", icon: "🌬️", color: "#d97706", bg: "#fef3c7" },
  { value: "LAVEUR_SECHEUR", label: "🧺🌬️ Laveur/Sécheur", icon: "🧺🌬️", color: "#7c3aed", bg: "#f5f3ff" },
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
  const { t } = useTranslation();

  const {
    machines,
    isLoading,
    pagination,
    setPagination,
    loadMachines,
    createMachine,
    updateMachine,
    deleteMachine,
  } = useMachineContext();
  const { estImporte } = useIntegration();
  const machinesImportees = estImporte("MACHINE");

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

  const itemsPerPage = pagination.itemsPerPage || 10;
  const currentPage = pagination.currentPage || 1;
  
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

  // Tri par colonne (clic sur l'en-tête : croissant → décroissant → aucun)
  const { sortedItems: sortedMachines, requestSort, directionFor } = useSortableData(filteredMachines, {
    code: (m) => m.code || m.reference,
  });
  const currentMachines = sortedMachines.slice(startIndex, endIndex);

  const getStats = (type) => {
    const typeMachines = machines.filter(m => m.type === type);
    const total = typeMachines.length;
    const fonctionnel = typeMachines.filter(m => m.etatTechnique === 'FONCTIONNEL').length;
    const disponible = typeMachines.filter(m => m.etatImmobilisation === 'DISPONIBLE').length;
    return { total, fonctionnel, disponible };
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

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
        {t(`machine_status.${config.value}`, config.label)}
      </span>
    );
  };

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
        {t(`machine_status.${config.value}`, config.label)}
      </span>
    );
  };

  const getTypeBadge = (type) => {
    const config = TYPE_COLORS[type] || { bg: "#f1f5f9", color: "#64748b", label: type };
    return (
      <Badge style={{ background: config.bg, color: config.color, border: `1px solid ${config.color}30` }}>
        {t(`machine_type.${type}`, config.label)}
      </Badge>
    );
  };

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

  const handleOpenEditModal = (machine) => {
    setSelectedMachine(machine);
    setNewRec({
      reference: machine.reference || "",
      type: machine.type || activeTab,
      marque: machine.marque || "",
      categorie: machine.categorie || "",
      capaciteKg: machine.capaciteKg ?? "",
      code: machine.code || "",
      etatTechnique: machine.etatTechnique || "FONCTIONNEL",
      etatImmobilisation: machine.etatImmobilisation || "DISPONIBLE",
      localisation: machine.localisation || "",
      designation: machine.designation || "",
      modele: machine.modele || "",
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!newRec.reference && !newRec.designation) {
      Swal.fire({ 
        title: t('machines.reference_required'), 
        text: t('machines.reference_required_text'), 
        icon: "warning" 
      });
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        reference: newRec.reference?.trim() || newRec.designation?.trim(),
        designation: newRec.designation?.trim(),
        modele: newRec.modele?.trim(),
        type: newRec.type || activeTab,
        marque: newRec.marque?.trim() || null,
        categorie: newRec.categorie || null,
        capaciteKg: newRec.capaciteKg === "" ? null : parseFloat(newRec.capaciteKg),
        code: newRec.code?.trim() || undefined,
        etatTechnique: newRec.etatTechnique || "FONCTIONNEL",
        etatImmobilisation: newRec.etatImmobilisation || "DISPONIBLE",
        localisation: newRec.localisation?.trim() || null
      };

      if (selectedMachine) {
        await updateMachine(selectedMachine.id, payload);
        Swal.fire({ 
          title: "✅", 
          text: t('machines.update_success'), 
          icon: "success", 
          timer: 1500, 
          showConfirmButton: false 
        });
      } else {
        await createMachine(payload);
        Swal.fire({ 
          title: "✅", 
          text: t('machines.create_success'), 
          icon: "success", 
          timer: 1500, 
          showConfirmButton: false 
        });
      }

      setIsModalOpen(false);
      loadMachines();
    } catch (err) {
      Swal.fire({ 
        title: "❌", 
        text: err.message || t('machines.error_text'), 
        icon: "error" 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: t('machines.delete_confirm'),
      text: t('machines.delete_confirm_text'),
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: t('machines.delete_confirm_yes'),
      cancelButtonText: t('machines.delete_confirm_no'),
    });

    if (result.isConfirmed) {
      try {
        await deleteMachine(id);
        if (selectedId === id) setSelectedId(null);
        Swal.fire({ 
          title: "✅", 
          text: t('machines.delete_success'), 
          icon: "success", 
          timer: 1500, 
          showConfirmButton: false 
        });
        loadMachines();
      } catch (err) {
        Swal.fire({ 
          title: "❌", 
          text: err.message || t('machines.error_text'), 
          icon: "error" 
        });
      }
    }
  };

  const handleRowClick = (id) => {
    setSelectedId((prev) => (prev === id ? null : id));
  };

  const handleDetail = (machine) => {
    setSelectedMachineDetail(machine);
    setShowDetailModal(true);
  };

  const currentStats = getStats(activeTab);

  return (
    <div className="relative flex h-full gap-4">
      <motion.div className="transition-all duration-500 ease-in-out w-full">
        <div className="space-y-4">
          <div className="page-head" style={{ marginBottom: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "8px" }}>
              <PageHeaderIcon size={52} />
              <div>
                <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                  {t('machines.title')}
                </h1>
                <p style={{ fontSize: "14px", color: "#64748b", margin: "2px 0 0 0" }}>
                  {t('machines.subtitle')}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
              {TYPES_MACHINE.map((tab) => {
                const stats = getStats(tab.value);
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
                    {t(`machine_type.${tab.value}`, tab.label)}
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

            <div className="flex items-center gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-green-500" />
                {currentStats.fonctionnel} {t('machines.functional')}
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-blue-500" />
                {currentStats.disponible} {t('machines.available')}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 bg-white/65 backdrop-blur-md p-4 rounded-[20px] border border-slate-200/50 shadow-[0_4px_20px_rgba(0,0,0,0.02)] mb-4 sticky top-0 z-10">
            {!machinesImportees && (
              <button
                onClick={handleOpenCreateModal}
                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#0ca678]/30 rounded-[14px] text-sm font-bold text-[#0ca678] hover:bg-[#0ca678]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02]"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" /> {t('machines.new')}
              </button>
            )}

            <SynchroniserButton referentiel="MACHINE" onTermine={loadMachines} />

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
              <Eye className="w-4 h-4 stroke-[2.5]" /> {t('machines.details')}
            </button>

            {selectedId && (
              <BarcodeLabel item={machines.find(m => m.id === selectedId)} type="machine" />
            )}

            <button
              disabled={!selectedId}
              onClick={() => handleOpenEditModal(machines.find(m => m.id === selectedId))}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#e67700]/30 rounded-[14px] text-sm font-bold text-[#e67700] hover:bg-[#e67700]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
            >
              <Edit className="w-4 h-4 stroke-[2.5]" /> {t('common.edit')}
            </button>

            <button
              disabled={!selectedId}
              onClick={() => handleDelete(selectedId)}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#e03131]/30 rounded-[14px] text-sm font-bold text-[#e03131] hover:bg-[#e03131]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
            >
              <Trash2 className="w-4 h-4 stroke-[2.5]" /> {t('common.delete')}
            </button>

            <button
              onClick={loadMachines}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-300 rounded-[14px] text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> {t('common.refresh')}
            </button>
          </div>

          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="flex gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder={t('machines.search_placeholder')}
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

          <Card>
            <CardContent className="p-0">
              <div className="premium-table-wrap">
                <table className="premium-table">
                  <thead>
                    <tr>
                      <SortableHeader direction={directionFor("code")} onSort={() => requestSort("code")} align="center">
{t('machines.code')}
</SortableHeader>
                      <SortableHeader direction={directionFor("designation")} onSort={() => requestSort("designation")} align="center">
{t('machines.designation')}
</SortableHeader>
                      <SortableHeader direction={directionFor("marque")} onSort={() => requestSort("marque")} align="center">
{t('machines.brand')}
</SortableHeader>
                      <SortableHeader direction={directionFor("modele")} onSort={() => requestSort("modele")} align="center">
{t('machines.model')}
</SortableHeader>
                      <SortableHeader direction={directionFor("etatTechnique")} onSort={() => requestSort("etatTechnique")} align="center">
{t('machines.technical_state')}
</SortableHeader>
                      <SortableHeader direction={directionFor("etatImmobilisation")} onSort={() => requestSort("etatImmobilisation")} align="center">
{t('machines.availability')}
</SortableHeader>
                      <th style={{ textAlign: "center" }}>{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-muted-foreground">
                          <div className="flex items-center justify-center gap-2">
                            <svg className="animate-spin w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            {t('common.loading')}
                          </div>
                        </td>
                      </tr>
                    ) : filteredMachines.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-muted-foreground">
                          {searchTerm ? t('machines.no_match') : t('machines.no_data')}
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
                            {machine.source === "EXTERNE" && (
                              <span
                                className="mt-1 inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 ring-1 ring-indigo-200"
                                title={machine.idExterne ? `${t('machines.external_id', 'ID externe')} : ${machine.idExterne}` : undefined}
                              >
                                {t('integration.imported', 'Importé')}
                              </span>
                            )}
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
                            {getEtatTechniqueBadge(machine.etatTechnique)}
                          </td>
                          <td className="text-center py-3 px-4">
                            {getEtatImmobilisationBadge(machine.etatImmobilisation)}
                          </td>
                          <td className="text-center py-3 px-4">
                            <div className="flex items-center justify-center gap-2">
                              <BarcodeLabel item={machine} type="machine" />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEditModal(machine);
                                }}
                                className="p-2 hover:bg-accent rounded-lg transition-colors"
                                title={t('common.edit')}
                              >
                                <Edit className="w-4 h-4 text-[#006f94]" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(machine.id);
                                }}
                                className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                                title={t('common.delete')}
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

      <DetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={t('machines.details')}
        subtitle={selectedMachineDetail?.code || undefined}
        heading={selectedMachineDetail?.designation || selectedMachineDetail?.reference}
        badges={selectedMachineDetail && (
          <>
            {getTypeBadge(selectedMachineDetail.type)}
            {getEtatTechniqueBadge(selectedMachineDetail.etatTechnique)}
            {getEtatImmobilisationBadge(selectedMachineDetail.etatImmobilisation)}
          </>
        )}
        metrics={selectedMachineDetail ? [{ label: t('machines.capacity'), value: `${selectedMachineDetail.capaciteKg || 0} kg` }] : []}
        sections={selectedMachineDetail ? [
          { title: t('modal.identification', 'Identification'), icon: "id", items: [
            { label: "ID", value: selectedMachineDetail.id, mono: true },
            { label: t('machines.code'), value: selectedMachineDetail.code, mono: true },
            { label: t('machines.designation'), value: selectedMachineDetail.designation || selectedMachineDetail.reference },
            { label: t('machines.source', 'Source'), value: selectedMachineDetail.source === "EXTERNE" ? t('integration.imported', 'Importé') : selectedMachineDetail.source, hidden: !selectedMachineDetail.source },
            { label: t('machines.external_id', 'ID externe'), value: selectedMachineDetail.idExterne, mono: true, hidden: !selectedMachineDetail.idExterne },
            { label: t('machines.sync_date', 'Dernière synchronisation'), value: selectedMachineDetail.dateSynchro ? formatDateTime(selectedMachineDetail.dateSynchro) : null, hidden: !selectedMachineDetail.dateSynchro },
          ] },
          { title: t('modal.characteristics', 'Caractéristiques'), icon: "specs", items: [
            { label: t('machines.brand'), value: selectedMachineDetail.marque },
            { label: t('machines.model'), value: selectedMachineDetail.modele },
            { label: t('machines.category'), value: selectedMachineDetail.categorie },
          ] },
          { title: t('machines.location'), icon: "location", items: [
            { label: t('machines.location'), value: selectedMachineDetail.localisation, span: 2 },
          ] },
        ] : []}
        actions={selectedMachineDetail && <BarcodeLabel item={selectedMachineDetail} type="machine" />}
        onEdit={selectedMachineDetail ? () => { setShowDetailModal(false); handleOpenEditModal(selectedMachineDetail); } : undefined}
      />

      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedMachine ? `${t('machines.edit')} #${selectedMachine.id}` : `${t('machines.new')} ${activeTab === 'LAVEUR' ? t('machines.laveur') : activeTab === 'SECHEUR' ? t('machines.secheur') : t(`machine_type.${activeTab}`, TYPE_COLORS[activeTab].label)}`}
        mode={selectedMachine ? "edit" : "create"}
        size={"lg"}
        onSubmit={handleSave}
        saving={isSaving}
      >
        
          <FormSection title={t('modal.general_info', 'Informations générales')} icon="specs" columns={2}>
            <div>
              <Input
                label={`${t('machines.designation')} *`}
                value={newRec.designation}
                onChange={(e) => setNewRec({ ...newRec, designation: e.target.value })}
                placeholder={t('machines.designation_placeholder')}
              />
            </div>
            <div>
              <Input
                label={t('machines.code')}
                value={newRec.code}
                onChange={(e) => setNewRec({ ...newRec, code: e.target.value.toUpperCase() })}
                placeholder={t('machines.code_placeholder')}
                disabled={!!selectedMachine}
              />
              <p className="text-xs text-slate-400 mt-1">
                {selectedMachine ? t('machines.code_disabled') : t('machines.code_auto')}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t('machines.type')} *</label>
              <select
                value={newRec.type}
                onChange={(e) => setNewRec({ ...newRec, type: e.target.value })}
                className="w-full h-10 px-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                required
              >
                {TYPES_MACHINE.map((type) => (
                  <option key={type.value} value={type.value}>
                    {t(`machine_type.${type.value}`, type.label)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Input
                label={t('machines.brand')}
                value={newRec.marque}
                onChange={(e) => setNewRec({ ...newRec, marque: e.target.value })}
                placeholder={t('machines.brand_placeholder')}
              />
            </div>
            <div>
              <Input
                label={t('machines.model')}
                value={newRec.modele}
                onChange={(e) => setNewRec({ ...newRec, modele: e.target.value })}
                placeholder={t('machines.model_placeholder')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t('machines.category')}</label>
              <select
                value={newRec.categorie}
                onChange={(e) => setNewRec({ ...newRec, categorie: e.target.value })}
                className="w-full h-10 px-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">{t('machines.select_category')}</option>
                {CATEGORIES_MACHINE.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {t(`machine_category.${cat.value}`, cat.label)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Input
                type="number"
                label={t('machines.capacity')}
                value={newRec.capaciteKg}
                onChange={(e) => setNewRec({ ...newRec, capaciteKg: e.target.value })}
                placeholder={t('machines.capacity_placeholder')}
                step="0.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t('machines.technical_state')}</label>
              <select
                value={newRec.etatTechnique}
                onChange={(e) => setNewRec({ ...newRec, etatTechnique: e.target.value })}
                className="w-full h-10 px-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {ETATS_TECHNIQUES.map((etat) => (
                  <option key={etat.value} value={etat.value}>
                    {t(`machine_status.${etat.value}`, etat.label)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t('machines.availability')}</label>
              <select
                value={newRec.etatImmobilisation}
                onChange={(e) => setNewRec({ ...newRec, etatImmobilisation: e.target.value })}
                className="w-full h-10 px-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {ETATS_IMMOBILISATION.map((etat) => (
                  <option key={etat.value} value={etat.value}>
                    {t(`machine_status.${etat.value}`, etat.label)}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <Input
                label={t('machines.location')}
                value={newRec.localisation}
                onChange={(e) => setNewRec({ ...newRec, localisation: e.target.value })}
                placeholder={t('machines.location_placeholder')}
              />
            </div>
          </FormSection>

      </FormModal>
    </div>
  );
}