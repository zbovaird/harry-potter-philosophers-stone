import * as THREE from "three";
import {
  addGround,
  addWallBox,
  makeStoneTexture,
  mat,
  mesh,
} from "../worldUtils.js";
import { createEnemy } from "../combat.js";

export const TRAPDOOR_ORIGIN = new THREE.Vector3(0, 0, 800);

export function buildTrapdoorLevel(game) {
  const group = new THREE.Group();
  group.name = "trapdoor";
  const colliders = [];
  const interactives = [];
  const enemies = [];

  addGround(group, colliders, {
    size: 70,
    color: 0x2a2a30,
    texture: makeStoneTexture(),
    level: "trapdoor",
  });

  // Room separators with center doorway gaps (side walls only)
  addWallBox(group, colliders, { x: -10, y: 3, z: -8, w: 10, h: 6, d: 1, color: 0x3a3a44, level: "trapdoor" });
  addWallBox(group, colliders, { x: 10, y: 3, z: -8, w: 10, h: 6, d: 1, color: 0x3a3a44, level: "trapdoor" });
  addWallBox(group, colliders, { x: -10, y: 3, z: 8, w: 10, h: 6, d: 1, color: 0x3a3a44, level: "trapdoor" });
  addWallBox(group, colliders, { x: 10, y: 3, z: 8, w: 10, h: 6, d: 1, color: 0x3a3a44, level: "trapdoor" });
  // Outer boundary walls
  addWallBox(group, colliders, { x: 0, y: 3, z: -32, w: 40, h: 6, d: 1, color: 0x2a2a34, level: "trapdoor" });
  addWallBox(group, colliders, { x: 0, y: 3, z: 32, w: 40, h: 6, d: 1, color: 0x2a2a34, level: "trapdoor" });
  addWallBox(group, colliders, { x: -20, y: 3, z: 0, w: 1, h: 6, d: 64, color: 0x2a2a34, level: "trapdoor" });
  addWallBox(group, colliders, { x: 20, y: 3, z: 0, w: 1, h: 6, d: 64, color: 0x2a2a34, level: "trapdoor" });

  // Devil's Snare
  const snare = new THREE.Group();
  for (let i = 0; i < 12; i += 1) {
    const vine = mesh(
      new THREE.CapsuleGeometry(0.08, 1.5 + Math.random(), 4, 6),
      mat(0x2a4a28, { roughness: 0.9 })
    );
    vine.position.set((Math.random() - 0.5) * 6, 0.8, -18 + (Math.random() - 0.5) * 4);
    vine.rotation.z = (Math.random() - 0.5) * 0.8;
    snare.add(vine);
  }
  group.add(snare);
  interactives.push({ id: "snare", root: snare, label: "Burn the Devil's Snare (Incendio / Lumos)", range: 4 });

  // Flying keys
  const keys = [];
  for (let i = 0; i < 8; i += 1) {
    const key = mesh(new THREE.BoxGeometry(0.15, 0.08, 0.4), mat(0xd4af37, { metalness: 0.9, roughness: 0.3, emissive: 0x553300, emissiveIntensity: 0.4 }));
    key.position.set((Math.random() - 0.5) * 10, 1.5 + Math.random() * 2, 0);
    group.add(key);
    keys.push({ mesh: key, phase: Math.random() * Math.PI * 2, caught: false });
  }
  interactives.push({ id: "keys", root: keys[0].mesh, label: "Accio the correct key", range: 8 });

  // Chess pieces as enemies
  for (let i = 0; i < 5; i += 1) {
    const piece = new THREE.Group();
    const base = mesh(new THREE.CylinderGeometry(0.35, 0.4, 0.3, 8), mat(0x1a1a1a, { roughness: 0.6 }));
    const body = mesh(new THREE.ConeGeometry(0.3, 1.2, 8), mat(i % 2 ? 0xf0f0f0 : 0x1a1a1a, { roughness: 0.5 }));
    body.position.y = 0.75;
    piece.add(base, body);
    piece.position.set(-6 + i * 3, 0, 16);
    group.add(piece);
    enemies.push(
      createEnemy({
        root: piece,
        hp: 60,
        damage: 12,
        hitRadius: 0.7,
        name: "Chess Piece",
        speed: 1.8,
      })
    );
  }

  const exitDoor = mesh(new THREE.BoxGeometry(2, 3, 0.4), mat(0x5a3a20, { roughness: 0.7 }));
  exitDoor.position.set(0, 1.5, 28);
  group.add(exitDoor);
  interactives.push({ id: "exit", root: exitDoor, label: "Descend deeper", range: 3 });

  const light = new THREE.PointLight(0x8899aa, 0.8, 35);
  light.position.set(0, 5, 0);
  group.add(light);
  const snareLight = new THREE.PointLight(0x335522, 0.5, 15);
  snareLight.position.set(0, 2, -18);
  group.add(snareLight);

  group.position.copy(TRAPDOOR_ORIGIN);
  game.scene.add(group);
  game.levelGroups.trapdoor = group;
  game.levelColliders.trapdoor = colliders;
  game.levelData.trapdoor = {
    interactives,
    enemies,
    snare,
    keys,
    snareCleared: false,
    keyCaught: false,
    chessCleared: false,
  };

  return { spawn: TRAPDOOR_ORIGIN.clone().add(new THREE.Vector3(0, 0, -26)) };
}

export function resetTrapdoorQuest(game) {
  const data = game.levelData.trapdoor;
  if (!data) return;
  data.snareCleared = false;
  data.keyCaught = false;
  data.chessCleared = false;
  data.snare.visible = true;
  for (const k of data.keys) {
    k.caught = false;
    k.mesh.visible = true;
  }
  for (const e of data.enemies) {
    e.hp = e.maxHp;
    e.alive = true;
    e.root.visible = true;
    e.root.scale.setScalar(1);
  }
}

export function updateTrapdoorLevel(game, delta, time) {
  const data = game.levelData.trapdoor;
  if (!data || !game.player) return;

  if (!data.snareCleared) {
    data.snare.children.forEach((vine, i) => {
      vine.rotation.z = Math.sin(time * 2 + i) * 0.35;
    });
  }

  for (const key of data.keys) {
    if (key.caught) continue;
    key.mesh.position.y = 1.5 + Math.sin(time * 2 + key.phase) * 0.8;
    key.mesh.position.x += Math.sin(time + key.phase) * delta * 1.5;
    key.mesh.rotation.y += delta * 3;
  }

  data.chessCleared = data.enemies.every((e) => !e.alive);

  const origin = TRAPDOOR_ORIGIN;
  const playerLocal = game.player.root.position.clone().sub(origin);
  for (const enemy of data.enemies) {
    if (!enemy.alive) continue;
    enemy.stun = Math.max(0, enemy.stun - delta);
    enemy.slow = Math.max(0, enemy.slow - delta);
    enemy.attackCd = Math.max(0, enemy.attackCd - delta);
    if (enemy.stun > 0) continue;
    const toPlayer = playerLocal.clone().sub(enemy.root.position);
    toPlayer.y = 0;
    const dist = toPlayer.length();
    if (dist > 1.4 && dist < 14) {
      toPlayer.normalize();
      enemy.root.position.addScaledVector(toPlayer, enemy.speed * (enemy.slow > 0 ? 0.4 : 1) * delta);
      enemy.root.rotation.y = Math.atan2(toPlayer.x, toPlayer.z);
    } else if (dist <= 1.4 && enemy.attackCd <= 0 && game.combat?.alive) {
      enemy.attackCd = 1.1;
      const dealt = game.combat.damage(enemy.damage);
      if (dealt > 0) {
        game.audio.hurt();
        game.fx.addTrauma(0.3);
        game.fx.flashDamage(0.6);
      }
    }
  }
}

export function trapdoorSpawn() {
  return TRAPDOOR_ORIGIN.clone().add(new THREE.Vector3(0, 0, -26));
}
