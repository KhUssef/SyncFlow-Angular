import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, Home, Users } from 'lucide-angular';

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
  imports: [CommonModule, RouterLink, LucideAngularModule],
  templateUrl: './side-bar.component.html',
  styleUrl: './side-bar.component.css'
})
export class SideBarComponent implements OnInit, OnDestroy {
  collapsed = false;
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
