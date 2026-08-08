# Harry Potter — The Philosopher's Stone

Third-person browser adventure inspired by the Mordor's Adventures prototype. Cast the full movie-era spell list, choose Harry, Hermione, Ron, Ginny, or Luna each run, and play six events from the first film in order.

## Run

```bash
npm start
```

Open [http://localhost:4174](http://localhost:4174).

## Controls

| Input | Action |
|-------|--------|
| WASD | Move |
| Mouse | Look (click canvas to lock pointer) |
| Shift | Run |
| Space | Jump |
| Click | Cast selected spell |
| 1–0 | Hotbar spell select |
| Scroll | Cycle hotbar |
| R | Cycle the **full spell book** onto the current hotbar slot |
| E | Interact / context action |

## Levels

1. Diagon Alley & Ollivanders  
2. Hogwarts Arrival & Sorting  
3. Troll in the Bathroom  
4. Forbidden Forest  
5. Through the Trapdoor  
6. Mirror of Erised / Quirrell  

Progress unlocks in order and is stored in `localStorage` (`hpPsProgress`).

## Stack

- Three.js 0.165 (CDN import map)
- Vanilla ES modules — no bundler
- Procedural PBR-style materials, Sky addon, bloom/FXAA post
- Web Audio music beds + cast SFX (replaceable with files under `assets/audio/`)

## Fable / GLB assets

Blender props live under `assets/props/`; playable heroes under `assets/characters/`. **Exports run on windows-64gb only** (not Mac/cloud):

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\blender\export_all.ps1
```

`AssetLibrary` preloads prop + character URLs. Missing GLBs fall back to procedural meshes in `js/characters.js`.

## Attribution

See [assets/license/ATTRIBUTION.txt](assets/license/ATTRIBUTION.txt).
