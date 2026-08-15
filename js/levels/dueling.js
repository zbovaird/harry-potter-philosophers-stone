import * as THREE from "three";
import { worldOffsetColliders, createNpcFigure, createNameLabel, mat, mesh, addWallBox } from "../worldUtils.js";
import { addBoundedGround, decorateLanterns } from "../cosKit.js";
import { createEnemy } from "../combat.js";
import { tickBoss } from "../bossAI.js";

export const DUELING_ORIGIN = new THREE.Vector3(0, 0, 2600);

export function buildDuelingLevel(game) {
  const group = new THREE.Group();
  group.name = "dueling";
  const colliders = [];
  const interactives = [];
  const tex = game.textures;
  const stoneMap = tex.cloneMap?.("stoneMap", 4, 4);

  addBoundedGround(group, colliders, { size: 36, color: 0x8a8070, texture: stoneMap, level: "dueling" });
  addWallBox(group, colliders, { x: 0, y: 3, z: -16, w: 34, h: 6, d: 0.6, color: 0x6a6058, level: "dueling", map: stoneMap });
  addWallBox(group, colliders, { x: 0, y: 3, z: 16, w: 34, h: 6, d: 0.6, color: 0x6a6058, level: "dueling", map: stoneMap });
  addWallBox(group, colliders, { x: -17, y: 3, z: 0, w: 0.6, h: 6, d: 32, color: 0x5a5048, level: "dueling" });
  addWallBox(group, colliders, { x: 17, y: 3, z: 0, w: 0.6, h: 6, d: 32, color: 0x5a5048, level: "dueling" });
  decorateLanterns(group, [
    [-8, -8, 0xffe0a0, 1.6],
    [8, -8, 0xffe0a0, 1.6],
    [-8, 8, 0xffe0a0, 1.4],
    [8, 8, 0xffe0a0, 1.4],
  ]);

  const lockhart = createNpcFigure({ robe: 0x3a5a8a, hair: 0xf2e8c0, skin: 0xf0d4b0 });
  lockhart.position.set(0, 0, -10);
  lockhart.add(createNameLabel("Gilderoy Lockhart"));
  lockhart.children.at(-1).position.set(0, 2.15, 0);
  lockhart.children.at(-1).scale.set(2.4, 0.5, 1);
  group.add(lockhart);
  interactives.push({ id: "lockhart", root: lockhart, label: "Hear Lockhart's lesson", range: 2.6 });

  const malfoyMesh = createNpcFigure({ robe: 0x1a3a28, hair: 0xe8e0c8, skin: 0xf0e0c8 });
  malfoyMesh.position.set(4, 0, 4);
  malfoyMesh.add(createNameLabel("Draco Malfoy"));
  malfoyMesh.children.at(-1).position.set(0, 2.15, 0);
  group.add(malfoyMesh);
  const malfoy = createEnemy({
    root: malfoyMesh,
    hp: 110,
    damage: 12,
    hitRadius: 1.4,
    hitHeight: 1.2,
    name: "Draco Malfoy",
    speed: 2.4,
  });
  malfoy.phase = 1;
  malfoy.winding = false;
  malfoy.windup = 0;

  const snake = mesh(new THREE.CapsuleGeometry(0.12, 1.4, 6, 8), mat(0x2a6a2a, { roughness: 0.45 }));
  snake.position.set(5.2, 0.2, 4.4);
  snake.rotation.z = 1.2;
  snake.visible = false;
  group.add(snake);

  const door = mesh(new THREE.BoxGeometry(2.8, 3.2, 0.22), mat(0x4a3020, { roughness: 0.7 }));
  door.position.set(0, 1.6, 14.6);
  group.add(door);
  interactives.push({ id: "exit", root: door, label: "Leave the Dueling Club", range: 3 });

  group.position.copy(DUELING_ORIGIN);
  worldOffsetColliders(colliders, DUELING_ORIGIN);
  game.scene.add(group);
  game.levelGroups.dueling = group;
  game.levelColliders.dueling = colliders;
  game.levelData.dueling = {
    interactives,
    enemies: [malfoy],
    malfoy,
    snake,
    lessonHeard: false,
    snakeShown: false,
  };
}

export function resetDuelingQuest(game) {
  const data = game.levelData.dueling;
  if (!data) return;
  data.lessonHeard = false;
  data.snakeShown = false;
  data.snake.visible = false;
  const m = data.malfoy;
  m.hp = m.maxHp;
  m.alive = true;
  m.stun = 0;
  m.winding = false;
  m.root.position.set(4, 0, 4);
  m.root.visible = true;
  m.root.scale.setScalar(1);
}

export function updateDuelingLevel(game, delta, time) {
  const data = game.levelData.dueling;
  if (!data || !data.lessonHeard) return;
  if (data.malfoy.alive) {
    tickBoss(game, data.malfoy, DUELING_ORIGIN, delta, time, {
      meleeRange: 1.8,
      baseDamage: 12,
      windupTime: 0.55,
      attackCooldown: 1.25,
      name: "Malfoy",
    });
  }
  if (data.snake.visible) {
    data.snake.rotation.y += delta * 3;
    data.snake.position.y = 0.25 + Math.sin(time * 6) * 0.08;
  }
}

export function duelingSpawn() {
  return DUELING_ORIGIN.clone().add(new THREE.Vector3(0, 0, -12));
}
