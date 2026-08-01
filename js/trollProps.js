import * as THREE from "three";

function m(geometry, material, cast = true, receive = true) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = cast;
  mesh.receiveShadow = receive;
  return mesh;
}

function makeTileTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#8a9098";
  ctx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 8; y += 1) {
    for (let x = 0; x < 8; x += 1) {
      const shade = 130 + Math.floor(Math.random() * 30);
      ctx.fillStyle = `rgb(${shade},${shade + 4},${shade + 8})`;
      ctx.fillRect(x * 32 + 1, y * 32 + 1, 30, 30);
      ctx.strokeStyle = "rgba(60,65,70,0.5)";
      ctx.strokeRect(x * 32, y * 32, 32, 32);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 3);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createDetailedTroll() {
  const root = new THREE.Group();
  const hide = new THREE.MeshStandardMaterial({ color: 0x6a7a58, roughness: 0.9 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x4a5a40, roughness: 0.88 });
  const body = m(new THREE.CapsuleGeometry(0.85, 1.4, 8, 12), hide);
  body.position.y = 1.7;
  const belly = m(new THREE.SphereGeometry(0.7, 12, 10), dark);
  belly.position.set(0, 1.5, 0.25);
  belly.scale.set(1.1, 0.9, 0.85);
  const head = m(new THREE.SphereGeometry(0.6, 14, 12), hide);
  head.position.y = 3.05;
  const brow = m(new THREE.BoxGeometry(0.7, 0.12, 0.25), dark);
  brow.position.set(0, 3.2, 0.4);
  const jaw = m(new THREE.BoxGeometry(0.45, 0.2, 0.3), hide);
  jaw.position.set(0, 2.75, 0.4);
  for (const x of [-0.18, 0.18]) {
    const eye = m(new THREE.SphereGeometry(0.08, 8, 6), new THREE.MeshStandardMaterial({ color: 0xffee88, emissive: 0x886600, emissiveIntensity: 0.6 }));
    eye.position.set(x, 3.1, 0.52);
    root.add(eye);
  }
  const armL = m(new THREE.CapsuleGeometry(0.22, 0.9, 6, 8), hide);
  armL.position.set(-1.0, 2.0, 0.1);
  armL.rotation.z = 0.4;
  const armR = m(new THREE.CapsuleGeometry(0.22, 0.9, 6, 8), hide);
  armR.position.set(1.0, 2.0, 0.1);
  armR.rotation.z = -0.4;
  const club = m(new THREE.CylinderGeometry(0.14, 0.28, 2.0, 10), new THREE.MeshStandardMaterial({ color: 0x4a3020, roughness: 0.9 }));
  club.position.set(1.35, 1.6, 0.35);
  club.rotation.z = -0.7;
  club.rotation.x = 0.2;
  const legL = m(new THREE.CapsuleGeometry(0.28, 0.7, 6, 8), hide);
  legL.position.set(-0.35, 0.55, 0);
  const legR = legL.clone();
  legR.position.x = 0.35;
  root.add(body, belly, head, brow, jaw, armL, armR, club, legL, legR);
  return root;
}

export function createDetailedHermione() {
  const root = new THREE.Group();
  const robe = new THREE.MeshStandardMaterial({ color: 0x1a2a4a, roughness: 0.75 });
  const skin = new THREE.MeshStandardMaterial({ color: 0xe4b898, roughness: 0.55 });
  const hair = new THREE.MeshStandardMaterial({ color: 0x8a4a18, roughness: 0.88 });
  const hairDark = new THREE.MeshStandardMaterial({ color: 0x6a3810, roughness: 0.92 });
  const body = m(new THREE.CapsuleGeometry(0.2, 0.45, 8, 12), robe);
  body.position.y = 1.05;
  const head = m(new THREE.SphereGeometry(0.15, 14, 12), skin);
  head.position.y = 1.55;
  // Scalp volume
  const scalp = m(new THREE.SphereGeometry(0.17, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.62), hair, false, true);
  scalp.position.set(0, 1.58, 0);
  scalp.scale.set(1.1, 1.0, 1.05);
  root.add(scalp);
  // Dense bushy curls
  for (let i = 0; i < 40; i += 1) {
    const a = (i / 40) * Math.PI * 2;
    const layer = i % 3;
    const r = 0.14 + layer * 0.03;
    const curl = m(
      new THREE.SphereGeometry(0.035 + (i % 4) * 0.008, 8, 6),
      i % 2 ? hair : hairDark,
      false,
      true
    );
    curl.position.set(
      Math.sin(a) * r,
      1.52 + layer * 0.05 + (i % 5) * 0.012,
      Math.cos(a) * r * 0.95
    );
    root.add(curl);
  }
  // Shoulder-length hanging ringlets
  for (let i = 0; i < 12; i += 1) {
    const a = -1.15 + (i / 11) * 2.3;
    const ringlet = m(new THREE.CapsuleGeometry(0.026, 0.16 + (i % 3) * 0.04, 4, 8), hair, false, true);
    ringlet.position.set(Math.sin(a) * 0.15, 1.32 - (i % 3) * 0.03, Math.cos(a) * 0.11);
    ringlet.rotation.z = a * 0.25;
    ringlet.rotation.x = 0.3;
    root.add(ringlet);
  }
  const legs = m(new THREE.CapsuleGeometry(0.08, 0.4, 4, 8), new THREE.MeshStandardMaterial({ color: 0x1a1a22, roughness: 0.85 }));
  legs.position.y = 0.4;
  root.add(body, head, legs);
  return root;
}

export function buildTrollWorld(game, group, colliders) {
  const tex = game.textures;
  const anim = { drips: [], puddles: [] };

  const tileTex = makeTileTexture();
  const tileMat = new THREE.MeshStandardMaterial({
    map: tileTex,
    roughness: 0.35,
    metalness: 0.15,
    envMapIntensity: 0.8,
  });
  const stone = tex.stone(3, 2, 0xa8aeb8);
  const porcelain = new THREE.MeshStandardMaterial({ color: 0xe8ecee, roughness: 0.25, metalness: 0.1 });

  // Floor
  const floor = m(new THREE.PlaneGeometry(28, 28, 16, 16), tileMat, false, true);
  floor.rotation.x = -Math.PI / 2;
  group.add(floor);
  colliders.push({
    minX: -14, maxX: 14, minZ: -14, maxZ: 14,
    minY: -0.5, maxY: 0, ground: true, level: "troll", active: true,
  });

  // Walls — south wall split for exit door gap near Hermione
  const wallH = 7;
  for (const [x, z, w, d] of [
    [-9.5, -13, 9, 1], // south left → -14..-5
    [6.5, -13, 15, 1], // south right → -1..14 (door gap -5..-1)
    [0, 13, 28, 1],
    [-13.5, 0, 1, 26],
    [13.5, 0, 1, 26],
  ]) {
    const wall = m(new THREE.BoxGeometry(w, wallH, d), tileMat);
    wall.position.set(x, wallH / 2, z);
    group.add(wall);
    colliders.push({
      minX: x - w / 2, maxX: x + w / 2,
      minZ: z - d / 2, maxZ: z + d / 2,
      minY: 0, maxY: wallH, ground: false, level: "troll", active: true,
    });
  }
  // Door frame around exit opening
  const doorFrameL = m(new THREE.BoxGeometry(0.35, 3.4, 0.5), porcelain);
  doorFrameL.position.set(-5.1, 1.7, -13);
  const doorFrameR = m(new THREE.BoxGeometry(0.35, 3.4, 0.5), porcelain);
  doorFrameR.position.set(-0.9, 1.7, -13);
  const doorLintel = m(new THREE.BoxGeometry(4.6, 0.4, 0.55), porcelain);
  doorLintel.position.set(-3, 3.5, -13);
  group.add(doorFrameL, doorFrameR, doorLintel);

  // Ceiling
  const ceiling = m(new THREE.PlaneGeometry(28, 28), stone, false, false);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = wallH;
  group.add(ceiling);

  // Stalls along back wall
  for (let i = -2; i <= 2; i += 1) {
    const stall = new THREE.Group();
    const walls = m(new THREE.BoxGeometry(1.8, 2.4, 1.4), porcelain);
    walls.position.y = 1.2;
    const door = m(new THREE.BoxGeometry(1.5, 2.1, 0.08), new THREE.MeshStandardMaterial({ color: 0x6a7078, roughness: 0.5, metalness: 0.3 }));
    door.position.set(0, 1.05, 0.75);
    const hinge = m(new THREE.CylinderGeometry(0.03, 0.03, 0.15, 6), new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8 }));
    hinge.position.set(-0.7, 1.5, 0.75);
    stall.add(walls, door, hinge);
    stall.position.set(i * 3.4, 0, -10.5);
    // Broken stall near center
    if (i === 1) {
      door.rotation.y = 0.9;
      door.position.x = 0.4;
    }
    group.add(stall);
  }

  // Sinks / mirrors along side
  for (let i = 0; i < 4; i += 1) {
    const sink = m(new THREE.BoxGeometry(0.9, 0.15, 0.55), porcelain);
    sink.position.set(-11.5, 0.95, -6 + i * 3.5);
    const basin = m(new THREE.CylinderGeometry(0.28, 0.22, 0.2, 12), porcelain);
    basin.position.set(-11.5, 0.8, -6 + i * 3.5);
    const faucet = m(new THREE.CylinderGeometry(0.03, 0.03, 0.25, 6), new THREE.MeshStandardMaterial({ color: 0xc0c4c8, metalness: 0.85, roughness: 0.25 }));
    faucet.position.set(-11.5, 1.2, -6.15 + i * 3.5);
    const mirror = m(
      new THREE.PlaneGeometry(0.8, 1.1),
      new THREE.MeshStandardMaterial({ color: 0xaaccdd, metalness: 0.95, roughness: 0.08, envMapIntensity: 1.5 })
    );
    mirror.position.set(-12.9, 1.9, -6 + i * 3.5);
    mirror.rotation.y = Math.PI / 2;
    // Cracked mirror
    if (i === 2) {
      mirror.material = mirror.material.clone();
      mirror.material.color.set(0x668899);
      mirror.rotation.z = 0.15;
    }
    group.add(sink, basin, faucet, mirror);
  }

  // Debris from troll fight
  for (let i = 0; i < 12; i += 1) {
    const chunk = m(
      new THREE.BoxGeometry(0.3 + Math.random() * 0.5, 0.15 + Math.random() * 0.2, 0.25 + Math.random() * 0.4),
      stone
    );
    chunk.position.set((Math.random() - 0.5) * 16, 0.1, (Math.random() - 0.5) * 14);
    chunk.rotation.set(Math.random(), Math.random(), Math.random());
    group.add(chunk);
  }

  // Puddles
  for (let i = 0; i < 6; i += 1) {
    const puddle = m(
      new THREE.CircleGeometry(0.4 + Math.random() * 0.6, 16),
      new THREE.MeshStandardMaterial({
        color: 0x4a6070,
        metalness: 0.7,
        roughness: 0.15,
        transparent: true,
        opacity: 0.65,
      }),
      false, true
    );
    puddle.rotation.x = -Math.PI / 2;
    puddle.position.set((Math.random() - 0.5) * 12, 0.02, (Math.random() - 0.5) * 12);
    group.add(puddle);
    anim.puddles.push(puddle);
  }

  // Overhead lamps — geometry on all, real lights on a few
  for (const [x, z, lit] of [
    [-6, -4, true],
    [6, -4, false],
    [-6, 6, false],
    [6, 6, true],
    [0, 0, true],
  ]) {
    const fixture = m(new THREE.CylinderGeometry(0.2, 0.25, 0.15, 10), new THREE.MeshStandardMaterial({ color: 0x3a3a40, metalness: 0.6 }));
    fixture.position.set(x, wallH - 0.3, z);
    const bulb = m(
      new THREE.SphereGeometry(0.15, 10, 8),
      new THREE.MeshStandardMaterial({ color: 0xffeecc, emissive: 0xffddaa, emissiveIntensity: lit ? 1.8 : 1.2 }),
      false, false
    );
    bulb.position.set(x, wallH - 0.5, z);
    group.add(fixture, bulb);
    if (lit) {
      const light = new THREE.PointLight(0xcce0ff, 0.85, 16, 2);
      light.position.set(x, wallH - 0.6, z);
      light.castShadow = false;
      group.add(light);
    }
  }

  // Water drip particles (simple spheres)
  for (let i = 0; i < 8; i += 1) {
    const drop = m(
      new THREE.SphereGeometry(0.03, 6, 4),
      new THREE.MeshStandardMaterial({ color: 0xaaccff, transparent: true, opacity: 0.7 }),
      false, false
    );
    drop.position.set(-11.5, 2 + Math.random() * 3, -6 + (i % 4) * 3.5);
    group.add(drop);
    anim.drips.push({ mesh: drop, speed: 1.5 + Math.random(), baseX: drop.position.x, baseZ: drop.position.z });
  }

  return anim;
}

export function updateTrollWorld(anim, time, delta) {
  if (!anim?.drips) return;
  for (const d of anim.drips) {
    d.mesh.position.y -= d.speed * delta;
    if (d.mesh.position.y < 0.05) d.mesh.position.y = 3.5 + Math.random();
  }
}
