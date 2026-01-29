import { Component, OnInit, OnDestroy, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'manager' | 'employee';
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
  
  user: User | null = {
    id: '1',
    username: 'John Doe',
    email: 'john@example.com',
    role: 'manager',
    company: { id: '1', code: 'ACME' }
  };
  isManager = true;

  ngOnInit() {
    // Static data - no subscriptions needed
  }

  toggleSidebar() {
    this.collapsed = !this.collapsed;
    this.collapsedChange.emit(this.collapsed);
  }

  handleLogout() {
    console.log('Logged out');
    // Static logout - just reset user
    this.user = null;
    this.isManager = false;
  }

  ngOnDestroy() {
    // No cleanup needed
  }
}
