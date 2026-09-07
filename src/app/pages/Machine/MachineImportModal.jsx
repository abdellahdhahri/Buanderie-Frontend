
import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/modal';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { 
  Search, 
  Check, 
  CheckSquare, 
  Square, 
  Package,
  Barcode,
  Loader2,
} from 'lucide-react';
import { useMachineContext } from '../../contextes/MachineContext';

const ETATS_TECHNIQUES = {
  FONCTIONNEL: { label: 'Fonctionnel', color: '#10b981', bg: '#d1fae5' },
  EN_PANNE: { label: 'En panne', color: '#ef4444', bg: '#fee2e2' },
  EN_MAINTENANCE: { label: 'En maintenance', color: '#f59e0b', bg: '#fef3c7' },
  HORS_SERVICE: { label: 'Hors service', color: '#64748b', bg: '#f1f5f9' },
};

const ETATS_IMMOBILISATION = {
  DISPONIBLE: { label: 'Disponible', color: '#10b981', bg: '#d1fae5' },
  OCCUPE: { label: 'Occupé', color: '#3b82f6', bg: '#dbeafe' },
  EN_REPARATION: { label: 'En réparation', color: '#f59e0b', bg: '#fef3c7' },
  IMMOBILISE: { label: 'Immobilisé', color: '#ef4444', bg: '#fee2e2' },
};

export const MachineImportModal = () => {
  const {
    isImportModalOpen,
    setIsImportModalOpen,
    machinesToImport,
    selectedImportMachines,
    isImportLoading,
    importType,
    loadMachinesToImport,
    importMachines,
    toggleImportSelection,
    selectAllImportMachines,
  } = useMachineContext();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    if (isImportModalOpen) {
      loadMachinesToImport();
    }
  }, [isImportModalOpen, loadMachinesToImport]);

  // Filtrer les machines
  const filteredMachines = machinesToImport.filter(m => {
    const matchSearch = 
      (m.designation || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.marque || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.codeBarre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.numeroSerie || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.modele || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchType = filterType === 'all' || m.type === filterType;
    
    return matchSearch && matchType;
  });

  const getTypeLabel = (type) => {
    if (type === 'LAVEUR' || type === 0) return '🧺 Laveur';
    if (type === 'SECHEUR' || type === 1) return '🌬️ Sécheur';
    return type || 'N/A';
  };

  const getEtatBadge = (etat, type) => {
    const configs = type === 'technique' ? ETATS_TECHNIQUES : ETATS_IMMOBILISATION;
    const config = configs[etat] || { label: etat || 'Inconnu', color: '#64748b', bg: '#f1f5f9' };
    return (
      <span 
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
        style={{ background: config.bg, color: config.color }}
      >
        {config.label}
      </span>
    );
  };

  const isAllSelected = filteredMachines.length > 0 && 
    filteredMachines.every(m => selectedImportMachines.includes(m.id));

  const typeLabel = importType === 'LAVEUR' ? 'Laveurs' : 'Sécheurs';

  return (
    <Modal
      isOpen={isImportModalOpen}
      onClose={() => setIsImportModalOpen(false)}
      title={`📥 Importer des ${typeLabel}`}
      size="xl"
    >
      <div className="space-y-4">
        {/* Bandeau d'information sur le type */}
        <div className={`p-3 rounded-lg ${importType === 'LAVEUR' ? 'bg-blue-50 border border-blue-200' : 'bg-amber-50 border border-amber-200'}`}>
          <p className="text-sm font-medium text-slate-700">
            ⚡ Les machines sélectionnées seront importées en tant que <strong>{importType === 'LAVEUR' ? '🧺 Laveurs' : '🌬️ Sécheurs'}</strong>
          </p>
        </div>

        {/* Barre d'outils */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par désignation, marque, code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Tous les types</option>
            <option value="LAVEUR">Laveur</option>
            <option value="SECHEUR">Sécheur</option>
          </select>

          <Button
            variant="outline"
            onClick={selectAllImportMachines}
            disabled={filteredMachines.length === 0}
            className="flex items-center gap-2"
          >
            {isAllSelected ? (
              <CheckSquare className="w-4 h-4" />
            ) : (
              <Square className="w-4 h-4" />
            )}
            {isAllSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
          </Button>
        </div>

        {/* Compteur */}
        <div className="flex justify-between items-center text-sm text-slate-500">
          <span>
            {filteredMachines.length} machine(s) trouvée(s)
          </span>
          <span className="font-medium text-indigo-600">
            {selectedImportMachines.length} sélectionnée(s)
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
                      onClick={selectAllImportMachines}
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
                  <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600 uppercase">Marque</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600 uppercase">Modèle</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600 uppercase">Code Barre</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600 uppercase">Type</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600 uppercase">État Technique</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600 uppercase">Disponibilité</th>
                </tr>
              </thead>
              <tbody>
                {isImportLoading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2 text-slate-400">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Chargement...
                      </div>
                    </td>
                  </tr>
                ) : filteredMachines.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-slate-400">
                      {searchTerm ? 'Aucune machine correspondante' : 'Aucune machine à importer'}
                    </td>
                  </tr>
                ) : (
                  filteredMachines.map((machine) => (
                    <tr
                      key={machine.id}
                      onClick={() => toggleImportSelection(machine.id)}
                      className={`border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors ${
                        selectedImportMachines.includes(machine.id) ? 'bg-indigo-50' : ''
                      }`}
                    >
                      <td className="px-3 py-2 text-center">
                        <div className="flex items-center justify-center">
                          {selectedImportMachines.includes(machine.id) ? (
                            <Check className="w-4 h-4 text-indigo-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300" />
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-slate-400" />
                          <span className="font-medium text-sm">{machine.designation || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-sm">{machine.marque || '-'}</td>
                      <td className="px-3 py-2 text-sm">{machine.modele || '-'}</td>
                      <td className="px-3 py-2">
                        <code className="text-xs font-mono text-indigo-600">
                          {machine.codeBarre || '-'}
                        </code>
                      </td>
                      <td className="px-3 py-2">
                        <Badge className="text-xs">
                          {getTypeLabel(machine.type)}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        {getEtatBadge(machine.etatTechnique || 'FONCTIONNEL', 'technique')}
                      </td>
                      <td className="px-3 py-2">
                        {getEtatBadge(machine.etatImmobilisation || 'DISPONIBLE', 'immobilisation')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pied de page */}
        <div className="flex justify-between items-center pt-4 border-t border-slate-200">
          <div className="text-sm text-slate-500">
            {selectedImportMachines.length} machine(s) sélectionnée(s)
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
              onClick={importMachines}
              disabled={selectedImportMachines.length === 0 || isImportLoading}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isImportLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Import en cours...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Importer {selectedImportMachines.length} {importType === 'LAVEUR' ? 'laveur(s)' : 'sécheur(s)'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};