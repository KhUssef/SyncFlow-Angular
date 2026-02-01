export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  completed: boolean;
  assignedTo?: {
    id: string;
    username: string;
  };
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  dueDate?: string;
  assignedToId?: string;
}

export interface UpdateTaskInput {
  id: number;

  title?: string;

  description?: string;

  dueDate?: Date;
}
