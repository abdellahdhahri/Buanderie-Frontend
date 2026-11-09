import { useEffect, useState } from "react";
import {
  aCircuitInfecte, niveauRattachementDe, chargerEstablishment, getEstablishment, onEstablishmentChange, urlLogo, DEFAULT_LOGO,
} from "../services/establishmentService";

// Identité de l'établissement (serveur), mise à jour en direct après enregistrement
export function useEstablishment() {
  const [identite, setIdentite] = useState(getEstablishment);
  useEffect(() => {
    const off = onEstablishmentChange(setIdentite);
    chargerEstablishment();
    return off;
  }, []);
  return {
    ...identite,
    logo: urlLogo(identite) || DEFAULT_LOGO,
    circuitInfecte: aCircuitInfecte(identite),
    circuitInfecteActif: aCircuitInfecte(identite),
    niveauRattachement: niveauRattachementDe(identite),
  };
}

// false pour un hôtel : les écrans et indicateurs d'infection sont masqués
export function useCircuitInfecte() {
  return useEstablishment().circuitInfecte;
}

export function useRattachementChambre() {
  return useEstablishment().niveauRattachement === "CHAMBRE";
}
