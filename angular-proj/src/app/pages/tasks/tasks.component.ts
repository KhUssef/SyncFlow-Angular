import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskService } from '../../services/task.service';
import { BehaviorSubject, map, Observable, shareReplay, switchMap } from 'rxjs';
import { Task } from '../../models/task.model';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TasksComponent implements OnInit {
  private taskService = inject(TaskService);
  private reload$ = new BehaviorSubject<void>(undefined);

  today = new Date().toISOString().split('T')[0];
  username = 'John Doe';

  tasks$: Observable<Task[]> = this.reload$.pipe(
    switchMap(() => this.taskService.getPaginatedTasks({ offset: 0, limit: 100 })),
    shareReplay(1)
  );

  completedTasksCount$ = this.tasks$.pipe(
    map((tasks) => tasks.filter((t) => t.completed).length)
  );

  pendingTasksCount$ = this.tasks$.pipe(
    map((tasks) => tasks.filter((t) => !t.completed).length)
  );

  ngOnInit(): void {
    this.reload$.next();
  }

  toggleTaskCompletion(task: Task): void {
    const completed = !task.completed;
    const id = Number(task.id);
    this.taskService.updateTask(id, { completed }).subscribe({
      next: () => this.reload$.next(),
      error: (err) => console.error('Failed to update task', err)
    });
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
}
