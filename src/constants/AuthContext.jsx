import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { appelerLogout, effacerSession } from "../services/sessionGuard";

const AuthContext = createContext(null);

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

const MESSAGE_SANS_DROIT = "Votre compte n'a aucun droit d'accès au module Buanderie.";

const refuserSansDroit = async (token, estAdmin, privileges) => {
  const aDesDroits = estAdmin || privileges.length > 0;
  if (aDesDroits) return;
  await appelerLogout(token);
  effacerSession();
  throw new Error(MESSAGE_SANS_DROIT);
};

export const ETAPES_ACTIONS = {
  tri: { categorie: 2, nom: "Tri" },
  lavage: { categorie: 3, nom: "Lavage" },
  sechage: { categorie: 4, nom: "Séchage" },
  pliage: { categorie: 5, nom: "Pliage" },
  stockage: { categorie: 6, nom: "Stockage" },
  livraison: { categorie: 7, nom: "Livraison" }
};

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedAuth = localStorage.getItem("auth");
    if (savedAuth) {
      try {
        const parsedAuth = JSON.parse(savedAuth);
        if (parsedAuth?.token) {
          setAuth(parsedAuth);
        } else {
          localStorage.removeItem("auth");
        }
      } catch {
        localStorage.removeItem("auth");
      }
    }
    setLoading(false);
  }, []);

  const login = async (loginValue, password) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login: loginValue, password })
      });

      if (!response.ok) {
        let message = "Login ou mot de passe incorrect";
        try {
          const errorData = await response.json();
          message = errorData.message || errorData.error || message;
        } catch {}
        throw new Error(message);
      }

      const loginResponse = await response.json();

      if (!loginResponse?.token) {
        throw new Error("Le serveur n'a pas retourné de JWT");
      }

      const authData = {
        token: loginResponse.token,
        login: loginResponse.login || loginValue,
        admin: loginResponse.admin === true,
        privileges: Array.isArray(loginResponse.privileges) ? loginResponse.privileges : [],
        etapes: Array.isArray(loginResponse.etapes) ? loginResponse.etapes : [],
        codeBarre: loginResponse.codeBarre || loginResponse.user?.codeBarre || null,
        agent: loginResponse.user || null
      };

      await refuserSansDroit(authData.token, authData.admin || authData.privileges.some((p) => p === "ADMIN" || p === "ALL"), authData.privileges);

      localStorage.setItem("auth", JSON.stringify(authData));
      setAuth(authData);
      window.dispatchEvent(new Event("authChanged"));

      return authData;
    } catch (error) {
      throw error;
    }
  };

  const loginWithBadge = async (codeBarre) => {
    try {
      const response = await fetch(
        `${API_URL}/api/auth/login/badge?codeBarre=${encodeURIComponent(codeBarre)}`,
        { method: "POST" }
      );

      if (!response.ok) {
        let message = "Badge invalide";
        try {
          const errorData = await response.json();
          message = errorData.message || errorData.error || message;
        } catch {}
        throw new Error(message);
      }

      const loginResponse = await response.json();

      if (!loginResponse?.token) {
        throw new Error("Le serveur n'a pas retourné de JWT");
      }

      const authData = {
        token: loginResponse.token,
        login: loginResponse.login || "Utilisateur badge",
        admin: loginResponse.administrateur === true,
        privileges: Array.isArray(loginResponse.privileges) ? loginResponse.privileges : [],
        etapes: Array.isArray(loginResponse.etapes) ? loginResponse.etapes : [],
        codeBarre: loginResponse.codeBarre || loginResponse.user?.codeBarre || null,
        agent: loginResponse.user || null
      };

      await refuserSansDroit(authData.token, authData.admin || authData.privileges.some((p) => p === "ADMIN" || p === "ALL"), authData.privileges);

      localStorage.setItem("auth", JSON.stringify(authData));
      setAuth(authData);
      window.dispatchEvent(new Event("authChanged"));

      return authData;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    await appelerLogout(auth?.token);
    setAuth(null);
    effacerSession();
  };

  const hasPrivilege = (code) => {
    if (!auth) return false;
    if (auth.admin === true) return true;
    if (!Array.isArray(auth.privileges)) return false;
    return auth.privileges.includes(code);
  };

  const hasAnyPrivilege = (codes = []) => {
    if (!auth) return false;
    if (auth.admin === true) return true;
    if (!Array.isArray(auth.privileges)) return false;
    return codes.some(code => auth.privileges.includes(code));
  };

  const hasAllPrivileges = (codes = []) => {
    if (!auth) return false;
    if (auth.admin === true) return true;
    if (!Array.isArray(auth.privileges)) return false;
    return codes.every(code => auth.privileges.includes(code));
  };

  const verifierHabilitation = useCallback((action) => {
    const etape = ETAPES_ACTIONS[action];
    if (!etape || !auth || auth.admin === true) return true;
    if (!Array.isArray(auth.etapes) || auth.etapes.length === 0) return true;
    if (auth.etapes.some((e) => e.categorie === etape.categorie)) return true;
    toast.warning(`Vous n'êtes pas habilité pour l'étape ${etape.nom}`);
    return false;
  }, [auth]);

  const isAuthenticated = !!auth?.token;

  return (
    <AuthContext.Provider
      value={{
        auth,
        loginUser: auth?.login || null,
        token: auth?.token || null,
        admin: auth?.admin || false,
        privileges: auth?.privileges || [],
        etapes: auth?.etapes || [],
        verifierHabilitation,
        agent: auth?.agent || null,
        isAuthenticated,
        loading,
        login,
        loginWithBadge,
        logout,
        hasPrivilege,
        hasAnyPrivilege,
        hasAllPrivileges
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit être utilisé à l'intérieur de AuthProvider");
  }
  return context;
}