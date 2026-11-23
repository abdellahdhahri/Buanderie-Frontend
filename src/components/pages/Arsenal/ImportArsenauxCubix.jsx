import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import ImportCubixModal from "../../ui/ImportCubixModal";
import { arsenalService } from "../../../services/arsenalService";

export const lireNoms = (texte) => [...new Set(String(texte || "").split(/[\n,;]+/).map((n) => n.trim()).filter(Boolean))];

export function ImportArsenauxCubix({ onClose, onImporte }) {
  const { t } = useTranslation();
  const [nbrCol, setNbrCol] = useState(4);
  const [texte, setTexte] = useState("");
  const noms = lireNoms(texte);

  const extra = (
    <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
      <label style={{ display: "grid", gap: 4, maxWidth: 220 }}>
        <span>{t("arsenal.display_columns", "Colonnes d'affichage")}</span>
        <input type="number" min={1} value={nbrCol} onChange={(e) => setNbrCol(e.target.value)} />
      </label>
      <label style={{ display: "grid", gap: 4 }}>
        <span>{t("arsenal.locations_to_create", "Emplacements à créer (un par ligne, facultatif)")}</span>
        <textarea rows={3} value={texte} onChange={(e) => setTexte(e.target.value)} placeholder={"A1\nA2\nB1"} />
        {noms.length > 0 && <small>{noms.length} {t("arsenal.locations", "emplacement(s)").toLowerCase()}</small>}
      </label>
    </div>
  );

  return (
    <ImportCubixModal
      title={t("arsenal.import_cubix", "Importer depuis CUBIX")}
      fetchPage={arsenalService.getAImporter}
      importer={arsenalService.importer}
      buildBody={(ids) => ({ ids, nbrCol: Math.max(1, Number(nbrCol) || 4), emplacements: noms })}
      extra={extra}
      onClose={onClose}
      onImporte={onImporte}
    />
  );
}
