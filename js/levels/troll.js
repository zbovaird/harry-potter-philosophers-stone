import * as THREE from "three";
import {
  buildTrollWorld,
  updateTrollWorld,
  createDetailedTroll,
  createDetailedHermione,
} from "../trollProps.js";
import { createNameLabel, worldOffsetColliders, mat, mesh } from "../worldUtils.js";
import { createEnemy } from "../combat.js";
import { tickBoss } from "../bossAI.js";

export const TROLL_ORIGIN = new THREE.Vector3(0, 0, 400);

export function buildTrollLevel(game) {
  const group = new THREE.Group();
  group.name = "troll";
  const colliders = [];
  const interactives = [];

  const anim = buildTrollWorld(game, group, colliders);

  const hermione = createDetailedHermione();
  hermione.position.set(-6, 0, -4);
  const hLabel = createNameLabel("Hermione");
  hLabel.position.set(0, 2.15, 0);
  hLabel.scale.set(2.1, 0.45, 1);
  hermione.add(hLabel);
  group.add(hermione);
  interactives.push({ id: "hermione", root: hermione, label: "Check on Hermione", range: 2.5 });

  const trollMesh = createDetailedTroll();
  trollMesh.position.set(4, 0, 2);
  group.add(trollMesh);
  const troll = createEnemy({
    root: trollMesh,
    hp: 200,
    damage: 16,
    hitRadius: 2.8,
    hitHeight: 1.6,
    name: "Mountain Troll",
    speed: 1.7,
  });
  troll.phase = 1;
  troll.winding = false;
  troll.windup = 0;

  const exitDoor = mesh(
    new THREE.BoxGeometry(3.6, 3.2, 0.2),
    mat(0x3a454c, { roughness: 0.55, metalness: 0.25 })
  );
  exitDoor.position.set(-3, 1.6, -12.7);
  const handle = mesh(
    new THREE.SphereGeometry(0.08, 8, 8),
    mat(0xc9a227, { metalness: 0.85, roughness: 0.3 })
  );
  handle.position.set(-1.6, 1.6, -12.5);
  group.add(exitDoor, handle);
  interactives.push({ id: "exit", root: exitDoor, label: "Escort Hermione out", range: 3.5 });

  group.position.copy(TROLL_ORIGIN);
  worldOffsetColliders(colliders, TROLL_ORIGIN);
  game.scene.add(group);
  game.levelGroups.troll = group;
  game.levelColliders.troll = colliders;
  game.levelData.troll = {
    interactives,
    enemies: [troll],
    hermioneChecked: false,
    troll,
    anim,
  };

  return { spawn: TROLL_ORIGIN.clone().add(new THREE.Vector3(-4, 0, 6)) };
}

export function resetTrollQuest(game) {
  const data = game.levelData.troll;
  if (!data) return;
  data.hermioneChecked = false;
  const t = data.troll;
  t.hp = t.maxHp;
  t.alive = true;
  t.stun = 0;
  t.slow = 0;
  t.phase = 1;
  t.winding = false;
  t.windup = 0;
  t.attackCd = 0;
  t.root.visible = true;
  t.root.position.set(4, 0, 2);
  t.root.rotation.set(0, 0, 0);
  t.root.scale.setScalar(1);
}

export function updateTrollLevel(game, delta, time) {
  const data = game.levelData.troll;
  if (!data || !game.player) return;
  updateTrollWorld(data.anim, time, delta);

  const troll = data.troll;
  if (!troll.alive) {
    troll.root.rotation.x = Math.min(Math.PI / 2, troll.root.rotation.x + delta * 1.2);
    troll.root.scale.setScalar(1);
    return;
  }

  tickBoss(game, troll, TROLL_ORIGIN, delta, time, {
    meleeRange: 2.1,
    baseDamage: 16,
    windupTime: 0.75,
    attackCooldown: 1.5,
    phase2Hp: 0.45,
    phase2SpeedMul: 1.4,
    phase2DamageMul: 1.3,
    name: "The troll",
  });
}

export function trollSpawn() {
  return TROLL_ORIGIN.clone().add(new THREE.Vector3(-4, 0, 6));
}
