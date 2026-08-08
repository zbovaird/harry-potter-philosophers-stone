import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { FXAAShader } from "three/addons/shaders/FXAAShader.js";

const VignetteShader = {
  uniforms: {
    tDiffuse: { value: null },
    strength: { value: 0.38 },
    softness: { value: 0.65 },
    damage: { value: 0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float strength;
    uniform float softness;
    uniform float damage;
    varying vec2 vUv;
    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      float dist = distance(vUv, vec2(0.5));
      float vig = smoothstep(0.8, 0.8 - softness, dist * (1.0 + strength));
      color.rgb *= mix(0.68, 1.0, vig);
      float edge = smoothstep(0.32, 0.72, dist);
      color.rgb = mix(color.rgb, vec3(0.45, 0.02, 0.02), edge * damage);
      gl_FragColor = color;
    }
  `,
};

export class FxPipeline {
  constructor(renderer, scene, camera) {
    this.renderer = renderer;
    this.composer = new EffectComposer(renderer);
    this.composer.addPass(new RenderPass(scene, camera));

    this.bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.28, 0.48, 0.82);
    this.composer.addPass(this.bloomPass);

    this.vignettePass = new ShaderPass(VignetteShader);
    this.composer.addPass(this.vignettePass);

    this.composer.addPass(new OutputPass());

    this.fxaaPass = new ShaderPass(FXAAShader);
    this.composer.addPass(this.fxaaPass);

    this.trauma = 0;
    this.shakeOffset = new THREE.Vector3();
    this.shakeRoll = 0;
    this.damageFlash = 0;
    this.lowHealthLevel = 0;
  }

  setSize(width, height, pixelRatio) {
    this.composer.setSize(width, height);
    this.fxaaPass.material.uniforms.resolution.value.set(
      1 / (width * pixelRatio),
      1 / (height * pixelRatio)
    );
  }

  setBloom(strength, radius = 0.42, threshold = 0.9) {
    this.bloomPass.strength = strength;
    this.bloomPass.radius = radius;
    this.bloomPass.threshold = threshold;
  }

  addTrauma(amount) {
    this.trauma = Math.min(1, this.trauma + amount);
  }

  flashDamage(amount = 0.85) {
    this.damageFlash = Math.min(1, amount);
  }

  setLowHealth(level) {
    this.lowHealthLevel = THREE.MathUtils.clamp(level, 0, 1);
  }

  update(delta, time) {
    this.trauma = Math.max(0, this.trauma - delta * 1.7);
    const shake = this.trauma * this.trauma;
    if (shake > 0.0001) {
      this.shakeOffset.set(
        (Math.sin(time * 47.3) + Math.sin(time * 23.1)) * 0.055 * shake,
        (Math.sin(time * 51.7) + Math.sin(time * 29.3)) * 0.045 * shake,
        0
      );
      this.shakeRoll = Math.sin(time * 39.7) * 0.02 * shake;
    } else {
      this.shakeOffset.set(0, 0, 0);
      this.shakeRoll = 0;
    }

    this.damageFlash = Math.max(0, this.damageFlash - delta * 2.4);
    const damageAmount = Math.max(
      this.damageFlash * 0.8,
      this.lowHealthLevel * (0.3 + Math.sin(time * 2.6) * 0.1)
    );
    this.vignettePass.uniforms.damage.value = damageAmount;
  }

  render() {
    this.composer.render();
  }
}

/**
 * Spell projectiles without per-bolt PointLights.
 * Adding/removing lights on each cast forces Three.js to recompile every
 * MeshStandardMaterial (NUM_POINT_LIGHTS changes) and freezes the browser tab.
 */
export class SpellBolt {
  constructor(scene) {
    this.scene = scene;
    this.active = [];
    this._geo = new THREE.SphereGeometry(1, 8, 8);
    this._mats = new Map();
    this._tmpHit = new THREE.Vector3();
  }

  _material(color) {
    const key = color >>> 0;
    let mat = this._mats.get(key);
    if (!mat) {
      mat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
      });
      this._mats.set(key, mat);
    }
    return mat;
  }

  spawn({ origin, direction, color, speed = 34, life = 2.8, radius = 0.12, spellId, damage = 0, onHit }) {
    const mesh = new THREE.Mesh(this._geo, this._material(color));
    mesh.scale.setScalar(radius);
    mesh.position.copy(origin);
    this.scene.add(mesh);

    this.active.push({
      mesh,
      velocity: direction.clone().normalize().multiplyScalar(speed),
      life,
      maxLife: life,
      spellId,
      damage,
      radius,
      onHit,
    });
  }

  update(delta, targets = []) {
    const hits = [];
    for (let i = this.active.length - 1; i >= 0; i -= 1) {
      const bolt = this.active[i];
      bolt.life -= delta;
      bolt.mesh.position.addScaledVector(bolt.velocity, delta);
      bolt.mesh.material.opacity = Math.max(0.15, bolt.life / bolt.maxLife);

      let hitSomething = false;
      for (const target of targets) {
        if (!target.alive || !target.root) continue;
        this._tmpHit.copy(target.root.position);
        this._tmpHit.y += 1;
        const dist = bolt.mesh.position.distanceTo(this._tmpHit);
        if (dist < (target.hitRadius || 0.8) + bolt.radius) {
          hits.push({ bolt, target });
          hitSomething = true;
          break;
        }
      }

      if (hitSomething || bolt.life <= 0 || bolt.mesh.position.y < -2) {
        this.scene.remove(bolt.mesh);
        // Shared geo/materials — do not dispose per bolt
        this.active.splice(i, 1);
      }
    }
    return hits;
  }

  clear() {
    for (const bolt of this.active) {
      this.scene.remove(bolt.mesh);
    }
    this.active.length = 0;
  }
}
