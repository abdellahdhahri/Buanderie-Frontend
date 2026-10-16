import React from "react";
import { useTranslation } from "react-i18next";
import { ChevronRight } from "lucide-react";
import { ZONES_STOCK, zoneLabel } from "../../constants/zonesStock";

/**
 * Tableau lignes × zones + total.
 * rows : [{ key, label, color?, parZone, total }]
 * onCellClick(row, zoneId|null) : cellule non nulle (zoneId null = colonne total)
 * onRowClick(row) : ligne entière cliquable (prioritaire sur les cellules)
 */
export default function ZoneMatrix({ rows, firstColumn, onCellClick, onRowClick, maxHeight }) {
  const { t } = useTranslation();
  // Intensité de fond proportionnelle au max de chaque colonne (carte de chaleur)
  const maxByZone = Object.fromEntries(
    ZONES_STOCK.map((z) => [z.id, Math.max(1, ...rows.map((r) => r.parZone[z.id] || 0))])
  );

  const cell = (row, zoneId, n, color, alpha) => {
    if (!n) return <span className="ss-zero">·</span>;
    if (onRowClick || !onCellClick) return <span style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{n}</span>;
    return (
      <button
        type="button"
        className="ss-cell"
        style={{ "--z": color, "--a": `${alpha}%` }}
        onClick={() => onCellClick(row, zoneId)}
        title={t("suiviStock.see_linges")}
      >
        {n}
      </button>
    );
  };

  return (
    <div className="ss-table-wrap" style={maxHeight ? { maxHeight } : undefined}>
      <table className="ss-table">
        <thead>
          <tr>
            <th>{firstColumn}</th>
            {ZONES_STOCK.map((z) => (
              <th key={z.id} style={{ "--z": z.color }}>
                <span className="ss-th"><i />{zoneLabel(t, z.id)}</span>
              </th>
            ))}
            <th className="ss-total">{t("suiviStock.total")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className={onRowClick ? "is-clickable" : ""} onClick={onRowClick ? () => onRowClick(row) : undefined}>
              <td>
                <span className="ss-rowname" style={row.color ? { "--c": row.color } : undefined}>
                  {row.color && <i />}
                  {row.label}
                  {onRowClick && <ChevronRight size={14} className="ss-go" />}
                </span>
              </td>
              {ZONES_STOCK.map((z) => {
                const n = row.parZone[z.id] || 0;
                return (
                  <td key={z.id}>
                    {cell(row, z.id, n, z.color, Math.round(8 + (n / maxByZone[z.id]) * 22))}
                  </td>
                );
              })}
              <td className="ss-total">{cell(row, null, row.total, "#0ea5e9", 10)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
