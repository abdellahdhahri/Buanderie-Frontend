import { useEffect, useState } from "react";

const deux = (n) => String(n).padStart(2, "0");

export const formaterDuree = (sec) => {
  const s = Math.max(0, Math.floor(sec || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}:${deux(m)}:${deux(s % 60)}` : `${deux(m)}:${deux(s % 60)}`;
};

export function useChrono(dateDebut, dureeMinutes) {
  const [maintenant, setMaintenant] = useState(() => Date.now());

  useEffect(() => {
    if (!dateDebut) return undefined;
    const id = setInterval(() => setMaintenant(Date.now()), 1000);
    return () => clearInterval(id);
  }, [dateDebut]);

  const ecoule = dateDebut ? Math.max(0, Math.floor((maintenant - new Date(dateDebut).getTime()) / 1000)) : 0;
  const total = Number(dureeMinutes) > 0 ? Number(dureeMinutes) * 60 : null;
  const pct = total ? Math.min(100, (ecoule / total) * 100) : null;
  const depasse = total != null && ecoule > total;
  const reste = total != null ? Math.max(0, total - ecoule) : null;
  const statut = depasse ? "over" : pct != null && pct >= 90 ? "soon" : "run";

  return { ecoule, total, pct, depasse, reste, statut };
}
