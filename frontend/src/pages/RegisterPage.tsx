
import { useState } from "react";
import { registerUser } from "../services/authService";
import "./Auth.css";

interface RegisterPageProps {
  onNavigate: (page: "login") => void;
}

function RegisterPage({ onNavigate }: RegisterPageProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!firstName.trim() || !lastName.trim()) {
      setError("Please enter your first and last name.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await registerUser({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email,
        password,
      });

      setSuccess("Registration successful! You can now log in.");
      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleRegister}>
        <h1>Create Account</h1>
        <p>Register to get started with LibraryNest.</p>

        <label htmlFor="firstName">First Name</label>
        <input
          id="firstName"
          type="text"
          value={firstName}
          onChange={(event) => setFirstName(event.target.value)}
          placeholder="Enter your first name"
          maxLength={100}
          required
        />

        <label htmlFor="lastName">Last Name</label>
        <input
          id="lastName"
          type="text"
          value={lastName}
          onChange={(event) => setLastName(event.target.value)}
          placeholder="Enter your last name"
          maxLength={100}
          required
        />

        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Enter your email"
          required
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Enter your password"
          minLength={8}
          maxLength={128}
          required
        />

        <label htmlFor="confirmPassword">Confirm Password</label>
        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="Confirm your password"
          required
        />

        {error && <p className="auth-error">{error}</p>}
        {success && <p className="auth-success">{success}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Registering..." : "Register"}
        </button>

        <p>
          Already have an account?{" "}
          <button
            type="button"
            className="auth-link"
            onClick={() => onNavigate("login")}
          >
            Login
          </button>
        </p>
      </form>
    </div>
  );
}

export default RegisterPage;
