import * as THREE from "three";
import { worldOffsetColliders, createNpcFigure, createNameLabel, mat, mesh } from "../worldUtils.js";
import { addBoundedGround, createFordAnglia, tryPlaceProp, decorateLanterns } from "../cosKit.js";
import { HP_GLB } from "../assets.js";

export const ANGLIA_ORIGIN = new THREE.Vector3(0, 0, 2200);

export function buildAngliaLevel(game) {
  const group = new THREE.Group();
  group.name = "anglia";
  const colliders = [];
  const interactives = [];
  const tex = game.textures;

  addBoundedGround(group, colliders, { size: 80, color: 0x2f3a28, texture: tex.cloneMap?.("barkMap", 10, 10), level: "anglia" });

  const trees = [];
  for (let i = 0; i < 18; i += 1) {
    const tree = mesh(new THREE.ConeGeometry(1.4, 5.5, 7), mat(0x1a3a18, { roughness: 0.9 }));
    const x = (i % 2 === 0 ? -8 : 8) + Math.sin(i * 1.7) * 3;
    const z = -20 + i * 4.2;
    tree.position.set(x, 2.7, z);
    group.add(tree);
    trees.push(tree);
  }

  const ron = createNpcFigure({ robe: 0x4a1818, hair: 0xb84418, skin: 0xe2a888 });
  ron.position.set(-2, 0, -22);
  ron.add(createNameLabel("Ron Weasley"));
  ron.children.at(-1).position.set(0, 2.15, 0);
  group.add(ron);
  interactives.push({ id: "ron", root: ron, label: "Talk to Ron", range: 2.4 });

  const car = tryPlaceProp(game, group, HP_GLB.fordAnglia, createFordAnglia, new THREE.Vector3(0, 0, -18), 1.4, {
    standUp: false,
  });
  interactives.push({ id: "car", root: car, label: "Board the flying Ford Anglia", range: 2.8 });

  decorateLanterns(group, [[-10, -16, 0xffd080, 1], [10, 20, 0xaaccff, 0.8]]);

  const gates = mesh(new THREE.BoxGeometry(6, 5, 0.4), mat(0x6a6050, { roughness: 0.8 }));
  gates.position.set(0, 2.5, 48);
  group.add(gates);
  interactives.push({ id: "exit", root: gates, label: "Land at Hogwarts gates", range: 4 });

  group.position.copy(ANGLIA_ORIGIN);
  worldOffsetColliders(colliders, ANGLIA_ORIGIN);
  game.scene.add(group);
  game.levelGroups.anglia = group;
  game.levelColliders.anglia = colliders;
  game.levelData.anglia = { interactives, enemies: [], ronTalked: false, boarded: false, landed: false, car, trees };
}

export function resetAngliaQuest(game) {
  const data = game.levelData.anglia;
  if (!data) return;
  data.ronTalked = false;
  data.boarded = false;
  data.landed = false;
  game.flyingVehicle = false;
  if (data.car) data.car.position.set(0, 0, -18);
}

export function updateAngliaLevel(game, delta) {
  const data = game.levelData.anglia;
  if (!data || !game.player) return;
  if (!data.boarded || data.landed) {
    game.flyingVehicle = false;
    return;
  }
  game.flyingVehicle = true;
  const origin = ANGLIA_ORIGIN;
  const local = game.player.root.position.clone().sub(origin);
  local.y = 7.2;
  local.z += 11 * delta;
  game.player.root.position.copy(origin).add(local);
  if (data.car) {
    data.car.position.set(local.x, 6.4, local.z);
    data.car.rotation.z = Math.sin(game.time * 3) * 0.08;
  }
  for (const tree of data.trees) {
    const dx = local.x - tree.position.x;
    const dz = local.z - tree.position.z;
    if (dx * dx + dz * dz < 4.2) {
      game.combat?.damage(8);
      game.fx?.flashDamage(0.4);
      local.x += dx >= 0 ? 1.4 : -1.4;
      game.player.root.position.x = origin.x + local.x;
    }
  }
  if (local.z > 42) {
    data.landed = true;
    game.flyingVehicle = false;
    game.player.root.position.set(origin.x, origin.y, origin.z + 44);
    game.showMessage("The Ford Anglia lurches down toward the gates!");
    game.updateObjective?.();
  }
}

export function angliaSpawn() {
  return ANGLIA_ORIGIN.clone().add(new THREE.Vector3(0, 0, -24));
}
