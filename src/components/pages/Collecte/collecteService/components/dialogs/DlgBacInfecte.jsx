import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, ArrowLeft, Biohazard, Check, Loader2, Minus, Plus, ScanLine } from "lucide-react";
import { Modal, Button, FormField, TextArea } from "../../../../../kit";
import { CATEGORIES_INFECTE } from "../../../../../../constants/collecte";
import { getActiveCategories } from "../../../../../../utils/appSettings";
import { chercherBac, estBacInfecte, listerBacsInfectes, typeDuBac } from "../../../../../../services/lavageInfecteService";
import "./DlgBacInfecte.css";

const codeDe = (bac) => bac?.codeBac || bac?.code || bac?.reference || "";

const correspond = (bac, saisie) => {
  const s = saisie.trim().toLowerCase();
  return [bac.codeBac, bac.code, bac.reference, bac.tagRfid, bac.tag, bac.codeBarre]
    .some((v) => v != null && String(v).toLowerCase() === s);
};

export function DlgBacInfecte({ visible, onValider, onClose }) {
  const { t } = useTranslation();
  const [etape, setEtape] = useState("BAC");
  const [bacs, setBacs] = useState([]);
  const [chargement, setChargement] = useState(false);
  const [saisie, setSaisie] = useState("");
  const [bac, setBac] = useState(null);
  const [quantites, setQuantites] = useState({});
  const [observations, setObservations] = useState("");
  const [erreur, setErreur] = useState(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);

  const categories = useMemo(() => {
    const actives = getActiveCategories();
    return CATEGORIES_INFECTE.filter((c) => actives.includes(c.id));
  }, []);

  useEffect(() => {
    if (!visible) return;
    setEtape("BAC");
    setSaisie("");
    setBac(null);
    setQuantites({});
    setObservations("");
    setErreur(null);
    setBusy(false);
    setChargement(true);
    listerBacsInfectes()
      .then(setBacs)
      .catch((e) => setErreur(e.message))
      .finally(() => setChargement(false));
    const id = setTimeout(() => inputRef.current?.focus(), 150);
    return () => clearTimeout(id);
  }, [visible]);

  if (!visible) return null;

  const total = Object.values(quantites).reduce((s, q) => s + (Number(q) || 0), 0);
  const lignes = Object.entries(quantites)
    .filter(([, q]) => Number(q) > 0)
    .map(([categorie, q]) => ({ categorie, quantiteDeclaree: Number(q) }));

  const choisirBac = (b) => {
    setBac(b);
    setErreur(null);
    setEtape("QUANTITES");
  };

  const scanner = async (e) => {
    e?.preventDefault();
    const code = saisie.trim();
    if (!code) return;
    setErreur(null);
    const connu = bacs.find((b) => correspond(b, code));
    if (connu) { choisirBac(connu); return; }
    setBusy(true);
    try {
      const trouve = await chercherBac(code);
      if (!trouve) {
        setErreur(t("collecte.bac_infecte.not_found", "Bac introuvable : {{code}}", { code }));
      } else if (!estBacInfecte(trouve)) {
        setErreur(t("collecte.bac_infecte.not_infected", "Le bac {{code}} n'est pas un bac infecté ({{type}}).", { code: codeDe(trouve) || code, type: typeDuBac(trouve) || "—" }));
      } else {
        choisirBac(trouve);
      }
    } catch (err) {
      setErreur(err.message);
    } finally {
      setBusy(false);
      setSaisie("");
    }
  };

  const changer = (id, valeur) => {
    const n = Math.max(0, Math.floor(Number(valeur) || 0));
    setQuantites((p) => ({ ...p, [id]: n }));
  };

  const valider = async () => {
    if (!bac?.id) { setErreur(t("collecte.bac_infecte.bac_required", "Le bac infecté est obligatoire.")); setEtape("BAC"); return; }
    if (!lignes.length) { setErreur(t("collecte.bac_infecte.quantity_required", "Saisissez au moins une quantité.")); return; }
    setBusy(true);
    setErreur(null);
    try {
      await onValider({ bacId: bac.id, bac, items: lignes, observations: observations.trim() || null });
    } catch {
      setBusy(false);
    }
  };

  const libelle = (c) => t(`categories.${c.id}`, { defaultValue: c.label });

  const footer = etape === "BAC" ? (
    <Button variant="secondary" onClick={onClose}>{t("common.cancel", "Annuler")}</Button>
  ) : (
    <>
      <Button variant="secondary" icon={<ArrowLeft size={15} />} onClick={() => { setEtape("BAC"); setErreur(null); }} disabled={busy}>
        {t("collecte.bac_infecte.change_bac", "Changer de bac")}
      </Button>
      <Button
        variant="danger"
        icon={busy ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
        onClick={valider}
        disabled={busy || total === 0}
      >
        {t("collecte.bac_infecte.validate", "Valider {{n}} pièce(s)", { n: total })}
      </Button>
    </>
  );

  return (
    <Modal
      size="md"
      tone="danger"
      icon={<Biohazard size={20} />}
      title={t("collecte.bac_infecte.title", "Déclarer des quantités infectées")}
      subtitle={etape === "BAC"
        ? t("collecte.bac_infecte.step_bac", "Étape 1 / 2 · Scannez ou choisissez un bac infecté")
        : t("collecte.bac_infecte.step_quantities", "Étape 2 / 2 · Quantités par catégorie")}
      onClose={busy ? undefined : onClose}
      closeOnOverlay={!busy}
      footer={footer}
    >
      <div className="dbi" data-modal="true">
        {etape === "BAC" && (
          <>
            <form className="dbi-scan" onSubmit={scanner}>
              <ScanLine size={18} aria-hidden="true" />
              <input
                ref={inputRef}
                value={saisie}
                onChange={(e) => { setSaisie(e.target.value); if (erreur) setErreur(null); }}
                placeholder={t("collecte.bac_infecte.scan_placeholder", "Code ou tag du bac infecté")}
                aria-label={t("collecte.bac_infecte.scan_placeholder", "Code ou tag du bac infecté")}
                autoComplete="off"
                disabled={busy}
              />
              <button type="submit" disabled={busy || !saisie.trim()}>
                {busy ? <Loader2 size={15} className="animate-spin" /> : "OK"}
              </button>
            </form>

            <div className="dbi-list-head">
              <span>{t("collecte.bac_infecte.available", "Bacs infectés")}</span>
              <i />
              <small>{bacs.length}</small>
            </div>

            {chargement ? (
              <div className="dbi-empty"><Loader2 size={18} className="animate-spin" /> {t("common.loading", "Chargement…")}</div>
            ) : bacs.length === 0 ? (
              <div className="dbi-empty"><Biohazard size={18} /> {t("collecte.bac_infecte.none", "Aucun bac infecté enregistré.")}</div>
            ) : (
              <div className="dbi-bacs">
                {bacs.map((b) => (
                  <button key={b.id ?? codeDe(b)} type="button" className="dbi-bac" onClick={() => choisirBac(b)}>
                    <Biohazard size={15} aria-hidden="true" />
                    <strong>{codeDe(b)}</strong>
                    <small>{b.etat ? t(`bac_status.${b.etat}`, b.etat) : "—"}</small>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {etape === "QUANTITES" && bac && (
          <>
            <div className="dbi-chosen">
              <span className="dbi-chosen__icon"><Biohazard size={18} /></span>
              <div>
                <small>{t("collecte.bac_infecte.bac", "Bac infecté")}</small>
                <strong>{codeDe(bac)}</strong>
              </div>
              <div className="dbi-chosen__total">
                <small>{t("collecte.bac_infecte.total", "Quantité totale")}</small>
                <strong>{total}</strong>
              </div>
            </div>

            <div className="dbi-cats">
              {categories.map((c) => {
                const q = quantites[c.id] || 0;
                return (
                  <div key={c.id} className={`dbi-cat ${q > 0 ? "is-on" : ""}`} style={{ "--c": c.color, "--cbg": c.bg }}>
                    <span className="dbi-cat__emoji" aria-hidden="true">{c.emoji}</span>
                    <span className="dbi-cat__label">{libelle(c)}</span>
                    <div className="dbi-step">
                      <button type="button" onClick={() => changer(c.id, q - 1)} disabled={busy || q === 0} aria-label={t("common.decrease", "Diminuer")}><Minus size={14} /></button>
                      <input
                        type="number"
                        min="0"
                        inputMode="numeric"
                        value={q}
                        onChange={(e) => changer(c.id, e.target.value)}
                        onFocus={(e) => e.target.select()}
                        aria-label={libelle(c)}
                        disabled={busy}
                      />
                      <button type="button" onClick={() => changer(c.id, q + 1)} disabled={busy} aria-label={t("common.increase", "Augmenter")}><Plus size={14} /></button>
                    </div>
                  </div>
                );
              })}
            </div>

            <FormField label={t("collecte.bac_infecte.observations", "Observations")}>
              <TextArea value={observations} onChange={setObservations} rows={2} disabled={busy} />
            </FormField>
          </>
        )}

        {erreur && (
          <div className="dbi-alert" role="alert">
            <AlertTriangle size={16} />
            <span>{erreur}</span>
          </div>
        )}
      </div>
    </Modal>
  );
}
