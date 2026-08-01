import * as THREE from "three";

function m(geometry, material, cast = true, receive = true) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = cast;
  mesh.receiveShadow = receive;
  return mesh;
}

function makeBannerTex(color, label) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 256, 512);
  ctx.strokeStyle = "#c9a227";
  ctx.lineWidth = 10;
  ctx.strokeRect(12, 12, 232, 488);
  ctx.fillStyle = "#f0e0b0";
  ctx.font = "700 36px Georgia";
  ctx.textAlign = "center";
  ctx.fillText(label, 128, 260);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeStainedGlass() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 384;
  const ctx = canvas.getContext("2d");
  const colors = ["#8a2020", "#1a4a8a", "#2a6a2a", "#8a6a10", "#4a1a6a"];
  for (let y = 0; y < 6; y += 1) {
    for (let x = 0; x < 4; x += 1) {
      ctx.fillStyle = colors[(x + y) % colors.length];
      ctx.fillRect(x * 64 + 4, y * 64 + 4, 56, 56);
    }
  }
  ctx.strokeStyle = "#1a1208";
  ctx.lineWidth = 6;
  for (let i = 0; i <= 4; i += 1) {
    ctx.beginPath();
    ctx.moveTo(i * 64, 0);
    ctx.lineTo(i * 64, 384);
    ctx.stroke();
  }
  for (let i = 0; i <= 6; i += 1) {
    ctx.beginPath();
    ctx.moveTo(0, i * 64);
    ctx.lineTo(256, i * 64);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function buildHogwartsWorld(game, group, colliders) {
  const tex = game.textures;
  const anim = { candles: [], banners: [] };

  const stone = tex.stone(4, 3, 0xc8c0b0);
  const darkStone = tex.stone(3, 2, 0x8a8478);
  const wood = tex.wood(3, 1);
  wood.color = new THREE.Color(0x5a3a1a);
  const floor = tex.stone(8, 8, 0xb0a898);

  // Floor — Great Hall + north courtyard for wandering after Sorting
  const ground = m(new THREE.PlaneGeometry(36, 48, 20, 30), floor, false, true);
  ground.rotation.x = -Math.PI / 2;
  group.add(ground);
  const yardFloor = m(new THREE.PlaneGeometry(40, 32, 12, 10), tex.stone(6, 6, 0x9a9080), false, true);
  yardFloor.rotation.x = -Math.PI / 2;
  yardFloor.position.set(0, 0, 38);
  group.add(yardFloor);
  colliders.push({
    minX: -18, maxX: 18, minZ: -24, maxZ: 24,
    minY: -0.5, maxY: 0, ground: true, level: "hogwarts", active: true,
  });
  colliders.push({
    minX: -20, maxX: 20, minZ: 22, maxZ: 54,
    minY: -0.5, maxY: 0, ground: true, level: "hogwarts", active: true,
  });

  // Outer walls — north wall split with arch into courtyard
  const wallH = 10;
  const wallSpecs = [
    { x: 0, z: -22, w: 36, d: 1.4 },
    { x: -11, z: 22, w: 14, d: 1.4 },
    { x: 11, z: 22, w: 14, d: 1.4 },
    { x: -17.5, z: 0, w: 1.4, d: 44 },
    { x: 17.5, z: 0, w: 1.4, d: 44 },
  ];
  for (const w of wallSpecs) {
    const wall = m(new THREE.BoxGeometry(w.w, wallH, w.d), stone);
    wall.position.set(w.x, wallH / 2, w.z);
    group.add(wall);
    colliders.push({
      minX: w.x - w.w / 2, maxX: w.x + w.w / 2,
      minZ: w.z - w.d / 2, maxZ: w.z + w.d / 2,
      minY: 0, maxY: wallH, ground: false, level: "hogwarts", active: true,
    });
  }
  // Arch lintel over courtyard doorway
  const lintel = m(new THREE.BoxGeometry(8.5, 1.2, 1.6), darkStone);
  lintel.position.set(0, 5.4, 22);
  group.add(lintel);

  // Door opening in south wall (exit) — recess frame
  const doorFrame = m(new THREE.BoxGeometry(3.6, 4.2, 0.5), darkStone);
  doorFrame.position.set(0, 2.1, -21.2);
  group.add(doorFrame);

  // Columns along sides
  for (const x of [-12, -6, 6, 12]) {
    for (const z of [-14, -4, 6, 16]) {
      const col = m(new THREE.CylinderGeometry(0.45, 0.55, wallH - 0.5, 12), darkStone);
      col.position.set(x, (wallH - 0.5) / 2, z);
      group.add(col);
      const capital = m(new THREE.BoxGeometry(1.1, 0.35, 1.1), stone);
      capital.position.set(x, wallH - 0.4, z);
      group.add(capital);
    }
  }

  // Vaulted ceiling beams
  for (let i = -3; i <= 3; i += 1) {
    const beam = m(new THREE.BoxGeometry(34, 0.35, 0.45), wood);
    beam.position.set(0, wallH - 0.3, i * 5.5);
    group.add(beam);
  }
  const ceiling = m(
    new THREE.PlaneGeometry(36, 46),
    new THREE.MeshStandardMaterial({ color: 0x0a1018, roughness: 1, side: THREE.DoubleSide })
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = wallH;
  group.add(ceiling);

  // Stained glass windows on long walls
  const glassTex = makeStainedGlass();
  const glassMat = new THREE.MeshStandardMaterial({
    map: glassTex,
    emissive: 0x446688,
    emissiveIntensity: 0.55,
    roughness: 0.35,
    transparent: true,
    opacity: 0.92,
    side: THREE.DoubleSide,
  });
  for (const side of [-1, 1]) {
    for (let i = 0; i < 4; i += 1) {
      const win = m(new THREE.PlaneGeometry(2.2, 3.4), glassMat, false, false);
      win.position.set(side * 17.2, 5.5, -12 + i * 8);
      win.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
      group.add(win);
      const frame = m(new THREE.BoxGeometry(0.2, 3.7, 2.5), wood);
      frame.position.copy(win.position);
      frame.rotation.y = win.rotation.y;
      group.add(frame);
    }
  }

  // Floating candles (emissive, few real lights)
  const flameMat = new THREE.MeshStandardMaterial({
    color: 0xffe0a0,
    emissive: 0xffaa40,
    emissiveIntensity: 2.2,
    roughness: 0.3,
  });
  for (let i = 0; i < 16; i += 1) {
    const candle = new THREE.Group();
    const stick = m(new THREE.CylinderGeometry(0.03, 0.035, 0.5, 6), wood, false, false);
    const flame = m(new THREE.SphereGeometry(0.07, 8, 6), flameMat, false, false);
    flame.position.y = 0.32;
    candle.add(stick, flame);
    candle.position.set(
      (Math.random() - 0.5) * 28,
      6.5 + Math.random() * 2.5,
      (Math.random() - 0.5) * 36
    );
    group.add(candle);
    anim.candles.push({ root: candle, phase: Math.random() * Math.PI * 2, baseY: candle.position.y });
  }
  // A few warm point lights for the hall
  for (const [x, z] of [[-7, -4], [7, 6], [0, 10]]) {
    const light = new THREE.PointLight(0xffc070, 1.05, 22, 2);
    light.position.set(x, 7, z);
    light.castShadow = false;
    group.add(light);
  }

  // House tables
  const houses = [
    { name: "Gryffindor", color: 0x6a1a1a, z: -10 },
    { name: "Hufflepuff", color: 0x8a7a12, z: -3 },
    { name: "Ravenclaw", color: 0x1a2a6a, z: 4 },
    { name: "Slytherin", color: 0x1a4a1a, z: 11 },
  ];
  for (const house of houses) {
    const table = m(new THREE.BoxGeometry(14, 0.28, 1.5), wood);
    table.position.set(0, 0.72, house.z);
    const cloth = m(new THREE.BoxGeometry(13.4, 0.04, 1.3), new THREE.MeshStandardMaterial({ color: house.color, roughness: 0.85 }));
    cloth.position.set(0, 0.88, house.z);
    group.add(table, cloth);
    // Benches
    for (const side of [-1, 1]) {
      const bench = m(new THREE.BoxGeometry(13, 0.15, 0.45), wood);
      bench.position.set(0, 0.4, house.z + side * 1.15);
      group.add(bench);
    }
    // Place settings
    for (let i = -5; i <= 5; i += 1) {
      const plate = m(
        new THREE.CylinderGeometry(0.14, 0.14, 0.03, 10),
        new THREE.MeshStandardMaterial({ color: 0xe8e0d0, metalness: 0.3, roughness: 0.4 }),
        false, true
      );
      plate.position.set(i * 1.15, 0.95, house.z);
      const goblet = m(
        new THREE.CylinderGeometry(0.05, 0.06, 0.18, 8),
        new THREE.MeshStandardMaterial({ color: 0xc9a227, metalness: 0.85, roughness: 0.3 }),
        false, true
      );
      goblet.position.set(i * 1.15 + 0.22, 1.02, house.z + 0.25);
      group.add(plate, goblet);
    }
    // Wall banners
    const banner = m(
      new THREE.PlaneGeometry(1.6, 3.2),
      new THREE.MeshStandardMaterial({ map: makeBannerTex(`#${house.color.toString(16).padStart(6, "0")}`, house.name.slice(0, 4).toUpperCase()), side: THREE.DoubleSide, roughness: 0.8 }),
      false, false
    );
    banner.position.set(-16.6, 5.5, house.z);
    banner.rotation.y = Math.PI / 2;
    group.add(banner);
    anim.banners.push(banner);
  }

  // Staff table at north end (sides leave path into courtyard)
  const staffTable = m(new THREE.BoxGeometry(10, 0.3, 1.8), wood);
  staffTable.position.set(0, 1.1, 16);
  group.add(staffTable);
  const dais = m(new THREE.BoxGeometry(12, 0.5, 3.2), darkStone);
  dais.position.set(0, 0.25, 16);
  group.add(dais);

  // Courtyard — wander after Sorting
  const yardWalls = [
    { x: 0, z: 54, w: 40, d: 1.2 },
    { x: -20, z: 38, w: 1.2, d: 32 },
    { x: 20, z: 38, w: 1.2, d: 32 },
  ];
  for (const w of yardWalls) {
    const wall = m(new THREE.BoxGeometry(w.w, 7, w.d), stone);
    wall.position.set(w.x, 3.5, w.z);
    group.add(wall);
    colliders.push({
      minX: w.x - w.w / 2, maxX: w.x + w.w / 2,
      minZ: w.z - w.d / 2, maxZ: w.z + w.d / 2,
      minY: 0, maxY: 7, ground: false, level: "hogwarts", active: true,
    });
  }
  // Fountain
  const fountainBase = m(new THREE.CylinderGeometry(2.4, 2.8, 0.5, 20), darkStone);
  fountainBase.position.set(0, 0.25, 38);
  const fountainBowl = m(new THREE.CylinderGeometry(1.6, 1.8, 0.7, 16), stone);
  fountainBowl.position.set(0, 0.8, 38);
  const fountainSpout = m(new THREE.CylinderGeometry(0.15, 0.2, 1.4, 10), darkStone);
  fountainSpout.position.set(0, 1.7, 38);
  const water = m(
    new THREE.CylinderGeometry(1.4, 1.4, 0.12, 20),
    new THREE.MeshStandardMaterial({ color: 0x4a88aa, roughness: 0.15, metalness: 0.35, transparent: true, opacity: 0.75 }),
    false, true
  );
  water.position.set(0, 1.05, 38);
  group.add(fountainBase, fountainBowl, fountainSpout, water);
  colliders.push({
    minX: -2.6, maxX: 2.6, minZ: 35.4, maxZ: 40.6,
    minY: 0, maxY: 1.2, ground: false, level: "hogwarts", active: true,
  });
  // House crest plaques around courtyard
  const crestHouses = [
    { name: "GRYF", color: "#6a1a1a", x: -12, z: 46 },
    { name: "HUFF", color: "#8a7a12", x: -4, z: 50 },
    { name: "RAVE", color: "#1a2a6a", x: 4, z: 50 },
    { name: "SLYT", color: "#1a4a1a", x: 12, z: 46 },
  ];
  for (const h of crestHouses) {
    const plaque = m(
      new THREE.PlaneGeometry(2.2, 2.8),
      new THREE.MeshStandardMaterial({
        map: makeBannerTex(h.color, h.name),
        side: THREE.DoubleSide,
        roughness: 0.75,
      }),
      false, false
    );
    plaque.position.set(h.x, 2.4, h.z);
    group.add(plaque);
    anim.banners.push(plaque);
  }
  const yardFill = new THREE.PointLight(0xc8d8e8, 0.45, 40, 2);
  yardFill.position.set(0, 8, 40);
  group.add(yardFill);

  // Ambient fill
  const fill = new THREE.PointLight(0xffe0b8, 0.6, 50, 2);
  fill.position.set(0, 8, 0);
  group.add(fill);

  return anim;
}

export function updateHogwartsWorld(anim, time) {
  if (!anim?.candles) return;
  for (const c of anim.candles) {
    c.root.position.y = c.baseY + Math.sin(time * 1.4 + c.phase) * 0.12;
    const flame = c.root.children[1];
    if (flame?.material) {
      flame.material.emissiveIntensity = 1.8 + Math.sin(time * 8 + c.phase) * 0.4;
      flame.scale.setScalar(0.9 + Math.sin(time * 10 + c.phase) * 0.15);
    }
  }
  for (const b of anim.banners || []) {
    b.rotation.z = Math.sin(time * 0.8 + b.position.z) * 0.04;
  }
}

export function createDetailedSortingHat() {
  const root = new THREE.Group();
  const leather = new THREE.MeshStandardMaterial({ color: 0x3a2818, roughness: 0.92 });
  const brim = m(new THREE.CylinderGeometry(0.65, 0.7, 0.1, 20), leather);
  const cone = m(new THREE.ConeGeometry(0.38, 1.1, 16), leather);
  cone.position.y = 0.6;
  cone.rotation.z = 0.18;
  cone.rotation.x = -0.08;
  // Face folds
  const fold = m(new THREE.BoxGeometry(0.25, 0.08, 0.08), leather);
  fold.position.set(0, 0.45, 0.28);
  const eyeL = m(new THREE.SphereGeometry(0.04, 8, 6), new THREE.MeshStandardMaterial({ color: 0x1a1a1a }));
  eyeL.position.set(-0.1, 0.55, 0.3);
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.1;
  root.add(brim, cone, fold, eyeL, eyeR);
  return root;
}

export function createDetailedMcGonagall() {
  const root = new THREE.Group();
  const robe = new THREE.MeshStandardMaterial({ color: 0x1a3a28, roughness: 0.75 });
  const skin = new THREE.MeshStandardMaterial({ color: 0xd4b090, roughness: 0.55 });
  const hair = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.9 });
  const body = m(new THREE.CapsuleGeometry(0.24, 0.55, 8, 12), robe);
  body.position.y = 1.15;
  const cloak = m(new THREE.ConeGeometry(0.42, 1.1, 12, 1, true), robe);
  cloak.position.y = 0.9;
  cloak.rotation.x = Math.PI;
  const head = m(new THREE.SphereGeometry(0.16, 16, 12), skin);
  head.position.y = 1.72;
  const bun = m(new THREE.SphereGeometry(0.1, 10, 8), hair);
  bun.position.set(0, 1.88, -0.05);
  const hat = m(new THREE.ConeGeometry(0.18, 0.45, 10), new THREE.MeshStandardMaterial({ color: 0x1a2a1a, roughness: 0.85 }));
  hat.position.y = 2.05;
  root.add(body, cloak, head, bun, hat);
  return root;
}
