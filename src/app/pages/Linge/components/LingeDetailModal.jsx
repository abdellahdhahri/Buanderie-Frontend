import React from "react";
import { useTranslation } from "react-i18next";
import { Barcode, Tag, Clock, Building2, User as UserIcon, Repeat, Weight, Truck } from "lucide-react";
import { DetailModal } from "../../../components/ui/modal-kit";
import { getCategorieMeta } from "../../../constants/categoriesLinge";
import { EtatBadge } from "./EtatBadge";
import { formatDateTime } from "../../../utils/appSettings";

// ═══════════════════════════════════════════════════════════════════════════
// 👁️ FICHE DÉTAIL D'UN LINGE — blocs repliables du kit de modales
// ═══════════════════════════════════════════════════════════════════════════
export function LingeDetailModal({ linge, onClose, onEdit, getServiceName, getPorteurName }) {
  const { t } = useTranslation();
  if (!linge) return <DetailModal isOpen={false} onClose={onClose} />;

  const { Icon: CatIcon, accent: catAccent } = getCategorieMeta(linge.categorie);

  return (
    <DetailModal
      isOpen={!!linge}
      onClose={onClose}
      title={t('linge.details')}
      subtitle={`#${linge.id}`}
      heading={linge.codebarre}
      badges={
        <>
          <EtatBadge etat={linge.etat} />
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold"
            style={{ background: `${catAccent}14`, color: catAccent }}
          >
            <CatIcon className="h-3.5 w-3.5" />
            {t(`categories.${linge.categorie}`, linge.categorie)}
          </span>
        </>
      }
      metrics={[
        { label: t('linge.weight'), value: linge.poids != null ? `${linge.poids} kg` : null },
        { label: t('linge.life_cycles'), value: linge.dureVie ?? null },
      ]}
      sections={[
        {
          title: t('linge.sections.identification', 'Identification'),
          description: t('linge.sections.identification_hint', 'Code-barres et tag RFID'),
          icon: "id",
          items: [
            { label: t('linge.tracking_code'), value: linge.codebarre, icon: <Barcode />, mono: true },
            { label: "RFID", value: linge.rfidTag || null, icon: <Tag />, mono: !!linge.rfidTag },
          ],
        },
        {
          title: t('linge.sections.characteristics', 'Caractéristiques'),
          description: t('linge.sections.characteristics_hint', 'Catégorie, poids et durée de vie'),
          icon: "specs",
          items: [
            {
              label: t('linge.category'),
              icon: <CatIcon />,
              render: t(`categories.${linge.categorie}`, linge.categorie),
            },
            { label: t('linge.weight'), value: linge.poids != null ? `${linge.poids} kg` : null, icon: <Weight /> },
            { label: t('linge.life_cycles'), value: linge.dureVie ? `${linge.dureVie} ${t('common.cycles')}` : null, icon: <Repeat /> },
            { label: t('linge.collection_type'), value: linge.typeCollecte, icon: <Truck />, hidden: !linge.typeCollecte },
          ],
        },
        {
          title: t('linge.sections.assignment', 'Affectation'),
          description: t('linge.sections.assignment_hint', 'Service et porteur'),
          icon: "people",
          items: [
            { label: t('linge.service'), value: getServiceName(linge.serviceId), icon: <Building2 /> },
            {
              label: t('linge.carrier'),
              value: linge.porteurNom || (linge.porteurId ? getPorteurName(linge.porteurId) : null),
              icon: <UserIcon />,
              hidden: !linge.porteurId && !linge.porteurNom,
            },
          ],
        },
        {
          title: t('linge.sections.tracking', 'Suivi'),
          icon: "dates",
          items: [
            {
              label: t('common.creation_date'),
              value: linge.dateCreation ? formatDateTime(linge.dateCreation) : null,
              icon: <Clock />,
              hidden: !linge.dateCreation,
            },
          ],
        },
        {
          title: t('linge.observations'),
          icon: "notes",
          items: [
            { label: t('linge.observations'), value: linge.observations, span: 2, hidden: !linge.observations },
          ],
        },
      ]}
      onEdit={() => onEdit(linge)}
    />
  );
}
