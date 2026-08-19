import React, { useState, useEffect, useContext } from "react";
import { LingeContext } from "../../contextes/LingeContext";
import { useNavigate } from "react-router-dom";
import { Search, Filter, Eye, RefreshCw, Calendar, Clock, Trash2, User, Tag, Box, ArrowRight } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Select } from "../../components/ui/select";
import { Modal } from "../../components/ui/modal";
import { Input } from "../../components/ui/input";
import Swal from "sweetalert2";

// ─── Variables d'environnement ──────────────────────────────────────────────
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

export default function HistoriqueGlobal() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const itemsPerPage = 10;

  const [filters, setFilters] = useState({
    search: "",
    etat: "",
    dateFrom: "",
    dateTo: "",
    typeOperation: "",
  });

  const { fetchGlobalHistory } = useContext(LingeContext);
  const navigate = useNavigate();

  useEffect(() => {
    loadHistory();
  }, []);
  
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);
  
  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await fetchGlobalHistory();
      console.log("Historique chargé:", data);
      setHistory(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erreur chargement historique :", error);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateShort = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getEtatBadge = (etat) => {
    const etatColors = {
      LIVRE: { variant: "success", label: "En service" },
      COLLECTE: { variant: "warning", label: "Collecté" },
      RECEPTION: { variant: "info", label: "Réception" },
      EN_TRI: { variant: "info", label: "En tri" },
      EN_LAVAGE: { variant: "info", label: "En lavage" },
      LAVE: { variant: "success", label: "Lavé" },
      EN_SECHAGE: { variant: "info", label: "Séchage" },
      SECHE: { variant: "success", label: "Séché" },
      PLIE: { variant: "secondary", label: "Plié" },
      STOCKE: { variant: "secondary", label: "Stocké" },
      MANQUANT: { variant: "destructive", label: "Manquant" },
      HORS_SERVICE: { variant: "destructive", label: "Hors service" },
      PROPRE_PRET: { variant: "success", label: "Propre/Prêt" },
      PRET_LIVRAISON: { variant: "success", label: "Prêt livraison" },
      RECEPTIONNE: { variant: "success", label: "Réceptionné" },
      DISTRIBUE: { variant: "success", label: "Distribué" },
    };
    const config = etatColors[etat] || { variant: "secondary", label: etat };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getTypeOperationBadge = (type) => {
    const types = {
      COLLECTE: { color: "#8b5cf6", bg: "#f5f3ff", label: "Collecte" },
      RECEPTION: { color: "#f59e0b", bg: "#fffbeb", label: "Réception" },
      TRI: { color: "#ec4899", bg: "#fdf2f8", label: "Tri" },
      LAVAGE: { color: "#3b82f6", bg: "#eff6ff", label: "Lavage" },
      SECHAGE: { color: "#14b8a6", bg: "#f0fdfa", label: "Séchage" },
      PLIAGE: { color: "#8b5cf6", bg: "#f5f3ff", label: "Pliage" },
      STOCKAGE: { color: "#10b981", bg: "#ecfdf5", label: "Stockage" },
      LIVRAISON: { color: "#ef4444", bg: "#fef2f2", label: "Livraison" },
      CHANGEMENT_ETAT: { color: "#64748b", bg: "#f1f5f9", label: "Chgt état" },
    };
    const config = types[type] || { color: "#64748b", bg: "#f1f5f9", label: type };
    return (
      <Badge style={{ background: config.bg, color: config.color, border: `1px solid ${config.color}30` }}>
        {config.label}
      </Badge>
    );
  };

  const getPosteBadge = (poste) => {
    const postes = {
      AGENT_COLLECTE: { color: "#8b5cf6", label: "Collecte" },
      AGENT_RECEPTION: { color: "#f59e0b", label: "Réception" },
      AGENT_TRI: { color: "#ec4899", label: "Tri" },
      AGENT_LAVAGE: { color: "#3b82f6", label: "Lavage" },
      AGENT_SECHAGE: { color: "#14b8a6", label: "Séchage" },
      AGENT_PLIAGE: { color: "#8b5cf6", label: "Pliage" },
      AGENT_STOCKAGE: { color: "#10b981", label: "Stockage" },
      AGENT_LIVRAISON: { color: "#ef4444", label: "Livraison" },
      CHEF_EQUIPE: { color: "#1e293b", label: "Chef" },
    };
    const config = postes[poste] || { color: "#64748b", label: poste };
    return <span style={{ color: config.color, fontWeight: 500 }}>{config.label}</span>;
  };

  const filteredHistory = history.filter((entry) => {
    const codeLinge = entry.linge?.codeBarre || entry.lingeId || "";
    const remarques = entry.observations || entry.remarques || "";
    const agentNom = entry.agent?.nom || entry.agentNom || "";
    const searchLower = filters.search.toLowerCase();

    const matchSearch = 
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

  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = filteredHistory.slice(startIndex, startIndex + itemsPerPage);

  const resetFilters = () => {
    setFilters({
      search: "",
      etat: "",
      dateFrom: "",
      dateTo: "",
      typeOperation: "",
    });
  };

  const handleViewDetails = (entry) => {
    setSelectedEntry(entry);
    setIsDetailsModalOpen(true);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Supprimer cette entrée ?",
      text: "Cette action est irréversible.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Oui, supprimer !",
      cancelButtonText: "Annuler",
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`${API_URL}/api/historique/${id}`, {
          method: "DELETE",
        });
        if (response.ok) {
          setHistory(history.filter(h => h.id !== id));
          Swal.fire({
            title: "✅ Supprimé !",
            text: "Entrée supprimée avec succès.",
            icon: "success",
            timer: 1500,
            showConfirmButton: false,
          });
        } else {
          throw new Error("Erreur lors de la suppression");
        }
      } catch (error) {
        Swal.fire({
          title: "❌ Erreur",
          text: "Impossible de supprimer cette entrée.",
          icon: "error",
        });
      }
    }
  };

  return (
    <div className="space-y-8">

      <div className="space-y-2">
        <div className="page-header" style={{ marginBottom: 0, textAlign: "left" }}>
  <h1 className="text-3xl font-extrabold flex items-center gap-3 text-blue-600">
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="30" 
      height="30" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className="flex-shrink-0"
      style={{ display: 'block' }}
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
    Journal des Activités
  </h1>
</div>
      </div>

      <div className="flex flex-wrap items-center gap-3 bg-white/65 backdrop-blur-md p-4 rounded-[20px] border border-slate-200/50 shadow-[0_4px_20px_rgba(0,0,0,0.02)] mb-6">
        <button
          onClick={loadHistory}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#0ca678]/30 rounded-[14px] text-sm font-bold text-[#0ca678] hover:bg-[#0ca678]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02]"
        >
          <RefreshCw className="w-4 h-4 stroke-[2.5]" /> Actualiser
        </button>
        <button
          disabled={!selectedEntry}
          onClick={() => selectedEntry && handleViewDetails(selectedEntry)}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#006f94]/30 rounded-[14px] text-sm font-bold text-[#006f94] hover:bg-[#006f94]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
        >
          <Eye className="w-4 h-4 stroke-[2.5]" /> Détails
        </button>
        <button
          disabled={!selectedEntry}
          onClick={() => selectedEntry && handleDelete(selectedEntry.id)}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#e03131]/30 rounded-[14px] text-sm font-bold text-[#e03131] hover:bg-[#e03131]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
        >
          <Trash2 className="w-4 h-4 stroke-[2.5]" /> Supprimer
        </button>
        <button
          onClick={resetFilters}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#e67700]/30 rounded-[14px] text-sm font-bold text-[#e67700] hover:bg-[#e67700]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02]"
        >
          <Filter className="w-4 h-4 stroke-[2.5]" /> Réinitialiser
        </button>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Rechercher par code, agent ou remarque..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="w-full h-10 pl-10 pr-4 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
            <div>
              <select
                value={filters.etat}
                onChange={(e) => setFilters({ ...filters, etat: e.target.value })}
                className="w-full h-10 px-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Tous les états</option>
                <option value="LIVRE">En service</option>
                <option value="COLLECTE">Collecté</option>
                <option value="RECEPTION">Réception</option>
                <option value="EN_TRI">En tri</option>
                <option value="EN_LAVAGE">En lavage</option>
                <option value="LAVE">Lavé</option>
                <option value="EN_SECHAGE">Séchage</option>
                <option value="SECHE">Séché</option>
                <option value="PLIE">Plié</option>
                <option value="STOCKE">Stocké</option>
                <option value="MANQUANT">Manquant</option>
                <option value="HORS_SERVICE">Hors service</option>
                <option value="PROPRE_PRET">Propre/Prêt</option>
                <option value="PRET_LIVRAISON">Prêt livraison</option>
              </select>
            </div>
            <div>
              <select
                value={filters.typeOperation}
                onChange={(e) => setFilters({ ...filters, typeOperation: e.target.value })}
                className="w-full h-10 px-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Tous les types</option>
                <option value="COLLECTE">Collecte</option>
                <option value="RECEPTION">Réception</option>
                <option value="TRI">Tri</option>
                <option value="LAVAGE">Lavage</option>
                <option value="SECHAGE">Séchage</option>
                <option value="PLIAGE">Pliage</option>
                <option value="STOCKAGE">Stockage</option>
                <option value="LIVRAISON">Livraison</option>
                <option value="CHANGEMENT_ETAT">Changement d'état</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Date début</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                  className="w-full h-10 pl-10 pr-4 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Date fin</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                  className="w-full h-10 pl-10 pr-4 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="param-table">
              <thead>
                <tr>
                  <th className="text-center py-3 px-4">Date & Heure</th>
                  <th className="text-center py-3 px-4">Code Linge</th>
                  <th className="text-center py-3 px-4">État</th>
                  <th className="text-center py-3 px-4">Opération</th>
                  <th className="text-center py-3 px-4">Agent</th>
                  <th className="text-center py-3 px-4 actions-th">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted-foreground">
                      Chargement en cours...
                    </td>
                  </tr>
                ) : currentData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted-foreground">
                      Aucun historique trouvé
                    </td>
                  </tr>
                ) : (
                  currentData.map((entry) => {
                    const isSelected = selectedEntry?.id === entry.id;
                    const codeLinge = entry.linge?.codeBarre || entry.codeLinge || entry.lingeId || "N/A";
                    const agentNom = entry.agent?.nom || entry.agentNom || "—";
                    const etat = entry.etatApres || entry.etat || "—";
                    
                    return (
                      <tr
                        key={entry.id}
                        onClick={() => setSelectedEntry(isSelected ? null : entry)}
                        className={isSelected ? "expanded" : ""}
                        style={{ cursor: "pointer" }}
                      >
                        <td className="text-center py-3 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span className="font-mono text-sm">{formatDate(entry.dateOperation)}</span>
                          </div>
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className="code-badge font-mono text-sm">{codeLinge}</span>
                        </td>
                        <td className="text-center py-3 px-4">{getEtatBadge(etat)}</td>
                        <td className="text-center py-3 px-4">{getTypeOperationBadge(entry.typeOperation)}</td>
                        <td className="text-center py-3 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">{agentNom}</span>
                          </div>
                        </td>
                        <td className="text-center py-3 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewDetails(entry);
                              }}
                              className="text-[#0794a4] hover:text-[#068391] font-semibold text-sm flex items-center gap-1.5 hover:underline"
                            >
                              <Eye className="w-4 h-4" /> Détails
                            </button>
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-muted-foreground">
            {filteredHistory.length} entrée(s) trouvée(s)
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              Précédent
            </Button>
            <span className="text-sm">
              Page {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}

      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title={`Détails du mouvement - Linge ${selectedEntry?.linge?.codeBarre || selectedEntry?.lingeId || 'N/A'}`}
        size="lg"
      >
        {selectedEntry && (
          <React.Fragment>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ID</label>
                <Input value={`#${selectedEntry.id}`} disabled />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Code Linge</label>
                <Input value={selectedEntry.linge?.codeBarre || selectedEntry.codeLinge || "N/A"} disabled />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
                <Input value={selectedEntry.linge?.categorie || "—"} disabled />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Poids</label>
                <Input value={selectedEntry.linge?.poids ? `${selectedEntry.linge.poids} kg` : "—"} disabled />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">État avant</label>
                <div className="mt-1">{getEtatBadge(selectedEntry.etatAvant)}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">État après</label>
                <div className="mt-1">{getEtatBadge(selectedEntry.etatApres)}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Opération</label>
                <div className="mt-1">{getTypeOperationBadge(selectedEntry.typeOperation)}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date & Heure</label>
                <Input value={formatDate(selectedEntry.dateOperation)} disabled />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Agent</label>
                <div className="flex items-center gap-2 p-2 rounded-lg border border-input bg-slate-50">
                  <User className="w-4 h-4 text-slate-400" />
                  <span>{selectedEntry.agent?.nom || selectedEntry.agentNom || "—"}</span>
                  {selectedEntry.agent?.poste && (
                    <Badge variant="outline" className="text-xs ml-auto">
                      {getPosteBadge(selectedEntry.agent.poste)}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Observations</label>
                <textarea
                  className="w-full min-h-[80px] px-3 py-2 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedEntry.observations || selectedEntry.remarques || "Aucune remarque"}
                  disabled
                />
              </div>
              {selectedEntry.collecte && (
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Informations collecte</label>
                  <div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <div>
                      <span className="text-xs text-slate-400">Numéro</span>
                      <p className="text-sm font-medium">{selectedEntry.collecte.numeroCollecte || "—"}</p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400">Type</span>
                      <p className="text-sm font-medium">{selectedEntry.collecte.typeCollecte || "—"}</p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400">Chambre</span>
                      <p className="text-sm font-medium">{selectedEntry.collecte.codeChambre || "—"}</p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400">État collecte</span>
                      <Badge variant={selectedEntry.collecte.etatCollecte === "verifie" ? "success" : "secondary"}>
                        {selectedEntry.collecte.etatCollecte || "—"}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setIsDetailsModalOpen(false)}>
                Fermer
              </Button>
              <Button
                onClick={() => {
                  if (selectedEntry) handleDelete(selectedEntry.id);
                  setIsDetailsModalOpen(false);
                }}
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer
              </Button>
            </div>
          </React.Fragment>
        )}
      </Modal>
    </div>
  );
}