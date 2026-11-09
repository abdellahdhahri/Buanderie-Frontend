import React from "react";
import { useTranslation } from "react-i18next";
import { UserRound, KeyRound, Info } from "lucide-react";
import { useAuth } from "../../../../constants/AuthContext";
import { SettingsCard, InfoField } from "./SettingsUI";

export function ProfileSection() {
  const { t } = useTranslation();
  const { agent, loginUser, admin, privileges = [] } = useAuth();

  return (
    <div className="param-stack">
      <SettingsCard
        icon={<UserRound size={15} />}
        title={t("settings.profile.info_title", "Informations du compte")}
        description={t("settings.profile.info_desc", "Données issues de votre compte, en lecture seule.")}
      >
        <div className="info-grid">
          <InfoField label={t("settings.profile.login", "Identifiant")} value={loginUser} />
          <InfoField label={t("settings.profile.matricule", "Matricule")} value={agent?.matricule} mono />
          <InfoField label={t("settings.profile.badge", "Code badge")} value={agent?.codeBarre} mono />
          <InfoField label={t("settings.profile.email", "E-mail")} value={agent?.email} />
          <InfoField label={t("settings.profile.service", "Service")} value={agent?.service || agent?.serviceNom} />
          <InfoField label={t("settings.profile.position", "Poste")} value={agent?.poste || agent?.fonction} />
        </div>
      </SettingsCard>

      <SettingsCard
        icon={<KeyRound size={15} />}
        title={t("settings.profile.access_title", "Accès")}
      >
        <div className="info-grid">
          <InfoField
            label={t("settings.profile.role", "Rôle")}
            value={admin ? t("settings.profile.admin", "Administrateur") : t("settings.profile.user", "Utilisateur")}
          />
          <InfoField
            label={t("settings.profile.rights", "Droits d'accès")}
            value={admin ? t("settings.profile.all_rights", "Tous les droits") : String(privileges.length)}
          />
        </div>
        <p className="param-note">
          <Info size={14} />
          {t("settings.profile.contact_admin", "Pour modifier ces informations, contactez votre administrateur.")}
        </p>
      </SettingsCard>
    </div>
  );
}
