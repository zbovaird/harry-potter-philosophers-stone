import * as THREE from "three";
import { HP_GLB } from "./assets.js";

/** Per-spell visual tuning — derived from id/effect when not listed. */
export const SPELL_VFX_PROFILES = {
  expelliarmus: { trail: 14, glow: 1.6, impact: "spark", castFlash: 1.2 },
  stupefy: { trail: 16, glow: 1.8, impact: "spark", castFlash: 1.4 },
  incendio: { trail: 22, glow: 2.2, impact: "fire", castFlash: 1.6, emissive: 1.8 },
  bombarda: { trail: 18, glow: 2.4, impact: "shockwave", castFlash: 2.0, emissive: 2.2 },
  avada: { trail: 20, glow: 2.8, impact: "smoke", castFlash: 2.2, emissive: 2.5 },
  patronus: { trail: 28, glow: 2.0, impact: "silver", castFlash: 1.8, emissive: 2.0 },
  protego: { shield: true },
  crucio: { beam: true, castFlash: 1.5 },
  lumos: { castFlash: 1.0 },
};

export function getSpellVfxProfile(spell) {
  const base = { trail: 12, glow: 1.4, impact: "spark", castFlash: 1.0, emissive: 1.0 };
  if (!spell?.id) return base;
  return { ...base, ...(SPELL_VFX_PROFILES[spell.id] || {}) };
}

const _color = new THREE.Color();
const _pos = new THREE.Vector3();

/** Wand flash, impacts, shields, beams, explosions — pooled where cheap. */
export class SpellVfxSystem {
  constructor(scene, assets = null) {
    this.scene = scene;
    this.assets = assets;
    this.impacts = [];
    this.flashes = [];
    this.beams = [];
    this.shields = [];
    this.rings = [];
    this._impactRingTemplate = null;
    this._protegoTemplate = null;
    this._patronusTemplate = null;
    this._castLightPool = [];
    this.patronusBursts = [];
  }

  async preload() {
    if (!this.assets) return;
    await this.assets.preload([
      HP_GLB.spellImpactRing,
      HP_GLB.protegoDome,
      HP_GLB.patronusStag,
    ]);
    this._impactRingTemplate = this.assets.cloneScene(HP_GLB.spellImpactRing);
    this._protegoTemplate = this.assets.cloneScene(HP_GLB.protegoDome);
    this._patronusTemplate = this.assets.cloneScene(HP_GLB.patronusStag);
  }

  clear() {
    for (const fx of [...this.impacts, ...this.flashes, ...this.beams, ...this.shields, ...this.rings]) {
      this.scene.remove(fx.root);
      fx.root.traverse((o) => {
        if (o.geometry && !o.geometry.userData?.shared) o.geometry.dispose();
        if (o.material && !o.material.userData?.shared) o.material.dispose();
      });
    }
    this.impacts.length = 0;
    this.flashes.length = 0;
    this.beams.length = 0;
    this.shields.length = 0;
    this.rings.length = 0;
    this.patronusBursts.length = 0;
  }

  castFlash(origin, color, intensity = 1.0) {
    const root = new THREE.Group();
    root.position.copy(origin);

    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 8, 8),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    root.add(core);

    const light = this._borrowCastLight();
    light.color.setHex(color);
    light.intensity = 2.4 * intensity;
    light.distance = 6;
    root.add(light);

    this.scene.add(root);
    this.flashes.push({ root, core, light, life: 0.18, maxLife: 0.18 });
  }

  _borrowCastLight() {
    const existing = this._castLightPool.find((l) => !l.parent);
    if (existing) return existing;
    const light = new THREE.PointLight(0xffffff, 1, 4);
    this._castLightPool.push(light);
    return light;
  }

  spawnImpact(position, color, type = "spark", scale = 1) {
    const root = new THREE.Group();
    root.position.copy(position);

    if (this._impactRingTemplate && (type === "spark" || type === "silver" || type === "shockwave")) {
      const ring = this._impactRingTemplate.clone(true);
      ring.scale.setScalar(0.15 * scale);
      ring.traverse((o) => {
        if (o.isMesh && o.material) {
          o.material = o.material.clone();
          o.material.color?.setHex(color);
          o.material.emissive?.setHex(color);
          o.material.transparent = true;
          o.material.opacity = 0.85;
          o.material.depthWrite = false;
          if (o.material.blending !== undefined) o.material.blending = THREE.AdditiveBlending;
        }
      });
      root.add(ring);
    } else {
      const geo = new THREE.RingGeometry(0.05, 0.22 * scale, 24);
      const mat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      root.add(new THREE.Mesh(geo, mat));
    }

    const burstCount = type === "fire" ? 24 : type === "shockwave" ? 18 : 12;
    const positions = new Float32Array(burstCount * 3);
    for (let i = 0; i < burstCount; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * 0.5 * scale;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 0.5 * scale;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.5 * scale;
    }
    const burstGeo = new THREE.BufferGeometry();
    burstGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const burstMat = new THREE.PointsMaterial({
      color,
      size: type === "fire" ? 0.14 : 0.1,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    const burst = new THREE.Points(burstGeo, burstMat);
    root.add(burst);

    this.scene.add(root);
    this.impacts.push({
      root,
      burst,
      life: type === "shockwave" ? 0.55 : 0.35,
      maxLife: type === "shockwave" ? 0.55 : 0.35,
      type,
      scale,
    });
  }

  spawnBeam(from, to, color, life = 0.35) {
    const dir = _pos.copy(to).sub(from);
    const len = dir.length();
    if (len < 0.01) return;
    dir.normalize();

    const geo = new THREE.CylinderGeometry(0.04, 0.08, len, 8, 1, true);
    geo.translate(0, len / 2, 0);
    geo.rotateX(Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(from);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);

    const inner = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.04, len, 6, 1, true),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      })
    );
    inner.position.copy(from);
    inner.quaternion.copy(mesh.quaternion);
    inner.geometry.translate(0, len / 2, 0);
    inner.geometry.rotateX(Math.PI / 2);

    this.scene.add(mesh, inner);
    this.beams.push({ mesh, inner, life, maxLife: life });
  }

  spawnPatronus(origin, direction) {
    const root = new THREE.Group();
    root.position.copy(origin);

    if (this._patronusTemplate) {
      const stag = this._patronusTemplate.clone(true);
      stag.scale.setScalar(0.55);
      stag.traverse((o) => {
        if (o.isMesh && o.material) {
          o.material = o.material.clone();
          o.material.color?.setHex(0xddeeff);
          o.material.emissive?.setHex(0xaaccff);
          o.material.emissiveIntensity = 1.6;
          o.material.transparent = true;
          o.material.opacity = 0.88;
          o.material.depthWrite = false;
        }
      });
      root.add(stag);
    }

    const mistCount = 48;
    const positions = new Float32Array(mistCount * 3);
    for (let i = 0; i < mistCount; i += 1) {
      positions[i * 3] = direction.x * i * 0.15 + (Math.random() - 0.5) * 0.4;
      positions[i * 3 + 1] = direction.y * i * 0.08 + Math.random() * 0.3;
      positions[i * 3 + 2] = direction.z * i * 0.15 + (Math.random() - 0.5) * 0.4;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const mist = new THREE.Points(
      geo,
      new THREE.PointsMaterial({
        color: 0xeef8ff,
        size: 0.16,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      })
    );
    root.add(mist);

    this.scene.add(root);
    this.patronusBursts.push({
      root,
      mist,
      life: 1.8,
      maxLife: 1.8,
      velocity: direction.clone().multiplyScalar(8),
    });
  }

  spawnExplosion(position, radius, color) {
    this.spawnImpact(position, color, "shockwave", 1 + radius * 0.35);
    const ringGeo = new THREE.RingGeometry(radius * 0.2, radius * 0.95, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.copy(position);
    ring.position.y += 0.05;
    this.scene.add(ring);
    this.rings.push({ mesh: ring, life: 0.5, maxLife: 0.5, expand: radius * 1.4 });
  }

  showShield(playerRoot, duration, color = 0x88aaff, startTime = 0) {
    this.shields = this.shields.filter((s) => {
      if (s.follow !== playerRoot) return true;
      this.scene.remove(s.root);
      return false;
    });

    const root = new THREE.Group();
    if (this._protegoTemplate) {
      const dome = this._protegoTemplate.clone(true);
      dome.scale.setScalar(1.35);
      dome.traverse((o) => {
        if (o.isMesh && o.material) {
          o.material = o.material.clone();
          o.material.color?.setHex(color);
          o.material.emissive?.setHex(color);
          o.material.transparent = true;
          o.material.opacity = 0.35;
          o.material.depthWrite = false;
        }
      });
      root.add(dome);
    } else {
      const geo = new THREE.IcosahedronGeometry(0.95, 2);
      const mat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.28,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        wireframe: false,
      });
      root.add(new THREE.Mesh(geo, mat));
    }

    root.position.set(0, 0.95, 0);
    playerRoot.add(root);
    this.shields.push({ root, follow: playerRoot, until: startTime + duration });
  }

  updateShield(untilTime) {
    this.shields = this.shields.filter((s) => {
      if (untilTime >= s.until) {
        s.follow.remove(s.root);
        return false;
      }
      const pulse = 0.92 + Math.sin(untilTime * 12) * 0.06;
      s.root.scale.setScalar(pulse);
      return true;
    });
  }

  update(delta, time) {
    this.updateShield(time);

    for (let i = this.flashes.length - 1; i >= 0; i -= 1) {
      const fx = this.flashes[i];
      fx.life -= delta;
      const t = fx.life / fx.maxLife;
      fx.core.scale.setScalar(1 + (1 - t) * 2.5);
      fx.core.material.opacity = t * 0.95;
      fx.light.intensity = t * 2.4;
      if (fx.life <= 0) {
        this.scene.remove(fx.root);
        fx.light.intensity = 0;
        this.flashes.splice(i, 1);
      }
    }

    for (let i = this.impacts.length - 1; i >= 0; i -= 1) {
      const fx = this.impacts[i];
      fx.life -= delta;
      const t = fx.life / fx.maxLife;
      fx.root.scale.setScalar(1 + (1 - t) * (fx.type === "shockwave" ? 2.8 : 1.6));
      fx.burst.material.opacity = t * 0.95;
      if (fx.life <= 0) {
        this.scene.remove(fx.root);
        fx.burst.geometry.dispose();
        fx.burst.material.dispose();
        this.impacts.splice(i, 1);
      }
    }

    for (let i = this.beams.length - 1; i >= 0; i -= 1) {
      const fx = this.beams[i];
      fx.life -= delta;
      const t = fx.life / fx.maxLife;
      fx.mesh.material.opacity = t * 0.75;
      fx.inner.material.opacity = t * 0.5;
      if (fx.life <= 0) {
        this.scene.remove(fx.mesh, fx.inner);
        fx.mesh.geometry.dispose();
        fx.inner.geometry.dispose();
        fx.mesh.material.dispose();
        fx.inner.material.dispose();
        this.beams.splice(i, 1);
      }
    }

    for (let i = this.rings.length - 1; i >= 0; i -= 1) {
      const fx = this.rings[i];
      fx.life -= delta;
      const t = fx.life / fx.maxLife;
      const s = 1 + (1 - t) * fx.expand;
      fx.mesh.scale.set(s, s, s);
      fx.mesh.material.opacity = t * 0.65;
      if (fx.life <= 0) {
        this.scene.remove(fx.mesh);
        fx.mesh.geometry.dispose();
        fx.mesh.material.dispose();
        this.rings.splice(i, 1);
      }
    }

    for (let i = this.patronusBursts.length - 1; i >= 0; i -= 1) {
      const fx = this.patronusBursts[i];
      fx.life -= delta;
      fx.root.position.addScaledVector(fx.velocity, delta);
      fx.root.scale.setScalar(1 + (1 - fx.life / fx.maxLife) * 0.6);
      fx.mist.material.opacity = (fx.life / fx.maxLife) * 0.85;
      if (fx.life <= 0) {
        this.scene.remove(fx.root);
        fx.mist.geometry.dispose();
        fx.mist.material.dispose();
        this.patronusBursts.splice(i, 1);
      }
    }
  }
}
