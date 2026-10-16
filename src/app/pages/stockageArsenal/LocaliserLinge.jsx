import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, TriangleAlert, Warehouse } from "lucide-react";
import ScanInput from "../../components/utils/shared/ScanInput";
import { localiserLinge } from "../../services/receptionArsenalService";
import { Hero, Loading, Panel, ScanZone } from "./arsenalUi";
import { accentOf } from "./arsenalUtils";
import { Illustration, ShelfGlyph } from "./illustrations";

export default function LocaliserLinge() {
  const { t } = useTranslation();
  const [scanValue, setScanValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { data } | { error, code }

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
            ) : (
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
    </Panel>
  );
}
