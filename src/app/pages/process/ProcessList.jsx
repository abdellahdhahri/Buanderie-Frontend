// Authentification.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUser,
  FaSpinner,
  FaCheckCircle,
  FaTimes,
  FaShieldAlt,
  FaLock,
  FaIdBadge,
  FaQrcode
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { useModal } from "../../contextes/ModalContext";
import { useAuth } from "../../contextes/Authentication/AuthContext";
import "../Linge/WorkflowList.css";

export default function Authentification() {
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
    }, 300);
    return () => clearTimeout(timer);
  }, [loginMode]);

  // ─── Login par identifiants ─────────────────────────────────────────────
  const handleLoginCredentials = async () => {
    if (!loginValue.trim()) {
      setError("Veuillez saisir votre login");
      showAlert("Login requis", "Veuillez saisir votre login", "warning");
      return;
    }
    if (!password.trim()) {
      setError("Veuillez saisir votre mot de passe");
      showAlert("Mot de passe requis", "Veuillez saisir votre mot de passe", "warning");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // ✅ Utiliser la méthode du contexte
      const authData = await login(loginValue.trim(), password);
      
      if (!authData?.token) {
        throw new Error("Aucun token JWT reçu");
      }

      setRedirecting(true);
      showAlert("Authentification réussie", "Bienvenue " + authData.login, "success");
      navigate("/", { replace: true });
    } catch (error) {
      setError(error.message || "Login ou mot de passe incorrect");
      showAlert("Échec de connexion", error.message || "Login ou mot de passe incorrect", "error");
    } finally {
      setLoading(false);
    }
  };

  // ─── Login par badge ────────────────────────────────────────────────────
  const handleLoginBadge = async () => {
    if (!badgeCode.trim()) {
      setError("Veuillez scanner votre badge");
      showAlert("Badge requis", "Veuillez scanner votre badge", "warning");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // ✅ Utiliser la méthode du contexte
      const authData = await loginWithBadge(badgeCode.trim());

      if (!authData?.token) {
        throw new Error("Aucun token JWT reçu");
      }

      setRedirecting(true);
      showAlert("Authentification réussie", "Bienvenue " + authData.login, "success");
      navigate("/", { replace: true });
    } catch (error) {
      setError(error.message || "Badge invalide");
      showAlert("Échec de connexion", error.message || "Badge invalide", "error");
    } finally {
      setLoading(false);
    }
  };

  // ─── Gestion des touches ────────────────────────────────────────────────
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      if (loginMode === "CREDENTIALS") {
        handleLoginCredentials();
      } else {
        handleLoginBadge();
      }
    }
  };

  // ─── Logout ──────────────────────────────────────────────────────────────
  const handleLogout = () => {
    localStorage.removeItem("auth");
    window.location.reload();
  };

  // ─── Écran de redirection ───────────────────────────────────────────────
  if (isAuthenticated && redirecting) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundImage: "url('https://images.unsplash.com/photo-1582735689369-4fe89db7114c?q=80&w=1170&auto=format&fit=crop')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        padding: "24px",
        position: "relative"
      }}>
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(15, 23, 42, 0.6)",
          backdropFilter: "blur(4px)"
        }} />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            maxWidth: "420px",
            width: "100%",
            background: "white",
            borderRadius: "24px",
            padding: "40px",
            textAlign: "center",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            position: "relative",
            zIndex: 1
          }}
        >
          <div style={{
            width: "70px",
            height: "70px",
            margin: "0 auto 20px",
            borderRadius: "50%",
            background: "#dcfce7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <FaCheckCircle size={38} color="#16a34a" />
          </div>
          <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>
            Authentification réussie
          </h2>
          <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "8px" }}>
            Bienvenue {auth?.login}
          </p>
          <p style={{ color: "#94a3b8", fontSize: "13px", marginBottom: "20px" }}>
            {auth?.privileges?.length || 0} privilèges chargés
          </p>
          <div style={{
            padding: "10px",
            borderRadius: "12px",
            background: "#dbeafe",
            color: "#1d4ed8",
            fontSize: "13px",
            fontWeight: 600,
            marginBottom: "20px"
          }}>
            Redirection vers le tableau de bord...
          </div>
          <button
            onClick={handleLogout}
            style={{
              padding: "10px 24px",
              borderRadius: "10px",
              border: "1px solid #e2e8f0",
              background: "white",
              color: "#64748b",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 500
            }}
          >
            Se déconnecter
          </button>
        </motion.div>
      </div>
    );
  }

  // ─── Page Login ──────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      backgroundImage: "url('https://images.unsplash.com/photo-1582735689369-4fe89db7114c?q=80&w=1170&auto=format&fit=crop')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      padding: "24px",
      position: "relative"
    }}>
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(15, 23, 42, 0.5)",
        backdropFilter: "blur(3px)"
      }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          maxWidth: "440px",
          width: "100%",
          borderRadius: "24px",
          overflow: "hidden",
          boxShadow: "0 24px 80px rgba(0,0,0,0.3)",
          position: "relative",
          zIndex: 1,
          background: "white"
        }}
      >
        <div style={{ padding: "40px 36px", background: "white" }}>
          {/* Logo */}
          <div style={{ textAlign: "center", marginBottom: "28px" }}>
            <div style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: "14px"
            }}>
              <img
                src="https://cdn.polyclinique-ibnkhaldoun.com.tn/wp-content/uploads/2019/01/LOGO-ibnkhaldoun.jpg"
                alt="Polyclinique Ibn Khaldoun Sfax"
                style={{ maxWidth: "200px", height: "auto", display: "block" }}
              />
            </div>
            <h1 style={{
              fontSize: "22px",
              fontWeight: 700,
              color: "#0f172a",
              margin: "0 0 4px 0",
              letterSpacing: "-0.5px"
            }}>
              Authentification
            </h1>
            <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
              {loginMode === "CREDENTIALS" 
                ? "Connectez-vous avec vos identifiants" 
                : "Connectez-vous avec votre badge"}
            </p>
          </div>

          {/* ─── Bascule entre les modes ────────────────────────────────── */}
          <div style={{
            display: "flex",
            gap: "6px",
            marginBottom: "24px",
            background: "#f1f5f9",
            padding: "5px",
            borderRadius: "14px"
          }}>
            <button
              onClick={() => {
                setLoginMode("CREDENTIALS");
                setError(null);
              }}
              style={{
                flex: 1,
                padding: "10px 14px",
                borderRadius: "10px",
                border: "none",
                background: loginMode === "CREDENTIALS" ? "white" : "transparent",
                boxShadow: loginMode === "CREDENTIALS" ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
                cursor: "pointer",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                fontSize: "13px",
                fontWeight: loginMode === "CREDENTIALS" ? 700 : 500,
                color: loginMode === "CREDENTIALS" ? "#1e3a5f" : "#64748b"
              }}
            >
              <FaUser size={14} />
              Identifiants
            </button>
            <button
              onClick={() => {
                setLoginMode("BADGE");
                setError(null);
              }}
              style={{
                flex: 1,
                padding: "10px 14px",
                borderRadius: "10px",
                border: "none",
                background: loginMode === "BADGE" ? "white" : "transparent",
                boxShadow: loginMode === "BADGE" ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
                cursor: "pointer",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                fontSize: "13px",
                fontWeight: loginMode === "BADGE" ? 700 : 500,
                color: loginMode === "BADGE" ? "#1e3a5f" : "#64748b"
              }}
            >
              <FaIdBadge size={14} />
              Badge
            </button>
          </div>

          {/* ─── Formulaire Credentials ────────────────────────────────── */}
          {loginMode === "CREDENTIALS" && (
            <>
              <div style={{ marginBottom: "16px" }}>
                <div style={{
                  position: "relative",
                  background: "#f8fafc",
                  borderRadius: "14px",
                  border: `2px solid ${error ? "#ef4444" : loginFocused ? "#2563eb" : "#e2e8f0"}`,
                  transition: "all 0.2s",
                  boxShadow: loginFocused ? "0 0 0 4px rgba(37,99,235,0.08)" : "none"
                }}>
                  <div style={{
                    position: "absolute",
                    left: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: loginFocused ? "#2563eb" : "#94a3b8"
                  }}>
                    <FaUser size={17} />
                  </div>
                  <input
                    ref={loginInputRef}
                    type="text"
                    placeholder="Login"
                    value={loginValue}
                    onChange={(e) => setLoginValue(e.target.value)}
                    onFocus={() => setLoginFocused(true)}
                    onBlur={() => setLoginFocused(false)}
                    onKeyDown={handleKeyDown}
                    disabled={loading}
                    style={{
                      width: "100%",
                      padding: "16px 16px 16px 46px",
                      borderRadius: "12px",
                      border: "none",
                      fontSize: "16px",
                      background: "transparent",
                      outline: "none",
                      boxSizing: "border-box",
                      color: "#0f172a"
                    }}
                  />
                  {loginValue && !loading && (
                    <button
                      type="button"
                      onClick={() => setLoginValue("")}
                      style={{
                        position: "absolute",
                        right: "14px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#94a3b8",
                        padding: "4px"
                      }}
                    >
                      <FaTimes size={15} />
                    </button>
                  )}
                </div>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <div style={{
                  position: "relative",
                  background: "#f8fafc",
                  borderRadius: "14px",
                  border: `2px solid ${error ? "#ef4444" : passwordFocused ? "#2563eb" : "#e2e8f0"}`,
                  transition: "all 0.2s",
                  boxShadow: passwordFocused ? "0 0 0 4px rgba(37,99,235,0.08)" : "none"
                }}>
                  <div style={{
                    position: "absolute",
                    left: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: passwordFocused ? "#2563eb" : "#94a3b8"
                  }}>
                    <FaLock size={17} />
                  </div>
                  <input
                    type="password"
                    placeholder="Mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    onKeyDown={handleKeyDown}
                    disabled={loading}
                    style={{
                      width: "100%",
                      padding: "16px 16px 16px 46px",
                      borderRadius: "12px",
                      border: "none",
                      fontSize: "16px",
                      background: "transparent",
                      outline: "none",
                      boxSizing: "border-box",
                      color: "#0f172a"
                    }}
                  />
                </div>
              </div>
            </>
          )}

          {/* ─── Formulaire Badge ───────────────────────────────────────── */}
          {loginMode === "BADGE" && (
            <div style={{ marginBottom: "24px" }}>
              <div style={{
                position: "relative",
                background: "#f8fafc",
                borderRadius: "14px",
                border: `2px solid ${error ? "#ef4444" : badgeFocused ? "#2563eb" : "#e2e8f0"}`,
                transition: "all 0.2s",
                boxShadow: badgeFocused ? "0 0 0 4px rgba(37,99,235,0.08)" : "none"
              }}>
                <div style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: badgeFocused ? "#2563eb" : "#94a3b8"
                }}>
                  <FaIdBadge size={17} />
                </div>
                <input
                  ref={badgeInputRef}
                  type="text"
                  placeholder="Scanner votre badge..."
                  value={badgeCode}
                  onChange={(e) => setBadgeCode(e.target.value)}
                  onFocus={() => setBadgeFocused(true)}
                  onBlur={() => setBadgeFocused(false)}
                  onKeyDown={handleKeyDown}
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "16px 16px 16px 46px",
                    borderRadius: "12px",
                    border: "none",
                    fontSize: "16px",
                    background: "transparent",
                    outline: "none",
                    boxSizing: "border-box",
                    color: "#0f172a"
                  }}
                />
                {badgeCode && !loading && (
                  <button
                    type="button"
                    onClick={() => setBadgeCode("")}
                    style={{
                      position: "absolute",
                      right: "14px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#94a3b8",
                      padding: "4px"
                    }}
                  >
                    <FaTimes size={15} />
                  </button>
                )}
              </div>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginTop: "8px",
                fontSize: "12px",
                color: "#94a3b8"
              }}>
                <FaQrcode size={12} />
                <span>Scannez votre badge ou saisissez le code</span>
              </div>
            </div>
          )}

          {/* ─── Erreur ──────────────────────────────────────────────────── */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            marginBottom: "12px",
            fontSize: "13px",
            color: "#dc2626",
            minHeight: "20px"
          }}>
            {error && (
              <>
                <FaTimes size={14} />
                <span>{error}</span>
              </>
            )}
          </div>

          {/* ─── Bouton Login ───────────────────────────────────────────── */}
          <button
            onClick={loginMode === "CREDENTIALS" ? handleLoginCredentials : handleLoginBadge}
            disabled={
              loading ||
              (loginMode === "CREDENTIALS" && (!loginValue.trim() || !password.trim())) ||
              (loginMode === "BADGE" && !badgeCode.trim())
            }
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "12px",
              border: "none",
              background: loading ||
                (loginMode === "CREDENTIALS" && (!loginValue.trim() || !password.trim())) ||
                (loginMode === "BADGE" && !badgeCode.trim())
                ? "#e2e8f0"
                : "linear-gradient(135deg, #1e3a5f, #2d6a9f)",
              color: loading ||
                (loginMode === "CREDENTIALS" && (!loginValue.trim() || !password.trim())) ||
                (loginMode === "BADGE" && !badgeCode.trim())
                ? "#94a3b8"
                : "white",
              fontWeight: 600,
              fontSize: "15px",
              cursor: loading ||
                (loginMode === "CREDENTIALS" && (!loginValue.trim() || !password.trim())) ||
                (loginMode === "BADGE" && !badgeCode.trim())
                ? "not-allowed"
                : "pointer",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px"
            }}
          >
            {loading ? (
              <>
                <FaSpinner style={{ animation: "spin 1s linear infinite" }} />
                Connexion...
              </>
            ) : loginMode === "CREDENTIALS" ? (
              <>
                <FaShieldAlt size={16} />
                S'authentifier
              </>
            ) : (
              <>
                <FaIdBadge size={16} />
                Se connecter avec le badge
              </>
            )}
          </button>

          {/* ─── Footer ──────────────────────────────────────────────────── */}
          <div style={{
            marginTop: "20px",
            paddingTop: "16px",
            borderTop: "1px solid #f1f5f9",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontSize: "12px",
            color: "#94a3b8",
            gap: "16px"
          }}>
            <span>Polyclinique Ibn Khaldoun</span>
            <span>•</span>
            <span>Sfax</span>
          </div>

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
                  background: "#dcfce7",
                  border: "1px solid #86efac",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px"
                }}
              >
                <FaCheckCircle color="#16a34a" size={18} />
                <div>
                  <div style={{ fontWeight: 600, color: "#15803d", fontSize: "13px" }}>
                    Authentification réussie
                  </div>
                  <div style={{ fontSize: "12px", color: "#64748b" }}>
                    Chargement de vos accès...
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}