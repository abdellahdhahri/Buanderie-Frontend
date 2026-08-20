
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8082';

const STORAGE_KEY = 'agent';

export const POSTE_TO_ROUTE = {
  AGENT_COLLECTE: '/collecte',
  AGENT_RECEPTION: '/receptions',
  AGENT_TRI: '/tri',
  AGENT_LAVAGE: '/lavages',
  AGENT_SECHAGE: '/sechages',
  AGENT_PLIAGE: '/pliage',
  AGENT_STOCKAGE: '/stockage',
  AGENT_LIVRAISON: '/livraisons',
  CHEF_EQUIPE: '/collecte'
};

export const getAgent = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    return JSON.parse(data);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'agent:', error);
    return null;
  }
};

export const getAgentMatricule = () => {
  const agent = getAgent();
  return agent?.matricule || null;
};

export const isAgentConnected = () => {
  return getAgent() !== null;
};

export const authenticateAgent = async (matricule) => {
  try {
    const response = await fetch(`${API_URL}/api/agents/matricule/${matricule}`);
    
    if (!response.ok) {
      throw new Error('Agent introuvable');
    }
    
    const agent = await response.json();
    
    // Vérifier si l'agent a un poste configuré
    if (!agent.poste || !POSTE_TO_ROUTE[agent.poste]) {
      throw new Error(`Poste non configuré pour ${agent.nom}`);
    }
    
    // Sauvegarder l'agent
    const agentData = {
      matricule: agent.matricule,
      nom: agent.nom,
      poste: agent.poste,
      prenom: agent.prenom || '',
      email: agent.email || '',
      telephone: agent.telephone || ''
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(agentData));
    return agentData;
    
  } catch (error) {
    console.error('Erreur d\'authentification:', error);
    throw error;
  }
};

export const logoutAgent = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
    return false;
  }
};

export const getAgentRoute = () => {
  const agent = getAgent();
  if (!agent) return null;
  return POSTE_TO_ROUTE[agent.poste] || null;
};

export const getAgentPosteName = () => {
  const agent = getAgent();
  if (!agent) return null;
  return agent.poste?.replace('AGENT_', '') || agent.poste || 'Poste non défini';
};

export const updateAgent = (updates) => {
  try {
    const currentAgent = getAgent();
    if (!currentAgent) return null;
    
    const updatedAgent = { ...currentAgent, ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedAgent));
    return updatedAgent;
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'agent:', error);
    return null;
  }
};

export const hasPoste = (poste) => {
  const agent = getAgent();
  if (!agent) return false;
  return agent.poste === poste;
};

export const hasAnyPoste = (postes) => {
  const agent = getAgent();
  if (!agent) return false;
  return postes.includes(agent.poste);
};

export const fetchAllAgents = async () => {
  try {
    const response = await fetch(`${API_URL}/api/agents`);
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des agents');
    }
    return await response.json();
  } catch (error) {
    console.error('Erreur:', error);
    throw error;
  }
};

export const fetchAgentByMatricule = async (matricule) => {
  try {
    const response = await fetch(`${API_URL}/api/agents/matricule/${matricule}`);
    if (!response.ok) {
      throw new Error('Agent introuvable');
    }
    return await response.json();
  } catch (error) {
    console.error('Erreur:', error);
    throw error;
  }
};

export const fetchAgentsByPoste = async (poste) => {
  try {
    const response = await fetch(`${API_URL}/api/agents/poste/${poste}`);
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des agents');
    }
    return await response.json();
  } catch (error) {
    console.error('Erreur:', error);
    throw error;
  }
};

export default {
  getAgent,
  getAgentMatricule,
  isAgentConnected,
  authenticateAgent,
  logoutAgent,
  getAgentRoute,
  getAgentPosteName,
  updateAgent,
  hasPoste,
  hasAnyPoste,
  fetchAllAgents,
  fetchAgentByMatricule,
  fetchAgentsByPoste,
  POSTE_TO_ROUTE,
  STORAGE_KEY
};