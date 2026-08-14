import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  ChevronRight,
  ChevronLeft,
  User,
  Users,
  BadgeCheck,
  X,
  Eye,
  Barcode,
  History,
  RefreshCw,
  Printer,
  Tag,
  Filter,
  Phone,
  Mail,
  Calendar,
  UserCheck
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

const POSTES = [
  { value: "AGENT_COLLECTE", label: "Agent Collecte" },
  { value: "AGENT_RECEPTION", label: "Agent Réception" },
  { value: "AGENT_TRI", label: "Agent Tri" },
  { value: "AGENT_LAVAGE", label: "Agent Lavage" },
  { value: "AGENT_SECHAGE", label: "Agent Séchage" },
  { value: "AGENT_PLIAGE", label: "Agent Pliage" },
  { value: "AGENT_STOCKAGE", label: "Agent Stockage" },
  { value: "AGENT_LIVRAISON", label: "Agent Livraison" },
  { value: "CHEF_EQUIPE", label: "Chef d'Équipe" }
];

const POSTE_COLORS = {
  AGENT_COLLECTE: { bg: "#f5f3ff", color: "#7c3aed", label: "Collecte" },
  AGENT_RECEPTION: { bg: "#fffbeb", color: "#d97706", label: "Réception" },
  AGENT_TRI: { bg: "#fdf2f8", color: "#db2777", label: "Tri" },
  AGENT_LAVAGE: { bg: "#eff6ff", color: "#2563eb", label: "Lavage" },
  AGENT_SECHAGE: { bg: "#f0fdf4", color: "#16a34a", label: "Séchage" },
  AGENT_PLIAGE: { bg: "#f5f3ff", color: "#7c3aed", label: "Pliage" },
  AGENT_STOCKAGE: { bg: "#ecfdf5", color: "#059669", label: "Stockage" },
  AGENT_LIVRAISON: { bg: "#fef2f2", color: "#dc2626", label: "Livraison" },
  CHEF_EQUIPE: { bg: "#f1f5f9", color: "#1e293b", label: "Chef" }
};

export default function AgentList() {
  const [agents, setAgents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAgentDetail, setSelectedAgentDetail] = useState(null);

  const [newRec, setNewRec] = useState({
    matricule: "",
    nom: "",
    prenom: "",
    poste: "",
    telephone: "",
    actif: true
  });

  const fetchAgents = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/agents/tous`);
      if (response.ok) {
        const data = await response.json();
        setAgents(data);
      }
    } catch (err) {
      console.error("Erreur réseau:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleOpenCreateModal = () => {
    setSelectedAgent(null);
    setNewRec({
      matricule: "",
      nom: "",
      prenom: "",
      poste: "",
      telephone: "",
      actif: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (agent) => {
    setSelectedAgent(agent);
    setNewRec({
      matricule: agent.matricule || "",
      nom: agent.nom || "",
      prenom: agent.prenom || "",
      poste: agent.poste || "",
      telephone: agent.telephone || "",
      actif: agent.actif !== undefined ? agent.actif : true
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!newRec.nom || newRec.nom.trim() === "") {
      Swal.fire({
        title: "⚠️ Nom requis",
        text: "Veuillez saisir un nom.",
        icon: "warning",
      });
      return;
    }

    if (!newRec.prenom || newRec.prenom.trim() === "") {
      Swal.fire({
        title: "⚠️ Prénom requis",
        text: "Veuillez saisir un prénom.",
        icon: "warning",
      });
      return;
    }

    if (!newRec.poste) {
      Swal.fire({
        title: "⚠️ Poste requis",
        text: "Veuillez sélectionner un poste.",
        icon: "warning",
      });
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        matricule: newRec.matricule?.trim() || undefined,
        nom: newRec.nom.trim(),
        prenom: newRec.prenom.trim(),
        poste: newRec.poste,
        telephone: newRec.telephone?.trim() || null,
        actif: newRec.actif !== undefined ? newRec.actif : true
      };

      const url = selectedAgent 
        ? `${API_URL}/api/agents/${selectedAgent.id}`
        : `${API_URL}/api/agents`;
      
      const method = selectedAgent ? "PUT" : "POST";

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
      
      if (selectedAgent) {
        setAgents((prev) => prev.map((r) => (r.id === data.id ? data : r)));
        Swal.fire({
          title: "✅ Modifié!",
          text: "Agent mis à jour avec succès.",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        setAgents((prev) => [data, ...prev]);
        Swal.fire({
          title: "✅ Créé!",
          text: "Nouvel agent créé avec succès.",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
      }

      setIsModalOpen(false);
      fetchAgents();

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
      text: "Cette action désactivera l'agent.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Oui, désactiver!",
      cancelButtonText: "Annuler",
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`${API_URL}/api/agents/${id}`, {
          method: "DELETE",
        });
        if (response.ok) {
          setAgents((prev) => prev.filter((r) => r.id !== id));
          if (selectedId === id) {
            setSelectedId(null);
          }
          Swal.fire({
            title: "✅ Désactivé!",
            text: "Agent désactivé avec succès.",
            icon: "success",
            timer: 1500,
            showConfirmButton: false,
          });
          fetchAgents();
        } else {
          const error = await response.text();
          throw new Error(error);
        }
      } catch (err) {
        console.error("Erreur suppression:", err);
        Swal.fire({
          title: "❌ Erreur",
          text: err.message || "Erreur lors de la désactivation.",
          icon: "error",
        });
      }
    }
  };

  const handleRowClick = (id) => {
    setSelectedId((prev) => (prev === id ? null : id));
  };

  const handleDetail = (agent) => {
    setSelectedAgentDetail(agent);
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

  const handlePrintMatricule = (agent) => {
    if (!agent) return;
    
    const code = agent.matricule;
    const format = detectFormat(code);
    const nomComplet = `${agent.prenom} ${agent.nom}`;
    
    printJS({
      printable: `
        <div style="width:60mm; padding:3mm; font-family:'Courier New',monospace; background:white; text-align:center;">
          <div style="border-bottom:1px solid #ddd; padding-bottom:2mm; margin-bottom:2mm;">
            <div style="font-size:8pt; color:#666;">${agent.poste || 'N/A'}</div>
          </div>
          
          <div style="display:flex; justify-content:center; margin:2mm 0;">
            <img
              src="https://barcodeapi.org/api/${format}/${encodeURIComponent(code)}"
              style="height:70px; width:100%; max-width:180px;"
              alt="Code-barres"
            />
          </div>
          
          
          
          <div style="font-size:10pt; font-weight:600; color:#1a1a1a;">
            ${nomComplet}
          </div>
          
          
        </div>
      `,
      type: "raw-html",
      style: "* { margin: 0; padding: 0; box-sizing: border-box; } body { background: white; display: flex; justify-content: center; }",
      documentTitle: `M`,
      css: `
        @page { 
          size: 60mm 45mm;
          margin: 0;
        }
      `
    });
  };

  const filteredAgents = agents.filter((r) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      r.matricule?.toLowerCase().includes(term) ||
      r.nom?.toLowerCase().includes(term) ||
      r.prenom?.toLowerCase().includes(term) ||
      r.poste?.toLowerCase().includes(term)
    );
  });

  const getStatutBadge = (actif) => {
    return actif ? (
      <Badge variant="success" className="flex items-center gap-1">
        <UserCheck className="w-3 h-3" /> Actif
      </Badge>
    ) : (
      <Badge variant="secondary" className="flex items-center gap-1">
        <X className="w-3 h-3" /> Inactif
      </Badge>
    );
  };

  const getPosteBadge = (poste) => {
    const colors = POSTE_COLORS[poste] || { bg: "#f1f5f9", color: "#64748b", label: poste };
    return (
      <Badge 
        style={{ 
          background: colors.bg, 
          color: colors.color,
          border: `1px solid ${colors.color}30`
        }}
      >
        {colors.label}
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
              👤 Gestion des Agents
            </h1>
            <p className="text-sm text-slate-500" style={{ color: "#166d7c" }}>
              Gestion complète des agents et impression des matricules
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 bg-white/65 backdrop-blur-md p-4 rounded-[20px] border border-slate-200/50 shadow-[0_4px_20px_rgba(0,0,0,0.02)] mb-6">
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#0ca678]/30 rounded-[14px] text-sm font-bold text-[#0ca678] hover:bg-[#0ca678]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" /> Nouvel Agent
            </button>

            <div style={{ width: "1px", height: "30px", background: "#e2e8f0", margin: "0 8px" }} />

            <button
              disabled={!selectedId}
              onClick={() => {
                if (selectedId) {
                  const agent = agents.find(a => a.id === selectedId);
                  if (agent) handleDetail(agent);
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
                  const agent = agents.find(a => a.id === selectedId);
                  if (agent) handlePrintMatricule(agent);
                }
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#8b5cf6]/30 rounded-[14px] text-sm font-bold text-[#8b5cf6] hover:bg-[#8b5cf6]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
            >
              <Barcode className="w-4 h-4 stroke-[2.5]" /> Matricule
            </button>

            <button
              disabled={!selectedId}
              onClick={() => handleOpenEditModal(agents.find(a => a.id === selectedId))}
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
                    text: "Cette action désactivera l'agent.",
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonColor: "#d33",
                    cancelButtonColor: "#3085d6",
                    confirmButtonText: "Oui, désactiver!",
                    cancelButtonText: "Annuler",
                  });
                  if (confirmed.isConfirmed) {
                    deleteRec(selectedId);
                  }
                }
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#e03131]/30 rounded-[14px] text-sm font-bold text-[#e03131] hover:bg-[#e03131]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
            >
              <Trash2 className="w-4 h-4 stroke-[2.5]" /> Désactiver
            </button>

            <button
              onClick={fetchAgents}
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
                  placeholder="Rechercher par matricule, nom, prénom ou poste..."
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
                      <th className="text-left py-3 px-4 text-sm font-medium">Matricule</th>
                      <th className="text-left py-3 px-4 text-sm font-medium">Nom & Prénom</th>
                      <th className="text-left py-3 px-4 text-sm font-medium">Poste</th>
                      <th className="text-left py-3 px-4 text-sm font-medium">Téléphone</th>
                      <th className="text-left py-3 px-4 text-sm font-medium">Statut</th>
                      <th className="text-left py-3 px-4 text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-muted-foreground">
                          <div className="flex items-center justify-center gap-2">
                            <svg className="animate-spin w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Chargement...
                          </div>
                        </td>
                      </tr>
                    ) : filteredAgents.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-muted-foreground">
                          {searchTerm ? "Aucun agent correspondant" : "Aucun agent trouvé"}
                        </td>
                      </tr>
                    ) : (
                      filteredAgents.map((agent) => (
                        <tr
                          key={agent.id}
                          onClick={() => handleRowClick(agent.id)}
                          className={`border-b border-border hover:bg-accent/50 transition-colors cursor-pointer ${selectedId === agent.id ? 'bg-blue-50' : ''}`}
                        >
                          <td className="py-3 px-4">
                            <div className="font-mono text-sm font-medium text-blue-600">
                              {agent.matricule}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium">{agent.prenom} {agent.nom}</div>
                          </td>
                          <td className="py-3 px-4">
                            {getPosteBadge(agent.poste)}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-slate-400" />
                              <span className="text-sm">{agent.telephone || "-"}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {getStatutBadge(agent.actif)}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePrintMatricule(agent);
                                }}
                                className="p-2 hover:bg-accent rounded-lg transition-colors"
                                title="Imprimer le matricule"
                              >
                                <Barcode className="w-4 h-4 text-[#e67700]" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEditModal(agent);
                                }}
                                className="p-2 hover:bg-accent rounded-lg transition-colors"
                                title="Modifier"
                              >
                                <Edit className="w-4 h-4 text-[#006f94]" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteRec(agent.id);
                                }}
                                className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                                title="Désactiver"
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
        title={`Détails de l'agent - ${selectedAgentDetail?.matricule || 'N/A'}`}
        size="lg"
      >
        {selectedAgentDetail && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ID</label>
              <Input value={selectedAgentDetail.id} disabled />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Matricule</label>
              <Input value={selectedAgentDetail.matricule} disabled />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
              <Input value={selectedAgentDetail.nom} disabled />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Prénom</label>
              <Input value={selectedAgentDetail.prenom} disabled />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Poste</label>
              <div className="mt-1">{getPosteBadge(selectedAgentDetail.poste)}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
              <Input value={selectedAgentDetail.telephone || "-"} disabled />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
              <div className="mt-1">{getStatutBadge(selectedAgentDetail.actif)}</div>
            </div>
            {selectedAgentDetail.dateCreation && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date de création</label>
                <Input value={new Date(selectedAgentDetail.dateCreation).toLocaleString('fr-FR')} disabled />
              </div>
            )}
          </div>
        )}
        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="outline"
            onClick={() => {
              if (selectedAgentDetail) handlePrintMatricule(selectedAgentDetail);
            }}
          >
            <Barcode className="w-4 h-4 mr-2" /> Imprimer matricule
          </Button>
          <Button onClick={() => setShowDetailModal(false)}>
            Fermer
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedAgent ? `Modifier l'agent #${selectedAgent.id}` : "Nouvel Agent"}
        size="lg"
      >
        <form onSubmit={handleSave}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input
                label="Matricule"
                value={newRec.matricule}
                onChange={(e) =>
                  setNewRec({ ...newRec, matricule: e.target.value.toUpperCase() })
                }
                placeholder="ex: AG001"
                disabled={!!selectedAgent}
              />
              <p className="text-xs text-slate-400 mt-1">
                {selectedAgent ? "Le matricule ne peut pas être modifié" : "Laissez vide pour génération automatique"}
              </p>
            </div>

            <div>
              <Input
                label="Nom *"
                value={newRec.nom}
                onChange={(e) =>
                  setNewRec({ ...newRec, nom: e.target.value })
                }
                placeholder="Dupont"
                required
              />
            </div>

            <div>
              <Input
                label="Prénom *"
                value={newRec.prenom}
                onChange={(e) =>
                  setNewRec({ ...newRec, prenom: e.target.value })
                }
                placeholder="Jean"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Poste *</label>
              <select
                value={newRec.poste}
                onChange={(e) =>
                  setNewRec({ ...newRec, poste: e.target.value })
                }
                className="w-full h-10 px-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                required
              >
                <option value="">Sélectionner un poste</option>
                {POSTES.map((poste) => (
                  <option key={poste.value} value={poste.value}>
                    {poste.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Input
                label="Téléphone"
                value={newRec.telephone}
                onChange={(e) =>
                  setNewRec({ ...newRec, telephone: e.target.value })
                }
                placeholder="06 12 34 56 78"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Statut</label>
              <select
                value={newRec.actif ? "true" : "false"}
                onChange={(e) =>
                  setNewRec({ ...newRec, actif: e.target.value === "true" })
                }
                className="w-full h-10 px-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="true">Actif</option>
                <option value="false">Inactif</option>
              </select>
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
              {isSaving ? "Enregistrement..." : (selectedAgent ? "Enregistrer" : "Créer")}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}