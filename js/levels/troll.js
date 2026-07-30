import * as THREE from "three";
import {
  addGround,
  addWallBox,
  createNpcFigure,
  createNameLabel,
  makeStoneTexture,
  mat,
  mesh,
} from "../worldUtils.js";
import { createEnemy } from "../combat.js";

export const TROLL_ORIGIN = new THREE.Vector3(0, 0, 400);

function createTroll() {
  const root = new THREE.Group();
  const body = mesh(new THREE.CapsuleGeometry(0.7, 1.2, 6, 10), mat(0x6a7a58, { roughness: 0.85 }));
  body.position.y = 1.6;
  const head = mesh(new THREE.SphereGeometry(0.55, 12, 10), mat(0x7a8a65, { roughness: 0.8 }));
  head.position.y = 2.85;
  const club = mesh(new THREE.CylinderGeometry(0.12, 0.2, 1.8, 8), mat(0x4a3020, { roughness: 0.9 }));
  club.position.set(1.0, 1.8, 0.2);
  club.rotation.z = -0.6;
  root.add(body, head, club);
  return root;
}

export function buildTrollLevel(game) {
  const group = new THREE.Group();
  group.name = "troll";
  const colliders = [];
  const interactives = [];

  addGround(group, colliders, {
    size: 40,
    color: 0x4a5058,
    texture: makeStoneTexture(),
    level: "troll",
  });

  addWallBox(group, colliders, { x: 0, y: 3, z: -12, w: 24, h: 6, d: 1, color: 0x5a6068, level: "troll" });
  addWallBox(group, colliders, { x: -12, y: 3, z: 0, w: 1, h: 6, d: 24, color: 0x5a6068, level: "troll" });
  addWallBox(group, colliders, { x: 12, y: 3, z: 0, w: 1, h: 6, d: 24, color: 0x5a6068, level: "troll" });
  addWallBox(group, colliders, { x: 0, y: 3, z: 12, w: 24, h: 6, d: 1, color: 0x5a6068, level: "troll" });

  // Stalls / sinks
  for (let i = -2; i <= 2; i += 1) {
    const stall = mesh(new THREE.BoxGeometry(1.6, 2.2, 1.2), mat(0x8a9098, { roughness: 0.7 }));
    stall.position.set(i * 3.2, 1.1, -8);
    group.add(stall);
  }

  const hermione = createNpcFigure({ robe: 0x1a2a4a, hair: 0x8a4a18, skin: 0xe4b898 });
  hermione.position.set(-6, 0, -4);
  const hLabel = createNameLabel("Hermione");
  hLabel.position.set(0, 2.1, 0);
  hLabel.scale.set(2, 0.45, 1);
  hermione.add(hLabel);
  group.add(hermione);
  interactives.push({ id: "hermione", root: hermione, label: "Check on Hermione", range: 2.5 });

  const trollMesh = createTroll();
  trollMesh.position.set(4, 0, 2);
  group.add(trollMesh);
  const troll = createEnemy({
    root: trollMesh,
    hp: 220,
    damage: 18,
    hitRadius: 1.4,
    name: "Mountain Troll",
    speed: 1.6,
  });

  const light = new THREE.PointLight(0xaabbcc, 1.0, 30);
  light.position.set(0, 5, 0);
  group.add(light);

  interactives.push({
    id: "exit",
    root: hermione,
    label: "Escort Hermione out",
    range: 2.8,
  });

  group.position.copy(TROLL_ORIGIN);
  game.scene.add(group);
  game.levelGroups.troll = group;
  game.levelColliders.troll = colliders;
  game.levelData.troll = {
    interactives,
    enemies: [troll],
    hermioneChecked: false,
    troll,
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
  t.root.scale.setScalar(1);
}

export function updateTrollLevel(game, delta, time) {
  const data = game.levelData.troll;
  if (!data || !game.player) return;
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

  if (dist > 1.8) {
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
