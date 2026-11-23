
import { useEffect, useState } from "react";
import {
  getDashboardStats,
  type DashboardStats,
} from "../services/userService";
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

  useEffect(() => {
    loadStats();
  }, []);

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
            onClick={loadStats}
            disabled={loading}
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

        <footer className="admin-footer">
          LibraryNest Admin Panel
        </footer>
      </main>
    </div>
  );
};

export default AdminDashboardPage;
