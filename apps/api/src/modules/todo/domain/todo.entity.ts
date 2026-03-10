export interface Todo {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTodoData {
  title: string;
  description?: string;
}

export interface UpdateTodoData {
  title?: string;
  description?: string;
  completed?: boolean;
}
