#!/usr/bin/env pwsh
# Signal tripwire hook — blocks gated actions when a critical signal exists.
# Reads signal.json, if not empty {}, exits with code 2 to block the tool.

$signalFile = "$HOME\.kiro\signal.json"

if (-not (Test-Path $signalFile)) { exit 0 }

$content = Get-Content $signalFile -Raw -ErrorAction SilentlyContinue
if (-not $content -or $content.Trim() -eq '{}') { exit 0 }

try {
    $signal = $content | ConvertFrom-Json
    if ($signal.status) {
        $msg = "SIGNAL TRIPWIRE: $($signal.status) — $($signal.reason) (by $($signal.author), $($signal.created)). Clear signal.json to proceed."
        Write-Error $msg
        exit 2
    }
} catch {
    # Unparseable signal = fail-closed
    Write-Error "SIGNAL TRIPWIRE: signal.json is unparseable. Failing closed. Fix or delete the file."
    exit 2
}

exit 0
