import { Component, OnInit, OnDestroy, ViewChild, ElementRef, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NoteService, NoteInfo, NoteLine as ApiNoteLine } from '../../services/note.service';
import { Socket } from 'socket.io-client';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../services/auth.service';
import { UpdateNoteLineDto } from '../../models/note-line-update.model';

interface NoteLine extends ApiNoteLine {
  color?: string;
  fontSize?: number;
  highlighted?: boolean;
  lastEditedBy?: string;
}

@Component({
  selector: 'app-notes-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notes-page.component.html',
  styleUrls: ['./notes-page.component.css']
})
export class NotesPageComponent implements OnInit, OnDestroy {
  readonly notes = signal<NoteInfo[]>([]);
  readonly noteLines = signal<NoteLine[]>([]);
  readonly selectedNoteId = signal<number | null>(null);
  readonly selectedLine = signal<number | null>(null);
  readonly isConnected = signal(false);
  readonly error = signal('');
  readonly notesLoading = signal(false);
  readonly linesLoading = signal(false);
  readonly creatingNote = signal(false);
  readonly softLocks = signal<Map<number, string>>(new Map());
  private authService = inject(AuthService);
  user = toSignal(this.authService.user$, { initialValue: this.authService.getCurrentUser() });
  newNoteTitle = signal('');

  readonly notes$ = toObservable(this.notes);
  readonly noteLines$ = toObservable(this.noteLines);
  readonly selectedNoteTitle = computed(() => {
    const id = this.selectedNoteId();
    return this.notes().find((n) => n.id === id)?.title ?? 'No note selected';
  });
  
  @ViewChild('styleMenuRef') styleMenuRef!: ElementRef;
  
  private textareaRefs: { [key: number]: HTMLTextAreaElement } = {};
  private saveTimers: { [key: number]: any } = {};
  private emitTimers: { [key: number]: any } = {};
  private currentLock: { noteNumber: number; lineNumber: number } | null = null;
  private socket: Socket | null = null;

  constructor(private readonly noteService: NoteService) {}

  ngOnInit() {
    this.loadNotes();
  }

  ngOnDestroy() {
    this.clearAllDebounceTimers();
    this.disconnectSocket();
  }

  private loadNotes() {
    this.notesLoading.set(true);
    this.error.set('');
    this.noteService.getNotesInfo({ start: 0, limit: 50 }).subscribe({
      next: (notes) => {
        this.notes.set(notes || []);
        this.notesLoading.set(false);
        if (!this.selectedNoteId() && this.notes().length) {
          this.selectNote(this.notes()[0].id);
        }
      },
      error: () => {
        this.error.set('Failed to load notes.');
        this.notesLoading.set(false);
      }
    });
  }

  selectNote(noteId: number) {
    if (this.selectedNoteId() === noteId) return;
    this.selectedNoteId.set(noteId);
    this.selectedLine.set(null);
    this.noteLines.set([]);
    this.connectSocket(noteId);
    this.loadLines(noteId);
  }

  private loadLines(noteId: number) {
    this.linesLoading.set(true);
    this.error.set('');
    this.noteService.getNoteLines(noteId).subscribe({
      next: (lines) => {
        const normalized = (lines || []).map((line) => ({
          ...line,
          fontSize: (line as any).fontSize ?? 14,
          color: (line as any).color ?? '#000000',
          highlighted: (line as any).highlighted ?? false,
          content: line.content ?? ''
        }));

        this.noteLines.set(normalized);
        if (!normalized.length) {
          this.createDefaultLines(noteId);
        }
        this.linesLoading.set(false);
      },
      error: () => {
        this.error.set('Failed to load note lines.');
        this.linesLoading.set(false);
      }
    });
  }

  private createDefaultLines(noteId: number) {
    this.noteService.createLines(noteId).subscribe({
      next: (created) => {
        this.noteLines.set((created || []).map((line) => ({
          ...line,
          fontSize: (line as any).fontSize ?? 14,
          color: (line as any).color ?? '#000000',
          highlighted: (line as any).highlighted ?? false,
          content: line.content ?? ''
        })));
      },
      error: () => {
        this.error.set('Failed to seed note lines.');
      }
    });
  }

  createNote() {
    const title = this.newNoteTitle().trim();
    if (!title) return;

    this.creatingNote.set(true);
    this.error.set('');
    this.noteService.createNote({ title }).subscribe({
      next: (note) => {
        this.notes.set([note, ...this.notes()]);
        this.newNoteTitle.set('');
        this.creatingNote.set(false);
        this.selectNote(note.id);
      },
      error: () => {
        this.creatingNote.set(false);
        this.error.set('Failed to create note.');
      }
    });
  }

  private connectSocket(noteId: number) {
    this.disconnectSocket();
    const token = localStorage.getItem('accessToken');
    if (!token) {
      this.isConnected.set(false);
      return;
    }

    try {
      this.socket = this.noteService.connectWhiteboard({ noteId, token });
      this.socket.onAny((event, ...args) => {
        console.log(`Whiteboard Socket event: ${event}`, args);
      });
      this.socket.on('connect', () => this.isConnected.set(true));
      this.socket.on('disconnect', () => this.isConnected.set(false));
      this.socket.on('connect_error', () => this.isConnected.set(false));
      this.socket.on('softlock', (data: { username: string; noteId: number, lineNumber : number }) => {
        if(noteId !== this.selectedNoteId()) return;
        if(data.username === this.user()?.username) return;
        this.softLocks.update((locks) => {
          const next = new Map(locks);
          next.set(data.lineNumber, data.username);
          return next;
        });
      });
      this.socket.on('softunlock', (data: { noteId: number, lineNumber : number }) => {
        if(noteId !== this.selectedNoteId()) return;
        this.softLocks.update((locks) => {
          if (!locks.has(data.lineNumber)) return locks;
          const next = new Map(locks);
          next.delete(data.lineNumber);
          return next;
        });
      });
      this.socket.on('noteUpdated', (data: UpdateNoteLineDto) => {
        if (data.lastupdatedBy && data.lastupdatedBy === this.user()?.username) return;
        console.log('Received alterNote event with data', data);
        this.noteLines.update((lines) => {
          console.log('Received alterNote for line', data.lineNumber, 'with data', data);
          return lines.map((line) => {
            if (line.lineNumber !== data.lineNumber) return line;
            return {
              ...line,
              content: data.content ?? line.content,
              color: data.color ?? line.color,
              fontSize: data.fontSize ?? line.fontSize,
              highlighted: data.highlighted ?? line.highlighted,
              lastEditedBy: data.lastupdatedBy ?? line.lastEditedBy
            };
          });
        });
      });
    } catch (err) {
      console.error('Failed to connect whiteboard socket', err);
      this.isConnected.set(false);
    }
  }

  private disconnectSocket() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSelectedLineData(): NoteLine | null {
    const selected = this.selectedLine();
    if (!selected) return null;
    return this.noteLines().find(line => line.lineNumber === selected) || null;
  }

  handleLineFocus(lineNumber: number) {
    console.log(`Focusing line ${lineNumber}`);
    
    if (this.currentLock && this.currentLock.lineNumber === lineNumber) return;
    console.log(`Requesting lock for line ${lineNumber}`);
    this.selectedLine.set(lineNumber);
    // this.refreshLinesIfTail(lineNumber);
    this.socket?.emit('softlock', { lineNumber }, (response: { success: boolean; lockedBy?: string }) => {
      if (response.success) {
        this.currentLock = { noteNumber: this.selectedNoteId()!, lineNumber };
        console.log(`Acquired lock for line ${lineNumber}`);
        this.softLocks.update((locks) => {
          const next = new Map(locks);
          next.set(lineNumber, 'You');
          return next;
        });
      } else if (response.lockedBy) {
        console.log(`Line ${lineNumber} is locked by ${response.lockedBy}`);
        this.softLocks.update((locks) => {
          const next = new Map(locks);
          if(response.lockedBy){
          next.set(lineNumber, response.lockedBy);}
          return next;
        });
      }
    });

    // Focus textarea
    const textarea = this.textareaRefs[lineNumber];
    if (textarea) {
      setTimeout(() => textarea.focus(), 0);
    }
  }

  handleContentChange(lineNumber: number, newContent: string) {
    this.noteLines.update((lines) => lines.map((line) =>
      line.lineNumber === lineNumber
        ? { ...line, content: newContent }
        : line
    ));

    this.debouncedSave(lineNumber);
    this.scheduleAlterNote(lineNumber);
  }

  private debouncedSave(lineNumber: number) {
    if (this.saveTimers[lineNumber]) {
      clearTimeout(this.saveTimers[lineNumber]);
    }

    this.saveTimers[lineNumber] = setTimeout(() => {
      const line = this.noteLines().find(l => l.lineNumber === lineNumber);
      if (line) {
        line.lastEditedBy = 'You';
      }
      delete this.saveTimers[lineNumber];
    }, 500);
  }

  handleStyleChange(styleProperty: string, value: any) {
    const selected = this.selectedLine();
    if (!selected) return;

    const normalizedValue = styleProperty === 'fontSize'
      ? Number(value) || 14
      : value;

    this.noteLines.update((lines) => lines.map((line) =>
      line.lineNumber === selected
        ? { ...line, [styleProperty]: normalizedValue }
        : line
    ));

    this.scheduleAlterNote(selected);
  }

  private emitAlterNote(lineNumber: number) {
    const noteId = this.selectedNoteId();
    if (!this.socket || !noteId) return;

    const line = this.noteLines().find((l) => l.lineNumber === lineNumber);
    if (!line) return;

    const payload: UpdateNoteLineDto = {
      lineNumber,
      noteId,
      content: line.content,
      color: line.color,
      fontSize: line.fontSize,
      highlighted: line.highlighted,
      lastupdatedBy: this.user()?.username,
      updatedAt: new Date()
    };

    this.socket.emit('alterNote', payload);
  }

  private refreshLinesIfTail(lineNumber: number) {
    const noteId = this.selectedNoteId();
    if (!noteId) return;
    const lines = this.noteLines();
    if (!lines.length) return;
    const maxLine = Math.max(...lines.map((l) => l.lineNumber));
    const isInLastTen = lineNumber >= maxLine - 3;
    
    if (isInLastTen && !this.linesLoading()) {
      this.socket?.emit('softlock', { lineNumber });
      this.loadLines(noteId);
    }
  }

  private scheduleAlterNote(lineNumber: number) {
    if (this.emitTimers[lineNumber]) {
      clearTimeout(this.emitTimers[lineNumber]);
    }

    this.emitTimers[lineNumber] = setTimeout(() => {
      this.emitAlterNote(lineNumber);
      delete this.emitTimers[lineNumber];
    }, 350);
  }

  getLineLockStatus(lineNumber: number) {
    const lockedBy = this.softLocks().get(lineNumber);
    return {
      isLocked: !!lockedBy,
      lockedBy: lockedBy,
      isLockedByMe: lockedBy === 'You',
      canEdit: !lockedBy || lockedBy === 'You'
    };
  }

  handleClickOutside(event: MouseEvent) {
    const isStyleMenuClick = this.styleMenuRef?.nativeElement?.contains(event.target);
    const isTextareaClick = Object.values(this.textareaRefs).some(
      ref => ref && ref.contains(event.target as Node)
    );

    if (!isStyleMenuClick && !isTextareaClick) {
      const lock = this.currentLock;
      this.currentLock = null;
      this.selectedLine.set(null);
      if (lock) {
        this.softLocks.update((locks) => {
          const next = new Map(locks);
          next.delete(lock.lineNumber);
          return next;
        });
      }
    }
  }

  registerTextareaRef(lineNumber: number, ref: HTMLTextAreaElement) {
    this.textareaRefs[lineNumber] = ref;
  }

  private clearAllDebounceTimers() {
    Object.values(this.saveTimers).forEach(timer => clearTimeout(timer));
    this.saveTimers = {};
    Object.values(this.emitTimers).forEach(timer => clearTimeout(timer));
    this.emitTimers = {};
  }

  addNewLine() {
    const nextLineNumber = Math.max(...this.noteLines().map(l => l.lineNumber), 0) + 1;
    const newLine: NoteLine = {
      id: +`${nextLineNumber}`,
      lineNumber: nextLineNumber,
      content: '',
      color: '#000000',
      fontSize: 14,
      highlighted: false,
      lastEditedBy: 'You'
    };
    this.noteLines.update((lines) => [...lines, newLine]);
  }

  deleteLine(lineNumber: number) {
    this.noteLines.update((lines) => lines.filter(line => line.lineNumber !== lineNumber));
  }

  trackByLineNumber(_index: number, line: NoteLine) {
    return line.lineNumber;
  }
}
