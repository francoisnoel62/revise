# ABOUTME: Creates a task-scoped Git worktree with an isolated local runtime.
# ABOUTME: Starts Claude only after branch, port, database, and environment are ready.

param(
    [Parameter(Mandatory = $false)]
    [string]$Name,

    [ValidateSet("feature", "bugfix", "refactor", "docs")]
    [string]$BranchType = "feature",

    [switch]$NoLaunch,

    [switch]$SkipFetch,

    [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Invoke-Git {
    param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Arguments)

    & git @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "git $($Arguments -join ' ') failed with exit code $LASTEXITCODE"
    }
}

function Get-AvailablePort {
    param([string]$ParentDirectory)

    $usedPorts = [System.Collections.Generic.HashSet[int]]::new()

    Get-ChildItem -LiteralPath $ParentDirectory -Directory -Filter "Revise-*" -ErrorAction SilentlyContinue |
        ForEach-Object {
            $metadataPath = Join-Path $_.FullName ".worktree.json"
            if (Test-Path -LiteralPath $metadataPath) {
                try {
                    $metadata = Get-Content -LiteralPath $metadataPath -Raw | ConvertFrom-Json
                    if ($null -ne $metadata.port) {
                        [void]$usedPorts.Add([int]$metadata.port)
                    }
                }
                catch {
                    Write-Warning "Ignoring invalid metadata in $metadataPath"
                }
            }
        }

    Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
        ForEach-Object { [void]$usedPorts.Add([int]$_.LocalPort) }

    foreach ($port in 3001..3099) {
        if (-not $usedPorts.Contains($port)) {
            return $port
        }
    }

    throw "No free development port found between 3001 and 3099."
}

function Set-EnvironmentValue {
    param(
        [string]$Content,
        [string]$Key,
        [string]$Value
    )

    $pattern = "(?m)^$([regex]::Escape($Key))=.*$"
    $replacement = "$Key=$Value"

    if ($Content -match $pattern) {
        return [regex]::Replace($Content, $pattern, $replacement)
    }

    return $Content.TrimEnd() + "`r`n$replacement`r`n"
}

if (-not $Name) {
    $Name = "session-$(Get-Date -Format 'yyyyMMdd-HHmm')"
}

if ($Name -notmatch '^[A-Za-z0-9][A-Za-z0-9._-]*$') {
    throw "Name must use only letters, numbers, dots, underscores, or hyphens."
}

$rootDir = Split-Path $PSScriptRoot -Parent
$parentDir = Split-Path $rootDir -Parent
$worktreeDir = Join-Path $parentDir "Revise-$Name"
$branchName = "$BranchType/$Name"
$baseRef = "origin/main"
$databaseName = "revise_$(($Name -replace '[^A-Za-z0-9]', '_').ToLowerInvariant())"
$port = Get-AvailablePort -ParentDirectory $parentDir

if (Test-Path -LiteralPath $worktreeDir) {
    throw "Worktree path already exists: $worktreeDir"
}

& git -C $rootDir show-ref --verify --quiet "refs/heads/$branchName"
if ($LASTEXITCODE -eq 0) {
    throw "Branch already exists: $branchName"
}

if (-not $SkipFetch -and -not $DryRun) {
    Write-Host "Updating $baseRef ..."
    Invoke-Git -C $rootDir fetch origin main
}

$baseCommit = (& git -C $rootDir rev-parse --verify $baseRef).Trim()
if ($LASTEXITCODE -ne 0) {
    throw "Cannot resolve $baseRef. Fetch origin/main or rerun with a valid local remote."
}

if ($DryRun) {
    Write-Host "Dry run - no worktree created"
    Write-Host "  Worktree : $worktreeDir"
    Write-Host "  Branch   : $branchName"
    Write-Host "  Base     : $baseRef ($baseCommit)"
    Write-Host "  URL      : http://localhost:$port"
    Write-Host "  DB name  : $databaseName"
    return
}

Write-Host "Creating $branchName from $baseRef ..."
Invoke-Git -C $rootDir worktree add $worktreeDir -b $branchName $baseRef

try {
    $srcModules = Join-Path $rootDir "node_modules"
    $dstModules = Join-Path $worktreeDir "node_modules"
    if ((Test-Path -LiteralPath $srcModules) -and -not (Test-Path -LiteralPath $dstModules)) {
        Write-Host "Linking node_modules ..."
        New-Item -ItemType Junction -Path $dstModules -Target $srcModules | Out-Null
    }
    else {
        Write-Warning "node_modules was not linked. Run npm install in this worktree before starting the app."
    }

    $envSrc = Join-Path $rootDir ".env.local"
    $envDst = Join-Path $worktreeDir ".env.local"
    if (-not (Test-Path -LiteralPath $envSrc)) {
        throw "Missing $envSrc. Create the local environment file before starting a worktree."
    }

    Write-Host "Preparing local environment ..."
    $envContent = Get-Content -LiteralPath $envSrc -Raw
    $envContent = Set-EnvironmentValue -Content $envContent -Key "MONGODB_DB_NAME" -Value $databaseName
    $envContent = Set-EnvironmentValue -Content $envContent -Key "PORT" -Value $port
    $envContent = Set-EnvironmentValue -Content $envContent -Key "NEXT_PUBLIC_APP_URL" -Value "http://localhost:$port"
    [System.IO.File]::WriteAllText($envDst, $envContent, [System.Text.UTF8Encoding]::new($false))

    $metadata = [ordered]@{
        schemaVersion = 1
        name = $Name
        branch = $branchName
        baseRef = $baseRef
        baseCommit = $baseCommit
        port = $port
        url = "http://localhost:$port"
        databaseName = $databaseName
        createdAt = (Get-Date).ToUniversalTime().ToString("o")
    } | ConvertTo-Json
    [System.IO.File]::WriteAllText((Join-Path $worktreeDir ".worktree.json"), $metadata + "`r`n", [System.Text.UTF8Encoding]::new($false))
}
catch {
    Write-Warning "Bootstrap failed. The Git worktree still exists at $worktreeDir."
    throw
}

Write-Host ""
Write-Host "Environment ready"
Write-Host "  Worktree : $worktreeDir"
Write-Host "  Branch   : $branchName"
Write-Host "  Base     : $baseRef ($baseCommit)"
Write-Host "  URL      : http://localhost:$port"
Write-Host "  DB name  : $databaseName"
Write-Host "  Commands : npm run dev:worktree | npm run worktree -- status"
Write-Host ""

Set-Location $worktreeDir
if (-not $NoLaunch) {
    if (Get-Command claude -ErrorAction SilentlyContinue) {
        & claude
    }
    else {
        Write-Warning "Claude CLI is not on PATH. Start it manually from $worktreeDir."
    }
}
