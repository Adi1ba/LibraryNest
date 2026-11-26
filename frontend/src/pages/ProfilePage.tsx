
import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import type {
  MySession,
  PasswordChangeData,
  ProfileUpdateData,
  User,
} from "../types/auth";

import {
  changePassword,
  getMySessions,
  logoutUser,
  revokeMySession,
  updateMyProfile,
} from "../services/authService";

import "./ProfilePage.css";

interface ProfilePageProps {
  user: User;
  onNavigate: (
    page: "dashboard" | "books" | "loans" | "users" | "profile" | "groups"
  ) => void;
  onProfileUpdated: (user: User) => void;
  onPasswordChanged: () => void;
}

function ProfilePage({
  user,
  onNavigate,
  onProfileUpdated,
  onPasswordChanged,
}: ProfilePageProps) {
  const [firstName, setFirstName] = useState(user.first_name);
  const [lastName, setLastName] = useState(user.last_name);
  const [email, setEmail] = useState(user.email);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  // Manage My Sessions states
  const [sessions, setSessions] = useState<MySession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionError, setSessionError] = useState("");
  const [sessionSuccess, setSessionSuccess] = useState("");
  const [revokingSessionId, setRevokingSessionId] = useState<number | null>(
    null
  );

  const fullName = `${user.first_name} ${user.last_name}`.trim();

  const initials = `${user.first_name?.[0] || ""}${
    user.last_name?.[0] || ""
  }`.toUpperCase();

  // Load current user's sessions
  const loadSessions = async () => {
    try {
      setSessionsLoading(true);
      setSessionError("");
      setSessionSuccess("");

      const data = await getMySessions();
      setSessions(data);
    } catch (err) {
      setSessionError(
        err instanceof Error ? err.message : "Unable to load your sessions."
      );
    } finally {
      setSessionsLoading(false);
    }
  };

  useEffect(() => {
    void loadSessions();
  }, []);

  // Revoke a selected session
  const handleRevokeSession = async (session: MySession) => {
    const confirmed = window.confirm(
      session.is_current
        ? "Are you sure you want to log out from this device?"
        : "Are you sure you want to revoke this session?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setSessionError("");
      setSessionSuccess("");
      setRevokingSessionId(session.id);

      await revokeMySession(session.id);

      if (session.is_current) {
        await logoutUser();
        onPasswordChanged();
        return;
      }

      setSessions((previous) =>
        previous.filter((item) => item.id !== session.id)
      );

      setSessionSuccess("Session revoked successfully.");
    } catch (err) {
      setSessionError(
        err instanceof Error ? err.message : "Unable to revoke this session."
      );
    } finally {
      setRevokingSessionId(null);
    }
  };

  const formatSessionDate = (date: string | null): string => {
    if (!date) {
      return "Not used yet";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Unavailable";
    }

    return parsedDate.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  // Update profile
  const handleProfileSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setProfileError("");
    setProfileSuccess("");

    const profileData: ProfileUpdateData = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim(),
    };

    if (
      !profileData.first_name ||
      !profileData.last_name ||
      !profileData.email
    ) {
      setProfileError("Please fill in all profile fields.");
      return;
    }

    try {
      setProfileLoading(true);

      const updatedUser = await updateMyProfile(profileData);

      onProfileUpdated(updatedUser);

      setFirstName(updatedUser.first_name);
      setLastName(updatedUser.last_name);
      setEmail(updatedUser.email);

      setProfileSuccess("Your profile has been updated successfully.");
    } catch (err) {
      setProfileError(
        err instanceof Error ? err.message : "Unable to update your profile."
      );
    } finally {
      setProfileLoading(false);
    }
  };

  // Change password
  const handlePasswordSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword.length < 8) {
      setPasswordError("New password must contain at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirmation do not match.");
      return;
    }

    const passwordData: PasswordChangeData = {
      current_password: currentPassword,
      new_password: newPassword,
    };

    try {
      setPasswordLoading(true);

      const result = await changePassword(passwordData);

      setPasswordSuccess(result.message);

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      await logoutUser();
      onPasswordChanged();
    } catch (err) {
      setPasswordError(
        err instanceof Error ? err.message : "Unable to change your password."
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    onPasswordChanged();
  };

  return (
    <div className="profile-dashboard">
      <aside className="profile-sidebar">
        <div className="profile-brand">
          <div className="profile-brand-icon">L</div>
          <div>
            <h2>LibraryNest</h2>
            <span>Library Management</span>
          </div>
        </div>

        <div className="profile-nav-label">WORKSPACE</div>

        <nav className="profile-nav">
          {user.role === "admin" && (
            <button
              type="button"
              onClick={() => onNavigate("dashboard")}
            >
              <span>▦</span>
              Overview
            </button>
          )}

          <button type="button" onClick={() => onNavigate("books")}>
            <span>▦</span>
            Book Management
          </button>

          <button type="button" onClick={() => onNavigate("loans")}>
            <span>▤</span>
            Loan Management
          </button>

          <button type="button" onClick={() => onNavigate("groups")}>
            <span>♧</span>
            Reading Groups
          </button>

          {user.role === "admin" && (
            <button type="button" onClick={() => onNavigate("users")}>
              <span>♙</span>
              User Management
            </button>
          )}

          <button className="active" type="button">
            <span>◎</span>
            My Profile
          </button>
        </nav>

        <div className="profile-sidebar-bottom">
          <div className="profile-sidebar-user">
            <div className="profile-avatar">{initials || "U"}</div>
            <div>
              <strong>{fullName || "Library User"}</strong>
              <span>{user.role}</span>
            </div>
          </div>

          <button
            className="profile-logout"
            type="button"
            onClick={handleLogout}
          >
            ↪ Logout
          </button>
        </div>
      </aside>

      <main className="profile-main">
        <header className="profile-header">
          <div>
            <span className="profile-eyebrow">ACCOUNT SETTINGS</span>
            <h1>My Profile</h1>
            <p>Manage your personal information and account security.</p>
          </div>
        </header>

        <section className="profile-overview">
          <div className="profile-overview-avatar">{initials || "U"}</div>

          <div className="profile-overview-info">
            <h2>{fullName || "Library User"}</h2>
            <p>{user.email}</p>
            <span className="profile-role">{user.role}</span>
          </div>
        </section>

        {/* Personal Information */}
        <section className="profile-section">
          <div className="profile-section-heading">
            <div>
              <span>PERSONAL INFORMATION</span>
              <h2>Edit Profile</h2>
              <p>Update your name and email address.</p>
            </div>
          </div>

          {profileError && (
            <div className="profile-alert error">{profileError}</div>
          )}

          {profileSuccess && (
            <div className="profile-alert success">{profileSuccess}</div>
          )}

          <form className="profile-form" onSubmit={handleProfileSubmit}>
            <div className="profile-form-grid">
              <div className="profile-field">
                <label htmlFor="profile-first-name">First Name</label>
                <input
                  id="profile-first-name"
                  type="text"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  maxLength={100}
                  required
                />
              </div>

              <div className="profile-field">
                <label htmlFor="profile-last-name">Last Name</label>
                <input
                  id="profile-last-name"
                  type="text"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  maxLength={100}
                  required
                />
              </div>

              <div className="profile-field full-width">
                <label htmlFor="profile-email">Email Address</label>
                <input
                  id="profile-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  maxLength={255}
                  required
                />
              </div>
            </div>

            <button
              className="profile-primary-button"
              type="submit"
              disabled={profileLoading}
            >
              {profileLoading ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </section>

        {/* Change Password */}
        <section className="profile-section">
          <div className="profile-section-heading">
            <div>
              <span>ACCOUNT SECURITY</span>
              <h2>Change Password</h2>
              <p>Enter your current password and choose a new one.</p>
            </div>
          </div>

          {passwordError && (
            <div className="profile-alert error">{passwordError}</div>
          )}

          {passwordSuccess && (
            <div className="profile-alert success">{passwordSuccess}</div>
          )}

          <form className="profile-form" onSubmit={handlePasswordSubmit}>
            <div className="profile-form-grid">
              <div className="profile-field full-width">
                <label htmlFor="current-password">Current Password</label>
                <input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(event) =>
                    setCurrentPassword(event.target.value)
                  }
                  autoComplete="current-password"
                  required
                />
              </div>

              <div className="profile-field">
                <label htmlFor="new-password">New Password</label>
                <input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  minLength={8}
                  maxLength={128}
                  autoComplete="new-password"
                  required
                />
                <small>At least 8 characters.</small>
              </div>

              <div className="profile-field">
                <label htmlFor="confirm-password">
                  Confirm New Password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(event.target.value)
                  }
                  minLength={8}
                  maxLength={128}
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>

            <p className="profile-security-note">
              Changing your password will sign you out. You will need to log
              in again with your new password.
            </p>

            <button
              className="profile-primary-button"
              type="submit"
              disabled={passwordLoading}
            >
              {passwordLoading ? "Changing Password..." : "Change Password"}
            </button>
          </form>
        </section>

        {/* Manage My Sessions */}
        <section className="profile-section">
          <div className="profile-section-heading session-heading">
            <div>
              <span>ACCOUNT SECURITY</span>
              <h2>Manage My Sessions</h2>
              <p>
                View devices where your account has active sessions and
                revoke sessions you no longer recognize or use.
              </p>
            </div>

            <button
              type="button"
              className="session-refresh-button"
              onClick={() => void loadSessions()}
              disabled={sessionsLoading}
            >
              {sessionsLoading ? "Refreshing..." : "↻ Refresh"}
            </button>
          </div>

          {sessionError && (
            <div className="profile-alert error">{sessionError}</div>
          )}

          {sessionSuccess && (
            <div className="profile-alert success">{sessionSuccess}</div>
          )}

          {sessionsLoading ? (
            <p className="sessions-empty">Loading your sessions...</p>
          ) : sessions.length === 0 ? (
            <p className="sessions-empty">No active sessions found.</p>
          ) : (
            <div className="sessions-list">
              {sessions.map((session) => (
                <div className="session-card" key={session.id}>
                  <div className="session-card-info">
                    <div className="session-card-title">
                      <h3>Session #{session.id}</h3>

                      {session.is_current && (
                        <span className="session-current-badge">
                          This device
                        </span>
                      )}
                    </div>

                    <p>
                      <strong>Signed in:</strong>{" "}
                      {formatSessionDate(session.created_at)}
                    </p>

                    <p>
                      <strong>Last active:</strong>{" "}
                      {formatSessionDate(session.last_used_at)}
                    </p>

                    <p>
                      <strong>Expires:</strong>{" "}
                      {formatSessionDate(session.expires_at)}
                    </p>
                  </div>

                  <button
                    type="button"
                    className="session-revoke-button"
                    onClick={() => void handleRevokeSession(session)}
                    disabled={revokingSessionId === session.id}
                  >
                    {revokingSessionId === session.id
                      ? "Revoking..."
                      : session.is_current
                        ? "Log out this device"
                        : "Revoke session"}
                  </button>
                </div>
              ))}
            </div>
          )}

          <p className="profile-security-note">
            Revoking a session prevents that session from refreshing its
            access token. An already-issued access token on another device
            may remain valid until it expires.
          </p>
        </section>

        <footer className="profile-footer">
          LibraryNest · Account Settings
        </footer>
      </main>
    </div>
  );
}

export default ProfilePage;
