/* Signal system: bounded, deterministic motion with an accessible static mode. */
(() => {
  'use strict';
  const init = () => {
    const root = document.documentElement;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const preferenceKey = 'portfolio-motion';
    let preference = null;
    try { preference = localStorage.getItem(preferenceKey); } catch (_) {}
    let motion = preference === 'on' || (preference !== 'off' && !reduce.matches);
    const toggle = document.getElementById('motion-toggle');
    const canvas = document.getElementById('signal-canvas');
    const context = canvas && canvas.getContext('2d');
    const decoders = new Map();
    const decoded = new WeakSet();
    const observed = new WeakSet();
    let canvasVisible = true;
    let frame = 0;
    let lastFrame = 0;
    let phase = 0.55;
    let width = 0;
    let height = 0;
    let dpr = 1;
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    const glyphs = '01/<>[]_+*#';

    function finishDecodes() {
      decoders.forEach((animation, element) => {
        clearTimeout(animation.timer);
        animation.visual.textContent = element.dataset.text;
      });
      decoders.clear();
    }

    function decode(element) {
      if (!motion || document.hidden || decoders.has(element)) return;
      const final = element.dataset.text;
      if (!final || element.children.length && !element.dataset.decodeReady) return;
      let visual = element.querySelector('[data-decode-visual]');
      if (!visual) {
        const accessible = document.createElement('span');
        accessible.textContent = final;
        accessible.style.cssText = 'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0';
        visual = document.createElement('span');
        visual.dataset.decodeVisual = '';
        visual.setAttribute('aria-hidden', 'true');
        visual.textContent = final;
        element.replaceChildren(accessible, visual);
        element.dataset.decodeReady = 'true';
      }
      const letters = Array.from(final);
      const started = performance.now();
      const animation = { visual, timer: 0 };
      decoders.set(element, animation);
      function step() {
        const elapsed = performance.now() - started;
        if (elapsed >= 460 || !motion || document.hidden) {
          visual.textContent = final;
          decoders.delete(element);
          return;
        }
        const progress = elapsed / 460;
        const tick = Math.floor(elapsed / 42);
        visual.textContent = letters.map((letter, index) => {
          if (/\s/.test(letter) || index / Math.max(letters.length, 1) < progress) return letter;
          return glyphs[(index * 7 + tick * 3) % glyphs.length];
        }).join('');
        animation.timer = window.setTimeout(step, 42);
      }
      step();
    }

    const revealObserver = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const element = entry.target;
        element.classList.add('is-visible');
        if (element.matches('.decode[data-text]') && !decoded.has(element)) {
          decoded.add(element);
          decode(element);
        }
        revealObserver.unobserve(element);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -16px 0px' }) : null;

    function observeElements(scope = document) {
      scope.querySelectorAll('.reveal, .decode[data-text]').forEach(element => {
        if (observed.has(element)) return;
        observed.add(element);
        if (revealObserver && motion) revealObserver.observe(element);
        else element.classList.add('is-visible');
      });
    }

    document.addEventListener('pointerover', event => {
      const element = event.target.closest && event.target.closest('.decode[data-text]');
      if (element && (!event.relatedTarget || !element.contains(event.relatedTarget))) decode(element);
    }, { passive: true });
    document.addEventListener('pointermove', event => {
      if (!motion || event.pointerType === 'touch') return;
      const card = event.target.closest && event.target.closest('.project-card');
      if (!card) return;
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${Math.round(event.clientX - rect.left)}px`);
      card.style.setProperty('--my', `${Math.round(event.clientY - rect.top)}px`);
    }, { passive: true });

    // One fixed toroidal lattice, rather than independent floating particles.
    const rings = 80;
    const slices = 16;
    const points = [];
    for (let ring = 0; ring < rings; ring++) {
      const u = ring / rings * Math.PI * 2;
      for (let slice = 0; slice < slices; slice++) {
        const v = slice / slices * Math.PI * 2;
        const radius = 1.13 + 0.38 * Math.cos(v);
        points.push({
          x: radius * Math.cos(u),
          y: radius * Math.sin(u),
          z: 0.38 * Math.sin(v),
          ring, slice,
          accent: (ring * 11 + slice * 13) % 173 === 0,
          bright: slice % 4 === 0
        });
      }
    }

    function project(x, y, z, angle, tilt) {
      const ca = Math.cos(angle), sa = Math.sin(angle);
      const ct = Math.cos(tilt), st = Math.sin(tilt);
      const ax = x * ca - y * sa;
      const ay = x * sa + y * ca;
      const by = ay * ct - z * st;
      const bz = ay * st + z * ct;
      // A mild fixed roll gives the volume a sculptural diagonal silhouette.
      const roll = -0.32;
      const rx = ax * Math.cos(roll) - by * Math.sin(roll);
      const ry = ax * Math.sin(roll) + by * Math.cos(roll);
      const perspective = 4.8 / (4.8 - bz);
      const scale = Math.min(width * 0.265, height * 0.36);
      return { x: width / 2 + rx * scale * perspective,
        y: height / 2 + ry * scale * perspective, z: bz, perspective };
    }

    function draw() {
      if (!context || width < 1 || height < 1) return;
      const ctx = context;
      ctx.clearRect(0, 0, width, height);
      // Quiet drafting grid remains visible in still mode.
      ctx.fillStyle = 'rgba(191,203,166,0.13)';
      const spacing = width < 400 ? 24 : 28;
      const ox = (width % spacing) / 2, oy = (height % spacing) / 2;
      for (let x = ox; x < width; x += spacing) {
        for (let y = oy; y < height; y += spacing) ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
      }
      const angle = phase + pointer.x * 0.14;
      const tilt = 0.98 + Math.sin(phase * 0.45) * 0.17 + pointer.y * 0.1;
      const projected = points.map(point => ({ ...project(point.x, point.y, point.z, angle, tilt), point }));
      // Sparse longitudinal construction lines make the geometry legible.
      ctx.lineWidth = 0.65;
      for (let slice = 0; slice < slices; slice += 4) {
        for (let ring = 0; ring < rings; ring++) {
          const a = projected[ring * slices + slice];
          const b = projected[((ring + 1) % rings) * slices + slice];
          ctx.strokeStyle = `rgba(197,238,129,${0.035 + (a.z + 1.6) / 3.2 * 0.095})`;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      projected.sort((a, b) => a.z - b.z);
      projected.forEach(p => {
        const depth = Math.max(0, Math.min(1, (p.z + 1.6) / 3.2));
        const alpha = 0.17 + depth * 0.73;
        ctx.fillStyle = p.point.accent ? `rgba(247,135,80,${alpha})`
          : p.point.bright ? `rgba(224,230,207,${alpha * 0.86})`
          : `rgba(195,238,130,${alpha})`;
        const size = p.point.accent ? 3.2 : (depth > 0.66 ? 2.2 : 1.5);
        ctx.fillRect(Math.round(p.x - size / 2), Math.round(p.y - size / 2), size, size);
      });
      // Restrained registration marks belong to the visual instrument.
      ctx.strokeStyle = 'rgba(199,215,175,0.3)';
      ctx.lineWidth = 1;
      [[24, 24], [width - 24, 24], [24, height - 24], [width - 24, height - 24]].forEach(([x, y]) => {
        ctx.beginPath(); ctx.moveTo(x - 4, y); ctx.lineTo(x + 4, y);
        ctx.moveTo(x, y - 4); ctx.lineTo(x, y + 4); ctx.stroke();
      });
    }

    function animate(now) {
      frame = 0;
      if (!motion || document.hidden || !canvasVisible || !context) return;
      if (now - lastFrame >= 1000 / 30) {
        const delta = lastFrame ? Math.min((now - lastFrame) / 1000, 0.08) : 0;
        lastFrame = now;
        phase += delta * 0.105;
        pointer.x += (pointer.tx - pointer.x) * 0.055;
        pointer.y += (pointer.ty - pointer.y) * 0.055;
        draw();
      }
      frame = requestAnimationFrame(animate);
    }
    function syncAnimation() {
      if (frame) cancelAnimationFrame(frame);
      frame = 0; lastFrame = 0;
      if (motion && !document.hidden && canvasVisible && context) frame = requestAnimationFrame(animate);
      else if (!document.hidden && canvasVisible) draw();
    }
    function resize() {
      if (!canvas || !context) return;
      const rect = canvas.getBoundingClientRect();
      width = Math.max(0, rect.width); height = Math.max(0, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!document.hidden && canvasVisible) draw();
    }

    function applyMotion() {
      root.dataset.motion = motion ? 'on' : 'off';
      root.classList.toggle('motion-off', !motion);
      root.classList.toggle('motion-ready', motion && !!revealObserver);
      if (toggle) {
        toggle.setAttribute('aria-pressed', String(motion));
        toggle.setAttribute('aria-label', motion ? '动态效果已开启，点击关闭' : '动态效果已关闭，点击开启');
        const label = toggle.querySelector('[data-motion-label]');
        if (label) label.textContent = motion ? 'MOTION ON' : 'MOTION OFF';
      }
      if (!motion) {
        finishDecodes();
        document.querySelectorAll('.reveal').forEach(element => element.classList.add('is-visible'));
      }
      syncAnimation();
    }
    if (toggle) toggle.addEventListener('click', () => {
      motion = !motion;
      preference = motion ? 'on' : 'off';
      try { localStorage.setItem(preferenceKey, preference); } catch (_) {}
      applyMotion();
    });
    const onReduceChange = () => {
      if (preference === 'on' || preference === 'off') return;
      motion = !reduce.matches;
      applyMotion();
    };
    if (reduce.addEventListener) reduce.addEventListener('change', onReduceChange);
    else if (reduce.addListener) reduce.addListener(onReduceChange);

    if (canvas && context) {
      canvas.setAttribute('aria-hidden', 'true');
      canvas.dataset.ready = 'true';
      canvas.addEventListener('pointermove', event => {
        if (!motion || event.pointerType === 'touch') return;
        const rect = canvas.getBoundingClientRect();
        pointer.tx = Math.max(-1, Math.min(1, (event.clientX - rect.left) / Math.max(rect.width, 1) * 2 - 1));
        pointer.ty = Math.max(-1, Math.min(1, (event.clientY - rect.top) / Math.max(rect.height, 1) * 2 - 1));
      }, { passive: true });
      canvas.addEventListener('pointerleave', () => { pointer.tx = 0; pointer.ty = 0; }, { passive: true });
      if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
      else window.addEventListener('resize', resize, { passive: true });
      if ('IntersectionObserver' in window) new IntersectionObserver(entries => {
        canvasVisible = entries[0].isIntersecting;
        syncAnimation();
      }, { threshold: 0 }).observe(canvas);
      resize();
    }

    const clock = document.getElementById('local-clock');
    let clockTimer = 0;
    function tickClock() {
      clearTimeout(clockTimer);
      if (!clock || document.hidden) return;
      const now = new Date();
      clock.textContent = [now.getHours(), now.getMinutes(), now.getSeconds()].map(value => String(value).padStart(2, '0')).join(':');
      clockTimer = window.setTimeout(tickClock, 1000 - now.getMilliseconds() + 8);
    }
    if (clock) {
      clock.setAttribute('aria-live', 'off');
      clock.title = `Your local time · ${Intl.DateTimeFormat().resolvedOptions().timeZone}`;
      tickClock();
    }
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) finishDecodes();
      syncAnimation(); tickClock();
    });
    observeElements();
    if ('MutationObserver' in window) new MutationObserver(records => {
      if (records.some(record => Array.from(record.addedNodes).some(node => node.nodeType === 1 && !node.hasAttribute('data-decode-visual')))) observeElements();
    }).observe(document.body, { childList: true, subtree: true });
    applyMotion();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
