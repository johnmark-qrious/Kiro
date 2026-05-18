# switch-backend.ps1 — Switch backend branch and rebuild in background
# Usage: switch-backend.ps1 <branch-name>
# The rebuild happens in a background window so you can keep working.

param(
    [Parameter(Mandatory, Position = 0)]
    [string]$Branch
)

$backendPath = "C:\Projects\GitHub\QT-Ubi-UbiquityBackend"

if (-not (Test-Path $backendPath)) {
    Write-Host "Backend repo not found at $backendPath" -ForegroundColor Red
    exit 1
}

Push-Location $backendPath

# 1. Kill running Aspire + uqhost processes
Write-Host "Stopping Aspire and uqhost processes..." -ForegroundColor Yellow
Get-Process -Name "uqhost-console" -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process -Name "dotnet" -ErrorAction SilentlyContinue |
    Where-Object { $_.MainModule.FileName -and $_.CommandLine -like "*AppHost*" } |
    Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep 2

# 2. Switch branch
Write-Host "Switching to branch: $Branch" -ForegroundColor Cyan
$switchResult = git switch $Branch 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "git switch failed: $switchResult" -ForegroundColor Red
    Pop-Location
    exit 1
}
Write-Host "On branch: $Branch" -ForegroundColor Green

# 3. Strip KIRO_FEED_JSON (prevents env block overflow in child processes)
Remove-Item Env:\KIRO_FEED_JSON -ErrorAction SilentlyContinue

# 4. Rebuild + restart in background window
$bgScript = @"
Set-Location '$backendPath'
Remove-Item Env:\KIRO_FEED_JSON -ErrorAction SilentlyContinue
Write-Host 'Building u3.sln...' -ForegroundColor Cyan
dotnet build local\AppHost\AppHost.csproj
if (`$LASTEXITCODE -eq 0) {
    Write-Host 'Build complete. Starting Aspire...' -ForegroundColor Green
    dotnet run --project local\AppHost
} else {
    Write-Host 'BUILD FAILED' -ForegroundColor Red
    Read-Host 'Press Enter to close'
}
"@

Start-Process pwsh -ArgumentList "-NoExit", "-Command", $bgScript -WindowStyle Minimized

Write-Host ""
Write-Host "Backend switching to '$Branch' in background." -ForegroundColor Green
Write-Host "Aspire dashboard will be at http://localhost:15000 when ready." -ForegroundColor DarkGray
Write-Host "Services take 2-3 min to fully start." -ForegroundColor DarkGray

Pop-Location
