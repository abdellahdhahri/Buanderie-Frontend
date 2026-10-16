import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { useModal } from "../../contextes/ModalContext";
import { useAuth } from "../../contextes/Authentication/AuthContext";
import { useEstablishment } from "../../hooks/useEstablishment";
import { DEFAULT_LOGO, DEFAULT_LOGO_FALLBACK } from "../../services/establishmentService";



// Nom et logo : Paramètres › Établissement (valeurs par défaut : Ibn Khaldoun)



const Icons = {
  User: ({ size = 18, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Lock: ({ size = 18, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  Badge: ({ size = 18, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="12" r="2" />
      <path d="M15 10h3" />
      <path d="M15 14h3" />
    </svg>
  ),
  Shield: ({ size = 18, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  CheckCircle: ({ size = 18, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  Alert: ({ size = 18, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  QrCode: ({ size = 18, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <path d="M14 14h3v3h-3z" />
      <path d="M18 18h3v3h-3z" />
      <path d="M14 21h3" />
      <path d="M21 14v3" />
    </svg>
  ),
  Spinner: ({ size = 18, color = "currentColor", strokeWidth = 2.5 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" style={{ animation: "spin 1s linear infinite" }}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  ),
  Close: ({ size = 18, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  Sparkle: ({ size = 18, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
    </svg>
  ),
  Activity: ({ size = 18, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  ),
  Zap: ({ size = 18, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
};



// Grain overlay (texture premium)
function GrainOverlay({ opacity = 0.04 }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        opacity,
        mixBlendMode: "overlay",
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      }}
    />
  );
}

// Particules flottantes
function FloatingParticles({ count = 20 }) {
  const particles = React.useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 5,
        duration: 8 + Math.random() * 6,
        size: 1 + Math.random() * 2,
      })),
    [count]
  );

  return (
    <>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          animate={{
            y: [0, -120, 0],
            opacity: [0, 0.6, 0],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
          style={{
            position: "absolute",
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            background: "#2dd4bf",
            boxShadow: "0 0 8px rgba(45, 212, 191, 0.8)",
            pointerEvents: "none",
          }}
        />
      ))}
    </>
  );
}

// Gradient mesh animé
function AnimatedMesh() {
  return (
    <motion.div
      animate={{
        background: [
          "radial-gradient(at 20% 30%, #0d9488 0%, transparent 50%), radial-gradient(at 80% 70%, #0f766e 0%, transparent 50%), radial-gradient(at 50% 50%, #115e59 0%, transparent 60%)",
          "radial-gradient(at 70% 20%, #0d9488 0%, transparent 50%), radial-gradient(at 30% 80%, #0f766e 0%, transparent 50%), radial-gradient(at 60% 40%, #115e59 0%, transparent 60%)",
          "radial-gradient(at 30% 70%, #0d9488 0%, transparent 50%), radial-gradient(at 70% 30%, #0f766e 0%, transparent 50%), radial-gradient(at 40% 60%, #115e59 0%, transparent 60%)",
        ],
      }}
      transition={{ duration: 20, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
      style={{
        position: "absolute",
        inset: 0,
        background: "#0f172a",
      }}
    />
  );
}

// Bouton premium avec shimmer
function PremiumButton({ children, onClick, disabled, loading, icon: Icon }) {
  const isDisabled = disabled || loading;
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      whileHover={!isDisabled ? { scale: 1.01 } : {}}
      whileTap={!isDisabled ? { scale: 0.99 } : {}}
      style={{
        position: "relative",
        width: "100%",
        padding: "16px",
        borderRadius: "14px",
        border: "none",
        background: isDisabled
          ? "#e2e8f0"
          : "linear-gradient(135deg, #0d9488 0%, #14b8a6 50%, #0d9488 100%)",
        backgroundSize: "200% 100%",
        color: isDisabled ? "#94a3b8" : "white",
        fontWeight: 700,
        fontSize: "15px",
        letterSpacing: "0.3px",
        cursor: isDisabled ? "not-allowed" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
        overflow: "hidden",
        boxShadow: isDisabled
          ? "none"
          : "0 12px 32px rgba(13, 148, 136, 0.35)",
        transition: "box-shadow 0.3s, background-position 0.4s",
      }}
      onMouseEnter={(e) => {
        if (!isDisabled) {
          e.currentTarget.style.boxShadow = "0 16px 40px rgba(13, 148, 136, 0.45), 0 0 0 6px rgba(13, 148, 136, 0.1)";
          e.currentTarget.style.backgroundPosition = "100% 0";
        }
      }}
      onMouseLeave={(e) => {
        if (!isDisabled) {
          e.currentTarget.style.boxShadow = "0 12px 32px rgba(13, 148, 136, 0.35)";
          e.currentTarget.style.backgroundPosition = "0 0";
        }
      }}
    >
      {!isDisabled && (
        <span
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
            transform: "translateX(-100%)",
            animation: "shimmer 2.5s infinite",
            pointerEvents: "none",
          }}
        />
      )}
      {loading ? (
        <Icons.Spinner size={16} color="white" />
      ) : (
        Icon && <Icon size={16} color="white" strokeWidth={2.5} />
      )}
      {children}
    </motion.button>
  );
}

// Input premium avec glow
function PremiumInput({
  icon: Icon,
  type = "text",
  placeholder,
  value,
  onChange,
  onKeyDown,
  onFocus,
  onBlur,
  focused,
  error,
  inputRef,
  showClear,
}) {
  return (
    <div
      style={{
        position: "relative",
        background: focused ? "white" : "#f8fafc",
        borderRadius: "14px",
        border: `2px solid ${error ? "#ef4444" : focused ? "#14b8a6" : "#e2e8f0"}`,
        transition: "all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
        boxShadow: focused
          ? "0 0 0 4px rgba(20, 184, 166, 0.12), 0 8px 24px rgba(13, 148, 136, 0.08)"
          : "none",
        animation: error ? "shake 0.4s" : "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: "16px",
          top: "50%",
          transform: "translateY(-50%)",
          color: focused ? "#0d9488" : "#94a3b8",
          transition: "color 0.2s",
          display: "flex",
        }}
      >
        <Icon size={18} color={focused ? "#0d9488" : "#94a3b8"} strokeWidth={2} />
      </div>
      <input
        ref={inputRef}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        onBlur={onBlur}
        style={{
          width: "100%",
          padding: "16px 44px 16px 48px",
          borderRadius: "14px",
          border: "none",
          fontSize: "15px",
          background: "transparent",
          outline: "none",
          boxSizing: "border-box",
          color: "#0f172a",
          fontWeight: 500,
        }}
      />
      {showClear && value && (
        <button
          type="button"
          onClick={() => onChange({ target: { value: "" } })}
          style={{
            position: "absolute",
            right: "14px",
            top: "50%",
            transform: "translateY(-50%)",
            background: "rgba(148, 163, 184, 0.15)",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            color: "#64748b",
            padding: "6px",
            display: "flex",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(148, 163, 184, 0.3)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(148, 163, 184, 0.15)")}
        >
          <Icons.Close size={12} color="#64748b" strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}



function BrandLogo({ height = 44, variant = "glass" }) {
  const isGlass = variant === "glass";
  const establishment = useEstablishment();

  return (
    <motion.div
      data-keep-light
      initial={{ opacity: 0, scale: 0.92, y: -6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: isGlass ? "10px 18px" : "14px 22px",
        borderRadius: isGlass ? "16px" : "18px",
        background: isGlass ? "rgba(255, 255, 255, 0.95)" : "linear-gradient(135deg, #f8fafc 0%, #f0fdfa 100%)",
        backdropFilter: isGlass ? "blur(20px)" : "none",
        border: isGlass ? "1px solid rgba(255, 255, 255, 0.4)" : "1px solid #e2e8f0",
        boxShadow: isGlass
          ? "0 8px 32px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1) inset, 0 0 40px rgba(45, 212, 191, 0.15)"
          : "0 4px 16px rgba(15, 23, 42, 0.06)",
        overflow: "hidden",
      }}
    >
      {/* Halo animé (uniquement en mode glass) */}
      {isGlass && (
        <motion.div
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            inset: -20,
            background: "radial-gradient(circle, rgba(45, 212, 191, 0.3) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
      )}
      <img
        src={establishment.logo}
        alt={[establishment.name, establishment.city].filter(Boolean).join(" ")}
        onError={(e) => {
          // Logo par défaut indisponible → image de secours
          if (establishment.logo === DEFAULT_LOGO && e.currentTarget.src !== DEFAULT_LOGO_FALLBACK) {
            e.currentTarget.src = DEFAULT_LOGO_FALLBACK;
          }
        }}
        style={{
          height: `${height}px`,
          width: "auto",
          display: "block",
          position: "relative",
          zIndex: 1,
          filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.08))",
        }}
      />
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 🔐 PAGE D'AUTHENTIFICATION PREMIUM
// ═══════════════════════════════════════════════════════════════════════════

function AuthentificationInner() {
  const { t } = useTranslation();
  const establishment = useEstablishment();
  const navigate = useNavigate();
  const { showAlert } = useModal();
  const { login, loginWithBadge, auth, isAuthenticated } = useAuth();

  // ─── États ──────────────────────────────────────────────────────────────
  const [loginMode, setLoginMode] = useState("CREDENTIALS");
  const [loginValue, setLoginValue] = useState("");
  const [password, setPassword] = useState("");
  const [badgeCode, setBadgeCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [redirecting, setRedirecting] = useState(false);
  const [loginFocused, setLoginFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [badgeFocused, setBadgeFocused] = useState(false);

  const loginInputRef = useRef(null);
  const badgeInputRef = useRef(null);
  const badgeScanTimeoutRef = useRef(null);

  // ─── Vérification session ──────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated || !auth) return;
    console.log("🔐 UTILISATEUR AUTHENTIFIÉ:", auth.login);
  }, [isAuthenticated, auth]);

  // ─── Focus automatique ──────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loginMode === "CREDENTIALS" && loginInputRef.current) {
        loginInputRef.current.focus();
        setLoginFocused(true);
      } else if (loginMode === "BADGE" && badgeInputRef.current) {
        badgeInputRef.current.focus();
        setBadgeFocused(true);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [loginMode]);

  // ✅ FOCUS PERMANENT SUR LE CHAMP BADGE
  // Dès qu'on est en mode BADGE, le champ garde le focus
  // même si l'utilisateur clique ailleurs ou tape sur Tab
  useEffect(() => {
    if (loginMode !== "BADGE") return;

    const keepFocus = () => {
      if (badgeInputRef.current && document.activeElement !== badgeInputRef.current) {
        badgeInputRef.current.focus();
        setBadgeFocused(true);
      }
    };

    // Reprendre le focus au clic n'importe où sur la page
    const handleBodyClick = (e) => {
      // Ne pas voler le focus si on clique sur un bouton/lien
      if (e.target.closest("button, a")) return;
      keepFocus();
    };

    // Reprendre le focus quand on perd le focus (Tab, clic ailleurs, etc.)
    const handleBlur = () => {
      // Petit délai pour laisser le temps à un éventuel autre input
      setTimeout(keepFocus, 50);
    };

    const input = badgeInputRef.current;
    if (input) {
      input.addEventListener("blur", handleBlur);
    }
    document.addEventListener("click", handleBodyClick);

    // Reprendre immédiatement le focus
    keepFocus();

    return () => {
      if (input) input.removeEventListener("blur", handleBlur);
      document.removeEventListener("click", handleBodyClick);
    };
  }, [loginMode]);

  // ✅ DÉTECTION AUTOMATIQUE DU CODE-BARRE
  // Quand l'utilisateur (ou la douchette) tape des caractères dans le champ badge,
  // on attend 500ms sans nouvelle frappe → on envoie automatiquement
  useEffect(() => {
    if (loginMode !== "BADGE") return;
    if (!badgeCode.trim()) return;

    // Nettoyer le timer précédent
    if (badgeScanTimeoutRef.current) {
      clearTimeout(badgeScanTimeoutRef.current);
    }

    // Attendre 500ms après la dernière frappe
    // (les douchettes tapent très vite, puis s'arrêtent)
    badgeScanTimeoutRef.current = setTimeout(() => {
      const cleanCode = badgeCode.trim().replace(/\s/g, "").toUpperCase();
      if (cleanCode.length >= 4) {
        console.log("🎫 Badge scanné automatiquement:", cleanCode);
        handleLoginBadgeAuto(cleanCode);
      }
    }, 500);

    return () => {
      if (badgeScanTimeoutRef.current) {
        clearTimeout(badgeScanTimeoutRef.current);
      }
    };
  }, [badgeCode, loginMode]);

  // ─── Login par identifiants ─────────────────────────────────────────────
  const handleLoginCredentials = async () => {
    if (!loginValue.trim()) {
      setError(t("auth.errors.login_required"));
      showAlert(t("auth.errors.login_required"), t("auth.errors.login_required_text"), "warning");
      return;
    }
    if (!password.trim()) {
      setError(t("auth.errors.password_required"));
      showAlert(t("auth.errors.password_required"), t("auth.errors.password_required_text"), "warning");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const authData = await login(loginValue.trim(), password);
      if (!authData?.token) throw new Error(t("auth.errors.no_token"));

      setRedirecting(true);
      showAlert(t("auth.success.title"), t("auth.success.welcome") + " " + authData.login, "success");
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || t("auth.errors.login_failed"));
      showAlert(t("auth.errors.login_failed_title"), err.message || t("auth.errors.login_failed"), "error");
    } finally {
      setLoading(false);
    }
  };

  // ✅ LOGIN BADGE AUTOMATIQUE (appelé par la détection auto)
  const handleLoginBadgeAuto = async (code) => {
    if (!code || loading) return;

    setLoading(true);
    setError(null);

    try {
      const authData = await loginWithBadge(code);
      if (!authData?.token) throw new Error(t("auth.errors.no_token"));

      setRedirecting(true);
      showAlert(t("auth.success.title"), t("auth.success.welcome") + " " + authData.login, "success");
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || t("auth.errors.badge_invalid"));
      showAlert(t("auth.errors.login_failed_title"), err.message || t("auth.errors.badge_invalid"), "error");
      // Vider le champ pour permettre un nouveau scan
      setBadgeCode("");
      // Remettre le focus
      setTimeout(() => {
        if (badgeInputRef.current) badgeInputRef.current.focus();
      }, 100);
    } finally {
      setLoading(false);
    }
  };

  // ─── Login par badge (manuel, si bouton cliqué) ─────────────────────────
  const handleLoginBadge = async () => {
    if (!badgeCode.trim()) {
      setError(t("auth.errors.badge_required"));
      showAlert(t("auth.errors.badge_required"), t("auth.errors.badge_required_text"), "warning");
      return;
    }

    const cleanCode = badgeCode.trim().replace(/\s/g, "").toUpperCase();
    await handleLoginBadgeAuto(cleanCode);
  };

  // ─── Gestion des touches ────────────────────────────────────────────────
  const handleKeyDown = (e) => {
    // ✅ En mode BADGE, on n'attend PAS Enter — la détection est automatique
    if (loginMode === "BADGE") return;

    if (e.key === "Enter") {
      if (loginMode === "CREDENTIALS") handleLoginCredentials();
      else handleLoginBadge();
    }
  };

  // ─── Logout ──────────────────────────────────────────────────────────────
  const handleLogout = () => {
    localStorage.removeItem("auth");
    window.location.reload();
  };

  // ─── Écran de redirection (premium) ─────────────────────────────────────
  if (isAuthenticated && redirecting) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "#0f172a",
          padding: "24px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <AnimatedMesh />
        <GrainOverlay opacity={0.08} />
        <FloatingParticles count={15} />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200 }}
          style={{
            maxWidth: "440px",
            width: "100%",
            background: "rgba(255, 255, 255, 0.98)",
            backdropFilter: "blur(20px)",
            borderRadius: "28px",
            padding: "48px 40px",
            textAlign: "center",
            boxShadow: "0 32px 80px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)",
            position: "relative",
            zIndex: 2,
          }}
        >
          {/* Logo en haut de l'écran succès */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
            <BrandLogo height={38} variant="card" />
          </div>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            style={{
              width: "80px",
              height: "80px",
              margin: "0 auto 24px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #d1fae5, #a7f3d0)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 12px 32px rgba(16, 185, 129, 0.3)",
              position: "relative",
            }}
          >
            <motion.div
              animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{
                position: "absolute",
                inset: "-10px",
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(16, 185, 129, 0.4) 0%, transparent 70%)",
              }}
            />
            <Icons.CheckCircle size={44} color="#059669" strokeWidth={2.5} />
          </motion.div>

          <h2 style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a", marginBottom: "10px", letterSpacing: "-0.5px" }}>
            {t("auth.success.title")}
          </h2>
          <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "6px", fontWeight: 500 }}>
            {t("auth.success.welcome")}{" "}
            <strong style={{ color: "#0d9488" }}>{auth?.login}</strong>
          </p>
          <p style={{ color: "#94a3b8", fontSize: "12px", marginBottom: "24px" }}>
            {auth?.privileges?.length || 0} {t("auth.success.privileges")}
          </p>

          <div
            style={{
              padding: "12px 16px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #f0fdfa, #ccfbf1)",
              color: "#0f766e",
              fontSize: "13px",
              fontWeight: 700,
              marginBottom: "24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
            }}
          >
            <Icons.Spinner size={14} color="#0f766e" />
            {t("auth.success.redirecting")}
          </div>

          <button
            onClick={handleLogout}
            style={{
              padding: "10px 24px",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              background: "white",
              color: "#64748b",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 600,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
          >
            {t("auth.logout")}
          </button>
        </motion.div>
      </div>
    );
  }

  // ─── Page Login Premium (Split-screen) ──────────────────────────────────
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        background: "#0f172a",
        padding: 0,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* ═══════════════════════════════════════════════════════════════════
          PANNEAU GAUCHE - MARQUE (60%)
      ═══════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="auth-brand-panel"
        style={{
          flex: "1 1 60%",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "48px",
          overflow: "hidden",
        }}
      >
        <AnimatedMesh />
        <GrainOverlay opacity={0.08} />
        <FloatingParticles count={25} />

        {/* Logo en haut — carte verre + texte */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <BrandLogo height={42} variant="glass" />
          <div>
            <div style={{ color: "white", fontWeight: 800, fontSize: "15px", letterSpacing: "-0.3px", lineHeight: 1.2 }}>
              Système de Gestion
            </div>
            <div
              style={{
                color: "#5eead4",
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "1.2px",
                textTransform: "uppercase",
                marginTop: "2px",
              }}
            >
              du Linge Hospitalier
            </div>
          </div>
        </div>

        {/* Contenu central */}
        <div style={{ position: "relative", zIndex: 2, maxWidth: "480px" }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <h1
              style={{
                fontSize: "42px",
                fontWeight: 800,
                color: "white",
                lineHeight: 1.15,
                letterSpacing: "-1.5px",
                marginBottom: "16px",
              }}
            >
              Gérez votre linge
              <br />
              <span
                style={{
                  background: "linear-gradient(135deg, #2dd4bf 0%, #5eead4 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                avec précision.
              </span>
            </h1>

            <p style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "15px", lineHeight: 1.6, marginBottom: "32px" }}>
              Suivi en temps réel, traçabilité complète et supervision industrielle de chaque étape du traitement du linge hospitalier.
            </p>
          </motion.div>
        </div>

        {/* Footer */}
        <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <motion.div
              animate={{ scale: [1, 1.3, 1], opacity: [1, 0.4, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10b981", boxShadow: "0 0 8px #10b981" }}
            />
            <span style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: "11px", fontWeight: 600 }}>
              Tous les systèmes opérationnels
            </span>
          </div>
          <span style={{ color: "rgba(255, 255, 255, 0.2)" }}>•</span>
          <span style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: "11px", fontWeight: 600 }}>v2.4.1</span>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════
          PANNEAU DROIT - FORMULAIRE (40%)
      ═══════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="auth-form-panel"
        style={{
          flex: "1 1 40%",
          background: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px",
          position: "relative",
        }}
      >
        {/* Décoration subtile - ligne animée en haut */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "4px",
            background: "linear-gradient(90deg, #0d9488, #2dd4bf, #0d9488)",
            backgroundSize: "200% 100%",
            animation: "gradientShift 3s linear infinite",
          }}
        />

        <div style={{ maxWidth: "400px", width: "100%", position: "relative", zIndex: 2 }}>
          {/* Logo — toujours visible (desktop + mobile) */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "28px" }}>
            <BrandLogo height={44} variant="card" />
          </div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{ marginBottom: "28px", textAlign: "center" }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "5px 12px",
                borderRadius: "20px",
                background: "#f0fdfa",
                border: "1px solid #ccfbf1",
                color: "#0f766e",
                fontSize: "10px",
                fontWeight: 800,
                letterSpacing: "0.8px",
                textTransform: "uppercase",
                marginBottom: "16px",
              }}
            >
              <Icons.Shield size={11} color="#0f766e" strokeWidth={2.5} />
              Accès sécurisé
            </div>

            <h2
              style={{
                fontSize: "26px",
                fontWeight: 800,
                color: "#0f172a",
                letterSpacing: "-0.8px",
                marginBottom: "6px",
                lineHeight: 1.2,
              }}
            >
              {loginMode === "CREDENTIALS" ? t("auth.title") : t("auth.mode_badge")}
            </h2>
            <p style={{ fontSize: "14px", color: "#64748b", margin: 0, fontWeight: 500 }}>
              {loginMode === "CREDENTIALS" ? t("auth.subtitle_credentials") : t("auth.subtitle_badge")}
            </p>
          </motion.div>

          {/* ─── Toggle mode (slide animé) ──────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{
              position: "relative",
              display: "flex",
              background: "#f1f5f9",
              padding: "5px",
              borderRadius: "14px",
              marginBottom: "24px",
            }}
          >
            <motion.div
              layout
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              style={{
                position: "absolute",
                top: 5,
                bottom: 5,
                left: loginMode === "CREDENTIALS" ? 5 : "calc(50% + 0px)",
                width: "calc(50% - 5px)",
                background: "white",
                borderRadius: "10px",
                boxShadow: "0 2px 8px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(15, 23, 42, 0.04)",
              }}
            />
            <button
              type="button"
              onClick={() => {
                setLoginMode("CREDENTIALS");
                setError(null);
              }}
              style={{
                flex: 1,
                position: "relative",
                zIndex: 2,
                padding: "11px 14px",
                borderRadius: "10px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                fontSize: "13px",
                fontWeight: loginMode === "CREDENTIALS" ? 700 : 500,
                color: loginMode === "CREDENTIALS" ? "#0d9488" : "#64748b",
                transition: "color 0.2s",
              }}
            >
              <Icons.User size={14} color={loginMode === "CREDENTIALS" ? "#0d9488" : "#64748b"} strokeWidth={2.5} />
              {t("auth.mode_credentials")}
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginMode("BADGE");
                setError(null);
              }}
              style={{
                flex: 1,
                position: "relative",
                zIndex: 2,
                padding: "11px 14px",
                borderRadius: "10px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                fontSize: "13px",
                fontWeight: loginMode === "BADGE" ? 700 : 500,
                color: loginMode === "BADGE" ? "#0d9488" : "#64748b",
                transition: "color 0.2s",
              }}
            >
              <Icons.Badge size={14} color={loginMode === "BADGE" ? "#0d9488" : "#64748b"} strokeWidth={2.5} />
              {t("auth.mode_badge")}
            </button>
          </motion.div>

          {/* ─── Formulaires ────────────────────────────────────────────── */}
          <AnimatePresence mode="wait">
            {loginMode === "CREDENTIALS" ? (
              <motion.div
                key="credentials"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  style={{ marginBottom: "16px" }}
                >
                  <PremiumInput
                    icon={Icons.User}
                    type="text"
                    placeholder={t("auth.login_placeholder")}
                    value={loginValue}
                    onChange={(e) => setLoginValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setLoginFocused(true)}
                    onBlur={() => setLoginFocused(false)}
                    focused={loginFocused}
                    error={error}
                    inputRef={loginInputRef}
                    showClear
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.43 }}
                  style={{ marginBottom: "20px" }}
                >
                  <PremiumInput
                    icon={Icons.Lock}
                    type="password"
                    placeholder={t("auth.password_placeholder")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    focused={passwordFocused}
                    error={error}
                  />
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="badge"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                style={{ marginBottom: "24px" }}
              >
                <PremiumInput
                  icon={Icons.Badge}
                  type="text"
                  placeholder={t("auth.badge_placeholder")}
                  value={badgeCode}
                  onChange={(e) => setBadgeCode(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setBadgeFocused(true)}
                  onBlur={() => setBadgeFocused(false)}
                  focused={badgeFocused}
                  error={error}
                  inputRef={badgeInputRef}
                  showClear
                />
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginTop: "10px",
                    fontSize: "12px",
                    color: "#94a3b8",
                    paddingLeft: "4px",
                  }}
                >
                  <Icons.QrCode size={12} color="#94a3b8" strokeWidth={2} />
                  <span>{t("auth.badge_hint")}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ─── Erreur ──────────────────────────────────────────────────── */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "16px",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#dc2626",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                <Icons.Alert size={15} color="#dc2626" strokeWidth={2.5} />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ─── Bouton Login ───────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <PremiumButton
              onClick={loginMode === "CREDENTIALS" ? handleLoginCredentials : handleLoginBadge}
              disabled={
                (loginMode === "CREDENTIALS" && (!loginValue.trim() || !password.trim())) ||
                (loginMode === "BADGE" && !badgeCode.trim())
              }
              loading={loading}
              icon={loginMode === "CREDENTIALS" ? Icons.Shield : Icons.Badge}
            >
              {loading
                ? t("auth.connecting")
                : loginMode === "CREDENTIALS"
                ? t("auth.login_button")
                : t("auth.badge_login_button")}
            </PremiumButton>
          </motion.div>

          {/* ─── Footer ──────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            style={{
              marginTop: "28px",
              paddingTop: "20px",
              borderTop: "1px solid #f1f5f9",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontSize: "12px",
              color: "#94a3b8",
              gap: "12px",
              fontWeight: 500,
            }}
          >
            <span>{establishment.name}</span>
            {establishment.city && (
              <>
                <span style={{ color: "#cbd5e1" }}>•</span>
                <span>{establishment.city}</span>
              </>
            )}
          </motion.div>

          {/* ─── Redirection message ────────────────────────────────────── */}
          <AnimatePresence>
            {redirecting && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{
                  marginTop: "16px",
                  padding: "12px 16px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #f0fdfa, #ccfbf1)",
                  border: "1px solid #a7f3d0",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <Icons.CheckCircle size={18} color="#059669" strokeWidth={2.5} />
                <div>
                  <div style={{ fontWeight: 700, color: "#0f766e", fontSize: "13px" }}>
                    {t("auth.success.title")}
                  </div>
                  <div style={{ fontSize: "12px", color: "#64748b" }}>
                    {t("auth.success.loading_access")}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

     
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }

        /* Responsive : en dessous de 1024px, on cache le panneau gauche */
        @media (max-width: 1024px) {
          .auth-brand-panel {
            display: none !important;
          }
          .auth-form-panel {
            flex: 1 1 100% !important;
            padding: 32px 24px !important;
          }
        }

        /* Scrollbar premium */
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 8px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
}

export default function Authentification() {
  return <AuthentificationInner />;
}