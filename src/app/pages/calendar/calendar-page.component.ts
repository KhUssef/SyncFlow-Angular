import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Event, CreateEventInput } from '../../models/event.model';
import { EventService } from '../../services/event.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-calendar-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatIconModule, MatButtonModule],
  templateUrl: './calendar-page.component.html',
  styleUrl: './calendar-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CalendarPageComponent implements OnInit, OnDestroy {
  events = signal<Event[]>([]);
  currentDate = signal(new Date());
  currentMonth = signal('');
  currentYear = signal(0);
  
  // Calendar grid
  calendarDays: (number | null)[] = [];
  weekDays: string[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Modal states
  showEventModal = signal(false);
  showEventDetails = signal(false);
  selectedEvent = signal<Event | null>(null);

  // Form data (reactive form)
  eventForm: FormGroup;

  isCreatingEvent = signal(false);
  
  upcomingEvents = signal<Event[]>([]);
  currentMonthEvents = signal<Event[]>([]);
  
  private destroy$ = new Subject<void>();

  constructor(private eventService: EventService, private fb: FormBuilder) {
    this.eventForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      date: [new Date().toISOString().slice(0, 16), Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadEvents();
    this.generateCalendar();
  }

  loadEvents(): void {
    this.eventService.getAllEvents()
      .pipe(takeUntil(this.destroy$))
      .subscribe(events => {
        console.log('Loaded events:', events);
        this.events.set(events);
        this.upcomingEvents.set(this.eventService.getUpcomingEvents(events));
        this.loadMonthEvents();
      });
  }

  loadMonthEvents(): void {
    this.eventService.getEventsByMonth(this.currentDate())
      .pipe(takeUntil(this.destroy$))
      .subscribe(events => {
        this.currentMonthEvents.set(events.sort((a, b) => {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        }));
      });
  }

  generateCalendar(): void {
    const activeDate = this.currentDate();
    const year = activeDate.getFullYear();
    const month = activeDate.getMonth();

    this.currentYear.set(year);
    this.currentMonth.set(activeDate.toLocaleString('default', { month: 'long' }));
    
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
    const current = this.currentDate();
    this.currentDate.set(new Date(current.getFullYear(), current.getMonth() - 1));
    this.generateCalendar();
    this.loadMonthEvents();
  }

  nextMonth(): void {
    const current = this.currentDate();
    this.currentDate.set(new Date(current.getFullYear(), current.getMonth() + 1));
    this.generateCalendar();
    this.loadMonthEvents();
  }

  today(): void {
    this.currentDate.set(new Date());
    this.generateCalendar();
    this.loadMonthEvents();
  }

  getEventsForDay(day: number | null): Event[] {
    if (!day) return [];
    
    const dateStr = new Date(this.currentYear(), this.currentDate().getMonth(), day)
      .toDateString();
    
    return this.events().filter(event => {
      return new Date(event.date).toDateString() === dateStr;
    });
  }

  selectDay(day: number | null): void {
    if (day) {
      const selectedDate = new Date(this.currentYear(), this.currentDate().getMonth(), day);
    }
  }

  openAddEventModal(): void {
    const now = new Date();
    this.eventForm.reset({
      title: '',
      description: '',
      date: now.toISOString().slice(0, 16)
    });
    this.showEventModal.set(true);
  }

  closeAddEventModal(): void {
    this.showEventModal.set(false);
  }

  openEventDetails(event: Event): void {
    this.selectedEvent.set(event);
    this.showEventDetails.set(true);
  }

  closeEventDetails(): void {
    this.showEventDetails.set(false);
    this.selectedEvent.set(null);
  }

  // No longer needed: onEventInputChange

  handleCreateEvent(): void {
    if (this.eventForm.invalid) {
      this.eventForm.markAllAsTouched();
      alert('Please fill in all required fields');
      return;
    }
    this.isCreatingEvent.set(true);
    const formValue = this.eventForm.value;
    this.eventService.createEvent(formValue)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          alert('Event created successfully!');
          this.closeAddEventModal();
          this.isCreatingEvent.set(false);
          this.loadEvents();
        },
        error: (err) => {
          alert('Error creating event: ' + err.message);
          this.isCreatingEvent.set(false);
        }
      });
  }

  handleDeleteEvent(event: Event | null): void {
    if (!event) return;
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
    const activeDate = this.currentDate();
    return (
      day === today.getDate() &&
      activeDate.getMonth() === today.getMonth() &&
      activeDate.getFullYear() === today.getFullYear()
    );
  }

  isCurrentMonth(): boolean {
    const today = new Date();
    const activeDate = this.currentDate();
    return (
      activeDate.getMonth() === today.getMonth() &&
      activeDate.getFullYear() === today.getFullYear()
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
