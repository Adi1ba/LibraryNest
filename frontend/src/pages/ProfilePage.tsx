
import { useState } from "react";
import type { FormEvent } from "react";
import type {
  PasswordChangeData,
  ProfileUpdateData,
  User,
} from "../types/auth";
import {
  changePassword,
  logoutUser,
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

  const fullName = `${user.first_name} ${user.last_name}`.trim();
  const initials = `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`
    .toUpperCase();

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
                  onChange={(event) => setCurrentPassword(event.target.value)}
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
                <label htmlFor="confirm-password">Confirm New Password</label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
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

        <footer className="profile-footer">
          LibraryNest · Account Settings
        </footer>
      </main>
    </div>
  );
}

export default ProfilePage;
