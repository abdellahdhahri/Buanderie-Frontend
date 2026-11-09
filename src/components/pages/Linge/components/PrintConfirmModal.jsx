import React from "react";
import { useTranslation } from "react-i18next";
import { LabelIcon } from "../../../ui/LabelIcon";
import { Modal, Button } from "../../../kit";

export function PrintConfirmModal({ isOpen, onClose, onConfirm }) {
  const { t } = useTranslation();
  if (!isOpen) return null;
  return (
    <Modal
      size="sm"
      tone="success"
      icon={<LabelIcon className="w-5 h-5" strokeWidth={2.2} />}
      title={t("linge.created_success")}
      onClose={onClose}
      footer={(
        <>
          <Button variant="secondary" onClick={onClose}>{t("common.no")}</Button>
          <Button icon={<LabelIcon className="w-4 h-4" strokeWidth={2.2} />} onClick={onConfirm}>{t("common.yes_print")}</Button>
        </>
      )}
    >
      <p>{t("linge.print_label_question")}</p>
    </Modal>
  );
}
