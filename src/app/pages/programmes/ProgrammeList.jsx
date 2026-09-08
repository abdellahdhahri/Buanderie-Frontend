import React, { useState, useEffect, useContext } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  Eye, 
  Trash2, 
  Edit, 
  RefreshCw, 
  Search, 
  Filter, 
  X,
  Droplets,
  Wind,
  Thermometer,
  Clock,
  Gauge,
  Tag,
  Save,
  AlertCircle,
  CheckCircle,
  Loader2
} from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Modal } from "../../components/ui/modal";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import Swal from 'sweetalert2';
import { ProgrammeContext } from "../../contextes/ProgrammeContext";
import "./ProgrammeList.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

// ─── Composant ModeToggle ────────────────────────────────────────────────────
function ProgrammeModeToggle({ mode, onChange }) {
  const { t } = useTranslation();

  return (
    <div style={{ 
      display: "flex", 
      alignItems: "center", 
      gap: "8px", 
      padding: "6px", 
      background: "#f1f5f9", 
      borderRadius: "12px" 
    }}>
      <button
        onClick={() => onChange("LAVAGE")}
        style={{
          display: "flex", 
          alignItems: "center", 
          gap: "6px", 
          padding: "8px 20px", 
          borderRadius: "8px",
          border: "none", 
          cursor: "pointer", 
          fontWeight: 700, 
          fontSize: "13px", 
          transition: "all 0.2s",
          background: mode === "LAVAGE" ? "white" : "transparent",
          color: mode === "LAVAGE" ? "#0ea5e9" : "#94a3b8",
          boxShadow: mode === "LAVAGE" ? "0 2px 8px rgba(0,0,0,0.1)" : "none"
        }}
      >
        <Droplets size={16} /> {t('programmes.lavage')}
      </button>
      <button
        onClick={() => onChange("SECHAGE")}
        style={{
          display: "flex", 
          alignItems: "center", 
          gap: "6px", 
          padding: "8px 20px", 
          borderRadius: "8px",
          border: "none", 
          cursor: "pointer", 
          fontWeight: 700, 
          fontSize: "13px", 
          transition: "all 0.2s",
          background: mode === "SECHAGE" ? "#7c3aed" : "transparent",
          color: mode === "SECHAGE" ? "white" : "#94a3b8",
          boxShadow: mode === "SECHAGE" ? "0 2px 8px rgba(124,58,237,0.3)" : "none"
        }}
      >
        <Wind size={16} /> {t('programmes.sechage')}
      </button>
    </div>
  );
}

// ─── Icônes pour les catégories ─────────────────────────────────────────────
const CATEGORY_ICONS = {
  DRAP: "🛏️",
  TAIE_OREILLER: "🛌",
  SERVIETTE_BAIN: "🧖",
  SERVIETTE_VISAGE: "🧻",
  PEIGNOIR: "🧥",
  NAPPE: "🧶",
  SERVIETTE_TABLE: "🍽️",
  UNIFORME: "👔",
  AUTRE: "📦"
};

const CATEGORIES = [
  "DRAP",
  "TAIE_OREILLER",
  "SERVIETTE_BAIN",
  "SERVIETTE_VISAGE",
  "PEIGNOIR",
  "NAPPE",
  "SERVIETTE_TABLE",
  "UNIFORME",
  "AUTRE"
];

// ─── Composant Principal ────────────────────────────────────────────────────

export default function ProgrammeList() {
  const { t } = useTranslation();

  const { 
    programmesLavage,
    programmesSechage,
    loadProgrammesLavage,
    loadProgrammesSechage,
    createProgrammeLavage,
    updateProgrammeLavage,
    deleteProgrammeLavage,
    createProgrammeSechage,
    updateProgrammeSechage,
    deleteProgrammeSechage,
    isLoading,
    setLoading
  } = useContext(ProgrammeContext);

  const [mode, setMode] = useState("LAVAGE");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingProgramme, setEditingProgramme] = useState(null);
  const [formData, setFormData] = useState({
    nom: "",
    temperatureCelsius: "",
    dureeMinutes: "",
    vitesseEssorageRpm: "",
    niveauHumidite: "",
    description: "",
    categories: []
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadProgrammesLavage(),
        loadProgrammesSechage()
      ]);
    } catch (error) {
      console.error("Erreur chargement:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentProgrammes = () => {
    const programmes = mode === "LAVAGE" ? programmesLavage : programmesSechage;
    if (!searchTerm) return programmes;
    return programmes.filter(p => 
      p.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.categories?.some(cat => cat.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  const handleRowClick = (id) => {
    setSelectedId(prev => prev === id ? null : id);
  };

  const handleCreate = () => {
    setEditingProgramme(null);
    setFormData({
      nom: "",
      temperatureCelsius: "",
      dureeMinutes: "",
      vitesseEssorageRpm: "",
      niveauHumidite: "",
      description: "",
      categories: []
    });
    setShowModal(true);
  };

  const handleEdit = (programme) => {
    setEditingProgramme(programme);
    setFormData({
      nom: programme.nom || "",
      temperatureCelsius: programme.temperatureCelsius || "",
      dureeMinutes: programme.dureeMinutes || "",
      vitesseEssorageRpm: programme.vitesseEssorageRpm || "",
      niveauHumidite: programme.niveauHumidite || "",
      description: programme.description || "",
      categories: programme.categories || []
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: t('programmes.delete_confirm'),
      text: t('programmes.delete_confirm_text'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e03131',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: t('programmes.delete_confirm_yes'),
      cancelButtonText: t('programmes.delete_confirm_no')
    });

    if (result.isConfirmed) {
      try {
        if (mode === "LAVAGE") {
          await deleteProgrammeLavage(id);
        } else {
          await deleteProgrammeSechage(id);
        }
        await loadData();
        setSelectedId(null);
        Swal.fire(t('common.success'), t('programmes.delete_success'), 'success');
      } catch (error) {
        Swal.fire(t('common.error'), error.message || t('programmes.error_text'), 'error');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nom.trim()) {
      Swal.fire(t('common.error'), t('programmes.name_required'), 'error');
      return;
    }

    if (formData.categories.length === 0) {
      Swal.fire(t('common.error'), t('programmes.categories_required'), 'error');
      return;
    }

    const payload = {
      nom: formData.nom.trim(),
      temperatureCelsius: parseInt(formData.temperatureCelsius) || null,
      dureeMinutes: parseInt(formData.dureeMinutes) || null,
      description: formData.description || null,
      categories: formData.categories || []
    };

    if (mode === "LAVAGE") {
      payload.vitesseEssorageRpm = parseInt(formData.vitesseEssorageRpm) || null;
    } else {
      payload.niveauHumidite = parseInt(formData.niveauHumidite) || null;
    }

    try {
      if (editingProgramme) {
        if (mode === "LAVAGE") {
          await updateProgrammeLavage(editingProgramme.id, payload);
        } else {
          await updateProgrammeSechage(editingProgramme.id, payload);
        }
        Swal.fire(t('common.success'), t('programmes.update_success'), 'success');
      } else {
        if (mode === "LAVAGE") {
          await createProgrammeLavage(payload);
        } else {
          await createProgrammeSechage(payload);
        }
        Swal.fire(t('common.success'), t('programmes.create_success'), 'success');
      }
      
      await loadData();
      setShowModal(false);
      setEditingProgramme(null);
      setFormData({
        nom: "",
        temperatureCelsius: "",
        dureeMinutes: "",
        vitesseEssorageRpm: "",
        niveauHumidite: "",
        description: "",
        categories: []
      });
    } catch (error) {
      Swal.fire(t('common.error'), error.message || t('programmes.error_text'), 'error');
    }
  };

  const handleCategoryToggle = (category) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  const getCategoryDisplay = (category) => {
    return t(`categories.${category}`, category);
  };

  const getCategoryIcon = (category) => {
    return CATEGORY_ICONS[category] || "📦";
  };

  const getProgrammeBadge = (programme) => {
    const hasCategories = programme.categories && programme.categories.length > 0;
    return (
      <div className="flex flex-wrap gap-1 justify-center">
        {hasCategories ? (
          programme.categories.slice(0, 3).map((cat, i) => (
            <Badge key={i} variant="secondary" className="text-xs flex items-center gap-1">
              <span>{getCategoryIcon(cat)}</span>
              <span>{getCategoryDisplay(cat)}</span>
            </Badge>
          ))
        ) : (
          <span className="text-xs text-muted-foreground">{t('programmes.no_categories')}</span>
        )}
        {hasCategories && programme.categories.length > 3 && (
          <Badge variant="secondary" className="text-xs">
            +{programme.categories.length - 3}
          </Badge>
        )}
      </div>
    );
  };

  const currentProgrammes = getCurrentProgrammes();
  const selectedProgramme = currentProgrammes.find(p => p.id === selectedId);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
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
              background: mode === "LAVAGE" 
                ? "linear-gradient(135deg, #06b6d4, #0891b2)" 
                : "linear-gradient(135deg, #f59e0b, #d97706)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              boxShadow: mode === "LAVAGE"
                ? "0 4px 16px rgba(6, 182, 212, 0.25)"
                : "0 4px 16px rgba(245, 158, 11, 0.25)"
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
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
                <circle cx="12" cy="14" r="1" />
                <circle cx="16" cy="14" r="1" />
                <circle cx="8" cy="14" r="1" />
                <circle cx="12" cy="18" r="1" />
                <circle cx="16" cy="18" r="1" />
                <circle cx="8" cy="18" r="1" />
              </svg>
            </div>
            <div>
              <h1 style={{
                fontSize: "28px",
                fontWeight: 800,
                color: "#0f172a",
                margin: 0
              }}>
                {mode === "LAVAGE" ? t('programmes.title_lavage') : t('programmes.title_sechage')}
              </h1>
              <p style={{
                fontSize: "14px",
                color: "#64748b",
                margin: "2px 0 0 0"
              }}>
                {mode === "LAVAGE" 
                  ? t('programmes.subtitle_lavage')
                  : t('programmes.subtitle_sechage')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mode Toggle & Actions */}
      <div className="flex flex-wrap items-center gap-3 bg-white/65 backdrop-blur-md p-4 rounded-[20px] border border-slate-200/50 shadow-[0_4px_20px_rgba(0,0,0,0.02)] mb-6">
        <ProgrammeModeToggle mode={mode} onChange={setMode} />
        
        <div style={{ width: "1px", height: "30px", background: "#e2e8f0", margin: "0 8px" }} />

        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#0ca678]/30 rounded-[14px] text-sm font-bold text-[#0ca678] hover:bg-[#0ca678]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" /> {t('programmes.new')}
        </button>

        <button
          onClick={() => loadData()}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-300 rounded-[14px] text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
        >
          <RefreshCw className="w-4 h-4" /> {t('programmes.refresh')}
        </button>

        <div className="flex-1" />

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('programmes.search_placeholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64 h-10 pl-10 pr-4 rounded-lg border border-input bg-input-background focus:outline-none focus:ring-2 focus:ring-ring text-sm"
          />
        </div>
      </div>

      {/* Tableau */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="param-table">
              <thead>
                <tr>
                  <th className="text-center py-3 px-4">{t('programmes.id')}</th>
                  <th className="text-center py-3 px-4">{t('programmes.name')}</th>
                  <th className="text-center py-3 px-4">{t('programmes.temperature_label')}</th>
                  <th className="text-center py-3 px-4">{t('programmes.duration_label')}</th>
                  {mode === "LAVAGE" ? (
                    <th className="text-center py-3 px-4">{t('programmes.spin_label')}</th>
                  ) : (
                    <th className="text-center py-3 px-4">{t('programmes.humidity_label')}</th>
                  )}
                  <th className="text-center py-3 px-4">{t('programmes.categories_label')}</th>
                  <th className="text-center py-3 px-4 actions-th">{t('programmes.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-muted-foreground">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                      {t('programmes.loading')}
                    </td>
                  </tr>
                ) : currentProgrammes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? t('programmes.no_match') : t('programmes.no_data')}
                    </td>
                  </tr>
                ) : (
                  currentProgrammes.map((programme) => {
                    const isSelected = selectedId === programme.id;
                    return (
                      <tr
                        key={programme.id}
                        onClick={() => handleRowClick(programme.id)}
                        className={isSelected ? "expanded" : ""}
                        style={{ cursor: "pointer" }}
                      >
                        <td className="text-center py-3 px-4">
                          <span className="code-badge">{programme.id}</span>
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className="font-semibold text-slate-800">{programme.nom}</span>
                          {programme.description && (
                            <p className="text-xs text-slate-400 truncate max-w-[200px]">
                              {programme.description}
                            </p>
                          )}
                        </td>
                        <td className="text-center py-3 px-4">
                          <div className="flex items-center justify-center gap-1.5">
                            <Thermometer className="w-4 h-4 text-orange-500" />
                            <span className="font-medium">
                              {programme.temperatureCelsius || "—"}°C
                            </span>
                          </div>
                        </td>
                        <td className="text-center py-3 px-4">
                          <div className="flex items-center justify-center gap-1.5">
                            <Clock className="w-4 h-4 text-blue-500" />
                            <span className="font-medium">
                              {programme.dureeMinutes || "—"} min
                            </span>
                          </div>
                        </td>
                        <td className="text-center py-3 px-4">
                          {mode === "LAVAGE" ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <Gauge className="w-4 h-4 text-purple-500" />
                              <span className="font-medium">
                                {programme.vitesseEssorageRpm || "—"} RPM
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1.5">
                              <Gauge className="w-4 h-4 text-cyan-500" />
                              <span className="font-medium">
                                {programme.niveauHumidite || "—"}%
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="text-center py-3 px-4">{getProgrammeBadge(programme)}</td>
                        <td className="text-center py-3 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(programme);
                              }}
                              className="text-[#0ca678] hover:text-[#099268] font-semibold text-sm flex items-center gap-1.5 hover:underline"
                            >
                              <Edit className="w-4 h-4" /> {t('programmes.edit')}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(programme.id);
                              }}
                              className="text-[#e03131] hover:text-[#c92a2a] font-semibold text-sm flex items-center gap-1.5 hover:underline"
                            >
                              <Trash2 className="w-4 h-4" /> {t('programmes.delete')}
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

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('programmes.stats_total')}</p>
                <p className="text-2xl font-bold">{currentProgrammes.length}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                {mode === "LAVAGE" ? <Droplets className="w-5 h-5 text-blue-600" /> : <Wind className="w-5 h-5 text-purple-600" />}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('programmes.stats_avg_temp')}</p>
                <p className="text-2xl font-bold">
                  {currentProgrammes.length > 0 
                    ? Math.round(currentProgrammes.reduce((acc, p) => acc + (p.temperatureCelsius || 0), 0) / currentProgrammes.length)
                    : 0}°C
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <Thermometer className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('programmes.stats_avg_duration')}</p>
                <p className="text-2xl font-bold">
                  {currentProgrammes.length > 0 
                    ? Math.round(currentProgrammes.reduce((acc, p) => acc + (p.dureeMinutes || 0), 0) / currentProgrammes.length)
                    : 0} min
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('programmes.stats_categories')}</p>
                <p className="text-2xl font-bold">
                  {new Set(currentProgrammes.flatMap(p => p.categories || [])).size}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Tag className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal Création/Édition */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingProgramme(null);
        }}
        title={editingProgramme 
          ? (mode === "LAVAGE" ? t('programmes.edit_lavage') : t('programmes.edit_sechage'))
          : (mode === "LAVAGE" ? t('programmes.new_lavage') : t('programmes.new_sechage'))}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('programmes.name')} <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              placeholder={t('programmes.name_placeholder')}
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value.toUpperCase() })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('programmes.temperature')}
              </label>
              <Input
                type="number"
                placeholder={t('programmes.temperature_placeholder')}
                min="0"
                max="100"
                value={formData.temperatureCelsius}
                onChange={(e) => setFormData({ ...formData, temperatureCelsius: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('programmes.duration')}
              </label>
              <Input
                type="number"
                placeholder={t('programmes.duration_placeholder')}
                min="1"
                value={formData.dureeMinutes}
                onChange={(e) => setFormData({ ...formData, dureeMinutes: e.target.value })}
              />
            </div>
          </div>

          {mode === "LAVAGE" ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('programmes.spin_speed')}
              </label>
              <Input
                type="number"
                placeholder={t('programmes.spin_speed_placeholder')}
                min="0"
                value={formData.vitesseEssorageRpm}
                onChange={(e) => setFormData({ ...formData, vitesseEssorageRpm: e.target.value })}
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('programmes.humidity')}
              </label>
              <Input
                type="number"
                placeholder={t('programmes.humidity_placeholder')}
                min="0"
                max="100"
                value={formData.niveauHumidite}
                onChange={(e) => setFormData({ ...formData, niveauHumidite: e.target.value })}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('programmes.description')}
            </label>
            <textarea
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
              placeholder={t('programmes.description_placeholder')}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('programmes.categories')} <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {CATEGORIES.map((category) => {
                const isSelected = formData.categories.includes(category);
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => handleCategoryToggle(category)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isSelected
                        ? "bg-[#0ca678] text-white shadow-sm border-2 border-[#0ca678]"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-transparent"
                    }`}
                  >
                    <span>{getCategoryIcon(category)}</span>
                    <span>{getCategoryDisplay(category)}</span>
                    {isSelected && <CheckCircle className="w-4 h-4 ml-auto" />}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {t('programmes.categories_placeholder')}
            </p>
            {formData.categories.length === 0 && (
              <p className="text-xs text-red-500 mt-1">
                ⚠️ {t('programmes.categories_error')}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                setShowModal(false);
                setEditingProgramme(null);
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit">
              <Save className="w-4 h-4 mr-2" />
              {editingProgramme ? t('programmes.save') : t('programmes.create')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}