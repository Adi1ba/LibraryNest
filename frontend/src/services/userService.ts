
import { getAccessToken } from "./authService";
import type { User } from "../types/auth";

const API_URL = "/api/users";

export interface DashboardStats {
  total_users: number;
  active_users: number;
  banned_users: number;
  total_books: number;
  total_groups: number;
  new_users_last_7_days: number;
}

export interface AdminManagedUser extends User {
  is_active: boolean;
  is_banned: boolean;
  ban_reason: string | null;
}

export interface UserDetailLoan {
  id: number;
  book_id: number;
  book_title: string;
  book_author: string;
  book_isbn: string | null;
  status: string;
  requested_at: string;
  returned_at: string | null;
}

export interface UserDetailGroup {
  id: number;
  name: string;
  description: string | null;
  owner_id: number;
  created_at: string;
  membership_role: string;
}

export interface UserDetailSession {
  id: number;
  created_at: string;
  expires_at: string;
  last_used_at: string | null;
}

export interface UserDetails extends AdminManagedUser {
  loans: UserDetailLoan[];
  groups: UserDetailGroup[];
  active_sessions: UserDetailSession[];
}

export interface BulkUserActionRequest {
  user_ids: number[];
  action: "ban" | "unban";
  reason?: string;
}

export interface ActionResponse {
  message?: string;
  detail?: string;
  changed_count?: number;
  revoked_sessions?: number;
}

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);

    throw new Error(
      errorData?.detail || `Request failed: ${response.status}`
    );
  }

  if (response.status === 204) {
    return undefined as T;
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

export const getUsers = async (): Promise<AdminManagedUser[]> => {
  const response = await fetch(`${API_URL}/`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  return handleResponse<AdminManagedUser[]>(response);
};

export const getDashboardStats =
  async (): Promise<DashboardStats> => {
    const response = await fetch(
      `${API_URL}/admin/dashboard-stats`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      }
    );

    return handleResponse<DashboardStats>(response);
  };

export const getUserDetails = async (
  userId: number
): Promise<UserDetails> => {
  const response = await fetch(`${API_URL}/${userId}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  return handleResponse<UserDetails>(response);
};

export const updateUserRole = async (
  userId: number,
  role: "student" | "librarian" | "admin"
): Promise<AdminManagedUser> => {
  const response = await fetch(`${API_URL}/${userId}/role`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({ role }),
  });

  return handleResponse<AdminManagedUser>(response);
};

export const deactivateUser = async (
  userId: number
): Promise<AdminManagedUser> => {
  const response = await fetch(`${API_URL}/${userId}/deactivate`, {
    method: "PATCH",
    headers: getAuthHeaders(),
  });

  return handleResponse<AdminManagedUser>(response);
};

export const activateUser = async (
  userId: number
): Promise<AdminManagedUser> => {
  const response = await fetch(`${API_URL}/${userId}/activate`, {
    method: "PATCH",
    headers: getAuthHeaders(),
  });

  return handleResponse<AdminManagedUser>(response);
};

export const banUser = async (
  userId: number,
  reason: string
): Promise<AdminManagedUser> => {
  const response = await fetch(`${API_URL}/${userId}/ban`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ reason }),
  });

  return handleResponse<AdminManagedUser>(response);
};

export const unbanUser = async (
  userId: number
): Promise<AdminManagedUser> => {
  const response = await fetch(`${API_URL}/${userId}/unban`, {
    method: "PATCH",
    headers: getAuthHeaders(),
  });

  return handleResponse<AdminManagedUser>(response);
};

export const bulkUserAction = async (
  data: BulkUserActionRequest
): Promise<ActionResponse> => {
  const response = await fetch(`${API_URL}/bulk-action`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  return handleResponse<ActionResponse>(response);
};

export const revokeUserSessions = async (
  userId: number
): Promise<ActionResponse> => {
  const response = await fetch(
    `${API_URL}/${userId}/sessions/revoke`,
    {
      method: "POST",
      headers: getAuthHeaders(),
    }
  );

  return handleResponse<ActionResponse>(response);
};
