import React from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { UserRound, ShieldCheck, Palette, Bell, Building2, ChevronRight, ScanLine, Tags, Mic, SlidersHorizontal } from "lucide-react";
import { useAuth } from "../../contextes/Authentication/AuthContext";
import { PageHeaderIcon } from "../../components/layout/PageHeaderIcon";
import { IconSettings } from "../../components/layout/sidebarIcons";
import { ProfileSection } from "./components/ProfileSection";
import { SecuritySection } from "./components/SecuritySection";
import { AppearanceSection } from "./components/AppearanceSection";
import { NotificationsSection } from "./components/NotificationsSection";
import { EstablishmentSection } from "./components/EstablishmentSection";
import { ScanSection } from "./components/ScanSection";
import { LabelsSection } from "./components/LabelsSection";
import { VoiceSection } from "./components/VoiceSection";
import { PreferencesSection } from "./components/PreferencesSection";

// Onglets : l'identifiant est aussi celui utilisé dans l'URL (?tab=…)
const TABS = [
  { id: "profil", Icon: UserRound, key: "settings.tabs.profile", fallback: "Profil", hintKey: "settings.tabs.profile_hint", hint: "Vos informations", Component: ProfileSection },
  { id: "securite", Icon: ShieldCheck, key: "settings.tabs.security", fallback: "Sécurité", hintKey: "settings.tabs.security_hint", hint: "Mot de passe et session", Component: SecuritySection },
  { id: "apparence", Icon: Palette, key: "settings.tabs.appearance", fallback: "Apparence", hintKey: "settings.tabs.appearance_hint", hint: "Thème et langue", Component: AppearanceSection },
  { id: "preferences", Icon: SlidersHorizontal, key: "settings.tabs.preferences", fallback: "Préférences", hintKey: "settings.tabs.preferences_hint", hint: "Affichage, seuils, catégories", Component: PreferencesSection },
  { id: "scan", Icon: ScanLine, key: "settings.tabs.scan", fallback: "Lecture / Scan", hintKey: "settings.tabs.scan_hint", hint: "Code-barres ou RFID", Component: ScanSection },
  { id: "voix", Icon: Mic, key: "settings.tabs.voice", fallback: "Assistant vocal", hintKey: "settings.tabs.voice_hint", hint: "Langue, vitesse, répétition", Component: VoiceSection },
  { id: "etiquettes", Icon: Tags, key: "settings.tabs.labels", fallback: "Étiquettes", hintKey: "settings.tabs.labels_hint", hint: "Contenu et format", Component: LabelsSection },
  { id: "notifications", Icon: Bell, key: "settings.tabs.notifications", fallback: "Notifications", hintKey: "settings.tabs.notifications_hint", hint: "Alertes et préférences", Component: NotificationsSection },
  // Paramètres généraux : réservé aux administrateurs
  { id: "etablissement", Icon: Building2, key: "settings.tabs.establishment", fallback: "Établissement", hintKey: "settings.tabs.establishment_hint", hint: "Nom et logo", Component: EstablishmentSection, adminOnly: true },
];

export default function ParametresPage() {
  const { t } = useTranslation();
  const { admin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabs = TABS.filter((tab) => !tab.adminOnly || admin);
  const active = tabs.find((tab) => tab.id === searchParams.get("tab")) ?? tabs[0];
  const ActiveSection = active.Component;

  const selectTab = (id) => setSearchParams({ tab: id }, { replace: true });

  return (
    <div >
      {/* ─── En-tête (même style que les autres pages) ─── */}
      <div style={{ marginBottom: "28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <PageHeaderIcon size={52} icon={<IconSettings />} />
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#0f172a", margin: 0 }} className="dark:!text-foreground">
              {t("settings.title", "Paramètres")}
            </h1>
            <p style={{ fontSize: "14px", color: "#64748b", margin: "2px 0 0 0" }}>
              {t("settings.subtitle", "Gérez votre compte, votre sécurité et vos préférences.")}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        {/* ─── Navigation des onglets ─── */}
        <nav
          aria-label={t("settings.title", "Paramètres")}
          className="flex gap-1.5 overflow-x-auto rounded-[20px] border border-slate-200 bg-white p-2 shadow-[0_1px_2px_rgba(15,23,42,0.04)] lg:sticky lg:top-[88px] lg:flex-col lg:overflow-visible dark:border-border dark:bg-card"
        >
          {tabs.map((tab) => {
            const selected = tab.id === active.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => selectTab(tab.id)}
                aria-current={selected ? "page" : undefined}
                className={`group relative flex shrink-0 cursor-pointer items-center gap-3 rounded-[14px] px-3 py-2.5 text-left transition-colors duration-150 lg:w-full ${
                  selected
                    ? "bg-teal-50 text-teal-800 dark:bg-teal-500/10 dark:text-teal-200"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-muted-foreground dark:hover:bg-white/5"
                }`}
              >
                {selected && (
                  <motion.span
                    layoutId="settings-tab-indicator"
                    className="absolute inset-y-2.5 left-0 hidden w-[3px] rounded-full bg-teal-600 lg:block"
                  />
                )}
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] transition-colors ${
                    selected
                      ? "bg-teal-600 text-white shadow-[0_4px_12px_-4px_rgba(13,148,136,0.6)]"
                      : "bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-teal-700 group-hover:shadow-sm dark:bg-white/5"
                  }`}
                >
                  <tab.Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13.5px] font-semibold">{t(tab.key, tab.fallback)}</span>
                  <span className="hidden truncate text-[12px] font-normal text-slate-500 lg:block dark:text-muted-foreground">
                    {t(tab.hintKey, tab.hint)}
                  </span>
                </span>
                <ChevronRight
                  className={`hidden h-4 w-4 shrink-0 transition-all lg:block ${
                    selected ? "translate-x-0 text-teal-600 opacity-100" : "-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-60"
                  }`}
                />
              </button>
            );
          })}
        </nav>

        {/* ─── Contenu de l'onglet ─── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <ActiveSection />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
