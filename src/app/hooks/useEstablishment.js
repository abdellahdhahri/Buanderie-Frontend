import { useEffect, useState } from "react";
import { getEstablishment, onEstablishmentChange } from "../services/establishmentService";

// Paramètres de l'établissement, mis à jour en direct après enregistrement
export function useEstablishment() {
  const [establishment, setEstablishment] = useState(getEstablishment);
  useEffect(() => onEstablishmentChange(setEstablishment), []);
  return establishment;
}
