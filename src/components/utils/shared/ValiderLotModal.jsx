import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Scale, CheckCircle2, AlertTriangle } from "lucide-react";
import { Modal, Button, FormField, ModalSummary } from "../../kit";
import { chargementService } from "../../../services/parcoursService";

export function Avertissements({ messages }) {
  const liste = (messages || []).filter(Boolean);
  if (!liste.length) return null;
  return (
    <div className="kit-warn-list">
      {liste.map((m, i) => (
        <div key={i} className="kit-warn"><AlertTriangle size={15} /> <span>{m}</span></div>
      ))}
    </div>
  );
}

export default function ValiderLotModal({ lot, matriculeAgent, onClose, onValide }) {
  const { t } = useTranslation();
  const [poids, setPoids] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    setPoids(lot?.poidsBalance != null ? String(lot.poidsBalance) : "");
    setMessages([]);
  }, [lot]);

  if (!lot) return null;
  const code = lot.codeBac || lot.codeLot;

  const valider = async (e) => {
    e.preventDefault();
    setEnvoi(true);
    try {
      const resultat = await chargementService.valider(code, matriculeAgent, poids === "" ? null : poids);
      const avert = resultat?.messages || [];
      avert.forEach((m) => toast.warning(m));
      toast.success(t("chargement.bac_validated", "Bac {{code}} prêt pour le lavage", { code }));
      onValide?.(resultat);
    } catch (err) {
      toast.error(err.message);
      setMessages([err.message]);
    } finally {
      setEnvoi(false);
    }
  };

  const declare = Number(lot.poidsDeclare ?? lot.poidsActuel ?? 0);

  return (
    <Modal
      open
      size="sm"
      tone="success"
      icon={<Scale size={20} />}
      title={t("chargement.validate_bac", "Valider le bac")}
      subtitle={code}
      onClose={envoi ? undefined : onClose}
      className="kit-std-form"
      footer={(
        <>
          <Button variant="secondary" onClick={onClose} disabled={envoi}>{t("common.cancel", "Annuler")}</Button>
          <Button type="submit" form="form-valider-lot" variant="success" icon={<CheckCircle2 size={16} />} disabled={envoi}>
            {envoi ? t("common.loading", "Chargement…") : t("chargement.validate_bac", "Valider le bac")}
          </Button>
        </>
      )}
    >
      <form id="form-valider-lot" onSubmit={valider}>
        <ModalSummary>
          <strong>{lot.nbLinges ?? lot.nbPieces ?? "—"}</strong> {t("chargement.linens", "linge(s)")} ·{" "}
          {t("chargement.declared_weight", "Poids déclaré")} <strong>{declare.toFixed(2)} kg</strong>
        </ModalSummary>
        <FormField
          label={t("chargement.scale_weight", "Poids de la balance (kg)")}
          hint={t("chargement.scale_weight_hint", "Facultatif : laissez vide pour conserver la dernière pesée.")}
        >
          <input
            type="number"
            min="0"
            step="0.01"
            autoFocus
            value={poids}
            onChange={(e) => setPoids(e.target.value)}
            placeholder="0.00"
          />
        </FormField>
        <Avertissements messages={messages} />
      </form>
    </Modal>
  );
}
