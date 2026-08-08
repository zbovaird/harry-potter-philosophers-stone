# Build Philosopher's Stone GLB props + characters via headless Blender (Windows).
# Intended host: windows-64gb (Zach_PC). Do not run Blender exports on the Mac/cloud agent.
$ErrorActionPreference = "Stop"
$Repo = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
if (-not (Test-Path (Join-Path $Repo "package.json"))) {
  $Repo = "C:\Users\zbova\Projects\harry-potter-philosophers-stone"
}
$Blender = @(
  "${env:ProgramFiles}\Blender Foundation\Blender 5.2\blender.exe",
  "${env:ProgramFiles}\Blender Foundation\Blender 4.5\blender.exe",
  "${env:ProgramFiles}\Blender Foundation\Blender 4.2\blender.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $Blender) {
  throw "Blender not found. Install BlenderFoundation.Blender via winget."
}

Write-Host "Using $Blender"
Write-Host "Repo $Repo"

function Invoke-BlenderScript([string]$RelativeScript) {
  $Script = Join-Path $Repo $RelativeScript
  if (-not (Test-Path $Script)) { throw "Missing $Script" }
  Write-Host "Running $RelativeScript"
  & $Blender --background --python $Script
  if ($LASTEXITCODE -ne 0) { throw "Blender failed ($RelativeScript) exit $LASTEXITCODE" }
}

Invoke-BlenderScript "tools\blender\build_hp_props.py"

$Snitch = Join-Path $Repo "tools\blender\build_golden_snitch.py"
if (Test-Path $Snitch) {
  Invoke-BlenderScript "tools\blender\build_golden_snitch.py"
}

Invoke-BlenderScript "tools\blender\build_hp_characters.py"

Write-Host "`nProps:"
Get-ChildItem (Join-Path $Repo "assets\props\*.glb") -ErrorAction SilentlyContinue |
  Format-Table Name, Length, LastWriteTime

Write-Host "Characters:"
Get-ChildItem (Join-Path $Repo "assets\characters\*.glb") -ErrorAction SilentlyContinue |
  Format-Table Name, Length, LastWriteTime
