export interface Book {
  id: number;
  title: string;
  author: string;
  isbn: string;
  total_copies: number;
  available_copies: number;
  created_at: string;
  updated_at: string;
}

export interface BookCreate {
  title: string;
  author: string;
  isbn: string;
  total_copies: number;
}

export interface BookUpdate {
  title?: string;
  author?: string;
  isbn?: string;
  total_copies?: number;
}