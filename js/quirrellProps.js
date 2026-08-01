import * as THREE from "three";

function m(geometry, material, cast = true, receive = true) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = cast;
  mesh.receiveShadow = receive;
  return mesh;
}

function makeMirrorInscription() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#1a1208";
  ctx.fillRect(0, 0, 1024, 128);
  ctx.fillStyle = "#c9a227";
  ctx.font = "600 36px Georgia";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("ERISED STRA EHRU OYT UBE CAFRU OYT ON WOHSI", 512, 64);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createDetailedQuirrell() {
  const root = new THREE.Group();
  const robeMat = new THREE.MeshStandardMaterial({ color: 0x5a1a1a, roughness: 0.78 });
  const skin = new THREE.MeshStandardMaterial({ color: 0xd4a080, roughness: 0.55 });
  const turbanMat = new THREE.MeshStandardMaterial({ color: 0x6a2030, roughness: 0.7 });
  const voldSkin = new THREE.MeshStandardMaterial({ color: 0xc8d0c0, roughness: 0.45 });

  const robe = m(new THREE.CapsuleGeometry(0.3, 0.65, 8, 12), robeMat);
  robe.position.y = 1.2;
  const cloak = m(new THREE.ConeGeometry(0.48, 1.3, 14, 1, true), robeMat);
  cloak.position.y = 1.0;
  cloak.rotation.x = Math.PI;
  const head = m(new THREE.SphereGeometry(0.17, 14, 12), skin);
  head.position.y = 1.78;
  const turban = m(new THREE.TorusGeometry(0.17, 0.09, 10, 16), turbanMat);
  turban.position.y = 1.92;
  turban.rotation.x = Math.PI / 2;
  const turbanTop = m(new THREE.SphereGeometry(0.14, 10, 8), turbanMat);
  turbanTop.position.y = 2.05;

  // Voldemort face on back of head
  const vold = m(new THREE.SphereGeometry(0.13, 12, 10), voldSkin);
  vold.position.set(0, 1.78, -0.16);
  const nose = m(new THREE.ConeGeometry(0.04, 0.12, 6), voldSkin);
  nose.position.set(0, 1.75, -0.28);
  nose.rotation.x = Math.PI / 2;
  for (const x of [-0.05, 0.05]) {
    const eye = m(
      new THREE.SphereGeometry(0.03, 6, 6),
      new THREE.MeshStandardMaterial({ color: 0xff2200, emissive: 0xff0000, emissiveIntensity: 1.5 })
    );
    eye.position.set(x, 1.82, -0.26);
    root.add(eye);
  }

  const armL = m(new THREE.CapsuleGeometry(0.06, 0.35, 4, 8), robeMat);
  armL.position.set(-0.38, 1.3, 0);
  const armR = armL.clone();
  armR.position.x = 0.38;
  const wand = m(new THREE.CylinderGeometry(0.012, 0.016, 0.35, 6), new THREE.MeshStandardMaterial({ color: 0x2a1810, roughness: 0.6 }));
  wand.position.set(0.42, 1.0, 0.15);
  wand.rotation.z = -0.5;

  root.add(robe, cloak, head, turban, turbanTop, vold, nose, armL, armR, wand);
  return root;
}

export function createMirrorOfErised(tex) {
  const root = new THREE.Group();
  const gold = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.9,
    roughness: 0.28,
    envMapIntensity: 1.6,
  });
  const orn = new THREE.MeshStandardMaterial({
    color: 0xb8860b,
    metalness: 0.85,
    roughness: 0.35,
  });

  const frame = m(new THREE.BoxGeometry(3.6, 5.2, 0.45), gold);
  frame.position.y = 2.6;
  // Ornate top crest
  const crest = m(new THREE.SphereGeometry(0.45, 12, 10), orn);
  crest.position.y = 5.5;
  const clawL = m(new THREE.ConeGeometry(0.2, 0.8, 6), orn);
  clawL.position.set(-1.4, 5.2, 0);
  clawL.rotation.z = 0.5;
  const clawR = clawL.clone();
  clawR.position.x = 1.4;
  clawR.rotation.z = -0.5;

  // Columns
  for (const x of [-1.7, 1.7]) {
    const col = m(new THREE.CylinderGeometry(0.2, 0.25, 5, 10), gold);
    col.position.set(x, 2.5, 0.1);
    root.add(col);
  }

  const glass = m(
    new THREE.PlaneGeometry(2.8, 4.2),
    new THREE.MeshStandardMaterial({
      color: 0x88aacc,
      metalness: 0.95,
      roughness: 0.08,
      emissive: 0x224466,
      emissiveIntensity: 0.45,
      envMapIntensity: 2,
    }),
    false, false
  );
  glass.position.set(0, 2.6, 0.25);

  // Reflection glow
  const glow = m(
    new THREE.PlaneGeometry(2.6, 3.8),
    new THREE.MeshStandardMaterial({
      color: 0xaaddff,
      emissive: 0x6688aa,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
    }),
    false, false
  );
  glow.position.set(0, 2.6, 0.22);

  const inscription = m(
    new THREE.PlaneGeometry(3.2, 0.35),
    new THREE.MeshStandardMaterial({ map: makeMirrorInscription(), roughness: 0.5 }),
    false, false
  );
  inscription.position.set(0, 0.35, 0.26);

  const base = m(new THREE.BoxGeometry(4.2, 0.4, 1.2), tex ? tex.stone(2, 1, 0x8a8070) : gold);
  base.position.y = 0.2;

  root.add(frame, crest, clawL, clawR, glass, glow, inscription, base);
  root.userData.glass = glass;
  return root;
}

export function buildQuirrellWorld(game, group, colliders) {
  const tex = game.textures;
  const anim = { flames: [], runes: [] };

  const stone = tex.stone(3, 2, 0x6a5a58);
  const darkStone = tex.stone(2, 2, 0x3a2a28);
  const floorMat = tex.stone(5, 5, 0x4a3a38);

  const floor = m(new THREE.PlaneGeometry(40, 40, 20, 20), floorMat, false, true);
  floor.rotation.x = -Math.PI / 2;
  group.add(floor);
  colliders.push({
    minX: -20, maxX: 20, minZ: -20, maxZ: 20,
    minY: -0.5, maxY: 0, ground: true, level: "quirrell", active: true,
  });

  const wallH = 9;
  for (const [x, z, w, d] of [
    [0, -18, 40, 1.5],
    [0, 18, 40, 1.5],
    [-19.5, 0, 1.5, 36],
    [19.5, 0, 1.5, 36],
  ]) {
    const wall = m(new THREE.BoxGeometry(w, wallH, d), darkStone);
    wall.position.set(x, wallH / 2, z);
    group.add(wall);
    colliders.push({
      minX: x - w / 2, maxX: x + w / 2,
      minZ: z - d / 2, maxZ: z + d / 2,
      minY: 0, maxY: wallH, ground: false, level: "quirrell", active: true,
    });
  }

  // Ceiling
  const ceiling = m(
    new THREE.PlaneGeometry(40, 40),
    new THREE.MeshStandardMaterial({ color: 0x12080a, roughness: 1 }),
    false, false
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = wallH;
  group.add(ceiling);

  // Pillars
  for (const x of [-10, 10]) {
    for (const z of [-8, 8]) {
      const col = m(new THREE.CylinderGeometry(0.6, 0.75, wallH - 0.5, 12), stone);
      col.position.set(x, (wallH - 0.5) / 2, z);
      group.add(col);
      const capital = m(new THREE.BoxGeometry(1.5, 0.4, 1.5), darkStone);
      capital.position.set(x, wallH - 0.4, z);
      group.add(capital);
    }
  }

  // Fire ring
  const fireRing = new THREE.Group();
  const flameMat = new THREE.MeshStandardMaterial({
    color: 0xff4400,
    emissive: 0xff2200,
    emissiveIntensity: 2.2,
    roughness: 0.4,
  });
  for (let i = 0; i < 20; i += 1) {
    const a = (i / 20) * Math.PI * 2;
    const flame = m(new THREE.ConeGeometry(0.22, 0.9 + Math.random() * 0.4, 6), flameMat);
    flame.position.set(Math.cos(a) * 8, 0.45, Math.sin(a) * 8);
    fireRing.add(flame);
    anim.flames.push(flame);
  }
  // Ember ring base
  const ringBase = m(
    new THREE.TorusGeometry(8, 0.25, 8, 40),
    new THREE.MeshStandardMaterial({ color: 0x2a1510, emissive: 0x441100, emissiveIntensity: 0.5, roughness: 0.8 })
  );
  ringBase.rotation.x = Math.PI / 2;
  ringBase.position.y = 0.1;
  fireRing.add(ringBase);
  group.add(fireRing);

  // Enchanted fire lights (limited)
  for (let i = 0; i < 2; i += 1) {
    const a = (i / 2) * Math.PI * 2 + 0.3;
    const light = new THREE.PointLight(0xff5522, 1.15, 18, 2);
    light.position.set(Math.cos(a) * 7.5, 1.5, Math.sin(a) * 7.5);
    light.castShadow = false;
    group.add(light);
  }

  // Floor runes
  for (let i = 0; i < 8; i += 1) {
    const a = (i / 8) * Math.PI * 2;
    const rune = m(
      new THREE.RingGeometry(0.3, 0.45, 6),
      new THREE.MeshStandardMaterial({
        color: 0xff6644,
        emissive: 0xff2200,
        emissiveIntensity: 0.8,
        side: THREE.DoubleSide,
      }),
      false, false
    );
    rune.rotation.x = -Math.PI / 2;
    rune.position.set(Math.cos(a) * 4, 0.03, Math.sin(a) * 4);
    group.add(rune);
    anim.runes.push(rune);
  }

  // Ambient dread light
  const fill = new THREE.PointLight(0xff6644, 0.5, 35, 2);
  fill.position.set(0, 6, 0);
  group.add(fill);
  const mirrorLight = new THREE.PointLight(0x88aaff, 1.0, 18, 2);
  mirrorLight.position.set(0, 4, -12);
  group.add(mirrorLight);

  anim.fireRing = fireRing;
  return anim;
}

export function updateQuirrellWorld(anim, time) {
  if (!anim) return;
  for (let i = 0; i < (anim.flames || []).length; i += 1) {
    const f = anim.flames[i];
    f.scale.y = 0.75 + Math.sin(time * 8 + i * 0.7) * 0.35;
    f.material.emissiveIntensity = 1.8 + Math.sin(time * 11 + i) * 0.5;
  }
  for (let i = 0; i < (anim.runes || []).length; i += 1) {
    anim.runes[i].material.emissiveIntensity = 0.5 + Math.sin(time * 3 + i) * 0.35;
  }
}
