import React from "react";
import { useTranslation } from "react-i18next";
import { ChevronRight } from "lucide-react";
import { ZONES_STOCK, zoneLabel } from "../../../constants/zonesStock";
import { DataTable } from "../../kit";

export default function ZoneMatrix({ rows, firstColumn, onCellClick, onRowClick, emptyText }) {
  const { t } = useTranslation();
  const maxByZone = Object.fromEntries(ZONES_STOCK.map((z) => [z.id, Math.max(1, ...rows.map((r) => r.parZone[z.id] || 0))]));

  const cell = (row, zoneId, n, color, max) => {
    if (!n) return <span className="kit-muted">·</span>;
    if (onRowClick || !onCellClick) return <strong>{n}</strong>;
    const alpha = Math.round(8 + (n / max) * 22);
    return (
      <button
        type="button"
        className="kit-heat-cell"
        style={{ "--z": color, "--a": `${alpha}%` }}
        onClick={(e) => { e.stopPropagation(); onCellClick(row, zoneId); }}
        title={t("suiviStock.see_linges")}
      >
        {n}
      </button>
    );
  };

  const columns = {
    label: {
      label: firstColumn,
      render: (row) => (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 700 }}>
          {row.color && <i style={{ width: 10, height: 10, borderRadius: 999, background: row.color, display: "inline-block" }} />}
          {row.label}
          {onRowClick && <ChevronRight size={14} className="kit-muted" />}
        </span>
      ),
    },
    ...Object.fromEntries(ZONES_STOCK.map((z) => [z.id, {
      label: zoneLabel(t, z.id),
      align: "center",
      thStyle: { borderTop: `3px solid ${z.color}` },
      render: (row) => cell(row, z.id, row.parZone[z.id] || 0, z.color, maxByZone[z.id]),
    }])),
    total: { label: t("suiviStock.total"), align: "center", render: (row) => cell(row, null, row.total, "#0794a4", Math.max(1, row.total)) },
  };

  return (
    <DataTable
      columns={columns}
      rows={rows}
      rowKey={(r) => r.key}
      onRowClick={onRowClick}
      emptyText={emptyText}
    />
  );
}
