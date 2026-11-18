
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { getBooks } from "../services/bookService";
import {
  createLoan,
  getLoans,
  updateLoanStatus,
} from "../services/loanService";
import type { Book } from "../types/book";
import type { Loan } from "../types/loan";
import "./BooksPage.css";
import "./LoansPage.css";

interface LoansPageProps {
  onNavigate: (page: "books" | "loans") => void;
}

function LoansPage({ onNavigate }: LoansPageProps) {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [bookId, setBookId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");

  const fetchData = async () => {
    try {
      const [loanData, bookData] = await Promise.all([
        getLoans(),
        getBooks(),
      ]);

      setLoans(loanData);
      setBooks(bookData);
      setError("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load loan information."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setBookId("");
    setStudentName("");
    setStudentEmail("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!bookId) {
      setError("Please select a book.");
      return;
    }

    try {
      setSubmitting(true);

      await createLoan({
        book_id: Number(bookId),
        student_name: studentName.trim(),
        student_email: studentEmail.trim(),
      });

      setSuccess("Loan request submitted successfully.");
      resetForm();
      await fetchData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to submit the loan request."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (
    loan: Loan,
    newStatus: "Approved" | "Rejected" | "Returned"
  ) => {
    setError("");
    setSuccess("");

    try {
      await updateLoanStatus(loan.id, { status: newStatus });

      const messages = {
        Approved: "Loan request approved successfully.",
        Rejected: "Loan request rejected successfully.",
        Returned: "Book return recorded successfully.",
      };

      setSuccess(messages[newStatus]);
      await fetchData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update the loan status."
      );
    }
  };

  const pendingCount = loans.filter(
    (loan) => loan.status === "Pending"
  ).length;

  const approvedCount = loans.filter(
    (loan) => loan.status === "Approved"
  ).length;

  const returnedCount = loans.filter(
    (loan) => loan.status === "Returned"
  ).length;

  const getBookTitle = (id: number) => {
    return books.find((book) => book.id === id)?.title || `Book #${id}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">L</div>
          <div>
            <h2>LibraryNest</h2>
            <span>Library Management</span>
          </div>
        </div>

        <div className="sidebar-label">WORKSPACE</div>

        <nav className="sidebar-nav">
          <button
            className="nav-item"
            type="button"
            onClick={() => onNavigate("books")}
          >
            <span>▦</span>
            Book Management
          </button>

          <button
            className="nav-item active"
            type="button"
            onClick={() => onNavigate("loans")}
          >
            <span>▤</span>
            Loan Management
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <span className="note-icon">✦</span>
            <p>Keep track of loan requests and book returns.</p>
          </div>
          <span className="sidebar-version">LibraryNest · MVP</span>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <span className="breadcrumb">Workspace / Loans</span>
            <h1>Loan Management</h1>
          </div>

          <div className="topbar-right">
            <span className="status-dot"></span>
            <span>Library Admin</span>
            <div className="avatar">A</div>
          </div>
        </header>

        <section className="page-content">
          <div className="welcome-section">
            <div>
              <p className="eyebrow">LOAN ACTIVITY AT A GLANCE</p>
              <h2>Manage book loans</h2>
              <p className="welcome-description">
                Review requests, approve loans, and keep track of returned books.
              </p>
            </div>

            <div className="date-label">LOAN RECORDS</div>
          </div>

          <section className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon purple">▤</div>
              <div>
                <p>Total Requests</p>
                <h3>{loans.length}</h3>
                <span>All loan records</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon blue">◷</div>
              <div>
                <p>Pending Requests</p>
                <h3>{pendingCount}</h3>
                <span>Awaiting approval</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon green">✓</div>
              <div>
                <p>Active Loans</p>
                <h3>{approvedCount}</h3>
                <span>{returnedCount} returned</span>
              </div>
            </div>
          </section>

          {error && <div className="alert error-alert">{error}</div>}
          {success && <div className="alert success-alert">{success}</div>}

          <section className="content-grid loans-content-grid">
            <div className="panel form-panel">
              <div className="panel-heading">
                <div>
                  <span className="panel-kicker">NEW REQUEST</span>
                  <h3>Create a loan request</h3>
                </div>
                <span className="panel-heading-icon">＋</span>
              </div>

              <form onSubmit={handleSubmit} className="book-form">
                <div className="form-field">
                  <label htmlFor="loan-book">Select book</label>
                  <select
                    id="loan-book"
                    value={bookId}
                    onChange={(event) => setBookId(event.target.value)}
                    required
                  >
                    <option value="">Choose a book</option>
                    {books.map((book) => (
                      <option
                        key={book.id}
                        value={book.id}
                        disabled={book.available_copies <= 0}
                      >
                        {book.title} — {book.available_copies} available
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label htmlFor="student-name">Student name</label>
                  <input
                    id="student-name"
                    type="text"
                    placeholder="Enter student name"
                    value={studentName}
                    onChange={(event) => setStudentName(event.target.value)}
                    maxLength={150}
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="student-email">Student email</label>
                  <input
                    id="student-email"
                    type="email"
                    placeholder="student@example.com"
                    value={studentEmail}
                    onChange={(event) => setStudentEmail(event.target.value)}
                    required
                  />
                </div>

                <button
                  className="primary-button"
                  type="submit"
                  disabled={submitting}
                >
                  {submitting ? "Submitting..." : "＋ Submit Request"}
                </button>
              </form>
            </div>

            <div className="panel table-panel">
              <div className="table-heading">
                <div>
                  <span className="panel-kicker">REQUEST HISTORY</span>
                  <h3>All loan requests</h3>
                  <p>{loans.length} requests in your library</p>
                </div>

                <button
                  className="refresh-button"
                  type="button"
                  onClick={fetchData}
                >
                  ↻ Refresh
                </button>
              </div>

              {loading ? (
                <div className="empty-state">Loading loan requests...</div>
              ) : loans.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">▤</div>
                  <h4>No loan requests yet</h4>
                  <p>
                    Submit a new request using the form to get started.
                  </p>
                </div>
              ) : (
                <div className="table-scroll">
                  <table className="books-table loans-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>BOOK</th>
                        <th>STUDENT</th>
                        <th>REQUESTED AT</th>
                        <th>STATUS</th>
                        <th>ACTIONS</th>
                      </tr>
                    </thead>

                    <tbody>
                      {loans.map((loan) => (
                        <tr key={loan.id}>
                          <td>#{loan.id}</td>

                          <td>
                            <strong>{getBookTitle(loan.book_id)}</strong>
                            <span className="loan-book-id">
                              Book ID: {loan.book_id}
                            </span>
                          </td>

                          <td>
                            <strong>{loan.student_name}</strong>
                            <span className="loan-student-email">
                              {loan.student_email}
                            </span>
                          </td>

                          <td>{formatDate(loan.requested_at)}</td>

                          <td>
                            <span
                              className={`loan-status ${loan.status.toLowerCase()}`}
                            >
                              {loan.status}
                            </span>
                          </td>

                          <td>
                            <div className="action-buttons">
                              {loan.status === "Pending" && (
                                <>
                                  <button
                                    className="edit-button"
                                    type="button"
                                    onClick={() =>
                                      handleStatusUpdate(loan, "Approved")
                                    }
                                  >
                                    Approve
                                  </button>

                                  <button
                                    className="delete-button"
                                    type="button"
                                    onClick={() =>
                                      handleStatusUpdate(loan, "Rejected")
                                    }
                                  >
                                    Reject
                                  </button>
                                </>
                              )}

                              {loan.status === "Approved" && (
                                <button
                                  className="edit-button"
                                  type="button"
                                  onClick={() =>
                                    handleStatusUpdate(loan, "Returned")
                                  }
                                >
                                  Return
                                </button>
                              )}

                              {(loan.status === "Rejected" ||
                                loan.status === "Returned") && (
                                <span className="completed-label">
                                  Completed
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}

export default LoansPage;
