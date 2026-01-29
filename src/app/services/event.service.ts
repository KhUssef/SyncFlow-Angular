import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Event, CreateEventInput, UpdateEventInput } from '../models/event.model';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private staticEvents: Event[] = [
    {
      id: '1',
      title: 'Team Standup',
      description: 'Daily team sync meeting to discuss progress and blockers.',
      date: new Date().toISOString().slice(0, 16),
      createdBy: { id: '1', username: 'John Doe' },
      createdAt: new Date().toISOString()
    },
    {
      id: '2',
      title: 'Project Review',
      description: 'Monthly project review and retrospective.',
      date: new Date(new Date().setDate(new Date().getDate() + 3)).toISOString().slice(0, 16),
      createdBy: { id: '2', username: 'Sarah Davis' },
      createdAt: new Date().toISOString()
    },
    {
      id: '3',
      title: 'Client Presentation',
      description: 'Present Q1 results to stakeholders.',
      date: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString().slice(0, 16),
      createdBy: { id: '3', username: 'Mike Johnson' },
      createdAt: new Date().toISOString()
    },
    {
      id: '4',
      title: 'Sprint Planning',
      description: 'Plan tasks for the next sprint.',
      date: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().slice(0, 16),
      createdBy: { id: '4', username: 'Jane Smith' },
      createdAt: new Date().toISOString()
    },
    {
      id: '5',
      title: 'Design Workshop',
      description: 'Collaborative design session for new features.',
      date: new Date(new Date().setDate(new Date().getDate() + 10)).toISOString().slice(0, 16),
      createdBy: { id: '5', username: 'Tom Wilson' },
      createdAt: new Date().toISOString()
    }
  ];

  private eventsSubject = new BehaviorSubject<Event[]>(this.staticEvents);
  public events$ = this.eventsSubject.asObservable();

  constructor() {}

  /**
   * Get all events
   */
  getAllEvents(): Observable<Event[]> {
    return this.events$;
  }

  /**
   * Get events by month
   */
  getEventsByMonth(date: Date): Observable<Event[]> {
    return new Observable(observer => {
      setTimeout(() => {
        const month = date.getMonth();
        const year = date.getFullYear();
        
        const filtered = this.staticEvents.filter(event => {
          const eventDate = new Date(event.date);
          return eventDate.getMonth() === month && eventDate.getFullYear() === year;
        });
        
        observer.next(filtered);
        observer.complete();
      }, 300);
    });
  }

  /**
   * Get event by ID
   */
  getEventById(id: string): Event | undefined {
    return this.staticEvents.find(event => event.id === id);
  }

  /**
   * Create a new event
   */
  createEvent(input: CreateEventInput, createdBy: { id: string; username: string }): Observable<Event> {
    return new Observable(observer => {
      setTimeout(() => {
        const newEvent: Event = {
          id: (Math.max(...this.staticEvents.map(e => parseInt(e.id)), 0) + 1).toString(),
          title: input.title,
          description: input.description,
          date: input.date,
          createdBy: createdBy,
          createdAt: new Date().toISOString()
        };

        this.staticEvents.push(newEvent);
        this.eventsSubject.next([...this.staticEvents]);
        observer.next(newEvent);
        observer.complete();
      }, 500);
    });
  }

  /**
   * Update an existing event
   */
  updateEvent(id: string, input: UpdateEventInput): Observable<Event> {
    return new Observable(observer => {
      setTimeout(() => {
        const eventIndex = this.staticEvents.findIndex(event => event.id === id);
        
        if (eventIndex === -1) {
          observer.error(new Error('Event not found'));
          return;
        }

        const updatedEvent: Event = {
          ...this.staticEvents[eventIndex],
          title: input.title,
          description: input.description,
          date: input.date
        };

        this.staticEvents[eventIndex] = updatedEvent;
        this.eventsSubject.next([...this.staticEvents]);
        observer.next(updatedEvent);
        observer.complete();
      }, 500);
    });
  }

  /**
   * Delete an event
   */
  deleteEvent(id: string): Observable<boolean> {
    return new Observable(observer => {
      setTimeout(() => {
        const eventIndex = this.staticEvents.findIndex(event => event.id === id);
        
        if (eventIndex === -1) {
          observer.error(new Error('Event not found'));
          return;
        }

        this.staticEvents.splice(eventIndex, 1);
        this.eventsSubject.next([...this.staticEvents]);
        
        observer.next(true);
        observer.complete();
      }, 500);
    });
  }

  /**
   * Get events for a specific day
   */
  getEventsByDay(date: Date): Event[] {
    const targetDate = date.toDateString();
    return this.staticEvents.filter(event => {
      const eventDate = new Date(event.date).toDateString();
      return eventDate === targetDate;
    });
  }

  /**
   * Get all events sorted by date
   */
  getEventsSorted(): Event[] {
    return [...this.staticEvents].sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  }

  /**
   * Get upcoming events (next 7 days)
   */
  getUpcomingEvents(): Event[] {
    const today = new Date();
    const next7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return this.getEventsSorted().filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= today && eventDate <= next7Days;
    });
  }
}
