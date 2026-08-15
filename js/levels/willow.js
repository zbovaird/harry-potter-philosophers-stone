import * as THREE from "three";
import { worldOffsetColliders, mat, mesh } from "../worldUtils.js";
import { addBoundedGround, createWhompingWillow, createFordAnglia, tryPlaceProp, decorateLanterns } from "../cosKit.js";
import { HP_GLB } from "../assets.js";
import { hasShield } from "../bossAI.js";

export const WILLOW_ORIGIN = new THREE.Vector3(0, 0, 2400);

export function buildWillowLevel(game) {
  const group = new THREE.Group();
  group.name = "willow";
  const colliders = [];
  const interactives = [];
  const tex = game.textures;

  addBoundedGround(group, colliders, { size: 48, color: 0x3a4634, texture: tex.cloneMap?.("barkMap", 7, 7), level: "willow" });
  decorateLanterns(group, [[-10, -8, 0xc8e0ff, 0.7], [10, 8, 0xffd080, 0.6]]);

  const willow = tryPlaceProp(game, group, HP_GLB.whompingWillow, createWhompingWillow, new THREE.Vector3(0, 0, 4), 8);
  const car = tryPlaceProp(game, group, HP_GLB.fordAnglia, createFordAnglia, new THREE.Vector3(3.4, 2.4, 3.2), 1.2, {
    standUp: false,
  });
  car.rotation.z = 0.55;
  interactives.push({ id: "car", root: car, label: "Accio the Ford from the branches (or E)", range: 4 });

  const door = mesh(new THREE.BoxGeometry(3.4, 3.6, 0.25), mat(0x5a5040, { roughness: 0.75 }));
  door.position.set(0, 1.8, 20);
  group.add(door);
  interactives.push({ id: "exit", root: door, label: "Slip into Hogwarts", range: 3.2 });

  group.position.copy(WILLOW_ORIGIN);
  worldOffsetColliders(colliders, WILLOW_ORIGIN);
  game.scene.add(group);
  game.levelGroups.willow = group;
  game.levelColliders.willow = colliders;
  game.levelData.willow = { interactives, enemies: [], willow, car, carFreed: false, attackCd: 0 };
}

export function resetWillowQuest(game) {
  const data = game.levelData.willow;
  if (!data) return;
  data.carFreed = false;
  data.attackCd = 0;
  if (data.car) {
    data.car.position.set(3.4, 2.4, 3.2);
    data.car.rotation.z = 0.55;
  }
}

export function updateWillowLevel(game, delta, time) {
  const data = game.levelData.willow;
  if (!data || !game.player) return;
  const arms = data.willow?.userData?.arms || [];
  arms.forEach((arm, i) => {
    arm.rotation.z = 0.7 + Math.sin(time * 2.4 + i) * 0.55;
  });
  const origin = WILLOW_ORIGIN;
  const local = game.player.root.position.clone().sub(origin);
  const dist = Math.hypot(local.x, local.z - 4);
  data.attackCd = Math.max(0, data.attackCd - delta);
  if (dist < 5.5 && data.attackCd <= 0 && game.combat?.alive) {
    data.attackCd = 1.35;
    if (hasShield(game)) {
      game.showMessage("Protego catches a branch!", 0.7);
      return;
    }
    game.combat.damage(11);
    game.audio.hurt();
    game.fx.flashDamage(0.55);
  }
}

export function willowSpawn() {
  return WILLOW_ORIGIN.clone().add(new THREE.Vector3(0, 0, -16));
}
