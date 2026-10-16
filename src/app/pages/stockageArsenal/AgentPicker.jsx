import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowRight, Search, X } from "lucide-react";
import { fetchPersonnel } from "../../services/receptionArsenalService";
import { EmptyState, Loading } from "./arsenalUi";

const MAX_RESULTS = 60;

const normalize = (s) =>
  String(s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

const initials = (name) =>
  String(name || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

// La liste du personnel ne change pas pendant la session : un seul chargement
let cache = null;

/** Choix de l'agent dans la liste du personnel (alternative au scan du badge). */
export default function AgentPicker({ onPick, disabled }) {
  const { t } = useTranslation();
  const [personnel, setPersonnel] = useState(cache);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (cache) return;
    fetchPersonnel()
      .then((list) => {
        cache = list;
        setPersonnel(list);
      })
      .catch((e) => setError(e.message));
  }, []);

  const filtered = useMemo(() => {
    if (!personnel) return [];
    const q = normalize(search.trim());
    if (!q) return personnel;
    return personnel.filter((p) =>
      [p.nomPrenom, p.matricule, p.codeBarre, p.fonction].some((v) => normalize(v).includes(q))
    );
  }, [personnel, search]);

  if (error) return <div className="sa-error">{error}</div>;
  if (!personnel) return <Loading />;

  return (
    <div className="sa-agents">
      <div className="sa-search">
        <Search size={17} />
        <input
          type="text"
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("stockageArsenal.search_agent")}
          aria-label={t("stockageArsenal.search_agent")}
        />
        {search && (
          <button type="button" onClick={() => setSearch("")} aria-label={t("common.reset")}>
            <X size={15} />
          </button>
        )}
      </div>

      <div className="sa-agents__meta">
        {t("stockageArsenal.agents_found", { count: filtered.length })}
        {filtered.length > MAX_RESULTS && ` · ${t("stockageArsenal.refine_search", { max: MAX_RESULTS })}`}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title={t("stockageArsenal.no_agent_found")} />
      ) : (
        <div className="sa-agents__list">
          {filtered.slice(0, MAX_RESULTS).map((p) => (
            <button key={p.id ?? p.badge} type="button" className="sa-agent" onClick={() => onPick(p.badge)} disabled={disabled}>
              <span className="sa-agent__avatar">{initials(p.nomPrenom)}</span>
              <span className="sa-agent__text">
                <strong>{p.nomPrenom || p.badge}</strong>
                <small>
                  {p.matricule || p.codeBarre}
                  {p.fonction && ` · ${p.fonction}`}
                </small>
              </span>
              <ArrowRight size={16} className="sa-agent__go" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
