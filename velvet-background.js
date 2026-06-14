(() => {
  const canvas = document.getElementById('velvet-bg');
  if (!canvas || canvas.dataset.velvetReady === 'true') return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  canvas.dataset.velvetReady = 'true';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:-1;pointer-events:none;';
  document.documentElement.style.background = '#060606';
  document.body.classList.add('velvet-background');
  document.body.style.background = 'transparent';
  document.body.style.isolation = 'isolate';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let width = 0;
  let height = 0;
  let time = 0;
  let lastFrame = 0;
  let animationFrame = 0;

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  const folds = [
    { x:.15, y:.10, tx:.75, ty:.55, speed:.00002, phase:0 },
    { x:.05, y:.40, tx:.60, ty:.90, speed:.00002, phase:1.2 },
    { x:.30, y:0, tx:.95, ty:.70, speed:.00002, phase:2.4 }
  ];
  const bumps = [
    { x:.55, y:.35, r:.42, speed:.000002, phase:0 },
    { x:.25, y:.65, r:.35, speed:.000002, phase:1.8 },
    { x:.75, y:.75, r:.30, speed:.000002, phase:3.2 }
  ];

  function drawFold(fold) {
    const drift = Math.sin(time * fold.speed * 1000 + fold.phase) * .06;
    const x1 = (fold.x + drift) * width;
    const y1 = (fold.y + drift * .5) * height;
    const x2 = (fold.tx - drift) * width;
    const y2 = (fold.ty - drift * .3) * height;
    const length = Math.hypot(x2 - x1, y2 - y1);
    const nx = -(y2 - y1) / length;
    const ny = (x2 - x1) / length;
    const foldWidth = Math.max(width, height) * (.28 + Math.sin(time * fold.speed * 800 + fold.phase) * .04);
    const gradient = ctx.createLinearGradient(
      x1 + nx * foldWidth,
      y1 + ny * foldWidth,
      x1 - nx * foldWidth,
      y1 - ny * foldWidth
    );

    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(.35, 'rgba(0,0,0,0)');
    gradient.addColorStop(.48, 'rgba(72,70,68,.08)');
    gradient.addColorStop(.5, 'rgba(95,92,88,.13)');
    gradient.addColorStop(.52, 'rgba(72,70,68,.08)');
    gradient.addColorStop(.65, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.save();
    ctx.beginPath();
    const ex = (x2 - x1) / length;
    const ey = (y2 - y1) / length;
    const extension = Math.max(width, height) * 2;
    ctx.moveTo(x1 - ex * extension + nx * foldWidth, y1 - ey * extension + ny * foldWidth);
    ctx.lineTo(x2 + ex * extension + nx * foldWidth, y2 + ey * extension + ny * foldWidth);
    ctx.lineTo(x2 + ex * extension - nx * foldWidth, y2 + ey * extension - ny * foldWidth);
    ctx.lineTo(x1 - ex * extension - nx * foldWidth, y1 - ey * extension - ny * foldWidth);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.restore();
  }

  function drawBump(bump) {
    const drift = Math.sin(time * bump.speed * 1000 + bump.phase);
    const cx = (bump.x + drift * .07) * width;
    const cy = (bump.y + Math.cos(time * bump.speed * 800 + bump.phase) * .06) * height;
    const radius = bump.r * Math.max(width, height);
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);

    gradient.addColorStop(0, 'rgba(88,85,80,.20)');
    gradient.addColorStop(.25, 'rgba(65,62,58,.14)');
    gradient.addColorStop(.55, 'rgba(30,28,26,.07)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  function draw(timestamp = 0) {
    if (!reduceMotion && timestamp - lastFrame < 33) {
      animationFrame = requestAnimationFrame(draw);
      return;
    }
    lastFrame = timestamp;
    time += 1;
    ctx.fillStyle = '#060606';
    ctx.fillRect(0, 0, width, height);

    if (!reduceMotion) {
      bumps.forEach(drawBump);
      folds.forEach(drawFold);
    }

    const vignette = ctx.createRadialGradient(
      width * .5,
      height * .45,
      0,
      width * .5,
      height * .45,
      Math.max(width, height) * .78
    );
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(.55, 'rgba(0,0,0,.18)');
    vignette.addColorStop(.8, 'rgba(0,0,0,.55)');
    vignette.addColorStop(1, 'rgba(0,0,0,.85)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);

    if (!reduceMotion && !document.hidden) animationFrame = requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener('resize', resize, { passive:true });
  document.addEventListener('visibilitychange', () => {
    if (!reduceMotion && !document.hidden) {
      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(draw);
    }
  });
  draw();
})();
