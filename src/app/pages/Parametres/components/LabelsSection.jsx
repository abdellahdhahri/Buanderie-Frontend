import React, { useContext, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Tags, RotateCcw, Printer, LayoutTemplate, ListChecks, Ruler } from "lucide-react";
import { ServiceContext } from "../../../contextes/ServiceContext";
import { SettingsCard, SettingRow, Toggle } from "./SettingsUI";
import {
  LABEL_TYPES, LABEL_TYPE_KEYS, LABEL_SIZES, LABEL_ELEMENTS,
  getLabelSettings, saveLabelSettings, defaultLabelSettings, buildLabelHtml, printLabel,
} from "../../../utils/labels";
import { useEstablishment } from "../../../hooks/useEstablishment";

const MM_TO_PX = 3.7795;

/** Aperçu à l'échelle de l'étiquette, rendu avec le même HTML que l'impression. */
function LabelPreview({ type, settings, t }) {
  const def = LABEL_TYPES[type];
  const { w, h } = LABEL_SIZES[settings.size];
  // Recalculé quand l'identité (logo, nom) change ou finit de charger
  const establishment = useEstablishment();
  const html = useMemo(
    () => buildLabelHtml(type, def.sample, { t }, settings),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [type, def, settings, t, establishment.logo, establishment.nomApplication, establishment.raisonSociale]
  );
  // Mise à l'échelle pour tenir dans ~340 px de large
  const scale = Math.min(2.4, 340 / (w * MM_TO_PX));

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="flex w-full items-center justify-center rounded-2xl p-6"
        style={{
          minHeight: 260,
          background: "repeating-conic-gradient(#f1f5f9 0% 25%, #f8fafc 0% 50%) 50% / 18px 18px",
        }}
      >
        <div style={{ width: w * MM_TO_PX * scale, height: h * MM_TO_PX * scale }}>
          <div
            style={{
              width: `${w}mm`,
              height: `${h}mm`,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              borderRadius: 6,
              boxShadow: "0 1px 2px rgba(15,23,42,.08), 0 12px 28px -10px rgba(15,23,42,.35)",
              overflow: "hidden",
              background: "#fff",
            }}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>
      <p className="m-0 text-[12px] text-slate-500 dark:text-muted-foreground">
        {t("label_settings.preview_hint", { size: LABEL_SIZES[settings.size].label, defaultValue: "Aperçu avec des données d'exemple · {{size}}" })}
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ÉTIQUETTES — contenu et format de chaque type d'étiquette, avec aperçu
   ═══════════════════════════════════════════════════════════════════════════ */
export function LabelsSection() {
  const { t } = useTranslation();
  const { services } = useContext(ServiceContext) || {};
  const [type, setType] = useState("linge");
  const [settings, setSettings] = useState(() => getLabelSettings("linge"));
  const def = LABEL_TYPES[type];

  const typeName = (k) => t(`barcode_label.types.${k}`, k);

  const selectType = (k) => {
    setType(k);
    setSettings(getLabelSettings(k));
  };

  const update = (next) => {
    setSettings(next);
    saveLabelSettings(type, next);
  };

  const toggleElement = (key) => update({ ...settings, elements: { ...settings.elements, [key]: !settings.elements[key] } });

  const toggleField = (key) => {
    const on = settings.fields.includes(key);
    // L'ordre d'affichage suit l'ordre de déclaration des champs du type
    const fields = on
      ? settings.fields.filter((f) => f !== key)
      : Object.keys(def.fields).filter((f) => f === key || settings.fields.includes(f));
    update({ ...settings, fields });
  };

  const reset = () => {
    saveLabelSettings(type, null);
    setSettings(defaultLabelSettings(type));
  };

  return (
    <div className="flex flex-col gap-5">
      <SettingsCard
        icon={<Tags className="h-[17px] w-[17px]" />}
        title={t("label_settings.title", "Étiquettes")}
        description={t("label_settings.desc", "Choisissez ce qui apparaît sur chaque type d'étiquette. Les réglages sont mémorisés sur ce poste.")}
        footer={
          <>
            <button
              type="button"
              onClick={reset}
              className="mr-auto inline-flex items-center gap-2 rounded-[10px] px-3 py-2 text-[13px] font-medium text-slate-600 hover:bg-slate-100 dark:text-muted-foreground dark:hover:bg-white/5"
            >
              <RotateCcw className="h-4 w-4" />
              {t("label_settings.reset", "Réglages par défaut")}
            </button>
            <button
              type="button"
              onClick={() => printLabel(type, def.sample, { t, services })}
              className="inline-flex items-center gap-2 rounded-[10px] bg-teal-600 px-4 py-2 text-[13px] font-semibold text-white shadow-sm hover:bg-teal-700"
            >
              <Printer className="h-4 w-4" />
              {t("label_settings.print_test", "Imprimer un test")}
            </button>
          </>
        }
      >
        {/* ─── Type d'étiquette ─── */}
        <div className="-mx-1 mb-5 flex gap-2 overflow-x-auto px-1 pb-1">
          {LABEL_TYPE_KEYS.map((k) => {
            const selected = k === type;
            const color = LABEL_TYPES[k].color;
            return (
              <button
                key={k}
                type="button"
                onClick={() => selectType(k)}
                aria-pressed={selected}
                className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
                  selected
                    ? "border-transparent text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-border dark:bg-transparent dark:text-muted-foreground"
                }`}
                style={selected ? { background: color } : undefined}
              >
                <span className="h-2 w-2 rounded-full" style={{ background: selected ? "#fff" : color }} />
                {typeName(k)}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          {/* ─── Réglages ─── */}
          <div className="flex flex-col gap-6">
            <div>
              <p className="m-0 mb-2.5 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-slate-500">
                <Ruler className="h-3.5 w-3.5" /> {t("label_settings.size", "Format")}
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {Object.entries(LABEL_SIZES).map(([key, s]) => {
                  const selected = settings.size === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => update({ ...settings, size: key })}
                      aria-pressed={selected}
                      className={`flex flex-col items-center gap-1.5 rounded-xl border px-2 py-2.5 text-[12px] font-semibold transition-colors ${
                        selected
                          ? "border-teal-500 bg-teal-50 text-teal-800 ring-[3px] ring-teal-500/15 dark:bg-teal-500/10 dark:text-teal-200"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-border dark:bg-transparent dark:text-muted-foreground"
                      }`}
                    >
                      <span
                        className="rounded-[3px] border-2 border-current opacity-70"
                        style={{ width: s.w / 3, height: s.h / 3 }}
                      />
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="m-0 mb-1 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-slate-500">
                <LayoutTemplate className="h-3.5 w-3.5" /> {t("label_settings.elements", "Éléments")}
              </p>
              {LABEL_ELEMENTS.map((el) => (
                <SettingRow key={el.key} label={t(`label_settings.element.${el.key}`, el.fr)}>
                  <Toggle
                    checked={!!settings.elements[el.key]}
                    onChange={() => toggleElement(el.key)}
                    label={t(`label_settings.element.${el.key}`, el.fr)}
                  />
                </SettingRow>
              ))}
            </div>

            <div>
              <p className="m-0 mb-1 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-slate-500">
                <ListChecks className="h-3.5 w-3.5" /> {t("label_settings.fields_title", "Informations")}
              </p>
              {Object.entries(def.fields).map(([key, f]) => (
                <SettingRow key={key} label={t(`label_settings.fields.${type}.${key}`, f.fr)}>
                  <Toggle
                    checked={settings.fields.includes(key)}
                    onChange={() => toggleField(key)}
                    label={t(`label_settings.fields.${type}.${key}`, f.fr)}
                  />
                </SettingRow>
              ))}
            </div>
          </div>

          {/* ─── Aperçu ─── */}
          <div className="lg:sticky lg:top-[100px] lg:self-start">
            <LabelPreview type={type} settings={settings} t={t} />
          </div>
        </div>
      </SettingsCard>
    </div>
  );
}
