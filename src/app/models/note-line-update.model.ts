export interface UpdateNoteLineDto {
  lineNumber: number;
  content?: string;
  noteId?: number;
  updatedAt?: Date;
  color?: string;
  fontSize?: number;
  highlighted?: boolean;
  lastupdatedBy?: string;
}
