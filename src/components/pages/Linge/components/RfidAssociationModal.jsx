import React from "react";
import { useTranslation } from "react-i18next";
import { Radio } from "lucide-react";
import { Modal, Button, FormField, ModalSummary, Code } from "../../../kit";

export function RfidAssociationModal({ isOpen, onClose, linge, rfidCode, setRfidCode, onSubmit }) {
  const { t } = useTranslation();
  if (!isOpen) return null;
  const canSubmit = !!rfidCode.trim();
  return (
    <Modal
      className="kit-std-form"
      size="sm"
      icon={<Radio size={20} />}
      title={t("linge.associate_rfid_tag")}
      subtitle="Associer un tag RFID à un linge existant"
      onClose={onClose}
      footer={(
        <>
          <Button variant="secondary" onClick={onClose}>{t("common.cancel")}</Button>
          <Button onClick={onSubmit} disabled={!canSubmit} icon={<Radio size={16} />}>{t("linge.associate_rfid")}</Button>
        </>
      )}
    >
      <ModalSummary>
        <small className="kit-muted" style={{ display: "block", fontWeight: 700, textTransform: "uppercase", fontSize: ".7rem" }}>{t("linge.selected_linen")}</small>
        <Code>{linge?.codebarre}</Code> · {linge?.categorie ? t(`categories.${linge.categorie}`, linge.categorie) : "—"}
      </ModalSummary>
      <FormField label={`RFID ${t("common.tag")}`} required hint={t("linge.rfid_scan_hint")}>
        <input
          value={rfidCode}
          placeholder={t("linge.scan_or_enter_rfid")}
          onChange={(e) => setRfidCode(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && canSubmit) onSubmit(); }}
          autoFocus
        />
      </FormField>
    </Modal>
  );
}
