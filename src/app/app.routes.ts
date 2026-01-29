import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { UsersPageComponent } from './pages/users/users-page.component';
import { CalendarPageComponent } from './pages/calendar/calendar-page.component';
import { ChatPageComponent } from './pages/chat/chat-page.component';
import { NotesPageComponent } from './pages/notes/notes-page.component';
import { TasksComponent } from './pages/tasks/tasks.component';

export const routes: Routes = [
  { path: 'dashboard', component: DashboardComponent },
  { path: 'users', component: UsersPageComponent },
  { path: 'calendar', component: CalendarPageComponent },
  { path: 'chat', component: ChatPageComponent },
  { path: 'notes', component: NotesPageComponent },
  { path: 'tasks', component: TasksComponent },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' }
];


