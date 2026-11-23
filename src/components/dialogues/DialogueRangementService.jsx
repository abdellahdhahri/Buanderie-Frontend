import React, { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Archive, Building2, CircleCheck } from "lucide-react";
import { ServiceContext } from "../../contextes/ServiceContext";
import { fetchServiceById } from "../../services/historiqueCollecteService";
import { accentOf } from "../pages/StockageArsenal/arsenalUtils";
import { Modal, Button } from "../kit";
import "./DialogueRangementService.css";

const DUREE = 6;

const serviceLabel = (s) => s?.code || s?.nom || s?.designation || s?.libelle || null;

export default function DialogueRangementService({ item, onClose }) {
  const { t } = useTranslation();
  const { getServiceById } = useContext(ServiceContext) || {};
  const [fetched, setFetched] = useState(null);
  const [timeLeft, setTimeLeft] = useState(DUREE);
  const [paused, setPaused] = useState(false);

  const serviceId = item?.serviceId ?? item?.service?.id ?? null;
  const known = item?.serviceNom || serviceLabel(item?.service) || serviceLabel(getServiceById?.(serviceId)) ||
    (fetched?.id === serviceId ? fetched.nom : null);

  useEffect(() => {
    if (known || serviceId == null) return undefined;
    let cancelled = false;
    fetchServiceById(serviceId)
      .then((s) => !cancelled && setFetched({ id: serviceId, nom: serviceLabel(s) }))
      .catch(() => {});
    return () => { cancelled = true; };
  }, [known, serviceId]);

  useEffect(() => {
    if (paused) return undefined;
    const id = setInterval(() => setTimeLeft((s) => Math.max(s - 0.1, 0)), 100);
    return () => clearInterval(id);
  }, [paused]);

  useEffect(() => {
    if (timeLeft <= 0) onClose();
  }, [timeLeft, onClose]);

  useEffect(() => {
    const onKey = (e) => (e.key === "Escape" || e.key === "Enter") && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!item) return null;

  const service = known || (serviceId != null ? `${t("dialogue_rangement.service")} ${serviceId}` : null);
  const categorie = item.categorie;
  const code = item.codeBarre || item.codeSuivi;

  return (
    <Modal
      size="sm"
      icon={<Archive size={22} />}
      title={t("dialogue_rangement.title")}
      subtitle={t("dialogue_rangement.badge")}
      onClose={onClose}
      className="drs"
      footer={(
        <>
          <span className="drs-timer" aria-hidden="true"><i style={{ width: `${(timeLeft / DUREE) * 100}%` }} /></span>
          <Button icon={<CircleCheck size={16} />} onClick={onClose}>
            {t("dialogue_rangement.done")} ({Math.ceil(timeLeft)})
          </Button>
        </>
      )}
    >
      <div className="drs-body" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
        <div className="drs-shelf">
          <span className="drs-shelf__icon"><Building2 size={22} /></span>
          <div>
            <small>{t("dialogue_rangement.shelf_of")}</small>
            <strong>{service || t("dialogue_rangement.unknown_service")}</strong>
          </div>
        </div>

        <dl className="drs-info">
          <div>
            <dt>{t("dialogue_pliage.code", "Code")}</dt>
            <dd><code>{code || "—"}</code></dd>
          </div>
          <div>
            <dt>{t("dialogue_pliage.category", "Catégorie")}</dt>
            <dd>
              {categorie ? (
                <span className="drs-cat" style={{ "--c": accentOf(categorie) }}>
                  <i aria-hidden="true" />{t(`categories.${categorie}`, categorie)}
                </span>
              ) : "—"}
            </dd>
          </div>
        </dl>
      </div>
    </Modal>
  );
}
