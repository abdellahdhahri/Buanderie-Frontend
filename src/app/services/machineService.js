
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8082';

export const machineService = {
  // Récupérer toutes les machines
  async getAll() {
    const response = await fetch(`${API_URL}/api/machines`);
    if (!response.ok) throw new Error('Erreur lors du chargement des machines');
    return response.json();
  },

  // Récupérer une machine par ID
  async getById(id) {
    const response = await fetch(`${API_URL}/api/machines/${id}`);
    if (!response.ok) throw new Error('Machine non trouvée');
    return response.json();
  },

  // Créer une machine
  async create(data) {
    const response = await fetch(`${API_URL}/api/machines`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Erreur lors de la création');
    }
    return response.json();
  },

  // Mettre à jour une machine
  async update(id, data) {
    const response = await fetch(`${API_URL}/api/machines/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Erreur lors de la mise à jour');
    }
    return response.json();
  },

  // Supprimer une machine
  async delete(id) {
    const response = await fetch(`${API_URL}/api/machines/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Erreur lors de la suppression');
    }
    return true;
  },

  // Récupérer les machines à importer
  async getMachinesToImport() {
    const response = await fetch(`${API_URL}/api/machines/machinesAimporter`);
    if (!response.ok) throw new Error('Erreur lors du chargement des machines à importer');
    const data = await response.json();
    
    // Transformer le tableau de tableaux en tableau d'objets
    return data.map(item => ({
      id: item[0],
      designation: item[1] || 'N/A',
      type: item[2] === 0 ? 'LAVEUR' : 'SECHEUR',
      numeroSerie: item[3] ? String(item[3]) : '',
      marque: item[4] ? String(item[4]) : '',
      codeBarre: item[5] ? String(item[5]) : '',
      modele: item[6] ? String(item[6]) : '',
      etatTechnique: 'FONCTIONNEL',
      etatImmobilisation: 'DISPONIBLE',
    }));
  },

  // Importer les machines sélectionnées
  async importMachines(machines) {
    const response = await fetch(`${API_URL}/api/machines/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(machines),
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Erreur lors de l\'import');
    }
    return response.json();
  },
};