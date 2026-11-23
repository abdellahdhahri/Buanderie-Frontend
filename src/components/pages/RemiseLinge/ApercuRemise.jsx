import React from "react";
import { useTranslation } from "react-i18next";
import { Building2, Check, ClipboardList, LoaderCircle, UserRoundX } from "lucide-react";
import { formatDate } from "../../../services/remiseLingeService";
import { useServiceName } from "../../../hooks/useServiceName";
import { accentOf } from "../StockageArsenal/arsenalUtils";
import { LigneCollecte, BoutonIcone } from "../Collecte/shared/CollecteRc";

export function ChipsCategories({ counts }) {
  const { t } = useTranslation();
  const entries = Object.entries(counts || {}).filter(([, v]) => v > 0);
  if (!entries.length) return null;
  return (
    <span className="rl-chips">
      {entries.map(([categorie, qte]) => (
        <span key={categorie} className="rc-chip" style={{ "--c": accentOf(categorie) }}>
          <i /> {t(`categories.${categorie}`, categorie)} <b>{qte}</b>
        </span>
      ))}
    </span>
  );
}

export function BarreCategories({ counts }) {
  const entries = Object.entries(counts || {}).filter(([, v]) => v > 0);
  return (
    <div className="rc-dist__bar" aria-hidden="true">
      {entries.map(([categorie, qte]) => (
        <span key={categorie} style={{ flexGrow: qte, background: accentOf(categorie) }} />
      ))}
    </div>
  );
}

export function CollectesConcernees({ collectes, title }) {
  const { t } = useTranslation();
  return (
    <section className="rc-card">
      <div className="rc-card__head">
        <h3 className="rc-card__title"><ClipboardList size={15} /> {title || t("remise.collectes_concernees")}</h3>
        <span className="rc-count">{collectes.length}</span>
      </div>
      {collectes.length === 0 ? (
        <div className="lit-group__empty" style={{ padding: 16 }}><Check size={16} strokeWidth={3} /> {t("remise.all_collectes_closed")}</div>
      ) : (
        <div className="cl-list">
          {collectes.map((c, i) => (
            <LigneCollecte
              key={c.collecteId}
              icone={<ClipboardList size={18} strokeWidth={2} />}
              titre={c.numeroCollecte || `#${c.collecteId}`}
              tags={i === 0 && collectes.length > 1 ? <span className="cl-line__tag cl-line__tag--info">{t("remise.oldest")}</span> : null}
              code={`${c.codeChambre ? `${t("remise.room")} ${c.codeChambre} · ` : ""}${formatDate(c.dateCollecte)}`}
              etat={<ChipsCategories counts={c.resteParCategorie} />}
              actions={<span className="rl-reste"><strong>{c.totalReste}</strong><small>{t("remise.remaining")}</small></span>}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default function ApercuRemise({ apercu, agentCollecte, serviceChoisi, onChoisirService, onCreer, onChangerAgent, loading }) {
  const { t } = useTranslation();
  const serviceName = useServiceName();

  if (!apercu.nbCollectes) {
    return (
      <div className="cc-alert" style={{ alignItems: "flex-start" }}>
        <UserRoundX size={18} />
        <div style={{ flex: 1 }}>
          <strong>{t("remise.no_open_collecte_title")}</strong>
          <div style={{ fontWeight: 500, marginTop: 2 }}>{t("remise.no_open_collecte_text", { agent: agentCollecte?.nomPrenom || agentCollecte?.nom || "" })}</div>
          <button type="button" className="rc-btn rc-btn--sm" style={{ marginTop: 10 }} onClick={onChangerAgent}>
            <UserRoundX size={14} /> {t("remise.other_collection_agent")}
          </button>
        </div>
      </div>
    );
  }

  const plusieurs = apercu.services.length > 1;
  const service = apercu.services.find((s) => s.serviceId === serviceChoisi) || null;
  const collectes = service ? apercu.collectes.filter((c) => c.serviceId === service.serviceId) : apercu.collectes;

  return (
    <>
      {plusieurs && (
        <section className="rc-card">
          <div className="rc-card__head">
            <h3 className="rc-card__title"><Building2 size={15} /> {t("remise.choose_service")}</h3>
            <span className="rc-count">{apercu.services.length}</span>
          </div>
          <div className="cl-list">
            {apercu.services.map((s) => {
              const actif = s.serviceId === serviceChoisi;
              const nb = apercu.collectes.filter((c) => c.serviceId === s.serviceId).length;
              return (
                <LigneCollecte
                  key={s.serviceId}
                  icone={<Building2 size={18} strokeWidth={2} />}
                  titre={serviceName(s.serviceId)}
                  code={t("remise.n_collectes", { count: nb })}
                  active={actif}
                  onClick={() => onChoisirService(s.serviceId)}
                  etat={<ChipsCategories counts={s.resteParCategorie} />}
                  actions={(
                    <span className="rl-reste"><strong>{s.totalReste}</strong><small>{t("remise.to_deliver")}</small></span>
                  )}
                />
              );
            })}
          </div>
        </section>
      )}

      {service ? (
        <section className="rc-card rc-ticket">
          <div className="rc-ticket__banner">
            <strong>{t("remise.total_to_deliver")}</strong>
            <span>{serviceName(service.serviceId)} · {t("remise.n_collectes", { count: collectes.length })}</span>
          </div>
          <div className="rl-total">
            <div className="rl-total__value">{service.totalReste}<small>{t("remise.linens")}</small></div>
            <div className="rl-total__detail">
              <BarreCategories counts={service.resteParCategorie} />
              <ChipsCategories counts={service.resteParCategorie} />
            </div>
          </div>
        </section>
      ) : (
        <div className="cc-alert is-info"><span>{t("remise.select_service_first")}</span></div>
      )}

      <CollectesConcernees collectes={collectes} />

      <div className="cl-actions rl-foot">
        <button type="button" className="rc-btn" onClick={onChangerAgent} disabled={loading}>
          <UserRoundX size={15} /> {t("remise.other_collection_agent")}
        </button>
        <button type="button" className="rc-btn rc-btn--primary rc-btn--lg" onClick={onCreer} disabled={loading || !service}>
          {loading ? <LoaderCircle size={16} className="animate-spin" /> : <Check size={16} strokeWidth={3} />}
          {service ? t("remise.create_delivery_n", { count: service.totalReste }) : t("remise.create_delivery")}
        </button>
      </div>
    </>
  );
}
