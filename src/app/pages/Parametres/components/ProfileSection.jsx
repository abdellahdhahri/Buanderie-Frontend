import React from "react";
import { useTranslation } from "react-i18next";
import { UserRound, ShieldCheck, Info } from "lucide-react";
import { useAuth } from "../../../contextes/Authentication/AuthContext";
import { SettingsCard } from "./SettingsUI";

const initialsOf = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
};

function InfoField({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3 dark:border-border dark:bg-white/5">
      <p className="m-0 text-[11.5px] font-medium text-slate-500 dark:text-muted-foreground">{label}</p>
      <p className="m-0 mt-0.5 truncate text-[13.5px] font-semibold text-slate-800 dark:text-foreground">
        {value || "—"}
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PROFIL — informations du compte (lecture seule)
   ═══════════════════════════════════════════════════════════════════════════ */
export function ProfileSection() {
  const { t } = useTranslation();
  const { agent, loginUser, admin, privileges } = useAuth();
  const fullName = agent?.nomPrenom || [agent?.prenom, agent?.nom].filter(Boolean).join(" ") || loginUser || t("settings.profile.user", "Utilisateur");

  return (
    <div className="flex flex-col gap-5">
      {/* Carte identité */}
      <div className="relative overflow-hidden rounded-[20px] border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)] dark:border-border dark:bg-card">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-teal-50 via-cyan-50 to-transparent dark:from-teal-500/10 dark:via-cyan-500/5"
        />
        <div className="relative flex flex-wrap items-center gap-5">
          <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-teal-700 text-2xl font-semibold text-white shadow-[0_8px_20px_-6px_rgba(13,148,136,0.55)] ring-4 ring-white dark:ring-card">
            {initialsOf(fullName)}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="m-0 truncate text-xl font-semibold tracking-[-0.01em] text-slate-900 dark:text-foreground">
              {fullName}
            </h2>
            <p className="m-0 mt-0.5 text-[13px] text-slate-500 dark:text-muted-foreground">
              {agent?.poste || agent?.fonction || t("settings.profile.account", "Compte utilisateur")}
            </p>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold ring-1 ring-inset ${
              admin
                ? "bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-500/30"
                : "bg-teal-50 text-teal-700 ring-teal-200 dark:bg-teal-500/10 dark:text-teal-300 dark:ring-teal-500/30"
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            {admin
              ? t("settings.profile.admin", "Administrateur")
              : t("settings.profile.privileges", "{{count}} droits d'accès", { count: privileges.length })}
          </span>
        </div>
      </div>

      <SettingsCard
        icon={<UserRound className="h-[17px] w-[17px]" />}
        title={t("settings.profile.info_title", "Informations du compte")}
        description={t("settings.profile.info_desc", "Données issues de votre compte, en lecture seule.")}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <InfoField label={t("settings.profile.login", "Identifiant")} value={loginUser} />
          <InfoField label={t("settings.profile.matricule", "Matricule")} value={agent?.matricule} />
          <InfoField label={t("settings.profile.badge", "Code badge")} value={agent?.codeBarre} />
          <InfoField label={t("settings.profile.email", "E-mail")} value={agent?.email} />
          <InfoField label={t("settings.profile.service", "Service")} value={agent?.service || agent?.serviceNom} />
          <InfoField label={t("settings.profile.position", "Poste")} value={agent?.poste || agent?.fonction} />
        </div>
        <p className="m-0 mt-4 flex items-center gap-2 text-[12.5px] text-slate-500 dark:text-muted-foreground">
          <Info className="h-3.5 w-3.5 shrink-0" />
          {t("settings.profile.contact_admin", "Pour modifier ces informations, contactez votre administrateur.")}
        </p>
      </SettingsCard>
    </div>
  );
}
