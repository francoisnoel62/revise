# ABOUTME: Creates an isolated git worktree and launches Claude CLI inside it.
# ABOUTME: Junctions node_modules and copies .env.local with a unique DB name.

param(
    [Parameter(Mandatory = $false)]
    [string]$Name
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not $Name) {
    $Name = "session-$(Get-Date -Format 'yyyyMMdd-HHmm')"
}

$rootDir    = Split-Path $PSScriptRoot -Parent
$parentDir  = Split-Path $rootDir -Parent
$worktreeDir = Join-Path $parentDir "Revise-$Name"
$branchName  = "session/$Name"

# --- Worktree ---
Write-Host "Creating worktree '$branchName' at $worktreeDir ..."
git -C $rootDir worktree add $worktreeDir -b $branchName
if ($LASTEXITCODE -ne 0) { Write-Error "git worktree add failed"; exit 1 }

# --- node_modules junction (avoids reinstall) ---
$srcModules = Join-Path $rootDir "node_modules"
$dstModules = Join-Path $worktreeDir "node_modules"
if ((Test-Path $srcModules) -and -not (Test-Path $dstModules)) {
    Write-Host "Linking node_modules ..."
    New-Item -ItemType Junction -Path $dstModules -Target $srcModules | Out-Null
}

# --- .env.local with unique MONGODB_DB_NAME ---
$envSrc = Join-Path $rootDir ".env.local"
$envDst = Join-Path $worktreeDir ".env.local"
if (Test-Path $envSrc) {
    Write-Host "Copying .env.local ..."
    $safeName   = $Name -replace '[^a-zA-Z0-9]', '_'
    $envContent = Get-Content $envSrc -Raw
    $envContent = $envContent -replace '(?m)^(MONGODB_DB_NAME=).+$', "`${1}revise_$safeName"
    [System.IO.File]::WriteAllText($envDst, $envContent, [System.Text.Encoding]::UTF8)
}

# --- Launch Claude ---
Write-Host ""
Write-Host "Environment ready"
Write-Host "  Worktree : $worktreeDir"
Write-Host "  Branch   : $branchName"
Write-Host "  DB name  : revise_$($Name -replace '[^a-zA-Z0-9]', '_')"
Write-Host ""
Set-Location $worktreeDir
claude
