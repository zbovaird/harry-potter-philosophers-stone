import * as THREE from "three";
import {
  buildTrapdoorWorld,
  updateTrapdoorWorld,
  createDevilsSnare,
  createFlyingKey,
} from "../trapdoorProps.js";
import { mat, mesh, worldOffsetColliders } from "../worldUtils.js";
import { HP_GLB } from "../assets.js";

export const TRAPDOOR_ORIGIN = new THREE.Vector3(0, 0, 800);

const CHESS_ORDER = ["Queen", "Knight", "Rook", "Bishop"];

export function buildTrapdoorLevel(game) {
  const group = new THREE.Group();
  group.name = "trapdoor";
  const colliders = [];
  const interactives = [];

  const anim = buildTrapdoorWorld(game, group, colliders);

  const snare = createDevilsSnare();
  snare.position.set(0, 0, -20);
  group.add(snare);
  interactives.push({
    id: "snare",
    root: snare,
    label: "Shoot Incendio at the Devil's Snare",
    range: 5.5,
  });

  // Flying keys — Blender GLB when preloaded, else procedural; one correct (brighter)
  const keys = [];
  const correctIndex = 3;
  for (let i = 0; i < 8; i += 1) {
    const key = game.assets?.cloneScene(HP_GLB.flyingKey) || createFlyingKey();
    key.position.set((Math.random() - 0.5) * 12, 1.5 + Math.random() * 2.5, (Math.random() - 0.5) * 4);
    const correct = i === correctIndex;
    if (correct) {
      key.traverse((o) => {
        if (o.isMesh && o.material?.emissive) {
          o.material = o.material.clone();
          o.material.emissive = new THREE.Color(0xffcc44);
          o.material.emissiveIntensity = 1.4;
          o.material.color = new THREE.Color(0xffe08a);
        }
      });
      const halo = mesh(
        new THREE.RingGeometry(0.35, 0.48, 20),
        new THREE.MeshStandardMaterial({
          color: 0xffee88,
          emissive: 0xffaa22,
          emissiveIntensity: 1.5,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.85,
        }),
        false,
        false
      );
      halo.rotation.x = Math.PI / 2;
      key.add(halo);
      key.userData.halo = halo;
    } else {
      key.scale.setScalar(0.85);
    }
    group.add(key);
    keys.push({ mesh: key, phase: Math.random() * Math.PI * 2, caught: false, correct });
  }
  const keyAnchor = new THREE.Object3D();
  keyAnchor.position.set(0, 2, 0);
  group.add(keyAnchor);
  interactives.push({ id: "keys", root: keyAnchor, label: "Accio the glowing correct key", range: 10 });

  // Wizard's chess — step on glowing tiles in order (not DPS)
  const chessTiles = [];
  const tileSpots = [
    [-3, 16],
    [2, 18],
    [-1, 21],
    [3, 24],
  ];
  tileSpots.forEach(([x, z], i) => {
    const tileMat = new THREE.MeshStandardMaterial({
      color: i % 2 ? 0xd0c8b8 : 0x2a2a30,
      emissive: 0x88aaff,
      emissiveIntensity: i === 0 ? 1.2 : 0.05,
      roughness: 0.55,
    });
    const tile = mesh(new THREE.BoxGeometry(2.4, 0.12, 2.4), tileMat, false, true);
    tile.position.set(x, 0.08, z);
    tile.userData.lit = i === 0;
    group.add(tile);
    chessTiles.push(tile);
    const marker = mesh(
      new THREE.CylinderGeometry(0.25, 0.3, 0.5 + i * 0.15, 8),
      new THREE.MeshStandardMaterial({ color: 0xe8e0d0, roughness: 0.4, metalness: 0.2 })
    );
    marker.position.set(x, 0.4, z);
    group.add(marker);
    interactives.push({
      id: "chessTile",
      root: tile,
      index: i,
      label: `Step: ${CHESS_ORDER[i]}`,
      range: 2.2,
    });
  });

  const exitDoor = mesh(
    new THREE.BoxGeometry(2.4, 3.4, 0.4),
    game.textures ? game.textures.wood(1, 2) : mat(0x5a3a20, { roughness: 0.7 })
  );
  exitDoor.position.set(0, 1.7, 30);
  group.add(exitDoor);
  interactives.push({ id: "exit", root: exitDoor, label: "Descend deeper", range: 3 });

  group.position.copy(TRAPDOOR_ORIGIN);
  worldOffsetColliders(colliders, TRAPDOOR_ORIGIN);
  game.scene.add(group);
  game.levelGroups.trapdoor = group;
  game.levelColliders.trapdoor = colliders;
  game.levelData.trapdoor = {
    interactives,
    enemies: [],
    snare,
    keys,
    chessTiles,
    chessStep: 0,
    snareCleared: false,
    keyCaught: false,
    chessCleared: false,
    doorUnlocked: false,
    anim,
  };

  return { spawn: TRAPDOOR_ORIGIN.clone().add(new THREE.Vector3(0, 0, -28)) };
}

export function resetTrapdoorQuest(game) {
  const data = game.levelData.trapdoor;
  if (!data) return;
  data.snareCleared = false;
  data.keyCaught = false;
  data.chessCleared = false;
  data.doorUnlocked = false;
  data.chessStep = 0;
  data.snare.visible = true;
  for (const k of data.keys) {
    k.caught = false;
    k.mesh.visible = true;
  }
  data.chessTiles.forEach((tile, i) => {
    if (tile.material) tile.material.emissiveIntensity = i === 0 ? 1.2 : 0.05;
  });
}

export function tryAccioKey(game) {
  const data = game.levelData.trapdoor;
  if (!data || data.keyCaught || !game.player) return false;

  const aim = new THREE.Vector3(
    Math.sin(game.cameraYaw) * Math.cos(game.cameraPitch),
    Math.sin(game.cameraPitch),
    Math.cos(game.cameraYaw) * Math.cos(game.cameraPitch)
  ).normalize();
  const origin = game.player.root.position.clone();
  origin.y += 1.3;

  let best = null;
  let bestScore = 0.35;
  for (const key of data.keys) {
    if (key.caught) continue;
    const world = key.mesh.getWorldPosition(new THREE.Vector3());
    const to = world.clone().sub(origin);
    const dist = to.length();
    if (dist > 14) continue;
    to.normalize();
    const score = to.dot(aim);
    if (score > bestScore) {
      bestScore = score;
      best = key;
    }
  }

  if (!best) {
    game.showMessage("Aim at a flying key, then cast Accio.");
    return true;
  }
  if (!best.correct) {
    game.showMessage("Wrong key — Accio the glowing one!");
    return true;
  }

  data.keyCaught = true;
  for (const k of data.keys) {
    k.caught = true;
    k.mesh.visible = false;
  }
  game.showMessage("Accio! The correct winged key flies to your hand.");
  game.updateObjective();
  game.saveCheckpoint?.();
  return true;
}

export function updateTrapdoorLevel(game, delta, time) {
  const data = game.levelData.trapdoor;
  if (!data || !game.player) return;
  updateTrapdoorWorld(data.anim, time);

  if (!data.snareCleared) {
    data.snare.children.forEach((vine, i) => {
      if (vine.isMesh) vine.rotation.z = Math.sin(time * 2 + i) * 0.35;
    });
  }

  for (const key of data.keys) {
    if (key.caught) continue;
    const speed = key.correct ? 2.2 : 1.4;
    key.mesh.position.y = 1.5 + Math.sin(time * 2 + key.phase) * 0.9;
    key.mesh.position.x += Math.sin(time * (key.correct ? 1.4 : 1) + key.phase) * delta * speed;
    key.mesh.position.z += Math.cos(time * 0.8 + key.phase) * delta * (key.correct ? 1.2 : 0.6);
    // Keep keys in the key chamber roughly
    key.mesh.position.x = THREE.MathUtils.clamp(key.mesh.position.x, -7, 7);
    key.mesh.position.z = THREE.MathUtils.clamp(key.mesh.position.z, -5, 5);
    key.mesh.rotation.y += delta * 3;
    const wings = key.mesh.userData.wings;
    if (wings) {
      wings[0].rotation.z = 0.3 + Math.sin(time * 20 + key.phase) * 0.5;
      wings[1].rotation.z = -0.3 - Math.sin(time * 20 + key.phase) * 0.5;
    }
    if (key.mesh.userData.halo) {
      key.mesh.userData.halo.rotation.z = time * 2;
    }
  }

  // Auto-progress chess when standing on the active glowing tile
  if (!data.chessCleared && data.keyCaught && data.snareCleared) {
    const step = data.chessStep || 0;
    const tile = data.chessTiles[step];
    if (tile) {
      const world = tile.getWorldPosition(new THREE.Vector3());
      const dist = game.player.root.position.distanceTo(world);
      if (dist < 1.6) {
        data.chessStep = step + 1;
        if (tile.material) tile.material.emissiveIntensity = 0.05;
        if (data.chessStep >= data.chessTiles.length) {
          data.chessCleared = true;
          game.showMessage("The chess board accepts your path!");
          game.updateObjective();
          game.saveCheckpoint?.();
        } else {
          const next = data.chessTiles[data.chessStep];
          if (next?.material) next.material.emissiveIntensity = 1.2;
          game.showMessage(`Tile ${data.chessStep}/4 — follow the next glow.`);
          game.updateObjective();
        }
      }
    }
  }
}

export function trapdoorSpawn() {
  return TRAPDOOR_ORIGIN.clone().add(new THREE.Vector3(0, 0, -28));
}
