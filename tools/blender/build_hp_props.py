"""
Headless Blender builder for Philosopher's Stone hero/prop GLBs.
Run: blender --background --python tools/blender/build_hp_props.py
"""
from __future__ import annotations

import math
import os
import sys
from pathlib import Path

import bpy
from mathutils import Vector

# When run via Blender, __file__ is available.
ROOT = Path(__file__).resolve().parents[2]
OUT_PROPS = ROOT / "assets" / "props"
OUT_CHARS = ROOT / "assets" / "characters"


def clear_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for block in (bpy.data.meshes, bpy.data.materials, bpy.data.curves, bpy.data.objects):
        for item in list(block):
            block.remove(item)


def ensure_dirs() -> None:
    OUT_PROPS.mkdir(parents=True, exist_ok=True)
    OUT_CHARS.mkdir(parents=True, exist_ok=True)


def new_mat(name: str, color=(0.2, 0.12, 0.08, 1.0), roughness=0.55, metallic=0.0, emission=None, emission_strength=0.0):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    out = nodes.new("ShaderNodeOutputMaterial")
    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    if emission is not None and "Emission Color" in bsdf.inputs:
        bsdf.inputs["Emission Color"].default_value = emission
        bsdf.inputs["Emission Strength"].default_value = emission_strength
    links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return mat


def link_object(obj, parent=None, name=None):
    if name:
        obj.name = name
    if parent:
        obj.parent = parent
    return obj


def add_cylinder(name, radius_top, radius_bottom, depth, location, rotation=(0, 0, 0), vertices=24, parent=None, mat=None):
    bpy.ops.mesh.primitive_cone_add(
        vertices=vertices,
        radius1=radius_bottom,
        radius2=radius_top,
        depth=depth,
        location=location,
        rotation=rotation,
    )
    obj = bpy.context.active_object
    link_object(obj, parent, name)
    if mat:
        obj.data.materials.append(mat)
    return obj


def add_uv_sphere(name, radius, location, segments=24, rings=16, parent=None, mat=None, scale=None):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=radius, location=location, segments=segments, ring_count=rings)
    obj = bpy.context.active_object
    link_object(obj, parent, name)
    if scale:
        obj.scale = scale
    if mat:
        obj.data.materials.append(mat)
    return obj


def add_torus(name, major, minor, location, rotation=(0, 0, 0), parent=None, mat=None):
    bpy.ops.mesh.primitive_torus_add(
        major_radius=major,
        minor_radius=minor,
        location=location,
        rotation=rotation,
    )
    obj = bpy.context.active_object
    link_object(obj, parent, name)
    if mat:
        obj.data.materials.append(mat)
    return obj


def add_cube(name, size, location, parent=None, mat=None, scale=None):
    bpy.ops.mesh.primitive_cube_add(size=size, location=location)
    obj = bpy.context.active_object
    link_object(obj, parent, name)
    if scale:
        obj.scale = scale
    if mat:
        obj.data.materials.append(mat)
    return obj


def export_glb(path: Path, objects: list) -> None:
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objects:
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj
    path.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=str(path),
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_yup=True,
    )
    print(f"Exported {path}")


def build_holly_wand() -> bpy.types.Object:
    clear_scene()
    wood = new_mat("HollyWood", (0.38, 0.24, 0.14, 1), roughness=0.62, metallic=0.05)
    dark = new_mat("WandGrip", (0.12, 0.07, 0.04, 1), roughness=0.7)
    gold = new_mat("GoldBand", (0.82, 0.65, 0.22, 1), roughness=0.28, metallic=0.92)
    tip_m = new_mat(
        "WandTip",
        (0.92, 0.86, 0.7, 1),
        roughness=0.25,
        metallic=0.35,
        emission=(1.0, 0.85, 0.45, 1),
        emission_strength=0.55,
    )

    root = bpy.data.objects.new("holly_wand", None)
    bpy.context.collection.objects.link(root)

    # Unit: meters. Tip at +Y so Three.js wandTip naming stays clear.
    shaft = add_cylinder("shaft", 0.008, 0.014, 0.32, (0, 0.18, 0), parent=root, mat=wood, vertices=20)
    grip = add_cylinder("grip", 0.015, 0.017, 0.08, (0, 0.04, 0), parent=root, mat=dark, vertices=18)
    band = add_torus("band", 0.016, 0.0035, (0, 0.08, 0), rotation=(math.pi / 2, 0, 0), parent=root, mat=gold)
    tip = add_uv_sphere("wandTip", 0.012, (0, 0.35, 0), parent=root, mat=tip_m, segments=16, rings=12)
    # Phoenix-feather hint etched as thin gold helix stubs
    for i in range(5):
        y = 0.12 + i * 0.035
        flake = add_cube(
            f"feather_{i}",
            0.01,
            (0.01, y, 0),
            parent=root,
            mat=gold,
            scale=(0.35, 1.4, 0.12),
        )
        flake.rotation_euler = (0, 0, i * 0.6)

    export_glb(OUT_PROPS / "holly_wand.glb", [root, shaft, grip, band, tip] + [o for o in bpy.data.objects if o.name.startswith("feather_")])
    return root


def build_ollivander_box() -> bpy.types.Object:
    clear_scene()
    card = new_mat("BoxCardboard", (0.55, 0.42, 0.28, 1), roughness=0.85)
    ink = new_mat("BoxInk", (0.12, 0.1, 0.08, 1), roughness=0.55)
    velvet = new_mat("BoxVelvet", (0.25, 0.05, 0.05, 1), roughness=0.95)
    gold = new_mat("BoxGold", (0.78, 0.62, 0.2, 1), roughness=0.35, metallic=0.85)

    root = bpy.data.objects.new("ollivander_box", None)
    bpy.context.collection.objects.link(root)

    body = add_cube("body", 1.0, (0, 0.045, 0), parent=root, mat=card, scale=(0.28, 0.09, 0.05))
    lid = add_cube("lid", 1.0, (0, 0.095, 0), parent=root, mat=card, scale=(0.282, 0.02, 0.052))
    liner = add_cube("liner", 1.0, (0, 0.05, 0), parent=root, mat=velvet, scale=(0.24, 0.03, 0.035))
    label = add_cube("label", 1.0, (0, 0.1, 0.027), parent=root, mat=ink, scale=(0.18, 0.008, 0.03))
    trim = add_cube("trim", 1.0, (0, 0.1, 0.028), parent=root, mat=gold, scale=(0.2, 0.003, 0.034))

    # Mini wand resting in the open box
    wood = new_mat("MiniWand", (0.3, 0.18, 0.1, 1), roughness=0.6)
    mini = add_cylinder("mini_wand", 0.004, 0.006, 0.2, (0, 0.06, 0), rotation=(0, 0, math.pi / 2), parent=root, mat=wood, vertices=12)

    export_glb(
        OUT_PROPS / "ollivander_box.glb",
        [root, body, lid, liner, label, trim, mini],
    )
    return root


def build_flying_key() -> bpy.types.Object:
    clear_scene()
    brass = new_mat("KeyBrass", (0.78, 0.62, 0.22, 1), roughness=0.35, metallic=0.9)
    wing_m = new_mat(
        "KeyWing",
        (0.95, 0.9, 0.65, 1),
        roughness=0.4,
        metallic=0.55,
        emission=(1.0, 0.9, 0.5, 1),
        emission_strength=0.25,
    )

    root = bpy.data.objects.new("flying_key", None)
    bpy.context.collection.objects.link(root)

    shaft = add_cylinder("key_shaft", 0.012, 0.012, 0.28, (0, 0, 0), rotation=(0, math.pi / 2, 0), parent=root, mat=brass)
    bow = add_torus("key_bow", 0.05, 0.012, (-0.16, 0, 0), rotation=(0, math.pi / 2, 0), parent=root, mat=brass)
    bit = add_cube("key_bit", 1.0, (0.14, -0.03, 0), parent=root, mat=brass, scale=(0.04, 0.06, 0.02))
    wing_l = add_cube("wing_l", 1.0, (0, 0.08, 0.02), parent=root, mat=wing_m, scale=(0.04, 0.12, 0.01))
    wing_l.rotation_euler = (0.4, 0, 0.35)
    wing_r = add_cube("wing_r", 1.0, (0, 0.08, -0.02), parent=root, mat=wing_m, scale=(0.04, 0.12, 0.01))
    wing_r.rotation_euler = (-0.4, 0, -0.35)

    export_glb(OUT_PROPS / "flying_key.glb", [root, shaft, bow, bit, wing_l, wing_r])
    return root


def main() -> int:
    ensure_dirs()
    print(f"ROOT={ROOT}")
    build_holly_wand()
    build_ollivander_box()
    build_flying_key()
    print("All Harry Potter Blender props exported.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"FATAL: {exc}", file=sys.stderr)
        raise
