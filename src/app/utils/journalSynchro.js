import Swal from "sweetalert2";

const echapper = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

// Résultat d'une synchronisation : nbRecus, nbCrees, nbMisAJour, message
export function afficherJournal(journal, t) {
  const ligne = (label, valeur) =>
    `<div style="display:flex;justify-content:space-between;padding:4px 0"><span>${label}</span><b>${valeur ?? 0}</b></div>`;
  const enErreur = /ERREUR|ECHEC|PARTIEL/i.test(journal?.statut || "");
  return Swal.fire({
    title: enErreur ? `⚠️ ${t("integration.sync_done_errors", "Synchronisation terminée avec des erreurs")}` : `✅ ${t("integration.sync_done", "Synchronisation terminée")}`,
    icon: enErreur ? "warning" : "success",
    html: `<div style="text-align:left;max-width:320px;margin:0 auto">
      ${ligne(t("integration.nb_recus", "Reçus"), journal?.nbRecus)}
      ${ligne(t("integration.nb_crees", "Créés"), journal?.nbCrees)}
      ${ligne(t("integration.nb_mis_a_jour", "Mis à jour"), journal?.nbMisAJour)}
      ${journal?.message ? `<p style="margin-top:10px;font-size:13px;color:#64748b">${echapper(journal.message)}</p>` : ""}
    </div>`,
  });
}
