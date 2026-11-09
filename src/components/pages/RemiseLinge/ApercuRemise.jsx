import React from "react";
import { useTranslation } from "react-i18next";
import { Check, CircleCheck, LoaderCircle, TriangleAlert, UserRoundX } from "lucide-react";
import { formatDate } from "../../../services/remiseLingeService";
import { useServiceName } from "../../../hooks/useServiceName";
import { CategoryBar, CategoryChips } from "../StockageArsenal/arsenalUi";

export function CollectesConcernees({ collectes, title }) {
  const { t } = useTranslation();
  return (
    <div>
      <div className="sa-subhead">
        {title || t("remise.collectes_concernees")}
        <span className="sa-count">{collectes.length}</span>
      </div>
      {collectes.length === 0 ? (
        <div className="rl-empty-ok">✓ {t("remise.all_collectes_closed")}</div>
      ) : (
        <div className="rl-colls">
          {collectes.map((c, i) => (
            <div key={c.collecteId} className="rl-coll">
              <div style={{ minWidth: 0 }}>
                <div className="rl-coll__num">{c.numeroCollecte || `#${c.collecteId}`}</div>
                <div className="rl-coll__meta">
                  {c.codeChambre ? `${t("remise.room")} ${c.codeChambre} · ` : ""}
                  {formatDate(c.dateCollecte)}
                  {i === 0 && collectes.length > 1 && <span className="rl-coll__first">{t("remise.oldest")}</span>}
                </div>
              </div>
              <CategoryChips counts={c.resteParCategorie} size="sm" />
              <div className="rl-coll__rest">
                <strong>{c.totalReste}</strong>
                <small>{t("remise.remaining")}</small>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ApercuRemise({ apercu, agentCollecte, serviceChoisi, onChoisirService, onCreer, onChangerAgent, loading }) {
  const { t } = useTranslation();
  const serviceName = useServiceName();

  if (!apercu.nbCollectes) {
    return (
      <div className="sa-banner is-warning" style={{ alignItems: "flex-start" }}>
        <span className="sa-banner__icon" style={{ marginTop: 2 }}><TriangleAlert size={18} /></span>
        <div style={{ flex: 1 }}>
          <strong>{t("remise.no_open_collecte_title")}</strong>
          <span>{t("remise.no_open_collecte_text", { agent: agentCollecte?.nomPrenom || agentCollecte?.nom || "" })}</span>
          <div style={{ marginTop: 12 }}>
            <button type="button" className="sa-btn sa-btn--sm" onClick={onChangerAgent}>
              <UserRoundX size={14} /> {t("remise.other_collection_agent")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const plusieurs = apercu.services.length > 1;
  const service = apercu.services.find((s) => s.serviceId === serviceChoisi) || null;
  const collectes = service ? apercu.collectes.filter((c) => c.serviceId === service.serviceId) : apercu.collectes;

  return (
    <div>
      {plusieurs && (
        <div style={{ marginBottom: 18 }}>
          <div className="sa-subhead" style={{ marginTop: 0 }}>{t("remise.choose_service")}</div>
          <p className="sa-hint" style={{ margin: "-4px 0 10px" }}>{t("remise.choose_service_hint", { count: apercu.services.length })}</p>
          <div className="rl-services">
            {apercu.services.map((s) => {
              const actif = s.serviceId === serviceChoisi;
              const nb = apercu.collectes.filter((c) => c.serviceId === s.serviceId).length;
              return (
                <button key={s.serviceId} type="button" className={`rl-svc ${actif ? "is-active" : ""}`} onClick={() => onChoisirService(s.serviceId)} aria-pressed={actif}>
                  <span className="rl-svc__check"><Check size={12} strokeWidth={3} /></span>
                  <span className="rl-svc__name">{serviceName(s.serviceId)}</span>
                  <span className="rl-svc__meta">{t("remise.n_collectes", { count: nb })}</span>
                  <span className="rl-svc__total">{s.totalReste}<small>{t("remise.to_deliver")}</small></span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {service ? (
        <div className="rl-total">
          <div className="rl-total__head">
            <div>
              <div className="rl-total__label">{t("remise.total_to_deliver")}</div>
              <div className="rl-total__ctx">{serviceName(service.serviceId)} · {t("remise.n_collectes", { count: collectes.length })}</div>
            </div>
            <div className="rl-total__value">{service.totalReste}<small>{t("remise.linens")}</small></div>
          </div>
          <CategoryBar counts={service.resteParCategorie} />
          <CategoryChips counts={service.resteParCategorie} />
        </div>
      ) : (
        <div className="rl-empty-ok" style={{ background: "var(--sa-surface-2)", color: "var(--sa-muted)", borderColor: "var(--sa-border)" }}>
          {t("remise.select_service_first")}
        </div>
      )}

      <CollectesConcernees collectes={collectes} />

      <div className="sa-stage__foot">
        <button type="button" className="sa-btn sa-btn--ghost" onClick={onChangerAgent} disabled={loading}>
          <UserRoundX size={16} /> {t("remise.other_collection_agent")}
        </button>
        <button type="button" className="sa-btn sa-btn--primary" onClick={onCreer} disabled={loading || !service}>
          {loading ? <LoaderCircle size={16} className="animate-spin" /> : <CircleCheck size={16} />}
          {service ? t("remise.create_delivery_n", { count: service.totalReste }) : t("remise.create_delivery")}
        </button>
      </div>
    </div>
  );
}
