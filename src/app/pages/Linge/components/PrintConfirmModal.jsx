import React from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "../../../components/ui/modal";
import { Button } from "../../../components/ui/button";
import { LabelIcon } from "../../../components/ui/LabelIcon";

// ═══════════════════════════════════════════════════════════════════════════
// 🖨️ MODAL IMPRESSION — proposée après la création d'un linge
// ═══════════════════════════════════════════════════════════════════════════
export function PrintConfirmModal({ isOpen, onClose, onConfirm }) {
  const { t } = useTranslation();

  return (
    <Modal isOpen={isOpen} onClose={onClose} variant="create" title={t('linge.created_success')} icon={<LabelIcon strokeWidth={2.2} />} size="md">
      <p className="mb-6">{t('linge.print_label_question')}</p>
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onClose}>
          {t('common.no')}
        </Button>
        <Button onClick={onConfirm}>
          <LabelIcon className="w-4 h-4" strokeWidth={2.2} />
          {t('common.yes_print')}
        </Button>
      </div>
    </Modal>
  );
}
