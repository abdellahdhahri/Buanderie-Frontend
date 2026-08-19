import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Filter
} from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Modal } from "../../components/ui/modal";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import Swal from "sweetalert2";

// ─── Variables d'environnement ──────────────────────────────────────────────
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

export default function ReclamationList() {
  const [reclamations, setReclamations] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReclamation, setSelectedReclamation] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [newRec, setNewRec] = useState({
    codeBarre: "",
    description: "",
    type: "TROU",
    categorieLinge: "",
    agentId: "",
  });

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
        console.log("📋 Réclamations chargées:", data);
      } else {
        console.error("Erreur chargement réclamations:", await response.text());
      }
    } catch (err) {
      console.error("Erreur réseau:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "OUVERTE":
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case "EN_COURS":
        return <Clock className="w-4 h-4 text-blue-500" />;
      case "RESOLUE":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "REJETEE":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status) => {
    if (!status) return <Badge variant="secondary">Non défini</Badge>;
    const variants = {
      OUVERTE: { variant: "warning", label: "Ouverte" },
      EN_COURS: { variant: "info", label: "En cours" },
      RESOLUE: { variant: "success", label: "Résolue" },
      REJETEE: { variant: "destructive", label: "Rejetée" },
    };
    const config = variants[status] || { variant: "secondary", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getTypeBadge = (type) => {
    const styles = {
      TROU: { bg: "bg-red-100 text-red-800", label: "🕳️ Trou" },
      TACHE: { bg: "bg-yellow-100 text-yellow-800", label: "🟡 Tâche" },
      DECOLORATION: { bg: "bg-blue-100 text-blue-800", label: "🔵 Décoloration" },
      DECHIRE: { bg: "bg-purple-100 text-purple-800", label: "✂️ Déchirure" },
      AUTRE: { bg: "bg-gray-100 text-gray-800", label: "📦 Autre" },
    };
    const style = styles[type] || styles["AUTRE"];
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${style.bg}`}
      >
        {style.label}
      </span>
    );
  };

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

    try {
      const payload = {
        codeBarre: newRec.codeBarre,
        description: newRec.description,
        type: newRec.type,
        agentId: 1, // Remplacer par l'ID de l'agent connecté
      };

      if (selectedReclamation) {
        const response = await fetch(
          `${API_URL}/api/reclamations/${selectedReclamation.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
        if (response.ok) {
          const data = await response.json();
          setReclamations((prev) =>
            prev.map((r) => (r.id === data.id ? data : r))
          );
          Swal.fire({
            title: "✅ Modifié!",
            text: "Réclamation mise à jour avec succès.",
            icon: "success",
            timer: 1500,
            showConfirmButton: false,
          });
        } else {
          const error = await response.text();
          throw new Error(error);
        }
      } else {
        const response = await fetch(`${API_URL}/api/reclamations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (response.ok) {
          const data = await response.json();
          setReclamations((prev) => [data, ...prev]);
          Swal.fire({
            title: "✅ Créée!",
            text: "Nouvelle réclamation créée avec succès.",
            icon: "success",
            timer: 1500,
            showConfirmButton: false,
          });
        } else {
          const error = await response.text();
          throw new Error(error);
        }
      }
      setIsModalOpen(false);
      fetchReclamations();
    } catch (err) {
      console.error("Erreur:", err);
      Swal.fire({
        title: "❌ Erreur",
        text: err.message || "Une erreur est survenue.",
        icon: "error",
      });
    }
  };

  const deleteRec = async (id) => {
    const result = await Swal.fire({
      title: "Es-tu sûr?",
      text: "Vous ne pourrez pas annuler cette action!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Oui, supprimer!",
      cancelButtonText: "Annuler",
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`${API_URL}/api/reclamations/${id}`, {
          method: "DELETE",
        });
        if (response.ok) {
          setReclamations((prev) => prev.filter((r) => r.id !== id));
          Swal.fire({
            title: "✅ Supprimé!",
            text: "Réclamation supprimée avec succès.",
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
          title: "❌ Erreur",
          text: err.message || "Erreur lors de la suppression.",
          icon: "error",
        });
      }
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      const response = await fetch(
        `${API_URL}/api/reclamations/${id}/statut?statut=${newStatus}`,
        {
          method: "PUT",
        }
      );
      if (response.ok) {
        const data = await response.json();
        setReclamations((prev) => prev.map((r) => (r.id === data.id ? data : r)));
        Swal.fire({
          title: "✅ Statut mis à jour!",
          text: `Statut passé à ${newStatus}`,
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
        title: "❌ Erreur",
        text: err.message || "Erreur lors de la mise à jour.",
        icon: "error",
      });
    }
  };

  // Filtrage
  const filteredReclamations = reclamations.filter((r) => {
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

  return (
    <div>
      <div className="space-y-2">
      <div className="page-header" style={{ marginBottom: 0, textAlign: "left" }}>
  <h1 className="text-3xl font-extrabold flex items-center gap-3 text-blue-600">
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="32" 
      height="32" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className="text-blue-600 flex-shrink-0"
      style={{ display: 'block' }}
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
    Gestion des Réclamations
  </h1>
</div>
      </div>

      {/* ─── Barre d'outils ────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 bg-white/65 backdrop-blur-md p-4 rounded-[20px] border border-slate-200/50 shadow-[0_4px_20px_rgba(0,0,0,0.02)] mb-6">
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#0ca678]/30 rounded-[14px] text-sm font-bold text-[#0ca678] hover:bg-[#0ca678]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" /> Nouvelle Réclamation
        </button>

        <div style={{ width: "1px", height: "30px", background: "#e2e8f0", margin: "0 8px" }} />

        <button
          onClick={fetchReclamations}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-300 rounded-[14px] text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> Actualiser
        </button>
      </div>

      {/* ─── Barre de recherche ───────────────────────────────────────────── */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher par code, catégorie, agent ou type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </CardContent>
      </Card>

      {/* ─── Tableau ───────────────────────────────────────────────────────── */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  <th className="text-center py-3 px-4 text-sm font-medium">Article</th>
                  <th className="text-center py-3 px-4 text-sm font-medium">Agent</th>
                  <th className="text-center py-3 px-4 text-sm font-medium">Type</th>
                  <th className="text-center py-3 px-4 text-sm font-medium">Date</th>
                  <th className="text-center py-3 px-4 text-sm font-medium">Statut</th>
                  <th className="text-center py-3 px-4 text-sm font-medium">Actions</th>
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
                ) : filteredReclamations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? "Aucune réclamation correspondante" : "Aucune réclamation trouvée"}
                    </td>
                  </tr>
                ) : (
                  filteredReclamations.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-border hover:bg-accent/50"
                    >
                      <td className="text-center py-3 px-4 text-sm">
                        <div className="font-medium">{r.linge?.categorie || "N/A"}</div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {r.linge?.codeBarre || "N/A"}
                        </div>
                        {r.linge?.rfidTag && (
                          <div className="text-xs text-muted-foreground font-mono text-purple-500">
                            RFID: {r.linge.rfidTag}
                          </div>
                        )}
                      </td>
                      <td className="text-center py-3 px-4 text-sm">
                        {r.agent ? (
                          <>
                            <div className="font-medium">{r.agent.nom} {r.agent.prenom}</div>
                            <div className="text-xs text-muted-foreground">
                              {r.agent.matricule}
                            </div>
                          </>
                        ) : "N/A"}
                      </td>
                      <td className="text-center py-3 px-4 text-sm">
                        {getTypeBadge(r.type)}
                      </td>
                      <td className="text-center py-3 px-4 text-sm">
                        {r.dateCreation ? new Date(r.dateCreation).toLocaleDateString("fr-FR") : "N/A"}
                      </td>
                      <td className="text-center py-3 px-4 text-sm">
                        <div className="flex items-center justify-center gap-2">
                          {getStatusIcon(r.status)}
                          {getStatusBadge(r.status)}
                        </div>
                      </td>
                      <td className="text-center py-3 px-4 text-sm">
                        <div className="flex items-center justify-center gap-2">
                          {r.statut === "OUVERTE" && (
                            <button
                              onClick={() => updateStatus(r.id, "EN_COURS")}
                              className="p-2 hover:bg-accent rounded-lg transition-colors"
                              title="Prendre en charge"
                            >
                              <Clock className="w-4 h-4 text-blue-500" />
                            </button>
                          )}
                          {r.statut === "EN_COURS" && (
                            <button
                              onClick={() => updateStatus(r.id, "RESOLUE")}
                              className="p-2 hover:bg-accent rounded-lg transition-colors"
                              title="Résoudre"
                            >
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEditModal(r)}
                            className="p-2 hover:bg-accent rounded-lg transition-colors"
                            title="Modifier"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteRec(r.id)}
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

      {/* ─── Modal ────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          selectedReclamation
            ? `Modifier la réclamation #${selectedReclamation.id}`
            : "Nouvelle Réclamation"
        }
        size="lg"
      >
        <form onSubmit={handleSave}>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Input
                label="Code barre de l'article"
                value={newRec.codeBarre}
                onChange={(e) =>
                  setNewRec({ ...newRec, codeBarre: e.target.value.toUpperCase() })
                }
                placeholder="ex: 8081"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Entrez le code barre du linge concerné
              </p>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-2">
                Type de problème
              </label>
              <select
                value={newRec.type}
                onChange={(e) =>
                  setNewRec({ ...newRec, type: e.target.value })
                }
                className="w-full h-10 px-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                required
              >
                <option value="TROU">🕳️ Trou</option>
                <option value="TACHE">🟡 Tâche</option>
                <option value="DECOLORATION">🔵 Décoloration</option>
                <option value="DECHIRURE">✂️ Déchirure</option>
                <option value="AUTRE">📦 Autre</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-2">
                Description du problème
              </label>
              <textarea
                value={newRec.description}
                onChange={(e) =>
                  setNewRec({ ...newRec, description: e.target.value })
                }
                placeholder="Expliquez le problème en détail..."
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
            >
              Annuler
            </Button>
            <Button type="submit">
              {selectedReclamation
                ? "Enregistrer les modifications"
                : "Créer la réclamation"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}