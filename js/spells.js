/** Full movie-era spell catalog — available from the start. */

export const SPELLS = [
  { id: "expelliarmus", name: "Expelliarmus", key: "1", color: 0xff4444, type: "projectile", damage: 18, mana: 6, cooldown: 0.7, speed: 32, life: 1.5, effect: "disarm" },
  { id: "stupefy", name: "Stupefy", key: "2", color: 0xff2222, type: "projectile", damage: 28, mana: 8, cooldown: 0.9, speed: 30, life: 1.5, effect: "stun" },
  { id: "impedimenta", name: "Impedimenta", key: "3", color: 0x66aaff, type: "projectile", damage: 10, mana: 5, cooldown: 0.8, speed: 28, life: 1.4, effect: "slow" },
  { id: "protego", name: "Protego", key: "4", color: 0x88aaff, type: "self", damage: 0, mana: 6, cooldown: 1.8, speed: 0, life: 0, effect: "shield", duration: 2.8 },
  { id: "leviosa", name: "Wingardium Leviosa", key: "5", color: 0xccddff, type: "utility", damage: 0, mana: 6, cooldown: 1.2, speed: 0, life: 0, effect: "levitate" },
  { id: "petrificus", name: "Petrificus Totalus", key: "6", color: 0xaaccff, type: "projectile", damage: 24, mana: 8, cooldown: 1.0, speed: 28, life: 1.5, effect: "paralyze" },
  { id: "incendio", name: "Incendio", key: "7", color: 0xff6600, type: "projectile", damage: 22, mana: 7, cooldown: 0.85, speed: 24, life: 1.4, effect: "burn" },
  { id: "accio", name: "Accio", key: "8", color: 0xaaddff, type: "utility", damage: 0, mana: 5, cooldown: 1.0, speed: 0, life: 0, effect: "pull" },
  { id: "alohomora", name: "Alohomora", key: "9", color: 0xffeebb, type: "utility", damage: 0, mana: 4, cooldown: 0.8, speed: 0, life: 0, effect: "unlock" },
  { id: "patronus", name: "Expecto Patronum", key: "0", color: 0xddeeff, type: "projectile", damage: 20, mana: 14, cooldown: 3.5, speed: 22, life: 2.0, effect: "patronus" },
  { id: "rictusempra", name: "Rictusempra", key: null, color: 0xffcc66, type: "projectile", damage: 12, mana: 4, cooldown: 0.55, speed: 30, life: 1.3, effect: "tickle" },
  { id: "reducto", name: "Reducto", key: null, color: 0xffaa33, type: "projectile", damage: 30, mana: 10, cooldown: 1.1, speed: 34, life: 1.4, effect: "blast" },
  { id: "bombarda", name: "Bombarda", key: null, color: 0xff8833, type: "aoe", damage: 36, mana: 14, cooldown: 1.6, speed: 22, life: 1.2, effect: "explode", radius: 3.2 },
  { id: "flipendo", name: "Flipendo", key: null, color: 0x88ccff, type: "projectile", damage: 14, mana: 5, cooldown: 0.65, speed: 28, life: 1.3, effect: "knockback" },
  { id: "sectumsempra", name: "Sectumsempra", key: null, color: 0xcc0000, type: "projectile", damage: 42, mana: 16, cooldown: 1.8, speed: 36, life: 1.5, effect: "slash" },
  { id: "avada", name: "Avada Kedavra", key: null, color: 0x22ff44, type: "projectile", damage: 200, mana: 40, cooldown: 8, speed: 40, life: 1.8, effect: "kill", restricted: true },
  { id: "crucio", name: "Crucio", key: null, color: 0x66ff66, type: "beam", damage: 8, mana: 12, cooldown: 3, speed: 0, life: 1.2, effect: "torture", restricted: true },
  { id: "imperio", name: "Imperio", key: null, color: 0x99ff99, type: "projectile", damage: 0, mana: 18, cooldown: 5, speed: 20, life: 1.5, effect: "control", restricted: true },
  { id: "finite", name: "Finite Incantatem", key: null, color: 0xffffff, type: "self", damage: 0, mana: 6, cooldown: 1.5, speed: 0, life: 0, effect: "dispel" },
  { id: "lumos", name: "Lumos", key: null, color: 0xfff5cc, type: "self", damage: 0, mana: 2, cooldown: 0.4, speed: 0, life: 0, effect: "light" },
  { id: "nox", name: "Nox", key: null, color: 0x334455, type: "self", damage: 0, mana: 1, cooldown: 0.3, speed: 0, life: 0, effect: "dark" },
  { id: "reparo", name: "Reparo", key: null, color: 0xbbffcc, type: "utility", damage: 0, mana: 5, cooldown: 1.0, speed: 0, life: 0, effect: "repair" },
  { id: "apparate", name: "Apparate", key: null, color: 0x8866aa, type: "self", damage: 0, mana: 15, cooldown: 6, speed: 0, life: 0, effect: "teleport" },
  { id: "episkey", name: "Episkey", key: null, color: 0xaaeeff, type: "self", damage: 0, mana: 9, cooldown: 3, speed: 0, life: 0, effect: "heal", heal: 30 },
  { id: "rennervate", name: "Rennervate", key: null, color: 0xffeecc, type: "utility", damage: 0, mana: 7, cooldown: 2, speed: 0, life: 0, effect: "revive" },
  { id: "engorgio", name: "Engorgio", key: null, color: 0xffaaee, type: "utility", damage: 0, mana: 6, cooldown: 1.5, speed: 0, life: 0, effect: "enlarge" },
  { id: "reducio", name: "Reducio", key: null, color: 0xeeaaff, type: "utility", damage: 0, mana: 6, cooldown: 1.5, speed: 0, life: 0, effect: "shrink" },
  { id: "silencio", name: "Silencio", key: null, color: 0xccddee, type: "projectile", damage: 4, mana: 5, cooldown: 1.4, speed: 36, life: 4.2, effect: "silence" },
  { id: "confundo", name: "Confundo", key: null, color: 0xffccaa, type: "projectile", damage: 6, mana: 7, cooldown: 1.6, speed: 34, life: 4.2, effect: "confuse" },
  { id: "obliviate", name: "Obliviate", key: null, color: 0xffffff, type: "utility", damage: 0, mana: 10, cooldown: 4, speed: 0, life: 0, effect: "memory", scripted: true },
];

export const HOTBAR_SIZE = 10;

/** Mana per second while not casting — keeps bar topping up without needing a full bar. */
export const MANA_REGEN_PER_SEC = 28;

/** Brief gap between casts (seconds). Mana is the real limiter; this only prevents double-fire glitches. */
export const GLOBAL_CAST_DELAY = 0.12;

export function getSpell(id) {
  return SPELLS.find((s) => s.id === id);
}

export function defaultHotbar() {
  return SPELLS.filter((s) => s.key).slice(0, HOTBAR_SIZE).map((s) => s.id);
}

export class SpellCaster {
  constructor(audio) {
    this.audio = audio;
    this.hotbar = defaultHotbar();
    this.selected = 0;
    this.globalCastLock = 0;
    this.shieldUntil = 0;
    this.lumosOn = false;
    this.lumosLight = null;
  }

  getSelectedSpell() {
    return getSpell(this.hotbar[this.selected]);
  }

  selectIndex(index) {
    if (index < 0 || index >= this.hotbar.length) return;
    this.selected = index;
  }

  cycle(delta) {
    const n = this.hotbar.length;
    this.selected = (this.selected + delta + n) % n;
  }

  tick(delta) {
    this.globalCastLock = Math.max(0, this.globalCastLock - delta);
  }

  canCast(spell, mana) {
    if (!spell) return false;
    if (this.globalCastLock > 0) return false;
    if (mana < spell.mana) return false;
    return true;
  }

  beginCastLock(castCooldownMul = 1) {
    this.globalCastLock = GLOBAL_CAST_DELAY * castCooldownMul;
  }
}
