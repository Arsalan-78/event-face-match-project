"""
models.py
---------
Relational metadata model for events/photos/faces.

faces.faiss_position is the stable bridge between FAISS vector row index
and photo metadata lookup.
"""

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class Event(Base):
    __tablename__ = "events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    event_id: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    photos: Mapped[list["Photo"]] = relationship("Photo", back_populates="event")
    faces: Mapped[list["Face"]] = relationship("Face", back_populates="event")


class Photo(Base):
    __tablename__ = "photos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    event_db_id: Mapped[int] = mapped_column(ForeignKey("events.id"), nullable=False, index=True)
    filename: Mapped[str] = mapped_column(String(128), nullable=False)
    storage_key: Mapped[str] = mapped_column(String(512), nullable=False)
    thumbnail_key: Mapped[str] = mapped_column(String(512), nullable=False)
    width: Mapped[int] = mapped_column(Integer, nullable=False)
    height: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    event: Mapped["Event"] = relationship("Event", back_populates="photos")
    faces: Mapped[list["Face"]] = relationship("Face", back_populates="photo")


class Face(Base):
    __tablename__ = "faces"
    __table_args__ = (
        UniqueConstraint("event_db_id", "faiss_position", name="uq_face_event_position"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    event_db_id: Mapped[int] = mapped_column(ForeignKey("events.id"), nullable=False, index=True)
    photo_id: Mapped[int] = mapped_column(ForeignKey("photos.id"), nullable=False, index=True)
    faiss_position: Mapped[int] = mapped_column(Integer, nullable=False)

    # Bounding box from face_recognition: (top, right, bottom, left)
    bbox_top: Mapped[int | None] = mapped_column(Integer, nullable=True)
    bbox_right: Mapped[int | None] = mapped_column(Integer, nullable=True)
    bbox_bottom: Mapped[int | None] = mapped_column(Integer, nullable=True)
    bbox_left: Mapped[int | None] = mapped_column(Integer, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    event: Mapped["Event"] = relationship("Event", back_populates="faces")
    photo: Mapped["Photo"] = relationship("Photo", back_populates="faces")

