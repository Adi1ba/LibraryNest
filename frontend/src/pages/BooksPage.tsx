
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { Book } from "../types/book";
import {
  getBooks,
  createBook,
  updateBook,
  deleteBook,
} from "../services/bookService";
import "./BooksPage.css";

function BooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [isbn, setIsbn] = useState("");
  const [totalCopies, setTotalCopies] = useState(1);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const fetchBooks = async () => {
    try {
      const data = await getBooks();
      setBooks(data);
      setError("");
    } catch {
      setError("Unable to load books. Please check the backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const resetForm = () => {
    setTitle("");
    setAuthor("");
    setIsbn("");
    setTotalCopies(1);
    setEditingId(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    try {
      const bookData = {
        title: title.trim(),
        author: author.trim(),
        isbn: isbn.trim(),
        total_copies: totalCopies,
      };

      if (editingId !== null) {
        await updateBook(editingId, bookData);
        setSuccess("Book details updated successfully.");
      } else {
        await createBook(bookData);
        setSuccess("New book added successfully.");
      }

      resetForm();
      await fetchBooks();
    } catch {
      setError(
        editingId !== null
          ? "Unable to update book. Check the ISBN."
          : "Unable to add book. Check the ISBN."
      );
    }
  };

  const handleEdit = (book: Book) => {
    setEditingId(book.id);
    setTitle(book.title);
    setAuthor(book.author);
    setIsbn(book.isbn);
    setTotalCopies(book.total_copies);
    setError("");
    setSuccess("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (book: Book) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${book.title}"?`
    );

    if (!confirmed) return;

    try {
      await deleteBook(book.id);
      setSuccess("Book deleted successfully.");

      if (editingId === book.id) {
        resetForm();
      }

      await fetchBooks();
    } catch {
      setError("Unable to delete book. Please try again.");
    }
  };

  const filteredBooks = books.filter((book) => {
    const query = search.toLowerCase();

    return (
      book.title.toLowerCase().includes(query) ||
      book.author.toLowerCase().includes(query) ||
      book.isbn.toLowerCase().includes(query)
    );
  });

  const totalCopiesCount = books.reduce(
    (sum, book) => sum + book.total_copies,
    0
  );

  const availableCopiesCount = books.reduce(
    (sum, book) => sum + book.available_copies,
    0
  );

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
          <div className="nav-item active">
            <span>▦</span>
            Book Management
          </div>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <span className="note-icon">✦</span>
            <p>Keep your library organized and up to date.</p>
          </div>
          <span className="sidebar-version">LibraryNest · MVP</span>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <span className="breadcrumb">Workspace / Books</span>
            <h1>Book Management</h1>
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
              <p className="eyebrow">YOUR LIBRARY AT A GLANCE</p>
              <h2>Manage your collection</h2>
              <p className="welcome-description">
                Add new books, update existing records, and keep track of your collection.
              </p>
            </div>
            <div className="date-label">BOOK INVENTORY</div>
          </div>

          <section className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon purple">▤</div>
              <div>
                <p>Total Titles</p>
                <h3>{books.length}</h3>
                <span>Registered books</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon blue">▣</div>
              <div>
                <p>Total Copies</p>
                <h3>{totalCopiesCount}</h3>
                <span>Across all titles</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon green">✓</div>
              <div>
                <p>Available Copies</p>
                <h3>{availableCopiesCount}</h3>
                <span>Currently available</span>
              </div>
            </div>
          </section>

          {error && <div className="alert error-alert">{error}</div>}
          {success && <div className="alert success-alert">{success}</div>}

          <section className="content-grid">
            <div className="panel form-panel">
              <div className="panel-heading">
                <div>
                  <span className="panel-kicker">
                    {editingId !== null ? "EDIT RECORD" : "NEW ENTRY"}
                  </span>
                  <h3>{editingId !== null ? "Update book" : "Add a new book"}</h3>
                </div>
                <span className="panel-heading-icon">＋</span>
              </div>

              <form onSubmit={handleSubmit} className="book-form">
                <div className="form-field">
                  <label htmlFor="book-title">Book title</label>
                  <input
                    id="book-title"
                    type="text"
                    placeholder="e.g. The Alchemist"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={200}
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="book-author">Author</label>
                  <input
                    id="book-author"
                    type="text"
                    placeholder="e.g. Paulo Coelho"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    maxLength={150}
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="book-isbn">ISBN</label>
                  <input
                    id="book-isbn"
                    type="text"
                    placeholder="Enter ISBN number"
                    value={isbn}
                    onChange={(e) => setIsbn(e.target.value)}
                    maxLength={20}
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="book-copies">Total copies</label>
                  <input
                    id="book-copies"
                    type="number"
                    min="0"
                    value={totalCopies}
                    onChange={(e) => setTotalCopies(Number(e.target.value))}
                    required
                  />
                </div>

                <button className="primary-button" type="submit">
                  {editingId !== null ? "Save Changes" : "＋ Add Book"}
                </button>

                {editingId !== null && (
                  <button
                    className="cancel-button"
                    type="button"
                    onClick={resetForm}
                  >
                    Cancel Editing
                  </button>
                )}
              </form>
            </div>

            <div className="panel table-panel">
              <div className="table-heading">
                <div>
                  <span className="panel-kicker">COLLECTION</span>
                  <h3>All books</h3>
                  <p>{books.length} titles in your library</p>
                </div>

                <div className="search-box">
                  <span>⌕</span>
                  <input
                    type="search"
                    placeholder="Search books..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              {loading ? (
                <div className="empty-state">Loading your collection...</div>
              ) : filteredBooks.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">▤</div>
                  <h4>{search ? "No matching books" : "Your library is empty"}</h4>
                  <p>
                    {search
                      ? "Try searching with another title, author, or ISBN."
                      : "Add your first book using the form to get started."}
                  </p>
                </div>
              ) : (
                <div className="table-scroll">
                  <table className="books-table">
                    <thead>
                      <tr>
                        <th>BOOK DETAILS</th>
                        <th>ISBN</th>
                        <th>COPIES</th>
                        <th>AVAILABLE</th>
                        <th>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBooks.map((book) => (
                        <tr key={book.id}>
                          <td>
                            <div className="book-title-cell">
                              <div className="book-cover">
                                {book.title.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <strong>{book.title}</strong>
                                <span>{book.author}</span>
                              </div>
                            </div>
                          </td>
                          <td className="isbn-cell">{book.isbn}</td>
                          <td>{book.total_copies}</td>
                          <td>
                            <span
                              className={`availability ${
                                book.available_copies > 0 ? "in-stock" : "out-stock"
                              }`}
                            >
                              {book.available_copies} available
                            </span>
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button
                                className="edit-button"
                                type="button"
                                onClick={() => handleEdit(book)}
                              >
                                Edit
                              </button>
                              <button
                                className="delete-button"
                                type="button"
                                onClick={() => handleDelete(book)}
                              >
                                Delete
                              </button>
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

export default BooksPage;
