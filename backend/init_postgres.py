import asyncio
import asyncpg


async def main():
    # Connect to default database
    conn = await asyncpg.connect("postgresql://postgres:postgres@localhost:5432/postgres")
    exists = await conn.fetchval("SELECT 1 FROM pg_database WHERE datname = 'iot_dashboard'")
    if not exists:
        await conn.execute("CREATE DATABASE iot_dashboard")
        print("Database 'iot_dashboard' created successfully.")
    else:
        print("Database 'iot_dashboard' already exists.")
    await conn.close()


if __name__ == "__main__":
    asyncio.run(main())
