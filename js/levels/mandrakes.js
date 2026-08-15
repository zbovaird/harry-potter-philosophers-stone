import * as THREE from "three";
import { worldOffsetColliders, createNpcFigure, createNameLabel, mat, mesh, addWallBox } from "../worldUtils.js";
import { addBoundedGround, createMandrake, decorateLanterns, tryPlaceProp } from "../cosKit.js";
import { HP_GLB } from "../assets.js";

export const MANDRAKES_ORIGIN = new THREE.Vector3(0, 0, 3000);

export function buildMandrakesLevel(game) {
  const group = new THREE.Group();
  group.name = "mandrakes";
  const colliders = [];
  const interactives = [];
  const tex = game.textures;
  const glassMap = tex.cloneMap?.("stoneMap", 4, 4);

  addBoundedGround(group, colliders, { size: 32, color: 0x4a5a38, texture: tex.cloneMap?.("barkMap", 6, 6), level: "mandrakes" });
  addWallBox(group, colliders, { x: 0, y: 2.6, z: -14, w: 30, h: 5.2, d: 0.4, color: 0x88aa66, level: "mandrakes", map: glassMap });
  addWallBox(group, colliders, { x: 0, y: 2.6, z: 14, w: 30, h: 5.2, d: 0.4, color: 0x88aa66, level: "mandrakes", map: glassMap });
  addWallBox(group, colliders, { x: -15, y: 2.6, z: 0, w: 0.4, h: 5.2, d: 28, color: 0x6a8a50, level: "mandrakes" });
  addWallBox(group, colliders, { x: 15, y: 2.6, z: 0, w: 0.4, h: 5.2, d: 28, color: 0x6a8a50, level: "mandrakes" });
  decorateLanterns(group, [
    [-8, -6, 0xccff88, 1.2],
    [8, 6, 0xffe080, 1.1],
  ]);

  const sprout = createNpcFigure({ robe: 0x3a5a28, hair: 0xc8a060, skin: 0xe8c4a0 });
  sprout.position.set(-6, 0, -8);
  sprout.add(createNameLabel("Professor Sprout"));
  sprout.children.at(-1).position.set(0, 2.15, 0);
  sprout.children.at(-1).scale.set(2.4, 0.5, 1);
  group.add(sprout);
  interactives.push({ id: "sprout", root: sprout, label: "Learn about Mandrakes", range: 2.5 });

  const pots = [];
  for (let i = 0; i < 4; i += 1) {
    const plant = tryPlaceProp(game, group, HP_GLB.mandrake, createMandrake, new THREE.Vector3(-6 + i * 4, 0, 2), 0.7);
    pots.push(plant);
    interactives.push({ id: "mandrake", root: plant, label: "Pot the Mandrake (E or Leviosa)", range: 2, index: i });
  }

  const justin = createNpcFigure({ robe: 0x3a3060, hair: 0xd8c070, skin: 0xe8c4a8 });
  justin.position.set(6, 0, -4);
  justin.rotation.x = -Math.PI / 2;
  justin.position.y = 0.2;
  justin.add(createNameLabel("Petrified student"));
  justin.children.at(-1).position.set(0, 1.2, 0);
  group.add(justin);
  interactives.push({ id: "petrified", root: justin, label: "Revive with Mandrake draught", range: 2.4 });

  const door = mesh(new THREE.BoxGeometry(2.8, 3.2, 0.22), mat(0x4a6030, { roughness: 0.75 }));
  door.position.set(0, 1.6, 12.6);
  group.add(door);
  interactives.push({ id: "exit", root: door, label: "Leave the greenhouse", range: 3 });

  group.position.copy(MANDRAKES_ORIGIN);
  worldOffsetColliders(colliders, MANDRAKES_ORIGIN);
  game.scene.add(group);
  game.levelGroups.mandrakes = group;
  game.levelColliders.mandrakes = colliders;
  game.levelData.mandrakes = {
    interactives,
    enemies: [],
    lesson: false,
    potted: 0,
    pottedFlags: [false, false, false, false],
    revived: false,
    justin,
  };
}

export function resetMandrakesQuest(game) {
  const data = game.levelData.mandrakes;
  if (!data) return;
  data.lesson = false;
  data.potted = 0;
  data.pottedFlags = [false, false, false, false];
  data.revived = false;
  if (data.justin) {
    data.justin.rotation.x = -Math.PI / 2;
    data.justin.position.y = 0.2;
  }
}

export function updateMandrakesLevel() {}

export function mandrakesSpawn() {
  return MANDRAKES_ORIGIN.clone().add(new THREE.Vector3(0, 0, -10));
}
