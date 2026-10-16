import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Boxes, RefreshCw } from "lucide-react";
import { Modal } from "../../components/ui/modal";
import { fetchLingesEmplacement, fetchStockArsenal } from "../../services/receptionArsenalService";
import { CategoryBar, CategoryChips, EmptyState, Loading, Panel } from "./arsenalUi";
import { accentOf } from "./arsenalUtils";
import { CategoryDonut, ShelfGlyph } from "./illustrations";

export default function StockArsenalView({ arsenal }) {
  const { t } = useTranslation();
  const [stock, setStock] = useState(null);
  const [loading, setLoading] = useState(false);

  const [selected, setSelected] = useState(null); // étagère ouverte
  const [linges, setLinges] = useState(null);

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

  // Chargement initial (le parent remonte ce composant à chaque changement d'arsenal)
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

  const emplacements = stock?.emplacements || [];
  const parCategorie = stock?.totalParCategorie || {};
  const maxShelf = Math.max(1, ...emplacements.map((e) => e.total || 0));

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
                      <span>{t(`categories.${cat}`, cat)}</span>
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

      {!stock && (
        <div className="sa-racks">
          {[0, 1, 2, 3].map((i) => <div key={i} className="sa-skeleton" />)}
        </div>
      )}

      {stock &&
        (emplacements.length === 0 ? (
          <EmptyState title={t("stockageArsenal.no_shelves")} />
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
        ))}

      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        variant="detail"
        title={selected?.nom}
        subtitle={selected ? t("stockageArsenal.shelf_content", { count: selected.total }) : null}
        size="md"
      >
        <div className="sa-page">
          {!linges ? (
            <Loading />
          ) : linges.length === 0 ? (
            <EmptyState title={t("stockageArsenal.empty_shelf")} />
          ) : (
            <div className="sa-list" style={{ maxHeight: "60vh" }}>
              {linges.map((l) => (
                <div key={l.lingeId} className="sa-list__row" style={{ "--c": accentOf(l.categorie) }}>
                  <i className="sa-dot" />
                  <code>{l.codeBarre}</code>
                  <span>{l.designation}</span>
                  <em>{t(`categories.${l.categorie}`, l.categorie)}</em>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
