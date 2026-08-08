import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { FXAAShader } from "three/addons/shaders/FXAAShader.js";
import { getSpellVfxProfile } from "./spellVfx.js";

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
    this.composer.setPixelRatio(Math.min(renderer.getPixelRatio(), 1));
    this.composer.addPass(new RenderPass(scene, camera));

    this.bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.28, 0.45, 0.82);
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
    const pr = Math.min(pixelRatio || 1, 1);
    this.composer.setPixelRatio(pr);
    this.composer.setSize(width, height);
    this.fxaaPass.material.uniforms.resolution.value.set(1 / (width * pr), 1 / (height * pr));
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

const _hitPos = new THREE.Vector3();
const _trailPos = new THREE.Vector3();

export class SpellBolt {
  constructor(scene) {
    this.scene = scene;
    this.active = [];
    this._geo = new THREE.SphereGeometry(1, 10, 10);
    this._glowGeo = new THREE.SphereGeometry(1, 8, 8);
    this._coreMats = new Map();
    this._glowMats = new Map();
    this.onImpact = null;
  }

  _coreMaterial(color, emissiveMul = 1) {
    const key = `${color >>> 0}_${emissiveMul}`;
    let mat = this._coreMats.get(key);
    if (!mat) {
      mat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.98,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      mat.userData.shared = true;
      this._coreMats.set(key, mat);
    }
    return mat;
  }

  _glowMaterial(color) {
    const key = color >>> 0;
    let mat = this._glowMats.get(key);
    if (!mat) {
      mat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      mat.userData.shared = true;
      this._glowMats.set(key, mat);
    }
    return mat;
  }

  _makeTrail(count, color) {
    const max = Math.max(6, count);
    const positions = new Float32Array(max * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color,
      size: 0.09,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    mat.userData.shared = false;
    const points = new THREE.Points(geo, mat);
    return { points, positions, max, head: 0, filled: 0 };
  }

  spawn({ origin, direction, color, speed = 34, life = 2.8, radius = 0.12, spellId, spell, damage = 0, onHit }) {
    const profile = getSpellVfxProfile(spell || { id: spellId });
    const emissive = profile.emissive || 1;
    const group = new THREE.Group();
    group.position.copy(origin);

    const core = new THREE.Mesh(this._geo, this._coreMaterial(color, emissive));
    core.scale.setScalar(radius * 0.85);
    group.add(core);

    const glow = new THREE.Mesh(this._glowGeo, this._glowMaterial(color));
    glow.scale.setScalar(radius * profile.glow * 1.8);
    group.add(glow);

    const trail = this._makeTrail(profile.trail, color);
    group.add(trail.points);

    this.scene.add(group);

    this.active.push({
      group,
      core,
      glow,
      trail,
      velocity: direction.clone().normalize().multiplyScalar(speed),
      life,
      maxLife: life,
      spellId,
      spell,
      profile,
      color,
      damage,
      radius,
      onHit,
      wobble: Math.random() * Math.PI * 2,
    });
  }

  _pushTrail(bolt) {
    const { trail, group } = bolt;
    const idx = trail.head % trail.max;
    group.getWorldPosition(_trailPos);
    trail.positions[idx * 3] = _trailPos.x + (Math.random() - 0.5) * 0.04;
    trail.positions[idx * 3 + 1] = _trailPos.y + (Math.random() - 0.5) * 0.04;
    trail.positions[idx * 3 + 2] = _trailPos.z + (Math.random() - 0.5) * 0.04;
    trail.head += 1;
    trail.filled = Math.min(trail.max, trail.filled + 1);
    trail.points.geometry.attributes.position.needsUpdate = true;
  }

  update(delta, targets = [], time = 0) {
    const hits = [];
    const expired = [];

    for (let i = this.active.length - 1; i >= 0; i -= 1) {
      const bolt = this.active[i];
      bolt.life -= delta;
      bolt.group.position.addScaledVector(bolt.velocity, delta);

      const lifeT = bolt.life / bolt.maxLife;
      bolt.core.material.opacity = Math.max(0.2, lifeT);
      bolt.glow.material.opacity = Math.max(0.12, lifeT * 0.45);
      bolt.glow.scale.setScalar(bolt.radius * bolt.profile.glow * (1.6 + Math.sin(time * 18 + bolt.wobble) * 0.15));

      this._pushTrail(bolt);

      let hitSomething = false;
      let hitTarget = null;
      for (const target of targets) {
        if (!target.alive || !target.root) continue;
        target.root.getWorldPosition(_hitPos);
        _hitPos.y += target.hitHeight ?? 1.1;
        const dist = bolt.group.position.distanceTo(_hitPos);
        if (dist < (target.hitRadius || 1.6) + bolt.radius) {
          hits.push({ bolt, target, hitPos: _hitPos.clone() });
          hitSomething = true;
          hitTarget = target;
          break;
        }
      }

      if (hitSomething || bolt.life <= 0 || bolt.group.position.y < -2) {
        const endPos = bolt.group.position.clone();
        if (hitSomething && hitTarget) {
          endPos.copy(_hitPos);
        }
        if (bolt.life <= 0 && !hitSomething) {
          expired.push({ bolt, hitPos: endPos });
        }
        this.scene.remove(bolt.group);
        this.active.splice(i, 1);
      }
    }
    return { hits, expired };
  }

  clear() {
    for (const bolt of this.active) {
      this.scene.remove(bolt.group);
    }
    this.active.length = 0;
  }
}

const _playerHit = new THREE.Vector3();

/** Hostile curse bolts (Quirrell → player). */
export class EnemySpellBolt {
  constructor(scene) {
    this.scene = scene;
    this.active = [];
    this._geo = new THREE.SphereGeometry(1, 8, 8);
    this._mat = new THREE.MeshBasicMaterial({
      color: 0x66ff66,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }

  spawn({ origin, direction, color = 0x66ff66, speed = 18, life = 2.2, radius = 0.18, onPlayerHit }) {
    const group = new THREE.Group();
    group.position.copy(origin);
    const core = new THREE.Mesh(this._geo, this._mat.clone());
    core.material.color.setHex(color);
    core.scale.setScalar(radius);
    group.add(core);
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(1, 6, 6),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    glow.scale.setScalar(radius * 2.2);
    group.add(glow);
    this.scene.add(group);
    this.active.push({
      group,
      core,
      glow,
      velocity: direction.clone().normalize().multiplyScalar(speed),
      life,
      maxLife: life,
      radius,
      onPlayerHit,
      color,
    });
  }

  update(delta, playerRoot, hitRadius = 0.55) {
    if (!playerRoot) return;
    playerRoot.getWorldPosition(_playerHit);
    _playerHit.y += 0.95;
    for (let i = this.active.length - 1; i >= 0; i -= 1) {
      const bolt = this.active[i];
      bolt.life -= delta;
      bolt.group.position.addScaledVector(bolt.velocity, delta);
      const lifeT = bolt.life / bolt.maxLife;
      bolt.core.material.opacity = Math.max(0.2, lifeT);
      bolt.glow.material.opacity = Math.max(0.1, lifeT * 0.4);

      const dist = bolt.group.position.distanceTo(_playerHit);
      const expired = bolt.life <= 0 || bolt.group.position.y < -2;
      if (dist < hitRadius + bolt.radius) {
        bolt.onPlayerHit?.(bolt.group.position.clone());
        this.scene.remove(bolt.group);
        this.active.splice(i, 1);
      } else if (expired) {
        this.scene.remove(bolt.group);
        this.active.splice(i, 1);
      }
    }
  }

  clear() {
    for (const bolt of this.active) this.scene.remove(bolt.group);
    this.active.length = 0;
  }
}
