import React from "react";
import { useTranslation } from "react-i18next";
import "../../Linge/WorkflowList.css";
import { TypeLauncher } from "../../../utils/shared/TypeLauncher";

function CollecteListInner() {
  const { t } = useTranslation();

  const TYPES_COLLECTE = [
    {
      id: "service",
      kind: "service",
      label: t('collecte_list.types.service.label'),
      description: t('collecte_list.types.service.description'),
      route: "/service",
      color: "#2563eb",
    },
    {
      id: "linge",
      kind: "chambre",
      label: t('collecte_list.types.linge.label'),
      description: t('collecte_list.types.linge.description'),
      route: "/Collages",
      color: "#0d9488",
    },
    {
      id: "uniforme",
      kind: "uniforme",
      label: t('collecte_list.types.uniforme.label'),
      description: t('collecte_list.types.uniforme.description'),
      route: "/uniforme",
      color: "#7c3aed",
    },
  ];

  return (
    <div className="collecte-container" style={{
      minHeight: "calc(100vh - 100px)",
      display: "flex",
      flexDirection: "column"
    }}>
      <TypeLauncher
        mode="collecte"
        title={t('collecte_list.choose_type')}
        subtitle={t('collecte_list.keyboard_hint')}
        types={TYPES_COLLECTE}
      />
    </div>
  );
}

export default function CollecteList() {
  return <CollecteListInner />;
}
