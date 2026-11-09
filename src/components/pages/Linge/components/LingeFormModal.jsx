import React from "react";
import { useTranslation } from "react-i18next";
import { Sparkles, ShieldCheck } from "lucide-react";
import { CategoryPicker } from "../../../ui/CategoryPicker";
import { CATEGORIES_LINGE } from "../../../../constants/categoriesLinge";
import { getActiveCategories } from "../../../../utils/appSettings";
import { Modal, Button, FormField, FormGrid, TextArea, Tabs, SelectRecherche } from "../../../kit";
import { ETAT_OPTIONS } from "../lingeConstants";

const HiddenRequired = ({ value }) => (
  <input
    tabIndex={-1}
    aria-hidden="true"
    required
    value={value || ""}
    onChange={() => {}}
    style={{ position: "absolute", width: 1, height: 1, opacity: 0, pointerEvents: "none" }}
  />
);

const categoriesProposees = (categories) => {
  if (!categories?.length) return undefined;
  const actives = getActiveCategories();
  return categories.filter((c) => !CATEGORIES_LINGE.includes(c) || actives.includes(c));
};

const Section = ({ title, hint }) => (
  <div className="kit-span kit-form-section">
    <strong>{title}</strong>
    {hint && <small>{hint}</small>}
  </div>
);

export function LingeFormModal({
  isOpen, onClose, onSubmit, lingeToEdit, newLinge, setNewLinge, creationMode, setCreationMode,
  services, personnel, categories, isSaving,
}) {
  const { t } = useTranslation();
  if (!isOpen) return null;
  const isUniforme = newLinge.categorie === "UNIFORME";
  const set = (patch) => setNewLinge({ ...newLinge, ...patch });

  return (
    <Modal
      className="kit-std-form"
      size="md"
      title={lingeToEdit ? t("linge.edit_article") : t("linge.new_article")}
      subtitle={lingeToEdit ? `#${lingeToEdit.id} · ${lingeToEdit.codebarre}` : t("linge.form_subtitle", "Remplissez les informations du linge")}
      onClose={isSaving ? undefined : onClose}
      footer={(
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>{t("common.cancel")}</Button>
          <Button type="submit" form="linge-form" disabled={isSaving}>{isSaving ? t("common.saving") : t("common.save")}</Button>
        </>
      )}
    >
      <form id="linge-form" onSubmit={onSubmit}>
        <FormGrid>
          {!lingeToEdit && (
            <div className="kit-span">
              <Tabs
                value={creationMode}
                onChange={(m) => {
                  setCreationMode(m);
                  if (m === "auto") set({ codebarre: "", rfidTag: "" });
                }}
                items={[
                  { value: "auto", icon: <Sparkles size={15} />, label: t("linge.new_linen") },
                  { value: "manual", icon: <ShieldCheck size={15} />, label: t("linge.existing_linen") },
                ]}
              />
            </div>
          )}

          {!lingeToEdit && (
            <>
              <Section
                title={t("linge.sections.identification", "Identification")}
                hint={creationMode === "auto" ? t("linge.sections.identification_auto", "Le code-barres sera généré automatiquement") : t("linge.sections.identification_hint", "Code-barres et tag RFID")}
              />
              {creationMode === "manual" && (
                <FormField label={t("linge.tracking_code")} required>
                  <input placeholder={t("linge.scan_code_here")} value={newLinge.codebarre} onChange={(e) => set({ codebarre: e.target.value })} required />
                </FormField>
              )}
              <FormField label={`RFID ${t("common.optional")}`} hint={t("linge.rfid_optional_hint")} span={creationMode !== "manual"}>
                <input placeholder={t("linge.scan_rfid_or_leave_empty")} value={newLinge.rfidTag} onChange={(e) => set({ rfidTag: e.target.value })} />
              </FormField>
            </>
          )}

          <Section title={t("linge.sections.characteristics", "Caractéristiques")} hint={t("linge.sections.characteristics_hint", "Catégorie, poids et durée de vie")} />
          <FormField label={t("linge.category")} required span>
            <div style={{ position: "relative" }}>
              <CategoryPicker
                categories={categoriesProposees(categories)}
                value={newLinge.categorie}
                onChange={(categorie) => set({ categorie, porteurId: categorie !== "UNIFORME" ? "" : newLinge.porteurId })}
              />
              <HiddenRequired value={newLinge.categorie} />
            </div>
          </FormField>
          <FormField label={t("linge.weight_kg")} required>
            <input type="number" step="0.1" min="0" value={newLinge.poids} onChange={(e) => set({ poids: parseFloat(e.target.value) })} required />
          </FormField>
          <FormField label={t("linge.life_cycles")}>
            <input type="number" step="1" min="0" placeholder="—" value={newLinge.dureVie} onChange={(e) => set({ dureVie: e.target.value })} />
          </FormField>

          <Section title={t("linge.sections.assignment", "Affectation")} hint={t("linge.sections.assignment_hint", "Service et porteur")} />
          <FormField label={t("linge.service")} required span={!isUniforme}>
            <select value={newLinge.serviceId || ""} onChange={(e) => set({ serviceId: parseInt(e.target.value) })} required>
              <option value="">{t("linge.select_service")}</option>
              {services.map((s) => <option key={s.id} value={s.id}>{s.code}</option>)}
            </select>
          </FormField>
          {isUniforme && (
            <FormField label={t("linge.carrier")} required hint={t("linge.carrier_hint", "Tapez un nom, prénom, matricule ou code-barre pour filtrer")}>
              <div style={{ position: "relative" }}>
                <SelectRecherche
                  value={newLinge.porteurId || ""}
                  onChange={(e) => set({ porteurId: e.target.value })}
                  placeholder={t("linge.select_carrier")}
                >
                  <option value="">{t("linge.select_carrier")}</option>
                  {personnel.map((p) => (
                    <option key={p.id} value={p.id}>
                      {`${p.nomPrenom || `${p.prenom} ${p.nom}`.trim()}${p.matricule ? ` · ${p.matricule}` : ""}${p.codeBarre ? ` · ${p.codeBarre}` : ""}`}
                    </option>
                  ))}
                </SelectRecherche>
                <HiddenRequired value={newLinge.porteurId} />
              </div>
            </FormField>
          )}

          <Section title={t("linge.sections.status_notes", "État & observations")} hint={t("linge.sections.status_notes_hint", "Statut actuel et notes")} />
          <FormField label={t("linge.status")} span>
            <select value={newLinge.etat} onChange={(e) => set({ etat: e.target.value })}>
              {ETAT_OPTIONS.map((etat) => <option key={etat} value={etat}>{t(`linge_etat.${etat}`)}</option>)}
            </select>
          </FormField>
          <FormField label={t("linge.observations")} span>
            <TextArea value={newLinge.observations} onChange={(v) => set({ observations: v })} placeholder={t("linge.observations_placeholder")} />
          </FormField>
        </FormGrid>
      </form>
    </Modal>
  );
}
