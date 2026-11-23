import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { machineService } from '../services/machineService';
import Swal from "../components/kit/dialogueApi";

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
  const [cycles, setCycles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
  });

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
      setLastRefresh(new Date());
      return data;
    } catch (err) {
      setError(err.message);
      console.error('❌ Erreur chargement machines:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadCycles = useCallback(async () => {
    try {
      const data = await machineService.getCycles();
      setCycles(data);
      return data;
    } catch (err) {
      console.error('❌ Erreur chargement cycles:', err);
      throw err;
    }
  }, []);

  // ─── Charger toutes les données (machines + cycles) ──────────────────────
  const loadAllData = useCallback(async () => {
    try {
      const [machinesData, cyclesData] = await Promise.all([
        loadMachines(),
        loadCycles()
      ]);
      setLastRefresh(new Date());
      return { machines: machinesData, cycles: cyclesData };
    } catch (err) {
      console.error('❌ Erreur chargement données:', err);
      throw err;
    }
  }, [loadMachines, loadCycles]);

  // ─── Terminer un cycle ─────────────────────────────────────────────────────
  const terminerCycle = useCallback(async (cycleId) => {
    try {
      const result = await machineService.terminerCycle(cycleId);
      await loadAllData(); // Recharger tout après l'action
      Swal.fire({
        title: '✅ Cycle terminé',
        text: 'Le cycle de lavage a été terminé avec succès',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
      });
      return result;
    } catch (err) {
      Swal.fire({
        title: '❌ Erreur',
        text: err.message || 'Impossible de terminer le cycle',
        icon: 'error',
      });
      throw err;
    }
  }, [loadAllData]);

  // ─── Démarrer un cycle ─────────────────────────────────────────────────────
  const demarrerCycle = useCallback(async (machineId, programmeId, lots) => {
    try {
      const result = await machineService.demarrerCycle(machineId, programmeId, lots);
      await loadAllData();
      Swal.fire({
        title: '✅ Cycle démarré',
        text: 'Le cycle de lavage a été démarré avec succès',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
      });
      return result;
    } catch (err) {
      Swal.fire({
        title: '❌ Erreur',
        text: err.message || 'Impossible de démarrer le cycle',
        icon: 'error',
      });
      throw err;
    }
  }, [loadAllData]);

  // ─── Mettre à jour une machine ────────────────────────────────────────────
  const updateMachine = useCallback(async (id, data) => {
    setIsLoading(true);
    try {
      const updated = await machineService.update(id, data);
      setMachines(prev => prev.map(m => m.id === id ? updated : m));
      await loadCycles();
      return updated;
    } catch (err) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [loadCycles]);

  // ─── Créer une machine ────────────────────────────────────────────────────
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

  // ─── Supprimer une machine ────────────────────────────────────────────────
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

  // ─── Initialisation ───────────────────────────────────────────────────────
  useEffect(() => {
    loadAllData();
  }, []);

  // ─── Auto-refresh toutes les 5 secondes ──────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      loadCycles(); 
    }, 50000);
    return () => clearInterval(interval);
  }, [loadCycles]);

  const value = {
    machines,
    cycles,
    isLoading,
    error,
    lastRefresh,
    pagination,
    setPagination,
    
    loadMachines,
    loadCycles,
    loadAllData,
    createMachine,
    updateMachine,
    deleteMachine,
    
    terminerCycle,
    demarrerCycle,
  };

  return (
    <MachineContext.Provider value={value}>
      {children}
    </MachineContext.Provider>
  );
};