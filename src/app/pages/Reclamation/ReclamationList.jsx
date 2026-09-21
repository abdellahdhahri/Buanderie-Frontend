import React, { useState, useEffect, useMemo } from "react";
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
  X,
  Eye,
  RefreshCw,
  Printer,
  Filter,
  User,
  FileWarning,
  Calendar,
  Play,
  RotateCcw,
  CheckCheck,
  Ban,
} from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Modal } from "../../components/ui/modal";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";



const TYPE_ICONS = {
  TROU: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="4" fill="currentColor" />
    </svg>
  ),
  TACHE_PERSISTANTE: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" fill="currentColor" opacity="0.3" />
    </svg>
  ),
  DECHIRE: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4L20 20" />
      <path d="M4 20L20 4" />
    </svg>
  ),
  COUTURE_ABIMEE: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4L8 8L4 12L8 16L4 20" />
      <path d="M20 4L16 8L20 12L16 16L20 20" />
      <line x1="8" y1="8" x2="16" y2="8" />
      <line x1="8" y1="12" x2="16" y2="12" />
      <line x1="8" y1="16" x2="16" y2="16" />
    </svg>
  ),
  BOUTON_MANQUANT: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
      <line x1="12" y1="2" x2="12" y2="4" />
      <line x1="12" y1="20" x2="12" y2="22" />
      <line x1="2" y1="12" x2="4" y2="12" />
      <line x1="20" y1="12" x2="22" y2="12" />
    </svg>
  ),
  A_REFORMER: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
      <circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.3" />
    </svg>
  ),
  MAL_LAVE: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 18h18" />
      <path d="M3 12h18" />
      <path d="M3 6h18" />
      <path d="M8 8L16 16" />
      <path d="M8 16L16 8" />
    </svg>
  ),
  AUTRE: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
};

const TYPE_COLORS = {
  TROU: { bg: "bg-red-50", text: "text-red-600", border: "border-red-200" },
  TACHE_PERSISTANTE: { bg: "bg-yellow-50", text: "text-yellow-600", border: "border-yellow-200" },
  DECHIRE: { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-200" },
  COUTURE_ABIMEE: { bg: "bg-pink-50", text: "text-pink-600", border: "border-pink-200" },
  BOUTON_MANQUANT: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200" },
  A_REFORMER: { bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-200" },
  MAL_LAVE: { bg: "bg-cyan-50", text: "text-cyan-600", border: "border-cyan-200" },
  AUTRE: { bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200" },
};

const STATUS_CONFIG = {
  OUVERTE: { variant: "warning", label: "Ouverte", color: "#f59e0b", bg: "#fffbeb", Icon: AlertCircle },
  EN_COURS: { variant: "info", label: "En cours", color: "#3b82f6", bg: "#eff6ff", Icon: Clock },
  RESOLUE: { variant: "success", label: "Résolue", color: "#10b981", bg: "#f0fdf4", Icon: CheckCircle },
  FERMEE: { variant: "secondary", label: "Fermée", color: "#64748b", bg: "#f1f5f9", Icon: XCircle },
};

export default function ReclamationList() {
  const { t } = useTranslation();

  const [reclamations, setReclamations] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReclamation, setSelectedReclamation] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // ✅ États du panneau latéral
  const [selectedRecId, setSelectedRecId] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const [newRec, setNewRec] = useState({
    codeBarre: "",
    description: "",
    type: "TROU",
    categorieLinge: "",
    agentId: "",
  });

  // ─── Chargement ─────────────────────────────────────────────────────────
  useEffect(() => {
    fetchReclamations();
  }, []);

  const fetchReclamations = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/reclamations`);
      if (response.ok) {
        const data = await response.json();
        setReclamations(data);
      } else {
        console.error("Erreur chargement réclamations:", await response.text());
      }
    } catch (err) {
      console.error("Erreur réseau:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Panneau latéral ────────────────────────────────────────────────────
  const handleOpenPanel = (rec) => {
    if (selectedRecId === rec.id && panelOpen) {
      setPanelOpen(false);
      setTimeout(() => {
        setSelectedRecId(null);
        setSelectedId(null);
      }, 300);
      return;
    }
    setSelectedRecId(rec.id);
    setSelectedReclamation(rec);
    setSelectedId(null);
    setPanelOpen(true);
  };

  const handleClosePanel = () => {
    setPanelOpen(false);
    setTimeout(() => {
      setSelectedRecId(null);
      setSelectedId(null);
    }, 300);
  };

  const handleRowClick = (id) => {
    setSelectedId((prev) => (prev === id ? null : id));
  };

  // ─── Badges ─────────────────────────────────────────────────────────────
  const getStatusBadge = (status) => {
    if (!status) return <Badge variant="secondary">{t("common.undefined")}</Badge>;
    const config = STATUS_CONFIG[status] || { variant: "secondary", label: status };
    return (
      <Badge variant={config.variant}>
        {t(`reclamations.statuses.${status}`, config.label)}
      </Badge>
    );
  };

  const getTypeBadge = (type) => {
    const style = TYPE_COLORS[type] || TYPE_COLORS.AUTRE;
    const icon = TYPE_ICONS[type] || TYPE_ICONS.AUTRE;
    const label = t(`reclamations.types.${type}`, type?.replace(/_/g, " ") || "Autre");
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text} ${style.border} border`}
      >
        {icon}
        {label}
      </span>
    );
  };

  // ─── Modal CRUD ─────────────────────────────────────────────────────────
  const handleOpenCreateModal = () => {
    setSelectedReclamation(null);
    setNewRec({
      codeBarre: "",
      description: "",
      type: "TROU",
      categorieLinge: "",
      agentId: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (rec) => {
    setSelectedReclamation(rec);
    setNewRec({
      codeBarre: rec.linge?.codeBarre || "",
      description: rec.description || "",
      type: rec.type || "TROU",
      categorieLinge: rec.linge?.categorie || "",
      agentId: rec.agent?.id || "",
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        codeBarre: newRec.codeBarre,
        description: newRec.description,
        type: newRec.type,
        agentId: 1,
      };

      const url = selectedReclamation
        ? `${API_URL}/api/reclamations/${selectedReclamation.id}`
        : `${API_URL}/api/reclamations`;
      const method = selectedReclamation ? "PUT" : "POST";

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

      if (selectedReclamation) {
        setReclamations((prev) => prev.map((r) => (r.id === data.id ? data : r)));
        Swal.fire({
          title: "✅",
          text: t("reclamations.update_success"),
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        setReclamations((prev) => [data, ...prev]);
        Swal.fire({
          title: "✅",
          text: t("reclamations.create_success"),
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
      }

      setIsModalOpen(false);
      fetchReclamations();
    } catch (err) {
      console.error("❌ Erreur:", err);
      Swal.fire({
        title: "❌",
        text: t("reclamations.error_text"),
        icon: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const deleteRec = async (id) => {
    const result = await Swal.fire({
      title: t("common.delete_confirm"),
      text: t("common.delete_confirm_text"),
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: t("common.delete_confirm_yes"),
      cancelButtonText: t("common.cancel"),
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`${API_URL}/api/reclamations/${id}`, {
          method: "DELETE",
        });
        if (response.ok) {
          setReclamations((prev) => prev.filter((r) => r.id !== id));
          if (selectedRecId === id) {
            handleClosePanel();
          }
          Swal.fire({
            title: "✅",
            text: t("reclamations.delete_success"),
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
          text: t("reclamations.error_text"),
          icon: "error",
        });
      }
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      const response = await fetch(
        `${API_URL}/api/reclamations/${id}/status?status=${newStatus}`,
        { method: "PUT" }
      );
      if (response.ok) {
        const data = await response.json();
        setReclamations((prev) => prev.map((r) => (r.id === data.id ? data : r)));
        if (selectedRecId === id) {
          setSelectedReclamation(data);
        }
        Swal.fire({
          title: "✅",
          text: t("reclamations.status_updated", {
            status: t(`reclamations.statuses.${newStatus}`, newStatus),
          }),
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        const error = await response.text();
        throw new Error(error);
      }
    } catch (err) {
      console.error("Erreur mise à jour statut:", err);
      Swal.fire({
        title: "❌",
        text: t("reclamations.error_text"),
        icon: "error",
      });
    }
  };

  // ─── Filtrage (optimisé avec useMemo) ──────────────────────────────────
  const filteredReclamations = useMemo(() => {
    return reclamations.filter((r) => {
      if (filterStatus !== "ALL" && r.status !== filterStatus) return false;
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        r.linge?.codeBarre?.toLowerCase().includes(term) ||
        r.linge?.categorie?.toLowerCase().includes(term) ||
        r.agent?.nom?.toLowerCase().includes(term) ||
        r.agent?.prenom?.toLowerCase().includes(term) ||
        r.type?.toLowerCase().includes(term) ||
        r.description?.toLowerCase().includes(term)
      );
    });
  }, [reclamations, filterStatus, searchTerm]);

  // ─── Stats (optimisé avec useMemo) ─────────────────────────────────────
  const stats = useMemo(
    () => ({
      total: reclamations.length,
      ouvertes: reclamations.filter((r) => r.status === "OUVERTE").length,
      enCours: reclamations.filter((r) => r.status === "EN_COURS").length,
      resolues: reclamations.filter((r) => r.status === "RESOLUE").length,
      fermees: reclamations.filter((r) => r.status === "FERMEE").length,
    }),
    [reclamations]
  );

  // ═══════════════════════════════════════════════════════════════════════
  // 🎨 RENDU
  // ═══════════════════════════════════════════════════════════════════════
  return (
    <div className="relative flex h-full gap-4">
      {/* ═══════════════════════════════════════════════════════════════
          COLONNE GAUCHE - LISTE
      ═══════════════════════════════════════════════════════════════ */}
      <motion.div
        className="transition-all duration-500 ease-in-out"
        animate={{
          width: panelOpen ? "70%" : "100%",
          transition: { duration: 0.4, ease: "easeInOut" },
        }}
      >
        <div className="space-y-4">
          {/* Header */}
          <div style={{ marginBottom: "32px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "8px" }}>
              <div
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "16px",
                  background: "linear-gradient(135deg, #ef4444, #dc2626)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  boxShadow: "0 4px 16px rgba(239, 68, 68, 0.25)",
                }}
              >
                <FileWarning size={24} />
              </div>
              <div>
                <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                  {t("reclamations.title")}
                </h1>
                <p style={{ fontSize: "14px", color: "#64748b", margin: "2px 0 0 0" }}>
                  {t("reclamations.subtitle", { count: stats.total })}
                </p>
              </div>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3 bg-white/65 backdrop-blur-md p-4 rounded-[20px] border border-slate-200/50 shadow-[0_4px_20px_rgba(0,0,0,0.02)] mb-6">
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#0ca678]/30 rounded-[14px] text-sm font-bold text-[#0ca678] hover:bg-[#0ca678]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" /> {t("reclamations.new")}
            </button>

            <div style={{ width: "1px", height: "30px", background: "#e2e8f0", margin: "0 8px" }} />

            {selectedReclamation && (
              <button
                onClick={() => {
                  // ticket réclamation
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#8b5cf6]/30 rounded-[14px] text-sm font-bold text-[#8b5cf6] hover:bg-[#8b5cf6]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02]"
              >
                <Printer className="w-4 h-4 stroke-[2.5]" /> {t("reclamations.ticket")}
              </button>
            )}

            <div style={{ width: "1px", height: "30px", background: "#e2e8f0", margin: "0 8px" }} />

            <button
              disabled={!selectedRecId}
              onClick={() => handleOpenEditModal(selectedReclamation)}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#006f94]/30 rounded-[14px] text-sm font-bold text-[#006f94] hover:bg-[#006f94]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
            >
              <Edit className="w-4 h-4 stroke-[2.5]" /> {t("common.edit")}
            </button>

            <button
              disabled={!selectedRecId}
              onClick={async () => {
                if (selectedRecId) {
                  const confirmed = await Swal.fire({
                    title: t("common.delete_confirm"),
                    text: t("common.delete_confirm_text"),
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonColor: "#d33",
                    cancelButtonColor: "#3085d6",
                    confirmButtonText: t("common.delete_confirm_yes"),
                    cancelButtonText: t("common.cancel"),
                  });
                  if (confirmed.isConfirmed) {
                    deleteRec(selectedRecId);
                  }
                }
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#e03131]/30 rounded-[14px] text-sm font-bold text-[#e03131] hover:bg-[#e03131]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
            >
              <Trash2 className="w-4 h-4 stroke-[2.5]" /> {t("common.delete")}
            </button>

            <button
              onClick={fetchReclamations}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-300 rounded-[14px] text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} /> {t("common.refresh")}
            </button>
          </div>

          {/* Recherche + Filtre */}
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder={t("reclamations.search_placeholder")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full h-10 pl-10 pr-4 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="h-10 pl-9 pr-8 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                  >
                    <option value="ALL">{t("reclamations.filter.all")}</option>
                    <option value="OUVERTE">{t("reclamations.statuses.OUVERTE")}</option>
                    <option value="EN_COURS">{t("reclamations.statuses.EN_COURS")}</option>
                    <option value="RESOLUE">{t("reclamations.statuses.RESOLUE")}</option>
                    <option value="FERMEE">{t("reclamations.statuses.FERMEE")}</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tableau */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border bg-muted/50">
                    <tr>
                      <th className="text-center py-3 px-4 text-sm font-medium w-10"></th>
                      <th className="text-center py-3 px-4 text-sm font-medium">{t("reclamations.article")}</th>
                      <th className="text-center py-3 px-4 text-sm font-medium">{t("reclamations.agent")}</th>
                      <th className="text-center py-3 px-4 text-sm font-medium">{t("reclamations.type")}</th>
                      <th className="text-center py-3 px-4 text-sm font-medium">{t("reclamations.date")}</th>
                      <th className="text-center py-3 px-4 text-sm font-medium">{t("reclamations.status")}</th>
                      <th className="text-center py-3 px-4 text-sm font-medium">{t("common.actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-muted-foreground">
                          <div className="flex items-center justify-center gap-2">
                            <RefreshCw className="animate-spin w-5 h-5" />
                            {t("common.loading")}
                          </div>
                        </td>
                      </tr>
                    ) : filteredReclamations.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-muted-foreground">
                          {searchTerm || filterStatus !== "ALL"
                            ? t("reclamations.no_match")
                            : t("reclamations.no_data")}
                        </td>
                      </tr>
                    ) : (
                      filteredReclamations.map((r) => (
                        <tr
                          key={r.id}
                          onClick={() => handleRowClick(r.id)}
                          className={`border-b border-border hover:bg-accent/50 transition-colors cursor-pointer ${
                            selectedRecId === r.id ? "bg-blue-50" : ""
                          }`}
                        >
                          <td className="text-center py-3 px-4">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenPanel(r);
                              }}
                              className="p-1 hover:bg-blue-100 rounded-lg transition-colors"
                              title={
                                panelOpen && selectedRecId === r.id
                                  ? t("common.close")
                                  : t("reclamations.details")
                              }
                            >
                              {panelOpen && selectedRecId === r.id ? (
                                <ChevronLeft className="w-5 h-5 text-blue-500" />
                              ) : (
                                <ChevronRight className="w-5 h-5 text-slate-400 hover:text-blue-500" />
                              )}
                            </button>
                          </td>
                          <td className="text-center py-3 px-4">
                            <div className="font-medium text-sm">
                              {r.linge?.categorie || "N/A"}
                            </div>
                            <code className="text-xs text-muted-foreground font-mono">
                              {r.linge?.codeBarre || "N/A"}
                            </code>
                          </td>
                          <td className="text-center py-3 px-4">
                            <div className="flex items-center justify-center gap-2">
                              <User className="w-4 h-4 text-slate-400" />
                              <span className="text-sm">{r.agent?.nom || "N/A"}</span>
                            </div>
                            {r.agent?.matricule && (
                              <div className="text-xs text-muted-foreground">
                                {r.agent.matricule}
                              </div>
                            )}
                          </td>
                          <td className="text-center py-3 px-4">
                            {getTypeBadge(r.type)}
                          </td>
                          <td className="text-center py-3 px-4 text-sm text-slate-500">
                            {r.dateCreation
                              ? new Date(r.dateCreation).toLocaleDateString("fr-FR")
                              : "N/A"}
                          </td>
                          <td className="text-center py-3 px-4">
                            {getStatusBadge(r.status)}
                          </td>
                          <td className="text-center py-3 px-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEditModal(r);
                                }}
                                className="p-2 hover:bg-accent rounded-lg transition-colors"
                                title={t("common.edit")}
                              >
                                <Edit className="w-4 h-4 text-[#006f94]" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteRec(r.id);
                                }}
                                className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                                title={t("common.delete")}
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

      {/* ═══════════════════════════════════════════════════════════════
          PANNEAU LATÉRAL
      ═══════════════════════════════════════════════════════════════ */}
      <AnimatePresence mode="wait">
        {panelOpen && selectedReclamation && (
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
                duration: 0.4,
              },
            }}
            exit={{
              opacity: 0,
              x: 100,
              scale: 0.95,
              transition: { duration: 0.3, ease: "easeInOut" },
            }}
            className="w-[30%] bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden h-[calc(100vh-120px)] sticky top-20 flex-shrink-0"
          >
            {/* Header panneau */}
            <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-red-50 to-red-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileWarning className="w-5 h-5 text-red-600" />
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">
                      {t("reclamations.details_title")} #{selectedReclamation.id}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {selectedReclamation.linge?.categorie || "N/A"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClosePanel}
                  className="p-1.5 hover:bg-red-200 rounded-lg transition-colors text-slate-500 hover:text-slate-700"
                  title={t("common.close")}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Contenu panneau */}
            <div className="p-4 overflow-y-auto h-[calc(100%-80px)]">
              <div className="space-y-4">
                {/* Badge statut actuel */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-center">
                  <div className="text-xs text-slate-500 mb-2">
                    {t("reclamations.current_status")}
                  </div>
                  <div className="flex justify-center">
                    {getStatusBadge(selectedReclamation.status)}
                  </div>
                </div>

                {/* Détails */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                    <span className="text-sm text-slate-600">
                      📅 {t("reclamations.date")}
                    </span>
                    <span className="text-sm font-medium">
                      {selectedReclamation.dateCreation
                        ? new Date(selectedReclamation.dateCreation).toLocaleDateString("fr-FR")
                        : "N/A"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                    <span className="text-sm text-slate-600">
                      📦 {t("reclamations.article")}
                    </span>
                    <span className="text-sm font-medium font-mono">
                      {selectedReclamation.linge?.codeBarre || "N/A"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                    <span className="text-sm text-slate-600">
                      📂 {t("reclamations.article_category")}
                    </span>
                    <Badge variant="outline">
                      {selectedReclamation.linge?.categorie || "N/A"}
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                    <span className="text-sm text-slate-600">
                      👤 {t("reclamations.agent")}
                    </span>
                    <span className="text-sm font-medium">
                      {selectedReclamation.agent?.nom || "N/A"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                    <span className="text-sm text-slate-600">
                      🏷️ {t("reclamations.type")}
                    </span>
                    {getTypeBadge(selectedReclamation.type)}
                  </div>
                </div>

                {/* Description */}
                {selectedReclamation.description && (
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                    <div className="text-xs text-slate-500 mb-2 font-semibold uppercase">
                      {t("reclamations.problem_description")}
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {selectedReclamation.description}
                    </p>
                  </div>
                )}

                {/* Actions de statut */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                  <div className="text-xs text-slate-500 mb-2 font-semibold uppercase">
                    {t("reclamations.actions_label")}
                  </div>
                  <div className="flex flex-col gap-2">
                    {selectedReclamation.status === "OUVERTE" && (
                      <button
                        onClick={() => updateStatus(selectedReclamation.id, "EN_COURS")}
                        className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-[#3b82f6] bg-[#eff6ff] text-[#1d4ed8] text-xs font-bold hover:bg-[#dbeafe] transition-colors"
                      >
                        <Play className="w-3.5 h-3.5" />
                        {t("reclamations.take")}
                      </button>
                    )}
                    {selectedReclamation.status === "EN_COURS" && (
                      <>
                        <button
                          onClick={() => updateStatus(selectedReclamation.id, "RESOLUE")}
                          className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-[#10b981] bg-[#f0fdf4] text-[#15803d] text-xs font-bold hover:bg-[#dcfce7] transition-colors"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          {t("reclamations.resolve_btn")}
                        </button>
                        <button
                          onClick={() => updateStatus(selectedReclamation.id, "FERMEE")}
                          className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-[#64748b] bg-[#f1f5f9] text-[#475569] text-xs font-bold hover:bg-[#e2e8f0] transition-colors"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          {t("reclamations.close_btn")}
                        </button>
                      </>
                    )}
                    {selectedReclamation.status === "RESOLUE" && (
                      <button
                        onClick={() => updateStatus(selectedReclamation.id, "EN_COURS")}
                        className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-[#f59e0b] bg-[#fffbeb] text-[#d97706] text-xs font-bold hover:bg-[#fef3c7] transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        {t("reclamations.reopen_btn")}
                      </button>
                    )}
                  </div>
                </div>

                {/* Actions principales */}
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <button
                    onClick={() => handleOpenEditModal(selectedReclamation)}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 bg-white border border-[#006f94]/30 rounded-xl text-xs font-bold text-[#006f94] hover:bg-[#006f94]/5 transition-all"
                  >
                    <Edit className="w-3.5 h-3.5" /> {t("common.edit")}
                  </button>
                  <button
                    onClick={() => deleteRec(selectedReclamation.id)}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 bg-white border border-[#e03131]/30 rounded-xl text-xs font-bold text-[#e03131] hover:bg-[#e03131]/5 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> {t("common.delete")}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════
          MODAL
      ═══════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          selectedReclamation
            ? `${t("reclamations.edit")} #${selectedReclamation.id}`
            : t("reclamations.new")
        }
        size="lg"
      >
        <form onSubmit={handleSave}>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Input
                label={t("reclamations.article_code")}
                value={newRec.codeBarre}
                onChange={(e) =>
                  setNewRec({ ...newRec, codeBarre: e.target.value.toUpperCase() })
                }
                placeholder="ex: L97AA77D8"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                {t("reclamations.article_code_hint")}
              </p>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-2">
                {t("reclamations.problem_type")}
              </label>
              <select
                value={newRec.type}
                onChange={(e) => setNewRec({ ...newRec, type: e.target.value })}
                className="w-full h-10 px-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                required
              >
                <option value="TROU">{t("reclamations.types.TROU")}</option>
                <option value="TACHE_PERSISTANTE">{t("reclamations.types.TACHE_PERSISTANTE")}</option>
                <option value="DECHIRE">{t("reclamations.types.DECHIRE")}</option>
                <option value="COUTURE_ABIMEE">{t("reclamations.types.COUTURE_ABIMEE")}</option>
                <option value="BOUTON_MANQUANT">{t("reclamations.types.BOUTON_MANQUANT")}</option>
                <option value="A_REFORMER">{t("reclamations.types.A_REFORMER")}</option>
                <option value="MAL_LAVE">{t("reclamations.types.MAL_LAVE")}</option>
                <option value="AUTRE">{t("reclamations.types.AUTRE")}</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-2">
                {t("reclamations.problem_description")}
              </label>
              <textarea
                value={newRec.description}
                onChange={(e) => setNewRec({ ...newRec, description: e.target.value })}
                placeholder={t("reclamations.problem_description_placeholder")}
                className="w-full min-h-[100px] px-3 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              type="button"
              disabled={isSaving}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving
                ? t("common.loading")
                : selectedReclamation
                ? t("common.save")
                : t("common.create")}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}