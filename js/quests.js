/**
 * Per-level quest API — keeps objectives / interact / exit gates out of the Game hub.
 * Each handler may implement: objective, canExit, tryInteract, filterInteractive, onUtilitySpell.
 */

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
};

export function getQuest(levelId) {
  return QUESTS[levelId] || null;
}
