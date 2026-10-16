
import React, { useState, useRef, useEffect } from "react";
import { useLanguage } from "../../../i18n/LanguageProvider";

import franceFlag from "../../../assets/flags/france.png";
import englandFlag from "../../../assets/flags/uk.png";
import tunisiaFlag from "../../../assets/flags/tunisia.png";

const LANGUAGES = [
  {
    code: "fr",
    name: "Français",
    nativeName: "Français",
    flag: franceFlag,
  },
  {
    code: "en",
    name: "English",
    nativeName: "English",
    flag: englandFlag,
  },
  {
    code: "ar",
    name: "العربية",
    nativeName: "العربية",
    flag: tunisiaFlag,
  },
];

export default function LanguageSwitcher() {
  const {
    currentLanguage,
    changeLanguage,
  } = useLanguage();

  const [isOpen, setIsOpen] = useState(false);

  const dropdownRef = useRef(null);

  const currentLang =
    LANGUAGES.find(
      (lang) => lang.code === currentLanguage
    ) || LANGUAGES[0];

 

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);



  const handleLanguageChange = async (langCode) => {
    if (langCode === currentLanguage) {
      setIsOpen(false);
      return;
    }

    try {
   
      await changeLanguage(langCode);

      setIsOpen(false);

      window.location.reload();
    } catch (error) {
      console.error(
        "Erreur lors du changement de langue :",
        error
      );
    }
  };

  return (
    <div
      ref={dropdownRef}
      style={{
        position: "relative",
        display: "inline-flex",
      }}
    >
   

      <button
        type="button"
        onClick={() =>
          setIsOpen((previous) => !previous)
        }
        aria-label="Changer la langue"
        aria-expanded={isOpen}
        style={{
          width: "44px",
          height: "44px",

          display: "flex",
          alignItems: "center",
          justifyContent: "center",

          padding: "0",

          borderRadius: "12px",

          background:
            "rgba(255,255,255,0.10)",

          border:
            "1px solid rgba(255,255,255,0.20)",

          cursor: "pointer",

          transition:
            "all 0.2s ease",

          boxShadow:
            isOpen
              ? "0 4px 15px rgba(0,0,0,0.15)"
              : "none",
        }}

        onMouseEnter={(e) => {
          e.currentTarget.style.background =
            "rgba(255,255,255,0.18)";

          e.currentTarget.style.transform =
            "translateY(-1px)";
        }}

        onMouseLeave={(e) => {
          e.currentTarget.style.background =
            "rgba(255,255,255,0.10)";

          e.currentTarget.style.transform =
            "translateY(0)";
        }}
      >
        <img
          src={currentLang.flag}
          alt={currentLang.name}
          style={{
            width: "27px",
            height: "19px",
            objectFit: "cover",
            borderRadius: "4px",
            display: "block",

            boxShadow:
              "0 1px 4px rgba(0,0,0,0.25)",
          }}
        />

        {/* Petite flèche */}

        <span
          style={{
            position: "absolute",
            right: "3px",
            bottom: "3px",

            width: "10px",
            height: "10px",

            display: "flex",
            alignItems: "center",
            justifyContent: "center",

            borderRadius: "50%",

            background: "white",

            color: "#475569",

            fontSize: "7px",
            fontWeight: "700",

            boxShadow:
              "0 1px 3px rgba(0,0,0,0.20)",
          }}
        >
          {isOpen ? "▲" : "▼"}
        </span>
      </button>

   

      {isOpen && (
        <div
          style={{
            position: "absolute",

            top: "calc(100% + 10px)",

            right: "0",

            width: "230px",

            background: "#ffffff",

            borderRadius: "14px",

            border:
              "1px solid #e2e8f0",

            boxShadow:
              "0 15px 40px rgba(15,23,42,0.18)",

            overflow: "hidden",

            zIndex: 9999,

            animation:
              "languageDropdown 0.20s ease-out",
          }}
        >
          {/* Header */}

          <div
            style={{
              padding: "14px 16px 10px",

              borderBottom:
                "1px solid #f1f5f9",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                fontWeight: "600",
                color: "#94a3b8",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Langue
            </div>

            <div
              style={{
                marginTop: "3px",
                fontSize: "14px",
                fontWeight: "600",
                color: "#0f172a",
              }}
            >
              Choisir la langue
            </div>
          </div>

          {/* Languages */}

          <div
            style={{
              padding: "6px",
            }}
          >
            {LANGUAGES.map((lang) => {
              const isActive =
                currentLanguage === lang.code;

              return (
                <button
                  key={lang.code}
                  type="button"
                  disabled={isActive}
                  onClick={() =>
                    handleLanguageChange(
                      lang.code
                    )
                  }
                  style={{
                    width: "100%",

                    display: "flex",
                    alignItems: "center",

                    gap: "12px",

                    padding: "11px 12px",

                    marginBottom: "2px",

                    border: "none",

                    borderRadius: "10px",

                    background: isActive
                      ? "#eff6ff"
                      : "transparent",

                    cursor: isActive
                      ? "default"
                      : "pointer",

                    textAlign: "left",

                    transition:
                      "all 0.15s ease",
                  }}

                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background =
                        "#f8fafc";
                    }
                  }}

                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background =
                        "transparent";
                    }
                  }}
                >
                  {/* Drapeau */}

                  <div
                    style={{
                      width: "42px",
                      height: "30px",

                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",

                      background: "#f8fafc",

                      borderRadius: "7px",

                      border:
                        "1px solid #e2e8f0",

                      flexShrink: 0,
                    }}
                  >
                    <img
                      src={lang.flag}
                      alt={lang.name}
                      style={{
                        width: "30px",
                        height: "21px",
                        objectFit: "cover",
                        borderRadius: "3px",
                        display: "block",
                      }}
                    />
                  </div>

                  {/* Nom */}

                  <div
                    style={{
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: isActive
                          ? "600"
                          : "500",

                        color: isActive
                          ? "#0f172a"
                          : "#334155",
                      }}
                    >
                      {lang.name}
                    </div>

                    <div
                      style={{
                        marginTop: "2px",

                        fontSize: "11px",

                        color:
                          "#94a3b8",
                      }}
                    >
                      {lang.code.toUpperCase()}
                    </div>
                  </div>

                  {/* Langue active */}

                  {isActive && (
                    <div
                      style={{
                        width: "22px",
                        height: "22px",

                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",

                        borderRadius: "50%",

                        background:
                          "#0ea5e9",

                        color: "white",

                        fontSize: "12px",
                        fontWeight: "700",

                        flexShrink: 0,
                      }}
                    >
                      ✓
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer */}

          <div
            style={{
              padding: "9px 14px",

              borderTop:
                "1px solid #f1f5f9",

              fontSize: "11px",

              color: "#94a3b8",

              textAlign: "center",
            }}
          >
            Le changement sera appliqué
            automatiquement
          </div>
        </div>
      )}

     

      <style>
        {`
          @keyframes languageDropdown {
            from {
              opacity: 0;
              transform: translateY(-6px) scale(0.98);
            }

            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
        `}
      </style>
    </div>
  );
}

