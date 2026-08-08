"""Export patronus stag GLB for Forest level."""
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


def new_mat(name, color, emission=None, emission_strength=1.5, alpha=0.9):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    out = nodes.new("ShaderNodeOutputMaterial")
    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Alpha"].default_value = alpha
    mat.blend_method = "BLEND"
    if emission and "Emission Color" in bsdf.inputs:
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
    bpy.ops.export_scene.gltf(filepath=str(path), export_format="GLB", use_selection=True, export_apply=True, export_yup=True)
    print(f"Exported {path}")


def build_patronus_stag() -> None:
    clear_scene()
    silver = new_mat("PatronusSilver", (0.85, 0.92, 1.0, 0.88), emission=(0.7, 0.85, 1.0, 1), emission_strength=2.2)
    root = bpy.data.objects.new("patronus_stag", None)
    bpy.context.collection.objects.link(root)

    # Body
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.22, location=(0, 0.35, 0))
    body = bpy.context.active_object
    body.name = "body"
    body.parent = root
    body.data.materials.append(silver)
    body.scale = (0.7, 1.2, 0.55)

    # Neck + head
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.1, location=(0, 0.62, 0.12))
    head = bpy.context.active_object
    head.name = "head"
    head.parent = root
    head.data.materials.append(silver)

    # Antlers (simple branches)
    for side, sx in (("L", -1), ("R", 1)):
        bpy.ops.mesh.primitive_cone_add(radius1=0.01, radius2=0.004, depth=0.28, location=(0.06 * sx, 0.72, 0.1))
        ant = bpy.context.active_object
        ant.name = f"antler_{side}"
        ant.parent = root
        ant.rotation_euler = (0.5, 0.2 * sx, 0.35 * sx)
        ant.data.materials.append(silver)

    # Legs
    for x, z, name in ((-0.12, -0.08, "leg_fl"), (0.12, -0.08, "leg_fr"), (-0.1, 0.08, "leg_bl"), (0.1, 0.08, "leg_br")):
        bpy.ops.mesh.primitive_cylinder_add(radius=0.025, depth=0.35, location=(x, 0.12, z))
        leg = bpy.context.active_object
        leg.name = name
        leg.parent = root
        leg.data.materials.append(silver)

    export_glb(OUT / "patronus_stag.glb", root)


def main() -> int:
    build_patronus_stag()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
