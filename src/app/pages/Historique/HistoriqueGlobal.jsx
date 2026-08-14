import React, { useState, useEffect, useContext } from "react";
import { LingeContext } from "../../contextes/LingeContext";
import { useNavigate } from "react-router-dom";
import { Search, Filter, Eye, RefreshCw, Calendar, Clock, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Select } from "../../components/ui/select";
import { Modal } from "../../components/ui/modal";
import { Input } from "../../components/ui/input";
import Swal from "sweetalert2";

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
      console.log("l histrique :", data)
      setHistory(Array.isArray(data) ? data : []);
      console.log("historique ", history)
    } catch (error) {
      console.error("Erreur chargement historique :", error);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredHistory = history.filter((entry) => {
    const matchSearch =
      entry.lingeId.toString().includes(filters.search) ||
      (entry.remarques || "").toLowerCase().includes(filters.search.toLowerCase());

    const matchEtat = filters.etat ? entry.etat === filters.etat : true;
    const entryDate = new Date(entry.dateHeureMouvement);
    const matchDateFrom = filters.dateFrom ? entryDate >= new Date(filters.dateFrom) : true;
    const matchDateTo = filters.dateTo ? entryDate <= new Date(filters.dateTo + "T23:59:59") : true;

    return matchSearch && matchEtat && matchDateFrom && matchDateTo;
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
    });
  };

  const handleViewDetails = (entry) => {
    setSelectedEntry(entry);
    setIsDetailsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("Supprimer cette entrée d'historique ?")) {
      setHistory(history.filter(h => h.id !== id));
      Swal.fire({
        title: "Terminé!",
        text: "Entré supprimé!",
        icon: "success"
      });
    }
  };

  const getEtatBadge = (etat) => {
    const etatColors = {
      COLLECTE: "warning",
      EN_TRI: "info",
      EN_LAVAGE: "info",
      LAVE: "success",
      EN_SECHAGE_REPASSAGE: "info",
      SECHE: "success",
      PROPRE_PRET: "success",
      STOCKE: "secondary",
      PRET_LIVRAISON: "success",
      RECEPTIONNE: "success",
      DISTRIBUE: "success",
    };
    const etatLabels = {
      COLLECTE: "Collecte",
      EN_TRI: "En tri",
      EN_LAVAGE: "En lavage",
      LAVE: "Lavé",
      EN_SECHAGE_REPASSAGE: "Séchage/Repassage",
      SECHE: "Séché",
      PROPRE_PRET: "Propre et prêt",
      STOCKE: "Stocké",
      PRET_LIVRAISON: "Prêt livraison",
      RECEPTIONNE: "Réceptionné",
      DISTRIBUE: "Distribué",
    };
    const variant = etatColors[etat] || "secondary";
    const label = etatLabels[etat] || etat;
    return <Badge variant={variant}>{label}</Badge>;
  };

  return (
    <div className="space-y-8">

      <div className="space-y-2">
        <div className="page-header" style={{ marginBottom: 0, textAlign: "left" }}>
          <h1 className="text-3xl font-extrabold" style={{ marginBottom: "4px" }}>
            Journal des Activités
          </h1>
          <p className="text-sm text-slate-500" style={{ color: "#166d7c" }}>
            Historique complet des mouvements de linge
          </p>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Rechercher par ID ou remarque..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="w-full h-10 pl-10 pr-4 rounded-lg border border-input bg-input-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
            <Select
              options={[
                { value: "", label: "Tous les états" },
                { value: "COLLECTE", label: "Collecte" },
                { value: "EN_TRI", label: "En tri" },
                { value: "EN_LAVAGE", label: "En lavage" },
                { value: "LAVE", label: "Lavé" },
                { value: "EN_SECHAGE_REPASSAGE", label: "Séchage/Repassage" },
                { value: "SECHE", label: "Séché" },
                { value: "PROPRE_PRET", label: "Propre et prêt" },
                { value: "STOCKE", label: "Stocké" },
                { value: "PRET_LIVRAISON", label: "Prêt livraison" },
                { value: "RECEPTIONNE", label: "Réceptionné" },
                { value: "DISTRIBUE", label: "Distribué" },
              ]}
              value={filters.etat}
              onChange={(e) => setFilters({ ...filters, etat: e.target.value })}
            />
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
                  className="w-full h-10 pl-10 pr-4 rounded-lg border border-input bg-input-background focus:outline-none focus:ring-2 focus:ring-ring"
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
                  className="w-full h-10 pl-10 pr-4 rounded-lg border border-input bg-input-background focus:outline-none focus:ring-2 focus:ring-ring"
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
                  <th>Date & Heure</th>
                  <th>ID Linge</th>
                  <th>État</th>
                  <th>Remarques</th>
                  <th className="actions-th">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-muted-foreground">
                      Chargement en cours...
                    </td>
                  </tr>
                ) : currentData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-muted-foreground">
                      Aucun historique trouvé
                    </td>
                  </tr>
                ) : (
                  currentData.map((entry) => (
                    <tr
                      key={entry.id}
                      onClick={() => setSelectedEntry(selectedEntry?.id === entry.id ? null : entry)}
                      className={selectedEntry?.id === entry.id ? "expanded " : ""}
                      style={{ cursor: "pointer" }}
                    >
                      <td>
                        <div className="flex items-center gap-2 justify-center">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="font-mono text-sm">{formatDate(entry.dateHeureMouvement)}</span>
                        </div>
                      </td>
                      <td>
                        <span className="code-badge ">#{entry.lingeId}</span>
                      </td>
                      <td>{getEtatBadge(entry.etat)}</td>
                      <td>
                        {entry.remarques ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm">
                              {entry.remarques.length > 100
                                ? entry.remarques.substring(0, 100) + "..."
                                : entry.remarques}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">- Aucune remarque -</span>
                        )}
                      </td>
                      <td>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetails(entry);
                          }}
                          className="text-[#0794a4] hover:text-[#068391] font-semibold text-sm flex items-center gap-1.5 hover:underline"
                        >
                          <Eye className="w-4 h-4 stroke-[2.5]" /> Détails
                        </button>
                      </td>
                    </tr>
                  ))
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
        title={`Détails du mouvement - Linge #${selectedEntry?.lingeId}`}
        size="lg"
      >
        {selectedEntry && (
          <React.Fragment>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID de l'entrée
                </label>
                <Input value={`#${selectedEntry.id}`} disabled />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID du linge
                </label>
                <Input value={`#${selectedEntry.lingeId}`} disabled />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date et heure
                </label>
                <Input value={formatDate(selectedEntry.dateHeureMouvement)} disabled />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  État
                </label>
                <div className="mt-2">{getEtatBadge(selectedEntry.etat)}</div>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Remarques
                </label>
                <textarea
                  className="w-full min-h-[100px] px-3 py-2 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedEntry.remarques || "Aucune remarque"}
                  disabled
                />
              </div>
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