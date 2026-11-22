import type {
  LoginData,
  PasswordChangeData,
  ProfileUpdateData,
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

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem(TOKEN_KEY);

  if (!token) {
    throw new Error("You are not logged in.");
  }

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

function saveAccessToken(data: TokenResponse): void {
  localStorage.setItem(TOKEN_KEY, data.access_token);
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
    credentials: "include",
    body: JSON.stringify(loginData),
  });

  const data = await handleResponse<TokenResponse>(response);

  saveAccessToken(data);

  return data;
};

export const refreshAccessToken = async (): Promise<TokenResponse> => {
  const response = await fetch(`${API_URL}/refresh`, {
    method: "POST",
    credentials: "include",
  });

  const data = await handleResponse<TokenResponse>(response);

  saveAccessToken(data);

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

export const updateMyProfile = async (
  profileData: ProfileUpdateData
): Promise<User> => {
  const response = await fetch(`${API_URL}/me`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(profileData),
  });

  return handleResponse<User>(response);
};

export const changePassword = async (
  passwordData: PasswordChangeData
): Promise<{ message: string }> => {
  const response = await fetch(`${API_URL}/change-password`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(passwordData),
  });

  return handleResponse<{ message: string }>(response);
};

export const getAccessToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const logoutUser = async (): Promise<void> => {
  try {
    await fetch(`${API_URL}/logout`, {
      method: "POST",
      credentials: "include",
    });
  } finally {
    localStorage.removeItem(TOKEN_KEY);
  }
};