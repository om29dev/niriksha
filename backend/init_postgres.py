import asyncio
import os
import sys
import asyncpg
from dotenv import load_dotenv

sys.path.insert(0, os.path.dirname(__file__))
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
from app.db.schema import create_tables_and_indexes


async def main():
    host = os.getenv("DB_HOST", "localhost")
    port = int(os.getenv("DB_PORT", 5432))
    user = os.getenv("DB_USER", "postgres")
    password = os.getenv("DB_PASSWORD", "postgres")
    dbname = os.getenv("DB_NAME", "iot_dashboard")

    # 1. Connect to maintenance DB to ensure target database exists
    conn = await asyncpg.connect(f"postgresql://{user}:{password}@{host}:{port}/postgres")
    exists = await conn.fetchval(f"SELECT 1 FROM pg_database WHERE datname = '{dbname}'")
    if not exists:
        await conn.execute(f"CREATE DATABASE {dbname}")
        print(f"[SUCCESS] Database '{dbname}' created successfully.")
    else:
        print(f"[INFO] Database '{dbname}' already exists.")
    await conn.close()

    # 2. Connect to iot_dashboard and apply schemas + TimescaleDB checks
    conn_db = await asyncpg.connect(f"postgresql://{user}:{password}@{host}:{port}/{dbname}")
    await create_tables_and_indexes(conn_db)
    print("[SUCCESS] Schemas, indexes, and TimescaleDB configurations verified.")
    await conn_db.close()


if __name__ == "__main__":
    asyncio.run(main())

