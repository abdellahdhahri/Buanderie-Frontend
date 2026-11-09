import React, { useEffect, useMemo, useRef, useState } from 'react';
import { tk } from './i18n';

const textOf = (node) => {
  if (node == null || node === false || node === true) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  if (React.isValidElement(node)) return textOf(node.props.children);
  return '';
};

const collectOptions = (children, out = []) => {
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    if (child.type === React.Fragment || child.type === 'optgroup') {
      collectOptions(child.props.children, out);
      return;
    }
    if (child.type === 'option') {
      const label = textOf(child.props.children).replace(/\s+/g, ' ').trim();
      const value = child.props.value !== undefined ? String(child.props.value) : label;
      out.push({ value, label, disabled: !!child.props.disabled });
    }
  });
  return out;
};

export const SelectRecherche = ({
  id, name, value, onChange, children, required = false, disabled = false,
  className = '', style, placeholder, emptyMessage = tk('noResult', 'Aucun résultat'), onBlur,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const options = useMemo(() => collectOptions(children), [children]);
  const current = value == null ? '' : String(value);
  const emptyOption = options.find((o) => o.value === '');
  const choices = options.filter((o) => o.value !== '');
  const selected = choices.find((o) => o.value === current);
  const selectedLabel = selected ? selected.label : '';

  useEffect(() => {
    const onDown = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const emit = (v) => {
    if (onChange) onChange({ target: { name, id, value: v, type: 'select-one' }, currentTarget: { name, id, value: v } });
  };

  const open = () => {
    if (disabled) return;
    setIsOpen(true);
    setSearch('');
  };

  const choose = (opt) => {
    if (opt.disabled) return;
    emit(opt.value);
    setIsOpen(false);
    setSearch('');
    inputRef.current?.blur();
    if (onBlur) onBlur({ target: { name, value: opt.value } });
  };

  const clear = (event) => {
    event.stopPropagation();
    emit('');
    setSearch('');
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const onKeyDown = (event) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
      setSearch('');
      inputRef.current?.blur();
    } else if (event.key === 'Enter' && isOpen) {
      event.preventDefault();
      const first = filtered.find((o) => !o.disabled);
      if (first) choose(first);
    }
  };

  const term = search.trim().toLowerCase();
  const filtered = term ? choices.filter((o) => o.label.toLowerCase().includes(term)) : choices;

  return (
    <div className={`kit-ss ${className}`.trim()} style={style} ref={containerRef}>
      <div className={`kit-ss__wrap ${isOpen ? 'is-open' : ''} ${disabled ? 'is-disabled' : ''}`} onClick={() => inputRef.current?.focus()}>
        <span className="kit-ss__icon">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
          </svg>
        </span>
        <input
          ref={inputRef}
          id={id}
          type="text"
          className="kit-ss__input"
          value={isOpen ? search : selectedLabel}
          onChange={(e) => { setSearch(e.target.value); if (!isOpen) setIsOpen(true); }}
          onFocus={open}
          onKeyDown={onKeyDown}
          placeholder={isOpen && selectedLabel ? selectedLabel : (placeholder || emptyOption?.label || tk('select', 'Sélectionner…'))}
          disabled={disabled}
          autoComplete="off"
        />
        {selected && !disabled && (
          <button type="button" className="kit-ss__clear" onClick={clear} aria-label={tk('clear', 'Effacer')} tabIndex={-1}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        )}
        <span className={`kit-ss__chevron ${isOpen ? 'rotated' : ''}`}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
        </span>
      </div>

      {required && (
        <input
          tabIndex={-1}
          aria-hidden="true"
          className="kit-ss__required"
          name={name}
          value={current}
          required
          onChange={() => {}}
          onFocus={() => inputRef.current?.focus()}
        />
      )}

      {isOpen && (
        <div className="kit-ss__menu">
          <div className="kit-ss__options">
            {filtered.length === 0 ? (
              <div className="kit-ss__empty">{emptyMessage}</div>
            ) : filtered.map((o) => (
              <button
                key={o.value}
                type="button"
                className={`kit-ss__option ${o.value === current ? 'is-selected' : ''} ${o.disabled ? 'is-disabled' : ''}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(o)}
              >
                <span className="kit-ss__label">{o.label}</span>
                {o.value === current && (
                  <span className="kit-ss__check">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectRecherche;
