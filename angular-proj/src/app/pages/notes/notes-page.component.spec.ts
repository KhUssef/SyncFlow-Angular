import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotesPageComponent } from './notes-page.component';

describe('NotesPageComponent', () => {
  let component: NotesPageComponent;
  let fixture: ComponentFixture<NotesPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotesPageComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(NotesPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with mock data', () => {
    expect(component.noteLines.length).toBeGreaterThan(0);
  });

  it('should handle line focus', () => {
    component.handleLineFocus(1);
    expect(component.selectedLine).toBe(1);
    expect(component.currentLock?.lineNumber).toBe(1);
  });

  it('should handle content change', () => {
    const newContent = 'Updated content';
    component.noteLines = [{
      id: '1',
      lineNumber: 1,
      content: 'Original',
      color: '#000000',
      fontSize: 14,
      highlighted: false
    }];

    component.handleContentChange(1, newContent);
    expect(component.noteLines[0].content).toBe(newContent);
  });

  it('should handle style changes', () => {
    component.selectedLine = 1;
    component.noteLines = [{
      id: '1',
      lineNumber: 1,
      content: 'Test',
      color: '#000000',
      fontSize: 14,
      highlighted: false
    }];

    component.handleStyleChange('fontSize', 24);
    expect(component.noteLines[0].fontSize).toBe(24);
  });

  it('should add new line', () => {
    const initialCount = component.noteLines.length;
    component.addNewLine();
    expect(component.noteLines.length).toBe(initialCount + 1);
  });

  it('should get line lock status correctly', () => {
    component.softLocks.set(1, 'User1');
    const status = component.getLineLockStatus(1);
    expect(status.isLocked).toBe(true);
    expect(status.lockedBy).toBe('User1');
  });

  it('should get selected line data', () => {
    component.selectedLine = 1;
    component.noteLines = [{
      id: '1',
      lineNumber: 1,
      content: 'Test',
      color: '#000000',
      fontSize: 14,
      highlighted: false
    }];

    const lineData = component.getSelectedLineData();
    expect(lineData).toBeTruthy();
    expect(lineData?.lineNumber).toBe(1);
  });

  it('should clear debounce timers on destroy', () => {
    spyOn(window, 'clearTimeout');
    component.ngOnDestroy();
    expect(window.clearTimeout).toBeDefined();
  });
});
