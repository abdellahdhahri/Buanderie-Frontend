import { apiCall } from "../../components/pages/Collecte/collecteUtils"

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8082';

export const collecteService = {
  /**
   * Récupère un service par son code
   */
  getServiceByCode: async (code) => {
    const response = await fetch(
      `${API_URL}/api/services/ref/${encodeURIComponent(code)}`
    );
    if (!response.ok) return null;
    return response.json();
  },

  /**
   * Ouvre une nouvelle collecte pour un service
   */
  ouvrirCollecte: async (matriculeAgent, serviceId) => {
    return apiCall("/api/collecte/service/ouvrir", {
      matriculeAgent,
      serviceId
    });
  },

  /**
   * Scanne un bac pour la collecte
   */
  scannerBac: async (collecteId, codeOuTag) => {
    return apiCall(
      `/api/collecte/service/${collecteId}/bac`,
      { codeOuTag }
    );
  },

  /**
   * Traite un linge blanc
   */
  traiterBlanc: async (collecteId, bacId, codeOuTag) => {
    return apiCall(
      `/api/collecte/service/${collecteId}/blanc`,
      { bacId, codeOuTag }
    );
  },

  /**
   * Marque un linge comme propre
   */
  marquerPropre: async (collecteId, codeOuTag) => {
    return apiCall(
      `/api/collecte/service/${collecteId}/propre`,
      { codeOuTag }
    );
  },

  /**
   * Marque un linge comme manquant
   */
  marquerManquant: async (collecteId, lingeId) => {
    return apiCall(
      `/api/collecte/service/${collecteId}/manquant`,
      { lingeId }
    );
  },

  declarerQuantitesInfectees: async (collecteId, { matriculeAgent, serviceId, chambre, observations, bacId, items }) => {
    return apiCall(
      `/api/collecte/service/${collecteId}/infecte`,
      {},
      "POST",
      { matriculeAgent, serviceId, chambre, observations, bacId, items }
    );
  },

  /**
   * Clôture la collecte
   */
  cloturerCollecte: async (collecteId) => {
    return apiCall(`/api/collecte/service/${collecteId}/cloturer`);
  }
};