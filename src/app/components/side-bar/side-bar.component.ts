import { Component, OnInit, OnDestroy, Output, EventEmitter, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';

interface User {
  id: string;
  username: string;
  role: 'manager' | 'user';
  company: any;
}

@Component({
  selector: 'app-side-bar',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  templateUrl: './side-bar.component.html',
  styleUrl: './side-bar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SideBarComponent implements OnInit, OnDestroy {
  collapsed = false;
  @Output() collapsedChange = new EventEmitter<boolean>();
  user: User | null = null;
  isManager: boolean = false;
  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.user = this.authService.getCurrentUser();
    this.isManager = this.authService.getIsManager();
  }

  toggleSidebar() {
    this.collapsed = !this.collapsed;
    this.collapsedChange.emit(this.collapsed);
  }

  handleLogout() {
    console.log('Logged out');
    this.authService.logout();
  }

  ngOnDestroy() {
  }
}
