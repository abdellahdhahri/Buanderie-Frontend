import React, { useContext } from "react";
import { useTranslation } from "react-i18next";
import { ScanLine, Check, Info, Timer, RotateCcw, Volume2 } from "lucide-react";
import { LingeContext } from "../../../../contextes/LingeContext";
import { SettingsCard, ChoiceCard, SettingRow, Toggle } from "./SettingsUI";
import { Segmented, Slider, GhostButton } from "./SettingsControls";
import {
  useSetting, setSetting, resetSettings, getSetting, bipScan as bipScanImmediat,
} from "../../../../utils/appSettings";

function BarcodePreview() {
  const bars = [3, 1, 2, 1, 3, 2, 1, 1, 3, 1, 2, 3, 1, 2, 1, 3, 1, 2];
  let x = 22;
  return (
    <svg viewBox="0 0 200 96" className="h-24 w-full rounded-xl bg-slate-50 dark:bg-white/5" aria-hidden="true">
      <rect x="14" y="16" width="172" height="64" rx="10" fill="#FFFFFF" stroke="#E2E8F0" />
      {bars.map((w, i) => {
        const bar = <rect key={i} x={x} y="26" width={w * 2} height="36" rx="0.5" fill="#0F172A" />;
        x += w * 2 + 3;
        return bar;
      })}
      <text x="100" y="74" textAnchor="middle" fontSize="8" fontFamily="IBM Plex Mono, monospace" fill="#64748B">10201800012728</text>
      <rect x="14" y="42" width="172" height="2.5" rx="1" fill="#0D9488" opacity="0.85" />
    </svg>
  );
}

function RfidPreview() {
  return (
    <svg viewBox="0 0 200 96" className="h-24 w-full rounded-xl bg-slate-50 dark:bg-white/5" aria-hidden="true">
      <rect x="30" y="22" width="84" height="52" rx="10" fill="#FFFFFF" stroke="#E2E8F0" />
      <rect x="46" y="34" width="28" height="28" rx="5" fill="#7C3AED" opacity="0.9" />
      <path d="M52 42 H68 M52 48 H68 M52 54 H68" stroke="#FFFFFF" strokeOpacity="0.7" strokeWidth="1.5" />
      <path d="M80 40 H104 M80 48 H98 M80 56 H102" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />
      {[16, 30, 44].map((r, i) => (
        <path
          key={r}
          d={`M${128 + r * 0.2} ${48 - r} A ${r} ${r} 0 0 1 ${128 + r * 0.2} ${48 + r}`}
          fill="none" stroke="#7C3AED" strokeWidth="3" strokeLinecap="round" opacity={0.85 - i * 0.25}
        />
      ))}
    </svg>
  );
}

function SelectedMark() {
  return (
    <span className="absolute right-3.5 top-3.5 flex h-5 w-5 items-center justify-center rounded-full bg-teal-600 text-white shadow">
      <Check className="h-3 w-3" strokeWidth={3} />
    </span>
  );
}

export function ScanSection() {
  const { t } = useTranslation();
  const { isRfidMode, setIsRfidMode } = useContext(LingeContext);
  const delayMs = Number(useSetting("scan.delayMs")) || 400;
  const minLength = Number(useSetting("scan.minLength")) || 3;
  const beep = !!useSetting("scan.beep");

  const testerBip = () => {
    const avant = getSetting("scan.beep");
    setSetting("scan.beep", true);
    bipScanImmediat();
    if (!avant) setSetting("scan.beep", false);
  };

  const modes = [
    {
      rfid: false,
      label: t("settings.scan.barcode", "Code-barres"),
      hint: t("settings.scan.barcode_hint", "Lecture des étiquettes code-barres avec une douchette"),
      preview: <BarcodePreview />,
    },
    {
      rfid: true,
      label: t("settings.scan.rfid", "RFID"),
      hint: t("settings.scan.rfid_hint", "Lecture sans contact des puces RFID cousues dans le linge"),
      preview: <RfidPreview />,
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <SettingsCard
        icon={<ScanLine className="h-[17px] w-[17px]" />}
        title={t("settings.scan.title", "Mode d'identification des linges")}
        description={t("settings.scan.desc", "Choisissez comment les linges sont identifiés dans les écrans de scan. Le choix est mémorisé sur ce poste.")}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {modes.map((m) => {
            const selected = isRfidMode === m.rfid;
            return (
              <ChoiceCard key={m.label} selected={selected} onClick={() => setIsRfidMode(m.rfid)}>
                {m.preview}
                <div className="px-1 pb-1">
                  <p className="m-0 text-[13.5px] font-semibold text-slate-800 dark:text-foreground">{m.label}</p>
                  <p className="m-0 text-[12px] text-slate-500 dark:text-muted-foreground">{m.hint}</p>
                </div>
                {selected && <SelectedMark />}
              </ChoiceCard>
            );
          })}
        </div>

        <p className="m-0 mt-4 flex items-start gap-2 rounded-xl bg-slate-50 px-3.5 py-2.5 text-[12.5px] text-slate-600 dark:bg-white/5 dark:text-muted-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
          {t("settings.scan.applies_to", "S'applique aux écrans Linges, Réception, Tri, Pliage, Stockage et Suivi.")}
        </p>
      </SettingsCard>

      <SettingsCard
        icon={<Timer className="h-[17px] w-[17px]" />}
        title={t("settings.scan.reader_title", "Lecteur")}
        description={t("settings.scan.reader_desc", "Validation automatique des codes envoyés par la douchette ou le lecteur RFID.")}
        footer={
          <span className="mr-auto">
            <GhostButton onClick={() => resetSettings("scan")}>
              <RotateCcw className="h-4 w-4" /> {t("settings.reset_section", "Valeurs par défaut")}
            </GhostButton>
          </span>
        }
      >
        <SettingRow
          label={t("settings.scan.delay", "Délai avant validation")}
          hint={t("settings.scan.delay_hint", "Attente après le dernier caractère reçu. Augmentez-le si des codes sont coupés.")}
        >
          <Slider
            value={delayMs}
            min={150}
            max={1200}
            step={50}
            onChange={(v) => setSetting("scan.delayMs", v)}
            format={(v) => `${v} ms`}
            ariaLabel={t("settings.scan.delay", "Délai")}
          />
        </SettingRow>
        <SettingRow
          label={t("settings.scan.min_length", "Longueur minimale d'un code")}
          hint={t("settings.scan.min_length_hint", "Les saisies plus courtes ne sont pas validées automatiquement.")}
        >
          <Segmented
            value={minLength}
            onChange={(v) => setSetting("scan.minLength", Number(v))}
            options={[2, 3, 4, 6, 8].map((n) => ({ value: n, label: String(n) }))}
          />
        </SettingRow>
        <SettingRow
          label={t("settings.scan.beep", "Bip à chaque scan")}
          hint={t("settings.scan.beep_hint", "Confirmation sonore quand un code est validé.")}
        >
          <span className="flex items-center gap-2">
            <GhostButton onClick={testerBip}>
              <Volume2 className="h-4 w-4" /> {t("settings.scan.beep_test", "Essayer")}
            </GhostButton>
            <Toggle checked={beep} onChange={(v) => setSetting("scan.beep", v)} label={t("settings.scan.beep", "Bip")} />
          </span>
        </SettingRow>
      </SettingsCard>
    </div>
  );
}
