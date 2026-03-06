# database.py
# ---------------------------------------------------------
# This file sets up the connection to our SQLite database.
# SQLite stores everything in a single file (agrisense.db)
# — perfect for beginners, no server setup needed!
# ---------------------------------------------------------

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# The database file will be created at: database/agrisense.db
DATABASE_URL = "sqlite:///../database/agrisense.db"

# Create the "engine" — this is the connection to the database
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}  # Needed for SQLite + FastAPI
)

# SessionLocal is a factory: calling SessionLocal() gives us a DB session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base is the parent class all our table models inherit from
Base = declarative_base()


def get_db():
    """
    This is a 'dependency' used by FastAPI routes.
    It opens a DB session, gives it to the route, then closes it.

    Usage in a route:
        def my_route(db: Session = Depends(get_db)):
            ...
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
