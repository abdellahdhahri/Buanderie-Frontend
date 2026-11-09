import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Boxes, RefreshCw, Eye, Undo2, Layers } from "lucide-react";
import { Modal, ConfirmDialog, DataTable, Code, VueSwitch, useVue, RowActions, RowButton } from "../../kit";
import { annulerRangement, fetchLingesEmplacement, fetchStockArsenal } from "../../../services/receptionArsenalService";
import { CategoryBar, CategoryChips, EmptyState, Loading, Panel } from "./arsenalUi";
import { accentOf } from "./arsenalUtils";
import { CategoryDonut, ShelfGlyph } from "./illustrations";

export default function StockArsenalView({ arsenal }) {
  const { t } = useTranslation();
  const [stock, setStock] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [linges, setLinges] = useState(null);
  const [aRetirer, setARetirer] = useState(null);
  const [retrait, setRetrait] = useState(null);
  const [vue, setVue] = useVue("stockage.etageres");
  const [vueLinges, setVueLinges] = useVue("stockage.linges_etagere", "tableau");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setStock(await fetchStockArsenal(arsenal.id));
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [arsenal.id]);

  useEffect(() => {
    let cancelled = false;
    fetchStockArsenal(arsenal.id)
      .then((data) => !cancelled && setStock(data))
      .catch((e) => !cancelled && toast.error(e.message));
    return () => {
      cancelled = true;
    };
  }, [arsenal.id]);

  const openShelf = async (emp) => {
    setSelected(emp);
    setLinges(null);
    try {
      const data = await fetchLingesEmplacement(emp.arsenalEmplacementID ?? emp.emplacementID);
      setLinges(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error(e.message);
      setLinges([]);
    }
  };

  const retirerLinge = async () => {
    const l = aRetirer;
    setARetirer(null);
    if (!l) return;
    setRetrait(l.codeBarre);
    try {
      const res = await annulerRangement(l.codeBarre);
      toast.success(res.message || t("stockageArsenal.storing_cancelled"));
      setLinges((list) => (list || []).filter((x) => x.codeBarre !== l.codeBarre));
      setSelected((s) => (s ? { ...s, total: Math.max((s.total || 1) - 1, 0) } : s));
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setRetrait(null);
    }
  };

  const emplacements = stock?.emplacements || [];
  const parCategorie = stock?.totalParCategorie || {};
  const maxShelf = Math.max(1, ...emplacements.map((e) => e.total || 0));
  const libelleCategorie = (c) => t(`categories.${c}`, c || "—");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Panel
        title={t("stockageArsenal.stock_title", { arsenal: stock?.arsenal || arsenal.designation })}
        icon={<Boxes size={17} />}
        right={
          <button type="button" className="sa-btn sa-btn--sm" onClick={load} disabled={loading}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> {t("common.refresh")}
          </button>
        }
      >
        {!stock ? (
          <Loading />
        ) : (
          <div className="sa-kpi">
            <CategoryDonut counts={parCategorie} colorOf={accentOf}>
              <strong>{stock.total}</strong>
              <small>{t("stockageArsenal.linges_in_stock")}</small>
            </CategoryDonut>
            <div className="sa-kpi__legend">
              {Object.keys(parCategorie).length === 0 ? (
                <span style={{ fontSize: 13.5, color: "var(--sa-muted)" }}>{t("stockageArsenal.empty_arsenal")}</span>
              ) : (
                Object.entries(parCategorie)
                  .sort((a, b) => b[1] - a[1])
                  .map(([cat, qte]) => (
                    <div key={cat} className="sa-legend-row" style={{ "--c": accentOf(cat) }}>
                      <i className="sa-dot" />
                      <span>{libelleCategorie(cat)}</span>
                      <b>{qte}</b>
                      <em>{stock.total ? Math.round((qte / stock.total) * 100) : 0}%</em>
                    </div>
                  ))
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 140 }}>
              <span className="sa-tag" style={{ alignSelf: "flex-start" }}>
                {t("stockageArsenal.shelves_count", { count: emplacements.length })}
              </span>
              <span className="sa-tag" style={{ alignSelf: "flex-start" }}>
                {t("stockageArsenal.shelves_used", { count: emplacements.filter((e) => e.total > 0).length })}
              </span>
            </div>
          </div>
        )}
      </Panel>

      <Panel
        title={t("stockageArsenal.shelves_title", "Étagères")}
        icon={<Layers size={17} />}
        right={<VueSwitch value={vue} onChange={setVue} />}
      >
        {!stock ? (
          <div className="sa-racks">
            {[0, 1, 2, 3].map((i) => <div key={i} className="sa-skeleton" />)}
          </div>
        ) : emplacements.length === 0 ? (
          <EmptyState title={t("stockageArsenal.no_shelves")} />
        ) : vue === "tableau" ? (
          <DataTable
            columns={{
              nom: { label: t("stockageArsenal.shelf"), render: (e) => <strong>{e.nom}</strong> },
              code: { label: t("tri.code", "Code"), render: (e) => <Code>{e.codeBarre}</Code> },
              categories: {
                label: t("tri.category", "Catégorie"),
                render: (e) => (e.total ? <CategoryChips counts={e.quantitesParCategorie} size="sm" /> : <span className="kit-muted">{t("stockageArsenal.empty_shelf")}</span>),
              },
              total: { label: t("stockageArsenal.linges_in_stock"), render: (e) => <strong>{e.total || 0}</strong> },
              actions: {
                label: t("common.actions", "Actions"),
                render: (e) => (
                  <RowActions>
                    <RowButton icon={Eye} title={t("stockageArsenal.shelf_content", { count: e.total || 0 })} onClick={() => openShelf(e)} />
                  </RowActions>
                ),
              },
            }}
            rows={emplacements}
            rowKey={(e) => e.emplacementID}
            rowClassName={(e) => (e.total ? "" : "kit-row-inactive")}
            onRowDoubleClick={openShelf}
          />
        ) : (
          <div className="sa-racks">
            {emplacements.map((emp, i) => (
              <motion.button
                key={emp.emplacementID}
                type="button"
                className={`sa-rack ${emp.total ? "" : "is-empty"}`}
                onClick={() => openShelf(emp)}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(0.03 * i, 0.4) }}
              >
                <div className="sa-rack__top">
                  <span className="sa-shelf__glyph" style={emp.total ? { color: "var(--sa)" } : undefined}>
                    <ShelfGlyph size={20} filled={emp.total ? (emp.total / maxShelf > 0.5 ? 2 : 1) : 0} />
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div className="sa-shelf__name">{emp.nom}</div>
                    {emp.codeBarre && <div className="sa-shelf__code">{emp.codeBarre}</div>}
                  </div>
                  <span className="sa-rack__total">{emp.total}</span>
                </div>
                {emp.total ? (
                  <>
                    <CategoryBar counts={emp.quantitesParCategorie} />
                    <CategoryChips counts={emp.quantitesParCategorie} size="sm" />
                  </>
                ) : (
                  <span className="sa-rack__hint">{t("stockageArsenal.empty_shelf")}</span>
                )}
              </motion.button>
            ))}
          </div>
        )}
      </Panel>

      <Modal
        open={!!selected}
        size="md"
        icon={<Layers size={20} />}
        title={selected?.nom}
        subtitle={selected ? t("stockageArsenal.shelf_content", { count: selected.total }) : null}
        headerActions={<VueSwitch value={vueLinges} onChange={setVueLinges} compact />}
        onClose={() => setSelected(null)}
      >
        <div className="sa-page">
          {!linges ? (
            <Loading />
          ) : linges.length === 0 ? (
            <EmptyState title={t("stockageArsenal.empty_shelf")} />
          ) : vueLinges === "tableau" ? (
            <DataTable
              columns={{
                code: { label: t("tri.code", "Code"), render: (l) => <Code>{l.codeBarre}</Code> },
                designation: { label: t("reception.designation", "Désignation"), render: (l) => l.designation || "—" },
                categorie: { label: t("tri.category", "Catégorie"), render: (l) => libelleCategorie(l.categorie) },
                actions: {
                  label: t("common.actions", "Actions"),
                  render: (l) => (
                    <RowActions>
                      <RowButton icon={Undo2} tone="danger" title={t("stockageArsenal.remove_from_shelf")} disabled={retrait === l.codeBarre} onClick={() => setARetirer(l)} />
                    </RowActions>
                  ),
                },
              }}
              rows={linges}
              rowKey={(l) => l.lingeId ?? l.codeBarre}
            />
          ) : (
            <div className="sa-list" style={{ maxHeight: "60vh" }}>
              {linges.map((l) => (
                <div key={l.lingeId} className="sa-list__row" style={{ "--c": accentOf(l.categorie) }}>
                  <i className="sa-dot" />
                  <code>{l.codeBarre}</code>
                  <span>{l.designation}</span>
                  <em>{libelleCategorie(l.categorie)}</em>
                  <button type="button" className="sa-link sa-link--danger" onClick={() => setARetirer(l)} disabled={retrait === l.codeBarre}>
                    {retrait === l.codeBarre ? "…" : t("stockageArsenal.remove_from_shelf")}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={!!aRetirer}
        title={t("stockageArsenal.cancel_storing_title")}
        message={aRetirer ? t("stockageArsenal.cancel_storing_confirm", { code: aRetirer.codeBarre }) : ""}
        confirmLabel={t("stockageArsenal.remove_from_shelf")}
        onConfirm={retirerLinge}
        onClose={() => setARetirer(null)}
      />
    </div>
  );
}
