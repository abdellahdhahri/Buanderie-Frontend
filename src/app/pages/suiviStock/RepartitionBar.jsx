import React from "react";
import { useTranslation } from "react-i18next";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ZONES_STOCK, zoneLabel } from "../../constants/zonesStock";

/** Barre horizontale empilée : part de chaque zone dans le parc. */
export default function RepartitionBar({ parZone, totalParc, onZoneClick }) {
  const { t } = useTranslation();
  const row = { name: "parc", ...Object.fromEntries(ZONES_STOCK.map((z) => [z.id, parZone[z.id] || 0])) };
  const visible = ZONES_STOCK.filter((z) => row[z.id] > 0);
  const pct = (n) => (totalParc > 0 ? Math.round((n / totalParc) * 1000) / 10 : 0);

  const renderTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="ss-tooltip">
        {payload.map((p) => (
          <div key={p.dataKey} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <i style={{ width: 9, height: 9, borderRadius: 3, background: p.color }} />
            <span>{zoneLabel(t, p.dataKey)}</span>
            <b style={{ marginInlineStart: "auto" }}>{p.value}</b>
            <span style={{ color: "var(--sa-faint)" }}>{pct(p.value)} %</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      {totalParc > 0 ? (
        <div style={{ width: "100%", height: 46 }}>
          <ResponsiveContainer>
            <BarChart data={[row]} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: 0 }} barCategoryGap={0}>
              <XAxis type="number" hide domain={[0, totalParc]} />
              <YAxis type="category" dataKey="name" hide />
              <Tooltip content={renderTooltip} cursor={false} shared={false} />
              {visible.map((z, i) => (
                <Bar
                  key={z.id}
                  dataKey={z.id}
                  stackId="parc"
                  fill={z.color}
                  isAnimationActive
                  cursor="pointer"
                  onClick={() => onZoneClick(z.id)}
                  radius={
                    visible.length === 1 ? 10 : i === 0 ? [10, 0, 0, 10] : i === visible.length - 1 ? [0, 10, 10, 0] : 0
                  }
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div style={{ height: 46, borderRadius: 10, background: "var(--sa-border-soft)" }} />
      )}

      <div className="ss-legend">
        {ZONES_STOCK.map((z) => {
          const n = parZone[z.id] || 0;
          return (
            <button key={z.id} type="button" className="ss-legend__item" style={{ "--z": z.color }} disabled={!n} onClick={() => onZoneClick(z.id)}>
              <i />
              {zoneLabel(t, z.id)}
              <b>{n}</b>
              <em>{pct(n)} %</em>
            </button>
          );
        })}
      </div>
    </div>
  );
}
