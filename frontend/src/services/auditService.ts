
import { getAccessToken } from "./authService";

const API_URL = "/api/audit";

export interface AuditLog {
  id: number;
  actor_user_id: number | null;
  actor_email: string | null;
  target_user_id: number | null;
  target_email: string | null;
  event_type: string;
  description: string;
  ip_address: string | null;
  user_agent: string | null;
  outcome: "success" | "failure";
  created_at: string;
}

export interface AuditLogResponse {
  items: AuditLog[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface AuditLogFilters {
  q?: string;
  event_type?: string;
  user_id?: number;
  outcome?: "success" | "failure";
  start_date?: string;
  end_date?: string;
  page?: number;
  page_size?: number;
}

export const getAuditLogs = async (
  filters: AuditLogFilters = {}
): Promise<AuditLogResponse> => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ""
    ) {
      params.append(key, String(value));
    }
  });

  const token = getAccessToken();

  const response = await fetch(
    `${API_URL}/?${params.toString()}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);

    throw new Error(
      errorData?.detail || `Request failed: ${response.status}`
    );
  }

  return response.json() as Promise<AuditLogResponse>;
};
