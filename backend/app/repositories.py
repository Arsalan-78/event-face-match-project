"""
repositories.py
---------------
Small data-access helpers to keep DB code out of endpoints and FAISS logic.
"""

from collections.abc import Iterable

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Event, Face, Photo


def get_or_create_event(session: Session, event_id: str) -> Event:
    event = session.execute(select(Event).where(Event.event_id == event_id)).scalar_one_or_none()
    if event:
        return event

    event = Event(event_id=event_id)
    session.add(event)
    session.flush()
    return event


def create_photo(
    session: Session,
    *,
    event_db_id: int,
    filename: str,
    storage_key: str,
    thumbnail_key: str,
    width: int,
    height: int,
) -> Photo:
    photo = Photo(
        event_db_id=event_db_id,
        filename=filename,
        storage_key=storage_key,
        thumbnail_key=thumbnail_key,
        width=width,
        height=height,
    )
    session.add(photo)
    session.flush()
    return photo


def add_faces_for_photo(
    session: Session,
    *,
    event_db_id: int,
    photo_id: int,
    start_faiss_position: int,
    bboxes: Iterable[tuple[int, int, int, int] | None],
) -> None:
    for offset, bbox in enumerate(bboxes):
        top, right, bottom, left = bbox if bbox is not None else (None, None, None, None)
        session.add(
            Face(
                event_db_id=event_db_id,
                photo_id=photo_id,
                faiss_position=start_faiss_position + offset,
                bbox_top=top,
                bbox_right=right,
                bbox_bottom=bottom,
                bbox_left=left,
            )
        )


def count_faces_for_event(session: Session, event_db_id: int) -> int:
    return len(
        session.execute(select(Face.id).where(Face.event_db_id == event_db_id)).scalars().all()
    )


def photo_by_filename(session: Session, *, event_db_id: int, filename: str) -> Photo | None:
    return session.execute(
        select(Photo).where(Photo.event_db_id == event_db_id, Photo.filename == filename)
    ).scalar_one_or_none()


def photos_by_faiss_positions(
    session: Session, *, event_db_id: int, positions: list[int]
) -> dict[int, Photo]:
    if not positions:
        return {}

    rows = session.execute(
        select(Face.faiss_position, Photo)
        .join(Photo, Photo.id == Face.photo_id)
        .where(Face.event_db_id == event_db_id, Face.faiss_position.in_(positions))
    ).all()

    return {faiss_position: photo for faiss_position, photo in rows}

