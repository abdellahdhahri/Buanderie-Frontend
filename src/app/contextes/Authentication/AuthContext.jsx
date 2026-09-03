import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

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
        agent: loginResponse.agent || null
      };

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
      console.log("la reponse est :",loginResponse)

      if (!loginResponse?.token) {
        throw new Error("Le serveur n'a pas retourné de JWT");
      }

      const authData = {
        token: loginResponse.token,
        login: loginResponse.login || "Utilisateur badge",
        admin: loginResponse.administrateur === true,
        privileges: Array.isArray(loginResponse.privileges) ? loginResponse.privileges : [],
        agent: loginResponse.user || null
      };

      localStorage.setItem("auth", JSON.stringify(authData));
      setAuth(authData);
      window.dispatchEvent(new Event("authChanged"));

      return authData;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setAuth(null);
    localStorage.removeItem("auth");
    localStorage.removeItem("agent");
    window.dispatchEvent(new Event("authChanged"));
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

  const isAuthenticated = !!auth?.token;

  return (
    <AuthContext.Provider
      value={{
        auth,
        loginUser: auth?.login || null,
        token: auth?.token || null,
        admin: auth?.admin || false,
        privileges: auth?.privileges || [],
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