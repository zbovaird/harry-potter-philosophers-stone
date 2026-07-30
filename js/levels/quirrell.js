import * as THREE from "three";
import {
  addGround,
  addWallBox,
  makeStoneTexture,
  mat,
  mesh,
} from "../worldUtils.js";
import { createEnemy } from "../combat.js";

export const QUIRRELL_ORIGIN = new THREE.Vector3(0, 0, 1000);

function createQuirrell() {
  const root = new THREE.Group();
  const robe = mesh(new THREE.CapsuleGeometry(0.28, 0.55, 6, 10), mat(0x5a1a1a, { roughness: 0.75 }));
  robe.position.y = 1.15;
  const head = mesh(new THREE.SphereGeometry(0.18, 12, 10), mat(0xd4a080, { roughness: 0.55 }));
  head.position.y = 1.7;
  const turban = mesh(new THREE.TorusGeometry(0.16, 0.08, 8, 14), mat(0x6a2030, { roughness: 0.7 }));
  turban.position.y = 1.82;
  turban.rotation.x = Math.PI / 2;
  // Voldemort face on back
  const vold = mesh(new THREE.SphereGeometry(0.14, 10, 8), mat(0xc8d0c0, { roughness: 0.5 }));
  vold.position.set(0, 1.7, -0.18);
  root.add(robe, head, turban, vold);
  return root;
}

export function buildQuirrellLevel(game) {
  const group = new THREE.Group();
  group.name = "quirrell";
  const colliders = [];
  const interactives = [];

  addGround(group, colliders, {
    size: 50,
    color: 0x2a2228,
    texture: makeStoneTexture(),
    level: "quirrell",
  });

  addWallBox(group, colliders, { x: 0, y: 4, z: -16, w: 28, h: 8, d: 1.2, color: 0x3a3038, level: "quirrell" });
  addWallBox(group, colliders, { x: -14, y: 4, z: 0, w: 1.2, h: 8, d: 32, color: 0x3a3038, level: "quirrell" });
  addWallBox(group, colliders, { x: 14, y: 4, z: 0, w: 1.2, h: 8, d: 32, color: 0x3a3038, level: "quirrell" });
  addWallBox(group, colliders, { x: 0, y: 4, z: 16, w: 28, h: 8, d: 1.2, color: 0x3a3038, level: "quirrell" });

  // Mirror of Erised
  const mirrorFrame = mesh(new THREE.BoxGeometry(3.2, 4.5, 0.4), mat(0xd4af37, { metalness: 0.85, roughness: 0.35 }));
  mirrorFrame.position.set(0, 2.4, -14);
  const glass = mesh(
    new THREE.PlaneGeometry(2.6, 3.8),
    mat(0x88aacc, { metalness: 0.9, roughness: 0.15, emissive: 0x112233, emissiveIntensity: 0.5 })
  );
  glass.position.set(0, 2.4, -13.75);
  group.add(mirrorFrame, glass);
  interactives.push({ id: "mirror", root: mirrorFrame, label: "Look into the Mirror of Erised", range: 3 });

  const quirrellMesh = createQuirrell();
  quirrellMesh.position.set(0, 0, 4);
  group.add(quirrellMesh);
  const quirrell = createEnemy({
    root: quirrellMesh,
    hp: 320,
    damage: 16,
    hitRadius: 1.0,
    name: "Quirrell",
    speed: 2.0,
  });

  const fireRing = new THREE.Group();
  for (let i = 0; i < 16; i += 1) {
    const a = (i / 16) * Math.PI * 2;
    const flame = mesh(
      new THREE.ConeGeometry(0.2, 0.8, 6),
      mat(0xff4400, { emissive: 0xff2200, emissiveIntensity: 1.8, roughness: 0.4 })
    );
    flame.position.set(Math.cos(a) * 7, 0.4, Math.sin(a) * 7);
    fireRing.add(flame);
  }
  group.add(fireRing);

  const light = new THREE.PointLight(0xff6644, 1.4, 40);
  light.position.set(0, 5, 0);
  group.add(light);
  const mirrorLight = new THREE.PointLight(0x88aaff, 0.8, 15);
  mirrorLight.position.set(0, 3, -12);
  group.add(mirrorLight);

  interactives.push({ id: "exit", root: mirrorFrame, label: "Claim the Stone and leave", range: 3 });

  group.position.copy(QUIRRELL_ORIGIN);
  game.scene.add(group);
  game.levelGroups.quirrell = group;
  game.levelColliders.quirrell = colliders;
  game.levelData.quirrell = {
    interactives,
    enemies: [quirrell],
    quirrell,
    mirrorSeen: false,
    stoneClaimed: false,
    fireRing,
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

  data.fireRing.children.forEach((flame, i) => {
    flame.scale.y = 0.8 + Math.sin(time * 6 + i) * 0.35;
  });

  const q = data.quirrell;
  if (!q.alive) {
    q.root.rotation.x = Math.min(Math.PI / 2, q.root.rotation.x + delta);
    return;
  }

  q.stun = Math.max(0, q.stun - delta);
  q.slow = Math.max(0, q.slow - delta);
  q.attackCd = Math.max(0, q.attackCd - delta);

  // Boss only aggressive after mirror is seen
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
    // Check protego shield
    if (game.caster?.shieldUntil > performance.now() / 1000) {
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
