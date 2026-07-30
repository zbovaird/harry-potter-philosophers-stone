import * as THREE from "three";
import { mat, mesh } from "./materials.js";

export const CHARACTERS = [
  {
    id: "harry",
    name: "Harry Potter",
    blurb: "The Boy Who Lived — resilient under pressure.",
    robe: 0x1a3a1a,
    trim: 0xc9a227,
    hair: 0x2a1810,
    skin: 0xe0b090,
    stats: { maxHp: 120, maxMana: 100, moveSpeed: 1, castCooldown: 1, damage: 1, aimAssist: 1 },
    color: "#2d5a2d",
  },
  {
    id: "hermione",
    name: "Hermione Granger",
    blurb: "Brightest witch of her age — faster casting.",
    robe: 0x1a2a4a,
    trim: 0xc9a227,
    hair: 0x8a4a18,
    skin: 0xe4b898,
    stats: { maxHp: 100, maxMana: 120, moveSpeed: 1.02, castCooldown: 0.82, damage: 1, aimAssist: 1.05 },
    color: "#3a4a7a",
  },
  {
    id: "ron",
    name: "Ron Weasley",
    blurb: "Loyal friend — packs a harder punch.",
    robe: 0x4a1818,
    trim: 0xc9a227,
    hair: 0xb84418,
    skin: 0xe2a888,
    stats: { maxHp: 110, maxMana: 95, moveSpeed: 0.98, castCooldown: 1.05, damage: 1.18, aimAssist: 1 },
    color: "#7a3030",
  },
  {
    id: "ginny",
    name: "Ginny Weasley",
    blurb: "Fierce and quick on her feet.",
    robe: 0x5a2020,
    trim: 0xc9a227,
    hair: 0xc45020,
    skin: 0xe2a888,
    stats: { maxHp: 105, maxMana: 105, moveSpeed: 1.12, castCooldown: 0.95, damage: 1.05, aimAssist: 1 },
    color: "#8a3830",
  },
  {
    id: "luna",
    name: "Luna Lovegood",
    blurb: "Sees what others miss — wider aim assist.",
    robe: 0x3a3060,
    trim: 0xb8c8e0,
    hair: 0xd8c070,
    skin: 0xe8c4a8,
    stats: { maxHp: 100, maxMana: 110, moveSpeed: 1, castCooldown: 1, damage: 0.95, aimAssist: 1.25 },
    color: "#5a5080",
  },
];

function buildWand() {
  const wand = new THREE.Group();
  const shaft = mesh(
    new THREE.CylinderGeometry(0.011, 0.017, 0.36, 12),
    mat(0x3e2723, { roughness: 0.65, metalness: 0.12, envMapIntensity: 0.8 })
  );
  shaft.position.y = 0.18;
  const band = mesh(
    new THREE.TorusGeometry(0.018, 0.004, 6, 12),
    mat(0xc9a227, { metalness: 0.9, roughness: 0.25 })
  );
  band.position.y = 0.05;
  const tip = mesh(
    new THREE.SphereGeometry(0.016, 10, 10),
    mat(0xe8d8b0, { roughness: 0.3, metalness: 0.45, emissive: 0x332200, emissiveIntensity: 0.55 })
  );
  tip.position.y = 0.37;
  tip.name = "wandTip";
  wand.add(shaft, band, tip);
  return { wand, tip };
}

function addHair(head, character) {
  const hairMat = mat(character.hair, { roughness: 0.92, envMapIntensity: 0.35 });
  if (character.id === "hermione") {
    for (let i = 0; i < 22; i += 1) {
      const curl = mesh(new THREE.SphereGeometry(0.04 + Math.random() * 0.025, 10, 8), hairMat);
      const a = (i / 22) * Math.PI * 2;
      const r = 0.14 + (i % 3) * 0.02;
      curl.position.set(Math.sin(a) * r, 0.06 + (i % 4) * 0.035, Math.cos(a) * r * 0.9);
      head.add(curl);
    }
  } else if (character.id === "luna") {
    const cap = mesh(new THREE.SphereGeometry(0.175, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), hairMat);
    cap.position.y = 0.05;
    head.add(cap);
    const braid = mesh(new THREE.CapsuleGeometry(0.032, 0.28, 4, 8), hairMat);
    braid.position.set(0.13, -0.1, -0.04);
    head.add(braid);
  } else if (character.id === "ron" || character.id === "ginny") {
    const cap = mesh(new THREE.SphereGeometry(0.17, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), hairMat);
    cap.position.y = 0.05;
    head.add(cap);
    for (let i = 0; i < 6; i += 1) {
      const tuft = mesh(new THREE.SphereGeometry(0.04, 8, 6), hairMat);
      const a = -0.8 + i * 0.32;
      tuft.position.set(Math.sin(a) * 0.12, 0.12, Math.cos(a) * 0.1);
      head.add(tuft);
    }
  } else {
    // Harry — messy dark hair
    const cap = mesh(new THREE.SphereGeometry(0.168, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.58), hairMat);
    cap.position.y = 0.04;
    head.add(cap);
    for (let i = 0; i < 8; i += 1) {
      const spike = mesh(new THREE.ConeGeometry(0.035, 0.1, 6), hairMat);
      const a = (i / 8) * Math.PI * 1.4 - 0.7;
      spike.position.set(Math.sin(a) * 0.12, 0.14, Math.cos(a) * 0.1);
      spike.rotation.x = -0.5;
      spike.rotation.z = a * 0.3;
      head.add(spike);
    }
  }
}

export function getCharacter(id) {
  return CHARACTERS.find((c) => c.id === id) || CHARACTERS[0];
}

export function createPlayer(characterId) {
  const character = getCharacter(characterId);
  const root = new THREE.Group();
  const model = new THREE.Group();

  const hips = new THREE.Group();
  hips.position.y = 0.92;

  const robeMat = mat(character.robe, { roughness: 0.72, envMapIntensity: 0.55 });
  const torso = mesh(new THREE.CapsuleGeometry(0.22, 0.42, 8, 16), robeMat);
  torso.position.y = 0.16;

  // Cloak drape
  const cloak = mesh(
    new THREE.ConeGeometry(0.38, 0.95, 16, 1, true),
    mat(character.robe, { roughness: 0.8, side: THREE.DoubleSide, envMapIntensity: 0.4 })
  );
  cloak.position.y = 0.05;
  cloak.rotation.x = Math.PI;

  const trim = mesh(
    new THREE.TorusGeometry(0.21, 0.018, 10, 24),
    mat(character.trim, { roughness: 0.28, metalness: 0.9, envMapIntensity: 1.4 })
  );
  trim.rotation.x = Math.PI / 2;
  trim.position.y = 0.34;

  const houseCrest = mesh(
    new THREE.CircleGeometry(0.06, 12),
    mat(character.trim, { metalness: 0.7, roughness: 0.35, emissive: character.trim, emissiveIntensity: 0.15 })
  );
  houseCrest.position.set(0.16, 0.22, 0.2);

  const head = new THREE.Group();
  head.position.y = 0.58;
  const skull = mesh(
    new THREE.SphereGeometry(0.155, 20, 16),
    mat(character.skin, { roughness: 0.48, envMapIntensity: 0.55 })
  );
  head.add(skull);
  addHair(head, character);

  // Ears
  for (const x of [-0.14, 0.14]) {
    const ear = mesh(new THREE.SphereGeometry(0.035, 8, 6), mat(character.skin, { roughness: 0.55 }));
    ear.position.set(x, 0, 0);
    ear.scale.set(0.6, 1, 0.5);
    head.add(ear);
  }

  const eyeWhite = mat(0xf2f0ea, { roughness: 0.35 });
  const irisMat = mat(character.id === "harry" ? 0x3a6a40 : 0x3a4a6a, { roughness: 0.25 });
  for (const x of [-0.05, 0.05]) {
    const white = mesh(new THREE.SphereGeometry(0.028, 10, 8), eyeWhite, false, false);
    white.position.set(x, 0.02, 0.13);
    white.scale.set(1, 0.85, 0.7);
    const iris = mesh(new THREE.SphereGeometry(0.014, 8, 6), irisMat, false, false);
    iris.position.set(x, 0.02, 0.148);
    const pupil = mesh(new THREE.SphereGeometry(0.007, 6, 6), mat(0x0a0a0a), false, false);
    pupil.position.set(x, 0.02, 0.158);
    head.add(white, iris, pupil);
  }

  if (character.id === "harry") {
    const rim = mat(0x1a1a1a, { metalness: 0.85, roughness: 0.25 });
    for (const x of [-0.05, 0.05]) {
      const glasses = mesh(new THREE.TorusGeometry(0.038, 0.006, 8, 16), rim);
      glasses.position.set(x, 0.02, 0.145);
      head.add(glasses);
    }
    const bridge = mesh(new THREE.BoxGeometry(0.035, 0.006, 0.006), rim);
    bridge.position.set(0, 0.02, 0.15);
    head.add(bridge);
  }

  const armL = new THREE.Group();
  armL.position.set(-0.3, 0.3, 0);
  const upperL = mesh(new THREE.CapsuleGeometry(0.055, 0.24, 6, 10), robeMat);
  upperL.position.y = -0.15;
  const handL = mesh(new THREE.SphereGeometry(0.045, 10, 8), mat(character.skin, { roughness: 0.55 }));
  handL.position.y = -0.36;
  armL.add(upperL, handL);

  const armR = new THREE.Group();
  armR.position.set(0.3, 0.3, 0);
  const upperR = mesh(new THREE.CapsuleGeometry(0.055, 0.24, 6, 10), robeMat);
  upperR.position.y = -0.15;
  const handR = mesh(new THREE.SphereGeometry(0.045, 10, 8), mat(character.skin, { roughness: 0.55 }));
  handR.position.y = -0.36;
  const { wand, tip } = buildWand();
  wand.position.set(0.02, -0.38, 0.06);
  wand.rotation.z = -0.35;
  wand.rotation.x = 0.55;
  armR.add(upperR, handR, wand);

  const pantMat = mat(0x1a1a22, { roughness: 0.82 });
  const legL = new THREE.Group();
  legL.position.set(-0.1, -0.15, 0);
  const thighL = mesh(new THREE.CapsuleGeometry(0.075, 0.28, 6, 10), pantMat);
  thighL.position.y = -0.28;
  const bootL = mesh(new THREE.BoxGeometry(0.12, 0.1, 0.2), mat(0x2a1a12, { roughness: 0.7 }));
  bootL.position.set(0, -0.58, 0.04);
  legL.add(thighL, bootL);

  const legR = legL.clone();
  legR.position.x = 0.1;

  hips.add(torso, cloak, trim, houseCrest, head, armL, armR, legL, legR);
  model.add(hips);
  root.add(model);

  return {
    id: character.id,
    name: character.name,
    stats: { ...character.stats },
    root,
    model,
    hips,
    armR,
    armL,
    head,
    wandTip: tip,
    wand,
    facing: new THREE.Vector3(0, 0, 1),
  };
}
