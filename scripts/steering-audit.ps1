# Flags steering/knowledge/guide files exceeding line thresholds
param(
    [int]$SteeringMax = 300,
    [int]$KnowledgeMax = 150,
    [int]$GuidesMax = 250
)

$root = "$HOME\.kiro"

$checks = @(
    @{ Path = "$root\steering"; Max = $SteeringMax; Label = "Steering" }
    @{ Path = "$root\knowledge"; Max = $KnowledgeMax; Label = "Knowledge" }
    @{ Path = "$root\guides";   Max = $GuidesMax;   Label = "Guides" }
)

$bloated = @()
foreach ($check in $checks) {
    if (!(Test-Path $check.Path)) { continue }
    Get-ChildItem $check.Path -Recurse -Filter "*.md" | ForEach-Object {
        $lines = (Get-Content $_.FullName | Measure-Object -Line).Lines
        if ($lines -gt $check.Max) {
            $bloated += [PSCustomObject]@{
                File  = $_.FullName.Replace($root, "~\.kiro")
                Lines = $lines
                Max   = $check.Max
                Over  = $lines - $check.Max
            }
        }
    }
}

if ($bloated.Count -eq 0) {
    Write-Host "All files within limits." -ForegroundColor Green
} else {
    Write-Host "`n$($bloated.Count) file(s) over threshold:`n" -ForegroundColor Yellow
    $bloated | Sort-Object -Property Over -Descending | Format-Table -AutoSize
    Write-Host "Run 'guide cleanup' to consolidate, or split into sub-files."
}
