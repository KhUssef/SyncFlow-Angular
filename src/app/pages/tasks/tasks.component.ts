import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

interface TaskDetails extends Task {
  company?: {
    id: string;
    name: string;
  };
}

interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  completed: boolean;
  assignedTo?: {
    id: string;
    username: string;
  };
}

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tasks.component.html',
  styleUrl: './tasks.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TasksComponent implements OnInit {
  tasks: TaskDetails[] = [];
  currentDate: Date = new Date();
  username: string = 'John Doe';

  ngOnInit(): void {
    this.loadMockTasks();
  }

  /**
   * Load mock tasks data
   */
  private loadMockTasks(): void {
    this.tasks = [
      {
        id: '1',
        title: 'Complete project documentation',
        description: 'Write comprehensive documentation for the new API endpoints',
        dueDate: '2026-02-15',
        completed: false,
        assignedTo: {
          id: '1',
          username: 'John Doe'
        },
        company: {
          id: '1',
          name: 'Acme Corp'
        }
      },
      {
        id: '2',
        title: 'Review pull requests',
        description: 'Review and approve pending PRs from the team',
        dueDate: '2026-02-05',
        completed: false,
        assignedTo: {
          id: '1',
          username: 'John Doe'
        },
        company: {
          id: '1',
          name: 'Acme Corp'
        }
      },
      {
        id: '3',
        title: 'Fix bug in authentication module',
        description: 'Debug and fix the JWT refresh token issue',
        dueDate: '2026-01-28',
        completed: true,
        assignedTo: {
          id: '1',
          username: 'John Doe'
        },
        company: {
          id: '1',
          name: 'Acme Corp'
        }
      },
      {
        id: '4',
        title: 'Update dependencies',
        description: 'Update all npm packages to latest versions',
        dueDate: '2026-02-10',
        completed: false,
        assignedTo: {
          id: '1',
          username: 'John Doe'
        },
        company: {
          id: '1',
          name: 'Acme Corp'
        }
      },
      {
        id: '5',
        title: 'Deploy to production',
        description: 'Deploy the latest build to production environment',
        dueDate: '2026-02-01',
        completed: false,
        assignedTo: {
          id: '1',
          username: 'John Doe'
        },
        company: {
          id: '1',
          name: 'Acme Corp'
        }
      }
    ];
  }

  /**
   * Toggle task completion status
   */
  toggleTaskCompletion(taskId: string): void {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      task.completed = !task.completed;
    }
  }

  /**
   * Format date to readable string
   */
  formatDate(dateString?: string): string {
    if (!dateString) return 'No due date';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  }

  /**
   * Get status of task (Completed, Pending, or Missed)
   */
  getTaskStatus(task: Task): string {
    if (task.completed) return 'Completed';
    
    const dueDate = new Date(task.dueDate || '');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);

    return dueDate < today ? 'Missed' : 'Pending';
  }

  /**
   * Get CSS class for task item based on status
   */
  getTaskItemClass(task: Task): string {
    if (task.completed) return 'taskCompleted';
    
    const dueDate = new Date(task.dueDate || '');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);

    return dueDate < today ? 'taskMissed' : 'taskPending';
  }

  /**
   * Get CSS class for status badge
   */
  getStatusBadgeClass(task: Task): string {
    const status = this.getTaskStatus(task);
    
    if (status === 'Completed') return 'statusCompleted';
    if (status === 'Missed') return 'statusMissed';
    return 'statusPending';
  }

  /**
   * Get completed tasks count
   */
  get completedTasksCount(): number {
    return this.tasks.filter(task => task.completed).length;
  }

  /**
   * Get pending tasks count
   */
  get pendingTasksCount(): number {
    return this.tasks.filter(task => !task.completed).length;
  }
}
