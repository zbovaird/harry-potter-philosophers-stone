import * as THREE from "three";
import { worldOffsetColliders, createNpcFigure, createNameLabel, mat, mesh, addWallBox } from "../worldUtils.js";
import { addBoundedGround, decorateLanterns, placeOptionalGlb } from "../cosKit.js";
import { HP_GLB } from "../assets.js";

export const POLYJUICE_ORIGIN = new THREE.Vector3(0, 0, 2800);

export function buildPolyjuiceLevel(game) {
  const group = new THREE.Group();
  group.name = "polyjuice";
  const colliders = [];
  const interactives = [];
  const tex = game.textures;

  addBoundedGround(group, colliders, { size: 34, color: 0x3a4840, texture: tex.cloneMap?.("stoneMap", 5, 5), level: "polyjuice" });
  addWallBox(group, colliders, { x: 0, y: 2.8, z: -15, w: 32, h: 5.6, d: 0.5, color: 0x2a3a32, level: "polyjuice" });
  addWallBox(group, colliders, { x: 0, y: 2.8, z: 15, w: 32, h: 5.6, d: 0.5, color: 0x2a3a32, level: "polyjuice" });
  addWallBox(group, colliders, { x: -16, y: 2.8, z: 0, w: 0.5, h: 5.6, d: 30, color: 0x243028, level: "polyjuice" });
  addWallBox(group, colliders, { x: 16, y: 2.8, z: 0, w: 0.5, h: 5.6, d: 30, color: 0x243028, level: "polyjuice" });
  decorateLanterns(group, [
    [-6, -6, 0x66ff99, 1.1],
    [6, 6, 0x88ffaa, 1.1],
    [0, 0, 0xaaffcc, 0.8],
  ]);

  const hermione = createNpcFigure({ robe: 0x1a2a4a, hair: 0x8a4a18, skin: 0xe4b898 });
  hermione.position.set(-6, 0, -8);
  hermione.add(createNameLabel("Hermione"));
  hermione.children.at(-1).position.set(0, 2.15, 0);
  group.add(hermione);
  interactives.push({ id: "hermione", root: hermione, label: "Plan the Polyjuice Potion", range: 2.4 });

  const cauldron = placeOptionalGlb(
    game,
    HP_GLB.cauldron,
    () => mesh(new THREE.CylinderGeometry(0.45, 0.55, 0.7, 12), mat(0x222228, { metalness: 0.7, roughness: 0.4 })),
    0.85
  );
  cauldron.position.set(0, 0, -2);
  group.add(cauldron);
  interactives.push({ id: "cauldron", root: cauldron, label: "Brew Polyjuice", range: 2.2 });

  const ingredients = [
    { id: "boomslang", label: "Take boomslang skin", pos: [-8, 0, 4] },
    { id: "lacewing", label: "Take lacewing flies", pos: [8, 0, 4] },
    { id: "hair", label: "Take Crabbe's hair", pos: [0, 0, 8] },
  ];
  for (const item of ingredients) {
    const pile = mesh(new THREE.SphereGeometry(0.18, 8, 6), mat(0x88aa66, { roughness: 0.6, emissive: 0x224422, emissiveIntensity: 0.3 }));
    pile.position.set(item.pos[0], 0.2, item.pos[2]);
    group.add(pile);
    interactives.push({ id: item.id, root: pile, label: item.label, range: 2 });
  }

  const malfoy = createNpcFigure({ robe: 0x1a3a28, hair: 0xe8e0c8, skin: 0xf0e0c8 });
  malfoy.position.set(8, 0, -6);
  malfoy.add(createNameLabel("Malfoy"));
  malfoy.children.at(-1).position.set(0, 2.15, 0);
  group.add(malfoy);
  interactives.push({ id: "malfoy", root: malfoy, label: "Eavesdrop on Malfoy", range: 2.4 });

  const door = mesh(new THREE.BoxGeometry(2.6, 3.1, 0.2), mat(0x1a2a22, { roughness: 0.65 }));
  door.position.set(0, 1.55, 13.6);
  group.add(door);
  interactives.push({ id: "exit", root: door, label: "Slip out of the common room", range: 3 });

  group.position.copy(POLYJUICE_ORIGIN);
  worldOffsetColliders(colliders, POLYJUICE_ORIGIN);
  game.scene.add(group);
  game.levelGroups.polyjuice = group;
  game.levelColliders.polyjuice = colliders;
  game.levelData.polyjuice = {
    interactives,
    enemies: [],
    planned: false,
    boomslang: false,
    lacewing: false,
    hair: false,
    brewed: false,
    disguised: false,
    overheard: false,
  };
}

export function resetPolyjuiceQuest(game) {
  const data = game.levelData.polyjuice;
  if (!data) return;
  Object.assign(data, {
    planned: false,
    boomslang: false,
    lacewing: false,
    hair: false,
    brewed: false,
    disguised: false,
    overheard: false,
  });
  game.cloaked = false;
}

export function updatePolyjuiceLevel() {}

export function polyjuiceSpawn() {
  return POLYJUICE_ORIGIN.clone().add(new THREE.Vector3(-4, 0, -11));
}
