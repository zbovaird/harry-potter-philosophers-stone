import * as THREE from "three";
import { worldOffsetColliders, createNpcFigure, createNameLabel, mat, mesh } from "../worldUtils.js";
import { addBoundedGround, addCottage, addKnockturnRow, decorateLanterns, tryPlaceProp, createDiary } from "../cosKit.js";
import { HP_GLB } from "../assets.js";

export const BURROW_ORIGIN = new THREE.Vector3(0, 0, 2000);

export function buildBurrowLevel(game) {
  const group = new THREE.Group();
  group.name = "burrow";
  const colliders = [];
  const interactives = [];
  const tex = game.textures;

  addBoundedGround(group, colliders, { size: 56, color: 0x3d4a32, texture: tex.cloneMap?.("barkMap", 8, 8), level: "burrow" });
  addCottage(group, colliders, { x: -8, z: -8, level: "burrow" });
  addKnockturnRow(group, colliders, "burrow", tex);

  decorateLanterns(group, [
    [-6, -2, 0xffc070, 1.2],
    [6, 2, 0xaa88ff, 0.9],
    [-12, 6, 0x88aaff, 0.8],
    [10, 8, 0xff8866, 0.7],
  ]);

  const molly = createNpcFigure({ robe: 0x8a3030, hair: 0xb84418, skin: 0xe2a888 });
  molly.position.set(-5.5, 0, -4);
  molly.add(createNameLabel("Molly Weasley"));
  molly.children.at(-1).position.set(0, 2.1, 0);
  molly.children.at(-1).scale.set(2.2, 0.5, 1);
  group.add(molly);
  interactives.push({ id: "molly", root: molly, label: "Talk to Molly", range: 2.4 });

  const dobby = createNpcFigure({ robe: 0xe8e0d0, hair: 0xf2e8c8, skin: 0xf0e0c0, scale: 0.72 });
  dobby.position.set(4, 0, 1);
  dobby.add(createNameLabel("Dobby"));
  dobby.children.at(-1).position.set(0, 2.2, 0);
  group.add(dobby);
  interactives.push({ id: "dobby", root: dobby, label: "Confront Dobby", range: 2.2 });

  const diary = tryPlaceProp(game, group, HP_GLB.tomRiddleDiary, createDiary, new THREE.Vector3(8, 0, 8), 0.4);
  interactives.push({ id: "shop", root: diary, label: "Browse Knockturn wares", range: 2.4 });

  const gate = mesh(new THREE.BoxGeometry(3.2, 3.4, 0.28), mat(0x2a2218, { roughness: 0.7, metalness: 0.2 }));
  gate.position.set(0, 1.7, 22);
  group.add(gate);
  interactives.push({ id: "exit", root: gate, label: "Leave for the Hogwarts Express", range: 3.2 });

  group.position.copy(BURROW_ORIGIN);
  worldOffsetColliders(colliders, BURROW_ORIGIN);
  game.scene.add(group);
  game.levelGroups.burrow = group;
  game.levelColliders.burrow = colliders;
  game.levelData.burrow = { interactives, enemies: [], mollyTalked: false, dobbyWarned: false, knockturnVisited: false };
}

export function resetBurrowQuest(game) {
  const data = game.levelData.burrow;
  if (!data) return;
  data.mollyTalked = false;
  data.dobbyWarned = false;
  data.knockturnVisited = false;
}

export function updateBurrowLevel() {}

export function burrowSpawn() {
  return BURROW_ORIGIN.clone().add(new THREE.Vector3(0, 0, -18));
}
