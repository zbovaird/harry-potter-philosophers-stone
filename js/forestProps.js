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

export function createForestTree(tex, rng = Math.random) {
  const root = new THREE.Group();
  const bark = tex.wood(1, 3);
  bark.color = new THREE.Color(0x4a3020);
  if (tex.maps?.barkMap) {
    bark.map = tex.cloneMap("barkMap", 1, 3);
    bark.normalMap = tex.cloneMap("barkNor", 1, 3);
    bark.color.set(0xffffff);
  }
  const height = 5 + rng() * 4;
  const trunkR = 0.28 + rng() * 0.2;
  const trunk = m(new THREE.CylinderGeometry(trunkR * 0.65, trunkR, height * 0.55, 10), bark);
  trunk.position.y = height * 0.275;
  trunk.rotation.z = (rng() - 0.5) * 0.1;
  root.add(trunk);

  const leafMat = new THREE.MeshStandardMaterial({
    map: tex.cloneMap("thatchMap", 1, 1) || null,
    color: new THREE.Color().setHSL(0.28 + rng() * 0.06, 0.4, 0.18 + rng() * 0.08),
    roughness: 0.9,
    metalness: 0,
  });
  const layers = 3 + Math.floor(rng() * 2);
  for (let i = 0; i < layers; i += 1) {
    const r = (1.4 + rng() * 0.7) * (1 - i * 0.12);
    const canopy = m(new THREE.SphereGeometry(r, 12, 10), leafMat);
    canopy.position.set((rng() - 0.5) * 0.5, height * 0.5 + i * 0.55, (rng() - 0.5) * 0.5);
    canopy.scale.y = 0.7 + rng() * 0.2;
    root.add(canopy);
  }
  root.userData.collideRadius = trunkR + 0.2;
  return root;
}

export function createForestCreature() {
  const root = new THREE.Group();
  const fur = new THREE.MeshStandardMaterial({ color: 0x2a2218, roughness: 0.9 });
  const body = m(new THREE.SphereGeometry(0.5, 12, 10), fur);
  body.position.y = 0.55;
  body.scale.set(1.2, 0.9, 1.4);
  const head = m(new THREE.SphereGeometry(0.28, 10, 8), fur);
  head.position.set(0, 0.75, 0.45);
  for (const x of [-0.1, 0.1]) {
    const eye = m(
      new THREE.SphereGeometry(0.06, 8, 6),
      new THREE.MeshStandardMaterial({ color: 0xff2200, emissive: 0xff1100, emissiveIntensity: 1.8 })
    );
    eye.position.set(x, 0.8, 0.65);
    root.add(eye);
  }
  const legPositions = [
    [-0.3, 0.25, 0.3],
    [0.3, 0.25, 0.3],
    [-0.3, 0.25, -0.3],
    [0.3, 0.25, -0.3],
  ];
  for (const [x, y, z] of legPositions) {
    const leg = m(new THREE.CapsuleGeometry(0.08, 0.25, 4, 6), fur);
    leg.position.set(x, y, z);
    root.add(leg);
  }
  root.add(body, head);
  return root;
}

export function createFirenze() {
  const root = new THREE.Group();
  const skin = new THREE.MeshStandardMaterial({ color: 0xc4a080, roughness: 0.55 });
  const horse = new THREE.MeshStandardMaterial({ color: 0xc8a050, roughness: 0.8 });
  const hair = new THREE.MeshStandardMaterial({ color: 0xd4b060, roughness: 0.9 });

  const torso = m(new THREE.CapsuleGeometry(0.22, 0.4, 8, 10), skin);
  torso.position.y = 1.85;
  const head = m(new THREE.SphereGeometry(0.16, 14, 12), skin);
  head.position.y = 2.35;
  const mane = m(new THREE.SphereGeometry(0.18, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), hair);
  mane.position.set(0, 2.4, -0.02);

  const body = m(new THREE.CapsuleGeometry(0.4, 1.1, 6, 10), horse);
  body.position.set(0, 0.85, -0.15);
  body.rotation.z = Math.PI / 2;
  const neck = m(new THREE.CylinderGeometry(0.18, 0.25, 0.5, 8), horse);
  neck.position.set(0, 1.35, 0.35);
  neck.rotation.x = -0.5;

  for (const [x, z] of [[-0.25, 0.45], [0.25, 0.45], [-0.25, -0.55], [0.25, -0.55]]) {
    const leg = m(new THREE.CapsuleGeometry(0.1, 0.55, 4, 6), horse);
    leg.position.set(x, 0.4, z);
    root.add(leg);
  }
  const tail = m(new THREE.ConeGeometry(0.08, 0.7, 6), hair);
  tail.position.set(0, 0.9, -0.9);
  tail.rotation.x = 0.8;

  root.add(torso, head, mane, body, neck, tail);
  return root;
}

export function createCloakProp() {
  const root = new THREE.Group();
  const cloth = new THREE.MeshStandardMaterial({
    color: 0x8899aa,
    roughness: 0.25,
    metalness: 0.45,
    transparent: true,
    opacity: 0.45,
    side: THREE.DoubleSide,
    envMapIntensity: 1.2,
  });
  const cloak = m(new THREE.ConeGeometry(0.55, 1.4, 16, 1, true), cloth);
  cloak.position.y = 0.7;
  cloak.rotation.x = Math.PI;
  const fold = m(new THREE.PlaneGeometry(0.9, 1.3), cloth, false, false);
  fold.position.set(0.1, 0.75, 0.15);
  fold.rotation.y = 0.3;
  root.add(cloak, fold);
  return root;
}

export function buildForestWorld(game, group, colliders) {
  const tex = game.textures;
  const rng = seeded(42);
  const anim = { mist: null, fireflies: [] };

  const groundMat = new THREE.MeshStandardMaterial({
    map: tex.cloneMap("thatchMap", 10, 10) || tex.cloneMap("stoneMap", 8, 8),
    color: 0x3a4a28,
    roughness: 0.95,
    metalness: 0,
  });
  const ground = m(new THREE.PlaneGeometry(90, 90, 40, 40), groundMat, false, true);
  ground.rotation.x = -Math.PI / 2;
  const pos = ground.geometry.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    pos.setZ(i, Math.sin(pos.getX(i) * 0.3) * Math.cos(pos.getY(i) * 0.25) * 0.15);
  }
  ground.geometry.computeVertexNormals();
  group.add(ground);
  colliders.push({
    minX: -45, maxX: 45, minZ: -45, maxZ: 45,
    minY: -0.5, maxY: 0, ground: true, level: "forest", active: true,
  });

  // Trees
  for (let i = 0; i < 55; i += 1) {
    const x = (rng() - 0.5) * 80;
    const z = (rng() - 0.5) * 80;
    if (Math.hypot(x, z) < 5) continue;
    // Keep path clear
    if (Math.abs(x) < 3.5 && z > -25 && z < 25) continue;
    const tree = createForestTree(tex, rng);
    tree.position.set(x, 0, z);
    tree.rotation.y = rng() * Math.PI * 2;
    group.add(tree);
    const r = tree.userData.collideRadius || 0.4;
    colliders.push({
      minX: x - r, maxX: x + r, minZ: z - r, maxZ: z + r,
      minY: 0, maxY: 6, ground: false, level: "forest", active: true,
    });
  }

  // Path stones
  const stone = tex.stone(1, 1, 0x6a6a58);
  for (let i = 0; i < 28; i += 1) {
    const s = m(new THREE.BoxGeometry(0.9 + rng() * 0.5, 0.08, 0.9 + rng() * 0.4), stone);
    s.position.set(Math.sin(i * 0.35) * 1.8 + (rng() - 0.5), 0.04, -24 + i * 1.85);
    s.rotation.y = rng() * 0.5;
    group.add(s);
  }

  // Undergrowth bushes
  const bushMat = new THREE.MeshStandardMaterial({ color: 0x1a3020, roughness: 0.92 });
  for (let i = 0; i < 30; i += 1) {
    const bush = m(new THREE.SphereGeometry(0.4 + rng() * 0.4, 8, 6), bushMat);
    bush.position.set((rng() - 0.5) * 60, 0.3, (rng() - 0.5) * 60);
    bush.scale.y = 0.6;
    if (Math.hypot(bush.position.x, bush.position.z) < 4) continue;
    group.add(bush);
  }

  // Fallen logs
  for (let i = 0; i < 5; i += 1) {
    const log = m(new THREE.CylinderGeometry(0.25, 0.3, 2.5 + rng(), 8), tex.wood(1, 2));
    log.rotation.z = Math.PI / 2;
    log.position.set((rng() - 0.5) * 40, 0.25, (rng() - 0.5) * 40);
    log.rotation.y = rng() * Math.PI;
    group.add(log);
  }

  // Mist plane
  const mist = m(
    new THREE.PlaneGeometry(80, 80),
    new THREE.MeshStandardMaterial({
      color: 0x6a8070,
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
    }),
    false, false
  );
  mist.rotation.x = -Math.PI / 2;
  mist.position.y = 1.2;
  group.add(mist);
  anim.mist = mist;

  // Fireflies
  for (let i = 0; i < 10; i += 1) {
    const fly = m(
      new THREE.SphereGeometry(0.04, 6, 4),
      new THREE.MeshStandardMaterial({ color: 0xccff66, emissive: 0xaaff44, emissiveIntensity: 2 }),
      false, false
    );
    fly.position.set((rng() - 0.5) * 40, 0.8 + rng() * 3, (rng() - 0.5) * 40);
    group.add(fly);
    anim.fireflies.push({ mesh: fly, phase: rng() * Math.PI * 2, origin: fly.position.clone() });
  }

  // Moon light
  const moon = new THREE.DirectionalLight(0x8899bb, 0.45);
  moon.position.set(-15, 25, 8);
  group.add(moon);
  const fill = new THREE.PointLight(0x335544, 0.4, 30, 2);
  fill.position.set(0, 5, 0);
  group.add(fill);
  // Clearing glow near Firenze
  const clearing = new THREE.PointLight(0x6688aa, 0.6, 20, 2);
  clearing.position.set(0, 4, 22);
  group.add(clearing);

  return anim;
}

export function updateForestWorld(anim, time) {
  if (!anim) return;
  if (anim.mist) {
    anim.mist.material.opacity = 0.1 + Math.sin(time * 0.4) * 0.03;
  }
  for (const f of anim.fireflies || []) {
    f.mesh.position.x = f.origin.x + Math.sin(time * 1.2 + f.phase) * 0.8;
    f.mesh.position.y = f.origin.y + Math.sin(time * 2 + f.phase) * 0.4;
    f.mesh.position.z = f.origin.z + Math.cos(time * 1.1 + f.phase) * 0.8;
    f.mesh.material.emissiveIntensity = 1.5 + Math.sin(time * 6 + f.phase) * 0.8;
  }
}
