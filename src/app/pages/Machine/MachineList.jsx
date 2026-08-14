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
  Wrench,
  MapPin,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock
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

const TYPES_MACHINE = [
  { value: "LAVEUR", label: "Laveur" },
  { value: "SECHEUR", label: "Sécheur" },
  { value: "LAVEUR_SECHEUR", label: "Laveur/Sécheur" }
];

const ETATS_MACHINE = [
  { value: "DISPONIBLE", label: "Disponible", color: "#10b981", bg: "#d1fae5" },
  { value: "EN_COURS", label: "En cours", color: "#3b82f6", bg: "#dbeafe" },
  { value: "EN_MAINTENANCE", label: "En maintenance", color: "#f59e0b", bg: "#fef3c7" },
  { value: "HORS_SERVICE", label: "Hors service", color: "#ef4444", bg: "#fee2e2" }
];

const CATEGORIES_MACHINE = [
  { value: "LINGES_INFECTE", label: "linges infectee" },
  { value: "LINGES_NORMAL", label: "linges normal " }
];

const TYPE_COLORS = {
  LAVEUR: { bg: "#eff6ff", color: "#2563eb", label: "🧺 Laveur" },
  SECHEUR: { bg: "#fef3c7", color: "#d97706", label: "🌬️ Sécheur" },
  LAVEUR_SECHEUR: { bg: "#f5f3ff", color: "#7c3aed", label: "🧺🌬️ Laveur/Sécheur" }
};

export default function MachineList() {
  const [machines, setMachines] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedMachineDetail, setSelectedMachineDetail] = useState(null);

  const [newRec, setNewRec] = useState({
    reference: "",
    type: "",
    marque: "",
    categorie: "",
    capaciteKg: "",
    code: "",
    etat: "DISPONIBLE",
    localisation: ""
  });

  const fetchMachines = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/machines`);
      if (response.ok) {
        const data = await response.json();
        setMachines(data);
      }
    } catch (err) {
      console.error("Erreur réseau:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMachines();
  }, []);

  const handleOpenCreateModal = () => {
    setSelectedMachine(null);
    setNewRec({
      reference: "",
      type: "",
      marque: "",
      categorie: "",
      capaciteKg: "",
      code: "",
      etat: "DISPONIBLE",
      localisation: ""
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (machine) => {
    setSelectedMachine(machine);
    setNewRec({
      reference: machine.reference || "",
      type: machine.type || "",
      marque: machine.marque || "",
      categorie: machine.categorie || "",
      capaciteKg: machine.capaciteKg || "",
      code: machine.code || "",
      etat: machine.etat || "DISPONIBLE",
      localisation: machine.localisation || ""
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!newRec.reference || newRec.reference.trim() === "") {
      Swal.fire({
        title: "⚠️ Référence requise",
        text: "Veuillez saisir une référence.",
        icon: "warning",
      });
      return;
    }

    if (!newRec.type) {
      Swal.fire({
        title: "⚠️ Type requis",
        text: "Veuillez sélectionner un type.",
        icon: "warning",
      });
      return;
    }

    if (!newRec.marque || newRec.marque.trim() === "") {
      Swal.fire({
        title: "⚠️ Marque requise",
        text: "Veuillez saisir une marque.",
        icon: "warning",
      });
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        reference: newRec.reference.trim(),
        type: newRec.type,
        marque: newRec.marque.trim(),
        categorie: newRec.categorie || null,
        capaciteKg: parseFloat(newRec.capaciteKg) || 0,
        code: newRec.code?.trim() || undefined,
        etat: newRec.etat || "DISPONIBLE",
        localisation: newRec.localisation?.trim() || null
      };

      const url = selectedMachine 
        ? `${API_URL}/api/machines/${selectedMachine.id}`
        : `${API_URL}/api/machines`;
      
      const method = selectedMachine ? "PUT" : "POST";

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
      
      if (selectedMachine) {
        setMachines((prev) => prev.map((r) => (r.id === data.id ? data : r)));
        Swal.fire({
          title: "✅ Modifié!",
          text: "Machine mise à jour avec succès.",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        setMachines((prev) => [data, ...prev]);
        Swal.fire({
          title: "✅ Créé!",
          text: "Nouvelle machine créée avec succès.",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
      }

      setIsModalOpen(false);
      fetchMachines();

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
      text: "Cette action supprimera la machine.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Oui, supprimer!",
      cancelButtonText: "Annuler",
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`${API_URL}/api/machines/${id}`, {
          method: "DELETE",
        });
        if (response.ok) {
          setMachines((prev) => prev.filter((r) => r.id !== id));
          if (selectedId === id) {
            setSelectedId(null);
          }
          Swal.fire({
            title: "✅ Supprimé!",
            text: "Machine supprimée avec succès.",
            icon: "success",
            timer: 1500,
            showConfirmButton: false,
          });
          fetchMachines();
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

  const handleRowClick = (id) => {
    setSelectedId((prev) => (prev === id ? null : id));
  };

  const handleDetail = (machine) => {
    setSelectedMachineDetail(machine);
    setShowDetailModal(true);
  };

  const detectFormat = (value) => {
    if (!value) return "code128";
    const cleanValue = value.replace(/\s+/g, "");
    if (/^\d{13}$/.test(cleanValue)) return "ean13";
    if (/^\d{8}$/.test(cleanValue)) return "ean8";
    if (/^\d{12}$/.test(cleanValue)) return "upc";
    return "code128";
  };

  const handlePrintCode = (machine) => {
    if (!machine) return;
    
    const code = machine.code || machine.reference;
    const format = detectFormat(code);
    
    printJS({
      printable: `
        <div style="width:60mm; padding:3mm; font-family:'Courier New',monospace; background:white; text-align:center;">
          <div style="border-bottom:1px solid #ddd; padding-bottom:2mm; margin-bottom:2mm;">
            <div style="font-size:10pt; font-weight:bold; color:#1a1a1a;">CODE MACHINE</div>
            <div style="font-size:8pt; color:#666;">${machine.type || 'N/A'} - ${machine.marque}</div>
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
            ${machine.reference}
          </div>
          
          <div style="font-size:8pt; color:#666; margin-top:2mm; border-top:1px solid #ddd; padding-top:2mm;">
            <div>📦 ${machine.categorie || 'N/A'} · ${machine.capaciteKg || 0} kg</div>
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
      documentTitle: `Code_Machine_${machine.code || machine.id}`,
      css: `
        @page { 
          size: 60mm 45mm;
          margin: 0;
        }
      `
    });
  };

  const filteredMachines = machines.filter((r) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      r.reference?.toLowerCase().includes(term) ||
      r.code?.toLowerCase().includes(term) ||
      r.marque?.toLowerCase().includes(term) ||
      r.type?.toLowerCase().includes(term) ||
      r.localisation?.toLowerCase().includes(term)
    );
  });

  const getEtatBadge = (etat) => {
    const config = ETATS_MACHINE.find(e => e.value === etat) || { color: "#64748b", bg: "#f1f5f9", label: etat };
    const icons = {
      DISPONIBLE: <CheckCircle className="w-3 h-3" />,
      EN_COURS: <Clock className="w-3 h-3" />,
      EN_MAINTENANCE: <Wrench className="w-3 h-3" />,
      HORS_SERVICE: <AlertCircle className="w-3 h-3" />
    };
    return (
      <Badge 
        style={{ 
          background: config.bg, 
          color: config.color,
          border: `1px solid ${config.color}30`,
          display: "flex",
          alignItems: "center",
          gap: "4px"
        }}
      >
        {icons[etat] || null}
        {config.label}
      </Badge>
    );
  };

  const getTypeBadge = (type) => {
    const config = TYPE_COLORS[type] || { bg: "#f1f5f9", color: "#64748b", label: type };
    return (
      <Badge 
        style={{ 
          background: config.bg, 
          color: config.color,
          border: `1px solid ${config.color}30`
        }}
      >
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="relative flex h-full gap-4">
      <motion.div 
        className="transition-all duration-500 ease-in-out w-full"
      >
        <div className="space-y-4">
          <div className="page-header" style={{ marginBottom: 0, textAlign: "left" }}>
            <h1 className="text-3xl font-extrabold" style={{ marginBottom: "4px" }}>
              ⚙️ Gestion des Machines
            </h1>
            <p className="text-sm text-slate-500" style={{ color: "#166d7c" }}>
              Gestion complète des machines et impression des codes
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 bg-white/65 backdrop-blur-md p-4 rounded-[20px] border border-slate-200/50 shadow-[0_4px_20px_rgba(0,0,0,0.02)] mb-6">
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#0ca678]/30 rounded-[14px] text-sm font-bold text-[#0ca678] hover:bg-[#0ca678]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" /> Nouvelle Machine
            </button>

            <div style={{ width: "1px", height: "30px", background: "#e2e8f0", margin: "0 8px" }} />

            <button
              disabled={!selectedId}
              onClick={() => {
                if (selectedId) {
                  const machine = machines.find(m => m.id === selectedId);
                  if (machine) handleDetail(machine);
                }
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#006f94]/30 rounded-[14px] text-sm font-bold text-[#006f94] hover:bg-[#006f94]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
            >
              <Eye className="w-4 h-4 stroke-[2.5]" /> Détails
            </button>

            <button
              disabled={!selectedId}
              onClick={() => {
                if (selectedId) {
                  const machine = machines.find(m => m.id === selectedId);
                  if (machine) handlePrintCode(machine);
                }
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#8b5cf6]/30 rounded-[14px] text-sm font-bold text-[#8b5cf6] hover:bg-[#8b5cf6]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
            >
              <Barcode className="w-4 h-4 stroke-[2.5]" /> Code
            </button>

            <button
              disabled={!selectedId}
              onClick={() => handleOpenEditModal(machines.find(m => m.id === selectedId))}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#e67700]/30 rounded-[14px] text-sm font-bold text-[#e67700] hover:bg-[#e67700]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
            >
              <Edit className="w-4 h-4 stroke-[2.5]" /> Modifier
            </button>

            <button
              disabled={!selectedId}
              onClick={async () => {
                if (selectedId) {
                  const confirmed = await Swal.fire({
                    title: "Es-tu sûr?",
                    text: "Cette action supprimera la machine.",
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonColor: "#d33",
                    cancelButtonColor: "#3085d6",
                    confirmButtonText: "Oui, supprimer!",
                    cancelButtonText: "Annuler",
                  });
                  if (confirmed.isConfirmed) {
                    deleteRec(selectedId);
                  }
                }
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#e03131]/30 rounded-[14px] text-sm font-bold text-[#e03131] hover:bg-[#e03131]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
            >
              <Trash2 className="w-4 h-4 stroke-[2.5]" /> Supprimer
            </button>

            <button
              onClick={fetchMachines}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-300 rounded-[14px] text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> Actualiser
            </button>
          </div>

          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Rechercher par référence, code, marque ou type..."
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
                      <th className="text-left py-3 px-4 text-sm font-medium">Code</th>
                      <th className="text-left py-3 px-4 text-sm font-medium">Référence</th>
                      <th className="text-left py-3 px-4 text-sm font-medium">Type</th>
                      <th className="text-left py-3 px-4 text-sm font-medium">Marque</th>
                      <th className="text-left py-3 px-4 text-sm font-medium">Capacité</th>
                      <th className="text-left py-3 px-4 text-sm font-medium">État</th>
                      <th className="text-left py-3 px-4 text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-muted-foreground">
                          <div className="flex items-center justify-center gap-2">
                            <svg className="animate-spin w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Chargement...
                          </div>
                        </td>
                      </tr>
                    ) : filteredMachines.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-muted-foreground">
                          {searchTerm ? "Aucune machine correspondante" : "Aucune machine trouvée"}
                        </td>
                      </tr>
                    ) : (
                      filteredMachines.map((machine) => (
                        <tr
                          key={machine.id}
                          onClick={() => handleRowClick(machine.id)}
                          className={`border-b border-border hover:bg-accent/50 transition-colors cursor-pointer ${selectedId === machine.id ? 'bg-blue-50' : ''}`}
                        >
                          <td className="py-3 px-4">
                            <div className="font-mono text-sm font-medium text-blue-600">
                              {machine.code || machine.reference}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium">{machine.reference}</div>
                          </td>
                          <td className="py-3 px-4">
                            {getTypeBadge(machine.type)}
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm">{machine.marque}</span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Weight className="w-4 h-4 text-slate-400" />
                              <span className="font-medium">{machine.capaciteKg || 0} kg</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {getEtatBadge(machine.etat)}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePrintCode(machine);
                                }}
                                className="p-2 hover:bg-accent rounded-lg transition-colors"
                                title="Imprimer le code"
                              >
                                <Barcode className="w-4 h-4 text-[#e67700]" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEditModal(machine);
                                }}
                                className="p-2 hover:bg-accent rounded-lg transition-colors"
                                title="Modifier"
                              >
                                <Edit className="w-4 h-4 text-[#006f94]" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteRec(machine.id);
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

      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={`Détails de la machine - ${selectedMachineDetail?.reference || 'N/A'}`}
        size="lg"
      >
        {selectedMachineDetail && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ID</label>
              <Input value={selectedMachineDetail.id} disabled />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Code</label>
              <Input value={selectedMachineDetail.code || "-"} disabled />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Référence</label>
              <Input value={selectedMachineDetail.reference} disabled />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <div className="mt-1">{getTypeBadge(selectedMachineDetail.type)}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Marque</label>
              <Input value={selectedMachineDetail.marque} disabled />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
              <Input value={selectedMachineDetail.categorie || "-"} disabled />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Capacité</label>
              <Input value={`${selectedMachineDetail.capaciteKg || 0} kg`} disabled />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">État</label>
              <div className="mt-1">{getEtatBadge(selectedMachineDetail.etat)}</div>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Localisation</label>
              <div className="flex items-center gap-2 p-2 rounded-lg border border-input bg-slate-50">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span>{selectedMachineDetail.localisation || "Non définie"}</span>
              </div>
            </div>
          </div>
        )}
        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="outline"
            onClick={() => {
              if (selectedMachineDetail) handlePrintCode(selectedMachineDetail);
            }}
          >
            <Barcode className="w-4 h-4 mr-2" /> Imprimer code
          </Button>
          <Button onClick={() => setShowDetailModal(false)}>
            Fermer
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedMachine ? `Modifier la machine #${selectedMachine.id}` : "Nouvelle Machine"}
        size="lg"
      >
        <form onSubmit={handleSave}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input
                label="Référence *"
                value={newRec.reference}
                onChange={(e) =>
                  setNewRec({ ...newRec, reference: e.target.value })
                }
                placeholder="ex: M-001"
                required
              />
            </div>

            <div>
              <Input
                label="Code"
                value={newRec.code}
                onChange={(e) =>
                  setNewRec({ ...newRec, code: e.target.value.toUpperCase() })
                }
                placeholder="Généré automatiquement"
                disabled={!!selectedMachine}
              />
              <p className="text-xs text-slate-400 mt-1">
                {selectedMachine ? "Le code ne peut pas être modifié" : "Laissez vide pour génération automatique"}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Type *</label>
              <select
                value={newRec.type}
                onChange={(e) =>
                  setNewRec({ ...newRec, type: e.target.value })
                }
                className="w-full h-10 px-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                required
              >
                <option value="">Sélectionner un type</option>
                {TYPES_MACHINE.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Input
                label="Marque *"
                value={newRec.marque}
                onChange={(e) =>
                  setNewRec({ ...newRec, marque: e.target.value })
                }
                placeholder="ex: Electrolux"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Catégorie</label>
              <select
                value={newRec.categorie}
                onChange={(e) =>
                  setNewRec({ ...newRec, categorie: e.target.value })
                }
                className="w-full h-10 px-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Sélectionner une catégorie</option>
                {CATEGORIES_MACHINE.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Input
                type="number"
                label="Capacité (kg)"
                value={newRec.capaciteKg}
                onChange={(e) =>
                  setNewRec({ ...newRec, capaciteKg: e.target.value })
                }
                placeholder="10"
                step="0.5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">État</label>
              <select
                value={newRec.etat}
                onChange={(e) =>
                  setNewRec({ ...newRec, etat: e.target.value })
                }
                className="w-full h-10 px-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {ETATS_MACHINE.map((etat) => (
                  <option key={etat.value} value={etat.value}>
                    {etat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Input
                label="Localisation"
                value={newRec.localisation}
                onChange={(e) =>
                  setNewRec({ ...newRec, localisation: e.target.value })
                }
                placeholder="ex: Atelier A - Zone Lavage"
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
              Annuler
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Enregistrement..." : (selectedMachine ? "Enregistrer" : "Créer")}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}