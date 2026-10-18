// Office WhatsApp number (country code + number, digits only).
const WHATSAPP_NUMBER = '919490495645';

const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

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

// Course tabs
const tabs = [...$$('.tabs [role="tab"]')];
tabs.forEach(tab => tab.addEventListener('click', () => {
  tabs.forEach(t => {
    const on = t === tab;
    t.setAttribute('aria-selected', on);
    document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
  });
}));

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

// 3D tilt on cards that follows the pointer
if (!reduceMotion && matchMedia('(hover: hover)').matches) {
  $$('.tilt').forEach(el => {
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      el.style.transform = `perspective(900px) rotateX(${-y * 7}deg) rotateY(${x * 9}deg)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });
}

// Story progress: which chapter is in view, and how far up the climb we are
const journey = $('#journey'), chapters = [...$$('.chapter')], marks = [...$$('#altimeter li')];
let progress = 0, inJourney = true;
function readScroll() {
  const r = journey.getBoundingClientRect();
  progress = Math.min(1, Math.max(0, -r.top / (r.height - innerHeight)));
  inJourney = r.bottom > 0;
  let current = -1;
  chapters.forEach((ch, i) => {
    const cr = ch.getBoundingClientRect(), mid = cr.top + cr.height / 2;
    const live = Math.abs(mid - innerHeight / 2) < cr.height * .45;
    if (live) current = i;
    ch.classList.toggle('live', live);
  });
  chapters.forEach((ch, i) => ch.classList.toggle('dim', current >= 0 && i !== current));
  marks.forEach((m, i) => m.classList.toggle('on', i <= current));
  $('#altimeter').classList.toggle('show', current >= 0);
}
addEventListener('scroll', readScroll, { passive: true });
addEventListener('resize', readScroll);
readScroll();

// 3D scene: a spiral staircase rising into the night sky. A glowing light (the student)
// climbs it as the page scrolls, lighting six landmark platforms on the way to the CNR emblem.
(function climb() {
  const canvas = $('#climb');
  if (!window.THREE) return;
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); } catch (e) { return; }

  const mobile = innerWidth < 700;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, mobile ? 1.5 : 2));
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0a1338, 0.028);
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 300);

  const STEPS = 64, TURN = 0.3, RISE = 0.42, RADIUS = 6;
  const MILESTONES = [4, 15, 26, 37, 48, 63];
  const at = s => {
    const a = s * TURN;
    return new THREE.Vector3(Math.cos(a) * RADIUS, s * RISE, Math.sin(a) * RADIUS);
  };

  scene.add(new THREE.AmbientLight(0x7d8fe0, 0.55));
  const key = new THREE.DirectionalLight(0xffffff, 0.8);
  key.position.set(10, 30, 15);
  scene.add(key);

  // steps
  const stepGeo = new THREE.BoxGeometry(2.4, 0.16, 1.05);
  const stepMat = new THREE.MeshStandardMaterial({ color: 0x2343c4, roughness: .35, metalness: .3, emissive: 0x0d1a55, emissiveIntensity: .6 });
  const steps = new THREE.InstancedMesh(stepGeo, stepMat, STEPS);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), one = new THREE.Vector3(1, 1, 1);
  for (let i = 0; i < STEPS; i++) {
    q.setFromAxisAngle(up, -i * TURN);
    m.compose(at(i), q, one);
    steps.setMatrixAt(i, m);
  }
  scene.add(steps);

  // landmark platforms, one per chapter
  const platforms = MILESTONES.map(i => {
    const mat = new THREE.MeshStandardMaterial({ color: 0xf2b630, roughness: .3, metalness: .6, emissive: 0xf2b630, emissiveIntensity: .08 });
    const p = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, .22, 48), mat);
    p.position.copy(at(i)).add(new THREE.Vector3(0, .05, 0));
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.75, .04, 8, 64), new THREE.MeshBasicMaterial({ color: 0xffd36b, transparent: true, opacity: .25 }));
    ring.rotation.x = Math.PI / 2;
    p.add(ring);
    scene.add(p);
    return { mat, ring };
  });

  // central column of light
  const column = new THREE.Mesh(
    new THREE.CylinderGeometry(.12, .12, STEPS * RISE + 1, 16),
    new THREE.MeshBasicMaterial({ color: 0xffd36b, transparent: true, opacity: .18 })
  );
  column.position.y = (STEPS * RISE) / 2;
  scene.add(column);

  // the CNR emblem at the summit
  const top = at(STEPS - 1);
  const emblem = new THREE.Group();
  emblem.position.set(0, top.y + 4.2, 0);
  const tex = new THREE.TextureLoader().load('assets/cnr-logo.png');
  emblem.add(new THREE.Mesh(new THREE.CircleGeometry(2.2, 64), new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide })));
  emblem.add(new THREE.Mesh(new THREE.TorusGeometry(2.6, .07, 12, 96), new THREE.MeshBasicMaterial({ color: 0xf2b630 })));
  const halo = new THREE.Mesh(new THREE.TorusGeometry(3.2, .025, 8, 96), new THREE.MeshBasicMaterial({ color: 0xffd36b, transparent: true, opacity: .5 }));
  emblem.add(halo);
  scene.add(emblem);

  // the student: a glowing light with a trail
  const student = new THREE.Mesh(new THREE.SphereGeometry(.3, 32, 16), new THREE.MeshBasicMaterial({ color: 0xffe08a }));
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xffc94d, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  glow.scale.set(3.2, 3.2, 1);
  student.add(glow);
  student.add(new THREE.PointLight(0xffc94d, 2.2, 9));
  scene.add(student);

  const TRAIL = 60, trailPos = new Float32Array(TRAIL * 3);
  const trailGeo = new THREE.BufferGeometry();
  trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPos, 3));
  scene.add(new THREE.Line(trailGeo, new THREE.LineBasicMaterial({ color: 0xffd36b, transparent: true, opacity: .55 })));

  // stars
  const N = mobile ? 900 : 1800, sp = new Float32Array(N * 3), sc = new Float32Array(N * 3);
  const gold = new THREE.Color(0xffd36b), white = new THREE.Color(0xcfd8ff);
  for (let i = 0; i < N; i++) {
    const r = 30 + Math.random() * 70, th = Math.random() * Math.PI * 2, y = Math.random() * 90 - 20;
    sp.set([Math.cos(th) * r, y, Math.sin(th) * r], i * 3);
    sc.set((Math.random() < .2 ? gold : white).toArray(), i * 3);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  starGeo.setAttribute('color', new THREE.BufferAttribute(sc, 3));
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ size: .22, vertexColors: true, transparent: true, opacity: .9, depthWrite: false }));
  scene.add(stars);

  function glowTexture() {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d'), grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grd.addColorStop(0, 'rgba(255,230,160,1)'); grd.addColorStop(.3, 'rgba(255,200,80,.45)'); grd.addColorStop(1, 'rgba(255,200,80,0)');
    g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }

  function resize() {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // on wide screens, shift the view so the climb sits to the right of the story cards
    if (w >= 700) camera.setViewOffset(w, h, -w * .18, 0, w, h); else camera.clearViewOffset();
    camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize);
  resize();

  let mx = 0, my = 0;
  addEventListener('pointermove', e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; });

  let s = 0, first = true, running = false;
  const camPos = new THREE.Vector3(), look = new THREE.Vector3(), lookTarget = new THREE.Vector3(), lift = new THREE.Vector3();
  const t0 = performance.now();
  const ease = x => x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;

  function frame(now) {
    const t = (now - t0) / 1000;
    const target = ease(progress) * (STEPS - 1);
    s += (target - s) * (first ? 1 : .08);
    const p = at(s).add(lift.set(0, .45 + Math.sin(t * 3) * .06, 0));
    student.position.copy(p);

    for (let i = TRAIL - 1; i > 0; i--) trailPos.copyWithin(i * 3, (i - 1) * 3, i * 3);
    trailPos.set([p.x, p.y, p.z], 0);
    if (first) for (let i = 1; i < TRAIL; i++) trailPos.set([p.x, p.y, p.z], i * 3);
    trailGeo.attributes.position.needsUpdate = true;

    platforms.forEach((pl, i) => {
      const reached = s >= MILESTONES[i] - .5;
      pl.mat.emissiveIntensity += ((reached ? .75 : .08) - pl.mat.emissiveIntensity) * (first ? 1 : .1);
      pl.ring.material.opacity += ((reached ? .9 : .25) - pl.ring.material.opacity) * (first ? 1 : .1);
      pl.ring.scale.setScalar(1 + (reached ? Math.sin(t * 2 + i) * .04 : 0));
    });

    // camera orbits outside the spiral, a little behind and above the student
    const a = s * TURN - 0.85 + mx * .25;
    const dist = mobile ? 21 : 19;
    // near the summit, tilt up so the CNR emblem comes into view
    const summit = Math.min(1, Math.max(0, (progress - .8) / .2));
    camPos.set(Math.cos(a) * dist, p.y + 4 + summit * 2 - my * 2, Math.sin(a) * dist);
    lookTarget.set(p.x * .35, p.y + .8 + summit * (emblem.position.y - p.y - .8) * .55, p.z * .35);
    if (first) { camera.position.copy(camPos); look.copy(lookTarget); first = false; }
    camera.position.lerp(camPos, .07);
    look.lerp(lookTarget, .07);
    camera.lookAt(look);

    emblem.lookAt(camera.position.x, emblem.position.y, camera.position.z);
    halo.rotation.z = t * .4;
    stars.rotation.y = t * .01;

    renderer.render(scene, camera);
    if (running) requestAnimationFrame(frame);
  }

  // only animate while the journey is on screen
  function setRunning(on) {
    if (on && !running) { running = true; requestAnimationFrame(frame); }
    if (!on) running = false;
  }
  if (reduceMotion) {
    const still = () => { first = true; frame(performance.now()); };
    addEventListener('scroll', still, { passive: true });
    tex.onUpdate = still;
    still();
  } else {
    addEventListener('scroll', () => setRunning(inJourney), { passive: true });
    document.addEventListener('visibilitychange', () => setRunning(!document.hidden && inJourney));
    setRunning(true);
  }
})();
