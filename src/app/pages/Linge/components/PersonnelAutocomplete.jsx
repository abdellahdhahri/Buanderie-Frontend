import React from "react";
import { X, Check, User as UserIcon } from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════════
// 🔍 AUTOCOMPLETE PERSONNEL — Recherche par nom, prénom, matricule, code-barre
// ═══════════════════════════════════════════════════════════════════════════
export function PersonnelAutocomplete({ value, onChange, personnel = [], placeholder = "Rechercher..." }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [highlightedIndex, setHighlightedIndex] = React.useState(0);
  const [focused, setFocused] = React.useState(false);
  const containerRef = React.useRef(null);
  const inputRef = React.useRef(null);

  // Porteur actuellement sélectionné
  const selected = personnel.find(p => p.id === value) || null;

  // Filtrer selon la query
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return personnel.slice(0, 50);
    return personnel.filter(p => {
      const full = `${p.prenom} ${p.nom}`.toLowerCase();
      const rev  = `${p.nom} ${p.prenom}`.toLowerCase();
      return (
        full.includes(q) ||
        rev.includes(q) ||
        (p.matricule || "").toLowerCase().includes(q) ||
        (p.codeBarre || "").toLowerCase().includes(q) ||
        (p.nomPrenom || "").toLowerCase().includes(q)
      );
    }).slice(0, 50);
  }, [personnel, query]);

  const openDropdown = () => {
    setIsOpen(true);
    setHighlightedIndex(0);
  };

  const selectPerson = (person) => {
    onChange(person.id);
    setQuery("");
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const clearSelection = (e) => {
    e.stopPropagation();
    onChange("");
    setQuery("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (!isOpen && (e.key === "ArrowDown" || e.key === "Enter")) {
      openDropdown();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex(i => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[highlightedIndex]) selectPerson(filtered[highlightedIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      {/* ─── Champ de saisie ─── */}
      <div
        onClick={() => {
          inputRef.current?.focus();
          openDropdown();
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          height: "40px",
          padding: "0 12px 0 14px",
          borderRadius: "10px",
          border: `1px solid ${focused || isOpen ? "rgba(20,184,166,0.7)" : "#e2e8f0"}`,
          background: "white",
          boxShadow: focused || isOpen ? "0 0 0 3px rgba(20,184,166,0.12)" : "0 1px 2px rgba(15,23,42,0.04)",
          transition: "border-color 0.15s ease, box-shadow 0.15s ease",
          cursor: "text",
          boxSizing: "border-box"
        }}
      >
        <UserIcon size={14} style={{ color: "#94a3b8", flexShrink: 0 }} />

        {selected ? (
          <div style={{
            flex: 1, display: "flex", alignItems: "center", gap: "8px", minWidth: 0
          }}>
            <span style={{
              fontSize: "13px", fontWeight: 600, color: "#0f172a",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
            }}>
              {selected.prenom} {selected.nom}
            </span>
            {selected.codeBarre && (
              <code style={{
                fontSize: "10px", fontWeight: 700, color: "#0ea5e9",
                background: "#ecfeff", padding: "2px 6px", borderRadius: "5px",
                flexShrink: 0
              }}>
                {selected.codeBarre}
              </code>
            )}
          </div>
        ) : (
          <input
            ref={inputRef}
            className="modal-bare"
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              openDropdown();
              setHighlightedIndex(0);
            }}
            onFocus={() => { setFocused(true); openDropdown(); }}
            onBlur={() => setFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            style={{
              flex: 1,
              height: "100%",
              border: "none",
              outline: "none",
              fontSize: "13px",
              fontWeight: 500,
              color: "#0f172a",
              background: "transparent",
              padding: 0,
              minWidth: 0
            }}
          />
        )}

        {selected ? (
          <button
            type="button"
            onClick={clearSelection}
            style={{
              width: "20px", height: "20px",
              borderRadius: "50%",
              border: "none",
              background: "#f1f5f9",
              color: "#64748b",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
              transition: "all 0.15s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#fee2e2";
              e.currentTarget.style.color = "#dc2626";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#f1f5f9";
              e.currentTarget.style.color = "#64748b";
            }}
          >
            <X size={11} strokeWidth={3} />
          </button>
        ) : (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            style={{
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
              flexShrink: 0
            }}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        )}
      </div>

      {/* ─── Dropdown ─── */}
      {isOpen && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 6px)",
          left: 0,
          right: 0,
          maxHeight: "260px",
          overflowY: "auto",
          background: "white",
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          boxShadow: "0 12px 32px rgba(15,23,42,0.12), 0 0 0 1px rgba(15,23,42,0.02)",
          zIndex: 9999,
          padding: "4px"
        }}>
          <div style={{
            padding: "6px 10px",
            fontSize: "10px",
            fontWeight: 700,
            color: "#94a3b8",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            borderBottom: "1px solid #f1f5f9",
            marginBottom: "4px"
          }}>
            {filtered.length} {filtered.length > 1 ? "résultats" : "résultat"}
            {query && ` pour "${query}"`}
          </div>

          {filtered.length === 0 ? (
            <div style={{
              padding: "20px",
              textAlign: "center",
              fontSize: "12px",
              color: "#94a3b8"
            }}>
              <div style={{ fontSize: "20px", marginBottom: "6px", opacity: 0.3 }}>🔍</div>
              Aucun porteur trouvé
            </div>
          ) : (
            filtered.map((p, idx) => {
              const isHighlighted = idx === highlightedIndex;
              const isSelected = p.id === value;
              return (
                <button
                  key={p.id}
                  type="button"
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  onClick={() => selectPerson(p)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "8px 10px",
                    borderRadius: "8px",
                    border: "none",
                    background: isSelected
                      ? "#ecfeff"
                      : isHighlighted
                        ? "#f8fafc"
                        : "transparent",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.1s",
                    boxSizing: "border-box"
                  }}
                >
                  <div style={{
                    width: "30px", height: "30px",
                    borderRadius: "9px",
                    background: isSelected
                      ? "linear-gradient(135deg, #0ea5e9, #0284c7)"
                      : "linear-gradient(135deg, #e0f2fe, #bae6fd)",
                    color: isSelected ? "white" : "#0369a1",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "11px", fontWeight: 800,
                    flexShrink: 0
                  }}>
                    {(p.prenom?.[0] || "").toUpperCase()}{(p.nom?.[0] || "").toUpperCase()}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: "13px", fontWeight: 700, color: "#0f172a",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                    }}>
                      {p.prenom} {p.nom}
                    </div>
                    <div style={{
                      fontSize: "10.5px", color: "#94a3b8", fontWeight: 600,
                      display: "flex", gap: "8px", marginTop: "1px"
                    }}>
                      {p.matricule && <span>#{p.matricule}</span>}
                      {p.codeBarre && <span>· {p.codeBarre}</span>}
                    </div>
                  </div>

                  {isSelected && (
                    <Check size={14} style={{ color: "#0ea5e9", flexShrink: 0 }} strokeWidth={3} />
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
