import { useEffect } from "react";
import { getSetting, bipScan } from "../utils/appSettings";

/**
 * Déclenche automatiquement onScan après un délai si la valeur dépasse minLength.
 * Utilisé pour les lecteurs code-barres qui envoient d'un coup.
 */
// Délai et longueur minimale réglés dans Paramètres › Lecture / Scan
export function useAutoScan(value, onScan, { delay, minLength, enabled = true } = {}) {
  useEffect(() => {
    const min = minLength ?? (Number(getSetting("scan.minLength")) || 3);
    const wait = delay ?? (Number(getSetting("scan.delayMs")) || 400);
    if (!enabled || value.trim().length < min) return;
    const t = setTimeout(() => { bipScan(); onScan(value.trim()); }, wait);
    return () => clearTimeout(t);
  }, [value, enabled]);
}
