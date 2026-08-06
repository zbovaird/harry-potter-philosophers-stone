import * as THREE from "three";

const _to = new THREE.Vector3();
const _playerLocal = new THREE.Vector3();

/** Returns true if Protego is currently active. */
export function hasShield(game) {
  return Boolean(game.caster && game.caster.shieldUntil > game.time);
}

/**
 * Chase boss with wind-up telegraph; Protego blocks the strike.
 */
export function tickBoss(game, enemy, origin, delta, time, opts = {}) {
  const {
    meleeRange = 2,
    chaseRange = 22,
    baseDamage = 14,
    windupTime = 0.7,
    attackCooldown = 1.4,
    phase2Hp = 0.5,
    phase2SpeedMul = 1.35,
    phase2DamageMul = 1.25,
    canAct = true,
    name = "Enemy",
  } = opts;

  if (!enemy.alive) return;

  enemy.phase = enemy.hp / enemy.maxHp <= phase2Hp ? 2 : 1;
  enemy.stun = Math.max(0, enemy.stun - delta);
  enemy.slow = Math.max(0, enemy.slow - delta);
  enemy.attackCd = Math.max(0, enemy.attackCd - delta);

  if (!canAct) {
    enemy.root.rotation.y = time * 0.3;
    return;
  }
  if (enemy.stun > 0) {
    enemy.root.scale.setScalar(1);
    enemy.winding = false;
    return;
  }

  _playerLocal.copy(game.player.root.position).sub(origin);
  _to.copy(_playerLocal).sub(enemy.root.position);
  _to.y = 0;
  const dist = _to.length();
  const speedMul = (enemy.phase === 2 ? phase2SpeedMul : 1) * (enemy.slow > 0 ? 0.4 : 1);
  const dmg = baseDamage * (enemy.phase === 2 ? phase2DamageMul : 1);

  if (enemy.winding) {
    enemy.windup -= delta;
    enemy.root.scale.setScalar(1.08 + Math.sin(time * 22) * 0.05);
    if (enemy.windup <= 0) {
      enemy.winding = false;
      enemy.windup = 0;
      enemy.root.scale.setScalar(1);
      enemy.attackCd = attackCooldown;
      if (hasShield(game)) {
        game.showMessage("Protego holds!");
        game.fx.addTrauma(0.15);
        return;
      }
      if (dist <= meleeRange + 0.75 && game.combat?.alive) {
        const dealt = game.combat.damage(dmg);
        if (dealt > 0) {
          game.audio.hurt();
          game.fx.addTrauma(0.5);
          game.fx.flashDamage(0.95);
        }
      }
    }
    return;
  }

  enemy.root.scale.setScalar(1);

  if (dist > meleeRange && dist < chaseRange) {
    _to.normalize();
    enemy.root.position.addScaledVector(_to, enemy.speed * speedMul * delta);
    enemy.root.rotation.y = Math.atan2(_to.x, _to.z);
    enemy.root.position.y = Math.sin(time * 4) * 0.05;
  } else if (dist <= meleeRange && enemy.attackCd <= 0 && game.combat?.alive) {
    enemy.winding = true;
    enemy.windup = windupTime;
    game.showMessage(`${name} winds up — Protego!`, 0.85);
  }
}
