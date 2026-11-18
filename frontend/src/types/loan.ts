
export interface Loan {
  id: number;
  book_id: number;
  student_name: string;
  student_email: string;
  status: "Pending" | "Approved" | "Rejected" | "Returned";
  requested_at: string;
  returned_at: string | null;
}

export interface LoanCreate {
  book_id: number;
  student_name: string;
  student_email: string;
}

export interface LoanStatusUpdate {
  status: "Approved" | "Rejected" | "Returned";
}
