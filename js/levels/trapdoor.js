import * as THREE from "three";
import {
  buildTrapdoorWorld,
  updateTrapdoorWorld,
  createDevilsSnare,
  createFlyingKey,
  createChessPiece,
} from "../trapdoorProps.js";
import { mat, mesh, worldOffsetColliders } from "../worldUtils.js";
import { createEnemy } from "../combat.js";

export const TRAPDOOR_ORIGIN = new THREE.Vector3(0, 0, 800);

export function buildTrapdoorLevel(game) {
  const group = new THREE.Group();
  group.name = "trapdoor";
  const colliders = [];
  const interactives = [];
  const enemies = [];

  const anim = buildTrapdoorWorld(game, group, colliders);

  // Devil's Snare room
  const snare = createDevilsSnare();
  snare.position.set(0, 0, -20);
  group.add(snare);
  interactives.push({
    id: "snare",
    root: snare,
    label: "Shoot Incendio at the Devil's Snare",
    range: 5.5,
  });

  // Flying keys
  const keys = [];
  for (let i = 0; i < 10; i += 1) {
    const key = createFlyingKey();
    key.position.set((Math.random() - 0.5) * 12, 1.5 + Math.random() * 2.5, (Math.random() - 0.5) * 4);
    group.add(key);
    keys.push({ mesh: key, phase: Math.random() * Math.PI * 2, caught: false });
  }
  interactives.push({ id: "keys", root: keys[0].mesh, label: "Accio the correct key", range: 9 });

  // Chess pieces
  const types = ["rook", "knight", "queen", "knight", "pawn"];
  for (let i = 0; i < 5; i += 1) {
    const piece = createChessPiece(i % 2 === 0, types[i]);
    piece.position.set(-6 + i * 3, 0, 18);
    group.add(piece);
    enemies.push(
      createEnemy({
        root: piece,
        hp: 35,
        damage: 10,
        hitRadius: 2.2,
        hitHeight: 1.2,
        name: "Chess Piece",
        speed: 1.6,
      })
    );
  }

  const exitDoor = mesh(
    new THREE.BoxGeometry(2.4, 3.4, 0.4),
    game.textures ? game.textures.wood(1, 2) : mat(0x5a3a20, { roughness: 0.7 })
  );
  exitDoor.position.set(0, 1.7, 30);
  group.add(exitDoor);
  interactives.push({ id: "exit", root: exitDoor, label: "Descend deeper", range: 3 });

  group.position.copy(TRAPDOOR_ORIGIN);
  worldOffsetColliders(colliders, TRAPDOOR_ORIGIN);
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
    anim,
  };

  return { spawn: TRAPDOOR_ORIGIN.clone().add(new THREE.Vector3(0, 0, -28)) };
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
  updateTrapdoorWorld(data.anim, time);

  if (!data.snareCleared) {
    data.snare.children.forEach((vine, i) => {
      if (vine.isMesh) vine.rotation.z = Math.sin(time * 2 + i) * 0.35;
    });
  }

  for (const key of data.keys) {
    if (key.caught) continue;
    key.mesh.position.y = 1.5 + Math.sin(time * 2 + key.phase) * 0.9;
    key.mesh.position.x += Math.sin(time + key.phase) * delta * 1.6;
    key.mesh.rotation.y += delta * 3;
    const wings = key.mesh.userData.wings;
    if (wings) {
      wings[0].rotation.z = 0.3 + Math.sin(time * 20 + key.phase) * 0.5;
      wings[1].rotation.z = -0.3 - Math.sin(time * 20 + key.phase) * 0.5;
    }
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
  return TRAPDOOR_ORIGIN.clone().add(new THREE.Vector3(0, 0, -28));
}
