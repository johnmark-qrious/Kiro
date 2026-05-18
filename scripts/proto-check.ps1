# Cross-Repo Proto Version Check
# Reads proto package versions from all Ubiquity repos and reports mismatches.
# Advisory only - prints findings and fix commands, never blocks.

param(
    [string]$WebAppsPath = "C:\Projects\GitHub\Ubiquity-WebApps",
    [string]$BackendPath = "C:\Projects\GitHub\QT-Ubi-UbiquityBackend",
    [string]$PlatformApiPath = "C:\Projects\GitHub\ubiquity-platform-api",
    [string]$ConnectorsPath = "C:\Projects\GitHub\Ubiquity-Connectors-Prefect"
)

$results = @()
$issues = @()

Write-Host "`n=== Proto Version Check ===" -ForegroundColor Cyan

# 1. WebApps - read from package.json
if (Test-Path "$WebAppsPath\package.json") {
    $pkg = Get-Content "$WebAppsPath\package.json" | ConvertFrom-Json
    $webappsVersion = $pkg.dependencies.'@qriousnz/ubiquity-protos'
    if (-not $webappsVersion) {
        # Check in monorepo root or apps
        $lockPath = "$WebAppsPath\bun.lock"
        if (Test-Path $lockPath) {
            $lockContent = Get-Content $lockPath -Raw
            if ($lockContent -match '"@qriousnz/ubiquity-protos":\s*\["[^"]*",\s*"([^"]+)"') {
                $webappsVersion = $Matches[1]
            }
        }
    }
    if ($webappsVersion) {
        $results += @{ Repo = "WebApps"; Version = $webappsVersion; Source = "package.json/bun.lock" }
        Write-Host "  WebApps: $webappsVersion" -ForegroundColor Green
    } else {
        Write-Host "  WebApps: could not determine version" -ForegroundColor Yellow
    }
} else {
    Write-Host "  WebApps: repo not found at $WebAppsPath (skipped)" -ForegroundColor DarkGray
}

# 2. Backend - read from Directory.Packages.props or .csproj
$backendVersion = $null
if (Test-Path $BackendPath) {
    $propsFile = Get-ChildItem -Path $BackendPath -Recurse -Filter "Directory.Packages.props" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($propsFile) {
        $propsContent = Get-Content $propsFile.FullName -Raw
        if ($propsContent -match 'Include="Ubiquity\.Protos"\s+Version="([^"]+)"') {
            $backendVersion = $Matches[1]
        }
    }
    if (-not $backendVersion) {
        # Fallback: search .csproj files
        $csproj = Get-ChildItem -Path $BackendPath -Recurse -Filter "*.csproj" -ErrorAction SilentlyContinue |
            Select-String -Pattern 'Ubiquity\.Protos' -List | Select-Object -First 1
        if ($csproj) {
            $csprojContent = Get-Content $csproj.Path -Raw
            if ($csprojContent -match 'Include="Ubiquity\.Protos"\s+Version="([^"]+)"') {
                $backendVersion = $Matches[1]
            }
        }
    }
    if ($backendVersion) {
        $results += @{ Repo = "Backend"; Version = $backendVersion; Source = "Directory.Packages.props/.csproj" }
        Write-Host "  Backend: $backendVersion" -ForegroundColor Green
    } else {
        Write-Host "  Backend: could not determine version" -ForegroundColor Yellow
    }
} else {
    Write-Host "  Backend: repo not found at $BackendPath (skipped)" -ForegroundColor DarkGray
}

# 3. Platform API - read from Directory.Packages.props or .csproj
$platformVersion = $null
if (Test-Path $PlatformApiPath) {
    $propsFile = Get-ChildItem -Path $PlatformApiPath -Recurse -Filter "Directory.Packages.props" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($propsFile) {
        $propsContent = Get-Content $propsFile.FullName -Raw
        if ($propsContent -match 'Include="Ubiquity\.Protos"\s+Version="([^"]+)"') {
            $platformVersion = $Matches[1]
        }
    }
    if (-not $platformVersion) {
        $csproj = Get-ChildItem -Path $PlatformApiPath -Recurse -Filter "*.csproj" -ErrorAction SilentlyContinue |
            Select-String -Pattern 'Ubiquity\.Protos' -List | Select-Object -First 1
        if ($csproj) {
            $csprojContent = Get-Content $csproj.Path -Raw
            if ($csprojContent -match 'Include="Ubiquity\.Protos"\s+Version="([^"]+)"') {
                $platformVersion = $Matches[1]
            }
        }
    }
    if ($platformVersion) {
        $results += @{ Repo = "Platform-API"; Version = $platformVersion; Source = "Directory.Packages.props/.csproj" }
        Write-Host "  Platform-API: $platformVersion" -ForegroundColor Green
    } else {
        Write-Host "  Platform-API: could not determine version" -ForegroundColor Yellow
    }
} else {
    Write-Host "  Platform-API: repo not found at $PlatformApiPath (skipped)" -ForegroundColor DarkGray
}

# 4. Compare versions (MAJOR.MINOR only)
Write-Host "`n=== Compatibility Check ===" -ForegroundColor Cyan

$versions = $results | ForEach-Object {
    $v = $_.Version -replace '[~^>=<]', ''
    $parts = $v.Split('.')
    @{ Repo = $_.Repo; Full = $v; MajorMinor = "$($parts[0]).$($parts[1])" }
}

$uniqueMajorMinor = $versions | Select-Object -ExpandProperty MajorMinor -Unique

if ($uniqueMajorMinor.Count -le 1) {
    Write-Host "  All repos aligned on protos $($uniqueMajorMinor[0]).x" -ForegroundColor Green
} else {
    Write-Host "  VERSION MISMATCH DETECTED" -ForegroundColor Red
    Write-Host ""
    foreach ($v in $versions) {
        $color = if ($v.MajorMinor -eq ($versions | Sort-Object Full -Descending | Select-Object -First 1).MajorMinor) { "Green" } else { "Red" }
        Write-Host "    $($v.Repo): $($v.Full)" -ForegroundColor $color
    }
    $latest = ($versions | Sort-Object Full -Descending | Select-Object -First 1).Full
    Write-Host ""
    Write-Host "  Fix commands:" -ForegroundColor Yellow
    foreach ($v in $versions | Where-Object { $_.Full -ne $latest }) {
        switch ($v.Repo) {
            "WebApps" { Write-Host "    cd $WebAppsPath && bun update @qriousnz/ubiquity-protos" -ForegroundColor White }
            "Backend" { Write-Host "    Update Ubiquity.Protos to $latest in Directory.Packages.props, rebuild u3.sln" -ForegroundColor White }
            "Platform-API" { Write-Host "    Update Ubiquity.Protos to $latest in Directory.Packages.props, rebuild" -ForegroundColor White }
        }
    }
}

# 5. Check Docker state
Write-Host "`n=== Docker State ===" -ForegroundColor Cyan
$mssql = docker ps --filter "name=u3-mssql-dev" --format "{{.Status}}" 2>$null
if ($mssql) {
    Write-Host "  u3-mssql-dev: $mssql" -ForegroundColor Green
} else {
    Write-Host "  u3-mssql-dev: NOT RUNNING" -ForegroundColor Red
    Write-Host "    Fix: docker start u3-mssql-dev" -ForegroundColor White
}

# 6. Check key ports
Write-Host "`n=== Port Availability ===" -ForegroundColor Cyan
$ports = @{50051="Remotingbridge"; 50053="Billing API"; 3300="Admin App"; 5433="Platform Postgres"}
foreach ($entry in $ports.GetEnumerator()) {
    $conn = Test-NetConnection -ComputerName localhost -Port $entry.Key -WarningAction SilentlyContinue -InformationLevel Quiet
    if ($conn) {
        Write-Host "  :$($entry.Key) ($($entry.Value)): IN USE (service running)" -ForegroundColor Green
    } else {
        Write-Host "  :$($entry.Key) ($($entry.Value)): free" -ForegroundColor DarkGray
    }
}

# 7. Check platform-api branch
Write-Host "`n=== Branch Check ===" -ForegroundColor Cyan
if (Test-Path "$PlatformApiPath\.git") {
    $branch = git -C $PlatformApiPath branch --show-current 2>$null
    if ($branch -eq "master") {
        Write-Host "  Platform-API: master" -ForegroundColor Green
    } else {
        Write-Host "  Platform-API: $branch (expected: master)" -ForegroundColor Yellow
        Write-Host "    Feature branches may be missing service implementations" -ForegroundColor White
    }
}

Write-Host "`n=== Done ===" -ForegroundColor Cyan
