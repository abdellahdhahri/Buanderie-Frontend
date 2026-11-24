import React from "react";
import { useTranslation } from "react-i18next";
import ImportCubixModal from "../../ui/ImportCubixModal";
import { machineService } from "../../../services/machineService";

export default function ImportMachinesCubix({ onClose, onImporte }) {
  const { t } = useTranslation();
  const types = [
    { value: "LAVEUR", label: t("machine_type.LAVEUR", "Laveur") },
    { value: "SECHEUR", label: t("machine_type.SECHEUR", "Sécheur") },
  ];
  return (
    <ImportCubixModal
      title={t("machines.import_cubix", "Importer depuis CUBIX")}
      fetchPage={machineService.getAImporter}
      importer={machineService.importer}
      typeOptions={types}
      onClose={onClose}
      onImporte={onImporte}
    />
  );
}
