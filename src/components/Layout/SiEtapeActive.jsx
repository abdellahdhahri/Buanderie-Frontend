import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PauseCircle, ArrowLeft, Workflow } from "lucide-react";
import { useEtapes } from "../../hooks/useEtapes";
import { Page } from "../kit";

function EtapeDesactivee({ titre, message }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  return (
    <Page>
      <div className="kit-step-off">
        <span className="kit-step-off__icon"><PauseCircle size={34} strokeWidth={1.8} /></span>
        <span className="kit-step-off__eyebrow"><Workflow size={13} /> {t("parcours.title", "Parcours du linge")}</span>
        <h2>{titre}</h2>
        <p>{message}</p>
        <button type="button" className="kit-step-off__btn" onClick={() => navigate("/")}>
          <ArrowLeft size={15} /> {t("common.back_home", "Retour au tableau de bord")}
        </button>
      </div>
    </Page>
  );
}

export function SiEtapeActive({ code, children }) {
  const { t } = useTranslation();
  const { estActive, nomEtape } = useEtapes();
  if (estActive(code)) return children;
  const nom = nomEtape(code);
  return (
    <EtapeDesactivee
      titre={t("parcours.step_disabled_title", "Étape {{nom}} désactivée", { nom })}
      message={t("parcours.step_disabled", "L'étape {{nom}} est désactivée pour cet établissement.", { nom })}
    />
  );
}

export function SiEtapeInactive({ code, children }) {
  const { t } = useTranslation();
  const { estActive, nomEtape } = useEtapes();
  if (!estActive(code)) return children;
  const nom = nomEtape(code);
  return (
    <EtapeDesactivee
      titre={t("parcours.screen_unavailable", "Écran indisponible")}
      message={t("parcours.only_when_inactive", "Cet écran n'est utilisé que lorsque l'étape {{nom}} est désactivée.", { nom })}
    />
  );
}
