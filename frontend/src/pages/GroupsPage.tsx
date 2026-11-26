
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { User } from "../types/auth";
import type {
  Group,
  GroupMember,
  GroupPermissions,
  ReadingListItem,
} from "../types/group";
import type { Book } from "../types/book";
import { getBooks } from "../services/bookService";
import {
  getMyGroups,
  createGroup,
  deleteGroup,
  getGroupMembers,
  addGroupMember,
  updateMemberPermissions,
  removeGroupMember,
  getReadingList,
  addReadingListItem,
  updateReadingListItem,
  deleteReadingListItem,
} from "../services/groupService";
import "./GroupsPage.css";

interface GroupsPageProps {
  user: User;
  onNavigate: (
    page: "dashboard" | "books" | "loans" | "users" | "profile" | "groups"
  ) => void;
  onLogout: () => void;
}

const emptyPermissions: GroupPermissions = {
  can_create: false,
  can_edit: false,
  can_assign: false,
  can_delete: false,
};

function GroupsPage({ user, onNavigate, onLogout }: GroupsPageProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [readingList, setReadingList] = useState<ReadingListItem[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [memberId, setMemberId] = useState("");
  const [bookId, setBookId] = useState("");

  const [permissionDrafts, setPermissionDrafts] = useState<
    Record<number, GroupPermissions>
  >({});

  const isOwner = selectedGroup?.owner_id === user.id;
  const myMembership = members.find((member) => member.user_id === user.id);

  const canCreate = isOwner || Boolean(myMembership?.can_create);
  const canEdit = isOwner || Boolean(myMembership?.can_edit);
  const canAssign = isOwner || Boolean(myMembership?.can_assign);
  const canDelete = isOwner || Boolean(myMembership?.can_delete);

  const loadGroups = async () => {
    try {
      setLoading(true);
      setGroups(await getMyGroups());
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load groups.");
    } finally {
      setLoading(false);
    }
  };

  const loadWorkspace = async (group: Group) => {
    setSelectedGroup(group);
    setError("");
    setSuccess("");
    setWorkspaceLoading(true);

    setMembers([]);
    setReadingList([]);
    setBooks([]);
    setPermissionDrafts({});

    try {
      const [memberData, listData, bookData] = await Promise.all([
        getGroupMembers(group.id),
        getReadingList(group.id),
        getBooks(),
      ]);

      setMembers(memberData);
      setReadingList(listData);
      setBooks(bookData);

      const drafts: Record<number, GroupPermissions> = {};

      memberData.forEach((member) => {
        drafts[member.user_id] = {
          can_create: member.can_create,
          can_edit: member.can_edit,
          can_assign: member.can_assign,
          can_delete: member.can_delete,
        };
      });

      setPermissionDrafts(drafts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load group.");
    } finally {
      setWorkspaceLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const handleCreateGroup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    try {
      const group = await createGroup({
        name: groupName.trim(),
        description: description.trim() || null,
      });

      setGroupName("");
      setDescription("");
      setSuccess("Your group has been created.");

      await loadGroups();
      await loadWorkspace(group);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create group.");
    }
  };

  const handleDeleteGroup = async () => {
    if (!selectedGroup || !isOwner) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this group? This will remove the group and its shared reading list."
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await deleteGroup(selectedGroup.id);

      setSelectedGroup(null);
      setMembers([]);
      setReadingList([]);
      setBooks([]);
      setPermissionDrafts({});

      setSuccess("Group deleted successfully.");
      await loadGroups();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to delete group."
      );
    }
  };

  const handleAddMember = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedGroup || !memberId.trim()) return;

    try {
      await addGroupMember(selectedGroup.id, Number(memberId));
      setMemberId("");
      setSuccess("Member added successfully.");
      await loadWorkspace(selectedGroup);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to add member.");
    }
  };

  const handlePermissionChange = (
    userId: number,
    key: keyof GroupPermissions,
    value: boolean
  ) => {
    setPermissionDrafts((previous) => ({
      ...previous,
      [userId]: {
        ...(previous[userId] || emptyPermissions),
        [key]: value,
      },
    }));
  };

  const handleSavePermissions = async (userId: number) => {
    if (!selectedGroup) return;

    try {
      await updateMemberPermissions(
        selectedGroup.id,
        userId,
        permissionDrafts[userId]
      );

      setSuccess("Member permissions updated.");
      await loadWorkspace(selectedGroup);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update permissions.");
    }
  };

  const handleRemoveMember = async (userId: number) => {
    if (!selectedGroup) return;
    if (!window.confirm("Remove this member from the group?")) return;

    try {
      await removeGroupMember(selectedGroup.id, userId);
      setSuccess("Member removed.");
      await loadWorkspace(selectedGroup);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to remove member.");
    }
  };

  const handleAddBook = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedGroup || !bookId) return;

    try {
      await addReadingListItem(selectedGroup.id, Number(bookId));
      setBookId("");
      setSuccess("Book added to the shared reading list.");
      await loadWorkspace(selectedGroup);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to add book.");
    }
  };

  const handleStatusChange = async (
    item: ReadingListItem,
    status: ReadingListItem["status"]
  ) => {
    if (!selectedGroup) return;

    try {
      await updateReadingListItem(selectedGroup.id, item.id, { status });
      await loadWorkspace(selectedGroup);
      setSuccess("Reading status updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update status.");
    }
  };

  const handleAssign = async (item: ReadingListItem, value: string) => {
    if (!selectedGroup) return;

    try {
      await updateReadingListItem(selectedGroup.id, item.id, {
        assigned_to: value ? Number(value) : null,
      });

      await loadWorkspace(selectedGroup);
      setSuccess("Book assignment updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to assign book.");
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    if (!selectedGroup || !window.confirm("Remove this book from the reading list?")) {
      return;
    }

    try {
      await deleteReadingListItem(selectedGroup.id, itemId);
      await loadWorkspace(selectedGroup);
      setSuccess("Book removed from the reading list.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete item.");
    }
  };

  const getBook = (id: number) => books.find((book) => book.id === id);

  const getMemberName = (id: number | null) => {
    if (id === null) return "Not assigned";

    if (selectedGroup && id === selectedGroup.owner_id) {
      return "Group owner";
    }

    if (id === user.id) return "You";

    return `Member #${id}`;
  };

  const fullName = `${user.first_name} ${user.last_name}`.trim();
  const initials = `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase();

  return (
    <div className="dashboard groups-dashboard">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">L</div>
          <div>
            <h2>LibraryNest</h2>
            <span>Library Management</span>
          </div>
        </div>

        <div className="sidebar-label">WORKSPACE</div>

        <nav className="sidebar-nav">
          {user.role === "admin" && (
            <button
              type="button"
              className="nav-item"
              onClick={() => onNavigate("dashboard")}
            >
              <span>▦</span> Overview
            </button>
          )}

          <button className="nav-item" onClick={() => onNavigate("books")}>
            <span>▦</span> Book Management
          </button>

          <button className="nav-item" onClick={() => onNavigate("loans")}>
            <span>▤</span> Loan Management
          </button>

          <button className="nav-item active" onClick={() => onNavigate("groups")}>
            <span>♡</span> Reading Groups
          </button>

          {user.role === "admin" && (
            <button className="nav-item" onClick={() => onNavigate("users")}>
              <span>♙</span> User Management
            </button>
          )}

          <button className="nav-item" onClick={() => onNavigate("profile")}>
            <span>◉</span> My Profile
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-profile">
            <div className="sidebar-profile-avatar">{initials || "U"}</div>
            <div className="sidebar-profile-info">
              <strong>{fullName || "Library User"}</strong>
              <span>{user.role}</span>
            </div>
          </div>

          <button className="sidebar-logout" onClick={onLogout}>
            ↪ Logout
          </button>

          <span className="sidebar-version">LibraryNest · MVP</span>
        </div>
      </aside>

      <main className="main-content groups-main">
        <header className="topbar">
          <div>
            <span className="breadcrumb">Workspace / Reading Groups</span>
            <h1>{selectedGroup ? selectedGroup.name : "Reading Groups"}</h1>
          </div>

          {selectedGroup && (
            <div className="groups-topbar-actions">
              {isOwner && (
                <button
                  type="button"
                  className="groups-delete-button"
                  onClick={handleDeleteGroup}
                >
                  Delete Group
                </button>
              )}

              <button
                type="button"
                className="groups-back"
                onClick={() => {
                  setSelectedGroup(null);
                  setMembers([]);
                  setReadingList([]);
                  setBooks([]);
                  setPermissionDrafts({});
                  setError("");
                  setSuccess("");
                }}
              >
                ← All groups
              </button>
            </div>
          )}
        </header>

        <section className="page-content groups-content">
          <div className="groups-welcome">
            <div>
              <p className="groups-eyebrow">READ TOGETHER, GROW TOGETHER</p>
              <h2>
                {selectedGroup
                  ? "Your shared reading space"
                  : "Find your reading circle"}
              </h2>
              <p>
                {selectedGroup
                  ? selectedGroup.description ||
                    "A shared space for your group's reading journey."
                  : "Create a group, invite members, and build a reading list together."}
              </p>
            </div>
            <div className="groups-welcome-icon">♡</div>
          </div>

          {error && <div className="groups-alert groups-error">{error}</div>}
          {success && <div className="groups-alert groups-success">{success}</div>}

          {!selectedGroup ? (
            <>
              <section className="groups-create-card">
                <div className="groups-section-heading">
                  <div>
                    <span className="groups-eyebrow">START A CIRCLE</span>
                    <h3>Create a new group</h3>
                  </div>
                  <span className="groups-heading-icon">＋</span>
                </div>

                <form className="groups-form" onSubmit={handleCreateGroup}>
                  <label>
                    Group name
                    <input
                      value={groupName}
                      onChange={(event) => setGroupName(event.target.value)}
                      placeholder="e.g. CSE Study Circle"
                      maxLength={100}
                      required
                    />
                  </label>

                  <label>
                    Description <span className="optional-label">Optional</span>
                    <textarea
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      placeholder="What will your group read together?"
                      maxLength={500}
                      rows={3}
                    />
                  </label>

                  <button className="groups-primary-button" type="submit">
                    ＋ Create group
                  </button>
                </form>
              </section>

              <section className="groups-list-section">
                <div className="groups-section-heading">
                  <div>
                    <span className="groups-eyebrow">YOUR COMMUNITY</span>
                    <h3>My reading groups</h3>
                  </div>
                  <span className="groups-count">{groups.length} groups</span>
                </div>

                {loading ? (
                  <div className="groups-empty">Loading your groups...</div>
                ) : groups.length === 0 ? (
                  <div className="groups-empty">
                    <span>♡</span>
                    <h3>No groups yet</h3>
                    <p>Create your first reading group to get started.</p>
                  </div>
                ) : (
                  <div className="groups-grid">
                    {groups.map((group) => (
                      <button
                        className="group-card"
                        key={group.id}
                        onClick={() => loadWorkspace(group)}
                      >
                        <div className="group-card-top">
                          <span className="group-card-icon">♡</span>
                          <span className="group-card-id">GROUP #{group.id}</span>
                        </div>
                        <h3>{group.name}</h3>
                        <p>{group.description || "A shared reading space."}</p>
                        <span className="group-card-link">Open workspace →</span>
                      </button>
                    ))}
                  </div>
                )}
              </section>
            </>
          ) : (
            <>
              {workspaceLoading ? (
                <div className="groups-empty">Loading group workspace...</div>
              ) : (
                <>
                  <section className="groups-stats">
                    <div className="groups-stat-card">
                      <span>♡</span>
                      <div>
                        <p>Members</p>
                        <strong>{members.length + 1}</strong>
                      </div>
                    </div>

                    <div className="groups-stat-card">
                      <span>▤</span>
                      <div>
                        <p>Reading list</p>
                        <strong>{readingList.length}</strong>
                      </div>
                    </div>

                    <div className="groups-stat-card">
                      <span>✿</span>
                      <div>
                        <p>Your access</p>
                        <strong>{isOwner ? "Owner" : "Member"}</strong>
                      </div>
                    </div>
                  </section>

                  <section className="groups-workspace-grid">
                    <div className="groups-panel">
                      <div className="groups-section-heading">
                        <div>
                          <span className="groups-eyebrow">SHARED COLLECTION</span>
                          <h3>Reading list</h3>
                        </div>
                        <span className="groups-count">
                          {readingList.length} books
                        </span>
                      </div>

                      {canCreate && (
                        <form
                          className="groups-inline-form"
                          onSubmit={handleAddBook}
                        >
                          <select
                            value={bookId}
                            onChange={(event) => setBookId(event.target.value)}
                            required
                          >
                            <option value="">Choose a catalogue book</option>
                            {books.map((book) => (
                              <option key={book.id} value={book.id}>
                                {book.title} — {book.author}
                              </option>
                            ))}
                          </select>

                          <button className="groups-primary-button" type="submit">
                            Add book
                          </button>
                        </form>
                      )}

                      {readingList.length === 0 ? (
                        <div className="groups-empty compact">
                          <span>▤</span>
                          <p>No books in this reading list yet.</p>
                        </div>
                      ) : (
                        <div className="reading-list">
                          {readingList.map((item) => {
                            const book = getBook(item.book_id);

                            return (
                              <article className="reading-item" key={item.id}>
                                <div className="reading-book-icon">
                                  {book?.title?.[0] || "B"}
                                </div>

                                <div className="reading-book-info">
                                  <strong>
                                    {book?.title || `Book #${item.book_id}`}
                                  </strong>
                                  <span>{book?.author || "Catalogue book"}</span>
                                  <small>
                                    Assigned to: {getMemberName(item.assigned_to)}
                                  </small>
                                </div>

                                <div className="reading-item-actions">
                                  {canEdit ? (
                                    <select
                                      value={item.status}
                                      onChange={(event) =>
                                        handleStatusChange(
                                          item,
                                          event.target.value as ReadingListItem["status"]
                                        )
                                      }
                                      aria-label="Reading status"
                                    >
                                      <option value="planned">Planned</option>
                                      <option value="reading">Reading</option>
                                      <option value="completed">Completed</option>
                                    </select>
                                  ) : (
                                    <span
                                      className={`reading-status status-${item.status}`}
                                    >
                                      {item.status}
                                    </span>
                                  )}

                                  {canAssign && (
                                    <select
                                      value={item.assigned_to ?? ""}
                                      onChange={(event) =>
                                        handleAssign(item, event.target.value)
                                      }
                                      aria-label="Assign to member"
                                    >
                                      <option value="">Unassigned</option>

                                      {selectedGroup && (
                                        <option value={selectedGroup.owner_id}>
                                          Group owner
                                        </option>
                                      )}

                                      {members.map((member) => (
                                        <option
                                          key={member.user_id}
                                          value={member.user_id}
                                        >
                                          {member.user_id === user.id
                                            ? "You"
                                            : `Member #${member.user_id}`}
                                        </option>
                                      ))}
                                    </select>
                                  )}

                                  {canDelete && (
                                    <button
                                      type="button"
                                      className="groups-delete-button"
                                      onClick={() => handleDeleteItem(item.id)}
                                    >
                                      Remove
                                    </button>
                                  )}
                                </div>
                              </article>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="groups-panel members-panel">
                      <div className="groups-section-heading">
                        <div>
                          <span className="groups-eyebrow">YOUR CIRCLE</span>
                          <h3>Members & access</h3>
                        </div>
                        <span className="groups-count">{members.length + 1}</span>
                      </div>

                      <div className="owner-member">
                        <div className="member-avatar">O</div>
                        <div>
                          <strong>Group owner</strong>
                          <span>
                            {isOwner ? "You · Full access" : "Full access"}
                          </span>
                        </div>
                        <span className="owner-pill">OWNER</span>
                      </div>

                      {members.map((member) => (
                        <div className="member-card" key={member.user_id}>
                          <div className="member-card-heading">
                            <div className="member-avatar">
                              {String(member.user_id).slice(-2)}
                            </div>

                            <div>
                              <strong>
                                {member.user_id === user.id
                                  ? "You"
                                  : `Member #${member.user_id}`}
                              </strong>
                              <span>
                                Joined{" "}
                                {new Date(member.joined_at).toLocaleDateString()}
                              </span>
                            </div>

                            {isOwner && (
                              <button
                                type="button"
                                className="groups-delete-button"
                                onClick={() => handleRemoveMember(member.user_id)}
                              >
                                Remove
                              </button>
                            )}
                          </div>

                          {isOwner && (
                            <div className="permission-list">
                              {([
                                ["can_create", "Add books"],
                                ["can_edit", "Edit reading status"],
                                ["can_assign", "Assign books"],
                                ["can_delete", "Remove books"],
                              ] as const).map(([key, label]) => (
                                <label className="permission-row" key={key}>
                                  <span>{label}</span>
                                  <input
                                    type="checkbox"
                                    checked={
                                      permissionDrafts[member.user_id]?.[key] ??
                                      false
                                    }
                                    onChange={(event) =>
                                      handlePermissionChange(
                                        member.user_id,
                                        key,
                                        event.target.checked
                                      )
                                    }
                                  />
                                </label>
                              ))}

                              <button
                                type="button"
                                className="groups-save-button"
                                onClick={() =>
                                  handleSavePermissions(member.user_id)
                                }
                              >
                                Save permissions
                              </button>
                            </div>
                          )}

                          {!isOwner && (
                            <div className="member-permission-summary">
                              {member.can_create && <span>Add books</span>}
                              {member.can_edit && <span>Edit</span>}
                              {member.can_assign && <span>Assign</span>}
                              {member.can_delete && <span>Remove</span>}

                              {!member.can_create &&
                                !member.can_edit &&
                                !member.can_assign &&
                                !member.can_delete && <span>View only</span>}
                            </div>
                          )}
                        </div>
                      ))}

                      {isOwner && (
                        <form
                          className="groups-add-member-form"
                          onSubmit={handleAddMember}
                        >
                          <label htmlFor="group-member-id">
                            Add member by user ID
                          </label>

                          <div>
                            <input
                              id="group-member-id"
                              type="number"
                              min="1"
                              value={memberId}
                              onChange={(event) =>
                                setMemberId(event.target.value)
                              }
                              placeholder="Enter user ID"
                              required
                            />

                            <button
                              className="groups-primary-button"
                              type="submit"
                            >
                              Add
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  </section>
                </>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}

export default GroupsPage;
