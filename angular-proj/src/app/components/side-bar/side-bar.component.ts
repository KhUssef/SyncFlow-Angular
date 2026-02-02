import { Component, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';

interface User {
  id: string;
  username: string;
  role: 'manager' | 'user'
  company: any;
}

@Component({
  selector: 'app-side-bar',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  templateUrl: './side-bar.component.html',
  styleUrls: ['./side-bar.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SideBarComponent {
  collapsed = false;
  @Output() collapsedChange = new EventEmitter<boolean>();
  user = toSignal(this.authService.user$, { initialValue: this.authService.getCurrentUser() });
  isManager = toSignal(this.authService.isManager$, { initialValue: this.authService.getIsManager() });
  constructor(private authService: AuthService) {}

  toggleSidebar() {
    this.collapsed = !this.collapsed;
    this.collapsedChange.emit(this.collapsed);
  }

  handleLogout() {
    console.log('Logged out');
    this.authService.logout();
  }
}
