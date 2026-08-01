import * as THREE from "three";
import {
  buildHogwartsWorld,
  updateHogwartsWorld,
  createDetailedSortingHat,
  createDetailedMcGonagall,
} from "../hogwartsProps.js";
import { createNameLabel, mat, mesh, worldOffsetColliders } from "../worldUtils.js";

export const HOGWARTS_ORIGIN = new THREE.Vector3(0, 0, 200);

export function buildHogwartsLevel(game) {
  const group = new THREE.Group();
  group.name = "hogwarts";
  const colliders = [];
  const interactives = [];

  const anim = buildHogwartsWorld(game, group, colliders);

  // Sorting Hat on stool
  const stool = mesh(
    new THREE.CylinderGeometry(0.4, 0.45, 1.05, 14),
    game.textures ? game.textures.wood(1, 1) : mat(0x5a4030, { roughness: 0.75 })
  );
  stool.position.set(0, 0.52, 14);
  const hat = createDetailedSortingHat();
  hat.position.set(0, 1.15, 14);
  group.add(stool, hat);
  interactives.push({ id: "sortingHat", root: hat, label: "Speak to the Sorting Hat", range: 2.6 });

  // McGonagall
  const mcg = createDetailedMcGonagall();
  mcg.position.set(-3.2, 0, 14);
  mcg.rotation.y = 0.4;
  const mcgLabel = createNameLabel("Prof. McGonagall");
  mcgLabel.position.set(0, 2.3, 0);
  mcgLabel.scale.set(2.8, 0.55, 1);
  mcg.add(mcgLabel);
  group.add(mcg);
  interactives.push({ id: "mcgonagall", root: mcg, label: "Talk to Professor McGonagall", range: 2.8 });

  // Exit doors
  const door = mesh(
    new THREE.BoxGeometry(2.8, 3.6, 0.35),
    game.textures ? game.textures.wood(1, 2) : mat(0x2a1a10, { roughness: 0.7 })
  );
  door.position.set(0, 1.8, -20.8);
  const handle = mesh(
    new THREE.SphereGeometry(0.08, 8, 8),
    mat(0xc9a227, { metalness: 0.9, roughness: 0.25 })
  );
  handle.position.set(0.9, 1.7, -20.55);
  group.add(door, handle);
  interactives.push({ id: "exit", root: door, label: "Continue to the next challenge", range: 3 });

  group.position.copy(HOGWARTS_ORIGIN);
  worldOffsetColliders(colliders, HOGWARTS_ORIGIN);
  game.scene.add(group);
  game.levelGroups.hogwarts = group;
  game.levelColliders.hogwarts = colliders;
  game.levelData.hogwarts = {
    interactives,
    enemies: [],
    anim,
    hat,
    sorted: false,
    house: null,
    mcgTalked: false,
  };

  return { spawn: HOGWARTS_ORIGIN.clone().add(new THREE.Vector3(0, 0, 6)) };
}

export function resetHogwartsQuest(game) {
  const data = game.levelData.hogwarts;
  if (!data) return;
  data.sorted = false;
  data.house = null;
  data.mcgTalked = false;
}

export function updateHogwartsLevel(game, delta, time) {
  const data = game.levelData.hogwarts;
  if (!data) return;
  updateHogwartsWorld(data.anim, time);
  if (data.hat) {
    data.hat.position.y = 1.15 + Math.sin(time * 1.5) * 0.04;
    data.hat.rotation.y = Math.sin(time * 0.4) * 0.08;
  }
}

export function hogwartsSpawn() {
  return HOGWARTS_ORIGIN.clone().add(new THREE.Vector3(0, 0, 6));
}
