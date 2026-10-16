// src/components/sacs/SacInfecteList.jsx
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Package,
  X,
  Eye,
  RefreshCw,
  Printer,
  Tag,
  Filter,
  Biohazard,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  Building2,
} from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Modal } from "../../components/ui/modal";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import BarcodeLabel from "../../components/BarcodeLabel";
import { PageHeaderIcon } from "../../components/layout/PageHeaderIcon";
import { SortableHeader } from "../../components/ui/SortableHeader";
import { useSortableData } from "../../hooks/useSortableData";
import { DetailModal, FormModal, FormSection } from "../../components/ui/modal-kit";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

// ═══════════════════════════════════════════════════════════════════════════
// 🔧 Helper : prépare l'objet pour BarcodeLabel avec numeroSac comme code
// ═══════════════════════════════════════════════════════════════════════════
const prepareSacForBarcode = (sac) => {
  if (!sac) return null;
  return {
    ...sac,
    code: sac.numeroSac,        // ✅ le code-barre utilisera numeroSac
    numeroSac: sac.numeroSac,
  };
};

export default function SacInfecteList() {
  const { t } = useTranslation();

  const [sacs, setSacs] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSac, setSelectedSac] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSacId, setSelectedSacId] = useState(null);
  const [sacItems, setSacItems] = useState([]);
  const [isItemsLoading, setIsItemsLoading] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedItemDetail, setSelectedItemDetail] = useState(null);
  const [sacItemsCount, setSacItemsCount] = useState({});
  const [filterEtat, setFilterEtat] = useState("ALL");

  const [newRec, setNewRec] = useState({
    numeroSac: "",
    etat: "DECLARE",
    collecteId: "",
    agentCollecteNom: "",
    agentCollecteMatricule: "",
    serviceNom: "",
    chambre: "",
    quantiteDeclaree: "",
    observations: "",
    items: [],
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 📥 Chargement des sacs
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchSacs();
  }, []);

  const fetchSacs = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/sacs-infectes`);
      if (response.ok) {
        const data = await response.json();
        setSacs(data);
        const counts = {};
        data.forEach((sac) => {
          counts[sac.id] = sac.items?.length || 0;
        });
        setSacItemsCount(counts);
      }
    } catch (err) {
      console.error("Erreur réseau:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // 📥 Chargement du détail d'un sac
  // ─────────────────────────────────────────────────────────────────────────
  const fetchSacDetail = async (sac) => {
    setIsItemsLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/api/sacs-infectes/detail?numeroSac=${encodeURIComponent(sac.numeroSac)}`
      );
      if (response.ok) {
        const data = await response.json();
        setSelectedSac(data);
        const items = (data.items || []).map((item, index) => ({
          id: `sac-item-${data.id}-${index}`,
          categorie: item.categorie,
          quantiteDeclaree: item.quantiteDeclaree,
          quantiteComptee: item.quantiteComptee,
          ecart: item.ecart,
          etat: data.etat,
          numeroSac: data.numeroSac,
          agentCollecteNom: data.agentCollecteNom,
          dateCollecte: data.dateCollecte,
        }));
        setSacItems(items);
        setSacItemsCount((prev) => ({ ...prev, [sac.id]: items.length }));
        return items;
      }
      setSacItems([]);
      return [];
    } catch (err) {
      console.error("Erreur chargement détail:", err);
      setSacItems([]);
      return [];
    } finally {
      setIsItemsLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // 🎯 Ouverture / fermeture du panneau
  // ─────────────────────────────────────────────────────────────────────────
  const handleOpenPanel = async (sac) => {
    if (selectedSacId === sac.id && panelOpen) {
      setPanelOpen(false);
      setTimeout(() => {
        setSelectedSacId(null);
        setSacItems([]);
        setSelectedId(null);
      }, 300);
      return;
    }
    setSelectedSacId(sac.id);
    setSelectedSac(sac);
    setSelectedId(null);
    await fetchSacDetail(sac);
    setPanelOpen(true);
  };

  const handleClosePanel = () => {
    setPanelOpen(false);
    setTimeout(() => {
      setSelectedSacId(null);
      setSacItems([]);
      setSelectedId(null);
    }, 300);
  };

  const handleRowClick = (id) => {
    setSelectedId((prev) => (prev === id ? null : id));
  };

  // ─────────────────────────────────────────────────────────────────────────
  // 🖨️ Impression de l'étiquette du sac (code-barre du numeroSac)
  // ─────────────────────────────────────────────────────────────────────────
  const handlePrintBarcode = () => {
    if (!selectedSac) {
      Swal.fire({
        title: t("sac_infecte.no_selection"),
        text: t("sac_infecte.no_selection_text"),
        icon: "warning",
      });
      return;
    }
    // ✅ Cherche le BarcodeLabel associé au numéro de sac sélectionné
    const wrapper = document.querySelector(
      `[data-barcode-sac="${selectedSac.numeroSac}"]`
    );
    if (wrapper) {
      // ✅ Le BarcodeLabel rend un bouton cliquable → on le déclenche
      const clickable = wrapper.querySelector("button, a, [role='button']") || wrapper;
      clickable.click();
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // 🏷️ Badges
  // ─────────────────────────────────────────────────────────────────────────
  const getEtatSacBadge = (etat) => {
    if (!etat) return <Badge variant="secondary">{t("sac_infecte.etat.Non défini")}</Badge>;
    const variants = {
      DECLARE: { variant: "warning", label: t("sac_infecte.etat.DECLARE") },
      EN_ATTENTE_RECEPTION: { variant: "warning", label: t("sac_infecte.etat.EN_ATTENTE_RECEPTION") },
      RECEPTIONNE: { variant: "info", label: t("sac_infecte.etat.RECEPTIONNE") },
      EN_LAVAGE: { variant: "info", label: t("sac_infecte.etat.EN_LAVAGE") },
      LAVE: { variant: "success", label: t("sac_infecte.etat.LAVE") },
      VERIFIE: { variant: "success", label: t("sac_infecte.etat.VERIFIE") },
      CONCORDE: { variant: "success", label: t("sac_infecte.etat.CONCORDE") },
      NON_CONCORDE: { variant: "danger", label: t("sac_infecte.etat.NON_CONCORDE") },
      DETRUIT: { variant: "secondary", label: t("sac_infecte.etat.DETRUIT") },
    };
    const config = variants[etat] || { variant: "secondary", label: etat };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getConcordanceBadge = (concordance, ecart) => {
    if (concordance === true) {
      return (
        <Badge variant="success">
          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <CheckCircle className="w-3 h-3" />
            {t("sac_infecte.concordance.conforme")}
          </span>
        </Badge>
      );
    }
    if (ecart !== null && ecart !== undefined && ecart !== 0) {
      return (
        <Badge variant="danger">
          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <AlertTriangle className="w-3 h-3" />
            {t("sac_infecte.concordance.ecart")}: {ecart}
          </span>
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
          <Clock className="w-3 h-3" />
          {t("sac_infecte.concordance.en_attente")}
        </span>
      </Badge>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // 💾 Sauvegarde
  // ─────────────────────────────────────────────────────────────────────────
  const handleOpenCreateModal = () => {
    setSelectedSac(null);
    setNewRec({
      numeroSac: "",
      etat: "DECLARE",
      collecteId: "",
      agentCollecteNom: "",
      agentCollecteMatricule: "",
      serviceNom: "",
      chambre: "",
      quantiteDeclaree: "",
      observations: "",
      items: [],
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (rec) => {
    if (!rec) return;
    setSelectedSac(rec);
    setNewRec({
      numeroSac: rec.numeroSac || "",
      etat: rec.etat || "DECLARE",
      collecteId: rec.collecteId || "",
      agentCollecteNom: rec.agentCollecteNom || "",
      agentCollecteMatricule: rec.agentCollecteMatricule || "",
      serviceNom: rec.serviceNom || "",
      chambre: rec.chambre || "",
      quantiteDeclaree: rec.quantiteDeclaree || "",
      observations: rec.observations || "",
      items: rec.items || [],
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!newRec.numeroSac || newRec.numeroSac.trim() === "") {
      Swal.fire({
        title: t("sac_infecte.numero_required"),
        text: t("sac_infecte.numero_required_text"),
        icon: "warning",
      });
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        numeroSac: newRec.numeroSac.trim(),
        etat: newRec.etat || "DECLARE",
        collecteId: newRec.collecteId ? parseInt(newRec.collecteId) : null,
        agentCollecteNom: newRec.agentCollecteNom || null,
        agentCollecteMatricule: newRec.agentCollecteMatricule || null,
        serviceNom: newRec.serviceNom || null,
        chambre: newRec.chambre || null,
        quantiteDeclaree: parseInt(newRec.quantiteDeclaree) || 0,
        observations: newRec.observations || null,
        items: newRec.items || [],
      };

      const url = selectedSac
        ? `${API_URL}/api/sacs-infectes/${selectedSac.id}`
        : `${API_URL}/api/sacs-infectes`;
      const method = selectedSac ? "PUT" : "POST";

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

      if (selectedSac) {
        setSacs((prev) => prev.map((r) => (r.id === data.id ? data : r)));
        Swal.fire({
          title: "✅",
          text: t("sac_infecte.update_success"),
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        setSacs((prev) => [data, ...prev]);
        Swal.fire({
          title: "✅",
          text: t("sac_infecte.create_success"),
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
      }

      setIsModalOpen(false);
      fetchSacs();
    } catch (err) {
      console.error("❌ Erreur:", err);
      Swal.fire({
        title: "❌",
        text: err.message || t("sac_infecte.error_text"),
        icon: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // 🗑️ Suppression
  // ─────────────────────────────────────────────────────────────────────────
  const deleteRec = async (id) => {
    const result = await Swal.fire({
      title: t("sac_infecte.delete_confirm"),
      text: t("sac_infecte.delete_confirm_text"),
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: t("sac_infecte.delete_confirm_yes"),
      cancelButtonText: t("sac_infecte.delete_confirm_no"),
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`${API_URL}/api/sacs-infectes/${id}`, {
          method: "DELETE",
        });
        if (response.ok) {
          setSacs((prev) => prev.filter((r) => r.id !== id));
          setSacItemsCount((prev) => {
            const newCount = { ...prev };
            delete newCount[id];
            return newCount;
          });
          if (selectedSacId === id) {
            handleClosePanel();
          }
          Swal.fire({
            title: "✅",
            text: t("sac_infecte.delete_success"),
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
          text: t("sac_infecte.error_text"),
          icon: "error",
        });
      }
    }
  };

  const handleDetailItem = (item) => {
    setSelectedItemDetail(item);
    setShowDetailModal(true);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // 🔍 Filtrage
  // ─────────────────────────────────────────────────────────────────────────
  const filteredSacs = sacs.filter((r) => {
    if (filterEtat !== "ALL" && r.etat !== filterEtat) return false;
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      r.numeroSac?.toLowerCase().includes(term) ||
      r.agentCollecteNom?.toLowerCase().includes(term) ||
      r.serviceNom?.toLowerCase().includes(term) ||
      r.chambre?.toLowerCase().includes(term)
    );
  });

  // Tri par colonne (clic sur l'en-tête : croissant → décroissant → aucun)
  const { sortedItems: sortedSacs, requestSort, directionFor } = useSortableData(filteredSacs);

  // ─────────────────────────────────────────────────────────────────────────
  // 🎨 RENDU
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="relative flex h-full gap-4">
      {/* ═══════════════════════════════════════════════════════════════════
          COLONNE GAUCHE - LISTE DES SACS
      ═══════════════════════════════════════════════════════════════════ */}
      <motion.div
        className="transition-all duration-500 ease-in-out"
        animate={{
          width: panelOpen ? "calc(100% - 500px)" : "100%",
          transition: { duration: 0.4, ease: "easeInOut" },
        }}
        style={{ minWidth: 0 }}
      >
        <div className="space-y-4">
          {/* Header */}
          <div style={{ marginBottom: "32px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "8px" }}>
              <PageHeaderIcon size={52} />
              <div>
                <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                  {t("sac_infecte.title")}
                </h1>
                <p style={{ fontSize: "14px", color: "#64748b", margin: "2px 0 0 0" }}>
                  {t("sac_infecte.subtitle")}
                </p>
              </div>
            </div>
          </div>

          {/* Barre d'outils */}
          <div className="flex flex-wrap items-center gap-3 bg-white/65 backdrop-blur-md p-4 rounded-[20px] border border-slate-200/50 shadow-[0_4px_20px_rgba(0,0,0,0.02)] mb-6">
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#dc2626]/30 rounded-[14px] text-sm font-bold text-[#dc2626] hover:bg-[#dc2626]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" /> {t("sac_infecte.new")}
            </button>

            <div style={{ width: "1px", height: "30px", background: "#e2e8f0", margin: "0 8px" }} />

            {/* ✅ BarcodeLabel du sac sélectionné (avec code = numeroSac) */}
            {selectedSac && (
              <div
                data-barcode-sac={selectedSac.numeroSac}
                style={{ display: "inline-flex" }}
              >
                <BarcodeLabel
                  item={prepareSacForBarcode(selectedSac)}
                  type="sac"
                />
              </div>
            )}

            {/* ✅ Bouton imprimer qui déclenche le BarcodeLabel */}
            <button
              disabled={!selectedSacId}
              onClick={handlePrintBarcode}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#8b5cf6]/30 rounded-[14px] text-sm font-bold text-[#8b5cf6] hover:bg-[#8b5cf6]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
            >
              <Printer className="w-4 h-4 stroke-[2.5]" /> {t("sac_infecte.print_label")}
            </button>

            <div style={{ width: "1px", height: "30px", background: "#e2e8f0", margin: "0 8px" }} />

            <button
              disabled={!selectedId}
              onClick={() => {
                if (selectedId) {
                  const item = sacItems.find((l) => l.id === selectedId);
                  if (item) handleDetailItem(item);
                }
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#006f94]/30 rounded-[14px] text-sm font-bold text-[#006f94] hover:bg-[#006f94]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
            >
              <Eye className="w-4 h-4 stroke-[2.5]" /> {t("sac_infecte.details_item")}
            </button>

            <button
              disabled={!selectedSacId}
              onClick={() => handleOpenEditModal(selectedSac)}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#006f94]/30 rounded-[14px] text-sm font-bold text-[#006f94] hover:bg-[#006f94]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
            >
              <Edit className="w-4 h-4 stroke-[2.5]" /> {t("common.edit")}
            </button>

            <button
              disabled={!selectedSacId}
              onClick={async () => {
                if (selectedSacId) {
                  const confirmed = await Swal.fire({
                    title: t("sac_infecte.delete_confirm"),
                    text: t("sac_infecte.delete_confirm_text"),
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonColor: "#d33",
                    cancelButtonColor: "#3085d6",
                    confirmButtonText: t("sac_infecte.delete_confirm_yes"),
                    cancelButtonText: t("sac_infecte.delete_confirm_no"),
                  });
                  if (confirmed.isConfirmed) {
                    deleteRec(selectedSacId);
                  }
                }
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#e03131]/30 rounded-[14px] text-sm font-bold text-[#e03131] hover:bg-[#e03131]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
            >
              <Trash2 className="w-4 h-4 stroke-[2.5]" /> {t("common.delete")}
            </button>

            <button
              onClick={fetchSacs}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-300 rounded-[14px] text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} /> {t("sac_infecte.refresh")}
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
                    placeholder={t("sac_infecte.search_placeholder")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full h-10 pl-10 pr-4 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <select
                    value={filterEtat}
                    onChange={(e) => setFilterEtat(e.target.value)}
                    className="h-10 pl-9 pr-8 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                  >
                    <option value="ALL">{t("sac_infecte.filter.all")}</option>
                    <option value="DECLARE">{t("sac_infecte.etat.DECLARE")}</option>
                    <option value="RECEPTIONNE">{t("sac_infecte.etat.RECEPTIONNE")}</option>
                    <option value="EN_LAVAGE">{t("sac_infecte.etat.EN_LAVAGE")}</option>
                    <option value="LAVE">{t("sac_infecte.etat.LAVE")}</option>
                    <option value="VERIFIE">{t("sac_infecte.etat.VERIFIE")}</option>
                    <option value="CONCORDE">{t("sac_infecte.etat.CONCORDE")}</option>
                    <option value="NON_CONCORDE">{t("sac_infecte.etat.NON_CONCORDE")}</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tableau */}
          <Card>
            <CardContent className="p-0">
              <div className="premium-table-wrap">
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th style={{ width: 56 }} />
                      <SortableHeader direction={directionFor("numeroSac")} onSort={() => requestSort("numeroSac")} align="center">
{t("sac_infecte.numero_sac")}
</SortableHeader>
                      <SortableHeader direction={directionFor("dateCollecte")} onSort={() => requestSort("dateCollecte")} align="center">
{t("sac_infecte.date_collecte")}
</SortableHeader>
                      <SortableHeader direction={directionFor("agentCollecteNom")} onSort={() => requestSort("agentCollecteNom")} align="center">
{t("sac_infecte.agent")}
</SortableHeader>
                      <SortableHeader direction={directionFor("quantiteDeclaree")} onSort={() => requestSort("quantiteDeclaree")} align="center">
{t("sac_infecte.quantite")}
</SortableHeader>
                      <SortableHeader direction={directionFor("etat")} onSort={() => requestSort("etat")} align="center">
{t("sac_infecte.etat_label")}
</SortableHeader>
                      <th style={{ textAlign: "center" }}>{t("common.actions")}</th>
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
                    ) : sortedSacs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-muted-foreground">
                          {searchTerm || filterEtat !== "ALL"
                            ? t("sac_infecte.no_match")
                            : t("sac_infecte.no_data")}
                        </td>
                      </tr>
                    ) : (
                      sortedSacs.map((sac) => (
                        <tr
                          key={sac.id}
                          className={`border-b border-border hover:bg-accent/50 transition-colors ${selectedSacId === sac.id ? "bg-red-50" : ""}`}
                        >
                          <td className="text-center py-3 px-4">
                            <button
                              onClick={() => handleOpenPanel(sac)}
                              className="p-1 hover:bg-red-100 rounded-lg transition-colors"
                              title={panelOpen && selectedSacId === sac.id ? "Fermer" : "Voir le contenu"}
                            >
                              {panelOpen && selectedSacId === sac.id ? (
                                <ChevronLeft className="w-5 h-5 text-red-500" />
                              ) : (
                                <ChevronRight className="w-5 h-5 text-slate-400 hover:text-red-500" />
                              )}
                            </button>
                          </td>
                          <td className="text-center py-3 px-4">
                            <div className="font-medium font-mono">{sac.numeroSac || "N/A"}</div>
                            <div className="text-xs text-muted-foreground">
                              ID #{sac.id} · {sac.collecteId ? `Collecte #${sac.collecteId}` : "Sans collecte"}
                            </div>
                          </td>
                          <td className="text-center py-3 px-4 text-sm">
                            {sac.dateCollecte ? new Date(sac.dateCollecte).toLocaleDateString("fr-FR") : "N/A"}
                            {sac.dateCollecte && (
                              <div className="text-xs text-muted-foreground">
                                {new Date(sac.dateCollecte).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                              </div>
                            )}
                          </td>
                          <td className="text-center py-3 px-4">
                            <div className="flex items-center justify-center gap-2">
                              <User className="w-4 h-4 text-slate-400" />
                              <span className="text-sm font-medium">
                                {sac.agentCollecteNom || <span className="text-slate-400 italic">{t("sac_infecte.non_renseigne")}</span>}
                              </span>
                            </div>
                            {sac.serviceNom && (
                              <div className="text-xs text-muted-foreground mt-1">
                                <Building2 className="w-3 h-3 inline mr-1" />
                                {sac.serviceNom}
                              </div>
                            )}
                          </td>
                          <td className="text-center py-3 px-4">
                            <div className="flex flex-col items-center gap-1">
                              <div className="flex items-center gap-1">
                                <Package className="w-4 h-4 text-slate-400" />
                                <span className="font-bold text-lg">{sac.quantiteDeclaree || 0}</span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {sacItemsCount[sac.id] !== undefined ? sacItemsCount[sac.id] : "..."} {t("sac_infecte.items_count")}
                              </div>
                            </div>
                          </td>
                          <td className="text-center py-3 px-4">
                            <div className="flex flex-col items-center gap-1">
                              {getEtatSacBadge(sac.etat)}
                              {sac.ecart !== null && sac.ecart !== undefined && (
                                <div className="mt-1">{getConcordanceBadge(sac.concordance, sac.ecart)}</div>
                              )}
                            </div>
                          </td>
                          <td className="text-center py-3 px-4">
                            <div className="flex items-center justify-center gap-2">
                              {/* ✅ BarcodeLabel pour chaque ligne, avec code = numeroSac */}
                              <div
                                data-barcode-sac={sac.numeroSac}
                                style={{ display: "inline-flex" }}
                              >
                                <BarcodeLabel
                                  item={prepareSacForBarcode(sac)}
                                  type="sac"
                                />
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEditModal(sac);
                                }}
                                className="p-2 hover:bg-accent rounded-lg transition-colors"
                                title={t("common.edit")}
                              >
                                <Edit className="w-4 h-4 text-[#006f94]" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteRec(sac.id);
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

      {/* ═══════════════════════════════════════════════════════════════════
          PANNEAU LATÉRAL - DÉTAIL DU SAC
      ═══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence mode="wait">
        {panelOpen && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{
              opacity: 1,
              x: 0,
              transition: { type: "spring", stiffness: 300, damping: 30 },
            }}
            exit={{
              opacity: 0,
              x: 100,
              transition: { duration: 0.3, ease: "easeInOut" },
            }}
            style={{
              width: "480px",
              minWidth: "480px",
              maxWidth: "480px",
              height: "calc(100vh - 120px)",
              position: "sticky",
              top: "80px",
              flexShrink: 0,
              background: "white",
              borderRadius: "16px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 20px 60px rgba(15, 23, 42, 0.15)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* ─── Header du panneau ─── */}
            <div
              style={{
                flexShrink: 0,
                padding: "16px",
                borderBottom: "1px solid #e2e8f0",
                background: "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)",
              }}
            >
              {/* Ligne 1 : icône + titre + close */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "12px",
                    background: "linear-gradient(135deg, #dc2626, #991b1b)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    flexShrink: 0,
                    boxShadow: "0 4px 12px rgba(220, 38, 38, 0.3)",
                  }}
                >
                  <Biohazard className="w-5 h-5" />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: "15px",
                      color: "#0f172a",
                      fontFamily: "'Courier New', monospace",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {selectedSac?.numeroSac || "Sac"}
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#64748b",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      marginTop: "2px",
                    }}
                  >
                    {selectedSac?.serviceNom || t("sac_infecte.service")}
                    {selectedSac?.chambre && ` · ${t("sac_infecte.chambre")} ${selectedSac.chambre}`}
                  </div>
                </div>

                <div
                  data-barcode-sac={selectedSac?.numeroSac}
                  style={{ display: "inline-flex" }}
                >
                  <BarcodeLabel
                    item={prepareSacForBarcode(selectedSac)}
                    type="sac"
                  />
                </div>

                <button
                  onClick={handleClosePanel}
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    border: "1px solid #fecaca",
                    background: "white",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#64748b",
                    flexShrink: 0,
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#fef2f2")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Ligne 2 : stats (3 colonnes égales) */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                <div
                  style={{
                    background: "white",
                    borderRadius: "10px",
                    padding: "8px 4px",
                    textAlign: "center",
                    border: "1px solid #fecaca",
                  }}
                >
                  <div
                    style={{
                      fontSize: "9px",
                      color: "#64748b",
                      textTransform: "uppercase",
                      fontWeight: 700,
                      letterSpacing: "0.4px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {t("sac_infecte.quantite_declaree")}
                  </div>
                  <div
                    style={{
                      fontSize: "20px",
                      fontWeight: 800,
                      color: "#dc2626",
                      lineHeight: 1.1,
                      marginTop: "2px",
                    }}
                  >
                    {selectedSac?.quantiteDeclaree ?? 0}
                  </div>
                </div>

                <div
                  style={{
                    background: "white",
                    borderRadius: "10px",
                    padding: "8px 4px",
                    textAlign: "center",
                    border: "1px solid #bfdbfe",
                  }}
                >
                  <div
                    style={{
                      fontSize: "9px",
                      color: "#64748b",
                      textTransform: "uppercase",
                      fontWeight: 700,
                      letterSpacing: "0.4px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {t("sac_infecte.quantite_comptee")}
                  </div>
                  <div
                    style={{
                      fontSize: "20px",
                      fontWeight: 800,
                      color: "#2563eb",
                      lineHeight: 1.1,
                      marginTop: "2px",
                    }}
                  >
                    {selectedSac?.quantiteCompteePostLavage ?? "—"}
                  </div>
                </div>

                <div
                  style={{
                    background: "white",
                    borderRadius: "10px",
                    padding: "8px 4px",
                    textAlign: "center",
                    border: `1px solid ${selectedSac?.ecart > 0 ? "#fecaca" : selectedSac?.ecart < 0 ? "#fde68a" : "#a7f3d0"}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: "9px",
                      color: "#64748b",
                      textTransform: "uppercase",
                      fontWeight: 700,
                      letterSpacing: "0.4px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {t("sac_infecte.ecart")}
                  </div>
                  <div
                    style={{
                      fontSize: "20px",
                      fontWeight: 800,
                      color: selectedSac?.ecart > 0 ? "#dc2626" : selectedSac?.ecart < 0 ? "#f59e0b" : "#059669",
                      lineHeight: 1.1,
                      marginTop: "2px",
                    }}
                  >
                    {selectedSac?.ecart ?? "—"}
                  </div>
                </div>
              </div>

              {/* Bouton imprimer étiquette */}
              <button
                onClick={handlePrintBarcode}
                style={{
                  marginTop: "12px",
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "none",
                  background: "linear-gradient(135deg, #dc2626, #991b1b)",
                  color: "white",
                  fontWeight: 700,
                  fontSize: "12px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  boxShadow: "0 4px 12px rgba(220, 38, 38, 0.3)",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 6px 16px rgba(220, 38, 38, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(220, 38, 38, 0.3)";
                }}
              >
                <Printer className="w-4 h-4" />
                {t("sac_infecte.print_label")}
              </button>
            </div>

            {/* ─── Liste des items (scroll vertical uniquement) ─── */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                overflowX: "hidden",
                padding: "12px",
                minHeight: 0,
                background: "#f8fafc",
              }}
            >
              {isItemsLoading ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "120px" }}>
                  <RefreshCw className="animate-spin w-6 h-6 text-red-500" />
                </div>
              ) : sacItems.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 16px", color: "#94a3b8" }}>
                  <Package className="w-12 h-12 mx-auto opacity-30 mb-3" />
                  <p style={{ fontSize: "13px", fontWeight: 600, margin: 0 }}>
                    {t("sac_infecte.no_items")}
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {sacItems.map((item, index) => (
                    <motion.div
                      key={item.id || index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04, duration: 0.25 }}
                      onClick={() => handleRowClick(item.id)}
                      style={{
                        padding: "12px",
                        borderRadius: "12px",
                        border: `1.5px solid ${selectedId === item.id ? "#fca5a5" : "#e2e8f0"}`,
                        background: selectedId === item.id ? "#fef2f2" : "white",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        boxShadow: selectedId === item.id ? "0 2px 8px rgba(220, 38, 38, 0.12)" : "0 1px 2px rgba(15, 23, 42, 0.04)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div
                          style={{
                            width: "34px",
                            height: "34px",
                            borderRadius: "9px",
                            background: selectedId === item.id ? "#fecaca" : "#fee2e2",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <Tag className={`w-4 h-4 ${selectedId === item.id ? "text-red-700" : "text-red-600"}`} />
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontWeight: 700,
                              fontSize: "12.5px",
                              color: "#0f172a",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              marginBottom: "3px",
                            }}
                          >
                            {item.categorie || "Non catégorisé"}
                          </div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              fontSize: "11px",
                              color: "#64748b",
                            }}
                          >
                            <span
                              style={{
                                background: "#fef2f2",
                                color: "#dc2626",
                                padding: "2px 7px",
                                borderRadius: "6px",
                                fontWeight: 700,
                              }}
                            >
                              D: {item.quantiteDeclaree ?? "—"}
                            </span>
                            {item.quantiteComptee !== null && item.quantiteComptee !== undefined && (
                              <span
                                style={{
                                  background: "#eff6ff",
                                  color: "#2563eb",
                                  padding: "2px 7px",
                                  borderRadius: "6px",
                                  fontWeight: 700,
                                }}
                              >
                                C: {item.quantiteComptee}
                              </span>
                            )}
                            {item.ecart !== null && item.ecart !== undefined && (
                              <span
                                style={{
                                  background: item.ecart === 0 ? "#ecfdf5" : item.ecart > 0 ? "#fef2f2" : "#fffbeb",
                                  color: item.ecart === 0 ? "#059669" : item.ecart > 0 ? "#dc2626" : "#d97706",
                                  padding: "2px 7px",
                                  borderRadius: "6px",
                                  fontWeight: 700,
                                }}
                              >
                                É: {item.ecart}
                              </span>
                            )}
                          </div>
                        </div>

                        <div style={{ flexShrink: 0 }}>
                          {getConcordanceBadge(item.ecart === 0 || item.ecart === null, item.ecart)}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════════
          MODAL DÉTAIL ITEM
      ═══════════════════════════════════════════════════════════════════ */}
      <DetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={t("sac_infecte.details_item")}
        subtitle={selectedItemDetail?.numeroSac ? `${t("sac_infecte.numero_sac")} · ${selectedItemDetail.numeroSac}` : undefined}
        heading={selectedItemDetail?.categorie}
        badges={selectedItemDetail && getEtatSacBadge(selectedItemDetail.etat)}
        metrics={selectedItemDetail ? [
          { label: t("sac_infecte.quantite_declaree"), value: selectedItemDetail.quantiteDeclaree ?? 0 },
          { label: t("sac_infecte.quantite_comptee"), value: selectedItemDetail.quantiteComptee },
          { label: t("sac_infecte.ecart"), value: selectedItemDetail.ecart },
        ] : []}
        sections={selectedItemDetail ? [
          { title: t('modal.identification', 'Identification'), icon: "id", items: [
            { label: t("sac_infecte.numero_sac"), value: selectedItemDetail.numeroSac, mono: true },
            { label: t("sac_infecte.categorie"), value: selectedItemDetail.categorie },
          ] },
          { title: t('modal.collection', 'Collecte'), icon: "people", items: [
            { label: t("sac_infecte.agent"), value: selectedItemDetail.agentCollecteNom },
            { label: t("sac_infecte.date_collecte"), value: selectedItemDetail.dateCollecte ? new Date(selectedItemDetail.dateCollecte).toLocaleString("fr-FR") : null },
          ] },
        ] : []}
      />

      {/* ═══════════════════════════════════════════════════════════════════
          MODAL CRÉATION / MODIFICATION
      ═══════════════════════════════════════════════════════════════════ */}
      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedSac ? `${t("sac_infecte.edit")} #${selectedSac.id}` : t("sac_infecte.new")}
        mode={selectedSac ? "edit" : "create"}
        size={"lg"}
        onSubmit={handleSave}
        saving={isSaving}
      >
        
          <FormSection title={t('modal.general_info', 'Informations générales')} icon="specs" columns={2}>
            <div className="col-span-2">
              <Input
                label={`${t("sac_infecte.numero_sac")} *`}
                value={newRec.numeroSac}
                onChange={(e) => setNewRec({ ...newRec, numeroSac: e.target.value.toUpperCase() })}
                placeholder="ex: SAC-INF-XXXXXX"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t("sac_infecte.etat_label")}</label>
              <select
                value={newRec.etat}
                onChange={(e) => setNewRec({ ...newRec, etat: e.target.value })}
                className="w-full h-10 px-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="DECLARE">{t("sac_infecte.etat.DECLARE")}</option>
                <option value="RECEPTIONNE">{t("sac_infecte.etat.RECEPTIONNE")}</option>
                <option value="EN_LAVAGE">{t("sac_infecte.etat.EN_LAVAGE")}</option>
                <option value="LAVE">{t("sac_infecte.etat.LAVE")}</option>
                <option value="VERIFIE">{t("sac_infecte.etat.VERIFIE")}</option>
                <option value="CONCORDE">{t("sac_infecte.etat.CONCORDE")}</option>
                <option value="NON_CONCORDE">{t("sac_infecte.etat.NON_CONCORDE")}</option>
                <option value="DETRUIT">{t("sac_infecte.etat.DETRUIT")}</option>
              </select>
            </div>

            <div>
              <Input
                type="number"
                label={t("sac_infecte.collecte_id")}
                value={newRec.collecteId}
                onChange={(e) => setNewRec({ ...newRec, collecteId: e.target.value })}
                placeholder="ex: 20"
              />
            </div>

            <div>
              <Input
                label={t("sac_infecte.agent_nom")}
                value={newRec.agentCollecteNom}
                onChange={(e) => setNewRec({ ...newRec, agentCollecteNom: e.target.value })}
                placeholder="Nom de l'agent"
              />
            </div>

            <div>
              <Input
                label={t("sac_infecte.agent_matricule")}
                value={newRec.agentCollecteMatricule}
                onChange={(e) => setNewRec({ ...newRec, agentCollecteMatricule: e.target.value })}
                placeholder="Matricule"
              />
            </div>

            <div>
              <Input
                label={t("sac_infecte.service")}
                value={newRec.serviceNom}
                onChange={(e) => setNewRec({ ...newRec, serviceNom: e.target.value })}
                placeholder="ex: Urgences"
              />
            </div>

            <div>
              <Input
                label={t("sac_infecte.chambre")}
                value={newRec.chambre}
                onChange={(e) => setNewRec({ ...newRec, chambre: e.target.value })}
                placeholder="ex: 204"
              />
            </div>

            <div>
              <Input
                type="number"
                label={t("sac_infecte.quantite_declaree")}
                value={newRec.quantiteDeclaree}
                onChange={(e) => setNewRec({ ...newRec, quantiteDeclaree: e.target.value })}
                placeholder="0"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium mb-2">{t("sac_infecte.observations")}</label>
              <textarea
                value={newRec.observations}
                onChange={(e) => setNewRec({ ...newRec, observations: e.target.value })}
                placeholder={t("sac_infecte.observations")}
                className="w-full min-h-[60px] px-3 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </FormSection>


      </FormModal>
    </div>
  );
}