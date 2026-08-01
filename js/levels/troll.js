import * as THREE from "three";
import {
  buildTrollWorld,
  updateTrollWorld,
  createDetailedTroll,
  createDetailedHermione,
} from "../trollProps.js";
import { createNameLabel, worldOffsetColliders, mat, mesh } from "../worldUtils.js";
import { createEnemy } from "../combat.js";

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
    hp: 180,
    damage: 14,
    hitRadius: 2.8,
    hitHeight: 1.6,
    name: "Mountain Troll",
    speed: 1.6,
  });

  // Visible bathroom exit door (south wall opening)
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
  interactives.push({
    id: "exit",
    root: exitDoor,
    label: "Escort Hermione out",
    range: 3.5,
  });

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
    return;
  }

  troll.stun = Math.max(0, troll.stun - delta);
  troll.slow = Math.max(0, troll.slow - delta);
  troll.attackCd = Math.max(0, troll.attackCd - delta);
  if (troll.stun > 0) return;

  const origin = TROLL_ORIGIN;
  const playerPos = game.player.root.position.clone().sub(origin);
  const trollPos = troll.root.position;
  const toPlayer = playerPos.clone().sub(trollPos);
  toPlayer.y = 0;
  const dist = toPlayer.length();

  if (dist > 1.9) {
    const speed = troll.speed * (troll.slow > 0 ? 0.4 : 1);
    toPlayer.normalize();
    trollPos.addScaledVector(toPlayer, speed * delta);
    troll.root.rotation.y = Math.atan2(toPlayer.x, toPlayer.z);
    troll.root.position.y = Math.sin(time * 4) * 0.05;
  } else if (troll.attackCd <= 0 && game.combat?.alive) {
    troll.attackCd = 1.4;
    const dealt = game.combat.damage(troll.damage);
    if (dealt > 0) {
      game.audio.hurt();
      game.fx.addTrauma(0.45);
      game.fx.flashDamage(0.9);
    }
  }
}

export function trollSpawn() {
  return TROLL_ORIGIN.clone().add(new THREE.Vector3(-4, 0, 6));
}
