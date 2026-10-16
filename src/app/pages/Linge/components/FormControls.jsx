import React from "react";

// ═══════════════════════════════════════════════════════════════════════════
// 🎨 HELPERS DE DESIGN — Sections & Champs de formulaire
// ═══════════════════════════════════════════════════════════════════════════
export function FormSection({ icon, title, subtitle, accent = "#0ea5e9", children }) {
  return (
    <div style={{
      padding: "16px",
      borderRadius: "16px",
      background: "linear-gradient(135deg, #fafbfc 0%, #ffffff 100%)",
      border: "1px solid #f1f5f9",
      marginBottom: "16px"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
        <div style={{
          width: "32px", height: "32px", borderRadius: "9px",
          background: `${accent}15`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: accent, flexShrink: 0
        }}>
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: "13px", fontWeight: 800, color: "#0f172a",
            letterSpacing: "-0.01em", lineHeight: 1.2
          }}>
            {title}
          </div>
          {subtitle && (
            <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px", fontWeight: 500 }}>
              {subtitle}
            </div>
          )}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {children}
      </div>
    </div>
  );
}

export function FormField({ label, required, hint, icon, children }) {
  return (
    <div>
      <label style={{
        display: "flex", alignItems: "center", gap: "6px",
        fontSize: "11px", fontWeight: 700, color: "#475569",
        marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.4px"
      }}>
        {icon && <span style={{ color: "#94a3b8", display: "flex" }}>{icon}</span>}
        <span>{label}</span>
        {required && (
          <span style={{
            color: "#ef4444", fontSize: "14px", lineHeight: 1,
            marginLeft: "2px"
          }}>*</span>
        )}
      </label>
      {children}
      {hint && (
        <p style={{
          fontSize: "11px", color: "#94a3b8", margin: "5px 0 0",
          display: "flex", alignItems: "flex-start", gap: "4px", lineHeight: 1.4
        }}>
          <span style={{ flexShrink: 0 }}>💡</span>
          <span>{hint}</span>
        </p>
      )}
    </div>
  );
}

export function ModernInput({ value, onChange, placeholder, type = "text", disabled, required, step, min, autoFocus }) {
  const [focused, setFocused] = React.useState(false);
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      step={step}
      min={min}
      autoFocus={autoFocus}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        width: "100%",
        height: "42px",
        padding: "0 14px",
        borderRadius: "12px",
        border: `1.5px solid ${focused ? "#0ea5e9" : "#e2e8f0"}`,
        background: disabled ? "#f8fafc" : "white",
        fontSize: "13px",
        fontWeight: 500,
        color: "#0f172a",
        outline: "none",
        transition: "all 0.2s ease",
        boxShadow: focused ? "0 0 0 4px rgba(14,165,233,0.12)" : "0 1px 2px rgba(0,0,0,0.03)",
        boxSizing: "border-box",
        cursor: disabled ? "not-allowed" : "text"
      }}
    />
  );
}

export function ModernSelect({ value, onChange, disabled, required, children }) {
  const [focused, setFocused] = React.useState(false);
  return (
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      required={required}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        width: "100%",
        height: "42px",
        padding: "0 36px 0 14px",
        borderRadius: "12px",
        border: `1.5px solid ${focused ? "#0ea5e9" : "#e2e8f0"}`,
        background: disabled ? "#f8fafc" : "white",
        fontSize: "13px",
        fontWeight: 500,
        color: "#0f172a",
        outline: "none",
        transition: "all 0.2s ease",
        boxShadow: focused ? "0 0 0 4px rgba(14,165,233,0.12)" : "0 1px 2px rgba(0,0,0,0.03)",
        boxSizing: "border-box",
        cursor: disabled ? "not-allowed" : "pointer",
        appearance: "none",
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 14px center"
      }}
    >
      {children}
    </select>
  );
}

export function ModernTextarea({ value, onChange, placeholder }) {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{
        width: "100%",
        minHeight: "80px",
        padding: "12px 14px",
        borderRadius: "12px",
        border: "1.5px solid #e2e8f0",
        background: "white",
        fontSize: "13px",
        fontWeight: 500,
        color: "#0f172a",
        outline: "none",
        resize: "vertical",
        fontFamily: "inherit",
        transition: "all 0.2s ease",
        boxSizing: "border-box"
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = "#0ea5e9";
        e.currentTarget.style.boxShadow = "0 0 0 4px rgba(14,165,233,0.12)";
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = "#e2e8f0";
        e.currentTarget.style.boxShadow = "none";
      }}
    />
  );
}

// Barre d'actions en bas des modales
export function ModalActions({ children }) {
  return (
    <div style={{
      display: "flex", gap: "10px", marginTop: "20px",
      paddingTop: "18px", borderTop: "1px solid #f1f5f9"
    }}>
      {children}
    </div>
  );
}
