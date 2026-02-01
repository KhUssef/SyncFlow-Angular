export interface User {
  id: number | string;
  username: string;
  email?: string;
  role: 'manager' | 'user'
  status?: 'Active' | 'Inactive';
  company?: { id: string | number; code: string } | string;
  deletedAt?: string;
}

export interface CreateUserInput {
  username: string;
  password: string;
  role: 'manager' | 'user'
}

export interface UpdateUserInput {
  username: string;
  password?: string;
  role: 'manager' | 'user'
}
