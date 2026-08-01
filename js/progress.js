const STORAGE_KEY = "hpPsProgress";

export const LEVELS = [
  {
    id: "diagon",
    index: 1,
    title: "Diagon Alley & Ollivanders",
    subtitle: "Claim your wand",
    atmosphere: "diagon",
    music: "diagon",
  },
  {
    id: "hogwarts",
    index: 2,
    title: "Hogwarts Arrival & Sorting",
    subtitle: "Welcome to Hogwarts",
    atmosphere: "greatHall",
    music: "greatHall",
  },
  {
    id: "troll",
    index: 3,
    title: "Troll in the Bathroom",
    subtitle: "Save Hermione",
    atmosphere: "bathroom",
    music: "bathroom",
  },
  {
    id: "forest",
    index: 4,
    title: "Forbidden Forest",
    subtitle: "Into the trees",
    atmosphere: "forest",
    music: "forest",
  },
  {
    id: "trapdoor",
    index: 5,
    title: "Through the Trapdoor",
    subtitle: "The trials below",
    atmosphere: "dungeon",
    music: "dungeon",
  },
  {
    id: "quirrell",
    index: 6,
    title: "Mirror of Erised / Quirrell",
    subtitle: "The final confrontation",
    atmosphere: "quirrell",
    music: "quirrell",
  },
];

export function loadProgress() {
  const defaults = {
    completed: {},
    currentLevel: "diagon",
    lastCharacter: null,
    house: null,
  };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const data = JSON.parse(raw);
    const valid = new Set(LEVELS.map((l) => l.id));
    return {
      completed: data.completed && typeof data.completed === "object" ? data.completed : {},
      currentLevel: valid.has(data.currentLevel) ? data.currentLevel : "diagon",
      lastCharacter: data.lastCharacter || null,
      house: data.house || null,
    };
  } catch {
    return defaults;
  }
}

export function saveProgress(patch) {
  const next = { ...loadProgress(), ...patch };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function markLevelComplete(levelId) {
  const progress = loadProgress();
  progress.completed[levelId] = true;
  return saveProgress({ completed: progress.completed, currentLevel: levelId });
}

export function isLevelUnlocked(_levelId, _progress = loadProgress()) {
  // Free level select — all movie chapters available from the start
  return true;
}
