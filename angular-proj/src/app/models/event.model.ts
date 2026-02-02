export interface Event {
  id: number | string;
  title: string;
  description: string;
  date: string; // ISO format: YYYY-MM-DDTHH:mm
  createdBy: {
    id: number | string;
    username: string;
  };
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
