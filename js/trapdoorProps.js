import * as THREE from "three";

function m(geometry, material, cast = true, receive = true) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = cast;
  mesh.receiveShadow = receive;
  return mesh;
}

export function createDevilsSnare() {
  const root = new THREE.Group();
  const vineMat = new THREE.MeshStandardMaterial({ color: 0x2a4a28, roughness: 0.92 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x1a3020, roughness: 0.9 });
  for (let i = 0; i < 22; i += 1) {
    const len = 1.2 + Math.random() * 1.8;
    const vine = m(new THREE.CapsuleGeometry(0.06 + Math.random() * 0.05, len, 4, 6), i % 3 ? vineMat : dark);
    vine.position.set((Math.random() - 0.5) * 7, len * 0.35, (Math.random() - 0.5) * 5);
    vine.rotation.z = (Math.random() - 0.5) * 1.2;
    vine.rotation.x = (Math.random() - 0.5) * 0.8;
    root.add(vine);
    // Tendril tip
    const tip = m(new THREE.ConeGeometry(0.08, 0.35, 6), vineMat);
    tip.position.copy(vine.position);
    tip.position.y += len * 0.4;
    tip.rotation.copy(vine.rotation);
    root.add(tip);
  }
  // Central mass
  const mass = m(new THREE.SphereGeometry(1.2, 12, 10), dark);
  mass.position.set(0, 0.6, 0);
  mass.scale.set(1.4, 0.7, 1.2);
  root.add(mass);
  return root;
}

export function createFlyingKey() {
  const root = new THREE.Group();
  const gold = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.92,
    roughness: 0.25,
    emissive: 0x553300,
    emissiveIntensity: 0.35,
  });
  const shaft = m(new THREE.CylinderGeometry(0.03, 0.035, 0.45, 8), gold);
  shaft.rotation.z = Math.PI / 2;
  const bow = m(new THREE.TorusGeometry(0.1, 0.025, 8, 16), gold);
  bow.position.x = -0.28;
  const bit = m(new THREE.BoxGeometry(0.12, 0.08, 0.04), gold);
  bit.position.set(0.28, -0.04, 0);
  // Wings
  const wingMat = new THREE.MeshStandardMaterial({
    color: 0xe8d080,
    metalness: 0.6,
    roughness: 0.4,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.85,
  });
  const wingL = m(new THREE.PlaneGeometry(0.35, 0.2), wingMat, false, false);
  wingL.position.set(0, 0.12, 0);
  wingL.rotation.z = 0.3;
  const wingR = wingL.clone();
  wingR.rotation.z = -0.3;
  wingR.position.y = -0.02;
  root.add(shaft, bow, bit, wingL, wingR);
  root.userData.wings = [wingL, wingR];
  return root;
}

export function createChessPiece(isWhite, type = "pawn") {
  const root = new THREE.Group();
  const color = isWhite ? 0xe8e0d0 : 0x1a1a1a;
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.45, metalness: 0.15, envMapIntensity: 0.7 });
  const accent = new THREE.MeshStandardMaterial({
    color: isWhite ? 0xc9a227 : 0x444444,
    metalness: 0.7,
    roughness: 0.35,
  });

  const base = m(new THREE.CylinderGeometry(0.4, 0.45, 0.25, 12), mat);
  base.position.y = 0.12;
  const stem = m(new THREE.CylinderGeometry(0.18, 0.28, 0.7, 10), mat);
  stem.position.y = 0.55;
  root.add(base, stem);

  if (type === "knight") {
    const head = m(new THREE.BoxGeometry(0.35, 0.45, 0.55), mat);
    head.position.set(0.05, 1.15, 0.05);
    const snout = m(new THREE.BoxGeometry(0.2, 0.2, 0.35), mat);
    snout.position.set(0.15, 1.1, 0.3);
    root.add(head, snout);
  } else if (type === "rook") {
    const tower = m(new THREE.BoxGeometry(0.45, 0.5, 0.45), mat);
    tower.position.y = 1.15;
    for (const [x, z] of [[-0.15, -0.15], [0.15, -0.15], [-0.15, 0.15], [0.15, 0.15]]) {
      const battlement = m(new THREE.BoxGeometry(0.12, 0.2, 0.12), accent);
      battlement.position.set(x, 1.5, z);
      root.add(battlement);
    }
    root.add(tower);
  } else if (type === "queen") {
    const crown = m(new THREE.ConeGeometry(0.28, 0.6, 8), mat);
    crown.position.y = 1.25;
    const ball = m(new THREE.SphereGeometry(0.08, 8, 6), accent);
    ball.position.y = 1.6;
    root.add(crown, ball);
  } else {
    // pawn
    const ball = m(new THREE.SphereGeometry(0.22, 12, 10), mat);
    ball.position.y = 1.1;
    root.add(ball);
  }
  return root;
}

export function buildTrapdoorWorld(game, group, colliders) {
  const tex = game.textures;
  const anim = { torchFlames: [] };

  const stone = tex.stone(4, 3, 0x8a8890);
  const darkStone = tex.stone(3, 2, 0x5a5860);
  const floorMat = tex.stone(6, 8, 0x6a6870);

  // Continuous dungeon floor
  const floor = m(new THREE.PlaneGeometry(44, 70, 20, 30), floorMat, false, true);
  floor.rotation.x = -Math.PI / 2;
  group.add(floor);
  colliders.push({
    minX: -22, maxX: 22, minZ: -35, maxZ: 35,
    minY: -0.5, maxY: 0, ground: true, level: "trapdoor", active: true,
  });

  const wallH = 7;
  // Outer walls
  for (const [x, z, w, d] of [
    [0, -34, 44, 1.2],
    [0, 34, 44, 1.2],
    [-21.5, 0, 1.2, 68],
    [21.5, 0, 1.2, 68],
  ]) {
    const wall = m(new THREE.BoxGeometry(w, wallH, d), darkStone);
    wall.position.set(x, wallH / 2, z);
    group.add(wall);
    colliders.push({
      minX: x - w / 2, maxX: x + w / 2,
      minZ: z - d / 2, maxZ: z + d / 2,
      minY: 0, maxY: wallH, ground: false, level: "trapdoor", active: true,
    });
  }

  // Room divider walls with archways
  for (const z of [-8, 8]) {
    for (const side of [-1, 1]) {
      const wall = m(new THREE.BoxGeometry(14, wallH, 1.2), stone);
      wall.position.set(side * 14, wallH / 2, z);
      group.add(wall);
      colliders.push({
        minX: side * 14 - 7, maxX: side * 14 + 7,
        minZ: z - 0.6, maxZ: z + 0.6,
        minY: 0, maxY: wallH, ground: false, level: "trapdoor", active: true,
      });
    }
    // Arch
    const arch = m(new THREE.TorusGeometry(2.8, 0.35, 10, 20, Math.PI), stone);
    arch.rotation.z = -Math.PI / 2;
    arch.rotation.y = Math.PI / 2;
    arch.position.set(0, 3.2, z);
    group.add(arch);
  }

  // Ceiling
  const ceiling = m(
    new THREE.PlaneGeometry(44, 70),
    new THREE.MeshStandardMaterial({ color: 0x1a1a22, roughness: 1 }),
    false, false
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = wallH;
  group.add(ceiling);

  // Columns
  for (const z of [-20, -12, 0, 12, 20]) {
    for (const x of [-10, 10]) {
      const col = m(new THREE.CylinderGeometry(0.4, 0.5, wallH - 0.5, 10), darkStone);
      col.position.set(x, (wallH - 0.5) / 2, z);
      group.add(col);
    }
  }

  // Torches on walls
  for (const [x, z] of [
    [-12, -18], [12, -18], [-12, 0], [12, 0], [-12, 18], [12, 18],
  ]) {
    const bracket = m(new THREE.BoxGeometry(0.15, 0.15, 0.4), new THREE.MeshStandardMaterial({ color: 0x3a3a3a, metalness: 0.7 }));
    bracket.position.set(x, 3.5, z);
    const flame = m(
      new THREE.ConeGeometry(0.12, 0.4, 6),
      new THREE.MeshStandardMaterial({ color: 0xff6600, emissive: 0xff4400, emissiveIntensity: 2 }),
      false, false
    );
    flame.position.set(x + Math.sign(x) * -0.2, 3.85, z);
    group.add(bracket, flame);
    anim.torchFlames.push(flame);
  }
  // One light per chamber wall pair
  for (const [x, z] of [[-10, -18], [10, 0], [-10, 18]]) {
    const light = new THREE.PointLight(0xff8844, 0.7, 16, 2);
    light.position.set(x, 3.8, z);
    light.castShadow = false;
    group.add(light);
  }

  // Chess board floor in third room
  const lightSq = new THREE.MeshStandardMaterial({ color: 0xd0c8b8, roughness: 0.7 });
  const darkSq = new THREE.MeshStandardMaterial({ color: 0x2a2a30, roughness: 0.7 });
  for (let row = 0; row < 6; row += 1) {
    for (let col = 0; col < 6; col += 1) {
      const sq = m(new THREE.BoxGeometry(2.2, 0.06, 2.2), (row + col) % 2 ? lightSq : darkSq, false, true);
      sq.position.set(-5.5 + col * 2.2, 0.03, 14 + row * 2.2);
      group.add(sq);
    }
  }

  // Key chamber decorative cages / pillars
  for (let i = 0; i < 4; i += 1) {
    const a = (i / 4) * Math.PI * 2;
    const pedestal = m(new THREE.CylinderGeometry(0.3, 0.4, 1.2, 10), stone);
    pedestal.position.set(Math.cos(a) * 8, 0.6, Math.sin(a) * 3);
    group.add(pedestal);
  }

  // Ambient
  const fill = new THREE.PointLight(0x6688aa, 0.35, 40, 2);
  fill.position.set(0, 5, 0);
  group.add(fill);

  return anim;
}

export function updateTrapdoorWorld(anim, time) {
  if (!anim?.torchFlames) return;
  for (let i = 0; i < anim.torchFlames.length; i += 1) {
    const f = anim.torchFlames[i];
    f.scale.y = 0.85 + Math.sin(time * 10 + i) * 0.25;
    f.material.emissiveIntensity = 1.6 + Math.sin(time * 12 + i) * 0.5;
  }
}
