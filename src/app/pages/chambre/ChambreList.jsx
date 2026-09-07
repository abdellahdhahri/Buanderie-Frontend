import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  Barcode,
  History,
  RefreshCw,
  Building2,
  Loader2,
  Bed,
  Home,
  Printer
} from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Modal } from "../../components/ui/modal";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import BarcodeLabel from "../../components/BarcodeLabel"; // ✅ Import

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

export default function ChambreList() {
  const [chambres, setChambres] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedChambre, setSelectedChambre] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [chambreLits, setChambreLits] = useState([]);
  const [isLitsLoading, setIsLitsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [services, setServices] = useState([]);
  const [newRec, setNewRec] = useState({
    code: "",
    serviceId: ""
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  const fetchChambres = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/sqlserver/chambres?page=0&size=300`);
      if (response.ok) {
        const data = await response.json();
        const list = data.content || data;
        setChambres(Array.isArray(list) ? list : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChambres();
    fetchServices();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const fetchChambreLits = useCallback(async (chambreId) => {
    setIsLitsLoading(true);
    setChambreLits([]);
    try {
      const response = await fetch(`${API_URL}/api/sqlserver/lits/chambre/${chambreId}?page=0&size=50`);
      if (response.ok) {
        const data = await response.json();
        const list = data.content || data;
        setChambreLits(Array.isArray(list) ? list : []);
        console.log(`📋 Lits de la chambre ${chambreId}:`, list);
      } else {
        console.error(`Erreur fetch lits pour chambre ${chambreId}:`, response.status);
        setChambreLits([]);
      }
    } catch (err) {
      console.error(`Erreur chargement lits pour chambre ${chambreId}:`, err);
      setChambreLits([]);
    } finally {
      setIsLitsLoading(false);
    }
  }, []);

  const toggleExpand = useCallback((chambre) => {
    if (expandedId === chambre.id) {
      setExpandedId(null);
      setSelectedId(null);
      setChambreLits([]);
    } else {
      setExpandedId(chambre.id);
      setSelectedChambre(chambre);
      setSelectedId(null);
      fetchChambreLits(chambre.id);
    }
  }, [expandedId, fetchChambreLits]);

  const getServiceName = useCallback((serviceId) => {
    if (!serviceId || !Array.isArray(services)) return "Non assigné";
    const service = services.find(s => s.id === serviceId);
    return service ? service.code : "Non assigné";
  }, [services]);

  const getEtatLitBadge = (etat) => {
    if (etat === 1) {
      return <Badge variant="success">Occupé</Badge>;
    } else if (etat === 0) {
      return <Badge variant="secondary">Libre</Badge>;
    }
    return <Badge variant="secondary">Inconnu</Badge>;
  };

  // ✅ Supprimer detectFormat, handlePrintChambreCode, handlePrintLitCode
  // Remplacés par BarcodeLabel

  // ─── CRUD ──────────────────────────────────────────────────────────────────
  const handleOpenCreateModal = useCallback(() => {
    setSelectedChambre(null);
    setNewRec({
      code: "",
      serviceId: Array.isArray(services) && services.length > 0 ? services[0].id : ""
    });
    setIsModalOpen(true);
  }, [services]);

  const handleOpenEditModal = useCallback((chambre) => {
    setSelectedChambre(chambre);
    setNewRec({
      code: chambre.code || "",
      serviceId: chambre.serviceId || ""
    });
    setIsModalOpen(true);
  }, []);

  const handleSave = useCallback(async (e) => {
    e.preventDefault();
    if (!newRec.code?.trim()) {
      Swal.fire({ title: "⚠️ Code requis", text: "Veuillez saisir un code.", icon: "warning" });
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        code: newRec.code.trim(),
        serviceId: newRec.serviceId ? parseInt(newRec.serviceId) : null
      };

      console.log("Payload:", payload);
      
      if (selectedChambre) {
        setChambres(prev => prev.map(r => r.id === selectedChambre.id ? { ...r, ...payload } : r));
        Swal.fire({ title: "✅ Modifié!", icon: "success", timer: 1500, showConfirmButton: false });
      } else {
        const newChambre = { id: Date.now(), ...payload };
        setChambres(prev => [newChambre, ...prev]);
        Swal.fire({ title: "✅ Créé!", icon: "success", timer: 1500, showConfirmButton: false });
      }
      setIsModalOpen(false);
      fetchChambres();
    } catch (err) {
      Swal.fire({ title: "❌ Erreur", text: err.message, icon: "error" });
    } finally {
      setIsSaving(false);
    }
  }, [selectedChambre, newRec]);

  const deleteRec = useCallback(async (id) => {
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
        setChambres(prev => prev.filter(r => r.id !== id));
        if (expandedId === id) {
          setExpandedId(null);
          setChambreLits([]);
        }
        Swal.fire({ title: "✅ Supprimé!", icon: "success", timer: 1500, showConfirmButton: false });
      } catch (err) {
        Swal.fire({ title: "❌ Erreur", text: err.message, icon: "error" });
      }
    }
  }, [expandedId]);

  // ─── Filtrage ─────────────────────────────────────────────────────────────
  const filteredChambres = useMemo(() => {
    if (!searchTerm) return chambres;
    const term = searchTerm.toLowerCase();
    return chambres.filter(r =>
      r.code?.toLowerCase().includes(term) ||
      r.codeBarre?.toLowerCase().includes(term)
    );
  }, [chambres, searchTerm]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredChambres.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = filteredChambres.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-4">
      {/* Header */}
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
            background: "linear-gradient(135deg, #f472b6, #ec4899)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            boxShadow: "0 4px 16px rgba(244, 114, 182, 0.25)"
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
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <div>
            <h1 style={{
              fontSize: "28px",
              fontWeight: 800,
              color: "#0f172a",
              margin: 0
            }}>
              Gestion des Chambres
            </h1>
            <p style={{
              fontSize: "14px",
              color: "#64748b",
              margin: "2px 0 0 0"
            }}>
              Gérez les chambres et leurs disponibilités
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
          <Plus className="w-4 h-4 stroke-[2.5]" /> Nouvelle Chambre
        </button>

        <div className="w-px h-8 bg-slate-200 mx-1" />

        {/* ✅ Bouton Étiquette Chambre avec BarcodeLabel */}
        {selectedChambre && (
          <BarcodeLabel item={selectedChambre} />
        )}

        {/* ✅ Bouton Étiquette Lit avec BarcodeLabel */}
        {selectedId && (
          <BarcodeLabel item={chambreLits.find(l => l.id === selectedId)} />
        )}

        <button
          disabled={!expandedId}
          onClick={() => selectedChambre && handleOpenEditModal(selectedChambre)}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#006f94]/30 rounded-[14px] text-sm font-bold text-[#006f94] hover:bg-[#006f94]/5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Edit className="w-4 h-4 stroke-[2.5]" /> Modifier
        </button>

        <button
          disabled={!expandedId}
          onClick={() => expandedId && deleteRec(expandedId)}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#e03131]/30 rounded-[14px] text-sm font-bold text-[#e03131] hover:bg-[#e03131]/5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Trash2 className="w-4 h-4 stroke-[2.5]" /> Supprimer
        </button>

        <button
          onClick={fetchChambres}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-300 rounded-[14px] text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} /> Actualiser
        </button>
      </div>

      {/* Recherche */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher par code chambre ou code-barres..."
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
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  <th className="text-center py-3 px-4 text-sm font-medium w-12"></th>
                  <th className="text-center py-3 px-4 text-sm font-medium">Code</th>
                  <th className="text-center py-3 px-4 text-sm font-medium">Code-Barres</th>
                  <th className="text-center py-3 px-4 text-sm font-medium">Service</th>
                  <th className="text-center py-3 px-4 text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Chargement...
                      </div>
                    </td>
                  </tr>
                ) : currentData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-muted-foreground">
                      {searchTerm ? "Aucune chambre correspondante" : "Aucune chambre trouvée"}
                    </td>
                  </tr>
                ) : (
                  currentData.map((chambre) => {
                    const isExpanded = expandedId === chambre.id;

                    return (
                      <React.Fragment key={chambre.id}>
                        {/* Ligne principale */}
                        <tr
                          className={`border-b border-border transition-colors ${
                            isExpanded ? "bg-blue-50/70" : "hover:bg-accent/50"
                          }`}
                        >
                          <td className="text-center py-3 px-4">
                            <button
                              onClick={() => toggleExpand(chambre)}
                              className="p-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                              title={isExpanded ? "Masquer les lits" : "Voir les lits"}
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
                              {chambre.code || `CH-${chambre.id}`}
                            </div>
                          </td>
                          <td className="text-center py-3 px-4">
                            <div className="font-mono text-sm text-slate-600">
                              {chambre.codeBarre || "-"}
                            </div>
                          </td>
                          <td className="text-center py-3 px-4">
                            <div className="flex items-center justify-center gap-2">
                              <Building2 className="w-4 h-4 text-slate-400" />
                              <span className="text-sm">{getServiceName(chambre.serviceId)}</span>
                            </div>
                          </td>
                          <td className="text-center py-3 px-4">
                            <div className="flex items-center justify-center gap-2">
                              {/* ✅ Bouton Étiquette avec BarcodeLabel */}
                              <BarcodeLabel item={chambre} />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEditModal(chambre);
                                }}
                                className="p-2 hover:bg-accent rounded-lg transition-colors"
                                title="Modifier"
                              >
                                <Edit className="w-4 h-4 text-[#006f94]" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteRec(chambre.id);
                                }}
                                className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* ─── Lignes des lits (accordéon) ───────────────── */}
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
                                    {/* En-tête de la section lits */}
                                    <div className="flex items-center justify-between mb-3">
                                      <div className="flex items-center gap-2">
                                        <Bed className="w-4 h-4 text-blue-600" />
                                        <span className="text-sm font-semibold text-slate-700">
                                          Lits de la chambre
                                        </span>
                                        <Badge variant="outline" className="bg-white text-xs">
                                          {isLitsLoading
                                            ? "..."
                                            : `${chambreLits.length} lit${chambreLits.length > 1 ? "s" : ""}`}
                                        </Badge>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-slate-400">
                                          {chambreLits.filter(l => l.etat === 1).length} occupé(s)
                                        </span>
                                        <span className="text-xs text-slate-400">
                                          {chambreLits.filter(l => l.etat === 0).length} libre(s)
                                        </span>
                                      </div>
                                    </div>

                                    {/* Contenu */}
                                    {isLitsLoading ? (
                                      <div className="flex items-center justify-center py-8 gap-2 text-slate-400">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span className="text-sm">Chargement des lits...</span>
                                      </div>
                                    ) : chambreLits.length === 0 ? (
                                      <div className="text-center py-8 text-slate-400">
                                        <Bed className="w-10 h-10 mx-auto opacity-30 mb-2" />
                                        <p className="text-sm">Aucun lit dans cette chambre</p>
                                      </div>
                                    ) : (
                                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {chambreLits.map((lit) => (
                                          <div
                                            key={lit.id}
                                            onClick={() => setSelectedId(prev => prev === lit.id ? null : lit.id)}
                                            className={`p-3 rounded-xl border cursor-pointer transition-all ${
                                              selectedId === lit.id
                                                ? "bg-white border-blue-400 shadow-md ring-1 ring-blue-200"
                                                : "bg-white/80 border-slate-200 hover:border-blue-300 hover:shadow-sm"
                                            }`}
                                          >
                                            <div className="flex items-start justify-between gap-2">
                                              <div className="flex items-center gap-2.5 min-w-0">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                                  selectedId === lit.id ? "bg-blue-100" : "bg-slate-100"
                                                }`}>
                                                  <Bed className={`w-4 h-4 ${
                                                    selectedId === lit.id ? "text-blue-600" : "text-slate-500"
                                                  }`} />
                                                </div>
                                                <div className="min-w-0">
                                                  <p className="font-medium text-sm truncate">
                                                    {lit.code || `LIT-${lit.id}`}
                                                  </p>
                                                  <p className="text-xs text-slate-500 truncate">
                                                    {lit.description || "Lit standard"}
                                                  </p>
                                                </div>
                                              </div>
                                              <div className="text-right flex-shrink-0">
                                                {getEtatLitBadge(lit.etat)}
                                                {lit.infecte && (
                                                  <Badge variant="destructive" className="text-[10px] mt-1">
                                                    ⚠️ Infecté
                                                  </Badge>
                                                )}
                                              </div>
                                            </div>
                                            <div className="mt-2 flex gap-2 justify-end">
                                              {/* ✅ Bouton Étiquette Lit avec BarcodeLabel */}
                                              <BarcodeLabel item={lit} />
                                            </div>
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

      {/* ─── Pagination ────────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-muted-foreground">
            Affichage de {currentData.length > 0 ? startIndex + 1 : 0} à {Math.min(startIndex + itemsPerPage, filteredChambres.length)} sur {filteredChambres.length} chambre(s)
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

      {/* ─── Modal Création / Modification ─────────────────────────────────── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedChambre ? `Modifier la chambre #${selectedChambre.id}` : "Nouvelle Chambre"}
        size="lg"
      >
        <form onSubmit={handleSave}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input
                label="Code Chambre *"
                value={newRec.code}
                onChange={(e) => setNewRec({ ...newRec, code: e.target.value.toUpperCase() })}
                placeholder="ex: CH-001"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Service</label>
              <select
                value={newRec.serviceId || ""}
                onChange={(e) =>
                  setNewRec({ ...newRec, serviceId: e.target.value ? parseInt(e.target.value) : "" })
                }
                className="w-full h-10 px-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Aucun service</option>
                {Array.isArray(services) && services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.code}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setIsModalOpen(false)} type="button" disabled={isSaving}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Enregistrement..." : selectedChambre ? "Enregistrer" : "Créer"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}