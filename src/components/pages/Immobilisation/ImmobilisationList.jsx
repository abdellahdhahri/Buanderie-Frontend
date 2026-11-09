import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  ChevronRight,
  ChevronLeft,
  Package,
  List,
  Weight,
  Calendar,
  Building2,
  X,
  Eye,
  History,
  RefreshCw,
  Printer,
  Tag,
  FileText,
  Download,
  Filter,
  Wrench,
  CalendarDays,
  Euro,
  MapPin,
  User,
  Phone,
  Mail,
  Loader2
} from "lucide-react";
import { Card, CardContent } from "../../ui/card";
import { Modal } from "../../ui/modal";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import { printLabel } from "../../../utils/labels";
import { getSetting } from "../../../utils/appSettings";
import { LabelIcon } from "../../ui/LabelIcon";
import { PageHeaderIcon } from "../../Layout/PageHeaderIcon";
import { SortableHeader } from "../../ui/SortableHeader";
import { useSortableData } from "../../../hooks/useSortableData";
import { DetailModal, FormModal, FormSection } from "../../ui/modal-kit";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

export default function ImmobilisationList() {
  const [immobilisations, setImmobilisations] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImmobilisation, setSelectedImmobilisation] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [pagination, setPagination] = useState({
    page: 0,
    size: Number(getSetting("display.pageSize")) || 10,
    totalPages: 0,
    totalElements: 0,
    first: true,
    last: false
  });

  const [newRec, setNewRec] = useState({
    designation: "",
    marque: "",
    codeBarre: "",
    code: "",
    articleFamilleId: "",
    type: "",
    dateAchat: "",
    prixAchat: "",
    numeroSerie: "",
    fournisseur: "",
    localisation: "",
    responsable: "",
    telephone: "",
    email: "",
    observations: ""
  });

  useEffect(() => {
    fetchImmobilisations();
  }, [pagination.page, pagination.size]);

  const fetchImmobilisations = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/api/sqlserver/machines?page=${pagination.page}&size=${pagination.size}`
      );
      if (response.ok) {
        const data = await response.json();
        setImmobilisations(data.content || []);
        setPagination({
          ...pagination,
          totalPages: data.totalPages || 0,
          totalElements: data.totalElements || 0,
          first: data.first || false,
          last: data.last || false
        });
      } else {
        console.error("Erreur lors du chargement des immobilisations");
        setImmobilisations([]);
      }
    } catch (err) {
      console.error("Erreur réseau:", err);
      setImmobilisations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const goToPage = (page) => {
    if (page >= 0 && page < pagination.totalPages) {
      setPagination({ ...pagination, page });
    }
  };

  const goToFirstPage = () => goToPage(0);
  const goToLastPage = () => goToPage(pagination.totalPages - 1);
  const goToNextPage = () => { if (!pagination.last) goToPage(pagination.page + 1); };
  const goToPreviousPage = () => { if (!pagination.first) goToPage(pagination.page - 1); };

  const changePageSize = (size) => {
    setPagination({ ...pagination, size: parseInt(size), page: 0 });
  };

  const getStatusBadge = (type) => {
    if (!type) return <Badge variant="secondary">Non défini</Badge>;
    const variants = {
      LAVEUSE: { variant: "info", label: "Laveuse" },
      SECHEUSE: { variant: "warning", label: "Sécheuse" },
      REPASSEUSE: { variant: "success", label: "Repasseuse" },
      CALANDRE: { variant: "danger", label: "Calandre" },
      PLIEUSE: { variant: "secondary", label: "Plieuse" },
      EXTRACTEUR: { variant: "info", label: "Extracteur" },
      CHAUFFE_EAU: { variant: "warning", label: "Chauffe-eau" },
      COMPRESSEUR: { variant: "secondary", label: "Compresseur" },
      AUTRE: { variant: "secondary", label: "Autre" }
    };
    const config = variants[type] || { variant: "secondary", label: type };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!newRec.designation || newRec.designation.trim() === "") {
      Swal.fire({
        title: "⚠️ Désignation requise",
        text: "Veuillez saisir une désignation.",
        icon: "warning",
      });
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        designation: newRec.designation.trim(),
        marque: newRec.marque || "",
        codeBarre: newRec.codeBarre || "",
        code: newRec.code || "",
        articleFamilleId: newRec.articleFamilleId || null,
        type: newRec.type || "",
        dateAchat: newRec.dateAchat || null,
        prixAchat: newRec.prixAchat ? parseFloat(newRec.prixAchat) : null,
        numeroSerie: newRec.numeroSerie || "",
        fournisseur: newRec.fournisseur || "",
        localisation: newRec.localisation || "",
        responsable: newRec.responsable || "",
        telephone: newRec.telephone || "",
        email: newRec.email || "",
        observations: newRec.observations || ""
      };

      Swal.fire({
        title: "✅ Enregistré!",
        text: selectedImmobilisation ? "Immobilisation mise à jour avec succès." : "Nouvelle immobilisation créée avec succès.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });

      setIsModalOpen(false);
      fetchImmobilisations();

    } catch (err) {
      console.error("❌ Erreur:", err);
      Swal.fire({
        title: "❌ Erreur",
        text: err.message || "Une erreur est survenue.",
        icon: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const deleteRec = async (id) => {
    const result = await Swal.fire({
      title: "Es-tu sûr?",
      text: "Vous ne pourrez pas annuler cette action!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Oui, supprimer!",
      cancelButtonText: "Annuler",
    });

    if (result.isConfirmed) {
      try {
        setImmobilisations((prev) => prev.filter((r) => r.id !== id));
        Swal.fire({
          title: "✅ Supprimé!",
          text: "Immobilisation supprimée avec succès.",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
        fetchImmobilisations();
      } catch (err) {
        console.error("Erreur suppression:", err);
        Swal.fire({
          title: "❌ Erreur",
          text: err.message || "Erreur lors de la suppression.",
          icon: "error",
        });
      }
    }
  };

  const handleDetailClick = (item) => {
    setSelectedDetail(item);
    setShowDetailModal(true);
  };

  // Étiquette (réglages : Paramètres › Étiquettes)
  const handlePrintCode = (item) => {
    if (!item) return;
    printLabel("immobilisation", item, { t });
  };

  const handleRowClick = (id) => {
    setSelectedId((prev) => (prev === id ? null : id));
  };

  const filteredItems = immobilisations.filter((r) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      r.designation?.toLowerCase().includes(term) ||
      r.code?.toLowerCase().includes(term) ||
      r.codeBarre?.toLowerCase().includes(term) ||
      r.marque?.toLowerCase().includes(term)
    );
  });

  // Tri par colonne (clic sur l'en-tête : croissant → décroissant → aucun)
  const { sortedItems: sortedItems, requestSort, directionFor } = useSortableData(filteredItems);

  const getPageNumbers = () => {
    const pages = [];
    const total = pagination.totalPages;
    const current = pagination.page;
    
    if (total <= 7) {
      for (let i = 0; i < total; i++) pages.push(i);
    } else {
      if (current < 3) {
        for (let i = 0; i < 5; i++) pages.push(i);
        pages.push('...');
        pages.push(total - 1);
      } else if (current > total - 4) {
        pages.push(0);
        pages.push('...');
        for (let i = total - 5; i < total; i++) pages.push(i);
      } else {
        pages.push(0);
        pages.push('...');
        for (let i = current - 1; i <= current + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(total - 1);
      }
    }
    return pages;
  };

  return (
    <div className="relative flex h-full gap-4">
      <motion.div 
        className="transition-all duration-500 ease-in-out w-full"
        animate={{ 
          width: '100%',
          transition: { duration: 0.4, ease: "easeInOut" }
        }}
      >
        <div className="space-y-4">
        <div className="page-head" style={{ marginBottom: "32px" }}>
  <div style={{
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginBottom: "8px"
  }}>
    <PageHeaderIcon size={52} />
    <div>
      <h1 style={{
        fontSize: "28px",
        fontWeight: 800,
        color: "#0f172a",
        margin: 0
      }}>
        Gestion des Immobilisations
      </h1>
      <p style={{
        fontSize: "14px",
        color: "#64748b",
        margin: "2px 0 0 0"
      }}>
        Liste des équipements et machines de la buanderie
      </p>
    </div>
  </div>
</div>

          <div className="flex flex-wrap items-center gap-3 bg-white/65 backdrop-blur-md p-4 rounded-[20px] border border-slate-200/50 shadow-[0_4px_20px_rgba(0,0,0,0.02)] mb-6">
            <button
              onClick={() => {
                setSelectedImmobilisation(null);
                setNewRec({
                  designation: "",
                  marque: "",
                  codeBarre: "",
                  code: "",
                  articleFamilleId: "",
                  type: "",
                  dateAchat: "",
                  prixAchat: "",
                  numeroSerie: "",
                  fournisseur: "",
                  localisation: "",
                  responsable: "",
                  telephone: "",
                  email: "",
                  observations: ""
                });
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#0ca678]/30 rounded-[14px] text-sm font-bold text-[#0ca678] hover:bg-[#0ca678]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" /> Nouvelle Immobilisation
            </button>

            <div style={{ width: "1px", height: "30px", background: "#e2e8f0", margin: "0 8px" }} />

            <button
              disabled={!selectedId}
              onClick={() => {
                if (selectedId) {
                  const item = immobilisations.find(l => l.id === selectedId);
                  if (item) handleDetailClick(item);
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
                  const item = immobilisations.find(l => l.id === selectedId);
                  if (item) handlePrintCode(item);
                }
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#0d9488]/30 rounded-[14px] text-sm font-bold text-[#0d9488] hover:bg-[#0d9488]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
            >
              <LabelIcon className="w-4 h-4" strokeWidth={2.2} /> {t('barcode_label.print')}
            </button>

            <button
              disabled={!selectedId}
              onClick={async () => {
                if (selectedId) {
                  const confirmed = await Swal.fire({
                    title: "Es-tu sûr?",
                    text: "Vous ne pourrez pas annuler cette action!",
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonColor: "#d33",
                    cancelButtonColor: "#3085d6",
                    confirmButtonText: "Oui, supprimer!",
                    cancelButtonText: "Annuler",
                  });
                  if (confirmed.isConfirmed) {
                    deleteRec(selectedId);
                  }
                }
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#e03131]/30 rounded-[14px] text-sm font-bold text-[#e03131] hover:bg-[#e03131]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
            >
              <Trash2 className="w-4 h-4 stroke-[2.5]" /> Supprimer
            </button>

            <button
              onClick={fetchImmobilisations}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-300 rounded-[14px] text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> Actualiser
            </button>
          </div>

          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Rechercher par désignation, code, marque..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <div className="premium-table-wrap">
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th style={{ textAlign: "center" }}>#</th>
                      <SortableHeader direction={directionFor("designation")} onSort={() => requestSort("designation")} align="center">
Désignation
</SortableHeader>
                      <SortableHeader direction={directionFor("code")} onSort={() => requestSort("code")} align="center">
Code
</SortableHeader>
                      <SortableHeader direction={directionFor("marque")} onSort={() => requestSort("marque")} align="center">
Marque
</SortableHeader>
                      <SortableHeader direction={directionFor("type")} onSort={() => requestSort("type")} align="center">
Type
</SortableHeader>
                      <SortableHeader direction={directionFor("codeBarre")} onSort={() => requestSort("codeBarre")} align="center">
Code-barres
</SortableHeader>
                      <th style={{ textAlign: "center" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-muted-foreground">
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Chargement...
                          </div>
                        </td>
                      </tr>
                    ) : sortedItems.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-muted-foreground">
                          {searchTerm ? "Aucune immobilisation correspondante" : "Aucune immobilisation trouvée"}
                        </td>
                      </tr>
                    ) : (
                      sortedItems.map((item, index) => (
                        <tr
                          key={item.id}
                          className={`border-b border-border hover:bg-accent/50 transition-colors ${selectedId === item.id ? 'bg-blue-50' : ''}`}
                          onClick={() => handleRowClick(item.id)}
                        >
                          <td className="text-center py-3 px-4">
                            <span className="text-sm text-slate-400">
                              {pagination.page * pagination.size + index + 1}
                            </span>
                          </td>
                          <td className="text-center py-3 px-4">
                            <div className="font-medium">{item.designation || "N/A"}</div>
                          </td>
                          <td className="text-center py-3 px-4">
                            <div className="text-sm font-mono text-slate-600">
                              {item.code || "N/A"}
                            </div>
                          </td>
                          <td className="text-center py-3 px-4">
                            <span className="text-sm">{item.marque || "N/A"}</span>
                          </td>
                          <td className="text-center py-3 px-4">
                            {getStatusBadge(item.type)}
                          </td>
                          <td className="text-center py-3 px-4">
                            <div className="text-sm font-mono text-slate-600">
                              {item.codeBarre || "N/A"}
                            </div>
                          </td>
                          <td className="text-center py-3 px-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePrintCode(item);
                                }}
                                className="p-2 hover:bg-accent rounded-lg transition-colors"
                                title={t('barcode_label.print')}
                              >
                                <LabelIcon className="w-4 h-4 text-[#0d9488]" strokeWidth={2.2} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDetailClick(item);
                                }}
                                className="p-2 hover:bg-accent rounded-lg transition-colors"
                                title="Voir les détails"
                              >
                                <Eye className="w-4 h-4 text-[#006f94]" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteRec(item.id);
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
            </CardContent>
          </Card>

          {/* Pagination */}
          {pagination.totalPages > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-white rounded-xl border border-slate-200">
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="text-sm text-slate-500 whitespace-nowrap">
                  {pagination.totalElements} immobilisation(s) au total
                </div>
                
                <div className="flex items-center gap-2">
                  <label className="text-sm text-slate-500">Lignes:</label>
                  <select
                    value={pagination.size}
                    onChange={(e) => changePageSize(e.target.value)}
                    className="h-8 px-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-1 flex-wrap justify-center">
                <button
                  onClick={goToFirstPage}
                  disabled={pagination.first || isLoading}
                  className="px-3 py-1 border border-slate-300 rounded-lg text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <ChevronLeft className="w-4 h-4 -ml-2" />
                </button>

                <button
                  onClick={goToPreviousPage}
                  disabled={pagination.first || isLoading}
                  className="px-3 py-1 border border-slate-300 rounded-lg text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex gap-1">
                  {getPageNumbers().map((page, index) => (
                    page === '...' ? (
                      <span key={`ellipsis-${index}`} className="px-2 py-1 text-sm text-slate-400">
                        …
                      </span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => goToPage(page)}
                        disabled={isLoading}
                        className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                          pagination.page === page
                            ? 'bg-blue-600 text-white font-bold shadow-md'
                            : 'border border-slate-300 hover:bg-slate-50'
                        } disabled:opacity-40 disabled:cursor-not-allowed`}
                      >
                        {page + 1}
                      </button>
                    )
                  ))}
                </div>

                <button
                  onClick={goToNextPage}
                  disabled={pagination.last || isLoading}
                  className="px-3 py-1 border border-slate-300 rounded-lg text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                <button
                  onClick={goToLastPage}
                  disabled={pagination.last || isLoading}
                  className="px-3 py-1 border border-slate-300 rounded-lg text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                  <ChevronRight className="w-4 h-4 -ml-2" />
                </button>
              </div>

              <div className="text-sm text-slate-500 whitespace-nowrap">
                Page {pagination.page + 1} / {pagination.totalPages}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Modal Détails */}
      <DetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Détails du matériel"
        subtitle={selectedDetail?.code || undefined}
        heading={selectedDetail?.designation}
        badges={selectedDetail && getStatusBadge(selectedDetail.type)}
        metrics={selectedDetail?.prixAchat ? [{ label: "Prix d'achat", value: `${selectedDetail.prixAchat} €` }] : []}
        sections={selectedDetail ? [
          { title: "Identification", icon: "id", items: [
            { label: "ID", value: selectedDetail.id, mono: true },
            { label: "Code", value: selectedDetail.code, mono: true },
            { label: "Code-barres", value: selectedDetail.codeBarre, mono: true },
            { label: "Numéro de série", value: selectedDetail.numeroSerie, mono: true, hidden: !selectedDetail.numeroSerie },
          ] },
          { title: "Caractéristiques", icon: "specs", items: [
            { label: "Marque", value: selectedDetail.marque },
            { label: "Fournisseur", value: selectedDetail.fournisseur },
            { label: "Localisation", value: selectedDetail.localisation },
            { label: "Date d'achat", value: selectedDetail.dateAchat ? new Date(selectedDetail.dateAchat).toLocaleDateString("fr-FR") : null },
          ] },
          ...(selectedDetail.observations ? [{ title: "Observations", icon: "notes", items: [
            { label: "Observations", value: selectedDetail.observations, span: 2 },
          ] }] : []),
        ] : []}
        actions={selectedDetail && (
          <Button variant="outline" onClick={() => handlePrintCode(selectedDetail)}>
            <LabelIcon className="w-4 h-4 text-[#0d9488]" strokeWidth={2.2} />
            {t('barcode_label.print')}
          </Button>
        )}
      />

      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedImmobilisation ? `Modifier l'immobilisation #${selectedImmobilisation.id}` : "Nouvelle Immobilisation"}
        mode={selectedImmobilisation ? "edit" : "create"}
        size={"lg"}
        onSubmit={handleSave}
        saving={isSaving}
      >
        
          <FormSection title="Informations générales" icon="specs" columns={2}>
            <div className="col-span-2">
              <Input
                label="Désignation *"
                value={newRec.designation}
                onChange={(e) =>
                  setNewRec({ ...newRec, designation: e.target.value })
                }
                placeholder="ex: Laveuse industrielle ABC-2000"
                required
              />
            </div>

            <div>
              <Input
                label="Code"
                value={newRec.code}
                onChange={(e) =>
                  setNewRec({ ...newRec, code: e.target.value.toUpperCase() })
                }
                placeholder="ex: MAC-001"
              />
            </div>

            <div>
              <Input
                label="Code-barres"
                value={newRec.codeBarre}
                onChange={(e) =>
                  setNewRec({ ...newRec, codeBarre: e.target.value })
                }
                placeholder="Code-barres"
              />
            </div>

            <div>
              <Input
                label="Marque"
                value={newRec.marque}
                onChange={(e) =>
                  setNewRec({ ...newRec, marque: e.target.value })
                }
                placeholder="ex: Electrolux"
              />
            </div>

            <div>
              <Input
                label="Numéro de série"
                value={newRec.numeroSerie}
                onChange={(e) =>
                  setNewRec({ ...newRec, numeroSerie: e.target.value })
                }
                placeholder="Numéro de série"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Type</label>
              <select
                value={newRec.type}
                onChange={(e) =>
                  setNewRec({ ...newRec, type: e.target.value })
                }
                className="w-full h-10 px-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Sélectionner un type</option>
                <option value="LAVEUSE">Laveuse</option>
                <option value="SECHEUSE">Sécheuse</option>
                <option value="REPASSEUSE">Repasseuse</option>
                <option value="CALANDRE">Calandre</option>
                <option value="PLIEUSE">Plieuse</option>
                <option value="EXTRACTEUR">Extracteur</option>
                <option value="CHAUFFE_EAU">Chauffe-eau</option>
                <option value="COMPRESSEUR">Compresseur</option>
                <option value="AUTRE">Autre</option>
              </select>
            </div>

            <div>
              <Input
                type="date"
                label="Date d'achat"
                value={newRec.dateAchat}
                onChange={(e) =>
                  setNewRec({ ...newRec, dateAchat: e.target.value })
                }
              />
            </div>

            <div>
              <Input
                type="number"
                label="Prix d'achat (€)"
                value={newRec.prixAchat}
                onChange={(e) =>
                  setNewRec({ ...newRec, prixAchat: e.target.value })
                }
                placeholder="0.00"
                step="0.01"
              />
            </div>

            <div>
              <Input
                label="Fournisseur"
                value={newRec.fournisseur}
                onChange={(e) =>
                  setNewRec({ ...newRec, fournisseur: e.target.value })
                }
                placeholder="Nom du fournisseur"
              />
            </div>

            <div>
              <Input
                label="Localisation"
                value={newRec.localisation}
                onChange={(e) =>
                  setNewRec({ ...newRec, localisation: e.target.value })
                }
                placeholder="ex: Atelier Bâtiment A"
              />
            </div>

            <div>
              <Input
                label="Responsable"
                value={newRec.responsable}
                onChange={(e) =>
                  setNewRec({ ...newRec, responsable: e.target.value })
                }
                placeholder="Nom du responsable"
              />
            </div>

            <div>
              <Input
                label="Téléphone"
                value={newRec.telephone}
                onChange={(e) =>
                  setNewRec({ ...newRec, telephone: e.target.value })
                }
                placeholder="Téléphone"
              />
            </div>

            <div className="col-span-2">
              <Input
                label="Email"
                type="email"
                value={newRec.email}
                onChange={(e) =>
                  setNewRec({ ...newRec, email: e.target.value })
                }
                placeholder="Email"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium mb-2">Observations</label>
              <textarea
                value={newRec.observations}
                onChange={(e) =>
                  setNewRec({ ...newRec, observations: e.target.value })
                }
                placeholder="Observations..."
                className="w-full min-h-[60px] px-3 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </FormSection>


      </FormModal>
    </div>
  );
}