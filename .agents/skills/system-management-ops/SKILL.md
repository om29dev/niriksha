---
name: system-management-ops
description: >-
  Operational runbooks, management CLI (manage.ps1), service orchestration,
  process monitoring, and logging conventions for the offline IoT dashboard stack.
---

# System Operations & Management CLI Skill

This skill documents operational runbooks, background service management, process lifecycle controls, and debugging workflows using the PowerShell management utility [manage.ps1](file:///d:/proj/SIH/manage.ps1).

---

## 🚀 1. Unified Management CLI (`manage.ps1`)

The repository includes a centralized PowerShell management controller to operate both the FastAPI backend and React frontend services without manual multi-terminal wrangling.

### Command Reference

| Action | Syntax | Behavior |
| :--- | :--- | :--- |
| **Start** | `.\manage.ps1 start` | Spawns Backend (Uvicorn) and Frontend (Vite) as independent background jobs. Writes outputs to `logs/backend.log` and `logs/frontend.log`. |
| **Debug** | `.\manage.ps1 debug` | Kills existing instances and launches both services in the **current console window** with color-coded, synchronized real-time output (`[BACKEND]` in Cyan/Red, `[FRONTEND]` in Green/Yellow). Press `Ctrl+C` to terminate both. |
| **Stop** | `.\manage.ps1 stop` | Gracefully detects and terminates background processes on ports 8000 and 5173, as well as associated PowerShell jobs. |
| **Restart** | `.\manage.ps1 restart` | Executes `Stop-Services` followed by `Start-Services`. |
| **Status** | `.\manage.ps1 status` | Verifies whether the FastAPI backend and React frontend are actively running and checks TCP listeners on `127.0.0.1:8000` and `127.0.0.1:5173`. |
| **Logs** | `.\manage.ps1 logs` | Tails the live backend execution log (`Get-Content logs/backend.log -Tail 50 -Wait`). |
| **Help** | `.\manage.ps1 help` | Prints the interactive guide with color-coded examples. |

---

## 🔍 2. Diagnostic & Health Check Procedures

### Check Port Listeners
Verify whether port 8000 (FastAPI) or 5173 (Vite) are held:
```powershell
Get-NetTCPConnection -LocalPort 8000, 5173 -State Listen -ErrorAction SilentlyContinue
```

### Direct Health Check Query
```powershell
curl http://127.0.0.1:8000/api/ports
curl http://127.0.0.1:8000/api/telemetry/recent?limit=5
```

### Inspect Database Connectivity via asyncpg
```powershell
python -c "import asyncio, asyncpg; asyncio.run((lambda: asyncpg.connect('postgresql://postgres:postgres@localhost:5432/iot_dashboard').then(lambda c: print('DB OK: ', c.fetchval('SELECT 1'))))())"
```

---

## ⚠️ 3. Troubleshooting Runbook

### Issue: Port 8000 or 5173 Already Bound
If an orphaned python or node process is locking the port:
```powershell
.\manage.ps1 stop
# Or manual forced kill on Windows:
Get-Process python, node -ErrorAction SilentlyContinue | Stop-Process -Force
```

### Issue: PostgreSQL Connection Refused
1. Ensure the PostgreSQL service is active in Windows Services (`services.msc`).
2. Verify credentials in `backend/.env`.
3. Test connection using `python backend/init_postgres.py`.

### Issue: Serial Port Access Denied (`serial.SerialException`)
1. Ensure no other serial monitor (e.g. Arduino IDE Serial Monitor or PuTTY) is locking the COM port.
2. The `SerialManager` auto-reconnect loop will retry automatically once the conflicting program releases the handle.
