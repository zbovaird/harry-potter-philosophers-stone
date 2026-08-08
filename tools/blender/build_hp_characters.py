"""
Headless Blender builder for playable character GLBs.
Run on windows-64gb only (heavy mesh work):

  blender --background --python tools/blender/build_hp_characters.py

Exports assets/characters/<id>.glb with named nodes the game expects:
  hips, head, armL, armR, wand, wandTip, legL, legR
"""
from __future__ import annotations

import math
import sys
from pathlib import Path

import bpy

ROOT = Path(__file__).resolve().parents[2]
OUT_CHARS = ROOT / "assets" / "characters"

# Match js/characters.js palettes (linear-ish sRGB floats).
CHARACTERS = [
    {
        "id": "harry",
        "robe": (0.10, 0.23, 0.10, 1),
        "trim": (0.79, 0.64, 0.15, 1),
        "hair": (0.16, 0.09, 0.06, 1),
        "skin": (0.88, 0.69, 0.56, 1),
        "iris": (0.23, 0.42, 0.25, 1),
        "hair_style": "messy_short",
        "glasses": "round",
        "beard": None,
    },
    {
        "id": "hermione",
        "robe": (0.10, 0.16, 0.29, 1),
        "trim": (0.79, 0.64, 0.15, 1),
        "hair": (0.54, 0.29, 0.09, 1),
        "skin": (0.89, 0.72, 0.60, 1),
        "iris": (0.23, 0.29, 0.42, 1),
        "hair_style": "bushy",
        "glasses": None,
        "beard": None,
    },
    {
        "id": "ron",
        "robe": (0.29, 0.09, 0.09, 1),
        "trim": (0.79, 0.64, 0.15, 1),
        "hair": (0.72, 0.27, 0.09, 1),
        "skin": (0.89, 0.66, 0.53, 1),
        "iris": (0.30, 0.42, 0.55, 1),
        "hair_style": "ginger_short",
        "glasses": None,
        "beard": None,
    },
    {
        "id": "ginny",
        "robe": (0.35, 0.12, 0.12, 1),
        "trim": (0.79, 0.64, 0.15, 1),
        "hair": (0.77, 0.31, 0.12, 1),
        "skin": (0.89, 0.66, 0.53, 1),
        "iris": (0.30, 0.42, 0.55, 1),
        "hair_style": "long_wave",
        "glasses": None,
        "beard": None,
    },
    {
        "id": "luna",
        "robe": (0.23, 0.19, 0.38, 1),
        "trim": (0.72, 0.78, 0.88, 1),
        "hair": (0.85, 0.75, 0.44, 1),
        "skin": (0.91, 0.77, 0.66, 1),
        "iris": (0.45, 0.55, 0.70, 1),
        "hair_style": "long_straight",
        "glasses": None,
        "beard": None,
    },
    {
        "id": "bellatrix",
        "robe": (0.05, 0.05, 0.07, 1),
        "trim": (0.54, 0.60, 0.54, 1),
        "hair": (0.10, 0.07, 0.06, 1),
        "skin": (0.85, 0.66, 0.53, 1),
        "iris": (0.16, 0.10, 0.16, 1),
        "hair_style": "wild_long",
        "glasses": None,
        "beard": None,
    },
    {
        "id": "sirius",
        "robe": (0.10, 0.10, 0.13, 1),
        "trim": (0.66, 0.66, 0.69, 1),
        "hair": (0.08, 0.07, 0.06, 1),
        "skin": (0.83, 0.66, 0.53, 1),
        "iris": (0.35, 0.40, 0.48, 1),
        "hair_style": "long_masc",
        "glasses": None,
        "beard": None,
    },
    {
        "id": "lavender",
        "robe": (0.35, 0.16, 0.22, 1),
        "trim": (0.91, 0.72, 0.78, 1),
        "hair": (0.78, 0.63, 0.38, 1),
        "skin": (0.91, 0.77, 0.66, 1),
        "iris": (0.40, 0.48, 0.62, 1),
        "hair_style": "soft_long",
        "glasses": None,
        "beard": None,
    },
    {
        "id": "lupin",
        "robe": (0.23, 0.19, 0.16, 1),
        "trim": (0.72, 0.63, 0.44, 1),
        "hair": (0.42, 0.35, 0.25, 1),
        "skin": (0.85, 0.69, 0.56, 1),
        "iris": (0.35, 0.42, 0.35, 1),
        "hair_style": "messy_short",
        "glasses": None,
        "beard": "stubble",
    },
    {
        "id": "dumbledore",
        "robe": (0.29, 0.16, 0.41, 1),
        "trim": (0.83, 0.69, 0.22, 1),
        "hair": (0.91, 0.89, 0.85, 1),
        "skin": (0.88, 0.77, 0.63, 1),
        "iris": (0.29, 0.42, 0.54, 1),
        "hair_style": "elder_long",
        "glasses": "halfmoon",
        "beard": "long",
    },
]


def clear_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for block in (bpy.data.meshes, bpy.data.materials, bpy.data.curves, bpy.data.objects):
        for item in list(block):
            block.remove(item)


def new_mat(name, color, roughness=0.55, metallic=0.0, emission=None, emission_strength=0.0):
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


def empty(name, parent=None, location=(0, 0, 0)):
    obj = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(obj)
    obj.empty_display_size = 0.05
    obj.location = location
    if parent:
        obj.parent = parent
    return obj


def assign(obj, mat):
    if mat and obj.data:
        if obj.data.materials:
            obj.data.materials[0] = mat
        else:
            obj.data.materials.append(mat)
    return obj


def add_capsule(name, radius, depth, location, parent=None, mat=None, vertices=16):
    # Approximate capsule: cylinder + two UV spheres.
    root = empty(name, parent=parent, location=location)
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=max(0.01, depth), location=(0, 0, 0))
    body = bpy.context.active_object
    body.name = f"{name}_body"
    body.parent = root
    assign(body, mat)
    for sign, suffix in ((1, "top"), (-1, "bot")):
        bpy.ops.mesh.primitive_uv_sphere_add(
            radius=radius, location=(0, 0, sign * depth * 0.5), segments=vertices, ring_count=max(8, vertices // 2)
        )
        cap = bpy.context.active_object
        cap.name = f"{name}_{suffix}"
        cap.parent = root
        assign(cap, mat)
    return root


def add_sphere(name, radius, location, parent=None, mat=None, segments=20, rings=14, scale=None):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=radius, location=location, segments=segments, ring_count=rings)
    obj = bpy.context.active_object
    obj.name = name
    if parent:
        obj.parent = parent
    if scale:
        obj.scale = scale
    assign(obj, mat)
    return obj


def add_cube(name, location, scale, parent=None, mat=None):
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=location)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = scale
    if parent:
        obj.parent = parent
    assign(obj, mat)
    return obj


def add_cylinder(name, r_top, r_bot, depth, location, parent=None, mat=None, vertices=18, rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_cone_add(
        vertices=vertices,
        radius1=r_bot,
        radius2=r_top,
        depth=depth,
        location=location,
        rotation=rotation,
    )
    obj = bpy.context.active_object
    obj.name = name
    if parent:
        obj.parent = parent
    assign(obj, mat)
    return obj


def add_torus(name, major, minor, location, parent=None, mat=None, rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_torus_add(major_radius=major, minor_radius=minor, location=location, rotation=rotation)
    obj = bpy.context.active_object
    obj.name = name
    if parent:
        obj.parent = parent
    assign(obj, mat)
    return obj


def add_hair_lock(head, mat, x, y, z, length, thick, rot_z=0.0, rot_x=0.25, name="lock"):
    lock = add_capsule(name, thick, length, (x, y, z), parent=head, mat=mat, vertices=10)
    # Capsules in this helper are Z-up; tilt toward down/back for hair.
    lock.rotation_euler = (rot_x, 0.0, rot_z)
    return lock


def shade_smooth_all():
    for obj in bpy.data.objects:
        if obj.type == "MESH":
            bpy.context.view_layer.objects.active = obj
            obj.select_set(True)
            try:
                bpy.ops.object.shade_smooth()
            except Exception:
                pass
            obj.select_set(False)


def build_hair(head, char, hair_mat, dark_mat):
    style = char["hair_style"]
    if style == "messy_short":
        add_sphere("crown", 0.17, (0, 0.04, -0.01), parent=head, mat=hair_mat, scale=(1.12, 1.05, 1.15))
        for i in range(14):
            a = -1.2 + (i / 13) * 2.4
            add_hair_lock(
                head,
                hair_mat if i % 2 == 0 else dark_mat,
                math.sin(a) * 0.13,
                0.02,
                math.cos(a) * 0.1 - 0.02,
                0.12 + (i % 3) * 0.02,
                0.018,
                rot_z=math.sin(a) * 0.2,
                rot_x=-0.35 + (i % 4) * 0.05,
                name=f"lock_{i}",
            )
    elif style == "bushy":
        add_sphere("crown", 0.18, (0, 0.05, -0.02), parent=head, mat=hair_mat, scale=(1.35, 1.2, 1.4))
        add_sphere("volume", 0.17, (0, 0.0, -0.04), parent=head, mat=dark_mat, scale=(1.4, 1.15, 1.3))
        for i in range(26):
            a = -1.5 + (i / 25) * 3.0
            add_hair_lock(
                head,
                hair_mat if i % 2 == 0 else dark_mat,
                math.sin(a) * 0.17,
                -0.05 - (i % 5) * 0.02,
                math.cos(a) * 0.12 - 0.03,
                0.26 + (i % 4) * 0.04,
                0.026,
                rot_z=math.sin(a) * 0.35,
                rot_x=0.35,
                name=f"lock_{i}",
            )
    elif style in ("long_wave", "long_straight", "soft_long", "wild_long"):
        add_sphere("crown", 0.17, (0, 0.04, -0.01), parent=head, mat=hair_mat, scale=(1.12, 1.06, 1.16))
        count = 22 if style != "wild_long" else 28
        length = 0.4 if style != "soft_long" else 0.36
        spread = 0.15 if style != "wild_long" else 0.17
        for i in range(count):
            a = -1.45 + (i / (count - 1)) * 2.9
            add_hair_lock(
                head,
                hair_mat if i % 2 == 0 else dark_mat,
                math.sin(a) * spread,
                -0.1 - (i % 4) * 0.02,
                math.cos(a) * 0.1 - 0.05,
                length + (i % 3) * 0.03,
                0.016 + (0.004 if style == "wild_long" else 0),
                rot_z=math.sin(a) * (0.45 if style == "wild_long" else 0.3),
                rot_x=0.28,
                name=f"lock_{i}",
            )
        # Curtain bangs
        for side in (-1, 1):
            for k in range(5):
                add_hair_lock(
                    head,
                    hair_mat,
                    side * (0.04 + k * 0.025),
                    0.04 - k * 0.01,
                    0.13,
                    0.1 + k * 0.01,
                    0.013,
                    rot_z=side * (0.5 + k * 0.05),
                    rot_x=0.65,
                    name=f"bang_{side}_{k}",
                )
    elif style == "ginger_short":
        add_sphere("crown", 0.168, (0, 0.04, -0.01), parent=head, mat=hair_mat, scale=(1.1, 1.02, 1.12))
        for i in range(12):
            a = -1.0 + (i / 11) * 2.0
            add_hair_lock(
                head,
                hair_mat,
                math.sin(a) * 0.12,
                0.03,
                math.cos(a) * 0.09,
                0.1,
                0.017,
                rot_z=math.sin(a) * 0.15,
                rot_x=-0.25,
                name=f"lock_{i}",
            )
    elif style == "long_masc":
        add_sphere("crown", 0.165, (0, 0.03, -0.02), parent=head, mat=hair_mat, scale=(1.05, 1.0, 1.1))
        for i in range(18):
            a = -1.4 + (i / 17) * 2.8
            add_hair_lock(
                head,
                hair_mat if i % 2 == 0 else dark_mat,
                math.sin(a) * 0.13,
                -0.08 - (i % 3) * 0.02,
                math.cos(a) * 0.09 - 0.05,
                0.34,
                0.017,
                rot_z=math.sin(a) * 0.15,
                rot_x=0.2,
                name=f"lock_{i}",
            )
    elif style == "elder_long":
        add_sphere("crown", 0.17, (0, 0.05, -0.02), parent=head, mat=hair_mat, scale=(1.15, 1.1, 1.2))
        for i in range(20):
            a = -1.5 + (i / 19) * 3.0
            add_hair_lock(
                head,
                hair_mat,
                math.sin(a) * 0.14,
                -0.12 - (i % 4) * 0.025,
                math.cos(a) * 0.1 - 0.06,
                0.48,
                0.015,
                rot_z=math.sin(a) * 0.2,
                rot_x=0.22,
                name=f"lock_{i}",
            )


def build_beard(head, char, hair_mat, dark_mat):
    if char["beard"] == "stubble":
        for i in range(8):
            a = -0.8 + (i / 7) * 1.6
            add_sphere(
                f"stubble_{i}",
                0.02,
                (math.sin(a) * 0.08, -0.08, 0.1 + math.cos(a) * 0.02),
                parent=head,
                mat=dark_mat,
                scale=(1.0, 0.6, 0.7),
            )
    elif char["beard"] == "long":
        beard = add_capsule("beard", 0.07, 0.42, (0, -0.28, 0.06), parent=head, mat=hair_mat, vertices=12)
        beard.scale = (1.15, 0.85, 1.0)
        mustache = add_cube("mustache", (0, -0.04, 0.13), (0.1, 0.025, 0.03), parent=head, mat=hair_mat)


def build_glasses(head, style, trim_mat):
    rim = trim_mat if style == "halfmoon" else new_mat("GlassesRim", (0.08, 0.08, 0.08, 1), roughness=0.25, metallic=0.85)
    r = 0.042 if style == "halfmoon" else 0.038
    for x, side in ((-0.05, "L"), (0.05, "R")):
        ring = add_torus(f"glass_{side}", r, 0.005, (x, 0.02, 0.145), parent=head, mat=rim)
        if style == "halfmoon":
            ring.rotation_euler = (0.35, 0, 0)
    add_cube("bridge", (0, 0.02, 0.15), (0.035, 0.006, 0.006), parent=head, mat=rim)


def build_wand(arm_r, wood_mat, tip_mat):
    wand = empty("wand", parent=arm_r, location=(0.02, -0.38, 0.06))
    wand.rotation_euler = (0.55, 0.0, -0.35)
    add_cylinder("shaft", 0.011, 0.017, 0.36, (0, 0.18, 0), parent=wand, mat=wood_mat, vertices=14)
    tip = add_sphere("wandTip", 0.016, (0, 0.37, 0), parent=wand, mat=tip_mat, segments=12, rings=10)
    return wand, tip


def export_glb(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(
        filepath=str(path),
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_yup=True,
    )
    print(f"Exported {path}")


def build_character(char: dict) -> None:
    clear_scene()
    robe_mat = new_mat(f"{char['id']}_robe", char["robe"], roughness=0.72)
    trim_mat = new_mat(f"{char['id']}_trim", char["trim"], roughness=0.28, metallic=0.9)
    hair_mat = new_mat(f"{char['id']}_hair", char["hair"], roughness=0.78)
    dark_hair = tuple(min(1.0, c * 0.7) if i < 3 else c for i, c in enumerate(char["hair"]))
    dark_mat = new_mat(f"{char['id']}_hairDark", dark_hair, roughness=0.85)
    skin_mat = new_mat(f"{char['id']}_skin", char["skin"], roughness=0.48)
    pant_mat = new_mat(f"{char['id']}_pant", (0.10, 0.10, 0.13, 1), roughness=0.82)
    boot_mat = new_mat(f"{char['id']}_boot", (0.16, 0.10, 0.07, 1), roughness=0.7)
    wood_mat = new_mat(f"{char['id']}_wand", (0.24, 0.15, 0.09, 1), roughness=0.62, metallic=0.08)
    tip_mat = new_mat(
        f"{char['id']}_tip",
        (0.91, 0.85, 0.69, 1),
        roughness=0.3,
        metallic=0.4,
        emission=(1.0, 0.85, 0.45, 1),
        emission_strength=0.45,
    )
    eye_w = new_mat(f"{char['id']}_eyeW", (0.95, 0.94, 0.92, 1), roughness=0.35)
    iris_mat = new_mat(f"{char['id']}_iris", char["iris"], roughness=0.25)
    pupil_mat = new_mat(f"{char['id']}_pupil", (0.04, 0.04, 0.04, 1), roughness=0.2)

    root = empty(char["id"])
    hips = empty("hips", parent=root, location=(0, 0.92, 0))

    # Torso / robe
    add_capsule("torso", 0.22, 0.42, (0, 0.16, 0), parent=hips, mat=robe_mat, vertices=18)
    cloak = add_cube("cloak", (0, -0.15, -0.2), (0.55, 0.85, 0.04), parent=hips, mat=robe_mat)
    cloak.rotation_euler = (0.12, 0, 0)
    # Soft robe panels for volume (reads better than a single capsule)
    add_cube("robe_panel_l", (-0.16, -0.05, 0.05), (0.14, 0.55, 0.18), parent=hips, mat=robe_mat)
    add_cube("robe_panel_r", (0.16, -0.05, 0.05), (0.14, 0.55, 0.18), parent=hips, mat=robe_mat)
    add_torus("trim", 0.21, 0.018, (0, 0.34, 0), parent=hips, mat=trim_mat, rotation=(math.pi / 2, 0, 0))
    crest = add_sphere("crest", 0.06, (0.16, 0.22, 0.2), parent=hips, mat=trim_mat, segments=12, rings=8)
    crest.scale = (1, 1, 0.35)

    # Head
    head = empty("head", parent=hips, location=(0, 0.58, 0))
    add_sphere("skull", 0.155, (0, 0, 0), parent=head, mat=skin_mat, segments=24, rings=16)
    for x, side in ((-0.14, "L"), (0.14, "R")):
        ear = add_sphere(f"ear_{side}", 0.035, (x, 0, 0), parent=head, mat=skin_mat, segments=10, rings=8)
        ear.scale = (0.6, 1.0, 0.5)
    for x, side in ((-0.05, "L"), (0.05, "R")):
        add_sphere(f"eyeW_{side}", 0.028, (x, 0.02, 0.13), parent=head, mat=eye_w, segments=10, rings=8).scale = (1, 0.85, 0.7)
        add_sphere(f"iris_{side}", 0.014, (x, 0.02, 0.148), parent=head, mat=iris_mat, segments=8, rings=6)
        add_sphere(f"pupil_{side}", 0.007, (x, 0.02, 0.158), parent=head, mat=pupil_mat, segments=6, rings=4)
    build_hair(head, char, hair_mat, dark_mat)
    build_beard(head, char, hair_mat, dark_mat)
    if char["glasses"]:
        build_glasses(head, char["glasses"], trim_mat)

    # Arms
    arm_l = empty("armL", parent=hips, location=(-0.3, 0.3, 0))
    add_capsule("upperL", 0.055, 0.24, (0, -0.15, 0), parent=arm_l, mat=robe_mat, vertices=12)
    add_sphere("handL", 0.045, (0, -0.36, 0), parent=arm_l, mat=skin_mat, segments=12, rings=8)

    arm_r = empty("armR", parent=hips, location=(0.3, 0.3, 0))
    add_capsule("upperR", 0.055, 0.24, (0, -0.15, 0), parent=arm_r, mat=robe_mat, vertices=12)
    add_sphere("handR", 0.045, (0, -0.36, 0), parent=arm_r, mat=skin_mat, segments=12, rings=8)
    build_wand(arm_r, wood_mat, tip_mat)

    # Legs
    for x, name in ((-0.1, "legL"), (0.1, "legR")):
        leg = empty(name, parent=hips, location=(x, -0.15, 0))
        add_capsule("thigh", 0.075, 0.28, (0, -0.28, 0), parent=leg, mat=pant_mat, vertices=12)
        add_cube("boot", (0, -0.58, 0.04), (0.12, 0.1, 0.2), parent=leg, mat=boot_mat)

    # Authored in Three.js Y-up coordinates inside Blender (Z-up). Rotate into
    # Blender Z-up before glTF Y-up export so the character stands in Three.js.
    root.rotation_euler = (math.pi / 2, 0.0, 0.0)
    bpy.context.view_layer.update()

    shade_smooth_all()
    export_glb(OUT_CHARS / f"{char['id']}.glb")


def main() -> int:
    OUT_CHARS.mkdir(parents=True, exist_ok=True)
    print(f"ROOT={ROOT}")
    print(f"Building {len(CHARACTERS)} character GLBs on this machine (expected: windows-64gb)...")
    for char in CHARACTERS:
        print(f"--- {char['id']} ---")
        build_character(char)
    print("All character GLBs exported to assets/characters/")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"FATAL: {exc}", file=sys.stderr)
        raise
