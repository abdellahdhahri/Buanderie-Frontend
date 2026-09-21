import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Search,
  Eye,
  RefreshCw,
  Calendar,
  Clock,
  User,
  Wrench,
  Droplet,
  Thermometer,
  Timer,
  Gauge,
  Package,
  Barcode,
  Tag,
  Weight,
  Layers,
  ChevronRight,
  ChevronLeft,
  X,
  Filter,
  Printer,
  Loader2,
  ChevronDown,
  ChevronUp,
  CalendarDays
} from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Modal } from "../../components/ui/modal";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import printJS from "print-js";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

// ─── Pagination ──────────────────────────────────────────────────────────────
function Pagination({ currentPage, totalPages, onPageChange }) {
  const { t } = useTranslation();

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-4">
      <div className="text-sm text-slate-500">
        {t('common.page')} {currentPage} / {totalPages}
      </div>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {t('common.previous')}
        </button>
        {getPageNumbers().map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-9 h-9 text-sm rounded-lg transition-colors ${
              currentPage === page
                ? "bg-teal-500 text-white font-bold"
                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
            }`}
          >
            {page}
          </button>
        ))}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {t('common.next')}
        </button>
      </div>
    </div>
  );
}

export default function CycleLavageList() {
  const { t } = useTranslation();

  const [cycles, setCycles] = useState([]);
  const [filteredCycles, setFilteredCycles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCycle, setSelectedCycle] = useState(null);
  const [selectedCycleId, setSelectedCycleId] = useState(null);
  const [cycleLinges, setCycleLinges] = useState([]);
  const [isLingesLoading, setIsLingesLoading] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // ─── Pagination ──────────────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // ─── Filtres ─────────────────────────────────────────────────────────────
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    statut: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  // ─── Chargement des cycles ──────────────────────────────────────────────
  const fetchCycles = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/lavage/cycles`);
      if (response.ok) {
        const data = await response.json();
        setCycles(data);
        applyFilters(data);
      }
    } catch (err) {
      console.error("Erreur réseau:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCycles();
  }, []);

  // ─── Application des filtres ─────────────────────────────────────────────
  const applyFilters = (data = cycles) => {
    let result = [...data];

    // Recherche
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (cycle) =>
          cycle.numeroCycle?.toLowerCase().includes(term) ||
          cycle.machine?.code?.toLowerCase().includes(term) ||
          cycle.machine?.reference?.toLowerCase().includes(term) ||
          cycle.programmeLavage?.nom?.toLowerCase().includes(term)
      );
    }

    // Filtre date début
    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom);
      from.setHours(0, 0, 0, 0);
      result = result.filter(
        (cycle) => cycle.dateDebut && new Date(cycle.dateDebut) >= from
      );
    }

    // Filtre date fin
    if (filters.dateTo) {
      const to = new Date(filters.dateTo);
      to.setHours(23, 59, 59, 999);
      result = result.filter(
        (cycle) => cycle.dateDebut && new Date(cycle.dateDebut) <= to
      );
    }

    // Filtre statut
    if (filters.statut) {
      result = result.filter((cycle) => cycle.statut === filters.statut);
    }

    setFilteredCycles(result);
    setCurrentPage(1);
  };

  // ─── Effet lors des changements de filtres ──────────────────────────────
  useEffect(() => {
    applyFilters();
  }, [searchTerm, filters, cycles]);

  // ─── Pagination ──────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filteredCycles.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = filteredCycles.slice(startIndex, startIndex + itemsPerPage);

  // ─── Récupération des linges d'un cycle (CORRIGÉE) ──────────────────────
  const fetchCycleLinges = async (cycleId) => {
    setIsLingesLoading(true);
    setCycleLinges([]);
    
    try {
      console.log(`🔍 Récupération des linges pour le cycle ${cycleId}...`);
      
      // Tentative 1: Endpoint standard
      let response = await fetch(`${API_URL}/api/lavage/cycles/${cycleId}/linges`);
      
      if (!response.ok) {
        // Tentative 2: Endpoint alternatif
        response = await fetch(`${API_URL}/api/cycles/${cycleId}/linges`);
      }
      
      if (response.ok) {
        const data = await response.json();
        console.log("📦 Données reçues:", data);
        
        let linges = [];
        
        if (Array.isArray(data)) {
          linges = data;
        } else if (data.content && Array.isArray(data.content)) {
          linges = data.content;
        } else if (data.items && Array.isArray(data.items)) {
          linges = data.items;
        } else if (data._embedded && data._embedded.linges) {
          linges = data._embedded.linges;
        }
        
        if (linges.length > 0) {
          console.log(`✅ ${linges.length} linges trouvés`);
          setCycleLinges(linges);
        } else {
          console.log("ℹ️ Aucun linge trouvé pour ce cycle");
          setCycleLinges([]);
        }
      } else {
        console.warn("⚠️ Aucun endpoint trouvé pour les linges du cycle");
        
        // Si nous avons déjà les données du cycle, essayer d'extraire les informations des items
        if (selectedCycle && selectedCycle.items && selectedCycle.items.length > 0) {
          console.log("📋 Extraction des items du cycle...");
          const linges = selectedCycle.items.map((item, index) => ({
            id: item.id || index,
            lingeId: item.id || index,
            codeBarre: item.codeBarre || `ITEM-${item.id || index}`,
            categorie: item.categorie || selectedCycle.programmeLavage?.categories?.[0] || "Non catégorisé",
            poids: item.poidsCharge || 0,
            etat: item.etat || "COLLECTE",
            rfidTag: item.rfidTag || null,
            lotId: item.sourceId || null,
          }));
          setCycleLinges(linges);
        } else {
          setCycleLinges([]);
        }
      }
    } catch (err) {
      console.error("❌ Erreur chargement linges:", err);
      setCycleLinges([]);
    } finally {
      setIsLingesLoading(false);
    }
  };

  // ─── Gestion du panneau latéral ──────────────────────────────────────────
  const handleOpenPanel = async (cycle) => {
    if (selectedCycleId === cycle.id && panelOpen) {
      setPanelOpen(false);
      setTimeout(() => {
        setSelectedCycleId(null);
        setCycleLinges([]);
      }, 300);
      return;
    }
    
    setSelectedCycleId(cycle.id);
    setSelectedCycle(cycle);
    
    // Vérifier si le cycle contient déjà des items
    if (cycle.items && cycle.items.length > 0) {
      console.log(`📋 ${cycle.items.length} items trouvés dans le cycle`);
      const linges = cycle.items.map((item, index) => ({
        id: item.id || index,
        lingeId: item.id || index,
        codeBarre: item.codeBarre || `ITEM-${item.id || index}`,
        categorie: item.categorie || cycle.programmeLavage?.categories?.[0] || "Non catégorisé",
        poids: item.poidsCharge || 0,
        etat: item.etat || "COLLECTE",
        rfidTag: item.rfidTag || null,
        lotId: item.sourceId || null,
      }));
      setCycleLinges(linges);
      setPanelOpen(true);
    } else {
      // Si pas d'items, faire l'appel API
      await fetchCycleLinges(cycle.id);
      setPanelOpen(true);
    }
  };

  const handleClosePanel = () => {
    setPanelOpen(false);
    setTimeout(() => {
      setSelectedCycleId(null);
      setCycleLinges([]);
    }, 300);
  };

  const handleViewDetails = (cycle) => {
    setSelectedCycle(cycle);
    setShowDetailModal(true);
  };

  // ─── Impression ──────────────────────────────────────────────────────────
  const handlePrintCycle = (cycle) => {
    if (!cycle) return;

    const printContent = `
      <div style="width:80mm; padding:5mm; font-family:'Courier New',monospace; background:white;">
        <div style="text-align:center; border-bottom:2px solid black; padding-bottom:3mm; margin-bottom:3mm;">
          <h2 style="margin:0; font-size:14pt;">${t('cycles.print_title')}</h2>
          <p style="margin:2px 0; font-size:10pt; font-weight:bold;">${cycle.numeroCycle || `#${cycle.id}`}</p>
        </div>
        
        <div style="font-size:9pt; margin-bottom:3mm; border:1px solid #ddd; padding:3mm; border-radius:4px;">
          <div style="display:flex; justify-content:space-between; padding:2px 0;">
            <span><strong>${t('cycles.print_date')}:</strong></span>
            <span>${cycle.dateDebut ? new Date(cycle.dateDebut).toLocaleDateString('fr-FR') : 'N/A'}</span>
          </div>
          <div style="display:flex; justify-content:space-between; padding:2px 0;">
            <span><strong>${t('cycles.print_time')}:</strong></span>
            <span>${cycle.dateDebut ? new Date(cycle.dateDebut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</span>
          </div>
          <div style="display:flex; justify-content:space-between; padding:2px 0;">
            <span><strong>${t('cycles.print_status')}:</strong></span>
            <span>${cycle.statut ? t(`cycles.status_${cycle.statut}`, cycle.statut) : 'N/A'}</span>
          </div>
          <div style="display:flex; justify-content:space-between; padding:2px 0; border-top:1px solid #eee; margin-top:2px; padding-top:4px;">
            <span><strong>${t('cycles.print_machine')}:</strong></span>
            <span>${cycle.machine?.code || cycle.machine?.reference || 'N/A'}</span>
          </div>
          <div style="display:flex; justify-content:space-between; padding:2px 0;">
            <span><strong>${t('cycles.print_programme')}:</strong></span>
            <span>${cycle.programmeLavage?.nom || 'N/A'}</span>
          </div>
          <div style="display:flex; justify-content:space-between; padding:2px 0;">
            <span><strong>${t('cycles.print_agent')}:</strong></span>
            <span>${cycle.agent?.nom || 'N/A'}</span>
          </div>
          <div style="display:flex; justify-content:space-between; padding:2px 0;">
            <span><strong>${t('cycles.print_items')}:</strong></span>
            <span>${cycle.items?.length || 0}</span>
          </div>
        </div>
        
        <div style="text-align:center; font-size:7pt; margin-top:3mm; border-top:1px solid #ddd; padding-top:2mm; color:#666;">
          ${t('cycles.print_generated')} ${new Date().toLocaleString('fr-FR')}
        </div>
      </div>
    `;

    printJS({
      printable: printContent,
      type: "raw-html",
      style: "* { margin: 0; padding: 0; box-sizing: border-box; }",
      documentTitle: `Cycle_Lavage_${cycle.numeroCycle || cycle.id}`,
      css: `
        @page { 
          size: 80mm auto;
          margin: 0;
        }
      `
    });
  };

  // ─── Badges ──────────────────────────────────────────────────────────────
  const getStatusBadge = (status) => {
    const variants = {
      TERMINE: { variant: "success", label: t('cycles.status_TERMINE') },
      EN_COURS: { variant: "warning", label: t('cycles.status_EN_COURS') },
      EN_ATTENTE: { variant: "secondary", label: t('cycles.status_EN_ATTENTE') },
      ANNULE: { variant: "destructive", label: t('cycles.status_ANNULE') }
    };
    const config = variants[status] || { variant: "secondary", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getEtatLingeBadge = (etat) => {
    if (!etat) return <Badge variant="secondary">{t('common.undefined')}</Badge>;
    const variants = {
      COLLECTE: { variant: "warning", label: t('cycles.etat_COLLECTE') },
      EN_LAVAGE: { variant: "info", label: t('cycles.etat_EN_LAVAGE') },
      LAVE: { variant: "success", label: t('cycles.etat_LAVE') },
      SECHE: { variant: "success", label: t('cycles.etat_SECHE') },
      STOCKE: { variant: "secondary", label: t('cycles.etat_STOCKE') },
      SALE: { variant: "danger", label: t('cycles.etat_SALE') },
    };
    const config = variants[etat] || { variant: "secondary", label: etat };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // ─── Réinitialiser les filtres ──────────────────────────────────────────
  const resetFilters = () => {
    setFilters({
      dateFrom: "",
      dateTo: "",
      statut: "",
    });
    setSearchTerm("");
  };

  return (
    <div className="relative flex h-full gap-4">
      <motion.div
        className="transition-all duration-500 ease-in-out"
        animate={{
          width: panelOpen ? '60%' : '100%',
          transition: { duration: 0.4, ease: "easeInOut" }
        }}
      >
        <div className="space-y-4">
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
                background: "linear-gradient(135deg, #06b6d4, #0891b2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                boxShadow: "0 4px 16px rgba(6, 182, 212, 0.25)"
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
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  <polyline points="21 3 12 12 9 9" />
                </svg>
              </div>
              <div>
                <h1 style={{
                  fontSize: "28px",
                  fontWeight: 800,
                  color: "#0f172a",
                  margin: 0
                }}>
                  {t('cycles.title')}
                </h1>
                <p style={{
                  fontSize: "14px",
                  color: "#64748b",
                  margin: "2px 0 0 0"
                }}>
                  {t('cycles.subtitle', { count: filteredCycles.length })}
                </p>
              </div>
            </div>
          </div>

          {/* ─── BARRE D'OUTILS ────────────────────────────────────────────── */}
          <div className="flex flex-wrap items-center gap-3 bg-white/65 backdrop-blur-md p-4 rounded-[20px] border border-slate-200/50 shadow-[0_4px_20px_rgba(0,0,0,0.02)] mb-6">
            <button
              onClick={fetchCycles}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#0ca678]/30 rounded-[14px] text-sm font-bold text-[#0ca678] hover:bg-[#0ca678]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02]"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> {t('cycles.refresh')}
            </button>

            <div style={{ width: "1px", height: "30px", background: "#e2e8f0", margin: "0 8px" }} />

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#e67700]/30 rounded-[14px] text-sm font-bold text-[#e67700] hover:bg-[#e67700]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02]"
            >
              <Filter className="w-4 h-4" /> {t('cycles.filter')}
            </button>

            <button
              onClick={resetFilters}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-300 rounded-[14px] text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
            >
              <X className="w-4 h-4" /> {t('cycles.reset')}
            </button>

            <div style={{ width: "1px", height: "30px", background: "#e2e8f0", margin: "0 8px" }} />

            <button
              disabled={!selectedCycleId}
              onClick={() => {
                if (selectedCycle) handlePrintCycle(selectedCycle);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#8b5cf6]/30 rounded-[14px] text-sm font-bold text-[#8b5cf6] hover:bg-[#8b5cf6]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Printer className="w-4 h-4" /> {t('cycles.print')}
            </button>

            <button
              disabled={!selectedCycleId}
              onClick={() => {
                if (selectedCycle) handleViewDetails(selectedCycle);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#006f94]/30 rounded-[14px] text-sm font-bold text-[#006f94] hover:bg-[#006f94]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Eye className="w-4 h-4" /> {t('cycles.details')}
            </button>
          </div>

          {/* ─── FILTRES DÉROULANTS ────────────────────────────────────────── */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <Card className="mb-4">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          <CalendarDays className="w-4 h-4 inline mr-2 text-slate-400" />
                          {t('cycles.date_from')}
                        </label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="date"
                            value={filters.dateFrom}
                            onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                            className="w-full h-10 pl-10 pr-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-teal-400"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          <CalendarDays className="w-4 h-4 inline mr-2 text-slate-400" />
                          {t('cycles.date_to')}
                        </label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="date"
                            value={filters.dateTo}
                            onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                            className="w-full h-10 pl-10 pr-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-teal-400"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          <Filter className="w-4 h-4 inline mr-2 text-slate-400" />
                          {t('cycles.status')}
                        </label>
                        <select
                          value={filters.statut}
                          onChange={(e) => setFilters({ ...filters, statut: e.target.value })}
                          className="w-full h-10 px-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-teal-400"
                        >
                          <option value="">{t('cycles.all_status')}</option>
                          <option value="TERMINE">{t('cycles.status_TERMINE')}</option>
                          <option value="EN_COURS">{t('cycles.status_EN_COURS')}</option>
                          <option value="EN_ATTENTE">{t('cycles.status_EN_ATTENTE')}</option>
                          <option value="ANNULE">{t('cycles.status_ANNULE')}</option>
                        </select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ─── BARRE DE RECHERCHE ────────────────────────────────────────── */}
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder={t('cycles.search_placeholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ─── TABLEAU ────────────────────────────────────────────────────── */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-slate-200 bg-slate-50/80">
                    <tr>
                      <th className="text-center py-3 px-4 text-sm font-medium text-slate-500 w-10"></th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-slate-500">{t('cycles.numero')}</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-slate-500">{t('cycles.machine')}</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-slate-500">{t('cycles.programme')}</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-slate-500">{t('cycles.date_debut')}</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-slate-500">{t('cycles.status')}</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-slate-500" style={{ width: "100px" }}>{t('cycles.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-slate-400">
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            {t('cycles.loading')}
                          </div>
                        </td>
                      </tr>
                    ) : currentData.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-slate-400">
                          <Package className="w-12 h-12 mx-auto opacity-30 mb-3" />
                          <p className="text-sm font-medium">{searchTerm ? t('cycles.no_match') : t('cycles.no_data')}</p>
                          <p className="text-xs mt-1">{t('cycles.no_data_text')}</p>
                        </td>
                      </tr>
                    ) : (
                      currentData.map((cycle) => (
                        <tr
                          key={cycle.id}
                          className={`border-b border-slate-100 hover:bg-slate-50/80 transition-colors ${selectedCycleId === cycle.id ? 'bg-teal-50' : ''}`}
                        >
                          <td className="text-center py-3 px-4">
                            <button
                              onClick={() => handleOpenPanel(cycle)}
                              className="p-1 hover:bg-teal-100 rounded-lg transition-colors"
                              title={panelOpen && selectedCycleId === cycle.id ? t('common.close') : t('common.view')}
                            >
                              {panelOpen && selectedCycleId === cycle.id ? (
                                <ChevronLeft className="w-5 h-5 text-teal-500" />
                              ) : (
                                <ChevronRight className="w-5 h-5 text-slate-400 hover:text-teal-500" />
                              )}
                            </button>
                          </td>
                          <td className="text-center py-3 px-4">
                            <div className="font-mono text-sm font-medium text-teal-600">
                              {cycle.numeroCycle || `#${cycle.id}`}
                            </div>
                          </td>
                          <td className="text-center py-3 px-4">
                            <div className="flex items-center justify-center gap-2">
                              <Wrench className="w-4 h-4 text-slate-400" />
                              <span className="text-sm font-medium">
                                {cycle.machine?.code || cycle.machine?.reference || "N/A"}
                              </span>
                            </div>
                          </td>
                          <td className="text-center py-3 px-4">
                            <div className="flex items-center justify-center gap-2">
                              <Droplet className="w-4 h-4 text-blue-400" />
                              <span className="text-sm">{cycle.programmeLavage?.nom || "N/A"}</span>
                            </div>
                          </td>
                          <td className="text-center py-3 px-4">
                            <div className="flex items-center justify-center gap-2">
                              <Calendar className="w-4 h-4 text-slate-400" />
                              <span className="text-sm">
                                {cycle.dateDebut ? new Date(cycle.dateDebut).toLocaleString("fr-FR", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit"
                                }) : "—"}
                              </span>
                            </div>
                          </td>
                          <td className="text-center py-3 px-4">
                            {getStatusBadge(cycle.statut)}
                          </td>
                          <td className="text-center py-3 px-4">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePrintCycle(cycle);
                                }}
                                className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors text-slate-400 hover:text-[#8b5cf6]"
                                title={t('cycles.print')}
                              >
                                <Printer className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewDetails(cycle);
                                }}
                                className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors text-slate-400 hover:text-[#006f94]"
                                title={t('cycles.details')}
                              >
                                <Eye className="w-4 h-4" />
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

          {/* ─── PAGINATION ────────────────────────────────────────────────── */}
          {!isLoading && filteredCycles.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      </motion.div>

      {/* ─── PANNEAU LATÉRAL DES LINGES ────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {panelOpen && (
          <motion.div
            initial={{ opacity: 0, x: 100, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              x: 0, 
              scale: 1,
              transition: { 
                type: "spring",
                stiffness: 300,
                damping: 30,
                duration: 0.4
              }
            }}
            exit={{ 
              opacity: 0, 
              x: 100, 
              scale: 0.95,
              transition: { 
                duration: 0.3,
                ease: "easeInOut"
              }
            }}
            className="w-[40%] bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden h-[calc(100vh-120px)] sticky top-20 flex-shrink-0"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-teal-50 to-teal-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-teal-600" />
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">
                      {selectedCycle?.numeroCycle || "Cycle"}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {selectedCycle?.machine?.code || "Machine inconnue"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-white">
                    {cycleLinges.length} {t('cycles.linges_count')}
                  </Badge>
                  <button
                    onClick={() => handlePrintCycle(selectedCycle)}
                    className="p-1.5 hover:bg-teal-200 rounded-lg transition-colors text-slate-500 hover:text-[#8b5cf6]"
                    title={t('cycles.print')}
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleClosePanel}
                    className="p-1.5 hover:bg-teal-200 rounded-lg transition-colors text-slate-500 hover:text-slate-700"
                    title={t('common.close')}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 overflow-y-auto h-[calc(100%-80px)]">
              {isLingesLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
                </div>
              ) : cycleLinges.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Package className="w-12 h-12 mx-auto opacity-30 mb-3" />
                  <p className="text-sm font-medium">{t('cycles.no_linge')}</p>
                  {selectedCycle?.items?.length > 0 && (
                    <p className="text-xs mt-1 text-slate-300">
                      {selectedCycle.items.length} items dans le cycle
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {cycleLinges.map((linge, index) => (
                    <motion.div
                      key={linge.lingeId || linge.id || index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ 
                        opacity: 1, 
                        y: 0,
                        transition: { 
                          delay: index * 0.05,
                          duration: 0.3
                        }
                      }}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-teal-200 transition-colors hover:shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
                            <Package className="w-4 h-4 text-teal-600" />
                          </div>
                          <div>
                            <div className="font-medium text-sm">
                              {linge.codeBarre || "N/A"}
                            </div>
                            <div className="text-xs text-slate-500">
                              {linge.categorie || "Non catégorisé"}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          {getEtatLingeBadge(linge.etat)}
                          <div className="text-xs text-slate-400 mt-1">
                            {linge.poids || 0} kg
                          </div>
                        </div>
                      </div>
                      {linge.rfidTag && (
                        <div className="mt-1 text-xs text-purple-500 font-mono">
                          RFID: {linge.rfidTag}
                        </div>
                      )}
                      {linge.lotId && (
                        <div className="mt-1 text-xs text-slate-400">
                          Lot: #{linge.lotId}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── MODAL DÉTAILS ────────────────────────────────────────────────── */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={`${t('cycles.cycle_details')} - ${selectedCycle?.numeroCycle || 'N/A'}`}
        size="lg"
      >
        {selectedCycle && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('cycles.id')}</label>
              <Input value={`#${selectedCycle.id}`} disabled />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('cycles.numero')}</label>
              <Input value={selectedCycle.numeroCycle || "N/A"} disabled />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('cycles.status')}</label>
              <div className="mt-1">{getStatusBadge(selectedCycle.statut)}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('cycles.date_debut')}</label>
              <div className="flex items-center gap-2 p-2 rounded-lg border border-input bg-slate-50">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>{formatDate(selectedCycle.dateDebut)}</span>
              </div>
            </div>

            {/* Machine */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('cycles.machine')}</label>
              <div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-xs text-slate-400">{t('cycles.code')}</span>
                  <p className="text-sm font-medium">{selectedCycle.machine?.code || "N/A"}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">{t('cycles.reference')}</span>
                  <p className="text-sm font-medium">{selectedCycle.machine?.reference || "N/A"}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">{t('cycles.type')}</span>
                  <p className="text-sm font-medium">{selectedCycle.machine?.type || "N/A"}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">{t('cycles.capacity')}</span>
                  <p className="text-sm font-medium">{selectedCycle.machine?.capaciteKg || 0} kg</p>
                </div>
              </div>
            </div>

            {/* Programme */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('cycles.programme')}</label>
              <div className="grid grid-cols-3 gap-2 p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-xs text-slate-400">{t('cycles.name')}</span>
                  <p className="text-sm font-medium">{selectedCycle.programmeLavage?.nom || "N/A"}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">{t('cycles.temperature')}</span>
                  <p className="text-sm font-medium flex items-center gap-1">
                    <Thermometer className="w-3 h-3 text-red-500" />
                    {selectedCycle.programmeLavage?.temperatureCelsius || 0}°C
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">{t('cycles.duration')}</span>
                  <p className="text-sm font-medium flex items-center gap-1">
                    <Timer className="w-3 h-3 text-blue-500" />
                    {selectedCycle.programmeLavage?.dureeMinutes || 0} min
                  </p>
                </div>
                {selectedCycle.programmeLavage?.vitesseEssorageRpm && (
                  <div>
                    <span className="text-xs text-slate-400">{t('cycles.spin_speed')}</span>
                    <p className="text-sm font-medium flex items-center gap-1">
                      <Gauge className="w-3 h-3 text-purple-500" />
                      {selectedCycle.programmeLavage.vitesseEssorageRpm} RPM
                    </p>
                  </div>
                )}
                {selectedCycle.programmeLavage?.categories && (
                  <div className="col-span-3">
                    <span className="text-xs text-slate-400">{t('cycles.categories')}</span>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {selectedCycle.programmeLavage.categories.map((cat, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Items */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('cycles.items')}</label>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <p className="text-sm font-medium">
                  {selectedCycle.items?.length || 0} {t('cycles.items_count')}
                </p>
                {selectedCycle.items && selectedCycle.items.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedCycle.items.map((item, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {item.id || `#${idx + 1}`}
                        {item.poidsCharge && ` (${item.poidsCharge} kg)`}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Agent */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('cycles.agent')}</label>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-teal-500 flex items-center justify-center text-white text-xs font-bold">
                  {selectedCycle.agent?.nom?.charAt(0) || "?"}
                </div>
                <div>
                  <p className="text-sm font-medium">{selectedCycle.agent?.nom || "N/A"}</p>
                  <p className="text-xs text-slate-400">{selectedCycle.agent?.matricule || ""}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="outline"
            onClick={() => {
              if (selectedCycle) {
                handlePrintCycle(selectedCycle);
              }
            }}
          >
            <Printer className="w-4 h-4 mr-2" /> {t('cycles.print')}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              if (selectedCycle) {
                setSelectedCycleId(selectedCycle.id);
                setSelectedCycle(selectedCycle);
                // Vérifier si le cycle contient des items
                if (selectedCycle.items && selectedCycle.items.length > 0) {
                  const linges = selectedCycle.items.map((item, index) => ({
                    id: item.id || index,
                    lingeId: item.id || index,
                    codeBarre: item.codeBarre || `ITEM-${item.id || index}`,
                    categorie: item.categorie || selectedCycle.programmeLavage?.categories?.[0] || "Non catégorisé",
                    poids: item.poidsCharge || 0,
                    etat: item.etat || "COLLECTE",
                    rfidTag: item.rfidTag || null,
                    lotId: item.sourceId || null,
                  }));
                  setCycleLinges(linges);
                  setPanelOpen(true);
                } else {
                  fetchCycleLinges(selectedCycle.id);
                  setPanelOpen(true);
                }
                setShowDetailModal(false);
              }
            }}
          >
            <Package className="w-4 h-4 mr-2" /> {t('cycles.view_linges')}
          </Button>
          <Button onClick={() => setShowDetailModal(false)}>
            {t('cycles.close')}
          </Button>
        </div>
      </Modal>
    </div>
  );
}