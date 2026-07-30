import * as THREE from "three";

export function makeNoiseTexture(size = 256, options = {}) {
  const {
    base = [90, 80, 70],
    variance = 28,
    scale = 1,
    dirt = [70, 60, 50],
    dirtChance = 0.14,
  } = options;

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const image = ctx.createImageData(size, size);
  const data = image.data;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const i = (y * size + x) * 4;
      const n =
        (Math.sin(x * 0.11 * scale) * Math.cos(y * 0.09 * scale) +
          Math.sin((x + y) * 0.07 * scale) * 0.5 +
          Math.random()) *
        0.35;
      const useDirt = Math.random() < dirtChance;
      const src = useDirt ? dirt : base;
      data[i] = Math.min(255, Math.max(0, src[0] + n * variance));
      data[i + 1] = Math.min(255, Math.max(0, src[1] + n * variance));
      data[i + 2] = Math.min(255, Math.max(0, src[2] + n * variance * 0.8));
      data[i + 3] = 255;
    }
  }

  ctx.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

export function makeWoodTexture(size = 128) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const image = ctx.createImageData(size, size);
  const data = image.data;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const i = (y * size + x) * 4;
      const grain = Math.sin(x * 0.35 + Math.sin(y * 0.05) * 2) * 18;
      data[i] = 95 + grain;
      data[i + 1] = 62 + grain * 0.7;
      data[i + 2] = 36 + grain * 0.4;
      data[i + 3] = 255;
    }
  }

  ctx.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function makeStoneTexture(size = 256) {
  return makeNoiseTexture(size, {
    base: [78, 74, 70],
    dirt: [58, 54, 50],
    variance: 22,
    dirtChance: 0.2,
    scale: 1.4,
  });
}

export function createEnvMap(renderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();

  const envScene = new THREE.Scene();
  envScene.add(new THREE.HemisphereLight(0xb8c8e0, 0x3a2a1a, 0.9));
  const sun = new THREE.DirectionalLight(0xffe8c8, 1.2);
  sun.position.set(5, 10, 3);
  envScene.add(sun);

  const ground = new THREE.Mesh(
    new THREE.SphereGeometry(8, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5),
    new THREE.MeshBasicMaterial({ color: 0x4a4035 })
  );
  ground.rotation.x = Math.PI;
  envScene.add(ground);

  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(10, 24, 16),
    new THREE.MeshBasicMaterial({ color: 0x6a7a90, side: THREE.BackSide })
  );
  envScene.add(sky);

  const envMap = pmrem.fromScene(envScene, 0.04).texture;
  pmrem.dispose();
  envScene.clear();
  return envMap;
}

export function mat(color, options = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.72,
    metalness: options.metalness ?? 0.06,
    emissive: options.emissive ?? 0x000000,
    emissiveIntensity: options.emissiveIntensity ?? 1,
    map: options.map ?? null,
    envMapIntensity: options.envMapIntensity ?? 0.9,
    flatShading: options.flatShading ?? false,
    transparent: options.transparent ?? false,
    opacity: options.opacity ?? 1,
  });
}

export function mesh(geometry, material, cast = true, receive = true) {
  const m = new THREE.Mesh(geometry, material);
  m.castShadow = cast;
  m.receiveShadow = receive;
  return m;
}
