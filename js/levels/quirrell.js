import * as THREE from "three";
import {
  buildQuirrellWorld,
  updateQuirrellWorld,
  createDetailedQuirrell,
  createMirrorOfErised,
} from "../quirrellProps.js";
import { createEnemy } from "../combat.js";
import { worldOffsetColliders } from "../worldUtils.js";

export const QUIRRELL_ORIGIN = new THREE.Vector3(0, 0, 1000);

export function buildQuirrellLevel(game) {
  const group = new THREE.Group();
  group.name = "quirrell";
  const colliders = [];
  const interactives = [];

  const anim = buildQuirrellWorld(game, group, colliders);

  const mirror = createMirrorOfErised(game.textures);
  mirror.position.set(0, 0, -14);
  group.add(mirror);
  interactives.push({ id: "mirror", root: mirror, label: "Look into the Mirror of Erised", range: 3.2 });

  const quirrellMesh = createDetailedQuirrell();
  quirrellMesh.position.set(0, 0, 4);
  group.add(quirrellMesh);
  const quirrell = createEnemy({
    root: quirrellMesh,
    hp: 240,
    damage: 14,
    hitRadius: 2.4,
    hitHeight: 1.3,
    name: "Quirrell",
    speed: 2.0,
  });

  const exitAnchor = new THREE.Object3D();
  exitAnchor.position.set(0, 0, -17);
  group.add(exitAnchor);
  interactives.push({ id: "exit", root: exitAnchor, label: "Claim the Stone and leave", range: 3.5 });

  group.position.copy(QUIRRELL_ORIGIN);
  worldOffsetColliders(colliders, QUIRRELL_ORIGIN);
  game.scene.add(group);
  game.levelGroups.quirrell = group;
  game.levelColliders.quirrell = colliders;
  game.levelData.quirrell = {
    interactives,
    enemies: [quirrell],
    quirrell,
    mirrorSeen: false,
    stoneClaimed: false,
    fireRing: anim.fireRing,
    anim,
    mirror,
  };

  return { spawn: QUIRRELL_ORIGIN.clone().add(new THREE.Vector3(0, 0, 10)) };
}

export function resetQuirrellQuest(game) {
  const data = game.levelData.quirrell;
  if (!data) return;
  data.mirrorSeen = false;
  data.stoneClaimed = false;
  const q = data.quirrell;
  q.hp = q.maxHp;
  q.alive = true;
  q.stun = 0;
  q.slow = 0;
  q.root.visible = true;
  q.root.position.set(0, 0, 4);
  q.root.rotation.set(0, 0, 0);
  q.root.scale.setScalar(1);
}

export function updateQuirrellLevel(game, delta, time) {
  const data = game.levelData.quirrell;
  if (!data || !game.player) return;
  updateQuirrellWorld(data.anim, time);

  if (data.mirror?.userData?.glass?.material) {
    data.mirror.userData.glass.material.emissiveIntensity = 0.35 + Math.sin(time * 2) * 0.15;
  }

  const q = data.quirrell;
  if (!q.alive) {
    q.root.rotation.x = Math.min(Math.PI / 2, q.root.rotation.x + delta);
    return;
  }

  q.stun = Math.max(0, q.stun - delta);
  q.slow = Math.max(0, q.slow - delta);
  q.attackCd = Math.max(0, q.attackCd - delta);

  if (!data.mirrorSeen) {
    q.root.rotation.y = time * 0.3;
    return;
  }

  if (q.stun > 0) return;

  const origin = QUIRRELL_ORIGIN;
  const playerLocal = game.player.root.position.clone().sub(origin);
  const toPlayer = playerLocal.clone().sub(q.root.position);
  toPlayer.y = 0;
  const dist = toPlayer.length();

  if (dist > 2) {
    toPlayer.normalize();
    q.root.position.addScaledVector(toPlayer, q.speed * (q.slow > 0 ? 0.45 : 1) * delta);
    q.root.rotation.y = Math.atan2(toPlayer.x, toPlayer.z);
  } else if (q.attackCd <= 0 && game.combat?.alive) {
    if (game.caster?.shieldUntil > game.time) {
      q.attackCd = 0.8;
      game.showMessage("Protego deflects the curse!");
      return;
    }
    q.attackCd = 1.0;
    const dealt = game.combat.damage(q.damage);
    if (dealt > 0) {
      game.audio.hurt();
      game.fx.addTrauma(0.5);
      game.fx.flashDamage(1);
    }
  }
}

export function quirrellSpawn() {
  return QUIRRELL_ORIGIN.clone().add(new THREE.Vector3(0, 0, 10));
}
