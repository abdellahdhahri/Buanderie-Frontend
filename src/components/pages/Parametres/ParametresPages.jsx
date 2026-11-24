import React from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  Settings, ChevronRight, ShieldCheck, Palette, Bell, ScanLine, Tags, Mic, SlidersHorizontal, UserRound, Building2, Plug, Workflow, Timer,
} from "lucide-react";
import { Page, PageHeader } from "../../kit";
import { ProfileSection } from "./components/ProfileSection";
import { SecuritySection } from "./components/SecuritySection";
import { AppearanceSection } from "./components/AppearanceSection";
import { NotificationsSection } from "./components/NotificationsSection";
import { ScanSection } from "./components/ScanSection";
import { LabelsSection } from "./components/LabelsSection";
import { VoiceSection } from "./components/VoiceSection";
import { PreferencesSection } from "./components/PreferencesSection";
import { EstablishmentSection } from "./components/EstablishmentSection";
import { IntegrationSection } from "./components/IntegrationSection";
import { ParcoursSection } from "./components/ParcoursSection";
import SeuilsBlocage from "../LingesBloques/SeuilsBlocage";
import "./Parametres.css";

export const PAGES_PARAMETRES = [
  { path: "profil", groupe: "compte", Icon: UserRound, key: "settings.tabs.profile", fallback: "Profil", hintKey: "settings.tabs.profile_hint", hint: "Vos informations", Component: ProfileSection },
  { path: "securite", groupe: "compte", Icon: ShieldCheck, key: "settings.tabs.security", fallback: "Sécurité", hintKey: "settings.tabs.security_hint", hint: "Mot de passe et session", Component: SecuritySection },
  { path: "apparence", groupe: "compte", Icon: Palette, key: "settings.tabs.appearance", fallback: "Apparence", hintKey: "settings.tabs.appearance_hint", hint: "Thème et langue", Component: AppearanceSection },
  { path: "preferences", groupe: "compte", Icon: SlidersHorizontal, key: "settings.tabs.preferences", fallback: "Préférences", hintKey: "settings.tabs.preferences_hint", hint: "Affichage, seuils, catégories", Component: PreferencesSection },
  { path: "scan", groupe: "compte", Icon: ScanLine, key: "settings.tabs.scan", fallback: "Lecture / Scan", hintKey: "settings.tabs.scan_hint", hint: "Code-barres ou RFID", Component: ScanSection },
  { path: "voix", groupe: "compte", Icon: Mic, key: "settings.tabs.voice", fallback: "Assistant vocal", hintKey: "settings.tabs.voice_hint", hint: "Langue, vitesse, répétition", Component: VoiceSection },
  { path: "etiquettes", groupe: "compte", Icon: Tags, key: "settings.tabs.labels", fallback: "Étiquettes", hintKey: "settings.tabs.labels_hint", hint: "Contenu et format", Component: LabelsSection },
  { path: "notifications", groupe: "compte", Icon: Bell, key: "settings.tabs.notifications", fallback: "Notifications", hintKey: "settings.tabs.notifications_hint", hint: "Alertes et préférences", Component: NotificationsSection },
  { path: "etablissement", groupe: "admin", Icon: Building2, key: "settings.tabs.establishment", fallback: "Établissement", hintKey: "settings.tabs.establishment_hint", hint: "Identité, logo, couleur", Component: EstablishmentSection },
  { path: "integration", groupe: "admin", Icon: Plug, key: "settings.tabs.integration", fallback: "Intégration", hintKey: "settings.tabs.integration_hint", hint: "Services, personnel, linges, machines", Component: IntegrationSection },
  { path: "parcours", groupe: "admin", Icon: Workflow, key: "settings.tabs.workflow", fallback: "Parcours du linge", hintKey: "settings.tabs.workflow_hint", hint: "Étapes actives et enchaînements", Component: ParcoursSection },
  { path: "seuils-blocage", groupe: "admin", Icon: Timer, key: "settings.tabs.blocked_linens", fallback: "Linges bloqués", hintKey: "settings.tabs.blocked_linens_hint", hint: "Durée max autorisée par état du circuit", Component: SeuilsBlocage },
];

const GROUPES = [
  { id: "compte", key: "settings.hub.account", fallback: "Compte et poste de travail", hintKey: "settings.hub.account_hint", hint: "Votre profil, votre sécurité et vos préférences d'utilisation" },
  { id: "admin", key: "settings.hub.admin", fallback: "Établissement et administration", hintKey: "settings.hub.admin_hint", hint: "Identité, intégration, parcours du linge et seuils" },
];

export function HubParametres() {
  const { t } = useTranslation();
  return (
    <Page>
      <PageHeader
        icon={Settings}
        title={t("settings.title", "Paramètres")}
        subtitle={t("settings.hub.subtitle", "Choisissez la rubrique à configurer.")}
        total={PAGES_PARAMETRES.length}
      />
      {GROUPES.map((g) => (
        <section key={g.id} className="param-hub__group">
          <header className="param-hub__head">
            <h3>{t(g.key, g.fallback)}</h3>
            <p>{t(g.hintKey, g.hint)}</p>
          </header>
          <div className="param-hub__grid">
            {PAGES_PARAMETRES.filter((p) => p.groupe === g.id).map((p) => (
              <Link key={p.path} to={`/parametres/${p.path}`} className="param-hub__card">
                <span className="param-hub__icon"><p.Icon size={22} /></span>
                <span className="param-hub__text">
                  <strong>{t(p.key, p.fallback)}</strong>
                  <small>{t(p.hintKey, p.hint)}</small>
                </span>
                <ChevronRight size={18} className="param-hub__arrow" />
              </Link>
            ))}
          </div>
        </section>
      ))}
    </Page>
  );
}

export function PageParametres({ page }) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const Contenu = page.Component;
  return (
    <Page>
      <PageHeader
        icon={page.Icon}
        title={t(page.key, page.fallback)}
        subtitle={t(page.hintKey, page.hint)}
        onBack={() => navigate("/parametres")}
      />
      <div className="param-page param-page--flat">
        <div className="param-flat__body" key={pathname}>
          <Contenu />
        </div>
      </div>
    </Page>
  );
}
