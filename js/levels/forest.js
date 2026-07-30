import * as THREE from "three";
import {
  addGround,
  createNpcFigure,
  createNameLabel,
  makeNoiseTexture,
  mat,
  mesh,
} from "../worldUtils.js";
import { createEnemy } from "../combat.js";

export const FOREST_ORIGIN = new THREE.Vector3(0, 0, 600);

function addTree(group, x, z) {
  const trunk = mesh(new THREE.CylinderGeometry(0.25, 0.35, 4.5, 8), mat(0x3a2a18, { roughness: 0.9 }));
  trunk.position.set(x, 2.25, z);
  const canopy = mesh(new THREE.SphereGeometry(1.8, 10, 8), mat(0x1a3020, { roughness: 0.88 }));
  canopy.position.set(x, 5.2, z);
  group.add(trunk, canopy);
}

export function buildForestLevel(game) {
  const group = new THREE.Group();
  group.name = "forest";
  const colliders = [];
  const interactives = [];
  const enemies = [];

  addGround(group, colliders, {
    size: 90,
    color: 0x2a3220,
    texture: makeNoiseTexture(256, { base: [40, 55, 30], dirt: [35, 40, 25], variance: 20 }),
    level: "forest",
  });

  for (let i = 0; i < 40; i += 1) {
    const x = (Math.random() - 0.5) * 70;
    const z = (Math.random() - 0.5) * 70;
    if (Math.hypot(x, z) < 4) continue;
    addTree(group, x, z);
  }

  // Path markers
  for (let i = 0; i < 12; i += 1) {
    const stone = mesh(new THREE.BoxGeometry(1.2, 0.08, 1.2), mat(0x4a4a40, { roughness: 0.95 }));
    stone.position.set(Math.sin(i * 0.4) * 2, 0.04, -20 + i * 4);
    group.add(stone);
  }

  // Creatures
  for (let i = 0; i < 4; i += 1) {
    const creature = new THREE.Group();
    const body = mesh(new THREE.SphereGeometry(0.45, 10, 8), mat(0x2a2218, { roughness: 0.8 }));
    body.position.y = 0.5;
    const eye = mesh(new THREE.SphereGeometry(0.08, 6, 6), mat(0xff2200, { emissive: 0xff1100, emissiveIntensity: 1.5 }));
    eye.position.set(0.15, 0.6, 0.35);
    creature.add(body, eye);
    creature.position.set(-8 + i * 5, 0, -5 + (i % 2) * 8);
    group.add(creature);
    enemies.push(
      createEnemy({
        root: creature,
        hp: 50,
        damage: 10,
        hitRadius: 0.8,
        name: "Forest Creature",
        speed: 2.4,
      })
    );
  }

  const centaur = createNpcFigure({ robe: 0x4a3020, hair: 0x1a1a1a, skin: 0xc4a080, scale: 1.15 });
  // crude horse body
  const horse = mesh(new THREE.CapsuleGeometry(0.4, 0.9, 4, 8), mat(0x5a4030, { roughness: 0.85 }));
  horse.position.set(0, 0.7, -0.5);
  horse.rotation.z = Math.PI / 2;
  centaur.add(horse);
  centaur.position.set(0, 0, 22);
  const cLabel = createNameLabel("Firenze");
  cLabel.position.set(0, 2.4, 0);
  cLabel.scale.set(2.2, 0.5, 1);
  centaur.add(cLabel);
  group.add(centaur);
  interactives.push({ id: "firenze", root: centaur, label: "Speak with Firenze", range: 3 });
  interactives.push({ id: "exit", root: centaur, label: "Leave the Forest", range: 3 });

  // Cloak pickup
  const cloak = mesh(new THREE.PlaneGeometry(1.2, 1.6), mat(0x8899aa, { roughness: 0.3, metalness: 0.4, transparent: true, opacity: 0.55 }));
  cloak.position.set(6, 0.9, -10);
  cloak.rotation.y = 0.4;
  group.add(cloak);
  interactives.push({ id: "cloak", root: cloak, label: "Take the Invisibility Cloak", range: 2.4 });

  const moon = new THREE.DirectionalLight(0x8899bb, 0.4);
  moon.position.set(-10, 20, 5);
  group.add(moon);
  const ambientGlow = new THREE.PointLight(0x446655, 0.5, 25);
  ambientGlow.position.set(0, 4, 0);
  group.add(ambientGlow);

  group.position.copy(FOREST_ORIGIN);
  game.scene.add(group);
  game.levelGroups.forest = group;
  game.levelColliders.forest = colliders;
  game.levelData.forest = {
    interactives,
    enemies,
    firenzeTalked: false,
    cloakTaken: false,
    cloak,
  };

  return { spawn: FOREST_ORIGIN.clone().add(new THREE.Vector3(0, 0, -22)) };
}

export function resetForestQuest(game) {
  const data = game.levelData.forest;
  if (!data) return;
  data.firenzeTalked = false;
  data.cloakTaken = false;
  if (data.cloak) data.cloak.visible = true;
  for (const e of data.enemies) {
    e.hp = e.maxHp;
    e.alive = true;
    e.stun = 0;
    e.root.visible = true;
    e.root.scale.setScalar(1);
  }
}

export function updateForestLevel(game, delta, time) {
  const data = game.levelData.forest;
  if (!data || !game.player) return;
  const origin = FOREST_ORIGIN;
  const playerLocal = game.player.root.position.clone().sub(origin);

  for (const enemy of data.enemies) {
    if (!enemy.alive) continue;
    enemy.stun = Math.max(0, enemy.stun - delta);
    enemy.slow = Math.max(0, enemy.slow - delta);
    enemy.attackCd = Math.max(0, enemy.attackCd - delta);
    if (enemy.stun > 0) continue;

    // Cloak stealth: ignore player if cloaked
    if (game.cloaked) continue;

    const toPlayer = playerLocal.clone().sub(enemy.root.position);
    toPlayer.y = 0;
    const dist = toPlayer.length();
    if (dist > 1.5 && dist < 18) {
      toPlayer.normalize();
      const speed = enemy.speed * (enemy.slow > 0 ? 0.4 : 1);
      enemy.root.position.addScaledVector(toPlayer, speed * delta);
      enemy.root.rotation.y = Math.atan2(toPlayer.x, toPlayer.z);
    } else if (dist <= 1.5 && enemy.attackCd <= 0 && game.combat?.alive) {
      enemy.attackCd = 1.2;
      const dealt = game.combat.damage(enemy.damage);
      if (dealt > 0) {
        game.audio.hurt();
        game.fx.addTrauma(0.35);
        game.fx.flashDamage(0.7);
      }
    }
  }
}

export function forestSpawn() {
  return FOREST_ORIGIN.clone().add(new THREE.Vector3(0, 0, -22));
}
