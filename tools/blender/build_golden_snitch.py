"""Generated via qwen3-coder:30b on windows-64gb, lightly cleaned for Blender 5.2."""
import bpy

bpy.ops.wm.read_factory_settings(use_empty=True)

root_empty = bpy.data.objects.new("golden_snitch", None)
bpy.context.scene.collection.objects.link(root_empty)

bpy.ops.mesh.primitive_uv_sphere_add(radius=0.04, location=(0, 0, 0))
body = bpy.context.active_object
body.name = "snitch_body"

mat = bpy.data.materials.new(name="BrassGold")
mat.use_nodes = True
nodes = mat.node_tree.nodes
links = mat.node_tree.links
nodes.clear()
principled = nodes.new(type="ShaderNodeBsdfPrincipled")
principled.inputs["Base Color"].default_value = (1.0, 0.8, 0.2, 1.0)
principled.inputs["Metallic"].default_value = 0.9
principled.inputs["Roughness"].default_value = 0.1
output = nodes.new(type="ShaderNodeOutputMaterial")
links.new(principled.outputs["BSDF"], output.inputs["Surface"])
body.data.materials.append(mat)

bpy.ops.mesh.primitive_cube_add(size=0.08, location=(0.06, 0, 0.01))
wing1 = bpy.context.active_object
wing1.name = "wing1"
wing1.scale = (1.2, 0.02, 0.35)
wing1.rotation_euler[1] = 0.35

bpy.ops.mesh.primitive_cube_add(size=0.08, location=(-0.06, 0, 0.01))
wing2 = bpy.context.active_object
wing2.name = "wing2"
wing2.scale = (1.2, 0.02, 0.35)
wing2.rotation_euler[1] = -0.35

bpy.ops.mesh.primitive_torus_add(major_radius=0.018, minor_radius=0.003, location=(0, 0, 0.05))
ring = bpy.context.active_object
ring.name = "silver_ring"

silver_mat = bpy.data.materials.new(name="Silver")
silver_mat.use_nodes = True
nodes = silver_mat.node_tree.nodes
links = silver_mat.node_tree.links
nodes.clear()
principled_silver = nodes.new(type="ShaderNodeBsdfPrincipled")
principled_silver.inputs["Base Color"].default_value = (0.8, 0.8, 0.8, 1.0)
principled_silver.inputs["Metallic"].default_value = 0.9
principled_silver.inputs["Roughness"].default_value = 0.1
output_silver = nodes.new(type="ShaderNodeOutputMaterial")
links.new(principled_silver.outputs["BSDF"], output_silver.inputs["Surface"])
ring.data.materials.append(silver_mat)

for obj in (body, wing1, wing2, ring):
    obj.parent = root_empty

bpy.ops.object.select_all(action="DESELECT")
for obj in (root_empty, body, wing1, wing2, ring):
    obj.select_set(True)

export_path = r"C:\Users\zbova\Projects\harry-potter-philosophers-stone\assets\props\golden_snitch.glb"
bpy.ops.export_scene.gltf(
    filepath=export_path,
    export_format="GLB",
    use_selection=True,
    export_apply=True,
    export_yup=True,
)
print(f"Exported to: {export_path}")
