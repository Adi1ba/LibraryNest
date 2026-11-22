
import { useEffect, useState } from "react";
import type { User } from "../types/auth";
import {
  deactivateUser,
  getUsers,
  updateUserRole,
} from "../services/userService";
import "./UserManagementPage.css";

interface UserManagementPageProps {
  user: User;
  onNavigate: (page: "books" | "loans" | "users" | "profile") => void;
  onLogout: () => void;
}

const UserManagementPage = ({
  user,
  onNavigate,
  onLogout,
}: UserManagementPageProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleChange = async (
    userId: number,
    role: "student" | "librarian" | "admin"
  ) => {
    try {
      setUpdatingId(userId);
      setError("");
      setSuccess("");

      const updatedUser = await updateUserRole(userId, role);

      setUsers((previous) =>
        previous.map((item) => item.id === userId ? updatedUser : item)
      );
      setSuccess("User role updated successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeactivate = async (userId: number) => {
    if (!window.confirm("Are you sure you want to deactivate this account?")) {
      return;
    }

    try {
      setUpdatingId(userId);
      setError("");
      setSuccess("");

      const updatedUser = await deactivateUser(userId);

      setUsers((previous) =>
        previous.map((item) => item.id === userId ? updatedUser : item)
      );
      setSuccess("User account deactivated successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to deactivate user.");
    } finally {
      setUpdatingId(null);
    }
  };

  if (user.role !== "admin") {
    return (
      <div className="um-access-denied">
        <h2>Access Denied</h2>
        <p>Only administrators can access user management.</p>
        <button onClick={() => onNavigate("books")}>Back to Books</button>
      </div>
    );
  }

  const filteredUsers = users.filter((item) => {
    const matchesSearch =
      `${item.first_name} ${item.last_name} ${item.email}`
        .toLowerCase()
        .includes(search.toLowerCase());

    const matchesRole = roleFilter === "all" || item.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const activeUsers = users.filter((item) => item.is_active !== false).length;
  const adminCount = users.filter((item) => item.role === "admin").length;
  const librarianCount = users.filter((item) => item.role === "librarian").length;

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
          <button onClick={() => onNavigate("books")}>
            <span>▤</span> Books
          </button>
          <button onClick={() => onNavigate("loans")}>
            <span>▣</span> Loan Requests
          </button>
          <button className="active" onClick={() => onNavigate("users")}>
            <span>♙</span> User Management
          </button>
          <button onClick={() => onNavigate("profile")}>
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
          <button className="um-logout" onClick={onLogout}>
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
          <button className="um-refresh" onClick={loadUsers} disabled={loading}>
            ↻ Refresh
          </button>
        </header>

        <section className="um-stats">
          <div className="um-stat-card">
            <div className="um-stat-icon purple">♙</div>
            <div>
              <span>Total Users</span>
              <strong>{users.length}</strong>
            </div>
          </div>

          <div className="um-stat-card">
            <div className="um-stat-icon green">✓</div>
            <div>
              <span>Active Users</span>
              <strong>{activeUsers}</strong>
            </div>
          </div>

          <div className="um-stat-card">
            <div className="um-stat-icon orange">♛</div>
            <div>
              <span>Administrators</span>
              <strong>{adminCount}</strong>
            </div>
          </div>

          <div className="um-stat-card">
            <div className="um-stat-icon blue">▣</div>
            <div>
              <span>Librarians</span>
              <strong>{librarianCount}</strong>
            </div>
          </div>
        </section>

        <section className="um-users-section">
          <div className="um-section-header">
            <div>
              <h2>All Users</h2>
              <p>View and manage registered accounts.</p>
            </div>
            <span className="um-count">{filteredUsers.length} users</span>
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
          </div>

          {loading ? (
            <div className="um-loading">Loading users...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="um-empty">No users found.</div>
          ) : (
            <div className="um-table-wrapper">
              <table className="um-table">
                <thead>
                  <tr>
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
                    const isActive = item.is_active !== false;

                    return (
                      <tr key={item.id}>
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
                              disabled={!isActive || updatingId === item.id}
                              onChange={(event) =>
                                handleRoleChange(
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
                          <span className={`um-status ${isActive ? "active" : "inactive"}`}>
                            <span className="um-status-dot"></span>
                            {isActive ? "Active" : "Inactive"}
                          </span>
                        </td>

                        <td className="um-date">
                          {new Date(item.created_at).toLocaleDateString()}
                        </td>

                        <td>
                          {isCurrentUser ? (
                            <span className="um-current">Current account</span>
                          ) : isActive ? (
                            <button
                              className="um-deactivate"
                              disabled={updatingId === item.id}
                              onClick={() => handleDeactivate(item.id)}
                            >
                              {updatingId === item.id ? "Updating..." : "Deactivate"}
                            </button>
                          ) : (
                            <span className="um-current">Deactivated</span>
                          )}
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
    </div>
  );
};

export default UserManagementPage;
