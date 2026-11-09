
import React, { createContext, useState, useEffect, useContext } from "react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

export const ServiceContext = createContext();

export const useServiceContext = () => {
  const context = useContext(ServiceContext);
  if (!context) {
    throw new Error("useServiceContext must be used within a ServiceProvider");
  }
  return context;
};

export const ServiceProvider = ({ children }) => {
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchServices = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/services`
        );

        if (!response.ok) {
          throw new Error(`Erreur HTTP ${response.status}`);
        }

        const data = await response.json();

        // Normaliser les données
        const list = (Array.isArray(data) ? data : data.content || []).map((s) => ({
          id: s.id,
          nom: s.code || s.nom || `Service ${s.id}`,
          code: s.code || s.nom,
          description: s.description || s.nom || "",
          type: s.typeService || s.type || null,
          reference: s.reference || null,
          source: s.source || null,
          actif: s.actif !== false,
        }));

        setServices(list);
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

  const getChambresByServiceId = async (serviceId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chambres`);

      if (!response.ok) {
        throw new Error(
          `Erreur lors du chargement des chambres (${response.status})`
        );
      }

      const data = await response.json();
      return (Array.isArray(data) ? data : []).filter((c) => c.serviceId === serviceId);
    } catch (error) {
      console.error("❌ Erreur getChambresByServiceId :", error);
      throw error;
    }
  };

  const getServiceById = (serviceId) => {
    return services.find((s) => s.id === serviceId) || null;
  };

  const getServiceByCode = (code) => {
    return services.find((s) => s.code === code) || null;
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