export class CombatState {
  constructor(stats) {
    this.maxHp = stats.maxHp;
    this.hp = stats.maxHp;
    this.maxMana = stats.maxMana;
    this.mana = stats.maxMana;
    this.damageMul = stats.damage;
    this.castCooldownMul = stats.castCooldown;
    this.moveSpeedMul = stats.moveSpeed;
    this.aimAssist = stats.aimAssist;
    this.alive = true;
    this.invuln = 0;
  }

  regenMana(delta) {
    this.mana = Math.min(this.maxMana, this.mana + 12 * delta);
  }

  spendMana(amount) {
    if (this.mana < amount) return false;
    this.mana -= amount;
    return true;
  }

  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  damage(amount) {
    if (this.invuln > 0 || !this.alive) return 0;
    this.hp = Math.max(0, this.hp - amount);
    this.invuln = 0.35;
    if (this.hp <= 0) {
      this.alive = false;
    }
    return amount;
  }

  tick(delta) {
    this.invuln = Math.max(0, this.invuln - delta);
    this.regenMana(delta);
  }
}

export function createEnemy({
  root,
  hp = 80,
  damage = 12,
  hitRadius = 1.6,
  hitHeight = 1.1,
  name = "Enemy",
  speed = 2.2,
}) {
  return {
    root,
    hp,
    maxHp: hp,
    damage,
    hitRadius,
    hitHeight,
    name,
    speed,
    alive: true,
    stun: 0,
    slow: 0,
    attackCd: 0,
  };
}

export function applySpellEffect(enemy, spell, damageMul = 1) {
  if (!enemy.alive) return;
  const dmg = (spell.damage || 0) * damageMul;
  if (dmg > 0) {
    enemy.hp -= dmg;
  }
  switch (spell.effect) {
    case "stun":
    case "paralyze":
    case "tickle":
      enemy.stun = Math.max(enemy.stun, 1.6);
      break;
    case "slow":
    case "confuse":
      enemy.slow = Math.max(enemy.slow, 2.5);
      break;
    case "knockback":
      enemy.stun = Math.max(enemy.stun, 0.4);
      break;
    case "disarm":
      enemy.stun = Math.max(enemy.stun, 1.0);
      break;
    case "kill":
      enemy.hp = 0;
      break;
    default:
      break;
  }
  if (enemy.hp <= 0) {
    enemy.alive = false;
    enemy.hp = 0;
  }
}
