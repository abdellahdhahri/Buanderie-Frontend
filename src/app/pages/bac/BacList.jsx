// src/components/bacs/BacList.jsx
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
  Weight,
  Calendar,
  X,
  Eye,
  Barcode,
  History,
  RefreshCw,
  Printer,
  Tag,
  Filter
} from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Modal } from "../../components/ui/modal";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import BarcodeLabel from "../../components/BarcodeLabel";
import { useBac } from "../../contextes/BacContext";
import { PageHeaderIcon } from "../../components/layout/PageHeaderIcon";
import { SortableHeader } from "../../components/ui/SortableHeader";
import { useSortableData } from "../../hooks/useSortableData";
import { DetailModal, FormModal, FormSection } from "../../components/ui/modal-kit";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

export default function BacList() {
  const { t } = useTranslation();

  
  const {
    bacs,
    loading: isBacsLoading,
    fetchBacs,
    addBac,
    updateBac,
    deleteBac,
    getBacById,
  } = useBac();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBac, setSelectedBac] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBacId, setSelectedBacId] = useState(null);
  const [bacLinges, setBacLinges] = useState([]);
  const [isLingesLoading, setIsLingesLoading] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedLingeDetail, setSelectedLingeDetail] = useState(null);
  const [bacLingesCount, setBacLingesCount] = useState({});

  const [newRec, setNewRec] = useState({
    reference: "",
    etat: "EN_RECEPTION",
    poids: "",
    capacite_max: "",
    nombreLinges: 0,
    typeCollecte: "BLANC",
    typebac: "BLANC",
    observation: ""
  });

  useEffect(() => {
  
    if (bacs && bacs.length > 0) {
      fetchAllBacLingesCount(bacs);
    }
  }, [bacs]);

  const fetchAllBacLingesCount = async (bacsData) => {
    const counts = {};
    for (const bac of bacsData) {
      try {
        const response = await fetch(`${API_URL}/api/bacs/bacs/${bac.id}/linges`);
        if (response.ok) {
          const data = await response.json();
          const linges = Array.isArray(data) ? data : data.content || [];
          counts[bac.id] = linges.length;
        } else {
          counts[bac.id] = 0;
        }
      } catch (err) {
        console.error(`Erreur chargement count pour bac ${bac.id}:`, err);
        counts[bac.id] = 0;
      }
    }
    setBacLingesCount(counts);
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    await fetchBacs();
    setIsLoading(false);
  };

  const fetchBacLinges = async (bac) => {
    setIsLingesLoading(true);
    try {
      const isSacInfecte = bac.numeroSac?.toUpperCase().startsWith("SAC")
        || bac.code?.toUpperCase().startsWith("SAC")
        || bac.typebac === "INFECTE";

      if (isSacInfecte) {
        const numeroSac = bac.numeroSac || bac.code;
        const response = await fetch(
          `${API_URL}/api/sacs-infectes/detail?numeroSac=${encodeURIComponent(numeroSac)}`
        );

        if (response.ok) {
          const data = await response.json();
          const items = (data.items || []).map((item, index) => ({
            id: `sac-item-${data.id}-${index}`,
            codeBarre: `${data.numeroSac}-${item.categorie}`,
            categorie: item.categorie,
            quantiteDeclaree: item.quantiteDeclaree,
            quantiteComptee: item.quantiteComptee,
            ecart: item.ecart,
            isSacItem: true,
            etat: data.etat || "DECLARE",
            poids: null,
            rfidTag: null,
            sacNumero: data.numeroSac,
            agentCollecteNom: data.agentCollecteNom,
          }));

          setBacLinges(items);
          setBacLingesCount(prev => ({ ...prev, [bac.id]: items.length }));
          return items;
        }
      } else {
        const response = await fetch(`${API_URL}/api/bacs/bacs/${bac.id}/linges`);
        if (response.ok) {
          const data = await response.json();
          const linges = Array.isArray(data) ? data : data.content || [];
          setBacLinges(linges);
          setBacLingesCount(prev => ({ ...prev, [bac.id]: linges.length }));
          return linges;
        }
      }

      setBacLinges([]);
      setBacLingesCount(prev => ({ ...prev, [bac.id]: 0 }));
      return [];
    } catch (err) {
      console.error("Erreur chargement linges/items:", err);
      setBacLinges([]);
      setBacLingesCount(prev => ({ ...prev, [bac.id]: 0 }));
      return [];
    } finally {
      setIsLingesLoading(false);
    }
  };

  const handleOpenPanel = async (bac) => {
    if (selectedBacId === bac.id && panelOpen) {
      setPanelOpen(false);
      setTimeout(() => {
        setSelectedBacId(null);
        setBacLinges([]);
        setSelectedId(null);
      }, 300);
      return;
    }
    setSelectedBacId(bac.id);
    setSelectedBac(bac);
    setSelectedId(null);
    await fetchBacLinges(bac);
    setPanelOpen(true);
  };

  const handleClosePanel = () => {
    setPanelOpen(false);
    setTimeout(() => {
      setSelectedBacId(null);
      setBacLinges([]);
      setSelectedId(null);
    }, 300);
  };

  const handleRowClick = (id) => {
    setSelectedId((prev) => (prev === id ? null : id));
  };

  const getStatusBadge = (status) => {
    if (!status) return <Badge variant="secondary">{t('bac_status.Non défini')}</Badge>;
    const variants = {
      BLANC: { variant: "info", label: t('bac_status.BLANC') },
      INFECTE: { variant: "danger", label: t('bac_status.INFECTE') },
      MIXTE: { variant: "warning", label: t('bac_status.MIXTE') },
      EN_RECEPTION: { variant: "warning", label: t('bac_status.EN_RECEPTION') },
      EN_ATTENTE_COLLECTE: { variant: "secondary", label: t('bac_status.EN_ATTENTE_COLLECTE') },
      COLLECTE_EN_COURS: { variant: "info", label: t('bac_status.COLLECTE_EN_COURS') },
      COLLECTE_TERMINEE: { variant: "success", label: t('bac_status.COLLECTE_TERMINEE') },
    };
    const config = variants[status] || { variant: "secondary", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getEtatLingeBadge = (etat) => {
    if (!etat) return <Badge variant="secondary">{t('linge_status.Non défini')}</Badge>;
    const variants = {
      COLLECTE: { variant: "warning", label: t('linge_status.COLLECTE') },
      EN_LAVAGE: { variant: "info", label: t('linge_status.EN_LAVAGE') },
      PROPRE_PRET: { variant: "success", label: t('linge_status.PROPRE_PRET') },
      RECEPTIONNE: { variant: "success", label: t('linge_status.RECEPTIONNE') },
      DISTRIBUE: { variant: "success", label: t('linge_status.DISTRIBUE') },
      EN_SECHAGE_REPASSAGE: { variant: "info", label: t('linge_status.EN_SECHAGE_REPASSAGE') },
      STOCKE: { variant: "secondary", label: t('linge_status.STOCKE') },
      PRET_LIVRAISON: { variant: "success", label: t('linge_status.PRET_LIVRAISON') },
      EN_TRI: { variant: "info", label: t('linge_status.EN_TRI') },
      LAVE: { variant: "success", label: t('linge_status.LAVE') },
      SECHE: { variant: "success", label: t('linge_status.SECHE') },
      SALE: { variant: "danger", label: t('linge_status.SALE') },
    };
    const config = variants[etat] || { variant: "secondary", label: etat };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // ─── CRUD via contexte ──────────────────────────────────────────────────
  const handleOpenCreateModal = () => {
    setSelectedBac(null);
    setNewRec({
      reference: "",
      etat: "EN_RECEPTION",
      poids: "",
      capacite_max: "",
      nombreLinges: 0,
      typeCollecte: "BLANC",
      typebac: "BLANC",
      observation: ""
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (rec) => {
    setSelectedBac(rec);
    setNewRec({
      code: rec.code || "",
      reference: rec.reference || "",
      etat: rec.etat || "EN_RECEPTION",
      poids: rec.poids || "",
      capacite_max: rec.capacite_max || "",
      nombreLinges: rec.nombreLinges || 0,
      typebac: rec.typebac || "BLANC",
      typeCollecte: rec.typeCollecte || "BLANC",
      observation: rec.observations || "",
    });
    setIsModalOpen(true);
  };

  // ✅ Sauvegarde via le contexte (addBac / updateBac)
  const handleSave = async (e) => {
    e.preventDefault();

    if (!newRec.reference || newRec.reference.trim() === "") {
      Swal.fire({
        title: t('bacs.reference_required'),
        text: t('bacs.reference_required_text'),
        icon: "warning",
      });
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        reference: newRec.reference.trim(),
        etat: newRec.etat || "EN_RECEPTION",
        poids: parseFloat(newRec.poids) || 0,
        capacite_max: parseFloat(newRec.capacite_max) || 10,
        nombreLinges: parseInt(newRec.nombreLinges) || 0,
        typebac: newRec.typebac || "BLANC",
        typeCollecte: newRec.typeCollecte || "BLANC",
        observations: newRec.observation || "initialisation dans le systeme",
      };

      let result;

      if (selectedBac) {
        // ✅ Mise à jour via contexte
        result = await updateBac(selectedBac.id, payload);
        if (result.success) {
          Swal.fire({
            title: "✅",
            text: t('bacs.update_success'),
            icon: "success",
            timer: 1500,
            showConfirmButton: false,
          });
        } else {
          throw new Error(result.error);
        }
      } else {
        // ✅ Création via contexte
        result = await addBac(payload);
        if (result.success) {
          Swal.fire({
            title: "✅",
            text: t('bacs.create_success'),
            icon: "success",
            timer: 1500,
            showConfirmButton: false,
          });
        } else {
          throw new Error(result.error);
        }
      }

      setIsModalOpen(false);
      // ✅ Le contexte a déjà mis à jour la liste, mais on rafraîchit les compteurs
      await fetchBacs();
    } catch (err) {
      console.error("❌ Erreur:", err);
      Swal.fire({
        title: "❌",
        text: err.message || t('bacs.error_text'),
        icon: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // ✅ Suppression via le contexte (deleteBac)
  const deleteRec = async (id) => {
    const result = await Swal.fire({
      title: t('bacs.delete_confirm'),
      text: t('bacs.delete_confirm_text'),
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: t('bacs.delete_confirm_yes'),
      cancelButtonText: t('bacs.delete_confirm_no'),
    });

    if (result.isConfirmed) {
      try {
        const res = await deleteBac(id);
        if (res.success) {
          // ✅ Nettoyer les compteurs locaux
          setBacLingesCount(prev => {
            const newCount = { ...prev };
            delete newCount[id];
            return newCount;
          });
          if (selectedBacId === id) {
            handleClosePanel();
          }
          Swal.fire({
            title: "✅",
            text: t('bacs.delete_success'),
            icon: "success",
            timer: 1500,
            showConfirmButton: false,
          });
        } else {
          throw new Error(res.error);
        }
      } catch (err) {
        console.error("Erreur suppression:", err);
        Swal.fire({
          title: "❌",
          text: t('bacs.error_text'),
          icon: "error",
        });
      }
    }
  };

  const handleDetailLinge = (linge) => {
    setSelectedLingeDetail(linge);
    setShowDetailModal(true);
  };

  // ─── Filtrage local (via contexte) ──────────────────────────────────────
  const filteredBacs = bacs.filter((r) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      r.reference?.toLowerCase().includes(term) ||
      r.code?.toLowerCase().includes(term)
    );
  });

  // ─── Tri par colonne (clic sur l'en-tête : croissant → décroissant → aucun) ─
  const { sortedItems: sortedBacs, requestSort, directionFor } = useSortableData(filteredBacs, {
    poids: (b) => Number(b.poids) || 0,
    linges: (b) => bacLingesCount[b.id],
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
          <div style={{ marginBottom: "32px" }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              marginBottom: "8px"
            }}>
              <PageHeaderIcon size={52} />
              <div>
                <h1 style={{
                  fontSize: "28px",
                  fontWeight: 800,
                  color: "#0f172a",
                  margin: 0
                }}>
                  {t('bacs.title')}
                </h1>
                <p style={{
                  fontSize: "14px",
                  color: "#64748b",
                  margin: "2px 0 0 0"
                }}>
                  {t('bacs.subtitle')}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 bg-white/65 backdrop-blur-md p-4 rounded-[20px] border border-slate-200/50 shadow-[0_4px_20px_rgba(0,0,0,0.02)] mb-6">
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#0ca678]/30 rounded-[14px] text-sm font-bold text-[#0ca678] hover:bg-[#0ca678]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" /> {t('bacs.new')}
            </button>

            <div style={{ width: "1px", height: "30px", background: "#e2e8f0", margin: "0 8px" }} />

            {selectedBac && (
              <BarcodeLabel item={selectedBac} type="bac" />
            )}

            <button
              disabled={!selectedBacId}
              onClick={() => {
                if (selectedBac) {
                  // Imprimer ticket bac
                }
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#8b5cf6]/30 rounded-[14px] text-sm font-bold text-[#8b5cf6] hover:bg-[#8b5cf6]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
            >
              <Printer className="w-4 h-4 stroke-[2.5]" /> {t('bacs.ticket')}
            </button>

            <div style={{ width: "1px", height: "30px", background: "#e2e8f0", margin: "0 8px" }} />

            <button
              disabled={!selectedId}
              onClick={() => {
                if (selectedId) {
                  const linge = bacLinges.find(l => l.id === selectedId);
                  if (linge) handleDetailLinge(linge);
                }
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#006f94]/30 rounded-[14px] text-sm font-bold text-[#006f94] hover:bg-[#006f94]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
            >
              <Eye className="w-4 h-4 stroke-[2.5]" /> {t('bacs.details_linge')}
            </button>

            <button
              disabled={!selectedId}
              onClick={() => {
                if (selectedId) {
                  const linge = bacLinges.find(l => l.id === selectedId);
                  if (linge) {
                    window.location.href = `/tracking?code=${linge.codeBarre}`;
                  }
                }
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#0ca678]/30 rounded-[14px] text-sm font-bold text-[#0ca678] hover:bg-[#0ca678]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
            >
              <History className="w-4 h-4 stroke-[2.5]" /> {t('bacs.history')}
            </button>

            <button
              disabled={!selectedBacId}
              onClick={() => handleOpenEditModal(selectedBac)}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#006f94]/30 rounded-[14px] text-sm font-bold text-[#006f94] hover:bg-[#006f94]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
            >
              <Edit className="w-4 h-4 stroke-[2.5]" /> {t('common.edit')}
            </button>

            <button
              disabled={!selectedBacId}
              onClick={async () => {
                if (selectedBacId) {
                  const confirmed = await Swal.fire({
                    title: t('bacs.delete_confirm'),
                    text: t('bacs.delete_confirm_text'),
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonColor: "#d33",
                    cancelButtonColor: "#3085d6",
                    confirmButtonText: t('bacs.delete_confirm_yes'),
                    cancelButtonText: t('bacs.delete_confirm_no'),
                  });
                  if (confirmed.isConfirmed) {
                    deleteRec(selectedBacId);
                  }
                }
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#e03131]/30 rounded-[14px] text-sm font-bold text-[#e03131] hover:bg-[#e03131]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
            >
              <Trash2 className="w-4 h-4 stroke-[2.5]" /> {t('common.delete')}
            </button>

            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-300 rounded-[14px] text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> {t('bacs.refresh')}
            </button>
          </div>

          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={t('common.search')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <div className="premium-table-wrap">
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th style={{ width: 56 }} aria-label={t('bacs.view_linges', 'Linges')} />
                      <SortableHeader direction={directionFor("reference")} onSort={() => requestSort("reference")}>
                        {t('bacs.reference')}
                      </SortableHeader>
                      <SortableHeader direction={directionFor("dateCreation")} onSort={() => requestSort("dateCreation")}>
                        {t('bacs.date_creation')}
                      </SortableHeader>
                      <SortableHeader direction={directionFor("poids")} onSort={() => requestSort("poids")}>
                        {t('bacs.weight')} / {t('bacs.capacity')}
                      </SortableHeader>
                      <SortableHeader direction={directionFor("typeCollecte")} onSort={() => requestSort("typeCollecte")} align="center">
                        {t('bacs.type')}
                      </SortableHeader>
                      <SortableHeader direction={directionFor("linges")} onSort={() => requestSort("linges")} align="center">
                        {t('bacs.linges_count')}
                      </SortableHeader>
                      <th style={{ textAlign: "right", paddingRight: 20 }}>{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isBacsLoading ? (
                      <tr>
                        <td colSpan={7} className="text-center py-10 text-muted-foreground">
                          <div className="flex items-center justify-center gap-2">
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            {t('common.loading')}
                          </div>
                        </td>
                      </tr>
                    ) : sortedBacs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-10 text-muted-foreground">
                          {searchTerm ? t('bacs.no_match') : t('bacs.no_data')}
                        </td>
                      </tr>
                    ) : (
                      sortedBacs.map((bac) => {
                        const isOpen = panelOpen && selectedBacId === bac.id;
                        const poids = Number(bac.poids) || 0;
                        const capacite = Number(bac.capacite_max) || 0;
                        const ratio = capacite > 0 ? Math.min(poids / capacite, 1) : 0;
                        const gaugeLevel = ratio >= 1 ? "is-full" : ratio >= 0.8 ? "is-high" : "";
                        const nbLinges = bacLingesCount[bac.id];

                        return (
                          <tr
                            key={bac.id}
                            onClick={() => handleOpenPanel(bac)}
                            className={selectedBacId === bac.id ? "is-selected" : ""}
                          >
                            <td style={{ textAlign: "center" }}>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleOpenPanel(bac); }}
                                className={`premium-table__icon-btn ${isOpen ? "is-open" : ""}`}
                                title={isOpen ? t('common.close', 'Fermer') : t('bacs.view_linges', 'Voir les linges')}
                              >
                                {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                              </button>
                            </td>
                            <td>
                              <div className="premium-table__primary">{bac.reference || "N/A"}</div>
                              <span className="premium-table__code">{bac.code || "N/A"}</span>
                            </td>
                            <td>
                              {bac.dateCreation
                                ? new Date(bac.dateCreation).toLocaleDateString()
                                : <span className="premium-table__muted">—</span>}
                            </td>
                            <td>
                              <div className="flex items-baseline gap-1.5">
                                <span className="premium-table__primary">{poids} kg</span>
                                <span className="premium-table__muted">/ {capacite} kg</span>
                              </div>
                              <div className={`premium-table__gauge ${gaugeLevel}`} title={`${Math.round(ratio * 100)} %`}>
                                <span style={{ width: `${ratio * 100}%` }} />
                              </div>
                            </td>
                            <td style={{ textAlign: "center" }}>
                              {getStatusBadge(bac.typeCollecte)}
                            </td>
                            <td style={{ textAlign: "center" }}>
                              {nbLinges !== undefined
                                ? <span className="premium-table__primary">{nbLinges}</span>
                                : <span className="premium-table__muted">…</span>}
                            </td>
                            <td style={{ textAlign: "right", paddingRight: 20 }} onClick={(e) => e.stopPropagation()}>
                              <div className="premium-table__actions">
                                <BarcodeLabel item={bac} type="bac" />
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditModal(bac)}
                                  className="premium-table__icon-btn"
                                  title={t('common.edit')}
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deleteRec(bac.id)}
                                  className="premium-table__icon-btn is-danger"
                                  title={t('common.delete')}
                                >
                                  <Trash2 className="w-4 h-4" />
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
        </div>
      </motion.div>

      {/* Panneau latéral des linges */}
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
            <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-blue-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-blue-600" />
                  <div>
                    <h3 className="font-bold text-slate-800">
                      {selectedBac?.reference || "Bac"}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {selectedBac?.typeCollecte || t('bacs.type')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-white">
                    {bacLinges.length} {t('bacs.linges_count')}
                  </Badge>
                  <BarcodeLabel item={selectedBac} type="bac" />
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
              ) : bacLinges.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Package className="w-12 h-12 mx-auto opacity-30 mb-3" />
                  <p className="text-sm">{t('bacs.no_linge')}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {bacLinges.map((linge, index) => (
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

      {/* Modal Détails Linge */}
      <DetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={t('bacs.details_linge')}
        subtitle={selectedBac?.reference ? `${t('bacs.reference')} · ${selectedBac.reference}` : undefined}
        heading={selectedLingeDetail?.codeBarre}
        badges={selectedLingeDetail && getEtatLingeBadge(selectedLingeDetail.etat)}
        metrics={selectedLingeDetail ? [{ label: t('bacs.weight'), value: `${selectedLingeDetail.poids || 0} kg` }] : []}
        sections={selectedLingeDetail ? [
          { title: t('modal.identification', 'Identification'), icon: "id", items: [
            { label: "ID", value: selectedLingeDetail.id, mono: true },
            { label: t('bacs.code'), value: selectedLingeDetail.codeBarre, mono: true },
            { label: "RFID", value: selectedLingeDetail.rfidTag, mono: true },
          ] },
          { title: t('modal.characteristics', 'Caractéristiques'), icon: "specs", items: [
            { label: t('bacs.type'), value: selectedLingeDetail.categorie },
            { label: t('bacs.reference'), value: selectedBac?.reference },
            { label: t('bacs.date_creation'), value: selectedLingeDetail.dateCreation ? new Date(selectedLingeDetail.dateCreation).toLocaleString("fr-FR") : null },
          ] },
        ] : []}
      />

      {/* Modal Création/Modification */}
      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedBac ? `${t('bacs.edit')} #${selectedBac.id}` : t('bacs.new')}
        mode={selectedBac ? "edit" : "create"}
        size={"lg"}
        onSubmit={handleSave}
        saving={isSaving}
      >
        
          <FormSection title={t('modal.general_info', 'Informations générales')} icon="specs" columns={2}>
            {selectedBac && (
              <div>
                <Input
                  label={t('bacs.code')}
                  value={newRec.code || ""}
                  onChange={(e) =>
                    setNewRec({ ...newRec, code: e.target.value.toUpperCase() })
                  }
                  disabled
                />
              </div>
            )}

            <div>
              <Input
                label={`${t('bacs.reference')} *`}
                value={newRec.reference}
                onChange={(e) =>
                  setNewRec({ ...newRec, reference: e.target.value })
                }
                placeholder="ex: BAC-001"
                required
              />
            </div>

            <div>
              <Input
                type="number"
                label={t('bacs.current_weight')}
                value={newRec.poids}
                onChange={(e) =>
                  setNewRec({ ...newRec, poids: e.target.value })
                }
                placeholder="0"
                step="0.1"
              />
            </div>

            <div>
              <Input
                type="number"
                label={t('bacs.max_capacity')}
                value={newRec.capacite_max}
                onChange={(e) =>
                  setNewRec({ ...newRec, capacite_max: e.target.value })
                }
                placeholder="10"
                step="0.1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t('bacs.status')}</label>
              <select
                value={newRec.etat}
                onChange={(e) =>
                  setNewRec({ ...newRec, etat: e.target.value })
                }
                className="w-full h-10 px-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="EN_RECEPTION">{t('bac_status.EN_RECEPTION')}</option>
                <option value="EN_ATTENTE_COLLECTE">{t('bac_status.EN_ATTENTE_COLLECTE')}</option>
                <option value="COLLECTE_EN_COURS">{t('bac_status.COLLECTE_EN_COURS')}</option>
                <option value="COLLECTE_TERMINEE">{t('bac_status.COLLECTE_TERMINEE')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t('bacs.type_bac')}</label>
              <select
                value={newRec.typebac}
                onChange={(e) =>
                  setNewRec({ ...newRec, typebac: e.target.value })
                }
                className="w-full h-10 px-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="BLANC">{t('bac_status.BLANC')}</option>
                <option value="INFECTE">{t('bac_status.INFECTE')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t('bacs.type_collecte')}</label>
              <select
                value={newRec.typeCollecte}
                onChange={(e) =>
                  setNewRec({ ...newRec, typeCollecte: e.target.value })
                }
                className="w-full h-10 px-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="BLANC">{t('bac_status.BLANC')}</option>
                <option value="INFECTE">{t('bac_status.INFECTE')}</option>
                <option value="MIXTE">{t('bac_status.MIXTE')}</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium mb-2">{t('bacs.observations')}</label>
              <textarea
                value={newRec.observation}
                onChange={(e) =>
                  setNewRec({ ...newRec, observation: e.target.value })
                }
                placeholder={t('bacs.observations')}
                className="w-full min-h-[60px] px-3 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </FormSection>


      </FormModal>
    </div>
  );
}