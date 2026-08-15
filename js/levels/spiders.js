import * as THREE from "three";
import { worldOffsetColliders, createNpcFigure, createNameLabel, mat, mesh } from "../worldUtils.js";
import { addBoundedGround, createSpider, createWebWall, createFordAnglia, tryPlaceProp, decorateLanterns } from "../cosKit.js";
import { HP_GLB } from "../assets.js";
import { createEnemy } from "../combat.js";
import { hasShield } from "../bossAI.js";

export const SPIDERS_ORIGIN = new THREE.Vector3(0, 0, 3200);

export function buildSpidersLevel(game) {
  const group = new THREE.Group();
  group.name = "spiders";
  const colliders = [];
  const interactives = [];
  const tex = game.textures;

  addBoundedGround(group, colliders, { size: 56, color: 0x1a2418, texture: tex.cloneMap?.("barkMap", 8, 8), level: "spiders" });
  decorateLanterns(group, [
    [-8, -16, 0x88aa66, 0.5],
    [8, 8, 0xaacc88, 0.45],
  ]);

  for (let i = 0; i < 22; i += 1) {
    const trunk = mesh(new THREE.CylinderGeometry(0.35, 0.5, 6, 7), mat(0x2a1a10, { roughness: 0.92 }));
    const a = (i / 22) * Math.PI * 2;
    trunk.position.set(Math.sin(a) * 18, 3, Math.cos(a) * 16);
    group.add(trunk);
  }

  const webs = [];
  for (const z of [-4, 6]) {
    const web = createWebWall(8, 3.6);
    web.position.set(0, 1.8, z);
    group.add(web);
    webs.push(web);
    interactives.push({ id: "web", root: web, label: "Burn the webs with Incendio (7)", range: 3.2 });
  }

  const enemies = [];
  for (let i = 0; i < 8; i += 1) {
    const meshRoot = tryPlaceProp(
      game,
      group,
      HP_GLB.acromantula,
      createSpider,
      new THREE.Vector3(-6 + (i % 4) * 4, 0, -2 + Math.floor(i / 4) * 8),
      0.9,
      { standUp: false }
    );
    enemies.push(
      createEnemy({
        root: meshRoot,
        hp: 36,
        damage: 9,
        hitRadius: 1.2,
        hitHeight: 0.6,
        name: "Acromantula",
        speed: 2.6,
      })
    );
  }

  const aragog = createNpcFigure({ robe: 0x2a1810, hair: 0x1a1210, skin: 0x3a2a20, scale: 1.6 });
  aragog.position.set(0, 0, 14);
  aragog.add(createNameLabel("Aragog"));
  aragog.children.at(-1).position.set(0, 2.1, 0);
  group.add(aragog);
  interactives.push({ id: "aragog", root: aragog, label: "Speak with Aragog", range: 3 });

  const car = tryPlaceProp(game, group, HP_GLB.fordAnglia, createFordAnglia, new THREE.Vector3(8, 0, 18), 1.3, {
    standUp: false,
  });
  interactives.push({ id: "exit", root: car, label: "Escape in the Ford Anglia", range: 3.4 });

  group.position.copy(SPIDERS_ORIGIN);
  worldOffsetColliders(colliders, SPIDERS_ORIGIN);
  game.scene.add(group);
  game.levelGroups.spiders = group;
  game.levelColliders.spiders = colliders;
  game.levelData.spiders = {
    interactives,
    enemies,
    webs,
    websBurned: 0,
    aragogTalked: false,
  };
}

export function resetSpidersQuest(game) {
  const data = game.levelData.spiders;
  if (!data) return;
  data.websBurned = 0;
  data.aragogTalked = false;
  for (const web of data.webs) web.visible = true;
  for (const e of data.enemies) {
    e.hp = e.maxHp;
    e.alive = true;
    e.stun = 0;
    e.root.visible = true;
    e.root.scale.setScalar(1);
  }
}

export function updateSpidersLevel(game, delta) {
  const data = game.levelData.spiders;
  if (!data || !game.player) return;
  const origin = SPIDERS_ORIGIN;
  const playerLocal = game.player.root.position.clone().sub(origin);
  for (const enemy of data.enemies) {
    if (!enemy.alive) continue;
    enemy.stun = Math.max(0, enemy.stun - delta);
    enemy.attackCd = Math.max(0, enemy.attackCd - delta);
    if (enemy.stun > 0) continue;
    const to = playerLocal.clone().sub(enemy.root.position);
    to.y = 0;
    const dist = to.length();
    if (dist > 1.3 && dist < 16) {
      to.normalize();
      enemy.root.position.addScaledVector(to, enemy.speed * delta);
      enemy.root.rotation.y = Math.atan2(to.x, to.z);
    } else if (dist <= 1.3 && enemy.attackCd <= 0 && game.combat?.alive) {
      enemy.attackCd = 1.1;
      if (hasShield(game)) {
        game.showMessage("Protego!", 0.6);
        continue;
      }
      const dealt = game.combat.damage(enemy.damage);
      if (dealt > 0) {
        game.audio.hurt();
        game.fx.flashDamage(0.55);
      }
    }
  }
}

export function castPatronusInSpiders(game) {
  const data = game.levelData.spiders;
  if (!data) return false;
  const origin = SPIDERS_ORIGIN;
  const playerLocal = game.player.root.position.clone().sub(origin);
  let n = 0;
  for (const enemy of data.enemies) {
    if (!enemy.alive) continue;
    if (enemy.root.position.distanceTo(playerLocal) < 13) {
      enemy.stun = Math.max(enemy.stun, 4);
      n += 1;
    }
  }
  if (n) game.showMessage("Expecto Patronum! The spiders recoil!");
  return n > 0;
}

export function spidersSpawn() {
  return SPIDERS_ORIGIN.clone().add(new THREE.Vector3(0, 0, -22));
}
