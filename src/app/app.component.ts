import { Component, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SideBarComponent } from './components/side-bar/side-bar.component';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SideBarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit {
  title = 'my-angular-app';
  isSidebarCollapsed = false;
  isauthenticated = this.authService.isAuthenticatedSignal();
  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.authService.checkauthstatus();
    this.isauthenticated = this.authService.isAuthenticatedSignal();
  }

  onSidebarCollapsed(collapsed: boolean) {
    this.isSidebarCollapsed = collapsed;
  }
}
