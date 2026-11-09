import React from "react";
import { useTranslation } from "react-i18next";
import { RefreshCcw, Loader2 } from "lucide-react";
import Swal from "sweetalert2";
import { lancerSynchronisation, messageLisible } from "../../services/integrationService";
import { useIntegration } from "../../hooks/useIntegration";
import { afficherJournal } from "../../utils/journalSynchro";

export function SynchroniserButton({ referentiel, label, onTermine, variant }) {
  const { t } = useTranslation();
  const { enCours } = useIntegration();
  const occupe = enCours(referentiel);

  const synchroniser = async () => {
    try {
      const journal = await lancerSynchronisation(referentiel);
      await onTermine?.(journal);
      afficherJournal({ ...journal, message: messageLisible(journal?.message) }, t);
    } catch (err) {
      Swal.fire({ title: `❌ ${t("integration.sync_error", "Synchronisation impossible")}`, text: messageLisible(err.message), icon: "error" });
    }
  };

  const texte = occupe ? t("integration.sync_running", "Synchronisation en cours…") : label || t("integration.synchronize", "Synchroniser");

  if (variant === "action") {
    return (
      <button type="button" className={`action-bar-btn rapport-global ${occupe ? "disabled" : ""}`} disabled={occupe} onClick={synchroniser} title={texte}>
        {occupe ? <Loader2 size={18} className="animate-spin" /> : <RefreshCcw size={18} />}
        <span className="btn-label">{texte}</span>
      </button>
    );
  }

  return (
    <button
      onClick={synchroniser}
      disabled={occupe}
      className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-[14px] text-sm font-bold text-indigo-700 hover:from-indigo-100 hover:to-purple-100 transition-all shadow-[0_2px_8px_rgba(99,102,241,0.15)] hover:shadow-[0_4px_16px_rgba(99,102,241,0.25)] hover:scale-[1.02] disabled:opacity-70 disabled:cursor-wait disabled:scale-100"
    >
      {occupe ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4 stroke-[2.5]" />}
      {occupe ? t("integration.sync_running", "Synchronisation en cours…") : label || t("integration.synchronize", "Synchroniser")}
    </button>
  );
}
