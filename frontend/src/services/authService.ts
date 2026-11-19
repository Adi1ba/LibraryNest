
import type {
  LoginData,
  RegisterData,
  TokenResponse,
  User,
} from "../types/auth";

const API_URL = "/api/auth";
const TOKEN_KEY = "librarynest_access_token";

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

  return response.json();
}

export const registerUser = async (
  userData: RegisterData
): Promise<User> => {
  const response = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  });

  return handleResponse<User>(response);
};

export const loginUser = async (
  loginData: LoginData
): Promise<TokenResponse> => {
  const response = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(loginData),
  });

  const data = await handleResponse<TokenResponse>(response);

  localStorage.setItem(TOKEN_KEY, data.access_token);

  return data;
};

export const getCurrentUser = async (): Promise<User> => {
  const token = localStorage.getItem(TOKEN_KEY);

  if (!token) {
    throw new Error("You are not logged in.");
  }

  const response = await fetch(`${API_URL}/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return handleResponse<User>(response);
};

export const getAccessToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const logoutUser = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};
