import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Package,
  Weight,
  Calendar,
  X,
  Eye,
  Barcode,
  History,
  RefreshCw,
  Printer,
  Tag,
  Filter,
  MapPin,
  Box,
  Layers,
  Building2
} from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Modal } from "../../components/ui/modal";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import printJS from "print-js";

// ─── Variables d'environnement ──────────────────────────────────────────────
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

export default function ArsenalList() {
  const [arsenals, setArsenals] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedArsenal, setSelectedArsenal] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedArsenalId, setSelectedArsenalId] = useState(null);
  const [arsenalLinges, setArsenalLinges] = useState([]);
  const [isLingesLoading, setIsLingesLoading] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedLingeDetail, setSelectedLingeDetail] = useState(null);
  const [services, setServices] = useState([]);

  const [newRec, setNewRec] = useState({
    code: "",
    nom: "",
    serviceId: ""
  });

  const fetchServices = async () => {
    try {
      const response = await fetch(`${API_URL}/api/sqlserver/services?page=0&size=50`);
      if (response.ok) {
        const data = await response.json();
        //  L'API renvoie un objet paginé avec une propriété "content"
        const servicesList = data.content || data._embedded?.services || data;
        setServices(Array.isArray(servicesList) ? servicesList : []);
      } else {
        setServices([]);
      }
    } catch (err) {
      console.error("Erreur chargement services:", err);
      setServices([]);
    }
  };

  useEffect(() => {
    fetchArsenals();
    fetchServices();
  }, []);

  // ─── Fetch Arsenals ──────────────────────────────────────────────────────
  const fetchArsenals = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/Arsenals`);
      if (response.ok) {
        const data = await response.json();
        setArsenals(data);
      } else {
        console.error("Erreur fetch arsenals:", response.status);
      }
    } catch (err) {
      console.error("Erreur réseau:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Fetch Linges par Arsenal ────────────────────────────────────────────
  const fetchArsenalLinges = async (arsenalId) => {
    setIsLingesLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/Arsenals/arsenals/${arsenalId}/linges`);
      if (response.ok) {
        const data = await response.json();
        setArsenalLinges(Array.isArray(data) ? data : data.content || []);
      } else {
        setArsenalLinges([]);
      }
    } catch (err) {
      console.error("Erreur chargement linges:", err);
      setArsenalLinges([]);
    } finally {
      setIsLingesLoading(false);
    }
  };

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleOpenPanel = async (arsenal) => {
    if (selectedArsenalId === arsenal.id && panelOpen) {
      setPanelOpen(false);
      setTimeout(() => {
        setSelectedArsenalId(null);
        setArsenalLinges([]);
        setSelectedId(null);
      }, 300);
      return;
    }
    setSelectedArsenalId(arsenal.id);
    setSelectedArsenal(arsenal);
    setSelectedId(null);
    await fetchArsenalLinges(arsenal.id);
    setPanelOpen(true);
  };

  const handleClosePanel = () => {
    setPanelOpen(false);
    setTimeout(() => {
      setSelectedArsenalId(null);
      setArsenalLinges([]);
      setSelectedId(null);
    }, 300);
  };

  const handleRowClick = (id) => {
    setSelectedId((prev) => (prev === id ? null : id));
  };

  // ─── Badges ────────────────────────────────────────────────────────────────
  const getEtatLingeBadge = (etat) => {
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
  };

  // ✅ Fonction corrigée avec vérification que services est un tableau
  const getServiceName = (serviceId) => {
    if (!serviceId) return "Non assigné";
    if (!Array.isArray(services)) return "Non assigné";
    const service = services.find(s => s.id === serviceId);
    return service ? service.code : "Non assigné";
  };

  // ─── CRUD ──────────────────────────────────────────────────────────────────
  const handleOpenCreateModal = () => {
    setSelectedArsenal(null);
    setNewRec({
      code: "",
      nom: "",
      serviceId: Array.isArray(services) && services.length > 0 ? services[0].id : ""
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (arsenal) => {
    setSelectedArsenal(arsenal);
    setNewRec({
      code: arsenal.code || "",
      nom: arsenal.nom || "",
      serviceId: arsenal.serviceId || ""
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!newRec.nom || newRec.nom.trim() === "") {
      Swal.fire({
        title: "⚠️ Nom requis",
        text: "Veuillez saisir un nom.",
        icon: "warning",
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
        let errorMsg = errorText;
        try {
          const errorJson = JSON.parse(errorText);
          errorMsg = errorJson.message || errorText;
        } catch {}
        throw new Error(errorMsg);
      }

      const data = await response.json();
      
      if (selectedArsenal) {
        setArsenals((prev) => prev.map((r) => (r.id === data.id ? data : r)));
        Swal.fire({
          title: "✅ Modifié!",
          text: "Arsenal mis à jour avec succès.",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        setArsenals((prev) => [data, ...prev]);
        Swal.fire({
          title: "✅ Créé!",
          text: "Nouvel arsenal créé avec succès.",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
      }

      setIsModalOpen(false);
      fetchArsenals();

    } catch (err) {
      console.error("❌ Erreur:", err);
      Swal.fire({
        title: "❌ Erreur",
        text: err.message || "Une erreur est survenue.",
        icon: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const deleteRec = async (id) => {
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
        const response = await fetch(`${API_URL}/api/Arsenals/${id}`, {
          method: "DELETE",
        });
        if (response.ok) {
          setArsenals((prev) => prev.filter((r) => r.id !== id));
          if (selectedArsenalId === id) {
            handleClosePanel();
          }
          Swal.fire({
            title: "✅ Supprimé!",
            text: "Arsenal supprimé avec succès.",
            icon: "success",
            timer: 1500,
            showConfirmButton: false,
          });
        } else {
          const error = await response.text();
          throw new Error(error);
        }
      } catch (err) {
        console.error("Erreur suppression:", err);
        Swal.fire({
          title: "❌ Erreur",
          text: err.message || "Erreur lors de la suppression.",
          icon: "error",
        });
      }
    }
  };

  const handleDetailLinge = (linge) => {
    setSelectedLingeDetail(linge);
    setShowDetailModal(true);
  };

  // ─── Impression Code ──────────────────────────────────────────────────────
  const detectFormat = (value) => {
    if (!value) return "code128";
    const cleanValue = value.replace(/\s+/g, "");
    if (/^\d{13}$/.test(cleanValue)) return "ean13";
    if (/^\d{8}$/.test(cleanValue)) return "ean8";
    if (/^\d{12}$/.test(cleanValue)) return "upc";
    return "code128";
  };

  const handlePrintArsenalCode = (arsenal) => {
    if (!arsenal) return;
    
    const code = arsenal.code || arsenal.nom || `ARS-${arsenal.id}`;
    const format = detectFormat(code);
    const serviceName = getServiceName(arsenal.serviceId);
    
    printJS({
      printable: `
        <div style="width:60mm; padding:3mm; font-family:'Courier New',monospace; background:white; text-align:center;">
          <div style="border-bottom:1px solid #ddd; padding-bottom:2mm; margin-bottom:2mm;">
            <div style="font-size:10pt; font-weight:bold; color:#1a1a1a;">CODE ARSENAL</div>
            <div style="font-size:7pt; color:#666;">${serviceName || 'N/A'}</div>
          </div>
          
          <div style="display:flex; justify-content:center; margin:2mm 0;">
            <img
              src="https://barcodeapi.org/api/${format}/${encodeURIComponent(code)}"
              style="height:70px; width:100%; max-width:180px;"
              alt="Code-barres"
            />
          </div>
          
          <div style="font-size:12pt; font-weight:bold; letter-spacing:1px; margin:2mm 0; font-family:'Courier New',monospace;">
            ${code}
          </div>
          
          <div style="font-size:9pt; font-weight:600; color:#1a1a1a;">
            ${arsenal.nom}
          </div>
          
          <div style="font-size:8pt; color:#666; margin-top:2mm; border-top:1px solid #ddd; padding-top:2mm;">
            <div>🏢 ${serviceName || 'Service non assigné'}</div>
            <div style="font-size:7pt; margin-top:1mm;">
              ${new Date().toLocaleDateString('fr-FR', { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
        </div>
      `,
      type: "raw-html",
      style: "* { margin: 0; padding: 0; box-sizing: border-box; } body { background: white; display: flex; justify-content: center; }",
      documentTitle: `Code_Arsenal_${arsenal.code || arsenal.id}`,
      css: `
        @page { 
          size: 60mm 45mm;
          margin: 0;
        }
      `
    });
  };

  // ─── Filtrage ──────────────────────────────────────────────────────────────
  const filteredArsenals = arsenals.filter((r) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      r.code?.toLowerCase().includes(term) ||
      r.nom?.toLowerCase().includes(term)
    );
  });

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
          <div className="page-header" style={{ marginBottom: 0, textAlign: "left" }}>
            <h1 className="text-3xl font-extrabold" style={{ marginBottom: "4px" }}>
              📦 Gestion des Arsenals
            </h1>
            <p className="text-sm text-slate-500" style={{ color: "#166d7c" }}>
              Gestion complète des arsenals et impression des codes
            </p>
          </div>

          {/* ─── Barre d'outils ────────────────────────────────────────────── */}
          <div className="flex flex-wrap items-center gap-3 bg-white/65 backdrop-blur-md p-4 rounded-[20px] border border-slate-200/50 shadow-[0_4px_20px_rgba(0,0,0,0.02)] mb-6">
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#0ca678]/30 rounded-[14px] text-sm font-bold text-[#0ca678] hover:bg-[#0ca678]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" /> Nouvel Arsenal
            </button>

            <div style={{ width: "1px", height: "30px", background: "#e2e8f0", margin: "0 8px" }} />

            <button
              disabled={!selectedArsenalId}
              onClick={() => {
                if (selectedArsenal) handlePrintArsenalCode(selectedArsenal);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#e67700]/30 rounded-[14px] text-sm font-bold text-[#e67700] hover:bg-[#e67700]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
            >
              <Barcode className="w-4 h-4 stroke-[2.5]" /> Code Arsenal
            </button>

            <div style={{ width: "1px", height: "30px", background: "#e2e8f0", margin: "0 8px" }} />

            <button
              disabled={!selectedId}
              onClick={() => {
                if (selectedId) {
                  const linge = arsenalLinges.find(l => l.id === selectedId);
                  if (linge) handleDetailLinge(linge);
                }
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#006f94]/30 rounded-[14px] text-sm font-bold text-[#006f94] hover:bg-[#006f94]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
            >
              <Eye className="w-4 h-4 stroke-[2.5]" /> Détails Linge
            </button>

            <button
              disabled={!selectedId}
              onClick={() => {
                if (selectedId) {
                  const linge = arsenalLinges.find(l => l.id === selectedId);
                  if (linge) {
                    window.location.href = `/tracking?code=${linge.codeBarre}`;
                  }
                }
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#0ca678]/30 rounded-[14px] text-sm font-bold text-[#0ca678] hover:bg-[#0ca678]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
            >
              <History className="w-4 h-4 stroke-[2.5]" /> Historique
            </button>

            <button
              disabled={!selectedArsenalId}
              onClick={() => handleOpenEditModal(selectedArsenal)}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#006f94]/30 rounded-[14px] text-sm font-bold text-[#006f94] hover:bg-[#006f94]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
            >
              <Edit className="w-4 h-4 stroke-[2.5]" /> Modifier
            </button>

            <button
              disabled={!selectedArsenalId}
              onClick={async () => {
                if (selectedArsenalId) {
                  const confirmed = await Swal.fire({
                    title: "Es-tu sûr?",
                    text: "Vous ne pourrez pas annuler cette action!",
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonColor: "#d33",
                    cancelButtonColor: "#3085d6",
                    confirmButtonText: "Oui, supprimer!",
                    cancelButtonText: "Annuler",
                  });
                  if (confirmed.isConfirmed) {
                    deleteRec(selectedArsenalId);
                  }
                }
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#e03131]/30 rounded-[14px] text-sm font-bold text-[#e03131] hover:bg-[#e03131]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
            >
              <Trash2 className="w-4 h-4 stroke-[2.5]" /> Supprimer
            </button>

            <button
              onClick={fetchArsenals}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-300 rounded-[14px] text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> Actualiser
            </button>
          </div>

          {/* ─── Barre de recherche ────────────────────────────────────────── */}
          <Card className="mb-4">
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

          {/* ─── Tableau ────────────────────────────────────────────────────── */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border bg-muted/50">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-medium w-10"></th>
                      <th className="text-left py-3 px-4 text-sm font-medium">Code</th>
                      <th className="text-left py-3 px-4 text-sm font-medium">Nom</th>
                      <th className="text-left py-3 px-4 text-sm font-medium">Service</th>
                      <th className="text-left py-3 px-4 text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-muted-foreground">
                          <div className="flex items-center justify-center gap-2">
                            <svg className="animate-spin w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Chargement...
                          </div>
                        </td>
                      </tr>
                    ) : filteredArsenals.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-muted-foreground">
                          {searchTerm ? "Aucun arsenal correspondant" : "Aucun arsenal trouvé"}
                        </td>
                      </tr>
                    ) : (
                      filteredArsenals.map((arsenal) => (
                        <tr
                          key={arsenal.id}
                          className={`border-b border-border hover:bg-accent/50 transition-colors ${selectedArsenalId === arsenal.id ? 'bg-blue-50' : ''}`}
                        >
                          <td className="py-3 px-4">
                            <button
                              onClick={() => handleOpenPanel(arsenal)}
                              className="p-1 hover:bg-blue-100 rounded-lg transition-colors"
                              title={panelOpen && selectedArsenalId === arsenal.id ? "Fermer" : "Voir les linges"}
                            >
                              {panelOpen && selectedArsenalId === arsenal.id ? (
                                <ChevronLeft className="w-5 h-5 text-blue-500" />
                              ) : (
                                <ChevronRight className="w-5 h-5 text-slate-400 hover:text-blue-500" />
                              )}
                            </button>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-mono text-sm font-medium text-blue-600">
                              {arsenal.code || `ARS-${arsenal.id}`}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium">{arsenal.nom}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-slate-400" />
                              <span className="text-sm">{getServiceName(arsenal.serviceId)}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
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
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* ─── Panneau latéral des linges ────────────────────────────────────── */}
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
            <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-blue-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-blue-600" />
                  <div>
                    <h3 className="font-bold text-slate-800">
                      {selectedArsenal?.nom || "Arsenal"}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {selectedArsenal?.code || "Code inconnu"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-white">
                    {arsenalLinges.length} linge{arsenalLinges.length > 1 ? 's' : ''}
                  </Badge>
                  <button
                    onClick={() => handlePrintArsenalCode(selectedArsenal)}
                    className="p-1.5 hover:bg-blue-200 rounded-lg transition-colors text-slate-500 hover:text-[#e67700]"
                    title="Imprimer le code"
                  >
                    <Barcode className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleClosePanel}
                    className="p-1.5 hover:bg-blue-200 rounded-lg transition-colors text-slate-500 hover:text-slate-700"
                    title="Fermer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 overflow-y-auto h-[calc(100%-80px)]">
              {isLingesLoading ? (
                <div className="flex items-center justify-center h-32">
                  <svg className="animate-spin w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
              ) : arsenalLinges.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Package className="w-12 h-12 mx-auto opacity-30 mb-3" />
                  <p className="text-sm">Aucun linge dans cet arsenal</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {arsenalLinges.map((linge, index) => (
                    <motion.div
                      key={linge.id || index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ 
                        opacity: 1, 
                        y: 0,
                        transition: { 
                          delay: index * 0.05,
                          duration: 0.3
                        }
                      }}
                      onClick={() => handleRowClick(linge.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        selectedId === linge.id 
                          ? 'bg-blue-50 border-blue-300 shadow-md' 
                          : 'bg-slate-50 border-slate-100 hover:border-blue-200 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            selectedId === linge.id ? 'bg-blue-200' : 'bg-blue-100'
                          }`}>
                            <Package className={`w-4 h-4 ${
                              selectedId === linge.id ? 'text-blue-700' : 'text-blue-600'
                            }`} />
                          </div>
                          <div>
                            <div className="font-medium text-sm">
                              {linge.codeBarre || linge.codeSuivi || "N/A"}
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
                      {linge.observations && (
                        <div className="mt-1 text-xs text-slate-400">
                          {linge.observations}
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

      {/* ─── Modal Détails Linge ───────────────────────────────────────────── */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={`Détails du linge - ${selectedLingeDetail?.codeBarre || 'N/A'}`}
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
                <Input value={new Date(selectedLingeDetail.dateCreation).toLocaleString('fr-FR')} disabled />
              </div>
            )}
          </div>
        )}
        <div className="flex justify-end gap-3 mt-6">
          <Button onClick={() => setShowDetailModal(false)}>
            Fermer
          </Button>
        </div>
      </Modal>

      {/* ─── Modal Création/Modification ──────────────────────────────────── */}
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
                onChange={(e) =>
                  setNewRec({ ...newRec, code: e.target.value.toUpperCase() })
                }
                placeholder="ex: ARS-001"
              />
              <p className="text-xs text-slate-400 mt-1">Laissez vide pour génération automatique</p>
            </div>

            <div>
              <Input
                label="Nom *"
                value={newRec.nom}
                onChange={(e) =>
                  setNewRec({ ...newRec, nom: e.target.value })
                }
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
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              type="button"
              disabled={isSaving}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Enregistrement..." : (selectedArsenal ? "Enregistrer" : "Créer")}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}