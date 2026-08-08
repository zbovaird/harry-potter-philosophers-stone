# Build Philosopher's Stone GLB props via headless Blender (Windows).
$ErrorActionPreference = "Stop"
$Repo = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
if (-not (Test-Path (Join-Path $Repo "package.json"))) {
  $Repo = "C:\Users\zbova\Projects\harry-potter-philosophers-stone"
}
$Script = Join-Path $Repo "tools\blender\build_hp_props.py"
$Blender = @(
  "${env:ProgramFiles}\Blender Foundation\Blender 5.2\blender.exe",
  "${env:ProgramFiles}\Blender Foundation\Blender 4.5\blender.exe",
  "${env:ProgramFiles}\Blender Foundation\Blender 4.2\blender.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $Blender) {
  throw "Blender not found. Install BlenderFoundation.Blender via winget."
}

Write-Host "Using $Blender"
Write-Host "Script $Script"
& $Blender --background --python $Script
if ($LASTEXITCODE -ne 0) { throw "Blender export failed with exit $LASTEXITCODE" }

$Snitch = Join-Path $Repo "tools\blender\build_golden_snitch.py"
if (Test-Path $Snitch) {
  & $Blender --background --python $Snitch
  if ($LASTEXITCODE -ne 0) { throw "Snitch export failed with exit $LASTEXITCODE" }
}

Get-ChildItem (Join-Path $Repo "assets\props\*.glb") | Format-Table Name, Length, LastWriteTime
