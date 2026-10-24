(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = window.matchMedia("(hover: none)").matches;

  /* ===== Loader ===== */
  document.body.classList.add("is-loading");
  window.addEventListener("load", () => {
    setTimeout(() => {
      document.getElementById("loader").classList.add("is-hidden");
      document.body.classList.remove("is-loading");
    }, 500);
  });

  /* ===== Navbar: scroll holati, progress va timeline ===== */
  const nav = document.getElementById("nav");
  const progress = document.getElementById("scrollProgress");
  const timeline = document.querySelector(".timeline");
  const timelineFill = document.getElementById("timelineFill");

  const onScroll = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    nav.classList.toggle("is-scrolled", y > 30);
    progress.style.width = `${(y / max) * 100}%`;

    const r = timeline.getBoundingClientRect();
    const passed = Math.min(Math.max((window.innerHeight * 0.6 - r.top) / r.height, 0), 1);
    timelineFill.style.height = `${passed * 100}%`;
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ===== Mobil menyu ===== */
  const burger = document.getElementById("burger");
  const navLinks = document.getElementById("navLinks");
  const toggleMenu = (open) => {
    burger.classList.toggle("is-open", open);
    navLinks.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
  };
  burger.addEventListener("click", () => toggleMenu(!navLinks.classList.contains("is-open")));
  navLinks.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => toggleMenu(false)));

  /* ===== Paydo bo'lish va hisoblagichlar ===== */
  const animateCounter = (el) => {
    const to = Number(el.dataset.to);
    const start = performance.now();
    const dur = 1800;
    const step = (now) => {
      const t = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const n = Math.round(to * eased);
      // 5000 → "5 000", yil yoki ball kabi 4 xonali sonlar ajratilmaydi
      el.textContent = to >= 5000 ? n.toLocaleString("en-US").replace(/,/g, " ") : String(n);
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      entry.target.querySelectorAll(".counter").forEach(animateCounter);
      io.unobserve(entry.target);
    });
  }, { threshold: 0.15 });

  document.querySelectorAll(".reveal").forEach((el, i) => {
    // Bir guruhdagi elementlar ketma-ket chiqadi
    const siblings = [...el.parentElement.children].filter((c) => c.classList.contains("reveal"));
    el.style.transitionDelay = `${siblings.indexOf(el) * 0.1}s`;
    io.observe(el);
  });

  /* ===== 3D tilt kartalar ===== */
  if (!isTouch && !reduceMotion) {
    document.querySelectorAll(".tilt").forEach((card) => {
      const max = Number(card.dataset.tilt || 8);
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        card.style.transitionDelay = "0s";
        card.style.transform = `perspective(1000px) rotateX(${(0.5 - py) * max}deg) rotateY(${(px - 0.5) * max}deg) translateY(-6px)`;
        card.style.setProperty("--mx", `${px * 100}%`);
        card.style.setProperty("--my", `${py * 100}%`);
      });
      card.addEventListener("mouseleave", () => { card.style.transform = ""; });
    });
  }

  /* ===== Magnit tugmalar ===== */
  if (!isTouch && !reduceMotion) {
    document.querySelectorAll(".magnetic").forEach((btn) => {
      btn.addEventListener("mousemove", (e) => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        btn.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`;
      });
      btn.addEventListener("mouseleave", () => { btn.style.transform = ""; });
    });
  }

  /* ===== Kursor nuri ===== */
  const glow = document.getElementById("cursorGlow");
  let gx = innerWidth / 2, gy = innerHeight / 2, tx = gx, ty = gy;
  window.addEventListener("mousemove", (e) => { tx = e.clientX; ty = e.clientY; });
  const moveGlow = () => {
    gx += (tx - gx) * 0.12;
    gy += (ty - gy) * 0.12;
    glow.style.transform = `translate(${gx - 240}px, ${gy - 240}px)`;
    requestAnimationFrame(moveGlow);
  };
  if (!isTouch) moveGlow();

  /* ===== Aloqa formasi: xabarni nusxalab, Telegram'ni ochadi ===== */
  const form = document.getElementById("contactForm");
  const note = document.getElementById("formNote");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const text = `Salom, Shahriyor! Men ${data.get("name")}.` +
      (data.get("topic") ? `\nMavzu: ${data.get("topic")}` : "") +
      `\n\n${data.get("message")}`;
    try { await navigator.clipboard.writeText(text); } catch (_) { /* nusxalash ishlamasa ham davom etamiz */ }
    note.textContent = "Xabar nusxalandi! Telegram chatiga joylab yuboring.";
    note.classList.add("is-success");
    window.open("https://t.me/studio_542", "_blank", "noopener");
    form.reset();
  });

  /* ===== Hero 3D sahna (Three.js) ===== */
  const canvas = document.getElementById("hero3d");
  if (!window.THREE || !canvas) return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 9);

  // Yorug'lik — oltin metallni porlatadi
  scene.add(new THREE.AmbientLight(0xffffff, 0.25));
  const key = new THREE.PointLight(0xfff1c1, 2.2, 40);
  key.position.set(5, 5, 6);
  scene.add(key);
  const rim = new THREE.PointLight(0xd4af37, 2.5, 40);
  rim.position.set(-6, -3, 3);
  scene.add(rim);
  const back = new THREE.DirectionalLight(0xffffff, 0.6);
  back.position.set(0, 3, -5);
  scene.add(back);

  const group = new THREE.Group();
  scene.add(group);

  const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.85, roughness: 0.22, emissive: 0x2a1d00, emissiveIntensity: 0.4 });

  // Markaziy tugun
  const knot = new THREE.Mesh(new THREE.TorusKnotGeometry(1.95, 0.4, 260, 36), goldMat);
  group.add(knot);

  // Atrofidagi sim karkasli sfera
  const shell = new THREE.Mesh(
    new THREE.IcosahedronGeometry(2.6, 1),
    new THREE.MeshBasicMaterial({ color: 0xd4af37, wireframe: true, transparent: true, opacity: 0.16 })
  );
  group.add(shell);

  // Orbitadagi halqa
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(3.3, 0.015, 8, 160),
    new THREE.MeshBasicMaterial({ color: 0xf5d77a, transparent: true, opacity: 0.5 })
  );
  ring.rotation.x = Math.PI / 2.4;
  group.add(ring);

  // Suzib yuruvchi kichik shakllar
  const floaters = [];
  const shapes = [new THREE.OctahedronGeometry(0.22), new THREE.TetrahedronGeometry(0.24), new THREE.IcosahedronGeometry(0.18)];
  for (let i = 0; i < 14; i++) {
    const m = new THREE.Mesh(shapes[i % shapes.length], goldMat);
    const a = (i / 14) * Math.PI * 2;
    const radius = 3.6 + Math.random() * 2.2;
    m.userData = { a, radius, speed: 0.08 + Math.random() * 0.12, y: (Math.random() - 0.5) * 4 };
    group.add(m);
    floaters.push(m);
  }

  // Oltin zarrachalar
  const count = 900;
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 30;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 20 - 4;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({ color: 0xf5d77a, size: 0.035, transparent: true, opacity: 0.7 }));
  scene.add(particles);

  // 3D sahna har doim portret orqasida turadi (desktop va mobilda)
  const portrait = document.querySelector(".portrait");
  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();

    const c = canvas.getBoundingClientRect();
    const p = portrait.getBoundingClientRect();
    const halfH = Math.tan((camera.fov * Math.PI) / 360) * camera.position.z;
    const halfW = halfH * camera.aspect;
    const ndcX = ((p.left + p.width / 2 - c.left) / c.width) * 2 - 1;
    const ndcY = 1 - ((p.top + p.height / 2 - c.top) / c.height) * 2;
    group.position.set(ndcX * halfW, ndcY * halfH, 0);
    group.scale.setScalar((p.height / c.height) * halfH * 2 / 3.9);
  };
  window.addEventListener("resize", resize);
  window.addEventListener("load", resize);
  resize();

  let mx = 0, my = 0;
  window.addEventListener("mousemove", (e) => {
    mx = (e.clientX / innerWidth - 0.5) * 2;
    my = (e.clientY / innerHeight - 0.5) * 2;
  });

  // Hero ko'rinmasa render to'xtaydi
  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);

  const clock = new THREE.Clock();
  const render = () => {
    requestAnimationFrame(render);
    if (!visible) return;
    const t = clock.getElapsedTime();
    const speed = reduceMotion ? 0.15 : 1;
    const scrollFactor = window.scrollY * 0.0015;

    knot.rotation.x = t * 0.25 * speed + scrollFactor;
    knot.rotation.y = t * 0.35 * speed;
    shell.rotation.y = -t * 0.08 * speed;
    shell.rotation.x = t * 0.05 * speed;
    ring.rotation.z = t * 0.2 * speed;

    floaters.forEach((m) => {
      const d = m.userData;
      const a = d.a + t * d.speed * speed;
      m.position.set(Math.cos(a) * d.radius, d.y + Math.sin(t + d.a) * 0.3, Math.sin(a) * d.radius * 0.5);
      m.rotation.x = m.rotation.y = t * speed;
    });

    particles.rotation.y = t * 0.02 * speed;

    group.rotation.y += (mx * 0.4 - group.rotation.y) * 0.05;
    group.rotation.x += (my * 0.25 - group.rotation.x) * 0.05;
    camera.position.y = -scrollFactor * 2;

    renderer.render(scene, camera);
  };
  render();
})();
