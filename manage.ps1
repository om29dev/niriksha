param(
    [ValidateSet("start", "stop", "restart", "status", "logs", "debug", "help")]
    [string]$Action = "start",
    [string]$Mode = ""
)

$RootDir = $PSScriptRoot
$BackendDir = Join-Path $RootDir "backend"
$FrontendDir = Join-Path $RootDir "frontend"
$LogsDir = Join-Path $RootDir "logs"

if (-not (Test-Path $LogsDir)) {
    New-Item -ItemType Directory -Path $LogsDir | Out-Null
}

$BackendLog = Join-Path $LogsDir "backend.log"
$FrontendLog = Join-Path $LogsDir "frontend.log"
$OllamaLog = Join-Path $LogsDir "ollama.log"

function Find-Ollama {
    $cmd = Get-Command "ollama" -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    
    $commonPaths = @(
        "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe",
        "$env:LOCALAPPDATA\Ollama\ollama.exe",
        "C:\ollama\ollama.exe",
        "C:\Program Files\Ollama\ollama.exe",
        "D:\ollama\ollama.exe"
    )
    foreach ($path in $commonPaths) {
        if (Test-Path $path) { return $path }
    }
    return $null
}

function Show-Help {
    Write-Host "`n=========================================================" -ForegroundColor Cyan
    Write-Host "  Offline IoT Dashboard - Management Commands" -ForegroundColor Cyan
    Write-Host "=========================================================" -ForegroundColor Cyan
    Write-Host "Usage: .\manage.ps1 <command>`n" -ForegroundColor White
    Write-Host "Available Commands:" -ForegroundColor Yellow
    Write-Host "  start    " -NoNewline -ForegroundColor Green; Write-Host "Starts Ollama AI, FastAPI backend, and React frontend"
    Write-Host "  debug    " -NoNewline -ForegroundColor Green; Write-Host "Starts all services in this window with unified logs"
    Write-Host "  stop     " -NoNewline -ForegroundColor Green; Write-Host "Stops Ollama AI, backend, and frontend services"
    Write-Host "  restart  " -NoNewline -ForegroundColor Green; Write-Host "Restarts all 3 services"
    Write-Host "  status   " -NoNewline -ForegroundColor Green; Write-Host "Checks if Ollama, backend, and frontend are running"
    Write-Host "  logs     " -NoNewline -ForegroundColor Green; Write-Host "Streams live backend log output (Ctrl+C to exit)"
    Write-Host "  help     " -NoNewline -ForegroundColor Green; Write-Host "Displays this command guide`n"
    Write-Host "Examples:" -ForegroundColor Gray
    Write-Host "  .\manage.ps1 start         (Hardware serial gateway mode)"
    Write-Host "  .\manage.ps1 start mock    (Synthetic multi-pole mock stream)"
    Write-Host "  .\manage.ps1 debug mock    (Interactive debug with mock stream)"
    Write-Host "  .\manage.ps1 stop`n"
}

function Start-Debug-Unified {
    param([string]$RunMode = "")
    # Terminate any existing instances first
    Stop-Services -Quiet

    $isMock = ($RunMode.ToLower() -eq "mock")
    Write-Host "`n=========================================================" -ForegroundColor Cyan
    Write-Host "  Starting Unified Debug Stream (Current Window)" -ForegroundColor Cyan
    if ($isMock) {
        Write-Host "  [MODE] Mock Simulation Active" -ForegroundColor Magenta
    } else {
        Write-Host "  [MODE] Physical Serial Gateway Active" -ForegroundColor Green
    }
    Write-Host "  Ollama AI Engine : http://127.0.0.1:11434" -ForegroundColor White
    Write-Host "  FastAPI Backend  : http://127.0.0.1:8000" -ForegroundColor White
    Write-Host "  React Dashboard  : http://localhost:5173" -ForegroundColor White
    Write-Host "  Press Ctrl+C to terminate services" -ForegroundColor Yellow
    Write-Host "=========================================================`n" -ForegroundColor Cyan

    $ollamaExe = Find-Ollama
    if ($ollamaExe) {
        Write-Host "[OLLAMA] Starting Ollama server in background..." -ForegroundColor Magenta
        Start-Process -FilePath $ollamaExe -ArgumentList "serve" -WindowStyle Hidden
    }

    $envCmd = if ($isMock) { "set MOCK_SIMULATION=true && " } else { "set MOCK_SIMULATION=false && " }
    $backendPsi = New-Object System.Diagnostics.ProcessStartInfo
    $backendPsi.FileName = "cmd.exe"
    $backendPsi.Arguments = "/c cd /d `"$BackendDir`" && $envCmd python -m uvicorn main:app --host 127.0.0.1 --port 8000 --log-level debug"
    $backendPsi.RedirectStandardOutput = $true
    $backendPsi.RedirectStandardError = $true
    $backendPsi.UseShellExecute = $false
    $backendPsi.CreateNoWindow = $true

    $frontendPsi = New-Object System.Diagnostics.ProcessStartInfo
    $frontendPsi.FileName = "cmd.exe"
    $frontendPsi.Arguments = "/c cd /d `"$FrontendDir`" && npm run dev"
    $frontendPsi.RedirectStandardOutput = $true
    $frontendPsi.RedirectStandardError = $true
    $frontendPsi.UseShellExecute = $false
    $frontendPsi.CreateNoWindow = $true

    $backendProc = [System.Diagnostics.Process]::Start($backendPsi)
    $frontendProc = [System.Diagnostics.Process]::Start($frontendPsi)

    $backendOutHandler = {
        if (-not [string]::IsNullOrEmpty($EventArgs.Data)) {
            Write-Host "[BACKEND]  " -NoNewline -ForegroundColor Cyan
            Write-Host $EventArgs.Data
        }
    }
    $backendErrHandler = {
        if (-not [string]::IsNullOrEmpty($EventArgs.Data)) {
            Write-Host "[BACKEND]  " -NoNewline -ForegroundColor Red
            Write-Host $EventArgs.Data
        }
    }

    $frontendOutHandler = {
        if (-not [string]::IsNullOrEmpty($EventArgs.Data)) {
            Write-Host "[FRONTEND] " -NoNewline -ForegroundColor Green
            Write-Host $EventArgs.Data
        }
    }
    $frontendErrHandler = {
        if (-not [string]::IsNullOrEmpty($EventArgs.Data)) {
            Write-Host "[FRONTEND] " -NoNewline -ForegroundColor Yellow
            Write-Host $EventArgs.Data
        }
    }

    $bOutEvent = Register-ObjectEvent -InputObject $backendProc -EventName "OutputDataReceived" -Action $backendOutHandler
    $bErrEvent = Register-ObjectEvent -InputObject $backendProc -EventName "ErrorDataReceived" -Action $backendErrHandler
    $fOutEvent = Register-ObjectEvent -InputObject $frontendProc -EventName "OutputDataReceived" -Action $frontendOutHandler
    $fErrEvent = Register-ObjectEvent -InputObject $frontendProc -EventName "ErrorDataReceived" -Action $frontendErrHandler

    $backendProc.BeginOutputReadLine()
    $backendProc.BeginErrorReadLine()
    $frontendProc.BeginOutputReadLine()
    $frontendProc.BeginErrorReadLine()

    try {
        while (-not $backendProc.HasExited -or -not $frontendProc.HasExited) {
            Start-Sleep -Milliseconds 500
        }
    }
    finally {
        Write-Host "`nTerminating services..." -ForegroundColor Yellow
        Unregister-Event -SourceIdentifier $bOutEvent.Name -ErrorAction SilentlyContinue
        Unregister-Event -SourceIdentifier $bErrEvent.Name -ErrorAction SilentlyContinue
        Unregister-Event -SourceIdentifier $fOutEvent.Name -ErrorAction SilentlyContinue
        Unregister-Event -SourceIdentifier $fErrEvent.Name -ErrorAction SilentlyContinue
        Stop-Services -Quiet
        Write-Host "[SUCCESS] Debug session ended and all services stopped.`n" -ForegroundColor Green
    }
}

function Start-Services {
    param(
        [bool]$IsDebug = $false,
        [string]$RunMode = ""
    )

    if ($IsDebug) {
        Start-Debug-Unified -RunMode $RunMode
        return
    }

    $isMock = ($RunMode.ToLower() -eq "mock")
    Write-Host "`n=========================================================" -ForegroundColor Cyan
    Write-Host "  Starting Offline IoT Dashboard System (Laboratory Mode)" -ForegroundColor Cyan
    if ($isMock) {
        Write-Host "  [MODE] Mock Simulation Active" -ForegroundColor Magenta
    } else {
        Write-Host "  [MODE] Physical Serial Gateway Active" -ForegroundColor Green
    }
    Write-Host "=========================================================" -ForegroundColor Cyan

    # Terminate any existing instances first
    Stop-Services -Quiet

    # Check / Start Ollama
    $ollamaPort = Get-NetTCPConnection -LocalPort 11434 -ErrorAction SilentlyContinue
    $ollamaExe = Find-Ollama

    if (-not $ollamaPort) {
        if ($ollamaExe) {
            Write-Host "[1/3] Launching Ollama AI on http://127.0.0.1:11434 (logging to logs\ollama.log)..." -ForegroundColor Magenta
            Start-Process -FilePath "cmd.exe" -ArgumentList "/c `"$ollamaExe`" serve > `"$OllamaLog`" 2>&1" -WindowStyle Hidden
        } else {
            Write-Host "[1/3] Ollama binary not found in PATH. Skipping auto-start (rule engine active)." -ForegroundColor Yellow
        }
    } else {
        Write-Host "[1/3] Ollama AI server already running on http://127.0.0.1:11434." -ForegroundColor Green
    }

    $envCmd = if ($isMock) { "set MOCK_SIMULATION=true && " } else { "set MOCK_SIMULATION=false && " }
    Write-Host "[2/3] Launching FastAPI Backend on http://127.0.0.1:8000 (logging to logs\backend.log)..." -ForegroundColor Yellow
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c cd /d `"$BackendDir`" && $envCmd python -m uvicorn main:app --host 127.0.0.1 --port 8000 > `"$BackendLog`" 2>&1" -WindowStyle Hidden

    Write-Host "[3/3] Launching React+Vite Frontend on http://localhost:5173 (logging to logs\frontend.log)..." -ForegroundColor Yellow
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c cd /d `"$FrontendDir`" && npm run dev > `"$FrontendLog`" 2>&1" -WindowStyle Hidden

    Write-Host "`n---------------------------------------------------------" -ForegroundColor Green
    Write-Host "[SUCCESS] Services started successfully!" -ForegroundColor Green
    Write-Host " - Telemetry Mode   : $(if($isMock){'Synthetic Mock Stream'}else{'Hardware Serial Gateway'})" -ForegroundColor Cyan
    Write-Host " - Ollama AI Engine : http://127.0.0.1:11434" -ForegroundColor White
    Write-Host " - FastAPI Backend  : http://127.0.0.1:8000" -ForegroundColor White
    Write-Host " - WebSocket Stream : ws://127.0.0.1:8000/ws" -ForegroundColor White
    Write-Host " - React Dashboard  : http://localhost:5173" -ForegroundColor White
    Write-Host " - Ollama Logs      : .\logs\ollama.log" -ForegroundColor Gray
    Write-Host " - Backend Logs     : .\logs\backend.log" -ForegroundColor Gray
    Write-Host " - Frontend Logs    : .\logs\frontend.log" -ForegroundColor Gray
    Write-Host "---------------------------------------------------------" -ForegroundColor Green
    Write-Host "To STOP all services:        .\manage.ps1 stop" -ForegroundColor Cyan
    Write-Host "To VIEW live backend logs:   .\manage.ps1 logs" -ForegroundColor Cyan
    Write-Host "To START with mock stream:   .\manage.ps1 start mock" -ForegroundColor Cyan
    Write-Host "To START in debug mode:      .\manage.ps1 debug [mock]" -ForegroundColor Cyan
    Write-Host "To SEE all commands:         .\manage.ps1 help`n" -ForegroundColor Cyan
}

function Stop-Services {
    param([switch]$Quiet)

    if (-not $Quiet) {
        Write-Host "`nStopping IoT Dashboard & AI services..." -ForegroundColor Yellow
    }

    # Terminate by window title if debug windows are open
    taskkill /F /FI "WINDOWTITLE eq IoT-Backend-FastAPI*" 2>$null | Out-Null
    taskkill /F /FI "WINDOWTITLE eq IoT-Frontend-Vite*" 2>$null | Out-Null

    # Terminate process on port 11434 (Ollama if run as local service)
    $port11434 = Get-NetTCPConnection -LocalPort 11434 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
    if ($port11434) {
        foreach ($pidToKill in $port11434) {
            Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
            if (-not $Quiet) {
                Write-Host "Killed Ollama process (PID $pidToKill)" -ForegroundColor Gray
            }
        }
    }

    # Terminate process on port 8000 (Backend)
    $port8000 = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
    if ($port8000) {
        foreach ($pidToKill in $port8000) {
            Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
            if (-not $Quiet) {
                Write-Host "Killed backend process (PID $pidToKill)" -ForegroundColor Gray
            }
        }
    }

    # Terminate process on port 5173 (Frontend)
    $port5173 = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
    if ($port5173) {
        foreach ($pidToKill in $port5173) {
            Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
            if (-not $Quiet) {
                Write-Host "Killed frontend process (PID $pidToKill)" -ForegroundColor Gray
            }
        }
    }

    if (-not $Quiet) {
        Write-Host "[SUCCESS] All frontend, backend, and Ollama services stopped.`n" -ForegroundColor Green
    }
}

function Show-Logs {
    if (-not (Test-Path $BackendLog)) {
        Write-Host "No log file found at $BackendLog. Run .\manage.ps1 start first." -ForegroundColor Yellow
        return
    }
    Write-Host "Streaming live backend logs (Ctrl+C to stop)...`n" -ForegroundColor Cyan
    Get-Content -Path $BackendLog -Wait -Tail 30
}

switch ($Action.ToLower()) {
    "start"   { Start-Services -IsDebug $false -RunMode $Mode }
    "debug"   { Start-Services -IsDebug $true -RunMode $Mode }
    "stop"    { Stop-Services }
    "restart" {
        Stop-Services
        Start-Sleep -Seconds 2
        Start-Services -IsDebug $false -RunMode $Mode
    }
    "status"  {
        $oRunning = Get-NetTCPConnection -LocalPort 11434 -ErrorAction SilentlyContinue
        $bRunning = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
        $fRunning = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
        Write-Host "`nOllama AI (Port 11434): $(if($oRunning){'RUNNING'}else{'STOPPED'})" -ForegroundColor $(if($oRunning){'Green'}else{'Yellow'})
        Write-Host "Backend   (Port 8000) : $(if($bRunning){'RUNNING'}else{'STOPPED'})" -ForegroundColor $(if($bRunning){'Green'}else{'Red'})
        Write-Host "Frontend  (Port 5173) : $(if($fRunning){'RUNNING'}else{'STOPPED'})`n" -ForegroundColor $(if($fRunning){'Green'}else{'Red'})
    }
    "logs"    { Show-Logs }
    "help"    { Show-Help }
    default   { Show-Help }
}

