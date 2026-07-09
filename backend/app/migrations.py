"""
migrations.py
-------------
Simple startup migration hooks for schema creation.

For this project stage we keep migration logic lightweight. Once schema
changes become frequent, move to Alembic migration scripts.
"""

from app.db import get_engine
from app.models import Base


def ensure_schema() -> None:
    Base.metadata.create_all(bind=get_engine())

