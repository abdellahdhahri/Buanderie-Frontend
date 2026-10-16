import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  ChevronRight,
  ChevronDown,
  Package,
  X,
  Eye,
  History,
  RefreshCw,
  Building2,
  Loader2
} from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Modal } from "../../components/ui/modal";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import { printLabel } from "../../utils/labels";
import { LabelIcon } from "../../components/ui/LabelIcon";
import { PageHeaderIcon } from "../../components/layout/PageHeaderIcon";
import { SortableHeader } from "../../components/ui/SortableHeader";
import { useSortableData } from "../../hooks/useSortableData";
import { DetailModal, FormModal, FormSection } from "../../components/ui/modal-kit";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

function ArsenalListInner() {
  const { t } = useTranslation();
  
  const [arsenals, setArsenals] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedArsenal, setSelectedArsenal] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [arsenalLinges, setArsenalLinges] = useState([]);
  const [isLingesLoading, setIsLingesLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedLingeDetail, setSelectedLingeDetail] = useState(null);
  const [services, setServices] = useState([]);
  const [newRec, setNewRec] = useState({ code: "", nom: "", serviceId: "" });

  // ─── Fetch ────────────────────────────────────────────────────────────────
  const fetchServices = async () => {
    try {
      const response = await fetch(`${API_URL}/api/sqlserver/services?page=0&size=50`);
      if (response.ok) {
        const data = await response.json();
        const list = data.content || data._embedded?.services || data;
        setServices(Array.isArray(list) ? list : []);
      }
    } catch (err) {
      console.error(err);
      setServices([]);
    }
  };

  const fetchArsenals = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/Arsenals`);
      if (response.ok) {
        const data = await response.json();
        setArsenals(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchArsenals();
    fetchServices();
  }, []);

  // ─── Fetch linges ─────────────────────────────────────────────────────────
  const fetchArsenalLinges = useCallback(async (arsenalId) => {
    setIsLingesLoading(true);
    setArsenalLinges([]);
    try {
      const response = await fetch(`${API_URL}/api/Arsenals/arsenals/${arsenalId}/linges`);
      if (response.ok) {
        const data = await response.json();
        setArsenalLinges(Array.isArray(data) ? data : data.content || []);
      } else {
        setArsenalLinges([]);
      }
    } catch (err) {
      console.error(err);
      setArsenalLinges([]);
    } finally {
      setIsLingesLoading(false);
    }
  }, []);

  // ─── Toggle accordéon ─────────────────────────────────────────────────────
  const toggleExpand = useCallback((arsenal) => {
    if (expandedId === arsenal.id) {
      setExpandedId(null);
      setSelectedId(null);
      setArsenalLinges([]);
    } else {
      setExpandedId(arsenal.id);
      setSelectedArsenal(arsenal);
      setSelectedId(null);
      fetchArsenalLinges(arsenal.id);
    }
  }, [expandedId, fetchArsenalLinges]);

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const getEtatLingeBadge = useCallback((etat) => {
    if (!etat) return <Badge variant="secondary">{t('arsenal.status_undefined')}</Badge>;
    const variants = {
      COLLECTE: { variant: "warning", label: t('linge_etat.COLLECTE') },
      EN_LAVAGE: { variant: "info", label: t('linge_etat.EN_LAVAGE') },
      PROPRE_PRET: { variant: "success", label: t('linge_etat.PROPRE_PRET') },
      RECEPTIONNE: { variant: "success", label: t('linge_etat.RECEPTIONNE') },
      DISTRIBUE: { variant: "success", label: t('linge_etat.DISTRIBUE') },
      EN_SECHAGE_REPASSAGE: { variant: "info", label: t('linge_etat.EN_SECHAGE_REPASSAGE') },
      STOCKE: { variant: "secondary", label: t('linge_etat.STOCKE') },
      PRET_LIVRAISON: { variant: "success", label: t('linge_etat.PRET_LIVRAISON') },
      EN_TRI: { variant: "info", label: t('linge_etat.EN_TRI') },
      LAVE: { variant: "success", label: t('linge_etat.LAVE') },
      SECHE: { variant: "success", label: t('linge_etat.SECHE') },
      SALE: { variant: "destructive", label: t('linge_etat.SALE') },
    };
    const config = variants[etat] || { variant: "secondary", label: etat };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  }, [t]);

  const getServiceName = useCallback((serviceId) => {
    if (!serviceId || !Array.isArray(services)) return t('arsenal.unassigned');
    const service = services.find(s => s.id === serviceId);
    return service ? service.code : t('arsenal.unassigned');
  }, [services, t]);

  // ─── CRUD ─────────────────────────────────────────────────────────────────
  const handleOpenCreateModal = useCallback(() => {
    setSelectedArsenal(null);
    setNewRec({
      code: "",
      nom: "",
      serviceId: Array.isArray(services) && services.length > 0 ? services[0].id : ""
    });
    setIsModalOpen(true);
  }, [services]);

  const handleOpenEditModal = useCallback((arsenal) => {
    setSelectedArsenal(arsenal);
    setNewRec({
      code: arsenal.code || "",
      nom: arsenal.nom || "",
      serviceId: arsenal.serviceId || ""
    });
    setIsModalOpen(true);
  }, []);

  const handleSave = useCallback(async (e) => {
    e.preventDefault();
    if (!newRec.nom?.trim()) {
      Swal.fire({ 
        title: t('arsenal.errors.name_required'), 
        text: t('arsenal.errors.name_required_text'), 
        icon: "warning" 
      });
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        code: newRec.code?.trim() || undefined,
        nom: newRec.nom.trim(),
        serviceId: newRec.serviceId ? parseInt(newRec.serviceId) : null
      };
      const url = selectedArsenal
        ? `${API_URL}/api/Arsenals/${selectedArsenal.id}`
        : `${API_URL}/api/Arsenals`;
      const method = selectedArsenal ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      const data = await response.json();
      if (selectedArsenal) {
        setArsenals(prev => prev.map(r => r.id === data.id ? data : r));
        Swal.fire({ 
          title: t('arsenal.success.updated'), 
          icon: "success", 
          timer: 1500, 
          showConfirmButton: false 
        });
      } else {
        setArsenals(prev => [data, ...prev]);
        Swal.fire({ 
          title: t('arsenal.success.created'), 
          icon: "success", 
          timer: 1500, 
          showConfirmButton: false 
        });
      }
      setIsModalOpen(false);
      fetchArsenals();
    } catch (err) {
      Swal.fire({ title: t('common.error'), text: err.message, icon: "error" });
    } finally {
      setIsSaving(false);
    }
  }, [selectedArsenal, newRec, t]);

  const deleteRec = useCallback(async (id) => {
    const result = await Swal.fire({
      title: t('arsenal.delete_confirm_title'),
      text: t('arsenal.delete_confirm_text'),
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: t('arsenal.delete_confirm_yes'),
      cancelButtonText: t('common.cancel'),
    });
    if (result.isConfirmed) {
      try {
        const response = await fetch(`${API_URL}/api/Arsenals/${id}`, { method: "DELETE" });
        if (response.ok) {
          setArsenals(prev => prev.filter(r => r.id !== id));
          if (expandedId === id) {
            setExpandedId(null);
            setArsenalLinges([]);
          }
          Swal.fire({ 
            title: t('arsenal.success.deleted'), 
            icon: "success", 
            timer: 1500, 
            showConfirmButton: false 
          });
        }
      } catch (err) {
        Swal.fire({ title: t('common.error'), text: err.message, icon: "error" });
      }
    }
  }, [expandedId, t]);

  const handleDetailLinge = useCallback((linge) => {
    setSelectedLingeDetail(linge);
    setShowDetailModal(true);
  }, []);

  // ─── Impression ───────────────────────────────────────────────────────────

  // Étiquette (réglages : Paramètres › Étiquettes)
  const handlePrintArsenalCode = useCallback((arsenal) => {
    if (!arsenal) return;
    printLabel("arsenal", { ...arsenal, serviceNom: getServiceName(arsenal.serviceId) }, { t });
  }, [getServiceName, t]);

  // ─── Filtrage ─────────────────────────────────────────────────────────────
  const filteredArsenals = useMemo(() => {
    if (!searchTerm) return arsenals;
    const term = searchTerm.toLowerCase();
    return arsenals.filter(r =>
      r.code?.toLowerCase().includes(term) || r.nom?.toLowerCase().includes(term)
    );
  }, [arsenals, searchTerm]);

  // Tri par colonne (clic sur l'en-tête : croissant → décroissant → aucun)
  const { sortedItems: sortedArsenals, requestSort, directionFor } = useSortableData(filteredArsenals, {
    service: (a) => getServiceName(a.serviceId),
  });

  return (
    <div className="space-y-4">
      <div style={{ marginBottom: "32px" }}>
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
              {t('arsenal.title')}
            </h1>
            <p style={{
              fontSize: "14px",
              color: "#64748b",
              margin: "2px 0 0 0"
            }}>
              {t('arsenal.subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 bg-white/65 backdrop-blur-md p-4 rounded-[20px] border border-slate-200/50 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#0ca678]/30 rounded-[14px] text-sm font-bold text-[#0ca678] hover:bg-[#0ca678]/5 transition-all"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" /> {t('arsenal.new')}
        </button>

        <div className="w-px h-8 bg-slate-200 mx-1" />

        <button
          disabled={!expandedId}
          onClick={() => selectedArsenal && handlePrintArsenalCode(selectedArsenal)}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#0d9488]/30 rounded-[14px] text-sm font-bold text-[#0d9488] hover:bg-[#0d9488]/5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <LabelIcon className="w-4 h-4" strokeWidth={2.2} /> {t('arsenal.print_code')}
        </button>

        <button
          disabled={!selectedId}
          onClick={() => {
            const linge = arsenalLinges.find(l => l.id === selectedId);
            if (linge) handleDetailLinge(linge);
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#006f94]/30 rounded-[14px] text-sm font-bold text-[#006f94] hover:bg-[#006f94]/5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Eye className="w-4 h-4 stroke-[2.5]" /> {t('arsenal.details_linge')}
        </button>

        <button
          disabled={!selectedId}
          onClick={() => {
            const linge = arsenalLinges.find(l => l.id === selectedId);
            if (linge) window.location.href = `/tracking?code=${linge.codeBarre}`;
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#0ca678]/30 rounded-[14px] text-sm font-bold text-[#0ca678] hover:bg-[#0ca678]/5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <History className="w-4 h-4 stroke-[2.5]" /> {t('arsenal.history')}
        </button>

        <button
          disabled={!expandedId}
          onClick={() => selectedArsenal && handleOpenEditModal(selectedArsenal)}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#006f94]/30 rounded-[14px] text-sm font-bold text-[#006f94] hover:bg-[#006f94]/5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Edit className="w-4 h-4 stroke-[2.5]" /> {t('common.edit')}
        </button>

        <button
          disabled={!expandedId}
          onClick={() => expandedId && deleteRec(expandedId)}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#e03131]/30 rounded-[14px] text-sm font-bold text-[#e03131] hover:bg-[#e03131]/5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Trash2 className="w-4 h-4 stroke-[2.5]" /> {t('common.delete')}
        </button>

        <button
          onClick={fetchArsenals}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-300 rounded-[14px] text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} /> {t('common.refresh')}
        </button>
      </div>

      {/* Recherche */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder={t('arsenal.search_placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </CardContent>
      </Card>

      {/* ─── Tableau avec accordéon ─────────────────────────────────────────── */}
      <Card>
        <CardContent className="p-0">
          <div className="premium-table-wrap">
            <table className="premium-table">
              <thead>
                <tr>
                  <th style={{ width: 56 }} />
                  <SortableHeader direction={directionFor("code")} onSort={() => requestSort("code")} align="center">
{t('arsenal.code')}
</SortableHeader>
                  <SortableHeader direction={directionFor("nom")} onSort={() => requestSort("nom")} align="center">
{t('arsenal.name')}
</SortableHeader>
                  <SortableHeader direction={directionFor("service")} onSort={() => requestSort("service")} align="center">
{t('arsenal.service')}
</SortableHeader>
                  <th style={{ textAlign: "center" }}>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {t('common.loading')}
                      </div>
                    </td>
                  </tr>
                ) : sortedArsenals.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-muted-foreground">
                      {searchTerm ? t('arsenal.no_match') : t('arsenal.no_data')}
                    </td>
                  </tr>
                ) : (
                  sortedArsenals.map((arsenal) => {
                    const isExpanded = expandedId === arsenal.id;

                    return (
                      <React.Fragment key={arsenal.id}>
                        {/* Ligne principale */}
                        <tr
                          className={`border-b border-border transition-colors ${
                            isExpanded ? "bg-blue-50/70" : "hover:bg-accent/50"
                          }`}
                        >
                          <td className="text-center py-3 px-4">
                            <button
                              onClick={() => toggleExpand(arsenal)}
                              className="p-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                              title={isExpanded ? t('arsenal.hide_linens') : t('arsenal.show_linens')}
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-5 h-5 text-blue-600" />
                              ) : (
                                <ChevronRight className="w-5 h-5 text-slate-400" />
                              )}
                            </button>
                          </td>
                          <td className="text-center py-3 px-4">
                            <div className="font-mono text-sm font-medium text-blue-600">
                              {arsenal.code || `ARS-${arsenal.id}`}
                            </div>
                          </td>
                          <td className="text-center py-3 px-4">
                            <div className="font-medium">{arsenal.nom}</div>
                          </td>
                          <td className="text-center py-3 px-4">
                            <div className="flex items-center justify-center gap-2">
                              <Building2 className="w-4 h-4 text-slate-400" />
                              <span className="text-sm">{getServiceName(arsenal.serviceId)}</span>
                            </div>
                          </td>
                          <td className="text-center py-3 px-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePrintArsenalCode(arsenal);
                                }}
                                className="p-2 hover:bg-accent rounded-lg transition-colors"
                                title={t('arsenal.print_code')}
                              >
                                <LabelIcon className="w-4 h-4 text-[#0d9488]" strokeWidth={2.2} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEditModal(arsenal);
                                }}
                                className="p-2 hover:bg-accent rounded-lg transition-colors"
                                title={t('common.edit')}
                              >
                                <Edit className="w-4 h-4 text-[#006f94]" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteRec(arsenal.id);
                                }}
                                className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                                title={t('common.delete')}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* ─── Lignes des linges (accordéon) ───────────────── */}
                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <tr>
                              <td colSpan={5} className="p-0 border-b border-blue-100">
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                                  className="overflow-hidden"
                                >
                                  <div className="bg-gradient-to-b from-blue-50/80 to-slate-50/50 px-6 py-4">
                                    {/* En-tête de la section linges */}
                                    <div className="flex items-center justify-between mb-3">
                                      <div className="flex items-center gap-2">
                                        <Package className="w-4 h-4 text-blue-600" />
                                        <span className="text-sm font-semibold text-slate-700">
                                          {t('arsenal.linens_of')}
                                        </span>
                                        <Badge variant="outline" className="bg-white text-xs">
                                          {isLingesLoading
                                            ? "..."
                                            : `${arsenalLinges.length} ${t('arsenal.items')}`}
                                        </Badge>
                                      </div>
                                    </div>

                                    {/* Contenu */}
                                    {isLingesLoading ? (
                                      <div className="flex items-center justify-center py-8 gap-2 text-slate-400">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span className="text-sm">{t('common.loading')}</span>
                                      </div>
                                    ) : arsenalLinges.length === 0 ? (
                                      <div className="text-center py-8 text-slate-400">
                                        <Package className="w-10 h-10 mx-auto opacity-30 mb-2" />
                                        <p className="text-sm">{t('arsenal.no_linens')}</p>
                                      </div>
                                    ) : (
                                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {arsenalLinges.map((linge) => (
                                          <div
                                            key={linge.id}
                                            onClick={() => setSelectedId(prev => prev === linge.id ? null : linge.id)}
                                            className={`p-3 rounded-xl border cursor-pointer transition-all ${
                                              selectedId === linge.id
                                                ? "bg-white border-blue-400 shadow-md ring-1 ring-blue-200"
                                                : "bg-white/80 border-slate-200 hover:border-blue-300 hover:shadow-sm"
                                            }`}
                                          >
                                            <div className="flex items-start justify-between gap-2">
                                              <div className="flex items-center gap-2.5 min-w-0">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                                  selectedId === linge.id ? "bg-blue-100" : "bg-slate-100"
                                                }`}>
                                                  <Package className={`w-4 h-4 ${
                                                    selectedId === linge.id ? "text-blue-600" : "text-slate-500"
                                                  }`} />
                                                </div>
                                                <div className="min-w-0">
                                                  <p className="font-medium text-sm truncate">
                                                    {linge.codeBarre || linge.codeSuivi || "N/A"}
                                                  </p>
                                                  <p className="text-xs text-slate-500 truncate">
                                                    {linge.categorie || t('arsenal.uncategorized')}
                                                  </p>
                                                </div>
                                              </div>
                                              <div className="text-right flex-shrink-0">
                                                {getEtatLingeBadge(linge.etat)}
                                                <p className="text-[11px] text-slate-400 mt-1">
                                                  {linge.poids || 0} kg
                                                </p>
                                              </div>
                                            </div>

                                            {linge.rfidTag && (
                                              <p className="mt-2 text-[11px] text-purple-500 font-mono truncate">
                                                RFID: {linge.rfidTag}
                                              </p>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              </td>
                            </tr>
                          )}
                        </AnimatePresence>
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ─── Modal Détails Linge ────────────────────────────────────────────── */}
      <DetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={t('arsenal.linen_details')}
        subtitle={selectedArsenal?.nom ? `${t('arsenal.arsenal')} · ${selectedArsenal.nom}` : undefined}
        heading={selectedLingeDetail?.codeBarre}
        badges={selectedLingeDetail && getEtatLingeBadge(selectedLingeDetail.etat)}
        metrics={selectedLingeDetail ? [{ label: t('common.weight'), value: `${selectedLingeDetail.poids || 0} kg` }] : []}
        sections={selectedLingeDetail ? [
          { title: t('modal.identification', 'Identification'), icon: "id", items: [
            { label: t('common.id'), value: selectedLingeDetail.id, mono: true },
            { label: t('arsenal.tracking_code'), value: selectedLingeDetail.codeBarre, mono: true },
            { label: t('arsenal.rfid_tag'), value: selectedLingeDetail.rfidTag, mono: true },
          ] },
          { title: t('modal.characteristics', 'Caractéristiques'), icon: "specs", items: [
            { label: t('common.category'), value: selectedLingeDetail.categorie },
            { label: t('arsenal.arsenal'), value: selectedArsenal?.nom },
            { label: t('common.creation_date'), value: selectedLingeDetail.dateCreation ? new Date(selectedLingeDetail.dateCreation).toLocaleString("fr-FR") : null },
          ] },
        ] : []}
      />

      {/* ─── Modal Création / Modification ─────────────────────────────────── */}
      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedArsenal ? `${t('arsenal.edit')} #${selectedArsenal.id}` : t('arsenal.new')}
        mode={selectedArsenal ? "edit" : "create"}
        size={"lg"}
        onSubmit={handleSave}
        saving={isSaving}
      >
        
          <FormSection title={t('modal.general_info', 'Informations générales')} icon="specs" columns={2}>
            <div>
              <Input
                label={t('common.code')}
                value={newRec.code}
                onChange={(e) => setNewRec({ ...newRec, code: e.target.value.toUpperCase() })}
                placeholder={t('arsenal.code_placeholder')}
              />
              <p className="text-xs text-slate-400 mt-1">{t('arsenal.code_hint')}</p>
            </div>
            <div>
              <Input
                label={t('common.name') + " *"}
                value={newRec.nom}
                onChange={(e) => setNewRec({ ...newRec, nom: e.target.value })}
                placeholder={t('arsenal.name_placeholder')}
                required
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-2">{t('arsenal.service')}</label>
              <select
                value={newRec.serviceId || ""}
                onChange={(e) =>
                  setNewRec({ ...newRec, serviceId: e.target.value ? parseInt(e.target.value) : "" })
                }
                className="w-full h-10 px-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">{t('arsenal.no_service')}</option>
                {Array.isArray(services) && services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.code}
                  </option>
                ))}
              </select>
            </div>
          </FormSection>

      </FormModal>
    </div>
  );
}

export default function ArsenalList() {
  return <ArsenalListInner />;
}