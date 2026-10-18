// Office WhatsApp number (country code + number, digits only).
const WHATSAPP_NUMBER = '919490495645';

const $ = s => document.querySelector(s);

// Mobile menu
const burger = $('#burger'), menu = $('#menu');
burger.addEventListener('click', () => {
  const open = menu.classList.toggle('open');
  burger.setAttribute('aria-expanded', open);
});
menu.addEventListener('click', e => {
  if (e.target.closest('a')) { menu.classList.remove('open'); burger.setAttribute('aria-expanded', false); }
});

$('#yr').textContent = new Date().getFullYear();

// Gallery: show a real photo in each tile when its file exists
document.querySelectorAll('.ph[data-photo]').forEach(fig => {
  const img = new Image();
  img.alt = fig.querySelector('figcaption').textContent;
  img.loading = 'lazy';
  img.onload = () => fig.prepend(img);
  img.src = fig.dataset.photo;
});

// WhatsApp enquiry link, rebuilt as the form changes
const form = $('#enquiry'), wa = $('#wa');
function updateWhatsApp() {
  const d = new FormData(form);
  const text = `Hello CNR, I'm ${d.get('name') || ''} (${d.get('phone') || ''}). Enquiry for ${d.get('inst')}. ${d.get('msg') || ''}`;
  wa.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text.trim())}`;
}
form.addEventListener('input', updateWhatsApp);
form.addEventListener('submit', e => e.preventDefault());
updateWhatsApp();

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Count-up for the facts row; the final numbers are already in the HTML
if (!reduceMotion && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (!en.isIntersecting) return;
    io.unobserve(en.target);
    const el = en.target, end = +el.dataset.count, suffix = el.dataset.suffix || '';
    const start = end > 1000 ? end - 40 : 0, t0 = performance.now();
    const tick = t => {
      const p = Math.min((t - t0) / 1400, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(start + (end - start) * e) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }), { threshold: .6 });
  document.querySelectorAll('[data-count]').forEach(el => io.observe(el));
}

// Hero night sky: drifting points joined into constellations
const cv = $('#sky'), ctx = cv.getContext('2d');
let W, H, pts = [];
function resize() {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  W = cv.clientWidth; H = cv.clientHeight;
  cv.width = W * dpr; cv.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const n = Math.round(Math.min(90, W * H / 14000));
  pts = Array.from({ length: n }, () => ({
    x: Math.random() * W, y: Math.random() * H,
    vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25,
    r: Math.random() * 1.6 + .4, gold: Math.random() < .25
  }));
}
function draw() {
  ctx.clearRect(0, 0, W, H);
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    for (let j = i + 1; j < pts.length; j++) {
      const b = pts[j], d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d < 130) {
        ctx.strokeStyle = `rgba(160,180,255,${(1 - d / 130) * .22})`;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
    }
    ctx.fillStyle = a.gold ? 'rgba(255,211,107,.9)' : 'rgba(255,255,255,.7)';
    ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2); ctx.fill();
  }
}
function step() {
  for (const p of pts) {
    p.x += p.vx; p.y += p.vy;
    if (p.x < 0 || p.x > W) p.vx *= -1;
    if (p.y < 0 || p.y > H) p.vy *= -1;
  }
  draw();
  requestAnimationFrame(step);
}
resize();
addEventListener('resize', () => { resize(); if (reduceMotion) draw(); });
reduceMotion ? draw() : requestAnimationFrame(step);
