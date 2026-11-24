import React from "react";
import { useNavigate } from "react-router-dom";
import { ShieldOff, LogOut } from "lucide-react";
import { useAuth } from "../../../constants/AuthContext";
import "./Login.css";

export default function AucunAcces() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const deconnecter = async () => {
    await logout();
    navigate("/auth", { replace: true });
  };

  return (
    <div className="login-page">
      <div className="login-overlay-content">
        <div className="login-card" style={{ textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16, color: "#dc2626" }}>
            <ShieldOff size={48} />
          </div>
          <h2 className="login-card__title">Aucun accès</h2>
          <p className="login-card__subtitle">
            Votre compte n'a aucun droit d'accès au module Buanderie.
          </p>
          <button type="button" className="login-form__submit" style={{ marginTop: 22 }} onClick={deconnecter}>
            <LogOut size={16} style={{ marginRight: 8 }} /> Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
}
