import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Search, Filter, Eye, RefreshCw, Calendar, Clock, Trash2, User, History } from "lucide-react";
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

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

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

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Pagination serveur
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [sortBy] = useState("dateOperation");
  const [direction] = useState("desc");

  // Cache personnels : { personnelId: "Nom Prénom" }
  const [personnelsCache, setPersonnelsCache] = useState({});
  const [loadingPersonnels, setLoadingPersonnels] = useState(false);

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
      agentNom.toLowerCase().includes(searchLower);

    const matchEtat = filters.etat ? entry.etatApres === filters.etat : true;
    const matchType = filters.typeOperation ? entry.typeOperation === filters.typeOperation : true;

    const entryDate = entry.dateOperation ? new Date(entry.dateOperation) : new Date();
    const matchDateFrom = filters.dateFrom ? entryDate >= new Date(filters.dateFrom) : true;
    const matchDateTo = filters.dateTo ? entryDate <= new Date(filters.dateTo + "T23:59:59") : true;

    return matchSearch && matchEtat && matchType && matchDateFrom && matchDateTo;
  });

  const isLoading = loading || loadingPersonnels;

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
          <div
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, #f472b6, #ec4899)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              boxShadow: "0 4px 16px rgba(244, 114, 182, 0.25)",
            }}
          >
            <History className="w-6 h-6 stroke-[2.5]" />
          </div>
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
            <div className="overflow-x-auto">
              <table className="param-table w-full">
                <thead className="border-b border-slate-200 bg-slate-50/80">
                  <tr>
                    <th className="text-center py-3 px-4">{t('historique.date_time')}</th>
                    <th className="text-center py-3 px-4">{t('historique.linen_code')}</th>
                    <th className="text-center py-3 px-4">{t('historique.state')}</th>
                    <th className="text-center py-3 px-4">{t('historique.operation')}</th>
                    <th className="text-center py-3 px-4">{t('historique.agent')}</th>
                    <th className="text-center py-3 px-4">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-muted-foreground">
                        {t('historique.no_history')}
                      </td>
                    </tr>
                  ) : (
                    filteredHistory.map((entry) => {
                      const isSelected = selectedEntry?.id === entry.id;
                      const codeLinge = entry.linge?.codeBarre || entry.codeLinge || entry.lingeId || "N/A";
                      const etat = entry.etatApres || entry.etat || "—";
                      const agentNom = getPersonnelName(entry.personnelId, entry.typeOperation);

                      return (
                        <tr
                          key={entry.id}
                          onClick={() => setSelectedEntry(isSelected ? null : entry)}
                          className={isSelected ? "expanded bg-[#0794a4]/5" : ""}
                          style={{ cursor: "pointer" }}
                        >
                          <td className="text-center py-3 px-4">
                            <div className="flex items-center justify-center gap-2">
                              <Clock className="w-4 h-4 text-slate-400" />
                              <span className="font-mono text-sm">{formatDate(entry.dateOperation)}</span>
                            </div>
                          </td>
                          <td className="text-center py-3 px-4">
                            <span className="font-mono text-sm">{codeLinge}</span>
                          </td>
                          <td className="text-center py-3 px-4">{getEtatBadge(etat)}</td>
                          <td className="text-center py-3 px-4">{getTypeOperationBadge(entry.typeOperation)}</td>
                          <td className="text-center py-3 px-4">
                            <div className="flex items-center justify-center gap-2">
                              <User className="w-4 h-4 text-slate-400" />
                              <span className={`text-sm ${!entry.personnelId ? "italic text-slate-400" : ""}`}>
                                {agentNom}
                              </span>
                            </div>
                          </td>
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

      {/* ═══════ MODAL DÉTAILS ═══════ */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title={`${t('historique.movement_details')} - ${selectedEntry?.linge?.codeBarre || 'N/A'}`}
        size="lg"
      >
        {selectedEntry && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t('common.id')}</label>
              <Input value={`#${selectedEntry.id}`} disabled />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t('historique.linen_code')}</label>
              <Input value={selectedEntry.linge?.codeBarre || "N/A"} disabled />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t('historique.state_before')}</label>
              <div className="mt-1">{getEtatBadge(selectedEntry.etatAvant)}</div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t('historique.state_after')}</label>
              <div className="mt-1">{getEtatBadge(selectedEntry.etatApres)}</div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t('historique.operation')}</label>
              <div className="mt-1">{getTypeOperationBadge(selectedEntry.typeOperation)}</div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t('historique.date_time')}</label>
              <Input value={formatDate(selectedEntry.dateOperation)} disabled />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-2">{t('historique.agent')}</label>
              <div className="flex items-center gap-2 p-2 rounded-lg border border-input bg-slate-50">
                <User className="w-4 h-4 text-slate-400" />
                <span className={!selectedEntry.personnelId ? "italic text-slate-400" : ""}>
                  {getPersonnelName(selectedEntry.personnelId, selectedEntry.typeOperation)}
                </span>
                {selectedEntry.personnelId && (
                  <Badge variant="outline" className="text-xs ml-auto font-mono">
                    #{selectedEntry.personnelId}
                  </Badge>
                )}
              </div>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-2">{t('historique.observations')}</label>
              <textarea
                className="w-full min-h-[80px] px-3 py-2 rounded-lg border border-gray-300 bg-gray-50"
                value={selectedEntry.observations || "—"}
                disabled
              />
            </div>
            <div className="col-span-2 flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsDetailsModalOpen(false)}>
                {t('common.close')}
              </Button>
              <Button
                onClick={() => {
                  handleDelete(selectedEntry.id);
                  setIsDetailsModalOpen(false);
                }}
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" /> {t('common.delete')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}