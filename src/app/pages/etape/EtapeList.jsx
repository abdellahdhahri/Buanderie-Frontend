// pages/Management/EtapeList.js
import React, { useState, useEffect, useRef, useCallback } from "react";
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
  Loader2
} from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Modal } from "../../components/ui/modal";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import { useEtape, EtapeProvider } from "../../contextes/EtapeContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

// ─── Composant de chargement ──────────────────────────────────────────────
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
    </div>
  );
}

// ─── Ligne Etape ──────────────────────────────────────────────────────────
function LigneEtape({ etape, index, isSelected, onOpenPanel, onEdit, onDelete }) {
  return (
    <tr className={`border-b border-slate-100 hover:bg-slate-50/80 transition-colors ${isSelected ? 'bg-purple-50' : ''}`}>
      <td className="py-3 px-4 text-center">
        <button
          onClick={() => onOpenPanel(etape)}
          className={`p-1.5 rounded-lg transition-all duration-200 ${
            isSelected ? 'bg-purple-100 text-purple-600' : 'hover:bg-purple-100 text-slate-400 hover:text-purple-500'
          }`}
          title={isSelected ? "Fermer" : "Voir les personnels"}
        >
          {isSelected ? (
            <ChevronLeft className="w-5 h-5" />
          ) : (
            <ChevronRight className="w-5 h-5" />
          )}
        </button>
      </td>
      <td className="py-3 px-4 text-center text-sm text-slate-500 font-medium">
        {index + 1}
      </td>
      <td className="py-3 px-4 text-center">
        <div className="font-medium text-slate-800">{etape.nom}</div>
      </td>
      <td className="py-3 px-4 text-center">
        <code className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
          {etape.codeBarre}
        </code>
      </td>
      <td className="py-3 px-4 text-center">
        <Badge className="bg-blue-50 text-blue-700 border-blue-200">
          {etape.zone || "Non défini"}
        </Badge>
      </td>
      <td className="py-3 px-4 text-center">
        <Badge className="bg-slate-50 text-slate-600 border-slate-200">
          Ordre {etape.ordre || "—"}
        </Badge>
      </td>
      <td className="py-3 px-4 text-center">
        <div className="flex items-center justify-center gap-1.5">
          <button
            onClick={() => onEdit(etape)}
            className="p-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-blue-600"
            title="Modifier"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(etape.id)}
            className="p-1.5 bg-red-50 hover:bg-red-100 rounded-lg transition-colors text-red-600"
            title="Supprimer"
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
  const { personnels, associations, addPersonnelToEtape, removePersonnelFromEtape, loading } = useEtape();
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchPersonnel, setSearchPersonnel] = useState("");
  const [personnelSuggestions, setPersonnelSuggestions] = useState([]);
  const [selectedPersonnel, setSelectedPersonnel] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const searchTimeoutRef = useRef(null);

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

      if (response.ok) {
        const data = await response.json();
        const filtered = data.filter(p => 
          p.nom?.toLowerCase().includes(query.toLowerCase()) ||
          p.prenom?.toLowerCase().includes(query.toLowerCase()) ||
          p.codeBarre?.toLowerCase().includes(query.toLowerCase()) ||
          p.matricule?.toLowerCase().includes(query.toLowerCase())
        );
        setPersonnelSuggestions(filtered.slice(0, 20));
      }
    } catch (error) {
      console.error("Erreur recherche personnels:", error);
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
        title: "Sélectionnez un personnel",
        text: "Veuillez sélectionner un personnel dans la liste",
        timer: 1500,
        showConfirmButton: false
      });
      return;
    }

    setIsAdding(true);
    try {
      await addPersonnelToEtape(etape?.id, selectedPersonnel.codeBarre);
      setSelectedPersonnel(null);
      setSearchPersonnel("");
      setShowAddModal(false);
      if (onRefresh) onRefresh();
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemove = async (personnel) => {
    const result = await Swal.fire({
      title: "Retirer le personnel",
      text: `Voulez-vous retirer ${personnel.nom} ${personnel.prenom || ''} de cette étape ?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Oui, retirer",
      cancelButtonText: "Annuler"
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
                {etape.categorie || "Non catégorisé"} • {etape.zone || "N/A"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-purple-200 text-purple-700 border-purple-300 font-medium px-3 py-1">
              {personnels.length} personnel{personnels.length > 1 ? 's' : ''}
            </Badge>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-purple-200 rounded-lg transition-colors text-slate-500 hover:text-slate-700"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="p-4 overflow-y-auto h-[calc(100%-80px)]">
        {/* Barre d'outils */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => {
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#0ca678]/30 rounded-[14px] text-sm font-bold text-[#0ca678] hover:bg-[#0ca678]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" /> Ajouter
          </button>

          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher un personnel..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-9 pl-10 pr-3 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
          </div>

          <button
            onClick={onRefresh}
            className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors text-slate-500 hover:text-slate-700"
            title="Actualiser"
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
            <p className="text-sm font-medium">Aucun personnel associé</p>
            <p className="text-xs">Cliquez sur "Ajouter" pour en associer</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-center py-2.5 px-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Code</th>
                  <th className="text-center py-2.5 px-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Nom</th>
                  <th className="text-center py-2.5 px-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Prénom</th>
                  <th className="text-center py-2.5 px-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Actions</th>
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
                    <td className="py-2.5 px-3 text-center font-mono text-xs text-slate-600">{p.codeBarre}</td>
                    <td className="py-2.5 px-3 text-center font-medium text-slate-800">{p.nom}</td>
                    <td className="py-2.5 px-3 text-center text-slate-600">{p.prenom || "—"}</td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            Swal.fire({
                              icon: "info",
                              title: "Étiquette",
                              text: `Impression de l'étiquette pour ${p.nom} ${p.prenom || ''}`,
                              timer: 1500,
                              showConfirmButton: false
                            });
                          }}
                          className="p-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-blue-600"
                          title="Imprimer l'étiquette"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleRemove(p)}
                          className="p-1.5 bg-red-50 hover:bg-red-100 rounded-lg transition-colors text-red-600"
                          title="Retirer"
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
        title="Ajouter un personnel"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Rechercher un personnel
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchPersonnel}
                onChange={(e) => setSearchPersonnel(e.target.value)}
                placeholder="Tapez le nom, prénom ou code..."
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
                Aucun personnel trouvé
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
              Annuler
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
              Ajouter
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}

// ─── MODAL Étape ──────────────────────────────────────────────────────────
function ModalEtape({ isOpen, onClose, onSave, etape, loading }) {
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
        title: "Nom requis",
        text: "Veuillez saisir un nom",
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
      title={etape ? "Modifier l'étape" : "Nouvelle étape"}
      size="md"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Nom *
          </label>
          <input
            type="text"
            value={formData.nom}
            onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
            placeholder="Nom de l'étape..."
            className="w-full h-10 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Zone
          </label>
          <input
            type="text"
            value={formData.zone}
            onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
            placeholder="Zone (ex: BLANC, INFECTE...)"
            className="w-full h-10 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Catégorie
          </label>
          <input
            type="text"
            value={formData.categorie}
            onChange={(e) => setFormData({ ...formData, categorie: e.target.value })}
            placeholder="Catégorie (ex: DRAP, BLOUSE...)"
            className="w-full h-10 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
        <Button variant="outline" onClick={onClose} disabled={loading}>
          Annuler
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700 text-white font-semibold"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : null}
          {etape ? "Mettre à jour" : "Créer"}
        </Button>
      </div>
    </Modal>
  );
}

// ─── PAGE PRINCIPALE ──────────────────────────────────────────────────────
function EtapeListInner() {
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
      title: "Supprimer l'étape",
      text: "Cette action est irréversible. Voulez-vous continuer ?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Oui, supprimer",
      cancelButtonText: "Annuler"
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
                  Gestion des Étapes
                </h1>
                <p style={{
                  fontSize: "14px",
                  color: "#64748b",
                  margin: "2px 0 0 0"
                }}>
                  Gérez les étapes du processus et leurs personnels associés
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
              <Plus className="w-4 h-4" /> Nouvelle Étape
            </button>

            <div style={{ width: "1px", height: "30px", background: "#e2e8f0", margin: "0 8px" }} />

            <button
              disabled={!selectedEtapeId}
              onClick={() => {
                if (selectedEtape) {
                  Swal.fire({
                    icon: "info",
                    title: "Impression du ticket",
                    text: `Ticket pour l'étape ${selectedEtape.nom}`,
                    timer: 1500,
                    showConfirmButton: false
                  });
                }
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-bold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Printer className="w-4 h-4" /> Ticket
            </button>

            <button
              disabled={!selectedEtapeId}
              onClick={() => {
                if (selectedEtape) {
                  Swal.fire({
                    icon: "info",
                    title: "Impression du code",
                    text: `Code pour l'étape ${selectedEtape.nom}`,
                    timer: 1500,
                    showConfirmButton: false
                  });
                }
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-sm font-bold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Barcode className="w-4 h-4" /> Code
            </button>

            <div style={{ width: "1px", height: "30px", background: "#e2e8f0", margin: "0 8px" }} />

            <button
              disabled={!selectedEtapeId}
              onClick={() => handleEditEtape(selectedEtape)}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-bold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Edit className="w-4 h-4" /> Modifier
            </button>

            <button
              disabled={!selectedEtapeId}
              onClick={async () => {
                if (selectedEtapeId) {
                  const confirmed = await Swal.fire({
                    title: "Es-tu sûr?",
                    text: "Vous ne pourrez pas annuler cette action!",
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonColor: "#dc2626",
                    cancelButtonColor: "#64748b",
                    confirmButtonText: "Oui, supprimer!",
                    cancelButtonText: "Annuler",
                  });
                  if (confirmed.isConfirmed) {
                    handleDeleteEtape(selectedEtapeId);
                  }
                }
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 text-sm font-bold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4" /> Supprimer
            </button>

            <button
              onClick={loadEtapes}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-all ml-auto"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Actualiser
            </button>
          </div>

          {/* Recherche */}
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, code barre ou catégorie..."
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
                      <th className="text-center py-3 px-4 text-sm font-medium text-slate-500">Étape</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-slate-500">Code Barre</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-slate-500">Zone</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-slate-500">Ordre</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-slate-500">Actions</th>
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
                          <p className="text-sm">{searchTerm ? "Aucune étape correspondante" : "Aucune étape trouvée"}</p>
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