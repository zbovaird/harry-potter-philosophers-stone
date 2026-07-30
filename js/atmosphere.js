import * as THREE from "three";
import { Sky } from "three/addons/objects/Sky.js";

const PRESETS = {
  diagon: {
    sky: true,
    elevation: 18,
    azimuth: 165,
    turbidity: 4.5,
    rayleigh: 1.8,
    mieCoefficient: 0.006,
    mieDirectionalG: 0.82,
    fog: { color: 0xa89878, density: 0.011 },
    exposure: 0.68,
    sunIntensity: 2.1,
    sunColor: 0xffd0a0,
    hemi: 0.42,
    bloom: 0.34,
  },
  greatHall: {
    sky: false,
    background: 0x0c1018,
    fog: { color: 0x1a1520, density: 0.018 },
    exposure: 0.68,
    sunIntensity: 0.35,
    sunColor: 0xffd8a0,
    hemi: 0.28,
    bloom: 0.28,
  },
  bathroom: {
    sky: false,
    background: 0x0a1014,
    fog: { color: 0x121820, density: 0.022 },
    exposure: 0.7,
    sunIntensity: 0.25,
    sunColor: 0xa8c0d0,
    hemi: 0.22,
    bloom: 0.18,
  },
  forest: {
    sky: true,
    elevation: 4,
    azimuth: 200,
    turbidity: 8,
    rayleigh: 1.8,
    mieCoefficient: 0.01,
    mieDirectionalG: 0.7,
    fog: { color: 0x1a2218, density: 0.028 },
    exposure: 0.42,
    sunIntensity: 0.55,
    sunColor: 0x8899aa,
    hemi: 0.2,
    bloom: 0.15,
  },
  dungeon: {
    sky: false,
    background: 0x06080a,
    fog: { color: 0x0c1014, density: 0.03 },
    exposure: 0.72,
    sunIntensity: 0.18,
    sunColor: 0x8899aa,
    hemi: 0.12,
    bloom: 0.22,
  },
  quirrell: {
    sky: false,
    background: 0x08060a,
    fog: { color: 0x140c10, density: 0.025 },
    exposure: 0.75,
    sunIntensity: 0.4,
    sunColor: 0xff6644,
    hemi: 0.18,
    bloom: 0.35,
  },
};

export class Atmosphere {
  constructor(scene, renderer) {
    this.scene = scene;
    this.renderer = renderer;
    this.sky = new Sky();
    this.sky.scale.setScalar(430);
    this.sky.visible = false;
    scene.add(this.sky);
    this.sunDirection = new THREE.Vector3(0, 1, 0);
    this.current = "diagon";
  }

  follow(camera) {
    if (this.sky.visible) this.sky.position.copy(camera.position);
  }

  apply(levelId, { sun, hemi, fx } = {}) {
    const preset = PRESETS[levelId] || PRESETS.diagon;
    this.current = levelId;

    if (preset.sky) {
      this.sky.visible = true;
      const uniforms = this.sky.material.uniforms;
      uniforms.turbidity.value = preset.turbidity;
      uniforms.rayleigh.value = preset.rayleigh;
      uniforms.mieCoefficient.value = preset.mieCoefficient;
      uniforms.mieDirectionalG.value = preset.mieDirectionalG;

      const phi = THREE.MathUtils.degToRad(90 - preset.elevation);
      const theta = THREE.MathUtils.degToRad(preset.azimuth);
      this.sunDirection.setFromSphericalCoords(1, phi, theta);
      uniforms.sunPosition.value.copy(this.sunDirection);
      this.scene.background = null;
    } else {
      this.sky.visible = false;
      this.scene.background = new THREE.Color(preset.background ?? 0x000000);
      this.sunDirection.set(0.25, 1, 0.35).normalize();
    }

    this.scene.fog = new THREE.FogExp2(preset.fog.color, preset.fog.density);
    this.renderer.toneMappingExposure = preset.exposure;

    if (sun) {
      sun.intensity = preset.sunIntensity;
      sun.color.setHex(preset.sunColor);
      sun.position.copy(this.sunDirection).multiplyScalar(60);
    }
    if (hemi) hemi.intensity = preset.hemi;
    if (fx) fx.setBloom(preset.bloom ?? 0.22);

    return preset;
  }
}
