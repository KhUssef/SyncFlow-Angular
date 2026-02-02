// add-task-modal.component.ts
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { User } from '../../../models/user.model';

@Component({
  selector: 'app-add-task-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-task-modal.component.html',
  styleUrls: ['./add-task-modal.component.css']
})
export class AddTaskModalComponent {
  @Input() users: {id:number, username:string}[] = [];
  @Input() loading = false;
  @Output() close = new EventEmitter<void>();
  @Output() taskSubmit = new EventEmitter<any>();

  taskForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.taskForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      dueDate: [''],
      assignedToId: ['']
    });
  }

  onSubmit(): void {
    if (this.taskForm.valid) {
      const formValue = this.taskForm.value;
      const taskData = {
        ...formValue,
        assignedToId: formValue.assignedToId || null
      };
      
      this.taskSubmit.emit(taskData);
      this.taskForm.reset();
    } else {
      alert('Task title is required');
    }
  }

  onClose(): void {
    this.close.emit();
    this.taskForm.reset();
  }

  get uniqueUsers(): {id:number, username:string}[] {
    const seen = new Set();
    return this.users.filter(user => {
      const duplicate = seen.has(user.id);
      seen.add(user.id);
      return !duplicate;
    });
  }
}