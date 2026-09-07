// src/contextes/ServiceContext.jsx

import React, { createContext, useState, useEffect, useContext } from "react";

export const ServiceContext = createContext();

// ─── HOOK PERSONNALISÉ ────────────────────────────────────────────────────
export const useServiceContext = () => {
  const context = useContext(ServiceContext);
  if (!context) {
    throw new Error('useServiceContext must be used within a ServiceProvider');
  }
  return context;
};

export const ServiceProvider = ({ children }) => {
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // ─── CHARGEMENT DES SERVICES ───────────────────────────────────────────
  useEffect(() => {
    const fetchServices = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch("http://localhost:8082/api/sqlserver/services?page=0&size=200");
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP ${response.status}`);
        }
        
        const data = await response.json();
        console.log("📦 Liste des services brute :", data.content);
        
        // Normaliser les données
        const list = (data.content || data || []).map(s => ({
          id: s.id,
          nom: s.code || s.nom || `Service ${s.id}`,
          code: s.code || s.nom,
          description: s.description || s.nom || '',
          type: s.typeService || s.type || null,
        }));
        
        setServices(list);
        console.log("✅ Liste des services normalisée :", list);
      } catch (err) {
        console.error("❌ Erreur fetch services :", err);
        setError(err.message);
        setServices([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchServices();
  }, []);

  // ─── RÉCUPÉRER LES CHAMBRES D'UN SERVICE ──────────────────────────────
  const getChambresByServiceId = async (serviceId, page = 0, size = 300) => {
    try {
      const response = await fetch(
        `http://localhost:8082/api/sqlserver/chambres/service/${serviceId}?page=${page}&size=${size}`
      );

      if (!response.ok) {
        throw new Error(
          `Erreur lors du chargement des chambres (${response.status})`
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("❌ Erreur getChambresByServiceId :", error);
      throw error;
    }
  };

  // ─── RÉCUPÉRER UN SERVICE PAR SON ID ──────────────────────────────────
  const getServiceById = (serviceId) => {
    return services.find(s => s.id === serviceId) || null;
  };

  // ─── RÉCUPÉRER UN SERVICE PAR SON CODE ────────────────────────────────
  const getServiceByCode = (code) => {
    return services.find(s => s.code === code) || null;
  };

  const value = {
    services,
    setServices,
    isLoading,
    error,
    getChambresByServiceId,
    getServiceById,
    getServiceByCode,
  };

  return (
    <ServiceContext.Provider value={value}>
      {children}
    </ServiceContext.Provider>
  );
};