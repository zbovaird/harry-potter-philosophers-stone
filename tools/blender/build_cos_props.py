"""
Headless Blender builder for Chamber of Secrets hero props (low-poly GLBs for Chrome).
Run: blender --background --python tools/blender/build_cos_props.py
"""
from __future__ import annotations

import math
import sys
from pathlib import Path

import bpy

ROOT = Path(__file__).resolve().parents[2]
OUT_PROPS = ROOT / "assets" / "props"


def clear_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for block in (bpy.data.meshes, bpy.data.materials, bpy.data.curves, bpy.data.objects):
        for item in list(block):
            block.remove(item)


def new_mat(name, color=(0.2, 0.12, 0.08, 1.0), roughness=0.55, metallic=0.0, emission=None, emission_strength=0.0):
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


def add_cylinder(name, radius_top, radius_bottom, depth, location, rotation=(0, 0, 0), vertices=16, parent=None, mat=None):
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


def add_uv_sphere(name, radius, location, segments=16, rings=10, parent=None, mat=None, scale=None):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=radius, location=location, segments=segments, ring_count=rings)
    obj = bpy.context.active_object
    link_object(obj, parent, name)
    if scale:
        obj.scale = scale
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


def collect_children(root):
    objs = [root]
    for obj in bpy.data.objects:
        if obj.parent == root or (obj.parent and obj.parent.parent == root):
            objs.append(obj)
    # Include full hierarchy
    seen = set()
    stack = [root]
    out = []
    while stack:
        cur = stack.pop()
        if cur.name in seen:
            continue
        seen.add(cur.name)
        out.append(cur)
        stack.extend(list(cur.children))
    return out


def build_ford_anglia():
    clear_scene()
    paint = new_mat("AngliaPaint", (0.08, 0.16, 0.42, 1), roughness=0.28, metallic=0.55)
    chrome = new_mat("AngliaChrome", (0.75, 0.78, 0.82, 1), roughness=0.18, metallic=0.95)
    glass = new_mat("AngliaGlass", (0.45, 0.65, 0.82, 1), roughness=0.08, metallic=0.15)
    rubber = new_mat("AngliaTire", (0.05, 0.05, 0.05, 1), roughness=0.9)
    light_m = new_mat("AngliaLamp", (0.95, 0.9, 0.7, 1), roughness=0.2, emission=(1, 0.95, 0.7, 1), emission_strength=1.4)
    root = bpy.data.objects.new("ford_anglia", None)
    bpy.context.collection.objects.link(root)
    body = add_cube("body", 1.0, (0, 0.55, 0), parent=root, mat=paint, scale=(0.85, 0.28, 1.7))
    cabin = add_cube("cabin", 1.0, (0, 0.95, -0.12), parent=root, mat=paint, scale=(0.78, 0.28, 0.85))
    windscreen = add_cube("glass", 1.0, (0, 1.02, -0.08), parent=root, mat=glass, scale=(0.7, 0.2, 0.78))
    bumper_f = add_cube("bumper_f", 1.0, (0, 0.42, 1.62), parent=root, mat=chrome, scale=(0.78, 0.06, 0.08))
    bumper_r = add_cube("bumper_r", 1.0, (0, 0.42, -1.62), parent=root, mat=chrome, scale=(0.78, 0.06, 0.08))
    extras = [body, cabin, windscreen, bumper_f, bumper_r]
    for i, x in enumerate((-0.72, 0.72)):
        for j, z in enumerate((-1.05, 1.05)):
            tire = add_uv_sphere(f"tire_{i}_{j}", 0.22, (x, 0.22, z), parent=root, mat=rubber, segments=12, rings=8)
            tire.scale = (0.45, 1, 1)
            extras.append(tire)
        lamp = add_uv_sphere(f"lamp_{i}", 0.08, (x * 0.7, 0.52, 1.68), parent=root, mat=light_m, segments=10, rings=8)
        extras.append(lamp)
    export_glb(OUT_PROPS / "ford_anglia.glb", collect_children(root))
    return root


def build_whomping_willow():
    clear_scene()
    bark = new_mat("WillowBark", (0.22, 0.14, 0.08, 1), roughness=0.92)
    leaf = new_mat("WillowLeaf", (0.12, 0.28, 0.08, 1), roughness=0.85)
    root = bpy.data.objects.new("whomping_willow", None)
    bpy.context.collection.objects.link(root)
    trunk = add_cylinder("trunk", 0.55, 0.95, 5.4, (0, 2.7, 0), parent=root, mat=bark, vertices=12)
    crown = add_uv_sphere("crown", 2.4, (0, 6.1, 0), parent=root, mat=leaf, segments=14, rings=10)
    crown.scale = (1.2, 0.65, 1.2)
    extras = [trunk, crown]
    for i in range(6):
        ang = i * (math.pi * 2 / 6)
        arm = add_cylinder(
            f"arm_{i}",
            0.06,
            0.14,
            3.2,
            (math.sin(ang) * 1.1, 4.4, math.cos(ang) * 1.1),
            rotation=(0.9, 0, ang),
            parent=root,
            mat=bark,
            vertices=8,
        )
        extras.append(arm)
    export_glb(OUT_PROPS / "whomping_willow.glb", collect_children(root))
    return root


def build_diary():
    clear_scene()
    leather = new_mat("DiaryLeather", (0.18, 0.08, 0.06, 1), roughness=0.7)
    gold = new_mat("DiaryGold", (0.78, 0.62, 0.2, 1), roughness=0.32, metallic=0.88)
    paper = new_mat("DiaryPaper", (0.82, 0.76, 0.62, 1), roughness=0.88)
    ink = new_mat("DiaryInk", (0.05, 0.08, 0.12, 1), roughness=0.4, emission=(0.1, 0.2, 0.35, 1), emission_strength=0.35)
    root = bpy.data.objects.new("tom_riddle_diary", None)
    bpy.context.collection.objects.link(root)
    cover = add_cube("cover", 1.0, (0, 0.03, 0), parent=root, mat=leather, scale=(0.18, 0.025, 0.26))
    pages = add_cube("pages", 1.0, (0.01, 0.03, 0), parent=root, mat=paper, scale=(0.16, 0.018, 0.24))
    clasp = add_cube("clasp", 1.0, (0.16, 0.04, 0), parent=root, mat=gold, scale=(0.03, 0.012, 0.05))
    glyph = add_cube("glyph", 1.0, (0, 0.056, 0.04), parent=root, mat=ink, scale=(0.08, 0.004, 0.1))
    export_glb(OUT_PROPS / "tom_riddle_diary.glb", [root, cover, pages, clasp, glyph])
    return root


def build_acromantula():
    clear_scene()
    chitin = new_mat("SpiderChitin", (0.08, 0.05, 0.04, 1), roughness=0.45, metallic=0.15)
    fang = new_mat("SpiderFang", (0.85, 0.82, 0.7, 1), roughness=0.25)
    root = bpy.data.objects.new("acromantula", None)
    bpy.context.collection.objects.link(root)
    abdomen = add_uv_sphere("abdomen", 0.38, (0, 0.38, -0.18), parent=root, mat=chitin, segments=12, rings=8)
    abdomen.scale = (1, 0.75, 1.3)
    head = add_uv_sphere("head", 0.16, (0, 0.36, 0.32), parent=root, mat=chitin, segments=10, rings=8)
    extras = [abdomen, head]
    for side in (-1, 1):
        f = add_cylinder(f"fang_{side}", 0.015, 0.03, 0.12, (side * 0.06, 0.28, 0.42), rotation=(1.1, 0, 0), parent=root, mat=fang, vertices=6)
        extras.append(f)
    for i in range(8):
        side = -1 if i < 4 else 1
        k = i % 4
        z = -0.25 + k * 0.18
        leg = add_cylinder(
            f"leg_{i}",
            0.02,
            0.035,
            0.7,
            (side * 0.42, 0.32, z),
            rotation=(0.35, 0, side * 0.9),
            parent=root,
            mat=chitin,
            vertices=6,
        )
        extras.append(leg)
    export_glb(OUT_PROPS / "acromantula.glb", collect_children(root))
    return root


def build_basilisk():
    clear_scene()
    scale = new_mat("BasiliskScale", (0.12, 0.28, 0.14, 1), roughness=0.38, metallic=0.12)
    eye = new_mat("BasiliskEye", (0.9, 0.75, 0.15, 1), roughness=0.15, emission=(1.0, 0.7, 0.1, 1), emission_strength=1.8)
    fang = new_mat("BasiliskFang", (0.9, 0.9, 0.85, 1), roughness=0.2)
    root = bpy.data.objects.new("basilisk", None)
    bpy.context.collection.objects.link(root)
    extras = []
    for i in range(8):
        r = 0.42 - i * 0.03
        seg = add_uv_sphere(f"seg_{i}", r, (0, 0.45, -i * 0.72), parent=root, mat=scale, segments=12, rings=8)
        seg.scale = (1.05, 0.7, 1.15)
        extras.append(seg)
    head = add_uv_sphere("head", 0.48, (0, 0.7, 0.55), parent=root, mat=scale, segments=14, rings=10)
    extras.append(head)
    for side in (-1, 1):
        extras.append(add_uv_sphere(f"eye_{side}", 0.07, (side * 0.22, 0.82, 0.78), parent=root, mat=eye, segments=8, rings=6))
        extras.append(
            add_cylinder(f"fang_{side}", 0.02, 0.04, 0.22, (side * 0.08, 0.48, 0.95), rotation=(1.2, 0, 0), parent=root, mat=fang, vertices=6)
        )
    export_glb(OUT_PROPS / "basilisk.glb", collect_children(root))
    return root


def build_mandrake():
    clear_scene()
    soil = new_mat("MandrakeSoil", (0.2, 0.12, 0.07, 1), roughness=0.95)
    skin = new_mat("MandrakeSkin", (0.55, 0.38, 0.22, 1), roughness=0.7)
    leaf = new_mat("MandrakeLeaf", (0.18, 0.42, 0.12, 1), roughness=0.8)
    pot = new_mat("MandrakePot", (0.35, 0.22, 0.14, 1), roughness=0.75)
    root = bpy.data.objects.new("mandrake", None)
    bpy.context.collection.objects.link(root)
    pot_obj = add_cylinder("pot", 0.18, 0.14, 0.22, (0, 0.11, 0), parent=root, mat=pot, vertices=12)
    dirt = add_uv_sphere("dirt", 0.16, (0, 0.22, 0), parent=root, mat=soil, segments=10, rings=8)
    dirt.scale = (1, 0.35, 1)
    body = add_uv_sphere("body", 0.1, (0, 0.34, 0), parent=root, mat=skin, segments=10, rings=8)
    head = add_uv_sphere("head", 0.07, (0, 0.46, 0), parent=root, mat=skin, segments=10, rings=8)
    extras = [pot_obj, dirt, body, head]
    for i in range(5):
        ang = i * 1.1
        leaf_obj = add_cube(f"leaf_{i}", 1.0, (math.sin(ang) * 0.12, 0.52, math.cos(ang) * 0.12), parent=root, mat=leaf, scale=(0.04, 0.16, 0.02))
        leaf_obj.rotation_euler = (0.4, ang, 0.2)
        extras.append(leaf_obj)
    export_glb(OUT_PROPS / "mandrake.glb", collect_children(root))
    return root


def main() -> int:
    OUT_PROPS.mkdir(parents=True, exist_ok=True)
    print(f"ROOT={ROOT}")
    build_ford_anglia()
    build_whomping_willow()
    build_diary()
    build_acromantula()
    build_basilisk()
    build_mandrake()
    print("Chamber of Secrets Blender props exported.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"FATAL: {exc}", file=sys.stderr)
        raise
