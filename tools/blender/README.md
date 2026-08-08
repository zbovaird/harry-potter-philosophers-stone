# Blender asset pipeline (Windows)

Headless Blender builds higher-fidelity GLBs for the Three.js game. Run on **windows-64gb** (Zach_PC).

## Prerequisites

- Blender 5.2+ (`winget install BlenderFoundation.Blender`)
- Optional coding assist: Ollama `qwen3-coder:30b` at `http://10.10.10.2:11434/v1`

## Export props

```powershell
cd C:\Users\zbova\Projects\harry-potter-philosophers-stone
powershell -ExecutionPolicy Bypass -File .\tools\blender\export_all.ps1
```

Writes:

| GLB | Used by |
|-----|---------|
| `assets/props/holly_wand.glb` | Player wand + Ollivander pedestal |
| `assets/props/ollivander_box.glb` | Diagon Alley shop prop |
| `assets/props/flying_key.glb` | Trapdoor flying keys |
| `assets/props/golden_snitch.glb` | Diagon Quidditch display (qwen3-coder draft) |

## Add a new prop

1. Extend `build_hp_props.py` (or ask the LAN coder model for a bpy snippet).
2. Re-run `export_all.ps1`.
3. Register the URL in `js/assets.js` → `HP_GLB`.
4. Clone via `game.assets.cloneScene(HP_GLB.yourProp)` in the level builder.

## Unreal

High-fidelity target lives in `../harry-potter-ue`. Open with `LaunchEditor.bat` before using Unreal MCP. Blender GLBs can be imported there later as Static Meshes.
