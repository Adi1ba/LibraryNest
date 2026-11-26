
export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  is_active?: boolean;
  created_at: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
}

export interface ProfileUpdateData {
  first_name: string;
  last_name: string;
  email: string;
}

export interface PasswordChangeData {
  current_password: string;
  new_password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface MySession {
  id: number;
  created_at: string;
  expires_at: string;
  last_used_at: string | null;
  is_current: boolean;
}
