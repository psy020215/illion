/* Neural string-art hero: photo → woven threads → live signals */
{
  const fig = document.getElementById('neural');
  if (fig) {
    const cv = fig.querySelector('canvas'), ctx = cv.getContext('2d');
    const photo = fig.querySelector('img');
    const light = fig.dataset.theme === 'light';
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const layer = document.createElement('canvas'), lctx = layer.getContext('2d');

    // seeded random for a stable composition
    let seed = 11;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

    // ---- geometry in unit space: width 1, height 1.4 ----
    const H = 1.4, cx = .5, cy = .7;
    const nodes = [];
    const add = (x, y, kind) => (nodes.push({ x, y, kind, glow: 0, last: 0 }), nodes.length - 1);

    const G = 7, gs = .062, grid = [];
    for (let j = 0; j < G; j++) { grid[j] = []; for (let i = 0; i < G; i++) grid[j][i] = add(cx + (i - 3) * gs, cy + (j - 3) * gs * 1.12, 'g'); }

    const N = 16, R = [], star = [];
    for (let k = 0; k <= N / 2; k++) R[k] = (k % 2 ? .27 : .43) + rnd() * .07;
    for (let k = 0; k < N; k++) {
      const a = -Math.PI / 2 + k * 2 * Math.PI / N, r = R[Math.min(k, N - k)];
      star.push(add(cx + Math.cos(a) * r * .98, cy + Math.sin(a) * r * 1.5, 's'));
    }
    const M = 12, ring = [];
    for (let k = 0; k < M; k++) {
      const a = -Math.PI / 2 + (k + .5) * 2 * Math.PI / M;
      ring.push(add(cx + Math.cos(a) * .25, cy + Math.sin(a) * .25 * 1.35, 'm'));
    }

    const threads = [];
    const P = i => nodes[i];
    const line = (ax, ay, bx, by, na, nb, order) => threads.push({ ax, ay, bx, by, na, nb, order });
    const dist = (x, y) => Math.hypot(x - cx, (y - cy) / 1.3);

    // fan: from a pin to every subdivision of a grid row or column
    const fan = (pi, ids, sub, order) => {
      const p = P(pi);
      for (let s = 0; s < ids.length - 1; s++) {
        const a = P(ids[s]), b = P(ids[s + 1]);
        for (let t = 0; t < sub; t++) {
          const f = t / sub;
          line(p.x, p.y, a.x + (b.x - a.x) * f, a.y + (b.y - a.y) * f, pi, t === 0 ? ids[s] : -1, order);
        }
      }
      const e = P(ids[ids.length - 1]);
      line(p.x, p.y, e.x, e.y, pi, ids[ids.length - 1], order);
    };
    const row = j => grid[j], col = i => grid.map(r => r[i]);

    star.forEach((si, k) => {
      const p = P(si), dx = p.x - cx, dy = (p.y - cy) / 1.4;
      for (let f = 0; f < 2; f++) {
        const pick = Math.floor(rnd() * 3), side = f ? Math.abs(dx) <= Math.abs(dy) : Math.abs(dx) > Math.abs(dy);
        const ids = side ? col(dx < 0 ? pick : G - 1 - pick) : row(dy < 0 ? pick : G - 1 - pick);
        fan(si, ids, 5, 1 + k % 3);
      }
    });
    ring.forEach((mi, k) => {
      const p = P(mi), dx = p.x - cx, dy = p.y - cy;
      fan(mi, Math.abs(dx) > Math.abs(dy) ? col(dx < 0 ? G - 2 : 1) : row(dy < 0 ? G - 2 : 1), 4, 0);
      fan(mi, Math.abs(dx) > Math.abs(dy) ? row(dy < 0 ? 0 : G - 1) : col(dx < 0 ? 0 : G - 1), 4, 1);
    });
    // envelopes: star tip → ring → next tip (classic string-art curves)
    const env = (a, b, c, n, order) => {
      for (let t = 0; t <= n; t++) {
        const f = t / n;
        line(a.x + (b.x - a.x) * f, a.y + (b.y - a.y) * f, b.x + (c.x - b.x) * f, b.y + (c.y - b.y) * f, -1, -1, order);
      }
    };
    star.forEach((si, k) => {
      const nearest = ring.reduce((best, mi) => (Math.hypot(P(mi).x - P(si).x, P(mi).y - P(si).y) < Math.hypot(P(best).x - P(si).x, P(best).y - P(si).y) ? mi : best), ring[0]);
      env(P(si), P(nearest), P(star[(k + 1) % N]), 22, 2);
      env(P(star[(k + 1) % N]), P(si), P(ring[(k * 3 >> 2) % M]), 16, 3);
      line(P(si).x, P(si).y, P(nearest).x, P(nearest).y, si, nearest, 1);
      line(P(si).x, P(si).y, P(star[(k + 1) % N]).x, P(star[(k + 1) % N]).y, si, star[(k + 1) % N], 3);
    });
    // grid lattice + diagonals for the dense core
    for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) {
      if (i < G - 1) line(P(grid[j][i]).x, P(grid[j][i]).y, P(grid[j][i + 1]).x, P(grid[j][i + 1]).y, grid[j][i], grid[j][i + 1], 0);
      if (j < G - 1) line(P(grid[j][i]).x, P(grid[j][i]).y, P(grid[j + 1][i]).x, P(grid[j + 1][i]).y, grid[j][i], grid[j + 1][i], 0);
      if (i < G - 1 && j < G - 1) line(P(grid[j][i]).x, P(grid[j][i]).y, P(grid[j + 1][i + 1]).x, P(grid[j + 1][i + 1]).y, grid[j][i], grid[j + 1][i + 1], 0);
      if (i > 0 && j < G - 1) line(P(grid[j][i]).x, P(grid[j][i]).y, P(grid[j + 1][i - 1]).x, P(grid[j + 1][i - 1]).y, grid[j][i], grid[j + 1][i - 1], 0);
    }
    // weave order: from the core outward
    threads.forEach(t => t.w = t.order * .6 + dist((t.ax + t.bx) / 2, (t.ay + t.by) / 2) + rnd() * .15);
    threads.sort((a, b) => a.w - b.w);
    const adj = nodes.map(() => []);
    threads.forEach((t, i) => { if (t.na >= 0) adj[t.na].push(i); if (t.nb >= 0) adj[t.nb].push(i); });

    // ---- sizing ----
    let W = 0, Hp = 0, dpr = 1, sc = 1, ox = 0, oy = 0, drawn = 0;
    const X = x => ox + x * sc, Y = y => oy + y * sc;
    const size = () => {
      const r = fig.getBoundingClientRect();
      dpr = Math.min(2, devicePixelRatio || 1);
      W = r.width; Hp = r.height;
      for (const c of [cv, layer]) { c.width = W * dpr; c.height = Hp * dpr; }
      sc = Math.min(W / 1, Hp / H) * .96;
      ox = (W - sc) / 2; oy = (Hp - H * sc) / 2;
      lctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      lctx.clearRect(0, 0, W, Hp);
      const keep = drawn; drawn = 0; weaveTo(keep);
    };
    const lw = () => Math.max(.45, sc / 900);
    const weaveTo = n => {
      lctx.globalCompositeOperation = light ? 'source-over' : 'lighter';
      lctx.strokeStyle = light ? 'rgba(16,40,70,.12)' : 'rgba(235,240,250,.15)';
      lctx.lineWidth = lw();
      lctx.beginPath();
      for (; drawn < n && drawn < threads.length; drawn++) {
        const t = threads[drawn];
        lctx.moveTo(X(t.ax), Y(t.ay)); lctx.lineTo(X(t.bx), Y(t.by));
      }
      lctx.stroke();
    };

    // ---- signals ----
    const sigs = [];
    const fire = (ni, now, depth) => {
      const n = nodes[ni];
      if (now - n.last < 380) return;
      n.last = now; n.glow = 1;
      const out = adj[ni]; if (!out.length) return;
      const k = depth === 0 ? 3 : (rnd() < .62 ? 1 + (rnd() < .3) : 0);
      for (let i = 0; i < k && sigs.length < 70; i++) {
        const t = threads[out[Math.floor(rnd() * out.length)]];
        const fwd = t.na === ni;
        sigs.push({ t, fwd, p: 0, v: .9 + rnd() * .9, pink: rnd() < .22, depth: depth + 1 });
      }
    };

    // ---- loop ----
    const WEAVE = 2600;
    let start = 0, prev = 0, running = false, visible = true, nextAuto = 0, raf = 0;
    const frame = now => {
      if (!start) start = now;
      const dt = Math.min(50, now - (prev || now)) / 1000; prev = now;
      const el = now - start;

      if (drawn < threads.length) {
        weaveTo(Math.floor(threads.length * Math.min(1, el / WEAVE) ** 1.4));
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, Hp);
      ctx.drawImage(layer, 0, 0, W, Hp);

      // shuttle: the thread being woven right now
      if (drawn < threads.length && drawn > 0) {
        const t = threads[drawn - 1];
        ctx.strokeStyle = light ? 'rgba(30,107,123,.9)' : 'rgba(143,211,255,.9)'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(X(t.ax), Y(t.ay)); ctx.lineTo(X(t.bx), Y(t.by)); ctx.stroke();
      }

      // auto firing after weave
      if (el > WEAVE * .8 && now > nextAuto) {
        fire(Math.floor(rnd() * nodes.length), now, 0);
        nextAuto = now + 420 + rnd() * 700;
      }

      ctx.globalCompositeOperation = light ? 'source-over' : 'lighter';
      for (let i = sigs.length - 1; i >= 0; i--) {
        const s = sigs[i], t = s.t;
        s.p += s.v * dt;
        const [x0, y0, x1, y1] = s.fwd ? [t.ax, t.ay, t.bx, t.by] : [t.bx, t.by, t.ax, t.ay];
        const p = Math.min(1, s.p), q = Math.max(0, p - .22);
        const hx = X(x0 + (x1 - x0) * p), hy = Y(y0 + (y1 - y0) * p);
        const tx = X(x0 + (x1 - x0) * q), ty = Y(y0 + (y1 - y0) * q);
        const col = light ? (s.pink ? '217,70,111' : '30,120,140') : (s.pink ? '255,92,138' : '143,211,255');
        const g = ctx.createLinearGradient(tx, ty, hx, hy);
        g.addColorStop(0, `rgba(${col},0)`); g.addColorStop(1, `rgba(${col},.95)`);
        ctx.strokeStyle = g; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(hx, hy); ctx.stroke();
        ctx.fillStyle = light ? 'rgba(16,33,58,.95)' : 'rgba(255,255,255,.95)';
        ctx.beginPath(); ctx.arc(hx, hy, 1.8, 0, 7); ctx.fill();
        if (s.p >= 1) {
          sigs.splice(i, 1);
          const end = s.fwd ? t.nb : t.na;
          if (end >= 0 && s.depth < 7) fire(end, now, s.depth);
        }
      }

      // pins
      for (const n of nodes) {
        const x = X(n.x), y = Y(n.y);
        if (n.glow > .02) {
          const r = 6 + n.glow * 14;
          const g = ctx.createRadialGradient(x, y, 0, x, y, r);
          g.addColorStop(0, light ? `rgba(43,138,156,${.45 * n.glow})` : `rgba(200,235,255,${.75 * n.glow})`); g.addColorStop(1, light ? 'rgba(43,138,156,0)' : 'rgba(143,211,255,0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
          n.glow *= Math.pow(.12, dt);
        }
        ctx.fillStyle = light ? (n.kind === 'g' ? 'rgba(16,33,58,.6)' : 'rgba(16,33,58,.85)') : (n.kind === 'g' ? 'rgba(230,225,220,.75)' : 'rgba(245,240,235,.9)');
        ctx.beginPath(); ctx.arc(x, y, n.kind === 'g' ? 1.4 : 2.2, 0, 7); ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';

      raf = running && visible ? requestAnimationFrame(frame) : 0;
    };
    const go = () => { if (!raf && running && visible) { prev = 0; raf = requestAnimationFrame(frame); } };

    // pointer: nearby pins fire
    const poke = e => {
      const r = cv.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top, now = performance.now();
      for (let i = 0; i < nodes.length; i++) {
        if (Math.hypot(X(nodes[i].x) - mx, Y(nodes[i].y) - my) < 46) fire(i, now, 1);
      }
    };
    cv.addEventListener('pointermove', poke);
    cv.addEventListener('pointerdown', poke);

    const ro = new ResizeObserver(() => { size(); if (!running || reduce) frame(performance.now()); });
    ro.observe(fig);
    const io = new IntersectionObserver(es => { visible = es[0].isIntersecting; go(); });
    io.observe(fig);
    document.addEventListener('visibilitychange', () => { visible = !document.hidden; go(); });

    size();
    if (reduce) {
      photo.classList.add('gone');
      drawn = 0; weaveTo(threads.length); start = performance.now() - 1e9;
      running = false; frame(performance.now());
    } else {
      // photo holds for a beat, then dissolves while threads weave in
      const begin = () => setTimeout(() => { photo.classList.add('gone'); start = 0; running = true; go(); }, 900);
      if (photo.complete) begin(); else { photo.addEventListener('load', begin); photo.addEventListener('error', begin); }
    }
  }
}
