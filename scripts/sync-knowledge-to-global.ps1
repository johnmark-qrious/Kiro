# Syncs workspace .kiro/knowledge/*.md files to global ~/.kiro/knowledge/
# Usage: ~/.kiro/scripts/sync-knowledge-to-global.ps1 -WorkspacePath <path>
# Example: ~/.kiro/scripts/sync-knowledge-to-global.ps1 -WorkspacePath "C:\Projects\GitHub\QT-Ubi-UbiquityBackend"
#
# Copies all .md files from <workspace>/.kiro/knowledge/ to ~/.kiro/knowledge/
# Skips README.md (each workspace has its own index)

param(
    [Parameter(Mandatory=$true)]
    [string]$WorkspacePath
)

$sourceDir = Join-Path $WorkspacePath ".kiro" "knowledge"
$globalDir = Join-Path $env:USERPROFILE ".kiro" "knowledge"

if (-not (Test-Path $sourceDir)) {
    Write-Host "No knowledge directory found at $sourceDir" -ForegroundColor Yellow
    exit 0
}

if (-not (Test-Path $globalDir)) {
    New-Item -ItemType Directory -Path $globalDir -Force | Out-Null
}

$files = Get-ChildItem -Path $sourceDir -Filter "*.md" | Where-Object { $_.Name -ne "README.md" }

if ($files.Count -eq 0) {
    Write-Host "No knowledge files to sync." -ForegroundColor Yellow
    exit 0
}

$created = 0
$updated = 0

foreach ($file in $files) {
    $targetPath = Join-Path $globalDir $file.Name

    if (Test-Path $targetPath) {
        $sourceHash = (Get-FileHash $file.FullName -Algorithm MD5).Hash
        $targetHash = (Get-FileHash $targetPath -Algorithm MD5).Hash
        if ($sourceHash -eq $targetHash) {
            Write-Host "Unchanged: $($file.Name)" -ForegroundColor DarkGray
            continue
        }
        Copy-Item -Path $file.FullName -Destination $targetPath -Force
        Write-Host "Updated  : $($file.Name)" -ForegroundColor Yellow
        $updated++
    } else {
        Copy-Item -Path $file.FullName -Destination $targetPath -Force
        Write-Host "Created  : $($file.Name)" -ForegroundColor Green
        $created++
    }
}

Write-Host "`nSync complete. $created created, $updated updated, $($files.Count - $created - $updated) unchanged." -ForegroundColor Cyan
