import { lireErreur } from "./integrationService";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

export const machineService = {
  getAll: async () => {
    const response = await fetch(`${API_URL}/api/machines`);
    if (!response.ok) throw new Error("Erreur chargement machines");
    return response.json();
  },

  getById: async (id) => {
    const response = await fetch(`${API_URL}/api/machines/${id}`);
    if (!response.ok) throw new Error(`Machine ${id} introuvable`);
    return response.json();
  },

  create: async (data) => {
    const response = await fetch(`${API_URL}/api/machines`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(await lireErreur(response, "Erreur création machine"));
    return response.json();
  },

  update: async (id, data) => {
    const response = await fetch(`${API_URL}/api/machines/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(await lireErreur(response, `Erreur mise à jour machine ${id}`));
    return response.json();
  },

  delete: async (id) => {
    const response = await fetch(`${API_URL}/api/machines/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error(await lireErreur(response, `Erreur suppression machine ${id}`));
    return response.json();
  },

  getCycles: async () => {
    const response = await fetch(`${API_URL}/api/lavage/cycles`);
    if (!response.ok) throw new Error("Erreur chargement cycles");
    return response.json();
  },

  getCycleById: async (id) => {
    const response = await fetch(`${API_URL}/api/lavage/cycles/${id}`);
    if (!response.ok) throw new Error(`Cycle ${id} introuvable`);
    return response.json();
  },

  terminerCycle: async (cycleId) => {
    const response = await fetch(`${API_URL}/api/lavage/${cycleId}/finish`, {
      method: "PUT",
    });
    if (!response.ok) throw new Error("Erreur terminaison cycle");
    return response.json();
  },

  demarrerCycle: async (machineId, programmeId, lots) => {
    const response = await fetch(`${API_URL}/api/lavage/demarrer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        machineId,
        programmeId,
        lots,
      }),
    });
    if (!response.ok) throw new Error("Erreur démarrage cycle");
    return response.json();
  },
};
