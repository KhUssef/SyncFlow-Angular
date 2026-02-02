import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Event, CreateEventInput } from '../models/event.model';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:3000/events';

  constructor() {}

  /**
   * Get all events
   */
  getAllEvents(): Observable<Event[]> {
    return this.http.get<Event[]>(this.baseUrl);
  }

  /**
   * Get events by month
   */
  getEventsByMonth(date: Date): Observable<Event[]> {
    const dateParam = encodeURIComponent(date.toISOString());
    return this.http.get<Event[]>(`${this.baseUrl}/by-month/${dateParam}`);
  }

  /**
   * Create a new event
   */
  createEvent(input: CreateEventInput): Observable<Event> {
    return this.http.post<Event>(this.baseUrl, input);
  }

  /**
   * Delete an event
   */
  deleteEvent(id: number | string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.baseUrl}/${id}`);
  }

  /**
   * Get events for a specific day
   */
  getEventsByDay(date: Date): Observable<Event[]> {
    const dateParam = encodeURIComponent(date.toISOString());
    return this.http.get<Event[]>(`${this.baseUrl}/by-day/${dateParam}`);
  }

  /**
   * Get all events sorted by date
   */
  getEventsSorted(events: Event[]): Event[] {
    return [...events].sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  }

  /**
   * Get upcoming events (next 7 days)
   */
  getUpcomingEvents(events: Event[], days = 7): Event[] {
    const today = new Date();
    const limit = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);

    return this.getEventsSorted(events).filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= today && eventDate <= limit;
    });
  }
}
