import React, { useEffect, useMemo, useRef, useState } from 'react';
import './RowSelection.css';
import { tk } from '../kit/i18n';

export const useRowSelection = (items, getId = (x) => x?.id) => {
  const [checked, setChecked] = useState(() => new Set());
  const list = useMemo(() => (items || []).filter(Boolean), [items]);
  const ids = useMemo(() => list.map(getId), [list]); 

  useEffect(() => {
    setChecked((prev) => {
      if (prev.size === 0) return prev;
      const existing = new Set(ids);
      const next = new Set([...prev].filter((id) => existing.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [ids]);

  const checkedCount = ids.filter((id) => checked.has(id)).length;
  const allChecked = ids.length > 0 && checkedCount === ids.length;
  const someChecked = checkedCount > 0 && !allChecked;
  const checkedItems = useMemo(() => list.filter((x) => checked.has(getId(x))), [list, checked]); 
  return {
    ids,
    count: checkedCount,
    total: ids.length,
    allChecked,
    someChecked,
    checkedItems,
    isChecked: (id) => checked.has(id),
    toggle: (id) => setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    }),
    toggleAll: () => setChecked((prev) => {
      const next = new Set(prev);
      if (ids.length > 0 && ids.every((id) => next.has(id))) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    }),
    selectAll: () => setChecked(new Set(ids)),
    clear: () => setChecked(new Set()),
    keepOnly: (keepIds) => setChecked(new Set(keepIds)),
  };
};

export const SelectAllCheckbox = ({ sel, as: Tag = 'th', className = '' }) => {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.indeterminate = sel.someChecked; }, [sel.someChecked]);
  return (
    <Tag className={`rs-col-check ${className}`} onClick={(e) => e.stopPropagation()}>
      <input
        ref={ref}
        type="checkbox"
        checked={sel.allChecked}
        onChange={sel.toggleAll}
        disabled={sel.total === 0}
        title={sel.allChecked ? tk('unselectAll', 'Tout désélectionner') : tk('selectAllRows', 'Sélectionner les {{total}} lignes', { total: sel.total })}
      />
    </Tag>
  );
};

export const RowCheckbox = ({ sel, id, label }) => (
  <td className="rs-col-check" onClick={(e) => e.stopPropagation()}>
    <input type="checkbox" checked={sel.isChecked(id)} onChange={() => sel.toggle(id)} aria-label={label || tk('selectRow', 'Sélectionner la ligne')} />
  </td>
);

export const BulkBar = ({ sel, actions = [], unit = tk('row', 'ligne'), units }) => {
  if (sel.count === 0) return null;
  const plural = units || `${unit}s`;
  return (
    <div className="rs-bulk-bar">
      <span className="rs-bulk-bar__count">
        {sel.count} {sel.count > 1 ? plural : unit} {tk('selected', 'sélectionné(s)')}
      </span>
      {!sel.allChecked && sel.total > sel.count && (
        <button type="button" className="rs-bulk-bar__link" onClick={sel.selectAll}>
          {tk('selectAll', 'Sélectionner tout')} ({sel.total} {plural})
        </button>
      )}
      <div className="rs-bulk-bar__actions">
        {actions.filter(Boolean).map((a) => (
          <button
            key={a.label}
            type="button"
            className={`rs-bulk-bar__btn ${a.variant ? `rs-bulk-bar__btn--${a.variant}` : ''}`}
            onClick={() => a.onClick(sel.checkedItems)}
            disabled={a.disabled || a.busy}
          >
            {a.busy && a.busyLabel ? a.busyLabel : a.label}
          </button>
        ))}
        <button type="button" className="rs-bulk-bar__btn rs-bulk-bar__btn--ghost" onClick={sel.clear}>
          {tk('unselect', 'Désélectionner')}
        </button>
      </div>
    </div>
  );
};

export const deleteMany = async (items, deleteFn, getId = (x) => x?.id) => {
  const deleted = [];
  const failed = [];
  for (const it of items) {
    try {
      await deleteFn(getId(it), it);
      deleted.push(getId(it));
    } catch (err) {
      console.error('Suppression échouée', getId(it), err);
      failed.push(getId(it));
    }
  }
  return { deleted, failed };
};
