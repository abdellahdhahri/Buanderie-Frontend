// pages/Historique/HistoriqueCollecte.js
import React, { useState, useEffect, useContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Search, Filter, Eye, RefreshCw, Calendar, Clock, 
  ChevronRight, ChevronDown, Package, User, Building,
  TrendingUp, TrendingDown, CheckCircle, XCircle, 
  AlertCircle, Info, Layers, Grid, List, PieChart,
  ArrowUpRight, ArrowDownRight, Minus
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Select } from "../../components/ui/select";
import { Modal } from "../../components/ui/modal";
import { Input } from "../../components/ui/input";
import { ServiceContext } from "../../contextes/ServiceContext";
import {
  fetchCollectes,
  fetchCollecteDetails,
  fetchPersonnelById,
  fetchPersonnelsByIds,
  fetchServiceById,
  formatDate,
  getTypeBadgeConfig,
  getEtatBadgeConfig
} from "../../services/historiqueCollecteService";

import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

// ─── Composant de résumé amélioré ──────────────────────────────────────
function ResumeCollecte({ details, collecte, onViewDetails }) {
  const categories = details?.categories || [];
  const totalPieces = details?.totalPieces || 0;
  
  // Couleurs par catégorie
  const categoryColors = {
    DRAP: { bg: "#fee2e2", color: "#dc2626", emoji: "🛏️" },
    TAIE_OREILLER: { bg: "#ffedd5", color: "#ea580c", emoji: "💤" },
    SERVIETTE_BAIN: { bg: "#fef3c7", color: "#d97706", emoji: "🛁" },
    SERVIETTE_VISAGE: { bg: "#ecfccb", color: "#65a30d", emoji: "🧻" },
    PEIGNOIR: { bg: "#cffafe", color: "#0891b2", emoji: "🥼" },
    NAPPE: { bg: "#ede9fe", color: "#7c3aed", emoji: "🍽️" },
    SERVIETTE_TABLE: { bg: "#fce7f3", color: "#be185d", emoji: "🍴" },
    UNIFORME: { bg: "#ccfbf1", color: "#0f766e", emoji: "👔" },
    AUTRE: { bg: "#f1f5f9", color: "#475569", emoji: "📦" },
  };

  const getCategoryStyle = (categorie) => {
    return categoryColors[categorie] || categoryColors.AUTRE;
  };

  // Calcul du pourcentage
  const total = categories.reduce((sum, cat) => sum + cat.quantite, 0);

  return (
    <div className="space-y-4">
      {/* En-tête du résumé avec stats principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-3 rounded-xl border border-blue-200">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-medium text-blue-700">Total pièces</span>
          </div>
          <div className="text-2xl font-bold text-blue-800 mt-1">{totalPieces}</div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 p-3 rounded-xl border border-purple-200">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-medium text-purple-700">Catégories</span>
          </div>
          <div className="text-2xl font-bold text-purple-800 mt-1">{categories.length}</div>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-3 rounded-xl border border-emerald-200">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-medium text-emerald-700">Blanc</span>
          </div>
          <div className="text-2xl font-bold text-emerald-800 mt-1">
            {categories.find(c => c.categorie === "BLANC")?.quantite || 0}
          </div>
        </div>
        <div className="bg-gradient-to-br from-rose-50 to-rose-100/50 p-3 rounded-xl border border-rose-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span className="text-xs font-medium text-rose-700">Infecté</span>
          </div>
          <div className="text-2xl font-bold text-rose-800 mt-1">
            {categories.find(c => c.categorie === "INFECTE")?.quantite || 0}
          </div>
        </div>
      </div>

      {/* Détail des catégories avec barres de progression */}
      {categories.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <PieChart className="w-4 h-4 text-slate-600" />
            <span className="text-sm font-semibold text-slate-700">Répartition par catégorie</span>
            <Badge variant="outline" className="ml-auto text-xs">
              {categories.length} catégories
            </Badge>
          </div>
          <div className="space-y-3">
            {categories.map((cat, idx) => {
              const style = getCategoryStyle(cat.categorie);
              const pourcentage = total > 0 ? Math.round((cat.quantite / total) * 100) : 0;
              
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{style.emoji}</span>
                      <span className="text-sm font-medium text-slate-700">{cat.categorie}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-slate-800">{cat.quantite}</span>
                      <span className="text-xs text-slate-400 w-12 text-right">{pourcentage}%</span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pourcentage}%` }}
                      transition={{ duration: 0.6, delay: idx * 0.1 }}
                      className="h-full rounded-full"
                      style={{ 
                        background: `linear-gradient(90deg, ${style.color}cc, ${style.color})`,
                        width: `${pourcentage}%`
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Informations complémentaires */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
          <User className="w-4 h-4 text-slate-500" />
          <span className="text-slate-600">Agent:</span>
          <span className="font-medium text-slate-800">{collecte?.agent?.nom || collecte?.personnelId || "N/A"}</span>
        </div>
        <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
          <Building className="w-4 h-4 text-slate-500" />
          <span className="text-slate-600">Service:</span>
          <span className="font-medium text-slate-800">{collecte?.service?.nom || "Non assigné"}</span>
        </div>
        <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
          <Calendar className="w-4 h-4 text-slate-500" />
          <span className="text-slate-600">Date:</span>
          <span className="font-medium text-slate-800">{formatDate(collecte?.dateCollecte)}</span>
        </div>
        <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
          <Clock className="w-4 h-4 text-slate-500" />
          <span className="text-slate-600">Durée:</span>
          <span className="font-medium text-slate-800">
            {collecte?.dateDebut && collecte?.dateFin 
              ? `${Math.round((new Date(collecte.dateFin) - new Date(collecte.dateDebut)) / 60000)} min`
              : "—"}
          </span>
        </div>
      </div>

      {/* Bouton voir plus */}
      <div className="flex justify-end pt-2 border-t border-slate-200">
        <button
          onClick={onViewDetails}
          className="flex items-center gap-1.5 text-sm font-medium text-[#0794a4] hover:text-[#068391] hover:underline transition-colors"
        >
          <Eye className="w-4 h-4" />
          Voir tous les détails
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Composant de carte de collecte (vue alternative) ──────────────────
function CollecteCard({ collecte, index, onExpand, isExpanded, onViewDetails }) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`bg-white rounded-xl border transition-all duration-200 overflow-hidden ${
        isExpanded ? 'border-[#0794a4] shadow-lg shadow-[#0794a4]/10' : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header de la carte */}
      <div 
        className="p-4 cursor-pointer"
        onClick={() => onExpand(collecte.id)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-bold text-sm">
              #{startIndex + index + 1}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-800">
                  Collecte #{collecte.id}
                </span>
                {getTypeBadge(collecte.typeCollecte)}
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDate(collecte.dateCollecte)}
                </span>
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {getPersonnelName(collecte.personnelId)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getEtatBadge(collecte.etatCollecte)}
            <Button
              variant="ghost"
              size="sm"
              className="p-1 h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails(collecte);
              }}
            >
              <Eye className="w-4 h-4 text-slate-400" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="p-1 h-8 w-8"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isHovered ? 'translate-x-0.5' : ''}`} />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Contenu expansé */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-2 border-t border-slate-100">
              <ResumeCollecte 
                details={collecte.details || collecte.resume}
                collecte={collecte}
                onViewDetails={() => onViewDetails(collecte)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── PAGE PRINCIPALE ──────────────────────────────────────────────────────
export default function HistoriqueCollecte() {
  const navigate = useNavigate();
  const [collectes, setCollectes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCollecte, setSelectedCollecte] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [personnelsCache, setPersonnelsCache] = useState({});
  const [servicesCache, setServicesCache] = useState({});
  const [loadingPersonnels, setLoadingPersonnels] = useState(false);
  const [viewMode, setViewMode] = useState("table"); // "table" | "cards"
  const itemsPerPage = 8;
  const { services } = useContext(ServiceContext);

  const [filters, setFilters] = useState({
    search: "",
    type: "",
    dateFrom: "",
    dateTo: "",
  });

  // ─── Chargement des collectes ──────────────────────────────────────────
  const loadCollectes = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchCollectes();
      
      // Extraire les IDs des personnels uniques
      const personnelIds = data
        .map(c => c.personnelId)
        .filter(id => id != null);
      
      // Charger les personnels en parallèle
      if (personnelIds.length > 0) {
        setLoadingPersonnels(true);
        const personnels = await fetchPersonnelsByIds(personnelIds);
        setPersonnelsCache(personnels);
        setLoadingPersonnels(false);
      }
      
      setCollectes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erreur chargement collectes:", error);
      setCollectes([]);
      Swal.fire({
        icon: "error",
        title: "Erreur",
        text: error.message || "Impossible de charger les collectes",
        timer: 3000,
        showConfirmButton: false
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Chargement des détails d'une collecte ────────────────────────────
  const loadCollecteDetails = useCallback(async (collecteId) => {
    try {
      const data = await fetchCollecteDetails(collecteId);
      return data;
    } catch (error) {
      console.error("Erreur chargement détails:", error);
      return null;
    }
  }, []);

  // ─── Chargement d'un personnel individuel ─────────────────────────────
  const loadPersonnel = useCallback(async (personnelId) => {
    if (!personnelId) return null;
    if (personnelsCache[personnelId]) return personnelsCache[personnelId];
    
    try {
      const personnel = await fetchPersonnelById(personnelId);
      setPersonnelsCache(prev => ({ ...prev, [personnelId]: personnel }));
      return personnel;
    } catch (error) {
      console.error("Erreur chargement personnel:", error);
      return null;
    }
  }, [personnelsCache]);

  // ─── Effet pour charger les collectes au montage ──────────────────────
  useEffect(() => {
    loadCollectes();
  }, [loadCollectes]);

  // ─── Réinitialiser la page quand les filtres changent ─────────────────
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // ─── Récupérer le nom du personnel depuis personnelId ──────────────────
  const getPersonnelName = useCallback((personnelId) => {
    if (!personnelId) return "N/A";
    const personnel = personnelsCache[personnelId];
    if (!personnel) return `ID: ${personnelId}`;
    return personnel.nomPrenom || personnel.nom || personnel.matricule || `ID: ${personnelId}`;
  }, [personnelsCache]);

  // ─── Récupérer le nom du service ──────────────────────────────────────
  const getServiceName = useCallback((serviceId) => {
    if (!serviceId) return "Non assigné";
    const service = services.find(s => s.id === serviceId);
    return service ? service.code : "Non assigné";
  }, [services]);

  // ─── Gestion de l'expansion ───────────────────────────────────────────
  const handleToggleExpand = useCallback(async (collecteId) => {
    if (expandedId === collecteId) {
      setExpandedId(null);
      return;
    }

    setExpandedId(collecteId);
    const details = await loadCollecteDetails(collecteId);
    if (details) {
      setCollectes(prev => prev.map(c => 
        c.id === collecteId ? { ...c, details } : c
      ));
    }
  }, [expandedId, loadCollecteDetails]);

  // ─── Voir les détails ─────────────────────────────────────────────────
  const handleViewDetails = useCallback(async (collecte) => {
    setSelectedCollecte(collecte);
    setIsDetailsModalOpen(true);
    
    // Charger le personnel si pas encore en cache
    if (collecte.personnelId && !personnelsCache[collecte.personnelId]) {
      await loadPersonnel(collecte.personnelId);
    }
  }, [personnelsCache, loadPersonnel]);

  // ─── Badge de type ─────────────────────────────────────────────────────
  const getTypeBadge = useCallback((type) => {
    const config = getTypeBadgeConfig(type);
    return <Badge variant={config.variant}>{config.emoji} {config.label}</Badge>;
  }, []);

  // ─── Badge d'état ─────────────────────────────────────────────────────
  const getEtatBadge = useCallback((etat) => {
    const config = getEtatBadgeConfig(etat);
    return <Badge variant={config.variant}>{config.label}</Badge>;
  }, []);

  // ─── Filtrage des collectes ───────────────────────────────────────────
  const filteredCollectes = collectes.filter((collecte) => {
    const personnelName = getPersonnelName(collecte.personnelId);
    const serviceName = getServiceName(collecte.service);
    
    const matchSearch = 
      personnelName.toLowerCase().includes(filters.search.toLowerCase()) ||
      serviceName.toLowerCase().includes(filters.search.toLowerCase()) ||
      (collecte.codeChambre || "").toLowerCase().includes(filters.search.toLowerCase());

    const matchType = filters.type ? collecte.typeCollecte === filters.type : true;
    const entryDate = new Date(collecte.dateCollecte);
    const matchDateFrom = filters.dateFrom ? entryDate >= new Date(filters.dateFrom) : true;
    const matchDateTo = filters.dateTo ? entryDate <= new Date(filters.dateTo + "T23:59:59") : true;

    return matchSearch && matchType && matchDateFrom && matchDateTo;
  });

  // ─── Pagination ──────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filteredCollectes.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = filteredCollectes.slice(startIndex, startIndex + itemsPerPage);

  // ─── Réinitialiser les filtres ──────────────────────────────────────
  const resetFilters = useCallback(() => {
    setFilters({
      search: "",
      type: "",
      dateFrom: "",
      dateTo: "",
    });
  }, []);

  const isLoading = loading || loadingPersonnels;

  return (
    <div className="space-y-6">

      {/* ─── HEADER ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-extrabold flex items-center gap-2 text-slate-800">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="28" 
              height="28" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className="text-[#0794a4]"
            >
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
              <line x1="8" y1="11" x2="16" y2="11" />
              <line x1="8" y1="15" x2="16" y2="15" />
              <line x1="8" y1="19" x2="13" y2="19" />
            </svg>
            Historique des Collectes
          </h1>
          <p className="text-slate-500 text-sm">
            {filteredCollectes.length} collecte(s) trouvée(s)
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Vue Table/Cartes */}
          <div className="flex border border-slate-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 px-3 text-sm font-medium transition-colors ${
                viewMode === "table" 
                  ? "bg-[#0794a4] text-white" 
                  : "bg-white text-slate-500 hover:bg-slate-50"
              }`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("cards")}
              className={`p-1.5 px-3 text-sm font-medium transition-colors ${
                viewMode === "cards" 
                  ? "bg-[#0794a4] text-white" 
                  : "bg-white text-slate-500 hover:bg-slate-50"
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── BARRE D'OUTILS ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 bg-white/65 backdrop-blur-md p-4 rounded-[20px] border border-slate-200/50 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
        <button
          onClick={loadCollectes}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-[#0ca678]/30 rounded-[14px] text-sm font-bold text-[#0ca678] hover:bg-[#0ca678]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02] disabled:opacity-50"
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> 
          {isLoading ? "Chargement..." : "Actualiser"}
        </button>
        <button
          disabled={!selectedCollecte}
          onClick={() => selectedCollecte && handleViewDetails(selectedCollecte)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-[#006f94]/30 rounded-[14px] text-sm font-bold text-[#006f94] hover:bg-[#006f94]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Eye className="w-4 h-4" /> Détails
        </button>
        <button
          onClick={resetFilters}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-[#e67700]/30 rounded-[14px] text-sm font-bold text-[#e67700] hover:bg-[#e67700]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02]"
        >
          <Filter className="w-4 h-4" /> Réinitialiser
        </button>
        <div className="flex-1"></div>
        <div className="text-sm text-slate-400">
          <span className="font-medium text-slate-600">{filteredCollectes.length}</span> collectes
        </div>
      </div>

      {/* ─── FILTRES ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par agent, service, chambre..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#0794a4]/30 focus:border-[#0794a4] text-sm"
            />
          </div>
        </div>
        <Select
          options={[
            { value: "", label: "Tous les types" },
            { value: "BLANC", label: "⬜ Blanc" },
            { value: "INFECTE", label: "🔴 Infecté" },
            { value: "MIXTE", label: "🟡 Mixte" },
          ]}
          value={filters.type}
          onChange={(e) => setFilters({ ...filters, type: e.target.value })}
          className="h-10"
        />
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#0794a4]/30 focus:border-[#0794a4] text-sm"
            />
          </div>
          <div className="relative flex-1">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#0794a4]/30 focus:border-[#0794a4] text-sm"
            />
          </div>
        </div>
      </div>

      {/* ─── CONTENU ────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <svg className="animate-spin w-10 h-10 text-[#0794a4] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <p className="text-slate-500 font-medium">Chargement des collectes...</p>
          </div>
        </div>
      ) : currentData.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <Package className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500 font-medium text-lg">Aucune collecte trouvée</p>
          <p className="text-slate-400 text-sm mt-1">Ajustez vos filtres ou actualisez la liste</p>
        </div>
      ) : viewMode === "cards" ? (
        // ─── VUE CARTES ──────────────────────────────────────────────────
        <div className="grid grid-cols-1 gap-4">
          {currentData.map((collecte, index) => (
            <CollecteCard
              key={collecte.id}
              collecte={collecte}
              index={index}
              isExpanded={expandedId === collecte.id}
              onExpand={handleToggleExpand}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      ) : (
        // ─── VUE TABLEAU ──────────────────────────────────────────────────
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-slate-200 bg-slate-50/80">
                  <tr>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-12">#</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date & Heure</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Agent</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Service</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">État</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-20">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {currentData.map((collecte, index) => {
                    const serviceName = getServiceName(collecte.service);
                    const personnelName = getPersonnelName(collecte.personnelId);
                    const isExpanded = expandedId === collecte.id;
                    const details = collecte.details || collecte.resume;

                    return (
                      <React.Fragment key={collecte.id}>
                        <tr
                          onClick={() => handleToggleExpand(collecte.id)}
                          className={`border-b border-slate-100 hover:bg-slate-50/80 transition-colors cursor-pointer ${
                            isExpanded ? 'bg-[#0794a4]/5' : ''
                          }`}
                        >
                          <td className="text-center py-3 px-4">
                            <span className="text-slate-400 text-sm font-mono">#{startIndex + index + 1}</span>
                          </td>
                          <td className="text-center py-3 px-4">
                            <div className="flex items-center justify-center gap-2">
                              <Clock className="w-4 h-4 text-slate-400" />
                              <span className="font-mono text-sm">{formatDate(collecte.dateCollecte)}</span>
                            </div>
                          </td>
                          <td className="text-center py-3 px-4">
                            <div className="flex items-center justify-center gap-2">
                              <User className="w-4 h-4 text-slate-400" />
                              <span className="font-medium">{personnelName}</span>
                            </div>
                          </td>
                          <td className="text-center py-3 px-4">
                            <div className="flex items-center justify-center gap-2">
                              <Building className="w-4 h-4 text-slate-400" />
                              <span>{serviceName}</span>
                            </div>
                          </td>
                          <td className="text-center py-3 px-4">
                            {getEtatBadge(collecte.etatCollecte)}
                          </td>
                          <td className="text-center py-3 px-4">
                            {getTypeBadge(collecte.typeCollecte)}
                          </td>
                          <td className="text-center py-3 px-4">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewDetails(collecte);
                                }}
                                className="p-1.5 hover:bg-[#0794a4]/10 rounded-lg transition-colors text-slate-400 hover:text-[#0794a4]"
                                title="Voir les détails"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleExpand(collecte.id);
                                }}
                                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400"
                              >
                                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Détails expansés */}
                        {isExpanded && (
                          <tr>
                            <td colSpan={7} className="p-4 bg-slate-50/50">
                              <ResumeCollecte 
                                details={details}
                                collecte={collecte}
                                onViewDetails={() => handleViewDetails(collecte)}
                              />
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── PAGINATION ────────────────────────────────────────────────── */}
      {totalPages > 1 && !isLoading && (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="text-sm text-slate-500">
            {filteredCollectes.length} collecte(s) · Page {currentPage} / {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              className="rounded-xl"
            >
              Précédent
            </Button>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
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
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-9 h-9 rounded-xl text-sm font-medium transition-colors ${
                      currentPage === pageNum
                        ? 'bg-[#0794a4] text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
              className="rounded-xl"
            >
              Suivant
            </Button>
          </div>
        </div>
      )}

      {/* ─── MODAL DÉTAILS ────────────────────────────────────────────── */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title={`Détails de la collecte #${selectedCollecte?.id}`}
        size="lg"
      >
        {selectedCollecte && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">ID Collecte</label>
                <Input value={`#${selectedCollecte.id}`} disabled className="bg-slate-50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Date</label>
                <Input value={formatDate(selectedCollecte.dateCollecte)} disabled className="bg-slate-50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Agent</label>
                <Input value={getPersonnelName(selectedCollecte.personnelId)} disabled className="bg-slate-50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Service</label>
                <Input value={getServiceName(selectedCollecte.service)} disabled className="bg-slate-50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Chambre</label>
                <Input value={selectedCollecte.codeChambre || "N/A"} disabled className="bg-slate-50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Type</label>
                <div>{getTypeBadge(selectedCollecte.typeCollecte)}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">État</label>
                <div>{getEtatBadge(selectedCollecte.etatCollecte)}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Numéro Collecte</label>
                <Input value={selectedCollecte.numeroCollecte || "N/A"} disabled className="bg-slate-50" />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <ResumeCollecte 
                details={selectedCollecte.resume}
                collecte={selectedCollecte}
                onViewDetails={() => {}}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <Button variant="outline" onClick={() => setIsDetailsModalOpen(false)} className="rounded-xl">
                Fermer
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}