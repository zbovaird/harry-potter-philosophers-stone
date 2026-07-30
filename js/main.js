import * as THREE from "three";
import { Input } from "./input.js";
import { GameAudio } from "./audio.js";
import { createEnvMap } from "./materials.js";
import { FxPipeline, SpellBolt } from "./fx.js";
import { Atmosphere } from "./atmosphere.js";
import { TextureLibrary } from "./textures.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import {
  LEVELS,
  loadProgress,
  saveProgress,
  markLevelComplete,
  isLevelUnlocked,
} from "./progress.js";
import { createPlayer, getCharacter } from "./characters.js";
import { setupCharacterSelect } from "./characterSelect.js";
import { SpellCaster, getSpell, SPELLS, HOTBAR_SIZE } from "./spells.js";
import { CombatState, applySpellEffect } from "./combat.js";
import { AssetLibrary } from "./assets.js";
import { buildDiagonLevel, resetDiagonQuest, updateDiagonLevel, diagonSpawn } from "./levels/diagon.js";
import { buildHogwartsLevel, resetHogwartsQuest, updateHogwartsLevel, hogwartsSpawn } from "./levels/hogwarts.js";
import { buildTrollLevel, resetTrollQuest, updateTrollLevel, trollSpawn } from "./levels/troll.js";
import { buildForestLevel, resetForestQuest, updateForestLevel, forestSpawn } from "./levels/forest.js";
import { buildTrapdoorLevel, resetTrapdoorQuest, updateTrapdoorLevel, trapdoorSpawn } from "./levels/trapdoor.js";
import { buildQuirrellLevel, resetQuirrellQuest, updateQuirrellLevel, quirrellSpawn } from "./levels/quirrell.js";

const WALK_SPEED = 4.2;
const RUN_SPEED = 6.8;
const JUMP_VELOCITY = 7.2;
const GRAVITY = -24;
const MOUSE_SENSITIVITY = 0.0022;
const PLAYER_RADIUS = 0.38;
const PLAYER_HEIGHT = 1.7;
const COYOTE_TIME = 0.14;
const JUMP_BUFFER = 0.14;

const _forward = new THREE.Vector3();
const _right = new THREE.Vector3();
const _wish = new THREE.Vector3();
const _camOffset = new THREE.Vector3();

function $(id) {
  return document.getElementById(id);
}

class Game {
  constructor() {
    this.canvas = $("game");
    this.clock = new THREE.Clock();
    this.input = new Input();
    this.audio = new GameAudio();
    this.assets = new AssetLibrary();
    this.textures = new TextureLibrary();
    this.progress = loadProgress();
    this.characterId = null;
    this.player = null;
    this.combat = null;
    this.caster = null;
    this.currentLevel = null;
    this.state = "loading";
    this.cloaked = false;
    this.velocityY = 0;
    this.onGround = true;
    this.coyote = 0;
    this.jumpBuffer = 0;
    this.cameraYaw = 0;
    this.cameraPitch = 0.28;
    this.messageTimer = 0;
    this.levelGroups = {};
    this.levelColliders = {};
    this.levelData = {};
    this.colliders = [];
    this.builtLevels = new Set();
    this.time = 0;

    this.ui = {
      loading: $("loading"),
      loadingBar: $("loading-bar"),
      loadingPct: $("loading-pct"),
      characterSelect: $("character-select"),
      characterGrid: $("character-grid"),
      confirmCharacter: $("confirm-character-btn"),
      levelSelect: $("level-select"),
      levelButtons: $("level-buttons"),
      changeCharacter: $("change-character-btn"),
      header: $("game-header"),
      subtitle: $("level-subtitle"),
      hud: $("hud"),
      objective: $("objective"),
      status: $("status"),
      combatHud: $("combat-hud"),
      playerName: $("player-name"),
      healthText: $("health-text"),
      healthFill: $("health-fill"),
      manaText: $("mana-text"),
      manaFill: $("mana-fill"),
      bossHealth: $("boss-health"),
      bossName: $("boss-name"),
      bossHealthText: $("boss-health-text"),
      bossHealthFill: $("boss-health-fill"),
      spellHotbar: $("spell-hotbar"),
      actionsMenu: $("actions-menu"),
      actionBtn: $("action-btn"),
      actionLabel: $("action-label"),
      controlsHelp: $("controls-help"),
      message: $("message"),
      fade: $("fade"),
      winScreen: $("win-screen"),
      winTitle: $("win-title"),
      winText: $("win-text"),
      continueBtn: $("continue-btn"),
    };

    this.initRenderer();
    this.input.bind(this.canvas);
    this.bindUi();
    this.boot();
  }

  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.7;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(52, 1, 0.1, 500);
    this.fx = new FxPipeline(this.renderer, this.scene, this.camera);
    this.bolts = new SpellBolt(this.scene);
    this.atmosphere = new Atmosphere(this.scene, this.renderer);

    this.hemi = new THREE.HemisphereLight(0xffe8d0, 0x3a2a22, 0.65);
    this.scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight(0xffe0b8, 2.6);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(4096, 4096);
    this.sun.shadow.camera.left = -35;
    this.sun.shadow.camera.right = 35;
    this.sun.shadow.camera.top = 35;
    this.sun.shadow.camera.bottom = -35;
    this.sun.shadow.camera.near = 1;
    this.sun.shadow.camera.far = 100;
    this.sun.shadow.bias = -0.00025;
    this.sun.shadow.normalBias = 0.035;
    this.scene.add(this.sun);
    this.scene.add(this.sun.target);

    this.scene.environment = createEnvMap(this.renderer);

    window.addEventListener("resize", () => this.onResize());
    this.onResize();
  }

  onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.fx.setSize(w, h, this.renderer.getPixelRatio());
  }

  setLoading(pct) {
    this.ui.loadingBar.style.width = `${pct}%`;
    this.ui.loadingPct.textContent = `${Math.round(pct)}%`;
  }

  async boot() {
    this.setLoading(5);
    try {
      await this.textures.load();
      this.setLoading(45);
      await this.loadHdrEnvironment();
      this.setLoading(85);
    } catch (err) {
      console.warn("Asset load fallback:", err);
    }
    this.setLoading(100);
    await new Promise((r) => setTimeout(r, 120));
    this.ui.loading.classList.add("hidden");
    this.showCharacterSelect();
    this.loop();
  }

  async loadHdrEnvironment() {
    try {
      const hdr = await new RGBELoader().loadAsync("assets/env/meadow.hdr");
      const pmrem = new THREE.PMREMGenerator(this.renderer);
      pmrem.compileEquirectangularShader();
      const env = pmrem.fromEquirectangular(hdr).texture;
      this.scene.environment = env;
      hdr.dispose();
      pmrem.dispose();
    } catch {
      // keep procedural env map from initRenderer
    }
  }

  bindUi() {
    this.ui.continueBtn.addEventListener("click", () => {
      this.ui.winScreen.classList.add("hidden");
      this.showLevelSelect();
    });
    this.ui.changeCharacter.addEventListener("click", () => {
      this.showCharacterSelect();
    });
    this.ui.actionBtn.addEventListener("click", () => this.tryInteract());
    this.canvas.addEventListener("click", () => {
      if (this.state === "playing") this.input.requestPointerLock(this.canvas);
    });
  }

  showCharacterSelect() {
    this.state = "characterSelect";
    this.input.disable();
    this.hideGameplayUi();
    this.ui.levelSelect.classList.add("hidden");
    this.ui.winScreen.classList.add("hidden");
    this.ui.characterSelect.classList.remove("hidden");
    setupCharacterSelect({
      gridEl: this.ui.characterGrid,
      confirmBtn: this.ui.confirmCharacter,
      lastCharacter: this.progress.lastCharacter,
      onConfirm: (id) => this.confirmCharacter(id),
    });
  }

  confirmCharacter(id) {
    this.characterId = id;
    this.progress = saveProgress({ lastCharacter: id });
    this.audio.init();
    this.audio.resume();
    this.audio.ui();
    this.spawnPlayer(id);
    this.buildSpellHotbar();
    this.ui.characterSelect.classList.add("hidden");
    this.showLevelSelect();
  }

  spawnPlayer(id) {
    if (this.player) {
      this.scene.remove(this.player.root);
    }
    this.player = createPlayer(id);
    this.scene.add(this.player.root);
    const stats = this.player.stats;
    this.combat = new CombatState(stats);
    this.caster = new SpellCaster(this.audio);
    this.ui.playerName.textContent = this.player.name;
  }

  showLevelSelect() {
    this.state = "levelSelect";
    this.input.disable();
    this.hideGameplayUi();
    this.ui.levelSelect.classList.remove("hidden");
    this.progress = loadProgress();
    this.ui.levelButtons.innerHTML = "";
    for (const level of LEVELS) {
      const btn = document.createElement("button");
      btn.type = "button";
      const unlocked = isLevelUnlocked(level.id, this.progress);
      const done = Boolean(this.progress.completed[level.id]);
      btn.textContent = `Level ${level.index} — ${level.title}${done ? " ✓" : ""}`;
      btn.disabled = !unlocked;
      btn.addEventListener("click", () => this.startLevel(level.id));
      this.ui.levelButtons.appendChild(btn);
    }
  }

  hideGameplayUi() {
    this.ui.header.classList.add("hidden");
    this.ui.hud.classList.add("hidden");
    this.ui.combatHud.classList.add("hidden");
    this.ui.spellHotbar.classList.add("hidden");
    this.ui.actionsMenu.classList.add("hidden");
    this.ui.controlsHelp.classList.add("hidden");
    this.ui.message.classList.add("hidden");
  }

  showGameplayUi() {
    this.ui.header.classList.remove("hidden");
    this.ui.hud.classList.remove("hidden");
    this.ui.combatHud.classList.remove("hidden");
    this.ui.spellHotbar.classList.remove("hidden");
    this.ui.actionsMenu.classList.remove("hidden");
    this.ui.controlsHelp.classList.remove("hidden");
  }

  ensureLevelBuilt(levelId) {
    if (this.builtLevels.has(levelId)) return;
    const builders = {
      diagon: buildDiagonLevel,
      hogwarts: buildHogwartsLevel,
      troll: buildTrollLevel,
      forest: buildForestLevel,
      trapdoor: buildTrapdoorLevel,
      quirrell: buildQuirrellLevel,
    };
    builders[levelId]?.(this);
    this.builtLevels.add(levelId);
  }

  applyLevelActivation(activeId) {
    for (const [id, group] of Object.entries(this.levelGroups)) {
      const on = id === activeId;
      group.visible = on;
      const cols = this.levelColliders[id] || [];
      for (const c of cols) c.active = on;
    }
    this.colliders = Object.values(this.levelColliders).flat();
  }

  startLevel(levelId) {
    const meta = LEVELS.find((l) => l.id === levelId);
    if (!meta || !isLevelUnlocked(levelId)) return;

    this.audio.init();
    this.audio.resume();
    this.ensureLevelBuilt(levelId);
    this.applyLevelActivation(levelId);
    this.currentLevel = levelId;
    this.cloaked = false;
    if (this.player) {
      this.player.root.traverse((o) => {
        if (o.isMesh && o.material) {
          o.material.transparent = false;
          o.material.opacity = 1;
        }
      });
    }

    const resets = {
      diagon: resetDiagonQuest,
      hogwarts: resetHogwartsQuest,
      troll: resetTrollQuest,
      forest: resetForestQuest,
      trapdoor: resetTrapdoorQuest,
      quirrell: resetQuirrellQuest,
    };
    resets[levelId]?.(this);

    const spawns = {
      diagon: diagonSpawn,
      hogwarts: hogwartsSpawn,
      troll: trollSpawn,
      forest: forestSpawn,
      trapdoor: trapdoorSpawn,
      quirrell: quirrellSpawn,
    };
    const spawn = spawns[levelId]();
    this.player.root.position.copy(spawn);
    this.velocityY = 0;
    // Angle the opening view so Diagon shopfronts read clearly
    this.cameraYaw = levelId === "diagon" ? Math.PI + 0.45 : Math.PI;
    this.cameraPitch = levelId === "diagon" ? 0.18 : 0.28;
    this.combat = new CombatState(this.player.stats);
    this.bolts.clear();

    this.atmosphere.apply(meta.atmosphere, { sun: this.sun, hemi: this.hemi, fx: this.fx });
    this.audio.playTheme(meta.music);

    this.ui.levelSelect.classList.add("hidden");
    this.ui.subtitle.textContent = meta.title;
    this.showGameplayUi();
    this.updateObjective();
    this.refreshHotbarUi();
    this.state = "playing";
    this.input.enable();
    this.input.requestPointerLock(this.canvas);
    this.showMessage(`${meta.title}\n${meta.subtitle}`);
  }

  buildSpellHotbar() {
    const bar = this.ui.spellHotbar;
    bar.innerHTML = "";
    for (let i = 0; i < HOTBAR_SIZE; i += 1) {
      const spell = getSpell(this.caster.hotbar[i]);
      const slot = document.createElement("button");
      slot.type = "button";
      slot.className = "spell-slot";
      slot.dataset.index = String(i);
      const color = `#${spell.color.toString(16).padStart(6, "0")}`;
      slot.innerHTML = `
        <span class="key">${(i + 1) % 10}</span>
        <span class="swatch" style="background:${color};color:${color}"></span>
        <span>${spell.name.split(" ")[0]}</span>
      `;
      slot.addEventListener("click", () => {
        this.caster.selectIndex(i);
        this.refreshHotbarUi();
      });
      bar.appendChild(slot);
    }

    // Extra utility row note in status — full book via wheel beyond 10? Plan says full list.
    // Expose remaining spells by cycling through ALL spells with Q/wheel beyond hotbar:
    this.fullSpellIndex = 0;
  }

  refreshHotbarUi() {
    if (!this.caster) return;
    const slots = this.ui.spellHotbar.querySelectorAll(".spell-slot");
    slots.forEach((slot, i) => {
      slot.classList.toggle("active", i === this.caster.selected);
      const spell = getSpell(this.caster.hotbar[i]);
      const cd = this.caster.cooldowns[spell.id] || 0;
      slot.classList.toggle("on-cooldown", cd > 0);
    });
  }

  updateObjective() {
    const data = this.levelData[this.currentLevel];
    const objectives = {
      diagon: () => {
        if (!data.ollivanderTalked) return "Talk to Ollivander.";
        if (!data.wandClaimed) return "Claim your wand from the pedestal.";
        if (data.dummiesHit < 3) return `Hit the training dummies (${data.dummiesHit}/3) — press R to cycle the full spell book.`;
        if (!data.leviosaDone) return "Select Wingardium Leviosa (R to cycle) and levitate the feather.";
        return "Reach the gate at the far end of the alley.";
      },
      hogwarts: () => {
        if (!data.mcgTalked) return "Speak with Professor McGonagall.";
        if (!data.sorted) return "Sit for the Sorting Hat.";
        return "Exit through the Great Hall doors.";
      },
      troll: () => {
        if (data.troll.alive) return "Defeat the mountain troll! Stupefy / Leviosa / Expelliarmus.";
        if (!data.hermioneChecked) return "Check on Hermione.";
        return "Escort Hermione out of the bathroom.";
      },
      forest: () => {
        if (!data.cloakTaken) return "Optional: find the Invisibility Cloak. Reach Firenze in the clearing.";
        if (!data.firenzeTalked) return "Speak with Firenze.";
        return "Leave the Forbidden Forest.";
      },
      trapdoor: () => {
        if (!data.snareCleared) return "Clear the Devil's Snare with Incendio or Lumos.";
        if (!data.keyCaught) return "Accio a flying key.";
        if (!data.chessCleared) return "Defeat the enchanted chess pieces.";
        return "Continue through the exit door.";
      },
      quirrell: () => {
        if (!data.mirrorSeen) return "Look into the Mirror of Erised.";
        if (data.quirrell.alive) return "Defeat Quirrell! Use Protego, Expelliarmus, Stupefy.";
        return "Claim the Stone from the Mirror.";
      },
    };
    this.ui.objective.textContent = objectives[this.currentLevel]?.() || "Explore.";
  }

  showMessage(text, duration = 2.4) {
    this.ui.message.textContent = text;
    this.ui.message.classList.remove("hidden");
    this.messageTimer = duration;
  }

  getActiveEnemies() {
    return this.levelData[this.currentLevel]?.enemies || [];
  }

  getInteractives() {
    return this.levelData[this.currentLevel]?.interactives || [];
  }

  nearestInteractive() {
    let best = null;
    let bestDist = Infinity;
    const pos = this.player.root.position;
    for (const item of this.getInteractives()) {
      const world = new THREE.Vector3();
      item.root.getWorldPosition(world);
      // For groups, use position
      if (!item.root.isSprite && item.root.position) {
        world.copy(item.root.getWorldPosition(new THREE.Vector3()));
      }
      const dist = pos.distanceTo(world);
      if (dist < (item.range || 2.5) && dist < bestDist) {
        best = item;
        bestDist = dist;
      }
    }
    return best;
  }

  updateContextAction() {
    const near = this.nearestInteractive();
    if (!near) {
      this.ui.actionBtn.disabled = true;
      this.ui.actionLabel.textContent = "Nothing nearby";
      return null;
    }
    // Gate some actions by quest state
    const data = this.levelData[this.currentLevel];
    let label = near.label;
    let enabled = true;
    if (this.currentLevel === "diagon" && near.id === "exit") {
      enabled = data.wandClaimed && data.dummiesHit >= 3 && data.leviosaDone;
      if (!enabled) label = "Complete Ollivander's trials first";
    }
    if (this.currentLevel === "hogwarts" && near.id === "exit") {
      enabled = data.sorted;
      if (!enabled) label = "Complete the Sorting first";
    }
    if (this.currentLevel === "troll" && near.id === "exit") {
      enabled = !data.troll.alive && data.hermioneChecked;
      if (!enabled) label = data.troll.alive ? "Defeat the troll first" : "Check on Hermione first";
    }
    if (this.currentLevel === "forest" && near.id === "exit") {
      enabled = data.firenzeTalked;
      if (!enabled) label = "Speak with Firenze first";
    }
    if (this.currentLevel === "trapdoor" && near.id === "exit") {
      enabled = data.snareCleared && data.keyCaught && data.chessCleared;
      if (!enabled) label = "Finish the trials first";
    }
    if (this.currentLevel === "quirrell" && near.id === "exit") {
      enabled = !data.quirrell.alive && data.mirrorSeen;
      if (!enabled) label = data.mirrorSeen ? "Defeat Quirrell first" : "Look in the Mirror first";
    }
    this.ui.actionBtn.disabled = !enabled;
    this.ui.actionLabel.textContent = label;
    return enabled ? near : null;
  }

  tryInteract() {
    const near = this.updateContextAction();
    if (!near) return;
    this.audio.interact();
    const data = this.levelData[this.currentLevel];

    if (this.currentLevel === "diagon") {
      if (near.id === "ollivander") {
        data.ollivanderTalked = true;
        this.showMessage("Ollivander: \"The wand chooses the wizard… claim yours, then practice.\"");
      } else if (near.id === "wand") {
        data.wandClaimed = true;
        data.lumosDone = true;
        this.showMessage("The wand warms in your hand. Spells answer your call.");
      } else if (near.id === "feather") {
        const spell = this.caster.getSelectedSpell();
        if (spell?.id === "leviosa" || spell?.effect === "levitate") {
          data.leviosaDone = true;
          this.showMessage("Wingardium Leviosa! The feather rises.");
        } else {
          this.showMessage("Select Wingardium Leviosa and try again.");
          return;
        }
      } else if (near.id === "exit" && data.wandClaimed && data.dummiesHit >= 3 && data.leviosaDone) {
        this.completeLevel();
        return;
      }
    }

    if (this.currentLevel === "hogwarts") {
      if (near.id === "mcgonagall") {
        data.mcgTalked = true;
        this.showMessage("McGonagall: \"Welcome to Hogwarts. The Sorting Hat awaits.\"");
      } else if (near.id === "sortingHat") {
        data.sorted = true;
        const house = ["Gryffindor", "Ravenclaw", "Hufflepuff", "Slytherin"][Math.floor(Math.random() * 4)];
        this.showMessage(`Sorting Hat: "Hmm… better be… ${house}!"`);
      } else if (near.id === "exit" && data.sorted) {
        this.completeLevel();
        return;
      }
    }

    if (this.currentLevel === "troll") {
      if (near.id === "hermione") {
        data.hermioneChecked = true;
        this.showMessage(data.troll.alive ? "Hermione: \"Help! The troll!\"" : "Hermione: \"You saved me!\"");
      } else if (near.id === "exit" && !data.troll.alive && data.hermioneChecked) {
        this.completeLevel();
        return;
      }
    }

    if (this.currentLevel === "forest") {
      if (near.id === "cloak") {
        data.cloakTaken = true;
        data.cloak.visible = false;
        this.cloaked = true;
        this.player.root.traverse((o) => {
          if (o.isMesh && o.material) {
            o.material.transparent = true;
            o.material.opacity = 0.35;
          }
        });
        this.showMessage("You pull the Cloak over yourself. Creatures struggle to see you.");
      } else if (near.id === "firenze") {
        data.firenzeTalked = true;
        this.showMessage("Firenze: \"Mars is bright tonight. Go carefully.\"");
      } else if (near.id === "exit" && data.firenzeTalked) {
        this.completeLevel();
        return;
      }
    }

    if (this.currentLevel === "trapdoor") {
      if (near.id === "snare") {
        const spell = this.caster.getSelectedSpell();
        if (spell && (spell.id === "incendio" || spell.id === "lumos" || spell.effect === "burn" || spell.effect === "light")) {
          data.snareCleared = true;
          data.snare.visible = false;
          this.showMessage("The Devil's Snare recoils from the light and heat!");
        } else {
          this.showMessage("Use Incendio or Lumos on the vines.");
          return;
        }
      } else if (near.id === "keys") {
        const spell = this.caster.getSelectedSpell();
        if (spell && (spell.id === "accio" || spell.effect === "pull")) {
          data.keyCaught = true;
          data.keys.forEach((k) => {
            k.caught = true;
            k.mesh.visible = false;
          });
          this.showMessage("Accio! The winged key flies to your hand.");
        } else {
          this.showMessage("Select Accio to summon a key.");
          return;
        }
      } else if (near.id === "exit" && data.snareCleared && data.keyCaught && data.chessCleared) {
        this.completeLevel();
        return;
      }
    }

    if (this.currentLevel === "quirrell") {
      if (near.id === "mirror") {
        if (!data.mirrorSeen) {
          data.mirrorSeen = true;
          this.showMessage("You see yourself presenting the Stone… Quirrell turns on you!");
        } else if (!data.quirrell.alive) {
          data.stoneClaimed = true;
          this.completeLevel();
          return;
        }
      } else if (near.id === "exit" && !data.quirrell.alive && data.mirrorSeen) {
        data.stoneClaimed = true;
        this.completeLevel();
        return;
      }
    }

    this.updateObjective();
  }

  completeLevel() {
    markLevelComplete(this.currentLevel);
    this.progress = loadProgress();
    this.audio.win();
    this.input.disable();
    this.state = "won";
    const meta = LEVELS.find((l) => l.id === this.currentLevel);
    this.ui.winTitle.textContent = "Level complete";
    this.ui.winText.textContent = meta ? `${meta.title} — well fought.` : "Well done.";
    this.ui.winScreen.classList.remove("hidden");
  }

  castSelectedSpell() {
    if (!this.caster || !this.combat?.alive) return;
    let spell = this.caster.getSelectedSpell();

    // Allow casting any spell from full book via holding Q to open next utility — simplify:
    // Number keys select hotbar; for utilities, cycle with R through extended list
    if (!spell) return;
    if (!this.caster.canCast(spell, this.combat.mana, this.combat.castCooldownMul)) {
      if (this.combat.mana < spell.mana) this.showMessage("Not enough mana.", 1.2);
      return;
    }
    if (spell.restricted && this.currentLevel !== "quirrell") {
      // Allow but expensive — already high cost
    }

    if (!this.combat.spendMana(spell.mana)) return;
    this.caster.beginCooldown(spell, this.combat.castCooldownMul);
    this.audio.cast((spell.color & 0xff) / 255);
    this.refreshHotbarUi();

    // Wand tip flash
    const tip = new THREE.Vector3();
    this.player.wandTip.getWorldPosition(tip);

    _forward.set(Math.sin(this.cameraYaw), 0, Math.cos(this.cameraYaw));
    const aim = new THREE.Vector3(
      Math.sin(this.cameraYaw) * Math.cos(this.cameraPitch),
      Math.sin(this.cameraPitch),
      Math.cos(this.cameraYaw) * Math.cos(this.cameraPitch)
    ).normalize();

    // Self / utility effects
    if (spell.type === "self" || spell.effect === "shield" || spell.effect === "heal" || spell.effect === "light" || spell.effect === "dark" || spell.effect === "dispel" || spell.effect === "teleport") {
      this.applySelfSpell(spell);
      return;
    }

    if (spell.type === "utility") {
      this.applyUtilitySpell(spell);
      return;
    }

    if (spell.type === "aoe") {
      this.bolts.spawn({
        origin: tip,
        direction: aim,
        color: spell.color,
        speed: spell.speed,
        life: spell.life,
        radius: 0.2,
        spellId: spell.id,
        damage: spell.damage * this.combat.damageMul,
      });
      // Immediate nearby AoE as well
      const enemies = this.getActiveEnemies();
      for (const e of enemies) {
        if (!e.alive) continue;
        const world = e.root.getWorldPosition(new THREE.Vector3());
        if (world.distanceTo(this.player.root.position) < (spell.radius || 3)) {
          applySpellEffect(e, spell, this.combat.damageMul);
          this.onEnemyHit(e, spell);
        }
      }
      return;
    }

    // Beam (Crucio): damage nearest in front
    if (spell.type === "beam") {
      const enemies = this.getActiveEnemies();
      let best = null;
      let bestDot = 0.55;
      for (const e of enemies) {
        if (!e.alive) continue;
        const to = e.root.getWorldPosition(new THREE.Vector3()).sub(this.player.root.position).normalize();
        const dot = to.dot(aim);
        if (dot > bestDot) {
          bestDot = dot;
          best = e;
        }
      }
      if (best) {
        applySpellEffect(best, spell, this.combat.damageMul);
        this.onEnemyHit(best, spell);
      }
      return;
    }

    // Projectile
    this.bolts.spawn({
      origin: tip,
      direction: aim,
      color: spell.color,
      speed: spell.speed,
      life: spell.life,
      radius: 0.14,
      spellId: spell.id,
      damage: spell.damage * this.combat.damageMul,
    });

    // Cast arm animation
    this.player.armR.rotation.x = -0.8;
  }

  applySelfSpell(spell) {
    const now = this.time;
    if (spell.effect === "shield") {
      this.caster.shieldUntil = now + (spell.duration || 2.5);
      this.showMessage("Protego!", 1);
    } else if (spell.effect === "heal") {
      this.combat.heal(spell.heal || 25);
      this.showMessage("Episkey — wounds close.", 1.2);
    } else if (spell.effect === "light") {
      this.caster.lumosOn = true;
      if (!this.caster.lumosLight) {
        this.caster.lumosLight = new THREE.PointLight(0xfff2cc, 1.6, 14);
        this.player.root.add(this.caster.lumosLight);
        this.caster.lumosLight.position.set(0.3, 1.4, 0.3);
      }
      this.caster.lumosLight.visible = true;
      this.showMessage("Lumos!", 1);
      // Trapdoor snare auto if close
      if (this.currentLevel === "trapdoor") {
        const data = this.levelData.trapdoor;
        const snare = data.interactives.find((i) => i.id === "snare");
        if (snare && !data.snareCleared) {
          const world = snare.root.getWorldPosition(new THREE.Vector3());
          if (this.player.root.position.distanceTo(world) < 5) {
            data.snareCleared = true;
            data.snare.visible = false;
            this.showMessage("Light drives back the Devil's Snare!");
          }
        }
      }
    } else if (spell.effect === "dark") {
      this.caster.lumosOn = false;
      if (this.caster.lumosLight) this.caster.lumosLight.visible = false;
      this.showMessage("Nox.", 1);
    } else if (spell.effect === "dispel") {
      this.cloaked = false;
      this.caster.shieldUntil = 0;
      this.showMessage("Finite Incantatem.", 1);
    } else if (spell.effect === "teleport") {
      _forward.set(Math.sin(this.cameraYaw), 0, Math.cos(this.cameraYaw));
      this.player.root.position.addScaledVector(_forward, 6);
      this.showMessage("Apparate!", 1);
    }
    this.updateObjective();
  }

  applyUtilitySpell(spell) {
    // Trigger nearby interactives that match
    if (spell.effect === "levitate" && this.currentLevel === "diagon") {
      const data = this.levelData.diagon;
      const feather = data.interactives.find((i) => i.id === "feather");
      if (feather) {
        const world = feather.root.getWorldPosition(new THREE.Vector3());
        if (this.player.root.position.distanceTo(world) < 4) {
          data.leviosaDone = true;
          this.showMessage("Wingardium Leviosa!");
          this.updateObjective();
          return;
        }
      }
    }
    if (spell.effect === "pull" && this.currentLevel === "trapdoor") {
      const data = this.levelData.trapdoor;
      if (!data.keyCaught) {
        data.keyCaught = true;
        data.keys.forEach((k) => {
          k.caught = true;
          k.mesh.visible = false;
        });
        this.showMessage("Accio!");
        this.updateObjective();
        return;
      }
    }
    if (spell.effect === "burn" || spell.id === "incendio") {
      if (this.currentLevel === "trapdoor") {
        const data = this.levelData.trapdoor;
        if (!data.snareCleared) {
          data.snareCleared = true;
          data.snare.visible = false;
          this.showMessage("Incendio clears the Snare!");
          this.updateObjective();
          return;
        }
      }
    }
    this.showMessage(`${spell.name}!`, 1);
  }

  onEnemyHit(enemy, spell) {
    this.audio.hit();
    this.fx.addTrauma(0.2);
    if (!enemy.alive) {
      enemy.root.scale.setScalar(0.01);
      enemy.root.visible = enemy.training ? false : true;
      if (enemy.training && this.currentLevel === "diagon") {
        this.levelData.diagon.dummiesHit += 1;
        this.updateObjective();
      }
      if (this.currentLevel === "troll" && enemy === this.levelData.troll.troll) {
        this.showMessage("The troll collapses!");
        this.updateObjective();
      }
      if (this.currentLevel === "quirrell" && enemy === this.levelData.quirrell.quirrell) {
        this.showMessage("Quirrell falls — the Stone is yours to claim!");
        this.updateObjective();
      }
    }
  }

  updateHud() {
    if (!this.combat) return;
    this.ui.healthText.textContent = `${Math.ceil(this.combat.hp)} / ${this.combat.maxHp}`;
    this.ui.healthFill.style.width = `${(this.combat.hp / this.combat.maxHp) * 100}%`;
    this.ui.manaText.textContent = `${Math.ceil(this.combat.mana)} / ${this.combat.maxMana}`;
    this.ui.manaFill.style.width = `${(this.combat.mana / this.combat.maxMana) * 100}%`;
    this.fx.setLowHealth(this.combat.hp / this.combat.maxHp < 0.3 ? 1 - this.combat.hp / this.combat.maxHp : 0);

    const bossLevels = ["troll", "quirrell"];
    if (bossLevels.includes(this.currentLevel)) {
      const boss = this.currentLevel === "troll" ? this.levelData.troll.troll : this.levelData.quirrell.quirrell;
      this.ui.bossHealth.classList.remove("hidden");
      this.ui.bossName.textContent = boss.name;
      this.ui.bossHealthText.textContent = `${Math.max(0, Math.ceil(boss.hp))} / ${boss.maxHp}`;
      this.ui.bossHealthFill.style.width = `${Math.max(0, (boss.hp / boss.maxHp) * 100)}%`;
    } else {
      this.ui.bossHealth.classList.add("hidden");
    }

    const spell = this.caster?.getSelectedSpell();
    this.ui.status.textContent = spell
      ? `Spell: ${spell.name} · Mana ${spell.mana} · CD ${(this.caster.cooldowns[spell.id] || 0).toFixed(1)}s`
      : "Spells ready";
  }

  resolveCollisions(pos) {
    const r = PLAYER_RADIUS;
    for (const c of this.colliders) {
      if (!c.active || c.ground) continue;
      if (pos.y + PLAYER_HEIGHT < c.minY || pos.y > c.maxY) continue;
      const nearestX = Math.max(c.minX, Math.min(pos.x, c.maxX));
      const nearestZ = Math.max(c.minZ, Math.min(pos.z, c.maxZ));
      let dx = pos.x - nearestX;
      let dz = pos.z - nearestZ;
      const distSq = dx * dx + dz * dz;
      if (distSq >= r * r) continue;
      if (distSq < 1e-6) {
        const left = Math.abs(pos.x - c.minX);
        const right = Math.abs(c.maxX - pos.x);
        const near = Math.abs(pos.z - c.minZ);
        const far = Math.abs(c.maxZ - pos.z);
        const m = Math.min(left, right, near, far);
        if (m === left) pos.x = c.minX - r;
        else if (m === right) pos.x = c.maxX + r;
        else if (m === near) pos.z = c.minZ - r;
        else pos.z = c.maxZ + r;
      } else {
        const dist = Math.sqrt(distSq);
        pos.x = nearestX + (dx / dist) * r;
        pos.z = nearestZ + (dz / dist) * r;
      }
    }
  }

  getGroundHeight(x, z) {
    let best = 0;
    for (const c of this.colliders) {
      if (!c.active || !c.ground) continue;
      if (x >= c.minX && x <= c.maxX && z >= c.minZ && z <= c.maxZ) {
        best = Math.max(best, c.maxY);
      }
    }
    return best;
  }

  updatePlayer(delta) {
    if (!this.player || this.state !== "playing") return;

    const look = this.input.consumeMouseLook();
    this.cameraYaw -= look.dx * MOUSE_SENSITIVITY;
    this.cameraPitch -= look.dy * MOUSE_SENSITIVITY;
    this.cameraPitch = THREE.MathUtils.clamp(this.cameraPitch, -0.45, 1.15);

    // Spell selection
    const wheel = this.input.consumeWheel();
    if (wheel) {
      this.caster.cycle(Math.sign(wheel));
      this.refreshHotbarUi();
    }
    for (let i = 0; i < 10; i += 1) {
      const code = i === 9 ? "Digit0" : `Digit${i + 1}`;
      if (this.input.wasPressed(code)) {
        this.caster.selectIndex(i);
        this.refreshHotbarUi();
      }
    }

    // Cycle full spell book onto selected hotbar slot with R
    if (this.input.wasPressed("KeyR")) {
      this.fullSpellIndex = (this.fullSpellIndex + 1) % SPELLS.length;
      const next = SPELLS[this.fullSpellIndex];
      this.caster.hotbar[this.caster.selected] = next.id;
      this.buildSpellHotbar();
      this.refreshHotbarUi();
      this.showMessage(`Ready: ${next.name}`, 1);
    }

    if (this.input.wasPressed("KeyE")) this.tryInteract();
    if (this.input.wasAttackClicked()) this.castSelectedSpell();

    const move = this.input.getMoveInput();
    _forward.set(Math.sin(this.cameraYaw), 0, Math.cos(this.cameraYaw));
    _right.set(-Math.cos(this.cameraYaw), 0, Math.sin(this.cameraYaw));
    _wish.set(0, 0, 0);
    _wish.addScaledVector(_forward, move.forward);
    _wish.addScaledVector(_right, move.right);
    if (_wish.lengthSq() > 1) _wish.normalize();

    const speed = (move.run ? RUN_SPEED : WALK_SPEED) * this.combat.moveSpeedMul;
    const pos = this.player.root.position;
    pos.x += _wish.x * speed * delta;
    pos.z += _wish.z * speed * delta;
    this.resolveCollisions(pos);

    // Jump / gravity
    this.coyote = this.onGround ? COYOTE_TIME : Math.max(0, this.coyote - delta);
    if (this.input.wasPressed("Space")) this.jumpBuffer = JUMP_BUFFER;
    else this.jumpBuffer = Math.max(0, this.jumpBuffer - delta);

    if (this.jumpBuffer > 0 && this.coyote > 0) {
      this.velocityY = JUMP_VELOCITY;
      this.onGround = false;
      this.jumpBuffer = 0;
      this.coyote = 0;
      this.audio.jump();
    }

    this.velocityY += GRAVITY * delta;
    pos.y += this.velocityY * delta;
    const ground = this.getGroundHeight(pos.x, pos.z);
    if (pos.y <= ground) {
      pos.y = ground;
      this.velocityY = 0;
      this.onGround = true;
    } else {
      this.onGround = false;
    }

    if (_wish.lengthSq() > 0.01) {
      this.player.facing.copy(_wish).normalize();
      this.player.root.rotation.y = Math.atan2(this.player.facing.x, this.player.facing.z);
      const bob = Math.sin(this.time * (move.run ? 12 : 8)) * 0.04;
      this.player.hips.position.y = 0.92 + bob;
    } else {
      this.player.root.rotation.y = this.cameraYaw;
      this.player.hips.position.y = 0.92;
    }

    // Recover cast arm
    this.player.armR.rotation.x = THREE.MathUtils.damp(this.player.armR.rotation.x, 0, 6, delta);

    this.caster.tick(delta);
    this.combat.tick(delta);
  }

  updateCamera() {
    if (!this.player) return;
    const dist = 5.5;
    const height = 1.5;
    _camOffset.set(
      -Math.sin(this.cameraYaw) * Math.cos(this.cameraPitch) * dist,
      height + Math.sin(this.cameraPitch) * dist * 0.85,
      -Math.cos(this.cameraYaw) * Math.cos(this.cameraPitch) * dist
    );
    const target = this.player.root.position.clone().add(new THREE.Vector3(0, 1.35, 0));
    this.camera.position.copy(target).add(_camOffset);
    this.camera.position.add(this.fx.shakeOffset);
    this.camera.lookAt(target);
    this.camera.rotation.z += this.fx.shakeRoll;
    this.sun.target.position.copy(this.player.root.position);
    this.sun.position.copy(this.atmosphere.sunDirection).multiplyScalar(60).add(this.player.root.position);
    this.atmosphere.follow(this.camera);
  }

  updateLevels(delta) {
    if (this.state !== "playing") return;
    const updaters = {
      diagon: updateDiagonLevel,
      hogwarts: updateHogwartsLevel,
      troll: updateTrollLevel,
      forest: updateForestLevel,
      trapdoor: updateTrapdoorLevel,
      quirrell: updateQuirrellLevel,
    };
    updaters[this.currentLevel]?.(this, delta, this.time);

    const hits = this.bolts.update(delta, this.getActiveEnemies());
    for (const { bolt, target } of hits) {
      const spell = getSpell(bolt.spellId);
      if (spell) {
        applySpellEffect(target, spell, this.combat.damageMul);
        this.onEnemyHit(target, spell);
      }
    }

    if (!this.combat.alive) {
      this.showMessage("You have fallen… Restarting level.", 2);
      this.combat = new CombatState(this.player.stats);
      const spawns = {
        diagon: diagonSpawn,
        hogwarts: hogwartsSpawn,
        troll: trollSpawn,
        forest: forestSpawn,
        trapdoor: trapdoorSpawn,
        quirrell: quirrellSpawn,
      };
      this.player.root.position.copy(spawns[this.currentLevel]());
    }
  }

  loop() {
    requestAnimationFrame(() => this.loop());
    const delta = Math.min(0.05, this.clock.getDelta());
    this.time += delta;

    if (this.messageTimer > 0) {
      this.messageTimer -= delta;
      if (this.messageTimer <= 0) this.ui.message.classList.add("hidden");
    }

    if (this.state === "playing") {
      this.updatePlayer(delta);
      this.updateLevels(delta);
      this.updateContextAction();
      this.updateHud();
      this.refreshHotbarUi();
    }

    this.fx.update(delta, this.time);
    this.updateCamera();
    this.fx.render();
    this.input.endFrame();
  }
}

new Game();
