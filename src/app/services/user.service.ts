import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { User, CreateUserInput, UpdateUserInput } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:3000/users';

  private staticUsers: User[] = [
    {
      id: '1',
      username: 'John Doe',
      email: 'john.doe@company.com',
      role: 'MANAGER',
      status: 'Active',
      company: 'ACME Corp',
      deletedAt: undefined
    },
    {
      id: '2',
      username: 'Jane Smith',
      email: 'jane.smith@company.com',
      role: 'USER',
      status: 'Active',
      company: 'ACME Corp',
      deletedAt: undefined
    },
    {
      id: '3',
      username: 'Mike Johnson',
      email: 'mike.johnson@company.com',
      role: 'USER',
      status: 'Active',
      company: 'ACME Corp',
      deletedAt: undefined
    },
    {
      id: '4',
      username: 'Sarah Davis',
      email: 'sarah.davis@company.com',
      role: 'ADMIN',
      status: 'Active',
      company: 'ACME Corp',
      deletedAt: undefined
    },
    {
      id: '5',
      username: 'Tom Wilson',
      email: 'tom.wilson@company.com',
      role: 'USER',
      status: 'Active',
      company: 'ACME Corp',
      deletedAt: undefined
    }
  ];

  private deletedUsers: User[] = [
    {
      id: '6',
      username: 'Robert Brown',
      email: 'robert.brown@company.com',
      role: 'USER',
      status: 'Inactive',
      company: 'ACME Corp',
      deletedAt: '2024-01-15'
    }
  ];

  private usersSubject = new BehaviorSubject<User[]>(this.staticUsers);
  private deletedUsersSubject = new BehaviorSubject<User[]>(this.deletedUsers);

  public users$ = this.usersSubject.asObservable();
  public deletedUsers$ = this.deletedUsersSubject.asObservable();

  constructor() {}

  /**
   * Get all active users
   */
  getActiveUsers(): Observable<User[]> {
    return this.users$;
  }

  /**
   * Fetch usernames/id from backend
   */
  getUsernames(): Observable<Array<{id: number, username: string}>> {
    return this.http.get<Array<{id: number, username: string}>>(`${this.baseUrl}/usernames`);
  }

  /**
   * Get all deleted users
   */
  getDeletedUsers(): Observable<User[]> {
    return this.deletedUsers$;
  }

  /**
   * Get user by ID
   */
  getUserById(id: string): User | undefined {
    return this.staticUsers.find(user => user.id === id) || 
           this.deletedUsers.find(user => user.id === id);
  }

  /**
   * Create a new user
   */
  createUser(input: CreateUserInput): Observable<User> {
    return new Observable(observer => {
      setTimeout(() => {
        const newUser: User = {
          id: (Math.max(...this.staticUsers.map(u => parseInt(u.id)), 0) + 1).toString(),
          username: input.username,
          email: `${input.username.toLowerCase().replace(/\s+/g, '.')}@company.com`,
          role: input.role,
          status: 'Active',
          company: 'ACME Corp',
          deletedAt: undefined
        };

        this.staticUsers.push(newUser);
        this.usersSubject.next([...this.staticUsers]);
        observer.next(newUser);
        observer.complete();
      }, 500);
    });
  }

  /**
   * Update an existing user
   */
  updateUser(id: string, input: UpdateUserInput): Observable<User> {
    return new Observable(observer => {
      setTimeout(() => {
        const userIndex = this.staticUsers.findIndex(user => user.id === id);
        
        if (userIndex === -1) {
          observer.error(new Error('User not found'));
          return;
        }

        const updatedUser: User = {
          ...this.staticUsers[userIndex],
          username: input.username,
          email: `${input.username.toLowerCase().replace(/\s+/g, '.')}@company.com`,
          role: input.role
        };

        this.staticUsers[userIndex] = updatedUser;
        this.usersSubject.next([...this.staticUsers]);
        observer.next(updatedUser);
        observer.complete();
      }, 500);
    });
  }

  /**
   * Delete a user (soft delete)
   */
  deleteUser(id: string): Observable<boolean> {
    return new Observable(observer => {
      setTimeout(() => {
        const userIndex = this.staticUsers.findIndex(user => user.id === id);
        
        if (userIndex === -1) {
          observer.error(new Error('User not found'));
          return;
        }

        const deletedUser: User = {
          ...this.staticUsers[userIndex],
          status: 'Inactive',
          deletedAt: new Date().toISOString().split('T')[0]
        };

        // Move to deleted users
        this.staticUsers.splice(userIndex, 1);
        this.deletedUsers.push(deletedUser);

        this.usersSubject.next([...this.staticUsers]);
        this.deletedUsersSubject.next([...this.deletedUsers]);
        
        observer.next(true);
        observer.complete();
      }, 500);
    });
  }

  /**
   * Recover a deleted user
   */
  recoverUser(id: string): Observable<boolean> {
    return new Observable(observer => {
      setTimeout(() => {
        const userIndex = this.deletedUsers.findIndex(user => user.id === id);
        
        if (userIndex === -1) {
          observer.error(new Error('User not found'));
          return;
        }

        const recoveredUser: User = {
          ...this.deletedUsers[userIndex],
          status: 'Active',
          deletedAt: undefined
        };

        // Move to active users
        this.deletedUsers.splice(userIndex, 1);
        this.staticUsers.push(recoveredUser);

        this.usersSubject.next([...this.staticUsers]);
        this.deletedUsersSubject.next([...this.deletedUsers]);
        
        observer.next(true);
        observer.complete();
      }, 500);
    });
  }

  /**
   * Filter users by search term and role
   */
  filterUsers(users: User[], searchTerm: string, role: string): User[] {
    return users.filter(user => {
      const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = role === '' || user.role === role;
      return matchesSearch && matchesRole;
    });
  }

  /**
   * Get unique roles from users
   */
  getUniqueRoles(users: User[]): string[] {
    return [...new Set(users.map(user => user.role))];
  }
}
