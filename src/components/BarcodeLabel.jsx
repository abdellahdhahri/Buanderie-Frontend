import React, { useContext } from "react";
import { useTranslation } from "react-i18next";
import { ServiceContext } from "../contextes/ServiceContext";
import { printLabel } from "../utils/labels";
import { LabelIcon } from "./ui/LabelIcon";

export const BarcodeLabel = ({ item, type = "default", ctx = {}, variant, disabled = false }) => {
  const { t } = useTranslation();
  const { services } = useContext(ServiceContext) || {};

  const handlePrint = (e) => {
    e?.stopPropagation?.();
    if (!item) return;
    printLabel(type, item, { t, services, ...ctx });
  };

  if (variant === "action") {
    return (
      <button
        type="button"
        className={`action-bar-btn imprimer ${disabled || !item ? "disabled" : ""}`}
        disabled={disabled || !item}
        onClick={handlePrint}
        title={t("barcode_label.print")}
      >
        <LabelIcon className="w-[18px] h-[18px]" strokeWidth={2} />
        <span className="btn-label">{t("barcode_label.print")}</span>
      </button>
    );
  }

  if (variant === "icon") {
    return (
      <button type="button" className="kit-row-btn" onClick={handlePrint} title={t("barcode_label.print")}>
        <LabelIcon className="w-4 h-4" strokeWidth={2.2} />
      </button>
    );
  }

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
