import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";

import { useTranslation } from "react-i18next";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Package,
  User,
  X,
  RefreshCw,
  Printer,
  Barcode,
  Users,
  Tag,
  Layers,
  UserPlus,
  UserMinus,
  Loader2,
  BarChart3,
  TrendingUp,
  Clock
} from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Modal } from "../../components/ui/modal";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import { useEtape, EtapeProvider } from "../../contextes/EtapeContext";
import BadgeModal from "../../components/Modal/BadgeModal";
import {
  fetchStatistiquesPersonnel,
  getTypeOperationInfo,
} from "../../services/statistiqueService";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

// ─── Composant de chargement ──────────────────────────────────────────────
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
    </div>
  );
}

// ─── Barre de répartition par type d'opération (style Tailwind) ──────────
function TypeOperationBarTW({ type, count, total }) {
  const info = getTypeOperationInfo(type);
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-600">
          {info.emoji} {info.label}
        </span>
        <span className="font-semibold text-slate-800">
          {count} <span className="text-slate-400">({pct}%)</span>
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: info.color }}
        />
      </div>
    </div>
  );
}

// ─── Carte de rendement d'un personnel (repliable) ────────────────────────
function PersonnelStatCard({ stat, rang }) {
  const [ouvert, setOuvert] = useState(false);
  const types = Object.entries(stat.operationsParType || {});
  const medailles = { 1: "🥇", 2: "🥈", 3: "🥉" };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-slate-200 bg-white overflow-hidden mb-2.5"
    >
      <button
        onClick={() => setOuvert(!ouvert)}
        className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50/80 transition-colors"
      >
        <div className="flex items-center gap-3">
          {medailles[rang] ? (
            <span className="text-lg">{medailles[rang]}</span>
          ) : (
            <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-[11px] font-bold flex items-center justify-center">
              {rang}
            </span>
          )}
          <div className="text-left">
            <p className="font-semibold text-slate-800 text-sm">{stat.nomPrenom}</p>
            <p className="text-[11px] text-slate-400 font-mono">{stat.matricule}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {stat.moyenneParJour !== null && stat.moyenneParJour !== undefined && (
            <div className="text-right hidden sm:block">
              <p className="text-[9px] text-slate-400 uppercase tracking-wide">Cadence</p>
              <p className="text-xs font-semibold text-sky-600">{stat.moyenneParJour}/j</p>
            </div>
          )}
          <div className="text-right">
            <p className="text-[9px] text-slate-400 uppercase tracking-wide">Total</p>
            <p className="text-lg font-extrabold text-slate-800">{stat.totalOperations}</p>
          </div>
          <ChevronRight
            className={`w-4 h-4 text-slate-400 transition-transform ${
              ouvert ? "rotate-90" : ""
            }`}
          />
        </div>
      </button>

      <AnimatePresence>
        {ouvert && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3.5 pb-3.5 pt-1 border-t border-slate-100">
              {types.length === 0 ? (
                <p className="text-xs text-slate-400 py-2">Aucun détail disponible</p>
              ) : (
                types
                  .sort((a, b) => b[1] - a[1])
                  .map(([type, count]) => (
                    <TypeOperationBarTW
                      key={type}
                      type={type}
                      count={count}
                      total={stat.totalOperations}
                    />
                  ))
              )}
              {(stat.premiereOperation || stat.derniereOperation) && (
                <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400">
                  <Clock className="w-3 h-3" />
                  <span>
                    {stat.premiereOperation?.slice(0, 10)} → {stat.derniereOperation?.slice(0, 10)}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Ligne Etape ──────────────────────────────────────────────────────────
function LigneEtape({ etape, index, isSelected, onOpenPanel, onEdit, onDelete }) {
  const { t } = useTranslation();

  return (
    <tr className={`border-b border-slate-100 hover:bg-slate-50/80 transition-colors ${isSelected ? 'bg-purple-50' : ''}`}>
      <td className="text-center py-3 px-4">
        <button
          onClick={() => onOpenPanel(etape)}
          className={`p-1.5 rounded-lg transition-all duration-200 ${
            isSelected ? 'bg-purple-100 text-purple-600' : 'hover:bg-purple-100 text-slate-400 hover:text-purple-500'
          }`}
          title={isSelected ? t('common.close') : t('etapes.view_personnel')}
        >
          {isSelected ? (
            <ChevronLeft className="w-5 h-5" />
          ) : (
            <ChevronRight className="w-5 h-5" />
          )}
        </button>
      </td>
      <td className="text-center py-3 px-4 text-sm text-slate-500 font-medium">
        {index + 1}
      </td>
      <td className="text-center py-3 px-4">
        <div className="font-medium text-slate-800">{etape.nom}</div>
      </td>
      <td className="text-center py-3 px-4">
        <code className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
          {etape.codeBarre}
        </code>
      </td>
      <td className="text-center py-3 px-4">
        <Badge className="bg-blue-50 text-blue-700 border-blue-200">
          {etape.zone || t('etapes.zone_undefined')}
        </Badge>
      </td>
      <td className="text-center py-3 px-4">
        <Badge className="bg-slate-50 text-slate-600 border-slate-200">
          {t('etapes.order')} {etape.ordre || "—"}
        </Badge>
      </td>
      <td className="text-center py-3 px-4">
        <div className="flex items-center justify-center gap-1.5">
          <button
            onClick={() => onEdit(etape)}
            className="p-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-blue-600"
            title={t('common.edit')}
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(etape.id)}
            className="p-1.5 bg-red-50 hover:bg-red-100 rounded-lg transition-colors text-red-600"
            title={t('common.delete')}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── Panneau latéral des Personnels ──────────────────────────────────────
function PersonnelPanel({ etape, isOpen, onClose, onRefresh }) {
  const { t } = useTranslation();
  const { personnels, associations, addPersonnelToEtape, removePersonnelFromEtape, loading } = useEtape();
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchPersonnel, setSearchPersonnel] = useState("");
  const [personnelSuggestions, setPersonnelSuggestions] = useState([]);
  const [selectedPersonnel, setSelectedPersonnel] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [badgeModalOpen, setBadgeModalOpen] = useState(false);
  const [badgeEmployee, setBadgeEmployee] = useState(null);
  const searchTimeoutRef = useRef(null);

  // ── Onglet actif : "personnel" | "stats" ──────────────────────────────
  const [activeTab, setActiveTab] = useState("personnel");
  const [statsData, setStatsData] = useState([]);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState(null);

  // Revenir sur l'onglet "personnel" à chaque changement d'étape
  useEffect(() => {
    setActiveTab("personnel");
  }, [etape?.id]);

  const chargerStats = useCallback(async () => {
    if (!personnels || personnels.length === 0) {
      setStatsData([]);
      return;
    }
    setStatsLoading(true);
    setStatsError(null);
    try {
      const allStats = await fetchStatistiquesPersonnel();
      const idsEtape = new Set(personnels.map((p) => p.id));
      const filtered = allStats.filter((s) => idsEtape.has(s.personnelId));
      setStatsData(filtered);
    } catch (e) {
      setStatsError(e.message);
    } finally {
      setStatsLoading(false);
    }
  }, [personnels]);

  useEffect(() => {
    if (activeTab === "stats") {
      chargerStats();
    }
  }, [activeTab, chargerStats]);

  // Recherche de personnels avec debounce
const searchPersonnels = useCallback(async (query) => {
  if (!query || query.length < 2) {
    setPersonnelSuggestions([]);
    return;
  }

  setIsSearching(true);
  try {
    const token = localStorage.getItem('auth');
    let tokenValue = '';
    if (token) {
      try {
        const parsed = JSON.parse(token);
        tokenValue = parsed.token || '';
      } catch {
        tokenValue = token;
      }
    }

    const response = await fetch(`${API_URL}/api/sqlserver/personnel`, {
      headers: {
        ...(tokenValue ? { 'Authorization': `Bearer ${tokenValue}` } : {})
      }
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error("❌ Erreur HTTP personnel:", response.status, errorText);
      setPersonnelSuggestions([]);
      return;
    }

    const data = await response.json();

    const list = Array.isArray(data)
      ? data
      : Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data?.content)
      ? data.content
      : null;

    if (!list) {
      console.error("❌ Format de réponse inattendu pour la liste des personnels.");
      setPersonnelSuggestions([]);
      return;
    }

    // ✅ Normalisation PascalCase (API SQL Server) → camelCase (attendu par le composant)
    const normalized = list.map((p) => ({
      id: p.Id ?? p.id,
      nom: p.Nom ?? p.nom ?? "",
      prenom: p.Prenom ?? p.prenom ?? "",
      nomPrenom: p.NomPrenom ?? p.nomPrenom ?? `${p.Nom ?? ""} ${p.Prenom ?? ""}`.trim(),
      matricule: p.Matricule ?? p.matricule ?? p.CodeBarre ?? p.codeBarre,
      codeBarre: p.CodeBarre ?? p.codeBarre,
      fonction: p.Fonction ?? p.fonction,
    }));

    const filtered = normalized.filter(p =>
      p.nom?.toLowerCase().includes(query.toLowerCase()) ||
      p.prenom?.toLowerCase().includes(query.toLowerCase()) ||
      p.codeBarre?.toLowerCase().includes(query.toLowerCase()) ||
      p.matricule?.toLowerCase().includes(query.toLowerCase())
    );
    setPersonnelSuggestions(filtered.slice(0, 20));
  } catch (error) {
    console.error("Erreur recherche personnels:", error);
    setPersonnelSuggestions([]);
  } finally {
    setIsSearching(false);
  }
}, []);
  // Debounce sur la recherche
  useEffect(() => {
    clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      searchPersonnels(searchPersonnel);
    }, 300);
    return () => clearTimeout(searchTimeoutRef.current);
  }, [searchPersonnel, searchPersonnels]);

  const handleSelectPersonnel = (personnel) => {
    setSelectedPersonnel(personnel);
    setSearchPersonnel(`${personnel.nom} ${personnel.prenom || ''}`.trim());
    setPersonnelSuggestions([]);
  };

const handleAddPersonnel = async () => {
    if (!selectedPersonnel) {
        Swal.fire({
            icon: "warning",
            title: t('etapes.select_personnel'),
            text: t('etapes.select_personnel_text'),
            timer: 1500,
            showConfirmButton: false
        });
        return;
    }

    setIsAdding(true);

    try {

        console.log("👤 Personnel sélectionné :", selectedPersonnel);
        console.log("🆔 personnelId :", selectedPersonnel.id);
        console.log("🧺 lingeEtapeId :", etape?.id);

        await addPersonnelToEtape(
            etape?.id,
            selectedPersonnel.id
        );

        setSelectedPersonnel(null);
        setSearchPersonnel("");
        setShowAddModal(false);

        if (onRefresh) {
            onRefresh();
        }

    } finally {
        setIsAdding(false);
    }
};

  const handleRemove = async (personnel) => {
    const result = await Swal.fire({
      title: t('etapes.remove_personnel'),
      text: `${t('etapes.remove_personnel_text')} ${personnel.nom} ${personnel.prenom || ''} ?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      confirmButtonText: t('etapes.remove_confirm'),
      cancelButtonText: t('common.cancel')
    });

    if (result.isConfirmed) {
      const assoc = associations.find(
        a => a.personnelId === personnel.id && a.lingeEtapeId === etape?.id
      );
      if (assoc) {
        await removePersonnelFromEtape(assoc.id, etape?.id);
        if (onRefresh) onRefresh();
      }
    }
  };

  const filteredPersonnels = personnels.filter(p =>
    p.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.codeBarre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.matricule?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen || !etape) return null;

  return (
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
      className="w-[45%] bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden h-[calc(100vh-120px)] sticky top-20 flex-shrink-0"
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-purple-50 to-purple-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-200 rounded-xl">
              <Users className="w-5 h-5 text-purple-700" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">{etape.nom}</h3>
              <p className="text-xs text-slate-500">
                {etape.categorie || t('etapes.uncategorized')} • {etape.zone || "N/A"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-purple-200 text-purple-700 border-purple-300 font-medium px-3 py-1">
              {personnels.length} {t('etapes.personnel_count')}{personnels.length > 1 ? 's' : ''}
            </Badge>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-purple-200 rounded-lg transition-colors text-slate-500 hover:text-slate-700"
              title={t('common.close')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="p-4 overflow-y-auto h-[calc(100%-80px)]">

        {/* Sélecteur d'onglets */}
        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-4">
          <button
            onClick={() => setActiveTab("personnel")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "personnel"
                ? "bg-white text-purple-700 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Users className="w-4 h-4" /> {t('etapes.personnel_count')}s
          </button>
          <button
            onClick={() => setActiveTab("stats")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "stats"
                ? "bg-white text-purple-700 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <BarChart3 className="w-4 h-4" /> Rendement
          </button>
        </div>

        {/* ── Onglet Personnel ─────────────────────────────────────────── */}
        {activeTab === "personnel" && (
          <>
            {/* Barre d'outils */}
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => {
                  setShowAddModal(true);
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#0ca678]/30 rounded-[14px] text-sm font-bold text-[#0ca678] hover:bg-[#0ca678]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02]"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" /> {t('etapes.add_personnel')}
              </button>

              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder={t('etapes.search_personnel')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-9 pl-10 pr-3 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
              </div>

              <button
                onClick={onRefresh}
                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors text-slate-500 hover:text-slate-700"
                title={t('common.refresh')}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Tableau des personnels */}
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
              </div>
            ) : filteredPersonnels.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Users className="w-12 h-12 mx-auto opacity-30 mb-3" />
                <p className="text-sm font-medium">{t('etapes.no_personnel')}</p>
                <p className="text-xs">{t('etapes.no_personnel_text')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-center py-2.5 px-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">{t('etapes.code')}</th>
                      <th className="text-center py-2.5 px-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">{t('etapes.last_name')}</th>
                      <th className="text-center py-2.5 px-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">{t('etapes.first_name')}</th>
                      <th className="text-center py-2.5 px-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPersonnels.map((p, index) => (
                      <motion.tr
                        key={p.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ 
                          opacity: 1, 
                          y: 0,
                          transition: { delay: index * 0.05, duration: 0.2 }
                        }}
                        className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                      >
                        <td className="text-center py-2.5 px-3 font-mono text-xs text-slate-600">{p.codeBarre}</td>
                        <td className="text-center py-2.5 px-3 font-medium text-slate-800">{p.nom}</td>
                        <td className="text-center py-2.5 px-3 text-slate-600">{p.prenom || "—"}</td>
                        <td className="text-center py-2.5 px-3">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                setBadgeEmployee({
                                  nom: p.nom,
                                  prenom: p.prenom || '',
                                  matricule: p.matricule || p.codeBarre,
                                  fonction: p.fonction || 'Agent Buanderie',
                                  service: etape?.nom || etape?.zone || '',
                                  photo: p.photo || null
                                });
                                setBadgeModalOpen(true);
                              }}
                              className="p-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-blue-600"
                              title={t('etapes.print_label')}
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleRemove(p)}
                              className="p-1.5 bg-red-50 hover:bg-red-100 rounded-lg transition-colors text-red-600"
                              title={t('etapes.remove')}
                            >
                              <UserMinus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ── Onglet Rendement ─────────────────────────────────────────── */}
        {activeTab === "stats" && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-slate-500">
                {statsData.reduce((s, x) => s + x.totalOperations, 0)} opérations · {statsData.length} agent
                {statsData.length > 1 ? "s" : ""}
              </p>
              <button
                onClick={chargerStats}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-slate-500"
                title={t('common.refresh')}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${statsLoading ? "animate-spin" : ""}`} />
              </button>
            </div>

            {statsLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-7 h-7 text-purple-500 animate-spin" />
              </div>
            ) : statsError ? (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs">
                {statsError}
              </div>
            ) : statsData.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <TrendingUp className="w-10 h-10 mx-auto opacity-30 mb-2" />
                <p className="text-sm font-medium">Aucune donnée de rendement</p>
                <p className="text-xs">Les statistiques apparaîtront après les premières opérations</p>
              </div>
            ) : (
              statsData
                .sort((a, b) => b.totalOperations - a.totalOperations)
                .map((stat, i) => (
                  <PersonnelStatCard key={stat.personnelId} stat={stat} rang={i + 1} />
                ))
            )}
          </div>
        )}
      </div>

      {/* Modal Ajout Personnel avec autocomplete */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setSelectedPersonnel(null);
          setSearchPersonnel("");
          setPersonnelSuggestions([]);
        }}
        title={t('etapes.add_personnel')}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {t('etapes.search_personnel')}
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchPersonnel}
                onChange={(e) => setSearchPersonnel(e.target.value)}
                placeholder={t('etapes.search_personnel_placeholder')}
                className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm"
                autoFocus
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500 animate-spin" />
              )}
            </div>

            {/* Suggestions */}
            {personnelSuggestions.length > 0 && (
              <div className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                {personnelSuggestions.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPersonnel(p)}
                    className={`w-full text-left px-4 py-2.5 hover:bg-purple-50 transition-colors border-b border-slate-100 last:border-0 ${
                      selectedPersonnel?.id === p.id ? 'bg-purple-50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-slate-800">{p.nom}</span>
                        {p.prenom && <span className="text-slate-600 ml-1">{p.prenom}</span>}
                      </div>
                      <span className="text-xs font-mono text-slate-400">{p.codeBarre}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {searchPersonnel.length >= 2 && personnelSuggestions.length === 0 && !isSearching && (
              <div className="mt-2 text-center py-4 text-sm text-slate-400 bg-slate-50 rounded-xl">
                {t('etapes.no_personnel_found')}
              </div>
            )}

            {selectedPersonnel && (
              <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-emerald-600" />
                  <span className="font-medium text-emerald-800">
                    {selectedPersonnel.nom} {selectedPersonnel.prenom || ''}
                  </span>
                  <span className="text-xs font-mono text-emerald-600 ml-2">
                    {selectedPersonnel.codeBarre}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddModal(false);
                setSelectedPersonnel(null);
                setSearchPersonnel("");
                setPersonnelSuggestions([]);
              }}
              disabled={isAdding}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleAddPersonnel}
              disabled={!selectedPersonnel || isAdding}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#0ca678]/30 rounded-[14px] text-sm font-bold text-[#0ca678] hover:bg-[#0ca678]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02]"
            >
              {isAdding ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4 mr-2" />
              )}
              {t('etapes.add')}
            </Button>
          </div>
        </div>
      </Modal>

      <BadgeModal
        isOpen={badgeModalOpen}
        onClose={() => setBadgeModalOpen(false)}
        employee={badgeEmployee}
      />
    </motion.div>
  );
}

// ─── MODAL Étape ──────────────────────────────────────────────────────────
function ModalEtape({ isOpen, onClose, onSave, etape, loading }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    nom: "",
    zone: "",
    categorie: ""
  });

  useEffect(() => {
    if (etape) {
      setFormData({
        nom: etape.nom || "",
        zone: etape.zone || "",
        categorie: etape.categorie || ""
      });
    } else {
      setFormData({ nom: "", zone: "", categorie: "" });
    }
  }, [etape]);

  const handleSubmit = () => {
    if (!formData.nom.trim()) {
      Swal.fire({
        icon: "warning",
        title: t('etapes.name_required'),
        text: t('etapes.name_required_text'),
        timer: 1500,
        showConfirmButton: false
      });
      return;
    }
    onSave(formData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={etape ? t('etapes.edit_step') : t('etapes.new_step')}
      size="md"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            {t('etapes.name')} *
          </label>
          <input
            type="text"
            value={formData.nom}
            onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
            placeholder={t('etapes.name_placeholder')}
            className="w-full h-10 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            {t('etapes.zone')}
          </label>
          <input
            type="text"
            value={formData.zone}
            onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
            placeholder={t('etapes.zone_placeholder')}
            className="w-full h-10 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            {t('etapes.category')}
          </label>
          <input
            type="text"
            value={formData.categorie}
            onChange={(e) => setFormData({ ...formData, categorie: e.target.value })}
            placeholder={t('etapes.category_placeholder')}
            className="w-full h-10 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
        <Button variant="outline" onClick={onClose} disabled={loading}>
          {t('common.cancel')}
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700 text-white font-semibold"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : null}
          {etape ? t('common.update') : t('common.create')}
        </Button>
      </div>
    </Modal>
  );
}

// ─── PAGE PRINCIPALE ──────────────────────────────────────────────────────
function EtapeListInner() {
  const { t } = useTranslation();
  const {
    etapes,
    loading,
    createNewEtape,
    updateExistingEtape,
    deleteExistingEtape,
    loadEtapes,
    loadPersonnels
  } = useEtape();

  const [searchTerm, setSearchTerm] = useState("");
  const [showModalEtape, setShowModalEtape] = useState(false);
  const [editingEtape, setEditingEtape] = useState(null);
  const [saving, setSaving] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedEtapeId, setSelectedEtapeId] = useState(null);
  const [selectedEtape, setSelectedEtape] = useState(null);

  const filteredEtapes = etapes.filter(e =>
    e.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.codeBarre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.categorie?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenPanel = async (etape) => {
    if (selectedEtapeId === etape.id && panelOpen) {
      setPanelOpen(false);
      setTimeout(() => {
        setSelectedEtapeId(null);
        setSelectedEtape(null);
      }, 300);
      return;
    }
    setSelectedEtapeId(etape.id);
    setSelectedEtape(etape);
    await loadPersonnels(etape.id);
    setPanelOpen(true);
  };

  const handleClosePanel = () => {
    setPanelOpen(false);
    setTimeout(() => {
      setSelectedEtapeId(null);
      setSelectedEtape(null);
    }, 300);
  };

  const handleEditEtape = (etape) => {
    setEditingEtape(etape);
    setShowModalEtape(true);
  };

  const handleSaveEtape = async (data) => {
    setSaving(true);
    try {
      if (editingEtape) {
        await updateExistingEtape(editingEtape.id, {
          ...data,
          codeBarre: editingEtape.codeBarre,
          ordre: editingEtape.ordre
        });
      } else {
        await createNewEtape(data);
      }
      setShowModalEtape(false);
      setEditingEtape(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEtape = async (id) => {
    const result = await Swal.fire({
      title: t('etapes.delete_step'),
      text: t('etapes.delete_step_text'),
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      confirmButtonText: t('etapes.delete_confirm'),
      cancelButtonText: t('common.cancel')
    });

    if (result.isConfirmed) {
      await deleteExistingEtape(id);
      if (selectedEtapeId === id) {
        handleClosePanel();
      }
    }
  };

  const refreshPanel = async () => {
    if (selectedEtapeId) {
      await loadPersonnels(selectedEtapeId);
    }
  };

  return (
    <div className="relative flex h-full gap-4">
      <motion.div 
        className="transition-all duration-500 ease-in-out"
        animate={{ 
          width: panelOpen ? '55%' : '100%',
          transition: { duration: 0.4, ease: "easeInOut" }
        }}
      >
        <div className="space-y-4">
          {/* En-tête */}
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
                background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                boxShadow: "0 4px 16px rgba(124, 58, 237, 0.25)"
              }}>
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <h1 style={{
                  fontSize: "28px",
                  fontWeight: 800,
                  color: "#0f172a",
                  margin: 0
                }}>
                  {t('etapes.title')}
                </h1>
                <p style={{
                  fontSize: "14px",
                  color: "#64748b",
                  margin: "2px 0 0 0"
                }}>
                  {t('etapes.subtitle')}
                </p>
              </div>
            </div>
          </div>

          {/* Barre d'outils */}
          <div className="flex flex-wrap items-center gap-3 bg-white/65 backdrop-blur-md p-4 rounded-[20px] border border-slate-200/50 shadow-[0_4px_20px_rgba(0,0,0,0.02)] mb-6">
            <button
              onClick={() => {
                setEditingEtape(null);
                setShowModalEtape(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#0ca678]/30 rounded-[14px] text-sm font-bold text-[#0ca678] hover:bg-[#0ca678]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" /> {t('etapes.new_step')}
            </button>

            <div style={{ width: "1px", height: "30px", background: "#e2e8f0", margin: "0 8px" }} />

            <button
              disabled={!selectedEtapeId}
              onClick={() => {
                if (selectedEtape) {
                  Swal.fire({
                    icon: "info",
                    title: t('etapes.print_ticket'),
                    text: `${t('etapes.print_ticket_text')} ${selectedEtape.nom}`,
                    timer: 1500,
                    showConfirmButton: false
                  });
                }
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-bold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Printer className="w-4 h-4" /> {t('etapes.ticket')}
            </button>

            <button
              disabled={!selectedEtapeId}
              onClick={() => {
                if (selectedEtape) {
                  Swal.fire({
                    icon: "info",
                    title: t('etapes.print_code'),
                    text: `${t('etapes.print_code_text')} ${selectedEtape.nom}`,
                    timer: 1500,
                    showConfirmButton: false
                  });
                }
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-sm font-bold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Barcode className="w-4 h-4" /> {t('etapes.code')}
            </button>

            <div style={{ width: "1px", height: "30px", background: "#e2e8f0", margin: "0 8px" }} />

            <button
              disabled={!selectedEtapeId}
              onClick={() => handleEditEtape(selectedEtape)}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-bold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Edit className="w-4 h-4" /> {t('common.edit')}
            </button>

            <button
              disabled={!selectedEtapeId}
              onClick={async () => {
                if (selectedEtapeId) {
                  const confirmed = await Swal.fire({
                    title: t('etapes.delete_step'),
                    text: t('etapes.delete_step_text'),
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonColor: "#dc2626",
                    cancelButtonColor: "#64748b",
                    confirmButtonText: t('etapes.delete_confirm'),
                    cancelButtonText: t('common.cancel'),
                  });
                  if (confirmed.isConfirmed) {
                    handleDeleteEtape(selectedEtapeId);
                  }
                }
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 text-sm font-bold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4" /> {t('common.delete')}
            </button>

            <button
              onClick={loadEtapes}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-all ml-auto"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> {t('common.refresh')}
            </button>
          </div>

          {/* Recherche */}
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder={t('etapes.search_placeholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm"
                />
              </div>
            </CardContent>
          </Card>

          {/* Tableau des étapes */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-slate-200 bg-slate-50/80">
                    <tr>
                      <th className="text-center py-3 px-4 text-sm font-medium text-slate-500 w-10"></th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-slate-500 w-12">#</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-slate-500">{t('etapes.step')}</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-slate-500">{t('etapes.barcode')}</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-slate-500">{t('etapes.zone')}</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-slate-500">{t('etapes.order')}</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-slate-500">{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={7}>
                          <LoadingSpinner />
                        </td>
                      </tr>
                    ) : filteredEtapes.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-slate-400">
                          <Package className="w-12 h-12 mx-auto opacity-30 mb-3" />
                          <p className="text-sm">{searchTerm ? t('etapes.no_match') : t('etapes.no_data')}</p>
                        </td>
                      </tr>
                    ) : (
                      filteredEtapes.map((etape, index) => (
                        <LigneEtape
                          key={etape.id}
                          etape={etape}
                          index={index}
                          isSelected={selectedEtapeId === etape.id}
                          onOpenPanel={handleOpenPanel}
                          onEdit={handleEditEtape}
                          onDelete={handleDeleteEtape}
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Panneau latéral des personnels */}
      <PersonnelPanel
        etape={selectedEtape}
        isOpen={panelOpen}
        onClose={handleClosePanel}
        onRefresh={refreshPanel}
      />

      {/* Modals */}
      <ModalEtape
        isOpen={showModalEtape}
        onClose={() => {
          setShowModalEtape(false);
          setEditingEtape(null);
        }}
        onSave={handleSaveEtape}
        etape={editingEtape}
        loading={saving}
      />
    </div>
  );
}

export default function EtapeList() {
  return (
    <EtapeProvider>
      <EtapeListInner />
    </EtapeProvider>
  );
}