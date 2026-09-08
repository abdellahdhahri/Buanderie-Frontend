import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import frTranslation from "./locales/fr/translation.json";
import enTranslation from "./locales/en/translation.json";
import arTranslation from "./locales/ar/translation.json";

const resources = {
  fr: {
    translation: frTranslation,
  },
  en: {
    translation: enTranslation,
  },
  ar: {
    translation: arTranslation,
  },
};

export const languageDirections = {
  fr: "ltr",
  en: "ltr",
  ar: "rtl",
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,

    fallbackLng: "fr",

    supportedLngs: ["fr", "en", "ar"],

    // Important : transforme en-US -> en, fr-FR -> fr
    load: "languageOnly",

    detection: {
      order: ["localStorage", "navigator"],

      lookupLocalStorage: "i18nextLng",

      caches: ["localStorage"],
    },

    interpolation: {
      escapeValue: false,
    },

    react: {
      useSuspense: false,
    },

    debug: true,
  });

export default i18n;