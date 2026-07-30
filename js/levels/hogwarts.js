import * as THREE from "three";
import {
  addGround,
  addWallBox,
  createNpcFigure,
  createNameLabel,
  makeStoneTexture,
  mat,
  mesh,
} from "../worldUtils.js";

export const HOGWARTS_ORIGIN = new THREE.Vector3(0, 0, 200);

export function buildHogwartsLevel(game) {
  const group = new THREE.Group();
  group.name = "hogwarts";
  const colliders = [];
  const interactives = [];

  addGround(group, colliders, {
    size: 80,
    color: 0x3a3a42,
    texture: makeStoneTexture(),
    level: "hogwarts",
  });

  // Great Hall walls
  addWallBox(group, colliders, { x: 0, y: 4, z: -18, w: 28, h: 8, d: 1.2, color: 0x4a4550, level: "hogwarts", map: makeStoneTexture() });
  addWallBox(group, colliders, { x: -14, y: 4, z: 0, w: 1.2, h: 8, d: 36, color: 0x4a4550, level: "hogwarts" });
  addWallBox(group, colliders, { x: 14, y: 4, z: 0, w: 1.2, h: 8, d: 36, color: 0x4a4550, level: "hogwarts" });
  addWallBox(group, colliders, { x: 0, y: 4, z: 18, w: 28, h: 8, d: 1.2, color: 0x4a4550, level: "hogwarts" });

  // Floor glow candles
  for (let i = -3; i <= 3; i += 1) {
    for (let j = 0; j < 2; j += 1) {
      const flame = mesh(
        new THREE.SphereGeometry(0.08, 8, 8),
        mat(0xffcc66, { emissive: 0xffaa33, emissiveIntensity: 2 })
      );
      flame.position.set(i * 2.5, 5.5 + j * 0.8, -6 + j * 4);
      const light = new THREE.PointLight(0xffc070, 0.35, 8);
      light.position.copy(flame.position);
      group.add(flame, light);
    }
  }

  // House tables
  const houseColors = [0x1a4a1a, 0x4a1a1a, 0x1a1a4a, 0x4a4a12];
  houseColors.forEach((color, i) => {
    const table = mesh(new THREE.BoxGeometry(10, 0.25, 1.4), mat(0x3a2a18, { roughness: 0.7 }));
    table.position.set(0, 0.7, -8 + i * 4);
    const cloth = mesh(new THREE.BoxGeometry(9.6, 0.05, 1.2), mat(color, { roughness: 0.85 }));
    cloth.position.set(0, 0.85, -8 + i * 4);
    group.add(table, cloth);
  });

  // Sorting Hat
  const hat = new THREE.Group();
  const brim = mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.08, 16), mat(0x3a2818, { roughness: 0.9 }));
  const cone = mesh(new THREE.ConeGeometry(0.32, 0.9, 12), mat(0x4a3020, { roughness: 0.88 }));
  cone.position.y = 0.5;
  cone.rotation.z = 0.15;
  hat.add(brim, cone);
  hat.position.set(0, 1.1, 12);
  const stool = mesh(new THREE.CylinderGeometry(0.35, 0.4, 1.0, 12), mat(0x5a4030, { roughness: 0.75 }));
  stool.position.set(0, 0.5, 12);
  group.add(stool, hat);
  interactives.push({ id: "sortingHat", root: hat, label: "Speak to the Sorting Hat", range: 2.6 });

  // McGonagall
  const mcg = createNpcFigure({ robe: 0x1a3a2a, hair: 0x333333, skin: 0xd4b090 });
  mcg.position.set(-3, 0, 12);
  const mcgLabel = createNameLabel("Prof. McGonagall");
  mcgLabel.position.set(0, 2.15, 0);
  mcgLabel.scale.set(2.6, 0.55, 1);
  mcg.add(mcgLabel);
  group.add(mcg);
  interactives.push({ id: "mcgonagall", root: mcg, label: "Talk to Professor McGonagall", range: 2.8 });

  // Entrance door exit
  const door = mesh(new THREE.BoxGeometry(2.4, 3.2, 0.3), mat(0x2a1a10, { roughness: 0.7 }));
  door.position.set(0, 1.6, -17.3);
  group.add(door);
  interactives.push({ id: "exit", root: door, label: "Continue to the next challenge", range: 3 });

  // Ambient hall light
  const hallLight = new THREE.PointLight(0xffe0b0, 1.2, 40);
  hallLight.position.set(0, 6, 0);
  group.add(hallLight);

  group.position.copy(HOGWARTS_ORIGIN);
  game.scene.add(group);
  game.levelGroups.hogwarts = group;
  game.levelColliders.hogwarts = colliders;
  game.levelData.hogwarts = {
    interactives,
    enemies: [],
    sorted: false,
    mcgTalked: false,
  };

  return { spawn: HOGWARTS_ORIGIN.clone().add(new THREE.Vector3(0, 0, 8)) };
}

export function resetHogwartsQuest(game) {
  const data = game.levelData.hogwarts;
  if (!data) return;
  data.sorted = false;
  data.mcgTalked = false;
}

export function updateHogwartsLevel(game, delta, time) {
  /* floating candle flicker handled by lights; subtle hat bob */
  const data = game.levelData.hogwarts;
  if (!data) return;
  const hat = data.interactives.find((i) => i.id === "sortingHat")?.root;
  if (hat) hat.position.y = 1.1 + Math.sin(time * 1.5) * 0.03;
}

export function hogwartsSpawn() {
  return HOGWARTS_ORIGIN.clone().add(new THREE.Vector3(0, 0, 8));
}
