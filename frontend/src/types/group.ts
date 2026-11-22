
export interface Group {
  id: number;
  name: string;
  description: string | null;
  owner_id: number;
  created_at: string;
}

export interface GroupMember {
  id: number;
  group_id: number;
  user_id: number;
  can_create: boolean;
  can_edit: boolean;
  can_assign: boolean;
  can_delete: boolean;
  joined_at: string;
}

export interface GroupPermissions {
  can_create: boolean;
  can_edit: boolean;
  can_assign: boolean;
  can_delete: boolean;
}

export interface ReadingListItem {
  id: number;
  group_id: number;
  book_id: number;
  added_by: number;
  assigned_to: number | null;
  status: "planned" | "reading" | "completed";
  created_at: string;
}

export interface GroupCreate {
  name: string;
  description: string | null;
}

export interface ReadingListItemCreate {
  book_id: number;
  assigned_to?: number | null;
}

export interface ReadingListItemUpdate {
  assigned_to?: number | null;
  status?: "planned" | "reading" | "completed";
}
