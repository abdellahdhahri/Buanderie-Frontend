const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8082';

export const lingeService = {
  // Récupérer les linges à importer avec pagination
  async getLingesToImport(page = 0, size = 50) {
    const response = await fetch(`${API_URL}/api/linges/a-importer?page=${page}&size=${size}`);
    if (!response.ok) throw new Error('Erreur lors du chargement des linges à importer');
    return response.json();
  },

  // Importer les linges sélectionnés
  async importLinges(linges) {
    const response = await fetch(`${API_URL}/api/linges/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(linges),
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Erreur lors de l\'import');
    }
    return response.json();
  },

  // Récupérer tous les services
  async getServices() {
    const response = await fetch(`${API_URL}/api/services`);
    if (!response.ok) throw new Error('Erreur lors du chargement des services');
    return response.json();
  },

  // Récupérer tout le personnel
  async getPersonnel() {
    const response = await fetch(`${API_URL}/api/sqlserver/personnel`);
    if (!response.ok) throw new Error('Erreur lors du chargement du personnel');
    return response.json();
  }
};