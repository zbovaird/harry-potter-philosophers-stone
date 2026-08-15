import * as THREE from "three";
import { mat, mesh } from "./materials.js";
import { addBoxCollider, addGround, makeBuilding } from "./worldUtils.js";
import { HP_GLB } from "./assets.js";

function lantern(x, y, z, color = 0xffcc88, intensity = 1.4) {
  const root = new THREE.Group();
  const pole = mesh(new THREE.CylinderGeometry(0.04, 0.05, y, 8), mat(0x2a2418, { roughness: 0.7, metalness: 0.3 }));
  pole.position.y = y / 2;
  const lamp = mesh(
    new THREE.SphereGeometry(0.12, 10, 8),
    mat(color, { roughness: 0.25, emissive: color, emissiveIntensity: 0.85 })
  );
  lamp.position.y = y;
  const light = new THREE.PointLight(color, intensity, 14, 2);
  light.position.y = y;
  root.add(pole, lamp, light);
  root.position.set(x, 0, z);
  return root;
}

export function placeOptionalGlb(game, url, fallback, targetHeight = 1.6, opts = {}) {
  const clone = game.assets?.cloneScene(url);
  if (clone) {
    game.assets.normalizeStandingModel(clone, targetHeight, { standUp: opts.standUp !== false });
    return clone;
  }
  return fallback();
}

export function addBoundedGround(group, colliders, { size = 52, color = 0x4a5340, texture = null, level }) {
  return addGround(group, colliders, { size, color, texture, level });
}

export function addCottage(group, colliders, { x, z, w = 9, d = 7, h = 5.2, level, color = 0x8a6a48, roof = 0x6a3030 }) {
  makeBuilding(group, colliders, { x, z, w, d, h, color, roofColor: roof, level });
  const chimney = mesh(new THREE.BoxGeometry(0.7, 1.6, 0.7), mat(0x5a4a40, { roughness: 0.88 }));
  chimney.position.set(x + w * 0.22, h + 1.9, z - d * 0.15);
  group.add(chimney);
}

export function addKnockturnRow(group, colliders, level, tex) {
  const names = ["Borgin & Burkes", "Shady Relics", "Nightshade", "Cursed Curios"];
  names.forEach((label, i) => {
    makeBuilding(group, colliders, {
      x: -11 + i * 7.2,
      z: 10,
      w: 6.2,
      d: 5.4,
      h: 4.4 + (i % 2) * 0.7,
      color: 0x2a2a32,
      roofColor: 0x1a1210,
      level,
      label,
    });
  });
  const cobble = tex?.stone?.(6, 6, 0x3a3a42);
  if (cobble) {
    const street = mesh(new THREE.PlaneGeometry(32, 8), cobble, false, true);
    street.rotation.x = -Math.PI / 2;
    street.position.set(0, 0.02, 4.5);
    group.add(street);
  }
}

export function createFordAnglia() {
  const root = new THREE.Group();
  const paint = mat(0x2a4a8a, { roughness: 0.35, metalness: 0.45 });
  const chrome = mat(0xc8d0d8, { roughness: 0.22, metalness: 0.9 });
  const body = mesh(new THREE.BoxGeometry(1.7, 0.55, 3.4), paint);
  body.position.y = 0.62;
  const cabin = mesh(new THREE.BoxGeometry(1.55, 0.55, 1.7), paint);
  cabin.position.set(0, 1.05, -0.15);
  const glass = mesh(
    new THREE.BoxGeometry(1.4, 0.38, 1.55),
    mat(0x88b8e0, { roughness: 0.12, metalness: 0.2, transparent: true, opacity: 0.45 })
  );
  glass.position.set(0, 1.12, -0.12);
  for (const z of [-1.15, 1.15]) {
    for (const x of [-0.72, 0.72]) {
      const wheel = mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.18, 12), mat(0x1a1a1a, { roughness: 0.8 }));
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, 0.28, z);
      root.add(wheel);
    }
  }
  const bumper = mesh(new THREE.BoxGeometry(1.55, 0.12, 0.18), chrome);
  bumper.position.set(0, 0.48, 1.72);
  root.add(body, cabin, glass, bumper);
  return root;
}

export function createWhompingWillow() {
  const root = new THREE.Group();
  const bark = mat(0x4a3424, { roughness: 0.92 });
  const trunk = mesh(new THREE.CylinderGeometry(0.85, 1.35, 6.2, 10), bark);
  trunk.position.y = 3.1;
  const crown = mesh(new THREE.SphereGeometry(3.4, 12, 10), mat(0x1e3a18, { roughness: 0.88 }));
  crown.position.y = 7.1;
  crown.scale.set(1.15, 0.7, 1.15);
  root.add(trunk, crown);
  const arms = [];
  for (let i = 0; i < 5; i += 1) {
    const arm = mesh(new THREE.CapsuleGeometry(0.16, 3.4, 4, 8), bark);
    arm.position.set(Math.sin(i) * 1.1, 4.6, Math.cos(i) * 1.1);
    arm.rotation.z = 0.9 + i * 0.12;
    arm.rotation.y = i * 1.2;
    root.add(arm);
    arms.push(arm);
  }
  root.userData.arms = arms;
  return root;
}

export function createSpider() {
  const root = new THREE.Group();
  const bodyMat = mat(0x1a1210, { roughness: 0.7 });
  const abdomen = mesh(new THREE.SphereGeometry(0.38, 10, 8), bodyMat);
  abdomen.position.set(0, 0.42, -0.15);
  abdomen.scale.set(1, 0.75, 1.25);
  const head = mesh(new THREE.SphereGeometry(0.18, 8, 6), bodyMat);
  head.position.set(0, 0.4, 0.32);
  root.add(abdomen, head);
  for (let i = 0; i < 8; i += 1) {
    const side = i < 4 ? -1 : 1;
    const k = i % 4;
    const leg = mesh(new THREE.CapsuleGeometry(0.03, 0.7, 3, 6), bodyMat);
    leg.position.set(side * 0.35, 0.28, -0.25 + k * 0.18);
    leg.rotation.z = side * 0.85;
    root.add(leg);
  }
  return root;
}

export function createBasilisk() {
  const root = new THREE.Group();
  const scale = mat(0x1a4a28, { roughness: 0.45, metalness: 0.15 });
  let y = 0.5;
  for (let i = 0; i < 8; i += 1) {
    const seg = mesh(new THREE.SphereGeometry(0.55 - i * 0.04, 10, 8), scale);
    seg.position.set(0, y, -i * 0.85);
    seg.scale.set(1.1, 0.7, 1.3);
    root.add(seg);
  }
  const head = mesh(new THREE.SphereGeometry(0.62, 12, 10), scale);
  head.position.set(0, 1.15, 0.7);
  head.scale.set(1.15, 0.7, 1.4);
  const eyeL = mesh(
    new THREE.SphereGeometry(0.09, 8, 6),
    mat(0xffee88, { emissive: 0xffcc33, emissiveIntensity: 1.4, roughness: 0.2 })
  );
  eyeL.position.set(-0.22, 1.28, 1.15);
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.22;
  root.add(head, eyeL, eyeR);
  return root;
}

export function createMandrake() {
  const root = new THREE.Group();
  const pot = mesh(new THREE.CylinderGeometry(0.22, 0.18, 0.28, 10), mat(0x6a4030, { roughness: 0.8 }));
  pot.position.y = 0.14;
  const soil = mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.06, 10), mat(0x3a2818, { roughness: 0.95 }));
  soil.position.y = 0.28;
  const leaf = mesh(new THREE.SphereGeometry(0.16, 8, 6), mat(0x2a6a28, { roughness: 0.7 }));
  leaf.position.y = 0.42;
  leaf.scale.set(1.4, 0.45, 1.4);
  root.add(pot, soil, leaf);
  return root;
}

export function createDiary() {
  const root = new THREE.Group();
  const cover = mesh(new THREE.BoxGeometry(0.28, 0.04, 0.38), mat(0x3a1a12, { roughness: 0.65 }));
  cover.position.y = 0.04;
  const gold = mesh(
    new THREE.BoxGeometry(0.12, 0.01, 0.12),
    mat(0xc9a227, { roughness: 0.3, metalness: 0.85, emissive: 0x332200, emissiveIntensity: 0.35 })
  );
  gold.position.y = 0.07;
  root.add(cover, gold);
  return root;
}

/** Movie-style copper ouroboros set into the bathroom floor. */
export function createOuroborosHatch() {
  const root = new THREE.Group();
  const copper = mat(0xb08a48, { metalness: 0.82, roughness: 0.32 });
  const scale = mat(0x2a4a32, { metalness: 0.45, roughness: 0.4, emissive: 0x142818, emissiveIntensity: 0.35 });
  const eye = mat(0x66ff88, { emissive: 0x44ff66, emissiveIntensity: 1.2, roughness: 0.2 });

  const ring = mesh(new THREE.TorusGeometry(1.18, 0.2, 12, 32), copper);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.1;

  const lid = mesh(new THREE.CircleGeometry(1.02, 28), scale);
  lid.rotation.x = -Math.PI / 2;
  lid.position.y = 0.05;
  const hinge = new THREE.Group();
  hinge.position.set(0, 0.05, -1.02);
  lid.position.set(0, 0, 1.02);
  hinge.add(lid);

  const head = mesh(new THREE.SphereGeometry(0.32, 12, 10), copper);
  head.position.set(1.05, 0.28, 0.15);
  head.scale.set(1.15, 0.75, 1.35);
  const jaw = mesh(new THREE.ConeGeometry(0.14, 0.38, 8), copper);
  jaw.rotation.z = Math.PI / 2;
  jaw.position.set(1.38, 0.18, 0.12);
  const eyeL = mesh(new THREE.SphereGeometry(0.05, 8, 6), eye);
  eyeL.position.set(1.18, 0.38, 0.28);
  const eyeR = eyeL.clone();
  eyeR.position.z = 0.02;

  const tail = mesh(new THREE.SphereGeometry(0.14, 8, 6), copper);
  tail.position.set(0.85, 0.16, -0.12);

  root.add(ring, hinge, head, jaw, eyeL, eyeR, tail);
  root.userData.lidHinge = hinge;
  return root;
}

export function createWebWall(w = 4.2, h = 3.4) {
  const geo = new THREE.PlaneGeometry(w, h, 6, 6);
  const web = mesh(
    geo,
    new THREE.MeshStandardMaterial({
      color: 0xddd8cc,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
      roughness: 0.4,
    })
  );
  web.position.y = h / 2;
  return web;
}

export function decorateLanterns(group, spots) {
  for (const [x, z, color, intensity] of spots) {
    group.add(lantern(x, 2.4, z, color, intensity));
  }
}

export function tryPlaceProp(game, group, url, fallback, pos, height, opts = {}) {
  const obj = placeOptionalGlb(game, url, fallback, height, opts);
  obj.position.copy(pos);
  group.add(obj);
  return obj;
}

export { HP_GLB };
