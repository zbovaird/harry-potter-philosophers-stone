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
  {
    id: "bellatrix",
    name: "Bellatrix Lestrange",
    blurb: "Unhinged and lethal — raw power over control.",
    robe: 0x0c0c12,
    trim: 0x8a9a8a,
    hair: 0x1a1210,
    skin: 0xd8a888,
    stats: { maxHp: 95, maxMana: 115, moveSpeed: 1.06, castCooldown: 0.88, damage: 1.28, aimAssist: 0.9 },
    color: "#2a2228",
  },
  {
    id: "sirius",
    name: "Sirius Black",
    blurb: "Padfoot — reckless speed and bite.",
    robe: 0x1a1a22,
    trim: 0xa8a8b0,
    hair: 0x141210,
    skin: 0xd4a888,
    stats: { maxHp: 115, maxMana: 100, moveSpeed: 1.16, castCooldown: 0.92, damage: 1.12, aimAssist: 0.95 },
    color: "#3a3a48",
  },
  {
    id: "lavender",
    name: "Lavender Brown",
    blurb: "Bubbly Gryffindor — quick casts, soft aim.",
    robe: 0x5a2838,
    trim: 0xe8b8c8,
    hair: 0xc8a060,
    skin: 0xe8c4a8,
    stats: { maxHp: 100, maxMana: 110, moveSpeed: 1.04, castCooldown: 0.85, damage: 0.98, aimAssist: 1.12 },
    color: "#8a4860",
  },
  {
    id: "lupin",
    name: "Remus Lupin",
    blurb: "Quiet strength — sturdy and steady under fire.",
    robe: 0x3a3028,
    trim: 0xb8a070,
    hair: 0x6a5840,
    skin: 0xd8b090,
    stats: { maxHp: 130, maxMana: 105, moveSpeed: 0.96, castCooldown: 0.98, damage: 1.05, aimAssist: 1.08 },
    color: "#5a4a38",
  },
  {
    id: "dumbledore",
    name: "Albus Dumbledore",
    blurb: "Master of magic — vast power, measured pace.",
    robe: 0x4a2868,
    trim: 0xd4af37,
    hair: 0xe8e4d8,
    skin: 0xe0c4a0,
    stats: { maxHp: 110, maxMana: 150, moveSpeed: 0.88, castCooldown: 0.78, damage: 1.22, aimAssist: 1.15 },
    color: "#6a4890",
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

/** Smooth scalp + layered strand locks — no sphere “bubbles”. */
function addSmoothCrown(head, hairMat, { scaleX = 1.15, scaleY = 1.08, scaleZ = 1.2, y = 0.05 } = {}) {
  const crown = mesh(new THREE.SphereGeometry(0.168, 24, 18, 0, Math.PI * 2, 0, Math.PI * 0.78), hairMat);
  crown.position.set(0, y, -0.01);
  crown.scale.set(scaleX, scaleY, scaleZ);
  head.add(crown);
}

function addHairLock(head, matA, x, y, z, len, thick, rotZ = 0, rotX = 0.25) {
  const lock = mesh(new THREE.CapsuleGeometry(thick, len, 5, 10), matA);
  lock.position.set(x, y, z);
  lock.rotation.z = rotZ;
  lock.rotation.x = rotX;
  head.add(lock);
}

function addBangs(head, hairMat, style = "soft") {
  if (style === "curtain") {
    for (const side of [-1, 1]) {
      for (let i = 0; i < 5; i += 1) {
        addHairLock(
          head,
          hairMat,
          side * (0.035 + i * 0.026),
          0.05 - i * 0.012,
          0.14,
          0.11 + i * 0.012,
          0.014,
          side * (0.45 + i * 0.07),
          0.6
        );
      }
    }
  } else {
    for (let i = 0; i < 8; i += 1) {
      addHairLock(head, hairMat, -0.1 + i * 0.028, 0.06, 0.145, 0.09 + (i % 3) * 0.015, 0.013, (i - 3.5) * 0.07, 0.72);
    }
  }
}

function addHair(head, character) {
  const hairMat = mat(character.hair, { roughness: 0.78, envMapIntensity: 0.4 });
  const darkMat = mat(
    new THREE.Color(character.hair).multiplyScalar(0.7).getHex(),
    { roughness: 0.85, envMapIntensity: 0.3 }
  );

  if (character.id === "hermione") {
    // Full bushy look from overlapping smooth locks (not spheres)
    addSmoothCrown(head, hairMat, { scaleX: 1.32, scaleY: 1.18, scaleZ: 1.35, y: 0.06 });
    const volume = mesh(new THREE.SphereGeometry(0.175, 22, 16, 0, Math.PI * 2, 0, Math.PI * 0.7), darkMat);
    volume.position.set(0, 0.02, -0.04);
    volume.scale.set(1.4, 1.2, 1.35);
    head.add(volume);
    // Side / back flowing locks for thickness
    for (let i = 0; i < 22; i += 1) {
      const a = -1.45 + (i / 21) * 2.9;
      const matUse = i % 2 ? hairMat : darkMat;
      addHairLock(
        head,
        matUse,
        Math.sin(a) * 0.17,
        -0.06 - (i % 5) * 0.03,
        Math.cos(a) * 0.12 - 0.04,
        0.28 + (i % 4) * 0.05,
        0.028 + (i % 3) * 0.006,
        Math.sin(a) * 0.4,
        0.32 + Math.abs(Math.sin(a)) * 0.12
      );
    }
    // Extra mid-length layer around the jaw
    for (let i = 0; i < 12; i += 1) {
      const a = -1.2 + (i / 11) * 2.4;
      addHairLock(head, hairMat, Math.sin(a) * 0.19, -0.02, Math.cos(a) * 0.13, 0.2, 0.024, Math.sin(a) * 0.35, 0.2);
    }
    // Long back panel
    const fall = mesh(new THREE.CapsuleGeometry(0.11, 0.4, 6, 12), hairMat);
    fall.position.set(0, -0.2, -0.14);
    fall.scale.set(1.55, 1, 0.75);
    fall.rotation.x = 0.2;
    head.add(fall);
    addBangs(head, hairMat, "soft");
  } else if (character.id === "luna") {
    addSmoothCrown(head, hairMat, { scaleX: 1.08, scaleY: 1.05, scaleZ: 1.12, y: 0.05 });
    addBangs(head, hairMat, "curtain");
    // Long straight-ish layers
    for (let i = 0; i < 16; i += 1) {
      const a = -1.35 + (i / 15) * 2.7;
      const matUse = i % 2 ? hairMat : darkMat;
      addHairLock(
        head,
        matUse,
        Math.sin(a) * 0.14,
        -0.12 - (i % 4) * 0.02,
        Math.cos(a) * 0.1 - 0.06,
        0.42 + (i % 3) * 0.04,
        0.016,
        Math.sin(a) * 0.28,
        0.22
      );
    }
    const fall = mesh(new THREE.CapsuleGeometry(0.09, 0.5, 6, 12), hairMat);
    fall.position.set(0, -0.28, -0.15);
    fall.scale.set(1.35, 1, 0.65);
    fall.rotation.x = 0.18;
    head.add(fall);
    const braid = mesh(new THREE.CapsuleGeometry(0.018, 0.36, 4, 8), darkMat);
    braid.position.set(0.14, -0.18, 0.02);
    braid.rotation.z = 0.38;
    braid.rotation.x = 0.12;
    head.add(braid);
  } else if (character.id === "ginny") {
    addSmoothCrown(head, hairMat, { scaleX: 1.1, scaleY: 1.06, scaleZ: 1.14, y: 0.05 });
    addBangs(head, hairMat, "curtain");
    for (let i = 0; i < 18; i += 1) {
      const a = -1.4 + (i / 17) * 2.8;
      const matUse = i % 2 ? hairMat : darkMat;
      addHairLock(
        head,
        matUse,
        Math.sin(a) * 0.145,
        -0.1 - (i % 4) * 0.025,
        Math.cos(a) * 0.1 - 0.05,
        0.38 + (i % 4) * 0.04,
        0.017,
        Math.sin(a) * 0.4,
        0.26
      );
    }
    const fall = mesh(new THREE.CapsuleGeometry(0.1, 0.48, 6, 12), hairMat);
    fall.position.set(0, -0.26, -0.15);
    fall.scale.set(1.45, 1, 0.7);
    fall.rotation.x = 0.2;
    head.add(fall);
  } else if (character.id === "bellatrix") {
    // Wild, frizzy, uneven curls — chaotic silhouette
    addSmoothCrown(head, hairMat, { scaleX: 1.28, scaleY: 1.22, scaleZ: 1.3, y: 0.08 });
    const frizz = mesh(new THREE.SphereGeometry(0.18, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.72), darkMat);
    frizz.position.set(0, 0.04, -0.02);
    frizz.scale.set(1.35, 1.25, 1.3);
    head.add(frizz);
    for (let i = 0; i < 28; i += 1) {
      const a = -1.55 + (i / 27) * 3.1;
      const matUse = i % 2 ? hairMat : darkMat;
      const wild = (i % 5) * 0.08;
      addHairLock(
        head,
        matUse,
        Math.sin(a) * (0.16 + wild * 0.08),
        -0.02 - (i % 6) * 0.04 + (i % 3) * 0.02,
        Math.cos(a) * (0.12 + wild * 0.05) - 0.03,
        0.22 + (i % 5) * 0.07,
        0.02 + (i % 4) * 0.008,
        Math.sin(a) * (0.55 + wild),
        0.15 + (i % 4) * 0.12
      );
    }
    // Spiky top tufts
    for (let i = 0; i < 10; i += 1) {
      const a = (i / 10) * Math.PI * 2;
      addHairLock(
        head,
        i % 2 ? hairMat : darkMat,
        Math.sin(a) * 0.08,
        0.12 + (i % 3) * 0.03,
        Math.cos(a) * 0.08 - 0.02,
        0.12 + (i % 3) * 0.04,
        0.018,
        Math.sin(a) * 0.3,
        -0.85 - (i % 4) * 0.08
      );
    }
    addBangs(head, hairMat, "soft");
  } else if (character.id === "sirius") {
    // Long, wavy black hair
    addSmoothCrown(head, hairMat, { scaleX: 1.12, scaleY: 1.08, scaleZ: 1.16, y: 0.06 });
    addBangs(head, hairMat, "curtain");
    for (let i = 0; i < 20; i += 1) {
      const a = -1.45 + (i / 19) * 2.9;
      const matUse = i % 2 ? hairMat : darkMat;
      addHairLock(
        head,
        matUse,
        Math.sin(a) * 0.15,
        -0.12 - (i % 4) * 0.03,
        Math.cos(a) * 0.1 - 0.06,
        0.45 + (i % 4) * 0.05,
        0.018,
        Math.sin(a) * 0.35,
        0.28
      );
    }
    const fall = mesh(new THREE.CapsuleGeometry(0.1, 0.52, 6, 12), hairMat);
    fall.position.set(0, -0.3, -0.14);
    fall.scale.set(1.4, 1, 0.7);
    fall.rotation.x = 0.18;
    head.add(fall);
  } else if (character.id === "lavender") {
    // Soft blonde curls
    addSmoothCrown(head, hairMat, { scaleX: 1.22, scaleY: 1.12, scaleZ: 1.24, y: 0.06 });
    const volume = mesh(new THREE.SphereGeometry(0.165, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.68), darkMat);
    volume.position.set(0, 0.02, -0.03);
    volume.scale.set(1.3, 1.15, 1.25);
    head.add(volume);
    for (let i = 0; i < 18; i += 1) {
      const a = -1.4 + (i / 17) * 2.8;
      const matUse = i % 2 ? hairMat : darkMat;
      addHairLock(
        head,
        matUse,
        Math.sin(a) * 0.17,
        -0.04 - (i % 4) * 0.025,
        Math.cos(a) * 0.12 - 0.03,
        0.24 + (i % 3) * 0.04,
        0.024,
        Math.sin(a) * 0.38,
        0.28
      );
    }
    addBangs(head, hairMat, "soft");
  } else if (character.id === "lupin") {
    // Medium sandy, slightly greying / unkempt
    addSmoothCrown(head, hairMat, { scaleX: 1.08, scaleY: 1.02, scaleZ: 1.1, y: 0.05 });
    for (let i = 0; i < 14; i += 1) {
      const a = -1.2 + (i / 13) * 2.4;
      const matUse = i % 3 === 0 ? darkMat : hairMat;
      addHairLock(
        head,
        matUse,
        Math.sin(a) * 0.13,
        0.02 - (i % 3) * 0.02,
        Math.cos(a) * 0.1 - 0.02,
        0.16 + (i % 3) * 0.03,
        0.018,
        Math.sin(a) * 0.22,
        0.05
      );
    }
    addBangs(head, hairMat, "soft");
  } else if (character.id === "dumbledore") {
    // Long silver-white hair
    addSmoothCrown(head, hairMat, { scaleX: 1.14, scaleY: 1.1, scaleZ: 1.18, y: 0.06 });
    addBangs(head, hairMat, "curtain");
    for (let i = 0; i < 22; i += 1) {
      const a = -1.5 + (i / 21) * 3.0;
      const matUse = i % 2 ? hairMat : darkMat;
      addHairLock(
        head,
        matUse,
        Math.sin(a) * 0.15,
        -0.14 - (i % 5) * 0.03,
        Math.cos(a) * 0.1 - 0.06,
        0.5 + (i % 4) * 0.05,
        0.017,
        Math.sin(a) * 0.32,
        0.25
      );
    }
    const fall = mesh(new THREE.CapsuleGeometry(0.11, 0.55, 6, 12), hairMat);
    fall.position.set(0, -0.32, -0.15);
    fall.scale.set(1.5, 1, 0.7);
    fall.rotation.x = 0.18;
    head.add(fall);
  } else if (character.id === "ron") {
    addSmoothCrown(head, hairMat, { scaleX: 1.05, scaleY: 1.0, scaleZ: 1.08, y: 0.05 });
    for (let i = 0; i < 7; i += 1) {
      const a = -0.9 + i * 0.3;
      addHairLock(head, hairMat, Math.sin(a) * 0.12, 0.08, Math.cos(a) * 0.1, 0.08, 0.02, a * 0.15, -0.35);
    }
  } else {
    // Harry — short messy locks
    addSmoothCrown(head, hairMat, { scaleX: 1.04, scaleY: 1.0, scaleZ: 1.06, y: 0.04 });
    for (let i = 0; i < 9; i += 1) {
      const a = (i / 9) * Math.PI * 1.5 - 0.75;
      addHairLock(head, hairMat, Math.sin(a) * 0.11, 0.1, Math.cos(a) * 0.1, 0.07, 0.016, a * 0.2, -0.55);
    }
  }
}

function addBeard(head, character) {
  if (character.id !== "dumbledore" && character.id !== "sirius") return;
  const hairMat = mat(character.hair, { roughness: 0.78, envMapIntensity: 0.4 });
  const darkMat = mat(
    new THREE.Color(character.hair).multiplyScalar(0.75).getHex(),
    { roughness: 0.85, envMapIntensity: 0.3 }
  );
  if (character.id === "dumbledore") {
    // Long flowing beard
    const chin = mesh(new THREE.CapsuleGeometry(0.06, 0.2, 6, 10), hairMat);
    chin.position.set(0, -0.14, 0.1);
    chin.rotation.x = 0.35;
    chin.scale.set(1.2, 1, 0.85);
    head.add(chin);
    for (let i = 0; i < 10; i += 1) {
      const x = -0.08 + i * 0.018;
      addHairLock(head, i % 2 ? hairMat : darkMat, x, -0.2 - (i % 3) * 0.04, 0.08 + Math.abs(x) * 0.2, 0.35 + (i % 4) * 0.04, 0.016, x * 0.4, 0.85);
    }
    const tip = mesh(new THREE.CapsuleGeometry(0.04, 0.28, 5, 8), hairMat);
    tip.position.set(0, -0.42, 0.14);
    tip.rotation.x = 0.55;
    tip.scale.set(1.1, 1, 0.7);
    head.add(tip);
  } else {
    // Sirius — short scruff
    for (let i = 0; i < 8; i += 1) {
      const a = -0.7 + i * 0.2;
      addHairLock(head, hairMat, Math.sin(a) * 0.08, -0.12, 0.12 + Math.cos(a) * 0.02, 0.08, 0.012, a * 0.15, 0.9);
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

  // Simple robe drape down the back — no high collar behind the head
  const cloakMat = mat(character.robe, { roughness: 0.8, side: THREE.DoubleSide, envMapIntensity: 0.4 });
  const cloak = mesh(new THREE.PlaneGeometry(0.55, 0.85), cloakMat);
  cloak.position.set(0, -0.15, -0.2);
  cloak.rotation.x = 0.12;

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
  addBeard(head, character);

  // Ears
  for (const x of [-0.14, 0.14]) {
    const ear = mesh(new THREE.SphereGeometry(0.035, 8, 6), mat(character.skin, { roughness: 0.55 }));
    ear.position.set(x, 0, 0);
    ear.scale.set(0.6, 1, 0.5);
    head.add(ear);
  }

  const eyeWhite = mat(0xf2f0ea, { roughness: 0.35 });
  const irisHex =
    character.id === "harry"
      ? 0x3a6a40
      : character.id === "bellatrix"
        ? 0x2a1a28
        : character.id === "dumbledore"
          ? 0x4a6a8a
          : 0x3a4a6a;
  const irisMat = mat(irisHex, { roughness: 0.25 });
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

  if (character.id === "harry" || character.id === "dumbledore") {
    const rim = mat(character.id === "dumbledore" ? 0xc9a227 : 0x1a1a1a, {
      metalness: 0.85,
      roughness: 0.25,
    });
    const r = character.id === "dumbledore" ? 0.042 : 0.038;
    for (const x of [-0.05, 0.05]) {
      const glasses = mesh(new THREE.TorusGeometry(r, 0.006, 8, 16), rim);
      glasses.position.set(x, 0.02, 0.145);
      // Half-moon tilt for Dumbledore
      if (character.id === "dumbledore") glasses.rotation.x = 0.35;
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
