
import { useEffect, useState } from "react";
import type { User } from "../types/auth";
import {
  activateUser,
  banUser,
  bulkUserAction,
  deactivateUser,
  getUserDetails,
  getUsers,
  revokeUserSessions,
  unbanUser,
  updateUserRole,
  type AdminManagedUser,
  type UserDetails,
} from "../services/userService";
import "./UserManagementPage.css";
import "./UserDetailsModal.css";

interface UserManagementPageProps {
  user: User;
  onNavigate: (
    page: "dashboard" | "books" | "loans" | "users" | "profile" | "groups"
  ) => void;
  onLogout: () => void;
}

const formatDate = (value: string | null) => {
  if (!value) return "Not available";

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not available"
    : date.toLocaleString();
};

const UserManagementPage = ({
  user,
  onNavigate,
  onLogout,
}: UserManagementPageProps) => {
  const [users, setUsers] = useState<AdminManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);

  const [banTarget, setBanTarget] = useState<number | null>(null);
  const [banReason, setBanReason] = useState("");

  const [bulkBanOpen, setBulkBanOpen] = useState(false);
  const [bulkBanReason, setBulkBanReason] = useState("");

  const [selectedUser, setSelectedUser] = useState<UserDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");
  const [revokingSessions, setRevokingSessions] = useState(false);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const usersData = await getUsers();
      setUsers(usersData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load users."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const updateUserInList = (updatedUser: AdminManagedUser) => {
    setUsers((previous) =>
      previous.map((item) =>
        item.id === updatedUser.id ? updatedUser : item
      )
    );

    setSelectedUser((previous) =>
      previous?.id === updatedUser.id
        ? { ...previous, ...updatedUser }
        : previous
    );
  };

  const handleViewDetails = async (userId: number) => {
    try {
      setSelectedUser(null);
      setDetailsLoading(true);
      setDetailsError("");

      const details = await getUserDetails(userId);
      setSelectedUser(details);
    } catch (err) {
      setDetailsError(
        err instanceof Error
          ? err.message
          : "Failed to load user details."
      );
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleCloseDetails = () => {
    setSelectedUser(null);
    setDetailsError("");
    setDetailsLoading(false);
  };

  const handleRoleChange = async (
    userId: number,
    role: "student" | "librarian" | "admin"
  ) => {
    try {
      setUpdatingId(userId);
      setError("");
      setSuccess("");

      const updatedUser = await updateUserRole(userId, role);
      updateUserInList(updatedUser);

      setSuccess("User role updated successfully.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update role."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handleActivation = async (
    userId: number,
    activate: boolean
  ) => {
    const action = activate ? "activate" : "deactivate";

    if (
      !window.confirm(
        `Are you sure you want to ${action} this account?`
      )
    ) {
      return;
    }

    try {
      setUpdatingId(userId);
      setError("");
      setSuccess("");

      const updatedUser = activate
        ? await activateUser(userId)
        : await deactivateUser(userId);

      updateUserInList(updatedUser);

      setSuccess(
        activate
          ? "User account activated successfully."
          : "User account deactivated successfully."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Failed to ${action} user.`
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handleBan = async () => {
    if (banTarget === null || !banReason.trim()) {
      setError("A reason is required to ban a user.");
      return;
    }

    try {
      setUpdatingId(banTarget);
      setError("");
      setSuccess("");

      const updatedUser = await banUser(banTarget, banReason.trim());
      updateUserInList(updatedUser);

      setBanTarget(null);
      setBanReason("");
      setSuccess("User banned successfully.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to ban user."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handleUnban = async (userId: number) => {
    if (!window.confirm("Are you sure you want to unban this user?")) {
      return;
    }

    try {
      setUpdatingId(userId);
      setError("");
      setSuccess("");

      const updatedUser = await unbanUser(userId);
      updateUserInList(updatedUser);

      setSuccess("User unbanned successfully.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to unban user."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handleBulkAction = async (
    action: "ban" | "unban",
    reason?: string
  ) => {
    if (selectedIds.length === 0) {
      setError("Select at least one user.");
      return;
    }

    if (action === "ban" && !reason?.trim()) {
      setError("A reason is required for bulk ban.");
      return;
    }

    const confirmation = window.confirm(
      `Are you sure you want to ${action} ${selectedIds.length} selected user(s)?`
    );

    if (!confirmation) return;

    try {
      setBulkLoading(true);
      setError("");
      setSuccess("");

      await bulkUserAction({
        user_ids: selectedIds,
        action,
        ...(action === "ban" ? { reason: reason?.trim() } : {}),
      });

      setSelectedIds([]);
      setBulkBanOpen(false);
      setBulkBanReason("");

      await loadUsers();

      setSuccess(
        action === "ban"
          ? "Selected users banned successfully."
          : "Selected users unbanned successfully."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Bulk ${action} operation failed.`
      );
    } finally {
      setBulkLoading(false);
    }
  };

  const handleRevokeSessions = async () => {
    if (!selectedUser) return;

    if (
      !window.confirm(
        "Revoke all active sessions for this user? They will need to log in again."
      )
    ) {
      return;
    }

    try {
      setRevokingSessions(true);
      setError("");
      setDetailsError("");

      await revokeUserSessions(selectedUser.id);

      const refreshedDetails = await getUserDetails(selectedUser.id);
      setSelectedUser(refreshedDetails);

      setSuccess("User sessions revoked successfully.");
    } catch (err) {
      setDetailsError(
        err instanceof Error
          ? err.message
          : "Failed to revoke user sessions."
      );
    } finally {
      setRevokingSessions(false);
    }
  };

  if (user.role !== "admin") {
    return (
      <div className="um-access-denied">
        <h2>Access Denied</h2>
        <p>Only administrators can access user management.</p>
        <button onClick={() => onNavigate("books")}>
          Back to Books
        </button>
      </div>
    );
  }

  const filteredUsers = users.filter((item) => {
    const matchesSearch = `${item.first_name} ${item.last_name} ${item.email}`
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesRole =
      roleFilter === "all" || item.role === roleFilter;

    const status = item.is_banned
      ? "banned"
      : item.is_active
        ? "active"
        : "deactivated";

    const matchesStatus =
      statusFilter === "all" || status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const selectableUsers = filteredUsers.filter(
    (item) => item.id !== user.id && item.role !== "admin"
  );

  const allVisibleSelected =
    selectableUsers.length > 0 &&
    selectableUsers.every((item) => selectedIds.includes(item.id));

  const toggleUserSelection = (userId: number) => {
    setSelectedIds((previous) =>
      previous.includes(userId)
        ? previous.filter((id) => id !== userId)
        : [...previous, userId]
    );
  };

  const toggleAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedIds((previous) =>
        previous.filter(
          (id) => !selectableUsers.some((item) => item.id === id)
        )
      );
    } else {
      setSelectedIds((previous) => [
        ...new Set([
          ...previous,
          ...selectableUsers.map((item) => item.id),
        ]),
      ]);
    }
  };

  const getStatus = (item: AdminManagedUser) => {
    if (item.is_banned) return "Banned";
    if (!item.is_active) return "Deactivated";
    return "Active";
  };

  const getStatusClass = (item: AdminManagedUser) => {
    if (item.is_banned) return "inactive";
    if (!item.is_active) return "inactive";
    return "active";
  };

  return (
    <div className="um-dashboard">
      <aside className="um-sidebar">
        <div className="um-brand">
          <div className="um-brand-icon">L</div>
          <div>
            <h2>LibraryNest</h2>
            <span>Library Management</span>
          </div>
        </div>

        <div className="um-nav-label">MENU</div>

        <nav className="um-nav">
          <button type="button" onClick={() => onNavigate("dashboard")}>
            <span>▦</span> Overview
          </button>

          <button
            className="active"
            type="button"
            onClick={() => onNavigate("users")}
          >
            <span>♙</span> User Management
          </button>

          <button type="button" onClick={() => onNavigate("books")}>
            <span>▤</span> Books
          </button>

          <button type="button" onClick={() => onNavigate("loans")}>
            <span>▣</span> Loan Requests
          </button>

          <button type="button" onClick={() => onNavigate("groups")}>
            <span>♧</span> Reading Groups
          </button>

          <button type="button" onClick={() => onNavigate("profile")}>
            <span>◉</span> My Profile
          </button>
        </nav>

        <div className="um-sidebar-bottom">
          <div className="um-profile">
            <div className="um-avatar">
              {(user.first_name?.[0] || user.email[0]).toUpperCase()}
            </div>

            <div className="um-profile-info">
              <strong>{user.first_name} {user.last_name}</strong>
              <span>{user.role}</span>
            </div>
          </div>

          <button
            className="um-logout"
            type="button"
            onClick={onLogout}
          >
            ↪ Logout
          </button>
        </div>
      </aside>

      <main className="um-main">
        <header className="um-header">
          <div>
            <span className="um-eyebrow">ADMINISTRATION</span>
            <h1>User Management</h1>
            <p>Manage your library members, roles and account access.</p>
          </div>

          <button
            className="um-refresh"
            type="button"
            onClick={loadUsers}
            disabled={loading}
          >
            ↻ Refresh
          </button>
        </header>

        <section className="um-users-section">
          <div className="um-section-header">
            <div>
              <h2>All Users</h2>
              <p>View and manage registered accounts.</p>
            </div>

            <span className="um-count">
              {filteredUsers.length} users
            </span>
          </div>

          {error && <div className="um-alert error">{error}</div>}
          {success && <div className="um-alert success">{success}</div>}

          <div className="um-toolbar">
            <div className="um-search">
              <span>⌕</span>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <select
              className="um-filter"
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
            >
              <option value="all">All Roles</option>
              <option value="student">Students</option>
              <option value="librarian">Librarians</option>
              <option value="admin">Admins</option>
            </select>

            <select
              className="um-filter"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="deactivated">Deactivated</option>
              <option value="banned">Banned</option>
            </select>
          </div>

          {selectedIds.length > 0 && (
            <div className="um-alert success">
              <strong>{selectedIds.length} user(s) selected.</strong>

              <button
                type="button"
                onClick={() => setBulkBanOpen(true)}
                disabled={bulkLoading}
              >
                Bulk Ban
              </button>

              <button
                type="button"
                onClick={() => void handleBulkAction("unban")}
                disabled={bulkLoading}
              >
                Bulk Unban
              </button>

              <button
                type="button"
                onClick={() => setSelectedIds([])}
                disabled={bulkLoading}
              >
                Clear Selection
              </button>
            </div>
          )}

          {loading ? (
            <div className="um-loading">Loading users...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="um-empty">No users found.</div>
          ) : (
            <div className="um-table-wrapper">
              <table className="um-table">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        onChange={toggleAllVisible}
                        aria-label="Select all eligible visible users"
                      />
                    </th>
                    <th>USER</th>
                    <th>EMAIL</th>
                    <th>ROLE</th>
                    <th>STATUS</th>
                    <th>JOINED</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredUsers.map((item) => {
                    const isCurrentUser = item.id === user.id;
                    const isAdmin = item.role === "admin";
                    const isUpdating = updatingId === item.id;

                    return (
                      <tr key={item.id}>
                        <td>
                          {!isCurrentUser && !isAdmin ? (
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(item.id)}
                              onChange={() => toggleUserSelection(item.id)}
                              aria-label={`Select ${item.email}`}
                            />
                          ) : (
                            <span>—</span>
                          )}
                        </td>

                        <td>
                          <div className="um-user-cell">
                            <div className="um-user-avatar">
                              {(item.first_name?.[0] || item.email[0]).toUpperCase()}
                            </div>

                            <div>
                              <strong>
                                {item.first_name || item.last_name
                                  ? `${item.first_name} ${item.last_name}`.trim()
                                  : "Unnamed User"}
                                {isCurrentUser && " (You)"}
                              </strong>
                              <span>ID: #{item.id}</span>
                            </div>
                          </div>
                        </td>

                        <td className="um-email">{item.email}</td>

                        <td>
                          {isCurrentUser ? (
                            <span className="um-role-text">{item.role}</span>
                          ) : (
                            <select
                              className="um-role-select"
                              value={item.role}
                              disabled={
                                !item.is_active ||
                                item.is_banned ||
                                isUpdating ||
                                isAdmin
                              }
                              onChange={(event) =>
                                void handleRoleChange(
                                  item.id,
                                  event.target.value as
                                    | "student"
                                    | "librarian"
                                    | "admin"
                                )
                              }
                            >
                              <option value="student">Student</option>
                              <option value="librarian">Librarian</option>
                              <option value="admin">Admin</option>
                            </select>
                          )}
                        </td>

                        <td>
                          <span
                            className={`um-status ${getStatusClass(item)}`}
                          >
                            <span className="um-status-dot" />
                            {getStatus(item)}
                          </span>
                        </td>

                        <td className="um-date">
                          {new Date(item.created_at).toLocaleDateString()}
                        </td>

                        <td>
                          <div className="um-action-buttons">
                            <button
                              className="um-view-details"
                              type="button"
                              onClick={() => void handleViewDetails(item.id)}
                              disabled={detailsLoading}
                            >
                              View Details
                            </button>

                            {!isCurrentUser && !isAdmin && (
                              <>
                                {item.is_banned ? (
                                  <button
                                    className="um-view-details"
                                    type="button"
                                    disabled={isUpdating}
                                    onClick={() => void handleUnban(item.id)}
                                  >
                                    {isUpdating ? "Updating..." : "Unban"}
                                  </button>
                                ) : (
                                  <button
                                    className="um-deactivate"
                                    type="button"
                                    disabled={isUpdating}
                                    onClick={() => setBanTarget(item.id)}
                                  >
                                    Ban
                                  </button>
                                )}

                                {!item.is_banned && item.is_active ? (
                                  <button
                                    className="um-deactivate"
                                    type="button"
                                    disabled={isUpdating}
                                    onClick={() =>
                                      void handleActivation(item.id, false)
                                    }
                                  >
                                    Deactivate
                                  </button>
                                ) : !item.is_banned && !item.is_active ? (
                                  <button
                                    className="um-view-details"
                                    type="button"
                                    disabled={isUpdating}
                                    onClick={() =>
                                      void handleActivation(item.id, true)
                                    }
                                  >
                                    Activate
                                  </button>
                                ) : null}
                              </>
                            )}

                            {isCurrentUser && (
                              <span className="um-current">
                                Current account
                              </span>
                            )}

                            {isAdmin && !isCurrentUser && (
                              <span className="um-current">
                                Protected admin
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <footer className="um-footer">
          LibraryNest Admin Panel
        </footer>
      </main>

      {banTarget !== null && (
        <div
          className="udm-overlay"
          onClick={() => {
            setBanTarget(null);
            setBanReason("");
          }}
        >
          <section
            className="udm-modal"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="udm-header">
              <div>
                <span className="udm-eyebrow">ACCOUNT RESTRICTION</span>
                <h2>Ban User</h2>
              </div>

              <button
                className="udm-close"
                type="button"
                onClick={() => {
                  setBanTarget(null);
                  setBanReason("");
                }}
              >
                ×
              </button>
            </div>

            <div className="udm-content">
              <p>
                Provide a reason for banning this account. The user will
                lose access to protected features.
              </p>

              <textarea
                value={banReason}
                onChange={(event) => setBanReason(event.target.value)}
                placeholder="Enter the reason for this ban..."
                rows={4}
                maxLength={1000}
                required
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid #ddd",
                  resize: "vertical",
                }}
              />

              <p>{banReason.length}/1000 characters</p>

              <button
                className="um-deactivate"
                type="button"
                disabled={!banReason.trim() || updatingId !== null}
                onClick={() => void handleBan()}
              >
                {updatingId !== null ? "Processing..." : "Confirm Ban"}
              </button>
            </div>
          </section>
        </div>
      )}

      {bulkBanOpen && (
        <div
          className="udm-overlay"
          onClick={() => {
            setBulkBanOpen(false);
            setBulkBanReason("");
          }}
        >
          <section
            className="udm-modal"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="udm-header">
              <div>
                <span className="udm-eyebrow">BULK ACTION</span>
                <h2>Ban Selected Users</h2>
              </div>

              <button
                className="udm-close"
                type="button"
                onClick={() => setBulkBanOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="udm-content">
              <p>
                You are about to ban {selectedIds.length} selected user(s).
                A reason is required.
              </p>

              <textarea
                value={bulkBanReason}
                onChange={(event) => setBulkBanReason(event.target.value)}
                placeholder="Enter the reason for this bulk ban..."
                rows={4}
                maxLength={1000}
                required
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid #ddd",
                  resize: "vertical",
                }}
              />

              <button
                className="um-deactivate"
                type="button"
                disabled={!bulkBanReason.trim() || bulkLoading}
                onClick={() =>
                  void handleBulkAction("ban", bulkBanReason)
                }
              >
                {bulkLoading ? "Processing..." : "Confirm Bulk Ban"}
              </button>
            </div>
          </section>
        </div>
      )}

      {(detailsLoading || detailsError || selectedUser) && (
        <div className="udm-overlay" onClick={handleCloseDetails}>
          <section
            className="udm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="udm-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="udm-header">
              <div>
                <span className="udm-eyebrow">USER INFORMATION</span>
                <h2 id="udm-title">User Details</h2>
              </div>

              <button
                className="udm-close"
                type="button"
                onClick={handleCloseDetails}
                aria-label="Close user details"
              >
                ×
              </button>
            </div>

            {detailsLoading ? (
              <div className="udm-message">Loading user details...</div>
            ) : detailsError ? (
              <div className="udm-error">{detailsError}</div>
            ) : selectedUser ? (
              <div className="udm-content">
                <section className="udm-profile-card">
                  <div className="udm-avatar">
                    {(selectedUser.first_name?.[0] ||
                      selectedUser.email[0]).toUpperCase()}
                  </div>

                  <div className="udm-profile-text">
                    <h3>
                      {`${selectedUser.first_name} ${selectedUser.last_name}`.trim() ||
                        "Unnamed User"}
                    </h3>
                    <p>{selectedUser.email}</p>

                    <div className="udm-badges">
                      <span className="udm-role-badge">
                        {selectedUser.role}
                      </span>
                      <span
                        className={`udm-status-badge ${
                          selectedUser.is_banned
                            ? "inactive"
                            : selectedUser.is_active
                              ? "active"
                              : "inactive"
                        }`}
                      >
                        {getStatus(selectedUser)}
                      </span>
                    </div>
                  </div>
                </section>

                <section className="udm-section">
                  <h3>Account Information</h3>

                  <div className="udm-info-grid">
                    <div className="udm-info-item">
                      <span>User ID</span>
                      <strong>#{selectedUser.id}</strong>
                    </div>

                    <div className="udm-info-item">
                      <span>Role</span>
                      <strong>{selectedUser.role}</strong>
                    </div>

                    <div className="udm-info-item">
                      <span>Account Status</span>
                      <strong>{getStatus(selectedUser)}</strong>
                    </div>

                    <div className="udm-info-item">
                      <span>Joined Date</span>
                      <strong>{formatDate(selectedUser.created_at)}</strong>
                    </div>

                    {selectedUser.is_banned && (
                      <div className="udm-info-item">
                        <span>Ban Reason</span>
                        <strong>
                          {selectedUser.ban_reason || "No reason provided"}
                        </strong>
                      </div>
                    )}
                  </div>
                </section>

                <section className="udm-section">
                  <div className="udm-section-title">
                    <h3>Loan History</h3>
                    <span className="udm-count">
                      {selectedUser.loans.length}
                    </span>
                  </div>

                  {selectedUser.loans.length === 0 ? (
                    <p className="udm-empty">
                      No loan records found for this user.
                    </p>
                  ) : (
                    <div className="udm-record-list">
                      {selectedUser.loans.map((loan) => (
                        <article className="udm-record" key={loan.id}>
                          <div className="udm-record-heading">
                            <h4>{loan.book_title}</h4>
                            <span className="udm-record-status">
                              {loan.status}
                            </span>
                          </div>

                          <div className="udm-record-details">
                            <p>
                              <span>Author</span>
                              <strong>{loan.book_author}</strong>
                            </p>
                            <p>
                              <span>ISBN</span>
                              <strong>{loan.book_isbn || "Not available"}</strong>
                            </p>
                            <p>
                              <span>Requested</span>
                              <strong>{formatDate(loan.requested_at)}</strong>
                            </p>
                            <p>
                              <span>Returned</span>
                              <strong>{formatDate(loan.returned_at)}</strong>
                            </p>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>

                <section className="udm-section">
                  <div className="udm-section-title">
                    <h3>Reading Groups</h3>
                    <span className="udm-count">
                      {selectedUser.groups.length}
                    </span>
                  </div>

                  {selectedUser.groups.length === 0 ? (
                    <p className="udm-empty">
                      This user has not joined or created any reading groups.
                    </p>
                  ) : (
                    <div className="udm-record-list">
                      {selectedUser.groups.map((group) => (
                        <article className="udm-record" key={group.id}>
                          <div className="udm-record-heading">
                            <h4>{group.name}</h4>
                            <span className="udm-role-badge">
                              {group.membership_role}
                            </span>
                          </div>

                          <div className="udm-record-details">
                            <p>
                              <span>Description</span>
                              <strong>
                                {group.description || "No description"}
                              </strong>
                            </p>
                            <p>
                              <span>Created</span>
                              <strong>{formatDate(group.created_at)}</strong>
                            </p>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>

                <section className="udm-section">
                  <div className="udm-section-title">
                    <h3>Active Sessions</h3>
                    <span className="udm-count">
                      {selectedUser.active_sessions.length}
                    </span>
                  </div>

                  {selectedUser.active_sessions.length === 0 ? (
                    <p className="udm-empty">
                      No active sessions found.
                    </p>
                  ) : (
                    <div className="udm-record-list">
                      {selectedUser.active_sessions.map((session) => (
                        <article className="udm-record" key={session.id}>
                          <div className="udm-record-heading">
                            <h4>Session #{session.id}</h4>
                            <span className="udm-record-status active">
                              Active
                            </span>
                          </div>

                          <div className="udm-record-details">
                            <p>
                              <span>Created</span>
                              <strong>{formatDate(session.created_at)}</strong>
                            </p>
                            <p>
                              <span>Last Used</span>
                              <strong>{formatDate(session.last_used_at)}</strong>
                            </p>
                            <p>
                              <span>Expires</span>
                              <strong>{formatDate(session.expires_at)}</strong>
                            </p>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}

                  {selectedUser.id !== user.id &&
                    selectedUser.role !== "admin" && (
                      <button
                        className="um-deactivate"
                        type="button"
                        disabled={revokingSessions}
                        onClick={() => void handleRevokeSessions()}
                      >
                        {revokingSessions
                          ? "Revoking..."
                          : "Revoke All Sessions"}
                      </button>
                    )}
                </section>
              </div>
            ) : null}
          </section>
        </div>
      )}
    </div>
  );
};

export default UserManagementPage;
