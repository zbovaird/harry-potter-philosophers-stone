import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export const HP_GLB = {
  hollyWand: "./assets/props/holly_wand.glb",
  ollivanderBox: "./assets/props/ollivander_box.glb",
  flyingKey: "./assets/props/flying_key.glb",
  goldenSnitch: "./assets/props/golden_snitch.glb",
};

/** Playable hero GLBs exported on windows-64gb via tools/blender/build_hp_characters.py */
export function characterGlbUrl(id) {
  return `./assets/characters/${id}.glb`;
}

export class AssetLibrary {
  constructor() {
    this.loader = new GLTFLoader();
    this.cache = new Map();
  }

  async loadOptionalGlb(url) {
    if (this.cache.has(url)) return this.cache.get(url);
    try {
      const gltf = await this.loader.loadAsync(url);
      this.cache.set(url, gltf);
      return gltf;
    } catch {
      this.cache.set(url, null);
      return null;
    }
  }

  async preload(urls) {
    await Promise.all(urls.map((url) => this.loadOptionalGlb(url)));
  }

  getCached(url) {
    return this.cache.get(url) ?? null;
  }

  cloneScene(url) {
    const gltf = this.getCached(url);
    if (!gltf?.scene) return null;
    const root = gltf.scene.clone(true);
    root.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
        if (obj.material) {
          obj.material = obj.material.clone();
        }
      }
    });
    return root;
  }

  findNamed(root, name) {
    let found = null;
    root.traverse((obj) => {
      if (!found && obj.name === name) found = obj;
    });
    return found;
  }

  fitModel(root, targetHeight = 1.7) {
    const box = new THREE.Box3().setFromObject(root);
    const size = new THREE.Vector3();
    box.getSize(size);
    if (size.y < 0.01) return root;
    const scale = targetHeight / size.y;
    root.scale.multiplyScalar(scale);
    return root;
  }

  /**
   * Stand a Blender character up (fix Y-up authorship → glTF) and fit to height.
   * Safe to call on already-correct assets — only rotates when horizontal extent wins.
   */
  normalizeStandingModel(root, targetHeight = 1.7) {
    root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(root);
    const size = new THREE.Vector3();
    box.getSize(size);

    // Sideways on the ground: depth or width longer than height.
    if (size.z >= size.y * 0.95 && size.z >= size.x) {
      root.rotation.x += Math.PI / 2;
    } else if (size.x >= size.y * 0.95 && size.x >= size.z) {
      root.rotation.z += -Math.PI / 2;
    }

    root.updateMatrixWorld(true);
    const box2 = new THREE.Box3().setFromObject(root);
    const size2 = box2.getSize(new THREE.Vector3());
    const height = Math.max(size2.y, 0.01);
    root.scale.multiplyScalar(targetHeight / height);
    root.updateMatrixWorld(true);

    const box3 = new THREE.Box3().setFromObject(root);
    root.position.y -= box3.min.y;
    root.updateMatrixWorld(true);
    return root;
  }
}
