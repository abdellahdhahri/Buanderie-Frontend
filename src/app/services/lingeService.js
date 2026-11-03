const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8082';

export const lingeService = {
  // Récupérer tous les services
  async getServices() {
    const response = await fetch(`${API_URL}/api/services`);
    if (!response.ok) throw new Error('Erreur lors du chargement des services');
    return response.json();
  },

  // Récupérer tout le personnel
  async getPersonnel() {
    const response = await fetch(`${API_URL}/api/personnel?actifs=true`);
    if (!response.ok) throw new Error('Erreur lors du chargement du personnel');
    return response.json();
  }
};
