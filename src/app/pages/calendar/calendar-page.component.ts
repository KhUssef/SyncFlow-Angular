import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Event, CreateEventInput, UpdateEventInput } from '../../models/event.model';
import { EventService } from '../../services/event.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-calendar-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule],
  templateUrl: './calendar-page.component.html',
  styleUrl: './calendar-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CalendarPageComponent implements OnInit, OnDestroy {
  events: Event[] = [];
  currentDate: Date = new Date();
  currentMonth: string = '';
  currentYear: number = 0;
  
  // Calendar grid
  calendarDays: (number | null)[] = [];
  weekDays: string[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Modal states
  showEventModal = false;
  showEventDetails = false;
  selectedEvent: Event | null = null;
  
  // Form data
  newEventData: CreateEventInput = {
    title: '',
    description: '',
    date: new Date().toISOString().slice(0, 16)
  };
  
  isCreatingEvent = false;
  currentUser = { id: '1', username: 'John Doe' }; // Static user for demo
  
  upcomingEvents: Event[] = [];
  currentMonthEvents: Event[] = [];
  
  private destroy$ = new Subject<void>();

  constructor(private eventService: EventService) {}

  ngOnInit(): void {
    this.loadEvents();
    this.generateCalendar();
  }

  loadEvents(): void {
    this.eventService.getAllEvents()
      .pipe(takeUntil(this.destroy$))
      .subscribe(events => {
        this.events = events;
        this.upcomingEvents = this.eventService.getUpcomingEvents();
        this.loadMonthEvents();
      });
  }

  loadMonthEvents(): void {
    this.eventService.getEventsByMonth(this.currentDate)
      .pipe(takeUntil(this.destroy$))
      .subscribe(events => {
        this.currentMonthEvents = events.sort((a, b) => {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        });
      });
  }

  generateCalendar(): void {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    
    this.currentYear = year;
    this.currentMonth = this.currentDate.toLocaleString('default', { month: 'long' });
    
    // First day of month and number of days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Generate calendar grid
    this.calendarDays = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      this.calendarDays.push(null);
    }
    
    // Add days of month
    for (let i = 1; i <= daysInMonth; i++) {
      this.calendarDays.push(i);
    }
  }

  previousMonth(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1);
    this.generateCalendar();
    this.loadMonthEvents();
  }

  nextMonth(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1);
    this.generateCalendar();
    this.loadMonthEvents();
  }

  today(): void {
    this.currentDate = new Date();
    this.generateCalendar();
    this.loadMonthEvents();
  }

  getEventsForDay(day: number | null): Event[] {
    if (!day) return [];
    
    const dateStr = new Date(this.currentYear, this.currentDate.getMonth(), day)
      .toDateString();
    
    return this.events.filter(event => {
      return new Date(event.date).toDateString() === dateStr;
    });
  }

  selectDay(day: number | null): void {
    if (day) {
      const selectedDate = new Date(this.currentYear, this.currentDate.getMonth(), day);
      this.newEventData.date = selectedDate.toISOString().slice(0, 16);
    }
  }

  openAddEventModal(): void {
    const now = new Date();
    this.newEventData = {
      title: '',
      description: '',
      date: now.toISOString().slice(0, 16)
    };
    this.showEventModal = true;
  }

  closeAddEventModal(): void {
    this.showEventModal = false;
  }

  openEventDetails(event: Event): void {
    this.selectedEvent = event;
    this.showEventDetails = true;
  }

  closeEventDetails(): void {
    this.showEventDetails = false;
    this.selectedEvent = null;
  }

  onEventInputChange(field: keyof CreateEventInput, value: string): void {
    this.newEventData[field] = value;
  }

  handleCreateEvent(): void {
    if (!this.newEventData.title.trim()) {
      alert('Please enter an event title');
      return;
    }

    this.isCreatingEvent = true;

    this.eventService.createEvent(this.newEventData, this.currentUser)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          alert('Event created successfully!');
          this.closeAddEventModal();
          this.isCreatingEvent = false;
          this.loadEvents();
        },
        error: (err) => {
          alert('Error creating event: ' + err.message);
          this.isCreatingEvent = false;
        }
      });
  }

  handleDeleteEvent(event: Event): void {
    if (!confirm(`Are you sure you want to delete "${event.title}"?`)) {
      return;
    }

    this.eventService.deleteEvent(event.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          alert('Event deleted successfully');
          this.closeEventDetails();
          this.loadEvents();
        },
        error: (err) => {
          alert('Error deleting event: ' + err.message);
        }
      });
  }

  formatEventTime(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  formatEventDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  formatFullDateTime(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  isToday(day: number | null): boolean {
    if (!day) return false;
    
    const today = new Date();
    return (
      day === today.getDate() &&
      this.currentDate.getMonth() === today.getMonth() &&
      this.currentDate.getFullYear() === today.getFullYear()
    );
  }

  isCurrentMonth(): boolean {
    const today = new Date();
    return (
      this.currentDate.getMonth() === today.getMonth() &&
      this.currentDate.getFullYear() === today.getFullYear()
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
