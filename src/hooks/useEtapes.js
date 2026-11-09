import { useEffect, useState } from "react";
import {
  chargerEtapes, estActive, estObligatoire, getEtapesCourantes, nomEtape, onEtapesChange, rafraichirEtapes,
} from "../services/parcoursService";

export function useEtapes() {
  const [etapes, setEtapes] = useState(getEtapesCourantes);
  const [erreur, setErreur] = useState(null);

  useEffect(() => {
    const off = onEtapesChange(() => setEtapes(getEtapesCourantes()));
    chargerEtapes().catch((err) => setErreur(err.message));
    return off;
  }, []);

  return {
    etapes: etapes || [],
    charge: etapes != null,
    erreur,
    estActive: (code) => estActive(code, etapes),
    estObligatoire: (code) => estObligatoire(code, etapes),
    nomEtape: (code) => nomEtape(code, etapes),
    rafraichir: rafraichirEtapes,
  };
}
