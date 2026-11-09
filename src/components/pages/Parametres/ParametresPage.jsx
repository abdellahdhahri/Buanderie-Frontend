import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  UserRound, ShieldCheck, Palette, Bell, Building2, ScanLine, Tags, Mic, SlidersHorizontal, Plug,
  Moon, Sun, LogOut, ArrowLeft, ChevronDown, CheckCircle2, Workflow,
} from "lucide-react";
import { useAuth } from "../../../constants/AuthContext";
import { NAV_ITEMS } from "../../../constants/navigation";
import { isAdministrateur } from "../../../utils/privileges";
import { isDarkTheme, setDarkTheme, onThemeChange } from "../../../utils/theme";
import { ProfileSection } from "./components/ProfileSection";
import { SecuritySection } from "./components/SecuritySection";
import { AppearanceSection } from "./components/AppearanceSection";
import { NotificationsSection } from "./components/NotificationsSection";
import { EstablishmentSection } from "./components/EstablishmentSection";
import { ScanSection } from "./components/ScanSection";
import { LabelsSection } from "./components/LabelsSection";
import { VoiceSection } from "./components/VoiceSection";
import { PreferencesSection } from "./components/PreferencesSection";
import { IntegrationSection } from "./components/IntegrationSection";
import { ParcoursSection } from "./components/ParcoursSection";
import "./Parametres.css";

const TABS = [
  { id: "profil", Icon: UserRound, key: "settings.tabs.profile", fallback: "Profil", hintKey: "settings.tabs.profile_hint", hint: "Vos informations", Component: ProfileSection },
  { id: "securite", Icon: ShieldCheck, key: "settings.tabs.security", fallback: "Sécurité", hintKey: "settings.tabs.security_hint", hint: "Mot de passe et session", Component: SecuritySection },
  { id: "apparence", Icon: Palette, key: "settings.tabs.appearance", fallback: "Apparence", hintKey: "settings.tabs.appearance_hint", hint: "Thème et langue", Component: AppearanceSection },
  { id: "preferences", Icon: SlidersHorizontal, key: "settings.tabs.preferences", fallback: "Préférences", hintKey: "settings.tabs.preferences_hint", hint: "Affichage, seuils, catégories", Component: PreferencesSection },
  { id: "scan", Icon: ScanLine, key: "settings.tabs.scan", fallback: "Lecture / Scan", hintKey: "settings.tabs.scan_hint", hint: "Code-barres ou RFID", Component: ScanSection },
  { id: "voix", Icon: Mic, key: "settings.tabs.voice", fallback: "Assistant vocal", hintKey: "settings.tabs.voice_hint", hint: "Langue, vitesse, répétition", Component: VoiceSection },
  { id: "etiquettes", Icon: Tags, key: "settings.tabs.labels", fallback: "Étiquettes", hintKey: "settings.tabs.labels_hint", hint: "Contenu et format", Component: LabelsSection },
  { id: "notifications", Icon: Bell, key: "settings.tabs.notifications", fallback: "Notifications", hintKey: "settings.tabs.notifications_hint", hint: "Alertes et préférences", Component: NotificationsSection },
  { id: "etablissement", Icon: Building2, key: "settings.tabs.establishment", fallback: "Établissement", hintKey: "settings.tabs.establishment_hint", hint: "Identité, logo, couleur", Component: EstablishmentSection, adminOnly: true },
  { id: "parcours", Icon: Workflow, key: "settings.tabs.workflow", fallback: "Parcours du linge", hintKey: "settings.tabs.workflow_hint", hint: "Étapes actives et enchaînements", Component: ParcoursSection, adminOnly: true },
  { id: "integration", Icon: Plug, key: "settings.tabs.integration", fallback: "Intégration", hintKey: "settings.tabs.integration_hint", hint: "Services, personnel, linges, machines", Component: IntegrationSection, adminOnly: true },
];

const initiales = (nom = "") => {
  const parts = nom.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
};

function Section({ tab, open, mounted, onToggle, t }) {
  const Contenu = tab.Component;
  return (
    <section className="aje-card" id={`param-${tab.id}`}>
      <button type="button" className="aje-card__head" onClick={() => onToggle(tab.id)} aria-expanded={open}>
        <div className="aje-card__head-content">
          <span className="aje-card__badge" aria-hidden="true"><tab.Icon size={22} strokeWidth={2} /></span>
          <div className="aje-card__titles">
            <h3 className="aje-card__title">
              {t(tab.key, tab.fallback)}
              {tab.adminOnly && <span className="aje-card__tag">{t("settings.profile.admin", "Administrateur")}</span>}
            </h3>
            <p className="aje-card__subtitle">{t(tab.hintKey, tab.hint)}</p>
          </div>
        </div>
        <ChevronDown className={`aje-chevron ${open ? "is-open" : ""}`} size={18} strokeWidth={2.5} />
      </button>
      <div className="aje-card__body" hidden={!open}>
        {mounted && <Contenu />}
      </div>
    </section>
  );
}

export default function ParametresPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { admin, privileges = [], agent, loginUser, logout } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [sombre, setSombre] = useState(isDarkTheme);

  const estAdmin = admin || isAdministrateur(privileges, NAV_ITEMS);
  const tabs = TABS.filter((tab) => !tab.adminOnly || estAdmin);
  const initial = tabs.find((tab) => tab.id === searchParams.get("tab"))?.id ?? tabs[0].id;

  const [ouverts, setOuverts] = useState(() => ({ [initial]: true }));
  const [montes, setMontes] = useState(() => ({ [initial]: true }));

  useEffect(() => onThemeChange((dark) => setSombre(dark)), []);

  useEffect(() => {
    if (initial === tabs[0].id) return undefined;
    const id = setTimeout(() => document.getElementById(`param-${initial}`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    return () => clearTimeout(id);
  }, []);

  const ouvrir = (id, valeur) => {
    setOuverts((s) => ({ ...s, [id]: valeur }));
    if (valeur) setMontes((s) => ({ ...s, [id]: true }));
  };

  const basculer = (id) => ouvrir(id, !ouverts[id]);

  const allerA = (id) => {
    ouvrir(id, true);
    setSearchParams({ tab: id }, { replace: true });
    setTimeout(() => document.getElementById(`param-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 30);
  };

  const toutFerme = tabs.every((tab) => !ouverts[tab.id]);
  const toutBasculer = () => {
    const valeur = toutFerme;
    setOuverts(Object.fromEntries(tabs.map((tab) => [tab.id, valeur])));
    if (valeur) setMontes(Object.fromEntries(tabs.map((tab) => [tab.id, true])));
  };

  const nomComplet = agent?.nomPrenom || [agent?.prenom, agent?.nom].filter(Boolean).join(" ") || loginUser || t("settings.profile.user", "Utilisateur");
  const role = agent?.poste || agent?.fonction || t("settings.profile.account", "Compte utilisateur");

  const seDeconnecter = () => {
    logout();
    navigate("/process");
  };

  return (
    <div className="aje-page param-page">
      <header className="aje-header">
        <div className="aje-header__top">
          <button type="button" className="aje-back" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} /> {t("common.back", "Retour")}
          </button>
          <span className="aje-header__crumb">{t("settings.title", "Paramètres")}</span>
          <div className="aje-header__actions">
            <button type="button" className="aje-btn" onClick={() => setDarkTheme(!sombre)}>
              {sombre ? <Sun size={15} /> : <Moon size={15} />}
              {sombre ? t("settings.appearance.light", "Clair") : t("settings.appearance.dark", "Sombre")}
            </button>
            <button type="button" className="aje-btn" onClick={toutBasculer}>
              {toutFerme ? t("settings.open_all", "Tout ouvrir") : t("settings.close_all", "Tout fermer")}
            </button>
          </div>
        </div>

        <div className="aje-header__main">
          <div className="aje-header__avatar">{initiales(nomComplet)}</div>
          <div className="aje-header__title">
            <h2>{nomComplet}</h2>
            <p>{t("settings.subtitle", "Gérez votre compte, votre sécurité et vos préférences.")}</p>
            <div className="aje-header__chips">
              <span className={`aje-chip ${admin ? "aje-chip--soon" : ""}`}>
                {admin
                  ? t("settings.profile.admin", "Administrateur")
                  : t("settings.profile.privileges", "{{count}} droits d'accès", { count: privileges.length })}
              </span>
              <span className="aje-chip aje-chip--off">{role}</span>
              {loginUser && <span className="aje-chip aje-chip--off">{loginUser}</span>}
            </div>
          </div>
        </div>
      </header>

      <div className="aje-navwrap">
        <nav className="aje-header__nav" aria-label={t("settings.title", "Paramètres")}>
          {tabs.map((tab) => (
            <button key={tab.id} type="button" className={`aje-navlink ${ouverts[tab.id] ? "is-open" : ""}`} onClick={() => allerA(tab.id)}>
              {t(tab.key, tab.fallback)}
            </button>
          ))}
        </nav>
      </div>

      {tabs.map((tab) => (
        <Section key={tab.id} tab={tab} open={!!ouverts[tab.id]} mounted={!!montes[tab.id]} onToggle={basculer} t={t} />
      ))}

      <footer className="aje-footer">
        <span className="aje-footer__note">
          <CheckCircle2 size={16} />
          {t("settings.autosave", "Les réglages sont enregistrés automatiquement.")}
        </span>
        <button type="button" className="aje-btn" onClick={() => navigate(-1)}>{t("common.back", "Retour")}</button>
        <button type="button" className="aje-btn aje-btn--danger" onClick={seDeconnecter}>
          <LogOut size={15} />
          {t("settings.security.logout", "Se déconnecter")}
        </button>
      </footer>
    </div>
  );
}
