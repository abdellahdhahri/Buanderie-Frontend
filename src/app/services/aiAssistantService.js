const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

/**
 * Envoie une question à l'assistant IA
 * @param {string} question - La question de l'utilisateur
 * @returns {Promise<string>} - La réponse du backend
 */
export const askAssistant = async (question) => {
  if (!question || !question.trim()) {
    throw new Error("Question vide");
  }

  const response = await fetch(`${API_URL}/api/ai/assistant`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question: question.trim() }),
  });

  if (!response.ok) {
    throw new Error(`Erreur ${response.status}`);
  }

  const data = await response.json();
  return data.answer || "Aucune réponse reçue.";
};