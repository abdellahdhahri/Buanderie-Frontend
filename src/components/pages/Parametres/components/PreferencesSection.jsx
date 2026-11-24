import React from "react";
import { useTranslation } from "react-i18next";
import { LayoutList, Gauge, Timer, LayoutDashboard, Shirt, RotateCcw } from "lucide-react";
import { SettingsCard, SettingRow, Toggle } from "./SettingsUI";
import { Segmented, Slider, GhostButton } from "./SettingsControls";
import { CategoryPicker } from "../../../ui/CategoryPicker";
import { CATEGORIES_LINGE } from "../../../../constants/categoriesLinge";
import { useSetting, setSetting, resetSettings, formatDateTime } from "../../../../utils/appSettings";

const KPIS = [
  { id: "actifs", key: "dashboard.active_linens", fr: "Linges actifs" },
  { id: "disponibles", key: "dashboard.available_linens", fr: "Linges disponibles" },
  { id: "circuit", key: "dashboard.in_circuit", fr: "En circuit" },
  { id: "collectes", key: "dashboard.collections_today", fr: "Collectes du jour" },
  { id: "lavages", key: "dashboard.washes_today", fr: "Lavages du jour" },
  { id: "incomplets", key: "dashboard.incomplete_linens", fr: "Linges incomplets" },
  { id: "finDeVie", key: "dashboard.end_of_life", fr: "Fin de vie proche" },
  { id: "infection", key: "dashboard.infection_rate", fr: "Taux d'infection" },
  { id: "bacsInfectes", key: "dashboard.infected_bins_waiting", fr: "Bacs infectés en attente" },
];

const ResetFooter = ({ section, t }) => (
  <span className="mr-auto">
    <GhostButton onClick={() => resetSettings(section)}>
      <RotateCcw className="h-4 w-4" /> {t("settings.reset_section", "Valeurs par défaut")}
    </GhostButton>
  </span>
);

function LotScale({ plein }) {
  const orange = Math.max(0, plein - 20);
  return (
    <div className="mt-3 flex h-2 w-full overflow-hidden rounded-full">
      <span className="bg-teal-500" style={{ width: `${orange}%` }} />
      <span className="bg-amber-500" style={{ width: `${plein - orange}%` }} />
      <span className="bg-rose-500" style={{ width: `${100 - plein}%` }} />
    </div>
  );
}

export function PreferencesSection() {
  const { t } = useTranslation();
  const pageSize = useSetting("display.pageSize");
  const dateStyle = useSetting("display.dateStyle");
  const lotFull = Number(useSetting("thresholds.lotFullPct")) || 80;
  const statsS = useSetting("refresh.statsSeconds");
  const trackingS = useSetting("refresh.trackingSeconds");
  const distribS = useSetting("refresh.distributionSeconds");
  const machinesS = useSetting("refresh.machinesSeconds");
  const hidden = useSetting("dashboard.hiddenKpis") || [];
  const active = useSetting("categories.active") || CATEGORIES_LINGE;

  const exemple = new Date(2026, 9, 9, 14, 30);
  const dateLabel = (style) => {
    try { return exemple.toLocaleString("fr-FR", { dateStyle: style, timeStyle: "short" }); } catch { return style; }
  };

  const toggleKpi = (id) =>
    setSetting("dashboard.hiddenKpis", hidden.includes(id) ? hidden.filter((k) => k !== id) : [...hidden, id]);

  return (
    <div className="flex flex-col gap-5">
      <SettingsCard
        icon={<LayoutList className="h-[17px] w-[17px]" />}
        title={t("settings.prefs.display_title", "Affichage")}
        description={t("settings.prefs.display_desc", "Présentation des listes et des dates.")}
        footer={<ResetFooter section="display" t={t} />}
      >
        <SettingRow
          label={t("settings.prefs.page_size", "Lignes par page")}
          hint={t("settings.prefs.page_size_hint", "Linges, Historique, Immobilisations.")}
        >
          <Segmented
            value={pageSize}
            onChange={(v) => setSetting("display.pageSize", Number(v))}
            options={[10, 20, 50, 100].map((n) => ({ value: n, label: String(n) }))}
          />
        </SettingRow>
        <SettingRow
          label={t("settings.prefs.date_style", "Format de date")}
          hint={t("settings.prefs.date_example", { value: formatDateTime(exemple), defaultValue: "Exemple : {{value}}" })}
        >
          <Segmented
            value={dateStyle}
            onChange={(v) => setSetting("display.dateStyle", v)}
            options={[
              { value: "short", label: dateLabel("short") },
              { value: "medium", label: dateLabel("medium") },
              { value: "long", label: dateLabel("long") },
            ]}
          />
        </SettingRow>
      </SettingsCard>

      <SettingsCard
        icon={<Gauge className="h-[17px] w-[17px]" />}
        title={t("settings.prefs.thresholds_title", "Seuils")}
        description={t("settings.prefs.thresholds_desc", "Niveaux d'alerte affichés dans les écrans de tri, de lavage et de séchage.")}
        footer={<ResetFooter section="thresholds" t={t} />}
      >
        <SettingRow
          label={t("settings.prefs.lot_full", "Lot considéré plein à partir de")}
          hint={t("settings.prefs.lot_full_hint", "Le panier passe au rouge et affiche « Plein ». Il devient orange 20 points avant.")}
        >
          <Slider
            value={lotFull}
            min={50}
            max={100}
            step={5}
            onChange={(v) => setSetting("thresholds.lotFullPct", v)}
            format={(v) => `${v} %`}
            ariaLabel={t("settings.prefs.lot_full", "Lot plein")}
          />
        </SettingRow>
        <LotScale plein={lotFull} />
      </SettingsCard>

      <SettingsCard
        icon={<Timer className="h-[17px] w-[17px]" />}
        title={t("settings.prefs.refresh_title", "Rafraîchissement automatique")}
        description={t("settings.prefs.refresh_desc", "Fréquence de mise à jour des écrans en direct. Augmentez-la sur un réseau lent.")}
        footer={<ResetFooter section="refresh" t={t} />}
      >
        <SettingRow label={t("settings.prefs.refresh_stats", "Tableau de bord Statistiques")}>
          <Segmented value={statsS} onChange={(v) => setSetting("refresh.statsSeconds", Number(v))}
            options={[15, 30, 60, 120].map((n) => ({ value: n, label: n < 60 ? `${n} s` : `${n / 60} min` }))} />
        </SettingRow>
        <SettingRow label={t("settings.prefs.refresh_tracking", "Suivi d'un linge (LIVE)")}>
          <Segmented value={trackingS} onChange={(v) => setSetting("refresh.trackingSeconds", Number(v))}
            options={[5, 10, 30, 60].map((n) => ({ value: n, label: n < 60 ? `${n} s` : "1 min" }))} />
        </SettingRow>
        <SettingRow label={t("settings.prefs.refresh_machines", "Machines de lavage")}>
          <Segmented value={machinesS} onChange={(v) => setSetting("refresh.machinesSeconds", Number(v))}
            options={[5, 15, 30, 60].map((n) => ({ value: n, label: n < 60 ? `${n} s` : "1 min" }))} />
        </SettingRow>
        <SettingRow label={t("settings.prefs.refresh_distribution", "Distribution service (comparatif)")}>
          <Segmented value={distribS} onChange={(v) => setSetting("refresh.distributionSeconds", Number(v))}
            options={[2, 3, 5, 10].map((n) => ({ value: n, label: `${n} s` }))} />
        </SettingRow>
      </SettingsCard>

      <SettingsCard
        icon={<LayoutDashboard className="h-[17px] w-[17px]" />}
        title={t("settings.prefs.dashboard_title", "Tableau de bord")}
        description={t("settings.prefs.dashboard_desc", "Cartes affichées en haut de l'écran Statistiques.")}
        footer={<ResetFooter section="dashboard" t={t} />}
      >
        <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
          {KPIS.map((k) => (
            <SettingRow key={k.id} label={t(k.key, k.fr)}>
              <Toggle checked={!hidden.includes(k.id)} onChange={() => toggleKpi(k.id)} label={t(k.key, k.fr)} />
            </SettingRow>
          ))}
        </div>
      </SettingsCard>

      <SettingsCard
        icon={<Shirt className="h-[17px] w-[17px]" />}
        title={t("settings.prefs.categories_title", "Catégories utilisées")}
        description={t("settings.prefs.categories_desc", "Catégories proposées à la saisie (linges, programmes, lots, collecte). Les filtres de recherche gardent toutes les catégories.")}
        footer={<ResetFooter section="categories" t={t} />}
      >
        <CategoryPicker
          multiple
          categories={CATEGORIES_LINGE}
          value={active}
          onChange={(cats) => cats.length > 0 && setSetting("categories.active", cats)}
        />
      </SettingsCard>
    </div>
  );
}
