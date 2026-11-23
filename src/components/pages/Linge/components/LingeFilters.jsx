import React from "react";
import { useTranslation } from "react-i18next";
import { FilterPanel, FilterRow, FilterSelect, FilterText, ExportStack } from "../../../kit";
import { ETAT_OPTIONS } from "../lingeConstants";

const versFiltre = (v) => (v === "all" ? "" : v);
const versSelect = (v) => (v === "" || v == null ? "all" : String(v));

export function LingeFilters({ filters, onChange, services, categories = [], onReset, onStats, onExport, exporting, count, onColumns }) {
  const { t } = useTranslation();
  const set = (k) => (v) => onChange({ ...filters, [k]: versFiltre(v) });
  return (
    <FilterPanel>
      <FilterRow>
        <FilterSelect
          label={t("linge.status")}
          value={versSelect(filters.etat)}
          onChange={set("etat")}
          allLabel={t("common.all")}
          options={ETAT_OPTIONS.map((e) => ({ value: e, label: t(`linge_etat.${e}`) }))}
        />
        <FilterSelect
          label={t("linge.category")}
          value={versSelect(filters.categorie)}
          onChange={set("categorie")}
          allLabel={t("common.all")}
          options={categories.map((c) => ({ value: c, label: t(`categories.${c}`, c) }))}
        />
        <FilterSelect
          label={t("linge.service")}
          value={versSelect(filters.serviceId)}
          onChange={set("serviceId")}
          allLabel={t("common.all")}
          options={services.map((s) => ({ value: String(s.id), label: s.code }))}
        />
        <FilterText
          label={t("common.search")}
          placeholder={t("linge.search_placeholder")}
          value={filters.search}
          onChange={(v) => onChange({ ...filters, search: v })}
        />
        <ExportStack
          count={count}
          onReset={onReset}
          resetTitle={t("linge.filters.clear", "Supprimer les filtres")}
          onStats={onStats}
          onColumns={onColumns}
          onExcel={exporting ? undefined : onExport}
          style={{ marginLeft: 8 }}
        />
      </FilterRow>
    </FilterPanel>
  );
}
