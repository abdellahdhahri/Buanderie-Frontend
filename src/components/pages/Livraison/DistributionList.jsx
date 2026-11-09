import React from "react";
import { useTranslation } from "react-i18next";
import "../Linge/WorkflowList.css";
import { TypeLauncher } from "../../utils/shared/TypeLauncher";

const TYPES_DISTRIBUTION = [
  {
    id: "service",
    kind: "service",
    label: "Distribution Service",
    description: "Distribution des linges aux services",
    route: "/Livraisons",
    color: "#2563eb",
  },
  {
    id: "chambre",
    kind: "chambre",
    label: "Distribution Chambre",
    description: "Distribution des linges aux chambres",
    route: "/distChambre",
    color: "#0d9488",
  },
  {
    id: "uniforme",
    kind: "uniforme",
    label: "Distribution Uniforme",
    description: "Distribution des uniformes du personnel",
    route: "/distUniforme",
    color: "#7c3aed",
  }
];

export default function DistributionList() {
  const { t } = useTranslation();

  const translatedTypes = TYPES_DISTRIBUTION.map((type) => ({
    ...type,
    label: t(`distribution.types.${type.id}.label`, type.label),
    description: t(`distribution.types.${type.id}.description`, type.description),
  }));

  return (
    <div className="collecte-container" style={{
      minHeight: "calc(100vh - 100px)",
      display: "flex",
      flexDirection: "column"
    }}>

      {/* ─── Choix du type, centré ───────────────────────────────────────────── */}
      <TypeLauncher
        mode="distribution"
        title={t('distribution.choose_type')}
        subtitle={t('distribution.keyboard_hint')}
        types={translatedTypes}
      />
    </div>
  );
}
