import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Mic, Play, RotateCcw, Square, Sparkles } from "lucide-react";
import { SettingsCard, SettingRow, Toggle } from "./SettingsUI";
import { Segmented, Slider, GhostButton } from "./SettingsControls";
import { useSetting, setSetting, resetSettings } from "../../../../utils/appSettings";
import { MESSAGES } from "../../../../constants/voiceMessages";
import { hasSpeech, loadVoices, voicesFor, voiceQuality, speakOnce } from "../../../../utils/voiceEngine";

function useVoices() {
  const [voices, setVoices] = useState(() => (hasSpeech() ? window.speechSynthesis.getVoices() : []));
  useEffect(() => {
    if (!hasSpeech()) return undefined;
    const update = () => setVoices(window.speechSynthesis.getVoices());
    loadVoices().then(update);
    window.speechSynthesis.addEventListener?.("voiceschanged", update);
    return () => window.speechSynthesis.removeEventListener?.("voiceschanged", update);
  }, []);
  return voices;
}

export function VoiceSection() {
  const { t } = useTranslation();
  const enabled = useSetting("voice.enabled");
  const lang = useSetting("voice.lang");
  const rate = useSetting("voice.rate");
  const repeat = useSetting("voice.repeatSeconds");
  const voiceKey = lang === "ar" ? "voice.voiceAr" : "voice.voiceFr";
  const voiceName = useSetting(voiceKey);

  const allVoices = useVoices();
  const voices = voicesFor(lang, allVoices);
  const hasNatural = voices.some((v) => voiceQuality(v) >= 3);
  const [playing, setPlaying] = useState(false);

  const tester = async () => {
    if (!hasSpeech()) return;
    if (playing) { window.speechSynthesis.cancel(); setPlaying(false); return; }
    const M = MESSAGES[lang] || MESSAGES.fr;
    const text = `${M.bienvenue(t("settings.voice.test_name", "Agent"))} ${M.chambre_identifiee("CH-104", 2, 7)}`;
    setPlaying(true);
    await speakOnce(text, lang, { rate, voiceName });
    const watch = setInterval(() => {
      if (!window.speechSynthesis.speaking && !window.speechSynthesis.pending) { setPlaying(false); clearInterval(watch); }
    }, 300);
  };

  const qualityLabel = (v) =>
    voiceQuality(v) >= 3
      ? t("settings.voice.quality_natural", "naturelle")
      : t("settings.voice.quality_standard", "standard");

  return (
    <div className="flex flex-col gap-5">
      <SettingsCard
        icon={<Mic className="h-[17px] w-[17px]" />}
        title={t("settings.voice.title", "Assistant vocal")}
        description={t("settings.voice.desc", "Réglages par défaut des écrans de collecte, de distribution et de lavage. Chaque écran garde son bouton pour couper le son ou changer de langue.")}
        footer={
          <>
            <span className="mr-auto">
              <GhostButton onClick={() => resetSettings("voice")}>
                <RotateCcw className="h-4 w-4" /> {t("settings.reset_section", "Valeurs par défaut")}
              </GhostButton>
            </span>
            <button
              type="button"
              onClick={tester}
              className="inline-flex items-center gap-2 rounded-[10px] bg-teal-600 px-4 py-2 text-[13px] font-semibold text-white shadow-sm hover:bg-teal-700"
            >
              {playing ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {playing ? t("settings.voice.stop", "Arrêter") : t("settings.voice.test", "Écouter un exemple")}
            </button>
          </>
        }
      >
        <SettingRow
          label={t("settings.voice.enabled", "Activé à l'ouverture des écrans")}
          hint={t("settings.voice.enabled_hint", "Désactivé : les écrans s'ouvrent en mode muet.")}
        >
          <Toggle checked={!!enabled} onChange={(v) => setSetting("voice.enabled", v)} label={t("settings.voice.enabled", "Activé")} />
        </SettingRow>
        <SettingRow label={t("settings.voice.lang", "Langue par défaut")}>
          <Segmented
            value={lang}
            onChange={(v) => setSetting("voice.lang", v)}
            options={[{ value: "fr", label: "Français" }, { value: "ar", label: "العربية" }]}
          />
        </SettingRow>
        <SettingRow
          label={t("settings.voice.voice", "Voix")}
          hint={
            !voices.length
              ? t("settings.voice.no_voice", "Aucune voix installée pour cette langue sur ce poste.")
              : hasNatural
                ? t("settings.voice.voice_hint", "« Automatique » choisit la voix la plus claire disponible.")
                : t("settings.voice.edge_hint", "Seules des voix standard sont disponibles. Pour une voix naturelle, plus claire (surtout en arabe), ouvrez l'application dans Microsoft Edge.")
          }
        >
          <select
            value={voiceName || ""}
            onChange={(e) => setSetting(voiceKey, e.target.value)}
            disabled={!voices.length}
            className="h-9 max-w-[260px] rounded-[10px] border border-slate-200 bg-white px-2.5 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/30 disabled:opacity-50"
          >
            <option value="">{t("settings.voice.auto", "Automatique")}{voices[0] ? ` — ${voices[0].name}` : ""}</option>
            {voices.map((v) => (
              <option key={v.name} value={v.name}>
                {v.name} ({v.lang}) · {qualityLabel(v)}
              </option>
            ))}
          </select>
          {hasNatural && (
            <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-700">
              <Sparkles className="h-3 w-3" /> {t("settings.voice.quality_natural", "naturelle")}
            </span>
          )}
        </SettingRow>
        <SettingRow
          label={t("settings.voice.rate", "Vitesse de la voix")}
          hint={lang === "ar" ? t("settings.voice.rate_hint_ar", "La voix arabe est déjà légèrement ralentie pour être plus claire.") : undefined}
        >
          <Slider
            value={Number(rate) || 1}
            min={0.7}
            max={1.3}
            step={0.05}
            onChange={(v) => setSetting("voice.rate", v)}
            format={(v) => `× ${v.toFixed(2)}`}
            ariaLabel={t("settings.voice.rate", "Vitesse")}
          />
        </SettingRow>
        <SettingRow
          label={t("settings.voice.repeat", "Répéter la consigne")}
          hint={t("settings.voice.repeat_hint", "Si l'agent ne fait rien, l'assistant répète la dernière consigne.")}
        >
          <Segmented
            value={repeat}
            onChange={(v) => setSetting("voice.repeatSeconds", Number(v))}
            options={[
              { value: 0, label: t("settings.never", "Jamais") },
              { value: 10, label: "10 s" },
              { value: 20, label: "20 s" },
              { value: 30, label: "30 s" },
              { value: 60, label: "1 min" },
            ]}
          />
        </SettingRow>
      </SettingsCard>
    </div>
  );
}
