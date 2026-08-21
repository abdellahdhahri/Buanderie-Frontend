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
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  User,
  Package
} from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Modal } from "../../components/ui/modal";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import Swal from "sweetalert2";

// ─── Variables d'environnement ──────────────────────────────────────────────
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

// ─── Icônes SVG pour les types de réclamation ──────────────────────────────
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
      <path d="M12 22V12" />
      <circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.3" />
    </svg>
  ),
  MAL_LAVE: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 18h18" />
      <path d="M3 12h18" />
      <path d="M3 6h18" />
      <circle cx="12" cy="12" r="8" opacity="0.2" />
      <path d="M8 8L16 16" />
      <path d="M8 16L16 8" />
    </svg>
  ),
  AUTRE: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v4" />
      <path d="M12 18v4" />
      <path d="M4 12H2" />
      <path d="M22 12h-2" />
      <path d="M19 5l-3 3" />
      <path d="M16 16l3 3" />
      <path d="M8 16l-3 3" />
      <path d="M5 5l3 3" />
      <circle cx="12" cy="12" r="3" />
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
  OUVERTE: { variant: "warning", label: "Ouverte", color: "#f59e0b", bg: "#fffbeb" },
  EN_COURS: { variant: "info", label: "En cours", color: "#3b82f6", bg: "#eff6ff" },
  RESOLUE: { variant: "success", label: "Résolue", color: "#10b981", bg: "#f0fdf4" },
  FERMEE: { variant: "secondary", label: "Fermée", color: "#64748b", bg: "#f1f5f9" },
};

export default function ReclamationList() {
  const [reclamations, setReclamations] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReclamation, setSelectedReclamation] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // ─── Pagination ──────────────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
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
      case "FERMEE":
        return <XCircle className="w-4 h-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status) => {
    if (!status) return <Badge variant="secondary">Non défini</Badge>;
    const config = STATUS_CONFIG[status] || { variant: "secondary", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getTypeBadge = (type) => {
    const style = TYPE_COLORS[type] || TYPE_COLORS.AUTRE;
    const icon = TYPE_ICONS[type] || TYPE_ICONS.AUTRE;
    const label = type?.replace(/_/g, ' ') || "Autre";
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text} ${style.border} border`}>
        {React.cloneElement(icon, { className: `w-3.5 h-3.5 ${style.text}` })}
        {label}
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
        agentId: 1,
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
          setReclamations((prev) => prev.map((r) => (r.id === data.id ? data : r)));
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
        `${API_URL}/api/reclamations/${id}/status?status=${newStatus}`,
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

  // ─── Filtrage et Pagination ────────────────────────────────────────────
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

  const totalItems = filteredReclamations.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredReclamations.slice(startIndex, endIndex);

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const stats = {
    total: reclamations.length,
    ouvertes: reclamations.filter(r => r.status === "OUVERTE").length,
    enCours: reclamations.filter(r => r.status === "EN_COURS").length,
    resolues: reclamations.filter(r => r.status === "RESOLUE").length,
    fermees: reclamations.filter(r => r.status === "FERMEE").length,
  };

  return (
    <div className="collecte-container">
      
      {/* ─── EN-TÊTE ─────────────────────────────────────────────────────── */}
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
        <p style={{
          fontSize: "14px",
          color: "#64748b",
          margin: "4px 0 0 0"
        }}>
          {stats.total} réclamation{stats.total > 1 ? "s" : ""} au total
        </p>
      </div>

      {/* ─── STATISTIQUES ────────────────────────────────────────────────── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
        gap: "12px",
        marginBottom: "20px",
        marginTop: "20px"
      }}>
        <StatCard label="Ouvertes" value={stats.ouvertes} color="#f59e0b" bg="#fffbeb" />
        <StatCard label="En cours" value={stats.enCours} color="#3b82f6" bg="#eff6ff" />
        <StatCard label="Résolues" value={stats.resolues} color="#10b981" bg="#f0fdf4" />
        <StatCard label="Fermées" value={stats.fermees} color="#64748b" bg="#f1f5f9" />
      </div>

      <div style={{
        background: "white",
        borderRadius: "20px",
        padding: "24px",
        border: "1px solid #e2e8f0",
        boxShadow: "0 4px 20px rgba(0,0,0,0.06)"
      }}>

        {/* ─── Barre d'outils ────────────────────────────────────────────── */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
          flexWrap: "wrap",
          gap: "12px"
        }}>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
              onClick={handleOpenCreateModal}
              style={{
                padding: "8px 18px",
                borderRadius: "10px",
                border: "1px solid #0ca678",
                background: "white",
                color: "#0ca678",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <Plus size={16} /> Nouvelle
            </button>
            <button
              onClick={fetchReclamations}
              style={{
                padding: "8px 16px",
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
                background: "white",
                color: "#64748b",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Actualiser
            </button>
          </div>

          {/* ─── Recherche ────────────────────────────────────────────────── */}
          <div style={{ position: "relative", minWidth: "200px" }}>
            <Search size={16} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                width: "100%",
                padding: "8px 12px 8px 36px",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                fontSize: "13px",
                outline: "none",
                boxSizing: "border-box"
              }}
            />
          </div>
        </div>

        {/* ─── Tableau ───────────────────────────────────────────────────── */}
        <div style={{
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          overflow: "hidden"
        }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  <th style={{ padding: "12px 16px", textAlign: "center", fontSize: "12px", fontWeight: 600, color: "#64748b" }}>Article</th>
                  <th style={{ padding: "12px 16px", textAlign: "center", fontSize: "12px", fontWeight: 600, color: "#64748b" }}>Agent</th>
                  <th style={{ padding: "12px 16px", textAlign: "center", fontSize: "12px", fontWeight: 600, color: "#64748b" }}>Type</th>
                  <th style={{ padding: "12px 16px", textAlign: "center", fontSize: "12px", fontWeight: 600, color: "#64748b" }}>Date</th>
                  <th style={{ padding: "12px 16px", textAlign: "center", fontSize: "12px", fontWeight: 600, color: "#64748b" }}>Statut</th>
                  <th style={{ padding: "12px 16px", textAlign: "center", fontSize: "12px", fontWeight: 600, color: "#64748b" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
                        <svg className="animate-spin w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Chargement...
                      </div>
                    </td>
                  </tr>
                ) : currentItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
                      {searchTerm ? "Aucune réclamation correspondante" : "Aucune réclamation trouvée"}
                    </td>
                  </tr>
                ) : (
                  currentItems.map((r) => (
                    <tr key={r.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "12px 16px", textAlign: "center" }}>
                        <div style={{ fontWeight: 600, fontSize: "13px" }}>{r.linge?.categorie || "N/A"}</div>
                        <code style={{ fontSize: "11px", color: "#64748b" }}>{r.linge?.codeBarre || "N/A"}</code>
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "center" }}>
                        <div style={{ fontSize: "13px" }}>{r.agent?.nom || "N/A"}</div>
                        <div style={{ fontSize: "11px", color: "#64748b" }}>{r.agent?.matricule || ""}</div>
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "center" }}>
                        {getTypeBadge(r.type)}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "center", fontSize: "13px", color: "#64748b" }}>
                        {r.dateCreation ? new Date(r.dateCreation).toLocaleDateString("fr-FR") : "N/A"}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                          {getStatusIcon(r.status)}
                          {getStatusBadge(r.status)}
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", flexWrap: "wrap" }}>
                          {r.status === "OUVERTE" && (
                            <button
                              onClick={() => updateStatus(r.id, "EN_COURS")}
                              title="Prendre en charge"
                              style={{
                                padding: "4px 10px",
                                borderRadius: "6px",
                                border: "1px solid #3b82f6",
                                background: "#eff6ff",
                                color: "#1d4ed8",
                                fontSize: "10px",
                                fontWeight: 600,
                                cursor: "pointer"
                              }}
                            >
                              Prendre
                            </button>
                          )}
                          {r.status === "EN_COURS" && (
                            <>
                              <button
                                onClick={() => updateStatus(r.id, "RESOLUE")}
                                title="Résoudre"
                                style={{
                                  padding: "4px 10px",
                                  borderRadius: "6px",
                                  border: "1px solid #10b981",
                                  background: "#f0fdf4",
                                  color: "#15803d",
                                  fontSize: "10px",
                                  fontWeight: 600,
                                  cursor: "pointer"
                                }}
                              >
                                Résoudre
                              </button>
                              <button
                                onClick={() => updateStatus(r.id, "FERMEE")}
                                title="Fermer"
                                style={{
                                  padding: "4px 10px",
                                  borderRadius: "6px",
                                  border: "1px solid #64748b",
                                  background: "#f1f5f9",
                                  color: "#475569",
                                  fontSize: "10px",
                                  fontWeight: 600,
                                  cursor: "pointer"
                                }}
                              >
                                Fermer
                              </button>
                            </>
                          )}
                          {r.status === "RESOLUE" && (
                            <button
                              onClick={() => updateStatus(r.id, "EN_COURS")}
                              title="Rouvrir"
                              style={{
                                padding: "4px 10px",
                                borderRadius: "6px",
                                border: "1px solid #f59e0b",
                                background: "#fffbeb",
                                color: "#d97706",
                                fontSize: "10px",
                                fontWeight: 600,
                                cursor: "pointer"
                              }}
                            >
                              Rouvrir
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEditModal(r)}
                            title="Modifier"
                            style={{
                              padding: "4px 8px",
                              borderRadius: "6px",
                              border: "1px solid #e2e8f0",
                              background: "white",
                              color: "#64748b",
                              cursor: "pointer"
                            }}
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => deleteRec(r.id)}
                            title="Supprimer"
                            style={{
                              padding: "4px 8px",
                              borderRadius: "6px",
                              border: "1px solid #fca5a5",
                              background: "#fff5f5",
                              color: "#dc2626",
                              cursor: "pointer"
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ─── Pagination ────────────────────────────────────────────────── */}
        {totalPages > 1 && (
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: "16px",
            marginTop: "16px",
            borderTop: "1px solid #e2e8f0",
            flexWrap: "wrap",
            gap: "8px"
          }}>
            <div style={{ fontSize: "13px", color: "#64748b" }}>
              Affichage de <strong>{startIndex + 1}</strong> à <strong>{Math.min(endIndex, totalItems)}</strong> sur <strong>{totalItems}</strong>
            </div>
            <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
              <button
                onClick={() => goToPage(1)}
                disabled={currentPage === 1}
                style={{
                  padding: "6px 10px",
                  borderRadius: "6px",
                  border: "1px solid #e2e8f0",
                  background: "white",
                  color: currentPage === 1 ? "#94a3b8" : "#64748b",
                  cursor: currentPage === 1 ? "not-allowed" : "pointer",
                  fontSize: "12px"
                }}
              >
                <ChevronsLeft size={14} />
              </button>
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                style={{
                  padding: "6px 10px",
                  borderRadius: "6px",
                  border: "1px solid #e2e8f0",
                  background: "white",
                  color: currentPage === 1 ? "#94a3b8" : "#64748b",
                  cursor: currentPage === 1 ? "not-allowed" : "pointer",
                  fontSize: "12px"
                }}
              >
                <ChevronLeft size={14} />
              </button>
              
              <span style={{ padding: "0 12px", fontSize: "13px", color: "#0f172a", fontWeight: 600 }}>
                {currentPage} / {totalPages}
              </span>
              
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={{
                  padding: "6px 10px",
                  borderRadius: "6px",
                  border: "1px solid #e2e8f0",
                  background: "white",
                  color: currentPage === totalPages ? "#94a3b8" : "#64748b",
                  cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                  fontSize: "12px"
                }}
              >
                <ChevronRight size={14} />
              </button>
              <button
                onClick={() => goToPage(totalPages)}
                disabled={currentPage === totalPages}
                style={{
                  padding: "6px 10px",
                  borderRadius: "6px",
                  border: "1px solid #e2e8f0",
                  background: "white",
                  color: currentPage === totalPages ? "#94a3b8" : "#64748b",
                  cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                  fontSize: "12px"
                }}
              >
                <ChevronsRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* ─── Footer ────────────────────────────────────────────────────── */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: "16px",
          borderTop: "1px solid #e2e8f0",
          fontSize: "12px",
          color: "#64748b",
          flexWrap: "wrap",
          gap: "8px",
          marginTop: "16px"
        }}>
          <div style={{ display: "flex", gap: "16px" }}>
            <span>Total: <strong style={{ color: "#0f172a" }}>{stats.total}</strong></span>
            <span>Ouvertes: <strong style={{ color: "#f59e0b" }}>{stats.ouvertes}</strong></span>
            <span>En cours: <strong style={{ color: "#3b82f6" }}>{stats.enCours}</strong></span>
            <span>Résolues: <strong style={{ color: "#10b981" }}>{stats.resolues}</strong></span>
            <span>Fermées: <strong style={{ color: "#64748b" }}>{stats.fermees}</strong></span>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <span>{new Date().toLocaleDateString("fr-FR")}</span>
            <span>•</span>
            <span>{new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
          </div>
        </div>
      </div>

      {/* ─── Modal ────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedReclamation ? `Modifier la réclamation #${selectedReclamation.id}` : "Nouvelle Réclamation"}
        size="lg"
      >
        <form onSubmit={handleSave}>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Input
                label="Code barre de l'article"
                value={newRec.codeBarre}
                onChange={(e) => setNewRec({ ...newRec, codeBarre: e.target.value.toUpperCase() })}
                placeholder="ex: L97AA77D8"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">Entrez le code barre du linge concerné</p>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-2">Type de problème</label>
              <select
                value={newRec.type}
                onChange={(e) => setNewRec({ ...newRec, type: e.target.value })}
                className="w-full h-10 px-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                required
              >
                <option value="TROU">🕳️ Trou</option>
                <option value="TACHE_PERSISTANTE">🟡 Tâche persistante</option>
                <option value="DECHIRE">✂️ Déchirure</option>
                <option value="COUTURE_ABIMEE">🧵 Couture abîmée</option>
                <option value="BOUTON_MANQUANT">🔘 Bouton manquant</option>
                <option value="A_REFORMER">♻️ À réformer</option>
                <option value="MAL_LAVE">🧼 Mal lavé</option>
                <option value="AUTRE">📦 Autre</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-2">Description du problème</label>
              <textarea
                value={newRec.description}
                onChange={(e) => setNewRec({ ...newRec, description: e.target.value })}
                placeholder="Expliquez le problème en détail..."
                className="w-full min-h-[100px] px-3 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setIsModalOpen(false)} type="button">
              Annuler
            </Button>
            <Button type="submit">
              {selectedReclamation ? "Enregistrer" : "Créer"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ─── COMPOSANT : StatCard ──────────────────────────────────────────────────
function StatCard({ label, value, color, bg }) {
  return (
    <div style={{
      padding: "14px 16px",
      borderRadius: "12px",
      background: bg,
      border: `1px solid ${color}25`,
      textAlign: "center"
    }}>
      <div style={{ fontSize: "24px", fontWeight: 700, color: color }}>
        {value}
      </div>
      <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>
        {label}
      </div>
    </div>
  );
}