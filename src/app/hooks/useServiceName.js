import { useContext } from "react";
import { useTranslation } from "react-i18next";
import { ServiceContext } from "../contextes/ServiceContext";

/** Renvoie une fonction serviceId → nom du service (liste déjà chargée par l'application). */
export function useServiceName() {
  const { t } = useTranslation();
  const { services } = useContext(ServiceContext) || {};
  return (serviceId) => {
    if (serviceId == null) return null;
    const s = (services || []).find((x) => String(x.id) === String(serviceId));
    return s?.nom || s?.code || `${t("remise.service")} ${serviceId}`;
  };
}
