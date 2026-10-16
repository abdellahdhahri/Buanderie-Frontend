import React, { useState, useEffect, useCallback, useContext } from "react";
import { useTranslation } from "react-i18next";
import { ServiceContext } from "../../contextes/ServiceContext";
import { getSetting } from "../../utils/appSettings";
import { useNavigate } from "react-router-dom";
import { Search, Filter, Eye, RefreshCw, Calendar, Clock, Trash2, User, History, Columns3, RotateCcw } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Modal } from "../../components/ui/modal";
import { Input } from "../../components/ui/input";
import Swal from "sweetalert2";

import {
  fetchGlobalHistory,
  fetchPersonnelsByIds,
  fetchPersonnelById,
  formatDate,
  getPersonnelNom,
} from "../../services/historiqueGlobalService";
import { PageHeaderIcon } from "../../components/layout/PageHeaderIcon";
import { SortableHeader } from "../../components/ui/SortableHeader";
import { useSortableData } from "../../hooks/useSortableData";
import { DetailModal } from "../../components/ui/modal-kit";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

const COLUMNS_STORAGE_KEY = "historique.visibleColumns";
const DEFAULT_COLUMNS = ["date", "linge", "service", "operation", "agent", "observations"];

/* ═══════════════════════════════════════════════════════════════
   HELPER — Extraction robuste du nom du personnel
   Gère tous les formats d'API possibles (camelCase, PascalCase...)
   ═══════════════════════════════════════════════════════════════ */
function extractPersonnelName(personnel) {
  if (!personnel) return null;

  // Essayer plusieurs formats possibles
  if (personnel.nomPrenom) return personnel.nomPrenom;
  if (personnel.nom_prenom) return personnel.nom_prenom;
  if (personnel.nomComplet) return personnel.nomComplet;
  if (personnel.fullName) return personnel.fullName;

  // Combiner nom + prénom
  const nom = personnel.nom || personnel.Nom || personnel.lastName || "";
  const prenom = personnel.prenom || personnel.Prenom || personnel.firstName || "";

  if (nom || prenom) {
    return `${nom} ${prenom}`.trim();
  }

  // Fallback : matricule ou code
  if (personnel.matricule) return personnel.matricule;
  if (personnel.code) return personnel.code;

  return null;
}

export default function HistoriqueGlobal() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { services } = useContext(ServiceContext);

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Pagination serveur
  const [page, setPage] = useState(0);
  // Lignes par page : Paramètres › Affichage
  const [size] = useState(() => Number(getSetting("display.pageSize")) || 10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [sortBy] = useState("dateOperation");
  const [direction] = useState("desc");

  // Cache personnels : { personnelId: "Nom Prénom" }
  const [personnelsCache, setPersonnelsCache] = useState({});
  const [loadingPersonnels, setLoadingPersonnels] = useState(false);

  // Colonnes visibles, mémorisées pour cet utilisateur dans ce navigateur
  const [visibleColumnIds, setVisibleColumnIds] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(COLUMNS_STORAGE_KEY));
      if (Array.isArray(saved) && saved.length > 0) return saved;
    } catch {}
    return DEFAULT_COLUMNS;
  });
  const [isColumnsModalOpen, setIsColumnsModalOpen] = useState(false);

  useEffect(() => {
    try { localStorage.setItem(COLUMNS_STORAGE_KEY, JSON.stringify(visibleColumnIds)); } catch {}
  }, [visibleColumnIds]);

  const [filters, setFilters] = useState({
    search: "",
    etat: "",
    dateFrom: "",
    dateTo: "",
    typeOperation: "",
  });

  /* ═══════════════════════════════════════════════════════════════
     CHARGEMENT — Historique + Personnel (nom résolu en batch)
     ═══════════════════════════════════════════════════════════════ */
  const loadHistory = useCallback(async (signal) => {
    try {
      setLoading(true);
      const result = await fetchGlobalHistory(
        { page, size, sortBy, direction },
        signal
      );
      if (!result) return;

      setHistory(result.data);
      setTotalItems(result.totalItems);
      setTotalPages(result.totalPages);

      // ✅ Récupérer tous les IDs du personnel uniques
      const personnelIds = [...new Set(
        result.data
          .map((e) => e.personnelId)
          .filter((id) => id != null)
      )];

      // ✅ Charger les noms du personnel en une seule fois
      if (personnelIds.length > 0) {
        setLoadingPersonnels(true);
        try {
          const personnels = await fetchPersonnelsByIds(personnelIds);

          // ✅ Normaliser le cache : { id: "Nom Prénom" }
          const normalizedCache = {};
          personnels.forEach((p) => {
            const id = p.id || p.Id || p.personnelId;
            const name = extractPersonnelName(p);
            if (id != null) {
              normalizedCache[id] = name || `ID: ${id}`;
            }
          });

          setPersonnelsCache((prev) => ({ ...prev, ...normalizedCache }));
        } catch (err) {
          console.error("Erreur chargement personnels:", err);
        } finally {
          setLoadingPersonnels(false);
        }
      }
    } catch (error) {
      console.error("Erreur chargement historique :", error);
      setHistory([]);
      setTotalItems(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [page, size, sortBy, direction]);

  useEffect(() => {
    const controller = new AbortController();
    loadHistory(controller.signal);
    return () => controller.abort();
  }, [loadHistory]);

  useEffect(() => {
    setPage(0);
  }, [filters.etat, filters.typeOperation, filters.dateFrom, filters.dateTo, filters.search]);

  /* ═══════════════════════════════════════════════════════════════
     CHARGEMENT INDIVIDUEL — Fallback si un ID manque dans le cache
     ═══════════════════════════════════════════════════════════════ */
  const loadPersonnel = useCallback(async (personnelId) => {
    if (!personnelId) return null;
    if (personnelsCache[personnelId]) return personnelsCache[personnelId];

    try {
      const personnel = await fetchPersonnelById(personnelId);
      if (personnel) {
        const name = extractPersonnelName(personnel) || `ID: ${personnelId}`;
        setPersonnelsCache((prev) => ({ ...prev, [personnelId]: name }));
        return name;
      }
      return null;
    } catch (error) {
      console.error("Erreur chargement personnel:", error);
      const fallback = `ID: ${personnelId}`;
      setPersonnelsCache((prev) => ({ ...prev, [personnelId]: fallback }));
      return fallback;
    }
  }, [personnelsCache]);

  /* ═══════════════════════════════════════════════════════════════
     GET PERSONNEL NAME — Résolution depuis le cache
     ═══════════════════════════════════════════════════════════════ */
  const getPersonnelName = useCallback((personnelId, typeOperation) => {
    if (!personnelId) {
      // Opérations automatiques
      if (typeOperation?.startsWith("FIN_")) return "Système";
      return "N/A";
    }

    const cached = personnelsCache[personnelId];
    if (cached) return cached;

    // Fallback : déclencher le chargement async en arrière-plan
    loadPersonnel(personnelId);
    return `ID: ${personnelId}`;
  }, [personnelsCache, loadPersonnel]);

  const getEtatBadge = (etat) => {
    const etatColors = {
      LIVRE: { variant: "success", label: t('historique.etat.LIVRE') },
      COLLECTE: { variant: "warning", label: t('historique.etat.COLLECTE') },
      RECEPTION: { variant: "info", label: t('historique.etat.RECEPTION') },
      EN_TRI: { variant: "info", label: t('historique.etat.EN_TRI') },
      EN_LAVAGE: { variant: "info", label: t('historique.etat.EN_LAVAGE') },
      LAVE: { variant: "success", label: t('historique.etat.LAVE') },
      EN_SECHAGE: { variant: "info", label: t('historique.etat.EN_SECHAGE') },
      SECHE: { variant: "success", label: t('historique.etat.SECHE') },
      PLIE: { variant: "secondary", label: t('historique.etat.PLIE') },
      STOCKE: { variant: "secondary", label: t('historique.etat.STOCKE') },
      MANQUANT: { variant: "destructive", label: t('historique.etat.MANQUANT') },
      HORS_SERVICE: { variant: "destructive", label: t('historique.etat.HORS_SERVICE') },
      PROPRE_PRET: { variant: "success", label: t('historique.etat.PROPRE_PRET') },
      PRET_LIVRAISON: { variant: "success", label: t('historique.etat.PRET_LIVRAISON') },
      RECEPTIONNE: { variant: "success", label: t('historique.etat.RECEPTIONNE') },
      DISTRIBUE: { variant: "success", label: t('historique.etat.DISTRIBUE') },
    };
    const config = etatColors[etat] || { variant: "secondary", label: etat };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getTypeOperationBadge = (type) => {
    const types = {
      COLLECTE: { color: "#8b5cf6", bg: "#f5f3ff", label: t('historique.type.COLLECTE') },
      RECEPTION: { color: "#f59e0b", bg: "#fffbeb", label: t('historique.type.RECEPTION') },
      TRI: { color: "#ec4899", bg: "#fdf2f8", label: t('historique.type.TRI') },
      LAVAGE: { color: "#3b82f6", bg: "#eff6ff", label: t('historique.type.LAVAGE') },
      DEMARRAGE_SECHAGE: { color: "#14b8a6", bg: "#f0fdfa", label: "Démarrage séchage" },
      FIN_SECHAGE: { color: "#14b8a6", bg: "#f0fdfa", label: "Fin séchage" },
      SECHAGE: { color: "#14b8a6", bg: "#f0fdfa", label: t('historique.type.SECHAGE') },
      PLIAGE: { color: "#8b5cf6", bg: "#f5f3ff", label: t('historique.type.PLIAGE') },
      STOCKAGE: { color: "#10b981", bg: "#ecfdf5", label: t('historique.type.STOCKAGE') },
      LIVRAISON: { color: "#ef4444", bg: "#fef2f2", label: t('historique.type.LIVRAISON') },
      CHANGEMENT_ETAT: { color: "#64748b", bg: "#f1f5f9", label: t('historique.type.CHANGEMENT_ETAT') },
    };
    const config = types[type] || { color: "#64748b", bg: "#f1f5f9", label: type };
    return (
      <Badge style={{ background: config.bg, color: config.color, border: `1px solid ${config.color}30` }}>
        {config.label}
      </Badge>
    );
  };

  // ─── Handlers ───────────────────────────────────────────────────────
  const resetFilters = () => {
    setFilters({ search: "", etat: "", dateFrom: "", dateTo: "", typeOperation: "" });
    setPage(0);
  };

  const handleViewDetails = useCallback(async (entry) => {
    setSelectedEntry(entry);
    setIsDetailsModalOpen(true);
    // Charger le personnel à la demande si pas en cache
    if (entry.personnelId && !personnelsCache[entry.personnelId]) {
      await loadPersonnel(entry.personnelId);
    }
  }, [personnelsCache, loadPersonnel]);

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: t('historique.delete_confirm_title'),
      text: t('historique.delete_confirm_text'),
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: t('historique.delete_confirm_yes'),
      cancelButtonText: t('common.cancel'),
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`${API_URL}/api/historique/${id}`, { method: "DELETE" });
        if (response.ok) {
          const controller = new AbortController();
          loadHistory(controller.signal);
          Swal.fire({
            title: "✅",
            text: t('historique.delete_success'),
            icon: "success",
            timer: 1500,
            showConfirmButton: false,
          });
        } else {
          throw new Error("Erreur lors de la suppression");
        }
      } catch (error) {
        Swal.fire({ title: "❌", text: t('historique.delete_error'), icon: "error" });
      }
    }
  };

  const goToPage = (newPage) => {
    if (newPage < 0 || newPage >= totalPages) return;
    setPage(newPage);
  };

  // Service du linge concerné (code du service via ServiceContext)
  const getServiceName = (entry) => {
    const direct = entry.serviceNom || entry.serviceCode || entry.linge?.serviceNom || entry.linge?.serviceCode;
    if (direct) return direct;
    const serviceId = entry.linge?.serviceId ?? entry.serviceId;
    if (serviceId == null) return "";
    const s = (services || []).find((x) => String(x.id) === String(serviceId));
    return s ? (s.code || s.nom || s.libelle || "") : "";
  };

  // Filtrage client sur la page courante
  const filteredHistory = history.filter((entry) => {
    const codeLinge = entry.linge?.codeBarre || entry.lingeId || "";
    const remarques = entry.observations || entry.remarques || "";
    const agentNom = getPersonnelName(entry.personnelId, entry.typeOperation);
    const searchLower = filters.search.toLowerCase();

    const matchSearch =
      !searchLower ||
      codeLinge.toLowerCase().includes(searchLower) ||
      remarques.toLowerCase().includes(searchLower) ||
      getServiceName(entry).toLowerCase().includes(searchLower) ||
      agentNom.toLowerCase().includes(searchLower);

    const matchEtat = filters.etat ? entry.etatApres === filters.etat : true;
    const matchType = filters.typeOperation ? entry.typeOperation === filters.typeOperation : true;

    const entryDate = entry.dateOperation ? new Date(entry.dateOperation) : new Date();
    const matchDateFrom = filters.dateFrom ? entryDate >= new Date(filters.dateFrom) : true;
    const matchDateTo = filters.dateTo ? entryDate <= new Date(filters.dateTo + "T23:59:59") : true;

    return matchSearch && matchEtat && matchType && matchDateFrom && matchDateTo;
  });

  // Tri par colonne (clic sur l'en-tête : croissant → décroissant → aucun)
  const { sortedItems: sortedHistory, requestSort, directionFor } = useSortableData(filteredHistory, {
    linge: (e) => e.linge?.codeBarre || e.codeLinge,
    service: (e) => getServiceName(e),
    etat: (e) => e.etatApres || e.etat,
    agent: (e) => getPersonnelName(e.personnelId, e.typeOperation),
  });

  const isLoading = loading || loadingPersonnels;

  // ─── Colonnes du tableau (affichage paramétrable) ─────────────────────
  const columns = [
    {
      id: "date", label: t('historique.date_time'), sortKey: "dateOperation",
      render: (e) => (
        <div className="flex items-center justify-center gap-2">
          <Clock className="w-4 h-4 text-slate-400" />
          <span className="font-mono text-sm">{formatDate(e.dateOperation)}</span>
        </div>
      ),
    },
    {
      id: "linge", label: t('historique.linen_code'), sortKey: "linge",
      render: (e) => <span className="font-mono text-sm">{e.linge?.codeBarre || e.codeLinge || e.lingeId || "N/A"}</span>,
    },
    {
      id: "service", label: t('common.service'), sortKey: "service",
      render: (e) => {
        const nom = getServiceName(e);
        return <span className={`text-sm ${nom ? "" : "text-slate-400"}`}>{nom || "—"}</span>;
      },
    },
    {
      id: "etat", label: t('historique.state'), sortKey: "etat",
      render: (e) => getEtatBadge(e.etatApres || e.etat || "—"),
    },
    {
      id: "operation", label: t('historique.operation'), sortKey: "typeOperation",
      render: (e) => getTypeOperationBadge(e.typeOperation),
    },
    {
      id: "agent", label: t('historique.agent'), sortKey: "agent",
      render: (e) => (
        <div className="flex items-center justify-center gap-2">
          <User className="w-4 h-4 text-slate-400" />
          <span className={`text-sm ${!e.personnelId ? "italic text-slate-400" : ""}`}>
            {getPersonnelName(e.personnelId, e.typeOperation)}
          </span>
        </div>
      ),
    },
    {
      id: "observations", label: t('historique.observations'), cellStyle: { maxWidth: "260px" },
      render: (e) => {
        const obs = e.observations || e.remarques;
        return obs
          ? <span className="text-sm text-slate-600 block truncate" title={obs}>{obs}</span>
          : <span className="text-sm text-slate-400">—</span>;
      },
    },
  ];
  const visibleColumns = columns.filter((c) => visibleColumnIds.includes(c.id));

  const toggleColumn = (id) => {
    setVisibleColumnIds((prev) => {
      // Au moins une colonne reste affichée
      if (prev.includes(id)) return prev.length > 1 ? prev.filter((c) => c !== id) : prev;
      return columns.map((c) => c.id).filter((c) => c === id || prev.includes(c));
    });
  };

  /* ═══════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-6">

      {/* ═══════════════════════════════════════════════════════════
          HEADER PREMIUM — Identique aux autres écrans
          ═══════════════════════════════════════════════════════════ */}
      <div style={{ marginBottom: "32px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "8px",
          }}
        >
          <PageHeaderIcon size={52} />
          <div>
            <h1
              style={{
                fontSize: "28px",
                fontWeight: 800,
                color: "#0f172a",
                margin: 0,
              }}
            >
              {t('historique.title')}
            </h1>
            <p
              style={{
                fontSize: "14px",
                color: "#64748b",
                margin: "2px 0 0 0",
              }}
            >
              {totalItems} {t('historique.entries_found')}
            </p>
          </div>
        </div>
      </div>

      {/* ═══════ TOOLBAR ═══════ */}
      <div className="flex flex-wrap items-center gap-3 bg-white/65 backdrop-blur-md p-4 rounded-[20px] border border-slate-200/50 shadow-[0_4px_20px_rgba(0,0,0,0.02)] mb-6">
        <button
          onClick={() => loadHistory()}
          disabled={isLoading}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#0ca678]/30 rounded-[14px] text-sm font-bold text-[#0ca678] hover:bg-[#0ca678]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02] disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 stroke-[2.5] ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? t('common.loading') : t('common.refresh')}
        </button>
        <button
          disabled={!selectedEntry}
          onClick={() => selectedEntry && handleViewDetails(selectedEntry)}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#006f94]/30 rounded-[14px] text-sm font-bold text-[#006f94] hover:bg-[#006f94]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
        >
          <Eye className="w-4 h-4 stroke-[2.5]" /> {t('common.details')}
        </button>
        <button
          disabled={!selectedEntry}
          onClick={() => selectedEntry && handleDelete(selectedEntry.id)}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#e03131]/30 rounded-[14px] text-sm font-bold text-[#e03131] hover:bg-[#e03131]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
        >
          <Trash2 className="w-4 h-4 stroke-[2.5]" /> {t('common.delete')}
        </button>
        <button
          onClick={resetFilters}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#e67700]/30 rounded-[14px] text-sm font-bold text-[#e67700] hover:bg-[#e67700]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02]"
        >
          <Filter className="w-4 h-4 stroke-[2.5]" /> {t('common.reset')}
        </button>
        <button
          onClick={() => setIsColumnsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#475569]/30 rounded-[14px] text-sm font-bold text-[#475569] hover:bg-[#475569]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02] ml-auto"
        >
          <Columns3 className="w-4 h-4 stroke-[2.5]" /> {t('historique.columns_button')}
          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-xs font-semibold">
            {visibleColumns.length}/{columns.length}
          </span>
        </button>
      </div>

      {/* ═══════ FILTRES — Type, État, Recherche ═══════ */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder={t('historique.search_placeholder')}
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full h-10 pl-10 pr-4 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <select
              value={filters.etat}
              onChange={(e) => setFilters({ ...filters, etat: e.target.value })}
              className="w-full h-10 px-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">{t('historique.all_states')}</option>
              <option value="LIVRE">{t('historique.etat.LIVRE')}</option>
              <option value="COLLECTE">{t('historique.etat.COLLECTE')}</option>
              <option value="LAVE">{t('historique.etat.LAVE')}</option>
              <option value="SECHE">{t('historique.etat.SECHE')}</option>
              <option value="PLIE">{t('historique.etat.PLIE')}</option>
              <option value="STOCKE">{t('historique.etat.STOCKE')}</option>
            </select>
            <select
              value={filters.typeOperation}
              onChange={(e) => setFilters({ ...filters, typeOperation: e.target.value })}
              className="w-full h-10 px-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">{t('historique.all_types')}</option>
              <option value="COLLECTE">{t('historique.type.COLLECTE')}</option>
              <option value="LAVAGE">{t('historique.type.LAVAGE')}</option>
              <option value="DEMARRAGE_SECHAGE">Démarrage séchage</option>
              <option value="FIN_SECHAGE">Fin séchage</option>
              <option value="PLIAGE">{t('historique.type.PLIAGE')}</option>
              <option value="STOCKAGE">{t('historique.type.STOCKAGE')}</option>
              <option value="LIVRAISON">{t('historique.type.LIVRAISON')}</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* ═══════ FILTRES — Dates ═══════ */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t('historique.date_from')}</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                className="w-full h-10 px-4 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t('historique.date_to')}</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                className="w-full h-10 px-4 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ═══════ TABLEAU ═══════ */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <RefreshCw className="animate-spin w-10 h-10 text-[#0794a4] mx-auto mb-4" />
            <p className="text-slate-500 font-medium">{t('common.loading')}</p>
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="premium-table-wrap">
              <table className="premium-table">
                <thead>
                  <tr>
                    {visibleColumns.map((col) =>
                      col.sortKey ? (
                        <SortableHeader key={col.id} direction={directionFor(col.sortKey)} onSort={() => requestSort(col.sortKey)} align="center">
                          {col.label}
                        </SortableHeader>
                      ) : (
                        <th key={col.id} style={{ textAlign: "center" }}>{col.label}</th>
                      )
                    )}
                    <th style={{ textAlign: "center" }}>{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedHistory.length === 0 ? (
                    <tr>
                      <td colSpan={visibleColumns.length + 1} className="text-center py-8 text-muted-foreground">
                        {t('historique.no_history')}
                      </td>
                    </tr>
                  ) : (
                    sortedHistory.map((entry) => {
                      const isSelected = selectedEntry?.id === entry.id;

                      return (
                        <tr
                          key={entry.id}
                          onClick={() => setSelectedEntry(isSelected ? null : entry)}
                          className={isSelected ? "expanded bg-[#0794a4]/5" : ""}
                          style={{ cursor: "pointer" }}
                        >
                          {visibleColumns.map((col) => (
                            <td key={col.id} className="text-center py-3 px-4" style={col.cellStyle}>
                              {col.render(entry)}
                            </td>
                          ))}
                          <td className="text-center py-3 px-4">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewDetails(entry);
                              }}
                              className="text-[#0794a4] hover:text-[#068391] font-semibold text-sm flex items-center gap-1.5 hover:underline mx-auto"
                            >
                              <Eye className="w-4 h-4" /> {t('common.details')}
                            </button>
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
      )}

      {/* ═══════ PAGINATION ═══════ */}
      {totalPages > 1 && !isLoading && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-muted-foreground">
            {totalItems} {t('historique.entries_found')}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => goToPage(page - 1)}>
              {t('common.previous')}
            </Button>
            <span className="text-sm">
              {t('common.page')} {page + 1} / {totalPages}
            </span>
            <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => goToPage(page + 1)}>
              {t('common.next')}
            </Button>
          </div>
        </div>
      )}

      {/* ═══════ MODAL COLONNES ═══════ */}
      <Modal
        isOpen={isColumnsModalOpen}
        onClose={() => setIsColumnsModalOpen(false)}
        title={t('historique.columns_title')}
        subtitle={t('historique.columns_hint')}
        icon={<Columns3 className="w-5 h-5" />}
        size="sm"
        footer={
          <div className="flex w-full items-center justify-between gap-2">
            <Button variant="outline" size="sm" onClick={() => setVisibleColumnIds(DEFAULT_COLUMNS)}>
              <RotateCcw className="w-4 h-4" /> {t('historique.columns_reset')}
            </Button>
            <Button size="sm" onClick={() => setIsColumnsModalOpen(false)}>
              {t('common.close')}
            </Button>
          </div>
        }
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-500">
            {t('historique.columns_count', { count: visibleColumns.length, total: columns.length })}
          </span>
          <button
            type="button"
            onClick={() => setVisibleColumnIds(columns.map((c) => c.id))}
            disabled={visibleColumns.length === columns.length}
            className="text-xs font-semibold text-[#0d9488] hover:underline disabled:text-slate-300 disabled:no-underline"
          >
            {t('historique.columns_show_all')}
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {columns.map((col) => {
            const checked = visibleColumnIds.includes(col.id);
            const locked = checked && visibleColumns.length === 1;
            return (
              <label
                key={col.id}
                className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border transition-colors ${
                  checked ? "border-[#0d9488]/40 bg-[#0d9488]/5" : "border-slate-200 bg-white hover:bg-slate-50"
                } ${locked ? "cursor-not-allowed" : "cursor-pointer"}`}
              >
                <span className={`text-sm font-semibold ${checked ? "text-slate-800" : "text-slate-500"}`}>
                  {col.label}
                </span>
                <span className="relative inline-flex items-center">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={checked}
                    disabled={locked}
                    onChange={() => toggleColumn(col.id)}
                  />
                  <span className="w-9 h-5 rounded-full bg-slate-200 transition-colors peer-checked:bg-[#0d9488] peer-focus-visible:ring-2 peer-focus-visible:ring-[#0d9488]/40" />
                  <span className="absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
                </span>
              </label>
            );
          })}
        </div>
      </Modal>

      {/* ═══════ MODAL DÉTAILS ═══════ */}
      <DetailModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title={t('historique.movement_details')}
        subtitle={selectedEntry ? `#${selectedEntry.id}` : undefined}
        heading={selectedEntry?.linge?.codeBarre}
        badges={selectedEntry && getTypeOperationBadge(selectedEntry.typeOperation)}
        sections={selectedEntry ? [
          { title: t('modal.movement', 'Mouvement'), icon: "stats", items: [
            { label: t('historique.state_before'), render: getEtatBadge(selectedEntry.etatAvant) },
            { label: t('historique.state_after'), render: getEtatBadge(selectedEntry.etatApres) },
            { label: t('historique.date_time'), value: formatDate(selectedEntry.dateOperation) },
          ] },
          { title: t('modal.identification', 'Identification'), icon: "id", items: [
            { label: t('common.id'), value: selectedEntry.id, mono: true },
            { label: t('historique.linen_code'), value: selectedEntry.linge?.codeBarre, mono: true },
            { label: t('common.service'), value: getServiceName(selectedEntry) || "—" },
            { label: t('historique.agent'), value: getPersonnelName(selectedEntry.personnelId, selectedEntry.typeOperation) },
          ] },
          { title: t('historique.observations'), icon: "notes", items: [
            { label: t('historique.observations'), value: selectedEntry.observations, span: 2 },
          ] },
        ] : []}
        actions={selectedEntry && (
          <Button variant="danger" onClick={() => { handleDelete(selectedEntry.id); setIsDetailsModalOpen(false); }}>
            <Trash2 className="w-4 h-4" />
            {t('common.delete')}
          </Button>
        )}
      />
    </div>
  );
}