import * as THREE from "three";
import {
  buildForestWorld,
  updateForestWorld,
  createForestCreature,
  createFirenze,
  createCloakProp,
} from "../forestProps.js";
import { createNameLabel, worldOffsetColliders } from "../worldUtils.js";
import { createEnemy } from "../combat.js";

export const FOREST_ORIGIN = new THREE.Vector3(0, 0, 600);

export function buildForestLevel(game) {
  const group = new THREE.Group();
  group.name = "forest";
  const colliders = [];
  const interactives = [];
  const enemies = [];

  const anim = buildForestWorld(game, group, colliders);

  const creatureSpots = [
    [-8, -5],
    [-2, 4],
    [6, -2],
    [3, 10],
  ];
  for (const [x, z] of creatureSpots) {
    const creature = createForestCreature();
    creature.position.set(x, 0, z);
    group.add(creature);
    enemies.push(
      createEnemy({
        root: creature,
        hp: 40,
        damage: 8,
        hitRadius: 2.0,
        hitHeight: 1.0,
        name: "Forest Creature",
        speed: 2.4,
      })
    );
  }

  const centaur = createFirenze();
  centaur.position.set(0, 0, 22);
  const cLabel = createNameLabel("Firenze");
  cLabel.position.set(0, 2.7, 0);
  cLabel.scale.set(2.3, 0.5, 1);
  centaur.add(cLabel);
  group.add(centaur);
  interactives.push({ id: "firenze", root: centaur, label: "Speak with Firenze", range: 3 });

  // Path out of the clearing — separate from Firenze so leave is always reachable
  const exitAnchor = new THREE.Object3D();
  exitAnchor.position.set(0, 0, 28);
  group.add(exitAnchor);
  const exitMarker = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 3.6, 0.35),
    new THREE.MeshStandardMaterial({ color: 0x3a2a18, roughness: 0.85 })
  );
  exitMarker.position.set(0, 1.8, 28);
  group.add(exitMarker);
  interactives.push({ id: "exit", root: exitAnchor, label: "Leave the Forest", range: 3.5 });

  const cloak = createCloakProp();
  cloak.position.set(6, 0, -10);
  cloak.rotation.y = 0.4;
  group.add(cloak);
  interactives.push({ id: "cloak", root: cloak, label: "Take the Invisibility Cloak", range: 2.4 });

  group.position.copy(FOREST_ORIGIN);
  worldOffsetColliders(colliders, FOREST_ORIGIN);
  game.scene.add(group);
  game.levelGroups.forest = group;
  game.levelColliders.forest = colliders;
  game.levelData.forest = {
    interactives,
    enemies,
    firenzeTalked: false,
    cloakTaken: false,
    cloak,
    anim,
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
  updateForestWorld(data.anim, time);

  const origin = FOREST_ORIGIN;
  const playerLocal = game.player.root.position.clone().sub(origin);

  for (const enemy of data.enemies) {
    if (!enemy.alive) continue;
    enemy.stun = Math.max(0, enemy.stun - delta);
    enemy.slow = Math.max(0, enemy.slow - delta);
    enemy.attackCd = Math.max(0, enemy.attackCd - delta);
    if (enemy.stun > 0) continue;
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
