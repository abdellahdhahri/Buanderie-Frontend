import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export function SettingsCard({ icon, title, description, children, footer }) {
  return (
    <section className="param-section">
      <h4 className="section-heading">
        {icon && <span className="param-section__icon">{icon}</span>}
        {title}
      </h4>
      {description && <p className="param-section__desc">{description}</p>}
      <div className="param-section__body">{children}</div>
      {footer && <footer className="param-section__footer">{footer}</footer>}
    </section>
  );
}

export function SettingRow({ label, hint, children }) {
  return (
    <div className="param-row">
      <div className="param-row__text">
        <p className="param-row__label">{label}</p>
        {hint && <p className="param-row__hint">{hint}</p>}
      </div>
      <div className="param-row__control">{children}</div>
    </div>
  );
}

export function InfoField({ label, value, full, mono }) {
  return (
    <div className={`info-field${full ? " full-width" : ""}`}>
      <label>{label}</label>
      <div className={`field-value${mono ? " monospace" : ""}`}>{value || "—"}</div>
    </div>
  );
}

export function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`param-switch${checked ? " is-on" : ""}`}
    >
      <span />
    </button>
  );
}

export function PasswordField({ label, value, onChange, autoComplete, placeholder, invalid }) {
  const [visible, setVisible] = useState(false);
  return (
    <label className="param-field">
      <span className="param-field__label">{label}</span>
      <span className="param-field__wrap">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className={`param-input${invalid ? " is-invalid" : ""}`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Masquer" : "Afficher"}
          className="param-field__eye"
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </span>
    </label>
  );
}

export function ChoiceCard({ selected, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`param-choice${selected ? " is-selected" : ""}`}
    >
      {children}
    </button>
  );
}
