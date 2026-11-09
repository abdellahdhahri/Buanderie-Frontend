import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, TriangleAlert, Undo2, Warehouse } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "../../kit";
import ScanInput from "../../utils/shared/ScanInput";
import { annulerRangement, localiserLinge } from "../../../services/receptionArsenalService";
import { Hero, Loading, Panel, ScanZone } from "./arsenalUi";
import { accentOf } from "./arsenalUtils";
import { Illustration, ShelfGlyph } from "./illustrations";

export default function LocaliserLinge() {
  const { t } = useTranslation();
  const [scanValue, setScanValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleScan = async (code) => {
    setLoading(true);
    try {
      setResult({ data: await localiserLinge(code) });
    } catch (e) {
      setResult({ error: e.message, code });
    } finally {
      setLoading(false);
    }
  };

  const data = result?.data;

  const [annulation, setAnnulation] = useState(false);
  const [confirmer, setConfirmer] = useState(false);
  const annulerCeRangement = async () => {
    setConfirmer(false);
    setAnnulation(true);
    try {
      const res = await annulerRangement(data.codeBarre);
      toast.success(res.message || t("stockageArsenal.storing_cancelled"));
      setResult({ data: await localiserLinge(data.codeBarre) });
    } catch (e) {
      toast.error(e.message);
    } finally {
      setAnnulation(false);
    }
  };

  return (
    <Panel>
      <Hero art="locate" title={t("stockageArsenal.locate_title")} text={t("stockageArsenal.locate_hint")}>
        <ScanZone color="#0284c7">
          <ScanInput
            placeholder={t("stockageArsenal.locate_placeholder")}
            value={scanValue}
            onChange={setScanValue}
            onSubmit={handleScan}
            borderColor="#0284c7"
          />
        </ScanZone>
      </Hero>

      {loading && <Loading />}

      <AnimatePresence mode="wait">
        {!loading && result?.error && (
          <motion.div key="err" className="sa-error" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <TriangleAlert size={18} /> {result.error}
          </motion.div>
        )}

        {!loading && data && (
          <motion.div key={data.codeBarre} className="sa-result" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="sa-result__head">
              <code>{data.codeBarre}</code>
              <span className="sa-cat" style={{ "--c": accentOf(data.categorie) }}>
                <i />
                {t(`categories.${data.categorie}`, data.categorie)}
              </span>
              {data.etat && <span className="sa-tag">{data.etat}</span>}
            </div>

            {data.localise ? (
              <div className="sa-path">
                <div className="sa-path__node">
                  <span className="sa-chip__icon" style={{ width: 44, height: 44, borderRadius: 13 }}>
                    <Warehouse size={22} />
                  </span>
                  <div>
                    <small>{t("stockageArsenal.arsenal")}</small>
                    <strong>{data.arsenal}</strong>
                  </div>
                </div>
                <span className="sa-path__arrow"><ArrowRight size={22} /></span>
                <div className="sa-path__node">
                  <span className="sa-chip__icon" style={{ width: 44, height: 44, borderRadius: 13 }}>
                    <ShelfGlyph size={24} filled={2} />
                  </span>
                  <div>
                    <small>{t("stockageArsenal.shelf")}</small>
                    <strong>{data.emplacement}</strong>
                  </div>
                </div>
              </div>
            ) : null}

            {data.localise && (
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
                <button type="button" className="sa-btn sa-btn--sm" style={{ color: "var(--sa-danger)" }} onClick={() => setConfirmer(true)} disabled={annulation}>
                  <Undo2 size={14} /> {annulation ? "…" : t("stockageArsenal.cancel_storing")}
                </button>
              </div>
            )}

            {!data.localise && (
              <div className="sa-hero" style={{ gridTemplateColumns: "110px 1fr", gap: 18 }}>
                <Illustration kind="empty" color="#d97706" />
                <div>
                  <h2 style={{ fontSize: 17, margin: "0 0 4px" }}>{t("stockageArsenal.not_stored_title")}</h2>
                  <p style={{ margin: 0 }}>{data.message || t("stockageArsenal.not_stored")}</p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={confirmer && !!data}
        title={t("stockageArsenal.cancel_storing_title")}
        message={data ? t("stockageArsenal.cancel_storing_confirm", { code: data.codeBarre }) : ""}
        confirmLabel={t("stockageArsenal.cancel_storing")}
        onConfirm={annulerCeRangement}
        onClose={() => setConfirmer(false)}
      />
    </Panel>
  );
}
