import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import { PackagePlus, ScanLine, X } from "lucide-react";
import { Modal, Button } from "../../kit";
import { ajouterLingesCollecte } from "../../../services/historiqueCollecteService";

const decouper = (texte) => String(texte || "").split(/[\s,;]+/).map((c) => c.trim()).filter(Boolean);

export default function AjouterLingesModal({ collecte, onClose, onDone }) {
  const { t } = useTranslation();
  const [saisie, setSaisie] = useState("");
  const [codes, setCodes] = useState([]);
  const [pret, setPret] = useState(false);
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    const id = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(id);
  }, []);

  const ajouter = (texte) => {
    const nouveaux = decouper(texte);
    if (!nouveaux.length) return;
    setErreur("");
    setCodes((liste) => {
      const doublons = nouveaux.filter((c) => liste.includes(c));
      if (doublons.length) toast.warning(t("historique_collecte.add_linens_duplicate", "Déjà dans la liste"), { description: doublons.join(", ") });
      return [...liste, ...nouveaux.filter((c, i) => !liste.includes(c) && nouveaux.indexOf(c) === i)];
    });
    setSaisie("");
  };

  const retirer = (code) => setCodes((liste) => liste.filter((c) => c !== code));

  const valider = async () => {
    if (!codes.length || busy) return;
    setBusy(true);
    setErreur("");
    try {
      const res = await ajouterLingesCollecte(collecte.id, codes);
      toast.success(res?.message || t("historique_collecte.add_linens_success", "{{count}} linge(s) ajouté(s) à la collecte", { count: codes.length }));
      onDone?.(res);
    } catch (e) {
      setErreur(e.message);
      toast.error(e.message);
      setTimeout(() => inputRef.current?.focus(), 50);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      size="md"
      icon={<PackagePlus size={20} />}
      title={t("historique_collecte.add_linens", "Ajouter des linges")}
      subtitle={`${t("historique_collecte.collection", "Collecte")} ${collecte.numeroCollecte || `#${collecte.id}`}`}
      onClose={busy ? undefined : onClose}
      closeOnOverlay={!busy}
      footer={(
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>{t("common.cancel", "Annuler")}</Button>
          <Button icon={<PackagePlus size={16} />} onClick={valider} disabled={!codes.length || busy}>
            {busy ? t("common.loading") : t("historique_collecte.add_linens_submit", "Ajouter {{count}} linge(s)", { count: codes.length })}
          </Button>
        </>
      )}
    >
      <div className={`kit-scan ${pret ? "is-ready" : ""}`}>
        <ScanLine size={22} className="kit-scan__icon" />
        <input
          ref={inputRef}
          value={saisie}
          placeholder={t("historique_collecte.add_linens_placeholder", "Scanner ou saisir un code linge")}
          onChange={(e) => setSaisie(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              ajouter(saisie);
            }
          }}
          onPaste={(e) => {
            const texte = e.clipboardData.getData("text");
            if (decouper(texte).length > 1) {
              e.preventDefault();
              ajouter(texte);
            }
          }}
          onFocus={() => setPret(true)}
          onBlur={() => setPret(false)}
          disabled={busy}
          autoComplete="off"
        />
        <span className="kit-scan__status">
          {pret ? t("inventaire.scan_ready", "Prêt à scanner") : t("inventaire.scan_inactive", "Cliquez pour scanner")}
        </span>
      </div>
      <p className="kit-muted" style={{ fontSize: ".78rem", margin: "6px 4px 14px" }}>
        {t("historique_collecte.add_linens_hint", "Entrée pour valider chaque code · un collage de plusieurs codes est découpé automatiquement.")}
      </p>

      {erreur && <div className="kit-warn" role="alert" style={{ marginBottom: 12 }}>{erreur}</div>}

      <div className="kit-codes-head">
        <strong>{t("historique_collecte.add_linens_list", "Linges à ajouter")}</strong>
        <span className="kit-chip kit-chip--teal"><strong>{codes.length}</strong></span>
        {codes.length > 0 && (
          <button type="button" className="kit-codes-clear" onClick={() => setCodes([])} disabled={busy}>
            {t("historique_collecte.add_linens_clear", "Tout effacer")}
          </button>
        )}
      </div>

      {codes.length === 0 ? (
        <div className="kit-codes-empty">
          <PackagePlus size={26} />
          <span>{t("historique_collecte.add_linens_empty", "Aucun linge scanné pour le moment.")}</span>
        </div>
      ) : (
        <div className="kit-codes">
          <AnimatePresence initial={false}>
            {codes.map((c) => (
              <motion.span
                key={c}
                layout
                className="kit-code-chip"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.15 }}
              >
                <code>{c}</code>
                <button type="button" onClick={() => retirer(c)} disabled={busy} aria-label={t("common.delete", "Supprimer")}>
                  <X size={13} />
                </button>
              </motion.span>
            ))}
          </AnimatePresence>
        </div>
      )}
    </Modal>
  );
}
