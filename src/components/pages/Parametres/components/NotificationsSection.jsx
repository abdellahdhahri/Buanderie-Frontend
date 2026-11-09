import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { BellRing, Tags } from "lucide-react";
import { SettingsCard, SettingRow, Toggle } from "./SettingsUI";

const STORAGE_KEY = "settings.notifications";

const DEFAULTS = {
  popup: true,
  sound: false,
  reclamation: true,
  finDeVie: true,
  stockUniforme: true,
};

const readPrefs = () => {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") };
  } catch {
    return DEFAULTS;
  }
};

export function NotificationsSection() {
  const { t } = useTranslation();
  const [prefs, setPrefs] = useState(readPrefs);

  const update = (key) => (value) => {
    setPrefs((prev) => {
      const next = { ...prev, [key]: value };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { return; }
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <SettingsCard
        icon={<BellRing className="h-[17px] w-[17px]" />}
        title={t("settings.notifications.display_title", "Affichage")}
        description={t("settings.notifications.display_desc", "Comment les nouvelles notifications vous sont présentées.")}
      >
        <SettingRow
          label={t("settings.notifications.popup", "Popup en temps réel")}
          hint={t("settings.notifications.popup_hint", "Affiche une alerte en haut de l'écran à chaque réception.")}
        >
          <Toggle checked={prefs.popup} onChange={update("popup")} label={t("settings.notifications.popup", "Popup en temps réel")} />
        </SettingRow>
        <SettingRow
          label={t("settings.notifications.sound", "Son")}
          hint={t("settings.notifications.sound_hint", "Joue un signal sonore discret.")}
        >
          <Toggle checked={prefs.sound} onChange={update("sound")} label={t("settings.notifications.sound", "Son")} />
        </SettingRow>
      </SettingsCard>

      <SettingsCard
        icon={<Tags className="h-[17px] w-[17px]" />}
        title={t("settings.notifications.types_title", "Types de notifications")}
        description={t("settings.notifications.types_desc", "Choisissez les événements pour lesquels être alerté.")}
      >
        <SettingRow
          label={t("settings.notifications.reclamation", "Réclamations")}
          hint={t("settings.notifications.reclamation_hint", "Nouvelle réclamation ou changement de statut.")}
        >
          <Toggle checked={prefs.reclamation} onChange={update("reclamation")} label={t("settings.notifications.reclamation", "Réclamations")} />
        </SettingRow>
        <SettingRow
          label={t("settings.notifications.fin_de_vie", "Fin de vie des linges")}
          hint={t("settings.notifications.fin_de_vie_hint", "Linge arrivé au terme de son nombre de cycles.")}
        >
          <Toggle checked={prefs.finDeVie} onChange={update("finDeVie")} label={t("settings.notifications.fin_de_vie", "Fin de vie des linges")} />
        </SettingRow>
        <SettingRow
          label={t("settings.notifications.stock_uniforme", "Stock d'uniformes")}
          hint={t("settings.notifications.stock_uniforme_hint", "Uniforme disponible ou stock bas.")}
        >
          <Toggle checked={prefs.stockUniforme} onChange={update("stockUniforme")} label={t("settings.notifications.stock_uniforme", "Stock d'uniformes")} />
        </SettingRow>
      </SettingsCard>
    </div>
  );
}
