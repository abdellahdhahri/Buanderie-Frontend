// src/config/chatbotSuggestions.js

export const INITIAL_SUGGESTIONS = [
  "chatbot.suggestions.washing_count",
  "chatbot.suggestions.blocked_linens",
  "chatbot.suggestions.stock_count",
  "chatbot.suggestions.stock_status",
  "chatbot.suggestions.drying_linens",
  "chatbot.suggestions.linen_tracking",
];

export const CONTEXTUAL_SUGGESTIONS = {
  lavage: [
    "chatbot.suggestions.blocked_in_wash",
    "chatbot.suggestions.drying_linens",
    "chatbot.suggestions.stock_count",
  ],
  bloque: [
    "chatbot.suggestions.how_long",
    "chatbot.suggestions.which_states",
    "chatbot.suggestions.which_services",
  ],
  stock: [
    "chatbot.suggestions.critical_stock",
    "chatbot.suggestions.stock_categories",
    "chatbot.suggestions.washing_count",
  ],
  collecte: [
    "chatbot.suggestions.missing_linens",
    "chatbot.suggestions.infected_linens",
    "chatbot.suggestions.today_collections",
  ],
  default: INITIAL_SUGGESTIONS,
};

// ✅ Détection du contexte à partir de la réponse
export const detectContext = (answer = "") => {
  const lower = answer.toLowerCase();
  if (lower.includes("lavage")) return "lavage";
  if (lower.includes("bloqué") || lower.includes("bloqué")) return "bloque";
  if (lower.includes("stock")) return "stock";
  if (lower.includes("collecte")) return "collecte";
  return "default";
};