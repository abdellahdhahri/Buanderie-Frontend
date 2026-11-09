import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Palette, Languages, Check } from "lucide-react";
import { useLanguage } from "../../../../i18n/LanguageProvider";
import { getThemeMode, setThemeMode, onThemeChange } from "../../../../utils/theme";
import franceFlag from "../../../../assets/flags/france.png";
import ukFlag from "../../../../assets/flags/uk.png";
import tunisiaFlag from "../../../../assets/flags/tunisia.png";
import { SettingsCard, ChoiceCard } from "./SettingsUI";

const LANGUAGES = [
  { code: "fr", label: "Français", flag: franceFlag },
  { code: "en", label: "English", flag: ukFlag },
  { code: "ar", label: "العربية", flag: tunisiaFlag },
];

function ThemePreview({ dark }) {
  const bg = dark ? "bg-[#0b1220]" : "bg-[#f1f5f9]";
  const side = dark ? "bg-[#111a2b]" : "bg-[#fff]";
  const card = dark ? "bg-[#16213a]" : "bg-[#fff]";
  const line = dark ? "bg-[#243149]" : "bg-[#e2e8f0]";
  return (
    <div className={`flex h-24 gap-1.5 overflow-hidden rounded-xl p-1.5 ${bg}`}>
      <div className={`flex w-8 flex-col gap-1 rounded-md p-1 ${side}`}>
        <span className="h-1.5 rounded-full bg-teal-500" />
        <span className={`h-1.5 rounded-full ${line}`} />
        <span className={`h-1.5 rounded-full ${line}`} />
      </div>
      <div className="flex flex-1 flex-col gap-1.5">
        <div className={`h-3 rounded-md ${side}`} />
        <div className={`flex-1 rounded-md p-1.5 ${card}`}>
          <span className={`block h-1.5 w-3/4 rounded-full ${line}`} />
          <span className={`mt-1 block h-1.5 w-1/2 rounded-full ${line}`} />
          <span className="mt-2 block h-3 w-10 rounded bg-teal-500/80" />
        </div>
      </div>
    </div>
  );
}

function SystemPreview() {
  return (
    <div className="relative h-24 overflow-hidden rounded-xl">
      <div className="absolute inset-0 [clip-path:polygon(0_0,100%_0,0_100%)]">
        <ThemePreview dark={false} />
      </div>
      <div className="absolute inset-0 [clip-path:polygon(100%_0,100%_100%,0_100%)]">
        <ThemePreview dark />
      </div>
    </div>
  );
}

function SelectedMark() {
  return (
    <span className="absolute right-3.5 top-3.5 flex h-5 w-5 items-center justify-center rounded-full bg-teal-600 text-white shadow">
      <Check className="h-3 w-3" strokeWidth={3} />
    </span>
  );
}

export function AppearanceSection() {
  const { t } = useTranslation();
  const { currentLanguage, changeLanguage } = useLanguage();
  const [mode, setMode] = useState(getThemeMode);

  useEffect(() => onThemeChange((_, m) => setMode(m)), []);

  const themes = [
    { mode: "light", label: t("settings.appearance.light", "Clair"), hint: t("settings.appearance.light_hint", "Lumineux, idéal en journée"), preview: <ThemePreview dark={false} /> },
    { mode: "dark", label: t("settings.appearance.dark", "Sombre"), hint: t("settings.appearance.dark_hint", "Repose les yeux en faible lumière"), preview: <ThemePreview dark /> },
    { mode: "system", label: t("settings.appearance.system", "Système"), hint: t("settings.appearance.system_hint", "Suit le réglage de Windows"), preview: <SystemPreview /> },
  ];

  return (
    <div className="flex flex-col gap-5">
      <SettingsCard
        icon={<Palette className="h-[17px] w-[17px]" />}
        title={t("settings.appearance.theme_title", "Thème")}
        description={t("settings.appearance.theme_desc", "Choisissez l'apparence de l'application. Votre choix est mémorisé.")}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {themes.map((theme) => (
            <ChoiceCard key={theme.mode} selected={mode === theme.mode} onClick={() => setThemeMode(theme.mode)}>
              {theme.preview}
              <div className="px-1 pb-1">
                <p className="m-0 text-[13.5px] font-semibold text-slate-800 dark:text-foreground">{theme.label}</p>
                <p className="m-0 text-[12px] text-slate-500 dark:text-muted-foreground">{theme.hint}</p>
              </div>
              {mode === theme.mode && <SelectedMark />}
            </ChoiceCard>
          ))}
        </div>
      </SettingsCard>

      <SettingsCard
        icon={<Languages className="h-[17px] w-[17px]" />}
        title={t("settings.appearance.language_title", "Langue")}
        description={t("settings.appearance.language_desc", "Langue d'affichage de l'interface.")}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {LANGUAGES.map((lang) => {
            const selected = currentLanguage === lang.code;
            return (
              <ChoiceCard key={lang.code} selected={selected} onClick={() => changeLanguage(lang.code)}>
                <div className="flex items-center gap-3 px-1.5 py-1">
                  <img src={lang.flag} alt="" className="h-7 w-7 rounded-full object-cover ring-1 ring-slate-200" />
                  <span className="text-[13.5px] font-semibold text-slate-800 dark:text-foreground">{lang.label}</span>
                </div>
                {selected && <SelectedMark />}
              </ChoiceCard>
            );
          })}
        </div>
      </SettingsCard>
    </div>
  );
}
