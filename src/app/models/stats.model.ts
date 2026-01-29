export interface Stats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  completionRate: number;
}

export interface ChartData {
  date: string;
  displayDate: string;
  tasksCompleted: number;
  totalTasks: number;
  isToday: boolean;
}

export interface ChartSeries {
  name: string;
  series: Array<{ name: string; value: number }>;
}
