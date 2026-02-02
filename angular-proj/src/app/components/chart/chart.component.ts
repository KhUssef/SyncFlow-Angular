import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { NgApexchartsModule, ApexAxisChartSeries, ApexChart, ApexStroke, ApexDataLabels, ApexTooltip, ApexLegend, ApexXAxis, ApexFill, ApexGrid, ApexMarkers, ApexYAxis } from 'ng-apexcharts';
import { ChartData } from '../../models/stats.model';
@Component({
  selector: 'app-chart',
  standalone: true,
  imports: [NgApexchartsModule],
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChartComponent implements OnChanges {
  @Input() chartData: ChartData[] = [];

  series: ApexAxisChartSeries = [];
  chart: ApexChart = { type: 'line', height: 320, toolbar: { show: false }, animations: { enabled: true, easing: 'easeinout', speed: 500 } };
  stroke: ApexStroke = { curve: 'smooth', width: 3 }; // soften line
  dataLabels: ApexDataLabels = { enabled: false };
  tooltip: ApexTooltip = { theme: 'dark', x: { show: true } };
  legend: ApexLegend = { show: false };
  xaxis: ApexXAxis = { categories: [], labels: { rotateAlways: false }, axisBorder: { show: false }, axisTicks: { show: false } };
  yaxis: ApexYAxis = { labels: { formatter: (val) => `${Math.round(val)}` } };
  grid: ApexGrid = { strokeDashArray: 4, borderColor: '#ececec' };
  markers: ApexMarkers = { size: 5, strokeWidth: 2, strokeColors: '#fff' };
  fill: ApexFill = { type: 'gradient', gradient: { shadeIntensity: 0.7, opacityFrom: 0.85, opacityTo: 0.35, stops: [0, 90, 100] } };
  colors = ['#2563EB'];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['chartData']) {
      this.series = [
        {
          name: 'Tasks Completed',
          data: this.chartData.map((d) => ({ x: d.displayDate, y: d.tasksCompleted }))
        }
      ];
      this.xaxis = {
        ...this.xaxis,
        categories: this.chartData.map((d) => d.displayDate)
      };
    }
  }
}
