import asyncio
import os
import asyncpg
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

async def clean_database():
    conn = await asyncpg.connect(
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", "postgres"),
        database=os.getenv("DB_NAME", "iot_dashboard"),
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", 5432))
    )
    res_telemetry = await conn.execute("TRUNCATE TABLE telemetry RESTART IDENTITY CASCADE;")
    res_alerts = await conn.execute("TRUNCATE TABLE alerts RESTART IDENTITY CASCADE;")
    print(f"[SUCCESS] Telemetry table wiped: {res_telemetry}")
    print(f"[SUCCESS] Alerts table wiped: {res_alerts}")
    await conn.close()

if __name__ == "__main__":
    asyncio.run(clean_database())
