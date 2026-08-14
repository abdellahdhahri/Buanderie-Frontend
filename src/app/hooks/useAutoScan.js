import { useEffect } from "react";

/**
 * Déclenche automatiquement onScan après un délai si la valeur dépasse minLength.
 * Utilisé pour les lecteurs code-barres qui envoient d'un coup.
 */
export function useAutoScan(value, onScan, { delay = 400, minLength = 3, enabled = true } = {}) {
  useEffect(() => {
    if (!enabled || value.trim().length < minLength) return;
    const t = setTimeout(() => onScan(value.trim()), delay);
    return () => clearTimeout(t);
  }, [value, enabled]);
}
