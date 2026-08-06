import * as THREE from "three";
import {
  buildQuirrellWorld,
  updateQuirrellWorld,
  createDetailedQuirrell,
  createMirrorOfErised,
} from "../quirrellProps.js";
import { createEnemy } from "../combat.js";
import { worldOffsetColliders } from "../worldUtils.js";
import { tickBoss, hasShield } from "../bossAI.js";

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
    hp: 280,
    damage: 18,
    hitRadius: 2.4,
    hitHeight: 1.3,
    name: "Quirrell",
    speed: 2.1,
  });
  quirrell.phase = 1;
  quirrell.winding = false;
  quirrell.windup = 0;
  quirrell.boltCd = 0;

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
  q.phase = 1;
  q.winding = false;
  q.windup = 0;
  q.boltCd = 0;
  q.attackCd = 0;
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
    q.root.scale.setScalar(1);
    return;
  }

  q.boltCd = Math.max(0, (q.boltCd || 0) - delta);

  tickBoss(game, q, QUIRRELL_ORIGIN, delta, time, {
    meleeRange: 2.0,
    baseDamage: 15,
    windupTime: 0.6,
    attackCooldown: 1.2,
    phase2Hp: 0.45,
    phase2SpeedMul: 1.45,
    phase2DamageMul: 1.35,
    canAct: data.mirrorSeen,
    name: "Quirrell",
  });

  // Phase 2: ranged curse bolts the player must shield or dodge
  if (data.mirrorSeen && q.alive && q.phase >= 2 && q.boltCd <= 0 && !q.winding && q.stun <= 0) {
    const playerLocal = game.player.root.position.clone().sub(QUIRRELL_ORIGIN);
    const dist = playerLocal.distanceTo(q.root.position);
    if (dist > 3 && dist < 18) {
      q.boltCd = 2.4;
      game.showMessage("Quirrell casts — Protego!", 0.8);
      // Delayed hit resolves next frames via pendingBolt
      q.pendingBolt = 0.45;
    }
  }

  if (q.pendingBolt != null) {
    q.pendingBolt -= delta;
    if (q.pendingBolt <= 0) {
      q.pendingBolt = null;
      if (!q.alive || !game.combat?.alive) return;
      if (hasShield(game)) {
        game.showMessage("Protego deflects the curse!");
        game.fx.addTrauma(0.2);
      } else {
        const dealt = game.combat.damage(12);
        if (dealt > 0) {
          game.audio.hurt();
          game.fx.addTrauma(0.4);
          game.fx.flashDamage(0.8);
        }
      }
    }
  }
}

export function quirrellSpawn() {
  return QUIRRELL_ORIGIN.clone().add(new THREE.Vector3(0, 0, 10));
}
