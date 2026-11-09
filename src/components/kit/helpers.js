import { exportXlsx } from '../../utils/excelExport';

export const pad = (n) => String(n).padStart(2, '0');
export const toIso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const day = (v) => (v ? String(v).slice(0, 10) : '');

export const fmtDate = (v) => {
  const d = day(v);
  if (!d) return '—';
  const [y, m, j] = d.split('-');
  return `${j}/${m}/${y}`;
};

export const fmtDateTime = (v) => {
  if (!v) return '';
  const d = new Date(v);
  return isNaN(d.getTime()) ? '' : d.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
};

export const daysBetween = (a, b) => {
  if (!a || !b || b < a) return 0;
  const d1 = new Date(`${a}T00:00:00`);
  const d2 = new Date(`${b}T00:00:00`);
  return Math.round((d2 - d1) / 86400000) + 1;
};

export const asArray = (d) => (Array.isArray(d) ? d : d?.value || []);

export const MOIS_NOMS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

export const getPageNumbers = (current, total) => {
  const pages = [];
  if (total <= 7) {
    for (let i = 1; i <= total; i += 1) pages.push(i);
    return pages;
  }
  pages.push(1);
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push('...');
  for (let i = start; i <= end; i += 1) pages.push(i);
  if (end < total - 1) pages.push('...');
  pages.push(total);
  return pages;
};

export const getInitials = (nom, prenom) => ((nom?.[0] || '') + (prenom?.[0] || '')).toUpperCase() || '?';

const AVATAR_COLORS = ['#f97316', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e'];
export const getAvatarColor = (id) => AVATAR_COLORS[Math.abs(Number(id) || 0) % AVATAR_COLORS.length];

export const exportExcel = ({ fileName, sheetName = 'Données', columns, rows, getValue }) => {
  const data = rows.map((r) => Object.fromEntries(columns.map((c) => [c.key, getValue(r, c.key) ?? ''])));
  exportXlsx({
    fileName: `${fileName}_${toIso(new Date())}.xlsx`,
    sheets: [{
      name: sheetName.slice(0, 31),
      columns: columns.map((c, i) => ({
        header: c.label,
        key: c.key,
        type: c.type || 'text',
        width: Math.min(Math.max(String(c.label).length, ...data.map((x) => String(Object.values(x)[i] ?? '').length)) + 2, 45),
      })),
      rows: data,
    }],
  });
};
