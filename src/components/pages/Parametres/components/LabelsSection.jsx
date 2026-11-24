import React, { useContext, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Tags, RotateCcw, Printer, LayoutTemplate, ListChecks, Ruler, Move } from "lucide-react";
import { ServiceContext } from "../../../../contextes/ServiceContext";
import { SettingsCard, SettingRow, Toggle } from "./SettingsUI";
import {
  LABEL_TYPES, LABEL_TYPE_KEYS, LABEL_SIZES, LABEL_ELEMENTS,
  getLabelSettings, saveLabelSettings, defaultLabelSettings, buildLabelHtml, printLabel,
  LABEL_BLOCKS, visibleBlocks, resolveLayout,
} from "../../../../utils/labels";
import { useEstablishment } from "../../../../hooks/useEstablishment";

const MM_TO_PX = 3.7795;

const snap = (v) => Math.round(v * 2) / 2;
const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), Math.max(lo, hi));

function LabelPreview({ type, settings, t, selected, onSelect, onLayout }) {
  const def = LABEL_TYPES[type];
  const { w, h } = LABEL_SIZES[settings.size];
  const establishment = useEstablishment();
  const html = useMemo(
    () => buildLabelHtml(type, def.sample, { t }, settings),
    [type, def, settings, t, establishment.logo, establishment.nomApplication, establishment.raisonSociale]
  );
  const scale = Math.min(2.4, 340 / (w * MM_TO_PX));
  const k = MM_TO_PX * scale;
  const layout = resolveLayout(settings);
  const keys = visibleBlocks(settings);
  const drag = useRef(null);
  const latest = useRef({ layout, w, h, k });
  latest.current = { layout, w, h, k };

  const startDrag = (e, key, mode) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect(key);
    const b = latest.current.layout[key];
    drag.current = { key, mode, sx: e.clientX, sy: e.clientY, b };
    const move = (ev) => {
      const d = drag.current;
      if (!d) return;
      const { w: lw, h: lh, k: lk } = latest.current;
      const dx = (ev.clientX - d.sx) / lk;
      const dy = (ev.clientY - d.sy) / lk;
      if (d.mode === "move") {
        onLayout(d.key, { x: clamp(snap(d.b.x + dx), 0, lw - d.b.w), y: clamp(snap(d.b.y + dy), 0, lh - d.b.h) });
      } else {
        onLayout(d.key, { w: clamp(snap(d.b.w + dx), 2, lw - d.b.x), h: clamp(snap(d.b.h + dy), 1.5, lh - d.b.y) });
      }
    };
    const up = () => {
      drag.current = null;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const onKey = (e, key) => {
    const step = e.shiftKey ? 2 : 0.5;
    const b = layout[key];
    const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    const m = moves[e.key];
    if (!m) return;
    e.preventDefault();
    onLayout(key, { x: clamp(snap(b.x + m[0]), 0, w - b.w), y: clamp(snap(b.y + m[1]), 0, h - b.h) });
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="flex w-full items-center justify-center rounded-2xl p-6"
        style={{
          minHeight: 260,
          background: "repeating-conic-gradient(#f1f5f9 0% 25%, #f8fafc 0% 50%) 50% / 18px 18px",
        }}
        onPointerDown={() => onSelect(null)}
      >
        <div style={{ position: "relative", width: w * k, height: h * k }}>
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
              pointerEvents: "none",
            }}
            dangerouslySetInnerHTML={{ __html: html }}
          />
          {keys.map((key) => {
            const b = layout[key];
            const active = selected === key;
            return (
              <div
                key={key}
                tabIndex={0}
                role="button"
                aria-label={key}
                onPointerDown={(e) => startDrag(e, key, "move")}
                onKeyDown={(e) => onKey(e, key)}
                onFocus={() => onSelect(key)}
                style={{
                  position: "absolute",
                  left: b.x * k,
                  top: b.y * k,
                  width: b.w * k,
                  height: b.h * k,
                  cursor: "move",
                  touchAction: "none",
                  outline: "none",
                  border: active ? "1.5px solid #0d9488" : "1px dashed rgba(100,116,139,.55)",
                  background: active ? "rgba(13,148,136,.10)" : "transparent",
                  boxSizing: "border-box",
                }}
              >
                {active && (
                  <span
                    onPointerDown={(e) => startDrag(e, key, "resize")}
                    style={{
                      position: "absolute",
                      right: -5,
                      bottom: -5,
                      width: 10,
                      height: 10,
                      borderRadius: 2,
                      background: "#0d9488",
                      border: "1.5px solid #fff",
                      cursor: "nwse-resize",
                      touchAction: "none",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
      <p className="m-0 text-[12px] text-slate-500 dark:text-muted-foreground">
        {t("label_settings.preview_hint", { size: LABEL_SIZES[settings.size].label, defaultValue: "Aperçu avec des données d'exemple · {{size}}" })}
      </p>
    </div>
  );
}

function NumberField({ label, value, onChange, min = 0, max = 200, step = 0.5, suffix = "mm" }) {
  return (
    <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
      {label}
      <span className="flex items-center gap-1.5">
        <input
          type="number"
          value={Number.isFinite(value) ? value : 0}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-[13px] font-medium normal-case tracking-normal text-slate-800 outline-none focus:border-teal-500 focus:ring-[3px] focus:ring-teal-500/15 dark:border-border dark:bg-transparent dark:text-foreground"
        />
        <span className="text-[11px] font-medium normal-case text-slate-400">{suffix}</span>
      </span>
    </label>
  );
}

function BlockInspector({ settings, selected, onSelect, onLayout, onResetBlock, onResetLayout, t }) {
  const { w, h } = LABEL_SIZES[settings.size];
  const layout = resolveLayout(settings);
  const keys = visibleBlocks(settings);
  const info = LABEL_BLOCKS.find((b) => b.key === selected);
  const b = selected && layout[selected] ? layout[selected] : null;
  const name = (key) => t(`label_settings.block.${key}`, LABEL_BLOCKS.find((x) => x.key === key).fr);

  return (
    <div>
      <p className="m-0 mb-2.5 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-slate-500">
        <Move className="h-3.5 w-3.5" /> {t("label_settings.layout", "Disposition")}
      </p>
      <p className="m-0 mb-3 text-[12px] text-slate-500">
        {t("label_settings.layout_hint", "Glissez les éléments dans l'aperçu, redimensionnez avec le coin, ou utilisez les flèches du clavier.")}
      </p>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {keys.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            aria-pressed={selected === key}
            className={`rounded-full border px-3 py-1 text-[12px] font-semibold transition-colors ${
              selected === key
                ? "border-teal-500 bg-teal-50 text-teal-800 dark:bg-teal-500/10 dark:text-teal-200"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-border dark:bg-transparent dark:text-muted-foreground"
            }`}
          >
            {name(key)}
          </button>
        ))}
      </div>

      {b ? (
        <div className="rounded-xl border border-slate-200 p-3 dark:border-border">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <NumberField label="X" value={b.x} max={w} onChange={(v) => onLayout(selected, { x: clamp(v, 0, w - b.w) })} />
            <NumberField label="Y" value={b.y} max={h} onChange={(v) => onLayout(selected, { y: clamp(v, 0, h - b.h) })} />
            <NumberField label={t("label_settings.width", "Largeur")} value={b.w} min={2} max={w} onChange={(v) => onLayout(selected, { w: clamp(v, 2, w - b.x) })} />
            <NumberField label={t("label_settings.height", "Hauteur")} value={b.h} min={1.5} max={h} onChange={(v) => onLayout(selected, { h: clamp(v, 1.5, h - b.y) })} />
          </div>
          {info?.font && (
            <div className="mt-3 flex items-center gap-3">
              <span className="w-24 shrink-0 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                {t("label_settings.font_size", "Police")}
              </span>
              <input
                type="range"
                min={3}
                max={30}
                step={0.5}
                value={b.fs}
                onChange={(e) => onLayout(selected, { fs: Number(e.target.value) })}
                className="h-1.5 flex-1 accent-teal-600"
              />
              <span className="w-14 text-right text-[13px] font-semibold tabular-nums text-slate-700 dark:text-foreground">{b.fs} pt</span>
            </div>
          )}
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={() => onResetBlock(selected)}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-slate-600 hover:bg-slate-100 dark:text-muted-foreground dark:hover:bg-white/5"
            >
              <RotateCcw className="h-3.5 w-3.5" /> {t("label_settings.reset_block", "Réinitialiser l'élément")}
            </button>
          </div>
        </div>
      ) : (
        <p className="m-0 rounded-xl border border-dashed border-slate-200 p-3 text-[12px] text-slate-500 dark:border-border">
          {t("label_settings.select_block", "Sélectionnez un élément pour régler sa position, sa taille et sa police.")}
        </p>
      )}

      <button
        type="button"
        onClick={onResetLayout}
        className="mt-3 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-slate-600 hover:bg-slate-100 dark:text-muted-foreground dark:hover:bg-white/5"
      >
        <RotateCcw className="h-3.5 w-3.5" /> {t("label_settings.reset_layout", "Réinitialiser la disposition")}
      </button>
    </div>
  );
}

export function LabelsSection() {
  const { t } = useTranslation();
  const { services } = useContext(ServiceContext) || {};
  const [type, setType] = useState("linge");
  const [settings, setSettings] = useState(() => getLabelSettings("linge"));
  const [selected, setSelected] = useState(null);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const def = LABEL_TYPES[type];

  const typeName = (k) => t(`barcode_label.types.${k}`, k);

  const selectType = (k) => {
    setType(k);
    setSelected(null);
    setSettings(getLabelSettings(k));
  };

  const update = (next) => {
    settingsRef.current = next;
    setSettings(next);
    saveLabelSettings(type, next);
  };

  const updateBlock = (key, patch) => {
    const cur = settingsRef.current;
    update({ ...cur, layout: { ...cur.layout, [key]: { ...((cur.layout && cur.layout[key]) || {}), ...patch } } });
  };

  const resetBlock = (key) => {
    const cur = settingsRef.current;
    const layout = { ...cur.layout };
    delete layout[key];
    update({ ...cur, layout });
  };

  const resetLayout = () => update({ ...settingsRef.current, layout: {} });

  const toggleElement = (key) => update({ ...settings, elements: { ...settings.elements, [key]: !settings.elements[key] } });

  const toggleField = (key) => {
    const on = settings.fields.includes(key);
    const fields = on
      ? settings.fields.filter((f) => f !== key)
      : Object.keys(def.fields).filter((f) => f === key || settings.fields.includes(f));
    update({ ...settings, fields });
  };

  const reset = () => {
    saveLabelSettings(type, null);
    setSelected(null);
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
                      onClick={() => update({ ...settings, size: key, layout: {} })}
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

          <div className="lg:sticky lg:top-[100px] lg:self-start">
            <LabelPreview type={type} settings={settings} t={t} selected={selected} onSelect={setSelected} onLayout={updateBlock} />
            <div className="mt-5">
              <BlockInspector
                settings={settings}
                selected={selected}
                onSelect={setSelected}
                onLayout={updateBlock}
                onResetBlock={resetBlock}
                onResetLayout={resetLayout}
                t={t}
              />
            </div>
          </div>
        </div>
      </SettingsCard>
    </div>
  );
}
