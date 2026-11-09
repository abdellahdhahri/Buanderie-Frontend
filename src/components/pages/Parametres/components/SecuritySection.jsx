import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { KeyRound, Check, LogOut, MonitorSmartphone } from "lucide-react";
import { Button } from "../../../ui/button";
import { useAuth } from "../../../../constants/AuthContext";
import { SettingsCard, PasswordField } from "./SettingsUI";

const EMPTY = { current: "", next: "", confirm: "" };

const RULES = [
  { id: "length", key: "settings.security.rule_length", fallback: "8 caractères minimum", test: (p) => p.length >= 8 },
  { id: "upper", key: "settings.security.rule_upper", fallback: "Une majuscule", test: (p) => /[A-Z]/.test(p) },
  { id: "digit", key: "settings.security.rule_digit", fallback: "Un chiffre", test: (p) => /\d/.test(p) },
  { id: "special", key: "settings.security.rule_special", fallback: "Un caractère spécial", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

const STRENGTH = [
  { key: "settings.security.strength_weak", fallback: "Faible", bar: "bg-red-500", text: "text-red-600" },
  { key: "settings.security.strength_fair", fallback: "Moyen", bar: "bg-amber-500", text: "text-amber-600" },
  { key: "settings.security.strength_good", fallback: "Bon", bar: "bg-teal-500", text: "text-teal-600" },
  { key: "settings.security.strength_strong", fallback: "Excellent", bar: "bg-emerald-600", text: "text-emerald-700" },
];

export function SecuritySection() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { loginUser, logout } = useAuth();
  const [form, setForm] = useState(EMPTY);
  const set = (field) => (value) => setForm((f) => ({ ...f, [field]: value }));

  const passed = useMemo(() => RULES.filter((r) => r.test(form.next)).length, [form.next]);
  const strength = form.next ? STRENGTH[Math.max(passed - 1, 0)] : null;
  const confirmMismatch = form.confirm.length > 0 && form.confirm !== form.next;
  const sameAsCurrent = form.next.length > 0 && form.next === form.current;
  const canSubmit = form.current && passed === RULES.length && form.confirm === form.next && !sameAsCurrent;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    toast.info(t("settings.security.not_connected", "Formulaire valide. L'enregistrement sera relié au serveur prochainement."));
    setForm(EMPTY);
  };

  const handleLogout = () => {
    logout();
    navigate("/process");
  };

  return (
    <div className="flex flex-col gap-5">
      <form onSubmit={handleSubmit}>
        <SettingsCard
          icon={<KeyRound className="h-[17px] w-[17px]" />}
          title={t("settings.security.password_title", "Mot de passe")}
          description={t("settings.security.password_desc", "Choisissez un mot de passe robuste que vous n'utilisez nulle part ailleurs.")}
          footer={
            <>
              <Button type="button" variant="outline" onClick={() => setForm(EMPTY)} disabled={!form.current && !form.next && !form.confirm}>
                {t("common.cancel", "Annuler")}
              </Button>
              <Button type="submit" disabled={!canSubmit}>
                {t("settings.security.update_password", "Mettre à jour")}
              </Button>
            </>
          }
        >
          <div className="grid grid-cols-1 gap-x-8 gap-y-5 lg:grid-cols-[minmax(0,1fr)_240px]">
            <div className="flex flex-col gap-4">
              <PasswordField
                label={t("settings.security.current", "Mot de passe actuel")}
                value={form.current}
                onChange={set("current")}
                autoComplete="current-password"
              />
              <div className="flex flex-col gap-2">
                <PasswordField
                  label={t("settings.security.new", "Nouveau mot de passe")}
                  value={form.next}
                  onChange={set("next")}
                  autoComplete="new-password"
                  invalid={sameAsCurrent}
                />
                <div className="flex items-center gap-3">
                  <div className="grid flex-1 grid-cols-4 gap-1.5">
                    {STRENGTH.map((_, i) => (
                      <span
                        key={i}
                        className={`h-1.5 rounded-full transition-colors duration-200 ${
                          strength && i < passed ? strength.bar : "bg-slate-100 dark:bg-white/10"
                        }`}
                      />
                    ))}
                  </div>
                  <span className={`w-16 text-right text-[12px] font-semibold ${strength ? strength.text : "text-slate-400"}`}>
                    {strength ? t(strength.key, strength.fallback) : "—"}
                  </span>
                </div>
                {sameAsCurrent && (
                  <p className="m-0 text-[12px] text-red-600">
                    {t("settings.security.same_as_current", "Le nouveau mot de passe doit être différent de l'actuel.")}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <PasswordField
                  label={t("settings.security.confirm", "Confirmer le nouveau mot de passe")}
                  value={form.confirm}
                  onChange={set("confirm")}
                  autoComplete="new-password"
                  invalid={confirmMismatch}
                />
                {confirmMismatch && (
                  <p className="m-0 text-[12px] text-red-600">
                    {t("settings.security.mismatch", "Les mots de passe ne correspondent pas.")}
                  </p>
                )}
              </div>
            </div>

            <div className="h-fit rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-border dark:bg-white/5">
              <p className="m-0 mb-3 text-[12.5px] font-semibold text-slate-700 dark:text-foreground">
                {t("settings.security.rules_title", "Votre mot de passe doit contenir")}
              </p>
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {RULES.map((rule) => {
                  const ok = rule.test(form.next);
                  return (
                    <li key={rule.id} className={`flex items-center gap-2 text-[12.5px] transition-colors ${ok ? "text-teal-700 dark:text-teal-300" : "text-slate-500"}`}>
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition-colors ${
                          ok ? "bg-teal-600 text-white" : "bg-white ring-1 ring-slate-200 dark:bg-transparent dark:ring-white/20"
                        }`}
                      >
                        {ok && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
                      </span>
                      {t(rule.key, rule.fallback)}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </SettingsCard>
      </form>

      <SettingsCard
        icon={<MonitorSmartphone className="h-[17px] w-[17px]" />}
        title={t("settings.security.session_title", "Session")}
        description={t("settings.security.session_desc", "Appareil actuellement connecté à votre compte.")}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            <div>
              <p className="m-0 text-[13.5px] font-medium text-slate-800 dark:text-foreground">
                {t("settings.security.this_device", "Cet appareil")}
              </p>
              <p className="m-0 text-[12.5px] text-slate-500 dark:text-muted-foreground">
                {t("settings.security.connected_as", "Connecté en tant que {{login}}", { login: loginUser || "—" })}
              </p>
            </div>
          </div>
          <Button type="button" variant="outline" onClick={handleLogout} className="text-red-600 hover:text-red-700">
            <LogOut className="h-4 w-4" />
            {t("settings.security.logout", "Se déconnecter")}
          </Button>
        </div>
      </SettingsCard>
    </div>
  );
}
