import React, { useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Check,
  CircleCheck,
  Flag,
  History,
  Hourglass,
  LoaderCircle,
  Package,
  PackageCheck,
  PackagePlus,
  RefreshCw,
  RotateCcw,
  TriangleAlert,
  Truck,
  User,
  Users,
  ScanBarcode,
  Undo2,
} from "lucide-react";
import ScanInput from "../../utils/shared/ScanInput";
import { RemiseLingeProvider, useRemiseLinge } from "../../../contextes/RemiseLingeContext";
import { formatDate, getRemiseStatutConfig } from "../../../services/remiseLingeService";
import { useServiceName } from "../../../hooks/useServiceName";
import ApercuRemise, { CollectesConcernees } from "./ApercuRemise";
import { accentOf } from "../StockageArsenal/arsenalUtils";
import { Illustration } from "../StockageArsenal/illustrations";
import "../Linge/WorkflowList.css";
import "../StockageArsenal/StockageArsenal.css";
import "./RemiseLinge.css";

import { PageHeaderIcon } from "../../Layout/PageHeaderIcon";
import {
  Page, PageHeader, ActionBar, ActionButton, DataTable, Code, Badge, VueSwitch, useVue, RowActions, RowButton, ConfirmDialog,
} from "../../kit";

function Meter({ value, label }) {
  const pct = Math.min(Math.max(value, 0), 100);
  return (
    <div className="sa-meter" style={{ marginBottom: 18 }}>
      <div className="sa-meter__row">
        <span>{label}</span>
        <strong>{pct} %</strong>
      </div>
      <div className="sa-meter__bar">
        <span style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Kpi({ label, value, sub, Icon, color }) {
  return (
    <div className="rl-kpi" style={color ? { "--k": color } : undefined}>
      <div className="rl-kpi__top">
        <span className="rl-kpi__label">{label}</span>
        <span className="rl-kpi__icon"><Icon size={16} /></span>
      </div>
      <div className="rl-kpi__value">{value}</div>
      {sub && <div className="rl-kpi__sub">{sub}</div>}
    </div>
  );
}

function CategorieRow({ categorie, collecte, livre, reste }) {
  const { t } = useTranslation();
  const isComplete = reste === 0 && collecte > 0;
  const pct = collecte > 0 ? Math.round((livre / collecte) * 100) : 0;
  return (
    <div className={`rl-cat ${isComplete ? "is-done" : ""}`} style={{ "--c": accentOf(categorie) }}>
      <span className="rl-cat__name">
        <i className="sa-dot" />
        {t(`categories.${categorie}`, categorie)}
      </span>
      <div className="rl-cat__bar"><span style={{ width: `${pct}%` }} /></div>
      <span className="rl-cat__nums">
        <span><b>{livre}</b> / {collecte}</span>
        {isComplete ? (
          <span className="rl-pill is-done">✓ {t("remise.complete")}</span>
        ) : (
          <span className="rl-pill is-left">{t("remise.n_left", { count: reste })}</span>
        )}
      </span>
    </div>
  );
}

function ScanFeedback({ status }) {
  const { t } = useTranslation();
  if (!status) return null;
  if (status.loading) {
    return (
      <div className="rl-feedback is-loading">
        <LoaderCircle size={16} className="animate-spin" />
        <strong>{t("remise.scanning")}</strong>
        <code>{status.code}</code>
      </div>
    );
  }
  if (status.success?.annule) {
    return (
      <div className="rl-feedback is-loading">
        <Undo2 size={16} />
        <strong>{t("remise.linen_cancelled")}</strong>
        <code>{status.success.codeBarre}</code>
        <span>· {t(`categories.${status.success.categorie}`, status.success.categorie)}</span>
      </div>
    );
  }
  if (status.success) {
    return (
      <div className="rl-feedback is-ok">
        <CircleCheck size={16} />
        <strong>{t("remise.linen_delivered_success")}</strong>
        <code>{status.success.codeBarre}</code>
        <span>· {t(`categories.${status.success.categorie}`, status.success.categorie)}</span>
      </div>
    );
  }
  if (status.error) {
    return (
      <div className="rl-feedback is-ko">
        <TriangleAlert size={16} />
        <strong>{t("common.error")}</strong>
        <span>{status.error}</span>
      </div>
    );
  }
  return null;
}

function TrackItem({ icon, label, value, meta, state, action, onAction }) {
  const { t } = useTranslation();
  return (
    <li className={`sa-track__item is-${state}`} aria-current={state === "active" ? "step" : undefined}>
      <span className="sa-track__dot">{state === "done" ? <Check size={13} strokeWidth={3} /> : icon}</span>
      <div className="sa-track__body">
        <span className="sa-track__label">{label}</span>
        {value ? (
          <span className="sa-track__value">{value}</span>
        ) : (
          <span className="sa-track__placeholder">{state === "active" ? t("remise.in_progress") : "—"}</span>
        )}
        {meta && <span className="sa-track__meta">{meta}</span>}
      </div>
      {action && (
        <button type="button" className="sa-link" onClick={onAction}>
          {action}
        </button>
      )}
    </li>
  );
}

const ORDRE = ["AGENT_REMISE", "AGENT_COLLECTE", "APERCU", "SCAN"];

function RemiseLingeInner() {
  const { t } = useTranslation();
  const serviceName = useServiceName();

  const {
    agentRemise,
    agentCollecte,
    remise,
    remises,
    loading,
    scanStatus,
    etape,
    isCloturee,
    apercu,
    serviceChoisi,
    items,
    lingesRemis,
    totaux,
    scanAgentRemise,
    scanAgentCollecte,
    choisirService,
    changerAgentCollecte,
    creerRemise,
    nouvelleRemise,
    scanLinge,
    annulerLinge,
    rafraichir,
    resetAll,
    clearScanStatus,
  } = useRemiseLinge();

  const [scanValue, setScanValue] = useState("");
  const [historiqueOuvert, setHistoriqueOuvert] = useState(false);
  const [modeAnnulation, setModeAnnulation] = useState(false);
  const [aAnnuler, setAAnnuler] = useState(null);
  const [vueRemis, setVueRemis] = useVue("livraison.remis");
  const [vueCategories, setVueCategories] = useVue("livraison.categories");
  const scanInputRef = useRef(null);

  const showAlert = useCallback((title, text, icon = "info") => {
    const notifier = icon === "error" ? toast.error : icon === "success" ? toast.success : icon === "warning" ? toast.warning : toast.info;
    notifier(title, text ? { description: text } : undefined);
    return Promise.resolve();
  }, []);

  const handleScan = useCallback(
    async (code) => {
      if (!code?.trim()) return;

      setScanValue("");

      try {
        if (etape === "AGENT_REMISE") {
          const agent = await scanAgentRemise(code.trim());
          await showAlert(
            t('remise.agent_identified'),
            `✅ ${agent.nom} (${agent.matricule})`,
            "success",
            1500
          );
          setTimeout(() => scanInputRef.current?.focus(), 200);
          return;
        }

        if (etape === "AGENT_COLLECTE") {
          await scanAgentCollecte(code.trim(), agentRemise);
          return;
        }

        if (etape === "SCAN" && modeAnnulation) {
          await annulerLinge(code.trim());
          setTimeout(() => clearScanStatus(), 2500);
          setTimeout(() => scanInputRef.current?.focus(), 100);
          return;
        }

        if (etape === "SCAN") {
          const result = await scanLinge(code.trim());

          if (result.isComplete) {
            toast.success(t('remise.delivery_completed_title'), { description: t('remise.delivery_completed_text') });
          }

          setTimeout(() => {
            clearScanStatus();
          }, 2000);
          return;
        }
      } catch (error) {
        await showAlert(t('common.error'), error.message, "error");
        setTimeout(() => {
          clearScanStatus();
        }, 3000);
      }

      setTimeout(() => scanInputRef.current?.focus(), 100);
    },
    [etape, agentRemise, modeAnnulation, scanAgentRemise, scanAgentCollecte, scanLinge, annulerLinge, clearScanStatus, showAlert, t]
  );

  const handleAnnulerDepuisListe = async () => {
    const codeBarre = aAnnuler;
    setAAnnuler(null);
    if (!codeBarre) return;
    try {
      await annulerLinge(codeBarre);
      setTimeout(() => clearScanStatus(), 2500);
    } catch (error) {
      await showAlert(t('common.error'), error.message, "error");
      setTimeout(() => clearScanStatus(), 3000);
    }
    setTimeout(() => scanInputRef.current?.focus(), 100);
  };

  const handleCreerRemise = async () => {
    try {
      const created = await creerRemise();
      await showAlert(
        t('remise.delivery_created'),
        `${t('remise.delivery')} ${created.numeroLivraison}`,
        "success",
        2000
      );
    } catch (error) {
      await showAlert(t('common.error'), error.message, "error");
    }
    setTimeout(() => scanInputRef.current?.focus(), 200);
  };

  const collectesRemise = (apercu?.collectes || []).filter(
    (c) => remise?.service == null || String(c.serviceId) === String(remise.service)
  );

  const getPlaceholder = () => {
    if (!agentRemise) return t('remise.scan_delivery_agent');
    if (!agentCollecte) return t('remise.scan_collection_agent');
    if (etape === "SCAN" && modeAnnulation) return t('remise.scan_to_cancel');
    if (isCloturee) return t('remise.delivery_finished');
    return t('remise.scan_linen_barcode');
  };

  const isDisabled = (isCloturee && !modeAnnulation) || loading || !agentRemise || etape === "APERCU";

  const at = ORDRE.indexOf(etape);
  const stateOf = (id, termine = false) => {
    const i = ORDRE.indexOf(id);
    if (termine) return "done";
    if (i === at) return "active";
    return i < at ? "done" : "todo";
  };
  const serviceRemise = remise?.service ?? serviceChoisi;
  const nbCollectesService = (apercu?.collectes || []).filter(
    (c) => serviceRemise == null || String(c.serviceId) === String(serviceRemise)
  ).length;

  const STAGES = {
    AGENT_REMISE: { title: t("remise.stage_agent_remise_title"), text: t("remise.stage_agent_remise_text"), art: "badge" },
    AGENT_COLLECTE: { title: t("remise.stage_agent_collecte_title"), text: t("remise.stage_agent_collecte_text"), art: "badge" },
    APERCU: { title: t("remise.stage_apercu_title"), text: t("remise.stage_apercu_text"), art: "remise" },
    SCAN: isCloturee
      ? { title: t("remise.delivery_completed"), text: t("remise.stage_done_text"), art: "done" }
      : { title: t("remise.stage_scan_title"), text: t("remise.stage_scan_text"), art: "count" },
  };
  const stage = STAGES[etape] || STAGES.AGENT_REMISE;

  return (
    <Page className="sa-page">
      <PageHeader
        icon={<PageHeaderIcon size={40} />}
        title={t('remise.title')}
        subtitle={agentRemise
          ? `${t('remise.agent')} : ${agentRemise.nomPrenom || agentRemise.nom}`
          : t('remise.no_agent_connected')}
        right={remise ? <span className="rl-num"><Truck size={12} /> {remise.numeroLivraison}</span> : null}
        badge={remise ? getRemiseStatutConfig(remise.etat).label : undefined}
      />

      <ActionBar>
        <ActionButton
          icon={<RefreshCw size={18} className={loading ? "animate-spin" : ""} />}
          label={t('common.refresh')}
          variant="details"
          disabled={loading || etape !== "SCAN"}
          onClick={rafraichir}
        />
        <ActionButton
          icon={<PackagePlus size={18} />}
          label={t('remise.new_delivery')}
          variant="ajouter"
          disabled={loading || etape !== "SCAN"}
          onClick={() => { setModeAnnulation(false); nouvelleRemise(); }}
        />
        <ActionButton
          icon={<History size={18} />}
          label={`${historiqueOuvert ? t('remise.hide_history') : t('remise.show_history')} (${remises.length})`}
          variant="imprimer"
          disabled={etape !== "SCAN"}
          onClick={() => setHistoriqueOuvert((o) => !o)}
        />
        <ActionButton
          icon={<RotateCcw size={18} />}
          label={t('common.reset')}
          variant="supprimer"
          onClick={() => { setModeAnnulation(false); resetAll(); }}
        />
      </ActionBar>

      <div className="sa-flow">
        <aside className="sa-track" aria-label={t('remise.track_title')}>
          <div className="sa-track__title">{t('remise.track_title')}</div>
          <ol>
            <TrackItem
              icon={<User size={13} />}
              label={t('remise.step_delivery_agent')}
              value={agentRemise ? agentRemise.nomPrenom || agentRemise.nom : null}
              meta={agentRemise ? agentRemise.codeBarre || agentRemise.matricule : null}
              state={agentRemise ? "done" : "active"}
            />
            <TrackItem
              icon={<Users size={13} />}
              label={t('remise.step_collection_agent')}
              value={agentCollecte ? agentCollecte.nomPrenom || agentCollecte.nom : null}
              meta={agentCollecte ? agentCollecte.codeBarre || agentCollecte.matricule : null}
              state={stateOf("AGENT_COLLECTE")}
              action={etape === "APERCU" ? t('common.edit') : null}
              onAction={changerAgentCollecte}
            />
            <TrackItem
              icon={<Package size={13} />}
              label={t('remise.service')}
              value={serviceRemise != null ? serviceName(serviceRemise) : null}
              meta={etape === "APERCU" && serviceRemise != null ? t('remise.n_collectes', { count: nbCollectesService }) : null}
              state={stateOf("APERCU")}
            />
            <TrackItem
              icon={<PackageCheck size={13} />}
              label={t('remise.delivery')}
              value={remise?.numeroLivraison}
              meta={remise ? t('remise.n_delivered_of', { done: totaux.remis, total: totaux.collecte }) : null}
              state={stateOf("SCAN", isCloturee)}
            />
          </ol>
        </aside>

        <section className="sa-stage">
          <div className="sa-stage__head">
            <div style={{ minWidth: 0, flex: 1 }}>
              <span className="sa-eyebrow">{t('remise.step_of', { n: Math.max(at, 0) + 1, total: ORDRE.length })}</span>
              <h2 className="sa-stage__title">{stage.title}</h2>
              <p className="sa-stage__text">{stage.text}</p>
            </div>
            <div className="sa-stage__art"><Illustration kind={stage.art} /></div>
          </div>

          {!agentRemise && (
            <div className="sa-banner is-warning" style={{ marginBottom: 14 }}>
              <span className="sa-banner__icon"><TriangleAlert size={18} /></span>
              <div>
                <strong>{t('remise.no_agent_connected')}</strong>
                <span>{t('remise.no_agent_connect_text')}</span>
              </div>
            </div>
          )}

          {etape !== "APERCU" && (
            <div className="sa-scan" style={{ marginBottom: 16 }}>
              {etape === "SCAN" && (
                <div className="sa-segment" role="tablist" aria-label={t('remise.scan_mode')}>
                  <button type="button" role="tab" aria-selected={!modeAnnulation} className={!modeAnnulation ? "is-active" : ""} onClick={() => setModeAnnulation(false)}>
                    <ScanBarcode size={15} /> {t('remise.mode_deliver')}
                  </button>
                  <button type="button" role="tab" aria-selected={modeAnnulation} className={modeAnnulation ? "is-active rl-mode-cancel" : ""} onClick={() => setModeAnnulation(true)}>
                    <Undo2 size={15} /> {t('remise.mode_cancel')}
                  </button>
                </div>
              )}
              <ScanInput
                ref={scanInputRef}
                placeholder={getPlaceholder()}
                value={scanValue}
                onChange={setScanValue}
                onSubmit={handleScan}
                borderColor={etape === "SCAN" && modeAnnulation ? "#e03131" : isCloturee ? "#cbd5e1" : !agentRemise ? "#e03131" : "#0794a4"}
                keepFocus={true}
                autoDebounce={true}
                disabled={isDisabled}
              />
              <ScanFeedback status={scanStatus} />
            </div>
          )}

          {etape === "APERCU" && apercu && (
            <ApercuRemise
              apercu={apercu}
              agentCollecte={agentCollecte}
              serviceChoisi={serviceChoisi}
              onChoisirService={choisirService}
              onCreer={handleCreerRemise}
              onChangerAgent={changerAgentCollecte}
              loading={loading}
            />
          )}

          {etape === "SCAN" && remise && (
            <>
              <div className="rl-kpis">
                <Kpi
                  label={t('remise.total_to_deliver')}
                  value={totaux.collecte}
                  sub={t('remise.n_open_collectes', { count: collectesRemise.length })}
                  Icon={Package}
                />
                <Kpi
                  label={t('remise.total_delivered')}
                  value={totaux.remis}
                  sub={`${totaux.pourcentage} % ${t('remise.of_total')}`}
                  Icon={CircleCheck}
                  color="var(--sa)"
                />
                <Kpi
                  label={t('remise.remaining')}
                  value={totaux.reste}
                  sub={totaux.reste === 0 ? `✓ ${t('remise.completed')}` : t('remise.pending')}
                  Icon={Hourglass}
                  color={totaux.reste === 0 ? "var(--sa)" : "var(--sa-warn)"}
                />
                <Kpi
                  label={t('remise.status')}
                  value={getRemiseStatutConfig(remise.etat).label}
                  sub={isCloturee ? t('remise.delivery_finished') : t('remise.in_progress')}
                  Icon={Flag}
                  color={isCloturee ? "var(--sa)" : undefined}
                />
              </div>

              <Meter value={totaux.pourcentage} label={t('remise.delivery_progress')} />

              <CollectesConcernees collectes={collectesRemise} title={t('remise.collectes_ouvertes')} />

              {lingesRemis.length > 0 && (
                <div>
                  <div className="sa-subhead">
                    {t('remise.delivered_this_session')}
                    <span className="sa-count">{lingesRemis.length}</span>
                    <span style={{ marginInlineStart: "auto" }}><VueSwitch value={vueRemis} onChange={setVueRemis} compact /></span>
                  </div>
                  {vueRemis === "tableau" ? (
                    <DataTable
                      columns={{
                        code: { label: t('tri.code', 'Code'), render: (l) => <Code>{l.codeBarre}</Code> },
                        categorie: { label: t('tri.category', 'Catégorie'), render: (l) => t(`categories.${l.categorie}`, l.categorie) },
                        heure: { label: t('tri.time', 'Heure'), render: (l) => l.date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) },
                        actions: {
                          label: t('common.actions', 'Actions'),
                          render: (l) => (
                            <RowActions>
                              <RowButton icon={Undo2} tone="danger" title={t('remise.cancel_linen')} disabled={loading} onClick={() => setAAnnuler(l.codeBarre)} />
                            </RowActions>
                          ),
                        },
                      }}
                      rows={lingesRemis}
                      rowKey={(l) => l.codeBarre}
                    />
                  ) : (
                  <div className="rl-cats">
                    {lingesRemis.map((l) => (
                      <div key={l.codeBarre} className="rl-remis" style={{ "--c": accentOf(l.categorie) }}>
                        <i className="sa-dot" />
                        <code>{l.codeBarre}</code>
                        <span>{t(`categories.${l.categorie}`, l.categorie)}</span>
                        <small>{l.date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</small>
                        <button type="button" className="sa-btn sa-btn--sm rl-btn-danger" onClick={() => setAAnnuler(l.codeBarre)} disabled={loading}>
                          <Undo2 size={13} /> {t('remise.cancel_linen')}
                        </button>
                      </div>
                    ))}
                  </div>
                  )}
                </div>
              )}

              {items.length > 0 && (
                <div>
                  <div className="sa-subhead">
                    {t('remise.category_details')}
                    <span className="sa-count">{items.length}</span>
                    <span style={{ marginInlineStart: "auto" }}><VueSwitch value={vueCategories} onChange={setVueCategories} compact /></span>
                  </div>
                  {vueCategories === "tableau" ? (
                    <DataTable
                      columns={{
                        categorie: { label: t('tri.category', 'Catégorie'), render: (it) => <strong>{t(`categories.${it.categorie}`, it.categorie)}</strong> },
                        collecte: { label: t('remise.total_to_deliver'), render: (it) => it.quantiteCollectee || 0 },
                        remis: { label: t('remise.total_delivered'), render: (it) => it.quantiteRemise || 0 },
                        reste: {
                          label: t('remise.remaining'),
                          render: (it) => {
                            const reste = Math.max((it.quantiteCollectee || 0) - (it.quantiteRemise || 0), 0);
                            return <Badge variant={reste === 0 ? "success" : "warning"}>{reste === 0 ? `✓ ${t("remise.complete")}` : reste}</Badge>;
                          },
                        },
                      }}
                      rows={items}
                      rowKey={(it) => it.categorie}
                    />
                  ) : (
                  <div className="rl-cats">
                    {items.map((item) => (
                      <CategorieRow
                        key={item.categorie}
                        categorie={item.categorie}
                        collecte={item.quantiteCollectee || 0}
                        livre={item.quantiteRemise || 0}
                        reste={Math.max((item.quantiteCollectee || 0) - (item.quantiteRemise || 0), 0)}
                      />
                    ))}
                  </div>
                  )}
                </div>
              )}

              {historiqueOuvert && (
                <div>
                  <div className="sa-subhead">
                    <History size={15} /> {t('remise.show_history')}
                    <span className="sa-count">{remises.length}</span>
                  </div>
                  <DataTable
                    columns={{
                      numero: { label: t('remise.delivery'), render: (r) => <Code>{r.numeroLivraison || r.id}</Code> },
                      statut: {
                        label: t('remise.status'),
                        render: (r) => <span className="sa-tag" style={{ color: getRemiseStatutConfig(r.etat).text }}>{getRemiseStatutConfig(r.etat).label}</span>,
                      },
                      agent: { label: t('remise.agent'), render: (r) => r.agentRemiseNom || "—" },
                      date: { label: t('common.date', 'Date'), render: (r) => formatDate(r.dateRemise) },
                      linges: { label: t('remise.linens'), render: (r) => <strong>{r.nbLinges || 0}</strong> },
                    }}
                    rows={remises}
                    rowKey={(r) => r.id ?? r.numeroLivraison}
                    emptyText={t('remise.no_deliveries')}
                  />
                </div>
              )}
            </>
          )}
        </section>
      </div>

      <ConfirmDialog
        open={!!aAnnuler}
        title={t('remise.cancel_confirm_title')}
        message={aAnnuler ? t('remise.cancel_confirm_text', { code: aAnnuler }) : ""}
        confirmLabel={t('remise.cancel_linen')}
        onConfirm={handleAnnulerDepuisListe}
        onClose={() => setAAnnuler(null)}
      />
    </Page>
  );
}

export default function RemiseLinge() {
  return (
    <RemiseLingeProvider>
      <RemiseLingeInner />
    </RemiseLingeProvider>
  );
}
