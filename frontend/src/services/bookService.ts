import type { Book, BookCreate, BookUpdate } from "../types/book";

const API_URL = "/api/books";

export const getBooks = async (): Promise<Book[]> => {
  const response = await fetch(`${API_URL}/`);

  if (!response.ok) {
    throw new Error("Failed to fetch books");
  }

  return response.json();
};

export const getBook = async (id: number): Promise<Book> => {
  const response = await fetch(`${API_URL}/${id}`);

  if (!response.ok) {
    throw new Error("Book not found");
  }

  return response.json();
};

export const createBook = async (book: BookCreate): Promise<Book> => {
  const response = await fetch(`${API_URL}/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(book),
  });

  if (!response.ok) {
    throw new Error("Failed to create book");
  }

  return response.json();
};

export const updateBook = async (
  id: number,
  book: BookUpdate
): Promise<Book> => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(book),
  });

  if (!response.ok) {
    throw new Error("Failed to update book");
  }

  return response.json();
};

export const deleteBook = async (id: number): Promise<void> => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete book");
  }
};