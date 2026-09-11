param(
    [ValidateSet("start", "stop", "restart", "status", "logs", "debug", "help")]
    [string]$Action = "start"
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

function Show-Help {
    Write-Host "`n=========================================================" -ForegroundColor Cyan
    Write-Host "  Offline IoT Dashboard - Management Commands" -ForegroundColor Cyan
    Write-Host "=========================================================" -ForegroundColor Cyan
    Write-Host "Usage: .\manage.ps1 <command>`n" -ForegroundColor White
    Write-Host "Available Commands:" -ForegroundColor Yellow
    Write-Host "  start    " -NoNewline -ForegroundColor Green; Write-Host "Starts both backend and frontend in the background"
    Write-Host "  debug    " -NoNewline -ForegroundColor Green; Write-Host "Starts both services in this single window with [BACKEND]/[FRONTEND] logs"
    Write-Host "  stop     " -NoNewline -ForegroundColor Green; Write-Host "Stops both backend and frontend services"
    Write-Host "  restart  " -NoNewline -ForegroundColor Green; Write-Host "Restarts both services"
    Write-Host "  status   " -NoNewline -ForegroundColor Green; Write-Host "Checks if backend and frontend are running"
    Write-Host "  logs     " -NoNewline -ForegroundColor Green; Write-Host "Streams live backend log output (Ctrl+C to exit)"
    Write-Host "  help     " -NoNewline -ForegroundColor Green; Write-Host "Displays this command guide`n"
    Write-Host "Examples:" -ForegroundColor Gray
    Write-Host "  .\manage.ps1 start"
    Write-Host "  .\manage.ps1 debug"
    Write-Host "  .\manage.ps1 stop`n"
}

function Start-Debug-Unified {
    # Terminate any existing instances first
    Stop-Services -Quiet

    Write-Host "`n=========================================================" -ForegroundColor Cyan
    Write-Host "  Starting Unified Debug Stream (Current Window)" -ForegroundColor Cyan
    Write-Host "  FastAPI Backend  : http://127.0.0.1:8000" -ForegroundColor White
    Write-Host "  React Dashboard  : http://localhost:5173" -ForegroundColor White
    Write-Host "  Press Ctrl+C to terminate both services" -ForegroundColor Yellow
    Write-Host "=========================================================`n" -ForegroundColor Cyan

    $backendPsi = New-Object System.Diagnostics.ProcessStartInfo
    $backendPsi.FileName = "cmd.exe"
    $backendPsi.Arguments = "/c cd /d `"$BackendDir`" && python -m uvicorn main:app --host 127.0.0.1 --port 8000 --log-level debug"
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

    $sync = [hashtable]::Synchronized(@{})

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
    param([bool]$IsDebug = $false)

    if ($IsDebug) {
        Start-Debug-Unified
        return
    }

    Write-Host "`n=========================================================" -ForegroundColor Cyan
    Write-Host "  Starting Offline IoT Dashboard System (Laboratory Mode)" -ForegroundColor Cyan
    Write-Host "=========================================================" -ForegroundColor Cyan

    # Terminate any existing instances first
    Stop-Services -Quiet

    Write-Host "[1/2] Launching FastAPI Backend on http://127.0.0.1:8000 (logging to logs\backend.log)..." -ForegroundColor Yellow
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c cd /d `"$BackendDir`" && python -m uvicorn main:app --host 127.0.0.1 --port 8000 > `"$BackendLog`" 2>&1" -WindowStyle Hidden

    Write-Host "[2/2] Launching React+Vite Frontend on http://localhost:5173 (logging to logs\frontend.log)..." -ForegroundColor Yellow
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c cd /d `"$FrontendDir`" && npm run dev > `"$FrontendLog`" 2>&1" -WindowStyle Hidden

    Write-Host "`n---------------------------------------------------------" -ForegroundColor Green
    Write-Host "[SUCCESS] Services started successfully!" -ForegroundColor Green
    Write-Host " - FastAPI Backend : http://127.0.0.1:8000" -ForegroundColor White
    Write-Host " - WebSocket Stream: ws://127.0.0.1:8000/ws" -ForegroundColor White
    Write-Host " - React Dashboard : http://localhost:5173" -ForegroundColor White
    Write-Host " - Backend Logs    : .\logs\backend.log" -ForegroundColor Gray
    Write-Host " - Frontend Logs   : .\logs\frontend.log" -ForegroundColor Gray
    Write-Host "---------------------------------------------------------" -ForegroundColor Green
    Write-Host "To STOP both services:     .\manage.ps1 stop" -ForegroundColor Cyan
    Write-Host "To VIEW live backend logs: .\manage.ps1 logs" -ForegroundColor Cyan
    Write-Host "To START in debug mode:    .\manage.ps1 debug" -ForegroundColor Cyan
    Write-Host "To SEE all commands:       .\manage.ps1 help`n" -ForegroundColor Cyan
}

function Stop-Services {
    param([switch]$Quiet)

    if (-not $Quiet) {
        Write-Host "`nStopping IoT Dashboard services..." -ForegroundColor Yellow
    }

    # Terminate by window title if debug windows are open
    taskkill /F /FI "WINDOWTITLE eq IoT-Backend-FastAPI*" 2>$null | Out-Null
    taskkill /F /FI "WINDOWTITLE eq IoT-Frontend-Vite*" 2>$null | Out-Null

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
        Write-Host "[SUCCESS] All frontend and backend services stopped.`n" -ForegroundColor Green
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
    "start"   { Start-Services -IsDebug $false }
    "debug"   { Start-Services -IsDebug $true }
    "stop"    { Stop-Services }
    "restart" {
        Stop-Services
        Start-Sleep -Seconds 2
        Start-Services -IsDebug $false
    }
    "status"  {
        $bRunning = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
        $fRunning = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
        Write-Host "`nBackend (Port 8000) : $(if($bRunning){'RUNNING'}else{'STOPPED'})" -ForegroundColor $(if($bRunning){'Green'}else{'Red'})
        Write-Host "Frontend (Port 5173): $(if($fRunning){'RUNNING'}else{'STOPPED'})`n" -ForegroundColor $(if($fRunning){'Green'}else{'Red'})
    }
    "logs"    { Show-Logs }
    "help"    { Show-Help }
    default   { Show-Help }
}
