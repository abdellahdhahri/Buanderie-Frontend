const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

export const pliageService = {
  async getLingeByCode(code) {
    const response = await fetch(`${API_URL}/api/linge/code/${encodeURIComponent(code)}`);

    if (!response.ok) {
      throw new Error(`Linge [${code}] non trouvé`);
    }

    return response.json();
  },

  async plier(agentMatricule, codeOuTag) {
    const response = await fetch(`${API_URL}/api/pliage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matriculeAgent: agentMatricule,
        codeOuTag: codeOuTag
      })
    });

    if (!response.ok) {
      const error = await response.text();
      let message = error;
      try { message = JSON.parse(error).message || error; } catch { message = error; }
      throw new Error(message);
    }

    return response.json();
  },

  validateEtatLinge(item) {
    return Boolean(item);
  }
};