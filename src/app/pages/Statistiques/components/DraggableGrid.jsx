import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { GripVertical } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════════════
   Grille de cartes réorganisables par glisser-déposer.
   items : [{ id, node, span? }]  — span = nombre de colonnes occupées (lg)
   Le déplacement se fait uniquement depuis la poignée (n'interfère pas
   avec les graphiques et les listes). framer-motion anime la réorganisation.
   ═══════════════════════════════════════════════════════════════════════════ */
export function DraggableGrid({ items, order, setOrder, onCommit, className = "", handleLabel = "Déplacer" }) {
  const [draggingId, setDraggingId] = useState(null);
  const [armedId, setArmedId] = useState(null); // carte saisie par sa poignée
  const lastSwap = useRef(0);

  // Relâcher la souris hors d'une carte : on désarme
  useEffect(() => {
    const disarm = () => setArmedId(null);
    window.addEventListener("mouseup", disarm);
    return () => window.removeEventListener("mouseup", disarm);
  }, []);

  const byId = Object.fromEntries(items.map((it) => [it.id, it]));
  const ordered = order.map((id) => byId[id]).filter(Boolean);

  const moveTo = (overId, timeStamp) => {
    if (!draggingId || draggingId === overId) return;
    // Limite les permutations successives pendant l'animation
    if (timeStamp - lastSwap.current < 120) return;
    lastSwap.current = timeStamp;
    setOrder((prev) => {
      const from = prev.indexOf(draggingId);
      const to = prev.indexOf(overId);
      if (from < 0 || to < 0 || from === to) return prev;
      const next = [...prev];
      next.splice(from, 1);
      next.splice(to, 0, draggingId);
      return next;
    });
  };

  return (
    <div className={`stats-grid ${draggingId ? "is-dragging" : ""} ${className}`}>
      {ordered.map((it) => {
        const isDragged = draggingId === it.id;
        return (
          <motion.div
            key={it.id}
            layout
            transition={{ type: "spring", stiffness: 420, damping: 34, mass: 0.7 }}
            className={`stats-tile ${isDragged ? "is-dragged" : ""}`}
            style={{ gridColumn: it.span > 1 ? `span ${it.span}` : undefined }}
            draggable={armedId === it.id}
            onDragStart={(e) => {
              setDraggingId(it.id);
              e.dataTransfer.effectAllowed = "move";
              try { e.dataTransfer.setData("text/plain", it.id); } catch { /* Firefox */ }
            }}
            onDragEnter={(e) => { e.preventDefault(); moveTo(it.id, e.timeStamp); }}
            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
            onDrop={(e) => e.preventDefault()}
            onDragEnd={() => {
              setDraggingId(null);
              setArmedId(null);
              setOrder((current) => { onCommit?.(current); return current; });
            }}
          >
            <button
              type="button"
              className="stats-tile__handle"
              aria-label={handleLabel}
              title={handleLabel}
              onMouseDown={() => setArmedId(it.id)}
              onKeyDown={(e) => {
                // Clavier : flèches pour déplacer la carte
                if (e.key !== "ArrowLeft" && e.key !== "ArrowRight" && e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
                e.preventDefault();
                const step = e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 1;
                setOrder((prev) => {
                  const i = prev.indexOf(it.id);
                  const j = i + step;
                  if (i < 0 || j < 0 || j >= prev.length) return prev;
                  const next = [...prev];
                  [next[i], next[j]] = [next[j], next[i]];
                  onCommit?.(next);
                  return next;
                });
              }}
            >
              <GripVertical className="h-4 w-4" />
            </button>
            {it.node}
          </motion.div>
        );
      })}
    </div>
  );
}
