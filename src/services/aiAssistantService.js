const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

/**

 * @param {string} question 
 * @returns {Promise<string>}
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