import * as THREE from "three";
import { mat, mesh, makeNoiseTexture, makeWoodTexture, makeStoneTexture } from "./materials.js";

export function addGround(group, colliders, { size = 60, y = 0, color = 0x5a5045, texture = null, level }) {
  const geo = new THREE.PlaneGeometry(size, size);
  const material = mat(color, {
    roughness: 0.92,
    map: texture,
  });
  if (texture) {
    texture.repeat.set(size / 8, size / 8);
  }
  const ground = mesh(geo, material, false, true);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = y;
  group.add(ground);
  const half = size / 2;
  colliders.push({
    minX: -half,
    maxX: half,
    minZ: -half,
    maxZ: half,
    minY: y - 0.5,
    maxY: y,
    ground: true,
    level,
    active: true,
  });
  return ground;
}

export function addBoxCollider(colliders, meshObj, level, padding = 0) {
  const box = new THREE.Box3().setFromObject(meshObj);
  colliders.push({
    minX: box.min.x - padding,
    maxX: box.max.x + padding,
    minZ: box.min.z - padding,
    maxZ: box.max.z + padding,
    minY: box.min.y,
    maxY: box.max.y,
    ground: false,
    level,
    active: true,
  });
}

/** Shift local-space AABBs into world space after a level group is positioned. */
export function worldOffsetColliders(colliders, origin) {
  if (!origin) return;
  for (const c of colliders) {
    c.minX += origin.x;
    c.maxX += origin.x;
    c.minY += origin.y;
    c.maxY += origin.y;
    c.minZ += origin.z;
    c.maxZ += origin.z;
  }
}

export function addWallBox(group, colliders, { x, y, z, w, h, d, color = 0x6a6055, level, map = null }) {
  const wall = mesh(new THREE.BoxGeometry(w, h, d), mat(color, { roughness: 0.85, map }));
  wall.position.set(x, y, z);
  group.add(wall);
  addBoxCollider(colliders, wall, level);
  return wall;
}

export function makeBuilding(group, colliders, opts) {
  const {
    x,
    z,
    w = 6,
    d = 5,
    h = 4,
    color = 0x8a7355,
    roofColor = 0x5a3030,
    level,
    label = null,
  } = opts;
  const body = mesh(new THREE.BoxGeometry(w, h, d), mat(color, { roughness: 0.8, map: makeStoneTexture() }));
  body.position.set(x, h / 2, z);
  group.add(body);
  addBoxCollider(colliders, body, level);

  const roof = mesh(new THREE.ConeGeometry(Math.max(w, d) * 0.72, 1.6, 4), mat(roofColor, { roughness: 0.75 }));
  roof.position.set(x, h + 0.8, z);
  roof.rotation.y = Math.PI / 4;
  group.add(roof);

  if (label) {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "rgba(20,16,12,0.75)";
    ctx.fillRect(0, 0, 512, 128);
    ctx.fillStyle = "#e8d5a3";
    ctx.font = "600 48px Georgia";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, 256, 64);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    const sign = mesh(
      new THREE.PlaneGeometry(2.4, 0.6),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true })
    );
    sign.position.set(x, h * 0.55, z + d / 2 + 0.05);
    group.add(sign);
  }

  return body;
}

export function createDummyTarget(color = 0x886655) {
  const root = new THREE.Group();
  const body = mesh(new THREE.CylinderGeometry(0.35, 0.45, 1.4, 10), mat(color, { roughness: 0.7 }));
  body.position.y = 0.7;
  const head = mesh(new THREE.SphereGeometry(0.28, 12, 10), mat(0xd4a574, { roughness: 0.55 }));
  head.position.y = 1.55;
  root.add(body, head);
  return root;
}

export function createNpcFigure({ robe = 0x334455, hair = 0x222222, skin = 0xe0b090, scale = 1 } = {}) {
  const root = new THREE.Group();
  const torso = mesh(new THREE.CapsuleGeometry(0.22, 0.4, 6, 10), mat(robe, { roughness: 0.8 }));
  torso.position.y = 1.05;
  const head = mesh(new THREE.SphereGeometry(0.16, 12, 10), mat(skin, { roughness: 0.55 }));
  head.position.y = 1.55;
  const hairCap = mesh(new THREE.SphereGeometry(0.17, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), mat(hair, { roughness: 0.9 }));
  hairCap.position.y = 1.6;
  const legs = mesh(new THREE.CapsuleGeometry(0.1, 0.4, 4, 8), mat(0x1a1a22, { roughness: 0.85 }));
  legs.position.y = 0.45;
  root.add(torso, head, hairCap, legs);
  root.scale.setScalar(scale);
  return root;
}

export function createNameLabel(name) {
  const canvas = document.createElement("canvas");
  canvas.width = 320;
  canvas.height = 72;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "rgba(12, 14, 20, 0.72)";
  ctx.beginPath();
  ctx.roundRect(14, 9, 292, 52, 8);
  ctx.fill();
  ctx.fillStyle = "rgba(232, 220, 190, 0.96)";
  ctx.font = "600 28px Georgia, serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(name, 160, 35);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Sprite(
    new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false })
  );
}

export { makeNoiseTexture, makeWoodTexture, makeStoneTexture, mat, mesh };
