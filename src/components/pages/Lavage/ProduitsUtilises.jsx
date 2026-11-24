import React, { useEffect, useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { FlaskConical, Loader2, Plus, ScanLine, Trash2 } from "lucide-react";
import { useLavage } from "../../../contextes/LavageContext";
import { chercherProduitParCode, listerProduits } from "../../../services/produitNettoyageService";
import { bipScan } from "../../../utils/appSettings";
import "./ProduitsUtilises.css";

export default function ProduitsUtilises({ disabled = false }) {
  const { t } = useTranslation();
  const { produitsUtilises, ajouterProduit, retirerProduit } = useLavage();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [actif, setActif] = useState(false);
  const [catalogue, setCatalogue] = useState([]);
  const idSelect = useId();
  const idScan = useId();

  useEffect(() => {
    let vivant = true;
    listerProduits().then((l) => { if (vivant) setCatalogue(l); }).catch(() => {});
    return () => { vivant = false; };
  }, []);

  const soumettre = async (e) => {
    e.preventDefault();
    const saisi = code.trim();
    if (!saisi || busy) return;
    bipScan();
    setCode("");
    setBusy(true);
    try {
      const produit = await chercherProduitParCode(saisi);
      if (!produit?.id) throw new Error(t("produits.not_found", "Produit introuvable"));
      ajouterProduit(produit);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const disponibles = catalogue.filter((p) => !produitsUtilises.some((u) => u.id === p.id));

  return (
    <section className="pu" aria-labelledby={`${idScan}-titre`} data-modal={actif ? "true" : undefined}>
      <header className="pu__head">
        <span className="pu__icon" aria-hidden="true"><FlaskConical size={18} /></span>
        <div className="pu__title">
          <h4 id={`${idScan}-titre`}>{t("produits.used", "Produits utilisés")}</h4>
          <p>{t("produits.hint", "Indiquez les produits de nettoyage employés pour ce cycle.")}</p>
        </div>
        <span className="pu__pill">{t("common.optional", "Facultatif")}</span>
        <span className="pu__count" aria-label={`${produitsUtilises.length}`}>{produitsUtilises.length}</span>
      </header>

      <div className="pu__controls">
        {catalogue.length > 0 && (
          <div className="pu__field">
            <label htmlFor={idSelect}>{t("produits.choose_label", "Choisir dans la liste")}</label>
            <div className="pu__control">
              <Plus size={16} aria-hidden="true" />
              <select
                id={idSelect}
                value=""
                disabled={disabled || disponibles.length === 0}
                onChange={(e) => {
                  const p = catalogue.find((x) => String(x.id) === e.target.value);
                  if (p) ajouterProduit(p);
                }}
              >
                <option value="">
                  {disponibles.length ? t("produits.choose", "Sélectionner un produit…") : t("produits.all_added", "Tous les produits sont ajoutés")}
                </option>
                {disponibles.map((p) => (
                  <option key={p.id} value={p.id}>{p.designation}{p.dosage ? ` — ${p.dosage}` : ""}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        <form className="pu__field" onSubmit={soumettre}>
          <label htmlFor={idScan}>{t("produits.scan_label", "Ou scanner le code-barres")}</label>
          <div className="pu__control">
            {busy ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <ScanLine size={16} aria-hidden="true" />}
            <input
              id={idScan}
              type="text"
              autoComplete="off"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onFocus={() => setActif(true)}
              onBlur={() => setActif(false)}
              placeholder={t("produits.scan_placeholder", "Scanner un produit")}
              disabled={disabled || busy}
            />
          </div>
        </form>
      </div>

      {produitsUtilises.length === 0 ? (
        <p className="pu__empty">{t("produits.none_selected", "Aucun produit sélectionné — vous pouvez démarrer sans produit.")}</p>
      ) : (
        <ul className="pu__list" aria-live="polite">
          {produitsUtilises.map((p) => (
            <li key={p.id} className="pu__item">
              <span className="pu__item-icon" aria-hidden="true"><FlaskConical size={15} /></span>
              <div className="pu__item-text">
                <strong>{p.designation}</strong>
                <span>
                  {p.dosage ? `${t("produits.dosage", "Dosage")} : ${p.dosage}` : t("produits.no_dosage", "Dosage non renseigné")}
                </span>
              </div>
              <button
                type="button"
                className="pu__remove"
                onClick={() => retirerProduit(p.id)}
                disabled={disabled}
                aria-label={`${t("common.remove", "Retirer")} ${p.designation}`}
              >
                <Trash2 size={15} aria-hidden="true" />
                <span>{t("common.remove", "Retirer")}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
