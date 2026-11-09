import React from "react";

// Couleur des actions « étiquette » : teal du thème général
export const LABEL_COLOR = "#0d9488";

/**
 * Icône d'impression d'étiquette : étiquette à œillet avec code-barres.
 * Suit la couleur du texte (currentColor) ; className pour la taille.
 */
export function LabelIcon({ className = "w-4 h-4", strokeWidth = 2 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Étiquette */}
      <path d="M3 6.5A2.5 2.5 0 0 1 5.5 4h13A2.5 2.5 0 0 1 21 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5z" />
      {/* Barres du code */}
      <path d="M7 8v6" />
      <path d="M9.5 8v6" strokeWidth={strokeWidth * 0.6} />
      <path d="M11.5 8v6" />
      <path d="M14 8v6" strokeWidth={strokeWidth * 0.6} />
      <path d="M16 8v6" />
      <path d="M17.5 8v6" strokeWidth={strokeWidth * 0.6} />
      {/* Code en clair */}
      <path d="M7 16.8h10.5" strokeWidth={strokeWidth * 0.7} strokeDasharray="1.2 1.4" />
    </svg>
  );
}

export default LabelIcon;
