import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import DialogCategorie from "../../../../../utils/collecte/DialogCategorie";
import { apiCall } from "../../../collecteUtils";
import { EtapeQuantite } from "./EtapeQuantite";
import { EtapeBacInfecte } from "./EtapeBacInfecte";

/* ═══════════════════════════════════════════════════════════════════════════
   DlgSacInfecte — Déclaration d'un sac infecté en 3 étapes :
   CATEGORIE → QUANTITE → BAC
   ═══════════════════════════════════════════════════════════════════════════ */
export function DlgSacInfecte({ visible, collecteId, onValider, onClose }) {
  const { t } = useTranslation();
  const [etape, setEtape] = useState("CATEGORIE");
  const [catChoisie, setCatChoisie] = useState(null);
  const [quantite, setQuantite] = useState(1);
  const [codeBac, setCodeBac] = useState("");
  const [loading, setLoading] = useState(false);
  const [bacErr, setBacErr] = useState("");

  useEffect(() => {
    if (visible) {
      setEtape("CATEGORIE");
      setCatChoisie(null);
      setQuantite(1);
      setCodeBac("");
      setBacErr("");
    }
  }, [visible]);

  if (!visible) return null;

  if (etape === "CATEGORIE") {
    return (
      <DialogCategorie
        onChoisir={(c) => {
          setCatChoisie(c);
          setEtape("QUANTITE");
        }}
        onFermer={onClose}
      />
    );
  }

  if (etape === "QUANTITE") {
    return (
      <EtapeQuantite
        categorie={catChoisie}
        quantite={quantite}
        setQuantite={setQuantite}
        onRetour={() => setEtape("CATEGORIE")}
        onSuivant={() => setEtape("BAC")}
        onClose={onClose}
      />
    );
  }

  if (etape === "BAC") {
    const handleScanBac = async () => {
      if (!codeBac.trim()) return;
      setLoading(true);
      setBacErr("");
      try {
        const res = await apiCall(
          `/api/collecte/service/${collecteId}/bac`,
          { codeOuTag: codeBac.trim() }
        );
        if (res.typeBac !== "INFECTE") {
          setBacErr(t('collecte.errors.bac_not_infected', { type: res.typeBac }));
          return;
        }
        onValider({
          bacId: res.bacId,
          items: [{ categorie: catChoisie.id, quantiteDeclaree: quantite }]
        });
      } catch (e) {
        setBacErr(e.message);
      } finally {
        setLoading(false);
      }
    };

    return (
      <EtapeBacInfecte
        categorie={catChoisie}
        quantite={quantite}
        codeBac={codeBac}
        setCodeBac={setCodeBac}
        loading={loading}
        bacErr={bacErr}
        onScan={handleScanBac}
        onRetour={() => setEtape("QUANTITE")}
        onClose={onClose}
      />
    );
  }

  return null;
}
