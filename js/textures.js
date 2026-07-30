import * as THREE from "three";

function configure(tex, { color = true, repeat = 2, anisotropy = 16 } = {}) {
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  tex.anisotropy = anisotropy;
  tex.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  return tex;
}

/**
 * High-quality procedural fallbacks when a map fails to load.
 */
export function makeBrickTexture(size = 512) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#6a5040";
  ctx.fillRect(0, 0, size, size);
  const bw = size / 8;
  const bh = size / 16;
  for (let row = 0; row < 18; row += 1) {
    const offset = (row % 2) * (bw * 0.5);
    for (let col = -1; col < 10; col += 1) {
      const x = col * bw + offset;
      const y = row * bh;
      const shade = 90 + Math.floor(Math.random() * 40);
      ctx.fillStyle = `rgb(${shade + 20},${shade - 10},${shade - 25})`;
      ctx.fillRect(x + 2, y + 2, bw - 4, bh - 4);
      // mortar lines
      ctx.strokeStyle = "rgba(180,170,155,0.35)";
      ctx.strokeRect(x + 1, y + 1, bw - 2, bh - 2);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  return configure(tex, { repeat: 2 });
}

export function makeCobbleTexture(size = 512) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#4a4640";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 900; i += 1) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 6 + Math.random() * 14;
    const g = 70 + Math.floor(Math.random() * 50);
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * (0.7 + Math.random() * 0.4), Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fillStyle = `rgb(${g},${g - 4},${g - 12})`;
    ctx.fill();
    ctx.strokeStyle = "rgba(30,28,24,0.45)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  return configure(tex, { repeat: 6 });
}

export function makeSlateRoofTexture(size = 256) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#2a3038";
  ctx.fillRect(0, 0, size, size);
  const rowH = 14;
  for (let y = 0; y < size; y += rowH) {
    const offset = ((y / rowH) % 2) * 18;
    for (let x = -20; x < size; x += 36) {
      const shade = 35 + Math.floor(Math.random() * 25);
      ctx.fillStyle = `rgb(${shade},${shade + 4},${shade + 10})`;
      ctx.fillRect(x + offset, y + 1, 34, rowH - 2);
      ctx.strokeStyle = "rgba(10,12,16,0.5)";
      ctx.strokeRect(x + offset, y + 1, 34, rowH - 2);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  return configure(tex, { repeat: 3 });
}

export class TextureLibrary {
  constructor() {
    this.ready = false;
    this.maps = {};
  }

  async load() {
    if (this.ready) return this.maps;
    const loader = new THREE.TextureLoader();
    const load = (path, opts) =>
      loader
        .loadAsync(path)
        .then((t) => configure(t, opts))
        .catch(() => null);

    const [
      woodMap,
      woodNor,
      stoneMap,
      stoneNor,
      plasterMap,
      thatchMap,
      barkMap,
      barkNor,
    ] = await Promise.all([
      load("assets/textures/wood_diff.jpg", { repeat: 2 }),
      load("assets/textures/wood_nor.jpg", { color: false, repeat: 2 }),
      load("assets/textures/stone_diff.jpg", { repeat: 3 }),
      load("assets/textures/stone_nor.jpg", { color: false, repeat: 3 }),
      load("assets/textures/plaster_diff.jpg", { repeat: 2 }),
      load("assets/textures/thatch_diff.jpg", { repeat: 2 }),
      load("assets/textures/bark_diff.jpg", { repeat: 2 }),
      load("assets/textures/bark_nor.jpg", { color: false, repeat: 2 }),
    ]);

    this.maps = {
      woodMap,
      woodNor,
      stoneMap,
      stoneNor,
      plasterMap,
      thatchMap,
      barkMap,
      barkNor,
      brickMap: makeBrickTexture(512),
      cobbleMap: makeCobbleTexture(512),
      slateMap: makeSlateRoofTexture(256),
    };
    this.ready = true;
    return this.maps;
  }

  cloneMap(key, rx = 2, ry = 2) {
    const src = this.maps[key];
    if (!src) return null;
    const t = src.clone();
    t.needsUpdate = true;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(rx, ry);
    return t;
  }

  wood(rx = 2, ry = 2) {
    const map = this.cloneMap("woodMap", rx, ry);
    const normalMap = this.cloneMap("woodNor", rx, ry);
    return new THREE.MeshStandardMaterial({
      map,
      normalMap,
      roughness: 0.78,
      metalness: 0.04,
      envMapIntensity: 0.65,
      color: map ? 0xffffff : 0x6b4a2a,
    });
  }

  stone(rx = 2, ry = 2, tint = 0xffffff) {
    const map = this.cloneMap("stoneMap", rx, ry);
    const normalMap = this.cloneMap("stoneNor", rx, ry);
    return new THREE.MeshStandardMaterial({
      map,
      normalMap,
      roughness: 0.88,
      metalness: 0.06,
      envMapIntensity: 0.55,
      color: tint,
    });
  }

  plaster(rx = 2, ry = 2, tint = 0xf0e4d0) {
    return new THREE.MeshStandardMaterial({
      map: this.cloneMap("plasterMap", rx, ry),
      roughness: 0.92,
      metalness: 0,
      envMapIntensity: 0.4,
      color: tint,
    });
  }

  brick(rx = 2, ry = 2, tint = 0xffffff) {
    return new THREE.MeshStandardMaterial({
      map: this.cloneMap("brickMap", rx, ry),
      roughness: 0.9,
      metalness: 0.02,
      envMapIntensity: 0.5,
      color: tint,
    });
  }

  cobble(rx = 6, ry = 6) {
    return new THREE.MeshStandardMaterial({
      map: this.cloneMap("cobbleMap", rx, ry),
      roughness: 0.95,
      metalness: 0.03,
      envMapIntensity: 0.45,
      color: 0xc8c4bc,
    });
  }

  slate(rx = 3, ry = 3, tint = 0xffffff) {
    return new THREE.MeshStandardMaterial({
      map: this.cloneMap("slateMap", rx, ry),
      roughness: 0.82,
      metalness: 0.08,
      envMapIntensity: 0.5,
      color: tint,
    });
  }

  thatch(rx = 2, ry = 2) {
    return new THREE.MeshStandardMaterial({
      map: this.cloneMap("thatchMap", rx, ry) || this.cloneMap("slateMap", rx, ry),
      roughness: 0.95,
      metalness: 0,
      envMapIntensity: 0.35,
      color: 0xd4b070,
    });
  }
}
