export const mapAgentFromData = (agentData) => {
  if (!agentData) return null;

  return {
    matricule: agentData.codeBarre || agentData.matricule || '',
    nom: agentData.nom || 'Inconnu',
    prenom: agentData.prenom || '',
    nomPrenom: agentData.nomPrenom || agentData.nom || 'Inconnu',
    codeBarre: agentData.codeBarre || agentData.matricule || '',
    id: agentData.id || null,
    poste: agentData.poste || agentData.fonction || 'AGENT_PLIAGE'
  };
};

export const mapAgentToApi = (agent) => ({
  matricule: agent.matricule,
  nom: agent.nom,
  prenom: agent.prenom,
  codeBarre: agent.codeBarre,
  id: agent.id,
  poste: agent.poste
});