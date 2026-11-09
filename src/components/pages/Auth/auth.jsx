import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../constants/AuthContext";
import { useEstablishment } from "../../../hooks/useEstablishment";
import { DEFAULT_LOGO } from "../../../services/establishmentService";
import "./Login.css";

const unsplash = (id) => `https://images.unsplash.com/${id}?q=80&w=1920&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D`;

const BACKGROUNDS = [
  unsplash("photo-1521656693074-0ef32e80a5d5"),
  unsplash("photo-1604335398980-ededcadcc37d"),
  unsplash("photo-1610305401607-8745a10c75dd"),
  unsplash("photo-1675430409777-eaa846201440"),
];

const DUREE_IMAGE = 7000;

function Diaporama() {
  const [etat, setEtat] = useState({ actif: 0, sortant: null });

  useEffect(() => {
    BACKGROUNDS.forEach((src) => {
      const img = new Image();
      img.src = src;
      img.decode?.().catch(() => {});
    });
    const id = setInterval(() => {
      setEtat(({ actif }) => ({ actif: (actif + 1) % BACKGROUNDS.length, sortant: actif }));
    }, DUREE_IMAGE);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="login-slides" aria-hidden="true">
      {BACKGROUNDS.map((src, i) => {
        const classe = i === etat.actif ? "is-active" : i === etat.sortant ? "is-leaving" : "";
        return (
          <img
            key={src}
            src={src}
            alt=""
            decoding="async"
            className={`login-slide login-slide--${i % 4} ${classe}`}
          />
        );
      })}
    </div>
  );
}

const IconUser = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IconLock = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const IconBadge = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M7 8v8M10 8v8M13 8v8M16 8v8" />
  </svg>
);

const IconAlert = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const IconEye = ({ off }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    {off ? (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
        <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </>
    ) : (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </>
    )}
  </svg>
);

export default function Authentification() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const establishment = useEstablishment();
  const { login, loginWithBadge, auth, isAuthenticated, logout } = useAuth();

  const [mode, setMode] = useState("CREDENTIALS");
  const [loginValue, setLoginValue] = useState("");
  const [password, setPassword] = useState("");
  const [badgeCode, setBadgeCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loginRef = useRef(null);
  const badgeRef = useRef(null);
  const scanTimer = useRef(null);

  useEffect(() => {
    const id = setTimeout(() => (mode === "BADGE" ? badgeRef.current : loginRef.current)?.focus(), 200);
    return () => clearTimeout(id);
  }, [mode]);

  useEffect(() => {
    if (mode !== "BADGE") return undefined;
    const garderFocus = () => {
      if (badgeRef.current && document.activeElement !== badgeRef.current) badgeRef.current.focus();
    };
    const onClick = (e) => { if (!e.target.closest("button, a")) garderFocus(); };
    const input = badgeRef.current;
    const onBlur = () => setTimeout(garderFocus, 50);
    input?.addEventListener("blur", onBlur);
    document.addEventListener("click", onClick);
    return () => {
      input?.removeEventListener("blur", onBlur);
      document.removeEventListener("click", onClick);
    };
  }, [mode]);

  const connecterBadge = async (code) => {
    if (!code || loading) return;
    setLoading(true);
    setError("");
    try {
      const data = await loginWithBadge(code);
      if (!data?.token) throw new Error(t("auth.errors.no_token"));
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || t("auth.errors.badge_invalid"));
      setBadgeCode("");
      setTimeout(() => badgeRef.current?.focus(), 100);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mode !== "BADGE" || !badgeCode.trim()) return undefined;
    clearTimeout(scanTimer.current);
    scanTimer.current = setTimeout(() => {
      const code = badgeCode.trim().replace(/\s/g, "").toUpperCase();
      if (code.length >= 4) connecterBadge(code);
    }, 500);
    return () => clearTimeout(scanTimer.current);
  }, [badgeCode, mode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (mode === "BADGE") {
      if (!badgeCode.trim()) { setError(t("auth.errors.badge_required")); return; }
      await connecterBadge(badgeCode.trim().replace(/\s/g, "").toUpperCase());
      return;
    }
    if (!loginValue.trim()) { setError(t("auth.errors.login_required")); return; }
    if (!password.trim()) { setError(t("auth.errors.password_required")); return; }
    setLoading(true);
    try {
      const data = await login(loginValue.trim(), password);
      if (!data?.token) throw new Error(t("auth.errors.no_token"));
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || t("auth.errors.login_failed"));
    } finally {
      setLoading(false);
    }
  };

  const changerMode = (m) => {
    setMode(m);
    setError("");
  };

  const logo = (
    <div className="login-card__logo">
      <img
        src={establishment.logo || DEFAULT_LOGO}
        alt="Logo"
        onError={(e) => { if (!e.currentTarget.src.endsWith(DEFAULT_LOGO)) e.currentTarget.src = DEFAULT_LOGO; }}
      />
    </div>
  );

  return (
    <div className="login-page">
      <Diaporama />
      <div className="login-overlay-content">
        <div className="login-card">
          {logo}

          {isAuthenticated && auth ? (
            <>
              <h2 className="login-card__title">{t("auth.success.title")}</h2>
              <p className="login-welcome">
                {t("auth.success.welcome")} <strong>{auth.login}</strong>
                <br />
                {auth.privileges?.length || 0} {t("auth.success.privileges")}
              </p>
              <button type="button" className="login-form__submit" style={{ marginTop: 22 }} onClick={() => navigate("/", { replace: true })}>
                {t("auth.success.redirecting")}
              </button>
              <button type="button" className="login-form__secondary" onClick={logout}>
                {t("auth.logout")}
              </button>
            </>
          ) : (
            <>
              <h2 className="login-card__title">{t("auth.title")}</h2>
              <p className="login-card__subtitle">
                {mode === "CREDENTIALS" ? t("auth.subtitle_credentials") : t("auth.subtitle_badge")}
              </p>

              <div className="login-mode" role="tablist">
                <button type="button" role="tab" aria-selected={mode === "CREDENTIALS"} className={`login-mode__btn ${mode === "CREDENTIALS" ? "is-active" : ""}`} onClick={() => changerMode("CREDENTIALS")}>
                  <IconUser /> {t("auth.mode_credentials")}
                </button>
                <button type="button" role="tab" aria-selected={mode === "BADGE"} className={`login-mode__btn ${mode === "BADGE" ? "is-active" : ""}`} onClick={() => changerMode("BADGE")}>
                  <IconBadge /> {t("auth.mode_badge")}
                </button>
              </div>

              <form onSubmit={handleSubmit} className="login-form">
                {error && (
                  <div className="login-form__error">
                    <IconAlert />
                    <span>{error}</span>
                  </div>
                )}

                {mode === "CREDENTIALS" ? (
                  <>
                    <div className="login-form__group">
                      <label className="login-form__label" htmlFor="login">{t("auth.login_placeholder")}</label>
                      <div className="login-form__input-wrap">
                        <IconUser className="login-form__input-icon" />
                        <input
                          id="login"
                          ref={loginRef}
                          className={`login-form__input${error ? " login-form__input--error" : ""}`}
                          type="text"
                          placeholder={t("auth.login_placeholder")}
                          value={loginValue}
                          onChange={(e) => setLoginValue(e.target.value)}
                          autoComplete="username"
                        />
                      </div>
                    </div>

                    <div className="login-form__group">
                      <label className="login-form__label" htmlFor="password">{t("auth.password_placeholder")}</label>
                      <div className="login-form__input-wrap">
                        <IconLock className="login-form__input-icon" />
                        <input
                          id="password"
                          className={`login-form__input${error ? " login-form__input--error" : ""}`}
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          className="login-form__toggle-visibility"
                          onClick={() => setShowPassword((v) => !v)}
                          tabIndex={-1}
                          aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                        >
                          <IconEye off={showPassword} />
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="login-form__group">
                    <label className="login-form__label" htmlFor="badge">{t("auth.mode_badge")}</label>
                    <div className="login-form__input-wrap">
                      <IconBadge className="login-form__input-icon" />
                      <input
                        id="badge"
                        ref={badgeRef}
                        className={`login-form__input${error ? " login-form__input--error" : ""}`}
                        type="text"
                        placeholder={t("auth.badge_placeholder")}
                        value={badgeCode}
                        onChange={(e) => setBadgeCode(e.target.value)}
                        autoComplete="off"
                        disabled={loading}
                      />
                    </div>
                    <div className="login-form__hint"><i />{t("auth.badge_hint")}</div>
                  </div>
                )}

                <button
                  type="submit"
                  className="login-form__submit"
                  disabled={loading || (mode === "CREDENTIALS" ? !loginValue.trim() || !password.trim() : !badgeCode.trim())}
                >
                  {loading && <span className="login-form__spinner" />}
                  {loading ? t("auth.connecting") : mode === "CREDENTIALS" ? t("auth.login_button") : t("auth.badge_login_button")}
                </button>
              </form>
            </>
          )}

          <div className="login-card__footer">
            SOFTSYS INTERNATIONAL © {new Date().getFullYear()}
          </div>
        </div>
      </div>
    </div>
  );
}
