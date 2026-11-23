import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { UserX } from "lucide-react";
import { Modal, Button, FormField, TextArea, ModalSummary, Code } from "../../kit";
import { formatDuree, libelleEtat } from "./lingesBloquesUtils";

const APERCU = 6;

export default function DeclarerManquantDialog({ linges, busy, erreur, onConfirm, onClose }) {
  const { t } = useTranslation();
  const [remarques, setRemarques] = useState("");
  const plusieurs = linges.length > 1;
  const reste = linges.length - APERCU;

  return (
    <Modal
      size="md"
      tone="danger"
      icon={<UserX size={20} />}
      title={plusieurs
        ? t("linges_bloques.missing.title_many", "Déclarer {{count}} linges manquants", { count: linges.length })
        : t("linges_bloques.missing.title_one", "Déclarer le linge manquant")}
      subtitle={t("linges_bloques.missing.subtitle", "L'état passera à « Manquant ». Cette action est tracée dans l'historique.")}
      onClose={busy ? undefined : onClose}
      closeOnOverlay={!busy}
      footer={(
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>{t("common.cancel", "Annuler")}</Button>
          <Button variant="danger" icon={<UserX size={16} />} onClick={() => onConfirm(remarques.trim())} disabled={busy}>
            {busy
              ? t("linges_bloques.missing.busy", "Enregistrement…")
              : plusieurs
                ? t("linges_bloques.missing.confirm_many", "Déclarer {{count}} manquants", { count: linges.length })
                : t("linges_bloques.missing.confirm_one", "Déclarer manquant")}
          </Button>
        </>
      )}
    >
      <ModalSummary>
        <ul className="lb-manquant__liste">
          {linges.slice(0, APERCU).map((l) => (
            <li key={l.id ?? l.codeBarre}>
              <Code>{l.codeBarre}</Code>
              <span>{l.designation || (l.categorie ? t(`categories.${l.categorie}`, l.categorie) : "—")}</span>
              <small>{libelleEtat(t, l.etat)} · +{formatDuree(l.retardHeures)}</small>
            </li>
          ))}
        </ul>
        {reste > 0 && <small className="lb-manquant__reste">{t("linges_bloques.missing.others", "… et {{count}} autre(s)", { count: reste })}</small>}
      </ModalSummary>
      <FormField label={t("linges_bloques.missing.remarks", "Remarques (facultatif)")}>
        <TextArea
          value={remarques}
          onChange={setRemarques}
          rows={3}
          placeholder={t("linges_bloques.missing.remarks_placeholder", "Ex. : introuvable après recherche à l'office")}
          disabled={busy}
        />
      </FormField>
      {erreur && <small className="kit-field-error" role="alert">{erreur}</small>}
    </Modal>
  );
}
