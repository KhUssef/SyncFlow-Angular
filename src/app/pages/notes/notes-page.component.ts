import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';


interface NoteLine {
  id: string;
  lineNumber: number;
  content: string;
  color: string;
  fontSize: number;
  highlighted: boolean;
  lastEditedBy?: string;
}

interface SoftLock {
  lineNumber: number;
  username: string;
}

@Component({
  selector: 'app-notes-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notes-page.component.html',
  styleUrls: ['./notes-page.component.css']
})
export class NotesPageComponent implements OnInit, OnDestroy {
  noteLines: NoteLine[] = [];
  softLocks = new Map<number, string>();
  currentLock: { noteNumber: number; lineNumber: number } | null = null;
  selectedLine: number | null = null;
  isConnected = true;
  error = '';
  
  @ViewChild('styleMenuRef') styleMenuRef!: ElementRef;
  
  private textareaRefs: { [key: number]: HTMLTextAreaElement } = {};
  private pendingSaves: { [key: number]: Promise<void> } = {};
  private debounceTimers: { [key: number]: any } = {};

  ngOnInit() {
    this.initializeMockData();
  }

  ngOnDestroy() {
    this.clearAllDebounceTimers();
  }

  private initializeMockData() {
    this.noteLines = [
      {
        id: '1',
        lineNumber: 1,
        content: 'Welcome to the Collaborative Notes',
        color: '#000000',
        fontSize: 16,
        highlighted: false,
        lastEditedBy: 'You'
      },
      {
        id: '2',
        lineNumber: 2,
        content: 'This is a static demo of collaborative note-taking',
        color: '#333333',
        fontSize: 14,
        highlighted: false,
        lastEditedBy: 'You'
      },
      {
        id: '3',
        lineNumber: 3,
        content: '',
        color: '#000000',
        fontSize: 14,
        highlighted: false,
        lastEditedBy: 'You'
      },
      {
        id: '4',
        lineNumber: 4,
        content: 'Click on any line to start editing',
        color: '#666666',
        fontSize: 13,
        highlighted: true,
        lastEditedBy: 'You'
      },
      {
        id: '5',
        lineNumber: 5,
        content: 'Use the style menu to customize text',
        color: '#000000',
        fontSize: 14,
        highlighted: false,
        lastEditedBy: 'You'
      }
    ];
  }

  getSelectedLineData(): NoteLine | null {
    if (!this.selectedLine) return null;
    return this.noteLines.find(line => line.lineNumber === this.selectedLine) || null;
  }

  handleLineFocus(lineNumber: number) {
    if (this.currentLock && this.currentLock.lineNumber === lineNumber) return;

    this.selectedLine = lineNumber;

    // Simulate soft lock
    this.softLocks.set(lineNumber, 'You');
    this.currentLock = { noteNumber: 1, lineNumber };

    // Focus textarea
    const textarea = this.textareaRefs[lineNumber];
    if (textarea) {
      setTimeout(() => textarea.focus(), 0);
    }
  }

  handleContentChange(lineNumber: number, newContent: string) {
    this.noteLines = this.noteLines.map(line =>
      line.lineNumber === lineNumber
        ? { ...line, content: newContent }
        : line
    );

    this.debouncedSave(lineNumber);
  }

  private debouncedSave(lineNumber: number) {
    if (this.debounceTimers[lineNumber]) {
      clearTimeout(this.debounceTimers[lineNumber]);
    }

    this.debounceTimers[lineNumber] = setTimeout(() => {
      // Simulate save
      const line = this.noteLines.find(l => l.lineNumber === lineNumber);
      if (line) {
        line.lastEditedBy = 'You';
      }
      delete this.debounceTimers[lineNumber];
    }, 500);
  }

  handleStyleChange(styleProperty: string, value: any) {
    if (!this.selectedLine) return;

    this.noteLines = this.noteLines.map(line =>
      line.lineNumber === this.selectedLine
        ? { ...line, [styleProperty]: value }
        : line
    );
  }

  getLineLockStatus(lineNumber: number) {
    const lockedBy = this.softLocks.get(lineNumber);
    return {
      isLocked: !!lockedBy,
      lockedBy: lockedBy,
      isLockedByMe: lockedBy === 'You',
      canEdit: !lockedBy || lockedBy === 'You'
    };
  }

  handleClickOutside(event: MouseEvent) {
    if (!this.currentLock) return;

    const isStyleMenuClick = this.styleMenuRef?.nativeElement?.contains(event.target);
    const isTextareaClick = Object.values(this.textareaRefs).some(
      ref => ref && ref.contains(event.target as Node)
    );

    if (!isStyleMenuClick && !isTextareaClick) {
      this.softLocks.delete(this.currentLock.lineNumber);
      this.currentLock = null;
      this.selectedLine = null;
    }
  }

  registerTextareaRef(lineNumber: number, ref: HTMLTextAreaElement) {
    this.textareaRefs[lineNumber] = ref;
  }

  private clearAllDebounceTimers() {
    Object.values(this.debounceTimers).forEach(timer => clearTimeout(timer));
    this.debounceTimers = {};
  }

  addNewLine() {
    const nextLineNumber = Math.max(...this.noteLines.map(l => l.lineNumber), 0) + 1;
    const newLine: NoteLine = {
      id: `${nextLineNumber}`,
      lineNumber: nextLineNumber,
      content: '',
      color: '#000000',
      fontSize: 14,
      highlighted: false,
      lastEditedBy: 'You'
    };
    this.noteLines.push(newLine);
  }

  deleteLine(lineNumber: number) {
    this.noteLines = this.noteLines.filter(line => line.lineNumber !== lineNumber);
  }
}
