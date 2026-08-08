import * as THREE from "three";
import {
  buildDiagonWorld,
  updateDiagonWorld,
  createBarrel,
  createCrate,
} from "../diagonProps.js";
import {
  createNpcFigure,
  createNameLabel,
  mat,
  mesh,
} from "../worldUtils.js";
import { HP_GLB } from "../assets.js";

export const DIAGON_ORIGIN = new THREE.Vector3(0, 0, 0);

function createDetailedDummy() {
  const root = new THREE.Group();
  const wood = mat(0x6a4a28, { roughness: 0.75, metalness: 0.05 });
  const post = mesh(new THREE.CylinderGeometry(0.12, 0.16, 1.5, 12), wood);
  post.position.y = 0.75;
  const torso = mesh(new THREE.CylinderGeometry(0.38, 0.42, 0.9, 14), mat(0x5a4030, { roughness: 0.8 }));
  torso.position.y = 1.15;
  const head = mesh(new THREE.SphereGeometry(0.26, 14, 12), mat(0xc4a070, { roughness: 0.55 }));
  head.position.y = 1.85;
  // Target rings
  for (const [r, y, c] of [
    [0.36, 1.2, 0x8a2020],
    [0.28, 1.2, 0xe8e0d0],
    [0.16, 1.2, 0x8a2020],
  ]) {
    const ring = mesh(
      new THREE.RingGeometry(r - 0.05, r, 20),
      new THREE.MeshStandardMaterial({ color: c, side: THREE.DoubleSide, roughness: 0.7 })
    );
    ring.position.set(0, y, 0.43);
    root.add(ring);
  }
  const base = mesh(new THREE.CylinderGeometry(0.45, 0.5, 0.12, 12), wood);
  base.position.y = 0.06;
  root.add(post, torso, head, base);
  return root;
}

function createDetailedOllivander() {
  const root = createNpcFigure({ robe: 0x2a2a32, hair: 0xd8d0c8, skin: 0xd8c0a0 });
  // Longer beard
  const beard = mesh(
    new THREE.ConeGeometry(0.12, 0.45, 8),
    mat(0xe8e0d8, { roughness: 0.92 })
  );
  beard.position.set(0, 1.35, 0.12);
  beard.rotation.x = 0.35;
  root.add(beard);
  // Spectacles
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x88aacc,
    metalness: 0.2,
    roughness: 0.15,
    transparent: true,
    opacity: 0.35,
  });
  const rim = mat(0x222222, { metalness: 0.7, roughness: 0.3 });
  for (const x of [-0.05, 0.05]) {
    const lens = mesh(new THREE.CircleGeometry(0.04, 12), glassMat, false, false);
    lens.position.set(x, 1.58, 0.15);
    const frame = mesh(new THREE.TorusGeometry(0.042, 0.006, 6, 14), rim);
    frame.position.copy(lens.position);
    root.add(lens, frame);
  }
  return root;
}

function createWandPedestal(texLib) {
  const root = new THREE.Group();
  const stone = texLib
    ? texLib.stone(1, 1, 0xd0c8b0)
    : mat(0x8a8070, { roughness: 0.7 });
  const wood = texLib ? texLib.wood(1, 1) : mat(0x4a3020, { roughness: 0.7 });

  const base = mesh(new THREE.CylinderGeometry(0.55, 0.65, 0.2, 16), stone);
  base.position.y = 0.1;
  const column = mesh(new THREE.CylinderGeometry(0.28, 0.35, 0.85, 14), stone);
  column.position.y = 0.55;
  const top = mesh(new THREE.CylinderGeometry(0.42, 0.38, 0.12, 16), wood);
  top.position.y = 1.05;
  const cushion = mesh(
    new THREE.CylinderGeometry(0.28, 0.28, 0.06, 16),
    mat(0x4a1a1a, { roughness: 0.85 })
  );
  cushion.position.y = 1.14;

  let wand = mesh(
    new THREE.CylinderGeometry(0.012, 0.018, 0.42, 10),
    mat(0x2a1810, { roughness: 0.55, metalness: 0.1 })
  );
  wand.position.set(0, 1.28, 0);
  wand.rotation.z = 0.55;
  wand.rotation.y = 0.3;
  let tip = mesh(
    new THREE.SphereGeometry(0.02, 8, 8),
    mat(0xffe8a0, { emissive: 0xffcc66, emissiveIntensity: 1.2, roughness: 0.3 })
  );
  tip.position.set(0.16, 1.42, 0.05);

  const glow = new THREE.PointLight(0xffd080, 0.7, 4, 2);
  glow.position.set(0, 1.35, 0);

  root.add(base, column, top, cushion, wand, tip, glow);
  root.userData.wand = wand;
  root.userData.tip = tip;
  root.userData.glow = glow;
  return root;
}

function placeBlenderProps(game, group, pedestal) {
  const assets = game.assets;
  if (!assets) return;

  const box = assets.cloneScene(HP_GLB.ollivanderBox);
  if (box) {
    box.position.set(-2.1, 0.02, 13.55);
    box.rotation.y = 0.35;
    box.scale.setScalar(1.15);
    group.add(box);
  }

  const wandGlb = assets.cloneScene(HP_GLB.hollyWand);
  if (wandGlb && pedestal) {
    const old = pedestal.userData.wand;
    const oldTip = pedestal.userData.tip;
    if (old) pedestal.remove(old);
    if (oldTip) pedestal.remove(oldTip);
    wandGlb.position.set(0, 1.22, 0);
    wandGlb.rotation.set(0.2, 0.4, 1.15);
    wandGlb.scale.setScalar(1.2);
    pedestal.add(wandGlb);
    pedestal.userData.wand = wandGlb;
    pedestal.userData.tip = assets.findNamed(wandGlb, "wandTip") || wandGlb;
  }

  const snitch = assets.cloneScene(HP_GLB.goldenSnitch);
  if (snitch) {
    snitch.position.set(3.4, 1.55, 12.1);
    snitch.scale.setScalar(2.4);
    group.add(snitch);
  }
}

function createFeatherProp() {
  const root = new THREE.Group();
  const vaneMat = new THREE.MeshStandardMaterial({
    color: 0xf4efe4,
    side: THREE.DoubleSide,
    roughness: 0.72,
    metalness: 0.02,
  });
  const tipMat = new THREE.MeshStandardMaterial({
    color: 0xd8c8a8,
    side: THREE.DoubleSide,
    roughness: 0.8,
  });
  const shaftMat = mat(0xe8dcc8, { roughness: 0.4, metalness: 0.08 });

  // Quill / rachis
  const shaft = mesh(new THREE.CylinderGeometry(0.006, 0.011, 0.72, 8), shaftMat);
  shaft.position.y = 0.36;
  root.add(shaft);

  // Calamus (lower hollow tip)
  const calamus = mesh(new THREE.CylinderGeometry(0.01, 0.007, 0.1, 8), mat(0xc8b898, { roughness: 0.55 }));
  calamus.position.y = 0.04;
  root.add(calamus);

  // Paired barbs along the shaft — wider mid-vane, taper to tip
  for (let i = 0; i < 18; i += 1) {
    const t = i / 17;
    const y = 0.12 + t * 0.58;
    const halfW = 0.045 + Math.sin(t * Math.PI) * 0.11;
    const len = halfW * 2;
    const barbL = mesh(
      new THREE.PlaneGeometry(len, 0.028 + (1 - t) * 0.01),
      t > 0.75 ? tipMat : vaneMat
    );
    barbL.position.set(-halfW * 0.45, y, 0);
    barbL.rotation.z = 0.15 + t * 0.08;
    barbL.rotation.y = 0.05;
    const barbR = barbL.clone();
    barbR.position.x = halfW * 0.45;
    barbR.rotation.z = -0.15 - t * 0.08;
    barbR.rotation.y = -0.05;
    root.add(barbL, barbR);
  }

  // Soft outline fringe near tip
  const tip = mesh(new THREE.ConeGeometry(0.04, 0.12, 8), tipMat);
  tip.position.y = 0.78;
  tip.rotation.x = Math.PI;
  root.add(tip);

  root.rotation.z = 0.35;
  root.rotation.y = 0.4;
  return root;
}

export function buildDiagonLevel(game) {
  const group = new THREE.Group();
  group.name = "diagon";
  const colliders = [];
  const interactives = [];
  const enemies = [];

  const anim = buildDiagonWorld(game, group, colliders);

  // Ollivander
  const ollivander = createDetailedOllivander();
  ollivander.position.set(-2.8, 0, 14.5);
  ollivander.rotation.y = Math.PI * 0.15;
  const oLabel = createNameLabel("Ollivander");
  oLabel.position.set(0, 2.25, 0);
  oLabel.scale.set(2.4, 0.55, 1);
  ollivander.add(oLabel);
  group.add(ollivander);
  interactives.push({
    id: "ollivander",
    root: ollivander,
    label: "Talk to Ollivander",
    range: 2.8,
  });

  // Wand pedestal (display only — Ollivander gives the wand after you speak to him)
  const pedestal = createWandPedestal(game.textures);
  pedestal.position.set(-1.6, 0, 13.2);
  group.add(pedestal);
  placeBlenderProps(game, group, pedestal);
  interactives.push({
    id: "wand",
    root: pedestal,
    label: "Speak to Ollivander for your wand",
    range: 2.4,
  });

  // Practice yard — enough targets to try the whole hotbar
  const dummySpots = [
    [1.6, 5.0],
    [2.8, 5.6],
    [4.0, 6.2],
    [1.4, 6.8],
    [2.6, 7.4],
    [3.8, 8.0],
    [1.8, 8.6],
    [3.0, 9.2],
    [4.2, 7.0],
    [2.2, 6.2],
  ];
  dummySpots.forEach(([x, z], i) => {
    const dummy = createDetailedDummy();
    dummy.position.set(x, 0, z);
    dummy.rotation.y = -0.55 + (i % 5) * 0.12;
    group.add(dummy);
    enemies.push({
      root: dummy,
      hp: 55,
      maxHp: 55,
      damage: 0,
      hitRadius: 1.5,
      hitHeight: 1.2,
      name: `Training Dummy ${i + 1}`,
      speed: 0,
      alive: true,
      stun: 0,
      slow: 0,
      attackCd: 0,
      training: true,
      respawnAt: 0,
    });
  });

  // Feather
  const feather = createFeatherProp();
  feather.position.set(0.2, 0.35, 4.5);
  group.add(feather);
  interactives.push({
    id: "feather",
    root: feather,
    label: "Levitate the feather (E or Leviosa · 5)",
    range: 2.5,
  });

  // Exit interactable at south arch
  const exitAnchor = new THREE.Object3D();
  exitAnchor.position.set(0, 2, -24);
  group.add(exitAnchor);
  interactives.push({
    id: "exit",
    root: exitAnchor,
    label: "Leave Diagon Alley",
    range: 3.8,
  });

  // Extra barrels near Ollivanders for set dressing
  if (game.textures) {
    const b1 = createBarrel(game.textures);
    b1.position.set(-3.5, 0, 12.5);
    const c1 = createCrate(game.textures);
    c1.position.set(-3.9, 0, 13.3);
    group.add(b1, c1);
  }

  group.position.copy(DIAGON_ORIGIN);
  game.scene.add(group);
  game.levelGroups.diagon = group;
  game.levelColliders.diagon = colliders;
  game.levelData.diagon = {
    interactives,
    enemies,
    feather,
    pedestal,
    anim,
    wandClaimed: false,
    lumosDone: false,
    leviosaDone: false,
    dummiesHit: 0,
    ollivanderTalked: false,
  };

  return { group, colliders, spawn: new THREE.Vector3(0, 0, 11) };
}

export function resetDiagonQuest(game) {
  const data = game.levelData.diagon;
  if (!data) return;
  data.wandClaimed = false;
  data.lumosDone = false;
  data.leviosaDone = false;
  data.dummiesHit = 0;
  data.ollivanderTalked = false;
  game.setWandEquipped?.(false);
  if (data.pedestal?.userData?.wand) data.pedestal.userData.wand.visible = true;
  if (data.pedestal?.userData?.tip) data.pedestal.userData.tip.visible = true;
  if (data.feather) data.feather.position.y = 0.35;
  const ped = data.pedestal?.userData;
  if (ped?.wand) ped.wand.visible = true;
  if (ped?.tip) ped.tip.visible = true;
  if (ped?.glow) ped.glow.visible = true;
  for (const e of data.enemies) {
    e.hp = e.maxHp;
    e.alive = true;
    e.root.visible = true;
    e.root.scale.setScalar(1);
    e.respawnAt = 0;
  }
}

export function updateDiagonLevel(game, delta, time) {
  const data = game.levelData.diagon;
  if (!data) return;
  updateDiagonWorld(data.anim, time, delta);
  if (data.feather && data.leviosaDone) {
    data.feather.position.y = 1.35 + Math.sin(time * 2.2) * 0.18;
    data.feather.rotation.y += delta * 1.8;
    data.feather.rotation.z = Math.sin(time * 3) * 0.15;
  } else if (data.feather) {
    data.feather.rotation.y = Math.sin(time * 0.8) * 0.2;
    data.feather.rotation.z = 0.35 + Math.sin(time * 1.2) * 0.05;
  }
  if (data.pedestal?.userData?.tip?.material) {
    data.pedestal.userData.tip.material.emissiveIntensity = 1.0 + Math.sin(time * 4) * 0.5;
  }
  for (const e of data.enemies) {
    // Respawn practice dummies so you can try every spell
    if (!e.alive && e.training && e.respawnAt && time >= e.respawnAt) {
      e.alive = true;
      e.hp = e.maxHp;
      e.root.visible = true;
      e.root.scale.setScalar(1);
      e.respawnAt = 0;
    }
    if (!e.alive) continue;
    e.root.rotation.y += Math.sin(time * 0.5 + e.root.position.x) * delta * 0.05;
  }
}

export function diagonSpawn() {
  return new THREE.Vector3(0, 0, 11);
}
