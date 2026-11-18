
import type { Loan, LoanCreate, LoanStatusUpdate } from "../types/loan";

const API_URL = "/api/loans";

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = "Something went wrong. Please try again.";

    try {
      const data = await response.json();
      message = data.detail || message;
    } catch {
      // Keep the default error message.
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export const getLoans = async (): Promise<Loan[]> => {
  const response = await fetch(`${API_URL}/`);
  return handleResponse<Loan[]>(response);
};

export const createLoan = async (
  loanData: LoanCreate
): Promise<Loan> => {
  const response = await fetch(`${API_URL}/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(loanData),
  });

  return handleResponse<Loan>(response);
};

export const updateLoanStatus = async (
  id: number,
  statusData: LoanStatusUpdate
): Promise<Loan> => {
  const response = await fetch(`${API_URL}/${id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(statusData),
  });

  return handleResponse<Loan>(response);
};
