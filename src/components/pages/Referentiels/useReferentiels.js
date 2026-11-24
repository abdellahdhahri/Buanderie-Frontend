import { useTranslation } from "react-i18next";
import { useAuth } from "../../../constants/AuthContext";
import { NAV_ITEMS, filterNavByPrivileges, filtrerParEtapes } from "../../../constants/navigation";
import { useEtapes } from "../../../hooks/useEtapes";

export const CHEMIN_HUB_REFERENTIELS = "/referentiels";

export function useReferentiels() {
  const { t } = useTranslation();
  const { privileges = [] } = useAuth();
  const { estActive } = useEtapes();
  const groupe = filterNavByPrivileges(filtrerParEtapes(NAV_ITEMS, estActive), privileges).find((i) => i.id === "params");
  const items = (groupe?.children || [])
    .filter((c) => c.path && c.path !== CHEMIN_HUB_REFERENTIELS)
    .map((c) => ({ ...c, titre: t(`navigation.${c.label}`, c.label) }));
  return { items, titreGroupe: groupe ? t(`navigation.${groupe.id}`, groupe.label) : "" };
}
