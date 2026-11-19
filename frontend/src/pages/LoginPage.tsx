
import { useState } from "react";
import {
  getCurrentUser,
  loginUser,
} from "../services/authService";
import type { User } from "../types/auth";
import "./Auth.css";

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
  onNavigate: (page: "register") => void;
}

function LoginPage({
  onLoginSuccess,
  onNavigate,
}: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      await loginUser({ email, password });

      const user = await getCurrentUser();

      onLoginSuccess(user);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleLogin}>
        <h1>Welcome Back</h1>
        <p>Login to continue to LibraryNest.</p>

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
          required
        />

        {error && <p className="auth-error">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>

        <p>
          Don't have an account?{" "}
          <button
            type="button"
            className="auth-link"
            onClick={() => onNavigate("register")}
          >
            Register
          </button>
        </p>
      </form>
    </div>
  );
}

export default LoginPage;
