import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, Biohazard, CheckCheck, Info, Loader2, PackageOpen } from "lucide-react";
import { Modal, Button, FormField } from "../../kit";
import { codeDuBac, listerBacsTri } from "../../../services/bacTriService";
import ScanInput from "../../utils/shared/ScanInput";
import { estBacInfecte } from "../../../services/lavageInfecteService";

export default function FinCycleInfecteDialog({ cycle, onConfirm, onClose }) {
  const { t } = useTranslation();
  const [codeBac, setCodeBac] = useState("");
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [bacsVides, setBacsVides] = useState([]);
  const [chargement, setChargement] = useState(false);
  const [saisie, setSaisie] = useState("");

  useEffect(() => {
    if (!cycle) return undefined;
    setChargement(true);
    listerBacsTri({ etat: "VIDE" })
      .then((liste) => setBacsVides(cycle.infecte ? liste.filter((b) => !estBacInfecte(b)) : liste))
      .catch(() => setBacsVides([]))
      .finally(() => setChargement(false));
  }, [cycle]);

  if (!cycle) return null;

  const valider = async (e, codeScanne) => {
    e?.preventDefault?.();
    const code = (typeof codeScanne === "string" ? codeScanne : codeBac).trim();
    if (!code) {
      setErreur(t("lavage_infecte.finish_bac_required"));
      return;
    }
    setCodeBac(code);
    setBusy(true);
    setErreur(null);
    try {
      await onConfirm(cycle, code);
    } catch (err) {
      setErreur(err.message);
      setBusy(false);
    }
  };

  return (
    <Modal
      size="sm"
      tone={cycle.infecte ? "danger" : undefined}
      icon={cycle.infecte ? <Biohazard size={20} /> : <PackageOpen size={20} />}
      title={cycle.infecte ? t("lavage_infecte.finish_title") : t("lavage.finish_title_normal", "Fin du lavage")}
      subtitle={t("lavage_infecte.finish_subtitle", { id: cycle.numeroCycle || cycle.id, machine: cycle.machine?.code || "—" })}
      onClose={busy ? undefined : onClose}
      closeOnOverlay={!busy}
      footer={(
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>{t("common.cancel", "Annuler")}</Button>
          <Button
            variant={cycle.infecte ? "danger" : "primary"}
            icon={busy ? <Loader2 size={16} className="animate-spin" /> : <CheckCheck size={16} />}
            onClick={valider}
            disabled={busy || !codeBac.trim()}
          >
            {busy ? t("lavage_infecte.finish_busy") : cycle.infecte ? t("lavage_infecte.finish_confirm") : t("atelier.finish", "Terminer")}
          </Button>
        </>
      )}
    >
      <form data-modal="true" onSubmit={valider} className="lv-fin">
        {cycle.infecte && (
          <div className="lv-fin__note">
            <Info size={16} aria-hidden="true" />
            <span>{t("lavage_infecte.finish_bac_note")}</span>
          </div>
        )}
        <FormField
          label={cycle.infecte ? t("lavage_infecte.finish_bac") : t("lavage.unloading_bac", "Bac de déchargement")}
          required
          hint={cycle.infecte ? t("lavage_infecte.finish_bac_hint") : t("lavage.unloading_bac_hint", "Scannez le bac qui recevra le linge lavé.")}
        >
          <ScanInput
            placeholder={t("lavage_infecte.finish_bac_placeholder")}
            value={saisie}
            onChange={setSaisie}
            onSubmit={(c) => valider(null, c)}
            borderColor={erreur ? "#dc2626" : "#0d9488"}
            icon={<PackageOpen size={18} />}
            disabled={busy}
          />
          {codeBac && <small style={{ display: "block", marginTop: 6 }}><strong>{codeBac}</strong></small>}
        </FormField>
        <div className="lv-fin__bacs">
          <span className="lv-fin__bacs-title">{t("lavage_infecte.finish_bac_list")}</span>
          {chargement ? (
            <small><Loader2 size={13} className="animate-spin" /> {t("common.loading", "Chargement…")}</small>
          ) : bacsVides.length === 0 ? (
            <small>{t("lavage_infecte.finish_bac_none")}</small>
          ) : (
            <div className="lv-fin__chips">
              {bacsVides.map((b) => {
                const code = codeDuBac(b);
                return (
                  <button
                    key={b.id ?? code}
                    type="button"
                    className={`lv-fin__chip ${codeBac === code ? "is-on" : ""}`}
                    onClick={() => { setCodeBac(code); setErreur(null); }}
                    disabled={busy}
                  >
                    {code}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        {erreur && (
          <div className="lv-alert" role="alert">
            <AlertTriangle size={16} />
            <div>
              <strong>{t("lavage_infecte.finish_refused")}</strong>
              <span>{erreur}</span>
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
}
