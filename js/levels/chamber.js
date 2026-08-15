import * as THREE from "three";
import { worldOffsetColliders, createNpcFigure, createNameLabel, mat, mesh, addWallBox, addGroundPatch } from "../worldUtils.js";
import { createBasilisk, createDiary, createOuroborosHatch, decorateLanterns, tryPlaceProp } from "../cosKit.js";
import { HP_GLB } from "../assets.js";
import { createEnemy } from "../combat.js";
import { tickBoss } from "../bossAI.js";

export const CHAMBER_ORIGIN = new THREE.Vector3(0, 0, 3400);
export const CHAMBER_DEPTH = 18;
const HATCH = { x: 0, z: 1.6, size: 2.55 };

function addBathroomFloor(group, colliders, tex) {
  const tile = tex.cloneMap?.("stoneMap", 3, 3);
  const color = 0xc8d0d4;
  const hole = HATCH.size;
  const half = 10;
  const westW = half - hole / 2;
  addGroundPatch(group, colliders, {
    x: -(hole / 2 + westW / 2),
    z: 0,
    w: westW,
    d: 20,
    color,
    texture: tile,
    level: "chamber",
  });
  addGroundPatch(group, colliders, {
    x: hole / 2 + westW / 2,
    z: 0,
    w: westW,
    d: 20,
    color,
    texture: tile,
    level: "chamber",
  });
  const southD = half + HATCH.z - hole / 2;
  addGroundPatch(group, colliders, {
    x: 0,
    z: HATCH.z - hole / 2 - southD / 2,
    w: hole,
    d: southD,
    color,
    texture: tile,
    level: "chamber",
  });
  const northD = half - HATCH.z - hole / 2;
  addGroundPatch(group, colliders, {
    x: 0,
    z: HATCH.z + hole / 2 + northD / 2,
    w: hole,
    d: northD,
    color,
    texture: tile,
    level: "chamber",
  });
}

export function openChamberHatch(game) {
  const data = game.levelData.chamber;
  if (!data || data.hatchOpen) return;
  data.hatchOpen = true;
  if (data.hatchGround) data.hatchGround.active = false;
  game.showMessage("The copper serpent yawns. The pipe drops into darkness.");
}

export function buildChamberLevel(game) {
  const group = new THREE.Group();
  group.name = "chamber";
  const colliders = [];
  const interactives = [];
  const tex = game.textures;
  const plaster = tex.cloneMap?.("stoneMap", 4, 4);
  const greenStone = tex.cloneMap?.("stoneMap", 6, 6);

  const upper = new THREE.Group();
  upper.name = "myrtleBathroom";
  group.add(upper);

  addBathroomFloor(upper, colliders, tex);
  addWallBox(upper, colliders, { x: 0, y: 2.8, z: -10, w: 20, h: 5.6, d: 0.45, color: 0xd8e0e4, level: "chamber", map: plaster });
  addWallBox(upper, colliders, { x: 0, y: 2.8, z: 10, w: 20, h: 5.6, d: 0.45, color: 0xd8e0e4, level: "chamber", map: plaster });
  addWallBox(upper, colliders, { x: -10, y: 2.8, z: 0, w: 0.45, h: 5.6, d: 20, color: 0xc8d0d4, level: "chamber", map: plaster });
  addWallBox(upper, colliders, { x: 10, y: 2.8, z: 0, w: 0.45, h: 5.6, d: 20, color: 0xc8d0d4, level: "chamber", map: plaster });
  decorateLanterns(upper, [
    [-6, -6, 0xc8e8ff, 1.3],
    [6, 6, 0xe8f4ff, 1.2],
    [-6, 6, 0xaaccdd, 0.9],
  ]);

  for (let i = 0; i < 3; i += 1) {
    const stall = mesh(new THREE.BoxGeometry(1.6, 2.4, 1.4), mat(0xb8c0c4, { roughness: 0.7 }));
    stall.position.set(-7.2 + i * 2.1, 1.2, -8.2);
    upper.add(stall);
  }
  const sinks = mesh(new THREE.BoxGeometry(6, 0.7, 1.2), mat(0xe8eef2, { roughness: 0.35, metalness: 0.2 }));
  sinks.position.set(4.2, 0.85, -8.1);
  upper.add(sinks);

  const myrtle = createNpcFigure({ robe: 0x6a88aa, hair: 0xb0c0d0, skin: 0xd8e0e8 });
  myrtle.position.set(-6, 0.15, -5);
  myrtle.add(createNameLabel("Moaning Myrtle"));
  myrtle.children.at(-1).position.set(0, 2.15, 0);
  myrtle.children.at(-1).scale.set(2.3, 0.5, 1);
  upper.add(myrtle);
  interactives.push({ id: "myrtle", root: myrtle, label: "Speak with Myrtle", range: 2.5 });

  const diary = tryPlaceProp(game, upper, HP_GLB.tomRiddleDiary, createDiary, new THREE.Vector3(3.4, 1.22, -8.1), 0.28, {
    standUp: false,
  });
  interactives.push({ id: "diary", root: diary, label: "Accio the diary (or E)", range: 2.2 });

  const hatch = createOuroborosHatch();
  hatch.position.set(HATCH.x, 0, HATCH.z);
  upper.add(hatch);
  const hatchGround = {
    minX: HATCH.x - HATCH.size / 2,
    maxX: HATCH.x + HATCH.size / 2,
    minZ: HATCH.z - HATCH.size / 2,
    maxZ: HATCH.z + HATCH.size / 2,
    minY: -0.5,
    maxY: 0,
    ground: true,
    level: "chamber",
    active: true,
  };
  colliders.push(hatchGround);
  interactives.push({ id: "hatch", root: hatch, label: "Alohomora the ouroboros hatch", range: 2.8 });

  const hs = HATCH.size / 2 - 0.08;
  const shaftH = CHAMBER_DEPTH - 0.5;
  addWallBox(group, colliders, { x: HATCH.x - hs, y: -shaftH / 2 - 0.15, z: HATCH.z, w: 0.16, h: shaftH, d: HATCH.size - 0.2, color: 0x1a241c, level: "chamber" });
  addWallBox(group, colliders, { x: HATCH.x + hs, y: -shaftH / 2 - 0.15, z: HATCH.z, w: 0.16, h: shaftH, d: HATCH.size - 0.2, color: 0x1a241c, level: "chamber" });
  addWallBox(group, colliders, { x: HATCH.x, y: -shaftH / 2 - 0.15, z: HATCH.z - hs, w: HATCH.size - 0.2, h: shaftH, d: 0.16, color: 0x1a241c, level: "chamber" });
  addWallBox(group, colliders, { x: HATCH.x, y: -shaftH / 2 - 0.15, z: HATCH.z + hs, w: HATCH.size - 0.2, h: shaftH, d: 0.16, color: 0x1a241c, level: "chamber" });

  const shaft = mesh(
    new THREE.CylinderGeometry(1.2, 1.35, CHAMBER_DEPTH - 0.4, 16, 1, true),
    mat(0x24332a, { roughness: 0.85, side: THREE.DoubleSide })
  );
  shaft.position.set(HATCH.x, -CHAMBER_DEPTH / 2, HATCH.z);
  group.add(shaft);

  const lower = new THREE.Group();
  lower.name = "chamberHall";
  lower.position.y = -CHAMBER_DEPTH;
  group.add(lower);

  addGroundPatch(group, colliders, {
    x: 0,
    z: 16,
    w: 18,
    d: 48,
    y: -CHAMBER_DEPTH,
    color: 0x2a3a30,
    texture: greenStone,
    level: "chamber",
  });
  addWallBox(group, colliders, { x: 0, y: -CHAMBER_DEPTH + 3.6, z: -8, w: 18, h: 7.2, d: 0.55, color: 0x3a4a40, level: "chamber", map: greenStone });
  addWallBox(group, colliders, { x: 0, y: -CHAMBER_DEPTH + 3.6, z: 40, w: 18, h: 7.2, d: 0.55, color: 0x3a4a40, level: "chamber", map: greenStone });
  addWallBox(group, colliders, { x: -9, y: -CHAMBER_DEPTH + 3.6, z: 16, w: 0.55, h: 7.2, d: 48, color: 0x2a3a32, level: "chamber", map: greenStone });
  addWallBox(group, colliders, { x: 9, y: -CHAMBER_DEPTH + 3.6, z: 16, w: 0.55, h: 7.2, d: 48, color: 0x2a3a32, level: "chamber", map: greenStone });
  decorateLanterns(lower, [
    [-5, 6, 0x66ff88, 1.4],
    [5, 18, 0x88ffaa, 1.3],
    [-4, 30, 0xaaffcc, 1.2],
    [0, 12, 0x44dd88, 0.8],
  ]);

  for (const z of [8, 20, 32]) {
    for (const x of [-5.5, 5.5]) {
      const pillar = mesh(new THREE.CylinderGeometry(0.45, 0.55, 7, 10), mat(0x6a7a68, { roughness: 0.7 }));
      pillar.position.set(x, 3.5, z);
      lower.add(pillar);
    }
  }

  const statue = mesh(new THREE.CylinderGeometry(1.5, 1.9, 8, 12), mat(0x8a9a88, { roughness: 0.65 }));
  statue.position.set(0, 4, 36);
  lower.add(statue);
  const mouth = mesh(new THREE.SphereGeometry(0.55, 10, 8), mat(0x1a2018, { roughness: 0.8 }));
  mouth.position.set(0, 6.2, 35.2);
  lower.add(mouth);

  const basiliskMesh = tryPlaceProp(game, lower, HP_GLB.basilisk, createBasilisk, new THREE.Vector3(0, 0, 22), 1.8, {
    standUp: false,
  });
  const basilisk = createEnemy({
    root: basiliskMesh,
    hp: 260,
    damage: 22,
    hitRadius: 3.2,
    hitHeight: 1.4,
    name: "Basilisk",
    speed: 1.9,
  });
  basilisk.phase = 1;
  basilisk.winding = false;
  basilisk.windup = 0;
  basiliskMesh.visible = false;

  const fawkes = mesh(
    new THREE.SphereGeometry(0.22, 10, 8),
    mat(0xff6622, { emissive: 0xff4400, emissiveIntensity: 0.9, roughness: 0.35 })
  );
  fawkes.position.set(4, 2.6, 28);
  fawkes.visible = false;
  lower.add(fawkes);
  interactives.push({ id: "fawkes", root: fawkes, label: "Take Fawkes' gift and rise", range: 3.2 });

  const exitDoor = mesh(new THREE.BoxGeometry(2.4, 3.2, 0.22), mat(0x8aa0aa, { roughness: 0.45, metalness: 0.2 }));
  exitDoor.position.set(0, 1.6, -9.6);
  upper.add(exitDoor);
  interactives.push({ id: "exit", root: exitDoor, label: "Leave through the bathroom door", range: 2.8 });

  group.position.copy(CHAMBER_ORIGIN);
  worldOffsetColliders(colliders, CHAMBER_ORIGIN);
  game.scene.add(group);
  game.levelGroups.chamber = group;
  game.levelColliders.chamber = colliders;
  game.levelData.chamber = {
    interactives,
    enemies: [basilisk],
    basilisk,
    myrtleTalked: false,
    diaryTaken: false,
    hatchOpen: false,
    descended: false,
    fawkesHelped: false,
    diary,
    hatch,
    hatchGround,
    fawkes,
    lower,
  };
}

export function resetChamberQuest(game) {
  const data = game.levelData.chamber;
  if (!data) return;
  data.myrtleTalked = false;
  data.diaryTaken = false;
  data.hatchOpen = false;
  data.descended = false;
  data.fawkesHelped = false;
  if (data.diary) data.diary.visible = true;
  if (data.fawkes) data.fawkes.visible = false;
  if (data.hatchGround) data.hatchGround.active = true;
  const hinge = data.hatch?.userData?.lidHinge;
  if (hinge) hinge.rotation.x = 0;
  const b = data.basilisk;
  b.hp = b.maxHp;
  b.alive = true;
  b.stun = 0;
  b.winding = false;
  b.root.visible = false;
  b.root.position.set(0, 0, 22);
  b.root.scale.setScalar(1);
}

export function updateChamberLevel(game, delta, time) {
  const data = game.levelData.chamber;
  if (!data || !game.player) return;

  const hinge = data.hatch?.userData?.lidHinge;
  if (hinge) {
    const target = data.hatchOpen ? -1.25 : 0;
    hinge.rotation.x = THREE.MathUtils.damp(hinge.rotation.x, target, 6, delta);
  }

  const localY = game.player.root.position.y - CHAMBER_ORIGIN.y;
  if (data.hatchOpen && localY < -4) {
    data.descended = true;
    if (data.basilisk.alive) data.basilisk.root.visible = true;
  }

  if (data.fawkes?.visible) {
    data.fawkes.position.y = 2.6 + Math.sin(time * 2.5) * 0.35;
  }

  if (!data.descended || !data.basilisk.alive) return;
  data.basilisk.root.visible = true;
  const lowerOrigin = CHAMBER_ORIGIN.clone().add(new THREE.Vector3(0, -CHAMBER_DEPTH, 0));
  tickBoss(game, data.basilisk, lowerOrigin, delta, time, {
    meleeRange: 2.6,
    chaseRange: 36,
    baseDamage: 22,
    windupTime: 0.85,
    attackCooldown: 1.6,
    phase2Hp: 0.4,
    phase2SpeedMul: 1.45,
    phase2DamageMul: 1.35,
    name: "The basilisk",
  });
}

export function chamberSpawn() {
  return CHAMBER_ORIGIN.clone().add(new THREE.Vector3(-3, 0, -7));
}
