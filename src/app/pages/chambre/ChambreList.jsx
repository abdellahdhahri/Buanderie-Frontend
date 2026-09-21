import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Plus, Search, Edit, Trash2, ChevronRight, ChevronDown,
  Barcode, RefreshCw, Building2, Loader2, Bed, Home,
  Activity, CheckCircle2, AlertTriangle, LayoutGrid, List,
  DoorOpen, Sparkles, HeartPulse, Users, X, Leaf,
} from "lucide-react";
import { Modal } from "../../components/ui/modal";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import BarcodeLabel from "../../components/BarcodeLabel";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

/* ═══════════════════════════════════════════════════════════════
   STAT CARD — Palette verte douce
   ═══════════════════════════════════════════════════════════════ */
function StatCard({ icon: Icon, label, value, sublabel, gradient, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_28px_rgba(0,0,0,0.06)] transition-all group"
    >
      <div
        className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-[0.08] blur-2xl group-hover:opacity-[0.14] transition-opacity duration-500"
        style={{ background: gradient }}
      />

      <div className="relative flex items-start justify-between mb-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm"
          style={{ background: gradient }}
        >
          <Icon className="w-6 h-6 text-white stroke-[2.5]" />
        </div>
        <div className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse mt-2" />
      </div>

      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
        {label}
      </p>
      <p className="text-3xl font-black text-slate-900 leading-none tabular-nums">
        {value}
      </p>
      {sublabel && (
        <p className="text-xs text-slate-500 mt-1.5 font-medium">{sublabel}</p>
      )}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   BED CARD — État 0 = Libre (vert), 2 = Occupé (orange)
   ═══════════════════════════════════════════════════════════════ */
function BedCard({ lit, isSelected, onClick, t, index }) {
  const isFree = lit.etat === 0;
  const isOccupied = lit.etat === 2;
  const isInfected = lit.infecte;

  const theme = isFree
    ? {
        bg: "bg-white",
        border: "border-[#22c55e]/30",
        iconBg: "bg-[#22c55e]",
        iconColor: "text-white",
        bar: "bg-[#22c55e]",
        badge: "bg-[#dcfce7] text-[#15803d] border-[#22c55e]/25",
        label: t("chambre.free"),
        hover: "hover:border-[#22c55e]/60 hover:shadow-[0_8px_24px_rgba(34,197,94,0.15)]",
      }
    : isOccupied
    ? {
        bg: "bg-white",
        border: "border-[#f97316]/30",
        iconBg: "bg-[#f97316]",
        iconColor: "text-white",
        bar: "bg-[#f97316]",
        badge: "bg-[#ffedd5] text-[#c2410c] border-[#f97316]/25",
        label: t("chambre.occupied"),
        hover: "hover:border-[#f97316]/60 hover:shadow-[0_8px_24px_rgba(249,115,22,0.15)]",
      }
    : {
        bg: "bg-white",
        border: "border-slate-200",
        iconBg: "bg-slate-400",
        iconColor: "text-white",
        bar: "bg-slate-400",
        badge: "bg-slate-100 text-slate-600 border-slate-200",
        label: t("chambre.unknown"),
        hover: "hover:border-slate-300 hover:shadow-md",
      };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl border-2 ${theme.bg} ${theme.border} ${theme.hover} cursor-pointer transition-all ${
        isSelected ? "ring-2 ring-[#059669] ring-offset-2 shadow-lg" : "shadow-sm"
      }`}
    >
      <div className={`absolute top-0 left-0 right-0 h-1 ${isInfected ? "bg-[#d97706]" : theme.bar}`} />

      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[#059669] flex items-center justify-center shadow-md z-10"
          >
            <CheckCircle2 className="w-4 h-4 text-white stroke-[3]" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className={`w-11 h-11 rounded-xl ${theme.iconBg} flex items-center justify-center flex-shrink-0 shadow-sm`}>
            <Bed className={`w-5 h-5 ${theme.iconColor} stroke-[2.5]`} />
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-black text-sm text-slate-900 truncate">
              {lit.code || `LIT-${lit.id}`}
            </p>
            <p className="text-[11px] text-slate-500 truncate font-medium mt-0.5">
              {lit.description || t("chambre.standard_bed")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap mb-3">
          <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-[10px] font-black uppercase tracking-wider ${theme.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${theme.bar} ${isOccupied ? "animate-pulse" : ""}`} />
            {theme.label}
          </span>

          {isInfected && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[#fef3c7] border border-[#d97706]/25 text-[10px] font-black uppercase tracking-wider text-[#b45309]">
              <AlertTriangle className="w-2.5 h-2.5 stroke-[3]" />
              {t("chambre.infected")}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
            <Barcode className="w-3 h-3" />
            <span className="truncate max-w-[100px]">
              {lit.codeBarre || `#${String(lit.id).padStart(4, "0")}`}
            </span>
          </div>
          <BarcodeLabel item={lit} />
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL — FULL WIDTH, palette verte douce
   ═══════════════════════════════════════════════════════════════ */
export default function ChambreList() {
  const { t } = useTranslation();

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
  const [viewMode, setViewMode] = useState("table");
  const [newRec, setNewRec] = useState({ code: "", serviceId: "" });
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
        const normalizedList = Array.isArray(list)
          ? list.map((c) => ({
              id: c.Id,
              code: c.Code,
              serviceId: c.ServiceId,
              codeBarre: c.CodeBarre,
            }))
          : [];
        setChambres(normalizedList);
      } else {
        setChambres([]);
      }
    } catch (err) {
      console.error(err);
      setChambres([]);
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
      const response = await fetch(`${API_URL}/api/sqlserver/lits/chambre/${chambreId}`);
      if (response.ok) {
        const data = await response.json();
        setChambreLits(Array.isArray(data) ? data : []);
      } else {
        setChambreLits([]);
      }
    } catch (err) {
      setChambreLits([]);
    } finally {
      setIsLitsLoading(false);
    }
  }, []);

  const toggleExpand = useCallback(
    (chambre) => {
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
    },
    [expandedId, fetchChambreLits]
  );

  const getServiceName = useCallback(
    (serviceId) => {
      if (!serviceId || !Array.isArray(services)) return t("chambre.not_assigned");
      const s = services.find((x) => x.id === serviceId);
      return s ? s.code : t("chambre.not_assigned");
    },
    [services, t]
  );

  const stats = useMemo(() => {
    const total = chambres.length;
    const totalLits = chambreLits.length;
    const occupied = chambreLits.filter((l) => l.etat === 2).length;
    const free = chambreLits.filter((l) => l.etat === 0).length;
    const infected = chambreLits.filter((l) => l.infecte).length;
    const occupancy = totalLits > 0 ? Math.round((occupied / totalLits) * 100) : 0;
    return { total, totalLits, occupied, free, infected, occupancy };
  }, [chambres, chambreLits]);

  const handleOpenCreateModal = useCallback(() => {
    setSelectedChambre(null);
    setNewRec({ code: "", serviceId: services.length > 0 ? services[0].id : "" });
    setIsModalOpen(true);
  }, [services]);

  const handleOpenEditModal = useCallback((chambre) => {
    setSelectedChambre(chambre);
    setNewRec({ code: chambre.code || "", serviceId: chambre.serviceId || "" });
    setIsModalOpen(true);
  }, []);

  const handleSave = useCallback(
    async (e) => {
      e.preventDefault();
      if (!newRec.code?.trim()) {
        Swal.fire({
          title: t("chambre.alerts.code_required"),
          text: t("chambre.alerts.code_required_text"),
          icon: "warning",
        });
        return;
      }
      setIsSaving(true);
      try {
        const payload = {
          code: newRec.code.trim(),
          serviceId: newRec.serviceId ? parseInt(newRec.serviceId) : null,
        };
        if (selectedChambre) {
          setChambres((prev) =>
            prev.map((r) => (r.id === selectedChambre.id ? { ...r, ...payload } : r))
          );
          Swal.fire({ title: t("chambre.alerts.updated"), icon: "success", timer: 1500, showConfirmButton: false });
        } else {
          setChambres((prev) => [{ id: Date.now(), ...payload }, ...prev]);
          Swal.fire({ title: t("chambre.alerts.created"), icon: "success", timer: 1500, showConfirmButton: false });
        }
        setIsModalOpen(false);
        fetchChambres();
      } catch (err) {
        Swal.fire({ title: t("chambre.alerts.error"), text: err.message, icon: "error" });
      } finally {
        setIsSaving(false);
      }
    },
    [selectedChambre, newRec, t]
  );

  const deleteRec = useCallback(
    async (id) => {
      const result = await Swal.fire({
        title: t("chambre.alerts.delete_confirm"),
        text: t("chambre.alerts.delete_confirm_text"),
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#dc2626",
        cancelButtonColor: "#64748b",
        confirmButtonText: t("chambre.alerts.delete_yes"),
        cancelButtonText: t("chambre.alerts.delete_no"),
      });
      if (result.isConfirmed) {
        try {
          setChambres((prev) => prev.filter((r) => r.id !== id));
          if (expandedId === id) {
            setExpandedId(null);
            setChambreLits([]);
          }
          Swal.fire({ title: t("chambre.alerts.deleted"), icon: "success", timer: 1500, showConfirmButton: false });
        } catch (err) {
          Swal.fire({ title: t("chambre.alerts.error"), text: err.message, icon: "error" });
        }
      }
    },
    [expandedId, t]
  );

  const filteredChambres = useMemo(() => {
    if (!searchTerm) return chambres;
    const term = searchTerm.toLowerCase();
    return chambres.filter(
      (r) =>
        r.code?.toLowerCase().includes(term) ||
        r.codeBarre?.toLowerCase().includes(term)
    );
  }, [chambres, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredChambres.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = filteredChambres.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="w-full min-h-screen bg-slate-50">
      {/* ═══════════════════════════════════════════════════════════
          HERO HEADER — Vert sauge doux, pleine largeur
          ═══════════════════════════════════════════════════════════ */}
      <div className="relative w-full overflow-hidden bg-gradient-to-r from-[#064e3b] via-[#059669] to-[#34d399]">
        {/* Motifs décoratifs discrets */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
          }}
        />
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-[#a7f3d0]/20 blur-3xl" />

        <div className="relative px-6 lg:px-10 py-8 lg:py-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Identité */}
            <div className="flex items-center gap-5">
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="relative"
              >
                <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-xl border border-white/30 flex items-center justify-center shadow-2xl">
                  <Home className="w-8 h-8 text-white stroke-[2.5]" />
                </div>
                <Leaf className="absolute -top-1.5 -right-1.5 w-5 h-5 text-[#a7f3d0] fill-[#a7f3d0]" />
              </motion.div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-[10px] font-black uppercase tracking-widest text-white">
                    <HeartPulse className="w-3 h-3" />
                    Hospital Module
                  </span>
                </div>
                <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight leading-none mb-2">
                  {t("chambre.title")}
                </h1>
                <p className="text-white/75 text-sm font-medium">
                  {t("chambre.subtitle")}
                </p>
              </div>
            </div>

            {/* Stats pills + refresh */}
            <div className="flex items-center gap-3">
              <div className="hidden lg:flex items-center gap-2">
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 backdrop-blur-xl border border-white/20">
                  <CheckCircle2 className="w-4 h-4 text-[#a7f3d0]" />
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-wider text-white/60">Libres</p>
                    <p className="text-base font-black text-white leading-none">{stats.free}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 backdrop-blur-xl border border-white/20">
                  <Users className="w-4 h-4 text-[#fed7aa]" />
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-wider text-white/60">Occupés</p>
                    <p className="text-base font-black text-white leading-none">{stats.occupied}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 backdrop-blur-xl border border-white/20">
                  <Activity className="w-4 h-4 text-[#a7f3d0]" />
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-wider text-white/60">Taux</p>
                    <p className="text-base font-black text-white leading-none">{stats.occupancy}%</p>
                  </div>
                </div>
              </div>

              <button
                onClick={fetchChambres}
                className="group w-12 h-12 rounded-xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all"
                title={t("chambre.refresh")}
              >
                <RefreshCw
                  className={`w-5 h-5 text-white stroke-[2.5] ${
                    isLoading ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Barre d'occupation */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-white/80">
                <Activity className="w-4 h-4" />
                <span className="text-[11px] font-black uppercase tracking-widest">
                  Taux d'occupation global
                </span>
              </div>
              <span className="text-2xl font-black text-white tabular-nums">
                {stats.occupancy}
                <span className="text-sm text-white/60 ml-0.5">%</span>
              </span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stats.occupancy}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                className="h-full rounded-full bg-gradient-to-r from-[#a7f3d0] via-white to-[#a7f3d0]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          CONTENU — PLEINE LARGEUR
          ═══════════════════════════════════════════════════════════ */}
      <div className="w-full px-6 lg:px-10 py-6 space-y-6">

        {/* ═══ STATS CARDS ═══ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={DoorOpen}
            label={t("chambre.title")}
            value={stats.total}
            sublabel="Total enregistrées"
            gradient="linear-gradient(135deg, #059669, #10b981)"
            delay={0}
          />
          <StatCard
            icon={Users}
            label="Lits occupés"
            value={stats.occupied}
            sublabel={`${stats.occupancy}% d'occupation`}
            gradient="linear-gradient(135deg, #ea580c, #f97316)"
            delay={0.05}
          />
          <StatCard
            icon={CheckCircle2}
            label="Disponibles"
            value={stats.free}
            sublabel="Prêts à l'admission"
            gradient="linear-gradient(135deg, #16a34a, #22c55e)"
            delay={0.1}
          />
          <StatCard
            icon={AlertTriangle}
            label="Infectés"
            value={stats.infected}
            sublabel="À désinfecter"
            gradient="linear-gradient(135deg, #d97706, #f59e0b)"
            delay={0.15}
          />
        </div>

        {/* ═══ TOOLBAR ═══ */}
        <div className="flex flex-wrap items-center gap-3 p-3 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <button
            onClick={handleOpenCreateModal}
            className="group relative flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-br from-[#059669] to-[#10b981] text-white text-sm font-black shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <Plus className="relative w-4 h-4 stroke-[3] group-hover:rotate-90 transition-transform duration-300" />
            <span className="relative">{t("chambre.new")}</span>
          </button>

          <div className="w-px h-8 bg-slate-200" />

          <button
            disabled={!expandedId}
            onClick={() => selectedChambre && handleOpenEditModal(selectedChambre)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-bold text-[#006f94] hover:border-[#006f94]/50 hover:bg-[#006f94]/5 hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            <Edit className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">{t("chambre.edit")}</span>
          </button>

          <button
            disabled={!expandedId}
            onClick={() => expandedId && deleteRec(expandedId)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-bold text-[#dc2626] hover:border-[#dc2626]/50 hover:bg-[#dc2626]/5 hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            <Trash2 className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">{t("chambre.delete")}</span>
          </button>

          <div className="flex-1" />

          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode("table")}
              className={`p-2 rounded-lg transition-all ${
                viewMode === "table" ? "bg-white shadow-sm text-[#059669]" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <List className="w-4 h-4 stroke-[2.5]" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg transition-all ${
                viewMode === "grid" ? "bg-white shadow-sm text-[#059669]" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <LayoutGrid className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* ═══ RECHERCHE ═══ */}
        <div className="relative group">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#10b981] to-[#34d399] opacity-0 group-focus-within:opacity-100 blur-sm transition-opacity" />
          <div className="relative flex items-center bg-white rounded-2xl border-2 border-slate-200 focus-within:border-transparent transition-all">
            <Search className="absolute left-5 w-5 h-5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder={t("chambre.search_placeholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-14 pl-14 pr-14 bg-transparent rounded-2xl text-base font-medium focus:outline-none placeholder:text-slate-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-5 w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            )}
          </div>
        </div>

        {/* ═══ CONTENU PRINCIPAL ═══ */}
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-[#10b981]/10" />
                <div className="absolute inset-0 w-20 h-20 rounded-full border-4 border-transparent border-t-[#10b981] animate-spin" />
                <Bed className="absolute inset-0 m-auto w-8 h-8 text-[#059669]" />
              </div>
              <p className="text-sm font-bold text-slate-500">{t("chambre.loading")}</p>
            </div>
          ) : currentData.length === 0 ? (
            <div className="text-center py-24 px-6">
              <div className="relative inline-block mb-6">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#d1fae5] to-[#a7f3d0] flex items-center justify-center mx-auto">
                  <Home className="w-12 h-12 text-[#059669]" />
                </div>
                <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-400 fill-yellow-400" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">
                {searchTerm ? t("chambre.no_match") : t("chambre.no_data")}
              </h3>
            </div>
          ) : viewMode === "table" ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-[#ecfdf5]/60 via-white to-[#ecfdf5]/40 border-b border-slate-200">
                  <tr>
                    <th className="w-14 py-4 px-4"></th>
                    <th className="text-left py-4 px-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                      {t("chambre.code")}
                    </th>
                    <th className="text-left py-4 px-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                      {t("chambre.code_barre")}
                    </th>
                    <th className="text-left py-4 px-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                      {t("chambre.service")}
                    </th>
                    <th className="text-right py-4 px-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                      {t("chambre.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentData.map((chambre, idx) => {
                    const isExpanded = expandedId === chambre.id;
                    return (
                      <React.Fragment key={chambre.id}>
                        <motion.tr
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          className={`border-b border-slate-100 transition-colors ${
                            isExpanded ? "bg-gradient-to-r from-[#ecfdf5]/70 via-white to-white" : "hover:bg-slate-50/70"
                          }`}
                        >
                          <td className="py-3.5 px-4">
                            <button
                              onClick={() => toggleExpand(chambre)}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                                isExpanded
                                  ? "bg-gradient-to-br from-[#059669] to-[#10b981] text-white shadow-md"
                                  : "bg-slate-100 text-slate-500 hover:bg-[#d1fae5] hover:text-[#059669]"
                              }`}
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 stroke-[3]" />
                              ) : (
                                <ChevronRight className="w-4 h-4 stroke-[3]" />
                              )}
                            </button>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#d1fae5] to-[#a7f3d0] border border-[#059669]/20 flex items-center justify-center">
                                  <Home className="w-5 h-5 text-[#059669] stroke-[2.5]" />
                                </div>
                                {isExpanded && (
                                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#22c55e] border-2 border-white animate-pulse" />
                                )}
                              </div>
                              <div>
                                <p className="font-black text-slate-900 text-sm leading-tight">
                                  {chambre.code || `CH-${chambre.id}`}
                                </p>
                                <p className="text-[10px] text-slate-400 font-mono">
                                  #{String(chambre.id).padStart(4, "0")}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            {chambre.codeBarre ? (
                              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
                                <Barcode className="w-3 h-3 text-[#34d399]" />
                                <span className="font-mono text-[11px] font-bold text-[#34d399] tracking-widest">
                                  {chambre.codeBarre}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-300 italic">—</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#ecfeff] border border-[#0891b2]/25">
                              <Building2 className="w-3.5 h-3.5 text-[#0891b2]" />
                              <span className="text-[11px] font-black text-[#0891b2] uppercase tracking-wider">
                                {getServiceName(chambre.serviceId)}
                              </span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-center justify-end gap-1">
                              <BarcodeLabel item={chambre} />
                              <button
                                onClick={(e) => { e.stopPropagation(); handleOpenEditModal(chambre); }}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#006f94] hover:bg-[#006f94]/10 transition-all"
                              >
                                <Edit className="w-3.5 h-3.5 stroke-[2.5]" />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); deleteRec(chambre.id); }}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#dc2626] hover:bg-[#dc2626]/10 transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>

                        {/* Panneau lits */}
                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <tr>
                              <td colSpan={5} className="p-0">
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                                  className="overflow-hidden"
                                >
                                  <div className="bg-gradient-to-br from-[#ecfdf5] via-white to-[#f0fdf4]/40 px-6 lg:px-10 py-6 border-l-4 border-[#10b981]">
                                    {/* En-tête */}
                                    <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                                      <div className="flex items-center gap-3">
                                        <div className="relative">
                                          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#059669] to-[#34d399] flex items-center justify-center shadow-md">
                                            <Bed className="w-5 h-5 text-white stroke-[2.5]" />
                                          </div>
                                          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white border-2 border-[#10b981] flex items-center justify-center">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
                                          </span>
                                        </div>
                                        <div>
                                          <h3 className="font-black text-slate-900 text-base">
                                            {t("chambre.beds")}
                                          </h3>
                                          <p className="text-[11px] text-slate-500 font-medium">
                                            Chambre <span className="font-black text-[#059669]">{chambre.code}</span>
                                          </p>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2 flex-wrap">
                                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200">
                                          <Activity className="w-3.5 h-3.5 text-slate-400" />
                                          <span className="text-xs font-black text-slate-700">
                                            {isLitsLoading ? "…" : chambreLits.length}{" "}
                                            {t("chambre.bed")}{chambreLits.length > 1 ? "s" : ""}
                                          </span>
                                        </div>

                                        {!isLitsLoading && chambreLits.length > 0 && (
                                          <>
                                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#dcfce7] border border-[#22c55e]/25">
                                              <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
                                              <span className="text-xs font-black text-[#15803d]">
                                                {chambreLits.filter((l) => l.etat === 0).length} libres
                                              </span>
                                            </div>
                                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#ffedd5] border border-[#f97316]/25">
                                              <span className="w-2 h-2 rounded-full bg-[#f97316] animate-pulse" />
                                              <span className="text-xs font-black text-[#c2410c]">
                                                {chambreLits.filter((l) => l.etat === 2).length} occupés
                                              </span>
                                            </div>
                                          </>
                                        )}
                                      </div>
                                    </div>

                                    {/* Grille lits */}
                                    {isLitsLoading ? (
                                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                        {[1, 2, 3, 4].map((i) => (
                                          <div key={i} className="h-36 rounded-2xl bg-slate-100 animate-pulse" />
                                        ))}
                                      </div>
                                    ) : chambreLits.length === 0 ? (
                                      <div className="text-center py-12 rounded-2xl bg-white border-2 border-dashed border-slate-200">
                                        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[#ecfdf5] to-[#d1fae5] flex items-center justify-center mb-3">
                                          <Bed className="w-8 h-8 text-[#059669]" />
                                        </div>
                                        <p className="text-sm text-slate-500 font-bold">{t("chambre.no_beds")}</p>
                                      </div>
                                    ) : (
                                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                        {chambreLits.map((lit, i) => (
                                          <BedCard
                                            key={lit.id}
                                            lit={lit}
                                            index={i}
                                            isSelected={selectedId === lit.id}
                                            onClick={() =>
                                              setSelectedId((prev) => (prev === lit.id ? null : lit.id))
                                            }
                                            t={t}
                                          />
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
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* Vue GRILLE */
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
              {currentData.map((chambre, idx) => (
                <motion.div
                  key={chambre.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="group relative overflow-hidden rounded-2xl bg-white border border-slate-200 hover:border-[#059669]/40 hover:shadow-lg transition-all"
                >
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#059669] to-[#34d399]" />

                  <div className="p-5">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#d1fae5] to-[#a7f3d0] border border-[#059669]/20 flex items-center justify-center mb-4">
                      <Home className="w-6 h-6 text-[#059669] stroke-[2.5]" />
                    </div>

                    <h3 className="font-black text-lg text-slate-900 mb-1">
                      {chambre.code || `CH-${chambre.id}`}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-mono mb-3">
                      #{String(chambre.id).padStart(4, "0")}
                    </p>

                    <div className="flex items-center gap-2 mb-4">
                      <Building2 className="w-3.5 h-3.5 text-[#0891b2]" />
                      <span className="text-xs font-black text-[#0891b2] uppercase tracking-wider">
                        {getServiceName(chambre.serviceId)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <button
                        onClick={() => toggleExpand(chambre)}
                        className="flex items-center gap-1.5 text-xs font-black text-[#059669] hover:text-[#064e3b] transition-colors"
                      >
                        <Bed className="w-3.5 h-3.5" />
                        Voir les lits
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                      <div className="flex items-center gap-1">
                        <BarcodeLabel item={chambre} />
                        <button
                          onClick={() => handleOpenEditModal(chambre)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-[#006f94] hover:bg-[#006f94]/10 transition-all"
                        >
                          <Edit className="w-3 h-3 stroke-[2.5]" />
                        </button>
                        <button
                          onClick={() => deleteRec(chambre.id)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-[#dc2626] hover:bg-[#dc2626]/10 transition-all"
                        >
                          <Trash2 className="w-3 h-3 stroke-[2.5]" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* ═══ PAGINATION ═══ */}
        {totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200">
            <div className="text-sm text-slate-600 font-medium">
              <span className="font-black text-[#059669]">{currentData.length > 0 ? startIndex + 1 : 0}</span>
              {" — "}
              <span className="font-black text-[#059669]">{Math.min(startIndex + itemsPerPage, filteredChambres.length)}</span>
              {" sur "}
              <span className="font-black text-slate-900">{filteredChambres.length}</span>
              {" chambres"}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)} className="rounded-xl">
                {t("chambre.pagination.previous")}
              </Button>
              <div className="flex items-center gap-1 px-2">
                <span className="px-3 py-1.5 rounded-xl bg-gradient-to-br from-[#059669] to-[#10b981] text-white text-sm font-black shadow-md">
                  {currentPage}
                </span>
                <span className="text-slate-400 text-sm font-bold">/</span>
                <span className="px-3 py-1.5 text-slate-700 text-sm font-black">{totalPages}</span>
              </div>
              <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)} className="rounded-xl">
                {t("chambre.pagination.next")}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ═══ MODAL ═══ */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          selectedChambre
            ? `${t("chambre.modal.edit_title")} #${selectedChambre.id}`
            : t("chambre.modal.new_title")
        }
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={t("chambre.form.code_label")}
              value={newRec.code}
              onChange={(e) => setNewRec({ ...newRec, code: e.target.value.toUpperCase() })}
              placeholder={t("chambre.form.code_placeholder")}
              required
            />
            <div>
              <label className="block text-sm font-bold mb-2 text-slate-700">
                {t("chambre.form.service_label")}
              </label>
              <select
                value={newRec.serviceId || ""}
                onChange={(e) =>
                  setNewRec({
                    ...newRec,
                    serviceId: e.target.value ? parseInt(e.target.value) : "",
                  })
                }
                className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-[#059669] focus:ring-2 focus:ring-[#059669]/20 transition-all"
              >
                <option value="">{t("chambre.form.no_service")}</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>{service.code}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => setIsModalOpen(false)} type="button" disabled={isSaving}>
              {t("chambre.form.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-gradient-to-br from-[#059669] to-[#10b981] hover:from-[#047857] hover:to-[#059669]"
            >
              {isSaving ? t("chambre.form.saving") : selectedChambre ? t("chambre.form.update") : t("chambre.form.create")}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}