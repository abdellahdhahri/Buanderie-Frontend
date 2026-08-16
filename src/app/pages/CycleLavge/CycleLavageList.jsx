import React, { useState, useEffect } from "react";
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

export default function CycleLavageList() {
  const [cycles, setCycles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCycle, setSelectedCycle] = useState(null);
  const [selectedCycleId, setSelectedCycleId] = useState(null);
  const [cycleLinges, setCycleLinges] = useState([]);
  const [isLingesLoading, setIsLingesLoading] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const fetchCycles = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/lavage/cycles`);
      if (response.ok) {
        const data = await response.json();
        setCycles(data);
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

  const fetchCycleLinges = async (cycleId) => {
    setIsLingesLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/lavage/cycles/${cycleId}/linges`);
      if (response.ok) {
        const data = await response.json();
        setCycleLinges(data);
      } else {
        setCycleLinges([]);
      }
    } catch (err) {
      console.error("Erreur chargement linges:", err);
      setCycleLinges([]);
    } finally {
      setIsLingesLoading(false);
    }
  };

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
    await fetchCycleLinges(cycle.id);
    setPanelOpen(true);
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

  // ─── Impression des informations du cycle ──────────────────────────────
  const handlePrintCycle = (cycle) => {
    if (!cycle) return;
    
    const printContent = `
      <div style="width:80mm; padding:5mm; font-family:'Courier New',monospace; background:white;">
        <div style="text-align:center; border-bottom:2px solid black; padding-bottom:3mm; margin-bottom:3mm;">
          <h2 style="margin:0; font-size:14pt;">🔄 CYCLE DE LAVAGE</h2>
          <p style="margin:2px 0; font-size:10pt; font-weight:bold;">${cycle.numeroCycle || `#${cycle.id}`}</p>
        </div>
        
        <div style="font-size:9pt; margin-bottom:3mm; border:1px solid #ddd; padding:3mm; border-radius:4px;">
          <div style="display:flex; justify-content:space-between; padding:2px 0;">
            <span><strong>📅 Date:</strong></span>
            <span>${cycle.dateCreation ? new Date(cycle.dateCreation).toLocaleDateString('fr-FR') : 'N/A'}</span>
          </div>
          <div style="display:flex; justify-content:space-between; padding:2px 0;">
            <span><strong>⏰ Heure:</strong></span>
            <span>${cycle.dateCreation ? new Date(cycle.dateCreation).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</span>
          </div>
          <div style="display:flex; justify-content:space-between; padding:2px 0;">
            <span><strong>📊 Statut:</strong></span>
            <span>${cycle.statut || 'N/A'}</span>
          </div>
          <div style="display:flex; justify-content:space-between; padding:2px 0; border-top:1px solid #eee; margin-top:2px; padding-top:4px;">
            <span><strong>🤖 Machine:</strong></span>
            <span>${cycle.machine?.code || cycle.machine?.reference || 'N/A'}</span>
          </div>
          <div style="display:flex; justify-content:space-between; padding:2px 0;">
            <span><strong>📦 Programme:</strong></span>
            <span>${cycle.programmeLavage?.nom || 'N/A'}</span>
          </div>
          <div style="display:flex; justify-content:space-between; padding:2px 0;">
            <span><strong>👤 Agent:</strong></span>
            <span>${cycle.agent?.nom || 'N/A'}</span>
          </div>
          <div style="display:flex; justify-content:space-between; padding:2px 0; border-top:1px solid #eee; margin-top:2px; padding-top:4px;">
            <span><strong>🌡️ Température:</strong></span>
            <span>${cycle.programmeLavage?.temperatureCelsius || 0}°C</span>
          </div>
          <div style="display:flex; justify-content:space-between; padding:2px 0;">
            <span><strong>⏱️ Durée:</strong></span>
            <span>${cycle.programmeLavage?.dureeMinutes || 0} min</span>
          </div>
          ${cycle.programmeLavage?.vitesseEssorageRpm ? `
          <div style="display:flex; justify-content:space-between; padding:2px 0;">
            <span><strong>⚡ Essorage:</strong></span>
            <span>${cycle.programmeLavage.vitesseEssorageRpm} RPM</span>
          </div>` : ''}
        </div>
        
        ${cycleLinges.length > 0 ? `
        <div style="font-size:8pt; margin-top:3mm; border-top:1px solid #ddd; padding-top:2mm;">
          <div style="font-weight:bold; margin-bottom:2mm;">🧺 Linges traités (${cycleLinges.length})</div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:2px; font-size:7pt;">
            ${cycleLinges.slice(0, 10).map(l => `
              <div style="border-bottom:0.5px solid #eee; padding:1px 0;">
                ${l.codeBarre || 'N/A'} - ${l.categorie || 'N/A'}
              </div>
            `).join('')}
            ${cycleLinges.length > 10 ? `<div style="grid-column:1/-1; text-align:center; color:#666; padding:2px 0;">... et ${cycleLinges.length - 10} autres</div>` : ''}
          </div>
        </div>` : ''}
        
        <div style="text-align:center; font-size:7pt; margin-top:3mm; border-top:1px solid #ddd; padding-top:2mm; color:#666;">
          Généré le ${new Date().toLocaleString('fr-FR')}
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

  const getStatusBadge = (status) => {
    const variants = {
      TERMINE: { variant: "success", label: "✅ Terminé" },
      EN_COURS: { variant: "warning", label: "⏳ En cours" },
      EN_ATTENTE: { variant: "secondary", label: "⏸️ En attente" },
      ANNULE: { variant: "destructive", label: "❌ Annulé" }
    };
    const config = variants[status] || { variant: "secondary", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getEtatLingeBadge = (etat) => {
    if (!etat) return <Badge variant="secondary">Non défini</Badge>;
    const variants = {
      COLLECTE: { variant: "warning", label: "Collecte" },
      EN_LAVAGE: { variant: "info", label: "En lavage" },
      LAVE: { variant: "success", label: "Lavé" },
      SECHE: { variant: "success", label: "Séché" },
      STOCKE: { variant: "secondary", label: "Stocké" },
      SALE: { variant: "danger", label: "Sale" },
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

  const filteredCycles = cycles.filter((cycle) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      cycle.numeroCycle?.toLowerCase().includes(term) ||
      cycle.machine?.code?.toLowerCase().includes(term) ||
      cycle.machine?.reference?.toLowerCase().includes(term) ||
      cycle.programmeLavage?.nom?.toLowerCase().includes(term) ||
      cycle.agent?.nom?.toLowerCase().includes(term)
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
          {/* ─── Header ────────────────────────────────────────────────────── */}
          <div className="page-header" style={{ marginBottom: 0, textAlign: "left" }}>
            <h1 className="text-3xl font-extrabold" style={{ marginBottom: "4px" }}>
              🔄 Cycles de Lavage
            </h1>
            <p className="text-sm text-slate-500" style={{ color: "#166d7c" }}>
              Gestion et suivi des cycles de lavage
            </p>
          </div>

          {/* ─── Barre d'outils ────────────────────────────────────────────── */}
          <div className="flex flex-wrap items-center gap-3 bg-white/65 backdrop-blur-md p-4 rounded-[20px] border border-slate-200/50 shadow-[0_4px_20px_rgba(0,0,0,0.02)] mb-6">
            <button
              onClick={fetchCycles}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-300 rounded-[14px] text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> Actualiser
            </button>

            <div style={{ width: "1px", height: "30px", background: "#e2e8f0", margin: "0 8px" }} />

            <button
              disabled={!selectedCycleId}
              onClick={() => {
                if (selectedCycle) handlePrintCycle(selectedCycle);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#8b5cf6]/30 rounded-[14px] text-sm font-bold text-[#8b5cf6] hover:bg-[#8b5cf6]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
            >
              <Printer className="w-4 h-4 stroke-[2.5]" /> Imprimer
            </button>

            <button
              disabled={!selectedCycleId}
              onClick={() => {
                if (selectedCycle) handleViewDetails(selectedCycle);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#006f94]/30 rounded-[14px] text-sm font-bold text-[#006f94] hover:bg-[#006f94]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
            >
              <Eye className="w-4 h-4 stroke-[2.5]" /> Détails
            </button>
          </div>

          {/* ─── Barre de recherche ────────────────────────────────────────── */}
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Rechercher par numéro, machine, programme ou agent..."
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
                      <th className="text-center py-3 px-4 text-sm font-medium w-10"></th>
                      <th className="text-center py-3 px-4 text-sm font-medium">Numéro</th>
                      <th className="text-center py-3 px-4 text-sm font-medium">Machine</th>
                      <th className="text-center py-3 px-4 text-sm font-medium">Programme</th>
                      <th className="text-center py-3 px-4 text-sm font-medium">Agent</th>
                      <th className="text-center py-3 px-4 text-sm font-medium">Statut</th>
                      <th className="text-center py-3 px-4 text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-muted-foreground">
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Chargement...
                          </div>
                        </td>
                      </tr>
                    ) : filteredCycles.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-muted-foreground">
                          {searchTerm ? "Aucun cycle correspondant" : "Aucun cycle trouvé"}
                        </td>
                      </tr>
                    ) : (
                      filteredCycles.map((cycle) => (
                        <tr
                          key={cycle.id}
                          className={`border-b border-border hover:bg-accent/50 transition-colors ${selectedCycleId === cycle.id ? 'bg-blue-50' : ''}`}
                        >
                          <td className="text-center py-3 px-4">
                            <button
                              onClick={() => handleOpenPanel(cycle)}
                              className="p-1 hover:bg-blue-100 rounded-lg transition-colors"
                              title={panelOpen && selectedCycleId === cycle.id ? "Fermer" : "Voir les linges"}
                            >
                              {panelOpen && selectedCycleId === cycle.id ? (
                                <ChevronLeft className="w-5 h-5 text-blue-500" />
                              ) : (
                                <ChevronRight className="w-5 h-5 text-slate-400 hover:text-blue-500" />
                              )}
                            </button>
                          </td>
                          <td className="text-center py-3 px-4">
                            <div className="font-mono text-sm font-medium text-blue-600">
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
                              <User className="w-4 h-4 text-slate-400" />
                              <span className="text-sm">{cycle.agent?.nom || "N/A"}</span>
                            </div>
                          </td>
                          <td className="text-center py-3 px-4">
                            {getStatusBadge(cycle.statut)}
                          </td>
                          <td className="text-center py-3 px-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePrintCycle(cycle);
                                }}
                                className="p-2 hover:bg-accent rounded-lg transition-colors"
                                title="Imprimer"
                              >
                                <Printer className="w-4 h-4 text-[#8b5cf6]" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewDetails(cycle);
                                }}
                                className="p-2 hover:bg-accent rounded-lg transition-colors"
                                title="Détails"
                              >
                                <Eye className="w-4 h-4 text-[#006f94]" />
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
                    {cycleLinges.length} linge{cycleLinges.length > 1 ? 's' : ''}
                  </Badge>
                  <button
                    onClick={() => handlePrintCycle(selectedCycle)}
                    className="p-1.5 hover:bg-blue-200 rounded-lg transition-colors text-slate-500 hover:text-[#8b5cf6]"
                    title="Imprimer"
                  >
                    <Printer className="w-4 h-4" />
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
                  <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                </div>
              ) : cycleLinges.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Package className="w-12 h-12 mx-auto opacity-30 mb-3" />
                  <p className="text-sm">Aucun linge dans ce cycle</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {cycleLinges.map((linge, index) => (
                    <motion.div
                      key={linge.lingeId || index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ 
                        opacity: 1, 
                        y: 0,
                        transition: { 
                          delay: index * 0.05,
                          duration: 0.3
                        }
                      }}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-blue-200 transition-colors hover:shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Package className="w-4 h-4 text-blue-600" />
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

      {/* ─── Modal Détails ──────────────────────────────────────────────────── */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={`Détails du cycle - ${selectedCycle?.numeroCycle || 'N/A'}`}
        size="lg"
      >
        {selectedCycle && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ID</label>
              <Input value={`#${selectedCycle.id}`} disabled />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Numéro</label>
              <Input value={selectedCycle.numeroCycle || "N/A"} disabled />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
              <div className="mt-1">{getStatusBadge(selectedCycle.statut)}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date création</label>
              <div className="flex items-center gap-2 p-2 rounded-lg border border-input bg-slate-50">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>{formatDate(selectedCycle.dateCreation)}</span>
              </div>
            </div>

            {/* Machine */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Machine</label>
              <div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-xs text-slate-400">Code</span>
                  <p className="text-sm font-medium">{selectedCycle.machine?.code || "N/A"}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Référence</span>
                  <p className="text-sm font-medium">{selectedCycle.machine?.reference || "N/A"}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Type</span>
                  <p className="text-sm font-medium">{selectedCycle.machine?.type || "N/A"}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Capacité</span>
                  <p className="text-sm font-medium">{selectedCycle.machine?.capaciteKg || 0} kg</p>
                </div>
              </div>
            </div>

            {/* Programme */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Programme de lavage</label>
              <div className="grid grid-cols-3 gap-2 p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-xs text-slate-400">Nom</span>
                  <p className="text-sm font-medium">{selectedCycle.programmeLavage?.nom || "N/A"}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Température</span>
                  <p className="text-sm font-medium flex items-center gap-1">
                    <Thermometer className="w-3 h-3 text-red-500" />
                    {selectedCycle.programmeLavage?.temperatureCelsius || 0}°C
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Durée</span>
                  <p className="text-sm font-medium flex items-center gap-1">
                    <Timer className="w-3 h-3 text-blue-500" />
                    {selectedCycle.programmeLavage?.dureeMinutes || 0} min
                  </p>
                </div>
                {selectedCycle.programmeLavage?.vitesseEssorageRpm && (
                  <div>
                    <span className="text-xs text-slate-400">Essorage</span>
                    <p className="text-sm font-medium flex items-center gap-1">
                      <Gauge className="w-3 h-3 text-purple-500" />
                      {selectedCycle.programmeLavage.vitesseEssorageRpm} RPM
                    </p>
                  </div>
                )}
                {selectedCycle.programmeLavage?.categories && (
                  <div className="col-span-3">
                    <span className="text-xs text-slate-400">Catégories</span>
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

            {/* Agent */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Agent</label>
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
            <Printer className="w-4 h-4 mr-2" /> Imprimer
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              if (selectedCycle) {
                setSelectedCycleId(selectedCycle.id);
                fetchCycleLinges(selectedCycle.id);
                setPanelOpen(true);
                setShowDetailModal(false);
              }
            }}
          >
            <Package className="w-4 h-4 mr-2" /> Voir les linges
          </Button>
          <Button onClick={() => setShowDetailModal(false)}>
            Fermer
          </Button>
        </div>
      </Modal>
    </div>
  );
}