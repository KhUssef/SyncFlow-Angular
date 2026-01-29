export interface Event {
  id: string;
  title: string;
  description: string;
  date: string; // ISO format: YYYY-MM-DDTHH:mm
  createdBy: {
    id: string;
    username: string;
  };
  createdAt?: string;
}

export interface CreateEventInput {
  title: string;
  description: string;
  date: string;
}

export interface UpdateEventInput {
  title: string;
  description: string;
  date: string;
}
