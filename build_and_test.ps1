#Requires -Version 5.1
<#
.SYNOPSIS
    Builds the Demo project, installs it via the Qt IFW setup, and verifies
    the Windows "installed apps" registry entry.
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
$ProjectRoot = $PSScriptRoot
$BuildDir = [IO.Path]::Combine($ProjectRoot, 'build', 'Qt-6.9.1', 'Release')
$QtBinDir = 'C:\Qt\6.9.1\msvc2022_64\bin'
$VsInstallPath = 'C:\Program Files\Microsoft Visual Studio\18\Professional'

# Registry paths checked by Windows "installed apps" (Apps & features / Programs and Features)
$UninstallPaths = @(
  'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall'
  'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall'
  'HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall'
)

# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------
function Write-Step([string]$Message) {
  Write-Host "`n==> $Message" -ForegroundColor Cyan
}

function Invoke-NativeCommand([string]$Exe, [string[]]$Arguments) {
  & $Exe @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "Command failed (exit $LASTEXITCODE): $Exe $Arguments"
  }
}

# ---------------------------------------------------------------------------
# Step 1 – Set up the MSVC x64 developer environment
# ---------------------------------------------------------------------------
Write-Step 'Setting up MSVC x64 environment'

$devShellDll = Join-Path $VsInstallPath 'Common7\Tools\Microsoft.VisualStudio.DevShell.dll'
if (-not (Test-Path $devShellDll)) {
  throw "Microsoft.VisualStudio.DevShell.dll not found at: $devShellDll"
}

Import-Module $devShellDll
Enter-VsDevShell -VsInstallPath $VsInstallPath -StartInPath . -Arch amd64 -HostArch amd64
Write-Host "  MSVC environment applied."

# ---------------------------------------------------------------------------
# Step 2 – Ensure Qt bin dir is on PATH
# ---------------------------------------------------------------------------
Write-Step 'Updating PATH'

if ($env:PATH -notlike "*$QtBinDir*") {
  $env:PATH = "$QtBinDir;$env:PATH"
  Write-Host "  Added: $QtBinDir"
}

# ---------------------------------------------------------------------------
# Step 3 – Build the 'package' target
# ---------------------------------------------------------------------------
Write-Step "Building 'package' target in $BuildDir"

if (-not (Test-Path $BuildDir)) {
  throw "Build directory not found: $BuildDir`nRun a CMake configure step first."
}

Push-Location $BuildDir
try {
  Invoke-NativeCommand cmake @('--build', '.', '--target', 'package', '--config', 'Debug')
} finally {
  Pop-Location
}

# ---------------------------------------------------------------------------
# Step 4 – Locate the generated setup executable
# ---------------------------------------------------------------------------
Write-Step 'Locating setup executable'

$setupExe = Get-ChildItem -Path $BuildDir -Filter '*-Setup.exe' -File |
Sort-Object LastWriteTime -Descending |
Select-Object -First 1

if (-not $setupExe) {
  throw "No setup executable (*-Setup.exe) found in $BuildDir"
}

Write-Host "  Found: $($setupExe.FullName)"

# ---------------------------------------------------------------------------
# Step 5 – Install the application (silent, no GUI)
#
# Qt IFW 4.x flags used:
#   --silentinstallation  suppress interactive UI
#   --default-answer      accept all default answers
#   --confirm-command     skip the final summary page
# ---------------------------------------------------------------------------
Write-Step "Installing via $($setupExe.Name)"

Invoke-NativeCommand $setupExe.FullName @(
  '--accept-licenses'
  '--default-answer'
  '--confirm-command'
  'install'
)

Write-Host "  Installation finished (exit 0)."

# ---------------------------------------------------------------------------
# Step 6 – Check for the "installed apps" registry entry
# ---------------------------------------------------------------------------
Write-Step 'Checking Windows "installed apps" registry entry'

$appName = 'Demo'   # matches CPACK_IFW_PACKAGE_NAME / CPACK_PACKAGE_NAME
$found = $false
$uninstallerExe = $null
$installLocation = $null

foreach ($basePath in $UninstallPaths) {
  if (-not (Test-Path $basePath)) { continue }

  # Qt IFW may use the package name or the component identifier as the key name.
  Get-ChildItem -Path $basePath -ErrorAction SilentlyContinue | ForEach-Object {
    $props = Get-ItemProperty -Path $_.PSPath -ErrorAction SilentlyContinue
    if (-not $props) { return }
    $displayName = $props | Select-Object -ExpandProperty DisplayName -ErrorAction SilentlyContinue
    if ($displayName -and $displayName -eq $appName) {
      Write-Host ""
      Write-Host "  [PASS] Registry entry found:" -ForegroundColor Green
      Write-Host "         Path        : $($_.PSPath)"
      Write-Host "         DisplayName : $displayName"
      Write-Host "         Publisher   : $($props.Publisher)"
      Write-Host "         Version     : $($props.DisplayVersion)"
      Write-Host "         InstallDir  : $($props.InstallLocation)"
      $found = $true
      # UninstallString may be: "C:\path\Uninstall.exe" --start-uninstaller
      # Extract just the executable path, stripping surrounding quotes and arguments
      $rawUninstallString = $props | Select-Object -ExpandProperty UninstallString -ErrorAction SilentlyContinue
      if ($rawUninstallString -match '^"([^"]+)"') {
        $uninstallerExe = $Matches[1]
      } elseif ($rawUninstallString -match '^(\S+)') {
        $uninstallerExe = $Matches[1]
      }
      $installLocation = $props | Select-Object -ExpandProperty InstallLocation -ErrorAction SilentlyContinue
    }
  }
}

if (-not $found) {
  Write-Host ""
  Write-Host "  [FAIL] No registry entry with DisplayName='$appName' found." -ForegroundColor Red
  Write-Host "         Checked locations:"
  foreach ($p in $UninstallPaths) { Write-Host "           $p" }
  Write-Host ""
  exit 1
}

# ---------------------------------------------------------------------------
# Step 7 – Uninstall the application
# ---------------------------------------------------------------------------
Write-Step 'Uninstalling the application'

if (-not $uninstallerExe -or -not (Test-Path $uninstallerExe)) {
  # Fall back: construct path from InstallLocation captured in step 6
  if ($installLocation) {
    $uninstallerExe = Join-Path $installLocation 'Uninstall.exe'
  }
}

if (-not $uninstallerExe -or -not (Test-Path $uninstallerExe)) {
  throw "Uninstaller executable not found. Cannot proceed with uninstallation."
}

Write-Host "  Uninstaller: $uninstallerExe"

Invoke-NativeCommand $uninstallerExe @(
  '--accept-licenses'
  '--default-answer'
  '--confirm-command'
  'purge'
)

Write-Host "  Uninstallation finished (exit 0)."

Write-Host ""
Write-Host "All steps completed successfully." -ForegroundColor Green
