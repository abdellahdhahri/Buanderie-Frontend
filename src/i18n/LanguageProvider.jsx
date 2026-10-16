import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { useTranslation } from "react-i18next";
import { languageDirections } from "./index";

const LanguageContext = createContext();

export const useLanguage = () => useContext(LanguageContext);

export function LanguageProvider({ children }) {
  const { i18n } = useTranslation();

  const [currentLanguage, setCurrentLanguage] = useState(
    localStorage.getItem("i18nextLng")?.split("-")[0] ||
    i18n.resolvedLanguage ||
    "fr"
  );

  useEffect(() => {
    const updateLanguage = (language) => {
      const lang = language?.split("-")[0] || "fr";

      setCurrentLanguage(lang);

      document.documentElement.lang = lang;
      document.documentElement.dir =
        languageDirections[lang] || "ltr";
    };

    updateLanguage(
      localStorage.getItem("i18nextLng") ||
      i18n.resolvedLanguage ||
      i18n.language ||
      "fr"
    );

    const handleLanguageChanged = (language) => {
      updateLanguage(language);
    };

    i18n.on("languageChanged", handleLanguageChanged);

    return () => {
      i18n.off("languageChanged", handleLanguageChanged);
    };
  }, [i18n]);

  // Fonction utilisée par LanguageSwitcher
  const changeLanguage = (langCode) => {
    localStorage.setItem("i18nextLng", langCode);

    document.documentElement.lang = langCode;
    document.documentElement.dir =
      languageDirections[langCode] || "ltr";

    setCurrentLanguage(langCode);

    // Rechargement complet de l'application
    window.location.reload();
  };

  const value = {
    currentLanguage,
    changeLanguage,
    isRTL: currentLanguage === "ar",

    languages: [
      {
        code: "fr",
        label: "Français",
      },
      {
        code: "en",
        label: "English",
      },
      {
        code: "ar",
        label: "العربية",
      },
    ],
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}