
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { machineService } from '../services/machineService';
import Swal from 'sweetalert2';

const MachineContext = createContext();

export const useMachineContext = () => {
  const context = useContext(MachineContext);
  if (!context) {
    throw new Error('useMachineContext must be used within MachineProvider');
  }
  return context;
};

export const MachineProvider = ({ children }) => {
  const [machines, setMachines] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
  });

  // États pour l'import
  const [machinesToImport, setMachinesToImport] = useState([]);
  const [selectedImportMachines, setSelectedImportMachines] = useState([]);
  const [isImportLoading, setIsImportLoading] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importType, setImportType] = useState('LAVEUR'); // Nouveau : type actif pour l'import

  // Charger toutes les machines
  const loadMachines = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await machineService.getAll();
      setMachines(data);
      setPagination(prev => ({
        ...prev,
        totalItems: data.length,
      }));
    } catch (err) {
      setError(err.message);
      console.error('❌ Erreur chargement machines:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Charger les machines à importer
  const loadMachinesToImport = useCallback(async () => {
    setIsImportLoading(true);
    setError(null);
    try {
      const data = await machineService.getMachinesToImport();
      console.log('📦 Machines à importer reçues:', data);
      setMachinesToImport(data);
      setSelectedImportMachines([]);
    } catch (err) {
      setError(err.message);
      Swal.fire({
        title: '❌ Erreur',
        text: err.message || 'Impossible de charger les machines à importer',
        icon: 'error',
      });
    } finally {
      setIsImportLoading(false);
    }
  }, []);

  // Importer les machines sélectionnées avec le type actif
  const importMachines = useCallback(async () => {
    if (selectedImportMachines.length === 0) {
      Swal.fire({
        title: '⚠️ Aucune sélection',
        text: 'Veuillez sélectionner au moins une machine à importer',
        icon: 'warning',
      });
      return;
    }

    setIsImportLoading(true);
    try {
      // Construire le payload avec le type actif (LAVEUR ou SECHEUR)
      const payload = selectedImportMachines.map(id => ({
        id: id,
        type: importType, // Utiliser le type de l'onglet actif
      }));

      console.log(`📤 Payload d'import pour ${importType}:`, payload);

      const result = await machineService.importMachines(payload);
      
      Swal.fire({
        title: '✅ Import réussi',
        text: `${result.length || selectedImportMachines.length} machine(s) ${importType === 'LAVEUR' ? 'laveuse(s)' : 'sécheuse(s)'} importée(s) avec succès`,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
      });

      // Fermer le modal et recharger la liste
      setIsImportModalOpen(false);
      setSelectedImportMachines([]);
      await loadMachines();
      
      return result;
    } catch (err) {
      Swal.fire({
        title: '❌ Erreur d\'import',
        text: err.message || 'Une erreur est survenue lors de l\'import',
        icon: 'error',
      });
      throw err;
    } finally {
      setIsImportLoading(false);
    }
  }, [selectedImportMachines, importType, loadMachines]);

  // Créer une machine
  const createMachine = useCallback(async (data) => {
    setIsLoading(true);
    try {
      const newMachine = await machineService.create(data);
      setMachines(prev => [newMachine, ...prev]);
      setPagination(prev => ({
        ...prev,
        totalItems: prev.totalItems + 1,
      }));
      return newMachine;
    } catch (err) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Mettre à jour une machine
  const updateMachine = useCallback(async (id, data) => {
    setIsLoading(true);
    try {
      const updated = await machineService.update(id, data);
      setMachines(prev => prev.map(m => m.id === id ? updated : m));
      return updated;
    } catch (err) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Supprimer une machine
  const deleteMachine = useCallback(async (id) => {
    setIsLoading(true);
    try {
      await machineService.delete(id);
      setMachines(prev => prev.filter(m => m.id !== id));
      setPagination(prev => ({
        ...prev,
        totalItems: prev.totalItems - 1,
      }));
      return true;
    } catch (err) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sélectionner/désélectionner une machine pour l'import
  const toggleImportSelection = useCallback((id) => {
    setSelectedImportMachines(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  }, []);

  // Sélectionner toutes les machines pour l'import
  const selectAllImportMachines = useCallback(() => {
    if (selectedImportMachines.length === machinesToImport.length) {
      setSelectedImportMachines([]);
    } else {
      setSelectedImportMachines(machinesToImport.map(m => m.id));
    }
  }, [machinesToImport, selectedImportMachines]);

  // Charger au montage
  useEffect(() => {
    loadMachines();
  }, [loadMachines]);

  const value = {
    machines,
    isLoading,
    error,
    pagination,
    setPagination,
    loadMachines,
    createMachine,
    updateMachine,
    deleteMachine,
    machinesToImport,
    selectedImportMachines,
    isImportLoading,
    isImportModalOpen,
    setIsImportModalOpen,
    importType,
    setImportType, // Nouvelle fonction
    loadMachinesToImport,
    importMachines,
    toggleImportSelection,
    selectAllImportMachines,
  };

  return (
    <MachineContext.Provider value={value}>
      {children}
    </MachineContext.Provider>
  );
};