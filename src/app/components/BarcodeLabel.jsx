import React, { useContext } from "react";
import { useTranslation } from "react-i18next";
import { ServiceContext } from "../contextes/ServiceContext";
import { printLabel } from "../utils/labels";
import { LabelIcon } from "./ui/LabelIcon";

/**
 * Bouton « Étiquette » : imprime l'étiquette de l'article selon les réglages
 * de son type (Paramètres › Étiquettes).
 *   type : "linge" | "lot" | "bac" | "machine" | "chambre" | "lit" | "sac" | "arsenal" | "immobilisation"
 *   ctx  : informations complémentaires (ex. { chambre: "CH-104" } pour un lit)
 */
export const BarcodeLabel = ({ item, type = "default", ctx = {} }) => {
  const { t } = useTranslation();
  const { services } = useContext(ServiceContext) || {};

  const handlePrint = (e) => {
    e?.stopPropagation?.();
    if (!item) return;
    printLabel(type, item, { t, services, ...ctx });
  };

  return (
    <button
      type="button"
      onClick={handlePrint}
      title={t("barcode_label.print")}
      className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#0d9488]/30 rounded-[14px] text-sm font-bold text-[#0d9488] hover:bg-[#0d9488]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02]"
    >
      <LabelIcon className="w-4 h-4" strokeWidth={2.2} />
      {t("barcode_label.print")}
    </button>
  );
};

export default BarcodeLabel;
