/**
 * Per-level quest API — keeps objectives / interact / exit gates out of the Game hub.
 * Each handler may implement: objective, canExit, tryInteract, filterInteractive, onUtilitySpell.
 */

import * as THREE from "three";
import { CHAMBER_ORIGIN, openChamberHatch } from "./levels/chamber.js";

export const QUESTS = {
  diagon: {
    objective(data) {
      if (!data.ollivanderTalked) return "Talk to Ollivander.";
      if (!data.wandClaimed) return "Claim your wand from the pedestal.";
      if (data.dummiesHit < 5) return `Practice on the dummies (${data.dummiesHit}/5) — try different hotbar spells.`;
      if (!data.leviosaDone) return "Levitate the feather — press E near it, or cast Leviosa (5).";
      return "Reach the gate at the far end of the alley.";
    },
    canExit(data) {
      return data.wandClaimed && data.dummiesHit >= 5 && data.leviosaDone;
    },
    exitBlockedLabel: "Complete Ollivander's trials first",
    filterInteractive(item, data) {
      if (item.id === "wand" && data.wandClaimed) return false;
      if (item.id === "feather" && data.leviosaDone) return false;
      return true;
    },
    tryInteract(game, near, data) {
      if (near.id === "ollivander") {
        data.ollivanderTalked = true;
        game.showMessage('Ollivander: "The wand chooses the wizard… claim yours, then practice."');
        return "handled";
      }
      if (near.id === "wand") {
        data.wandClaimed = true;
        data.lumosDone = true;
        const ped = data.pedestal?.userData;
        if (ped?.wand) ped.wand.visible = false;
        if (ped?.tip) ped.tip.visible = false;
        if (ped?.glow) ped.glow.visible = false;
        game.setWandEquipped?.(true);
        game.showMessage("The wand warms in your hand. Spells answer your call.");
        return "handled";
      }
      if (near.id === "feather") {
        data.leviosaDone = true;
        game.showMessage("Wingardium Leviosa! The feather rises.");
        return "handled";
      }
      if (near.id === "exit" && this.canExit(data)) {
        game.completeLevel();
        return "complete";
      }
      return null;
    },
  },

  hogwarts: {
    objective(data) {
      if (!data.mcgTalked) return "Speak with Professor McGonagall.";
      if (!data.sorted) return "Sit for the Sorting Hat and choose your house.";
      if (!data.houseVisited) return `Sit at the ${data.house || "house"} table in the Great Hall.`;
      return `Explore the courtyard (north arch), then leave through the Great Hall doors.`;
    },
    canExit(data) {
      return data.sorted && data.houseVisited;
    },
    exitBlockedLabel: "Sit at your house table before leaving",
    filterInteractive(item, data) {
      if (item.id === "sortingHat" && data.sorted) return false;
      if (item.id === "houseTable" && data.houseVisited) return false;
      if (item.id === "houseTable" && data.house && item.house && item.house !== data.house) return false;
      return true;
    },
    tryInteract(game, near, data) {
      if (near.id === "mcgonagall") {
        data.mcgTalked = true;
        game.showMessage('McGonagall: "Welcome to Hogwarts. The Sorting Hat awaits."');
        return "handled";
      }
      if (near.id === "sortingHat") {
        if (data.sorted) {
          game.showMessage(`Sorting Hat: "Already sorted — ${data.house}! Join your house table."`);
          return "handled";
        }
        game.openHouseSelect();
        return "complete";
      }
      if (near.id === "houseTable") {
        if (!data.sorted) {
          game.showMessage("The Sorting Hat must choose your house first.");
          return "handled";
        }
        if (near.house && data.house && near.house !== data.house) {
          game.showMessage(`That is the ${near.house} table. Yours is ${data.house}.`);
          return "handled";
        }
        data.houseVisited = true;
        game.showMessage(`You take your seat at the ${data.house} table. Welcome home.`);
        game.saveCheckpoint?.();
        return "handled";
      }
      if (near.id === "exit" && this.canExit(data)) {
        game.completeLevel();
        return "complete";
      }
      return null;
    },
  },

  troll: {
    objective(data) {
      if (data.troll.alive) {
        if (data.troll.phase >= 2) return "The troll is furious! Keep casting — Protego (4) before it swings!";
        return "Defeat the troll! Stupefy (2) to hurt it — Protego (4) when it winds up.";
      }
      if (!data.hermioneChecked) return "Check on Hermione.";
      return "Leave through the bathroom exit door (south wall).";
    },
    canExit(data) {
      return !data.troll.alive && data.hermioneChecked;
    },
    exitBlockedLabel(data) {
      return data.troll.alive ? "Defeat the troll first" : "Check on Hermione first";
    },
    filterInteractive(item, data) {
      if (item.id === "hermione" && data.hermioneChecked && !data.troll.alive) return false;
      return true;
    },
    tryInteract(game, near, data) {
      if (near.id === "hermione") {
        data.hermioneChecked = true;
        game.showMessage(data.troll.alive ? 'Hermione: "Help! The troll!"' : 'Hermione: "You saved me!"');
        return "handled";
      }
      if (near.id === "exit" && this.canExit(data)) {
        game.completeLevel();
        return "complete";
      }
      return null;
    },
  },

  forest: {
    objective(data) {
      if (!data.firenzeTalked) {
        return "Reach Firenze. Cloak helps; Patronus (0) scares creatures; Protego (4) blocks bites.";
      }
      return "Leave through the forest gate beyond Firenze.";
    },
    canExit(data) {
      return data.firenzeTalked;
    },
    exitBlockedLabel: "Speak with Firenze first",
    filterInteractive(item, data) {
      if (item.id === "firenze" && data.firenzeTalked) return false;
      if (item.id === "cloak" && data.cloakTaken) return false;
      return true;
    },
    tryInteract(game, near, data) {
      if (near.id === "cloak") {
        data.cloakTaken = true;
        data.cloak.visible = false;
        game.cloaked = true;
        game.player.root.traverse((o) => {
          if (o.isMesh && o.material) {
            o.material.transparent = true;
            o.material.opacity = 0.35;
          }
        });
        game.showMessage("You pull the Cloak over yourself. Creatures struggle to see you.");
        return "handled";
      }
      if (near.id === "firenze") {
        data.firenzeTalked = true;
        game.showMessage('Firenze: "Mars is bright tonight. Go carefully."');
        game.saveCheckpoint?.();
        return "handled";
      }
      if (near.id === "exit" && this.canExit(data)) {
        game.completeLevel();
        return "complete";
      }
      return null;
    },
  },

  trapdoor: {
    objective(data) {
      if (!data.snareCleared) return "Shoot Incendio (7) at the Devil's Snare.";
      if (!data.keyCaught) return "Accio (8) while aiming at the glowing correct key.";
      if (!data.chessCleared) {
        const step = data.chessStep || 0;
        const names = ["Queen", "Knight", "Rook", "Bishop"];
        return `Wizard's chess: stand on the glowing ${names[step] || "square"} (${step}/4).`;
      }
      if (!data.doorUnlocked) return "Cast Alohomora (9) on the exit door.";
      return "Continue through the exit door.";
    },
    canExit(data) {
      return data.snareCleared && data.keyCaught && data.chessCleared && data.doorUnlocked;
    },
    exitBlockedLabel(data) {
      if (!data.snareCleared || !data.keyCaught || !data.chessCleared) return "Finish the trials first";
      return "Cast Alohomora (9) on the door";
    },
    filterInteractive(item, data) {
      if (item.id === "snare" && data.snareCleared) return false;
      if (item.id === "keys" && data.keyCaught) return false;
      if (item.id === "chessTile" && (item.index < (data.chessStep || 0) || data.chessCleared)) return false;
      return true;
    },
    tryInteract(game, near, data) {
      if (near.id === "snare") {
        game.showMessage("Cast Incendio (7) and shoot the vines.");
        return "handled";
      }
      if (near.id === "keys") {
        game.showMessage("Select Accio (8) and cast while looking at the glowing key.");
        return "handled";
      }
      if (near.id === "chessTile") {
        const step = data.chessStep || 0;
        if (near.index === step) {
          data.chessStep = step + 1;
          near.root.userData.lit = false;
          if (near.root.material) near.root.material.emissiveIntensity = 0.05;
          if (data.chessStep >= data.chessTiles.length) {
            data.chessCleared = true;
            game.showMessage("The chess board accepts your path!");
          } else {
            const next = data.chessTiles[data.chessStep];
            if (next?.material) next.material.emissiveIntensity = 1.2;
            game.showMessage(`Correct — next tile glows.`);
          }
          game.saveCheckpoint?.();
        } else {
          game.showMessage("Wrong square — follow the glowing tile.");
          game.combat?.damage(6);
          game.fx?.flashDamage(0.4);
        }
        return "handled";
      }
      if (near.id === "exit") {
        if (!data.snareCleared || !data.keyCaught || !data.chessCleared) {
          game.showMessage("Finish the trials first.");
          return "handled";
        }
        if (!data.doorUnlocked) {
          game.showMessage("The door is sealed — cast Alohomora (9).");
          return "handled";
        }
        game.completeLevel();
        return "complete";
      }
      return null;
    },
  },

  quirrell: {
    objective(data) {
      if (!data.mirrorSeen) return "Look into the Mirror of Erised.";
      if (data.quirrell.alive) {
        if ((data.quirrell.hp / data.quirrell.maxHp) < 0.45) {
          return "Quirrell is desperate! Keep Protego (4) up and finish him with Stupefy.";
        }
        return "Defeat Quirrell! Raise Protego (4) when he casts.";
      }
      return "Claim the Stone from the Mirror.";
    },
    canExit(data) {
      return !data.quirrell.alive && data.mirrorSeen;
    },
    exitBlockedLabel(data) {
      return data.mirrorSeen ? "Defeat Quirrell first" : "Look in the Mirror first";
    },
    filterInteractive(item, data) {
      if (item.id === "mirror" && data.mirrorSeen && data.quirrell && !data.quirrell.alive) return true;
      if (item.id === "mirror" && data.stoneClaimed) return false;
      return true;
    },
    tryInteract(game, near, data) {
      if (near.id === "mirror") {
        if (!data.mirrorSeen) {
          data.mirrorSeen = true;
          game.showMessage("You see yourself presenting the Stone… Quirrell turns on you!");
          game.saveCheckpoint?.();
          return "handled";
        }
        if (!data.quirrell.alive) {
          data.stoneClaimed = true;
          game.completeLevel();
          return "complete";
        }
        game.showMessage("Defeat Quirrell before claiming the Stone!");
        return "handled";
      }
      if (near.id === "exit" && this.canExit(data)) {
        data.stoneClaimed = true;
        game.completeLevel();
        return "complete";
      }
      return null;
    },
  },

  burrow: {
    objective(data) {
      if (!data.mollyTalked) return "Talk to Molly at the Burrow.";
      if (!data.dobbyWarned) return "Confront Dobby — he is trying to stop you.";
      if (!data.knockturnVisited) return "Search Knockturn Alley for dark-shop clues.";
      return "Leave through the far gate toward Hogwarts.";
    },
    canExit(data) {
      return data.mollyTalked && data.dobbyWarned && data.knockturnVisited;
    },
    exitBlockedLabel: "Finish the Burrow and Knockturn beats first",
    tryInteract(game, near, data) {
      if (near.id === "molly") {
        data.mollyTalked = true;
        game.showMessage('Molly: "You\'re staying the rest of the summer, and that\'s that."');
        return "handled";
      }
      if (near.id === "dobby") {
        data.dobbyWarned = true;
        game.showMessage('Dobby: "Harry Potter must not go back to Hogwarts!"');
        return "handled";
      }
      if (near.id === "shop") {
        data.knockturnVisited = true;
        game.showMessage("Borgin & Burkes smells of dust, curses, and old secrets.");
        return "handled";
      }
      if (near.id === "exit" && this.canExit(data)) {
        game.completeLevel();
        return "complete";
      }
      return null;
    },
  },

  anglia: {
    objective(data) {
      if (!data.ronTalked) return "Talk to Ron about missing the train.";
      if (!data.boarded) return "Board the flying Ford Anglia.";
      if (!data.landed) return "Steer the car — dodge the trees until Hogwarts appears.";
      return "Land at the Hogwarts gates.";
    },
    canExit(data) {
      return data.landed;
    },
    exitBlockedLabel: "You still have to fly there",
    tryInteract(game, near, data) {
      if (near.id === "ron") {
        data.ronTalked = true;
        game.showMessage('Ron: "Dad\'s car can fly. Don\'t tell Mum."');
        return "handled";
      }
      if (near.id === "car") {
        data.boarded = true;
        game.flyingVehicle = true;
        game.showMessage("The Ford Anglia lifts off. WASD to drift — avoid the trees!");
        return "handled";
      }
      if (near.id === "exit" && this.canExit(data)) {
        game.completeLevel();
        return "complete";
      }
      return null;
    },
  },

  willow: {
    objective(data) {
      if (!data.carFreed) return "Accio (8) the Ford from the Whomping Willow — Protego (4) against branches.";
      return "Get inside Hogwarts before Filch finds you.";
    },
    canExit(data) {
      return data.carFreed;
    },
    exitBlockedLabel: "Free the car from the Willow first",
    onUtilitySpell(game, spell, data) {
      if (spell.effect === "pull" && !data.carFreed) {
        data.carFreed = true;
        if (data.car) {
          data.car.position.set(-6, 0, -8);
          data.car.rotation.set(0, 0.4, 0);
        }
        game.showMessage("Accio! The Ford drops free of the Willow.");
        return true;
      }
      return false;
    },
    tryInteract(game, near, data) {
      if (near.id === "car") {
        if (!data.carFreed) {
          data.carFreed = true;
          if (data.car) {
            data.car.position.set(-6, 0, -8);
            data.car.rotation.set(0, 0.4, 0);
          }
          game.showMessage("You wrench the car free as the Willow thrashes.");
          return "handled";
        }
      }
      if (near.id === "exit" && this.canExit(data)) {
        game.completeLevel();
        return "complete";
      }
      return null;
    },
  },

  dueling: {
    objective(data) {
      if (!data.lessonHeard) return "Listen to Lockhart at the Dueling Club.";
      if (data.malfoy.alive) return "Duel Malfoy! Expelliarmus (1) / Stupefy (2) — Protego (4) on his wind-up.";
      return "Leave the club before Lockhart takes credit.";
    },
    canExit(data) {
      return data.lessonHeard && !data.malfoy.alive;
    },
    exitBlockedLabel(data) {
      return data.lessonHeard ? "Win the duel first" : "Hear the lesson first";
    },
    tryInteract(game, near, data) {
      if (near.id === "lockhart") {
        data.lessonHeard = true;
        data.snake.visible = true;
        data.snakeShown = true;
        game.showMessage('Lockhart: "I\'ll have to stun him separately!" Malfoy draws a snake.');
        return "handled";
      }
      if (near.id === "exit" && this.canExit(data)) {
        game.completeLevel();
        return "complete";
      }
      return null;
    },
  },

  polyjuice: {
    objective(data) {
      if (!data.planned) return "Meet Hermione to plan Polyjuice.";
      if (!data.boomslang || !data.lacewing || !data.hair) {
        const n = [data.boomslang, data.lacewing, data.hair].filter(Boolean).length;
        return `Gather potion ingredients (${n}/3).`;
      }
      if (!data.brewed) return "Brew the potion at the cauldron.";
      if (!data.overheard) return "Drink, then eavesdrop on Malfoy in Slytherin colours.";
      return "Slip back out before the potion wears off.";
    },
    canExit(data) {
      return data.overheard;
    },
    exitBlockedLabel: "Finish the Polyjuice plot first",
    filterInteractive(item, data) {
      if (item.id === "boomslang" && data.boomslang) return false;
      if (item.id === "lacewing" && data.lacewing) return false;
      if (item.id === "hair" && data.hair) return false;
      return true;
    },
    tryInteract(game, near, data) {
      if (near.id === "hermione") {
        data.planned = true;
        game.showMessage('Hermione: "We need boomslang, lacewing, and a hair. Then we brew."');
        return "handled";
      }
      if (near.id === "boomslang" || near.id === "lacewing" || near.id === "hair") {
        if (!data.planned) {
          game.showMessage("Ask Hermione what you need first.");
          return "handled";
        }
        data[near.id] = true;
        near.root.visible = false;
        game.showMessage("Ingredient pocketed.");
        return "handled";
      }
      if (near.id === "cauldron") {
        if (!data.boomslang || !data.lacewing || !data.hair) {
          game.showMessage("The cauldron still needs all three ingredients.");
          return "handled";
        }
        data.brewed = true;
        data.disguised = true;
        game.cloaked = true;
        game.showMessage("The potion tastes of dirty socks. You look like a Slytherin.");
        return "handled";
      }
      if (near.id === "malfoy") {
        if (!data.disguised) {
          game.showMessage("He'll never talk if he recognises you. Drink the potion first.");
          return "handled";
        }
        data.overheard = true;
        game.showMessage('Malfoy: "The Heir of Slytherin? It isn\'t me — more\'s the pity."');
        return "handled";
      }
      if (near.id === "exit" && this.canExit(data)) {
        game.completeLevel();
        return "complete";
      }
      return null;
    },
  },

  mandrakes: {
    objective(data) {
      if (!data.lesson) return "Speak with Professor Sprout.";
      if (data.potted < 4) return `Pot the screaming Mandrakes (${data.potted}/4) — E or Leviosa (5).`;
      if (!data.revived) return "Use the draught to revive the petrified student.";
      return "Leave the greenhouse.";
    },
    canExit(data) {
      return data.revived;
    },
    exitBlockedLabel: "Finish Herbology first",
    onUtilitySpell(game, spell, data) {
      if (spell.effect !== "levitate") return false;
      const near = data.interactives.find((i) => i.id === "mandrake" && !data.pottedFlags[i.index]);
      if (!near) return false;
      const world = near.root.getWorldPosition(new THREE.Vector3());
      if (game.player.root.position.distanceTo(world) > 4.5) return false;
      data.pottedFlags[near.index] = true;
      data.potted += 1;
      near.root.scale.setScalar(0.7);
      game.showMessage("Wingardium Leviosa — the Mandrake goes in the pot!");
      return true;
    },
    tryInteract(game, near, data) {
      if (near.id === "sprout") {
        data.lesson = true;
        game.showMessage('Sprout: "Earmuffs on! Mandrakes, into their new pots."');
        return "handled";
      }
      if (near.id === "mandrake") {
        if (!data.lesson) {
          game.showMessage("Wait for Sprout's instructions.");
          return "handled";
        }
        if (!data.pottedFlags[near.index]) {
          data.pottedFlags[near.index] = true;
          data.potted += 1;
          near.root.scale.setScalar(0.7);
          game.showMessage("The Mandrake screams — and settles.");
        }
        return "handled";
      }
      if (near.id === "petrified") {
        if (data.potted < 4) {
          game.showMessage("You still need a full Mandrake draught.");
          return "handled";
        }
        data.revived = true;
        if (data.justin) {
          data.justin.rotation.x = 0;
          data.justin.position.y = 0;
        }
        game.showMessage("Colour returns to their face. The petrification lifts.");
        return "handled";
      }
      if (near.id === "exit" && this.canExit(data)) {
        game.completeLevel();
        return "complete";
      }
      return null;
    },
  },

  spiders: {
    objective(data) {
      if (data.websBurned < 2) return `Burn the spider webs with Incendio (7) (${data.websBurned}/2).`;
      if (!data.aragogTalked) return "Reach Aragog. Patronus (0) scares spiders; Protego (4) blocks bites.";
      return "Escape in the Ford Anglia.";
    },
    canExit(data) {
      return data.aragogTalked && data.websBurned >= 2;
    },
    exitBlockedLabel: "Speak with Aragog after clearing the webs",
    tryInteract(game, near, data) {
      if (near.id === "web") {
        game.showMessage("Cast Incendio (7) at the webs.");
        return "handled";
      }
      if (near.id === "aragog") {
        data.aragogTalked = true;
        game.showMessage('Aragog: "The beast is not of our kind… Hagrid is innocent."');
        return "handled";
      }
      if (near.id === "exit" && this.canExit(data)) {
        game.completeLevel();
        return "complete";
      }
      return null;
    },
  },

  chamber: {
    objective(data) {
      if (!data.myrtleTalked) return "Speak with Moaning Myrtle.";
      if (!data.diaryTaken) return "Accio (8) Tom Riddle's diary.";
      if (!data.hatchOpen) return "Cast Alohomora (9) on the ouroboros hatch.";
      if (!data.descended) return "Step into the serpent's mouth and drop into the Chamber.";
      if (data.basilisk.alive) return "Face the basilisk below! Protego (4) on its wind-up.";
      if (!data.fawkesHelped) return "Take Fawkes' help — he will carry you back up.";
      return "Leave through Myrtle's bathroom door.";
    },
    canExit(data) {
      return data.descended && !data.basilisk.alive && data.fawkesHelped;
    },
    exitBlockedLabel: "Finish the Chamber below, then return with Fawkes",
    onUtilitySpell(game, spell, data) {
      if (spell.effect === "pull" && !data.diaryTaken) {
        data.diaryTaken = true;
        if (data.diary) data.diary.visible = false;
        game.showMessage("Accio! The diary slaps into your hand — ink still wet.");
        return true;
      }
      if (spell.effect === "unlock" && data.diaryTaken && !data.hatchOpen) {
        openChamberHatch(game);
        return true;
      }
      return false;
    },
    tryInteract(game, near, data) {
      if (near.id === "myrtle") {
        data.myrtleTalked = true;
        game.showMessage('Myrtle: "I died here. The voice came from the taps — and that snake in the floor."');
        return "handled";
      }
      if (near.id === "diary") {
        data.diaryTaken = true;
        near.root.visible = false;
        game.showMessage("Tom Riddle's diary is cold, and somehow listening.");
        return "handled";
      }
      if (near.id === "hatch") {
        if (!data.diaryTaken) {
          game.showMessage("The ouroboros stays shut until the diary is yours.");
          return "handled";
        }
        if (!data.hatchOpen) {
          game.showMessage("Alohomora (9) — unlock the serpent hatch.");
          return "handled";
        }
        game.showMessage("The mouth is open. Step in and drop.");
        return "handled";
      }
      if (near.id === "fawkes") {
        if (data.basilisk.alive) {
          game.showMessage("Fawkes circles, waiting for the serpent to fall.");
          return "handled";
        }
        data.fawkesHelped = true;
        game.player.root.position.copy(CHAMBER_ORIGIN).add(new THREE.Vector3(0, 0, -7));
        game.velocityY = 0;
        game.showMessage("Fawkes bears you up the pipe. Phoenix tears and a fang — the diary can die.");
        return "handled";
      }
      if (near.id === "exit" && this.canExit(data)) {
        game.completeLevel();
        return "complete";
      }
      return null;
    },
  },
};

export function getQuest(levelId) {
  return QUESTS[levelId] || null;
}
