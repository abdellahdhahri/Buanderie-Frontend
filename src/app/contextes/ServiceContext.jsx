
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
          `${API_BASE_URL}/api/sqlserver/services?page=0&size=200`
        );

        if (!response.ok) {
          throw new Error(`Erreur HTTP ${response.status}`);
        }

        const data = await response.json();

        // Normaliser les données
        const list = (data.content || data || []).map((s) => ({
          id: s.id,
          nom: s.code || s.nom || `Service ${s.id}`,
          code: s.code || s.nom,
          description: s.description || s.nom || "",
          type: s.typeService || s.type || null,
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

  const getChambresByServiceId = async (serviceId, page = 0, size = 300) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/sqlserver/chambres/service/${serviceId}?page=${page}&size=${size}`
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