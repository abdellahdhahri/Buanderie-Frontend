import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
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

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8082';


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

const FAMILLE_TO_CATEGORIE = {
  18: 'DRAP',
  19: 'TAIE_OREILLER',
  20: 'SERVIETTE_BAIN',
  21: 'SERVIETTE_VISAGE',
  22: 'PEIGNOIR',
  23: 'NAPPE',
  24: 'SERVIETTE_TABLE',
  25: 'UNIFORME',
};


const normalizeLinge = (raw) => {
  if (!raw) return null;
  return {
    id: raw.Id ?? raw.id,
    designation: raw.Designation ?? raw.designation ?? 'N/A',
    codeBarre: raw.CodeBarre ?? raw.codeBarre ?? '',
    etatActif: raw.EtatActif ?? raw.etatActif ?? 0,
    etat: (raw.EtatActif === 0) ? 'PROPRE' : 'HORS_SERVICE',
    prestataireArticleId: raw.PrestataireArticleId ?? raw.prestataireArticleId ?? null,
    articleFamilleId: raw.ArticleFamilleId ?? raw.articleFamilleId ?? null,
    categorie:
      FAMILLE_TO_CATEGORIE[raw.ArticleFamilleId] ||
      raw.categorie ||
      'AUTRE',
    numeroSerie: raw.NumeroSerie ?? raw.numeroSerie ?? null,
    serviceId: raw.ServiceId ?? raw.serviceId ?? null,
    serviceNom: raw.ServiceNom ?? raw.serviceNom ?? null,
    porteurNom: raw.PorteurNom ?? raw.porteurNom ?? null,
  };
};

export const LingeImportModal = () => {
  const { t } = useTranslation();

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

  useEffect(() => {
    const fetchPersonnel = async () => {
      setIsPersonnelLoading(true);
      try {
        const response = await fetch(`${API_URL}/api/sqlserver/personnel`);
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

  useEffect(() => {
    if (isImportModalOpen) {
      loadLingesToImport(0, 50);
    }
  }, [isImportModalOpen]);

  // ✅ Normalisation des linges dès qu'ils arrivent du contexte
  const normalizedLinges = useMemo(
    () => (lingesToImport || []).map(normalizeLinge).filter(Boolean),
    [lingesToImport]
  );

  // ✅ Filtrage sur les champs normalisés
  const filteredLinges = useMemo(() => {
    return normalizedLinges.filter((l) => {
      const matchSearch =
        !searchTerm ||
        (l.designation || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (l.codeBarre || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchCategorie =
        filterCategorie === 'all' || l.categorie === filterCategorie;

      return matchSearch && matchCategorie;
    });
  }, [normalizedLinges, searchTerm, filterCategorie]);

  // ─── Badge état ─────────────────────────────────────────────────────────
  const getEtatBadge = (etat) => {
    const config = ETATS[etat] || {
      label: etat || 'Inconnu',
      color: '#64748b',
      bg: '#f1f5f9',
    };
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
        style={{ background: config.bg, color: config.color }}
      >
        {t(`linge_etat.${etat}`, config.label)}
      </span>
    );
  };

  const getServiceName = (serviceId) => {
    if (!serviceId) return t('linge.unassigned');
    const service = services.find((s) => s.id === serviceId);
    return service ? service.code || service.nom : t('linge.unassigned');
  };

  const getPorteurName = (porteurId) => {
    if (!porteurId) return t('linge.unassigned');
    const porteur = personnel.find((p) => p.id === porteurId);
    return porteur ? `${porteur.prenom} ${porteur.nom}` : t('linge.unassigned');
  };

  // ─── Sélection ──────────────────────────────────────────────────────────
  const isAllSelected =
    filteredLinges.length > 0 &&
    filteredLinges.every((l) =>
      selectedImportLinges.some((s) => s.id === l.id)
    );

  const handleSelectAll = () => {
    if (isAllSelected) {
      filteredLinges.forEach((l) => {
        if (selectedImportLinges.some((s) => s.id === l.id)) {
          toggleImportSelection(l.id);
        }
      });
    } else {
      filteredLinges.forEach((l) => {
        if (!selectedImportLinges.some((s) => s.id === l.id)) {
          toggleImportSelection(l.id);
        }
      });
    }
  };

  const handleServiceSelect = (serviceId) => {
    setSelectedServiceId(serviceId);
  };

  // ─── Import ─────────────────────────────────────────────────────────────
  const handleImport = async () => {
    if (selectedImportLinges.length === 0) {
      Swal.fire({
        title: t('linge.import_no_selection_title'),
        text: t('linge.import_no_selection_text'),
        icon: 'warning',
      });
      return;
    }

    if (!selectedServiceId) {
      const result = await Swal.fire({
        title: t('linge.import_service_required_title'),
        text: t('linge.import_service_required_text'),
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: t('common.choose_service'),
        cancelButtonText: t('common.cancel'),
      });
      if (!result.isConfirmed) return;
      const selectElement = document.querySelector('select[name="service-select"]');
      if (selectElement) selectElement.focus();
      return;
    }

    const payload = selectedImportLinges.map((item) => ({
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

  const isImportDisabled =
    selectedImportLinges.length === 0 || !selectedServiceId || isImportLoading;

  return (
    <Modal
      isOpen={isImportModalOpen}
      onClose={() => setIsImportModalOpen(false)}
      title={t('linge.import_linens')}
      size="xl"
    >
      <div className="space-y-4">
        {/* Info */}
        <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
          <p className="text-sm font-medium text-slate-700">
            ⚡ {t('linge.import_info')}
          </p>
        </div>

        {/* Sélection du service */}
        <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
          <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
            <Building className="w-4 h-4" />
            {t('linge.import_destination_service')} :
          </label>
          <select
            name="service-select"
            value={selectedServiceId || ''}
            onChange={(e) => handleServiceSelect(e.target.value || null)}
            className={`flex-1 px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              !selectedServiceId
                ? 'border-amber-300 bg-amber-50'
                : 'border-slate-200'
            }`}
          >
            <option value="">🔽 {t('common.select_service')}</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code || s.nom}
              </option>
            ))}
          </select>
          {selectedServiceId ? (
            <Badge variant="success" className="text-xs flex items-center gap-1">
              ✅ {getServiceName(selectedServiceId)}
            </Badge>
          ) : (
            <Badge variant="warning" className="text-xs flex items-center gap-1">
              ⚠️ {t('common.service_required')}
            </Badge>
          )}
        </div>

        {/* Barre de recherche et filtres */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={t('common.search_by_designation_or_code')}
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
            <option value="all">{t('common.all_categories')}</option>
            <option value="DRAP">{t('categories.DRAP')}</option>
            <option value="TAIE_OREILLER">{t('categories.TAIE_OREILLER')}</option>
            <option value="SERVIETTE_BAIN">{t('categories.SERVIETTE_BAIN')}</option>
            <option value="SERVIETTE_VISAGE">{t('categories.SERVIETTE_VISAGE')}</option>
            <option value="PEIGNOIR">{t('categories.PEIGNOIR')}</option>
            <option value="NAPPE">{t('categories.NAPPE')}</option>
            <option value="SERVIETTE_TABLE">{t('categories.SERVIETTE_TABLE')}</option>
            <option value="UNIFORME">{t('categories.UNIFORME')}</option>
            <option value="AUTRE">{t('categories.AUTRE')}</option>
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
            {isAllSelected
              ? t('common.deselect_all')
              : t('common.select_all')}
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
            {t('common.reset')}
          </Button>
        </div>

        {/* Compteurs */}
        <div className="flex justify-between items-center text-sm text-slate-500">
          <span>
            {filteredLinges.length} {t('common.items_found')}
          </span>
          <span className="font-medium text-indigo-600">
            {selectedImportLinges.length} {t('common.selected')}
            {selectedServiceId &&
              ` • ${t('common.service')}: ${getServiceName(selectedServiceId)}`}
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
                  <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600 uppercase">
                    {t('common.designation')}
                  </th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600 uppercase">
                    {t('common.barcode')}
                  </th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600 uppercase">
                    {t('common.category')}
                  </th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600 uppercase">
                    {t('common.status')}
                  </th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600 uppercase">
                    {t('common.service')}
                  </th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600 uppercase">
                    {t('common.carrier')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {isImportLoading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2 text-slate-400">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {t('common.loading')}
                      </div>
                    </td>
                  </tr>
                ) : filteredLinges.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400">
                      {searchTerm ? t('common.no_match') : t('common.no_items')}
                    </td>
                  </tr>
                ) : (
                  filteredLinges.map((linge) => {
                    const isSelected = selectedImportLinges.some(
                      (s) => s.id === linge.id
                    );
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
                            <span className="font-medium text-sm">
                              {linge.designation || 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <code className="text-xs font-mono text-indigo-600">
                            {linge.codeBarre || '-'}
                          </code>
                        </td>
                        <td className="px-3 py-2">
                          <Badge variant="outline" className="text-xs">
                            {t(
                              `categories.${linge.categorie}`,
                              linge.categorie || 'AUTRE'
                            )}
                          </Badge>
                        </td>
                        <td className="px-3 py-2">{getEtatBadge(linge.etat)}</td>
                        <td className="px-3 py-2 text-sm">
                          {linge.serviceNom ||
                            getServiceName(linge.serviceId) ||
                            '-'}
                        </td>
                        <td className="px-3 py-2">
                          {linge.porteurNom ? (
                            <span className="text-xs font-medium text-blue-600 flex items-center gap-1">
                              <User className="w-3 h-3" /> {linge.porteurNom}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">
                              {t('common.unassigned')}
                            </span>
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
              {t('common.page')} {currentPage + 1} / {totalPages}
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

        {/* Actions */}
        <div className="flex justify-between items-center pt-4 border-t border-slate-200">
          <div className="text-sm text-slate-500">
            {selectedImportLinges.length} {t('common.selected')}
            {selectedServiceId && (
              <span className="ml-2 text-indigo-600">
                → {t('common.service')}: {getServiceName(selectedServiceId)}
              </span>
            )}
            {!selectedServiceId && (
              <span className="ml-2 text-amber-600">
                ⚠️ {t('common.service_not_selected')}
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setIsImportModalOpen(false)}
              disabled={isImportLoading}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleImport}
              disabled={isImportDisabled}
              className={
                isImportDisabled
                  ? 'opacity-50 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }
              title={
                isImportDisabled
                  ? !selectedServiceId
                    ? t('common.select_service')
                    : selectedImportLinges.length === 0
                    ? t('common.select_items')
                    : t('common.importing')
                  : ''
              }
            >
              {isImportLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('common.importing')}
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  {t('common.import_count', {
                    count: selectedImportLinges.length,
                  })}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};