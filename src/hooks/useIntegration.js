import { useEffect, useState } from "react";
import {
  chargerIntegration, estImporte, estImporteCubix, getIntegrationCourante, onIntegrationChange, synchronisationEnCours,
} from "../services/integrationService";

// Configuration d'intégration partagée, rechargée après enregistrement ou synchronisation
export function useIntegration() {
  const [integration, setIntegration] = useState(getIntegrationCourante);
  const [erreur, setErreur] = useState(null);
  const [, setVersion] = useState(0);

  useEffect(() => {
    const off = onIntegrationChange(() => {
      setIntegration(getIntegrationCourante());
      setVersion((v) => v + 1);
    });
    chargerIntegration().catch((err) => {
      console.error("Erreur chargement intégration :", err);
      setErreur(err.message);
    });
    return off;
  }, []);

  return {
    integration,
    erreur,
    modeCubix: estImporteCubix(integration),
    estImporte: (referentiel) => estImporte(integration, referentiel),
    enCours: synchronisationEnCours,
  };
}
