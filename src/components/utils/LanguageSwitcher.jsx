import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../../i18n/LanguageProvider";

import franceFlag from "../../assets/flags/france.png";
import englandFlag from "../../assets/flags/uk.png";
import tunisiaFlag from "../../assets/flags/tunisia.png";

const LANGUAGES = [
  { code: "fr", name: "Français", flag: franceFlag },
  { code: "en", name: "English", flag: englandFlag },
  { code: "ar", name: "العربية", flag: tunisiaFlag },
];

const GlobeIcon = ({ size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const CheckIcon = ({ size = 12, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export default function LanguageSwitcher() {
  const { currentLanguage, changeLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentLang =
    LANGUAGES.find((lang) => lang.code === currentLanguage) || LANGUAGES[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLanguageChange = async (langCode) => {
    setIsOpen(false);
    if (langCode === currentLanguage) return;
    try {
      await changeLanguage(langCode);
    } catch (error) {
      console.error("Erreur lors du changement de langue :", error);
    }
  };

  return (
    <div ref={dropdownRef} className="lang-switch">
      <motion.button
        type="button"
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Changer la langue"
        aria-expanded={isOpen}
        className={`lang-btn ${isOpen ? "lang-btn--open" : ""}`}
      >
        <span className="lang-btn__flag">
          <img src={currentLang.flag} alt={currentLang.name} />
        </span>
        <span className="lang-btn__code">{currentLang.code.toUpperCase()}</span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="lang-dropdown"
          >
            <div className="lang-dropdown__header">
              <div className="lang-dropdown__header-icon">
                <GlobeIcon size={16} color="white" />
              </div>
              <div>
                <div className="lang-dropdown__title">Langue</div>
                <div className="lang-dropdown__subtitle">Choisir la langue de l'interface</div>
              </div>
            </div>

            <div className="lang-dropdown__list">
              {LANGUAGES.map((lang, index) => {
                const isActive = currentLanguage === lang.code;
                return (
                  <motion.button
                    key={lang.code}
                    type="button"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.04 }}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`lang-item ${isActive ? "lang-item--active" : ""}`}
                  >
                    <span className="lang-item__flag">
                      <img src={lang.flag} alt={lang.name} />
                    </span>
                    <span className="lang-item__name">{lang.name}</span>
                    {isActive ? (
                      <span className="lang-item__check">
                        <CheckIcon size={11} color="white" />
                      </span>
                    ) : (
                      <span className="lang-item__code">{lang.code.toUpperCase()}</span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .lang-switch {
          position: relative;
          display: inline-flex;
        }

        .lang-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          height: 36px;
          padding: 0 12px 0 5px;
          border-radius: 999px;
          border: 1px solid var(--color-border, #e2e8f0);
          background: var(--color-surface, #ffffff);
          color: var(--color-muted, #64748b);
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s, color 0.2s, box-shadow 0.2s;
        }

        .lang-btn:hover,
        .lang-btn--open {
          border-color: #99f6e4;
          background: #f0fdfa;
          color: #0d9488;
          box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.08);
        }

        .lang-btn__flag {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          overflow: hidden;
          flex-shrink: 0;
          box-shadow: 0 0 0 2px #ffffff, 0 0 0 3px rgba(13, 148, 136, 0.35);
        }

        .lang-btn__flag img,
        .lang-item__flag img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .lang-btn__code {
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.06em;
        }

        .lang-dropdown {
          position: absolute;
          top: calc(100% + 12px);
          right: 0;
          width: 250px;
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          box-shadow:
            0 1px 3px rgba(15, 23, 42, 0.04),
            0 20px 40px rgba(15, 23, 42, 0.12);
          overflow: hidden;
          z-index: 9999;
        }

        .lang-dropdown__header {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 16px;
          border-bottom: 1px solid #f1f5f9;
          background: linear-gradient(180deg, #fafbfc 0%, #ffffff 100%);
        }

        .lang-dropdown__header-icon {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          background: linear-gradient(135deg, #0d9488, #14b8a6);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(13, 148, 136, 0.25);
          flex-shrink: 0;
        }

        .lang-dropdown__title {
          font-size: 13px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.01em;
        }

        .lang-dropdown__subtitle {
          font-size: 11px;
          font-weight: 500;
          color: #94a3b8;
          margin-top: 1px;
        }

        .lang-dropdown__list {
          padding: 8px;
        }

        .lang-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 9px 10px;
          margin-bottom: 2px;
          border: 1px solid transparent;
          border-radius: 10px;
          background: transparent;
          cursor: pointer;
          text-align: start;
          transition: background 0.2s, border-color 0.2s;
        }

        .lang-item:last-child {
          margin-bottom: 0;
        }

        .lang-item:hover {
          background: #f8fafc;
        }

        .lang-item--active,
        .lang-item--active:hover {
          background: #f0fdfa;
          border-color: #ccfbf1;
          cursor: default;
        }

        .lang-item__flag {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          overflow: hidden;
          flex-shrink: 0;
          box-shadow: 0 0 0 1px #e2e8f0, 0 2px 6px rgba(15, 23, 42, 0.08);
        }

        .lang-item__name {
          flex: 1;
          min-width: 0;
          font-size: 13px;
          font-weight: 600;
          color: #475569;
        }

        .lang-item--active .lang-item__name {
          color: #0d9488;
          font-weight: 700;
        }

        .lang-item__code {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.06em;
          color: #94a3b8;
          padding: 2px 6px;
          border-radius: 6px;
          background: #f1f5f9;
        }

        .lang-item__check {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #0d9488, #14b8a6);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 6px rgba(13, 148, 136, 0.3);
          flex-shrink: 0;
        }

        .dark .lang-btn {
          background: var(--dk-surface-2);
          border-color: var(--dk-border);
          color: var(--dk-text-2);
        }

        .dark .lang-btn:hover,
        .dark .lang-btn--open {
          background: rgba(45, 212, 191, 0.1);
          border-color: rgba(45, 212, 191, 0.35);
          color: #5eead4;
        }

        .dark .lang-btn__flag {
          box-shadow: 0 0 0 2px var(--dk-surface), 0 0 0 3px rgba(45, 212, 191, 0.4);
        }

        .dark .lang-dropdown {
          background: rgba(17, 26, 43, 0.98);
          border-color: var(--dk-border);
          box-shadow: 0 24px 48px -12px rgba(0, 0, 0, 0.6);
        }

        .dark .lang-dropdown__header {
          background: linear-gradient(180deg, rgba(45, 212, 191, 0.07), rgba(45, 212, 191, 0));
          border-bottom-color: var(--dk-border-soft);
        }

        .dark .lang-dropdown__title {
          color: var(--dk-text);
        }

        .dark .lang-dropdown__subtitle {
          color: var(--dk-muted);
        }

        .dark .lang-item:hover {
          background: var(--dk-surface-3);
        }

        .dark .lang-item__name {
          color: var(--dk-text-2);
        }

        .dark .lang-item--active,
        .dark .lang-item--active:hover {
          background: rgba(45, 212, 191, 0.1);
          border-color: rgba(45, 212, 191, 0.25);
        }

        .dark .lang-item--active .lang-item__name {
          color: #5eead4;
        }

        .dark .lang-item__flag {
          box-shadow: 0 0 0 1px var(--dk-border);
        }

        .dark .lang-item__code {
          background: var(--dk-surface-2);
          color: var(--dk-muted);
        }
      `}</style>
    </div>
  );
}
