
import { useCallback, useEffect, useState } from "react";
import {
  getDashboardStats,
  type DashboardStats,
} from "../services/userService";
import {
  getAuditLogs,
  type AuditLog,
  type AuditLogResponse,
} from "../services/auditService";
import type { User } from "../types/auth";
import "./AdminDashboardPage.css";

interface AdminDashboardPageProps {
  user: User;
  onNavigate: (
    page: "dashboard" | "books" | "loans" | "users" | "profile" | "groups"
  ) => void;
  onLogout: () => void;
}

const AdminDashboardPage = ({
  user,
  onNavigate,
  onLogout,
}: AdminDashboardPageProps) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [auditData, setAuditData] = useState<AuditLogResponse | null>(null);
  const [auditLoading, setAuditLoading] = useState(true);
  const [auditError, setAuditError] = useState("");

  const [searchText, setSearchText] = useState("");
  const [eventType, setEventType] = useState("");
  const [outcome, setOutcome] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [appliedFilters, setAppliedFilters] = useState({
    q: "",
    event_type: "",
    outcome: "",
    start_date: "",
    end_date: "",
  });

  const [page, setPage] = useState(1);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getDashboardStats();
      setStats(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load dashboard statistics."
      );
    } finally {
      setLoading(false);
    }
  };

  const loadAuditLogs = useCallback(async () => {
    try {
      setAuditLoading(true);
      setAuditError("");

      const data = await getAuditLogs({
        q: appliedFilters.q || undefined,
        event_type: appliedFilters.event_type || undefined,
        outcome: appliedFilters.outcome
          ? (appliedFilters.outcome as "success" | "failure")
          : undefined,
        start_date: appliedFilters.start_date
          ? new Date(appliedFilters.start_date).toISOString()
          : undefined,
        end_date: appliedFilters.end_date
          ? new Date(appliedFilters.end_date).toISOString()
          : undefined,
        page,
        page_size: 10,
      });

      setAuditData(data);
    } catch (err) {
      setAuditError(
        err instanceof Error
          ? err.message
          : "Unable to load audit logs."
      );
    } finally {
      setAuditLoading(false);
    }
  }, [appliedFilters, page]);

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    loadAuditLogs();
  }, [loadAuditLogs]);

  const handleAuditFilter = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setPage(1);

    setAppliedFilters({
      q: searchText.trim(),
      event_type: eventType,
      outcome,
      start_date: startDate,
      end_date: endDate,
    });
  };

  const clearAuditFilters = () => {
    setSearchText("");
    setEventType("");
    setOutcome("");
    setStartDate("");
    setEndDate("");
    setPage(1);

    setAppliedFilters({
      q: "",
      event_type: "",
      outcome: "",
      start_date: "",
      end_date: "",
    });
  };

  const formatEvent = (event: string) =>
    event
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());

  const formatDate = (date: string) =>
    new Date(date).toLocaleString();

  const getUserLabel = (log: AuditLog) => {
    if (log.actor_email) {
      return log.actor_email;
    }

    return log.actor_user_id
      ? `User #${log.actor_user_id}`
      : "Unknown";
  };

  if (user.role !== "admin") {
    return (
      <div className="admin-access-denied">
        <h2>Access Denied</h2>
        <p>Only administrators can access the dashboard.</p>
        <button type="button" onClick={() => onNavigate("books")}>
          Back to Books
        </button>
      </div>
    );
  }

  const cards = [
    {
      title: "Total Users",
      value: stats?.total_users,
      icon: "♙",
      color: "pink",
      description: "Registered accounts",
    },
    {
      title: "Active Users",
      value: stats?.active_users,
      icon: "✓",
      color: "green",
      description: "Currently active",
    },
    {
      title: "Banned Users",
      value: stats?.banned_users,
      icon: "⊘",
      color: "orange",
      description: "Inactive accounts",
    },
    {
      title: "Total Books",
      value: stats?.total_books,
      icon: "▤",
      color: "blue",
      description: "Books in collection",
    },
    {
      title: "Reading Groups",
      value: stats?.total_groups,
      icon: "♧",
      color: "purple",
      description: "Created groups",
    },
    {
      title: "New Users",
      value: stats?.new_users_last_7_days,
      icon: "↗",
      color: "teal",
      description: "Joined in last 7 days",
    },
  ];

  return (
    <div className="admin-dashboard">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="admin-brand-icon">L</div>
          <div>
            <h2>LibraryNest</h2>
            <span>Library Management</span>
          </div>
        </div>

        <p className="admin-nav-label">ADMIN MENU</p>

        <nav className="admin-nav">
          <button
            className="admin-nav-item active"
            type="button"
            onClick={() => onNavigate("dashboard")}
          >
            <span>▦</span>
            Overview
          </button>

          <button
            className="admin-nav-item"
            type="button"
            onClick={() => onNavigate("users")}
          >
            <span>♙</span>
            User Management
          </button>

          <button
            className="admin-nav-item"
            type="button"
            onClick={() => onNavigate("books")}
          >
            <span>▤</span>
            Book Management
          </button>

          <button
            className="admin-nav-item"
            type="button"
            onClick={() => onNavigate("loans")}
          >
            <span>▣</span>
            Loan Management
          </button>

          <button
            className="admin-nav-item"
            type="button"
            onClick={() => onNavigate("groups")}
          >
            <span>♧</span>
            Reading Groups
          </button>

          <button
            className="admin-nav-item"
            type="button"
            onClick={() => onNavigate("profile")}
          >
            <span>◉</span>
            My Profile
          </button>
        </nav>

        <div className="admin-sidebar-bottom">
          <div className="admin-profile">
            <div className="admin-avatar">
              {(user.first_name?.[0] || user.email[0]).toUpperCase()}
            </div>

            <div className="admin-profile-info">
              <strong>{user.first_name} {user.last_name}</strong>
              <span>Administrator</span>
            </div>
          </div>

          <button
            className="admin-logout"
            type="button"
            onClick={onLogout}
          >
            ↪ Logout
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <span className="admin-eyebrow">ADMINISTRATION</span>
            <h1>Admin Overview</h1>
            <p>Monitor your library platform and manage its activities.</p>
          </div>

          <button
            className="admin-refresh"
            type="button"
            onClick={() => {
              loadStats();
              loadAuditLogs();
            }}
            disabled={loading || auditLoading}
          >
            ↻ Refresh
          </button>
        </header>

        <section className="admin-welcome">
          <div>
            <span>ADMINISTRATOR WORKSPACE</span>
            <h2>Welcome back, {user.first_name}!</h2>
            <p>
              Here is an overview of your LibraryNest platform.
            </p>
          </div>

          <div className="admin-welcome-icon">L</div>
        </section>

        <section className="admin-stats-section">
          <div className="admin-section-heading">
            <h2>Platform Overview</h2>
            <p>Live statistics from your database.</p>
          </div>

          {error && (
            <div className="admin-error">
              <span>{error}</span>
              <button type="button" onClick={loadStats}>
                Try Again
              </button>
            </div>
          )}

          {loading ? (
            <div className="admin-loading">
              Loading dashboard statistics...
            </div>
          ) : (
            <div className="admin-stats-grid">
              {cards.map((card) => (
                <div className="admin-stat-card" key={card.title}>
                  <div className={`admin-stat-icon ${card.color}`}>
                    {card.icon}
                  </div>

                  <div className="admin-stat-info">
                    <span>{card.title}</span>
                    <strong>
                      {stats ? card.value ?? "—" : "—"}
                    </strong>
                    <small>{card.description}</small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="admin-quick-section">
          <div className="admin-section-heading">
            <h2>Quick Actions</h2>
            <p>Navigate to important management sections.</p>
          </div>

          <div className="admin-quick-grid">
            <button
              type="button"
              onClick={() => onNavigate("users")}
            >
              <span>♙</span>
              <strong>Manage Users</strong>
              <small>View accounts and manage roles</small>
            </button>

            <button
              type="button"
              onClick={() => onNavigate("books")}
            >
              <span>▤</span>
              <strong>Manage Books</strong>
              <small>View and manage book records</small>
            </button>

            <button
              type="button"
              onClick={() => onNavigate("groups")}
            >
              <span>♧</span>
              <strong>Manage Groups</strong>
              <small>View reading groups</small>
            </button>

            <button
              type="button"
              onClick={() => onNavigate("loans")}
            >
              <span>▣</span>
              <strong>Manage Loans</strong>
              <small>Review loan requests</small>
            </button>
          </div>
        </section>

        {/* Activity and Audit Log */}
        <section className="admin-audit-section">
          <div className="admin-section-heading">
            <h2>Activity & Audit Log</h2>
            <p>
              Review user and administrative activities across LibraryNest.
            </p>
          </div>

          <form
            className="admin-audit-filters"
            onSubmit={handleAuditFilter}
          >
            <div className="admin-audit-filter-field">
              <label htmlFor="audit-search">
                Search User or Activity
              </label>
              <input
                id="audit-search"
                type="text"
                placeholder="Search by email, activity or IP..."
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
              />
            </div>

            <div className="admin-audit-filter-field">
              <label htmlFor="audit-event">Event Type</label>
              <select
                id="audit-event"
                value={eventType}
                onChange={(event) => setEventType(event.target.value)}
              >
                <option value="">All Events</option>
                <option value="login_success">Login Success</option>
                <option value="login_failed">Login Failed</option>
                <option value="logout">Logout</option>
                <option value="password_change">Password Change</option>
                <option value="role_change">Role Change</option>
                <option value="user_banned">User Banned</option>
                <option value="user_unbanned">User Unbanned</option>
                <option value="user_activated">User Activated</option>
                <option value="user_deactivated">User Deactivated</option>
                <option value="bulk_ban">Bulk Ban</option>
                <option value="bulk_unban">Bulk Unban</option>
                <option value="sessions_revoked">Sessions Revoked</option>
              </select>
            </div>

            <div className="admin-audit-filter-field">
              <label htmlFor="audit-outcome">Outcome</label>
              <select
                id="audit-outcome"
                value={outcome}
                onChange={(event) => setOutcome(event.target.value)}
              >
                <option value="">All Outcomes</option>
                <option value="success">Success</option>
                <option value="failure">Failure</option>
              </select>
            </div>

            <div className="admin-audit-filter-field">
              <label htmlFor="audit-start">From</label>
              <input
                id="audit-start"
                type="datetime-local"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </div>

            <div className="admin-audit-filter-field">
              <label htmlFor="audit-end">To</label>
              <input
                id="audit-end"
                type="datetime-local"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </div>

            <div className="admin-audit-filter-actions">
              <button
                type="submit"
                className="admin-audit-apply"
                disabled={auditLoading}
              >
                Search / Apply Filters
              </button>

              <button
                type="button"
                className="admin-audit-clear"
                onClick={clearAuditFilters}
              >
                Clear
              </button>
            </div>
          </form>

          {auditError && (
            <div className="admin-error">
              <span>{auditError}</span>
              <button type="button" onClick={loadAuditLogs}>
                Try Again
              </button>
            </div>
          )}

          {auditLoading ? (
            <div className="admin-loading">
              Loading activity logs...
            </div>
          ) : auditData && auditData.items.length > 0 ? (
            <>
              <div className="admin-audit-summary">
                <span>
                  Total records: <strong>{auditData.total}</strong>
                </span>
                <span>
                  Page {auditData.page} of {auditData.total_pages}
                </span>
              </div>

              <div className="admin-audit-table-wrapper">
                <table className="admin-audit-table">
                  <thead>
                    <tr>
                      <th>Event</th>
                      <th>Actor</th>
                      <th>Target User</th>
                      <th>Description</th>
                      <th>IP Address</th>
                      <th>Browser</th>
                      <th>Outcome</th>
                      <th>Date & Time</th>
                    </tr>
                  </thead>

                  <tbody>
                    {auditData.items.map((log) => (
                      <tr key={log.id}>
                        <td>
                          <span className="admin-audit-event">
                            {formatEvent(log.event_type)}
                          </span>
                        </td>

                        <td>{getUserLabel(log)}</td>

                        <td>
                          {log.target_email ||
                            (log.target_user_id
                              ? `User #${log.target_user_id}`
                              : "—")}
                        </td>

                        <td>{log.description}</td>

                        <td>{log.ip_address || "Unavailable"}</td>

                        <td
                          className="admin-audit-browser"
                          title={log.user_agent || "Unavailable"}
                        >
                          {log.user_agent || "Unavailable"}
                        </td>

                        <td>
                          <span
                            className={`admin-audit-outcome ${
                              log.outcome === "success"
                                ? "success"
                                : "failure"
                            }`}
                          >
                            {log.outcome}
                          </span>
                        </td>

                        <td>{formatDate(log.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="admin-audit-pagination">
                <button
                  type="button"
                  disabled={page <= 1 || auditLoading}
                  onClick={() => setPage((current) => current - 1)}
                >
                  Previous
                </button>

                <span>
                  Page {page} of {auditData.total_pages}
                </span>

                <button
                  type="button"
                  disabled={
                    page >= auditData.total_pages || auditLoading
                  }
                  onClick={() => setPage((current) => current + 1)}
                >
                  Next
                </button>
              </div>
            </>
          ) : (
            <div className="admin-loading">
              No activity logs found for the selected filters.
            </div>
          )}
        </section>

        <footer className="admin-footer">
          LibraryNest Admin Panel
        </footer>
      </main>
    </div>
  );
};

export default AdminDashboardPage;
