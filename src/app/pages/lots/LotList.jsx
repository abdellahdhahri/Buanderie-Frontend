// pages/Management/LotList.js
import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  ChevronRight,
  ChevronLeft,
  Package,
  List,
  Weight,
  Calendar,
  Building2,
  X,
  Eye,
  Barcode,
  History,
  RefreshCw,
  Printer,
  Tag,
  FileText,
  Download,
  Filter,
  QrCode
} from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Modal } from "../../components/ui/modal";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import BarcodeLabel from "../../components/BarcodeLabel";

const CATEGORIES = [
  { value: "DRAP", label: "Drap" },
  { value: "TAIE_OREILLER", label: "Taie d'oreiller" },
  { value: "SERVIETTE_BAIN", label: "Serviette de bain" },
  { value: "SERVIETTE_VISAGE", label: "Serviette de visage" },
  { value: "PEIGNOIR", label: "Peignoir" },
  { value: "NAPPE", label: "Nappe" },
  { value: "SERVIETTE_TABLE", label: "Serviette de table" },
  { value: "UNIFORME", label: "Uniforme" },
  { value: "AUTRE", label: "Autre" }
];

const TYPE_COLLECTE = [
  { value: "BLANC", label: "Blanc", color: "info" },
  { value: "INFECTE", label: "Infecté", color: "danger" }
];

// ✅ Nouveaux états avec PRET_SECHAGE, PRET_LAVAGE, EN_TRI
const ETAT_LOT = [
  { value: "EN_RECEPTION", label: "En réception", color: "warning" },
  { value: "EN_ATTENTE_COLLECTE", label: "En attente de collecte", color: "secondary" },
  { value: "EN_TRI", label: "En tri", color: "info" },
  { value: "PRET_LAVAGE", label: "Prêt lavage", color: "info" },
  { value: "PRET_SECHAGE", label: "Prêt séchage", color: "info" },
  { value: "TERMINE", label: "Terminé", color: "success" }
];

export default function LotList() {
  const { t } = useTranslation();

  const [lots, setLots] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLot, setSelectedLot] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [services, setServices] = useState([]);
  const [selectedLotId, setSelectedLotId] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [newRec, setNewRec] = useState({
    categorie: "",
    typeCollecte: "",
    capaciteMax: ""
  });

  useEffect(() => {
    fetchLots();
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const res = await fetch("http://localhost:8082/api/services");
      if (res.ok) {
        const data = await res.json();
        setServices(data);
      }
    } catch (err) {
      console.error("Erreur chargement services:", err);
    }
  };

  const fetchLots = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:8082/api/lots");
      if (response.ok) {
        const data = await response.json();
        setLots(data);
        console.log("Liste des lots chargés:", data);
      }
    } catch (err) {
      console.error("Erreur réseau:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenPanel = (lot) => {
    if (selectedLotId === lot.id && panelOpen) {
      setPanelOpen(false);
      setTimeout(() => {
        setSelectedLotId(null);
      }, 300);
      return;
    }
    setSelectedLotId(lot.id);
    setSelectedLot(lot);
    setPanelOpen(true);
  };

  const handleClosePanel = () => {
    setPanelOpen(false);
    setTimeout(() => {
      setSelectedLotId(null);
    }, 300);
  };

  // ✅ getStatusBadge avec traduction
  const getStatusBadge = (status) => {
    if (!status) return <Badge variant="secondary">{t('lot_status.Non défini')}</Badge>;
    
    const variants = {
      BLANC: { variant: "info", label: t('lot_status.BLANC') },
      INFECTE: { variant: "danger", label: t('lot_status.INFECTE') },
      EN_RECEPTION: { variant: "warning", label: t('lot_status.EN_RECEPTION') },
      EN_ATTENTE_COLLECTE: { variant: "secondary", label: t('lot_status.EN_ATTENTE_COLLECTE') },
      EN_TRI: { variant: "info", label: t('lot_status.EN_TRI') },
      PRET_LAVAGE: { variant: "info", label: t('lot_status.PRET_LAVAGE') },
      PRET_SECHAGE: { variant: "info", label: t('lot_status.PRET_SECHAGE') },
      TERMINE: { variant: "success", label: t('lot_status.TERMINE') }
    };
    
    const config = variants[status] || { variant: "secondary", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleOpenCreateModal = () => {
    setSelectedLot(null);
    setNewRec({
      categorie: "",
      typeCollecte: "",
      capaciteMax: ""
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (rec) => {
    setSelectedLot(rec);
    setNewRec({
      codeLot: rec.codeLot || "",
      categorie: rec.categorie || "",
      typeCollecte: rec.typeCollecte || "",
      capaciteMax: rec.capaciteMax || ""
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!newRec.categorie) {
      Swal.fire({
        title: t('lot.categorie_required'),
        text: t('lot.categorie_required_text'),
        icon: "warning",
      });
      return;
    }

    if (!newRec.typeCollecte) {
      Swal.fire({
        title: t('lot.type_collecte_required'),
        text: t('lot.type_collecte_required_text'),
        icon: "warning",
      });
      return;
    }

    setIsSaving(true);

    try {
      const params = new URLSearchParams({
        typeCollecte: newRec.typeCollecte,
        categorie: newRec.categorie,
        capaciteMax: parseFloat(newRec.capaciteMax) || 10
      });

      const url = selectedLot 
        ? `http://localhost:8082/api/lots/${selectedLot.id}`
        : `http://localhost:8082/api/lots?${params.toString()}`;
      
      const method = selectedLot ? "PUT" : "POST";

      const options = {
        method,
        headers: { "Content-Type": "application/json" },
      };

      if (selectedLot) {
        const payload = {
          typeCollecte: newRec.typeCollecte,
          categorie: newRec.categorie,
          capaciteMax: parseFloat(newRec.capaciteMax) || 10
        };
        options.body = JSON.stringify(payload);
      }

      const response = await fetch(url, options);

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
      
      if (selectedLot) {
        setLots((prev) => prev.map((r) => (r.id === data.id ? data : r)));
        Swal.fire({
          title: "✅",
          text: t('lot.update_success'),
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        setLots((prev) => [data, ...prev]);
        Swal.fire({
          title: "✅",
          text: t('lot.create_success'),
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
      }

      setIsModalOpen(false);
      fetchLots();

    } catch (err) {
      console.error("❌ Erreur:", err);
      Swal.fire({
        title: "❌",
        text: t('lot.error_text'),
        icon: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const deleteRec = async (id) => {
    const result = await Swal.fire({
      title: t('lot.delete_confirm'),
      text: t('lot.delete_confirm_text'),
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: t('lot.delete_confirm_yes'),
      cancelButtonText: t('lot.delete_confirm_no'),
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`http://localhost:8082/api/lots/${id}`, {
          method: "DELETE",
        });
        if (response.ok) {
          setLots((prev) => prev.filter((r) => r.id !== id));
          if (selectedLotId === id) {
            handleClosePanel();
          }
          Swal.fire({
            title: "✅",
            text: t('lot.delete_success'),
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
          title: "❌",
          text: t('lot.error_text'),
          icon: "error",
        });
      }
    }
  };

  const handleRowClick = (id) => {
    setSelectedId((prev) => (prev === id ? null : id));
  };

  const filteredLots = lots.filter((r) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      r.codeLot?.toLowerCase().includes(term) ||
      r.categorie?.toLowerCase().includes(term) ||
      r.typeCollecte?.toLowerCase().includes(term) ||
      r.etat?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="relative flex h-full gap-4">
      <motion.div 
        className="transition-all duration-500 ease-in-out"
        animate={{ 
          width: panelOpen ? '70%' : '100%',
          transition: { duration: 0.4, ease: "easeInOut" }
        }}
      >
        <div className="space-y-4">
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
                background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                boxShadow: "0 4px 16px rgba(139, 92, 246, 0.25)"
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
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
              </div>
              <div>
                <h1 style={{
                  fontSize: "28px",
                  fontWeight: 800,
                  color: "#0f172a",
                  margin: 0
                }}>
                  {t('lot.title')}
                </h1>
                <p style={{
                  fontSize: "14px",
                  color: "#64748b",
                  margin: "2px 0 0 0"
                }}>
                  {t('lot.subtitle')}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 bg-white/65 backdrop-blur-md p-4 rounded-[20px] border border-slate-200/50 shadow-[0_4px_20px_rgba(0,0,0,0.02)] mb-6">
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#0ca678]/30 rounded-[14px] text-sm font-bold text-[#0ca678] hover:bg-[#0ca678]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" /> {t('lot.new')}
            </button>

            <div style={{ width: "1px", height: "30px", background: "#e2e8f0", margin: "0 8px" }} />

            {selectedLot && (
              <BarcodeLabel item={selectedLot} type="lot" />
            )}

            <button
              disabled={!selectedLotId}
              onClick={() => {
                if (selectedLot) {
                  // Ticket Lot
                }
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#8b5cf6]/30 rounded-[14px] text-sm font-bold text-[#8b5cf6] hover:bg-[#8b5cf6]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
            >
              <Printer className="w-4 h-4 stroke-[2.5]" /> {t('lot.ticket')}
            </button>

            <div style={{ width: "1px", height: "30px", background: "#e2e8f0", margin: "0 8px" }} />

            <button
              disabled={!selectedLotId}
              onClick={() => handleOpenEditModal(selectedLot)}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#006f94]/30 rounded-[14px] text-sm font-bold text-[#006f94] hover:bg-[#006f94]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
            >
              <Edit className="w-4 h-4 stroke-[2.5]" /> {t('common.edit')}
            </button>

            <button
              disabled={!selectedLotId}
              onClick={async () => {
                if (selectedLotId) {
                  const confirmed = await Swal.fire({
                    title: t('lot.delete_confirm'),
                    text: t('lot.delete_confirm_text'),
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonColor: "#d33",
                    cancelButtonColor: "#3085d6",
                    confirmButtonText: t('lot.delete_confirm_yes'),
                    cancelButtonText: t('lot.delete_confirm_no'),
                  });
                  if (confirmed.isConfirmed) {
                    deleteRec(selectedLotId);
                  }
                }
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#e03131]/30 rounded-[14px] text-sm font-bold text-[#e03131] hover:bg-[#e03131]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
            >
              <Trash2 className="w-4 h-4 stroke-[2.5]" /> {t('common.delete')}
            </button>

            <button
              onClick={fetchLots}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-300 rounded-[14px] text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> {t('common.refresh')}
            </button>
          </div>

          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={t('lot.search_placeholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border bg-muted/50">
                    <tr>
                      <th className="text-center py-3 px-4 text-sm font-medium w-10"></th>
                      <th className="text-center py-3 px-4 text-sm font-medium">{t('lot.code')}</th>
                      <th className="text-center py-3 px-4 text-sm font-medium">{t('lot.category')}</th>
                      <th className="text-center py-3 px-4 text-sm font-medium">{t('lot.type_collecte')}</th>
                      <th className="text-center py-3 px-4 text-sm font-medium">{t('lot.status')}</th>
                      <th className="text-center py-3 px-4 text-sm font-medium">{t('lot.date_creation')}</th>
                      <th className="text-center py-3 px-4 text-sm font-medium">{t('lot.capacity')}</th>
                      <th className="text-center py-3 px-4 text-sm font-medium">{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-muted-foreground">
                          <div className="flex items-center justify-center gap-2">
                            <svg className="animate-spin w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            {t('common.loading')}
                          </div>
                        </td>
                      </tr>
                    ) : filteredLots.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-muted-foreground">
                          {searchTerm ? t('lot.no_match') : t('lot.no_data')}
                        </td>
                      </tr>
                    ) : (
                      filteredLots.map((lot) => (
                        <tr
                          key={lot.id}
                          onClick={() => handleRowClick(lot.id)}
                          className={`border-b border-border hover:bg-accent/50 transition-colors cursor-pointer ${
                            selectedLotId === lot.id ? 'bg-blue-50' : ''
                          }`}
                        >
                          <td className="text-center py-3 px-4">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenPanel(lot);
                              }}
                              className="p-1 hover:bg-blue-100 rounded-lg transition-colors"
                              title={panelOpen && selectedLotId === lot.id ? t('common.close') : t('lot.details')}
                            >
                              {panelOpen && selectedLotId === lot.id ? (
                                <ChevronLeft className="w-5 h-5 text-blue-500" />
                              ) : (
                                <ChevronRight className="w-5 h-5 text-slate-400 hover:text-blue-500" />
                              )}
                            </button>
                          </td>
                          <td className="text-center py-3 px-4">
                            <div className="font-mono text-sm font-medium text-blue-600">
                              {lot.codeLot || `LOT-${lot.id}`}
                            </div>
                          </td>
                          <td className="text-center py-3 px-4">
                            <Badge variant="outline">{lot.categorie || "N/A"}</Badge>
                          </td>
                          <td className="text-center py-3 px-4">
                            {getStatusBadge(lot.typeCollecte)}
                          </td>
                          <td className="text-center py-3 px-4">
                            {getStatusBadge(lot.etat)}
                          </td>
                          <td className="text-center py-3 px-4 text-sm">
                            {lot.dateCreation ? new Date(lot.dateCreation).toLocaleDateString() : "N/A"}
                          </td>
                          <td className="text-center py-3 px-4">
                            <div className="flex items-center justify-center gap-2">
                              <Weight className="w-4 h-4 text-slate-400" />
                              <span className="font-medium">{lot.poidsActuel || 0} kg</span>
                              <span className="text-xs text-slate-400">/</span>
                              <span className="text-xs text-slate-400">{lot.capaciteMax || 0} kg</span>
                            </div>
                          </td>
                          <td className="text-center py-3 px-4">
                            <div className="flex items-center justify-center gap-2">
                              <BarcodeLabel item={lot} type="lot" />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEditModal(lot);
                                }}
                                className="p-2 hover:bg-accent rounded-lg transition-colors"
                                title={t('common.edit')}
                              >
                                <Edit className="w-4 h-4 text-[#006f94]" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteRec(lot.id);
                                }}
                                className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                                title={t('common.delete')}
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

      <AnimatePresence mode="wait">
        {panelOpen && selectedLot && (
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
            className="w-[30%] bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden h-[calc(100vh-120px)] sticky top-20 flex-shrink-0"
          >
            <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-blue-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-blue-600" />
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">
                      {selectedLot.codeLot || `LOT-${selectedLot.id}`}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {selectedLot.categorie || "N/A"} • {selectedLot.typeCollecte || "BLANC"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <BarcodeLabel item={selectedLot} type="lot" />
                  <button
                    onClick={handleClosePanel}
                    className="p-1.5 hover:bg-blue-200 rounded-lg transition-colors text-slate-500 hover:text-slate-700"
                    title={t('common.close')}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 overflow-y-auto h-[calc(100%-80px)]">
              <div className="space-y-4">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <div className="text-center">
                    <div className="text-xs text-slate-500 mb-2">{t('lot.barcode_title')}</div>
                    <div className="flex justify-center">
                      <img
                        src={`https://barcodeapi.org/api/${/^\d{13}$/.test(selectedLot.codeLot || `LOT-${selectedLot.id}`) ? 'ean13' : /^\d{8}$/.test(selectedLot.codeLot || `LOT-${selectedLot.id}`) ? 'ean8' : /^\d{12}$/.test(selectedLot.codeLot || `LOT-${selectedLot.id}`) ? 'upc' : 'code128'}/${encodeURIComponent(selectedLot.codeLot || `LOT-${selectedLot.id}`)}`}
                        style={{ height: "50px", maxWidth: "200px" }}
                        alt="Code-barres"
                      />
                    </div>
                    <div className="text-xs font-mono text-slate-600 mt-2">
                      {selectedLot.codeLot || `LOT-${selectedLot.id}`}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                    <span className="text-sm text-slate-600">📅 {t('lot.date_creation')}</span>
                    <span className="text-sm font-medium">
                      {selectedLot.dateCreation ? new Date(selectedLot.dateCreation).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                    <span className="text-sm text-slate-600">📂 {t('lot.category')}</span>
                    <Badge variant="outline">{selectedLot.categorie || "N/A"}</Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                    <span className="text-sm text-slate-600">🏷️ {t('lot.type_collecte')}</span>
                    {getStatusBadge(selectedLot.typeCollecte)}
                  </div>
                  <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                    <span className="text-sm text-slate-600">📊 {t('lot.status')}</span>
                    {getStatusBadge(selectedLot.etat)}
                  </div>
                  <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                    <span className="text-sm text-slate-600">⚖️ {t('lot.max_capacity')}</span>
                    <span className="text-sm font-medium">{selectedLot.capaciteMax || 0} kg</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                    <span className="text-sm text-slate-600">📦 {t('lot.current_weight')}</span>
                    <span className="text-sm font-medium">{selectedLot.poidsActuel || 0} kg</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4">
                  <BarcodeLabel item={selectedLot} type="lot" />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedLot ? `${t('lot.edit')} #${selectedLot.id}` : t('lot.new')}
        size="lg"
      >
        <form onSubmit={handleSave}>
          <div className="grid grid-cols-2 gap-4">
            {selectedLot && (
              <div>
                <Input
                  label={t('lot.code')}
                  value={selectedLot.codeLot || `LOT-${selectedLot.id}`}
                  disabled
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">
                {t('lot.category')} <span className="text-red-500">*</span>
              </label>
              <select
                value={newRec.categorie}
                onChange={(e) =>
                  setNewRec({ ...newRec, categorie: e.target.value })
                }
                className="w-full h-10 px-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                required
              >
                <option value="">{t('lot.select_category')}</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {t('lot.type_collecte')} <span className="text-red-500">*</span>
              </label>
              <select
                value={newRec.typeCollecte}
                onChange={(e) =>
                  setNewRec({ ...newRec, typeCollecte: e.target.value })
                }
                className="w-full h-10 px-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                required
              >
                <option value="">{t('lot.select_type')}</option>
                {TYPE_COLLECTE.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {t('lot.max_capacity')} (kg)
              </label>
              <input
                type="number"
                step="0.1"
                value={newRec.capaciteMax}
                onChange={(e) =>
                  setNewRec({ ...newRec, capaciteMax: e.target.value })
                }
                className="w-full h-10 px-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="10"
              />
            </div>

            {selectedLot && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('lot.current_status')}
                </label>
                <div className="w-full h-10 px-3 rounded-lg border border-input bg-slate-50 flex items-center">
                  {getStatusBadge(selectedLot.etat)}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              type="button"
              disabled={isSaving}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? t('common.loading') : (selectedLot ? t('common.save') : t('lot.create'))}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}