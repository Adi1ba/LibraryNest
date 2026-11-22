
from fastapi import HTTPException, status
from sqlmodel import Session, col, select

from app.auth.models import User
from app.books.models import Book
from app.groups.models import Group, GroupMembership, GroupReadingListItem
from app.groups.schemas import (
    GroupCreate,
    GroupPermissionUpdate,
    GroupUpdate,
    ReadingListItemCreate,
    ReadingListItemUpdate,
)


def get_user_id(user: User) -> int:
    if user.id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user account.",
        )

    return user.id


def get_group_or_404(session: Session, group_id: int) -> Group:
    group = session.get(Group, group_id)

    if group is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found.",
        )

    return group


def get_membership(
    session: Session,
    group_id: int,
    user_id: int,
) -> GroupMembership | None:
    statement = select(GroupMembership).where(
        GroupMembership.group_id == group_id,
        GroupMembership.user_id == user_id,
    )

    return session.exec(statement).first()


def require_group_access(
    session: Session,
    group: Group,
    group_id: int,
    current_user: User,
) -> GroupMembership | None:
    user_id = get_user_id(current_user)

    if group.owner_id == user_id:
        return None

    membership = get_membership(
        session,
        group_id,
        user_id,
    )

    if membership is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this group.",
        )

    return membership


def require_owner(group: Group, current_user: User) -> None:
    user_id = get_user_id(current_user)

    if group.owner_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the group owner can perform this action.",
        )


def require_permission(
    session: Session,
    group: Group,
    group_id: int,
    current_user: User,
    permission: str,
) -> GroupMembership | None:
    membership = require_group_access(
        session,
        group,
        group_id,
        current_user,
    )

    if membership is None:
        return None

    if not getattr(membership, permission, False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to perform this action.",
        )

    return membership


def create_group(
    session: Session,
    group_data: GroupCreate,
    current_user: User,
) -> Group:
    group = Group(
        name=group_data.name,
        description=group_data.description,
        owner_id=get_user_id(current_user),
    )

    session.add(group)
    session.commit()
    session.refresh(group)

    return group


def get_my_groups(
    session: Session,
    current_user: User,
) -> list[Group]:
    user_id = get_user_id(current_user)

    owned_statement = (
        select(Group)
        .where(Group.owner_id == user_id)
        .order_by(col(Group.id))
    )

    owned_groups = list(session.exec(owned_statement).all())

    membership_statement = select(GroupMembership).where(
        GroupMembership.user_id == user_id
    )

    memberships = session.exec(membership_statement).all()

    groups = {
        group.id: group
        for group in owned_groups
        if group.id is not None
    }

    for membership in memberships:
        group = session.get(Group, membership.group_id)

        if group is not None and group.id is not None:
            groups[group.id] = group

    return list(groups.values())


def get_group_details(
    session: Session,
    group_id: int,
    current_user: User,
) -> Group:
    group = get_group_or_404(session, group_id)

    require_group_access(
        session,
        group,
        group_id,
        current_user,
    )

    return group


def update_group(
    session: Session,
    group_id: int,
    group_data: GroupUpdate,
    current_user: User,
) -> Group:
    group = get_group_or_404(session, group_id)
    require_owner(group, current_user)

    update_data = group_data.model_dump(exclude_unset=True)

    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No group details were provided.",
        )

    if "name" in update_data and update_data["name"] is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Group name cannot be empty.",
        )

    for key, value in update_data.items():
        setattr(group, key, value)

    session.add(group)
    session.commit()
    session.refresh(group)

    return group


def delete_group(
    session: Session,
    group_id: int,
    current_user: User,
) -> None:
    group = get_group_or_404(session, group_id)
    require_owner(group, current_user)

    items = session.exec(
        select(GroupReadingListItem).where(
            GroupReadingListItem.group_id == group_id
        )
    ).all()

    memberships = session.exec(
        select(GroupMembership).where(
            GroupMembership.group_id == group_id
        )
    ).all()

    for item in items:
        session.delete(item)

    for membership in memberships:
        session.delete(membership)

    session.delete(group)
    session.commit()


def get_group_members(
    session: Session,
    group_id: int,
    current_user: User,
) -> list[GroupMembership]:
    group = get_group_or_404(session, group_id)

    require_group_access(
        session,
        group,
        group_id,
        current_user,
    )

    statement = (
        select(GroupMembership)
        .where(GroupMembership.group_id == group_id)
        .order_by(col(GroupMembership.id))
    )

    return list(session.exec(statement).all())


def add_group_member(
    session: Session,
    group_id: int,
    user_id: int,
    current_user: User,
) -> GroupMembership:
    group = get_group_or_404(session, group_id)
    require_owner(group, current_user)

    if user_id == group.owner_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The group owner is already the owner.",
        )

    user = session.get(User, user_id)

    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Active user not found.",
        )

    if get_membership(session, group_id, user_id) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This user is already a group member.",
        )

    membership = GroupMembership(
        group_id=group_id,
        user_id=user_id,
    )

    session.add(membership)
    session.commit()
    session.refresh(membership)

    return membership


def update_member_permissions(
    session: Session,
    group_id: int,
    user_id: int,
    permission_data: GroupPermissionUpdate,
    current_user: User,
) -> GroupMembership:
    group = get_group_or_404(session, group_id)
    require_owner(group, current_user)

    membership = get_membership(
        session,
        group_id,
        user_id,
    )

    if membership is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group member not found.",
        )

    for key, value in permission_data.model_dump().items():
        setattr(membership, key, value)

    session.add(membership)
    session.commit()
    session.refresh(membership)

    return membership


def remove_group_member(
    session: Session,
    group_id: int,
    user_id: int,
    current_user: User,
) -> None:
    group = get_group_or_404(session, group_id)
    require_owner(group, current_user)

    membership = get_membership(
        session,
        group_id,
        user_id,
    )

    if membership is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group member not found.",
        )

    assigned_items = session.exec(
        select(GroupReadingListItem).where(
            GroupReadingListItem.group_id == group_id,
            GroupReadingListItem.assigned_to == user_id,
        )
    ).all()

    for item in assigned_items:
        item.assigned_to = None
        session.add(item)

    session.delete(membership)
    session.commit()


def get_reading_list(
    session: Session,
    group_id: int,
    current_user: User,
) -> list[GroupReadingListItem]:
    group = get_group_or_404(session, group_id)

    require_group_access(
        session,
        group,
        group_id,
        current_user,
    )

    statement = (
        select(GroupReadingListItem)
        .where(GroupReadingListItem.group_id == group_id)
        .order_by(col(GroupReadingListItem.id))
    )

    return list(session.exec(statement).all())


def add_reading_list_item(
    session: Session,
    group_id: int,
    item_data: ReadingListItemCreate,
    current_user: User,
) -> GroupReadingListItem:
    group = get_group_or_404(session, group_id)

    require_permission(
        session,
        group,
        group_id,
        current_user,
        "can_create",
    )

    book = session.get(Book, item_data.book_id)

    if book is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book not found in the catalogue.",
        )

    existing_item = session.exec(
        select(GroupReadingListItem).where(
            GroupReadingListItem.group_id == group_id,
            GroupReadingListItem.book_id == item_data.book_id,
        )
    ).first()

    if existing_item is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This book is already in the group reading list.",
        )

    if item_data.assigned_to is not None:
        require_permission(
            session,
            group,
            group_id,
            current_user,
            "can_assign",
        )

        if (
            item_data.assigned_to != group.owner_id
            and get_membership(
                session,
                group_id,
                item_data.assigned_to,
            ) is None
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The assigned user must belong to this group.",
            )

    item = GroupReadingListItem(
        group_id=group_id,
        book_id=item_data.book_id,
        added_by=get_user_id(current_user),
        assigned_to=item_data.assigned_to,
    )

    session.add(item)
    session.commit()
    session.refresh(item)

    return item


def update_reading_list_item(
    session: Session,
    group_id: int,
    item_id: int,
    item_data: ReadingListItemUpdate,
    current_user: User,
) -> GroupReadingListItem:
    group = get_group_or_404(session, group_id)

    update_data = item_data.model_dump(exclude_unset=True)

    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No reading-list changes were provided.",
        )

    item = session.get(GroupReadingListItem, item_id)

    if item is None or item.group_id != group_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reading-list item not found.",
        )

    if "status" in update_data:
        require_permission(
            session,
            group,
            group_id,
            current_user,
            "can_edit",
        )

    if "assigned_to" in update_data:
        require_permission(
            session,
            group,
            group_id,
            current_user,
            "can_assign",
        )

        assigned_to = update_data["assigned_to"]

        if (
            assigned_to is not None
            and assigned_to != group.owner_id
            and get_membership(
                session,
                group_id,
                assigned_to,
            ) is None
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The assigned user must belong to this group.",
            )

    for key, value in update_data.items():
        setattr(item, key, value)

    session.add(item)
    session.commit()
    session.refresh(item)

    return item


def delete_reading_list_item(
    session: Session,
    group_id: int,
    item_id: int,
    current_user: User,
) -> None:
    group = get_group_or_404(session, group_id)

    require_permission(
        session,
        group,
        group_id,
        current_user,
        "can_delete",
    )

    item = session.get(GroupReadingListItem, item_id)

    if item is None or item.group_id != group_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reading-list item not found.",
        )

    session.delete(item)
    session.commit()
