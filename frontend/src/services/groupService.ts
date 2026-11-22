
import { getAccessToken, refreshAccessToken } from "./authService";
import type {
  Group,
  GroupMember,
  GroupPermissions,
  ReadingListItem,
} from "../types/group";

const API_URL = "/api/groups";

async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  retry = true
): Promise<T> {
  const headers = new Headers(options.headers);
  const token = getAccessToken();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (options.body) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (response.status === 401 && retry) {
    await refreshAccessToken();
    return apiRequest<T>(path, options, false);
  }

  if (!response.ok) {
    let message = "Something went wrong.";

    try {
      const data = await response.json();
      message = data.detail || message;
    } catch {
      // Keep default error.
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export const getMyGroups = () =>
  apiRequest<Group[]>("");

export const createGroup = (data: {
  name: string;
  description: string | null;
}) =>
  apiRequest<Group>("", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const getGroupMembers = (groupId: number) =>
  apiRequest<GroupMember[]>(`/${groupId}/members`);

export const addGroupMember = (groupId: number, userId: number) =>
  apiRequest<GroupMember>(`/${groupId}/members`, {
    method: "POST",
    body: JSON.stringify({ user_id: userId }),
  });

export const updateMemberPermissions = (
  groupId: number,
  userId: number,
  permissions: GroupPermissions
) =>
  apiRequest<GroupMember>(
    `/${groupId}/members/${userId}/permissions`,
    {
      method: "PATCH",
      body: JSON.stringify(permissions),
    }
  );

export const removeGroupMember = (groupId: number, userId: number) =>
  apiRequest<void>(`/${groupId}/members/${userId}`, {
    method: "DELETE",
  });

export const getReadingList = (groupId: number) =>
  apiRequest<ReadingListItem[]>(`/${groupId}/reading-list`);

export const addReadingListItem = (
  groupId: number,
  bookId: number
) =>
  apiRequest<ReadingListItem>(`/${groupId}/reading-list`, {
    method: "POST",
    body: JSON.stringify({ book_id: bookId }),
  });

export const updateReadingListItem = (
  groupId: number,
  itemId: number,
  data: {
    status?: "planned" | "reading" | "completed";
    assigned_to?: number | null;
  }
) =>
  apiRequest<ReadingListItem>(
    `/${groupId}/reading-list/${itemId}`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    }
  );

export const deleteReadingListItem = (
  groupId: number,
  itemId: number
) =>
  apiRequest<void>(`/${groupId}/reading-list/${itemId}`, {
    method: "DELETE",
  });
