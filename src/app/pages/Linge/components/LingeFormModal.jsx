import React from "react";
import { useTranslation } from "react-i18next";
import {
  Barcode, Tag, User as UserIcon, Calendar, Building2, FileText, Sparkles, ShieldCheck, Weight, Activity,
} from "lucide-react";
import { FormModal, FormSection, FormField, Segmented } from "../../../components/ui/modal-kit";
import { CategoryPicker } from "../../../components/ui/CategoryPicker";
import { ETAT_OPTIONS } from "../lingeConstants";
import { PersonnelAutocomplete } from "./PersonnelAutocomplete";

// Champ invisible : garde la validation native (« obligatoire ») d'un sélecteur sans <input>
const HiddenRequired = ({ value }) => (
  <input
    tabIndex={-1}
    aria-hidden="true"
    required
    value={value || ""}
    onChange={() => {}}
    className="modal-bare"
    style={{ position: "absolute", width: 1, height: 1, opacity: 0, pointerEvents: "none" }}
  />
);

// ═══════════════════════════════════════════════════════════════════════════
// ✏️ CRÉATION / MODIFICATION D'UN LINGE — blocs repliables du kit de modales
// ═══════════════════════════════════════════════════════════════════════════
export function LingeFormModal({
  isOpen,
  onClose,
  onSubmit,
  lingeToEdit,
  newLinge,
  setNewLinge,
  creationMode,
  setCreationMode,
  services,
  personnel,
  isSaving,
}) {
  const { t } = useTranslation();
  const isUniforme = newLinge.categorie === "UNIFORME";
  const set = (patch) => setNewLinge({ ...newLinge, ...patch });

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      mode={lingeToEdit ? "edit" : "create"}
      title={lingeToEdit ? t('linge.edit_article') : t('linge.new_article')}
      subtitle={lingeToEdit
        ? `#${lingeToEdit.id} · ${lingeToEdit.codebarre}`
        : t('linge.form_subtitle', "Remplissez les informations du linge")}
      onSubmit={onSubmit}
      saving={isSaving}
    >
      {/* ─── Nouveau linge (code généré) / linge existant (code scanné) ─── */}
      {!lingeToEdit && (
        <Segmented
          value={creationMode}
          onChange={(m) => {
            setCreationMode(m);
            if (m === "auto") set({ codebarre: "", rfidTag: "" });
          }}
          options={[
            { value: "auto", label: t('linge.new_linen'), icon: <Sparkles /> },
            { value: "manual", label: t('linge.existing_linen'), icon: <ShieldCheck /> },
          ]}
        />
      )}

      {/* ─── Identification (création uniquement) ─── */}
      {!lingeToEdit && (
        <FormSection
          icon="id"
          title={t('linge.sections.identification', 'Identification')}
          description={creationMode === "auto"
            ? t('linge.sections.identification_auto', 'Le code-barres sera généré automatiquement')
            : t('linge.sections.identification_hint', 'Code-barres et tag RFID')}
        >
          {creationMode === "manual" && (
            <FormField label={t('linge.tracking_code')} required icon={<Barcode />}>
              <input
                type="text"
                placeholder={t('linge.scan_code_here')}
                value={newLinge.codebarre}
                onChange={(e) => set({ codebarre: e.target.value })}
                required
              />
            </FormField>
          )}
          <FormField
            label={`RFID ${t('common.optional')}`}
            icon={<Tag />}
            hint={t('linge.rfid_optional_hint')}
            span={creationMode === "manual" ? 1 : 2}
          >
            <input
              type="text"
              placeholder={t('linge.scan_rfid_or_leave_empty')}
              value={newLinge.rfidTag}
              onChange={(e) => set({ rfidTag: e.target.value })}
            />
          </FormField>
        </FormSection>
      )}

      {/* ─── Caractéristiques ─── */}
      <FormSection
        icon="specs"
        title={t('linge.sections.characteristics', 'Caractéristiques')}
        description={t('linge.sections.characteristics_hint', 'Catégorie, poids et durée de vie')}
      >
        <FormField label={t('linge.category')} required span={2}>
          <div style={{ position: "relative" }}>
            <CategoryPicker
              value={newLinge.categorie}
              onChange={(categorie) => set({
                categorie,
                porteurId: categorie !== "UNIFORME" ? "" : newLinge.porteurId,
              })}
            />
            <HiddenRequired value={newLinge.categorie} />
          </div>
        </FormField>

        <FormField label={t('linge.weight_kg')} required icon={<Weight />}>
          <input
            type="number"
            step="0.1"
            min="0"
            value={newLinge.poids}
            onChange={(e) => set({ poids: parseFloat(e.target.value) })}
            required
          />
        </FormField>

        <FormField label={t('linge.life_cycles')} icon={<Calendar />}>
          <input
            type="number"
            step="1"
            min="0"
            placeholder="—"
            value={newLinge.dureVie}
            onChange={(e) => set({ dureVie: e.target.value })}
          />
        </FormField>
      </FormSection>

      {/* ─── Affectation ─── */}
      <FormSection
        icon="people"
        title={t('linge.sections.assignment', 'Affectation')}
        description={t('linge.sections.assignment_hint', 'Service et porteur')}
      >
        <FormField label={t('linge.service')} required icon={<Building2 />} span={isUniforme ? 1 : 2}>
          <select
            value={newLinge.serviceId || ""}
            onChange={(e) => set({ serviceId: parseInt(e.target.value) })}
            required
          >
            <option value="">{t('linge.select_service')}</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>{s.code}</option>
            ))}
          </select>
        </FormField>

        {isUniforme && (
          <FormField
            label={t('linge.carrier')}
            required
            icon={<UserIcon />}
            hint={t('linge.carrier_hint', "Tapez un nom, prénom, matricule ou code-barre pour filtrer")}
          >
            <div style={{ position: "relative" }}>
              <PersonnelAutocomplete
                value={newLinge.porteurId || ""}
                onChange={(id) => set({ porteurId: id })}
                personnel={personnel}
                placeholder={t('linge.select_carrier')}
              />
              <HiddenRequired value={newLinge.porteurId} />
            </div>
          </FormField>
        )}
      </FormSection>

      {/* ─── État & observations (replié par défaut) ─── */}
      <FormSection
        icon="notes"
        title={t('linge.sections.status_notes', 'État & observations')}
        description={t('linge.sections.status_notes_hint', 'Statut actuel et notes')}
        defaultOpen={!!lingeToEdit || !!newLinge.observations}
      >
        <FormField label={t('linge.status')} icon={<Activity />} span={2}>
          <select
            value={newLinge.etat}
            onChange={(e) => set({ etat: e.target.value })}
          >
            {ETAT_OPTIONS.map((etat) => (
              <option key={etat} value={etat}>{t(`linge_etat.${etat}`)}</option>
            ))}
          </select>
        </FormField>

        <FormField label={t('linge.observations')} icon={<FileText />} span={2}>
          <textarea
            value={newLinge.observations}
            onChange={(e) => set({ observations: e.target.value })}
            placeholder={t('linge.observations_placeholder')}
          />
        </FormField>
      </FormSection>
    </FormModal>
  );
}
