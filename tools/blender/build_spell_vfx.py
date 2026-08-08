"""
Blender exports for spell VFX meshes (impact ring, Protego dome).
Run: blender --background --python tools/blender/build_spell_vfx.py
"""
from __future__ import annotations

import math
import sys
from pathlib import Path

import bpy

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "assets" / "props"


def clear_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for block in (bpy.data.meshes, bpy.data.materials):
        for item in list(block):
            block.remove(item)


def new_mat(name, color=(1, 1, 1, 1), roughness=0.2, metallic=0.0, emission=None, emission_strength=1.0, alpha=1.0):
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
    bsdf.inputs["Alpha"].default_value = alpha
    mat.blend_method = "BLEND"
    if emission is not None:
        if "Emission Color" in bsdf.inputs:
            bsdf.inputs["Emission Color"].default_value = emission
            bsdf.inputs["Emission Strength"].default_value = emission_strength
    links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return mat


def export_glb(path: Path, root: bpy.types.Object) -> None:
    bpy.ops.object.select_all(action="DESELECT")

    def select_tree(obj: bpy.types.Object) -> None:
        obj.select_set(True)
        for child in obj.children:
            select_tree(child)

    select_tree(root)
    bpy.context.view_layer.objects.active = root
    path.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=str(path),
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_yup=True,
    )
    print(f"Exported {path} ({path.stat().st_size} bytes)")


def build_impact_ring() -> None:
    clear_scene()
    emissive = new_mat(
        "ImpactEmissive",
        color=(0.9, 0.85, 1.0, 0.9),
        roughness=0.15,
        emission=(0.85, 0.75, 1.0, 1),
        emission_strength=2.5,
        alpha=0.85,
    )
    root = bpy.data.objects.new("spell_impact_ring", None)
    bpy.context.collection.objects.link(root)

    bpy.ops.mesh.primitive_torus_add(major_radius=0.35, minor_radius=0.045, location=(0, 0, 0))
    ring = bpy.context.active_object
    ring.name = "ring"
    ring.parent = root
    ring.data.materials.append(emissive)
    ring.rotation_euler = (math.pi / 2, 0, 0)

    bpy.ops.mesh.primitive_torus_add(major_radius=0.22, minor_radius=0.025, location=(0, 0.01, 0))
    inner = bpy.context.active_object
    inner.name = "inner_ring"
    inner.parent = root
    inner.data.materials.append(emissive)
    inner.rotation_euler = (math.pi / 2, 0, 0)

    export_glb(OUT / "spell_impact_ring.glb", root)


def build_protego_dome() -> None:
    clear_scene()
    shield = new_mat(
        "ProtegoShield",
        color=(0.55, 0.72, 1.0, 0.35),
        roughness=0.08,
        metallic=0.15,
        emission=(0.4, 0.65, 1.0, 1),
        emission_strength=1.2,
        alpha=0.35,
    )
    root = bpy.data.objects.new("protego_dome", None)
    bpy.context.collection.objects.link(root)

    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=3, radius=0.55, location=(0, 0.55, 0))
    dome = bpy.context.active_object
    dome.name = "dome"
    dome.parent = root
    dome.data.materials.append(shield)
    # Keep upper hemisphere feel
    dome.scale = (1.0, 0.55, 1.0)

    bpy.ops.mesh.primitive_torus_add(major_radius=0.52, minor_radius=0.018, location=(0, 0.08, 0))
    base = bpy.context.active_object
    base.name = "base_ring"
    base.parent = root
    base.data.materials.append(shield)
    base.rotation_euler = (math.pi / 2, 0, 0)

    export_glb(OUT / "protego_dome.glb", root)


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    build_impact_ring()
    build_protego_dome()
    print("Spell VFX GLBs exported.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"FATAL: {exc}", file=sys.stderr)
        raise
