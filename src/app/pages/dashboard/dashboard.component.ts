// dashboard.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { AddTaskModalComponent } from './add-task-modal/add-task-modal.component';

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

interface Event {
  id: string;
  title: string;
  description?: string;
  date: string;
  createdBy: {
    id: string;
    username: string;
  };
}

interface User {
  id: string;
  username: string;
  role: string;
  deletedAt?: string;
}

interface Stats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  completionRate: number;
}

interface ChartData {
  date: string;
  displayDate: string;
  tasksCompleted: number;
  totalTasks: number;
  isToday: boolean;
}

interface ChartSeries {
  name: string;
  series: Array<{ name: string; value: number }>;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NgxChartsModule, AddTaskModalComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];
  
  loading = false;
  error: string | null = null;
  
  stats: Stats = {
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    completionRate: 0
  };
  
  chartData: ChartData[] = [];
  todayTasks: Task[] = [];
  todayEvents: Event[] = [];
  users: User[] = [];
  
  isAddTaskModalOpen = false;
  createTaskLoading = false;
  usersLoading = false;
  
  currentDate: Date = new Date();
  lastRefresh: Date = new Date();
  
  user: any;
  token: string | null = null;

  // Chart options for ngx-charts
  chartOptions: any = {
    view: [1000, 300],
    showXAxis: true,
    showYAxis: true,
    gradient: false,
    showLegend: true,
    showXAxisLabel: true,
    xAxisLabel: 'Date',
    showYAxisLabel: true,
    yAxisLabel: 'Tasks',
    timeline: false,
    colorScheme: {
      domain: ['#4CAF50', '#2196F3']
    }
  };

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    
    // Load static data
    this.loadStaticData();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * Load static/mock data
   */
  loadStaticData(): void {
    this.loading = true;

    // Mock users
    this.users = [
      { id: '1', username: 'John Doe', role: 'employee' },
      { id: '2', username: 'Jane Smith', role: 'manager' },
      { id: '3', username: 'Bob Johnson', role: 'employee' }
    ];

    // Mock today's tasks
    const today = new Date().toISOString().split('T')[0];
    this.todayTasks = [
      {
        id: '1',
        title: 'Complete project documentation',
        description: 'Write comprehensive documentation',
        dueDate: today,
        completed: false,
        assignedTo: { id: this.user?.id || '1', username: this.user?.username || 'You' }
      },
      {
        id: '2',
        title: 'Review pull requests',
        description: 'Review code changes',
        dueDate: today,
        completed: true,
        assignedTo: { id: '2', username: 'Jane Smith' }
      },
      {
        id: '3',
        title: 'Update dependencies',
        description: 'Update npm packages',
        dueDate: today,
        completed: false,
        assignedTo: { id: '3', username: 'Bob Johnson' }
      }
    ];

    // Mock today's events
    this.todayEvents = [
      {
        id: '1',
        title: 'Team Standup',
        description: 'Daily standup meeting',
        date: new Date().toISOString(),
        createdBy: { id: '2', username: 'Jane Smith' }
      },
      {
        id: '2',
        title: 'Client Meeting',
        description: 'Quarterly review',
        date: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        createdBy: { id: this.user?.id || '1', username: this.user?.username || 'You' }
      }
    ];

    // Mock all tasks for chart
    const mockTasks: Task[] = [
      ...this.todayTasks,
      {
        id: '4',
        title: 'Design new feature',
        dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        completed: true,
        assignedTo: { id: '1', username: 'John Doe' }
      },
      {
        id: '5',
        title: 'Setup CI/CD pipeline',
        dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        completed: true,
        assignedTo: { id: '2', username: 'Jane Smith' }
      },
      {
        id: '6',
        title: 'Write unit tests',
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        completed: false,
        assignedTo: { id: '3', username: 'Bob Johnson' }
      },
      {
        id: '7',
        title: 'Code review',
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        completed: false,
        assignedTo: { id: '1', username: 'John Doe' }
      }
    ];

    this.processTaskData(mockTasks);
    this.loading = false;
    this.lastRefresh = new Date();
  }

  processTaskData(tasks: Task[]): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const weeklyData: ChartData[] = [...Array(7)].map((_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() + (i - 3));
      const dateStr = date.toISOString().split('T')[0];
      
      const dayTasks = tasks.filter(task => {
        if (!task.dueDate) return false;
        const taskDueDate = new Date(task.dueDate);
        taskDueDate.setHours(0, 0, 0, 0);
        return taskDueDate.toISOString().split('T')[0] === dateStr;
      });
      
      const completedTasks = dayTasks.filter(t => t.completed);
      
      return {
        date: dateStr,
        displayDate: date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        }),
        tasksCompleted: completedTasks.length,
        totalTasks: dayTasks.length,
        isToday: dateStr === today.toISOString().split('T')[0]
      };
    });
    
    this.chartData = weeklyData;
    
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    this.stats = {
      totalTasks: total,
      completedTasks: completed,
      pendingTasks: pending,
      completionRate: rate
    };
  }

  /**
   * Transform chart data for ngx-charts line chart
   */
  getChartSeriesData(): ChartSeries[] {
    return [
      {
        name: 'Tasks Completed',
        series: this.chartData.map(d => ({
          name: d.displayDate,
          value: d.tasksCompleted
        }))
      }
    ];
  }

  openAddTaskModal(): void {
    this.isAddTaskModalOpen = true;
  }

  closeAddTaskModal(): void {
    this.isAddTaskModalOpen = false;
  }

  handleCreateTask(taskData: any): void {
    this.createTaskLoading = true;
    
    // Simulate creating a task
    setTimeout(() => {
      const newTask: Task = {
        id: Date.now().toString(),
        title: taskData.title,
        description: taskData.description,
        dueDate: taskData.dueDate,
        completed: false,
        assignedTo: taskData.assignedToId 
          ? this.users.find(u => u.id === taskData.assignedToId)
          : undefined
      };
      
      this.todayTasks = [newTask, ...this.todayTasks];
      this.createTaskLoading = false;
      this.closeAddTaskModal();
      
      console.log('✅ Task created:', newTask);
    }, 1000);
  }

  isTaskAssignedToMe(task: Task): boolean {
    return task.assignedTo?.id === this.user?.id;
  }

  isEventCreatedByMe(event: Event): boolean {
    return event.createdBy?.id === this.user?.id;
  }

  formatTime(dateString: string): string {
    return new Date(dateString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }
}