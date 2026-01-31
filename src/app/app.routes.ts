import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { UsersPageComponent } from './pages/users/users-page.component';
import { CalendarPageComponent } from './pages/calendar/calendar-page.component';
import { ChatPageComponent } from './pages/chat/chat-page.component';
import { NotesPageComponent } from './pages/notes/notes-page.component';
import { TasksComponent } from './pages/tasks/tasks.component';
import { LoginComponent } from './pages/login/login.component';
import { ROUTE_NAMES } from './routes.config';
import { AuthGuard } from './guards/auth.guard';
import { SignupComponent } from './pages/signup/signup.component';

export const routes: Routes = [
  { path: ROUTE_NAMES.LOGIN, component: LoginComponent, canActivate: [AuthGuard] },
  { path: ROUTE_NAMES.SIGNUP, component: SignupComponent },
  {
    path: '',
    canActivateChild: [AuthGuard],
    children: [
      { path: ROUTE_NAMES.DASHBOARD, component: DashboardComponent },
      { path: ROUTE_NAMES.USERS, component: UsersPageComponent },
      { path: ROUTE_NAMES.CALENDAR, component: CalendarPageComponent },
      { path: ROUTE_NAMES.CHAT, component: ChatPageComponent },
      { path: ROUTE_NAMES.NOTES, component: NotesPageComponent },
      { path: ROUTE_NAMES.TASKS, component: TasksComponent },
    ]
  },
  { path: '', redirectTo: '/' + ROUTE_NAMES.DASHBOARD, pathMatch: 'full' }
];


