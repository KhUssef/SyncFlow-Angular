import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { User, CreateUserInput, UpdateUserInput } from '../../models/user.model';
import { UserService } from '../../services/user.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-users-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule],
  templateUrl: './users-page.component.html',
  styleUrl: './users-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsersPageComponent implements OnInit, OnDestroy {
  users: User[] = [];
  deletedUsers: User[] = [];
  filteredUsers: User[] = [];
  
  searchTerm = '';
  selectedRole = '';
  showDeleted = false;
  
  isManager = true; // Static - set to true for demo
  
  // Modal states
  showAddUserModal = false;
  showEditUserModal = false;
  editingUser: User | null = null;
  
  // Form states
  newUserData: CreateUserInput = {
    username: '',
    password: '',
    role: 'USER'
  };
  
  editUserData: UpdateUserInput = {
    username: '',
    password: '',
    role: 'USER'
  };
  
  isCreatingUser = false;
  isUpdatingUser = false;
  
  private destroy$ = new Subject<void>();
  roles: string[] = [];

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.userService.getActiveUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe(users => {
        this.users = users;
        this.roles = this.userService.getUniqueRoles(users);
        this.applyFilters();
      });

    this.userService.getDeletedUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe(users => {
        this.deletedUsers = users;
        this.applyFilters();
      });
  }

  applyFilters(): void {
    const dataToFilter = this.showDeleted ? this.deletedUsers : this.users;
    this.filteredUsers = this.userService.filterUsers(
      dataToFilter,
      this.searchTerm,
      this.selectedRole
    );
  }

  onSearchChange(value: string): void {
    this.searchTerm = value;
    this.applyFilters();
  }

  onRoleChange(role: string): void {
    this.selectedRole = role;
    this.applyFilters();
  }

  onShowDeletedChange(checked: boolean): void {
    this.showDeleted = checked;
    this.selectedRole = '';
    this.searchTerm = '';
    this.applyFilters();
  }

  openAddUserModal(): void {
    this.showAddUserModal = true;
    this.newUserData = {
      username: '',
      password: '',
      role: 'USER'
    };
  }

  closeAddUserModal(): void {
    this.showAddUserModal = false;
  }

  openEditUserModal(user: User): void {
    this.editingUser = user;
    this.editUserData = {
      username: user.username,
      password: '',
      role: user.role
    };
    this.showEditUserModal = true;
  }

  closeEditUserModal(): void {
    this.showEditUserModal = false;
    this.editingUser = null;
  }

  onNewUserInputChange(field: keyof CreateUserInput, value: string): void {
    this.newUserData[field] = value as any;
  }

  onEditUserInputChange(field: keyof UpdateUserInput, value: string): void {
    this.editUserData[field] = value as any;
  }

  handleAddUser(): void {
    if (!this.newUserData.username || !this.newUserData.password) {
      alert('Please fill in all fields');
      return;
    }

    this.isCreatingUser = true;

    this.userService.createUser(this.newUserData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          alert('User created successfully!');
          this.closeAddUserModal();
          this.isCreatingUser = false;
        },
        error: (err) => {
          alert('Error creating user: ' + err.message);
          this.isCreatingUser = false;
        }
      });
  }

  handleUpdateUser(): void {
    if (!this.editingUser || !this.editUserData.username) {
      alert('Please fill in all fields');
      return;
    }

    this.isUpdatingUser = true;

    this.userService.updateUser(this.editingUser.id, this.editUserData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          alert('User updated successfully!');
          this.closeEditUserModal();
          this.isUpdatingUser = false;
        },
        error: (err) => {
          alert('Error updating user: ' + err.message);
          this.isUpdatingUser = false;
        }
      });
  }

  handleDeleteUser(user: User): void {
    if (!confirm(`Are you sure you want to delete ${user.username}?`)) {
      return;
    }

    this.userService.deleteUser(user.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          alert('User deleted successfully');
        },
        error: (err) => {
          alert('Error deleting user: ' + err.message);
        }
      });
  }

  handleRecoverUser(user: User): void {
    this.userService.recoverUser(user.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          alert('User recovered successfully');
        },
        error: (err) => {
          alert('Error recovering user: ' + err.message);
        }
      });
  }

  canEditOrDelete(user: User): boolean {
    // Prevent editing/deleting yourself in a real app
    // For static demo, always allow
    return true;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
