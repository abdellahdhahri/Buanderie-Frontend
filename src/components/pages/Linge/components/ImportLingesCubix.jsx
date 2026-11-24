import React from "react";
import { useTranslation } from "react-i18next";
import ImportCubixModal from "../../../ui/ImportCubixModal";
import { lingeImportService } from "../../../../services/lingeImportService";

export function ImportLingesCubix({ onClose, onImporte }) {
  const { t } = useTranslation();
  return (
    <ImportCubixModal
      title={t("linge.import_cubix", "Importer depuis CUBIX")}
      fetchPage={lingeImportService.getAImporter}
      importer={lingeImportService.importer}
      onClose={onClose}
      onImporte={onImporte}
    />
  );
}
