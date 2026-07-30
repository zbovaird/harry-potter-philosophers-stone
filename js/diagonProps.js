import * as THREE from "three";

function m(geometry, material, cast = true, receive = true) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = cast;
  mesh.receiveShadow = receive;
  return mesh;
}

function seeded(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function makeSignTexture(title, subtitle = "") {
  const canvas = document.createElement("canvas");
  canvas.width = 768;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, "#3a2a18");
  grad.addColorStop(1, "#1a120c");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(12, 12, 744, 232, 16);
  ctx.fill();
  ctx.strokeStyle = "#c9a227";
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.fillStyle = "#f0e0b0";
  ctx.font = "700 52px Georgia, serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(title, 384, subtitle ? 100 : 128);
  if (subtitle) {
    ctx.fillStyle = "#d4c090";
    ctx.font = "italic 28px Georgia, serif";
    ctx.fillText(subtitle, 384, 168);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeWindowGlow(color = "#ffd8a0") {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  const g = ctx.createRadialGradient(64, 64, 8, 64, 64, 64);
  g.addColorStop(0, color);
  g.addColorStop(0.45, "rgba(255,200,120,0.85)");
  g.addColorStop(1, "rgba(40,30,20,0.2)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  // muntins
  ctx.strokeStyle = "rgba(40,28,18,0.55)";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(64, 8);
  ctx.lineTo(64, 120);
  ctx.moveTo(8, 64);
  ctx.lineTo(120, 64);
  ctx.stroke();
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function addWindow(root, { x, y, z, w, h, timber, glow, rotY = 0, light = false }) {
  const winMat = new THREE.MeshStandardMaterial({
    map: glow,
    emissive: 0xffb050,
    emissiveIntensity: 1.35,
    roughness: 0.2,
    metalness: 0.08,
    transparent: true,
    opacity: 0.98,
  });
  const win = m(new THREE.PlaneGeometry(w, h), winMat, false, false);
  win.position.set(x, y, z);
  win.rotation.y = rotY;
  root.add(win);
  const frame = m(new THREE.BoxGeometry(w + 0.14, h + 0.14, 0.07), timber);
  frame.position.set(x, y, z - Math.cos(rotY) * 0.03);
  if (Math.abs(rotY) > 0.1) {
    frame.rotation.y = rotY;
    frame.position.set(x - Math.sin(rotY) * 0.03, y, z);
  }
  root.add(frame);
  // Sill
  const sill = m(new THREE.BoxGeometry(w + 0.2, 0.06, 0.14), timber);
  sill.position.set(x, y - h / 2 - 0.04, z + 0.04);
  if (Math.abs(rotY) > 0.1) sill.rotation.y = rotY;
  root.add(sill);
  if (light) {
    const pt = new THREE.PointLight(0xffc080, 0.7, 8, 2);
    pt.position.set(x, y, z + 0.6);
    root.add(pt);
  }
}

/**
 * Tudor / Victorian wizarding shop — jettied floors, bay windows, timber frame, chimney.
 */
export function createTudorShop(texLib, opts) {
  const {
    w = 6,
    d = 5,
    floors = 2,
    floorH = 3.15,
    plasterTint = 0xe8d8c0,
    timberTint = 0x3a2818,
    brickTint = 0xffffff,
    roofTint = 0x6a7080,
    lean = 0,
    seed = 1,
  } = opts;
  const rng = seeded(seed);
  const root = new THREE.Group();
  const h = floors * floorH;

  const plaster = texLib.plaster(2.2, floors * 1.2, plasterTint);
  const timber = texLib.wood(1.5, 1.5);
  timber.color = new THREE.Color(timberTint);
  const brick = texLib.brick(2.2, floors * 1.1, brickTint);
  const slate = texLib.slate(2.5, 1.8, roofTint);
  const stone = texLib.stone(1.5, 1);
  const glowWarm = makeWindowGlow("#ffe2a8");
  const glowCool = makeWindowGlow("#ffd090");

  for (let f = 0; f < floors; f += 1) {
    // Jetty: each upper floor overhangs toward street (+Z)
    const jetty = f * 0.28;
    const fw = w + (rng() - 0.5) * 0.2;
    const fd = d + jetty;
    const y = f * floorH + floorH / 2;
    const zOff = jetty / 2 + lean * f * 0.1;
    const story = m(new THREE.BoxGeometry(fw, floorH - 0.04, fd), f === 0 ? brick : plaster);
    story.position.set(lean * f * 0.12, y, zOff);
    root.add(story);

    const frontZ = zOff + fd / 2 + 0.03;

    // Timber framing on front
    for (let i = 0; i < 4; i += 1) {
      const beam = m(new THREE.BoxGeometry(0.11, floorH - 0.15, 0.09), timber);
      beam.position.set(-fw / 2 + 0.35 + i * ((fw - 0.7) / 3), y, frontZ);
      root.add(beam);
    }
    for (const yy of [-0.35, 0.35]) {
      const cross = m(new THREE.BoxGeometry(fw - 0.25, 0.1, 0.08), timber);
      cross.position.set(0, y + yy * floorH * 0.35, frontZ);
      root.add(cross);
    }
    // X-braces
    const brace = m(new THREE.BoxGeometry(fw * 0.42, 0.07, 0.06), timber);
    brace.position.set(-fw * 0.12, y, frontZ);
    brace.rotation.z = 0.6;
    root.add(brace);
    const brace2 = brace.clone();
    brace2.position.x = fw * 0.12;
    brace2.rotation.z = -0.6;
    root.add(brace2);

    // Front windows
    const winCount = f === 0 ? 2 : 3;
    for (let i = 0; i < winCount; i += 1) {
      const ww = 0.9 + rng() * 0.15;
      const wh = f === 0 ? 1.25 : 1.05;
      const x = -fw / 2 + 1.0 + i * ((fw - 2.0) / Math.max(1, winCount - 1));
      addWindow(root, {
        x,
        y: y + (f === 0 ? 0.25 : 0.1),
        z: frontZ + 0.02,
        w: ww,
        h: wh,
        timber,
        glow: f === 0 ? glowWarm : glowCool,
        light: i === 0 || i === winCount - 1,
      });
    }

    // Side windows so the alley-long elevation also reads as a shop
    for (const side of [-1, 1]) {
      const sideX = side * (fw / 2 + 0.02);
      addWindow(root, {
        x: sideX,
        y: y + 0.1,
        z: zOff + 0.2,
        w: 0.75,
        h: 0.95,
        timber,
        glow: glowCool,
        rotY: side > 0 ? Math.PI / 2 : -Math.PI / 2,
        light: f === 0,
      });
    }
  }

  // Projecting bay window on floor 1
  if (floors >= 2) {
    const bay = m(new THREE.BoxGeometry(2.2, 1.8, 0.7), plaster);
    bay.position.set(0, floorH + floorH / 2, d / 2 + 0.55);
    root.add(bay);
    addWindow(root, {
      x: 0,
      y: floorH + floorH / 2,
      z: d / 2 + 0.92,
      w: 1.6,
      h: 1.2,
      timber,
      glow: glowWarm,
      light: true,
    });
    const bayRoof = m(new THREE.BoxGeometry(2.4, 0.12, 0.9), slate);
    bayRoof.position.set(0, floorH + floorH / 2 + 1.0, d / 2 + 0.55);
    bayRoof.rotation.x = -0.25;
    root.add(bayRoof);
  }

  // Shop door
  const door = m(new THREE.BoxGeometry(1.2, 2.35, 0.14), timber);
  door.position.set(0, 1.18, d / 2 + 0.08);
  root.add(door);
  const doorPanel = m(
    new THREE.PlaneGeometry(0.9, 1.8),
    new THREE.MeshStandardMaterial({ color: 0x2a1810, roughness: 0.75 })
  );
  doorPanel.position.set(0, 1.2, d / 2 + 0.16);
  root.add(doorPanel);
  const knob = m(
    new THREE.SphereGeometry(0.045, 10, 10),
    new THREE.MeshStandardMaterial({ color: 0xc9a227, metalness: 0.92, roughness: 0.22, envMapIntensity: 1.5 })
  );
  knob.position.set(0.42, 1.1, d / 2 + 0.18);
  root.add(knob);

  // Awning
  const awning = m(
    new THREE.BoxGeometry(w * 0.85, 0.06, 0.9),
    new THREE.MeshStandardMaterial({ color: 0x6a2020, roughness: 0.85 })
  );
  awning.position.set(0, 2.55, d / 2 + 0.55);
  awning.rotation.x = 0.35;
  root.add(awning);

  const step = m(new THREE.BoxGeometry(1.7, 0.2, 0.65), stone, true, true);
  step.position.set(0, 0.1, d / 2 + 0.4);
  root.add(step);
  const step2 = m(new THREE.BoxGeometry(1.9, 0.12, 0.4), stone, true, true);
  step2.position.set(0, 0.06, d / 2 + 0.75);
  root.add(step2);

  // Pitched roof with dormer
  const roofW = w + 1.1;
  const roofD = d + 1.2 + (floors - 1) * 0.28;
  const roofH = 2.1 + rng() * 0.35;
  const slopeL = m(new THREE.BoxGeometry(roofW * 0.58, 0.16, roofD), slate);
  slopeL.position.set(-roofW * 0.2, h + 0.7, (floors - 1) * 0.1);
  slopeL.rotation.z = 0.42;
  root.add(slopeL);
  const slopeR = m(new THREE.BoxGeometry(roofW * 0.58, 0.16, roofD), slate);
  slopeR.position.set(roofW * 0.2, h + 0.7, (floors - 1) * 0.1);
  slopeR.rotation.z = -0.42;
  root.add(slopeR);
  const ridge = m(new THREE.BoxGeometry(0.2, 0.2, roofD * 0.95), slate);
  ridge.position.set(0, h + 1.25, (floors - 1) * 0.1);
  root.add(ridge);

  // Dormer
  const dormer = m(new THREE.BoxGeometry(1.4, 1.1, 1.0), plaster);
  dormer.position.set(-w * 0.15, h + 0.55, d / 2 + 0.1);
  root.add(dormer);
  addWindow(root, {
    x: -w * 0.15,
    y: h + 0.55,
    z: d / 2 + 0.62,
    w: 0.7,
    h: 0.7,
    timber,
    glow: glowCool,
  });
  const dormerRoof = m(new THREE.ConeGeometry(1.0, 0.7, 4), slate);
  dormerRoof.position.set(-w * 0.15, h + 1.35, d / 2 + 0.1);
  dormerRoof.rotation.y = Math.PI / 4;
  root.add(dormerRoof);

  const chimney = m(new THREE.BoxGeometry(0.75, 2.1, 0.75), brick);
  chimney.position.set(w * 0.3, h + 1.6, -d * 0.1);
  root.add(chimney);
  const pot = m(new THREE.CylinderGeometry(0.2, 0.22, 0.4, 10), stone);
  pot.position.set(w * 0.3, h + 2.75, -d * 0.1);
  root.add(pot);
  // Chimney smoke puff (soft sprite-like spheres)
  const smoke = m(
    new THREE.SphereGeometry(0.25, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0x888888, transparent: true, opacity: 0.25, roughness: 1 })
  );
  smoke.position.set(w * 0.3, h + 3.3, -d * 0.1);
  root.add(smoke);

  const gutter = m(
    new THREE.BoxGeometry(w + 0.5, 0.08, 0.12),
    new THREE.MeshStandardMaterial({ color: 0x3a3a38, metalness: 0.75, roughness: 0.32 })
  );
  gutter.position.set(0, h - 0.02, d / 2 + 0.2 + (floors - 1) * 0.14);
  root.add(gutter);

  // Corner posts
  for (const sx of [-1, 1]) {
    const post = m(new THREE.BoxGeometry(0.16, h, 0.16), timber);
    post.position.set(sx * (w / 2 + 0.02), h / 2, d / 2);
    root.add(post);
  }

  root.userData.height = h + roofH;
  root.userData.footprint = { w, d: d + (floors - 1) * 0.28, h };
  return root;
}

export function createHangingSign(texLib, title, subtitle = "") {
  const group = new THREE.Group();
  const arm = m(
    new THREE.BoxGeometry(1.4, 0.08, 0.08),
    new THREE.MeshStandardMaterial({ color: 0x2a2a28, metalness: 0.75, roughness: 0.35 })
  );
  arm.position.set(0.7, 0, 0);
  group.add(arm);
  const chainL = m(
    new THREE.CylinderGeometry(0.015, 0.015, 0.35, 6),
    new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.8, roughness: 0.3 })
  );
  chainL.position.set(0.35, -0.25, 0);
  const chainR = chainL.clone();
  chainR.position.x = 1.05;
  group.add(chainL, chainR);

  const board = m(
    new THREE.BoxGeometry(1.7, 0.72, 0.1),
    texLib.wood(1, 1)
  );
  board.position.set(0.85, -0.65, 0);
  group.add(board);

  const tex = makeSignTexture(title, subtitle);
  const face = m(
    new THREE.PlaneGeometry(1.55, 0.58),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5, metalness: 0.05, emissive: 0x332200, emissiveIntensity: 0.35 }),
    false,
    false
  );
  face.position.set(0.85, -0.65, 0.06);
  group.add(face);
  const faceBack = face.clone();
  faceBack.rotation.y = Math.PI;
  faceBack.position.z = -0.06;
  group.add(faceBack);
  group.userData.board = board;
  return group;
}

export function createGasLamp() {
  const root = new THREE.Group();
  const iron = new THREE.MeshStandardMaterial({ color: 0x1e1e22, metalness: 0.75, roughness: 0.35 });
  const brass = new THREE.MeshStandardMaterial({ color: 0xb89540, metalness: 0.85, roughness: 0.3 });

  const base = m(new THREE.CylinderGeometry(0.22, 0.28, 0.2, 10), iron);
  base.position.y = 0.1;
  const pole = m(new THREE.CylinderGeometry(0.05, 0.07, 3.0, 10), iron);
  pole.position.y = 1.65;
  const collar = m(new THREE.TorusGeometry(0.12, 0.03, 8, 16), brass);
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 3.15;

  const cage = new THREE.Group();
  cage.position.y = 3.45;
  for (let i = 0; i < 4; i += 1) {
    const bar = m(new THREE.BoxGeometry(0.03, 0.55, 0.03), iron);
    const a = (i / 4) * Math.PI * 2;
    bar.position.set(Math.cos(a) * 0.16, 0, Math.sin(a) * 0.16);
    cage.add(bar);
  }
  const cap = m(new THREE.ConeGeometry(0.28, 0.22, 8), iron);
  cap.position.y = 0.4;
  cage.add(cap);

  const glass = m(
    new THREE.SphereGeometry(0.16, 12, 10),
    new THREE.MeshStandardMaterial({
      color: 0xffe6b0,
      emissive: 0xffc060,
      emissiveIntensity: 2.2,
      roughness: 0.2,
      transparent: true,
      opacity: 0.92,
    }),
    false,
    false
  );
  glass.position.y = 3.4;

  const light = new THREE.PointLight(0xffc888, 1.6, 14, 1.8);
  light.position.y = 3.4;
  light.castShadow = true;
  light.shadow.mapSize.set(512, 512);
  light.shadow.bias = -0.002;

  root.add(base, pole, collar, cage, glass, light);
  root.userData.light = light;
  root.userData.glass = glass;
  return root;
}

export function createBarrel(texLib) {
  const root = new THREE.Group();
  const wood = texLib.wood(1, 2);
  wood.color = new THREE.Color(0x6a4a28);
  const body = m(new THREE.CylinderGeometry(0.32, 0.35, 0.75, 14), wood);
  body.position.y = 0.38;
  const ringMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, metalness: 0.8, roughness: 0.35 });
  for (const y of [0.15, 0.38, 0.62]) {
    const ring = m(new THREE.TorusGeometry(0.34, 0.03, 6, 20), ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = y;
    root.add(ring);
  }
  root.add(body);
  return root;
}

export function createCrate(texLib) {
  const wood = texLib.wood(1, 1);
  wood.color = new THREE.Color(0x8a6a40);
  const box = m(new THREE.BoxGeometry(0.7, 0.55, 0.55), wood);
  box.position.y = 0.28;
  const band = m(
    new THREE.BoxGeometry(0.74, 0.06, 0.58),
    new THREE.MeshStandardMaterial({ color: 0x2a2a28, metalness: 0.6, roughness: 0.4 })
  );
  band.position.y = 0.28;
  const root = new THREE.Group();
  root.add(box, band);
  return root;
}

export function createBroomProp(texLib) {
  const root = new THREE.Group();
  const shaft = m(new THREE.CylinderGeometry(0.025, 0.03, 1.3, 8), texLib.wood(1, 3));
  shaft.rotation.z = Math.PI / 2;
  shaft.position.set(0.35, 0.08, 0);
  const bristles = m(
    new THREE.ConeGeometry(0.12, 0.45, 8),
    new THREE.MeshStandardMaterial({ color: 0xc4a060, roughness: 0.9 })
  );
  bristles.rotation.z = -Math.PI / 2;
  bristles.position.set(-0.4, 0.08, 0);
  root.add(shaft, bristles);
  return root;
}

export function createOwlCage() {
  const root = new THREE.Group();
  const iron = new THREE.MeshStandardMaterial({ color: 0x2a2a2e, metalness: 0.7, roughness: 0.4 });
  const base = m(new THREE.CylinderGeometry(0.28, 0.3, 0.08, 12), iron);
  base.position.y = 0.04;
  const dome = m(
    new THREE.SphereGeometry(0.3, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.55),
    new THREE.MeshStandardMaterial({ color: 0x3a3a40, metalness: 0.5, roughness: 0.45, wireframe: true })
  );
  dome.position.y = 0.28;
  const perch = m(new THREE.CylinderGeometry(0.02, 0.02, 0.35, 6), iron);
  perch.rotation.z = Math.PI / 2;
  perch.position.y = 0.22;
  // Tiny owl body
  const owl = m(
    new THREE.SphereGeometry(0.1, 10, 8),
    new THREE.MeshStandardMaterial({ color: 0x8a7055, roughness: 0.85 })
  );
  owl.position.y = 0.32;
  const eyeL = m(new THREE.SphereGeometry(0.025, 6, 6), new THREE.MeshStandardMaterial({ color: 0xffaa33, emissive: 0x553300, emissiveIntensity: 0.5 }));
  eyeL.position.set(-0.04, 0.35, 0.08);
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.04;
  root.add(base, dome, perch, owl, eyeL, eyeR);
  return root;
}

export function createBookStack(texLib) {
  const root = new THREE.Group();
  const colors = [0x4a1a1a, 0x1a2a4a, 0x2a4a2a, 0x4a3a1a, 0x3a1a4a];
  let y = 0;
  for (let i = 0; i < 5; i += 1) {
    const book = m(
      new THREE.BoxGeometry(0.35 + Math.random() * 0.1, 0.06, 0.25 + Math.random() * 0.08),
      new THREE.MeshStandardMaterial({ color: colors[i], roughness: 0.75, metalness: 0.05 })
    );
    book.position.set((Math.random() - 0.5) * 0.05, y + 0.03, (Math.random() - 0.5) * 0.04);
    book.rotation.y = (Math.random() - 0.5) * 0.3;
    y += 0.065;
    root.add(book);
  }
  return root;
}

export function createCobbleStreet(texLib, length = 56, width = 9) {
  const root = new THREE.Group();
  const ground = m(
    new THREE.PlaneGeometry(width + 8, length, 40, 80),
    texLib.cobble(4, 10),
    false,
    true
  );
  ground.rotation.x = -Math.PI / 2;
  // Displace cobbles slightly via vertex noise for uneven street
  const pos = ground.geometry.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const n = Math.sin(x * 3.1 + y * 2.7) * 0.03 + Math.sin(x * 7.3 - y * 5.1) * 0.015;
    pos.setZ(i, n);
  }
  ground.geometry.computeVertexNormals();
  root.add(ground);

  // Curb stones
  const curbMat = texLib.stone(4, 1, 0xb0aaa0);
  for (const side of [-1, 1]) {
    const curb = m(new THREE.BoxGeometry(0.35, 0.22, length), curbMat, true, true);
    curb.position.set(side * (width / 2 + 0.1), 0.08, 0);
    root.add(curb);
  }

  // Sidewalk strips
  const walkMat = texLib.stone(6, 2, 0xc4b8a8);
  for (const side of [-1, 1]) {
    const walk = m(new THREE.BoxGeometry(2.2, 0.08, length - 4), walkMat, false, true);
    walk.position.set(side * (width / 2 + 1.4), 0.04, 0);
    root.add(walk);
  }

  return root;
}

export function createAlleyArch(texLib) {
  const root = new THREE.Group();
  const stone = texLib.stone(2, 2, 0xd0c8b8);
  const brick = texLib.brick(2, 2);

  const pillarL = m(new THREE.BoxGeometry(1.4, 5.5, 1.4), stone);
  pillarL.position.set(-3.2, 2.75, 0);
  const pillarR = pillarL.clone();
  pillarR.position.x = 3.2;
  root.add(pillarL, pillarR);

  const arch = m(new THREE.TorusGeometry(3.0, 0.45, 12, 28, Math.PI), brick);
  arch.rotation.z = -Math.PI / 2;
  arch.rotation.y = Math.PI / 2;
  arch.position.set(0, 4.2, 0);
  root.add(arch);

  const keystone = m(new THREE.BoxGeometry(0.7, 0.7, 0.9), stone);
  keystone.position.set(0, 5.7, 0);
  root.add(keystone);

  // Open arch — no gate bars blocking the view
  const lantern = createGasLamp();
  lantern.scale.setScalar(0.7);
  lantern.position.set(0, 4.8, 0.4);
  root.add(lantern);

  return root;
}

export function createMagicDust(count = 80) {
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const phases = new Float32Array(count);
  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = (Math.random() - 0.5) * 16;
    positions[i * 3 + 1] = 0.5 + Math.random() * 6;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 50;
    phases[i] = Math.random() * Math.PI * 2;
  }
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("phase", new THREE.BufferAttribute(phases, 1));
  const mat = new THREE.PointsMaterial({
    color: 0xffe6a0,
    size: 0.08,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });
  const points = new THREE.Points(geo, mat);
  points.userData.phases = phases;
  return points;
}

/**
 * Builds the full Diagon Alley streetscape into `group`.
 */
export function buildDiagonWorld(game, group, colliders) {
  const tex = game.textures;
  const anim = { lamps: [], signs: [], dust: null, flags: [] };

  // Street
  const street = createCobbleStreet(tex, 58, 9.5);
  street.position.set(0, 0, 0);
  group.add(street);
  colliders.push({
    minX: -30,
    maxX: 30,
    minZ: -30,
    maxZ: 30,
    minY: -0.5,
    maxY: 0,
    ground: true,
    level: "diagon",
    active: true,
  });

  // Shop definitions lining both sides
  const leftShops = [
    { z: 14, label: "Ollivanders", sub: "Makers of Fine Wands", floors: 3, plaster: 0xe0d0b8, w: 7.2, d: 6.2, seed: 11 },
    { z: 5, label: "Twilfitt & Tatting's", sub: "", floors: 2, plaster: 0xd8c8b0, w: 5.8, d: 5.2, seed: 22 },
    { z: -4, label: "Flourish & Blotts", sub: "Booksellers", floors: 3, plaster: 0xe8dcc8, w: 7.5, d: 6, seed: 33 },
    { z: -13, label: "Madam Malkin's", sub: "Robes for All Occasions", floors: 2, plaster: 0xf0e4d4, w: 6.2, d: 5.4, seed: 44 },
  ];
  const rightShops = [
    { z: 12, label: "Quality Quidditch", sub: "Supplies", floors: 2, plaster: 0xd4c4a8, w: 6, d: 5.5, seed: 55 },
    { z: 3.5, label: "Eeylops", sub: "Owl Emporium", floors: 3, plaster: 0xc8b8a0, w: 6.5, d: 5.8, seed: 66 },
    { z: -5.5, label: "Florean Fortescue", sub: "Ice Cream", floors: 2, plaster: 0xf2e8d8, w: 5.5, d: 5, seed: 77 },
    { z: -14, label: "Weasleys' later…", sub: "Curio Shop", floors: 2, plaster: 0xe4d0b8, w: 5.8, d: 5.2, seed: 88 },
  ];

  const placeShop = (def, side) => {
    const shop = createTudorShop(tex, {
      w: def.w,
      d: def.d,
      floors: def.floors,
      plasterTint: def.plaster,
      lean: side * 0.05,
      seed: def.seed,
    });
    // Door is on local +Z. Left (-X) faces street (+X) with rotY=-PI/2;
    // right (+X) faces street (-X) with rotY=+PI/2.
    const x = side * (5.1 + def.d * 0.45);
    shop.position.set(x, 0, def.z);
    // Slight toe-in so facades catch the eye walking the alley
    const toe = side > 0 ? 0.12 : -0.12;
    shop.rotation.y = (side > 0 ? Math.PI / 2 : -Math.PI / 2) + toe;
    group.add(shop);

    // After Y rotation: local X→±Z, local Z→±X
    const halfAlongStreet = def.w / 2 + 0.35;
    const halfTowardStreet = def.d / 2 + 0.45;
    colliders.push({
      minX: x - halfTowardStreet,
      maxX: x + halfTowardStreet,
      minZ: def.z - halfAlongStreet,
      maxZ: def.z + halfAlongStreet,
      minY: 0,
      maxY: def.floors * 3.2 + 2.5,
      ground: false,
      level: "diagon",
      active: true,
    });

    const sign = createHangingSign(tex, def.label, def.sub);
    sign.position.set(side * 3.35, 3.95, def.z);
    sign.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
    group.add(sign);
    anim.signs.push(sign);

    return shop;
  };

  for (const def of leftShops) placeShop(def, -1);
  for (const def of rightShops) placeShop(def, 1);

  // Fix shop orientations — shops should face +X or -X toward center
  // Recreate with correct facing by rotating so door faces street center.
  // Current createTudorShop door is on +Z local. For left side (negative X),
  // we want door facing +X (toward street), so rotate Y = -PI/2... 
  // left shop at x=-6: door should face +X → local +Z → world +X means rotY = -PI/2
  // Actually: rotY = -PI/2 maps local +Z to world +X. Good for left (x negative).
  // Right (x positive): door faces -X → rotY = +PI/2 maps +Z to -X. Good.

  // Street lamps
  for (const [lx, lz] of [
    [-3.6, 16],
    [3.6, 16],
    [-3.6, 8],
    [3.6, 8],
    [-3.6, 0],
    [3.6, 0],
    [-3.6, -8],
    [3.6, -8],
    [-3.6, -16],
    [3.6, -16],
  ]) {
    const lamp = createGasLamp();
    lamp.position.set(lx, 0, lz);
    group.add(lamp);
    anim.lamps.push(lamp);
  }

  // Props clusters
  const propRng = seeded(99);
  for (let i = 0; i < 10; i += 1) {
    const side = propRng() > 0.5 ? 1 : -1;
    const z = -18 + propRng() * 36;
    const x = side * (3.2 + propRng() * 0.6);
    if (propRng() > 0.4) {
      const barrel = createBarrel(tex);
      barrel.position.set(x, 0, z);
      barrel.rotation.y = propRng() * Math.PI;
      group.add(barrel);
    }
    if (propRng() > 0.5) {
      const crate = createCrate(tex);
      crate.position.set(x + side * 0.5, 0, z + 0.7);
      crate.rotation.y = propRng() * 0.5;
      group.add(crate);
    }
  }

  // Broom leaning
  const broom = createBroomProp(tex);
  broom.position.set(-3.4, 0.3, 11);
  broom.rotation.z = 0.9;
  broom.rotation.y = 0.3;
  group.add(broom);

  // Owl cages outside Eeylops
  for (let i = 0; i < 3; i += 1) {
    const cage = createOwlCage();
    cage.position.set(3.5, 0, 2 + i * 0.7);
    cage.rotation.y = -0.4;
    group.add(cage);
  }

  // Book stacks near Flourish
  for (let i = 0; i < 2; i += 1) {
    const books = createBookStack(tex);
    books.position.set(-3.6, 0, -3.5 + i * 0.5);
    group.add(books);
  }

  // Exit arch (south)
  const arch = createAlleyArch(tex);
  arch.position.set(0, 0, -24);
  group.add(arch);
  colliders.push({
    minX: -4.2,
    maxX: -2.2,
    minZ: -25,
    maxZ: -23,
    minY: 0,
    maxY: 6,
    ground: false,
    level: "diagon",
    active: true,
  });
  colliders.push({
    minX: 2.2,
    maxX: 4.2,
    minZ: -25,
    maxZ: -23,
    minY: 0,
    maxY: 6,
    ground: false,
    level: "diagon",
    active: true,
  });

  // North entrance further back so spawn isn't inside the arch
  const northArch = createAlleyArch(tex);
  northArch.position.set(0, 0, 28);
  northArch.rotation.y = Math.PI;
  group.add(northArch);

  // Ambient fill lights for alley canyon
  const fill = new THREE.HemisphereLight(0xffe8c8, 0x3a2a20, 0.35);
  group.add(fill);
  const bounce = new THREE.DirectionalLight(0xffd0a0, 0.35);
  bounce.position.set(-8, 12, 4);
  group.add(bounce);

  // God-ray-ish warm key from alley mouth
  const key = new THREE.SpotLight(0xffe2b0, 1.8, 55, Math.PI / 5, 0.55, 1.2);
  key.position.set(0, 14, 28);
  key.target.position.set(0, 0, 0);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  group.add(key, key.target);

  // Magic dust motes
  const dust = createMagicDust(100);
  group.add(dust);
  anim.dust = dust;

  // Distant rooftop silhouettes for depth
  for (let i = 0; i < 8; i += 1) {
    const sil = m(
      new THREE.BoxGeometry(4 + Math.random() * 3, 6 + Math.random() * 8, 3),
      new THREE.MeshStandardMaterial({ color: 0x2a2420, roughness: 1, metalness: 0 })
    );
    sil.position.set((i - 3.5) * 5, 8 + Math.random() * 3, -32 - Math.random() * 6);
    sil.castShadow = false;
    group.add(sil);
  }

  return anim;
}

export function updateDiagonWorld(anim, time, delta) {
  if (!anim) return;
  for (const lamp of anim.lamps || []) {
    const flicker = 1.4 + Math.sin(time * 7 + lamp.position.z) * 0.12 + Math.sin(time * 13.3) * 0.08;
    if (lamp.userData.light) lamp.userData.light.intensity = flicker;
    if (lamp.userData.glass?.material) {
      lamp.userData.glass.material.emissiveIntensity = 1.8 + Math.sin(time * 9 + lamp.position.x) * 0.35;
    }
  }
  for (const sign of anim.signs || []) {
    sign.rotation.z = Math.sin(time * 1.2 + sign.position.z) * 0.04;
  }
  if (anim.dust) {
    const pos = anim.dust.geometry.attributes.position;
    const phases = anim.dust.userData.phases;
    for (let i = 0; i < pos.count; i += 1) {
      const y = pos.getY(i) + Math.sin(time * 0.8 + phases[i]) * delta * 0.15;
      pos.setY(i, y > 7 ? 0.4 : y);
      pos.setX(i, pos.getX(i) + Math.sin(time * 0.3 + phases[i]) * delta * 0.05);
    }
    pos.needsUpdate = true;
  }
}
