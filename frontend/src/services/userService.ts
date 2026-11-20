
import { getAccessToken } from "./authService";
import type { User } from "../types/auth";

const API_URL = "/api/users";

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || "Something went wrong.");
  }

  return response.json() as Promise<T>;
};

const getAuthHeaders = () => {
  const token = getAccessToken();

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

export const getUsers = async (): Promise<User[]> => {
  const response = await fetch(`${API_URL}/`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  return handleResponse<User[]>(response);
};

export const updateUserRole = async (
  userId: number,
  role: "student" | "librarian" | "admin"
): Promise<User> => {
  const response = await fetch(`${API_URL}/${userId}/role`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({ role }),
  });

  return handleResponse<User>(response);
};

export const deactivateUser = async (userId: number): Promise<User> => {
  const response = await fetch(`${API_URL}/${userId}/deactivate`, {
    method: "PATCH",
    headers: getAuthHeaders(),
  });

  return handleResponse<User>(response);
};
