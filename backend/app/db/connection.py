import os
import logging
from typing import Optional, Dict, Any
import asyncpg
from app.core.config import settings

logger = logging.getLogger("db.connection")

_pool: Optional[asyncpg.Pool] = None


def get_pool() -> Optional[asyncpg.Pool]:
    """Returns current active asyncpg connection pool."""
    return _pool


def get_db_config() -> Dict[str, Any]:
    """Returns database configuration without exposing plain passwords."""
    return {
        "host": settings.DB_HOST,
        "port": settings.DB_PORT,
        "user": settings.DB_USER,
        "database": settings.DB_NAME,
        "min_pool_size": settings.DB_MIN_POOL,
        "max_pool_size": settings.DB_MAX_POOL,
        "connected": _pool is not None and not _pool._closed
    }


async def init_db() -> asyncpg.Pool:
    """Initializes asyncpg pool and applies database schema migrations."""
    global _pool
    from app.db.schema import create_tables_and_indexes

    try:
        logger.info(f"Connecting to PostgreSQL at {settings.DB_USER}@{settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}")
        _pool = await asyncpg.create_pool(
            host=settings.DB_HOST,
            port=settings.DB_PORT,
            user=settings.DB_USER,
            password=settings.DB_PASSWORD,
            database=settings.DB_NAME,
            min_size=settings.DB_MIN_POOL,
            max_size=settings.DB_MAX_POOL,
            command_timeout=10
        )

        async with _pool.acquire() as conn:
            await create_tables_and_indexes(conn)
        logger.info("PostgreSQL connection pool initialized and schema verified.")
        return _pool
    except Exception as e:
        logger.warning(f"PostgreSQL not reachable ({e}). Operating in memory/live broadcast fallback mode.")
        _pool = None
        return None


async def close_db():
    """Safely flushes memory buffers and closes the database connection pool."""
    global _pool
    from app.db.buffer import flush_buffer_now

    await flush_buffer_now()
    if _pool:
        await _pool.close()
        _pool = None
        logger.info("PostgreSQL connection pool closed successfully.")


async def reconnect_db(host: str, port: int, user: str, password: str, database: str) -> Dict[str, Any]:
    """Tests new database credentials, updates .env file, and restarts the pool."""
    global _pool
    from app.db.schema import create_tables_and_indexes
    from app.db.buffer import flush_buffer_now

    # 1. Verify credentials on a temporary connection
    test_conn = await asyncpg.connect(
        host=host, port=port, user=user, password=password, database=database, timeout=5.0
    )
    try:
        await test_conn.execute("SELECT 1;")
    finally:
        await test_conn.close()

    # 2. Flush in-flight data and tear down old pool
    if _pool:
        await flush_buffer_now()
        await _pool.close()

    # 3. Update runtime settings
    settings.DB_HOST = host
    settings.DB_PORT = port
    settings.DB_USER = user
    settings.DB_PASSWORD = password
    settings.DB_NAME = database

    # 4. Spin up new pool
    _pool = await asyncpg.create_pool(
        host=host, port=port, user=user, password=password, database=database,
        min_size=settings.DB_MIN_POOL, max_size=settings.DB_MAX_POOL, command_timeout=60
    )

    async with _pool.acquire() as conn:
        await create_tables_and_indexes(conn)

    # 5. Persist to .env
    _persist_env_credentials(host, port, user, password, database)
    return {"status": "success", "message": f"Connected to PostgreSQL [{user}@{host}:{port}/{database}]"}


def _persist_env_credentials(host: str, port: int, user: str, password: str, database: str):
    env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env")
    if not os.path.exists(env_path):
        return
    try:
        with open(env_path, "r", encoding="utf-8") as f:
            lines = f.readlines()
        updates = {
            "DB_HOST": host,
            "DB_PORT": str(port),
            "DB_USER": user,
            "DB_PASSWORD": password,
            "DB_NAME": database
        }
        new_lines = []
        handled = set()
        for line in lines:
            replaced = False
            for k, v in updates.items():
                if line.startswith(f"{k}="):
                    new_lines.append(f"{k}={v}\n")
                    handled.add(k)
                    replaced = True
                    break
            if not replaced:
                new_lines.append(line)
        for k, v in updates.items():
            if k not in handled:
                new_lines.append(f"{k}={v}\n")
        with open(env_path, "w", encoding="utf-8") as f:
            f.writelines(new_lines)
    except Exception as e:
        logger.warning(f"Could not persist new credentials to .env: {e}")
