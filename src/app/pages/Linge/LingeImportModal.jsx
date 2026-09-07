import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from '../../components/ui/modal';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { 
  Search, 
  Check, 
  CheckSquare, 
  Square, 
  Package,
  Barcode,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Building,
  User,
  AlertCircle,
  Filter,
  X
} from 'lucide-react';
import { useLingeContext } from '../../contextes/LingeContext';
import { useServiceContext } from '../../contextes/ServiceContext';
import Swal from 'sweetalert2';

const ETATS = {
  SALE: { label: 'Sale', color: '#ef4444', bg: '#fee2e2' },
  PROPRE: { label: 'Propre', color: '#10b981', bg: '#d1fae5' },
  EN_LAVAGE: { label: 'En lavage', color: '#3b82f6', bg: '#dbeafe' },
  LAVE: { label: 'Lavé', color: '#8b5cf6', bg: '#ede9fe' },
  EN_SECHAGE: { label: 'En séchage', color: '#f59e0b', bg: '#fef3c7' },
  SECHE: { label: 'Séché', color: '#14b8a6', bg: '#ccfbf1' },
  PLIE: { label: 'Plié', color: '#06b6d4', bg: '#cffafe' },
  STOCKE: { label: 'Stocké', color: '#64748b', bg: '#f1f5f9' },
  COLLECTE: { label: 'Collecte', color: '#f97316', bg: '#ffedd5' },
  LIVRE: { label: 'Livre', color: '#22c55e', bg: '#dcfce7' },
  HORS_SERVICE: { label: 'Hors service', color: '#dc2626', bg: '#fee2e2' },
  MANQUANT: { label: 'Manquant', color: '#b91c1c', bg: '#fecaca' },
};

export const LingeImportModal = () => {
  const {
    isImportModalOpen,
    setIsImportModalOpen,
    lingesToImport,
    selectedImportLinges,
    isImportLoading,
    importType,
    importPagination,
    loadLingesToImport,
    importLinges,
    toggleImportSelection,
    selectAllImportLinges,
  } = useLingeContext();

  const { services } = useServiceContext();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategorie, setFilterCategorie] = useState('all');
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [personnel, setPersonnel] = useState([]);
  const [isPersonnelLoading, setIsPersonnelLoading] = useState(false);

  // Charger le personnel
  useEffect(() => {
    const fetchPersonnel = async () => {
      setIsPersonnelLoading(true);
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8082'}/api/sqlserver/personnel`);
        if (response.ok) {
          const data = await response.json();
          setPersonnel(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Erreur chargement personnel:", err);
      } finally {
        setIsPersonnelLoading(false);
      }
    };
    if (isImportModalOpen) {
      fetchPersonnel();
    }
  }, [isImportModalOpen]);

  // Charger les linges à importer à l'ouverture
  useEffect(() => {
    if (isImportModalOpen) {
      loadLingesToImport(0, 50);
    }
  }, [isImportModalOpen]);

  // Filtrer les linges
  const filteredLinges = lingesToImport.filter(l => {
    const matchSearch = !searchTerm || (
      (l.designation || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.codeBarre || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    const matchCategorie = filterCategorie === 'all' || l.categorie === filterCategorie;
    return matchSearch && matchCategorie;
  });

  const getEtatBadge = (etat) => {
    const config = ETATS[etat] || { label: etat || 'Inconnu', color: '#64748b', bg: '#f1f5f9' };
    return (
      <span 
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
        style={{ background: config.bg, color: config.color }}
      >
        {config.label}
      </span>
    );
  };

  const getServiceName = (serviceId) => {
    if (!serviceId) return 'Non assigné';
    const service = services.find(s => s.id === serviceId);
    return service ? service.code || service.nom : 'Non assigné';
  };

  const getPorteurName = (porteurId) => {
    if (!porteurId) return 'Non assigné';
    const porteur = personnel.find(p => p.id === porteurId);
    return porteur ? `${porteur.prenom} ${porteur.nom}` : 'Non assigné';
  };

  const isAllSelected = filteredLinges.length > 0 && 
    filteredLinges.every(l => selectedImportLinges.some(s => s.id === l.id));

  const handleSelectAll = () => {
    if (isAllSelected) {
      filteredLinges.forEach(l => {
        if (selectedImportLinges.some(s => s.id === l.id)) {
          toggleImportSelection(l.id);
        }
      });
    } else {
      filteredLinges.forEach(l => {
        if (!selectedImportLinges.some(s => s.id === l.id)) {
          toggleImportSelection(l.id);
        }
      });
    }
  };

  // ✅ Sélectionner un service et fermer l'alerte si elle était ouverte
  const handleServiceSelect = (serviceId) => {
    setSelectedServiceId(serviceId);
  };

  const handleImport = async () => {
    if (selectedImportLinges.length === 0) {
      Swal.fire({
        title: '⚠️ Aucune sélection',
        text: 'Veuillez sélectionner au moins un linge à importer',
        icon: 'warning',
      });
      return;
    }

    if (!selectedServiceId) {
      const result = await Swal.fire({
        title: '⚠️ Service requis',
        text: 'Veuillez sélectionner un service pour les linges importés',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Choisir un service',
        cancelButtonText: 'Annuler',
      });
      if (!result.isConfirmed) return;
      // ✅ Mettre le focus sur le select
      const selectElement = document.querySelector('select[name="service-select"]');
      if (selectElement) selectElement.focus();
      return;
    }

    const payload = selectedImportLinges.map(item => ({
      id: item.id,
      categorie: item.categorie || 'AUTRE',
      serviceId: parseInt(selectedServiceId),
    }));

    try {
      await importLinges(payload);
    } catch (error) {
      console.error('Erreur import:', error);
    }
  };

  const totalPages = importPagination?.totalPages || 0;
  const currentPage = importPagination?.currentPage || 0;

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      loadLingesToImport(newPage, importPagination?.itemsPerPage || 50);
    }
  };

  // ✅ Vérifier si le bouton doit être activé
  const isImportDisabled = selectedImportLinges.length === 0 || !selectedServiceId || isImportLoading;

  return (
    <Modal
      isOpen={isImportModalOpen}
      onClose={() => setIsImportModalOpen(false)}
      title="📥 Importer des linges"
      size="xl"
    >
      <div className="space-y-4">
        {/* Bandeau d'information */}
        <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
          <p className="text-sm font-medium text-slate-700">
            ⚡ Sélectionnez les linges à importer et choisissez un service de destination
          </p>
        </div>

        {/* ✅ Sélection du service - avec nom pour focus */}
        <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
          <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
            <Building className="w-4 h-4" />
            Service de destination :
          </label>
          <select
            name="service-select"
            value={selectedServiceId || ''}
            onChange={(e) => handleServiceSelect(e.target.value || null)}
            className={`flex-1 px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              !selectedServiceId ? 'border-amber-300 bg-amber-50' : 'border-slate-200'
            }`}
          >
            <option value="">🔽 Sélectionner un service...</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>{s.code || s.nom}</option>
            ))}
          </select>
          {selectedServiceId ? (
            <Badge variant="success" className="text-xs flex items-center gap-1">
              ✅ {getServiceName(selectedServiceId)}
            </Badge>
          ) : (
            <Badge variant="warning" className="text-xs flex items-center gap-1">
              ⚠️ Service requis
            </Badge>
          )}
        </div>

        {/* Barre d'outils */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par désignation ou code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <select
            value={filterCategorie}
            onChange={(e) => setFilterCategorie(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Toutes les catégories</option>
            <option value="DRAP">Drap</option>
            <option value="TAIE_OREILLER">Taie d'oreiller</option>
            <option value="SERVIETTE_BAIN">Serviette de bain</option>
            <option value="SERVIETTE_VISAGE">Serviette de visage</option>
            <option value="PEIGNOIR">Peignoir</option>
            <option value="NAPPE">Nappe</option>
            <option value="SERVIETTE_TABLE">Serviette de table</option>
            <option value="UNIFORME">Uniforme</option>
            <option value="AUTRE">Autre</option>
          </select>

          <Button
            variant="outline"
            onClick={handleSelectAll}
            disabled={filteredLinges.length === 0}
            className="flex items-center gap-2"
          >
            {isAllSelected ? (
              <CheckSquare className="w-4 h-4" />
            ) : (
              <Square className="w-4 h-4" />
            )}
            {isAllSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm('');
              setFilterCategorie('all');
            }}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Réinitialiser
          </Button>
        </div>

        {/* Compteur */}
        <div className="flex justify-between items-center text-sm text-slate-500">
          <span>
            {filteredLinges.length} linge(s) trouvé(s)
          </span>
          <span className="font-medium text-indigo-600">
            {selectedImportLinges.length} sélectionné(s)
            {selectedServiceId && ` • Service: ${getServiceName(selectedServiceId)}`}
          </span>
        </div>

        {/* Tableau */}
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="w-10 px-3 py-2 text-center">
                    <button
                      onClick={handleSelectAll}
                      className="text-slate-400 hover:text-indigo-600 transition-colors"
                    >
                      {isAllSelected ? (
                        <CheckSquare className="w-4 h-4" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600 uppercase">Désignation</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600 uppercase">Code Barre</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600 uppercase">Catégorie</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600 uppercase">État</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600 uppercase">Service</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600 uppercase">Porteur</th>
                </tr>
              </thead>
              <tbody>
                {isImportLoading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2 text-slate-400">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Chargement...
                      </div>
                    </td>
                  </tr>
                ) : filteredLinges.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400">
                      {searchTerm ? 'Aucun linge correspondant' : 'Aucun linge à importer'}
                    </td>
                  </tr>
                ) : (
                  filteredLinges.map((linge) => {
                    const isSelected = selectedImportLinges.some(s => s.id === linge.id);
                    return (
                      <tr
                        key={linge.id}
                        onClick={() => toggleImportSelection(linge.id)}
                        className={`border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors ${
                          isSelected ? 'bg-indigo-50' : ''
                        }`}
                      >
                        <td className="px-3 py-2 text-center">
                          <div className="flex items-center justify-center">
                            {isSelected ? (
                              <Check className="w-4 h-4 text-indigo-600" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-300" />
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-slate-400" />
                            <span className="font-medium text-sm">{linge.designation || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <code className="text-xs font-mono text-indigo-600">
                            {linge.codeBarre || '-'}
                          </code>
                        </td>
                        <td className="px-3 py-2">
                          <Badge variant="outline" className="text-xs">
                            {linge.categorie || 'AUTRE'}
                          </Badge>
                        </td>
                        <td className="px-3 py-2">
                          {getEtatBadge(linge.etat)}
                        </td>
                        <td className="px-3 py-2 text-sm">
                          {linge.serviceNom || getServiceName(linge.serviceId) || '-'}
                        </td>
                        <td className="px-3 py-2">
                          {linge.porteurNom ? (
                            <span className="text-xs font-medium text-blue-600 flex items-center gap-1">
                              <User className="w-3 h-3" /> {linge.porteurNom}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">Non assigné</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <div className="text-sm text-slate-500">
              Page {currentPage + 1} / {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 0 || isImportLoading}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm px-3">
                {currentPage + 1} / {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages - 1 || isImportLoading}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Pied de page */}
        <div className="flex justify-between items-center pt-4 border-t border-slate-200">
          <div className="text-sm text-slate-500">
            {selectedImportLinges.length} linge(s) sélectionné(s)
            {selectedServiceId && (
              <span className="ml-2 text-indigo-600">
                → Service: {getServiceName(selectedServiceId)}
              </span>
            )}
            {!selectedServiceId && (
              <span className="ml-2 text-amber-600">
                ⚠️ Service non sélectionné
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setIsImportModalOpen(false)}
              disabled={isImportLoading}
            >
              Annuler
            </Button>
            <Button
              onClick={handleImport}
              disabled={isImportDisabled}
              className={isImportDisabled ? 'opacity-50 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}
              title={isImportDisabled ? (
                !selectedServiceId ? 'Sélectionnez un service' :
                selectedImportLinges.length === 0 ? 'Sélectionnez des linges' :
                'Import en cours...'
              ) : ''}
            >
              {isImportLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Import en cours...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Importer {selectedImportLinges.length} linge(s)
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};