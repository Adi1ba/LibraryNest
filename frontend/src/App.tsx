
import { useEffect, useState } from "react";
import BooksPage from "./pages/BooksPage";
import LoansPage from "./pages/LoansPage";
import UserManagementPage from "./pages/UserManagementPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import {
  getAccessToken,
  getCurrentUser,
  logoutUser,
} from "./services/authService";
import type { User } from "./types/auth";

type Page = "books" | "loans" | "users" | "login" | "register";

function App() {
  const [currentPage, setCurrentPage] = useState<Page>("login");
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuthentication = async () => {
      const token = getAccessToken();

      if (!token) {
        setCheckingAuth(false);
        return;
      }

      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        setCurrentPage("books");
      } catch {
        logoutUser();
        setUser(null);
        setCurrentPage("login");
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuthentication();
  }, []);

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    setCurrentPage("books");
  };

  const handleLogout = () => {
    logoutUser();
    setUser(null);
    setCurrentPage("login");
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
