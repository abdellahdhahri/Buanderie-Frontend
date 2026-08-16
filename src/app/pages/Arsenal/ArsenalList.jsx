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
  Loader2
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

export default function ArsenalList() {
  const [arsenals, setArsenals] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedArsenal, setSelectedArsenal] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);          // ← ID de l'arsenal ouvert
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

  // ─── Fetch linges (léger) ─────────────────────────────────────────────────
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
      // Fermer
      setExpandedId(null);
      setSelectedId(null);
      setArsenalLinges([]);
    } else {
      // Ouvrir
      setExpandedId(arsenal.id);
      setSelectedArsenal(arsenal);
      setSelectedId(null);
      fetchArsenalLinges(arsenal.id);
    }
  }, [expandedId, fetchArsenalLinges]);

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const getEtatLingeBadge = useCallback((etat) => {
    if (!etat) return <Badge variant="secondary">Non défini</Badge>;
    const variants = {
      COLLECTE: { variant: "warning", label: "Collecte" },
      EN_LAVAGE: { variant: "info", label: "En lavage" },
      PROPRE_PRET: { variant: "success", label: "Propre" },
      RECEPTIONNE: { variant: "success", label: "Réceptionné" },
      DISTRIBUE: { variant: "success", label: "Distribué" },
      EN_SECHAGE_REPASSAGE: { variant: "info", label: "Séchage" },
      STOCKE: { variant: "secondary", label: "Stocké" },
      PRET_LIVRAISON: { variant: "success", label: "Prêt livraison" },
      EN_TRI: { variant: "info", label: "En tri" },
      LAVE: { variant: "success", label: "Lavé" },
      SECHE: { variant: "success", label: "Séché" },
      SALE: { variant: "danger", label: "Sale" },
    };
    const config = variants[etat] || { variant: "secondary", label: etat };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  }, []);

  const getServiceName = useCallback((serviceId) => {
    if (!serviceId || !Array.isArray(services)) return "Non assigné";
    const service = services.find(s => s.id === serviceId);
    return service ? service.code : "Non assigné";
  }, [services]);

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
      Swal.fire({ title: "⚠️ Nom requis", text: "Veuillez saisir un nom.", icon: "warning" });
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
        Swal.fire({ title: "✅ Modifié!", icon: "success", timer: 1500, showConfirmButton: false });
      } else {
        setArsenals(prev => [data, ...prev]);
        Swal.fire({ title: "✅ Créé!", icon: "success", timer: 1500, showConfirmButton: false });
      }
      setIsModalOpen(false);
      fetchArsenals();
    } catch (err) {
      Swal.fire({ title: "❌ Erreur", text: err.message, icon: "error" });
    } finally {
      setIsSaving(false);
    }
  }, [selectedArsenal, newRec]);

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
        const response = await fetch(`${API_URL}/api/Arsenals/${id}`, { method: "DELETE" });
        if (response.ok) {
          setArsenals(prev => prev.filter(r => r.id !== id));
          if (expandedId === id) {
            setExpandedId(null);
            setArsenalLinges([]);
          }
          Swal.fire({ title: "✅ Supprimé!", icon: "success", timer: 1500, showConfirmButton: false });
        }
      } catch (err) {
        Swal.fire({ title: "❌ Erreur", text: err.message, icon: "error" });
      }
    }
  }, [expandedId]);

  const handleDetailLinge = useCallback((linge) => {
    setSelectedLingeDetail(linge);
    setShowDetailModal(true);
  }, []);

  // ─── Impression ───────────────────────────────────────────────────────────
  const detectFormat = useCallback((value) => {
    if (!value) return "code128";
    const clean = value.replace(/\s+/g, "");
    if (/^\d{13}$/.test(clean)) return "ean13";
    if (/^\d{8}$/.test(clean)) return "ean8";
    if (/^\d{12}$/.test(clean)) return "upc";
    return "code128";
  }, []);

  const handlePrintArsenalCode = useCallback((arsenal) => {
    if (!arsenal) return;
    const code = arsenal.code || arsenal.nom || `ARS-${arsenal.id}`;
    const format = detectFormat(code);
    const serviceName = getServiceName(arsenal.serviceId);

    printJS({
      printable: `
        <div style="width:60mm;padding:3mm;font-family:'Courier New',monospace;background:white;text-align:center;">
          <div style="border-bottom:1px solid #ddd;padding-bottom:2mm;margin-bottom:2mm;">
            <div style="font-size:10pt;font-weight:bold;">CODE ARSENAL</div>
            <div style="font-size:7pt;color:#666;">${serviceName || "N/A"}</div>
          </div>
          <div style="display:flex;justify-content:center;margin:2mm 0;">
            <img src="https://barcodeapi.org/api/${format}/${encodeURIComponent(code)}" style="height:70px;width:100%;max-width:180px;" />
          </div>
          <div style="font-size:12pt;font-weight:bold;letter-spacing:1px;margin:2mm 0;">${code}</div>
          <div style="font-size:9pt;font-weight:600;">${arsenal.nom}</div>
          <div style="font-size:8pt;color:#666;margin-top:2mm;border-top:1px solid #ddd;padding-top:2mm;">
            <div>🏢 ${serviceName || "Service non assigné"}</div>
            <div style="font-size:7pt;margin-top:1mm;">${new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
          </div>
        </div>
      `,
      type: "raw-html",
      style: "*{margin:0;padding:0;box-sizing:border-box;}body{background:white;display:flex;justify-content:center;}",
      documentTitle: `Code_Arsenal_${arsenal.code || arsenal.id}`,
      css: `@page{size:60mm 45mm;margin:0;}`
    });
  }, [detectFormat, getServiceName]);

  // ─── Filtrage ─────────────────────────────────────────────────────────────
  const filteredArsenals = useMemo(() => {
    if (!searchTerm) return arsenals;
    const term = searchTerm.toLowerCase();
    return arsenals.filter(r =>
      r.code?.toLowerCase().includes(term) || r.nom?.toLowerCase().includes(term)
    );
  }, [arsenals, searchTerm]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 0, textAlign: "left" }}>
        <h1 className="text-3xl font-extrabold" style={{ marginBottom: "4px" }}>
          📦 Gestion des Arsenals
        </h1>
        <p className="text-sm text-slate-500" style={{ color: "#166d7c" }}>
          Gestion complète des arsenals et impression des codes
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 bg-white/65 backdrop-blur-md p-4 rounded-[20px] border border-slate-200/50 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#0ca678]/30 rounded-[14px] text-sm font-bold text-[#0ca678] hover:bg-[#0ca678]/5 transition-all"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" /> Nouvel Arsenal
        </button>

        <div className="w-px h-8 bg-slate-200 mx-1" />

        <button
          disabled={!expandedId}
          onClick={() => selectedArsenal && handlePrintArsenalCode(selectedArsenal)}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#e67700]/30 rounded-[14px] text-sm font-bold text-[#e67700] hover:bg-[#e67700]/5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Barcode className="w-4 h-4 stroke-[2.5]" /> Code Arsenal
        </button>

        <button
          disabled={!selectedId}
          onClick={() => {
            const linge = arsenalLinges.find(l => l.id === selectedId);
            if (linge) handleDetailLinge(linge);
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#006f94]/30 rounded-[14px] text-sm font-bold text-[#006f94] hover:bg-[#006f94]/5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Eye className="w-4 h-4 stroke-[2.5]" /> Détails Linge
        </button>

        <button
          disabled={!selectedId}
          onClick={() => {
            const linge = arsenalLinges.find(l => l.id === selectedId);
            if (linge) window.location.href = `/tracking?code=${linge.codeBarre}`;
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#0ca678]/30 rounded-[14px] text-sm font-bold text-[#0ca678] hover:bg-[#0ca678]/5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <History className="w-4 h-4 stroke-[2.5]" /> Historique
        </button>

        <button
          disabled={!expandedId}
          onClick={() => selectedArsenal && handleOpenEditModal(selectedArsenal)}
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
          onClick={fetchArsenals}
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
              placeholder="Rechercher par code ou nom..."
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
                  <th className="text-center py-3 px-4 text-sm font-medium">Nom</th>
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
                ) : filteredArsenals.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-muted-foreground">
                      {searchTerm ? "Aucun arsenal correspondant" : "Aucun arsenal trouvé"}
                    </td>
                  </tr>
                ) : (
                  filteredArsenals.map((arsenal) => {
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
                              title={isExpanded ? "Masquer les linges" : "Voir les linges"}
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
                                title="Imprimer le code"
                              >
                                <Barcode className="w-4 h-4 text-[#e67700]" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEditModal(arsenal);
                                }}
                                className="p-2 hover:bg-accent rounded-lg transition-colors"
                                title="Modifier"
                              >
                                <Edit className="w-4 h-4 text-[#006f94]" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteRec(arsenal.id);
                                }}
                                className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                                title="Supprimer"
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
                                          Linges de l’arsenal
                                        </span>
                                        <Badge variant="outline" className="bg-white text-xs">
                                          {isLingesLoading
                                            ? "..."
                                            : `${arsenalLinges.length} élément${arsenalLinges.length > 1 ? "s" : ""}`}
                                        </Badge>
                                      </div>
                                    </div>

                                    {/* Contenu */}
                                    {isLingesLoading ? (
                                      <div className="flex items-center justify-center py-8 gap-2 text-slate-400">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span className="text-sm">Chargement des linges...</span>
                                      </div>
                                    ) : arsenalLinges.length === 0 ? (
                                      <div className="text-center py-8 text-slate-400">
                                        <Package className="w-10 h-10 mx-auto opacity-30 mb-2" />
                                        <p className="text-sm">Aucun linge dans cet arsenal</p>
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
                                                    {linge.categorie || "Non catégorisé"}
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
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={`Détails du linge - ${selectedLingeDetail?.codeBarre || "N/A"}`}
        size="lg"
      >
        {selectedLingeDetail && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ID</label>
              <Input value={selectedLingeDetail.id} disabled />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Code Suivi</label>
              <Input value={selectedLingeDetail.codeBarre} disabled />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tag RFID</label>
              <Input value={selectedLingeDetail.rfidTag || "Non associé"} disabled />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
              <Input value={selectedLingeDetail.categorie} disabled />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Poids</label>
              <Input value={`${selectedLingeDetail.poids || 0} kg`} disabled />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">État</label>
              <div>{getEtatLingeBadge(selectedLingeDetail.etat)}</div>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Arsenal</label>
              <Input value={selectedArsenal?.nom || "Non assigné"} disabled />
            </div>
            {selectedLingeDetail.dateCreation && (
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Date de création</label>
                <Input value={new Date(selectedLingeDetail.dateCreation).toLocaleString("fr-FR")} disabled />
              </div>
            )}
          </div>
        )}
        <div className="flex justify-end gap-3 mt-6">
          <Button onClick={() => setShowDetailModal(false)}>Fermer</Button>
        </div>
      </Modal>

      {/* ─── Modal Création / Modification ─────────────────────────────────── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedArsenal ? `Modifier l'arsenal #${selectedArsenal.id}` : "Nouvel Arsenal"}
        size="lg"
      >
        <form onSubmit={handleSave}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input
                label="Code"
                value={newRec.code}
                onChange={(e) => setNewRec({ ...newRec, code: e.target.value.toUpperCase() })}
                placeholder="ex: ARS-001"
              />
              <p className="text-xs text-slate-400 mt-1">Laissez vide pour génération automatique</p>
            </div>
            <div>
              <Input
                label="Nom *"
                value={newRec.nom}
                onChange={(e) => setNewRec({ ...newRec, nom: e.target.value })}
                placeholder="ex: Arsenal Principal"
                required
              />
            </div>
            <div className="col-span-2">
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
              {isSaving ? "Enregistrement..." : selectedArsenal ? "Enregistrer" : "Créer"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}