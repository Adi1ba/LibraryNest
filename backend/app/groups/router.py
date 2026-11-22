
from fastapi import APIRouter, Depends, status
from sqlmodel import Session

from app.auth.dependencies import get_current_user
from app.auth.models import User
from app.database import get_session
from app.groups import service
from app.groups.schemas import (
    GroupCreate,
    GroupMemberAdd,
    GroupMemberRead,
    GroupPermissionUpdate,
    GroupRead,
    GroupUpdate,
    ReadingListItemCreate,
    ReadingListItemRead,
    ReadingListItemUpdate,
)

router = APIRouter(prefix="/api/groups", tags=["Groups"])


@router.post(
    "",
    response_model=GroupRead,
    status_code=status.HTTP_201_CREATED,
)
def create_group(
    group_data: GroupCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return service.create_group(session, group_data, current_user)


@router.get("", response_model=list[GroupRead])
def get_my_groups(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return service.get_my_groups(session, current_user)


@router.get("/{group_id}", response_model=GroupRead)
def get_group_details(
    group_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return service.get_group_details(session, group_id, current_user)


@router.patch("/{group_id}", response_model=GroupRead)
def update_group(
    group_id: int,
    group_data: GroupUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return service.update_group(session, group_id, group_data, current_user)


@router.delete("/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_group(
    group_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    service.delete_group(session, group_id, current_user)


@router.get(
    "/{group_id}/members",
    response_model=list[GroupMemberRead],
)
def get_group_members(
    group_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return service.get_group_members(session, group_id, current_user)


@router.post(
    "/{group_id}/members",
    response_model=GroupMemberRead,
    status_code=status.HTTP_201_CREATED,
)
def add_group_member(
    group_id: int,
    member_data: GroupMemberAdd,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return service.add_group_member(
        session, group_id, member_data.user_id, current_user
    )


@router.patch(
    "/{group_id}/members/{user_id}/permissions",
    response_model=GroupMemberRead,
)
def update_member_permissions(
    group_id: int,
    user_id: int,
    permission_data: GroupPermissionUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return service.update_member_permissions(
        session, group_id, user_id, permission_data, current_user
    )


@router.delete(
    "/{group_id}/members/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def remove_group_member(
    group_id: int,
    user_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    service.remove_group_member(session, group_id, user_id, current_user)


@router.post(
    "/{group_id}/reading-list",
    response_model=ReadingListItemRead,
    status_code=status.HTTP_201_CREATED,
)
def add_reading_list_item(
    group_id: int,
    item_data: ReadingListItemCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return service.add_reading_list_item(
        session, group_id, item_data, current_user
    )


@router.get(
    "/{group_id}/reading-list",
    response_model=list[ReadingListItemRead],
)
def get_reading_list(
    group_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return service.get_reading_list(session, group_id, current_user)


@router.patch(
    "/{group_id}/reading-list/{item_id}",
    response_model=ReadingListItemRead,
)
def update_reading_list_item(
    group_id: int,
    item_id: int,
    item_data: ReadingListItemUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return service.update_reading_list_item(
        session, group_id, item_id, item_data, current_user
    )


@router.delete(
    "/{group_id}/reading-list/{item_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_reading_list_item(
    group_id: int,
    item_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    service.delete_reading_list_item(
        session, group_id, item_id, current_user
    )
