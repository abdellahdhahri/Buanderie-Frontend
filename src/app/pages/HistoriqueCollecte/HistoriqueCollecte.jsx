import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, Eye, RefreshCw, Calendar, Clock, ChevronRight, ChevronDown, Package, User, Building } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Select } from "../../components/ui/select";
import { Modal } from "../../components/ui/modal";
import { Input } from "../../components/ui/input";
import { ServiceContext } from "../../contextes/ServiceContext";

import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

export default function HistoriqueCollecte() {
  const navigate = useNavigate();
  const [collectes, setCollectes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCollecte, setSelectedCollecte] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const itemsPerPage = 8;
  const { services } = useContext(ServiceContext);

  const [filters, setFilters] = useState({
    search: "",
    type: "",
    dateFrom: "",
    dateTo: "",
  });

  useEffect(() => {
    loadCollectes();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);
  const getServiceName = (serviceId) => {
    if (!serviceId) return "Non assigné";
    const service = services.find(s => s.id === serviceId);
    return service ? service.code : "Non assigné";
  };
  const loadCollectes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/collecte`);
      if (response.ok) {
        const data = await response.json();
        console.log("liste brut des donnees :", data);        
        setCollectes(Array.isArray(data) ? data : []);
        console.log("Collectes chargées:", data.dateCollecte);
      } else {
        setCollectes([]);
      }
    } catch (error) {
      console.error("Erreur chargement collectes:", error);
      setCollectes([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCollecteDetails = async (collecteId) => {
    try {
      const response = await fetch(`${API_URL}/api/collecte/${collecteId}/resume`);
      if (response.ok) {
        const data = await response.json();
        return data;
      }
      return null;
    } catch (error) {
      console.error("Erreur chargement détails:", error);
      return null;
    }
  };

  const handleToggleExpand = async (collecteId) => {
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
  };

  const handleViewDetails = (collecte) => {
    setSelectedCollecte(collecte);
    setIsDetailsModalOpen(true);
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

  const getTypeBadge = (type) => {
    const typeColors = {
      BLANC: "success",
      INFECTE: "danger",
      MIXTE: "warning",
    };
    const typeLabels = {
      BLANC: " Blanc",
      INFECTE: " Infecté",
      MIXTE: " Mixte",
    };
    const variant = typeColors[type] || "secondary";
    const label = typeLabels[type] || type;
    return <Badge variant={variant}>{label}</Badge>;
  };

  const filteredCollectes = collectes.filter((collecte) => {
    const matchSearch = 
      (collecte.agent?.nom || "").toLowerCase().includes(filters.search.toLowerCase()) ||
      (collecte.service?.nom || "").toLowerCase().includes(filters.search.toLowerCase()) ||
      (collecte.chambre || "").toLowerCase().includes(filters.search.toLowerCase());

    const matchType = filters.type ? collecte.typeCollecte === filters.type : true;
    const entryDate = new Date(collecte.dateCollecte);
    const matchDateFrom = filters.dateFrom ? entryDate >= new Date(filters.dateFrom) : true;
    const matchDateTo = filters.dateTo ? entryDate <= new Date(filters.dateTo + "T23:59:59") : true;

    return matchSearch && matchType && matchDateFrom && matchDateTo;
  });

  const totalPages = Math.max(1, Math.ceil(filteredCollectes.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = filteredCollectes.slice(startIndex, startIndex + itemsPerPage);

  const resetFilters = () => {
    setFilters({
      search: "",
      type: "",
      dateFrom: "",
      dateTo: "",
    });
  };

  return (
    <div className="space-y-8">

      <div className="space-y-2">
        <div className="page-header" style={{ marginBottom: 0, textAlign: "left" }}>
         <h1 className="text-3xl font-extrabold flex items-center gap-2" style={{ marginBottom: "4px" }}>
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="32" 
    height="32" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className="inline-block"
  >
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    <line x1="8" y1="11" x2="16" y2="11" />
    <line x1="8" y1="15" x2="16" y2="15" />
    <line x1="8" y1="19" x2="13" y2="19" />
  </svg>
  Liste des Collectes
</h1>
          
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 bg-white/65 backdrop-blur-md p-4 rounded-[20px] border border-slate-200/50 shadow-[0_4px_20px_rgba(0,0,0,0.02)] mb-6">
        <button
          onClick={loadCollectes}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#0ca678]/30 rounded-[14px] text-sm font-bold text-[#0ca678] hover:bg-[#0ca678]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02]"
        >
          <RefreshCw className="w-4 h-4 stroke-[2.5]" /> Actualiser
        </button>
        <button
          disabled={!selectedCollecte}
          onClick={() => selectedCollecte && handleViewDetails(selectedCollecte)}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#006f94]/30 rounded-[14px] text-sm font-bold text-[#006f94] hover:bg-[#006f94]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
        >
          <Eye className="w-4 h-4 stroke-[2.5]" /> Détails
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
                  placeholder="Rechercher par agent, service, chambre..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="w-full h-10 pl-10 pr-4 rounded-lg border border-input bg-input-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
            <Select
              options={[
                { value: "", label: "Tous les types" },
                { value: "BLANC", label: "Blanc" },
                { value: "INFECTE", label: "Infecté" },
                { value: "MIXTE", label: "Mixte" },
              ]}
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
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
                  <th className="text-center py-3 px-4" style={{ width: 40 }}>#</th>
                  <th className="text-center py-3 px-4">Date & Heure</th>
                  <th className="text-center py-3 px-4">Agent</th>
                  <th className="text-center py-3 px-4">Service</th>
                  <th className="text-center py-3 px-4">État</th>
                  <th className="text-center py-3 px-4">Type</th>
                  <th className="text-center py-3 px-4" style={{ width: 50 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-muted-foreground">
                      Chargement en cours...
                    </td>
                  </tr>
                ) : currentData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-muted-foreground">
                      Aucune collecte trouvée
                    </td>
                  </tr>
                ) : (
                  currentData.map((collecte, index) => {
                    const serviceName = getServiceName(collecte.service);
                    const isExpanded = expandedId === collecte.id;
                    const details = collecte.details || collecte.resume;

                    return (
                      <React.Fragment key={collecte.id}>
                        <tr
                          onClick={() => {
                            setSelectedCollecte(selectedCollecte?.id === collecte.id ? null : collecte);
                            handleToggleExpand(collecte.id);
                          }}
                          className={isExpanded ? "expanded" : ""}
                          style={{ cursor: "pointer" }}
                        >
                          <td className="text-center py-3 px-4">
                            <span className="text-slate-400 text-sm">#{startIndex + index + 1}</span>
                          </td>
                          <td className="text-center py-3 px-4">
                            <div className="flex items-center justify-center gap-2">
                              <Clock className="w-4 h-4 text-muted-foreground" />
                              <span className="font-mono text-sm">{formatDate(collecte.dateCollecte)}</span>
                            </div>
                          </td>
                          <td className="text-center py-3 px-4">
                            <div className="flex items-center justify-center gap-2">
                              <User className="w-4 h-4 text-muted-foreground" />
                              <span>{collecte.agent?.nom || "N/A"}</span>
                            </div>
                          </td>
                          <td className="text-center py-3 px-4">
                            <div className="flex items-center justify-center gap-2">
                              <Building className="w-4 h-4 text-muted-foreground" />
                              <span>{serviceName } </span>
                            </div>
                          </td>
                          <td className="text-center py-3 px-4">
                            <div className="flex items-center justify-center gap-2">
                              <Package className="w-4 h-4 text-muted-foreground" />
                              <span>{collecte.etatCollecte || "N/A"}</span>
                            </div>
                          </td>
                          <td className="text-center py-3 px-4">{getTypeBadge(collecte.typeCollecte)}</td>
                          <td className="text-center py-3 px-4">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewDetails(collecte);
                              }}
                              className="text-[#0794a4] hover:text-[#068391] font-semibold text-sm flex items-center justify-center gap-1.5 hover:underline"
                            >
                              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </button>
                          </td>
                        </tr>

                        {/* Ligne de détails expansée */}
                        {isExpanded && (
                          <tr className="expanded-details">
                            <td colSpan={7}>
                              <div className="bg-slate-50 p-4 rounded-lg m-2 border border-slate-200">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                  <div>
                                    <span className="text-xs text-slate-500">Total pièces</span>
                                    <div className="font-bold text-lg">{details?.totalPieces || 0}</div>
                                  </div>
                                  <div>
                                    <span className="text-xs text-slate-500">Catégories</span>
                                    <div className="font-bold text-lg">{details?.categories?.length || 0}</div>
                                  </div>
                                  <div>
                                    <span className="text-xs text-slate-500">Agent</span>
                                    <div className="font-medium">{collecte.agent?.nom || "N/A"}</div>
                                  </div>
                                  <div>
                                    <span className="text-xs text-slate-500">Service</span>
                                    <div className="font-medium">{collecte.service?.nom || "N/A"}</div>
                                  </div>
                                </div>

                                {details?.categories && details.categories.length > 0 && (
                                  <div className="mt-3 pt-3 border-t border-slate-200">
                                    <span className="text-xs text-slate-500 block mb-2">Détail par catégorie:</span>
                                    <div className="flex flex-wrap gap-2">
                                      {details.categories.map((cat, idx) => (
                                        <span key={idx} className="px-3 py-1 bg-slate-200 rounded-full text-sm font-medium text-slate-700">
                                          {cat.categorie}: {cat.quantite}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                <div className="mt-3 pt-3 border-t border-slate-200 flex justify-end">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleViewDetails(collecte);
                                    }}
                                    className="text-[#0794a4] hover:text-[#068391] font-semibold text-sm flex items-center gap-1.5 hover:underline"
                                  >
                                    <Eye className="w-4 h-4" /> Voir tous les détails
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
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
            {filteredCollectes.length} collecte(s) trouvée(s)
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
        title={`Détails de la collecte #${selectedCollecte?.id}`}
        size="lg"
      >
        {selectedCollecte && (
          <React.Fragment>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID Collecte
                </label>
                <Input value={`#${selectedCollecte.id}`} disabled />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <Input value={formatDate(selectedCollecte.dateCollecte)} disabled />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Agent
                </label>
                <Input value={selectedCollecte.agent?.nom || "N/A"} disabled />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service
                </label>
                <Input value={selectedCollecte.service?.nom || "N/A"} disabled />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chambre
                </label>
                <Input value={selectedCollecte.chambre || "N/A"} disabled />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <div>{getTypeBadge(selectedCollecte.typeCollecte)}</div>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Détail par catégorie
              </label>
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                {selectedCollecte.resume?.categories?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedCollecte.resume.categories.map((cat, idx) => (
                      <span key={idx} className="px-4 py-2 bg-slate-200 rounded-lg text-sm font-medium text-slate-700">
                        {cat.categorie}: {cat.quantite}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm">Aucune catégorie disponible</p>
                )}
              </div>
            </div>

            {selectedCollecte.resume && (
              <div className="mt-4 grid grid-cols-3 gap-4">
                <div className="bg-slate-50 p-3 rounded-lg text-center border border-slate-200">
                  <div className="text-sm text-slate-500">Total pièces</div>
                  <div className="text-2xl font-bold text-slate-700">{selectedCollecte.resume.totalPieces || 0}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg text-center border border-slate-200">
                  <div className="text-sm text-slate-500">Catégories</div>
                  <div className="text-2xl font-bold text-slate-700">{selectedCollecte.resume.categories?.length || 0}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg text-center border border-slate-200">
                  <div className="text-sm text-slate-500">Agent</div>
                  <div className="text-sm font-semibold text-slate-700">{selectedCollecte.agent?.nom || "N/A"}</div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setIsDetailsModalOpen(false)}>
                Fermer
              </Button>
            </div>
          </React.Fragment>
        )}
      </Modal>
    </div>
  );
}