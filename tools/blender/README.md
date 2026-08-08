# Blender asset pipeline (Windows)

Headless Blender builds higher-fidelity GLBs for the Three.js game. **Run exports only on windows-64gb (Zach_PC)** — prop/character mesh work stays off the Mac and cloud agents.

## Prerequisites

- Blender 5.2+ (`winget install BlenderFoundation.Blender`)
- Optional coding assist: Ollama `qwen3-coder:30b` at `http://10.10.10.2:11434/v1`

## Export props + characters

```powershell
cd C:\Users\zbova\Projects\harry-potter-philosophers-stone
git pull
powershell -ExecutionPolicy Bypass -File .\tools\blender\export_all.ps1
git add assets/props assets/characters
git commit -m "Export Blender character and prop GLBs from windows-64gb."
git push
```

Writes:

| GLB | Used by |
|-----|---------|
| `assets/props/holly_wand.glb` | Player wand + Ollivander pedestal |
| `assets/props/ollivander_box.glb` | Diagon Alley shop prop |
| `assets/props/flying_key.glb` | Trapdoor flying keys |
| `assets/props/golden_snitch.glb` | Diagon Quidditch display |
| `assets/props/spell_impact_ring.glb` | Spell hit burst (Three.js `spellVfx.js`) |
| `assets/props/protego_dome.glb` | Protego shield bubble |
| `assets/characters/<id>.glb` | Playable heroes (`harry`, `hermione`, …) |

Character GLBs must keep these object names so the game can animate them:

`hips`, `head`, `armL`, `armR`, `wand`, `wandTip`, `legL`, `legR`

## Add a new prop

1. Extend `build_hp_props.py` (or ask the LAN coder model for a bpy snippet).
2. Re-run `export_all.ps1` on Windows.
3. Register the URL in `js/assets.js` → `HP_GLB`.
4. Clone via `game.assets.cloneScene(HP_GLB.yourProp)` in the level builder.

## Characters only

```powershell
& "C:\Program Files\Blender Foundation\Blender 5.2\blender.exe" --background --python .\tools\blender\build_hp_characters.py
```

Missing character GLBs fall back to procedural meshes in `js/characters.js`.

## Unreal

High-fidelity target lives in `../harry-potter-ue`. Open with `LaunchEditor.bat` before using Unreal MCP. Blender GLBs can be imported there later as Static Meshes.
