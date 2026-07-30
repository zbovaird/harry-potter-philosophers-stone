import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

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

  fitModel(root, targetHeight = 1.7) {
    const box = new THREE.Box3().setFromObject(root);
    const size = new THREE.Vector3();
    box.getSize(size);
    if (size.y < 0.01) return root;
    const scale = targetHeight / size.y;
    root.scale.multiplyScalar(scale);
    return root;
  }
}
