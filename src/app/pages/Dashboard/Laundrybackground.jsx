import { useEffect, useRef } from "react";
import "./LaundryBackground.css";

/* ═══════════════════════════════════════════════════════════════════════
   🫧 LaundryBackground — fond animé pour le dashboard de la Buanderie
   ───────────────────────────────────────────────────────────────────────
   Couches (de bas en haut) :
     1. Voile dégradé bleu nuit (lisibilité des cartes)
     2. Aurores douces (4 halos qui dérivent) + parallaxe souris
     3. Grille technique très discrète qui glisse lentement
     4. Rayons de lumière (ambiance stérile / propre)
     5. Canvas : lueur curseur → particules reliées → bulles de savon
        → 3 vagues d'eau superposées
     6. Vignettage

   Interactions :
     • le curseur repousse les bulles et relie les particules entre elles
     • près du bas de l'écran, le curseur soulève la vague
     • un clic sur une zone vide fait jaillir des bulles
     • sans souris (mobile), le décor "respire" tout seul

   Performances :
     • une seule boucle requestAnimationFrame, pause si l'onglet est caché
     • bulles pré-rendues (sprite) → simple drawImage
     • qualité adaptative : baisse automatiquement si le FPS chute
     • prefers-reduced-motion respecté (image fixe, sans animation)
   ═══════════════════════════════════════════════════════════════════════ */

const TAU = Math.PI * 2;
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/* Vagues : off = hauteur (fraction de l'écran) depuis le bas */
const WAVES = [
  { amp: 16, len: 0.0042, speed: 0.55, off: 0.135, phase: 0,
    fill: ["rgba(14,116,190,0.22)", "rgba(8,47,90,0.38)"], line: "rgba(125,211,252,0.30)" },
  { amp: 12, len: 0.0068, speed: -0.8, off: 0.105, phase: 2,
    fill: ["rgba(34,211,238,0.16)", "rgba(8,80,120,0.32)"], line: "rgba(165,243,252,0.32)" },
  { amp: 9, len: 0.0095, speed: 1.1, off: 0.072, phase: 4,
    fill: ["rgba(186,230,253,0.14)", "rgba(12,74,110,0.30)"], line: "rgba(224,242,254,0.40)" },
];
const WAVE_STEP = 10;

/* Sprite d'une bulle de savon (dessiné une seule fois) */
function makeBubbleSprite(size = 160) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d");
  const r = size / 2;

  const body = g.createRadialGradient(r, r, r * 0.55, r, r, r);
  body.addColorStop(0, "rgba(200,240,255,0)");
  body.addColorStop(0.75, "rgba(150,220,255,0.10)");
  body.addColorStop(0.93, "rgba(180,235,255,0.34)");
  body.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = body;
  g.beginPath();
  g.arc(r, r, r - 1, 0, TAU);
  g.fill();

  g.strokeStyle = "rgba(220,245,255,0.55)";
  g.lineWidth = size * 0.012;
  g.beginPath();
  g.arc(r, r, r * 0.94, 0, TAU);
  g.stroke();

  g.lineCap = "round";
  g.lineWidth = size * 0.035;
  g.strokeStyle = "rgba(120,255,230,0.30)";
  g.beginPath();
  g.arc(r, r, r * 0.86, Math.PI * 0.15, Math.PI * 0.55);
  g.stroke();
  g.strokeStyle = "rgba(255,170,230,0.22)";
  g.beginPath();
  g.arc(r, r, r * 0.86, Math.PI * 1.15, Math.PI * 1.5);
  g.stroke();

  g.fillStyle = "rgba(255,255,255,0.78)";
  g.beginPath();
  g.ellipse(r * 0.62, r * 0.5, r * 0.16, r * 0.09, -0.6, 0, TAU);
  g.fill();
  g.fillStyle = "rgba(255,255,255,0.35)";
  g.beginPath();
  g.arc(r * 1.36, r * 1.44, r * 0.05, 0, TAU);
  g.fill();

  return c;
}

export default function LaundryBackground() {
  const rootRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return undefined;
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;

    const motionMq = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduceMotion = motionMq.matches;

    const sprite = makeBubbleSprite();
    let W = 0;
    let H = 0;
    let quality = 1;
    let bubbles = [];
    let motes = [];
    let ys = new Float32Array(0);

    const pointer = { x: -9999, y: -9999, tx: -9999, ty: -9999, active: false, glow: 0 };
    const par = { x: 0, y: 0, lastX: 99, lastY: 99 };
    let energy = 0;
    let time = 0;
    let last = 0;
    let raf = 0;
    let running = false;
    let frames = 0;
    let acc = 0;
    let warmup = 60;
    let resizeTimer = 0;

    /* ── Effectifs selon la taille de l'écran et la qualité ───────────── */
    const targetCounts = () => {
      const q = (W < 768 ? 0.6 : 1) * quality;
      const area = W * H;
      return {
        bubbles: Math.round(clamp(area / 45000, 12, 42) * q),
        motes: Math.round(clamp(area / 20000, 24, 80) * q),
      };
    };

    const makeBubble = (initial = false) => {
      const depth = rand(0.35, 1);
      const r = rand(6, 30) * depth * (W < 768 ? 0.8 : 1) + 3;
      return {
        x: rand(0, W),
        y: initial ? rand(0, H) : H + r + rand(0, H * 0.25),
        r,
        depth,
        vy: rand(14, 38) * (0.5 + depth * 0.7),
        wob: rand(6, 18),
        wobSpeed: rand(0.6, 1.6),
        phase: rand(0, TAU),
        alpha: rand(0.35, 0.85) * (0.5 + depth * 0.5),
        ix: 0,
        iy: 0,
        temp: false,
        life: 0,
        dead: false,
      };
    };

    const makeMote = () => ({
      x: rand(0, W),
      y: rand(0, H),
      vx: rand(-6, 6),
      vy: rand(-12, -3),
      r: rand(0.8, 2.2),
      tw: rand(0, TAU),
      twSpeed: rand(0.8, 2.2),
      depth: rand(0.3, 1),
      sx: 0,
      sy: 0,
    });

    const seed = () => {
      const c = targetCounts();
      bubbles = Array.from({ length: c.bubbles }, () => makeBubble(true));
      motes = Array.from({ length: c.motes }, () => makeMote());
    };

    const trim = () => {
      const c = targetCounts();
      let keep = c.bubbles;
      bubbles = bubbles.filter((b) => b.temp || keep-- > 0);
      motes.length = Math.min(motes.length, c.motes);
    };

    /* ── Dimensionnement ──────────────────────────────────────────────── */
    const resize = () => {
      const nw = window.innerWidth;
      const nh = window.innerHeight;
      const widthChanged = nw !== W;
      W = nw;
      H = nh;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ys = new Float32Array(Math.ceil(W / WAVE_STEP) + 3);
      if (widthChanged || !bubbles.length) seed();
      if (reduceMotion) draw();
    };

    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(resize, 150);
    };

    /* ── Interactions ─────────────────────────────────────────────────── */
    const onMove = (e) => {
      const dist = Math.hypot(e.clientX - pointer.tx, e.clientY - pointer.ty);
      if (!pointer.active) {
        pointer.x = e.clientX;
        pointer.y = e.clientY;
      } else {
        energy = Math.min(1, energy + dist * 0.0018);
      }
      pointer.tx = e.clientX;
      pointer.ty = e.clientY;
      pointer.active = true;
    };
    const onLeave = () => { pointer.active = false; };
    const onUp = (e) => { if (e.pointerType === "touch") pointer.active = false; };

    const burst = (x, y) => {
      if (bubbles.length > 100) return;
      for (let i = 0; i < 7; i += 1) {
        bubbles.push({
          x: x + rand(-8, 8),
          y: y + rand(-8, 8),
          r: rand(4, 12),
          depth: rand(0.6, 1),
          vy: rand(30, 80),
          wob: rand(8, 20),
          wobSpeed: rand(1, 2.4),
          phase: rand(0, TAU),
          alpha: 0.9,
          ix: rand(-160, 160),
          iy: rand(-200, -40),
          temp: true,
          life: rand(2.2, 3.6),
          dead: false,
        });
      }
    };

    const onDown = (e) => {
      if (reduceMotion) return;
      const t = e.target;
      if (t instanceof Element &&
          t.closest('a, button, input, select, textarea, [role="button"], .dashboard-card, .sidebar')) {
        return;
      }
      burst(e.clientX, e.clientY);
    };

    /* ── Mise à jour ──────────────────────────────────────────────────── */
    const update = (dt) => {
      // souris lissée + intensité
      const k = 1 - Math.exp(-12 * dt);
      pointer.x += (pointer.tx - pointer.x) * k;
      pointer.y += (pointer.ty - pointer.y) * k;
      pointer.glow += ((pointer.active ? 1 : 0) - pointer.glow) * (1 - Math.exp(-4 * dt));
      energy *= Math.exp(-1.5 * dt);

      // parallaxe (souris, sinon balancement lent automatique)
      const tnx = pointer.active ? (pointer.tx / W - 0.5) * 2 : Math.sin(time * 0.2) * 0.55;
      const tny = pointer.active ? (pointer.ty / H - 0.5) * 2 : Math.cos(time * 0.16) * 0.35;
      const kp = 1 - Math.exp(-3 * dt);
      par.x += (tnx - par.x) * kp;
      par.y += (tny - par.y) * kp;
      if (Math.abs(par.x - par.lastX) > 0.001 || Math.abs(par.y - par.lastY) > 0.001) {
        root.style.setProperty("--px", par.x.toFixed(3));
        root.style.setProperty("--py", par.y.toFixed(3));
        par.lastX = par.x;
        par.lastY = par.y;
      }

      // particules
      for (const m of motes) {
        m.x += m.vx * dt;
        m.y += m.vy * dt;
        if (m.y < -10) { m.y = H + 10; m.x = rand(0, W); }
        if (m.x < -10) m.x = W + 10;
        else if (m.x > W + 10) m.x = -10;
        m.sx = m.x - par.x * m.depth * 18;
        m.sy = m.y - par.y * m.depth * 12;
      }

      // bulles
      let anyDead = false;
      const damp = Math.exp(-2.5 * dt);
      for (const b of bubbles) {
        b.y -= b.vy * dt;
        b.x += Math.sin(time * b.wobSpeed + b.phase) * b.wob * dt;

        if (pointer.glow > 0.05) {
          const dx = b.x - par.x * b.depth * -30 - pointer.x;
          const dy = b.y - pointer.y;
          const d = Math.hypot(dx, dy);
          const reach = 130 + b.r;
          if (d > 0.01 && d < reach) {
            const f = (1 - d / reach) * 600 * dt;
            b.ix += (dx / d) * f;
            b.iy += (dy / d) * f;
          }
        }
        b.x += b.ix * dt;
        b.y += b.iy * dt;
        b.ix *= damp;
        b.iy *= damp;

        if (b.temp) {
          b.life -= dt;
          if (b.life <= 0) { b.dead = true; anyDead = true; }
        }
        if (b.y < -b.r * 2) {
          if (b.temp) { b.dead = true; anyDead = true; }
          else Object.assign(b, makeBubble(false));
        }
        if (b.x < -b.r * 2) b.x = W + b.r;
        else if (b.x > W + b.r * 2) b.x = -b.r;
      }
      if (anyDead) bubbles = bubbles.filter((b) => !b.dead);
    };

    /* ── Rendu ────────────────────────────────────────────────────────── */
    const drawGlow = () => {
      if (pointer.glow < 0.02) return;
      const R = 230;
      const g = ctx.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, R);
      g.addColorStop(0, `rgba(56,189,248,${0.17 * pointer.glow})`);
      g.addColorStop(1, "rgba(56,189,248,0)");
      ctx.fillStyle = g;
      ctx.fillRect(pointer.x - R, pointer.y - R, R * 2, R * 2);
    };

    const drawMotes = () => {
      const LINK = W < 768 ? 90 : 120;
      const LINK2 = LINK * LINK;
      const CURSOR = 170;

      // liens entre particules
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgb(125,211,252)";
      for (let i = 0; i < motes.length; i += 1) {
        const a = motes[i];
        for (let j = i + 1; j < motes.length; j += 1) {
          const b = motes[j];
          const dx = a.sx - b.sx;
          const dy = a.sy - b.sy;
          const d2 = dx * dx + dy * dy;
          if (d2 < LINK2) {
            ctx.globalAlpha = (1 - d2 / LINK2) * 0.2;
            ctx.beginPath();
            ctx.moveTo(a.sx, a.sy);
            ctx.lineTo(b.sx, b.sy);
            ctx.stroke();
          }
        }
        // liens vers le curseur
        if (pointer.glow > 0.05) {
          const dx = a.sx - pointer.x;
          const dy = a.sy - pointer.y;
          const d = Math.hypot(dx, dy);
          if (d < CURSOR) {
            ctx.globalAlpha = (1 - d / CURSOR) * 0.45 * pointer.glow;
            ctx.strokeStyle = "rgb(186,230,253)";
            ctx.beginPath();
            ctx.moveTo(a.sx, a.sy);
            ctx.lineTo(pointer.x, pointer.y);
            ctx.stroke();
            ctx.strokeStyle = "rgb(125,211,252)";
          }
        }
      }

      // points scintillants
      ctx.fillStyle = "rgb(200,238,255)";
      for (const m of motes) {
        const tw = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(time * m.twSpeed + m.tw));
        ctx.globalAlpha = tw * 0.85;
        ctx.beginPath();
        ctx.arc(m.sx, m.sy, m.r, 0, TAU);
        ctx.fill();
        if (m.r > 1.6) {
          ctx.globalAlpha = tw * 0.14;
          ctx.beginPath();
          ctx.arc(m.sx, m.sy, m.r * 3.2, 0, TAU);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    };

    const drawBubbles = () => {
      for (const b of bubbles) {
        const fade = b.temp ? Math.min(1, b.life / 0.6) : 1;
        const sx = b.x + par.x * b.depth * 30;
        const sy = b.y + par.y * b.depth * 20;
        ctx.globalAlpha = b.alpha * fade;
        ctx.drawImage(sprite, sx - b.r, sy - b.r, b.r * 2, b.r * 2);
      }
      ctx.globalAlpha = 1;
    };

    const drawWaves = () => {
      const ampScale = clamp(H / 900, 0.7, 1.25);
      const ampMul = 1 + energy * 0.9;
      const prox = pointer.glow * clamp(1 - (H - pointer.y) / (H * 0.32), 0, 1);
      const n = Math.ceil(W / WAVE_STEP) + 1;

      for (const w of WAVES) {
        const baseY = H * (1 - w.off);
        const a = w.amp * ampScale * ampMul;

        for (let i = 0; i <= n; i += 1) {
          const x = i * WAVE_STEP;
          let y = baseY
            + Math.sin(x * w.len + time * w.speed + w.phase) * a
            + Math.sin(x * w.len * 2.1 - time * w.speed * 0.6 + w.phase * 1.7) * a * 0.38;
          if (prox > 0.01) {
            const dx = x - pointer.x;
            y -= prox * 22 * Math.exp(-(dx * dx) / (2 * 110 * 110));
          }
          ys[i] = y;
        }

        const g = ctx.createLinearGradient(0, baseY - a, 0, H);
        g.addColorStop(0, w.fill[0]);
        g.addColorStop(1, w.fill[1]);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(0, H + 2);
        for (let i = 0; i <= n; i += 1) ctx.lineTo(i * WAVE_STEP, ys[i]);
        ctx.lineTo(n * WAVE_STEP, H + 2);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = w.line;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = 0; i <= n; i += 1) {
          if (i === 0) ctx.moveTo(0, ys[0]);
          else ctx.lineTo(i * WAVE_STEP, ys[i]);
        }
        ctx.stroke();
      }
    };

    function draw() {
      ctx.clearRect(0, 0, W, H);
      drawGlow();
      drawMotes();
      drawBubbles();
      drawWaves();
    }

    /* ── Boucle ───────────────────────────────────────────────────────── */
    const frame = (ts) => {
      if (!running) return;
      raf = requestAnimationFrame(frame);
      if (!last) last = ts;
      const dt = Math.min((ts - last) / 1000, 0.05);
      last = ts;
      time += dt;

      update(dt);
      draw();

      // qualité adaptative : on allège si l'appareil peine
      if (warmup > 0) { warmup -= 1; return; }
      acc += dt;
      frames += 1;
      if (frames >= 90) {
        const fps = frames / acc;
        frames = 0;
        acc = 0;
        if (fps < 42 && quality > 0.45) {
          quality *= 0.75;
          trim();
        }
      }
    };

    const start = () => {
      if (running || reduceMotion || document.hidden) return;
      running = true;
      last = 0;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const onVisibility = () => (document.hidden ? stop() : start());
    const onMotionChange = (e) => {
      reduceMotion = e.matches;
      if (reduceMotion) { stop(); draw(); } else start();
    };

    resize();
    if (reduceMotion) { time = 1.2; draw(); } else start();

    window.addEventListener("resize", onResize);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("pointercancel", onUp, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    document.addEventListener("visibilitychange", onVisibility);
    motionMq.addEventListener("change", onMotionChange);

    return () => {
      stop();
      window.clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
      motionMq.removeEventListener("change", onMotionChange);
    };
  }, []);

  return (
    <div ref={rootRef} className="laundry-bg" aria-hidden="true">
      <div className="laundry-bg__tint" />
      <div className="laundry-bg__aurora">
        <span className="a1" />
        <span className="a2" />
        <span className="a3" />
        <span className="a4" />
      </div>
      <div className="laundry-bg__grid" />
      <div className="laundry-bg__rays" />
      <canvas ref={canvasRef} className="laundry-bg__canvas" />
      <div className="laundry-bg__vignette" />
    </div>
  );
}