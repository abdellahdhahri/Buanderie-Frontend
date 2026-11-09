import { useEffect, useMemo, useState } from "react";
import { chargerOperations, getOperationsCourantes } from "../services/parcoursService";

export const AVEC_OBSERVATIONS = "CHANGEMENT_ETAT_LINGE";

export function useOperations() {
  const [operations, setOperations] = useState(() => getOperationsCourantes() || []);

  useEffect(() => {
    let actif = true;
    chargerOperations()
      .then((data) => { if (actif) setOperations(data); })
      .catch(() => {});
    return () => { actif = false; };
  }, []);

  const parType = useMemo(() => Object.fromEntries(operations.map((o) => [o.typeOperation, o])), [operations]);

  return {
    operations,
    libelle: (type, fallback) => parType[type]?.libelle || fallback || type || "—",
    nomEtape: (type) => parType[type]?.nomEtape || null,
  };
}
