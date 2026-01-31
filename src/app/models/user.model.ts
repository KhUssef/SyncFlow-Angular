export interface User {
  id: string;
  username: string;
  email: string;  
  role: 'ADMIN' | 'MANAGER' | 'USER';
  status: 'Active' | 'Inactive';
  company: string;
  deletedAt?: string;
}

export interface CreateUserInput {
  username: string;
  password: string;
  role: 'ADMIN' | 'MANAGER' | 'USER';
}

export interface UpdateUserInput {
  username: string;
  password?: string;
  role: 'ADMIN' | 'MANAGER' | 'USER';
}
