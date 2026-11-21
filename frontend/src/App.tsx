
import { useEffect, useState } from "react";
import BooksPage from "./pages/BooksPage";
import LoansPage from "./pages/LoansPage";
import UserManagementPage from "./pages/UserManagementPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import {
  getAccessToken,
  getCurrentUser,
  refreshAccessToken,
  logoutUser,
} from "./services/authService";
import type { User } from "./types/auth";

type Page = "books" | "loans" | "users" | "login" | "register";

// Prevent duplicate session restoration requests in React StrictMode.
let sessionRestorePromise: Promise<User | null> | null = null;

async function restoreSession(): Promise<User | null> {
  if (!sessionRestorePromise) {
    sessionRestorePromise = (async () => {
      try {
        // First, try the existing access token.
        if (getAccessToken()) {
          try {
            return await getCurrentUser();
          } catch {
            // Access token may have expired.
            // Try refreshing it using the HttpOnly cookie.
          }
        }

        // Restore the session or obtain a new access token.
        const tokenResponse = await refreshAccessToken();
        return tokenResponse.user;
      } catch {
        // No valid session could be restored.
        try {
          await logoutUser();
        } catch {
          // Clear the local token even if the server is unavailable.
        }

        return null;
      }
    })().finally(() => {
      sessionRestorePromise = null;
    });
  }

  return sessionRestorePromise;
}

function App() {
  const [currentPage, setCurrentPage] = useState<Page>("login");
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const checkAuthentication = async () => {
      const currentUser = await restoreSession();

      if (!isMounted) {
        return;
      }

      if (currentUser) {
        setUser(currentUser);
        setCurrentPage("books");
      } else {
        setUser(null);
        setCurrentPage("login");
      }

      setCheckingAuth(false);
    };

    checkAuthentication();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    setCurrentPage("books");
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch {
      // The frontend should still log out if the server is unavailable.
    } finally {
      setUser(null);
      setCurrentPage("login");
    }
  };

  if (checkingAuth) {
    return <p>Checking authentication...</p>;
  }

  if (!user) {
    if (currentPage === "register") {
      return <RegisterPage onNavigate={setCurrentPage} />;
    }

    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        onNavigate={setCurrentPage}
      />
    );
  }

  if (currentPage === "users") {
    if (user.role !== "admin") {
      setCurrentPage("books");
      return <p>Redirecting...</p>;
    }

    return (
      <UserManagementPage
        user={user}
        onNavigate={setCurrentPage}
        onLogout={handleLogout}
      />
    );
  }

  if (currentPage === "loans") {
    return (
      <LoansPage
        onNavigate={setCurrentPage}
        user={user}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <BooksPage
      onNavigate={setCurrentPage}
      user={user}
      onLogout={handleLogout}
    />
  );
}

export default App;
