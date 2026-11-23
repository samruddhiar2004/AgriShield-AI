import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from backend.app.core.config import settings

logger = logging.getLogger(__name__)

Base = declarative_base()

# Attempt connection with primary DATABASE_URL; fallback to SQLite if PostgreSQL is unreachable locally
def create_db_engine():
    primary_url = settings.DATABASE_URL
    if primary_url.startswith("postgresql://"):
        primary_url = primary_url.replace("postgresql://", "postgresql+psycopg2://", 1)
        
    try:
        # If postgres, test quick connection
        if "postgresql" in primary_url:
            eng = create_engine(primary_url, pool_pre_ping=True, connect_args={"connect_timeout": 3})
            with eng.connect() as conn:
                conn.execute(text("SELECT 1"))
            logger.info("Successfully connected to primary PostgreSQL database.")
            return eng, "postgresql"
    except Exception as e:
        logger.warning(f"Could not connect to PostgreSQL at {primary_url}: {e}. Falling back to SQLite local database.")
    
    # SQLite fallback
    fallback_eng = create_engine(
        settings.SQLITE_FALLBACK_URL, 
        connect_args={"check_same_thread": False, "timeout": 30}
    )
    try:
        with fallback_eng.connect() as conn:
            conn.execute(text("PRAGMA journal_mode=WAL;"))
            conn.execute(text("PRAGMA busy_timeout=10000;"))
    except Exception:
        pass
    logger.info("Using SQLite fallback database for local execution.")
    return fallback_eng, "sqlite"

engine, DB_DIALECT = create_db_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def check_db_health():
    """
    Checks database connection and PostGIS capabilities.
    """
    health = {
        "connected": False,
        "dialect": DB_DIALECT,
        "postgis_enabled": False,
        "postgis_version": None,
        "details": ""
    }
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            health["connected"] = True
            
            if DB_DIALECT == "postgresql":
                try:
                    res = conn.execute(text("SELECT PostGIS_Version();")).fetchone()
                    if res:
                        health["postgis_enabled"] = True
                        health["postgis_version"] = str(res[0])
                        health["details"] = f"PostGIS active: {res[0]}"
                except Exception as pge:
                    health["details"] = f"PostgreSQL connected, but PostGIS extension not detected: {pge}"
            else:
                health["details"] = "Running on SQLite storage mode with standard coordinates and GeoJSON spatial math."
    except Exception as e:
        health["details"] = f"Database health check failed: {str(e)}"
    return health
